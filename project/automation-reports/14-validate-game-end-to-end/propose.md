# Propose — validate-game-end-to-end (Incremento 14)

Concluído em 28/10/2026 por `/root/i14_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seção 14 ("Acceptance, verification matrix and playtesting guidelines": execução de fluxos principais em Chromium desktop e mobile, versionamento de baselines visuais para menu, batalha seeded estável e resultado, isolamento estrito de storage e fixtures em cada teste, observação de controles reais e colisões/renderização física em vez de pontuações artificiais, publicação de relatórios HTML e traces para falhas) e Seções 4 a 13 (Options, Assets, Navigation, Combat, Enemies, Lifecycle, Pause, Persistence, Touch/UI, Data, Consistency e Resource Lifecycle).
  - `project/automation-reports/14-validate-game-end-to-end/explore.md`: Diagnóstico arquitetural consolidado da suíte Playwright atual, auditoria de cobertura dos 12 tópicos da matriz de aceite do GDD, identificação de ausência de asserções visuais `toHaveScreenshot()`, carência de projeto dedicado mobile touch e caminhos obsoletos de relatórios.
  - `openspec/config.yaml`: Schema `spec-driven` e conformidade com idioma pt-BR (com cabeçalhos e termos normativos SHALL/MUST em inglês).
- **Inventário de Capacidades e Specs Existentes**:
  - Avaliação das 19 specs existentes em `openspec/specs/`, alinhando a cobertura de verificação ponta a ponta e formalizando a nova especificação regulamentar `end-to-end-verification`.

## 2. Artefatos Criados

A change `validate-game-end-to-end` foi criada em `openspec/changes/validate-game-end-to-end/` sob o schema `spec-driven`, contemplando todos os artefatos de planejamento exigidos:

1. **`proposal.md`**:
   - Motivação estruturada na necessidade de unificar e validar o jogo sob as exigências regulamentares da Seção 14 do GDD, implementando testes E2E multi-plataforma e regressão visual com baselines versionadas.
   - Escopo detalhado das alterações: configuração de perfis Desktop e Mobile Chrome no Playwright, redirecionamento dos relatórios e traces para a pasta do Incremento 14, utilitários de isolamento e determinismo visual, suíte de regressão visual com 6 baselines e suíte de jornada integrada cobrindo controles simultâneos, colisão com ilhas, combate atômico, prioridade estrita de término por morte e ciclo de dados completo.
   - Declaração explícita da nova capability: `end-to-end-verification`.

2. **Delta Specs em `specs/`**:
   - `specs/end-to-end-verification/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 11 requisitos canônicos normativos com descrições concisas (<= 500 caracteres) e cenários `WHEN/THEN` formatados com exatamente 4 hashtags (`####`):
     - `Requirement: Execução de testes Playwright multi-plataforma`: execução em Chromium Desktop (1280x900) e Mobile Chrome emulado (390x844 touch) com isolamento rigoroso de storage, cookies e fixtures.
     - `Requirement: Regressão visual determinística com baselines versionadas`: comparação visual via `toHaveScreenshot` com animações CSS desativadas, tolerância pixelar controlada e sementes fixas.
     - `Requirement: Verificação de controles e combate simultâneo`: disparo concorrente de Q frontal, W bombordo e E boreste em movimento com auto-sail ligado e cooldowns independentes no HUD.
     - `Requirement: Verificação de colisão tangencial com ilhas`: comprovação física de sliding contínuo contra costa sem redução de HP e sem travamento.
     - `Requirement: Destruição atômica de inimigos e pontuação única`: computação de dano combinado de broadside em alvo com atribuição atômica de exatamente +1 ao placar.
     - `Requirement: Término de partida com prioridade estrita de destruição`: prevalência incondicional de dano letal no último tick (`player_destroyed`) sobre esgotamento de tempo (`time_expired`).
     - `Requirement: Abandono seguro de partida sem efeitos colaterais`: descarte limpo de partida abandonada no menu de pausa sem gravação em `Last Result` e sem itens na Outbox.
     - `Requirement: Congelamento completo em pausa e perda de visibilidade`: interrupção imediata de simulação, cooldowns e auto-sail sob pausa manual, blur e aba oculta.
     - `Requirement: Ciclo de dados completo de partida a ranking e histórico`: conclusão de partida propagando via Outbox, confirmação MSW e sincronização das abas no menu.
     - `Requirement: Resiliência touch móvel a cancelamento de ponteiro`: neutralização imediata do controle analógico sob evento `pointercancel` sem engatar cruzeiro espúrio.
     - `Requirement: Relatórios HTML e retenção de traces em falhas`: publicação obrigatória de relatório Playwright em formato HTML e traces retidos em caso de falha (`retain-on-failure`).

