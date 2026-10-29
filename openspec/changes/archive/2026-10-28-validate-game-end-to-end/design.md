# Design

## Context

O Pirate Battle 2D possui 24 suítes de testes unitários e de integração (337 testes no Vitest), além de testes E2E pontuais em `tests/e2e/`. Contudo, a Seção 14 do GDD exige a execução dos fluxos principais em Chromium desktop e mobile, o versionamento de baselines visuais sob sementes determinísticas, a observação física de controles e colisões reais na jornada do jogador, e a publicação de relatórios HTML e traces para falhas.

Veja `proposal.md` para motivação e escopo e `specs/end-to-end-verification/spec.md` para os requisitos normativos.

## Goals / Non-Goals

**Goals:**
- Configurar formalmente a infraestrutura multi-plataforma no Playwright (`desktop-chrome` e `mobile-chrome`).
- Estruturar a matriz de cobertura dos 12 critérios da Seção 14 do GDD confrontando requisitos, testes existentes e novos testes E2E.
- Implementar a suíte de regressão visual (`tests/e2e/visual-regression.spec.ts`) com 6 baselines versionadas sob semente determinística.
- Implementar a suíte de jornada integrada (`tests/e2e/integrated-journey.spec.ts`) validando controles simultâneos, física com sliding, combate atômico, término com prioridade de destruição, abandono sem outbox e ciclo de dados completo.
- Direcionar relatórios HTML e traces de falha (`retain-on-failure`) para `project/automation-reports/14-validate-game-end-to-end/`.

**Non-Goals:**
- Não reescrever nem alterar a lógica de simulação em `src/simulation/` ou renderização Pixi em `src/rendering/`.
- Não substituir os testes unitários rápidos do Vitest, mas sim complementá-los no nível de sistema com navegador real.
- Não executar testes em WebKit ou Firefox nesta fase (GDD §14 especifica explicitamente "Chromium desktop and mobile").

## Decisions

### Decisão 1: Matriz de Cobertura dos 12 Critérios da Seção 14 do GDD

A arquitetura de testes consolidada mapeia os 12 critérios da Seção 14:
1. **Options**: Validação de limites (60–180s, 1–10s spawn), Save/Cancel e baseline visual em desktop e mobile.
2. **Assets**: Loading visível, simulação de falha de asset e baseline da tela de retry/erro.
3. **Navigation**: Auto-sail (R) sem repeat, rotação com velocidade finita, steering com dead zone e sliding tangencial contra ilhas sem dano.
4. **Combat**: Disparo simultâneo Q+W+E em movimento, cooldowns independentes e verificação de projéteis ativos.
5. **Enemies**: Destruição atômica de Chasers e Shooters por salvas múltiplas com pontuação única (+1 por nau).
6. **Lifecycle**: Término por tempo e morte, com regra estrita de prioridade: dano fatal no último tick vence `time_expired`.
7. **Pause**: Pausa por tecla 'P'/Escape, foco contido (focus trap), congelamento de relógio e auto-sail Off forçado.
8. **Persistence**: Partida concluída gravada em `Last Result`; confirmação de abandono descartando resultado sem gravar nem enfileirar na Outbox.
9. **Touch / UI**: Layouts responsivos Desktop (HUD inferior) e Mobile (HUD superior e joypad), com resiliência a `pointercancel`.
10. **Data**: Ciclo completo ponta a ponta: partida -> Outbox -> interceptação MSW REST -> atualização síncrona de Ranking e Histórico.
11. **Consistency**: Resiliência da Outbox a cenários MSW (`commit-timeout` idempotente e `out-of-order` descartado).
12. **Resource Lifecycle**: Execução limpa sem vazamentos de listeners ou instâncias Pixi nos ciclos de navegação.

*Alternativas consideradas*: Confiar apenas nos testes unitários com jsdom; descartada porque o GDD §14 exige execução em navegador real e observação visual.

### Decisão 2: Infraestrutura Playwright Multi-Plataforma (`desktop-chrome` e `mobile-chrome`)

Reconfigurar `playwright.config.ts` com dois projetos principais:
- `desktop-chrome`: Viewport de 1280x900, emulando Chromium desktop padrão.
- `mobile-chrome`: Viewport de 390x844 (perfil Pixel 5), com flag `hasTouch: true` e `isMobile: true`.
- Ambos apontando para `baseURL: http://127.0.0.1:4173` (preview de produção) com webServer configurado.
- Saídas isoladas: `outputFolder` para relatórios HTML e `outputDir` para traces/evidências em `project/automation-reports/14-validate-game-end-to-end/`.

