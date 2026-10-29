# Propose — implement-match-lifecycle

PROPOSE concluído em 28/10/2026 por `/root/i06_propose`, somente planejamento. Skill aplicada: `.agents/skills/openspec-propose/SKILL.md`. Autorização antecipada em `project/automation.md` mantém as fases separadas e permite ao orquestrador iniciar apply em novo executor sem interação. Nenhum código, teste ou documentação de entrega foi alterado nesta fase.

## Scope and sources

Confirmada raiz local pelo `list --json` e `context --json`, sem store, sem change ativa anterior. O incremento 05 está arquivado e as dez specs principais são válidas. Lidos skill, automação, estado somente leitura, relatório explore06, GDD (com foco §§3/8/9 e contratos/validação), configuração OpenSpec, specs pertinentes completas, inventário de código/testes, config/result/contracts/engine/input/loop/owner/renderer/App e relatório verify05. Nenhum AGENTS.md foi encontrado na descoberta do workspace. Alterações untracked anteriores foram preservadas.

O contexto comum e o bloco06 foram extraídos de `project/prompts.md` por regex multiline: preâmbulo até o primeiro heading01, mais heading06 até imediatamente antes de07. O preâmbulo contém Contexto comum. A expressão usada foi `(?s)\A.*?(?=^##?\s*0?1\b)|^##?\s*0?6\b.*?(?=^##?\s*0?7\b)` com `Multiline`; não foram carregados prompts futuros.

## Artifacts

Change: `openspec/changes/implement-match-lifecycle/`, schema `spec-driven`, caminhos confirmados por CLI. Criados `.openspec.yaml`, proposal.md, design.md, tasks.md e sete deltas:

| Capability | Requirements | Scenarios |
| --- | ---: | ---: |
| match-lifecycle, nova com Purpose próprio | 8 | 15 |
| application-shell | 1 | 7 |
| simulation-runtime | 3 | 6 |
| simulation-contracts | 2 | 4 |
| game-configuration | 2 | 5 |
| arena-rendering | 1 | 7 |
| player-combat | 2 | 5 |
| Total | 19 | 49 |

Os seis deltas existentes copiam os blocos MODIFIED completos e preservam todos os títulos de cenários anteriores. Uma auditoria por regex comparou esses cenários com as specs principais sem encontrar perda. As descrições dos 19 requisitos têm menos de500 caracteres. Nenhum Purpose existente foi alterado. Todos os quatro artefatos exigidos transitivamente estão done; nenhum artefato condicional foi omitido. Tasks contém24 tarefas abertas e zero marcadas, com implementação, testes e docs juntos por grupo; sync/archive são follow-up sem checkbox.

## Decisions and boundaries

- Sessão captura ID/identidade/configuração/seed antes de Loading, Retry conserva preparação e replay usa nova engine/nova captura com opções salvas atuais. ID/data/seed/storage ficam na fronteira, núcleo recebe dados explícitos.
- Representação canônica recursiva completa, versionada e sem hash curto compõe configurationKey; inclui todos os parâmetros de gameplay, geometria e versões, excluindo metadados/preferências. Ordem de arrays relevantes permanece significativa.
- Último passo resolve todas as balas existentes e contatos válidos antes da condição terminal; morte precede tempo e ended é único/último. Preservar regressão combat score2 e impedir novas emissões/diretor após término. Terminal resiste a step/freeze/resume/blur/hidden/resize/multistep.
- Loop entrega eventos por passo, independente de present/resize, e corta RAF/acumulador/input ao concluir. O mesmo caminho de pausa atende Escape/P/Pause/blur/hidden, com Resume explícito e baseline nova sem catch-up.
- Keep Playing fecha confirmação em Paused e foca Resume; não retoma automaticamente. Diálogos semânticos contêm foco e não capturam hotkeys de gameplay.
- Last Result local tem validação completa de unknown, incluindo toda configuração histórica e chave. Falhas de storage não impedem Play; escrita falha conserva resultado em memória e informa falha real. Refresh abandona partida ativa sem registro, preservando último concluído. Status Saved on this device somente após sucesso, sem confirmação remota fictícia.
- Renderer inteiro recebe configuração capturada, incluindo mapa/raios/telegraphs/viewport/pointer/diagnósticos. Preparação opt-in precede captura. Defaults de posição/tamanho da spec de arena foram explicitados como padrões para não contradizer configuração customizada.
- Opções locais somente via adapter nesta etapa; nenhum formulário Options, API, outbox, HUD/touch completo, novo efeito, rebalanceamento, publicação ou incremento futuro.

## Commands and results

PATH ajustado somente no processo de cada shell para o runtime `C:/Users/Vinicius/AppData/Local/Author Software/nvm/installs/v26.11.1`; CLI sempre por openspec.cmd.

| Comando / verificação | Exit / resultado |
| --- | --- |
| openspec.cmd list --json | 0; raiz nearest válida, changes=[] antes da criação |
| openspec.cmd context --json | 0; raiz resolvida para este workspace |
| openspec.cmd new change implement-match-lifecycle | 0; scaffold spec-driven criado |
| openspec.cmd list --specs | 0; dez capabilities existentes |
| openspec.cmd show application-shell/simulation-runtime/simulation-contracts/arena-rendering/game-configuration/player-combat --type spec --json --no-scenarios, seis chamadas | 0; requisitos inventariados e leituras completas complementadas no disco |
| openspec.cmd instructions proposal/specs/design/tasks --change implement-match-lifecycle --json, quatro chamadas | 0; templates, dependências e resolvedOutputPath seguidos |
| openspec.cmd status --change implement-match-lifecycle --json, após cada artefato e final | 0; final4/4 done, isPlanningComplete=true, isComplete=true (planejamento, não implementação) |
| openspec.cmd validate implement-match-lifecycle --strict --json | 0;1passed/0failed, issues=[] |
| openspec.cmd validate --specs --strict --json | 0;10passed/0failed, specs principais inalteradas |
| Auditoria local de deltas/cenários/tamanho/tarefas | 0; sete deltas,19requisitos,49cenários,24abertas/0concluídas, nenhum cenário MODIFIED perdido |
| openspec.cmd status --change implement-match-lifecycle | 0;4/4 artefatos completos |
| git status --short | 0; trabalho untracked anterior preservado |

Evidências machine-readable: `propose-status.json`, `propose-validation.json` e `propose-main-specs-validation.json` neste diretório. Não houve execução de lint/typecheck/test/build/E2E de produto porque esta fase não implementa; essas verificações estão planejadas, não alegadas como realizadas.

## Validation and handoff

O plano exige testes core/input/storage/loop, timer válido de60s em empty, morte por IA real, empate e salva letal score2, pausa manual/blur/hidden, recarga/reserva congeladas, confirmação/abandono/foco, resultado/Last Result/refresh, falhas locais, replay com opções atuais e cinco ciclos sem órfãos. E2E completos dev+preview, capturas desktop/320px/landscape e relatório HTML devem ser produzidos em evidências06 sem tocar01–05. Relógio de teste pode avançar a simulação real em frames compatíveis; nenhum setter de saúde/score.

Nenhuma decisão material aberta ou bloqueio externo. Nenhuma escrita em automation-state.json, main specs, arquivos de produto, GDD, assets, archive ou evidências01–05. Não foi iniciado apply, subagente, push ou deploy. Próximo passo autorizado: orquestrador inicia APPLY em novo executor, usando proposal/design/sete deltas/tasks. Após VERIFY independente satisfatório, sync deve preservar Purpose existentes e copiar o Purpose novo antes do archive e validação estrita final.
