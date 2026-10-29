# Verification Report: implement-menu-and-options

Verificação independente concluída em 28/10/2026 por `/root/i07_verify`.
Usada a skill `C:/Users/Vinicius/.codex/skills/openspec-verify-change/SKILL.md`
para a change explícita `implement-menu-and-options`, schema `spec-driven`.
Não houve correção de produto: a implementação e as evidências atendem ao
incremento 07. Decisão: **pronta para sync e archive**, em executor separado.

## Summary

| Dimension | Status |
| --- | --- |
| Completeness | 18/18 tarefas, remaining 0; 10/10 requisitos ADDED/MODIFIED encontrados nos três deltas. |
| Correctness | 10/10 requisitos mapeados; 25/25 cenários cobertos por código e testes/evidências disponíveis. |
| Coherence | Design e padrões das fronteiras React/domínio/storage/Pixi preservados; nenhum desvio material. |

Não existem requisitos REMOVED/RENAMED nesta change. Nenhum check aplicável
ficou sem verificação. A ausência do exit original de E2E é uma limitação de
proveniência, explicitada abaixo; o resultado completo dos testes foi verificado
por três evidências concordantes, incluindo o conteúdo estruturado do HTML.

## Scope and sources

Lidos `project/automation.md`, relatórios explore/propose/apply e inspeção visual 07,
GDD 8–11, `openspec/config.yaml`, os quatro artefatos da change, três deltas e specs
principais de configuração/lifecycle. CLI confirmou raiz local válida, única change
ativa, quatro artefatos done, task tracking configurado e `state: all_done`.
`automation-state.json` foi mantido sob responsabilidade do orquestrador.
Nenhum AGENTS.md foi encontrado pela busca no checkout.

Contexto comum e bloco07 foram extraídos de `project/prompts.md` com regex por
delimitadores. A primeira expressão de leitura foi ampla demais e mostrou também
o cabeçalho/bloco08; foi corrigida imediatamente para grupos delimitados por
`## Contexto comum`/`## 01` e `## 07`/`## 08`. O conteúdo futuro não foi utilizado
para ampliar escopo ou definir critérios desta auditoria.

Também foram lidos helper, formulário, App, configuração/validação, adapter local,
sessionBoundary, manifesto/CSS, testes novos e regressões pertinentes de sessão,
cache/loading, além de README, ARCHITECTURE e ASSET_CREDITS. Não houve consulta
remota, nova dependência, implantação, push, sync ou archive.

## Requirement and scenario mapping

Referências abaixo são caminhos do checkout e linhas verificadas durante a auditoria.
Os testes E2E citados possuem resultados `expected` em dev e preview no HTML final.