*Alternativas consideradas*: Rodar todos os testes apenas em desktop simulando touch via eventos de mouse; descartada pois touch emulado real do Playwright testa eventos nativos PointerEvent/TouchEvent.

### Decisão 3: Suíte de Regressão Visual com 6 Baselines Versionadas

Criar `tests/e2e/visual-regression.spec.ts` cobrindo 6 baselines canônicas:
1. `main-menu-desktop`: Menu Principal limpo em 1280x900.
2. `main-menu-mobile`: Menu Principal responsivo em 390x844.
3. `main-menu-focused`: Menu Principal com foco acessível via teclado (`Tab` no botão Play com anel `focus-visible`).
4. `battle-desktop-paused`: Arena Pixi sob semente fixa (`?seed=424242&combatScenario=island`) em pausa, exibindo canvas e HUD centralizado.
5. `battle-mobile-hud`: Arena Pixi em mobile exibindo HUD superior e controles virtuais de toque.
6. `result-screen-desktop`: Tela de resultado de partida terminada com métricas de tempo, placar e status `Recorded`.

*Estratégia de Estabilidade Visual*:
- Injeção de CSS em runtime via `page.addStyleTag()` desabilitando durações e delays de animações e transições (`animation-duration: 0s !important`, `transition-duration: 0s !important`).
- Uso de `animations: 'disabled'` no Playwright e tolerância calibrada (`maxDiffPixelRatio: 0.02`, `threshold: 0.2`).
- Relógio estático ou pausado (`page.clock`) e sementes RNG idênticas.

### Decisão 4: Suíte de Jornada Integrada End-to-End (`integrated-journey.spec.ts`)

A suíte unificada opera controles reais e observa comportamentos físicos e renderizados:
- **Controles e Combate**: Navega com 'R' e pressiona 'Q', 'W' e 'E' simultâneos; verifica 7 tiros no canvas e cooldowns desacoplados no DOM do HUD.
- **Física da Ilha**: Rumo oblíquo contra ilha; valida cálculo de sliding contínuo sem parada brusca e sem colisão de dano.
- **Pontuação Atômica**: Salva broadside completa atingindo um Chaser de 40 HP; valida que o score sobe exatamente +1 (sem duplicação por projéteis colidindo no mesmo tick).
- **Prioridade Estrita de Término**: Simulação de impacto letal no último tick da sessão; garante que o estado final reportado é `player_destroyed` (destruição do navio) em vez de `time_expired`.
- **Abandono Seguro**: Pausa -> Menu -> Confirmação "Abandon"; valida que nada é gravado em `pirate-battle.last-result.v1` nem enfileirado em `pirate-battle.outbox.v1`.
- **Ciclo de Dados com REST**: Fim de jogo com score -> Outbox processa POST com MSW -> retorno ao Menu Principal exibe a partida no topo do Histórico e reflete na tabela do Ranking.
- **Resiliência Mobile**: Emissão de evento de cancelamento (`pointercancel`) no analógico; garante neutralização do comando sem engatar cruzeiro acidental.

## Risks / Trade-offs

- [Flakiness em testes visuais devido a fontes de sistema ou rasterização de GPU] → Mitigação: Uso de tolerância `maxDiffPixelRatio: 0.02`, fontes pré-carregadas locais e injeção de CSS que zera animações e suavizações transitórias.
- [Tempo de execução aumentado por rodar em dois perfis desktop e mobile] → Mitigação: Suítes pesadas de estresse de 5 ciclos de Strict Mode permanecem concentradas em desktop, enquanto a jornada integrada e a regressão visual cobrem a matriz multi-plataforma.
- [Sincronia de eventos assíncronos no ciclo Outbox -> MSW -> TanStack Query] → Mitigação: Aguardar seletores semânticos do DOM (`status: Recorded`) e invalidar/refetch de queries garantindo renderização consistente no menu.

## Migration Plan

1. Assegurar que os relatórios e traces sejam exportados para o diretório isolado do Incremento 14 sem afetar execuções de CI existentes.
2. Adicionar as baselines visuais aos assets do repositório versionados pelo Git.
3. Não são necessárias migrações de banco de dados ou alterações de contrato com clientes externos.
