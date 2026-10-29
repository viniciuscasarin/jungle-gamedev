# Apply — implement-enemies-and-spawning

Fase APPLY concluída por `/root/i05_apply` em 28/10/2026. Change `implement-enemies-and-spawning`, schema `spec-driven`, 17 tarefas implementadas e verificadas. Skill `.agents/skills/openspec-apply-change/SKILL.md`; autorização antecipada em `project/automation.md`. Pronto para VERIFY independente. Sem sync/archive, push, deploy ou alteração de automation-state.json nesta fase.

## Fontes e escopo

Lidos contexto comum e bloco05 extraídos por regex de project/prompts.md com parada antes06, GDD, config OpenSpec, relatórios explore/propose05 e todos os contextFiles retornados pela CLI: proposal/design/tasks/seis deltas. A primeira extração comum incluiu também01–04, nenhum futuro. Root CLI válido, execução repo-local. Preservados checkout compartilhado, propriedade do loop/cache/owner e evidências01–04. As únicas expectativas antigas migradas para modo estacionário explícito foram trajetórias longas de navegação que dependem de mundo vazio.

## Entrega e decisões

- `navigation.ts`: grafo por geometria/raio, grid20, folga0.05, arestas circulares varridas, A* determinístico, até12 conexões reais seguras por endpoint, atalhos revalidados. Cache não guarda estado de partida nem playerStart. Replanejamento250ms; waypoint próximo só é pulado se o próximo segmento for seguro. Movimento circular aceita raio explícito preservando default do player. Um casco tocando costa pode sair/tangenciar pela mesma barreira autoritativa; segurança de segmento exige alcançar o endpoint solicitado inteiro.
- `enemies.ts`: Chaser persegue player atual com giro/velocidade limitados; contato varrido25 uma vez/autodestruição/zero score. Shooter usa approach/retreat/hold210/240/270, reposiciona por ilhas, espera1500ms ao entrar em300, reinicia ao sair e conserva recarga quando LOS/mira impedem. Mira atual, sem predição; erro<=10°, LOS circular, emissão/proveniência/lifetime pelo combate compartilhado. Holding tático exige corredor com largura do casco para evitar oscilação no canto; elegibilidade de tiro usa raio da bala.
- Barreira varrida entre cascos, separação local e reparo determinístico de preparações coincidentes. Correções movem inimigos, nunca player; cenário e outros cascos limitam correções. Contato Chaser ocorre antes de separação; mortos por balas existentes não agem. Casco tangente pode afastar/tangenciar, sem ficar preso. Sem dano de contato Shooter.
- `director.ts`: Mulberry32 uint32 privado, seed zero válida, uma extração por candidato/rejeição, até64 amostras de perímetro. Agenda absoluta após intervalo completo, reserva600ms, revalidação completa de distância>=240/rota/cenário/cascos/reservas, cancelamento/skip sem backlog, alternância só após materialização. Sem cap ou rampa. IDs não reutilizados e verificados contra dados iniciais. Freeze paralisa passos/RNG/deadlines/reservas; morte cancela avisos e bloqueia ações/diretor posteriores. Estado completed também encontra a barreira de execução existente.
- Reconciliação rastreável GDD§7/prompt05: agenda3/6s + aviso0.6s produz aparições3.6/6.6s, quando seguras. Não encurtado intervalo/aviso para satisfazer a frase contraditória de ambos até6s.
- Contratos acrescentam seleção explícita normal/stationary-targets e reservas profundamente readonly. InitialCombatData sozinho mantém IA/diretor. `targets` continua demonstração estacionária real; `empty` é diagnóstico estacionário vazio; `island` prepara Shooter normal protegido pela ilha antes da criação. Sem setters de teleporte/saúde/morte/score/spawn.
- Pixi reconcilia anéis por reserva/progresso ativo, remove em materialização/cancelamento/saída e conserva texturas compartilhadas. Diagnóstico somente leitura acrescenta cascos/reservas/contagens; README/ARCHITECTURE em inglês descrevem reprodução, algoritmo, tolerâncias, estados, fases e propriedade. Sem HUD final, lifecycle completo, mobile, API ou serviços novos.

## Verificações finais

Cada shell recebeu PATH só do processo para `C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1`. E2E usou `PLAYWRIGHT_CHROMIUM_EXECUTABLE=C:/Users/Vinicius/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe` e execução escalada autorizada para browser/loopback/teardown Windows.

| Comando | Exit code / evidência |
| --- | --- |
| `openspec.cmd list --json` | 0, raiz válida e change ativa |
| `openspec.cmd status --change implement-enemies-and-spawning --json` | 0, quatro artefatos completos |
| `openspec.cmd instructions apply --change implement-enemies-and-spawning --json` | 0; fonte/linha e progresso confirmados após cada checkbox |
| `npm.cmd run lint` | 0, sem erros |
| `npm.cmd run typecheck` | 0, app/tests e core sem DOM |
| `npm.cmd test` | 0, 126/126 testes em11 arquivos,11.00s na execução final |
| `npm.cmd run build` | 0, typecheck + build Vite; aviso não fatal de chunk537.71kB |
| `npm.cmd run e2e` | 0, 24/24,12 dev +12 preview,2.2m na execução final |
| `openspec.cmd validate implement-enemies-and-spawning --strict --json` | 0,1 passed/0 failed/issues=[] em apply-validation.json |
| `git status --short` | 0; checkout com arquivos anteriores não rastreados preservados, sem commit/push |

