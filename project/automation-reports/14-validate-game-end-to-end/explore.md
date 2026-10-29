# Explore — validate-game-end-to-end (Incremento 14)

**Data de conclusão:** 28/10/2026  
**Agente responsável:** `/root/i14_explore`  
**Modo de operação:** Exploração técnica, diagnóstico arquitetural, mapeamento da matriz de aceite do GDD e desenho preliminar de implementação (sem alterações em código de produto, `openspec/changes/` ou `project/automation-state.json`).

---

## 1. Resumo Executivo e Status da Exploração

O Incremento 14 tem como objetivo central auditar, planejar e estruturar a **Verificação Integrada de Ponta a Ponta (End-to-End) e a Suíte de Regressão Visual**, cumprindo integralmente as exigências da **Seção 14 do Game Design Document (GDD)** ("Acceptance and validation"):
> *"Execute main flows in Chromium desktop and mobile. Version visual baselines for the menu, a stable seeded battle state, and the result. Each test starts from isolated storage and fixtures. A test clock may advance the real simulation; combat tests must operate actual controls and observe actual collisions and rendering rather than directly granting kills or scores. Publish an HTML report and traces for failures."*

### Principais Descobertas e Decisões Técnicas da Exploração:
1. **Auditoria da Base Existente**:
   - A base atual possui 24 suítes de testes unitários/integração no Vitest (337 testes passando, cobrindo contratos, física, combate, IA, navegação, áudio, outbox, cenários MSW e ciclo de vida).
   - O Playwright já possui suítes pontuais em `tests/e2e/` (`arena.spec.ts`, `battle-feedback.spec.ts`, `network-scenarios.spec.ts`, `options.spec.ts`, `outbox.spec.ts`, `ranking-history.spec.ts`).
2. **Lacunas Críticas Identificadas**:
   - **Regressão Visual Ausente**: Não há nenhuma asserção `toHaveScreenshot()` no projeto; `arena.spec.ts` apenas grava capturas PNG ad-hoc em disco para evidência, sem comparação contra baselines versionadas.
   - **Projetos Playwright Desalinhados**: `playwright.config.ts` define apenas projetos `dev` e `preview`, ambos em viewport desktop (1280x900). Não há projetos declarados para Chromium Desktop vs Chromium Mobile emulado (com touch nativo e viewport móvel).
   - **Caminhos de Relatório Obsoletos**: O arquivo de configuração aponta saídas de relatórios HTML e traces para a pasta do Incremento 8 (`08-implement-responsive-hud-and-touch`).
   - **Jornada E2E Integrada Incompleta**: Falta uma suíte que unifique em um fluxo contínuo real: Play com seed determinística -> Controles e combate simultâneo (Q/W/E + R) -> Colisão oblíqua na ilha com sliding -> Eliminação atômica de inimigos com pontuação única -> Morte letal vs Término por tempo com prioridade estrita -> Gravação em Last Result -> Enfileiramento e despacho na Outbox -> Atualização síncrona das abas de Ranking e Histórico.
3. **Mecanismo de Determinismo Visual e Simulação**:
   - O suporte a `?seed=<uint32>`, `?combatScenario=island|empty|targets`, e `?networkScenario=<id>` já se encontra implementado no runtime (`sessionBoundary.ts` e `scenarios.ts`).
   - A combinação de `page.clock` do Playwright com sementes fixas e congelamento de animações transitórias CSS garante 100% de estabilidade para as capturas de tela comparativas.
4. **Definição de Especificação OpenSpec**:
   - Criar a nova especificação primária `end-to-end-verification` em `openspec/specs/end-to-end-verification/spec.md`.

---

## 2. Auditoria e Mapeamento da Matriz de Aceite do GDD (Seção 14)

A tabela a seguir confronta exaustivamente cada um dos 12 tópicos regulamentares da Matriz de Aceite da Seção 14 do GDD com os testes unitários e testes E2E existentes, identificando as evidências consolidadas e as lacunas que devem ser cobertas no Incremento 14:

