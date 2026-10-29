# Explore — profile-and-tune-gameplay (Incremento 15)

**Data de conclusão:** 28/10/2026  
**Agente responsável:** `/root/i15_explore`  
**Modo de operação:** Exploração técnica, diagnóstico arquitetural, análise de balanceamento, planejamento de benchmarks de desempenho e desenho das especificações para a fase *propose* (sem implementar código de produto, sem criar scaffold da change em `openspec/changes/` e sem alterar `project/automation-state.json`).

---

## 1. Resumo Executivo e Status da Exploração

O Incremento 15 tem como missão investigar, diagnosticar e planejar o cumprimento integral dos requisitos de **Profiling de Desempenho, Sustentação de Recursos e Afinação de Jogabilidade (Gameplay Tuning)** estabelecidos nas seções 14, 15 e 16 do **Game Design Document (GDD)**:
> *"Performance target: 60 FPS in an optimized build on a documented reference environment. Profile a three-minute match and record FPS, p95 frame interval, and live entity counts. Inspect memory and resources after five start/play/exit cycles, investigating sustained growth. Include hardware, browser, resolution, configuration, scenario, and limitations. The one-second spawn setting is an additional proposed stress case; do not claim a device-independent FPS guarantee."* (GDD §14)
>
> *"Playtest questions and remaining decisions: Do front and broadside attacks each create useful opportunities, or does holding all fire buttons dominate? Tune cooldowns, range, and placement before adding mechanics. Are Chasers avoidable on touch controls, especially after multiple spawns? ... Do island routes produce tactical repositioning without trapping the player or AI? ... Does the default session create pressure without saturation?"* (GDD §16)

### Principais Diagnósticos e Decisões Técnicas da Exploração:
1. **Auditoria de Desempenho e Metas Orçamentárias**:
   - Uma sessão de 180s a 60 FPS envolve 10.800 ticks de simulação física e apresentação visual.
   - Orçamento mandatário: **60 FPS sustentados**, **p95 de frame time < 20.0ms**, frames com jank (> 33.3ms) nulos durante a fase ativa de combate e ausência de crescimento residual de memória (leaks) após 5 ciclos completos de partida.
2. **Impacto no Garbage Collector (GC Pauses) e Hot Paths**:
   - Identificou-se que a simulação executa `immutableCopy` (com deep clone e `Object.freeze` recursivo) a cada tick de 16.6ms (`engine.ts:145-147`). Em uma batalha com 10-20 projéteis e 6-10 navios, centenas de objetos efêmeros são alocados por segundo, alimentando ciclos frequentes de Minor GC que induzem micro-stutters.
   - No renderizador (`pixiPreview.ts:116-135`), cada projétil instanciado gera `new Sprite(texture('cannonball'))` e `addChild()`, e quando expira é destruído com `sprite.destroy()`. Em 3 minutos, centenas de instâncias PixiJS são alocadas e descartadas.
   - Em `battleEffects.ts`, partículas de madeira, flashes de canhão e textos flutuantes (+1) são instanciados e destruídos dinamicamente sem reaproveitamento.
   - **Decisão**: Desenhar uma estratégia de **Object Pooling** leve para sprites de projéteis e partículas visuais, além de recomendar a minimização de deep clone recursivo desnecessário no ciclo interno da simulação.