| Delta / Requirement | Implementação e cobertura dos cenários |
| --- | --- |
| application-shell: Tela inicial mínima acessível | `src/ui/App.tsx:23` (diálogos), `:36` (Result), `:51` (Arena), `:93` (App/menu), `src/ui/Options.tsx:6`. Oito cenários: primeiro acesso e largura estreita em options keyboard/layout e arena keyboard/viewport; Loading/arena em arena keyboard/loading; congelamento e foco em arena blur/hidden e lifecycle dialogs; indicadores de combate em real Q/W/E e director; tempo/resultado em lifecycle timer/death; diálogos/restauração em lifecycle dialogs; Options no shell em options keyboard/corruption/snapshot. |
| asset-loading: Catálogo visual verificado | `src/render/assetManifest.ts:9`, `:49`, `src/ui/styles.css:49`. Quatro cenários: identidades/dimensões/orientação dos navios, densidade/metadados, bala fornecida e estados reais de menu. `tests/assetManifest.test.ts:5` compara PNGs e atlas default/retina, bordas, anchors, outer/label rect; options corruption verifica URLs CSS e capturas dos estados. Bala continua obrigatória e usa cache compartilhado. |
| asset-loading: Recursos decorativos DOM independentes da arena | `src/render/assetManifest.ts:46` e `:48`; catálogo DOM excluído de ASSET_URLS. Cenário de imagem ausente: options DOM image failure bloqueia todas as novas imagens de menu, mantém controles e chega a Arena. Fallback visual também aberto nesta fase. |
| menu-options: Menu local com ações honestas | `src/ui/App.tsx:134`. Dois cenários: menu sem/com Last Result nos testes keyboard e snapshot; integrações futuras em keyboard, com reservas disabled, explicação em inglês e ausência de requests remotos. Não há ARIA tabs incompletas, fixtures apresentadas como consultas ou rede necessária para Play/Options. |
| menu-options: Rascunho de opções em segundos | `src/ui/optionsDraft.ts:11`, `src/ui/Options.tsx:7`. Cenário abrir/editar: draft de strings isolado, inicialização do último Save/defaults e leitura na abertura em `App.tsx:139`; keyboard/Cancel/refresh e testes puros conferem valores, sem escrita durante edição. |
| menu-options: Validação acessível antes da confirmação | `src/ui/optionsDraft.ts:16`, `src/ui/Options.tsx:16`, `src/domain/config.ts:62`, `src/domain/validation.ts:30`. Dois cenários: limites/passo em optionsDraft.test e config/lifecycle; inválidos em optionsDraft.test e keyboard E2E. Regex decimal completo, Number/finitude e regra autoritativa rejeitam vazio/whitespace, texto, NaN/infinito, sessão fracionária, spawn fora do passo e limites. Sem parseInt, arredondamento, clamp ou normalização do texto editado. Labels/unidades/ajuda/erros, aria-invalid/describedby, Save disabled e guarda do submit impedem writer inválido, incluindo Enter e submit indireto. |
| menu-options: Save e Cancel explícitos | `src/ui/optionsDraft.ts:29`, `src/ui/Options.tsx:16`, `src/storage/local.ts:32`. Dois cenários: Save-refresh e Cancel/Escape em keyboard E2E, com foco restaurado e igualdade do storage. Save chama writer somente válido e fecha após true; Cancel é type=button, Escape local e navegação/blur não gravam. |
| menu-options: Recuperação e falha de armazenamento honestas | `src/storage/local.ts:13`, `src/ui/App.tsx:94`, `:103`, `:114`, `:133`; `src/ui/Options.tsx:28`. Dois cenários: corrupção em testes puros de JSON/versão/formato/limites/passo sem escrita e E2E corruption; escrita negada em testes puros e denied Save E2E. Draft/erro/tela e conteúdo salvo anterior são conservados; retry salva e Cancel descarta. Aviso corrente de opções fica separado de identidade/resultado: Save resolve somente o primeiro e novo Play não ressuscita a corrupção antiga. |
| menu-options: Navegação e layout acessíveis | `src/ui/Options.tsx:10`, `src/ui/App.tsx:125`, `src/ui/styles.css:8`, `:49–82`. Dois cenários: teclado/toque em keyboard/corruption (Tab, Shift+Tab, Enter, Space, Escape e tap), com zero canvas/inputListeners no formulário; viewports/conteúdo variável em matriz de seis telas × três tamanhos, estados e fallback. Safe-area em CSS, foco visível, inputs 48px, botões proporcionais e rolagem vertical intencional. |
| menu-options: Options restrito à navegação local | `src/ui/App.tsx:114`, `:131–133`, `src/ui/sessionBoundary.ts:11`. Cenário partida/replay em options snapshot: Save UI→Play captura 60000/1500ms; storage externo não muda setup; relógio Playwright conduz simulação real até Time expired; novo Save 90/2.5, Cancel/Save negado e Last Result→Play Again produzem outro ID e 90000/2500ms, mantendo histórico byte a byte. Loading/Playing/Paused não exibem Options. |

São oito cenários de application-shell, cinco de asset-loading e doze de
menu-options, total 25. Não foram usados setters de morte, score ou resultado
para provar sucesso. O cenário vazio/seed é preparação já existente; o relógio
controla a simulação real, e fixtures de corrupção/quota alteram apenas o ambiente
de storage. Diagnósticos observados não expõem métodos de mutação de gameplay.

