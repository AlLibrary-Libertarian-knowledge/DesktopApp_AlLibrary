# 🧠 Funcionamento Interno do Tracker Server (AlLibrary)

Este documento detalha o funcionamento de baixo nível do **Tracker Server** (AlLibrary Tracker), explicando sua arquitetura interna em Rust, o gerenciamento de conexões assíncronas em memória e as especificações de cada rota HTTP e canal WebSocket.

---

## 🏛️ 1. Arquitetura de Software e Tecnologias

O Tracker é um servidor web headless de alto desempenho e baixa latência construído sobre a stack assíncrona moderna do ecossistema Rust:

*   **Axum (v0.7)**: Framework web baseado em serviços (utilizando a biblioteca `tower`), otimizado para lidar com requisições HTTP e handshakes de WebSockets de forma extremamente rápida.
*   **Tokio (v1.38)**: O runtime assíncrono que provê o loop de eventos baseado em threads de kernel do sistema operacional, permitindo que milhares de conexões WebSocket persistam sem sobrecarregar a CPU.
*   **Serde (v1.0)**: Biblioteca de serialização e desserialização rápida de structs Rust para strings JSON e vice-versa.
*   **Broadcast Channels (`tokio::sync::broadcast`)**: Mecanismo de pub/sub (publicação e assinatura) em memória utilizado para disparar atualizações do lobby para todas as conexões WebSocket ativas instantaneamente.

---

## 🗄️ 2. Gerenciamento de Estado em Memória (Sem Banco de Dados)

Para maximizar a performance e a privacidade dos usuários, **o Tracker não possui banco de dados persistente**. Todo o estado da rede é mantido em RAM e limpo dinamicamente.

### Estrutura do Estado (`TrackerState`)

O estado global do servidor é compartilhado de forma segura entre threads usando ponteiros de referência gerenciados por contagem (`Arc`) e travas de exclusão mútua assíncronas (`Mutex`):

```rust
#[derive(Clone, Debug)]
struct Node {
    last_seen: Instant,
    onion: String,
    files: Vec<AnnouncedFile>,
}

#[derive(Clone)]
struct TrackerState {
    nodes: Arc<Mutex<HashMap<String, Node>>>,
    lobby_tx: broadcast::Sender<String>,
}
```

*   **`HashMap<String, Node>`**: Mapeia o identificador único do nó do cliente (`node_id`) para a sua respectiva estrutura `Node` que contém:
    - O timestamp da última atividade (`last_seen`).
    - O endereço Tor de recebimento (`onion`).
    - A lista de arquivos que o usuário está semeando (`files`).
*   **`lobby_tx`**: O transmissor do canal de broadcast. Sempre que a lista de arquivos muda, o tracker envia uma mensagem contendo o JSON do novo lobby para este canal, que a retransmite para todos os sockets abertos.

---

## ⏱️ 3. O Mecanismo de Coleta de Lixo (Offlining Automatizado)

Como a rede Tor é volátil e os clientes podem perder conexão sem enviar uma mensagem de fechamento de socket amigável, o tracker implementa um mecanismo de **Garbage Collection (GC)** ativo:

```mermaid
loop A cada 5 segundos
    Tracker ->> Memory: Executa loop de expiração
    Memory ->> Memory: Verifica nodes com last_seen > 30s
    alt Nó Inativo Encontrado
        Memory ->> Memory: Remove Nó e seus respectivos arquivos
        Tracker ->> WebSocket: Transmite novo lobby atualizado
    end
end
```

### O código do loop secundário (Background Task):
```rust
let cleanup_state = state.clone();
tokio::spawn(async move {
    let mut interval = tokio::time::interval(Duration::from_secs(5));
    loop {
        interval.tick().await;
        push_lobby(&cleanup_state).await; // Limpa nós inativos e retransmite o lobby
    }
});
```
Se um nó não for atualizado por WebSocket ou HTTP Announce dentro de 30 segundos, ele é considerado offline e seus arquivos são removidos da lista pública.

---

## 📡 4. Detalhamento de Endpoints e Fluxo de Mensagens

### Rota WebSocket: `/ws`
*   **Propósito**: Sincronização e anúncio em tempo real.
*   **Fluxo de Handshake**:
    1. O cliente faz a requisição HTTP GET para `/ws` com cabeçalhos de upgrade.
    2. O Axum promove a conexão para WebSocket e inicia a função `handle_socket`.
    3. O servidor envia imediatamente o estado atualizado do Lobby Global para o cliente.
    4. O cliente envia mensagens de anúncio contendo seu status de arquivos.
    5. O servidor escuta e atualiza a estrutura do nó correspondente em memória.

#### Formato JSON da Mensagem de Anúncio (`announce`):
```json
{
  "type": "announce",
  "node_id": "8c7d5bfa-3211-4f11-8844-efacb51234ac",
  "onion": "http://japaopeer12345.onion",
  "files": [
    {
      "file_id": "2db8cf19-2115-46aa-bb55-a2c3d4f5e6a7",
      "name": "livro_economia.pdf",
      "size": 10485760,
      "link": "http://japaopeer12345.onion/download/livro_economia.pdf",
      "content_hash": "a5c7f8e910bd..."
    }
  ]
}
```

### Rota HTTP REST: `GET /lobby`
*   **Propósito**: Retornar o acervo global consolidado.
*   **Resposta JSON esperada (`NetworkLobby`)**:
```json
{
  "online_nodes": 2,
  "files": [
    {
      "name": "livro_economia.pdf",
      "size": 10485760,
      "link": "http://japaopeer12345.onion/download/livro_economia.pdf",
      "content_hash": "a5c7f8e910bd...",
      "peer_count": 1,
      "peers": [
        {
          "node_id": "8c7d5bfa-3211-4f11-8844-efacb51234ac",
          "onion": "http://japaopeer12345.onion",
          "file_id": "2db8cf19-2115-46aa-bb55-a2c3d4f5e6a7",
          "link": "http://japaopeer12345.onion/download/livro_economia.pdf"
        }
      ]
    }
  ]
}
```

### Rota HTTP REST: `GET /swarm/:content_hash`
*   **Propósito**: Retornar a localização de todas as cópias de um arquivo com base no seu Hash SHA-256.
*   **Utilidade**: Permite que o cliente faça downloads paralelos pedindo partes diferentes (chunks) a nós distintos que possuam o mesmo hash de arquivo.
*   **Resposta**: Retorna a lista de peers que hospedam o hash ou `null` se nenhum nó possuir o arquivo.

### Rota HTTP REST: `GET /debug/nodes`
*   **Propósito**: Retornar informações cruas de depuração interna do servidor (restrita/admin).
*   **Resposta**: Uma lista de nós e a quantidade de arquivos de cada um em formato direto.