| # | Área GDD §14 | Requisitos Regulamentares do GDD | Evidências Existentes (Unit / E2E) | Lacunas a Cobrir no Incremento 14 |
|---|---|---|---|---|
| 1 | **Options** | Validação de limites (60–180s sessão, 1–10s spawn), Save/Cancel, persistência pós-refresh, snapshot imutável na partida ativa. | `tests/config.test.ts`<br>`tests/optionsDraft.test.ts`<br>`tests/e2e/options.spec.ts` | Baseline visual de regressão do diálogo de Opções (Desktop e Mobile); validação visual de mensagens de erro inline. |
| 2 | **Assets** | Tela visível de loading, simulação de falha de carregamento, retry funcional sem refresh e cancelamento por Main Menu. | `tests/assetManifest.test.ts`<br>`tests/assetCache.test.ts`<br>`tests/loadingAttempt.test.ts`<br>`tests/e2e/arena.spec.ts:198-236` | Baseline visual do estado de Loading e da tela de erro com botão de Retry. |
| 3 | **Navigation** | R alterna na borda de descida de tecla (sem auto-repeat), mouse-follow com dead zone (12 un), velocidade finita de rotação, joypad mobile e cruzeiro, limites da arena, colisão com ilhas. | `tests/navigation.test.ts`<br>`tests/viewport.test.ts`<br>`tests/touch.test.ts`<br>`tests/e2e/arena.spec.ts:131-197` | Teste E2E de sliding tangencial em colisão oblíqua sem travamento e sem dano ao casco integrado na jornada do jogador. |
| 4 | **Combat** | Q frontal, W bombordo (3 tiros paralelos), E boreste (3 tiros paralelos); disparo e navegação simultâneos; cooldowns independentes; dano único; pontuação atômica (+1 por navio). | `tests/combat.test.ts`<br>`tests/e2e/arena.spec.ts:274-342` | Teste E2E integrado acionando Q+W+E e R simultâneos com inimigos reais em cena, garantindo ausência de duplicação de pontos por broadside no mesmo tick. |
| 5 | **Enemies** | Dois arquétipos (Chaser e Shooter), navegação contornando ilhas, safe spawns (fora de ilhas e ≥240 un do jogador), cadência configurada com alternância 50/50. | `tests/enemies.test.ts`<br>`tests/e2e/arena.spec.ts:363-417` | Validação na suíte unificada da chegada do Chaser com explosão de contato (dano 25, 0 pontos) e Shooter mantendo alcance de 240-300 un. |
| 6 | **Lifecycle** | Término por tempo (time_expired) ou morte (player_destroyed), congelamento terminal, replay limpo com novo matchId e reset completo de estado. | `tests/lifecycle.test.ts`<br>`tests/e2e/arena.spec.ts:418-474` | Validação E2E da **regra estrita de prioridade simultânea**: dano letal no último tick do timer deve resultar em `player_destroyed` (não `time_expired`). |
| 7 | **Pause** | Pausa manual (Escape / P / botão HUD), blur e hidden tab; congelamento de simulação, cooldowns, relógio e projéteis; desativação forçada de auto-sail; resume explícito. | `tests/lifecycle.test.ts`<br>`tests/audio.test.ts`<br>`tests/e2e/arena.spec.ts:157, 451`<br>`tests/e2e/battle-feedback.spec.ts` | Baseline visual do diálogo Paused com foco contido (Desktop e Mobile); validação de que tecla 'P' alterna/pausa com fidelidade idêntica a Escape. |
| 8 | **Persistence** | Last Result legível no menu, exclusão estrita de partidas abandonadas, recuperação de registros pendentes na outbox após reload. | `tests/storage.test.ts`<br>`tests/outbox.test.ts`<br>`tests/e2e/arena.spec.ts:418-450`<br>`tests/e2e/outbox.spec.ts` | Teste E2E de abandono via diálogo de confirmação certificando que a partida descartada não substitui o Last Result nem gera outbox. |
| 9 | **Touch / UI** | Ponteiros independentes joypad + ataques, pointercancel neutralizando toques, desktop com HUD inferior centralizado, mobile com HUD superior + controles laterais, resize sem reload. | `tests/touch.test.ts`<br>`tests/hud.test.ts`<br>`tests/e2e/arena.spec.ts:541-677` | Baselines visuais das variantes de HUD (Desktop Landscape vs Mobile Portrait); teste de cancelamento de ponteiro touch (`pointercancel`) sem disparar R acidentalmente. |
| 10 | **Data** | Paginação (10 itens/página), estados empty/loading/error/refresh, atualização de Ranking e Histórico após registro de partida. | `tests/api.test.ts`<br>`tests/rankingHistory.test.ts`<br>`tests/networkUi.test.ts`<br>`tests/e2e/ranking-history.spec.ts` | Teste E2E de ciclo de dados: partida terminada no canvas Pixi reflete instantaneamente em ambas as abas de Ranking e Histórico ao retornar ao menu. |
| 11 | **Consistency** | Resiliência a cenários de rede MSW: retry de commit-timeout sem duplicar registro, respostas lentas e fora de ordem descartadas sem corromper página ativa. | `tests/scenarios.test.ts`<br>`tests/outbox.test.ts`<br>`tests/e2e/network-scenarios.spec.ts`<br>`tests/e2e/outbox.spec.ts` | Testes E2E específicos exercitando os cenários `commit-timeout` (idempotência no POST) e `out-of-order` (descarte via AbortSignal no frontend). |
| 12 | **Resource Lifecycle** | Navegação repetida e Strict Mode (5 ciclos Menu -> Loading -> Arena -> Menu) sem vazamento de listeners, loops de animação ou instâncias Pixi. | `tests/previewOwner.test.ts`<br>`tests/resizeObserver.test.ts`<br>`tests/assetCache.test.ts`<br>`tests/e2e/arena.spec.ts:74-130` | Já coberto com excelência em `arena.spec.ts`; deve ser mantido na suíte global de validação sem regressões. |