## Task completion audit

| Task | Evidência independente |
| --- | --- |
| 1.1 | Parser puro e regras únicas conferidos; casos válidos/inválidos executados novamente em Vitest. |
| 1.2 | Form/ARIA/disabled/submit guard conferidos em código e E2E keyboard, incluindo submit indireto sem escrita. |
| 1.3 | Adapter validando antes do writer, corrupção e falha conservando Save anterior; testes puros repetidos e resultados E2E revisados. |
| 1.4 | ARCHITECTURE descreve strings→validação→Save e ms/snapshot corretamente. |
| 2.1 | playwright.config.ts e helpers apontam para 07; diretórios 01–06 presentes e não escritos nesta fase. |
| 2.2 | Menu/Last Result/reservas honestas e ausência de requests remotos comprovados. |
| 2.3 | Foco de entrada/retorno e teclado/touch nos dois projetos; Options inacessível na sessão ativa. |
| 2.4 | Avisos com origem separada, corrupção→Save→Play e denied Save/retry/Cancel conferidos. |
| 2.5 | Save-refresh e descarte cobertos nos dois projetos; README em inglês corresponde aos fluxos reais. |
| 3.1 | Dimensões/atlas lógico 1×/retina/retângulos/bordas/anchors e exclusão DOM executados em Vitest. |
| 3.2 | CSS nine-slice, proporção/label e primário normal/hover/pressed/disabled versus secundário normal/pressed/foco conferidos em código, teste e captura. |
| 3.3 | Matriz de 18 capturas e inspeção anterior revisadas; oito imagens representativas abertas independentemente nesta fase; hashes de 23 pares reconferidos. |
| 3.4 | Fallback legível, Play sem arte DOM e créditos com dimensões/transformações/licença desconhecida conferidos. |
| 4.1 | UI Save→Play e storage externo sem mutação do setup comprovados por teste e anexo estruturado dev/preview. |
| 4.2 | Término pela simulação, novo Save, Last Result histórico, outro ID e replay atual conferidos nos anexos e asserções. |
| 4.3 | README/ARCHITECTURE corretos; regressões lifecycle/cache/loading/Retry/teardown presentes no HTML final e testes locais pertinentes executados novamente. |
| 5.1 | Lint/typecheck/230 testes/build repetidos com exit 0; E2E completo anterior 44/44 auditado por HTML/log/.last-run. Limitação do exit original mantida. |
| 5.2 | Strict change/global repetidos com exit 0, 12/12; apply e evidências conferidos sem aceitar checkbox como prova isolada. |

## Commands and results

PATH alterado somente no processo de cada shell com o runtime do runbook;
Node `v26.11.1`, OpenSpec `1.14.1`, npm.cmd/openspec.cmd.

| Comando/inspeção | Resultado desta fase |
| --- | --- |
| `openspec.cmd list --json` | Exit 0; raiz local válida, única change 18/18. |
| `openspec.cmd status --change implement-menu-and-options --json` | Exit 0; schema/artifacts/caminhos conferidos. |
| `openspec.cmd instructions apply --change implement-menu-and-options --json` | Exit 0; 18/18, remaining 0, tracking configurado, all_done. |
| `npm.cmd run lint` | Exit 0; verify-lint.log. |
| `npm.cmd run typecheck` | Exit 0; verify-typecheck.log. |
| `npm.cmd test` | Exit 0;13 arquivos/230 testes passados; verify-vitest.log. |
| `npm.cmd run build` | Exit 0; verify-build.log, aviso conhecido de chunk>500kB. |
| `openspec.cmd validate implement-menu-and-options --strict` | Exit 0; verify-strict-change.log. |
| `openspec.cmd validate --all --strict` | Exit 0;12 passados/0 falhas; verify-strict-all.log. |
| Decodificação ZIP embutido no HTML por .NET em memória | Exit 0; report.json total44/expected44, unexpected 0/flaky 0/skipped 0/ok true; arena 34/options 10, dev+preview. Detalhe dos dez casos Options tem outcome expected. |
| SHA-256 das23 capturas emparelhadas | Exit 0; todos os arquivos atuais iguais ao hash registrado e ao par dev/preview. |

