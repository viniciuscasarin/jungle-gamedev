# Tasks

## 1. Infraestrutura de Telemetria e Benchmarks Automatizados

- [x] 1.1 Implementar suíte de benchmark headless de simulação para 10.800 ticks (180s virtuais) em `tests/simulation-benchmark.test.ts` medindo tempo por step, percentis (avg, p95) e entidades nos cenários padrão (3.0s) e estresse (1.0s), e verificar execução com `npm test tests/simulation-benchmark.test.ts`
- [x] 1.2 Implementar profiler automatizado de ponta a ponta no Playwright em `tests/e2e/performance-profile.spec.ts` com telemetria de frame times via Performance API e captura de métricas de heap via Chrome DevTools Protocol, e verificar execução básica em modo headless

## 2. Otimização de Garbage Collection e Alocações no Loop Quente

- [x] 2.1 Refatorar o avanço temporal interno da simulação em `src/simulation/engine.ts` para mitigar clonagens profundas recursivas (`immutableCopy`) e chamadas repetitivas a `Object.freeze` em ticks intermediários sem consumidores externos, e verificar determinismo com a suíte `tests/simulation.test.ts`
- [x] 2.2 Implementar Object Pooling de sprites de projéteis de canhão em `src/rendering/pixiPreview.ts` com alternância de visibilidade e reset de posição/rotação, eliminando o ciclo contínuo de instanciação e `sprite.destroy()`, e verificar com testes de renderizador
- [x] 2.3 Implementar Object Pooling para partículas de detrito de madeira, clarões de canhão e indicadores flutuantes de pontuação em `src/rendering/battleEffects.ts`, reaproveitando nós PixiJS com reset de estado, e verificar com testes de efeitos de combate

## 3. Auditoria de Recursos e Ausência de Vazamento em 5 Ciclos

- [x] 3.1 Auditar e consolidar mecanismos de descarte de listeners de evento, aplicações PixiJS e loops de áudio Web Audio na transição de saída da arena para o menu, e verificar que `window.__arenaDiagnostics()` reporta rigorosamente zero recursos ativos
- [x] 3.2 Implementar validação automatizada de 5 ciclos completos de partida no Playwright (`tests/e2e/performance-profile.spec.ts`) medindo o heap de JavaScript após GC explícito via CDP, e verificar que não há crescimento progressivo sustentado entre os ciclos

## 4. Calibração de Balanceamento, Usabilidade e Versionamento Canônico

- [x] 4.1 Consolidar versionamento estável de balanceamento (`balance-v1`) em `src/domain/config.ts` incorporado deterministamente na derivação da chave canônica (`configurationKey`), e verificar integridade com `tests/config.test.ts` e testes de ranking
- [x] 4.2 Validar a ergonomia de combate em controles touch (alvos de toque ≥ 48px e telegraphs de alto contraste) e a dinâmica tática entre canhão frontal e broadsides, e verificar preservação de sliding suave em quinas de ilhas via testes existentes de navegação e touch

## 5. Execução Completa dos Testes de Profiling e Geração de Evidências

- [x] 5.1 Executar o benchmark headless de simulação e validar cumprimento das metas de tempo de CPU por tick (< 0.8ms) e estabilidade geométrica no cenário de estresse de 1.0s
- [x] 5.2 Executar o profiler E2E sobre o build de produção (`npm run preview`) e comprovar atendimento das metas de 60.0 FPS médio, p95 de frame time < 20.0ms e ausência de janks severos (> 33.3ms)
- [x] 5.3 Consolidar os dados quantitativos de medição com registro completo de ambiente de referência (SO, CPU, GPU, resolução, navegador e configurações) no relatório final de validação da change
