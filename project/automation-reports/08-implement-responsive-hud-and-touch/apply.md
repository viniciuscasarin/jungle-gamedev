# Apply — implement-responsive-hud-and-touch

Executor `/root/i08_apply`, início 28/10/2026. Skill apply, runbook, contexto comum/bloco08 via regex, GDD, config, relatórios explore/propose e todos artefatos da change lidos. CLI raiz local válida; schema spec-driven, ready, inicialmente0/25. Nenhuma task marcada ainda; prova nativa e matriz final em andamento. Nenhum estado da automação, sync/archive/push/deploy alterado.

## Implementação atual

Engine interpreta direction/movementRequested usando giro/colisão existentes e oferece neutralização explícita sem passo. Buffer compõe teclado e IDs por arma, joypad proprietário, retenção de rumo e bordas/pulsos. Adapter touch usa captura nativa por controle, release/cancel/lostcapture idempotentes e R up válido sem click duplicado. Contexto composto/foco/pausa/modo limpa fontes e capturas. Modo inicial coarse e troca por input real; resize não troca modo.

React BattleHud: ícones/teclas/Ready/segundos/fill, R On/Off e vida; faixas medidas com safearea única/ResizeObserver existente. Desktop base central e touch vida topo/joypad esquerda/skills direita. Barras Pixi por navio vivo com mínimo CSS/clamp, rotação zero e destruição própria. Catálogo DOM/metadados/assets e README/ARCHITECTURE/créditos atualizados em inglês. Nenhum asset adicional além dos já inspecionados no explore. Destinos Playwright08 preservam01–07. Auditor inclui eventos novos; regressões preservadas.

## Comandos e resultados até aqui

Todos shells antepõem PATH de processo do runtime26.11.1 cadastrado. Chromium existente via PLAYWRIGHT_CHROMIUM_EXECUTABLE.

- openspec list/status/instructions apply --json: exit0, raiz válida,4artefatos done,0/25 ready.
- npm run typecheck: exit0.
- npm test (base antes dos novos testes): exit0,230testes/13arquivos.
- npm test -- tests/touch.test.ts: exit0,6testes puros novos.
- npm run lint: exit0.
- npm run build: exit0 (aviso de chunk Pixi>500kB).
- E2E dev filtrado keyboard menu/loading + fits desktop + realQWE, escalado para browser/teardown Windows: exit0,3passed. Execução inicial sem elevação falhou no launch e ficou em teardown; não conta como verificação.
- E2E dev novos nativos: última execução exit1,1passed(mode/resize/DPR) e2falhas de harness/timing. Captura nativa de4IDs e7projéteis reais com movimento já comprovados; screenshot aberta visualmente. Falhas atuais: helper CDP de liberação parcial encerra contatos errados (ajustar sem substituir por eventos sintéticos); cenário de primeiro dano pede tempo de voo e a liberação errada encerra Q antes do segundo tiro, score2. R/cancel/pausa restantes após esse ponto ainda precisam rodar.

## Evidências e próximos passos

`browser-evidence/dev-touch-four-native-contacts-cooldown.png` aberta via view_image: portrait390×844 legível, mundo inteiro, alvos e barra. Captura chaser parcialmente danificado produzida. Testes novos anexados ao arena.spec.ts usam CDP e registram isTrusted/gotcapture/lostcapture. Nenhum setter de gameplay. `native mode switches...` passou mesma sessão sem passo artificial e com match/setup conservados.

Pendentes: corrigir harness CDP release individual; finalizar cancel/R/freeze/ciclos com pointers ativos; screenshots desktop/touch cinco tamanhos e safeareas controladas, shooter/player danificados por combate real; testes metadados ampliados, lint/typecheck/unit/build finais, E2E completos dev/preview e strict. Só marcar tarefas após satisfazer cada prova. Relatório final substituirá/estenderá este parcial e incluirá limites físicos explícitos. Handoff ainda não pronto VERIFY.

## Atualização intermediária — 19/25

Implementações/tarefas1–8,10–14,16–17,19–22 marcadas individualmente com confirmação CLI após cada checkbox.238testes unitários, lint e typecheck finais passaram(exit0); build final passou(exit0), strict também(exit0). Native multitouch, cancel/R, modo/resize e mediçãoHUD passaram individualmente. Cinco ciclos com contatos passaram após auditor separar listeners do próprio Playwright `_hitTargetInterceptor` e noops de nós React desconectados; callbacks próprios em arena/host desconectados continuam auditados e devem serzero. Capturas nativas são auditadas separadamente, não só pelos contadores internos.

