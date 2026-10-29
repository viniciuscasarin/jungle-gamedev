# Propose — setup-game-foundation

Status: concluído em 27/10/2026 pelo executor `/root/i01_propose`, somente planejamento. Nenhum bloqueio para delegar apply.

## Scope

Aplicada a skill `.agents/skills/openspec-propose/SKILL.md`. Lidos `project/automation.md`, estado da automação somente para consulta, relatório explore, GDD v0.2, `openspec/config.yaml`, inventário de specs/changes e somente contexto comum/bloco 01 de `project/prompts.md`, extraído até antes de `## 02`. Não foi encontrado AGENTS.md no workspace nem nos ancestrais consultados. Não houve instalação, código de produto, alteração de estado da automação, push ou deploy.

A raiz autoritativa foi confirmada por `list --json` e `context --json`: `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev`, source `nearest`, sem store. O inventário inicial de specs e changes estava vazio. O schema configurado `spec-driven` exige proposal, specs, design e tasks por fechamento transitivo de `applyRequires: [tasks]`.

## Artifacts

Base absoluta: `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev\openspec\changes\setup-game-foundation`.

- `.openspec.yaml`: scaffold da CLI, schema spec-driven, data 2026-10-27.
- `proposal.md`: motivação, escopo e três novas capacidades; exclusões explícitas.
- `specs/application-shell/spec.md`: tela acessível, viewport estreito, lifecycle seguro e falha gráfica legível.
- `specs/game-configuration/spec.md`: valores versionados, validação, imutabilidade profunda e seed separada.
- `specs/simulation-contracts/spec.md`: entrada normalizada, snapshots/eventos, resultado completo e isolamento de plataforma.
- `design.md`: estrutura, stack, unidades, tabela de parâmetros do GDD, ownership Pixi e estratégia de verificação.
- `tasks.md`: 18 tarefas ainda não marcadas, agrupadas por dependência e com verificação por tarefa; follow-up de verify/archive sem checkbox.

Nenhum artefato condicional foi omitido. O design foi incluído por introduzir stack e contratos transversais. Os specs principais continuam intocados, aguardando sync na fase própria.

## Decisions

- React + Vite + PixiJS + npm; dependências diretas fixadas e lockfile a gerar no apply. Node 26.11.1 e npm 11.20.0 verificados localmente.
- TypeScript 5.9.3 selecionado dentro da faixa observada do lint; versões propostas das demais ferramentas reaproveitam a pesquisa de explore. Apply precisa comprovar compatibilidade executável, podendo ajustar combinação com registro, sem bypass de peers.
- Fronteiras domain, simulation, render, input, ui, storage e data explícitas; arquivos concretos somente onde houver comportamento/contrato, sem serviços vazios.
- Valores propostos do GDD centralizados com unidades, arena-v1/balance-v1, eixos e ângulos declarados; raio/velocidade/vida/cooldown e opções rastreados. Alcances de projéteis derivados; ilhas permanecem envelopes propostos até alinhamento à arte.
- GameConfig profundamente readonly com cópia e freeze recursivo; MatchSetup valida seed uint32 separada. Resultado inclui todos os campos da seção 12 e materialização imutável de dados fornecidos, sem finalizar partida ou gerar IDs/chaves/datas.
- Tela mínima honesta com preview estático decorativo, DOM acessível e descarte de inicialização assíncrona tardia sob Strict Mode. Nenhum gameplay é entregue nesta fase.
- Axios/TanStack Query/MSW/Playwright permanecem integrações documentadas de incrementos próprios. Verificação da fundação inclui testes de núcleo/owner e navegador real sem instalar a suíte E2E futura.

## Validation

Em todas as invocações de shell foi anteposto ao PATH somente do processo:
`C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1`.

| Comando | Exit code / resultado |
| --- | --- |
| `node --version` | 0; v26.11.1 |
| `npm.cmd --version` | 0; 11.20.0 |
| `openspec.cmd --version` | 0; 1.14.1 |
| `openspec.cmd list --json` | 0; raiz válida e nenhuma change inicial |
| `openspec.cmd context --json` | 0; raiz nearest resolvida, sem erro de contexto |
| `openspec.cmd list --specs --json` | 0; inventário inicial vazio |
| `openspec.cmd new change setup-game-foundation` | 0; scaffold criado no caminho esperado |
| `openspec.cmd instructions proposal --change setup-game-foundation --json` | 0; template/instruções lidos antes da autoria |
| `openspec.cmd instructions specs --change setup-game-foundation --json` | 0; template/instruções e dependências relidas |
| `openspec.cmd instructions design --change setup-game-foundation --json` | 0; template/instruções e dependências relidas |
| `openspec.cmd instructions tasks --change setup-game-foundation --json` | 0; template/instruções e specs/design relidos |
| `openspec.cmd status --change setup-game-foundation --json` | 0 em cada consulta após escrita; final com os quatro artefatos done e isPlanningComplete=true |
| `openspec.cmd validate setup-game-foundation --strict` | 0; Change 'setup-game-foundation' is valid |
| `openspec.cmd status --change setup-game-foundation` | 0; Progress: 4/4 artifacts complete |
| `git status --short` | 0; change e arquivos de automação como untracked; fontes de aplicação ainda inexistentes |

As 3 capacidades da proposal têm exatamente seus 3 delta specs correspondentes. Cada requisito usa SHALL e cenários WHEN/THEN, com Purpose próprio. Nenhuma tarefa de implementação foi marcada como concluída. O status `isComplete` da CLI nesta consulta confirma os artefatos de planejamento, não implementação/testes do jogo.

## Limitations and handoff

Não foram executados npm ci, build, lint, typecheck, testes de aplicação ou inspeção gráfica porque não há implementação nesta fase. A compatibilidade da stack permanece uma decisão a comprovar no apply. A licença dos assets segue não comprovada e nenhum novo asset foi utilizado.

Todos os artefatos necessários para implementação estão prontos. Próximo passo autorizado: o orquestrador inicia **outro executor** com a skill openspec-apply-change para `setup-game-foundation`, os artefatos acima, o GDD e o bloco 01, conforme autorização antecipada em `project/automation.md`. Este executor propose encerra aqui, sem iniciar apply.
