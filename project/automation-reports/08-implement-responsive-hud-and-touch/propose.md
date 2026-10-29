# Propose — implement-responsive-hud-and-touch

Concluído em 28/10/2026 por `/root/i08_propose`. Fase somente de planejamento,
usando `.agents/skills/openspec-propose/SKILL.md` e a autorização sequencial de
`project/automation.md`. Nenhum código de produto, teste, configuração de execução,
spec principal ou automation-state.json foi editado. Nenhum apply, push ou deploy.

## Escopo e fontes

Lidos runbook/estado, relatório08 de explore, contexto comum e bloco08 de
`project/prompts.md` extraídos por regex com limite antes09, GDD 4/10 e partes
pertinentes, config OpenSpec, specs relacionadas e implementação/testes de input,
engine, apresentação/loop/viewport/owner, App/CSS, assets e Playwright.
Base01–07 permanece arquivada. CLI confirmou raiz local válida, zero changes antes
da criação e inventário de12 specs. Não há AGENTS.md segundo explore e busca local.

## Artefatos

Change em `openspec/changes/implement-responsive-hud-and-touch`, schema configurado
`spec-driven`, com todos os artefatos da dependência transitiva de applyRequires tasks:

- proposal.md: motivação, escopo e quatro capabilities.
- design.md: decisões fundamentadas no código, alternativas, riscos e verificação.
- tasks.md:25 tarefas pendentes em cinco grupos, cada uma com verificação; testes e
  documentação aparecem junto de cada área, e sync/archive são follow-up não rastreado.
- specs/responsive-hud/spec.md e specs/touch-input/spec.md: capabilities novas com
  Purpose completo, requisitos e cenários.
- specs/player-navigation/spec.md e specs/arena-rendering/spec.md: deltas existentes,
  conservando headers/cenários anteriores e acrescentando comportamentos08.

Nenhum artefato condicional foi omitido. Design é necessário por atravessar input,
simulação, layout, renderer e ciclo de vida. Specs existentes mantêm seus Purpose;
shell/assets/runtime não recebem deltas sem mudança real de seus contratos.

## Decisões para apply

Completar direction/movementRequested ignorados pelo engine e barras Pixi ausentes;
o “preserve” do prompt não autoriza deixar essa lacuna. Giro, avanço, colisão, dano,
cooldown e pausa continuam no domínio existente. Buffer compõe fontes/IDs, captura
por controle, release individual e R touch por up válido, cancel nunca alternando.
Modo inicial por coarse e troca por input real, ignorando compatibilidade de touch;
hasTouch isolado não decide e resize não muda modo. Troca efetiva neutraliza R
explicitamente, sem falso keydown/step e sem reset.

Faixas reais medidas e safe area única alimentam viewport/input; atualização ocorre
mesmo sem resize do host. Status numérico limitado usa o relógio ativo existente,
sem segundo RAF/timer. Assets já inspecionados no explore foram aproveitados no
plano, com metadata registrada; qualquer asset adicional exige abertura visual.
Decoração DOM não bloqueia loading Pixi. Barras Graphics seguem snapshots sem giro,
clamp/tamanho CSS legível, descarte próprio e preservação de texturas compartilhadas.

Validação planejada inclui testes puros, CDP/equivalente de multitouch real com
pointer events confiáveis/captura nativa, joypad+QWE, cancel/release/R, dano real nas
barras de player/Chaser/Shooter, resize/DPR/modo na mesma partida, pausa exata,
safeareas simuladas explicitamente, visuais1280×900/320×568/390×844/844×390/568×320,
cinco ciclos e regressões. Alterar destinos Playwright07 para08 antes de executar,
preservando toda evidência01–07. Eventos sintéticos isolados não comprovam multitouch.

## Comandos e resultados

Todos os shells de CLI antepuseram somente no processo o runtime cadastrado em
`C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1`.

| Comando/verificação | Exit code | Resultado |
| --- | --- | --- |
| node --version; openspec.cmd --version | 0 | v26.11.1 e1.14.1 |
| openspec.cmd list --json | 0 | raiz workspace resolvida; zero changes iniciais |
| openspec.cmd context --json | 0 | raiz local authoritative, sem store |
| openspec.cmd list --specs | 0 |12 capabilities existentes |
| openspec.cmd show player-navigation/arena-rendering/application-shell --type spec --json --no-scenarios (individualmente) | 0 | inventário de requisitos; specs relevantes lidas integralmente em disco/CLI |
| openspec.cmd new change implement-responsive-hud-and-touch | 0 | scaffold spec-driven criado |
| openspec.cmd instructions proposal/specs/design/tasks --change implement-responsive-hud-and-touch --json (individualmente) | 0 | templates, regras, dependências e destinos resolvidos respeitados |
| openspec.cmd status --change implement-responsive-hud-and-touch --json (após artefatos) | 0 | final isPlanningComplete true, quatro artefatos done |
| openspec.cmd validate implement-responsive-hud-and-touch --strict | 0 | change válida; confirmado novamente ao final com exit explícito |
| openspec.cmd validate --specs --strict | 0 |12 passed,0 failed |
| openspec.cmd status --change implement-responsive-hud-and-touch | 0 |4/4 artefatos completos |
| Script PowerShell de preservação dos cenários MODIFIED e contagem tasks | 0 |5 blocos modificados conservam nomes de todos os cenários antigos;25 pendentes |
| git status --short | 0 | base inteira previamente não rastreada; nenhum staging/commit/reset realizado |

## Limites e handoff

Não foram executados lint/unit/build/E2E nesta fase porque não houve implementação;
todos permanecem tarefas do apply. Não há alegação de validação visual ou hardware
touch novo: isso será produzido na execução. CLI status completo significa que o
planejamento existe, não que25 tarefas estejam implementadas. Sem bloqueio material
ou decisão pendente que mude escopo. Artefatos estão prontos para revisão e apply.

O orquestrador pode conferir strict/status em disco, registrar sucesso e iniciar
imediatamente apply em outro subagente com contexto limpo usando a autorização já
persistida, sem solicitar nova interação ao usuário. Este executor encerra aqui.
