# Handoff para Antigravity — automação do Pirate Battle

Preparado em **28/10/2026**, com inspeção aproximadamente às **08:43–08:45,
America/Sao_Paulo (UTC−03)**. Este documento registra uma fotografia do projeto;
releia o estado real ao assumir, pois a automação do Codex continuava ativa.

## 1. O que está agendado

| Campo | Configuração encontrada |
| --- | --- |
| Nome | Pirate Battle — OpenSpec sequencial |
| ID | `pirate-battle-openspec-sequencial` |
| Tipo | Heartbeat associado a um chat existente |
| Frequência | A cada cinco minutos |
| Estado na inspeção | `ACTIVE` |
| Chat coordenador | `Automatizar fluxo OpenSpec` |
| ID do chat | `01a17e3b-3551-7ba2-85e0-5c68dae6fd6f` |
| Workspace | `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev` |
| Configuração externa ao repositório | `C:\Users\Vinicius\.codex\automations\pirate-battle-openspec-sequencial\automation.toml` |

O agendamento volta ao chat coordenador para continuar o desenvolvimento. O
trabalho é conduzido por agentes que leem instruções, editam o projeto, executam
verificações e persistem o progresso. A agenda está no aplicativo Codex; os
scripts de `package.json` fornecem ferramentas de desenvolvimento e testes.

Os cinco minutos são uma oportunidade de retomada após interrupções. Uma fase
pode durar mais que isso, e fases bem-sucedidas devem seguir imediatamente para
a próxima, sem esperar um novo disparo. Nunca abrir um segundo executor para
uma fase que ainda tem um executor ativo.