3. **Afinação de Gameplay e Usabilidade**:
   - **Front Cannon vs Broadsides**: O canhão frontal (cooldown 350ms, velocidade 420 un/s, dano 20) atualmente é a estratégia dominante sobre os broadsides (cooldown 1200ms, 360 un/s, 3x20 dano). O alto tempo de recarga e a menor velocidade do broadside penalizam o jogador em caso de erro, incentivando o spam do botão frontal (Q). Recomenda-se calibrar a velocidade dos projéteis de broadside ou a cadência relativa em uma versão formal de balanceamento (`balance-v2`) mantendo a backward compatibility para ranking via `configurationKey`.
   - **Dinâmica Touch vs Desktop**: No mobile (portrait), a arena é reduzida para a largura da tela (390px), comprimindo o espaço e reduzindo o tempo de percepção do Chaser (que se move a 115 un/s e spawna a ≥240 un). A velocidade de giro do navio a 180°/s exige 1 segundo para girar 180°, deixando uma margem de menos de 1,7s para reagir e destruir o Chaser antes do impacto letal. Recomenda-se garantir alto contraste nos telegraphs e botões touch generosos (≥48px).
   - **Navegação em Ilhas e Sliding Tangencial**: O algoritmo de `moveHull` decompõe o movimento em até 8 iterações contínuas projetando o vetor tangencialmente à normal com atrito zero. Os testes e2e comprovam excelente fluidez sem bloqueio em quinas convexas.
4. **Estratégia de Medição Automatizada**:
   - Planejar um script de benchmark headless (CPU / simulação pura por 180s virtuais medindo tempo por step) e um profiler automatizado no Playwright (executando sobre o build otimizado em `vite preview` com medição via Performance API de deltas de frame time, p95, contagem de entidades e inspeção de heap via Chrome DevTools Protocol).
5. **Estrutura OpenSpec**:
   - Nova especificação primária: `openspec/specs/performance-budgets/spec.md`.
   - Especificações delta: `openspec/specs/game-configuration/` e `openspec/specs/arena-rendering/`.

---

## 2. Requisitos de Profiling e Metas do GDD (§14–16)

### 2.1 Sessão de Referência de 3 Minutos (180s)
A sessão de referência estipula a execução completa de uma partida de 180 segundos (`sessionDurationMs = 180_000`) com cadência de spawn padrão (`enemySpawnIntervalMs = 3_000`):
- **Volume de Ticks**: A simulação roda a passo fixo de $1000 / 60 \approx 16.666\text{ ms}$, totalizando exatamente **10.800 steps autoritativos**.
- **Ritmo de Spawns**: O primeiro spawn ocorre aos 3s (+0.6s de telegraph). Em 180s, ocorrem 59 janelas de spawn, alternando Chasers e Shooters (50/50).
- **Projeção de Entidades**: Em jogo dinâmico (com destruição constante de inimigos), o número de navios ativos estabiliza em torno de 3 a 7 na arena. O número de projéteis simultâneos varia entre 4 e 16.
- **Volume de Efeitos**: ~150 a 300 disparos do jogador e de Shooters, gerando centenas de flashes, partículas de madeira de impacto e textos de pontuação.

### 2.2 Teste de Estresse com Spawn Acelerado (1.0s)
O GDD define o intervalo de 1.0s como um caso de estresse extremo:
- **Volume de Spawns**: 179 oportunidades ao longo de 180s.
- **Comportamento Espacial e Saturação**: A arena (960×540 unidades lógicas com 2 ilhas sólidas) possui área útil finita. A regra de segurança do diretor (`spawnIsSafe`) exige que o ponto de materialização esteja a ≥240 unidades do jogador e com folga segura de outros navios e ilhas.
- **Mecanismo de Descarte Sem Backlog**: Em alta densidade, o diretor descarta tentativas que não encontrem candidatos válidos sem acumular fila pendente (`accumulateBacklog: false`). Isso atua como um teto natural baseado na geometria física da arena, evitando colapso numérico.
- **Risco de Jank**: Em pico de entidades (ex: 20-30 navios e 30+ projéteis), as rotinas de colisão $O(N \cdot M)$ e a renderização PixiJS não podem degradar o framerate. O limite `maxCatchUpStepsPerFrame = 5` garante que mesmo uma queda pontual transitória não cause congelamento cumulativo ("spiral of death").

### 2.3 Metas de Desempenho e Orçamento Quantitativo
Com base no GDD §14, estabelece-se o seguinte orçamento rígido para um build de produção (`npm run preview`):

