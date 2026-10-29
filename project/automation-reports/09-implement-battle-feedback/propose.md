# Propose — implement-battle-feedback (Incremento 09)

Concluído em 28/10/2026 por `/root/i09_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seções 10 (Acessibilidade e Layout Responsivo) e 11 (Direção de Arte, Assets e Tabela de Especificação de Feedback).
  - `project/automation-reports/09-implement-battle-feedback/explore.md`: Diagnóstico técnico da base, catalogação dos 27 arquivos WAV e dos PNGs de efeitos e peças de navio.
  - `openspec/config.yaml`: Schema `spec-driven` e restrições de idioma (pt-BR com cabeçalhos estruturais e termos SHALL/MUST em inglês).
- **Inventário de Capacidades**:
  - Validação das 14 specs existentes em `openspec/specs/`.
  - Inspeção dos contratos de simulação (`simulation-contracts`), renderização Pixi (`arena-rendering`) e HUD (`responsive-hud`).

## 2. Artefatos Criados

A change `implement-battle-feedback` foi criada em `openspec/changes/implement-battle-feedback/` com schema `spec-driven` e todos os artefatos exigidos:

1. **`proposal.md`**:
   - Motivação fundamentada na carência de acabamento tátil/sonoro e acessibilidade na base atual.
   - Escopo completo de efeitos visuais (muzzle flash, impactos, debris de madeira, explosão de 3 frames, sinking fade, floating +1, modulação do casco em 3 estados), Web Audio com polifonia de 4 vozes e mute persistido, sentinelas de limiar único (saúde ≤25% e 10s finais), coordenação no pause/resume sem acúmulo de backlog acústico, live regions `aria-live="polite"`, contenção de foco em diálogos e respeito a `prefers-reduced-motion`.
   - Mapeamento explícito das 4 capabilities afetadas (1 nova e 3 modificadas).
2. **Delta Specs em `specs/`**:
   - `specs/game-audio/spec.md`: Nova capability com `Purpose` completo (>50 caracteres), descrevendo inicialização por gesto, adaptador silencioso (*no-op fallback*), polifonia com pool máximo de 4 vozes e *voice stealing*, priorização de alertas críticos, sentinelas de limiar único, controle de mute persistido e coordenação acústica no ciclo de vida (descarte de backlog).
   - `specs/arena-rendering/spec.md`: Delta adicionando requisitos de efeitos visuais táteis em PixiJS (muzzle flash, impactos com debris, explosão em 3 frames, sinking fade, floating "+1"), modulações visuais de integridade do casco (healthy >60%, damaged >25% a ≤60%, critical ≤25% com fogo animado contínuo) e congelamento na pausa com conformidade a `prefers-reduced-motion`.
   - `specs/responsive-hud/spec.md`: Delta adicionando live region acessível `aria-live="polite"` para anúncios discretos de marcos de combate (saúde crítica, tempo final, abates e pausa) sem ruído por frame/disparo, botão de mute acessível com área mínima de 48×48 CSS px e contenção/restauração estrita de foco em diálogos modais.
   - `specs/simulation-contracts/spec.md`: Delta estendendo o requisito de contratos independentes para incluir os eventos discriminados puros `{ type: 'fire', ... }` e `{ type: 'water_hit', ... }`, preservando a simulação 100% isolada de bibliotecas gráficas ou de áudio.
3. **`design.md`**:
   - Decisões arquiteturais fundamentadas no relatório de explore:
     - Desacoplamento estrito via eventos de simulação puros.
     - Arquitetura do `BattleEffectsManager` em PixiJS gerenciando ciclos curtos e partículas.
     - Modulação visual de casco em 3 faixas mantendo colisores autoritativos inalterados.
     - Web Audio com master gain, pool de 4 vozes rápidas e bypass para alertas invioláveis.
     - Sentinelas de estado booleano para transições de limiar único.
     - Coordenação no Pause com corte imediato de loops e expurgo total de filas atrasadas no Resume.
     - Acessibilidade com `aria-live="polite"`, focus trap e respeito a `prefers-reduced-motion`.
     - Mapeamento de riscos (autoplay policies, sobrecarga de sprites, poluição de live regions e acúmulo de áudio na pausa) com suas respectivas mitigações.
4. **`tasks.md`**:
   - 19 tarefas pendentes numeradas e organizadas em 5 grupos lógicos sequenciais:
     - Grupo 1: Contratos de Simulação e Eventos Desacoplados (2 tarefas).
     - Grupo 2: Subsistema de Áudio e Gerenciamento de Vozes (4 tarefas).
     - Grupo 3: Gerenciamento de Efeitos Visuais em PixiJS (5 tarefas).
     - Grupo 4: Acessibilidade DOM, HUD e Persistência de Preferências (5 tarefas).
     - Grupo 5: Integração Ponta a Ponta, E2E e Documentação de Procedência (3 tarefas).
   - Cada tarefa define explicitamente sua forma de verificação através de testes unitários (Vitest), tipagem estrita (`npm run build`), testes E2E (Playwright) ou documentação (`ASSET_CREDITS.md`).

## 3. Validação Estrita OpenSpec

Executados no ambiente PowerShell com runtime Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change implement-battle-feedback --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos `done`. |
| `openspec.cmd validate implement-battle-feedback --strict` | 0 | Change `implement-battle-feedback` válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 15 itens validados com sucesso (14 specs existentes + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento formal do incremento 09 está completo e validado com rigor.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão desta fase e acionar o executor da fase `apply` (`/root/i09_apply`) para iniciar a implementação das tarefas descritas em `tasks.md`.