Para trabalhar com arquivos locais, a execução agendada depende do computador e
do aplicativo em funcionamento, conforme a
[documentação oficial de tarefas agendadas](https://learn.chatgpt.com/docs/automations).

**Este handoff não pausou nem alterou a automação, o chat coordenador ou o estado
do desenvolvimento.**

## 2. Antes de assumir no Antigravity

1. No Codex, em Scheduled/Automações, pause a automação pelo nome acima.
2. Confira o chat coordenador e seus executores. Aguarde o executor terminar e
   salvar seu trabalho, ou encerre-o de maneira controlada e confira os arquivos
   antes de assumir. Confirme exclusividade de escrita no checkout.
3. Releia `project/automation-state.json`, a change ativa e seus relatórios. O
   estado pode ter avançado desde esta fotografia.
4. Abra este mesmo diretório no Antigravity. Se mudar de máquina ou diretório,
   transfira também arquivos sem commit e evidências, e ajuste os caminhos locais.
5. Só então continue a primeira fase incompleta. Mantenha o heartbeat antigo
   pausado enquanto o Antigravity controlar este checkout.

Na inspeção, o coordenador aparecia ocioso, mas o executor
`/root/i07_apply_finish` estava **ativo**. Seu identificador de chat no Codex é
`01a18250-6747-7522-8451-5b127f983741`. Ausência de processos Node, sozinha, não
comprova que um agente deixou de editar arquivos.

**Preservação do trabalho:** a branch era `master`, com HEAD `1b09d30`
(`docs: add incremental game development prompts`). `src/`, `tests/`,
`package.json`, lockfile, documentos, várias specs/changes e o estado/relatórios
da automação apareciam sem rastreamento no Git. Um clone desse commit não contém
toda a implementação presente neste checkout. Preserve os arquivos locais;
não use reset/clean para preparar a migração. Dependências e builds podem ser
regerados, mas código, assets, artefatos, estado e evidências precisam acompanhar
a transferência.

## 3. Fontes de verdade e ordem de leitura

| Arquivo/diretório | Papel |
| --- | --- |
| Instruções aplicáveis do repositório | Regras locais que devem ser respeitadas |
| `project/automation.md` | Runbook completo de execução, autorização e recuperação |
| `project/automation-state.json` | Checkpoint do orquestrador; deve ser reconciliado com disco e CLI |
| `project/prompts.md` | Contexto comum e roteiro dos 17 incrementos |
| `GDD.md` | Autoridade de produto, versão de referência v0.2 |
| `openspec/config.yaml` | Schema `spec-driven` e idioma dos artefatos |
| `.agents/skills/` | Workflows OpenSpec do projeto |
| `openspec/changes/<change>/` | Proposal, design, deltas e tasks da change ativa |
| `openspec/specs/` | Specs principais já sincronizadas |
| `openspec/changes/archive/` | Histórico das changes arquivadas |
| `project/automation-reports/<NN>-<change>/` | Relatórios por fase, logs, capturas e resultados |
| `README.md`, `ARCHITECTURE.md`, `ASSET_CREDITS.md` | Uso, arquitetura e procedência dos assets |

Há frases históricas no início de `project/prompts.md` dizendo que o repositório
ainda não tinha implementação e no final de `project/automation.md` descrevendo
o estado inicial `ready`. Elas descrevem a preparação original. O estado atual
deve ser estabelecido pelos arquivos, relatórios e CLI.

## 4. Como o fluxo funciona

Cada incremento cumpre esta sequência, com **um executor novo e contexto limpo
por fase**, no mesmo checkout compartilhado:

```text
explore → propose → apply → verify → archive → próximo incremento
```

| Fase | Trabalho e condição de saída |
| --- | --- |
| explore | Investigar somente o incremento atual, dependências e decisões. Usar `openspec-explore`. Sem implementar produto nem criar scaffold da change. Produzir relatório de decisões para a próxima fase. |
| propose | Usar `openspec-propose`; gerar/revisar proposal, design, delta specs e tasks; conferir os critérios e validar a change. Encerrar antes da implementação. |
| apply | Usar `openspec-apply-change`; implementar somente as tarefas atuais, executar verificações pertinentes e marcar tasks apenas com evidência. |
| verify | Outro executor audita código e evidências contra GDD, prompt, proposal, design, specs e tasks. Pode corrigir divergências do escopo e repetir verificações afetadas. Produzir relatório independente. |
| archive | Usar `openspec-archive-change` e `openspec-sync-specs`; sincronizar deltas preservando requisitos/cenários e Purposes, conferir as specs principais e arquivar somente após todos os gates. |

As skills acima são arquivos de instruções em
`.agents/skills/<nome-da-skill>/SKILL.md`. A fase verify tem contrato no runbook e
no prompt do roteiro; não depende de uma skill verify dentro do projeto.

Os textos `openspec explore`, `openspec propose` e `openspec apply` do roteiro
são invocações de workflows do agente. Não presumir que sejam subcomandos do
executável OpenSpec. Para CLI, usar comandos reais como `list`, `status`,
`instructions` e `validate`, e seguir o workflow local para arquivar.

No Codex, o isolamento é feito com `fork_turns="none"`. Para cada executor o
coordenador transmite explicitamente workspace, autorização, fase/change,
contexto comum, **somente o bloco do incremento atual**, relatório da fase
anterior e caminhos necessários. Não reutilizar o executor da fase anterior,
não criar chats de usuário para cada fase e não abrir checkouts por fase.

Só o orquestrador modifica `automation-state.json`. Executores modificam
artefatos, código e o relatório da própria fase. O orquestrador registra
fase/tentativa/início antes da delegação, adiciona o ID real após criar o executor,
confere o resultado nos arquivos/CLI e então registra conclusão e próximo passo.
Uma mensagem de sucesso do executor não basta.

## 5. Autorização e limites que devem acompanhar a retomada

O runbook registra autorização do usuário, de 27/10/2026, para executar
sequencialmente o roteiro com delegação, implementação, correções, testes,
sincronização e archive, sem interação rotineira. Isso cobre a transição de
propose para apply e a escolha de sincronizar antes de arquivar.

- Resolver decisões técnicas locais pelo GDD e registrar a justificativa.
- Não reduzir requisitos, pular dependências ou avançar com verificações exigidas
  falhando. Explore continua sem implementação.
- Não fazer push, publicar, criar serviços pagos ou presumir credenciais.
- O incremento 17 exige destino e autorização explícita de publicação já
  verificáveis. Na ausência deles, registrar `blocked_external` e a causa;
  conservar o pacote preparado, sem declarar publicação concluída.
- Artefatos OpenSpec em pt-BR, preservando headings estruturais e SHALL/MUST em
  inglês. Código, interface e documentação de entrega em inglês.
- Preservar alterações existentes e evidências dos incrementos anteriores.
- Comunicar conclusão, falha relevante ou bloqueio que exija ação. Permanecer
  silencioso quando não há mudança acionável e não repetir avisos iguais.
- Ao concluir todo o escopo autorizado, registrar `completed`. O fluxo original
  também manda remover o heartbeat pela ferramenta de automações do Codex, sem
  arquivar o chat. Um agente externo sem essa ferramenta deve deixar a remoção
  explicitamente pendente; não presumir que o heartbeat foi removido.

## 6. Estado encontrado e retomada imediata

O checkpoint lido tinha:

```json
{
  "status": "running",
  "currentIncrement": 7,
  "currentPhase": "apply",
  "activeAgent": "/root/i07_apply_finish",
  "attempt": 3,
  "lastUpdatedAt": "2026-10-28T08:40:53.6109473-03:00",
  "lastError": null
}
```

Os incrementos **01 a 06** estavam registrados como concluídos e suas changes
estavam presentes no archive. O **07**, `implement-menu-and-options`, tinha
explore/propose concluídos e apply em execução. Verify e archive ainda não
estavam registrados como concluídos. Os incrementos **08 a 17** estavam pending.

A CLI confirmou **13/18 tarefas concluídas** na change 07. `openspec status`
retornou `isPlanningComplete: true` e `isComplete: true` para o grafo dos
artefatos de planejamento; isso **não prova implementação concluída**.

Pendências no `tasks.md` inspecionado:

- **3.2:** fechar comprovação dos assets, estados e apresentação dos botões/painel.
- **3.3:** inspecionar e registrar layouts 1280×900, 320×568 e 844×390, incluindo
  menu, Options, erros, avisos e falhas de armazenamento.
- **4.3:** concluir documentação de snapshot/replay e registro da regressão afetada.
- **5.1:** consolidar verificações integradas e suas evidências.
- **5.2:** consolidar validação strict, cobertura dos critérios e relatório apply.

Há trabalho realizado além do que o relatório parcial `apply.md` descreve.
Evidências existentes em `project/automation-reports/07-implement-menu-and-options/`:

| Evidência | Resultado registrado |
| --- | --- |
| `vitest.log` | 13 arquivos, **230 testes aprovados** |
| `e2e.log` | **44 testes aprovados**, projetos dev e preview, duração 8,1 minutos |
| `test-results/.last-run.json` | `passed`, nenhuma falha listada |
| `lint.log`, `typecheck.log`, `build.log` | Logs existentes; conferir conteúdo e vínculo com o código ao retomar |
| `strict-finish-exit-codes.json` | `change: 0`, `all: 0` |
| `strict-change-finish.log`, `strict-all-finish.log` | Saídas da validação strict de fechamento |
| `browser-evidence/` | Capturas geradas para inspeção visual |
| `visual-comparison.json` | Comparações de capturas dev/preview |
| `visual-comparison-recheck.json` | 23 labels, zero falhas, registrado às 08:43:08 UTC−03 |
| `playwright-report/index.html` | Relatório HTML dos E2E |

Esses resultados foram **lidos de evidências existentes**, sem reexecutar as
suítes neste handoff. Igualdade de imagens não substitui inspeção de layout.
O executor ativo estava justamente fechando evidências; releia os arquivos antes
de concluir que qualquer uma dessas cinco tarefas ainda está pendente.

Depois da transferência de controle: finalizar apply 07 com evidência real,
executar verify em contexto novo, sincronizar e arquivar. Só então iniciar 08.
Não refazer explore/propose ou repetir toda a suíte sem alteração, falha ou
lacuna que justifique a repetição.

## 7. Roteiro completo

| Nº | Change | Estado na fotografia |
| --- | --- | --- |
| 01 | `setup-game-foundation` | Concluída/arquivada |
| 02 | `integrate-assets-and-arena-renderer` | Concluída/arquivada |
| 03 | `implement-player-navigation` | Concluída/arquivada |
| 04 | `implement-player-combat` | Concluída/arquivada |
| 05 | `implement-enemies-and-spawning` | Concluída/arquivada |
| 06 | `implement-match-lifecycle` | Concluída/arquivada |
| 07 | `implement-menu-and-options` | Apply em andamento |
| 08 | `implement-responsive-hud-and-touch` | Pendente |
| 09 | `implement-battle-feedback` | Pendente |
| 10 | `implement-mock-rest-api` | Pendente |
| 11 | `implement-result-outbox` | Pendente |
| 12 | `implement-ranking-and-history` | Pendente |
| 13 | `add-network-scenario-controls` | Pendente |
| 14 | `validate-game-end-to-end` | Pendente |
| 15 | `profile-and-tune-gameplay` | Pendente |
| 16 | `prepare-game-release` | Pendente |
| 17 | `publish-game-release` | Pendente; publicação exige autorização/destino |

## 8. Ambiente e comandos reais

Versões conferidas durante o handoff: **Node 26.11.1, npm 11.20.0 e OpenSpec
1.14.1**. O shim global de Node já apresentou falta de versão ativa. Preparar
o PATH **em cada novo shell**, somente para o processo, sem alterar Node global:

```powershell
Set-Location -LiteralPath 'C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev'
$env:PATH = 'C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1;' + $env:PATH
node --version
npm.cmd --version
openspec.cmd --version
openspec.cmd list --json
openspec.cmd status --change implement-menu-and-options --json
openspec.cmd instructions apply --change implement-menu-and-options --json
```

A raiz confirmada pela CLI era o `openspec/` local deste repositório; nenhum
store externo foi selecionado. Ler os caminhos retornados pela CLI. Se o runtime
acima não existir no destino, descobrir uma instalação compatível com os engines
de `package.json` antes de instalar ou alterar qualquer configuração global.

Scripts de instalação/verificação disponíveis, para executar quando necessário:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run e2e
openspec.cmd validate implement-menu-and-options --strict
openspec.cmd validate --all --strict
```

`build` já chama typecheck e deve preceder E2E contra preview. O Playwright atual
usa Chromium headless, um worker, projetos dev/preview e servidores locais nas
portas **5173/4173**. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` permite selecionar um
executável existente; não presumir disponibilidade do navegador no novo ambiente.
Houve uma negativa de lançamento de Chromium no sandbox em uma tentativa
anterior; execuções posteriores produziram os 44 testes aprovados. Respeitar as
permissões efetivas do ambiente e registrar qualquer bloqueio real.

`playwright.config.ts` aponta relatórios/results para o incremento 07, e os testes
também produzem capturas. Antes de gerar evidências de outro incremento, conferir
todos os destinos para preservar relatórios anteriores.

Para desenvolvimento interativo, existem `npm.cmd run dev` e
`npm.cmd run preview`. Evitar reutilizar servidores com configuração ou build
antigos ao interpretar os resultados dos testes.

## 9. Arquitetura que precisa ser preservada

O jogo usa React 19, PixiJS 8, TypeScript estrito e Vite. A simulação é autoral,
determinística, com passo fixo de 1/60 s, seed controlável e catch-up limitado.
React cuida de telas e controles semânticos; PixiJS apresenta snapshots do núcleo.

- `src/domain`: configuração tipada, contratos e resultados imutáveis.
- `src/simulation`: regras, movimento, colisões, combate, inimigos e spawn.
- `src/render`: assets, viewport, adapter Pixi e ciclo de recursos.
- `src/input`: controles traduzidos para input do núcleo.
- `src/ui`: telas, formulários, diálogos e status DOM.
- `src/storage`: persistência defensiva de identidade, opções e Last Result.
- Fronteira futura de dados: Axios + TanStack Query + MSW, introduzidos nos
  incrementos próprios; não considerar API/ranking/outbox já entregues.

A simulação não depende de React/Pixi, rede ou relógio global. Configuração de
gameplay fica centralizada, cada partida captura seu snapshot, e pausa congela
tempo ativo, cooldowns e spawns. Manter regras e decisões rastreáveis no GDD e nas
specs. Não substituir o núcleo por um motor pronto nem acrescentar multiplayer,
campanha, loot, autenticação ou backend real.

## 10. Recuperação e adaptação ao Antigravity

O agendamento e os IDs de agentes do Codex são específicos do Codex. Este
documento não instala agendamento nem configura recursos do Antigravity.
O estado, os prompts, os artefatos e as evidências em disco são a base portátil.

Para preservar o fluxo, usar um coordenador e sessões/executores novos por fase,
quando o ambiente oferecer esse recurso. Se não houver isolamento automático,
abrir contextos separados com o pacote mínimo abaixo e registrar essa adaptação.
Não simular IDs de agentes do Codex nem afirmar isolamento que não aconteceu.

Em toda retomada:

1. Confirmar que não há outro executor escrevendo e reconciliar checkpoint,
   changes ativas/arquivadas, relatórios, código e processos.
2. Um `running` persistido não comprova agente vivo. Do mesmo modo, uma change
   no archive não prova sync correto e checkboxes não provam testes.
3. Continuar do primeiro incremento e fase realmente incompletos, reutilizando
   trabalho existente. Atualizar `activeAgent` somente com identidade real do
   novo executor, após resolver o executor anterior.
4. Preservar histórico de tentativas e registrar a razão da recuperação. O apply
   07 já tinha tentativa 3 após interrupções por quota/capacidade; não zerar esse
   histórico para repetir a mesma falha.
5. Erros corrigíveis têm até três tentativas por fase, cada uma com executor novo.
   Ao esgotar, registrar `blocked` com causa concreta. Reavaliar bloqueio externo
   apenas após mudança relevante de evidência/ambiente.
6. Registrar comandos, exit codes, resultados, limitações e próximo passo em
   `<fase>.md`; guardar no estado somente o resumo e os caminhos das evidências.
7. Só avançar após validação. Guardar checkpoint ao interromper.

Se quiser restaurar a retomada periódica fora do Codex, será necessário
configurá-la separadamente no ambiente escolhido. O mecanismo precisa preservar
exclusividade, reabrir o workspace e reconciliar o checkpoint antes de trabalhar.
É possível continuar por sessões sucessivas sem esse agendamento.

## 11. Prompt pronto para colar no Antigravity

```text
Continue o desenvolvimento sequencial do Pirate Battle no workspace
C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev.

Leia project/HANDOFF-ANTIGRAVITY.md, project/automation.md,
project/automation-state.json, instruções aplicáveis do repositório, GDD.md,
openspec/config.yaml e os artefatos/evidências pertinentes. O handoff é uma
fotografia; reconcilie o estado com disco e CLI antes de escolher o trabalho.

Antes de qualquer edição de produto ou do checkpoint, confirme que o heartbeat
do Codex pirate-battle-openspec-sequencial está pausado e que o executor anterior
não continua escrevendo neste checkout. Se isso não for verificável, faça apenas
inspeção e registre o impedimento de assumir controle.

O runbook registra autorização para conduzir os 17 incrementos do roteiro em
ordem, com delegação e sem confirmações rotineiras de planejamento, apply, sync
ou archive. Preserve as validações, o escopo e as permissões do ambiente.

Na fotografia de 28/10/2026, 01–06 estavam arquivados e 07,
implement-menu-and-options, estava em apply, com 13/18 tarefas marcadas e cinco
pendentes de fechamento. Havia logs de 230 testes unitários e 44 E2E aprovados,
mais evidências strict/visuais recentes, mas verify/archive07 ainda faltavam.
Releia tudo: um executor do Codex estava finalizando essa etapa durante o handoff.
Não recrie a change nem descarte implementação ou evidências existentes.

Execute explore → propose → apply → verify → archive, encerrando e validando cada
fase antes da próxima. Use um executor/contexto novo por fase, um único executor
com permissão de escrita por vez, no mesmo checkout. Passe a cada executor a
autorização, o contexto comum e apenas o prompt do incremento atual, mais caminhos
e evidências necessários. Use as skills em .agents/skills como workflows; não
invente subcomandos CLI explore/propose/apply. Explore não implementa código.

Somente o coordenador atualiza automation-state.json. Preserve histórico de
tentativas, registre a identidade real do executor e o relatório de cada fase,
e confira conclusões no disco e na CLI. Não avance com tarefas ou verificações
obrigatórias pendentes. Após interrupções, reconcilie antes de repetir trabalho.
Após três tentativas sem solução, registre blocked e não repita sem nova evidência.

Prepare o runtime local de processo conforme o runbook; não altere Node global.
Preserve arquivos sem commit e os relatórios anteriores. Artefatos OpenSpec em
pt-BR com headings/SHALL/MUST em inglês; código, UI e docs de entrega em inglês.

Não faça push, publique, crie serviços pagos ou presuma credenciais. O incremento
17 só publica com destino e autorização explícita verificáveis; na ausência,
registre blocked_external e mantenha o pacote pronto. Avance imediatamente após
sucesso validado, salve checkpoint ao interromper e relate bloqueios reais sem
declarar concluída uma verificação que não executou.
```
