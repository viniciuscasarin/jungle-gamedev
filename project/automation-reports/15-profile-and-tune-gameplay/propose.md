# Propose — profile-and-tune-gameplay (Incremento 15)

Concluído em 28/10/2026 por `/root/i15_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração de aplicação ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

---

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos do Game Design Document (GDD)**:
  - `GDD.md` Seção 14 ("Acceptance, verification matrix and playtesting guidelines"):
    - Meta de desempenho: 60 FPS estável em build otimizado de produção no ambiente de referência documentado.
    - Profiling de partida de 3 minutos (180 segundos), registrando FPS médio, percentil p95 de intervalo entre frames (frame time) e contagens de entidades vivas.
    - Inspeção de integridade de memória e recursos após 5 ciclos completos de `start/play/exit`, investigando ausência de crescimento contínuo de heap e listeners órfãos.
    - Registro detalhado do ambiente de referência: hardware, sistema operacional, navegador, resolução de viewport, configuração de partida, cenário e restrições.
    - Teste de estresse adicional com intervalo de spawn de 1.0s com robustez geométrica e descarte limpo de candidatos inseguros sem acúmulo patológico de backlog (`accumulateBacklog: false`).
  - `GDD.md` Seção 15 ("Resource lifecycle and cleanup"):
    - Ciclo de vida estrito de recursos gráficos PixiJS, áudio Web Audio e listeners de eventos da janela e do documento.
    - Descarte e limpeza completa na transição de saída da arena para o menu, garantindo delta zero em instâncias ativas.
  - `GDD.md` Seção 16 ("Playtest questions and remaining decisions"):
    - Análise de viabilidade tática e equilíbrio de canhão frontal (Q) versus broadsides (W/E).
    - Avaliação de sobrevivência e tempo de percepção contra Chasers em controles touch (mobile portrait) versus desktop.
    - Fluidez da navegação com sliding tangencial suave ao longo do litoral das ilhas.
    - Preservação da curva de sobrevivência arcade em partidas completas de 3 minutos sem saturação descontrolada.
- **Relatório de Exploração Prévio**:
  - `project/automation-reports/15-profile-and-tune-gameplay/explore.md`: Diagnóstico de Minor GC decorrente de instanciação/destruição contínua de sprites e partículas PixiJS, overhead de clonagem recursiva profunda (`immutableCopy`) no loop de 60Hz da simulação, projeto do Object Pooling de projéteis e partículas e estratégia de medição automatizada em duas camadas (benchmark headless e profiler Playwright E2E).
- **Diretrizes OpenSpec e Projeto**:
  - `openspec/config.yaml`: Schema `spec-driven` e conformidade com idioma pt-BR (com cabeçalhos estruturais e palavras-chave normativas SHALL/MUST em inglês).
  - Inventário das 20 especificações existentes em `openspec/specs/`.

---

## 2. Artefatos de Planejamento Criados

A change `profile-and-tune-gameplay` foi criada em `openspec/changes/profile-and-tune-gameplay/` sob o schema `spec-driven`, contemplando todos os artefatos exigidos:

### 2.1 `proposal.md`
- **Motivação e Problema**: Atendimento aos requisitos mandatórios de profiling das seções 14, 15 e 16 do GDD, estabelecendo metas estritas de frame rate e estabilidade de memória, mitigando gargalos de Minor GC por rotatividade de nós gráficos e calibrando taticamente o combate sob versionamento estável de balanceamento.
- **Escopo das Alterações**: Orçamentos quantitativos normativos (60 FPS, p95 < 20.0ms em 180s, estresse de 1.0s com teto geométrico e descarte sem backlog acumulado); política de Object Pooling de sprites de projéteis e partículas de combate; auditoria de ausência de leaks em 5 ciclos completos; versionamento canônico de balanceamento (`balance-v1`); e harness automatizado de benchmark headless e profiler Playwright E2E com CDP.
- **Declaração de Capabilities**:
  - Nova Capability: `performance-budgets`.
  - Capabilities Modificadas: `arena-rendering` e `game-configuration`.

### 2.2 Delta Specs em `specs/`
- **`specs/performance-budgets/spec.md`** (Nova capability):
  - `## Purpose` com mais de 50 caracteres definindo escopo quantitativo e procedimentos de profiling reproduzíveis em ambiente documentado.
  - 4 requisitos normativos concisos (≤ 500 caracteres) com cenários formatados com exatamente 4 hashtags (`####`) e cláusulas WHEN/THEN/AND:
    - `Requirement: Orçamento de taxa de quadros e intervalo entre frames`: 60 FPS médio com p95 < 20.0ms em 180s em build de produção, sem quedas graves (> 33.3ms) em combate ativo.
    - `Requirement: Resiliência em teste de estresse de spawn acelerado`: estabilidade sob intervalo de 1.0s, descarte limpo sem acúmulo patológico de backlog e limite de até 5 passos de compensação por frame.
    - `Requirement: Sustentação de recursos e ausência de vazamentos em ciclos repetidos`: integridade após 5 ciclos completos de partida e retorno ao menu, com zero instâncias PixiJS ativas, loops de áudio silenciados e heap de memória estável após coleta forçada de lixo.
    - `Requirement: Harness automatizado de profiling e telemetria`: benchmark headless de CPU para 10.800 ticks (CPU time < 0.8ms/step) e profiler E2E no Chromium via Performance API e Chrome DevTools Protocol.