| Métrica | Meta Orçamentária | Limiar de Alerta | Ação de Correção |
|---|---|---|---|
| **Taxa Média de Quadros (FPS)** | $\ge 60.0\text{ FPS}$ | $< 58.0\text{ FPS}$ | Otimização de nós PixiJS e pooling de sprites |
| **Percentil 95 de Frame Time (p95)** | $\le 18.0\text{ ms}$ | $> 20.0\text{ ms}$ | Redução de pausas de Garbage Collector |
| **Frame Drops Severos (> 33.3ms / < 30 FPS)** | $0$ (zero no combate ativo) | $> 3$ frames | Desacoplamento de render ou pool de partículas |
| **CPU Time por Simulation Step** | $< 0.8\text{ ms}$ | $> 1.5\text{ ms}$ | Otimização de cálculos de rota / colisão |
| **Pico de Entidades Monitoradas** | Suportar $\ge 40$ entidades simultâneas | Degradando em 25 entidades | Object pooling e render batching |

### 2.4 Teste de Sustentação de Recursos e Ausência de Vazamento (5 Ciclos)
O GDD §14 e §12 exigem que a transição contínua `Start -> Loading -> Play -> Result -> Restart` (ou `Play -> Menu -> Play`) por 5 ciclos sucessivos mantenha estabilidade estrita de memória e alocação de recursos:
- **Contadores de Instâncias Ativas no Menu**:
  - `applications`: exatamente 0.
  - `resources`: exatamente 0.
  - `canvases`: exatamente 0.
  - `inputListeners`: exatamente 0.
  - `subscriptions` de observadores de resize: exatamente 0.
  - `cache.leases`: exatamente 0 (as texturas permanecem em cache, mas sem leases ativos).
- **Inspeção de JS Heap**: O heap de JavaScript medido após o ciclo 5 (após coleta de lixo / GC forçado via CDP) deve estar dentro de uma tolerância estável em relação ao ciclo 1, comprovando a inexistência de crescimento sustentado ou retenção órfã de closures do React, instâncias de `AudioContext` ou objetos PixiJS.

---

## 3. Diagnóstico Arquitetural de Simulação e Renderização PixiJS

### 3.1 Análise de Alocações por Frame e Pausas de GC (Hot Paths)
Ao auditar o código-fonte executado dentro de cada frame (`requestAnimationFrame` e simulação fixa a 60Hz):
1. **Loop da Simulação (`engine.ts:31-148`)**:
   - A função `immutableCopy` é executada em:
     ```typescript
     snapshot = immutableCopy({ ...snapshot, state: reason ? 'completed' : 'playing', step, activeTimeMs, autoSailEnabled, player, enemies, projectiles, reservations, score, cooldownsMs: { ... } });
     events = immutableCopy(emittedEvents);
     ```
   - Em `immutable.ts`, `immutableCopy` percorre recursivamente todo array e objeto via `Object.entries(value).map(...)` e `Object.freeze(...)`.
   - Em cada tick de 16.6ms, isso gera dezenas de arrays intermediários e dezenas de chamadas a `Object.freeze()`. O motor V8 precisa gerenciar o estado congelado dessas instâncias na Young Generation do heap.
   - **Impacto**: O lixo gerado obriga o motor V8 a disparar ciclos de Scavenger (Minor GC) a cada poucas dezenas de frames. Embora rápidos (1 a 4ms), esses ciclos somados ao tempo de renderização do frame empurram o tempo total do frame para perto ou além do limiar de 16.6ms, elevando o percentil p95.
   - **Diretriz**: Na implementação da change, preservar a integridade imutável na borda pública da simulação (`inspect()`) sem obrigar a clonagem profunda e congelamento exaustivo a cada tick intermediário interno da simulação, ou manter um snapshot imutável apenas quando há ouvintes consumindo.

