# Design

## Context

A base de código estabeleceu no incremento 08 um HUD responsivo e suporte a controles touch e desktop sobre uma simulação determinística autoral de 60 Hz (`engine.ts`, `combat.ts`, `contracts.ts`). Para a motivação e escopo deste incremento, consulte `proposal.md`. As seções 10 e 11 do GDD estabelecem a exigência de feedback de combate rico (muzzle flashes, impactos, detritos de madeira, explosões de 3 frames, fade de naufrágio, floating "+1", overlays de avaria do casco), áudio completo com Web Audio (vozes limitadas, prioridades, mute persistido, sentinelas de limiar único) e acessibilidade (live regions sem anúncios abusivos, foco em diálogos e suporte a `prefers-reduced-motion`).

## Goals / Non-Goals

**Goals:**
- Manter a simulação matemática e determinística 100% pura e desacoplada de WebGL/PixiJS, Web Audio e DOM.
- Integrar efeitos visuais táteis em PixiJS para disparos, impactos na água/casco, explosões, naufrágio e pontuação sem comprometer a leitura dos projéteis e das margens de ilhas.
- Implementar subsistema sonoro robusto com Web Audio API baseado nos 27 arquivos WAV fornecidos, com desbloqueio no primeiro gesto, controle de polifonia (máx 4 vozes), priorização de alertas e mute persistido.
- Garantir comportamento limpo no ciclo de vida: congelamento total na pausa e eliminação completa de sons acumulados (*backlog*) na retomada (*resume*).
- Fornecer acessibilidade via live regions discretas (`aria-live="polite"`), contenção e restauração de foco em diálogos e mitigação sob `prefers-reduced-motion`.
- Documentar com rigor a procedência dos novos assets em `ASSET_CREDITS.md`.

**Non-Goals:**
- Não alterar parâmetros de balanceamento de velocidade, dano, recarga ou tamanho de arenas.
- Não implementar backend REST real nem persistência remota (escopo do incremento 10).
- Não inferir licenças legais presumidas para os assets fornecidos.
- Não permitir que efeitos cosméticos pós-morte tenham física, colisão ou pontuação.

## Decisions

### 1. Desacoplamento via eventos de simulação estendidos
A simulação não conhece PixiJS nem Web Audio.
- **Decisão**: Estender `SimulationEvent` em `src/simulation/contracts.ts` com duas variantes puras:
  - `{ type: 'fire', shooterId: string, weapon: PlayerWeapon | 'shooter', positions: readonly WorldPoint[], headingRadians: number }`
  - `{ type: 'water_hit', position: WorldPoint }`
- **Alternativa rejeitada**: Chamar callbacks de áudio/partículas diretamente dentro do `engine.ts` ou inspecionar o snapshot a cada frame para inferir disparos. Rejeitada porque viola o isolamento da simulação e impede testes puros sem DOM/áudio.

### 2. Gerenciador de Efeitos Visuais em PixiJS (`BattleEffectsManager`)
Criar o módulo `src/render/battleEffects.ts` acoplado ao ciclo da arena em `pixiPreview.ts`.
- **Decisão**: O `BattleEffectsManager` gerencia pools e lifecycles de:
  - *Muzzle Flashes*: Sprites de chamas posicionados na ponta dos canhões, orientados pelo rumo do tiro, com duração de ~100 ms.
  - *Detritos de Madeira (Debris)*: Ao receber `damage`, spawnar de 2 a 4 fragmentos (`wood_1..4.png`) com velocidade radial, rotação aleatória e desvanecimento (*alpha fade*) em 350–500 ms.
  - *Explosão em 3 frames*: Ao receber `destruction` ou colisão fatal, animar a sequência `explosion_1` → `explosion_2` → `explosion_3` (totalizando ~400 ms) combinada com detritos maiores.
  - *Fade de Naufrágio (Sinking)*: O navio destruído tem seu sprite desacoplado da simulação e animado com redução gradual de opacidade (1.0 → 0.0) e leve afundamento/rotação ao longo de 1.5s antes da remoção final.
  - *Floating Score "+1"*: Pixi `Text` renderizado na cor dourada/branca subindo suavemente e desvanecendo em 800 ms.
- **Alternativa rejeitada**: Criar navios mortos mantidos na simulação como obstáculos. Rejeitada conforme o GDD: o navio derrotado é cosmético, não colide e não pontua.

### 3. Modulação e Overlays de Estado do Casco
- **Decisão**: Como não existem sprites de casco quebrado para os navios específicos, aplicar a modulação visual definida no GDD 11:
  - *Healthy (>60%)*: Sprite padrão original.
  - *Damaged (>25% e ≤60%)*: Tonalidade de desgaste ou filtro escurecido sutil no sprite do navio.
  - *Critical (≤25%)*: Escurecimento mais evidente e adição de animação cíclica de chamas (`fire_1.png` / `fire_2.png`) ancorada no deck do navio.
  - Em todos os casos, a hitbox e os colisores físicos permanecem rigorosamente idênticos.