Core cobre raios16/18 em ambos lados de ambas ilhas, endpoints e barreira sem rota; progresso/giro/avanço dos dois arquétipos; hold/approach/retreat e limites de tiro/primeiro deadline exato/reentrada/mira/LOS/muzzle; prioridade de morte e25/zero score; encontros frontal/oblíquo/tangente, costa/bordas/grupos coincidentes e player andando; seed zero/replays/seeds diferentes/consumo em rejeição; agenda3/3.6/6/6.6, cancelamento por player/casco, falha finita/sem backlog/cap, freeze de reserva/recarga e morte. Regressões existentes Q/W/E, consumo/score atômico, accumulator, owner/cache e navegação passam.

E2E opera mouse/R/Q/W/E reais com clock controlado, incluindo fluxo normal: aviso antes de materialização; blur nativo durante reserva,15s de parede congelados, resize320 com snapshot/anel invariantes, Resume, Chaser real morto por Q e score1, Shooter normal; cenário ilha sem tiro até reposicionar para LOS; saída com aviso pendente e reinício limpo. Cinco ciclos com projéteis, listeners/RAF/canvas/cache, loading/retry e cenários estacionários permanecem cobertos. Hidden é sinal de plataforma emulado documentado no teste anterior; blur usa outra página/CDP nativo. Nenhum sucesso é concedido por setter.

## Auditoria das deltas e evidência visual

| Capability | Implementação / evidência |
| --- | --- |
| enemy-behavior | enemies/navigation/collision/engine; testes enemies/combat/navigation; browser Chaser/Shooter/ilha |
| spawn-director | director/engine; testes agenda/RNG/reserva/cancelamento/vida/freeze; browser aviso/Resume |
| simulation-contracts | contracts/combat/cópia imutável; fixtures/typecheck/core histórico/readonly |
| simulation-runtime | engine/loop/accumulator; replay/freeze/catch-up/teardown core+browser |
| player-combat | emissão compartilhada e fase de balas anterior; testes de combate e novos cenários; Q/W/E reais e score |
| arena-rendering | Pixi anéis/entidades readonly e descarte;24 E2E dev+preview e inspeção visual |

Capturas finais e anexos estão exclusivamente em `project/automation-reports/05-implement-enemies-and-spawning/`: browser-evidence, test-results e playwright-report/index.html. Inspecionadas manualmente com view_image: dev/preview-spawn-warning, dev-spawn-warning-paused-320, dev-autonomous-chaser, dev-autonomous-kill-score, dev-autonomous-shooter-after-chaser-kill, preview-shooter-island-blocked/clear-fire. Confirmados anel sobre água sem linha espúria até a origem, progressão/posição, menu/Resume320 sem overflow, vela vermelha/escura, score1 e tiro livre após contorno. Os passos README foram reproduzidos pelos controles reais desses cenários e conferidos nas capturas; não se afirma sessão física de playtest ou benchmark.

## Correções durante APPLY e limites

Tentativa inicial typecheck exit2 por optional undefined/fixture reservations: corrigida. Primeiro core exit1 com111/112: trajetória antiga longa presumiu mundo vazio e recebeu contato normal, migrada explicitamente. Novos testes encontraram waypoint próximo pulado por segmento bloqueado e grupo tocando borda: corrigidos e repetidos. Uma primeira E2E em sandbox foi interrompida após falhas de lançamento, sem evidência de produto; execução escalada autorizada passou. Primeiro teste focalizado normal começou mira tarde demais, após Chaser já quase em contato; corrigida sequência de controles para mirar/atirar após spawn, sem mudar regras. Inspeção visual identificou path Pixi ligando origem ao arco do aviso; moveTo explícito/círculo contido corrigiu. Novas validações e suíte final completas passaram após todos esses ajustes.

Não foram modificados arquivos de evidência01–04: busca por LastWriteTime posterior ao início da fase retornou zero. automation-state.json permaneceu com LastWriteTime27/10/2026 23:49:36, do registro do orquestrador, e nunca foi escrito por este executor. Novos arquivos/edições de produto pertencem somente ao escopo05. Limites reais: Chromium headless Windows, sem teste físico mobile/benchmark; aviso de bundle Vite existente; lifecycle final/performance extensa pertencem às etapas próprias. Nenhum requisito05 foi reduzido para concluir.

## Handoff

17/17 tarefas verificadas; apply-task-progress.json registra transições individuais, apply-final.json contém state=all_done e apply-validation.json validação strict. Outro executor deve executar VERIFY independente contra artefatos/GDD e corrigir divergências no escopo. Só após verify satisfatório o orquestrador sincroniza e arquiva. Sem bloqueio conhecido.
