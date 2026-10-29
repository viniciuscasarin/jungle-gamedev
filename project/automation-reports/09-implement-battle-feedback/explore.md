# Explore — implement-battle-feedback (Incremento 09)

Concluído em 28/10/2026 por `/root/i09_explore`, operando estritamente em modo de análise e exploração técnica. Nenhuma alteração em código de produto, `openspec/changes/` ou `project/automation-state.json` foi efetuada.

## 1. Contexto e Diagnóstico da Base Atual

A base de código atual concluiu com sucesso o incremento 08 (`implement-responsive-hud-and-touch`), dispondo de:
- Simulação determinística autoral com passo fixo (60 Hz) e acumulador (`engine.ts`, `contracts.ts`, `combat.ts`, `enemies.ts`, `director.ts`).
- Renderização em PixiJS v8 (`pixiPreview.ts`, `healthBars.ts`, `viewport.ts`, `sessionAssets.ts`).
- Controles híbridos desktop (mouse + teclado) e mobile (joypad virtual multitouch nativo + botões de habilidade QWER).
- HUD responsivo com barras de vida, timers e indicadores de cooldown.
- Armazenamento local desacoplado (`local.ts`) para opções, identidade e resultados.
- Total de 238 testes unitários passando em Vitest e suíte Playwright estável.

### Lacunas Identificadas para o Incremento 09 (GDD seções 10 e 11)
1. **Feedback Visual de Combate Ausente**:
   - Não há muzzle flashes ao disparar (`front`, `port`, `starboard`, ou disparos do Shooter inimigo).
   - Não há animação de impacto de tiros na água ou no casco.
   - Não há debris de madeira (`wood_1..4.png`) ao atingir navios.
   - Naufrágio e colisões eliminam os sprites instantaneamente sem explosão (`explosion_1..3.png`) ou fade de afundamento.
   - Não há floating indicator "+1" em PixiJS ao abater inimigos.
   - Navios não refletem estados de avaria (`healthy >60%`, `damaged >25% até 60%`, `critical ≤25%`). Navios em estado crítico não exibem as chamas (`fire_1..2.png`).
2. **Eventos de Simulação Limitados**:
   - `SimulationEvent` cobre apenas `damage`, `destruction`, `score`, `ended`.
   - A simulação não emite eventos de disparo (`fire`) nem de tiros expirados na água (`water_hit`), impedindo que a camada de renderização e de áudio recebam os gatilhos desacoplados da simulação.
3. **Áudio Não Implementado**:
   - A pasta `assets/sounds/` contém 27 arquivos WAV fornecidos, mas não há subsistema de áudio no projeto (`AudioContext`, carregamento de buffers, roteamento ou controle de volume/mute).
   - Não há controle de mute na interface nem persistência de preferência de som.
4. **Acessibilidade e Live Regions Incompletas**:
   - O BattleHud não expõe uma live region `aria-live="polite"` para anunciar marcos críticos de combate (aviso de saúde crítica, 10 segundos finais, destruição de inimigos/score).
   - Não há diferenciação acessível reforçada para inimigos (além de cor de vela e tamanho) no HUD ou canvas.
   - Não há detecção ou tratamento de `prefers-reduced-motion` no renderizador.

---

## 2. Inventário de Assets e Mídia Fornecida

### 2.1 Efeitos Visuais e Componentes de Navio
Inspecionados individualmente em `assets/png/default/`:

| Asset | Dimensões Físicas / Lógicas | Papel Proposto no Incremento 09 |
|---|---|---|
| `effects/explosion_1.png` | 74×75 | Frame 1 da explosão de destruição / colisão |
| `effects/explosion_2.png` | 60×59 | Frame 2 da explosão de destruição / colisão |
| `effects/explosion_3.png` | 42×41 | Frame 3 da explosão / impacto pontual |
| `effects/fire_1.png` | 18×39 | Frame 1 de fogo no mastro/deck em estado crítico (≤25% HP) |
| `effects/fire_2.png` | 11×27 | Frame 2 de fogo no mastro/deck / muzzle flash pontual |
| `ship_parts/wood_1.png` | 15×7 | Partícula de detrito de madeira (impacto no casco) |
| `ship_parts/wood_2.png` | 26×10 | Partícula de detrito de madeira média |
| `ship_parts/wood_3.png` | 15×10 | Partícula de detrito de madeira angular |
| `ship_parts/wood_4.png` | 26×7 | Partícula de detrito de tábua longa |

