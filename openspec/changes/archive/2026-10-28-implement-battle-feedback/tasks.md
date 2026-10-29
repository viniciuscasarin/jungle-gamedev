# Tasks

## 1. Contratos de Simulação e Eventos Desacoplados

- [x] 1.1 Estender o discriminated union `SimulationEvent` em `src/simulation/contracts.ts` com as variantes puras `fire` (identificador do atirador, tipo de arma, posições mundiais dos canhões disparados e rumo) e `water_hit` (posição de impacto na água), verificando a tipagem estrita com `npm run build`.
- [x] 1.2 Atualizar o motor de simulação em `src/simulation/engine.ts` para emitir o evento `fire` ao acionar armas válidas e `water_hit` ao expirar projéteis sem colisão, comprovando a emissão determinística através de novos testes unitários em `tests/combat.test.ts`.

## 2. Subsistema de Áudio e Gerenciamento de Vozes

- [x] 2.1 Criar o manifesto e catálogo de mídia sonoro em `src/audio/audioManifest.ts` mapeando os 27 arquivos WAV de `assets/sounds/` categorizados por ambiente, navegação, disparos, impactos, destruição, limiares, interface e marcos de sessão.
- [x] 2.2 Implementar o motor de áudio Web Audio em `src/audio/audioEngine.ts` com desbloqueio exclusivo por primeiro gesto do usuário (`pointerdown`/`keydown`), nó mestre de ganho (*master gain*) para controle de mute, limitação a no máximo 4 vozes simultâneas com *voice stealing*, fila de prioridades e adaptador silencioso (*no-op fallback*).
- [x] 2.3 Implementar sentinelas de limiar único em `src/audio/audioEngine.ts` para disparar `health_low.wav` e `time_warning.wav` exatamente uma vez nas transições de vida crítica (≤25%) e 10 segundos finais, além do descarte completo de backlog acústico no ciclo de pausa e retomada.
- [x] 2.4 Validar o comportamento do motor de áudio, limitação de vozes, prioridades, sentinelas de limiar e descarte de backlog na pausa através de suíte de testes unitários dedicada em `tests/audio.test.ts`.

## 3. Gerenciamento de Efeitos Visuais em PixiJS

- [x] 3.1 Registrar as texturas de efeitos (`explosion_1..3.png`, `fire_1..2.png`) e partes de navio (`wood_1..4.png`) no carregador de assets em `src/render/assetManifest.ts` e verificar o carregamento integrado.
- [x] 3.2 Implementar o gerenciador de efeitos visuais `src/render/battleEffects.ts` suportando clarões de disparo (*muzzle flash*), partículas de detrito de madeira (`wood_1..4.png`) com rotação e fade em impactos, animação de explosão em 3 frames (`explosion_1..3.png`), desvanecimento (*sinking fade*) progressivo de navios derrotados e indicador flutuante "+1" ao pontuar.
- [x] 3.3 Implementar modulações de integridade do casco nos navios em `src/render/battleEffects.ts` e `src/render/pixiPreview.ts`: estado padrão para integridade saudável (>60%), desgaste visual para avaria intermediária (>25% a ≤60%) e escurecimento com chamas animadas contínuas no deck para estado crítico (≤25%), preservando inalterados os colisores autoritativos.
- [x] 3.4 Integrar o ciclo de vida dos efeitos visuais ao loop da arena em `src/render/pixiPreview.ts`, garantindo congelamento estrito de partículas e animações quando a partida estiver em `Paused` e mitigação completa sob media query `prefers-reduced-motion` (desativação de tremores de tela e redução de partículas).
- [x] 3.5 Validar o ciclo de vida, congelamento na pausa, descarte de recursos no `destroy()` e conformidade com reduced-motion através de testes automatizados em `tests/render.test.ts`.

## 4. Acessibilidade DOM, HUD e Persistência de Preferências

- [x] 4.1 Expandir as opções e preferências do usuário em `src/storage/local.ts` para incluir a preferência `soundMuted: boolean` com persistência segura no LocalStorage e valor padrão falso, validando o esquema em `tests/storage.test.ts`.
- [x] 4.2 Adicionar controle de mute de som acessível com label semântico e ícone visual no cabeçalho de `src/ui/BattleHud.tsx` e nas configurações em `src/ui/Options.tsx`, assegurando área de toque mínima de 48×48 CSS px no modo touch.
- [x] 4.3 Implementar live region acessível com `role="status"` e `aria-live="polite"` em `src/ui/BattleHud.tsx` para anunciar marcos críticos (saúde ≤25%, 10 segundos finais, pontuação por abate, pausa e retomada), sem poluir leitores de tela com anúncios a cada frame ou disparo rotineiro.
- [x] 4.4 Implementar contenção (*focus trap*) de navegação por teclado (`Tab`/`Shift+Tab`) e restauração segura de foco em `src/ui/Dialog.tsx` para diálogos modais de Pausa, Opções, Confirmação de Abandono e Resultado.
- [x] 4.5 Validar a navegação acessível por teclado, anúncios da live region e alternância de mute através de testes de componentes React em `tests/hud.test.ts`.

## 5. Integração Ponta a Ponta, E2E e Documentação de Procedência

- [x] 5.1 Atualizar `ASSET_CREDITS.md` catalogando formalmente a procedência e metadados de todos os arquivos de efeitos (`assets/png/default/effects/*`, `ship_parts/wood_*.png`) e áudio (`assets/sounds/*.wav`) utilizados no projeto sem presumir licenças não documentadas.
- [x] 5.2 Implementar testes ponta a ponta (E2E) no Playwright em `tests/e2e/battle-feedback.spec.ts` cobrindo desbloqueio de áudio por gesto, silenciamento via botão de mute, verificação da live region acessível, retenção de foco nos diálogos modais e supressão de tremores sob emulação de `prefers-reduced-motion: reduce`.
- [x] 5.3 Executar a suíte completa de testes unitários e de integração (`npm test`) e checagem de tipos estrita (`npm run build`), garantindo regressão zero e aprovação de 100% dos testes da aplicação.

## Workflow follow-up

- Submeter a proposta para aprovação do coordenador e do usuário.
- Iniciar a fase de implementação via `openspec-apply-change` após confirmação explícita.
