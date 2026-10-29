# Design

## Context

O Incremento 15 atende às exigências das seções 14, 15 e 16 do Game Design Document (GDD), relativas a orçamentos de desempenho, governança de ciclo de vida de recursos e calibração de jogabilidade. Em uma partida de 180 segundos a 60 FPS, o motor executa 10.800 ticks autoritativos e centenas de instâncias dinâmicas de projéteis, partículas de impacto, clarões e textos de pontuação são criadas e descartadas.

O diagnóstico técnico apontou dois focos de otimização de latência e consumo de CPU:
1. A rotina contínua de destruição e instanciação de `Sprite` do PixiJS para cada bala ou efeito visual gera pressão constante no V8 Garbage Collector, elevando o percentil p95 de frame time devido a pausas de Scavenger (Minor GC).
2. A invocação repetitiva de clonagem recursiva profunda (`immutableCopy` com `Object.freeze`) no ciclo interno de simulação a 60Hz introduz overhead desnecessário quando não há consumidores externos lendo o estado intermediário.

## Goals / Non-Goals

**Goals:**
- Assegurar taxa estável de 60 FPS com percentil p95 de latência de frame < 20.0ms em partidas de 180s em build otimizado de produção.
- Garantir robustez em teste de estresse com spawns a cada 1.0s, comprovando teto geométrico natural sem acúmulo de backlog (`accumulateBacklog: false`) e limitador de catch-up steps (≤ 5 por frame).
- Implementar Object Pooling para projéteis em `pixiPreview.ts` e partículas/efeitos em `battleEffects.ts`, reaproveitando instâncias visuais via alternância de visibilidade e reset de atributos.
- Validar ausência de vazamento de memória (heap estável pós-GC forçado via CDP) e descarte integral de instâncias PixiJS, listeners e loops de áudio após 5 ciclos completos de partida.
- Calibrar e documentar a relação tática entre canhão frontal e broadsides e a usabilidade em controles touch vs desktop sob versionamento estável de balanceamento (`balance-v1`).
- Fornecer suíte automatizada de medição composta por benchmark headless de CPU e profiler E2E no Chromium com telemetria de frame times e memória.

**Non-Goals:**
- Não alterar regras fundamentais de navegação inercial, modelo vetorial ou colisões contínuas por polígonos.
- Não introduzir dependências externas pesadas ou motores de física de terceiros.
- Não quebrar a compatibilidade da chave canônica (`configurationKey`) nem invalidar pontuações ou rankings históricos.
- Não prometer garantias irrealistas de 60 FPS em hardwares legados sem aceleração WebGL 2.0 (o foco é o ambiente de referência documentado).

## Decisions

### Decisão 1: Orçamentos Quantitativos de Desempenho e Metas de Frame Time
- **Decisão**: Adotar a meta de 60.0 FPS médio com percentil p95 de frame interval rigorosamente abaixo de 20.0ms ao longo de 180 segundos de combate contínuo em build de produção (`npm run preview`), além de zero quedas graves (> 33.3ms) em combate ativo.
- **Alternativas consideradas**:
  - *Monitorar apenas FPS médio*: Rejeitada porque médias mascaram micro-stutters e picos de GC que comprometem a fluidez tátil em jogos de ação reflexiva.
  - *Impor teto rígido de 16.6ms no p99*: Rejeitada por excesso de fragilidade em testes de navegador com eventuais ruídos do compositor do sistema operacional.

### Decisão 2: Object Pooling de Sprites de Projéteis e Efeitos Visuais
- **Decisão**: Criar pools dedicados e leves para projéteis (`CannonballSpritePool`) e efeitos em `battleEffects.ts` (partículas de madeira, flashes de canhão e textos flutuantes de score). O pool pré-aloca ou expande sob demanda nós visuais, associando-os à árvore de exibição uma única vez e alternando `visible = true/false` com reset de posição, alfa e escala.
- **Alternativas consideradas**:
  - *Destruição e recriação dinâmica contínua (`sprite.destroy()`)*: Abordagem legada que induz fragmentação de memória e picos de GC.
  - *Pool global monolítico compartilhado*: Rejeitada por acoplar domínios visuais distintos; pools modulares locais mantêm isolamento claro de ciclo de vida.