3. **`design.md`**:
   - Decisões técnicas e arquiteturais detalhadas:
     - Matriz de cobertura exaustiva dos 12 tópicos da Seção 14 do GDD (Options, Assets, Navigation, Combat, Enemies, Lifecycle, Pause, Persistence, Touch/UI, Data, Consistency e Resource Lifecycle).
     - Configuração dos perfis `desktop-chrome` e `mobile-chrome` no `playwright.config.ts`, com redirecionamento de artefatos de saída para `project/automation-reports/14-validate-game-end-to-end/`.
     - Catálogo e estratégia de captura determinística para as 6 baselines visuais regulamentares (`main-menu-desktop`, `main-menu-mobile`, `main-menu-focused`, `battle-desktop-paused`, `battle-mobile-hud`, `result-screen-desktop`).
     - Arquitetura da suíte integrada `integrated-journey.spec.ts` cobrindo a jornada real do jogador através de controles e física sem injeção artificial de scores.
     - Análise de riscos e mitigações (prevenção de flakiness visual, balanceamento de tempo de execução multi-plataforma e sincronização da fila assíncrona com TanStack Query).

4. **`tasks.md`**:
   - 18 tarefas rastreáveis distribuídas em 5 grupos lógicos estruturados:
     - Grupo 1: Infraestrutura Playwright & Configuração Multi-Plataforma (3 tarefas: perfis de navegador, redirecionamento de relatórios e helpers determinísticos).
     - Grupo 2: Suíte de Regressão Visual Determinística (`visual-regression.spec.ts`) (6 tarefas: baselines do menu desktop/mobile/foco, batalha desktop/mobile, opções e resultado).
     - Grupo 3: Suíte de Jornada Ponta a Ponta Integrada (`integrated-journey.spec.ts`) (6 tarefas: controles simultâneos, sliding em ilhas, destruição atômica, desempate estrito morte vs tempo, abandono seguro e congelamento por pausa/blur).
     - Grupo 4: Resiliência Mobile Touch e Cenários Avançados de Rede (3 tarefas: resiliência a `pointercancel`, ciclo completo de dados e cenários MSW `commit-timeout` / `out-of-order`).
     - Grupo 5: Validação Integrada, Relatório HTML e Matriz de Rastreabilidade (3 tarefas: suíte completa Vitest/lint/typecheck, execução Playwright com relatórios e relatório `verify.md`).
   - Cada tarefa define explicitamente seus critérios e comandos de verificação.

## 3. Validação Estrita OpenSpec

Validações executadas via shell PowerShell com Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change validate-game-end-to-end --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate validate-game-end-to-end --strict` | 0 | Change `validate-game-end-to-end` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 20 itens validados com sucesso (19 specs + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `validate-game-end-to-end` referente ao Incremento 14 está concluído e estritamente validado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e acionar o executor da fase `apply` (`/root/i14_apply`) para iniciar a configuração da infraestrutura Playwright, implementação das suítes de regressão visual e jornada integrada, e geração do relatório final de verificação.