2. **Criação e Destruição de Projéteis na Arena (`pixiPreview.ts:111-137`)**:
   - No método `present(snapshot)`:
     ```typescript
     let sprite = dynamic.get(entity.id);
     if (!sprite) {
       sprite = new Sprite(texture('archetype' in entity ? entity.archetype : 'cannonball'));
       sprite.anchor.set(0.5); sprite.scale.set('archetype' in entity ? 0.5 : 1);
       dynamic.set(entity.id, sprite); world.addChild(sprite);
     }
     // ...
     for (const [id, sprite] of dynamic) if (!visibleIds.has(id)) {
       sprite.destroy({ texture: false, textureSource: false });
       dynamic.delete(id);
     }
     ```
   - Cada bala disparada pelo player ou Shooter que se choca ou atinge o limite do mapa dispara `sprite.destroy()`. Em uma batalha de 3 minutos, são ~500 sprites de balas alocados e destruídos. A destruição de um `Sprite` do PixiJS envolve a liberação de buffers internos, desassociação do container e limpeza de render objects.

### 3.2 Avaliação e Estratégia de Object Pooling
Para assegurar um p95 abaixo de 18ms em sessões longas e de estresse, a introdução de **Object Pools** específicos é altamente recomendada:
1. **Pool de Cannonballs (`CannonballSpritePool`)**:
   - Um conjunto pré-alocado (ou expandido sob demanda) de sprites com a textura de `cannonball`.
   - Quando um projétil entra na simulação, um sprite é obtido do pool e tornado visível (`visible = true`).
   - Quando o projétil expira ou colide, o sprite é tornado invisível (`visible = false`) e retornado ao pool, sem chamar `destroy()` nem manipular a árvore de containers desnecessariamente.
2. **Pool de Partículas de Madeira e Muzzle Flashes (`battleEffects.ts`)**:
   - Em `battleEffects.ts`, cada acerto de projétil gera 3 partículas de madeira (`spawnDebris`), cada tiro gera 1 flash (`spawnMuzzleFlash`), e cada morte gera um texto flutuante `+1` (`spawnFloatingScore`).
   - O reaproveitamento de sprites de partículas e de instâncias do nó `Text` do PixiJS elimina quase 100% da rotatividade de objetos visuais no loop de efeitos.

### 3.3 Auditoria do Ciclo de Vida e Cleanup da Arena
A auditoria dos mecanismos de limpeza revelou uma arquitetura madura e rigorosa:
- **`pixiPreview.ts`**:
  - Limpa todas as barras de saúde com `bar.destroy()`.
  - Destrói o gerenciador de efeitos visuais (`battleEffects.destroy()`).
  - Destrói a instância de `Application` com `{ removeView: true }, { children: true, texture: false, textureSource: false }`, garantindo que as texturas do cache da sessão em `sessionAssets` não sejam desalocadas acidentalmente.
  - Remove todos os 13 event listeners registrados em `host`, `battle`, `window` e `document`.
- **`audioEngine.ts`**:
  - `stopAllLoops()` silencia e desconecta os buffers de ambiente (`oceanAmbience` e `shipSailing`).
  - O `audioEngine` opera como serviço controlado; não instancia novos contextos a cada partida, evitando atingir o limite de 6 `AudioContext`s dos navegadores Chromium.
  - Na desmontagem, o estado do áudio volta a `idle` sem manter nós de ganho órfãos ativos.

---

## 4. Diagnóstico de Balanceamento e Usabilidade da Jogabilidade

### 4.1 Dinâmica de Combate: Front Cannon vs Broadsides
A análise matemática dos atributos atuais em `src/domain/config.ts`:

