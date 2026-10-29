# Apply — implement-battle-feedback

Executor `/root/i09_apply`, 28/10/2026. Skill `openspec-apply-change`, runbook, contexto e requisitos do incremento 09 integralmente lidos e implementados. A change `implement-battle-feedback` introduz feedback sensorial completo (áudio posicional/reativo, efeitos visuais em PixiJS e acessibilidade sensorial/motora em DOM), mantendo estrita separação entre a física autoritativa da simulação e o subsistema de apresentação. Nenhuma alteração foi realizada em `project/automation-state.json`, e nenhuma operação de push, deploy ou publish foi acionada.

---

## 1. Implementação dos Grupos de Tarefas

### Grupo 1: Contratos de Simulação e Eventos Desacoplados
- **Contratos Puros (`src/simulation/contracts.ts`)**:
  - Estendido o discriminated union `SimulationEvent` com as variantes estritas e imutáveis `fire` (`shooterId`, `weapon`, `positions`, `headingRadians`) e `water_hit` (`position`).
  - Re-exportado o tipo `PlayerWeapon` em `src/simulation/combat.ts` para acesso canônico nos efeitos de áudio e renderização.
- **Emissão Determinística (`src/simulation/engine.ts`)**:
  - O motor de simulação agora emite o evento `fire` ao acionar canhões válidos tanto do jogador quanto de inimigos com arma ativa, registrando as coordenadas globais de cada bala disparada.
  - Ao expirar o tempo de voo de um projétil em águas abertas sem colidir com navio ou terra firme, é emitido deterministamente o evento `water_hit`.
  - Novos testes unitários dedicados em `tests/combat.test.ts` e validação de schema em `tests/contracts.test.ts`.

### Grupo 2: Subsistema de Áudio e Gerenciamento de Vozes
- **Catálogo de Mídia (`src/audio/audioManifest.ts`)**:
  - Catalogados todos os 27 arquivos de áudio WAV (`assets/sounds/`), categorizados por ambiente (`ambient`), navegação (`navigation`), disparos (`combat_fire`), impactos (`impact`), destruição (`destruction`), limiares (`threshold`), interface (`ui`) e marcos (`session`).
  - Atribuídos níveis de prioridade formais (`PriorityLevel`: `critical`, `high`, `medium`, `low`) para resolução de concorrência.
- **Motor Web Audio (`src/audio/audioEngine.ts`)**:
  - Implementado o motor de áudio baseado na Web Audio API com desbloqueio exclusivo no primeiro gesto do usuário (`pointerdown`/`keydown`).
  - *Voice Stealing* determinístico limitando a reprodução simultânea a no máximo 4 vozes transientes ativas, com priorização estrita (vozes de prioridade mais alta desalojam vozes mais baixas ou mais antigas).
  - Nó mestre de ganho (*Master Gain*) para controle instantâneo de mute.
  - Sentinelas de limiar único para os marcos acústicos `health_low.wav` (integridade do casco ≤ 25%) e `time_warning.wav` (10 segundos finais), sem disparos repetidos.
  - Descarte completo do backlog acústico acumulado no ciclo de pausa e retomada (`onPause`/`onResume`).
  - Fallback transparente (*silent no-op*) para ambientes sem Web Audio API ou durante bloqueio de permissão.
  - Cobertura de 7 testes unitários puros em `tests/audio.test.ts`.

### Grupo 3: Gerenciamento de Efeitos Visuais em PixiJS
- **Carregador de Assets (`src/render/assetManifest.ts`)**:
  - Registradas as 9 texturas de partículas e efeitos: `explosion_1..3.png`, `fire_1..2.png`, `wood_1..4.png`.
- **Gerenciador de Efeitos de Batalha (`src/render/battleEffects.ts`)**:
  - Clarões de disparo (*muzzle flashes*) no instante da emissão de `fire`.
  - Partículas de detrito de madeira (`wood_1..4.png`) com dispersão física radial, velocidade, desaceleração e desvanecimento alfa em impactos.
  - Animação de explosão em 3 frames (`explosion_1..3.png`) na destruição de embarcações.
  - Desvanecimento suave (*sinking fade*) de navios derrotados antes da remoção visual.
  - Indicador flutuante "+1" subindo com atenuação alfa ao pontuar.
  - Modulação de integridade do casco sem alterar a física autoritativa: estado padrão (>60%), desgaste visual intermediário (>25% a ≤60%), e escurecimento com chamas animadas contínuas no convés para estado crítico (≤25%).