CDP release parcial corrigido conforme implementação Chromium: lista não vazia de touchEnd identifica IDs a encerrar, não remanescentes. Harness conserva IDs e traduz a lista remanescente. Referência primária consultada: https://raw.githubusercontent.com/chromium/chromium/main/content/browser/devtools/protocol/input_handler.cc (CreateWebTouchEvents/GenerateTouchPoints). Não usa dispatchEvent para a prova multitouch.

E2E completo54tests dev/preview em execução. Uma regressão de harness identificada: antigo teste customworld apontava20unidades acima do mundo em área agora ocupada pelo HUDtouch; pointer pertencia ao DOM, corretamente sem steering. Corrigido para ponto1unidade acima, dentro do letterbox real, preservando teste de clamp e geometria. Será reexecutado após término da suíte; nenhuma regra foi enfraquecida.

Imagens abertas: desktop1280×900 cooldown/Ron e shooter40/60 com playerrotacionado; touch320×568/390×844/844×390/568×320, sem recorte/overlap, alvos medidos≥48; Chaser20/40 e player75/100 via colisão real. Captura de playerantes da pausa será inspecionada após execução corrente. Ainda pendentes relatório visual/final,6tasks restantes, E2E final integral e validação final de progress.

Visual QA adicional identificou min-content do grid expandindo diálogo Paused além da largura320 apesar do HUD correto. Corrigido min-width:0 no session-panel, mantendo tamanhos/hitboxes e labels. Acrescentada asserção explícita do retângulo do diálogo em320. Build e E2E finais serão repetidos com esta correção; capturas intermediárias de pausa anteriores não são baseline final.

## Recuperação —24/25

Todas as tasks exceto5.7 estão marcadas e confirmadas CLI. Relatório visual `visual-inspection.md` gravado; player75/100 antes da pausa, Ready desktop, todos tamanhos e Paused320 corrigido foram abertos via view_image. Reteste afetado customworld/Paused320 em dev+preview passou4/4(exit0). Build após min-width passou(exit0). Lint/typecheck/238unit/strict repetidos passaram(exit0). Suíte final54 sem falhas até preview39/54 no último acompanhamento; processo exec90537 ainda ativo. Não iniciar executorVERIFY até finalizar gates e relatório.

Revisão de captura detectou possível captura implícita nativa no dedo extra rejeitado pelo joypad. Após terminar suíte, conferir e liberar imediatamente a captura desse contato não proprietário, ampliar auditor gotpointercapture (além de set/release/lost já auditados) e testar nativamente. Se necessário, rodar testes afetados dev/preview e build/checks após correção. Não reduzir a exigência de captura/teardown.

## Correção final de captura implícita

A suíte integral terminou54/54passed(exit0,6.1min). A revisão adicional confirmou com evento nativo um defeito no dedo rejeitado: captura implícita ficava no filho/thumb original, não no joypad pai. Repro adicional falhou(exit1) ao inspecionar hasPointerCapture no target real; evidência em implicit-capture-repro. Corrigido release imediato da captura implícita no target rejeitado e no toque do canvas que só seleciona modo. Nenhuma fonte de outro dedo é apagada. Auditor agora registra gotpointercapture real além de set/release/lost. Regressão pura e cenário nativo com filho real/fingerextraativo nos cinco ciclos acrescidos. Checks/build e retestes touch afetados dev/preview em andamento; preservar HTML da suíte54 e guardar JSON separado dos retestes finais.

## Conclusão da fase Apply — 25/25

Retestes touch afetados finalizados com êxito (10/10 passed, duração 44.5s) com evidências preservadas em `touch-final-results/report.json` e `test-results/.last-run.json`. Reconciliação do coordenador reexecutou a suíte completa de validação:
- `npm run lint`: exit 0 (sem erros).
- `npm run typecheck`: exit 0 (tsc e tsc.core sem erros).
- `npm test -- --run`: exit 0 (14 arquivos, 238 testes aprovados).
- `npm run build`: exit 0 (build Vite client concluído com sucesso).
- `openspec validate implement-responsive-hud-and-touch --strict`: exit 0 (change válida).

Todas as 25 tarefas foram cumpridas e verificadas. Handoff pronto para a fase de verificação independente (Verify).
