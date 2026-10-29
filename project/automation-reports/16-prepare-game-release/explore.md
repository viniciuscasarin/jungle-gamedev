# Explore — prepare-game-release (Incremento 16)

**Data de conclusão:** 28/10/2026  
**Agente responsável:** `/root/i16_explore_retry`  
**Modo de operação:** Exploração técnica, inventário de ativos, auditoria documental, verificação de pacote de produção e planejamento da change para a fase *propose* (sem implementar código de produto, sem criar scaffold da change em `openspec/changes/` e sem alterar `project/automation-state.json`).

---

## 1. Resumo Executivo e Status da Exploração

O Incremento 16 tem como objetivo preparar a entrega formal do projeto **Pirate Battle** conforme os requisitos estabelecidos na **Seção 15 ("Delivery sequence and estimate")** e **Seção 16 ("Playtest questions and remaining decisions")** do **Game Design Document (GDD)** e no roteiro de automação (`project/prompts.md`).

A instrução orientadora do incremento determina:
> *"Planeje a entrega da seção 15 do GDD. Revise README e ARCHITECTURE em inglês com setup limpo, comandos reais, controles, configurações, limites do mock, cenários/reset/falhas, simulação, colisão, React/Pixi, input, lifecycle, persistência, contratos, cache e recuperação da outbox. Finalize créditos com procedência/licenças comprovadas e explicite pendências. Inclua fonte, lockfile, assets, fixtures, mocks, testes e relatórios.*
>
> *Prepare build e configuração de hospedagem com assets, rotas e worker MSW corretos. Verifique preview de produção, entrada direta e refresh; audite critérios do GDD e specs. Registre correspondência entre versão do código, build e evidências. Não publique durante esta preparação: deixe o pacote pronto e informe bloqueios concretos de entrega.*
>
> *Critérios: outra pessoa consegue instalar, executar, testar e reproduzir falhas pelo README; preview funciona com MSW; relatório final distingue entregue, validado e pendente. Licença sem comprovação continua pendente e não é presumida."*

### Principais Diagnósticos e Conclusões da Exploração:
1. **Auditoria da Documentação (`README.md` e `ARCHITECTURE.md`)**:
   - Ambos os documentos estão redigidos em inglês e cobrem com grande profundidade o funcionamento do jogo.
   - Foram identificadas oportunidades críticas de melhoria:
     - **Problema de Codificação de Caracteres (Mojibake)**: Diversos trechos apresentam caracteres corrompidos de codificação Windows-1252/UTF-8 (como `â€œ`, `â†’`, `Ã—`, `â€“`, `Â§15`), que afetam a legibilidade profissional.
     - **Setup no Windows e Execução de Scripts**: Em ambientes Windows com política restrita de execução do PowerShell (`PSSecurityException`), invocar `npm` diretamente tenta carregar `npm.ps1`, falhando. A documentação deve orientar explicitamente o uso de `npm.cmd` ou a configuração de `ExecutionPolicy`, garantindo que qualquer pessoa consiga rodar do zero.
     - **Guia Passo a Passo dos 12 Cenários de Rede**: O `README.md` já lista os 12 cenários, mas se beneficiará de um guia prático de teste passo a passo para cada um (ex: link direto com query param `?networkScenario=...`, comportamento esperado no UI e mecanismo de recuperação).
     - **Mapeamento de Falhas e Recuperação**: Instruções explícitas sobre teste de corrupção de LocalStorage, simulação de falha de asset (`?assetScenario=fail-once`) e fluxo de retry da Outbox.
2. **Procedência de Assets e Auditoria de Licenças**:
   - Foram inventariados todos os **520 arquivos** presentes no diretório `assets/` (imagens PNG, spritesheets, sons WAV, vetores SVG, fontes e XMLs).
   - O jogo utiliza em tempo de execução um subconjunto selecionado de **33 texturas** em `src/render/assetManifest.ts`, **27 clipes de áudio WAV** em `src/audio/audioManifest.ts` e 1 imagem de fundo em `src/ui/Menu.tsx`.
   - **Status Jurídico Rigoroso (GDD §15 e §16)**: Os arquivos foram fornecidos diretamente no pacote do desafio. Não há arquivos de licença de terceiros, termos de distribuição ou atribuição de autoria incluídos no repositório. Conforme determinado pelo GDD §15, **licença sem comprovação continua pendente e não é presumida** (não se infere licença livre por mera semelhança visual a packs conhecidos). Portanto, todos os assets de imagem e áudio fornecidos permanecem classificados formalmente como **Pendência de Homologação de Licença de Terceiros** antes de distribuição comercial/pública aberta.
   - **Elementos Gráficos Próprios (100% Código)**: Barras de vida no Pixi, anéis de alerta de água, partículas procedurais e overlays geométricos foram implementados em TypeScript via Pixi Graphics pura, sendo código autoral livre de pendências.
   - **Dependências de Software**: React, PixiJS, TanStack Query, Axios, MSW, Vite, Vitest e Playwright são pacotes open source sob licenças comprovadas e permissivas (MIT e Apache-2.0).