- **Integração no Loop e Acessibilidade (`src/render/pixiPreview.ts`)**:
  - Congelamento estrito de animações e partículas durante o estado `Paused`.
  - Respeito à media query `prefers-reduced-motion: reduce`: desativação de tremores de tela (*camera shake*) e redução drástica da densidade e velocidade das partículas.
  - Descarte completo no `destroy()` liberando texturas e containers do PixiJS.
  - Cobertura com 6 testes unitários em `tests/render.test.ts`.

### Grupo 4: Acessibilidade DOM, HUD e Persistência de Preferências
- **Persistência de Áudio (`src/storage/local.ts`)**:
  - Adicionada a chave `pirate-battle.sound-muted.v1` em `AUDIO_KEYS` para gerenciar a preferência booleana `soundMuted` no LocalStorage com valor padrão falso.
  - Cobertura de testes unitários de armazenamento em `tests/storage.test.ts`.
- **Controle Acessível de Mute (`src/ui/BattleHud.tsx`, `src/ui/Options.tsx`)**:
  - Botão de alternância com ícones visuais (🔇 / 🔊) e texto alternativo semântico (`Sound muted` / `Sound active`) via classe `.sr-only`.
  - Alvo de toque mínimo com `min-width: 48px; min-height: 48px` para total conformidade com WCAG 2.5.5 / 2.5.8.
- **Live Region para Leitores de Tela (`src/ui/BattleHud.tsx`)**:
  - Integrada live region `role="status"` e `aria-live="polite"` no elemento `#sailing-instructions` para anunciar eventos críticos únicos: casco crítico (≤25%), aviso de 10 segundos, pontuação por abate, pausa e retomada, sem poluir com ruído frame a frame.
- **Contenção de Foco em Diálogos Modais (`src/ui/Dialog.tsx`)**:
  - Implementado componente `Dialog` com captura e retenção de foco por teclado (`Tab` e `Shift+Tab`) em ciclo fechado.
  - Tecla `Escape` configurável para acionar cancelamento/retomada.
  - Restauração automática de foco para o elemento disparador no unmount.
  - Cobertura com 5 testes de componentes em `tests/hud.test.ts`.

### Grupo 5: Integração, Documentação e E2E
- **Catalogação de Procedência (`ASSET_CREDITS.md`)**:
  - Documentação formal da origem, metadados e procedência dos 27 sons WAV e das texturas de efeitos adicionadas.
- **Documentação de Arquitetura (`ARCHITECTURE.md`)**:
  - Atualizada a matriz de módulos arquiteturais para incluir o novo subsistema `src/audio`.
- **Testes Ponta a Ponta (`tests/e2e/battle-feedback.spec.ts`)**:
  - 8 testes E2E Playwright cobrindo desbloqueio por gesto, sincronização de mute entre HUD e Opções, anúncios da live region, contenção e restauração de foco em diálogo modal e conformidade com `prefers-reduced-motion`.

---

## 2. Comandos e Resultados de Validação

Todos os comandos foram executados no runtime Node.js v26.11.1 com o PATH prepend configurado.

| Comando | Resultado | Duração / Detalhes |
|---|---|---|
| `npm run lint` | Exit 0 | 0 erros, 0 warnings (regras ESLint estritas) |
| `npm run typecheck` | Exit 0 | Tipagem TypeScript aprovada em `tsconfig.json` e `tsconfig.core.json` |
| `npm test -- --run` | Exit 0 | **18 arquivos, 261 testes unitários aprovados** (100% de sucesso, regressão zero dos 238 anteriores) |
| `npm run build` | Exit 0 | Compilação Vite client gerada em `dist/` com sucesso |
| `npx playwright test tests/e2e/battle-feedback.spec.ts` | Exit 0 | **8/8 testes aprovados** (dev e preview) |
| `npx playwright test tests/e2e/options.spec.ts` | Exit 0 | **10/10 testes aprovados** (dev e preview) |
| `openspec validate implement-battle-feedback --strict` | Exit 0 | Proposta e tarefas 100% validadas contra o schema |

---

## 3. Estado dos Artefatos OpenSpec

- `openspec/changes/implement-battle-feedback/proposal.md`: Válido e aprovado.
- `openspec/changes/implement-battle-feedback/design.md`: Válido e aprovado.
- `openspec/changes/implement-battle-feedback/specs/`: Especificações delta completas e validadas.
- `openspec/changes/implement-battle-feedback/tasks.md`: **19/19 tarefas marcadas como concluídas (`[x]`)**.
- `project/automation-state.json`: Intacto / inalterado.
- Repositório Git: Nenhum push, deploy ou commit remoto executado.

---

## 4. Conclusão da Fase Apply

A fase Apply do incremento 09 foi finalizada com êxito. O sistema está plenamente funcional, estabilizado, testado e pronto para a fase de verificação independente (`Verify`).