*Nota sobre estados de casco:* Conforme constatado no catálogo `ships_miscellaneous_sheet.xml`, não existem sprites específicos de casco quebrado para os navios selecionados (`ship_5`, `ship_3`, `ship_8`).
**Decisão confirmada (GDD 11):** Utilizar modulação visual/overlays:
- **Healthy (>60%)**: Aparência padrão do navio.
- **Damaged (>25% e ≤60%)**: Overlay sutil com leve tonalidade escurecida/desbotada ou filtro de desgaste no sprite do navio, mantendo o colisor inalterado.
- **Critical (≤25%)**: Modulação mais escura com animação cíclica de chamas (`fire_1.png` / `fire_2.png`) ancorada sobre o deck do navio.

### 2.2 Catálogo de Áudio (`assets/sounds/*.wav`)
Todos os 27 arquivos foram medidos com 44.1 kHz, 16-bit PCM WAV.

| Categoria | Arquivos | Duração | Papel no Sistema de Áudio |
|---|---|---|---|
| **Ambiente & Navegação** | `ocean_ambience_loop.wav`<br>`ship_sailing_loop.wav` | 12.0s<br>8.0s | Loop suave de fundo e loop de movimento quando o navio está navegando. |
| **Disparos** | `cannon_fire_1.wav`–`3.wav`<br>`cannon_broadside.wav` | 1.18s–1.32s<br>1.70s | Disparos individuais (frente e shooter) alternados; disparo tríplice de broadside (boreste/bombordo). |
| **Impactos & Destruição** | `ship_wood_hit_1.wav`, `2.wav`<br>`cannonball_water_hit_1.wav`, `2.wav`<br>`ship_collision.wav`<br>`ship_explosion_1.wav`, `2.wav`<br>`ship_sinking.wav` | 0.60s<br>0.92s–1.08s<br>1.45s<br>2.40s–2.60s<br>3.30s | Impacto de bala no casco, bala atingindo a água sem alvo, colisão do Chaser contra o jogador, explosão final e afundamento. |
| **Marcos & Pontuação** | `score_point.wav`<br>`health_low.wav`<br>`time_warning.wav` | 0.50s<br>0.85s<br>0.48s | +1 ponto por abate. Alerta de vida crítica (≤25%) e aviso de 10 segundos finais (ambos tocados uma única vez na transição de limiar). |
| **Sessão & Interface** | `game_start.wav`<br>`game_pause.wav`<br>`game_resume.wav`<br>`game_complete.wav`<br>`game_over.wav`<br>`ui_click.wav`, `ui_hover.wav`, `ui_open.wav`, `ui_close.wav`, `ui_back.wav` | 1.25s<br>0.55s<br>0.55s<br>1.50s<br>1.60s<br>0.13s–0.60s | Jingles de início, pausa, retorno, encerramento de partida e cliques de botões/diálogos. |

### 2.3 Créditos e Procedência (`ASSET_CREDITS.md`)
Os arquivos de efeitos e áudio possuem a mesma proveniência do desafio (`assets/`), sem autoria ou licença documentada. O arquivo `ASSET_CREDITS.md` SHALL ser atualizado para listar todas as novas entradas utilizadas sem atribuir licença presumida.

---

## 3. Arquitetura de Efeitos em PixiJS