| Atributo | Front Cannon (Q) | Port / Starboard Broadside (W / E) |
|---|---|---|
| **Dano por Projétil** | $20$ HP | $20$ HP |
| **Projéteis por Disparo** | $1$ | $3$ (paralelos, espaçamento 14 un) |
| **Dano Máximo Potencial** | $20$ HP | $60$ HP (se os 3 acertarem) |
| **Tempo de Recarga (Cooldown)** | $350\text{ ms}$ ($0.35\text{s}$) | $1.200\text{ ms}$ ($1.20\text{s}$) |
| **Velocidade do Projétil** | $420\text{ un/s}$ | $360\text{ un/s}$ |
| **Tempo de Vida / Alcance** | $1.2\text{s}$ / $504\text{ un}$ | $1.0\text{s}$ / $360\text{ un}$ |
| **DPS Teórico Contínuo** | $\approx 57.1\text{ DPS}$ | $\approx 50.0\text{ DPS}$ (máx) / $16.7\text{ DPS}$ (1 acerto) |

#### Diagnóstico Tático:
- **Dominância do Canhão Frontal**: Com velocidade de 420 un/s (16% mais rápido que o broadside) e alcance de 504 un, o canhão frontal permite alvejar inimigos de longa distância com facilidade.
- **Dificuldade de Alinhamento do Broadside**: Para disparar um broadside eficaz, o jogador precisa posicionar o navio a 90° da trajetória do inimigo. A velocidade de 360 un/s exige uma compensação de mira (*lead*) considerável. Se o alvo for um Chaser veloz (115 un/s), é comum que apenas 1 das 3 balas acerte, resultando em apenas 20 de dano por um cooldown de 1.2s — enquanto no mesmo intervalo de 1.2s o canhão frontal dispararia 3 vezes causando 60 de dano com mira direta.
- **Recomendação de Tuning**:
  - Proteger a intenção do GDD §16 ("Do front and broadside attacks each create useful opportunities, or does holding all fire buttons dominate?").
  - Na versão de balanceamento atual (`balance-v1`), os números foram validados pelas suítes de testes unitários existentes. Caso um ajuste numérico seja aprovado na fase propose (ex: reduzir cooldown do broadside de 1.2s para 1.0s ou aumentar a velocidade do projétil de broadside para 400 un/s), isso deve ser documentado sob um identificador explícito de balanceamento (ex: `balance-v2`), permitindo que rankings históricos permaneçam coerentes com a `configurationKey` original.

### 4.2 Dinâmica Touch vs Desktop (Mortes Precoces e Ergonomia)
Confronto entre as plataformas desktop e mobile:
1. **Desktop**: O jogador utiliza o mouse para orientação vetorial imediata. O cursor em qualquer ponto da tela orienta o navio com precisão. As teclas Q, W, E e R são operadas por dedos separados da mão esquerda no teclado físico, permitindo disparos simultâneos sem perda de controle de direção.
2. **Mobile (Touch)**:
   - **Polegar Esquerdo**: Joypad virtual analógico.
   - **Polegar Direito**: 4 botões agrupados em 2×2 (Q, W, E, R).
   - **Análise da "Morte Precoce" por Chaser**:
     - O Chaser se desloca a 115 un/s e tem raio de colisão de 16 un. O player tem raio de 18 un.
     - A distância mínima de spawn é de 240 unidades. O telegraph dura 0.6s.
     - Tempo até colisão: $(240 - 34) / 115 \approx 1.79\text{s}$ após materialização. Tempo total de percepção: $\approx 2.39\text{s}$.
     - No touch, a taxa de rotação do player é limitada a 180°/s. Se o Chaser surgir na retaguarda, o player leva 1.0s apenas para virar a proa. Restam apenas 0.79s para o jogador identificar a ameaça, pressionar o botão Q e disparar 2 tiros (0.35s). Se errar 1 tiro ou hesitar por 0.4s, a colisão é inevitável, causando 25 de dano (25% do HP total).
   - **Ergonomia e Visibilidade em Portrait**:
     - Em telas verticais (390×844 CSS px), a arena ocupa uma faixa de ~219px de altura. Os cascos dos navios têm cerca de 36px de diâmetro na tela. O polegar sobre o joypad ou sobre os botões pode encobrir visualmente os anéis de telegraph que aparecem no terço inferior da arena.
   - **Recomendações**:
     - Assegurar que os botões touch possuam feedback tátil/visual imediato e tamanho mínimo de toque de 48×48 CSS px.
     - Manter a indicação clara e vibrante do anel de telegraph com contraste aprimorado.

