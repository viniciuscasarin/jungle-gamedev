# Apply — implement-player-combat

Concluído em 27/10/2026 por `/root/i04_apply`, pronto para verify independente.
Schema spec-driven; CLI confirma **21/21 tasks, state all_done**. Checkboxes foram
conferidos no arquivo atual e marcados somente após evidências, com nova consulta
instructions apply depois de cada tarefa. Nenhum sync/archive/push/deploy.

## Contexto e autorização

Lidos skill local .agents/skills/openspec-apply-change/SKILL.md, automação,
relatórios explore/propose04, GDD, config, artifacts CLI, código/specs pertinentes.
Contexto comum e bloco04 extraídos por regex encerrando antes05; nenhum prompt
futuro lido. Autorização antecipada de project/automation.md aplicada às decisões
locais. automation-state.json não editado. Arquivos preexistentes/untracked e
histórico01–03 preservados. Não delegados novos executores.

## Entrega e decisões verificadas

- Contratos readonly de projétil incluem ownerId/faction/damage/speed/radius/heading/
  lifetime. sourceId dos eventos é o emissor. Balas mantêm proveniência após morte.
  Dados iniciais opcionais copiados/validados/congelados, sem setters posteriores.
- Config centraliza raio5 e clearance0,5 como hipóteses técnicas, preservando números
  GDD. Q segue frente real; W/E usam origens longitudinais−14/0/+14 e velocidades
  paralelas. Afastamento lateral sqrt(23,5²−s²) mantém cada centro fora do casco.
  Emissão usa posição/rumo após navegação, não mira independente.
- Armas prontas, deadlines independentes de tempo ativo, epsilon1e-7ms; release não
  reinicia recarga. Balas novas movem no passo seguinte. Freeze/stall descartado
  preservam acumulador/loop existentes.
- Sweep usa faces/vértices do litoral, limites e hostis vivos, menorTOI global,
  sólido no empate e ID estável entre cascos. Lifetime parcial limita o segmento,
  incluindo hit no fim exato. Tangência/ocupação inicial consome emt0, mesmo se a
  trajetória tangencia ou afasta. Resposta de slide do casco permanece.
- Segmento emissão→muzzle e ocupação final bloqueiam coast/bounds; bala bloqueada
  consome cooldown e demais válidas sobrevivem. Parede fina entre casco e destino
  ambos válidos prova por que endpoint apenas seria insuficiente.
- Dano único, saúde limitada a0, morte atômica, remoção imediata do casco e exatamente
  um ponto por inimigo morto por bala do player. Sem friendlyfire/piercing/bala×bala;
  aliados não consomem. Eventos por passo e histórico profundamente imutável.
- Ordem: balas existentes porID → navegação viva → contato mínimo → emissão →
  publicação. Chaser estacionário causa25/autodestrói/0score; Shooter sem dano de
  casco. Player morto não age nem causa contatos posteriores. Sem IA/spawn.
- Q/W/E held coexistem com mouse/R por borda. Keyup/contexto/freeze/teardown limpam
  held; repeat não reativa tecla limpa. Captura restrita ao host ativo.
- combatScenario=targets seleciona somente preparação inicial real Chaser40 e
  Shooters60 em água/alcance. Default vazio, sem grantScore/kill/teleport.
- Cannonball10×10 no manifest/cache/créditos. Sprites reconciliados por snapshot,
  descartados sem destruir texturas emprestadas. Mesmo owner e umRAF.
- React mostra Score, Q/W/E Ready/segundos e auto-sail On/Off, somente por mudanças
  de décimo/transições. Cooldown fora de aria-live. Bandas desktop/320/landscape
  preservam o mundo. README/ARCHITECTURE/ASSET_CREDITS atualizados em inglês.

## Comandos e resultados

PATH alterado somente por processo com Node26.11.1 indicado no roteiro; usados
npm.cmd/openspec.cmd. Chromium existente por PLAYWRIGHT_CHROMIUM_EXECUTABLE.
Nenhuma instalação/configuração global alterada.