### 3.1 Desacoplamento da Simulação via `SimulationEvent`
A simulação (`src/simulation/`) MUST permanecer 100% pura, determinística e isenta de referências a WebGL, PixiJS ou Web Audio.
Para isso, estender `SimulationEvent` em `contracts.ts`:
```ts
export type SimulationEvent = EventTime & (
  | { readonly type: 'damage'; readonly targetId: string; readonly sourceId: string; readonly amount: number; readonly remainingHealth: number }
  | { readonly type: 'destruction'; readonly entityId: string; readonly sourceId: string; readonly cause: 'projectile' | 'contact' }
  | { readonly type: 'score'; readonly enemyId: string; readonly points: number; readonly totalScore: number }
  | { readonly type: 'ended'; readonly reason: EndReason; readonly score: number }
  | { readonly type: 'fire'; readonly shooterId: string; readonly weapon: PlayerWeapon | 'shooter'; readonly positions: readonly WorldPoint[]; readonly headingRadians: number }
  | { readonly type: 'water_hit'; readonly position: WorldPoint }
);
```
- Em `engine.ts`:
  - Ao executar `emitWeapon(...)`, gerar o evento `{ type: 'fire', ... }`.
  - Ao expirar uma bala sem colisão ou atingir a água após o alcance, gerar `{ type: 'water_hit', ... }`.
- A camada de renderização (`pixiPreview.ts`) e o controlador de áudio subscrevem `onEvents` no loop de navegação.

### 3.2 Gerenciamento do Ciclo de Vida dos Efeitos
Criar um subsistema de efeitos visuais (`src/render/battleEffects.ts`):
1. **Muzzle Flash**:
   - Duração curta (~100 ms). Sprite de chama/explosão na ponta de cada canhão disparado, orientado pelo rumo do tiro.
2. **Impactos e Debris**:
   - Ao receber `damage`, spawnar 2–4 fragmentos de madeira (`wood_1..4.png`) com velocidade radial aleatória, rotação e fade-out rápido (~350–500 ms).
3. **Explosão e Naufrágio (Destruição)**:
   - Ao receber `destruction`:
     - Animar sequência de frames `explosion_1` -> `explosion_2` -> `explosion_3` (total ~400 ms).
     - Gerar debris maiores de madeira se espalhando.
     - O navio destruído entra em animação de naufrágio visual: fade progressivo de alfa (1.0 -> 0.0), leve rotação ou escala decrescente ao longo de 1.5s, submergindo.
     - **Regra do GDD**: Esse navio naufragado é puramente cosmético, já foi removido da simulação, não possui colisor e não pontua novamente.
4. **Texto Flutuante "+1"**:
   - Spawnar texto estilizado em PixiJS (Pixi `BitmapText` ou `Text`) subindo suavemente com desvanecimento na posição do navio destruído.
5. **Chamas de Saúde Crítica (≤25%)**:
   - Exibidas continuamente no mastro/deck enquanto o navio estiver com vida ≤25%.
6. **Comportamento no Pause**:
   - Os efeitos são impulsionados pelo tempo decorrido da simulação. Durante `state === 'paused'`, nenhuma animação de efeito visual de gameplay progride (congelamento total).
7. **Cleanup**:
   - Ao desmontar a arena (`destroy()`), todos os sprites e partículas temporárias são removidos e liberados, sem acúmulo em `live.resources`.