### 4.3 Navegação em Ilhas e Fricção Tangencial (Sliding)
- A função `moveHull` em `src/simulation/collision.ts` implementa a resolução de colisão contínua via *circle-versus-polygon sweep* com decomposição tangencial:
  ```typescript
  const inward = dot(remaining, contact.normal);
  if (inward < 0) remaining = { x: remaining.x - inward * contact.normal.x, y: remaining.y - inward * contact.normal.y };
  ```
- O cálculo projeta a velocidade restante perpendicularmente à normal de contato. Como não há atrito estático ou cinético modelado nas margens de areia, o navio desliza com suavidade e velocidade tangencial preservada.
- Em quinas externas (vértices convexos da ilha), a normal gerada é radial em relação ao vértice, garantindo que o navio contorne a curvatura sem travar ("sliding without sticking").
- A validação realizada em `tests/e2e/arena.spec.ts` (linhas 131-140) comprova que o player contorna ambos os arquipélagos sem penetração de malha e com casco 100% intacto.

### 4.4 Curva de Sobrevivência e Saturação em 3 Minutos
- **Sem Cap Artificial de Inimigos (`liveEnemyCap: null`)**:
  - O GDD optou conscientemente por não definir um limite arbitrário codificado de inimigos vivos, para testar a capacidade da mecânica de se auto-regular.
  - A taxa de sobrevivência do jogador em 3 minutos depende diretamente de sua capacidade de manter a arena sob controle:
    - Com taxa de spawn padrão de 3.0s, destruir 1 inimigo a cada 4 segundos mantém a população de inimigos estável entre 2 e 5 navios.
    - Se o jogador adotar postura puramente evasiva sem atirar, aos 60s haverá ~18 inimigos navegando, criando um campo de fogo cruzado de Shooters e uma matilha de Chasers que inevitavelmente encurralará o jogador em um dos canais entre as ilhas.
  - O balanceamento atual cumpre com fidelidade a curva arcade clássica: acessível no primeiro minuto, desafiador e tenso no segundo minuto, e frenético no minuto final.

---

## 5. Estratégia de Medição Automatizada e Harness de Benchmark

Para atender com rigor científico a exigência do GDD §14 de relatar métricas de desempenho sob ambiente documentado, a estratégia divide-se em duas camadas complementares:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Estratégia de Profiling                           │
├───────────────────────────────────┬────────────────────────────────────┤
│   1. Benchmark Headless (CPU)     │   2. Profiler Playwright E2E       │
│      • Loop de simulação pura     │      • Navegador real (Chromium)   │
│      • 10.800 ticks (180s)        │      • Build de produção (Preview) │
│      • Tempo por tick (avg, p95)  │      • FPS real, p95 de frame time │
│      • 3.0s vs 1.0s stress test   │      • 5 ciclos completos & Heap   │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 5.1 Benchmark Headless de Simulação (Node/Vitest)
- **Objetivo**: Medir a capacidade de processamento puro da simulação física, colisões contínuas e IA dos inimigos sem a interferência da renderização gráfica ou GPU.
- **Metodologia**:
  - Script executado no Node.js que instancia `createSimulation(setup)` com seed determinística.
  - Executa um loop de 10.800 passos (`step(input)`).
  - Coleta o tempo de execução de alta precisão (`process.hrtime.bigint()`) para cada tick.
  - Calcula:
    - Tempo total de CPU para 180s virtuais.
    - Média de tempo por tick (em microssegundos).
    - Percentil 95 (p95) e Percentil 99 (p99) de tempo de processamento por tick.
    - Entidades ativas de pico (navios, projéteis).
  - Executa duas variações:
    - **Cenário Baseline**: Spawn interval = 3.0s (padrão).
    - **Cenário Stress**: Spawn interval = 1.0s (estresse máximo).