3. **Pacote de Produção (`build` e `preview`)**:
   - O comando `npm.cmd run build` executa o typecheck rigoroso duplo (`tsconfig.json` e `tsconfig.core.json`) e o empacotamento Vite sem erros.
   - O diretório `dist/` gerado contém:
     - `dist/index.html` (1.38 kB)
     - `dist/mockServiceWorker.js` (12.75 kB, copiado de `public/`)
     - `dist/assets/` contendo bundles fingerprinted de JS, CSS, PNGs e WAVs.
   - O servidor de preview (`npm.cmd run preview -- --port 4173`) foi testado em `http://127.0.0.1:4173`:
     - `GET /` retorna HTTP 200 OK.
     - `GET /mockServiceWorker.js` retorna HTTP 200 OK.
     - O Service Worker registra com sucesso no browser e intercepta requisições de API REST em `/api/...`.
   - **Totalmente Standalone e Sem Dependências Externas**: Não há arquivos `.env`, chaves de API, credenciais, serviços em nuvem ou bibliotecas pagas. Toda a infraestrutura de dados opera localmente no navegador via MSW e LocalStorage com fallback de memória.
4. **Matriz de Entregáveis da Seção 15 do GDD**:
   - Foi construída a matriz formal completa comparando os 5 Milestones do GDD:
     - **Milestones 1 a 4**: 100% Entregues e Validados.
     - **Milestone 5 (Delivery validation)**: Código, testes E2E, baselines visuais, benchmarks de performance e documentação estão 100% Entregues e Validados. Apenas o "public deployment (working public URL)" permanece **Pendente de Destino Externo**, conforme já previsto pelo runbook de automação (Incremento 17 aguarda credenciais/destino externo fornecidos pelo usuário).
5. **Planejamento da Change `prepare-game-release`**:
   - Criação da nova spec principal: `openspec/specs/release-preparation/spec.md`.
   - Organização das tarefas em 4 grupos modulares para `tasks.md`.

---

## 2. Auditoria de Documentação (README.md e ARCHITECTURE.md)

### 2.1 Análise do `README.md`
O `README.md` atual possui 350+ linhas e já fornece visão técnica detalhada de arquitetura, controles, cenários de diagnóstico, simulação e dados. No entanto, foram detectadas as seguintes lacunas para uma entrega impecável:

| Item Auditado | Diagnóstico Atual | Ação Planejada na Change |
|---|---|---|
| **Codificação UTF-8 (Mojibake)** | Diversos caracteres aparecem corrompidos (ex: `â€œ`, `â†’`, `Ã—`, `â€“`, `Â§15`). | Higienizar todo o texto para caracteres Unicode limpos (`“`, `”`, `→`, `×`, `–`, `§15`). |
| **Instruções de Instalação no Windows** | O README assume `npm ci` genérico. Em Windows PowerShell, o comando pode disparar bloqueio de `npm.ps1`. | Adicionar nota técnica clara sobre ambiente de execução (Node >= 26.0.0, npm >= 11.20.0, uso de `npm.cmd` em shells PowerShell restritos). |
| **Guia Passo a Passo dos 12 Cenários de Rede** | Os 12 cenários estão listados, mas falta uma tabela operacional detalhando a URL exata para teste direto (`?networkScenario=<id>`), a ação do usuário no menu e a resposta observável na tela. | Criar tabela operacional de reprodução rápida com links diretos e comportamentos esperados (loading, retry, isolamento de abas, commit-timeout). |
| **Reprodução de Cenários de Falha e Recuperação** | Falhas de assets (`?assetScenario=fail-once`), corrupção de storage e retries da outbox estão espalhados pelo texto. | Estruturar uma seção dedicada "Failure Reproduction and Recovery Guide" com passos acionáveis para QA e avaliadores. |
| **Verificação de Build e Preview de Produção** | O README foca em testes de desenvolvimento. | Incluir instruções explícitas de validação do build de produção, execução de `preview` e validação do Mock Service Worker. |