### 4. Arquitetura de Áudio Web Audio com Polifonia e Voice Stealing
Criar `src/audio/audioEngine.ts` e `src/audio/audioManifest.ts`.
- **Decisão**:
  - Utilizar uma única instância de `AudioContext` nativa, roteando todas as vozes para um `masterGainNode` central (controlado pelo mute).
  - Dividir o subsistema em pools:
    - *Vozes de Efeito Rápido*: Limite de 4 vozes simultâneas. Quando um 5º som de efeito (disparo, impacto) tenta tocar, aplica-se *voice stealing* descartando o efeito mais antigo.
    - *Vozes Críticas (Invioláveis)*: Alertas de vida baixa, aviso de tempo, vitória e derrota tocam sem competir com o pool limitado.
    - *Loops Contínuos*: Nós dedicados para `ocean_ambience_loop.wav` e `ship_sailing_loop.wav`.
  - Desbloqueio por gesto do usuário: `audioEngine.unlock()` é chamado no primeiro `pointerdown` ou `keydown` na janela, invocando `audioContext.resume()`.
  - Fallback silencioso: Em ambientes onde `window.AudioContext` inexiste (Node/Vitest), instancia-se um adaptador *no-op* transparente.

### 5. Sentinelas de Limiar Único (*Threshold Sentinels*)
- **Decisão**: Para atender à diretriz do GDD de emitir os alertas de vida crítica e contagem final uma única vez:
  - Implementar sentinelas de estado booleano no controlador de áudio e no HUD:
    - `lowHealthTriggered`: torna-se `true` quando `health / maxHealth <= 0.25`. Dispara `health_low.wav` e o anúncio acessível exatamente nessa borda.
    - `timeWarningTriggered`: torna-se `true` quando `remainingSeconds <= 10`. Dispara `time_warning.wav` e o anúncio acessível exatamente nessa borda.
  - Ambos são reiniciados apenas no reset da partida.

### 6. Coordenação de Ciclo de Vida e Eliminação de Backlog no Pause
- **Decisão**:
  - Na pausa: loops são interrompidos imediatamente, toca-se `game_pause.wav` e os efeitos visuais congelam no frame atual.
  - Nenhum evento de som emitido ou atrasado durante a pausa é enfileirado para execução posterior.
  - Na retomada: toca-se `game_resume.wav` e apenas os loops de navegação (se em movimento) são restaurados.

### 7. Acessibilidade DOM com Live Regions e Focus Trap
- **Decisão**:
  - Adicionar ao `BattleHud.tsx` um elemento `<div role="status" aria-live="polite" className="sr-only">`.
  - Apenas eventos notáveis geram strings na região: "Critical damage! Hull integrity below 25 percent", "Warning: 10 seconds remaining", "Enemy destroyed! 1 point scored", "Game paused", "Game resumed".
  - Reforçar nos diálogos modais (`Dialog.tsx`) a retenção do foco de navegação por teclado (`Tab` / `Shift+Tab`) e a devolução do foco para o elemento originador ao fechar.

### 8. Suporte a `prefers-reduced-motion`
- **Decisão**: Detectar via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
  - Quando ativo: suprimir tremores de câmera, suprimir flashes de tela, limitar partículas de detrito a transições suaves estáticas.
  - A lógica de colisão, física de navios e cronômetros da simulação permanece inalterada.

## Risks / Trade-offs

- **[Autoplay Policy do Navegador]** Navegadores bloqueiam áudio automático sem interação prévia.
  → *Mitigação*: Desbloqueio estrito de áudio no primeiro gesto do usuário (`pointerdown`/`keydown`), com estado inicial dormente seguro.
- **[Sobrecarga de Partículas e Degradação de FPS]** Múltiplos disparos e explosões simultâneas podem acumular centenas de sprites em cena.
  → *Mitigação*: Lifecycles curtos (100–500 ms), limite máximo de detritos simultâneos e limpeza obrigatória no `destroy()` do renderizador.
- **[Poluição de Leitores de Tela]** Anúncios em excesso em combate rápido tornam o leitor de tela incompreensível.
  → *Mitigação*: Uso de `aria-live="polite"` estritamente limitado a transições de limiar (vida baixa, 10s), abates de inimigos e pausas, sem anunciar tiros normais ou frames.
- **[Acúmulo de Som na Pausa]** Sons disparados no milissegundo de pausa podem tocar em rajada no despausar.
  → *Mitigação*: Esvaziamento total da fila de áudio na pausa; descarte de qualquer buffer de reprodução acumulado.

## Migration Plan

Nenhuma migração de dados é necessária. As preferências do usuário no armazenamento local serão expandidas para incluir a chave de áudio silenciado (`soundMuted: boolean`), preservando compatibilidade com entradas anteriores do `LocalStore`.