---

## 3. Infraestrutura Playwright para E2E e Regressão Visual

### 3.1 Reconfiguração de `playwright.config.ts`

A configuração atual do Playwright em `playwright.config.ts` precisa ser refinada para atender a Seção 14 do GDD:
1. **Destino de Relatórios e Evidências**:
   - `outputFolder`: `project/automation-reports/14-validate-game-end-to-end/playwright-report`
   - `outputDir`: `project/automation-reports/14-validate-game-end-to-end/test-results`
2. **Estratégia de Traces e Screenshots**:
   - `trace: 'retain-on-failure'`: grava o trace completo para depuração em caso de falha.
   - `screenshot: 'only-on-failure'`: preserva a evidência em falhas sem poluir o disco em execuções verdes.
3. **Projetos Regulamentares (Desktop e Mobile)**:
   Em conformidade com o GDD §14 ("Execute main flows in Chromium desktop and mobile"):
   ```typescript
   projects: [
     {
       name: 'desktop-chrome',
       use: {
         ...devices['Desktop Chrome'],
         viewport: { width: 1280, height: 900 },
         baseURL: 'http://127.0.0.1:4173',
       },
     },
     {
       name: 'mobile-chrome',
       use: {
         ...devices['Pixel 5'],
         viewport: { width: 390, height: 844 },
         hasTouch: true,
         isMobile: true,
         baseURL: 'http://127.0.0.1:4173',
       },
     },
   ]
   ```
   *Nota de Eficiência:* Os testes exaustivos de estresse de 5 ciclos de Strict Mode de `arena.spec.ts` podem permanecer no projeto desktop principal para evitar duplicação desnecessária de tempo de execução, enquanto as suítes de jornada integrada e regressão visual executam em ambos os perfis.

### 3.2 Estratégia de Regressão Visual Determinística (`toHaveScreenshot`)

Para capturar e versionar baselines estáveis e livres de falso-positivos causados por anti-aliasing de GPU, fontes de sistema ou variações de subpixel:
1. **Desativação de Animações Transitórias**:
   - Injeção de CSS via `page.addStyleTag()`:
     ```css
     *, *::before, *::after {
       animation-duration: 0s !important;
       animation-delay: 0s !important;
       transition-duration: 0s !important;
       transition-delay: 0s !important;
       caret-color: transparent !important;
     }
     ```
   - Uso de `animations: 'disabled'` nas opções do `expect(page).toHaveScreenshot()`.
2. **Determinismo na Batalha PixiJS**:
   - Inicialização via URL parametrizada: `/?seed=424242&combatScenario=island`.
   - Utilização do `page.clock.pauseAt()` imediatamente ao carregar, garantindo que o canvas seja rasterizado no estado de tick 0 ou estado pausado estático, sem movimento de ondas, partículas ou timer descrescente.
