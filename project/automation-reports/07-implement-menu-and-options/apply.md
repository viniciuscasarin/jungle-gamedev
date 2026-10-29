# Apply — implement-menu-and-options

Concluído em 28/10/2026; schema `spec-driven`, 18 tarefas implementadas e
comprovadas. Implementação inicial por `/root/i07_apply`; retomada final por
`/root/i07_apply_finish`, após interrupções de capacidade/quota. A retomada
reconciliou arquivos e evidências existentes, concluiu a inspeção visual,
ajustou documentação e executou strict novamente. Nenhuma mudança de produto
foi necessária nesta retomada. VERIFY independente continua obrigatório.

## Context and decisions

Lidos skill local `.agents/skills/openspec-apply-change/SKILL.md`, runbook,
estado somente leitura, explore/propose/apply anteriores, contexto comum e bloco
07 extraídos por regex encerrando antes de 08, GDD/config, artefatos da CLI e
specs pertinentes de shell/assets/configuração/lifecycle. `openspec list --json`
confirmou raiz local e única change ativa. Nenhum AGENTS.md foi encontrado.
CLI retornou 13/18 inicialmente, estado ready, sem bloqueio ou guidance adicional.
Contexto obrigatório pt-BR respeitado nos artefatos; código/UI/docs em inglês.

- Helper puro `src/ui/optionsDraft.ts` mantém strings em segundos, usa
  OPTION_METADATA e validação de domínio, sem arredondar/truncar/clamp. Sessão
  60–180 passo 1 e spawn 1–10 passo 0.5; vazio, texto incompleto, não finitos,
  limites e passos inválidos são rejeitados antes de chamar o writer.
- `Options.tsx` mantém rascunho isolado, labels/ajuda/erros associados,
  aria-invalid, Save disabled e guarda de submit. Save só retorna após sucesso
  confirmado do adapter; falha mantém draft/alerta/valores anteriores. Cancel e
  Escape não escrevem. Entrada e retorno restauram foco; não há arena/input de
  combate montado no formulário.
- `App.tsx` relê opções ao abrir/Play, separa aviso corrente das opções de avisos
  independentes de identidade/resultado e conserva Play/guia/Last Result.
  Ranking/Match History são reservas disabled com explicação, sem consultas.
- Catálogo DOM separado dos assets obrigatórios Pixi; metadados lógicos 1×,
  nine-slice por border-image, proporções, estados primários/secundários, foco,
  safe areas e rolagem vertical. CSS mantém fallback legível se imagens falham.
  ASSET_CREDITS documenta uso/transformações reais sem inventar licença.
- preparePlay/snapshot/lifecycle existentes são preservados. Resultado histórico
  não adota defaults/tuning novos; replay lê somente último Save confirmado.

## Commands and results

PATH somente do processo com Node26.11.1 conforme runbook, usando npm.cmd e
openspec.cmd. Nenhuma instalação ou mudança global nesta retomada.

| Comando | Resultado e evidência |
| --- | --- |
| `openspec.cmd list --json` | Exit 0 nesta retomada; raiz local, 13/18 ao iniciar. |
| `openspec.cmd status --change implement-menu-and-options --json` | Exit 0; quatro artefatos de planejamento done. Isso não foi usado como prova de implementação. |
| `openspec.cmd instructions apply --change implement-menu-and-options --json` | Exit 0; tarefas/linhas conferidas e progresso reconciliado a cada checkbox final. |
| `npm.cmd run lint` | Execução anterior: exit 0 registrado pelo executor; lint.log sem falhas. Primeiro lint havia encontrado expressão sem chamada em teste E2E, corrigida antes desta execução final. |
| `npm.cmd run typecheck` | Execução anterior: exit 0 registrado; typecheck.log. exactOptionalPropertyTypes havia sido corrigido antes do resultado final. |
| `npm.cmd test` | Execução anterior: exit 0 registrado; vitest.log confirma 13 arquivos/230 testes passados. |
| `npm.cmd run build` | Execução anterior: exit 0 registrado; build.log confirma conclusão, com aviso de chunk >500kB já conhecido. |
| `npm.cmd run e2e` | Execução anterior terminou com **44 passed (8.1m)**; dev22/preview22. **Exit do processo não preservado** após interrupção do executor; nenhum código 0 é inferido. Evidências concordantes: e2e.log final, .last-run.json passed sem falhas e HTML final. |
| `openspec.cmd validate implement-menu-and-options --strict` | Executado novamente nesta retomada, exit 0; strict-change-finish.log. |
| `openspec.cmd validate --all --strict` | Executado novamente nesta retomada, exit 0, 12/12 itens válidos; strict-all-finish.log e strict-finish-exit-codes.json. |