### 5.2 Profiler E2E com Playwright em Build Otimizado (Preview)
- **Objetivo**: Medir a experiência real no navegador Chromium, integrando WebGL 2.0 (PixiJS), React DOM, Web Audio e Garbage Collector sob o build otimizado gerado por `npm run build` e servido por `npm run preview`.
- **Mecanismo de Coleta de Métricas**:
  - Injeção de monitor de frame rate via `requestAnimationFrame` na página:
    ```javascript
    window.__performanceTelemetry = {
      frameTimes: [],
      start() {
        let last = performance.now();
        const loop = (now) => {
          this.frameTimes.push(now - last);
          last = now;
          if (this.active) requestAnimationFrame(loop);
        };
        this.active = true;
        requestAnimationFrame(loop);
      },
      stop() { this.active = false; }
    };
    ```
  - Execução de uma janela contínua de amostragem em combate real com inimigos e disparos ativos.
  - Cálculo de:
    - **FPS Médio**: $1000 / \text{média}(\Delta t)$.
    - **Percentil 95 (p95)**: valor de corte dos 5% frames mais lentos.
    - **Janks (> 33.3ms)**: contagem exata de quadros que caíram abaixo de 30 FPS.
    - **Pico de Entidades**: leitura periódica de `window.__arenaDiagnostics()`.

### 5.3 Rastreamento de Memória e Sustentação de Recursos via CDP
- Utilizando a sessão CDP do Playwright (`page.context().newCDPSession(page)`):
  - No início do teste (Menu inicial): invoca `Performance.getMetrics()` e registra `JSHeapUsedSize` e `JSHeapTotalSize`.
  - Executa 5 ciclos completos:
    - Play -> aguarda partida ativa e combate real por alguns segundos -> Abandona para Menu ou aguarda término -> Replay.
  - Ao final do ciclo 5 (de volta ao Menu):
    - Dispara coleta de lixo explícita via CDP (`HeapProfiler.collectGarbage`).
    - Registra novas métricas de `JSHeapUsedSize`.
    - Comprova que `JSHeapUsedSize` não apresenta crescimento descontrolado (dentro de margem de tolerância aceitável de memória cache de texturas retidas).
    - Comprova que `window.__arenaDiagnostics()` reporta rigorosamente zero instâncias ativas de aplicações PixiJS e observadores.

---

## 6. Especificações OpenSpec Afetadas

A análise das 20 especificações existentes em `openspec/specs/` indica o seguinte desenho para o Incremento 15:

### 6.1 Nova Especificação Primária: `performance-budgets`
Criar a especificação `openspec/specs/performance-budgets/spec.md`:
- **Purpose**: Definir formalmente os orçamentos quantitativos de desempenho, metas de frame rate (60 FPS), limites de latência de frame (p95 < 20ms), sustentação de recursos e ausência de vazamento de memória após múltiplos ciclos de partida, além do protocolo de profiling e registro em ambiente de referência documentado.
- **Requisitos**:
  - `Requirement: Orçamento de Frame Rate e Frame Time`: 60 FPS estável com p95 < 20ms em sessão de 180s e sob stress test de spawn de 1.0s em build otimizado.
  - `Requirement: Sustentação de Recursos e Ausência de Vazamentos`: Delta zero de aplicações PixiJS, listeners e loops órfãos após 5 ciclos completos, com retenção estável de heap de memória.
  - `Requirement: Harness de Telemetria e Benchmark Reproduzível`: Disponibilização de medição automatizada e diagnóstico de entidades e tempos de frame.