### 2.2 Análise do `ARCHITECTURE.md`
O `ARCHITECTURE.md` atual (800+ linhas) é exaustivo e cobre a integridade matemática, contratos de simulação, colisões com a costa e ilhas, renderização PixiJS, áudio, outbox e rede.

| Item Auditado | Diagnóstico Atual | Ação Planejada na Change |
|---|---|---|
| **Codificação UTF-8 (Mojibake)** | Presença de artefatos de codificação em tabelas e seções (ex: `âˆ’Ï€/2`, `Ã—`, `â€œ`). | Higienização completa da codificação para símbolos matemáticos e tipográficos puros (`−π/2`, `×`, `“`, `”`). |
| **Mapeamento de Subsistemas (GDD §15)** | Todos os 8 tópicos exigidos pelo GDD §15 (*simulation, collision, React/Pixi integration, lifecycle, persistence, contracts, cache, pending recovery*) já estão presentes. | Garantir cabeçalhos explícitos e referências cruzadas imediatas aos arquivos correspondentes em `src/`, com diagrama sinóptico de fluxo de dados. |
| **Arquitetura de Produção e Standalone Hosting** | Detalhes do empacotamento em `dist/`, ciclo de vida do Service Worker em produção e independência de servidores externos. | Consolidar a subseção de empacotamento de produção, isolamento de dados e política de zero dependências externas. |

---

## 3. Inventário de Ativos, Procedência e Auditoria de Licenças

### 3.1 Inventário de Arquivos do Repositório
O repositório contém 520 arquivos no diretório `assets/`, organizados nas seguintes categorias:
- `assets/png/`: 444 imagens (navios default e retina, partes de navios, tiles de terreno, ícones de interface e efeitos visuais).
- `assets/sounds/`: 27 efeitos sonoros em formato WAV PCM não compactado.
- `assets/spritesheet/`: 8 arquivos de spritesheets pré-gerados e metadados XML/JSON.
- `assets/tilesheet/`: 8 arquivos de tilesheets e XMLs associados.
- `assets/vector/`: 8 arquivos vetoriais SVG e XML.
- Raiz de assets: `ui_scene_background.png`, `preview.png`, `sample_*.png`.

### 3.2 Catálogo Efetivo de Execução (Runtime Footprint)
A aplicação em produção utiliza um subconjunto enxuto e estritamente auditado:
1. **Navios e Projéteis (4 texturas)**:
   - Jogador: `png/default/ships/ship_5.png` (66×113 px)
   - Chaser: `png/default/ships/ship_3.png` (66×113 px)
   - Shooter: `png/default/ships/ship_8.png` (66×113 px)
   - Bala de canhão: `png/default/ship_parts/cannon_ball.png` (10×10 px)
2. **Ambiente e Ilhas (16 texturas)**:
   - Água: `png/default/tiles/tile_73.png` (64×64 px)
   - Costas sólidas: `tile_6` a `tile_9`, `tile_22` a `tile_25`, `tile_54` a `tile_57` (64×64 px cada)
   - Decorações: `tile_49` (pedra), `tile_70` (folhagem), `tile_72` (palmeira)
3. **Efeitos Visuais de Combate (7 texturas)**:
   - Explosões: `explosion_1.png` (74×75), `explosion_2.png` (60×59), `explosion_3.png` (42×41)
   - Fogo/Flash: `fire_1.png` (18×39), `fire_2.png` (11×27)
   - Estilhaços de madeira: `wood_1.png` (15×7), `wood_2.png` (26×10), `wood_3.png` (15×10), `wood_4.png` (26×7)
4. **Interface e HUD (11 texturas)**:
   - Painel e Título: `panel_menu.png` (384×480), `title_pirate_battle.png` (384×128)
   - Botões Menu: `button_primary_normal/hover/pressed/disabled.png`, `button_secondary_normal/pressed.png`
   - HUD e Controles: `icon_fire_front.png`, `icon_fire_left.png`, `icon_fire_right.png`, `icon_forward.png`, `icon_pause.png`, `button_round_normal/hover/pressed.png`, `health_frame.png`, `health_fill_green.png`
   - Fundo do Menu: `ui_scene_background.png` (918×515)
