# Propose — implement-player-combat

Concluído em 27/10/2026 por `/root/i04_propose`. Fase somente planejamento, usando `.agents/skills/openspec-propose/SKILL.md` e autorização antecipada de `project/automation.md`. Não houve código de produto, testes de produto, implementação, sync, archive, push ou deploy nesta fase. `automation-state.json` foi somente lido; alterações anteriores foram preservadas.

## Contexto consultado

- Contexto comum e bloco 04 de `project/prompts.md` extraídos por regex entre headings, encerrando antes de 05; nenhum conteúdo de prompt futuro carregado. A primeira regex pressupunha heading Incremento e retornou vazio; corrigida para `^## 04` até `^## 05`.
- Relatório explore 04, automação/estado, GDD v0.2, config OpenSpec, sete specs atuais e implementação pertinente de config/contratos/engine/colisão/input/loop/Pixi/React/manifest, testes existentes e documentação.
- CLI confirmou raiz local válida, nenhuma change ativa e sete specs antes da criação; nenhuma AGENTS.md adicional encontrada na inspeção da fase explore e inventário local.

## Artefatos

Change em `openspec/changes/implement-player-combat/`, schema spec-driven:

- `proposal.md`: motivação, escopo e exclusões, capability nova e seis existentes modificadas.
- `design.md`: decisões de geometria, tempos, fases, autoria, fixtures, adaptadores e validação proporcional, com riscos e plano de sync posterior.
- `specs/player-combat/spec.md`: nove requisitos de armas, cadência, emissão, sweep/lifetime, facções, morte, score, precedência e diagnóstico, com Purpose próprio.
- Deltas de `simulation-runtime`, `simulation-contracts`, `game-configuration`, `arena-rendering`, `application-shell` e `asset-loading`. MODIFIED preserva os cenários anteriores e substitui restrições temporárias incompatíveis com combate. Nenhum Purpose de spec existente foi editado.
- `tasks.md`: 21 tarefas de implementação/verificação distribuídas por seis grupos; todas as tarefas permanecem pendentes. Nenhum artefato condicional foi omitido.

## Decisões locais e limites

Q/W/E usam frente/perpendiculares no rumo atualizado, broadsides em −14/0/+14 longitudinalmente. Raio técnico inicial 5 e clearance 0,5 ficam centralizados/documentados, sem alterar números do GDD. Muzzle usa segmento completo desde emissão e ocupação final, evitando nascer além de costa adjacente. Sweep escolhe menorTOI entre costa/limite/hostil, prioriza sólido no empate e limita deslocamento à vida parcial.

Cadência usa tempo ativo com fronteira numérica testada. Balas existentes resolvem antes de navegação viva/contato mínimo/novos tiros; balas novas deslocam no próximo passo. Projétil conserva autoria/facção/dano após morte do emissor. Morte é atômica e eventos por passo; score somente 1 por morte causada pelo player. Player em saúde 0 não age, sem antecipar resultado ou lifecycle completo.

Fixture `?combatScenario=targets` opt-in aceita somente dados iniciais puros, sem setters de gameplay; normal começa vazio. Alvos estacionários usam domínio/saúde/raio reais. Contato Chaser mínimo 25/autodestruição/score 0 está planejado para provar a precedência, sem IA/perseguição/spawn/disparo autônomo.

Mantidos um RAF, freeze/baseline, navegação e cache/owner. Bala fornecida 10×10 entra no manifest/créditos. Score/readiness/cooldown mínimos React limitados a 10Hz ou mudança de décimo, sem HUD final, touch, áudio ou efeitos completos.

Validação planejada: testes core/Node de padrões/cadência/sweep/facções/morte/score/tempo/imutabilidade e E2E com mouse/Q/W/E/R reais e colisões, sem grantScore/kill/teleport. Browser também cobre held/freeze/Resume, fluxo normal, recursos dinâmicos e inspeção visual 320px/landscape. IA, spawn e lifecycle futuros ficam fora da suite desta etapa.

## Comandos e resultados

Todos os comandos OpenSpec usaram PATH somente do processo com runtime Node v26.11.1 em `C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1` e shim `openspec.cmd`.

| Comando | Exit code | Evidência |
| --- | --- | --- |
| `openspec.cmd list --json` |0| raiz nearest válida, changes vazias antes da criação |
| `openspec.cmd context --json` |0| root local resolvido |
| `openspec.cmd list --specs` |0| sete capabilities existentes |
| `openspec.cmd show simulation-runtime --type spec --json --no-scenarios` |0| inventário de requisitos conferido |
| `openspec.cmd show player-navigation --type spec` |0| regressões e contratos de navegação conferidos |
| `openspec.cmd new change implement-player-combat` |0| scaffold spec-driven criado na raiz resolvida |
| `openspec.cmd instructions proposal/specs/design/tasks --change implement-player-combat --json` |0 cada| instruções consultadas separadamente antes de cada artefato |
| `openspec.cmd status --change implement-player-combat --json` |0 em cada consulta| dependências conferidas; final isPlanningComplete=true, quatro artifacts done |
| `openspec.cmd validate implement-player-combat --strict` |0| Change is valid; repetido após revisão de escrita com mesmo resultado |
| `openspec.cmd status --change implement-player-combat` |0| Progress 4/4 artifacts complete |
| leituras/regex/rg e `git status --short` |0| inspeção sem produto alterado; arquivos preexistentes untracked preservados |

Não foram executados npm/test/build/browser por se tratar de propose; os comandos constam como trabalho futuro verificado por evidência nas tasks.

## Handoff

Planejamento completo e válido, sem bloqueio nem decisão material pendente. Próxima fase: apply em executor novo, lendo esta change e o relatório explore 04, usando a autorização antecipada do roteiro. Conferir e executar cada task; só marcar após evidências. Futuro sync deve preservar Purpose das seis specs existentes e adicionar o Purpose de player-combat. Não arquivar antes de implementação/testes/verify completos.