### Decisão 3: Mitigação de Alocações Excessivas no Loop Interno da Simulação
- **Decisão**: Preservar a garantia imutável na borda pública da simulação (`inspect()`), otimizando o avanço interno entre ticks para não executar `immutableCopy` recursivo com `Object.freeze` quando nenhum leitor externo solicitar o snapshot intermediário.
- **Alternativas consideradas**:
  - *Mutabilidade irrestrita exposta*: Rejeitada por quebrar contratos determinísticos e segurança de estado com React.
  - *Manter congelamento exaustivo a cada tick de 16.6ms*: Rejeitada devido ao impacto acumulado de alocação de objetos efêmeros.

### Decisão 4: Teste de Estresse de 1.0s com Robustez Geométrica
- **Decisão**: Manter o descarte natural de candidatos de spawn sem acúmulo de fila quando a arena estiver saturada (`accumulateBacklog: false`), validando que a simulação consome menos de 0.8ms de CPU por tick mesmo com dezenas de navios simultâneos, e garantindo que o acumulador temporal limite a compensação a no máximo 5 ticks por frame (`maxCatchUpStepsPerFrame = 5`).
- **Alternativas consideradas**:
  - *Cap artificial arbitrário de inimigos*: Rejeitada para respeitar a decisão de design do GDD de permitir estresse geométrico orgânico.

### Decisão 5: Auditoria de Recursos e Ausência de Leaks em 5 Ciclos
- **Decisão**: Executar uma suíte E2E automatizada no Playwright com CDP que realiza 5 transições consecutivas `Menu -> Jogo -> Partida Ativa -> Menu`. Após o quinto ciclo e coleta explícita de lixo (`HeapProfiler.collectGarbage`), o teste valida que:
  - Aplicações PixiJS, listeners do window/document e canvases retornam rigorosamente a 0.
  - Os loops de áudio Web Audio (`oceanAmbience`, `shipSailing`) são silenciados e liberados.
  - O heap de memória (`JSHeapUsedSize`) não apresenta taxa de crescimento descontrolada.
- **Alternativas consideradas**:
  - *Verificação manual por DevTools*: Rejeitada pela necessidade de assertividade determinística em CI.

### Decisão 6: Calibração de Jogabilidade e Versionamento Estável
- **Decisão**: Preservar os valores do balanceamento padrão identificados como `balance-v1`. Assegurar que os broadsides permaneçam viáveis através de feedback visual evidente e que a usabilidade em telas touch (portrait) mantenha botões com dimensões mínimas de 48×48px e alto contraste nos telegraphs de spawn. A chave canônica (`configurationKey`) incorpora `balanceVersion` de forma determinística, garantindo reprodutibilidade no ranking.
- **Alternativas consideradas**:
  - *Alterar números de balanceamento sem versionamento*: Rejeitada por invalidar resultados de corridas anteriores e quebrar a correspondência com a chave canônica.

## Risks / Trade-offs

- **[Variação de Desempenho entre Máquinas de Teste]** → O benchmark documenta formalmente o hardware, resolução, navegador e restrições do ambiente de referência, evitando alegações irreais de garantia universal em qualquer dispositivo móvel de baixo custo.
- **[Reuso de Estado em Object Pooling]** → Instâncias recicladas podem reter sujeira de rotação ou opacidade se não forem totalmente resetadas. Mitigado por uma rotina padronizada de `reset()` invocada imediatamente antes da devolução e na reativação.
- **[Coleta de Lixo Não-Determinística em Testes E2E]** → O teste de memória em Playwright força `HeapProfiler.collectGarbage` via sessão CDP antes de capturar as métricas de heap, garantindo leituras consistentes.