5. **Áudio (27 clipes WAV)**:
   - Todos os 27 arquivos catalogados em `src/audio/audioManifest.ts` (navegação, tiros, impactos, destruição, feedback de interface e sentinelas de aviso).

### 3.3 Auditoria de Licenças e Procedência (GDD §15 e §16)
Conforme explicitado na diretriz central do GDD §15:
> *"Licença sem comprovação continua pendente e não é presumida."*

| Categoria do Ativo | Fonte / Origem | Documentação Fornecida | Status Legal | Observações |
|---|---|---|---|---|
| **Imagens PNG e Sprites** (`assets/png/`) | Desafio / Repositório inicial | Nenhuma (sem arquivo LICENSE nos assets) | **PENDENTE (Licença de terceiros)** | Não pode ser presumida CC0 ou MIT sem termo formal do autor. |
| **Áudio WAV** (`assets/sounds/`) | Desafio / Repositório inicial | Nenhuma (sem metadados de licença) | **PENDENTE (Licença de terceiros)** | Sons originais do kit do desafio sem termos documentados. |
| **Barras de Vida e Anéis de Água** | Código-fonte (`src/render/`) | Gerado via PixiJS Graphics procedural | **LIBERADO (Código próprio)** | Geometria vetorial gerada dinamicamente em tempo de execução. |
| **Efeitos de Partículas e Pools** | Código-fonte (`src/render/`) | Gerado via pools em memória | **LIBERADO (Código próprio)** | Alocação controlada e reciclagem autoral. |
| **Bibliotecas de Software** (`package.json`) | NPM Registry | Pinned com package-lock.json | **LIBERADO (MIT / Apache-2.0)** | React (MIT), PixiJS (MIT), TanStack Query (MIT), Axios (MIT), MSW (MIT), Vite/Vitest (MIT), Playwright (Apache-2.0). |

**Conclusão da Auditoria de Ativos**: `ASSET_CREDITS.md` já expõe a ausência de licença documentada para os assets fornecidos. Na change 16, este arquivo será complementado para detalhar formalmente a tabela de procedência, explicitando que os assets proprietários do desafio permanecem com status pendente de homologação pelo detentor dos direitos autorais antes de qualquer distribuição pública comercial.

---

## 4. Pacote de Produção, Build e Hospedagem Standalone

### 4.1 Processo de Build e Artefatos
O processo de build foi testado e validado via:
```powershell
$env:PATH = 'C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1;' + $env:PATH
npm.cmd run build
```
O build realiza em sequência:
1. `typecheck`: `tsc -p tsconfig.json && tsc -p tsconfig.core.json` (0 erros de tipagem, validação estrita sem DOM no core).
2. `vite build`: Transforma 943 módulos e gera o diretório otimizado `dist/`.

### 4.2 Inspeção do Diretório `dist/`
- `dist/index.html` (1.38 kB)
- `dist/mockServiceWorker.js` (12.75 kB, copiado de `public/`)
- `dist/assets/index-*.css` (18.83 kB / 4.73 kB gzip)
- `dist/assets/index-*.js` (735.21 kB / 241.19 kB gzip)
- `dist/assets/browser-*.js` (PixiJS e dependências do renderer: 399 kB)
- Mídias (PNGs e WAVs) com hash fingerprinted em `dist/assets/`.

### 4.3 Teste do Servidor de Preview com MSW
Executou-se `npm.cmd run preview -- --port 4173 --strictPort` e verificou-se:
- `http://127.0.0.1:4173/` retorna status `200 OK` servindo o `index.html`.
- `http://127.0.0.1:4173/mockServiceWorker.js` retorna status `200 OK` com o script do worker do MSW 3.x intacto.
- O worker intercepta as chamadas locais da API REST (`/api/ranking`, `/api/players/:playerId/matches`, `/api/matches`).

### 4.4 Roteamento, Entrada Direta e Refresh
- A aplicação é uma Single Page Application (SPA).
- Não há rotas HTML5 dependentes de servidor (não há pushState de subdiretórios que exijam reescrita de rotas em servidores estáticos).
- Entradas diretas com parâmetros de consulta (`/?networkScenario=offline`, `/?combatScenario=targets`, `/?geometry=1`) funcionam sem intervenção do servidor, sendo interpretadas diretamente no carregamento inicial da aplicação.
- O refresh da página em qualquer tela (Menu, Combate, Pause, Resultados) recarrega a aplicação limpamente, abandonando a sessão ativa em caso de combate não finalizado e preservando os resultados e opções já salvos em LocalStorage.