### 3.3 Suporte a `prefers-reduced-motion`
- Monitorar a media query `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Quando ativo:
  - Tremores de câmera (screen shake) são totalmente desligados (intensidade = 0).
  - Número de partículas de detritos reduzido para 0 ou 1 com desvanecimento estático suave.
  - Flashes e strobing são completamente omitidos.
  - A simulação de regras, posições e cronômetros permanece 100% idêntica e determinística.

---

## 4. Arquitetura de Áudio (Web Audio API)

### 4.1 Ciclo de Vida e Desbloqueio por Gesto do Usuário
- Navegadores exigem interação do usuário antes de emitir som (`AudioContext.state === 'suspended'`).
- O `AudioEngine` (`src/audio/audioEngine.ts`) inicia em estado não desbloqueado.
- No primeiro clique do usuário em qualquer controle (ex: botão "Play" no menu, tecla ou toque), executa-se `audioEngine.unlock()` chamando `audioContext.resume()`.
- Se a API de Web Audio não estiver disponível (ex: ambiente de teste Node/Vitest), um adapter nulo (*no-op fallback*) é acionado silenciosamente sem lançar erros.

### 4.2 Controle de Mute e Persistência
- Criar preferência de áudio armazenada no LocalStore (`pirate-battle.options.v1` ou `pirate-battle.preferences.v1`):
  ```ts
  export interface UserPreferences {
    readonly soundMuted: boolean;
  }
  ```
- No DOM:
  - Botão de mute/som no cabeçalho do `BattleHud` (com ícone, estado visual e label acessível `aria-label="Mute audio"` / `"Unmute audio"`).
  - Controle correspondente no formulário de `Options`.
- No `AudioEngine`: Master Gain Node configurado para `0` quando mutado e `1` (com rampa suave de fade para evitar *click/pop*) quando desmutado.

### 4.3 Gestão de Polifonia e Prioridade de Vozes
Para evitar distorção e saturação acústica:
- Máximo de 4 vozes simultâneas para efeitos repetitivos (disparos e impactos na água/madeira).
- Algoritmo de *voice stealing*: o efeito mais antigo do grupo de menor prioridade é interrompido se uma nova voz requisitar execução.
- **Hierarquia de Prioridades**:
  1. **Crítica (inviolável)**: `health_low.wav`, `time_warning.wav`, `game_over.wav`, `game_complete.wav`.
  2. **Alta**: `ship_explosion_1/2.wav`, `ship_collision.wav`, `score_point.wav`, `game_pause.wav`, `game_resume.wav`.
  3. **Média (com pool limitado)**: `cannon_fire_1..3.wav`, `cannon_broadside.wav`, `ship_wood_hit_1/2.wav`.
  4. **Baixa**: `cannonball_water_hit_1/2.wav`, sons de UI.
  5. **Contínua (loops dedicados)**: `ocean_ambience_loop.wav`, `ship_sailing_loop.wav` (ajustado conforme movimento).

### 4.4 Transições de Limiar (Threshold Cues)
- **Vida Baixa (≤25%)**: Um sentinela de estado (`playerHealthCritical`) monitora a vida do jogador. `health_low.wav` toca **uma única vez** no momento em que a vida transita de `> 25%` para `≤ 25%`. Se o jogador permanecer com pouca vida, o som não se repete.
- **10 Segundos Finais**: Um sentinela (`timeWarningTriggered`) monitora o tempo restante. `time_warning.wav` toca **uma única vez** no momento exato em que o tempo restante cruza o limiar de 10 segundos.

### 4.5 Pausa e Prevenção de Backlog
- Ao pausar (`state === 'paused'`):
  - Loops em execução (`ship_sailing_loop.wav`) são pausados/silenciados imediatamente.
  - Toca `game_pause.wav`.
  - Nenhum som de tiro ou impacto acumulado na fila durante o período de pausa é enfileirado para execução posterior.
- Ao retomar (`state === 'playing'`):
  - Toca `game_resume.wav`.
  - Loops de navegação retomam se o navio estiver em movimento.
  - Nenhum som de disparo atrasado é tocado.

---

## 5. Acessibilidade DOM e Live Regions

### 5.1 Live Regions no BattleHud
- Criar container de anúncios em `BattleHud.tsx`:
  ```html
  <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
    {announcement}
  </div>
  ```
- Critérios de anúncio:
  - **Não anunciar** cada segundo do cronômetro nem cada tiro disparado.
  - **Anunciar com clareza**:
    - "Critical damage! Hull integrity below 25 percent."
    - "Warning: 10 seconds remaining."
    - "Enemy destroyed! 1 point scored. Total score: X."
    - "Game paused." / "Game resumed."

### 5.2 Contenção e Restauração de Foco em Diálogos
- Revisar `Dialog` em `App.tsx` e `Options.tsx`:
  - Ao abrir diálogo (Pausa, Abandon, Opções, Resultado), prender o foco (*focus trap* com Shift+Tab e Tab cíclicos).
  - Tecla `Escape` fecha o diálogo onde cabível e retorna o foco ao elemento originador (ex: botão de Pausa ou botão de Opções).
  - Ao fechar o diálogo de pausa, o foco retorna de forma limpa para os controles de batalha sem prender o usuário.

### 5.3 Diferenciação Visual além da Cor
- Chaser e Shooter já possuem silhuetas de casco e desenhos de vela distintos (cruz branca sobre vela vermelha vs caveira sobre vela preta).
- Reforçar nos indicadores e etiquetas acessíveis (e overhead health indicators quando inspecionados) o papel da embarcação (`Chaser` ou `Shooter`), garantindo legibilidade para usuários daltônicos.

---

## 6. Impacto em Contratos, Specs e Estrutura de Arquivos

### 6.1 Specs Afetadas
1. `openspec/specs/simulation-contracts/spec.md`:
   - Adicionar `{ type: 'fire' }` e `{ type: 'water_hit' }` a `SimulationEvent`.
2. `openspec/specs/arena-rendering/spec.md`:
   - Atualizar para cobrir muzzle flashes, impactos, detritos de madeira, explosões de 3 frames, sinking fade, floating +1, overlays de estado de dano (>60%, 25–60%, ≤25%) e respeito a `prefers-reduced-motion`.
3. Nova spec proposta: `openspec/specs/game-audio/spec.md`:
   - Especificação do subsistema de áudio, carregamento de WAVs, gate de gesto, mute persistido, prioridade/polifonia e transições de limiar.
4. `openspec/specs/responsive-hud/spec.md`:
   - Incluir controle de mute e live region `aria-live="polite"` para anúncios críticos de combate.

### 6.2 Arquivos a Criar / Modificar na Fase de Implementação
- **Novos módulos**:
  - `src/audio/audioManifest.ts` (catálogo das URLs dos 27 WAVs).
  - `src/audio/audioEngine.ts` (gerenciador de Web Audio com pool de vozes, mute, loops e prioridades).
  - `src/render/battleEffects.ts` (gerenciador de partículas PixiJS, animações de explosão, fumaça/fogo, debris e sinking fade).
- **Módulos a atualizar**:
  - `src/simulation/contracts.ts` e `engine.ts` (emissão de eventos de tiro e impacto na água).
  - `src/render/assetManifest.ts` (inclusão dos PNGs de explosão, fogo e madeira no carregamento Pixi).
  - `src/render/pixiPreview.ts` (integração de `battleEffects`, congelamento no pause, reduced-motion).
  - `src/ui/BattleHud.tsx` (botão de mute e live regions acessíveis).
  - `src/ui/Options.tsx` (toggle de mute de som).
  - `src/storage/local.ts` (persistência de preferências do usuário).
  - `ASSET_CREDITS.md` (metadados e catálogo verificado de sons e efeitos).

---

## 7. Estratégia de Testes e Validação

1. **Testes Unitários (Vitest)**:
   - Emissão determinística de eventos `fire` e `water_hit` pela simulação em `tests/combat.test.ts`.
   - Limitação de vozes e prioridade no `audioEngine` com mock de `AudioContext`.
   - Transições de limiar únicas (saúde ≤25% e 10 segundos) disparadas exatamente uma vez.
   - Respeito ao estado mudo e persistência de preferências em `tests/storage.test.ts`.
2. **Testes E2E (Playwright)**:
   - Verificação visual e funcional de disparos, muzzle flashes e explosões na arena.
   - Verificação de ausência de sons acumulados após pausa/retomada.
   - Verificação de acessibilidade com teclado (percurso completo de foco nos diálogos e restauração).
   - Verificação de anúncios no elemento `aria-live="polite"` durante eventos de combate.
   - Verificação sob emulação de `prefers-reduced-motion: reduce`.

---

## 8. Conclusão da Exploração

A base arquitetural do projeto está perfeitamente preparada para a recepção do incremento 09. Os assets necessários (tanto visuais quanto sonoros) já estão presentes no repositório em suas formas canônicas. O desacoplamento estrito entre simulação determinística e camadas de apresentação (PixiJS e Web Audio) será preservado integralmente via extensão controlada de `SimulationEvent`.

O caminho técnico está claro, robusto e pronto para a fase `propose`.