3. **Identidade e Fixtures Determinísticas**:
   - Pré-população do `localStorage` via script de inicialização do teste com capitão determinístico (`Captain-Baseline`), garantindo que o nome do jogador e os registros no DOM sejam 100% idênticos entre execuções.
4. **Tolerância Calibrada**:
   - `maxDiffPixelRatio: 0.02` e `threshold: 0.2` para acomodar variações imperceptíveis de subpixel em renderizadores de canvas e fontes sem mascarar desvios reais de layout.

### 3.3 Catálogo das 6 Baselines Visuais Regulamentares

| Baseline ID | Tela / Componente | Dimensões | Condição de Captura | O que valida |
|---|---|---|---|---|
| `main-menu-desktop` | Main Menu | 1280 × 900 | Tela inicial limpa com dados canônicos | Título, layout dos botões Play/Options, abas de Ranking e controles de diagnóstico |
| `main-menu-mobile` | Main Menu | 390 × 844 | Viewport mobile vertical (Pixel 5) | Responsividade sem rolagem horizontal, botões de toque com ≥48px e tab de histórico |
| `main-menu-focused` | Main Menu | 1280 × 900 | Foco por teclado (`Tab`) no botão "Play" | Anel acessível de foco visível (`focus-visible`) e contraste estético |
| `battle-desktop-paused` | Arena + HUD Desktop | 1280 × 900 | Batalha seeded pausada (`seed=424242`) | Canvas Pixi renderizado, HUD inferior centralizado (HP + QWER), modal de Pausa com foco |
| `battle-mobile-hud` | Arena + HUD Mobile | 390 × 844 | Batalha seeded ativa (`seed=424242`) | HUD superior com barra de HP, joypad analógico inferior esquerdo e botões QWER à direita |
| `result-screen-desktop` | Tela de Resultado | 1280 × 900 | Partida concluída com score e tempo | Tipografia de resultado, métricas de score/tempo, status `Recorded` e botões de ação |

---

## 4. Detalhamento dos Casos de Teste Integrados End-to-End

A nova suíte `tests/e2e/integrated-journey.spec.ts` cobrirá os fluxos unificados do jogo utilizando controles reais e observação física, dividida em 5 tópicos fundamentais:

### 4.1 Controles, Disparo Simultâneo e Feedback de Cooldown
- **Cenário**: O jogador ativa Auto-sail (tecla 'R') e avança em velocidade nominal (150 un/s).
- **Ação**: Mantém pressionadas simultaneamente as teclas 'Q' (frontal), 'W' (bombordo) e 'E' (boreste).
- **Validação**:
  - Três projéteis paralelos são disparados para bombordo, três para boreste e um para frente.
  - O HUD reflete os estados de cooldown independentes: o canhão frontal exibe cooldown de 0.35s e recupera o status "Ready" muito antes das baterias laterais (1.20s).
  - Repetições de teclado (`auto-repeat`) na tecla 'R' são filtradas, mantendo o auto-sail ligado sem intermitência.

### 4.2 Colisões com Ilha, Combate e Pontuação Atômica Única
- **Cenário 1 (Sliding na Ilha)**: O navio navega em rumo oblíquo contra o contorno da ilha noroeste.
- **Validação**: A simulação física resolve a colisão aplicando deslizamento tangencial (`tangential sliding`). O navio não atravessa a linha de costa, não emperra em velocidade zero e não sofre dano de saúde (HP permanece 100).
- **Cenário 2 (Combate e Pontuação Única)**: Uma salva de bombordo (3 balas) atinge um Chaser com 40 de HP.
- **Validação**:
  - Ambas ou todas as três balas colidem na mesma janela temporal.
  - A primeira bala aplica dano, a subsequente consome a saúde restante provocando a destruição do navio.
  - A transição do inimigo de `alive` para `destroyed` é atômica: o score do jogador incrementa em exatamente **+1** (e não +2 ou +3).
  - Chaser destruído para imediatamente de se mover e colidir.

### 4.3 Ciclo de Vida: Limite de Tempo vs Morte com Prioridade Estrita
- **Cenário 1 (Fim por Tempo)**:
  - Partida roda até `remainingSeconds` atingir 0 com saúde do jogador > 0.
  - Tela de Result exibe "Time expired".
- **Cenário 2 (Fim por Destruição da Nau)**:
  - Chasers e tiros inimigos reduzem o HP do jogador a 0 antes do tempo esgotar.
  - Tela de Result exibe "Ship destroyed".