### 4.5 Auditoria de Credenciais e Serviços Pagos
- Nenhum arquivo `.env` ou variável de ambiente com segredos no repositório.
- Nenhuma dependência de APIs remotas, bancos de dados externos, serviços de analytics pagos ou provedores de nuvem.
- Toda a persistência é gerenciada em LocalStorage local (`pirate-battle.*.v1`) com fallback automático para store em memória em caso de cotas esgotadas ou ambientes com restrição de privacidade.

---

## 5. Matriz de Entregáveis da Seção 15 do GDD

A Seção 15 do GDD define a régua formal de marcos e condições de saída do projeto. Abaixo, apresenta-se o quadro comparativo auditado:

| Marco (Milestone) | Condição de Saída (Exit Condition) | Status | Detalhamento da Evidência |
|---|---|---|---|
| **1. Foundation and assets** | Typed settings, loading/retry, React/Pixi lifecycle, visible arena | **VALIDADO** | `src/domain/config.ts` (arena-v2/balance-v1), `src/render/assetCache.ts`, `tests/config.test.ts`, `tests/loadingAttempt.test.ts`, `tests/previewOwner.test.ts`. 0 vazamentos de recursos no unmount. |
| **2. Playable loop** | Player controls, three weapons, collisions, both enemies, scoring, end/replay | **VALIDADO** | Controles Q/W/E/R, colisões contínuas contra costas e navios, IA do Chaser e Shooter com perseguição/kiting e LoS, fim de partida por tempo ou afundamento, replay com seeds determinísticas (`tests/combat.test.ts`, `tests/enemies.test.ts`, `tests/lifecycle.test.ts`). |
| **3. Experience** | Menus, touch, pause/focus handling, feedback, accessibility, persistence | **VALIDADO** | Menus WAI-ARIA com navegação por teclado e foco visível, controles touch multitouch com joypad e botões >= 44px, pausa automática por blur/hidden/Esc, áudio Web Audio com 27 efeitos, feedback visual de fogo/estilhaços, persistência em LocalStorage (`tests/touch.test.ts`, `tests/optionsDraft.test.ts`, `tests/audio.test.ts`). |
| **4. Data reliability** | MSW, contracts, paginated tabs, idempotent registration, persistent outbox, failure scenarios | **VALIDADO** | MSW 3.x com 12 cenários de rede, contratos REST tipados (`tests/contracts.test.ts`), abas paginadas de Ranking e Histórico com TanStack Query (`tests/rankingHistory.test.ts`), outbox resiliente com backoff exponencial e retry idempotente (`tests/outbox.test.ts`). |
| **5. Delivery validation** | E2E, visual baselines, performance evidence, documentation, public deployment | **PARCIALMENTE VALIDADO** | - **E2E & Baselines**: 9 suítes completas Playwright cobrindo desktop e mobile, baselines de regressão visual validados (**VALIDADO**).<br>- **Performance**: Benchmark de 10.800 ticks com CPU < 0.32ms e p95 frame time < 20ms (**VALIDADO**).<br>- **Documentação**: README e ARCHITECTURE completos em inglês (**VALIDADO com refinamento em curso**).<br>- **Public deployment**: Pacote pronto em `dist/`, mas URL pública externa está **PENDENTE (Dependência externa)** por falta de credenciais/destino autorizados no runbook. |

### Bloqueios Concretos de Entrega Identificados
1. **Destino de Hospedagem / URL Pública**:
   - Conforme instrução expressa no runbook `project/automation.md` e prompt do Incremento 16: *"Não publique durante esta preparação: deixe o pacote pronto e informe bloqueios concretos de entrega."*
   - O repositório não possui credenciais de nuvem, token de deploy ou configuração de repositório remoto para GitHub Pages / Vercel / Netlify. Este item permanece registrado como dependência externa para o Incremento 17.
2. **Comprovação de Licença de Assets de Terceiros**:
   - Os arquivos de arte e áudio fornecidos pelo desafio carecem de licença escrita explícita. Mantidos formalmente como pendentes de cessão de direitos pelo organizador do desafio para fins de distribuição comercial.

---

## 6. Planejamento da Change `prepare-game-release`

