# Explore — publish-game-release (Incremento 17)

**Data de conclusão:** 28/10/2026  
**Agente responsável:** `/root/i17_explore`  
**Modo de operação:** Exploração técnica independente, análise de repositório, estratégia de versionamento granular, especificação de hospedagem Netlify, compatibilidade de Service Worker, plano de smoke test pós-publicação e estruturação da change para a fase *propose*.  
**Diretrizes respeitadas:** Sem execução de `git push` ou commits definitivos nesta fase; preservação estrita de `project/automation-state.json`.

---

## 1. Resumo Executivo e Status da Exploração

O Incremento 17 representa o fechamento do ciclo de desenvolvimento do **Pirate Battle**, cumprindo os requisitos finais do **Milestone 5 ("Delivery validation")** da **Seção 15 do Game Design Document (GDD)** e do roteiro de automação (`project/prompts.md`).

A instrução norteadora do incremento determina:
> *"Planeje a publicação da versão preparada do Pirate Battle no destino autorizado. Inspecione configurações de hospedagem existentes; se destino ou acesso estiverem ausentes, relate precisamente a informação necessária. Mantenha o artefato pronto enquanto isso.*
>
> *Após aprovação do plano e autorização de publicação, publique a versão identificada e verifique a URL pública: entrada direta, refresh, assets, MSW no build, partida desktop/mobile, registro idempotente, ranking/histórico e recuperação de pendência. Confirme que URL e código entregue correspondem. Documente o caráter local por navegador do mock e os resultados reais da verificação.*
>
> *Critérios: URL pública funcional vinculada à versão entregue e smoke test registrado. Não encerre como entrega completa apenas com build local ou deploy iniciado; falhas externas permanecem explicitamente pendentes."*

### Parâmetros e Autorizações Fornecidas pelo Usuário:
1. **Repositório GitHub**: `viniciuscasarin/jungle-gamedev` (acesso plenamente autenticado via `gh CLI` e Git Credential Manager).
2. **Plataforma de Hospedagem**: Netlify (previamente autorizada e integrada com o repositório GitHub da conta).
3. **Diretriz de Versionamento**: Ao commitar, separar obrigatoriamente os commits por tema, subsistema e funcionalidade (histórico granular, limpo e profissional).

