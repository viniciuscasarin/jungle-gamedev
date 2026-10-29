# Propose — integrate-assets-and-arena-renderer

Concluído em 27/10/2026 por `/root/i02_propose`. Fase restrita a planejamento,
usando `.agents/skills/openspec-propose/SKILL.md`. Nenhum código de produto,
spec principal, dependência ou estado de automação foi alterado nesta fase.

## Fontes e escopo

Lidos: skill propose do projeto, `project/automation.md`, estado da automação
(somente leitura), relatório explore02, contexto comum e somente bloco02 de
`project/prompts.md`, GDD v0.2, config OpenSpec, três specs principais, renderer,
owner, UI/CSS, configuração e testes atuais, README e ARCHITECTURE. Nenhum
AGENTS.md encontrado no workspace ou ancestrais consultados. O inventário e a
raiz foram confirmados pela CLI; incremento01 já estava arquivado. Não houve
criação de subagente, push, deploy, implementação, sync ou archive.

## Artefatos criados

Raiz resolvida: `openspec/changes/integrate-assets-and-arena-renderer/`.

- `.openspec.yaml`: scaffold do schema `spec-driven` criado pela CLI.
- `proposal.md`: motivação, escopo, capacidades e impacto.
- `design.md`: mapeamento observado, cache/ownership, fluxo React, mapa e
  geometria, transformação/DPR, validação e migração local.
- `specs/asset-loading/spec.md`: nova capacidade; catálogo, cache recuperável,
  falha demonstrável, ownership e créditos.
- `specs/arena-rendering/spec.md`: nova capacidade; cena estática, enquadramento,
  transformações e DPR.
- `specs/application-shell/spec.md`: três requisitos modificados integralmente,
  evoluindo fundação para menu/loading/arena com recuperação e cleanup.
- `specs/game-configuration/spec.md`: centralização/versionamento modificados e
  geometria sólida compartilhada adicionada.
- `tasks.md`: 21 tarefas pendentes, em grupos com testes/documentação junto ao
  trabalho e verificações de integração finais. Nenhuma marcada como feita.

Todos os artefatos exigidos estão presentes; nenhum foi pulado. Conteúdo em
pt-BR, headings estruturais e SHALL em inglês. Documentação de entrega e UI
foram planejadas em inglês, sem redigir antecipadamente docs de funcionalidade
ainda não implementada.

## Decisões para apply

- PNGs individuais com URLs Vite; player5/Chaser3/Shooter8 e água73 conforme
  inspeção do explore. Preservar dimensões e orientação; retina não presumida.
- Menu mínimo→Loading→Static Arena, Retry/Main Menu e status semântico. Loading
  perceptível por300ms, timer cancelável por tentativa. Sem Options/ranking.
- `?assetScenario=fail-once` falha antes da consulta ao cache, inclusive quente;
  Retry segue caminho normal. Geração por tentativa evita callbacks obsoletos.
- Cache de sessão possui texturas e compartilha promise/leases; renderer possui
  instâncias/app/canvas/listeners. Cleanup de arena não destrói texturas usadas
  por outro consumidor; descarte final espera leases e pendências.
- Mundo960×540, player(480,270) para cima. Ilhas propostas160×120 com tiles40²,
  origens(135,95)/(665,325), dentro das regiões do GDD. Configuração passa de
  envelopes a geometria serializável/imútavel e mapVersion arena-v2.
- Contorno segue areia visível, com erro máximo4 unidades lógicas; medir e
  documentar vértices/peças e overlay durante montagem. Não usar alpha nem
  retângulo-envelope como collider. Não executar colisão neste incremento.
- Transformação pura em CSS pixels com escala uniforme, offsets, insets e
  estado seguro para área zero. DPR afeta buffer, com listener para mudança
  isolada. Faixas mínimas48px superiores/88px inferiores e safe areas.
- Cena renderiza manualmente em init/resize, sem gameplay ticker. Preservar
  garantias do owner já existente e testar Strict Mode/late init/init parcial.
- ASSET_CREDITS registra origem fornecida no repo/challenge e autoria/licença
  não documentadas. Nenhuma licença ou autor inferido da aparência.
- Playwright proporcional ao fluxo atual, sem suíte ampla futura: loading,
  recuperação, saída pendente, ciclos, resize e screenshots reais.

## Comandos e resultados

Cada shell antepôs ao PATH do processo o runtime
`C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1`.
Usados shims `openspec.cmd`; nenhum nvm global foi alterado.

| Comando/consulta | Resultado |
| --- | --- |
| `openspec.cmd list --json` | Raiz local válida, nenhuma change ativa antes da criação; shell de consulta exit0 |
| `openspec.cmd context --json` | Raiz autoritativa do workspace; shell de consulta exit0 |
| `openspec.cmd list --specs` | application-shell, game-configuration, simulation-contracts; shell exit0 |
| `openspec.cmd show application-shell --type spec --json --no-scenarios` e equivalente game-configuration | Inventário consistente com specs completas lidas; shell exit0 |
| `openspec.cmd new change integrate-assets-and-arena-renderer` | Scaffold criado, schema spec-driven; shell exit0 |
| `openspec.cmd instructions proposal/specs/design/tasks --change integrate-assets-and-arena-renderer --json` | Cada artefato consultado antes de autoria, dependências relidas; shells exit0 |
| `openspec.cmd status --change integrate-assets-and-arena-renderer --json` | Consultado após artefatos; final isPlanningComplete=true, quatro artefatos done |
| `openspec.cmd validate integrate-assets-and-arena-renderer --strict` | **Exit code0**, change válida, sem warning reportado |
| `openspec.cmd status --change integrate-assets-and-arena-renderer` | **Exit code0**, Progress4/4 artifacts complete |

Os comandos de consulta iniciais foram executados agrupados; a tabela identifica
o exit code do shell nesses casos, sem inventar captura individual. Os dois
últimos exit codes foram capturados imediatamente de `$LASTEXITCODE`.

## Limitações e handoff

Validação acima cobre artefatos OpenSpec, não implementação. Não foram rodados
testes de produto, browser ou build nesta fase. Dimensões de composição e
tolerância são decisões propostas; a correspondência final dos vértices com
o litoral precisa da medição/overlay prevista em tasks. Créditos de terceiros
continuam sem prova adicional de licença. Não há bloqueio para apply.

Próximo passo: orquestrador iniciar **novo executor apply** para esta change com
a autorização antecipada de `project/automation.md`; não aguardar confirmação
rotineira. Este executor encerra aqui, sem iniciar a implementação.
