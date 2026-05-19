# 🧪 Como Testar o Download P2P Localmente (Antes de Commitar & Push)

Para garantir que o download P2P de arquivos e a persistência de compartilhamento estão funcionando perfeitamente, você pode realizar testes em seu próprio computador utilizando o Tracker local em modo Docker de forma muito simples.

---

## 🛠️ Passo 1: Subir o Servidor Tracker Local
Na pasta `deploy/` do seu projeto, execute o Docker Compose para iniciar o Tracker:
```bash
cd deploy
docker compose up -d --build
```
Isso iniciará o Tracker na porta `8080` do seu localhost.

Para verificar se o tracker está rodando e ver os nós conectados, use:
```bash
docker compose exec tracker curl -s http://localhost:8080/debug/nodes
```

---

## 🔄 Passo 2: Configurar o App para Usar o Tracker Local
No aplicativo desktop AlLibrary:
1. Vá para **Configurações** (ou pelo menu lateral).
2. No campo **Tracker URL**, insira: `http://127.0.0.1:8080` (isso evita o atraso da rede Tor para o Tracker, facilitando testes rápidos).
3. Habilite a opção **Try Local Tracker Fallback** (se disponível) ou apenas salve o campo.

---

## 📂 Passo 3: Adicionar Arquivos para Compartilhar (Seeding)
Na tela **Sharing & Downloads**:
1. Certifique-se de que o Tor está conectado (barra lateral mostra "Onion Active").
2. Adicione os arquivos que deseja compartilhar:
   - Clique em **Share Multiple** (o botão `+`) para abrir o seletor nativo e escolher um ou mais arquivos de uma vez.
   - Os arquivos aparecerão na tabela **Outbound — sharing & seeding** com o status `seeding`.
3. Os arquivos compartilhados são salvos automaticamente no seu navegador (`localStorage`).
4. **Teste de Persistência**: Feche o aplicativo e abra-o novamente. Assim que a tela de carregamento terminar e o Tor conectar, você verá no console logs como:
   `Restoring shared file on boot: /caminho/do/seu/arquivo`
   E os arquivos voltarão automaticamente à tabela de compartilhamento no estado `seeding`!

---

## 📥 Passo 4: Testar o Download do Arquivo
Como você está na mesma máquina, você pode testar o download simulando um nó receptor:
1. Vá até a tela **Global Acervo** (onde todos os arquivos disponíveis na rede são listados de forma automatizada).
2. Você verá os arquivos que você mesmo acabou de compartilhar listados ali.
3. Se você clicar em **Download** no card de um arquivo:
   - O aplicativo iniciará o processo de download via rede Tor.
   - O card do arquivo mostrará o progresso do download em tempo real (ex: `10%`, `50%`, `100%`).
   - Caso o serviço do Tor não esteja ativo, um banner vermelho explicativo (`downloadErrorBanner`) aparecerá no topo informando o ocorrido.
4. Quando o download for concluído com sucesso:
   - O arquivo será salvo na pasta de downloads configurada no assistente inicial (First Run Wizard).
   - O status do arquivo no **Global Acervo** mudará para `✅ Saved`.
   - Na aba **Sharing & Downloads**, o download aparecerá na lista de transferências de entrada como `✅ Baixado & Seeding`.
   - **Auto-Seeding**: O arquivo baixado será automaticamente adicionado ao compartilhamento local para que outros nós possam baixá-lo a partir de você, aumentando a velocidade e descentralização da rede.

---

## 🐛 Diagnóstico de Problemas
Se o download falhar ou ficar travado em progresso inicial:
*   Verifique se o seu Tor local está conseguindo se conectar aos circuitos.
*   Veja se o caminho da pasta de downloads configurada no First Run Wizard existe e tem permissão de escrita.
*   Consulte os logs do terminal de desenvolvimento (`pnpm run dev`) para analisar qualquer exceção disparada no Rust ou no SolidJS.
