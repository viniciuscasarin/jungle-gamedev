# Tasks

## 1. Infraestrutura Playwright & Configuração Multi-Plataforma

- [x] 1.1 Atualizar `playwright.config.ts` adicionando os projetos `desktop-chrome` (1280x900) e `mobile-chrome` (390x844 com touch) e verificar a listagem via `npx playwright test --list`.
- [x] 1.2 Configurar os caminhos de saída de relatórios HTML (`outputFolder`) e traces/capturas de erro (`outputDir`) para `project/automation-reports/14-validate-game-end-to-end/` e verificar a resolução correta dos diretórios.
- [x] 1.3 Implementar utilitários de suporte E2E em `tests/e2e/helpers/` para isolamento de storage, desativação de animações CSS e sementes determinísticas e verificar funcionamento com teste rápido de carregamento.

## 2. Suíte de Regressão Visual Determinística (`visual-regression.spec.ts`)

- [x] 2.1 Implementar testes de baseline visual do Menu Principal em perfis desktop e mobile e verificar aprovação de `toHaveScreenshot` para `main-menu-desktop` e `main-menu-mobile`.
- [x] 2.2 Implementar teste de baseline visual do Menu Principal sob foco acessível de teclado (`Tab` no botão Play) e verificar aprovação de `toHaveScreenshot` para `main-menu-focused`.
- [x] 2.3 Implementar teste de baseline visual da Batalha estável seeded (`seed=424242&combatScenario=island`) em pausa e verificar aprovação de `toHaveScreenshot` para `battle-desktop-paused`.
- [x] 2.4 Implementar teste de baseline visual do HUD móvel com joypad e botões de ação e verificar aprovação de `toHaveScreenshot` para `battle-mobile-hud`.
- [x] 2.5 Implementar teste de baseline visual do diálogo modal de Opções e verificar aprovação de `toHaveScreenshot` para layout desktop e mobile.
- [x] 2.6 Implementar teste de baseline visual da Tela de Resultado de partida e verificar aprovação de `toHaveScreenshot` para `result-screen-desktop`.

## 3. Suíte de Jornada Ponta a Ponta Integrada (`integrated-journey.spec.ts`)

- [x] 3.1 Implementar teste de controles simultâneos operando Auto-sail (R sem auto-repeat) e disparo conjunto de baterias Q+W+E e verificar instanciacao de 7 projéteis e cooldowns independentes no HUD.
- [x] 3.2 Implementar teste de colisão oblíqua contra ilha e verificar que a física aplica deslizamento tangencial contínuo sem redução de HP e sem travamento do navio.
- [x] 3.3 Implementar teste de combate com destruição atômica de Chasers por salva múltipla e verificar que o placar incrementa exatamente +1 por embarcação destruída.
- [x] 3.4 Implementar teste de término de partida com regra estrita de prioridade (dano letal no último tick da simulação) e verificar que o resultado final reporta `player_destroyed` em vez de `time_expired`.
- [x] 3.5 Implementar teste de confirmação de abandono de partida no menu de pausa e verificar retorno ao menu sem persistência em `Last Result` e sem itens enfileirados na Outbox.
- [x] 3.6 Implementar teste de congelamento completo de simulação por pausa manual ('P' e Escape), blur e perda de foco de aba, verificando neutralização de auto-sail e ausência de catch-up de tempo.

## 4. Resiliência Mobile Touch e Cenários Avançados de Rede

- [x] 4.1 Implementar teste de manipulação de joypad virtual móvel com evento `pointercancel` e verificar liberação imediata do controle sem retenção de rumo ou ativação acidental de auto-sail.
- [x] 4.2 Implementar teste E2E de ciclo de dados completo (conclusão de partida -> persistência -> despacho Outbox via MSW -> retorno ao menu) e verificar sincronização imediata nas abas de Ranking e Histórico.
- [x] 4.3 Implementar testes de consistência de rede sob cenários MSW (`commit-timeout` com retry idempotente e `out-of-order` com descarte via AbortSignal) e verificar estabilidade da interface e da fila local.

## 5. Validação Integrada, Relatório HTML e Matriz de Rastreabilidade

- [x] 5.1 Executar a suíte de validação de tipagem, linter e testes unitários (`npm run typecheck`, `npm run lint`, `npm run test`) e verificar exit code 0 sem avisos impeditivos.
- [x] 5.2 Executar a suíte completa Playwright E2E nos perfis `desktop-chrome` e `mobile-chrome` e verificar geração do relatório HTML oficial e traces de depuração em `project/automation-reports/14-validate-game-end-to-end/`.
- [x] 5.3 Elaborar o relatório de verificação e a matriz de rastreabilidade completa dos 12 critérios da Seção 14 do GDD em `project/automation-reports/14-validate-game-end-to-end/verify.md`.
