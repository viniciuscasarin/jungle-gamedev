# Apply — implement-match-lifecycle

Status: APPLY concluído, 24/24 tarefas verificadas e confirmadas pela CLI (`state=all_done`, zero pendentes). Executor inicial `/root/i06_apply`, recuperação `/root/i06_apply_recovery`, 28/10/2026. A interrupção por quota foi reconciliada preservando código, testes e evidências existentes, sem reiniciar a change.

## Scope and sources

Skill `.agents/skills/openspec-apply-change/SKILL.md`; raiz local válida confirmada por `openspec.cmd list --json`. Schema `spec-driven`, `actionContext` repo-local, sete deltas e 24 tarefas. Lidos os arquivos retornados por `instructions apply`, GDD, configuração OpenSpec, specs pertinentes, automação e relatórios explore/propose/apply anterior. O contexto comum e o bloco 06 foram extraídos por regex, encerrando antes de 07. Nenhum AGENTS.md encontrado.

A autorização antecipada de `project/automation.md` cobre implementação, correções e testes locais. Esta fase não altera automation-state.json, GDD, specs principais, assets ou evidências 01–05 e não faz delegação, sync, archive, push ou deploy. Artefatos OpenSpec e este relatório em pt-BR; código, interface e documentação de entrega em inglês.

## Implementation

- `domain/session.ts`, `domain/validation.ts`, `domain/result.ts`: preparação imutável com ID/identidade/configuração/seed explícitos, chave completa `gameplay-v1:` com JSON recursivo canônico e arrays ordenados semanticamente, validação de todos os 87 campos folha de configuração e de resultado desconhecido. A validação confere geometria convexa utilizável, campos/tipos/limites/enums, UTC, seed, score, duração e igualdade da chave histórica; não reconstrói o histórico pelos defaults atuais. Metadados e efeitos de plataforma permanecem fora do core.
- `simulation/engine.ts`, `render/navigationLoop.ts`: tempo ativo termina exatamente em 60000ms/passo 3600 na configuração válida de 60s; morte prevalece sobre tempo. Todas as balas existentes resolvem atomicamente antes da fronteira terminal, preservando score 2 da regressão de salva letal. Contatos válidos precedem a fronteira; nenhuma nova emissão/diretor/materialização a ultrapassa. `ended` é único e último. Completed é inerte a step/freeze/resume, apresentação, blur/hidden e resize. Entrega por passo impede perda de eventos em frame com múltiplos passos; o loop cancela RAF, baseline, acumulador e input no término.
- `storage/local.ts`, `ui/sessionBoundary.ts`: envelopes locais versionados de opções, identidade e Last Result. Getter/read/parse/write/quota são defensivos. Play captura opções atuais e novo ID/seed antes de Loading; Retry mantém a preparação lógica. Conclusão fornece UTC uma vez e tenta salvar antes de publicar o status. Callbacks duplicados/obsoletos e abandono não registram outra conclusão. Falha de escrita preserva resultado em memória e o registro anterior no storage; refresh de partida ativa recupera somente o último concluído.
- `input/desktop.ts`, `render/pixiPreview.ts`, `render/previewOwner.ts`: Escape/P por borda, Pause, blur/hidden e Resume explícito pelo mesmo caminho; limpeza de ataques, bordas, steering/movimento e auto-sail Off, com input neutro para joypad futuro. Configuração capturada é usada em engine, mapa, posição, raios, viewport, clamp, overlays, telegraphs e diagnóstico preparado antes da captura. Owner preserva cancelamento/loading tardio/cache/Strict Mode e ignora pause/resume obsoletos.
- `ui/App.tsx`, `ui/styles.css`: Menu/Loading/Playing/Paused/Result, status semântico limitado por valor exibido, diálogos com foco contido e instruções em inglês. Keep Playing retorna a Paused e foca Resume; Abandon libera sem registro. Result exibe score, duração, motivo, status local real, Play Again/Main Menu; Last Result não monta arena. Replay cria engine nova e reseta todo estado, mantendo a configuração histórica anterior.
- `README.md`, `ARCHITECTURE.md`: contratos, passo final/eventos, ownership, foco, controles, storage/fallback, cenários opt-in e reprodução dos dois finais. Sem formulário Options, REST/outbox, HUD/touch completo ou comportamento de incrementos futuros.