- **`specs/arena-rendering/spec.md`** (Capability modificada sob `## MODIFIED Requirements`):
  - Atualização completa dos blocos de requisitos:
    - `Requirement: Arena composta com player autoritativo`: especificação de que projéteis efêmeros utilizam object pooling e desativação de visibilidade, eliminando chamadas contínuas a `sprite.destroy()`.
    - `Requirement: Efeitos visuais de combate`: especificação de que partículas de detritos de madeira, clarões de disparo e textos de pontuação utilizam pooling com reciclagem de nós PixiJS.
- **`specs/game-configuration/spec.md`** (Capability modificada sob `## MODIFIED Requirements`):
  - Atualização completa dos blocos de requisitos:
    - `Requirement: Valores iniciais centralizados e versionados`: introdução formal de identificador estável de versão de balanceamento (`balanceVersion`), governando a calibração de armas e combate.
    - `Requirement: Chave canônica da configuração de gameplay`: incorporação determinística da versão de balanceamento na chave canônica (`configurationKey`), garantindo reprodutibilidade histórica sem alterar o algoritmo de derivação.

### 2.3 `design.md`
- **Contexto e Fronteiras**: Diagnóstico das pausas de Minor GC causadas pela destruição contínua de sprites e clonagens profundas no loop a 60Hz. Definição clara de Goals e Non-Goals.
- **Decisões Arquiteturais Fundamentadas**:
  - Decisão 1: Orçamentos quantitativos normativos (meta de 60.0 FPS médio, p95 < 20.0ms em 180s, zero janks > 33.3ms em combate ativo).
  - Decisão 2: Object Pooling modular para projéteis (`CannonballSpritePool`) e efeitos em `battleEffects.ts` com rotinas de `reset()`.
  - Decisão 3: Otimização de hot paths no motor de simulação (`engine.ts`), preservando a imutabilidade pública externa (`inspect()`) sem clonagem recursiva profunda em passos intermediários internos.
  - Decisão 4: Teste de estresse com intervalo de 1.0s com robustez geométrica natural e sem backlog acumulado (`accumulateBacklog: false`).
  - Decisão 5: Auditoria automatizada de recursos e ausência de vazamento em 5 ciclos completos via Playwright e CDP (`HeapProfiler.collectGarbage` e `Performance.getMetrics`).
  - Decisão 6: Versionamento estável de combate (`balance-v1`) e calibração de usabilidade e ergonomia touch.
- **Riscos e Mitigações**: Variações de hardware em benchmarks documentadas pelo ambiente de referência; higiene de reset de atributos em pooling; e determinismo de testes de memória via CDP.

### 2.4 `tasks.md`
- 12 tarefas numeradas distribuídas em 5 grupos lógicos sequenciais com critérios explícitos e rastreáveis de verificação:
  - **Grupo 1: Infraestrutura de Telemetria e Benchmarks Automatizados** (tarefas 1.1 e 1.2: benchmark headless de simulação e profiler E2E Playwright).
  - **Grupo 2: Otimização de Garbage Collection e Alocações no Loop Quente** (tarefas 2.1 a 2.3: mitigação de cloning na simulação, pooling de projéteis e pooling de efeitos visuais).
  - **Grupo 3: Auditoria de Recursos e Ausência de Vazamento em 5 Ciclos** (tarefas 3.1 e 3.2: consolidação de descarte na transição da arena e verificação de heap estável via CDP).
  - **Grupo 4: Calibração de Balanceamento, Usabilidade e Versionamento Canônico** (tarefas 4.1 e 4.2: versionamento `balance-v1`, consistência da `configurationKey`, ergonomia touch e sliding em ilhas).
  - **Grupo 5: Execução Completa dos Testes de Profiling e Geração de Evidências** (tarefas 5.1 a 5.3: execução dos benchmarks, validação de 60 FPS e p95 < 20.0ms em preview e consolidação dos resultados no relatório de verificação).

---

## 3. Validação Estrita OpenSpec

Todas as verificações foram executadas no ambiente PowerShell com Node.js `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change profile-and-tune-gameplay` | 0 | 4/4 artefatos concluídos (`proposal`, `specs`, `design`, `tasks`). Planejamento completo. |
| `openspec.cmd validate profile-and-tune-gameplay --strict` | 0 | `Change 'profile-and-tune-gameplay' is valid`. Conformidade estrita sem erros ou warnings. |
| `openspec.cmd validate --all --strict` | 0 | `Totals: 21 passed, 0 failed (21 items)` (20 main specs + change `profile-and-tune-gameplay`). |

---

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `profile-and-tune-gameplay` está completo, consistente e estritamente validado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e acionar o executor da fase `apply` (`/root/i15_apply`) para proceder à implementação dos benchmarks, pools de objetos, otimização de hot paths e auditorias quantitativas de desempenho.
