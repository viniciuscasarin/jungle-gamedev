# Propose — implement-mock-rest-api (Incremento 10)

Concluído em 28/10/2026 por `/root/i10_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seções 12 (Ranking, identity, and recording rules) e 13 (Technical design boundaries).
  - `project/automation-reports/10-implement-mock-rest-api/explore.md`: Diagnóstico técnico e arquitetural da base atual, identificação de ausência de camada de rede e mock REST, avaliação de compatibilidade de dependências (`axios` e `msw`).
  - `openspec/config.yaml`: Schema `spec-driven` e restrições de idioma (pt-BR com cabeçalhos estruturais e termos SHALL/MUST em inglês).
- **Inventário de Capacidades**:
  - Validação das 15 specs existentes em `openspec/specs/`.
  - Inspeção de `simulation-contracts` (que já definia `CompletedMatchResult` e validação) e `game-configuration` (que já especificava `configurationKey` canônica).

## 2. Artefatos Criados

A change `implement-mock-rest-api` foi criada em `openspec/changes/implement-mock-rest-api/` com schema `spec-driven` e todos os 4 artefatos exigidos:

1. **`proposal.md`**:
   - Motivação fundamentada na necessidade de contratos REST padronizados, Mock Service Worker (MSW) resiliente e persistência desacoplada de partidas confirmadas para alimentar ranking e histórico comparativo.
   - Escopo de adições: `axios` e `msw`, endpoints `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches`, ordenação determinística tripla, idempotência estrita com detecção de conflitos tipados (409), inicialização assíncrona tolerante a falhas ("falha no serviço não impede Play"), store de partidas confirmadas sob `pirate-battle.confirmed-matches.v1` e identidade local estável `Captain-XXXX`.
   - Declaração da nova capability `mock-rest-api`.
2. **Delta Specs em `specs/`**:
   - `specs/mock-rest-api/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 5 requisitos normativos com descrições concisas (<= 500 caracteres) e cenários testáveis em formato `WHEN/THEN` de 4 hashtags (`####`):
     - `Requirement: Contratos REST paginados para Ranking e Histórico`
     - `Requirement: Registro idempotente e resolução de conflitos em POST /api/matches`
     - `Requirement: Repositório persistido de partidas confirmadas e desacoplamento`
     - `Requirement: Inicialização resiliente e interceptação com Mock Service Worker`
     - `Requirement: Fixtures determinísticas de capitães e identidade de jogador`
3. **`design.md`**:
   - Decisões arquiteturais fundamentadas no relatório de explore:
     - Interceptação isomórfica com MSW: `setupWorker` no navegador (`vite dev`, `vite preview`, build estático) e `setupServer` no Vitest, compartilhando a mesma lista de handlers e store.
     - Repositório persistido desacoplado no LocalStorage sob a chave `pirate-battle.confirmed-matches.v1` com isolamento estrito contra o estado imediato da batalha (`pirate-battle.last-result.v1`) e fallback em memória.
     - Ordenação determinística estrita no ranking: 1) `score` DESC; 2) `completedAt` ASC (quem alcançou primeiro); 3) `matchId` ASC (desempate estável lexicográfico).
     - Idempotência estrita em `POST /api/matches`: retentativas idênticas retornam o registro canônico (200/201), enquanto cargas conflitantes com o mesmo `matchId` retornam HTTP 409 Conflict com JSON tipado.
     - Inicialização resiliente com `initMocks()`: timeout defensivo curto e `try/catch` garantindo que lentidão ou falha de registro do Service Worker não impeçam o início de partidas.
     - Identidade local persistente (`Captain-XXXX` e UUID v4) e fixtures determinísticas pré-semeadas sem duplicação entre recarregamentos.
     - Mapeamento de riscos e mitigações (ambientes restritos a Service Worker, cotas de LocalStorage e fidelidade de testes Node vs Browser).
4. **`tasks.md`**:
   - 14 tarefas pendentes numeradas e organizadas em 5 grupos lógicos sequenciais:
     - Grupo 1: Setup e Infraestrutura de Mocks (3 tarefas).
     - Grupo 2: Contratos REST e Cliente HTTP (2 tarefas).
     - Grupo 3: Repositório Persistido e Fixtures Determinísticas (4 tarefas).
     - Grupo 4: Handlers REST do MSW e Suporte a Múltiplos Ambientes (2 tarefas).
     - Grupo 5: Testes Automatizados e Documentação (3 tarefas).
   - Cada tarefa possui método de verificação explícito (testes unitários com Vitest, compilação TypeScript, checagem de arquivos ou integridade documental).

## 3. Validação Estrita OpenSpec

Comandos executados no PowerShell com runtime Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change implement-mock-rest-api --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate implement-mock-rest-api --strict` | 0 | Change `implement-mock-rest-api` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 16 itens validados com sucesso (15 specs existentes + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `implement-mock-rest-api` referente ao incremento 10 está formalmente concluído e validado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar o avanço e acionar o executor da fase `apply` (`/root/i10_apply`) para proceder com a instalação das dependências, geração do worker do MSW e implementação dos contratos, store persistente, handlers e testes.
