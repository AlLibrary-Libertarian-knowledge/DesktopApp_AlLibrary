# 📂 Mapeamento de Arquivos P2P (Código-Fonte)

Este documento detalha o papel de cada arquivo criado ou modificado no AlLibrary para suportar o compartilhamento P2P, a descoberta zero-search e a interface de carregamento de downloads.

---

## 🏗️ Estrutura de Pastas e Localização de Arquivos

No ecossistema de desenvolvimento do Tauri, o projeto é dividido em:
1. **`src-tauri/`**: Código nativo (Rust). Executa com privilégios de sistema, interage diretamente com o daemon do Tor, gerencia arquivos locais e executa a lógica de baixo nível de rede.
2. **`src/`**: Interface de Usuário (SolidJS + TypeScript). Executa dentro do contexto webview, consumindo as APIs do Rust via comandos Tauri (`invoke`).

---

## 📄 Detalhamento dos Arquivos

### 🌐 Camada de Redes e Serviços (`src/services/network/`)

#### 1. [`src/services/network/downloadManager.ts`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/services/network/downloadManager.ts)
*   **Importância**: É o cérebro do gerenciamento de transferências ativas e completadas no frontend.
*   **Por que existe**: Como os downloads sobre Tor podem levar minutos, e o backend Rust só emite um evento final de conclusão (`onion-share-fetch-done`), a interface precisa de um intermediário para:
    *   Manter a lista global de downloads ativos e históricos.
    *   Simular o progresso gradualmente (de 10% a 90%) para dar feedback visual ao usuário enquanto o arquivo é baixado no backend.
    *   Notificar instantaneamente qualquer tela do aplicativo (como `GlobalAcervo` ou `PeerTransfers`) sobre alterações de status.
    *   Persistir downloads finalizados (com sucesso ou erro) no `localStorage` sob a chave `allibrary_completed_downloads`.

#### 2. [`src/services/network/onionShareService.ts`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/services/network/onionShareService.ts)
*   **Importância**: Ponte direta com o backend Rust.
*   **Função**: Contém as chamadas `invoke` do Tauri para os comandos declarados no Rust, tais como:
    *   `onionShareFetch(link, outDir)`: Solicita ao Rust que faça o download de um link `.onion`.
    *   `listenOnionShareFetchDone(callback)`: Escuta o evento assíncrono disparado pelo Rust ao finalizar uma transferência.
    *   `trackerGetCachedLobby()`: Solicita a lista atualizada de arquivos e nós online cadastrados no Tracker.

#### 3. [`src/services/network/p2pNetworkService.ts`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/services/network/p2pNetworkService.ts)
*   **Importância**: Coordena ações de alto nível de rede.
*   **Função**: Centraliza regras de negócios como publicar novos conteúdos e verificar hashes de integridade.

---

### 🎨 Componentes e Telas de Interface (`src/pages/` & `src/components/`)

#### 4. [`src/pages/GlobalAcervo/`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/pages/GlobalAcervo/)
*   **Arquivos**: `GlobalAcervo.tsx` e `GlobalAcervo.module.css`.
*   **Importância**: Tela de descoberta automática ("Zero-Search").
*   **Função**: Lista automaticamente todos os documentos que estão sendo anunciados na rede pelo Tracker. Permite ao usuário clicar em "Download" e acompanhar o progresso em tempo real sem precisar saber o link `.onion` de antemão.

#### 5. [`src/pages/PeerTransfers/PeerTransfers.tsx`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/pages/PeerTransfers/PeerTransfers.tsx)
*   **Importância**: Centralizador de transferências e compartilhamentos do usuário.
*   **Função**: Exibe tabelas detalhadas de compartilhamentos locais (outbound) e downloads ativos/finalizados (inbound) assinando o `DownloadManager`. Permite a inserção manual de links Onion externos.

#### 6. [`src/components/composite/FirstRunWizard/`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/components/composite/FirstRunWizard/)
*   **Arquivos**: `FirstRunWizard.tsx` e `FirstRunWizard.module.css`.
*   **Importância**: Onboarding inicial obrigatório do usuário.
*   **Função**: Guia o usuário na primeira inicialização para:
    1.  Verificar o status de inicialização do Tor.
    2.  Selecionar a pasta que deseja compartilhar (arquivos lidos por padrão).
    3.  Selecionar a pasta onde deseja salvar arquivos baixados.
    Evita que o app inicie compartilhando pastas incorretas ou misturando downloads com o código do sistema.

#### 7. [`src/components/layout/Sidebar.tsx`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/components/layout/Sidebar.tsx)
*   **Importância**: Menu de navegação lateral.
*   **Função**: Modificado para incluir um polling em segundo plano (a cada 15 segundos) que lê a contagem de nós ativos no Tracker e exibe o indicador "X nós online" no rodapé, dando feedback de conexão global ao usuário.

---

### 💾 Camada de Persistência (`src/services/storage/`)

#### 8. [`src/services/storage/settingsService.ts`](file:///home/eduardo/Documentos/tcc/DesktopApp_AlLibrary/src/services/storage/settingsService.ts)
*   **Importância**: Gerenciamento de configurações.
*   **Função**: Persiste as preferências do usuário (caminhos de compartilhamento e downloads separados) no armazenamento local e sincroniza-as com o backend Rust por meio da API do Tauri.
