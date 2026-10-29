# Proposal

## Why

O Pirate Battle 2D possui ampla cobertura de testes unitários e de integração de subsistemas isolados, porém carece de uma verificação integrada de ponta a ponta (E2E) e de uma suíte formal de regressão visual que garantam a integridade dos fluxos regulamentares do jogo conforme estipulado na Seção 14 do Game Design Document (GDD).

Esta mudança introduz a infraestrutura oficial de testes E2E com Playwright em perfis Desktop e Mobile emulado, assegura baselines visuais versionadas para telas-chave sob sementes determinísticas e valida a jornada do jogador cobrindo controles simultâneos, física de ilha com sliding tangencial, combate atômico, prioridade estrita de morte sobre tempo e o ciclo completo de dados (Outbox/REST/Ranking).

## What Changes

- Configuração de projetos dedicados no Playwright: `desktop-chrome` (1280x900) e `mobile-chrome` (390x844 touch) com viewport e touch nativo.
- Redirecionamento da geração de relatórios HTML e traces em caso de falha (`retain-on-failure`) para a pasta de evidências do Incremento 14.
- Criação de utilitários determinísticos para E2E: injeção de CSS para desativação de animações e transições, isolamento estrito de storage/cookies e congelamento de clock/seed (`?seed=424242`).
- Implementação de suíte de regressão visual com 6 baselines versionadas (`toHaveScreenshot`): Menu Principal (desktop/mobile/foco teclado), Batalha pausada e HUD mobile, Diálogo de Opções e Tela de Resultado.
- Implementação de suíte de jornada integrada (`integrated-journey.spec.ts`) cobrindo:
  - Navegação e disparo simultâneo de baterias (Q frontal, W bombordo, E boreste) com cooldowns independentes e auto-sail sem auto-repeat;
  - Colisão tangencial contra ilhas com deslizamento suave (sliding), sem atravessar costa e sem dano ao casco;
  - Combate e destruição atômica de Chasers/Shooters com pontuação única (+1 por navio);
  - Ciclo de vida com desempate estrito: morte letal no último tick prevalece incondicionalmente sobre tempo esgotado (`player_destroyed` vence `time_expired`);
  - Abandono de partida em pausa que descarta o resultado sem poluir `Last Result` e sem enfileirar itens na Outbox;
  - Resiliência touch mobile a eventos de `pointercancel` sem travar direção ou disparar comandos espúrios;
  - Ciclo ponta a ponta de dados: término de partida -> persistência local -> disparo Outbox via MSW -> reflexão imediata nas abas de Ranking e Histórico.
- Criação da nova especificação `end-to-end-verification`.

## Capabilities

### New Capabilities
- `end-to-end-verification`: Especifica a infraestrutura de verificação ponta a ponta, os requisitos de execução multi-plataforma (Desktop/Mobile), as baselines visuais determinísticas, a cobertura integrada da matriz de aceite da Seção 14 do GDD e a rastreabilidade via relatórios HTML e traces.

### Modified Capabilities

## Impact

- **Testes & Ferramental**: `playwright.config.ts`, `tests/e2e/helpers/`, novas suítes em `tests/e2e/visual-regression.spec.ts` e `tests/e2e/integrated-journey.spec.ts`, baselines de snapshots em `tests/e2e/__snapshots__/` (ou `tests/e2e/visual-regression.spec.ts-snapshots/`).
- **Automação & Relatórios**: Geração de artefatos de saída do Playwright em `project/automation-reports/14-validate-game-end-to-end/playwright-report` e `test-results`.
- **Compatibilidade**: Nenhuma API pública ou código de produção em `src/` sofre alteração funcional que quebre compatibilidade; a mudança foca estritamente em garantia da qualidade, validação de conformidade e testes.
