# Explore — implement-match-lifecycle

Concluído em28/10/2026 por `/root/i06_explore`, somente leitura. Sem arquivos,
change ou suíte de produto. Lidos skill/automação, contexto comum e bloco06 por
regex até07, GDD/config/10specs/código/testes/VERIFY05. Sem AGENTS.md encontrado.
CLI list raiz válida/zerochanges, list-specs10, strictspecs exit0/10válidas/semissues.
Chromium existente1248 confirmado. Preservar checkout anterior untracked.

## Base e lacunas

Config/snapshot profundamente imutáveis, seeduint32, opções validadas já existem,
sem storage. CompletedMatchResult/materialização existem mas sem key canônica,
terminal ou validação completa de JSON desconhecido. Tipos completed/ended/pausePressed
existem mas engine não finaliza, player morto ainda permite tempo/balas posteriores.
freeze pode converter qualquer estado empaused: precisa guarda terminal.
Loop já cancela RAF/input/acumulador/baseline na pausa; estender para terminal único.
Input limpa QWE/R/mouse, sem joypad implementado (preservar neutralização futura).
Renderer hardcode DEFAULT_CONFIG/seed0 em vários pontos: receber preparação capturada
e mesma config em render/física/telegraphs. App só tentativa/menu/loading/ready/failed,
abandona direto, sem diálogos/timer/result/LastResult. Owner/cache/init tardia seguros.

## Decisões propostas

- Máquina Menu→Loading→Playing↔Paused→Result; erro recuperável emLoading;
  confirmação abandono subestadoPaused; saídaLoading cancela sem registro.
- Play/PlayAgain captura novo matchId/identidade/configopções salvas/seed na fronteira;
  Retry mantém preparação. Núcleo recebe ID/datas/seed explícitos, storage fora.
- Adapter mínimo guarda opções válidas/identidade necessária/último resultado.
  Reconstruir tuning/mapa atuais de opções e capturar tudo; histórico mantém snapshot.
  Key canônica pura ordenada de todos gameplay/versões, exclui seed/identidade/
  preferências; sem libhash/API obrigatórias. Sem formulário Options antecipado.
- Timer porpassos, duração válida inteira compatível1/60, epsilon temporal e limite
  exato; status restante limitado. No passo final resolver colisões/danos atômicos,
  escolher morte antes tempo antes de novas emissões/diretor, ended último e único.
  Completed inerte a step/freeze/resume/blur/resize/StrictMode. Resultado congelado.
- Nova engine por replay reseta health/score/relógio/armas/IA/balas/reservas/RNG/IDs/
  input/steering/autosail; captura opções salvas atuais. Não reusar instância terminal.
- Escape/P bordas semrepeat emcontexto ativo, botãoPause; blur/hidden pausam; Resume
  explícito com limpeza nova e baseline semcatchup. Foco não retoma automaticamente.
- MainMenu jogando pausa antesconfirmar. KeepPlaying fecha confirmação e retorna
  Paused comfocoResume; Abandon destrói recurso e menu sem resultado. Declarar escolha.
  Diálogos foco contido/restaurado, Result foco título/ação, semhotkeys emdiálogos.
- Result score/duração/motivo Time expired/Ship destroyed, PlayAgain/MainMenu;
  status honesto Saved on this device semRecorded remoto/Pending. LastResult local
  antes integração futura, menuabre histórico semsimulação. Refresh abandona run
  ativo e conserva último concluído. Storagecorrompido/inacessível não bloqueiaPlay;
  validar estrutura desconhecida completa, aviso real se escrita falhar, memória retém.

## Riscos e deltas

Atualizar proibições antigas terminal/result emruntime/render e fronteira combat.
Teste combat “ignores allies…clamps health atomically” conserva score2 de balas no
mesmo passo letal: manter resolução atômica e ajustar expectativa final comended,
sem apagarregressão. events atual retorna última coleção: protocolo claro evita
reconsumirended emresize/present ou múltiplos callbacks accumulator numframe.
Renderer inteiro usa configcapturada, não apenas engine. HelpersE2Emenu precisam
confirmar abandono; paths de evidência06 preservam01-05. Editar docssem normalização
ampla de encoding legado. Reconciliação05 de3.6/6.6s preservada.

Nova capability match-lifecycle; deltas shell/runtime/contracts/render/config ecombat
quando necessário. Código domínio sessão/key/result, engine/loop/resource/owner/
loading/render/input/App/styles/storage; docs e testes. SemREST/outbox/Optionscompleto/
mobile/GDD/mainspecs emapply. Nenhum bloqueio externo.

## Validação planejável

Tempo/morte/empate/scorezero/endedúnicoúltimo/imutabilidade/terminalinércia/semtirospawn
tardio; instânciareplaydeterminística/configsnapshot. InputEscapeP/repeat/limpeza/baseline/
semcatchup/zeroRAFpausedterminal/multistep. Storage roundtrip/corrupção/shape/falhaescrita/
refreshconservaLastResult/IDsnovos. E2Edevpreview loopcompleto/timer60sempty/morteIAreal/
pausemanualblurhidden/reservas/KeepPlayingAbandon/LastResultrefresh/replayconfigsatual/
cincociclosresultreplayabandono semórfãos. Semsettersdesaúde/score; relógio/preparação
iniciais permitidos. CapturasPause/confirm/Result/menuLastResultdesktop320landscape;
HTML/anexos/recursos, semclaimhardwarebenchmark. Lint/typecheckcore/test/build/E2E e
strictvalidate, verifyindependente antesarchive.