### 6.1 Nova Especificação: `release-preparation`
Será criada a especificação `openspec/specs/release-preparation/spec.md` cobrindo os seguintes requisitos normativos:
- **Requirement 1 (Comprehensive Setup and Verification Documentation)**: O repositório DEVE fornecer `README.md` e `ARCHITECTURE.md` em inglês limpo, com passos reproduzíveis de instalação (`npm ci`), execução (`dev`), build (`build`), preview de produção (`preview`), suítes de testes unitários (`test`) e testes ponta a ponta (`e2e`), detalhando contingências para Windows PowerShell.
- **Requirement 2 (Operational Network and Failure Reproduction Guide)**: O `README.md` DEVE documentar a matriz operacional dos 12 cenários de rede do MSW com parâmetros de consulta diretos (`?networkScenario=...`), métodos de reset e cenários de falha induzida (asset failure, corrupção de storage, retries de outbox).
- **Requirement 3 (Asset Provenance and License Disclosure)**: O arquivo `ASSET_CREDITS.md` DEVE inventariar todos os 520 arquivos de assets e o subconjunto de 33 imagens e 27 áudios de runtime, atestando estritamente que licenças não comprovadas permanecem pendentes e não são presumidas, em conformidade com o GDD §15.
- **Requirement 4 (Self-Contained Production Package and Hosting Readiness)**: O pacote gerado em `dist/` DEVE ser totalmente autossuficiente, com `index.html`, `mockServiceWorker.js` e assets estáticos, sem dependências de serviços externos pagos ou segredos de ambiente, pronto para publicação imediata quando um destino for configurado.
- **Requirement 5 (Delivery Sequence and Milestone Audit Matrix)**: O relatório final DEVE conter a correspondência formal entre o código-fonte, build, relatórios de testes e os 5 marcos da Seção 15 do GDD, distinguindo inequivocamente itens Entregues, Validados e Pendentes.

### 6.2 Estrutura de Tarefas em `tasks.md` para a Fase Propose
O arquivo `tasks.md` da change será dividido em 4 grupos estruturados:

1. **Grupo 1: Refinamento Documental e Higienização de Codificação**
   - Corrigir todos os caracteres corrompidos (mojibake) em `README.md` e `ARCHITECTURE.md`.
   - Adicionar notas de execução de ambiente Windows (`npm.cmd` vs `npm.ps1`).
   - Adicionar tabela detalhada de reprodução dos 12 cenários de rede via URL query parameters.
   - Adicionar guia de reprodução de falhas (assets, outbox e storage).
2. **Grupo 2: Finalização dos Créditos e Matriz de Licenças**
   - Atualizar e expandir `ASSET_CREDITS.md` com a catalogação completa de todos os 520 arquivos de assets e do subconjunto ativo de runtime.
   - Declarar explicitamente a situação legal dos assets do desafio (licença de terceiros pendente de comprovação formal, sem presunções).
   - Documentar licenças de código autoral (Pixi Graphics, procedural) e dependências OSS (MIT/Apache).
3. **Grupo 3: Validação do Pacote de Produção e Teste Automatizado de Release**
   - Criar teste automatizado de integridade de release (`tests/releasePackage.test.ts`) verificando:
     - Presença e integridade de `dist/index.html` e `dist/mockServiceWorker.js`.
     - Ausência de segredos, variáveis `.env` ou URLs externas não autorizadas no build.
     - Ajustar eventual sensibilidade de tempo no teste `tests/outbox.test.ts` (linha 197) para garantir estabilidade absoluta sob carga pesada de CPU.
   - Validar execução de `preview` servindo localmente em `http://127.0.0.1:4173`.
4. **Grupo 4: Matriz de Entregáveis e Relatório de Auditoria**
   - Consolidar a matriz formal de marcos do GDD §15 no relatório de entrega.
   - Auditar paridade entre a versão do código (`0.1.0`), o build gerado e as evidências de teste preservadas.

---

## 7. Próximos Passos (Handoff para Fase Propose)

1. O orquestrador iniciará o subagente para a fase `propose` com o comando:
   ```text
   openspec propose prepare-game-release
   ```
2. A fase `propose` criará os artefatos da change em `openspec/changes/prepare-game-release/`:
   - `proposal.md`
   - `specs/release-preparation/spec.md`
   - `design.md`
   - `tasks.md`
3. A fase `apply` implementará as melhorias documentais, a higienização de codificação, o refinamento de `ASSET_CREDITS.md` e os testes de integridade do pacote de release, deixando o repositório pronto para validação e auditoria final.