Os seis exit codes repetidos estão em `verify-exit-codes.json`. A auditoria
estruturada de HTML e hashes está em `verify-evidence-summary.json`.

E2E **não foi repetido**: não houve mudança de produto/teste nesta fase ou desde
o resultado final anterior que justificasse repetir oito minutos de suíte.
`e2e.log` termina em `44 passed (8.1m)`, `test-results/.last-run.json` contém
`passed` sem failedTests, e o report.json embutido confirma o conjunto completo,
sem skip/flaky/falha. O **exit do processo original continua desconhecido**;
nenhum exit 0 foi inventado. Isso não foi tratado como execução nova de VERIFY.

## Visual and integration evidence

Além da inspeção de 25imagens documentada em `visual-inspection.md`, esta fase
abriu independentemente com view_image: `dev-menu-empty-320.png`,
`dev-menu-last-result-options-landscape.png`, `dev-options-invalid-320.png`,
`dev-options-write-failure-landscape.png`, `dev-options-recovery-desktop.png`,
`dev-secondary-focus.png`, `dev-primary-pressed.png` e
`dev-options-image-fallback.png`. Texto/ajuda/erros/ações legíveis, foco distinto,
bordas preservadas, sem sobreposição/corte ou distorção material. Menu 320 tem
margens apertadas no texto de futuras integrações, porém o conteúdo está contido
e legível. Altura maior que viewport em 320/landscape permite scroll vertical;
asserções E2E de scrollWidth verificam ausência de overflow horizontal.

Os dois anexos `options-snapshot-replay` do HTML foram lidos independentemente.
Dev firstId `b8e53464-25ec-4cc4-9f02-8f7b29e5dcca`; preview firstId
`ab9f8f31-f67f-40b5-a495-5653b7551430`. Ambos conservam configuração capturada e
histórica 60000/1500ms e apresentam replay 90000/2500ms. Asserções conferem novo ID
e storage histórico idêntico. As 34 regressões de arena do mesmo HTML cobrem
carregamento frio/quente, Retry/falhas reais, callbacks obsoletos, StrictMode,
navegação, combate por controles reais, AI, timer/morte, pausa, replay e cinco
ciclos com contadores de recursos retornando à base.

## Issues by priority

- **CRITICAL:** nenhum.
- **WARNING:** nenhum desvio de requisito/design ou cenário sem cobertura.
- **SUGGESTION:** nenhuma necessária para o escopo desta change.

O aviso de bundle>500kB permanece uma característica conhecida da build e não
impediu o build ou os critérios 07. Nenhum produto, teste, tarefa ou especificação
foi alterado nesta auditoria; foram criados somente relatório e evidências VERIFY.

## Limitations and final assessment

Headless Chromium/touch não certifica hardware físico, notch real, leitor de tela
ou performance. Safe-area foi auditada em CSS; não se alega teste físico. A
procedência/licença dos assets fornecidos continua desconhecida e documentada em
ASSET_CREDITS, sem licença inventada. As capturas são full-page e demonstram o
conteúdo disponível por scroll, não uma promessa de caber sem rolagem em 390px.
O exit original do E2E não foi preservado, mas as três evidências finais e a
decodificação independente confirmam44/44 passados.

**All checks passed. Ready for archive.** Nenhum check aplicável foi omitido,
nenhuma falha material ou tarefa pendente permanece. O próximo executor pode
sincronizar os três deltas com as specs principais, conferir o merge e executar
archive conforme autorização antecipada. Esta fase não sincronizou/arquivou,
não alterou estado da automação e não iniciou outro incremento.