- **Cenário 3 (Regra de Prioridade Estrita Simultânea - GDD §6)**:
  - Simula-se dano letal exatamente no instante final da simulação (tick de tempo zero).
  - A asserção verifica que `player_destroyed` prevalece incondicionalmente sobre `time_expired`. O resultado gravado e renderizado informa "Ship destroyed".
- **Cenário 4 (Abandono de Partida)**:
  - Durante combate, o jogador clica em Pause -> Main Menu -> abre confirmação "Abandon this match?" -> clica em "Abandon".
  - O jogo retorna ao Main Menu. Valida-se que a partida abandonada NÃO foi persistida em `Last Result` e NÃO gerou itens na Outbox.

### 4.4 Pausa, Retomada e Tratamento de Foco
- **Cenário**: Durante navegação ativa com Auto-sail (R) ligado, o teste aciona perda de foco (`page.evaluate(() => window.dispatchEvent(new Event('blur')))` ou evento de visibilidade `document.visibilityState = 'hidden'`).
- **Validação**:
  - A simulação congela instantaneamente; auto-sail é forçado para "Off".
  - O diálogo modal "Paused" é exibido com foco preso (focus trap).
  - O teste avança o relógio virtual em 30 segundos; ao reativar a página, nenhuma aceleração ou catch-up ocorre.
  - O clique em "Resume" reabre a arena com o navio parado, exigindo nova ação do jogador para voltar a navegar.

### 4.5 Ciclo de Dados Ponta a Ponta: Partida -> Outbox -> REST -> Ranking/Histórico
- **Cenário**:
  1. O jogador inicia uma partida com opções canônicas (120s / 3.0s spawn).
  2. Destrói 2 inimigos obtendo score = 2 e aguarda o término.
  3. A tela de Result é exibida, gravando atomicamente em `pirate-battle.last-result.v1` e enfileirando na Outbox (`pirate-battle.outbox.v1`).
  4. O serviço de Outbox despacha a requisição HTTP `POST /api/matches` para o MSW.
  5. O status na tela de Result transiciona de `Recording…` para `Recorded`.
  6. O jogador clica em "Main Menu".
  7. Ambas as abas de Ranking e Histórico de Partidas são consultadas: a nova partida aparece no topo do Histórico do jogador e posicionada de acordo com as regras de desempate no Ranking global.

### 4.6 Resiliência Mobile Touch e Eventos `pointercancel`
- **Cenário**: No projeto mobile com toque emulado, o jogador manipula o joypad virtual e toca no botão de disparo.
- **Ação**: O navegador dispara um evento `pointercancel` no identificador do joypad (simulando interrupção do sistema operacional, como puxar a barra de notificações).
- **Validação**: O controle libera o toque cancelado imediatamente sem travar a direção do navio e sem disparar o toggle de auto-sail (R).

---

## 5. Especificações OpenSpec e Alterações Propostas

### 5.1 Nova Main Spec: `end-to-end-verification`
Criar a especificação `openspec/specs/end-to-end-verification/spec.md` cobrindo formalmente:
- **Requirement: Execução Playwright Multi-Plataforma**: Execução em Chromium Desktop (1280x900) e Mobile (390x844 touch) com isolamento rigoroso de cookies, storage e fixtures.
- **Requirement: Baselines Visuais e Tolerância**: Gestão de snapshots de referência (`toHaveScreenshot`) com desativação de animações CSS, tolerância pixelar controlada (max 2%) e proibição de atualizações automáticas que mascarem regressões.
- **Requirement: Jornada Integrada de Jogo e Ciclo de Dados**: Verificação de ponta a ponta dos subsistemas integrados (controles simultâneos, física de ilha, combate atômico, término com prioridade de morte, abandono limpo, persistência local e propagação na API mockada/telas).
- **Requirement: Relatórios e Rastreabilidade de Falhas**: Publicação obrigatória de relatório HTML do Playwright e captura de traces em falhas (`retain-on-failure`).

### 5.2 Delta Specs em Specs Existentes
- **`match-lifecycle`**: Adicionar cenário delta formalizando explicitamente a regra de prioridade simultânea em testes ponta a ponta (morte simultânea a time-up resultando estritamente em `player_destroyed`).
- **`responsive-hud`**: Adicionar cenário delta especificando a validação de baseline visual para os layouts desktop e mobile.

