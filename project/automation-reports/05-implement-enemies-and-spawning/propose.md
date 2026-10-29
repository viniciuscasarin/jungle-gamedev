# Propose — implement-enemies-and-spawning

Fase concluída por `/root/i05_propose`, somente planejamento. Skill aplicada: `.agents/skills/openspec-propose/SKILL.md`. Autorização antecipada em `project/automation.md` permite ao orquestrador iniciar apply em outro executor sem interação; esta fase encerra antes de código. Nenhum subagente adicional, push, deploy, edição de automation-state.json, código de produto, main specs ou evidências 01–04.

## Fontes e estado inicial

Lidos automation.md/estado, explore.md de 05, configuração OpenSpec, oito specs principais, GDD §§5–7, contratos/config/engine/collision/combat, integração Pixi/loop, testes core/E2E e trechos pertinentes de README/ARCHITECTURE. Contexto comum e prompt 05 foram extraídos por regex de `project/prompts.md`, com parada antes de 06; nenhum prompt futuro foi carregado. A primeira extração do cabeçalho comum também incluiu blocos anteriores 01–04 e foi refinada para somente `Contexto comum`; isso não alterou o escopo. Sem AGENTS.md nos ancestrais/caminhos consultados. Raiz CLI confirmada no workspace e nenhuma change ativa antes da criação; 01–04 arquivadas.

## Artefatos

Criada `openspec/changes/implement-enemies-and-spawning/` com `.openspec.yaml`, proposal.md, design.md, tasks.md e seis deltas:

- Novas: enemy-behavior e spawn-director, ambas com Purpose próprio.
- Modificadas: simulation-runtime, simulation-contracts, arena-rendering e player-combat; blocos modificados conservam os cenários anteriores. Nenhum Purpose existente alterado.
- 17 tarefas pendentes em cinco grupos com verificações e documentação por grupo; nenhuma marcada como implementada.

Todos os artefatos transitivos requeridos pelo schema spec-driven foram criados. Design é aplicável porque a integração cruza contratos, colisão, engine e apresentação. Nenhum artefato condicional foi omitido.

## Decisões e cobertura

- Grafo por raio com grid inicial de 20 unidades, conexões reais de endpoints, varredura nas arestas/smoothing, busca/desempate estáveis e cache por mapa/raio. Movimento circular generalizado preserva player; parâmetros técnicos necessários centralizados, sem duplicar valores já no GameConfig.
- Shooter usa 210/240/270 e estado approach/retreat/hold, reposiciona por LOS, aguarda recarga cheia na entrada em alcance e reinicia ao sair; bloqueio/erro angular dentro do alcance só adiam emissão. LOS considera raio da bala e emissão segura; sem mira preditiva.
- Colisão/separação determinística protege cenário/player e preserva contato Chaser antes da correção. Balas existentes resolvidas antes das ações; mortos não agem depois.
- RNG uint32 privado com seed zero; busca finita inicial de até 64 candidatos no perímetro e consumo reproduzível, inclusive rejeições. Reserva e revalidação precedem materialização; só sucesso avança arquétipo. Sem backlog, cap ou rampa.
- Agenda absoluta 3/6s e telegraph 0,6s implicam aparições 3,6/6,6s. Conflito com frase GDD de ambos até 6s está registrado em proposal/design/spec; prevalece o algoritmo explícito do prompt 05, sem encurtar aviso.
- `combatScenario=targets` permanece estacionário por modo explícito; qualquer InitialCombatData sem esse modo conserva IA/diretor. Nenhum setter de teleporte/dano/score.
- Core planeja rotas, LOS, recarga, raios, separação, RNG, reserva/revalidação/cancelamentos, alternância e freeze. E2E dev/preview usa clock e controles reais para ambos arquétipos, bloqueio de tiro, telegraph, morte/score por colisões e descarte. Novas evidências exclusivamente em 05.

## Comandos e resultados

Cada shell de CLI recebeu apenas PATH de processo para `C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1`.

| Comando | Exit code / resultado |
| --- | --- |
| `node --version` | 0, v26.11.1 |
| `openspec.cmd --version` | 0, 1.14.1 |
| `openspec.cmd list --json` | 0, raiz válida e changes vazias inicialmente |
| `openspec.cmd context --json` | 0, raiz repo-local confirmada |
| `openspec.cmd list --specs` | 0, oito capabilities existentes |
| `openspec.cmd show simulation-runtime/arena-rendering/player-combat --type spec --json --no-scenarios` (cada ID separadamente) | 0 em cada consulta; specs completas também lidas do disco |
| `openspec.cmd new change implement-enemies-and-spawning` | 0, scaffold criado |
| `openspec.cmd instructions proposal/design/specs/tasks --change implement-enemies-and-spawning --json` (cada artefato separadamente) | 0, instruções/template/dependências respeitados |
| `openspec.cmd status --change implement-enemies-and-spawning --json` (após escritas) | 0; final 4/4 done, isPlanningComplete=true |
| `openspec.cmd validate implement-enemies-and-spawning --strict` | 0, change válida |
| `openspec.cmd validate implement-enemies-and-spawning --strict --json` | 0, 1 passed/0 failed, issues=[]; salvo propose-validation.json |
| `openspec.cmd status --change implement-enemies-and-spawning` | 0, quatro artefatos completos |
| `git status --short` | 0, checkout compartilhado com arquivos anteriores não rastreados preservados |

Uma busca inicial `rg` incluiu `src/App.tsx`, inexistente, e retornou exit 1 por esse caminho; resultados dos arquivos pertinentes existentes foram lidos normalmente. Não foi falha de validação ou dependência. Status final salvo em propose-status.json, com seis deltas e 17 checkboxes vazios conferidos.

## Limites e handoff

Não foram executados testes de produto ou browser nesta fase, pois não houve implementação. Não há bloqueio nem decisão material pendente. Todos os artefatos necessários à implementação estão prontos. Orquestrador pode iniciar imediatamente apply em novo executor, lendo esta change, explore.md e o prompt 05. Ao futuro archive, sync deve preservar Purpose existente e só ocorrer após implementação/verificação satisfatórias.