| Comando | Exit code | Resultado |
| --- | --- | --- |
| openspec.cmd list --json |0| raiz nearest válida/change correta |
| openspec.cmd status --change implement-player-combat --json |0| schema e contextFiles conferidos |
| openspec.cmd instructions apply --change implement-player-combat --json |0 por consulta| progresso0→21; final all_done |
| npm.cmd run lint |0| repetido após ajuste final |
| npm.cmd run typecheck |0| app/testes/config e core semDOM |
| npm.cmd test |0| **112 testes/10 arquivos**, incluindo29 combate; após ajuste final |
| npm.cmd run build |0| typecheck e produção; repetido após tangência inicial |
| npm.cmd run e2e -- --max-failures=1 (escalado) |0| **20/20 dev+preview**, log e HTML preservados |
| npm.cmd run e2e -- --grep 'real Q W E\|held QWE\|default empty' --reporter=list --output project/automation-reports/04-implement-player-combat/post-touch-test-results (escalado) |0| **6/6** afetados após ajuste final de tangência, sem sobrescrever HTML20/20 |
| openspec.cmd validate implement-player-combat --strict |0| válida, repetido após21/21 |

## Evidências e revisão

Core cobre cardinais/oblíquos/giro, sete tiros simultâneos em navegação, distância
fora do casco/paralelismo; fronteiras350/1200 sem passo extra, release/repress,
freeze/stall; ilha inteira, protegido, menorTOI/ordem invertida/empates, canto/limite,
mu​zzle bloqueado/muro fino; lifetime parcial/fim exato; facções/aliados/balas cruzadas,
emissor morto, overkill/multihits, score por ambos arquétipos, eventos por passo,
contato isolado/morte antes de contato, player morto inativo, determinismo/histórico.
Testes de navegação existentes continuam passando.

Browser opera mouse/Q/W/E/R reais e colisões para matar3alvos e ganhar3pontos.
Anexos readonly incluem início, sete balas/direções, mortes e navegação simultânea.
Testa held em blur nativo/hidden, cooldown/lifetime congelados30s, Resume sem held,
modificadores/editor/botão fora do contexto, default vazio e cinco ciclos com balas
ativas. Auditoria nativa conserva umRAF, cache aquecido e contagens de listeners/
observers retornando ao baseline. Sem setters de gameplay.

Evidências04: e2e-final.log, e2e-post-touch.log, playwright-report/index.html,
test-results/, post-touch-test-results/ e browser-evidence/. Capturas de combate
desktop,320×568 e844×390 em dev/preview abertas e inspecionadas: indicadores,
instruções/ações legíveis e mundo inteiro. Histórico01–03 não sobrescrito.
Os sete deltas foram confrontados com contratos/config/runtime/input/UI/catálogo/
renderer e testes. Nenhuma exigência removida para concluir.

## Ensaios corrigidos e limites reais

- Chromium no sandbox saiu3221225506 no launch: não executou gameplay. Tentativa
  finalizada com Ctrl+C/exit1. Reexecuções escaladas aprovadas concluíram. Não há
  rejeição de aprovação pendente.
- Dois primeiros testes unitários tinham coordenadas/expectativas de fixture
  incorretas; corrigidos conforme geometria. Final112/112 passou.
- Clock Playwright substitui o wrapperRAF auditado. Cinco ciclos dinâmicos usam
  tempo nativo e conservam asserção deumRAF, sem enfraquecer auditoria.
- E2E expôs preparação assíncrona versus intervalo curto40ms. Helper aguarda3passos
  neutros do loop real para baseline antes de inputs; conserva asserção de7balas
  e verifica foco do host. Suíte20/20 passou após correção.
- Hidden é sinal emulado document.hidden+visibilitychange porque Chromium automático
  mantém visibilidade em abas de fundo. Blur usa transição nativa CDP/outra aba.
  Não é alegada validação hiddenOS real. Nenhum callback de gameplay é invocado.
- Build mantém aviso informativo chunk>500kB. Headless local não prova desempenho
  físico. HUD final, IA/spawn, lifecycle/resultados, touch, API, áudio e efeitos
  completos permanecem fora desta etapa.

## Handoff

APPLY concluído sem bloqueio. Próximo executor: VERIFY independente contra artifacts,
GDD e evidências. Após verify satisfatório, orquestrador inicia sync/archive em fase
própria. Esta execução não os realizou nem alterou automation-state.json.