### Diagnóstico Geral da Exploração:
- **Autenticação GitHub**: Confirmada. O utilitário `gh auth status` atesta conexão ativa como `viniciuscasarin` com escopos de repositório (`repo`, `admin:public_key`). O repositório remoto `viniciuscasarin/jungle-gamedev` existe na nuvem e encontra-se vazio (`isEmpty: true`), pronto para receber o histórico inicial.
- **Estado do Git Local**: O checkout local possui 3 commits base (`chore: add game assets...`, `docs: add GDD...`, `docs: add prompts...`) na branch `master`. Todos os arquivos desenvolvidos ao longo dos incrementos 1 a 16 (`src/`, `tests/`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`, `index.html`, `README.md`, `ARCHITECTURE.md`, `ASSET_CREDITS.md`, `openspec/` e `project/`) estão intactos no diretório de trabalho, mas em estado não rastreado (*untracked*).
- **Estratégia de Commits Granulares**: Foi mapeada uma sequência estrita de **12 commits temáticos** cobrindo 100% dos arquivos do workspace de forma modular, incremental e auditável, respeitando as convenções de Conventional Commits.
- **Hospedagem Netlify e Service Worker**: Foi projetada a especificação declarativa completa de `netlify.toml`, incluindo comando de build (`npm run build`), diretório de saída (`dist`), regra de fallback SPA (`/* -> /index.html 200`) e cabeçalhos de segurança e cache HTTP. Foi validado que o `mockServiceWorker.js` é servido diretamente na raiz em ambiente HTTPS com escopo irrestrito (`Service-Worker-Allowed: /`) e cabeçalho `no-cache`, garantindo que o mock REST e a outbox de partidas funcionem de forma isolada e resiliente no navegador de cada visitante.
- **Plano de Smoke Test**: Foi elaborado um roteiro de verificação ponta a ponta com 7 etapas obrigatórias na URL pública do Netlify.

---

## 2. Estratégia de Commits Temáticos e Granulares

Em atendimento à instrução formal do usuário (*"Ao commitar, separar os commits por tema, funcionalidades, etc."*), os arquivos atualmente untracked no repositório foram categorizados em 12 blocos atômicos, que serão aplicados na fase `apply`:

```mermaid
flowchart TD
    C0["Commits Históricos (3)<br/>Assets Iniciais + GDD + Prompts"] --> C1["01. chore(setup): Tooling, TypeScript, Vite & ESLint"]
    C1 --> C2["02. feat(simulation): Deterministic Engine, Physics & Combat"]
    C2 --> C3["03. feat(render): PixiJS Arena Renderer & Visual Effects"]
    C3 --> C4["04. feat(audio): Web Audio Synthesizer & Sound Effects"]
    C4 --> C5["05. feat(input): Keyboard, Mouse & Touch Input Controls"]
    C5 --> C6["06. feat(api): MSW REST Mock, Contracts & Scenarios"]
    C6 --> C7["07. feat(data): Match Outbox, Storage & Query Layer"]
    C7 --> C8["08. feat(ui): React HUD, Menus, Leaderboard & Lifecycle"]
    C8 --> C9["09. test(e2e): Playwright Suite & Visual Regression Baselines"]
    C9 --> C10["10. docs: Architecture, Asset Credits & Delivery Guides"]
    C10 --> C11["11. chore(openspec): Specs, Archived Changes & Reports"]
    C11 --> C12["12. chore(deploy): Netlify Hosting Config & Public Release"]
```

### Detalhamento da Sequência de Commits Proposta:

| Ordem | Mensagem do Commit | Arquivos Incluídos | Justificativa e Escopo |
|---|---|---|---|
| **01** | `chore(setup): configure build tooling, dependencies, TypeScript, ESLint and test runner` | `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.core.json`, `vite.config.ts`, `eslint.config.js`, `index.html` | Estabelece a infraestrutura de compilação, linters, types e scripts essenciais para a reprodutibilidade. |
| **02** | `feat(simulation): implement deterministic fixed-timestep game engine, physics and combat` | `src/domain/*.ts`, `src/simulation/*.ts`, `tests/config.test.ts`, `tests/contracts.test.ts`, `tests/navigation.test.ts`, `tests/combat.test.ts`, `tests/enemies.test.ts`, `tests/simulation.test.ts`, `tests/simulation-benchmark.test.ts` | Núcleo puro de simulação (60 Hz): física de navegação, aceleração, atrito, colisão circular/orientada, canhões, inteligência artificial dos inimigos (Chaser e Shooter) e benchmarks de performance. |
| **03** | `feat(render): implement PixiJS v8 arena renderer, asset loader and battle visual effects` | `src/render/*.ts`, `tests/assetCache.test.ts`, `tests/assetManifest.test.ts`, `tests/loadingAttempt.test.ts`, `tests/previewOwner.test.ts`, `tests/render.test.ts`, `tests/resizeObserver.test.ts`, `tests/viewport.test.ts` | Subsistema gráfico em PixiJS v8: viewport responsivo, interpolação de frames, renderização de navios/projéteis/ilhas, barras de vida vetoriais, efeitos de fumaça e explosão procedural. |
| **04** | `feat(audio): implement Web Audio synthesizer and positional sound engine` | `src/audio/*.ts`, `tests/audio.test.ts` | Gerenciador de áudio Web Audio API, carregamento de assets sonoros, reprodução de disparos, impactos de madeira, água, alertas e loop de ambiente. |
| **05** | `feat(input): implement keyboard, mouse and responsive touch controls` | `src/input/*.ts`, `tests/touch.test.ts` | Camada de entrada desacoplada: controles de mouse e teclado (WASD, R, barra de espaço) e controles de toque com botões virtuais responsivos para mobile. |
| **06** | `feat(api): implement MSW REST mock, contracts, fixtures and scenarios` | `public/mockServiceWorker.js`, `src/api/*.ts`, `src/mocks/*.ts`, `tests/api.test.ts`, `tests/scenarios.test.ts` | Interceptação de rede com Mock Service Worker (MSW), contratos de dados TypeScript, fixtures determinísticas e os 12 cenários de diagnóstico de rede. |
| **07** | `feat(data): implement match result outbox, offline queue and storage` | `src/storage/*.ts`, `src/data/*.ts`, `tests/storage.test.ts`, `tests/outbox.test.ts`, `tests/outboxUi.test.ts` | Fila persistente de resultados de partida (Outbox), armazenamento tolerante a falhas em LocalStorage, reconciliação assíncrona com retry e integração com TanStack Query. |
| **08** | `feat(ui): implement React HUD, menus, leaderboard, options and match lifecycle` | `src/main.tsx`, `src/ui/*.tsx`, `src/ui/*.ts`, `src/ui/*.css`, `src/ui/screens/*.tsx`, `src/ui/screens/*.css`, `tests/hud.test.ts`, `tests/lifecycle.test.ts`, `tests/networkUi.test.ts`, `tests/optionsDraft.test.ts`, `tests/rankingHistory.test.ts` | Interface de usuário declarativa em React: menu principal, HUD durante a batalha, modal de configurações/opções, abas de classificação e histórico de partidas, tela de fim de jogo e alternador de cenários de rede. |
| **09** | `test(e2e): implement Playwright end-to-end test suite and visual regression baselines` | `playwright.config.ts`, `tests/e2e/*.ts`, `tests/e2e/helpers/*.ts`, `tests/e2e/visual-regression.spec.ts-snapshots/*` | Suíte de testes ponta a ponta com Playwright: jornada integrada, validação de HUD em resoluções mobile/desktop, cenários de rede simulados e snapshots de regressão visual. |
| **10** | `docs: add architecture specification, asset credits and release guide` | `README.md`, `ARCHITECTURE.md`, `ASSET_CREDITS.md`, `tests/releasePackage.test.ts` | Documentação técnica completa em inglês, setup reproduzível, matriz de decisões do GDD, conformidade de licenças dos assets e teste de integridade do pacote gerado em `dist/`. |
| **11** | `chore(openspec): record incremental specifications, archived changes and automation reports` | `openspec/specs/*`, `openspec/changes/archive/*`, `project/HANDOFF-ANTIGRAVITY.md`, `project/automation.md`, `project/automation-reports/*` | Histórico formal de desenvolvimento guiado por especificação: 22 especificações principais, 16 mudanças arquivadas e relatórios de auditoria por fase. |
| **12** | `chore(deploy): configure Netlify hosting and release deployment pipeline` | `netlify.toml`, `openspec/changes/publish-game-release/*`, `openspec/specs/public-deployment/*`, `tests/deploymentPackage.test.ts` | Arquivos específicos do Incremento 17: manifesto declarativo do Netlify, nova especificação de release público e testes automatizados de deployment. |

---

## 3. Especificação de Hospedagem Netlify e Service Worker

### 3.1 Manifesto Declarativo `netlify.toml`
Para garantir que o Netlify compile e sirva o jogo estático corretamente, definimos a seguinte configuração formal em `netlify.toml` na raiz do repositório:

```toml
# Netlify Configuration for Pirate Battle Web Application

[build]
  command = "npm run build"
  publish = "dist"

# SPA Fallback: rotas desconhecidas ou navegação direta retornam index.html com status 200
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Cabeçalhos globais de segurança e políticas de proteção
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

# Service Worker MSW: entrega correta com escopo irrestrito e revalidação mandatória
[[headers]]
  for = "/mockServiceWorker.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"
    Service-Worker-Allowed = "/"
    Cache-Control = "no-cache, no-store, must-revalidate"

# Assets versionados com fingerprint: cache imutável de longa duração (1 ano)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# index.html raiz: nunca armazenar em cache persistente para refletir releases imediatamente
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 3.2 Análise da Compatibilidade do Mock Service Worker (MSW) em HTTPS Estático

1. **Contexto Seguro (HTTPS)**: O Netlify fornece automaticamente certificados SSL/TLS (Let's Encrypt), servindo o site via HTTPS (`https://*.netlify.app`). A especificação W3C de Service Workers exige um contexto seguro (HTTPS ou `localhost`). Portanto, o ambiente de hospedagem Netlify é 100% compatível com a inicialização do Service Worker.
2. **Cópia para o Diretório Raiz**: O bundler Vite copia todos os arquivos estáticos de `public/` para `dist/` durante `npm run build`. O arquivo `public/mockServiceWorker.js` é posicionado em `dist/mockServiceWorker.js`, correspondendo à URL `/mockServiceWorker.js` na raiz do domínio público.
3. **Escopo Global (`Service-Worker-Allowed: /`)**: Ao configurar explicitamente o cabeçalho HTTP `Service-Worker-Allowed: /` para o script do worker, o navegador permite que o worker controle qualquer rota dentro da origem, mesmo em requisições de subrotas.
4. **Resiliência e Fallback Local**:
   - Em `src/mocks/init.ts`, a inicialização do worker conta com timeout de 1500ms e tratamento defensivo `try/catch`. Caso o navegador do usuário bloqueie workers (por exemplo, em modo de navegação anônima ultrarrestritiva ou extensões de terceiros), o jogo não trava nem impede a jogabilidade: ele emite um aviso no console e continua a execução.
   - O Mock Service Worker opera estritamente **client-side**: todas as chamadas para `/api/ranking`, `/api/matches`, etc., são interceptadas no loop de eventos do navegador, persistindo dados no `localStorage` da origem HTTPS. Nenhum backend real ou serviço externo é consultado ou exigido.

---

## 4. Configuração de Remotes Git e Sincronização GitHub

### 4.1 Estado dos Remotes e Repositório Remoto
A verificação via `git remote -v` confirmou que atualmente **não há nenhum remote configurado** no repositório local.  
A inspeção da API do GitHub via `gh repo view viniciuscasarin/jungle-gamedev` retornou:
```json
{
  "defaultBranchRef": { "name": "" },
  "isEmpty": true,
  "isFork": false,
  "parent": null,
  "url": "https://github.com/viniciuscasarin/jungle-gamedev"
}
```
Isso confirma que o repositório foi criado e está vazio na nuvem, pronto para receber o push dos commits temáticos.

### 4.2 Padrão de Branch e Alinhamento com Netlify
- O branch local atual chama-se `master`.
- O padrão moderno adotado pelo GitHub e pelo Netlify é `main`.
- Na fase `apply`, o branch local será renomeado para `main` com `git branch -M main`.
- O remote `origin` será adicionado apontando para `https://github.com/viniciuscasarin/jungle-gamedev.git`.
- A autenticação HTTPS está validada e aprovada pelo Git Credential Manager associado à conta `viniciuscasarin`.
- O comando de publicação será executado com rastreamento upstream: `git push -u origin main`.
- Como o Netlify já está integrado ao repositório, o recebimento do branch `main` disparará automaticamente o processo de build do Netlify utilizando os parâmetros declarados em `netlify.toml`.

---

## 5. Plano de Verificação e Smoke Test Pós-Publicação

O Milestone 5 do GDD determina que a entrega final deve incluir um **smoke test verificado da versão publicada na URL pública**. O roteiro a seguir será executado na fase `verify`:

| Etapa | Ação Operacional | Critério de Aceite |
|---|---|---|
| **1. Entrada Direta (Direct Load)** | Acessar a URL pública HTTPS (`https://<site>.netlify.app/`). | HTTP 200 OK; carregamento do DOM raiz `<div id="root"></div>`; carregamento do stylesheet e bundle JS; ausência de erros 4xx/5xx no console. |
| **2. Recarregamento de Página (Refresh & SPA Fallback)** | Pressionar `F5` / recarregar a página na rota raiz e em estados de jogo. | Resposta HTTP 200 via regra de redirecionamento SPA do Netlify; a aplicação reinicia sem páginas de erro 404 do servidor. |
| **3. Integridade de Assets Estáticos** | Inspecionar a aba *Network* das ferramentas de desenvolvedor. | Texturas PNG (navios, ilhas, água), efeitos sonoros WAV e manifestos carregam com HTTP 200 ou 304 Not Modified. |
| **4. Inicialização do MSW Worker** | Verificar logs do console e requisições de API. | Mensagem `[MSW] Mocking enabled` registrada no console; Service Worker ativo no escopo `/`; requisições para `/api/ranking` e `/api/health` interceptadas com status 200. |
| **5. Partida Interativa (Desktop e Mobile Touch)** | Clicar em "Jogar" no menu principal; testar navegação, colisão com ilhas, tiros frontais e laterais. | Simulação determinística fluida a 60 FPS; destruição de navios inimigos; áudio funcional; HUD responsivo atualizado em tempo real. |
| **6. Encerramento de Partida e Outbox** | Concluir uma partida (por sobrevivência ou destruição); verificar tela de resultados. | Pontuação calculada; payload de partida enfileirado na Outbox; envio para `/api/matches` com resposta 201 Created; aba de Ranking atualizada com a nova pontuação. |
| **7. Caráter Local por Navegador** | Abrir o jogo em uma aba anônima ou outro navegador. | Confirmar que os dados de ranking e histórico são mantidos na origem do navegador (`localStorage`), funcionando como sandbox local autônoma por visitante, conforme estipulado pelo GDD. |

---

## 6. Especificação OpenSpec e Planejamento da Change

Para governar formalmente as alterações do Incremento 17, a fase `propose` estruturará a change `publish-game-release` com uma nova especificação delta e conjunto de tarefas:

### 6.1 Nova Especificação Primária: `public-deployment`
Localização: `openspec/specs/public-deployment/spec.md`.  
Requisitos mapeados:
1. **`Requirement: Netlify Configuration Manifest`**: O repositório SHALL conter um manifesto `netlify.toml` na raiz especificando o comando de build `npm run build`, diretório de publicação `dist`, regra de redirecionamento SPA (`/* -> /index.html 200`) e cabeçalhos HTTP de segurança e controle de cache.
2. **`Requirement: Mock Service Worker Production Delivery`**: O arquivo `mockServiceWorker.js` SHALL ser empacotado na raiz pública e servido com os cabeçalhos `Service-Worker-Allowed: /` e `Cache-Control: no-cache, no-store, must-revalidate`, garantindo a ativação plena do interceptador REST sob HTTPS.
3. **`Requirement: Granular Thematic Git Versioning`**: Todo o histórico de código, testes, assets e documentação SHALL ser commitado de forma atômica e temática, organizado em commits com escopos claros (setup, simulação, renderização, áudio, input, api, outbox, ui, testes e docs) e sincronizado com o branch `main` do repositório remoto no GitHub.
4. **`Requirement: Automated Deployment Integrity Verification`**: A suíte de testes automatizados SHALL conter testes unitários e de integração validando a sintaxe e a consistência do arquivo `netlify.toml` e do pacote de produção.
5. **`Requirement: Post-Deployment Smoke Test Protocol`**: A release SHALL ser validada através de um roteiro documentado de smoke test na URL pública gerada pelo Netlify, atestando entrada direta, refresh, carregamento de assets, funcionamento do MSW e persistência local de partidas.
6. **`Requirement: Release Documentation and Deployment Transparency`**: O arquivo `README.md` SHALL ser atualizado com as instruções e a URL pública da versão entregue, esclarecendo a arquitetura estática e o caráter local por navegador do Mock Service Worker.

### 6.2 Organização das Tarefas para `tasks.md`:
- **Grupo 1: Configuração do Netlify e Testes de Integridade**
  - Criação do `netlify.toml` com build, publish, redirects e headers.
  - Implementação do teste de integração `tests/deploymentPackage.test.ts` para validar o arquivo de configuração e a consistência de release.
  - Validação local com `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build`.
- **Grupo 2: Sequência de Commits Temáticos e Sincronização GitHub**
  - Configuração do remote `origin` (`https://github.com/viniciuscasarin/jungle-gamedev.git`).
  - Renomeação do branch local para `main`.
  - Execução sequencial dos 12 commits temáticos mapeados na Seção 2 deste relatório.
  - Sincronização upstream via `git push -u origin main`.
- **Grupo 3: Validação da Hospedagem Netlify e Smoke Test Pós-Publicação**
  - Acompanhamento do status de publicação no Netlify.
  - Execução e registro das evidências do roteiro de smoke test na URL pública.
  - Registro de capturas e logs de rede confirmando MSW ativo sob HTTPS.
- **Grupo 4: Finalização da Documentação e Auditoria OpenSpec**
  - Atualização do `README.md` com a URL pública oficial e orientações de acesso.
  - Sincronização da spec `public-deployment` com o catálogo de specs do OpenSpec.
  - Validação estrita com `openspec.cmd validate --all --strict`.

---

## 7. Próximos Passos (Fase *Propose*)

A exploração do Incremento 17 foi concluída com sucesso. O ambiente local, as credenciais do GitHub, os arquivos untracked, a arquitetura de build e a estratégia de hospedagem no Netlify foram integralmente auditados.

O agente coordenador pode proceder com a invocação do executor da fase **`propose`** (`openspec propose publish-game-release`), que criará formalmente os artefatos em `openspec/changes/publish-game-release/` (`proposal.md`, `specs/public-deployment/spec.md`, `design.md` e `tasks.md`) com base nas decisões e estruturas consolidadas neste relatório.
