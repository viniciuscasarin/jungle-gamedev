# Proposal

## Why

A arena de combate e os controles responsivos já operam com estabilidade, mas o jogo carece de acabamento audiovisual e acessibilidade plena exigidos nas seções 10 e 11 do GDD. Tiros, impactos, colisões e naufrágios não exibem animações táteis nem sons, os navios não refletem avarias de casco e os jogadores com restrições visuais ou auditivas não recebem anúncios semânticos discretos nem suporte a redução de movimento. O incremento 09 integra os efeitos visuais em PixiJS, a arquitetura de áudio Web Audio desacoplada com polifonia controlada e mute, anúncios via live regions e mitigação de sensibilidade a movimento, preservando a simulação determinística pura.

## What Changes

- **Efeitos visuais de combate em PixiJS**:
  - Muzzle flashes curtos na ponta dos canhões nos disparos frontais e broadside (bombordo/boreste).
  - Impactos no casco com pequenos detritos de madeira (`wood_1..4.png`) se dispersando com fade.
  - Animação de explosão em 3 frames (`explosion_1..3.png`), detritos e fade progressivo de afundamento/naufrágio na destruição ou colisão fatal.
  - Indicador flutuante "+1" subindo suavemente ao abater inimigos.
  - Modulação visual do casco conforme a integridade: *healthy* (>60%), *damaged* (>25% e ≤60% com desgaste visual) e *critical* (≤25% com animação contínua de chamas `fire_1..2.png` sobre o deck).
  - Efeitos cosméticos pós-morte desprovidos de colisão e incapazes de pontuar novamente.
  - Congelamento completo de todas as partículas e efeitos visuais durante o estado `Paused`.
  - Respeito estrito a `prefers-reduced-motion` (desativação de flashes, vibrações de tela e redução de partículas sem alterar a simulação determinística).

- **Subsistema de áudio Web Audio (`game-audio`)**:
  - Carregamento de áudio com desbloqueio exclusivo por gesto inicial do usuário (*audio unlock*).
  - Gerenciamento de polifonia com pool máximo de 4 vozes simultâneas e algoritmo de *voice stealing* priorizando alertas críticos sobre tiros e impactos repetitivos.
  - Avisos acústicos de limiar (*threshold cues*) disparados uma única vez na transição: saúde crítica (≤25%) e contagem final de 10 segundos.
  - Controle de mute acessível no BattleHUD e na tela de Opções, com persistência em armazenamento local (`soundMuted`).
  - Coordenação acústica no Pause/Resume: corte imediato de loops de navegação, disparo dos jingles correspondentes e descarte integral de backlog acústico (nenhum som acumulado toca no retorno).
  - *Fallback* silencioso (*no-op adapter*) para ambientes sem suporte a Web Audio (como testes automatizados).

- **Acessibilidade e Live Regions DOM (`responsive-hud`)**:
  - Live region `aria-live="polite"` no BattleHUD anunciando com parcimônia marcos críticos de combate (dano crítico com integridade ≤25%, aviso de 10 segundos restantes, pontuação por abate, pausa e retomada), sem poluir a leitura com anúncios frame a frame ou tiro a tiro.
  - Reforço acessível na identificação de arquétipos inimigos (diferenciação semântica além de cor de vela).
  - Contenção (*focus trap*) e restauração correta de foco do teclado em todos os diálogos modais (Pause, Options, Confirm Abandon, Result).

- **Extensão de contratos puros de simulação (`simulation-contracts`)**:
  - Adição dos eventos `{ type: 'fire', ... }` e `{ type: 'water_hit', ... }` ao discriminated union `SimulationEvent`, mantendo a simulação 100% isolada de dependências de tela ou áudio.

- **Atualização de documentação de procedência**:
  - Registro de todas as novas mídias utilizadas (efeitos PNG e WAVs de sons) em `ASSET_CREDITS.md` sem atribuição de licença presumida.

## Capabilities

### New Capabilities
- `game-audio`: Arquitetura do subsistema de áudio (Web Audio API), desbloqueio por gesto, roteamento com master gain, polifonia e prioridade de vozes, sentinelas de limiar único, controle de mute persistido, descarte de backlog acústico no Pause/Resume e fallback silencioso.

### Modified Capabilities
- `arena-rendering`: Efeitos visuais em PixiJS (muzzle flashes, impactos na água e no casco com debris, explosões em 3 frames, fade de naufrágio, floating text "+1"), modulações de estado de integridade do casco (>60%, 25–60%, ≤25%), congelamento visual na pausa e conformidade com `prefers-reduced-motion`.
- `responsive-hud`: Live region acessível `aria-live="polite"` para anúncios não intrusivos de marcos de batalha, controle visual e acessível de áudio mute e contenção/restauração estrita de foco em diálogos.
- `simulation-contracts`: Extensão do contrato de eventos autoritativos `SimulationEvent` com variantes puras de disparo (`fire`) e impacto na água (`water_hit`), permitindo gatilhos desacoplados para renderização e áudio.

## Impact

- Afeta `src/simulation/contracts.ts`, `src/simulation/engine.ts` (emissão de novos eventos sem alterar lógica de combate).
- Novos módulos em `src/audio/` (`audioEngine.ts`, `audioManifest.ts`, contratos de áudio).
- Novos módulos em `src/render/` (`battleEffects.ts`, registro em `assetManifest.ts` e orquestração em `pixiPreview.ts`).
- Atualizações em `src/ui/BattleHud.tsx`, `src/ui/Options.tsx`, `src/ui/Dialog.tsx` e `src/storage/local.ts`.
- Atualização em `ASSET_CREDITS.md`.
- Cobertura por testes unitários em Vitest (`tests/audio.test.ts`, `tests/combat.test.ts`, `tests/storage.test.ts`) e testes ponta a ponta com Playwright (`tests/e2e/battle-feedback.spec.ts`).
- Sem introdução de novas dependências npm externas (usa estritamente Web Audio nativo, PixiJS v8 e React existentes).