## Corrections and decisions

A primeira execução Vitest da implementação exigiu atualização de duas fixtures antigas para chave canônica e motivo/duração coerentes. Nenhum cenário de IA ou colisão foi removido. O inventário de folhas tem 87 campos, e a asserção de contagem foi corrigida sem reduzir a validação: cada folha é rejeitada tanto quando ausente como com tipo errado.

O primeiro E2E completo fora do sandbox encontrou quatro falhas do mesmo bug de foco após Resume, em dev e preview. O renderer tentava focar o host antes de React remover `inert`. A restauração foi movida para effect posterior ao commit, e o foco prematuro foi retirado do renderer. A reexecução focal dos quatro cenários passou. Também foi corrigido o espaçamento vertical dos tiles para usar a altura capturada da ilha.

Testes reforçados: sequência inteira dano/destruição/score/ended da salva letal, owner pause/resume atual versus loading/disposed, Retry mantendo ID/configuração quando opções salvas mudam durante falha. A fronteira temporal usa epsilon de 1e-7ms somente para comparação numérica, sem conceder passo extra ou contar tempo descartado. A configuração/seed dos cenários opt-in é preparada antes da captura, sem setters de saúde/score.

## Commands and results

Em cada shell, PATH do processo recebe apenas `C:/Users/Vinicius/AppData/Local/Author Software/nvm/installs/v26.11.1`; usados `npm.cmd` e `openspec.cmd`. Chromium existente: build Playwright 1248, versão de arquivo 156.0.8078.4, fornecido por `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. Ambiente Windows, Chromium headless, dev com React Strict Mode e preview do build deste checkout.

| Comando / verificação | Exit / resultado observado |
| --- | --- |
| openspec.cmd list/status/instructions apply --change implement-match-lifecycle --json | 0; raiz local, ready, inicialmente 0/24 |
| npm.cmd run lint | 0 |
| npm.cmd run typecheck | 0; app/testes e core sem DOM |
| npm.cmd test, recuperação inicial | 0; 12 arquivos, 189/189 |
| npm.cmd test -- tests/previewOwner.test.ts | 0; 8/8 após teste adicional |
| npm.cmd test, após correções e asserts finais | 0; 12 arquivos, 190/190 |
| npm.cmd run build, após correção de foco/renderer | 0; 754 módulos; aviso de chunk Pixi acima de 500kB, sem erro |
| npm.cmd run e2e no sandbox Windows | 1, interrompido; Chromium falhou antes de executar produto, exitCode 3221225506 |
| npm.cmd run e2e fora do sandbox, primeiro completo | 1; 30/34, quatro falhas de foco descritas acima, 7,2min |
| npm.cmd run e2e -- --grep 'retains target\|lifecycle Escape' --output .../focus-fix-results | 0; 4/4 dev+preview, 40,9s |
| npm.cmd run e2e fora do sandbox, final completo | 0; 34/34 dev+preview, 6,3min, zero skipped/flaky/unexpected |
| openspec.cmd validate implement-match-lifecycle --strict --json | 0; 1 passed/0 failed, issues=[] |
| openspec.cmd validate --specs --strict --json | 0; 10 passed/0 failed, issues=[]; specs principais não sincronizadas nesta fase |
| Marcação individual de tarefa + instructions apply imediatamente depois | CLI confirma cada checkbox e incremento do progresso |
| openspec.cmd instructions apply/status/list após o último checkbox | 0; 24/24, remaining=0, all_done; list informa status complete |
| Extração dos anexos JSON do HTML final e inspeção dos contadores | 0; 24 anexos, cinco ciclos dev e cinco preview; menu zero recursos próprios |
| Get-Process node após o E2E final | 0 processos Node restantes |

O lançamento de browser e localhost requerem execução fora do sandbox Windows neste ambiente; a revisão automática aprovou essas execuções locais. Não houve redução de requisito para contornar a restrição.

## Evidence

Somente em `project/automation-reports/06-implement-match-lifecycle/`:

- `playwright-report/index.html`, `test-results/`: execução integral final, screenshots/anexos e traces retidos em falhas.
- `initial-e2e-report/index.html`, `initial-e2e-results/`: primeira execução completa, incluindo os quatro traces do foco corrigido.
- `focus-fix-report/index.html`, `focus-fix-results/`: reexecução focal verde dos cenários afetados em dev/preview.
- `browser-evidence/`: capturas de Paused, confirmação, Result por tempo/morte e Menu com Last Result em 1280×900, 320×568 e 844×390; demais regressões de navegação/combate/resize/DPR preservadas neste incremento.
- `apply-e2e-summary.json`: dados extraídos do HTML final, total=34, expected=34, unexpected/flaky/skipped=0, ok=true. Os 24 anexos JSON extraídos ficam em `browser-evidence/`, incluindo `dev-lifecycle-five-cycles.json` e `preview-lifecycle-five-cycles.json`.
- `apply-validation.json`, `apply-main-specs-validation.json`: validações estritas da change e dez specs principais.
- `apply-instructions.json`, `apply-status.json`: fechamento final da CLI; a validação estrita da change foi repetida depois dos 24 checkboxes, com exit 0 e issues=[].

Os anexos incluem snapshot terminal/resultado persistido/replay/IDs, pausa/morte por IA real, recursos nativos e cinco ciclos que misturam término/replay/abandono. Timer usa configuração válida de 60s em empty, relógio Playwright avançando a engine real em RAF compatíveis; morte usa Chaser/Shooter reais e controles normais. Storage começa isolado por contexto. Nenhum teste concede score, morte ou saúde diretamente.

Nos cinco ciclos finais de cada projeto, cada arena/replay tem 1 app, 1 recurso, 1 subscription, 1 canvas, 7 listeners de input, 2 observers, 1 listener de resize, 1 query DPR; há 1 RAF durante Playing e zero em Paused/completed. Cada retorno ao menu tem zero app/recurso/subscription/listener próprio/canvas/observer/resize/DPR/RAF, navigation=null e lease=0. Texturas compartilhadas continuam no cache, estáveis em 31. Listeners nativos retornam exatamente à baseline inicial de 8 em dev e preview. Unit tests cobrem inicialização tardia e gerações obsoletas. Após teardown do E2E não restou processo Node.

Inspeção visual direta das capturas de Paused/confirm/Result/Menu nos três tamanhos encontrou títulos, valores e ações legíveis, sem corte ou overflow horizontal. Há foco visível por teclado em Resume e containment verificado por Tab/Shift+Tab. O menu em landscape usa rolagem vertical para manter todos os controles acessíveis. Result em landscape cabe no viewport, inclusive os dois botões.

## Limits and handoff

Hidden é emulado somente por `document.hidden` + `visibilitychange`, porque Chromium automatizado preserva o estado visible em abas de fundo. Blur usa transição nativa para outra página com foco CDP. Isso está registrado nos testes, anexos e README. Os contadores em Chromium headless provam ownership, não um benchmark de heap/FPS/dispositivo físico. Touch completo, Options, áudio/feedback novo, REST e outbox permanecem fora do escopo aprovado.

Nenhum requisito de produto foi adiado para obter verde. O próximo passo é VERIFY independente em novo executor autorizado, auditando código e estas evidências antes de qualquer sync/archive. Não foram iniciadas outras fases ou incrementos.