Lint/typecheck/Vitest/build finais antecedem o E2E no disco (04:56–04:57 versus
E2E terminado 05:05). A tentativa inicial de Chromium no sandbox não iniciou a
suíte; a execução posterior autorizada produziu os resultados completos. Não foi
repetida a suíte de oito minutos: não houve mudança de produto/testes após seu
resultado final nem falha pendente que justificasse isso. As únicas edições nesta
retomada foram docs, relatórios e checkboxes.

O conteúdo ZIP embutido do HTML final foi lido em memória, sem alterá-lo.
`html-report-summary.json` registra total44/expected44, unexpected0/flaky0/
skipped0/ok=true, projetos dev e preview, arena34 e options10. Isso comprova que
o HTML não é apenas um arquivo parcial existente. Relatório em
`playwright-report/index.html`; final de execução em `test-results/.last-run.json`.

## Acceptance evidence

| Critério07 | Prova conferida |
| --- | --- |
| Validação centralizada e string draft | optionsDraft.test.ts cobre limites, frações, strings inválidas/não finitas e guarda antes do writer; assetManifest.test.ts confere catálogo/metadados; ambos incluídos nos 230 testes. |
| Save, refresh, Cancel/Escape e teclado | options.spec.ts cenário keyboard/validation/Save-refresh, passado em dev/preview; entrada em título, Tab/Shift+Tab/Space/Enter, erros/aria e zero inputListeners ao editar. |
| Corrupção e avisos independentes | Testes de JSON/versão/formato/limites/passo sem escrita; E2E corruption/defaults/touch repara somente aviso de opções e preserva identidade/Last Result, inclusive após Play. |
| Falha de Save preserva anterior | Testes puros e E2E denied Save: draft mantido, storage anterior idêntico, retry confirmado e Cancel descartado; dev/preview passados. |
| Assets/estados e layouts | visual-inspection.md: 25 capturas abertas por view_image, 18 de matriz completa + cinco estados + dois fallbacks; sem corte/sobreposição/overflow horizontal. 23 pares dev/preview tiveram hashes atuais reconferidos iguais; visual-comparison-recheck.json zero falhas. |
| Decoração DOM independente | E2E bloqueia imagens DOM e ainda chega a Arena; fallback visual aberto, textos/campos/ações legíveis. ASSET_URLS exclui DOM_ASSET_IDS. |
| Snapshot e último Save no replay | E2E UI Save→Play, alteração externa de storage, término real por relógio da simulação, novo Save, Last Result→Play Again; novo ID, snapshot/histórico preservados, Cancel/Save falho não substituem o último Save. |
| Regressão existente | Os 34 E2E de arena dev/preview passaram: loading/falha/Retry/cache frio e quente, callback obsoleto, init gráfica, teardown/Strict Mode, navegação/combate/AI/lifecycle/pausa/resultado/replay e cinco ciclos completos. Sem enfraquecer testes anteriores. |

Anexo `options-snapshot-replay` do HTML foi lido para ambos os projetos. Dev
firstId `b8e53464-25ec-4cc4-9f02-8f7b29e5dcca`; preview firstId
`ab9f8f31-f67f-40b5-a495-5653b7551430`. Ambos mostram captura/histórico de
60000ms/1500ms e replay de 90000ms/2500ms. Setup usa
`?combatScenario=empty&seed=123`, Playwright clock controlando a simulação real;
nenhum resultado, kill ou score foi concedido por mutação. A asserção do teste
confere novo matchId e storage histórico byte a byte idêntico. Diagnósticos são
somente leitura. Options ausente em Loading/Playing/Paused também foi verificado.

README e ARCHITECTURE descrevem draft→validação→Save, unidades, falhas, limites
de escopo e demonstração de snapshot/replay; README agora usa a própria UI para
reproduzir sessão de 60s e aponta os diretórios reais/evidência visual. Documentos
correspondem ao helper, adapter, App e testes lidos.

## Limitations and handoff

Headless Chromium com touch habilitado não certifica dispositivo físico, leitor
de tela ou performance mobile. Capturas full-page demonstram conteúdo; E2E
confere largura sem overflow, e rolagem vertical em 320px/landscape é intencional.
Safe areas estão em CSS, sem alegar teste de notch físico. Procedência/licença de
arte fornecida continua não documentada; créditos mantêm a pendência verdadeira.
O exit original de E2E permanece desconhecido, embora três evidências finais e o
HTML estruturado confirmem todos os testes passados.

Tarefas finais 3.2/3.3/4.3/5.1/5.2 concluídas somente após essas provas.
CLI final confirmou 18/18, remaining 0 e state all_done, preservado em
`apply-instructions-final.json`; ambos os strict foram repetidos após os checkboxes
finais e permaneceram exit 0.

Diretórios 01–06 e trabalho existente preservados; não houve mudança em automation-state,
sync, archive, push ou deploy. Próximo passo: novo executor VERIFY independente
auditar código/specs/evidências07. Main specs ainda não foram sincronizadas,
conforme separação das fases; não avançar a archive antes de VERIFY satisfatório.
