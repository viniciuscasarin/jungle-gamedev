# Proposal

## Why

O Game Design Document (GDD §§14–16) estipula requisitos mandatórios de profiling de desempenho, governança de ciclo de vida de recursos e calibração fina de jogabilidade antes do encerramento da produção. É necessário assegurar que o jogo sustente 60 FPS com percentil p95 de frame time inferior a 20.0ms em sessões completas de 180 segundos em build otimizado de referência, além de tolerar cenários extremos de estresse com spawns a cada 1.0s sem acúmulo patológico de backlog ou degradação visual.

Adicionalmente, sessões sucessivas de jogo e recarregamento não podem apresentar vazamentos de memória (memory leaks) ou listeners órfãos após 5 ciclos completos, e os gargalos de Minor GC provocados pela contínua alocação e destruição de sprites/partículas PixiJS precisam ser mitigados via object pooling. No aspecto de gameplay, é crucial verificar empiricamente a viabilidade competitiva do canhão frontal versus broadsides e a jogabilidade em controles touch versus desktop sob versionamento estável de balanceamento.

## What Changes

- **Orçamentos de Desempenho e Profiling**: Estabelecimento de orçamentos rígidos de taxa de quadros (meta de 60 FPS, p95 < 20.0ms ao longo de 180s) e testes de estresse de spawn acelerado (1.0s) com teto geométrico e descarte limpo sem acúmulo de backlog (`accumulateBacklog: false`).
- **Object Pooling no Renderizador**: Introdução de política formal de reaproveitamento de instâncias e sprites efêmeros (projéteis de canhão em `pixiPreview.ts` e partículas/textos de impacto em `battleEffects.ts`), substituindo a rotina de criação/destruição contínua por pooling com ativação/desativação de visibilidade e reset de estado.
- **Auditoria de Recursos e Ausência de Vazamentos em 5 Ciclos**: Verificação formal de cleanup em 5 ciclos completos de partida (`Start -> Play -> Exit -> Restart`), garantindo delta zero em instâncias PixiJS ativas, observadores de tela, event listeners e loops de Web Audio, mantendo retenção de heap estável após coleta de lixo.
- **Versionamento Estável de Balanceamento**: Formalização do versionamento explícito de balanceamento de combate (`balance-v1`, `balance-v2`) e preservação determinística da chave canônica (`configurationKey`), permitindo ajustes calibrados de cadência e projéteis sem corromper o histórico e o ranking.
- **Harness de Benchmark Automatizado**: Criação de suíte de medição automatizada em duas frentes (benchmark headless de CPU para 10.800 ticks e profiler Playwright E2E em build otimizado com telemetria de frame times via Performance API e inspeção de heap via Chrome DevTools Protocol).

## Capabilities

### New Capabilities
- `performance-budgets`: Estabelece os orçamentos quantitativos normativos de desempenho (60 FPS, p95 < 20.0ms em 180s, estresse de 1.0s), ausência de vazamento de recursos em 5 ciclos sucessivos e telemetria de profiling automatizado em ambiente de referência documentado.

### Modified Capabilities
- `arena-rendering`: Atualiza a gestão do ciclo de vida de entidades dinâmicas (projéteis e partículas visuais de combate) para exigir object pooling e reutilização de instâncias, eliminando o GC thrashing decorrente da destruição frequente de nós PixiJS.
- `game-configuration`: Formaliza o suporte a versões de balanceamento de combate (`balanceVersion`) com rastreabilidade na chave canônica (`configurationKey`), garantindo afinações empíricas auditáveis entre armas e controles.

## Impact

- **Código de Renderização**: `src/rendering/pixiPreview.ts` e `src/rendering/battleEffects.ts` adotam object pools para projéteis e partículas, com reset determinístico de visibilidade e propriedades de transformação.
- **Código de Configuração e Simulação**: `src/domain/config.ts` consolida versionamento estável de balanceamento; o loop interno de simulação mitiga clonagens profundas redundantes em passos intermediários sem perda de imutabilidade externa.
- **Testes e Benchmarks**: Novos testes automatizados e suítes de profiling (`tests/simulation-benchmark.test.ts` e `tests/e2e/performance-profile.spec.ts`) integrados aos scripts de verificação para medição contínua de frame intervals e integridade de heap via CDP.
- **Dependências e Ferramentas**: Utilização de Playwright com Chromium CDP e APIs nativas de alta resolução (`performance.now()`, `process.hrtime.bigint()`).
