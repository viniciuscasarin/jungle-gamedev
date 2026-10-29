# Propose — implement-result-outbox (Incremento 11)

Concluído em 28/10/2026 por `/root/i11_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seções 8 (Session lifecycle and configuration), 9 (Screens and information hierarchy), 12 (Ranking, identity, and recording rules) e 13 (Technical design boundaries).
  - `project/automation-reports/11-implement-result-outbox/explore.md`: Diagnóstico técnico da ausência de fila outbox persistente, avaliação de compatibilidade do `@tanstack/react-query` v5 com React 19, definição dos estados semânticos (`Recording…`, `Recorded`, `Pending — Retry`), modelagem de retentativas com backoff limitado e contenção de erros permanentes.
  - `openspec/config.yaml`: Schema `spec-driven` e regras de idioma (pt-BR com cabeçalhos estruturais e termos normativos SHALL/MUST em inglês).
- **Inventário de Capacidades**:
  - Validação das 16 specs existentes em `openspec/specs/`.
  - Inspeção de `mock-rest-api` (que já implementou o store confirmado e a idempotência de `POST /api/matches`), `match-lifecycle` (término e persistência local defensiva de Last Result) e `simulation-contracts` (validação e imutabilidade de `CompletedMatchResult`).

## 2. Artefatos Criados

A change `implement-result-outbox` foi criada em `openspec/changes/implement-result-outbox/` com schema `spec-driven` e todos os artefatos exigidos:

1. **`proposal.md`**:
   - Motivação fundamentada na necessidade de entrega confiável de resultados pós-combate segundo as seções 8, 9 e 12 do GDD.
   - Escopo de mudanças: instalação do `@tanstack/react-query`, orquestração de mutação com Axios, persistência pré-POST na Outbox sob chave `pirate-battle.outbox.v1`, remoção estrita pós-confirmação (200/201), retentativas automáticas com backoff exponencial limitado para falhas transitórias, contenção sem loop para erros de validação (400) e conflito (409), recuperação de timeout pós-commit via idempotência, estados visuais semânticos de entrega (`Recording…`, `Recorded`, `Pending — Retry`), painel/botão de pendências no Menu Principal e isolamento visual estrito entre partidas.
   - Declaração de capabilities: nova capability `result-outbox` e modificação da capability existente `match-lifecycle`.
2. **Delta Specs em `specs/`**:
   - `specs/result-outbox/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 6 requisitos normativos com descrições concisas (<= 500 caracteres) e cenários de aceitação em formato `WHEN/THEN` com 4 hashtags (`####`):
     - `Requirement: Persistência atômica da outbox pré-POST`
     - `Requirement: Remoção exclusiva pós-confirmação e recuperação de timeout`
     - `Requirement: Retentativa com backoff exponencial e contenção de erros permanentes`
     - `Requirement: Estados semânticos de entrega e isolamento visual`
     - `Requirement: Monitoramento e reenvio de pendências no Menu Principal`
     - `Requirement: Resiliência contra falhas de armazenamento e abandono`
   - `specs/match-lifecycle/spec.md`: Delta spec com requisito atualizado sob `## MODIFIED Requirements`:
     - `Requirement: Resultado local legível e recuperável`: atualizado para integrar a entrega semântica remota via outbox (`Recording…`, `Recorded`, `Pending — Retry`), preservando a persistência honesta local e a consulta sem simulação do histórico em Last Result.
3. **`design.md`**:
   - Decisões arquiteturais detalhadas:
     - Adição de `@tanstack/react-query` com `QueryClient` singleton em `src/data/queryClient.ts` e política `mutations: { retry: false }`, deixando a orquestração de retentativas a cargo exclusivo do serviço da outbox.
     - Formato do item `OutboxEntry` com tipagem estrita de status, contador de tentativas, timestamp do último disparo, payload imutável e flag de erro permanente.
     - Gravação atômica em `Last Result` e na Outbox persistida antes de qualquer requisição de rede (`POST /api/matches`).
     - Backoff exponencial limitado (1s, 2s, 4s até 3 tentativas automáticas) para erros transitórios (5xx/network/timeout) e contenção imediata (`permanentFailure: true`) para erros 400 e 409.
     - Recuperação idempotente pós-timeout sem geração de duplicatas no ranking/histórico.
     - Associação visual estrita ao `matchId` para isolar a tela de resultado ativa contra respostas lentas ou retentativas de partidas passadas.
     - Monitoramento reativo no Menu Principal com badge de pendências e botão de reenvio manual (*Retry Pending*).
     - Descarte absoluto de partidas abandonadas ou canceladas em Loading.
     - Fallback defensivo em memória em caso de indisponibilidade ou falha de cota do LocalStorage.
4. **`tasks.md`**:
   - 14 tarefas numeradas divididas em 5 grupos lógicos:
     - Grupo 1: Setup e Infraestrutura do TanStack Query (2 tarefas).
     - Grupo 2: Persistência da Outbox e Fallback Defensivo (2 tarefas).
     - Grupo 3: Serviço de Despacho, Backoff Exponencial e Idempotência (4 tarefas).
     - Grupo 4: Integração de Telas e Ciclo de Vida da Sessão (3 tarefas).
     - Grupo 5: Testes E2E, Documentação e Validação Final (3 tarefas).
   - Cada tarefa define explicitamente seus critérios e comandos de verificação.

## 3. Validação Estrita OpenSpec

Executada via PowerShell com Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change implement-result-outbox --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate implement-result-outbox --strict` | 0 | Change `implement-result-outbox` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 17 itens validados com sucesso (16 specs existentes + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `implement-result-outbox` referente ao Incremento 11 está formalmente finalizado e aprovado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e designar o executor da fase `apply` (`/root/i11_apply`) para proceder com a instalação do `@tanstack/react-query`, criação da store da outbox, serviço de mutação com backoff, atualização das telas de Result e MainMenu, e criação das suítes de testes unitários e E2E.