---

## 6. Planejamento das Tarefas para a Fase Propose (`tasks.md`)

Para a fase `propose` (change `validate-game-end-to-end`), a estrutura recomendada de grupos de tarefas é a seguinte:

### Grupo 1: Infraestrutura Playwright & Configuração Multi-Plataforma
- [ ] 1.1 Atualizar `playwright.config.ts` com projetos `desktop-chrome` e `mobile-chrome` (viewport e touch configurados).
- [ ] 1.2 Configurar caminhos de relatórios e traces para `project/automation-reports/14-validate-game-end-to-end/`.
- [ ] 1.3 Implementar utilitários de isolamento de storage, mock fixtures determinísticas e desativação de animações CSS em `tests/e2e/helpers/`.

### Grupo 2: Suíte de Regressão Visual Determinística (`visual-regression.spec.ts`)
- [ ] 2.1 Criar teste e capturar baseline visual do Main Menu em Desktop (1280x900) e Mobile (390x844).
- [ ] 2.2 Criar teste e capturar baseline visual com foco acessível via teclado (`focus-visible`).
- [ ] 2.3 Criar teste e capturar baseline visual da Batalha estável seeded (`seed=424242&combatScenario=island`) em Desktop e Mobile.
- [ ] 2.4 Criar teste e capturar baseline visual do diálogo de Pausa com focus trap e auto-sail Off.
- [ ] 2.5 Criar teste e capturar baseline visual da tela de Opções com limites e validações visuais.
- [ ] 2.6 Criar teste e capturar baseline visual da tela de Resultado com dados persistidos e status de entrega.

### Grupo 3: Suíte de Jornada Ponta a Ponta Integrada (`integrated-journey.spec.ts`)
- [ ] 3.1 Implementar testes de navegação e controles simultâneos: R toggle sem repeat, mouse steering com dead zone e disparo simultâneo Q+W+E em movimento.
- [ ] 3.2 Implementar testes de física e combate: colisão tangencial na ilha com sliding sem dano ao casco e destruição atômica de inimigos com pontuação única.
- [ ] 3.3 Implementar testes de ciclo de vida e término: fim por tempo (`time_expired`), fim por destruição (`player_destroyed`) e teste de prioridade simultânea no último tick.
- [ ] 3.4 Implementar teste de confirmação de abandono de partida garantindo ausência de gravação em Last Result e Outbox.
- [ ] 3.5 Implementar testes de pausa manual ('P'/Escape), blur e tab hidden, validando neutralização de comandos e retomada explícita.
- [ ] 3.6 Implementar teste de ciclo completo de dados: fim de partida -> Outbox -> REST mockado -> atualização de Ranking e Histórico.

### Grupo 4: Resiliência Mobile Touch e Cenários Avançados de Rede
- [ ] 4.1 Implementar teste de cancelamento de toque móvel (`pointercancel`) garantindo limpeza de comandos e integridade do auto-sail.
- [ ] 4.2 Implementar teste E2E do cenário de rede `commit-timeout` com recuperação da outbox sem duplicação de dados.
- [ ] 4.3 Implementar teste E2E do cenário de rede `out-of-order` comprovando descarte de requisições lentas obsoletas via AbortSignal.

### Grupo 5: Validação Integrada, Relatório HTML e Matriz de Rastreabilidade
- [ ] 5.1 Executar a suíte completa de testes unitários (`npm run test`), linter (`npm run lint`) e typecheck (`npm run typecheck`).
- [ ] 5.2 Executar a suíte completa Playwright E2E em ambos os projetos (`desktop-chrome` e `mobile-chrome`) gerando o relatório HTML oficial e traces.
- [ ] 5.3 Elaborar o relatório de verificação e a matriz de rastreabilidade completa em `project/automation-reports/14-validate-game-end-to-end/verify.md`.

---

## 7. Conclusão e Handoff para a Fase Propose

A fase de exploração do Incremento 14 concluiu com êxito todas as investigações necessárias. A arquitetura de testes e a infraestrutura do Playwright estão plenamente mapeadas, garantindo que a fase `propose` possa formalizar os artefatos OpenSpec (`proposal.md`, `design.md`, `tasks.md` e specs) com total alinhamento às exigências do GDD e do projeto de automação.