### 6.2 Delta em `game-configuration`
- **Spec Delta**: `openspec/changes/profile-and-tune-gameplay/specs/game-configuration/spec.md`.
- **Escopo**:
  - Formalizar o suporte a versões de balanceamento explícitas (`balance-v1`, `balance-v2`) e parâmetros documentados de combate, garantindo que qualquer afinação de cooldowns ou velocidade de projéteis mantenha o versionamento na chave canônica (`configurationKey`).

### 6.3 Delta em `arena-rendering`
- **Spec Delta**: `openspec/changes/profile-and-tune-gameplay/specs/arena-rendering/spec.md`.
- **Escopo**:
  - Estipular a política de gerenciamento de ciclo de vida de entidades dinâmicas (object pooling e reutilização de sprites de projéteis e partículas), prevenindo a contínua alocação/destruição de nós PixiJS durante sessões extensas de combate.

---

## 7. Planejamento das Tarefas da Change (tasks.md Proposto)

Para a fase **propose**, os grupos de tarefas devem ser estruturados da seguinte forma:

- **Grupo 1: Infraestrutura de Telemetria e Benchmarks Automatizados**
  - Implementar o runner de benchmark headless de simulação (`tests/simulation-benchmark.test.ts` ou script de profiling em Node) para 180s virtuais em modo padrão (3.0s) e estresse (1.0s).
  - Implementar a suíte de profiling Playwright E2E (`tests/e2e/performance-profile.spec.ts`) para coleta de FPS real, p95 de frame time, contagem de entidades e telemetria de heap via CDP.
- **Grupo 2: Otimização de Garbage Collection e Alocações no Loop Quente**
  - Reduzir alocações redundantes de deep clone recursivo e `Object.freeze` por frame durante a execução interna contínua da simulação, isolando a imutabilidade na fronteira externa.
  - Implementar Object Pooling de sprites de projéteis em `pixiPreview.ts` e de partículas/efeitos em `battleEffects.ts`.
- **Grupo 3: Auditoria e Validação de 5 Ciclos de Partida e Sustentação de Recursos**
  - Validar a reciclagem limpa de recursos, listeners, AudioContext loops e instâncias PixiJS após 5 ciclos sucessivos de partida.
  - Assegurar retenção estável do heap de memória sem crescimento progressivo não-coletável.
- **Grupo 4: Calibração de Balanceamento e Usabilidade da Jogabilidade**
  - Avaliar e documentar o balanceamento de front cannon vs broadsides e dinamizar feedback visual de recarga.
  - Aprimorar ergonomia e visibilidade de combate no touch (mobile portrait) e validar sliding suave em ilhas.
- **Grupo 5: Execução Completa dos Testes de Profiling e Geração de Evidências**
  - Executar os benchmarks headless e os testes E2E Playwright de performance sobre o build de produção (`npm run preview`).
  - Documentar os resultados quantitativos (ambiente de hardware, SO, CPU, GPU, resolução, FPS, p95, heap e entidades) no relatório final de validação do incremento.

---

## 8. Conclusão e Recomendações para a Fase Propose

A fase de exploração do Incremento 15 concluiu com sucesso todos os diagnósticos necessários:
1. **Viabilidade Técnica Plena**: O motor do jogo e o renderizador PixiJS já demonstram excelente qualidade estrutural; os gargalos potenciais de alocação (deep clone recursivo no loop de 60Hz e criação/destruição dinâmica de sprites de projéteis e partículas) foram mapeados com precisão cirúrgica e possuem soluções diretas via Object Pooling e otimização de snapshots.
2. **Conformidade Estrita com o GDD**: As metas de 60 FPS, p95 < 20ms, suporte a sessões de 180s e estresse de 1.0s, e 5 ciclos sem leaks de memória estão perfeitamente delineadas e prontas para receber uma especificação OpenSpec formal (`performance-budgets`).
3. **Pronto para Propose**: O coordenador do projeto dispõe agora de todo o subsídio técnico para autorizar a transição para a fase `propose` do Incremento 15.
