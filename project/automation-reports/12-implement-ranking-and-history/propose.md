# Propose — implement-ranking-and-history (Incremento 12)

Concluído em 28/10/2026 por `/root/i12_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seções 9 (Screens and information hierarchy: abas de Ranking e Histórico, 10 itens por página, mensagens vazias literais, retry em falha, filtro visível de configuração), 10 (Responsive layout and accessibility: semântica WAI-ARIA, teclado, viewport 320px) e 12 (Ranking, identity, and recording rules: chaves de consulta, ordenação determinística, formatação de locale, duração ativa em segundos, cancelamento de requisições obsoletas).
  - `project/automation-reports/12-implement-ranking-and-history/explore.md`: Diagnóstico técnico dos placeholders inativos no `MainMenu`, modelagem de hooks TanStack Query com query keys granulares e `placeholderData: keepPreviousData`, integração de `AbortController` com repasse de `signal` ao Axios em `src/data/client.ts`, mensagens canônicas para coleções vazias, isolamento estrito de erros por aba e alinhamento da invalidação na Outbox para cobrir `['history']`.
  - `openspec/config.yaml`: Schema `spec-driven` e conformidade com idioma pt-BR (com cabeçalhos e termos normativos SHALL/MUST em inglês).
- **Inventário de Capacidades e Specs Existentes**:
  - Avaliação das specs existentes em `openspec/specs/`, em especial `menu-options` (reserva de espaço do menu local), `mock-rest-api` (endpoints `/api/ranking` e `/api/players/:playerId/matches`) e `result-outbox` (invalidação reativa pós-confirmação de partidas).

## 2. Artefatos Criados

A change `implement-ranking-and-history` foi criada em `openspec/changes/implement-ranking-and-history/` sob o schema `spec-driven`, contemplando todos os artefatos de planejamento exigidos:

1. **`proposal.md`**:
   - Motivação centrada na ativação das abas de Ranking e Histórico no Menu Principal, transformando os botões desabilitados em telas acessíveis, funcionais, reativas e com isolamento de falha.
   - Escopo completo de alterações: navegação WAI-ARIA com suporte a teclado, hooks de consulta no TanStack Query com paginação suave via `placeholderData: keepPreviousData`, cancelamento de rede via `AbortSignal` no cliente Axios, cabeçalho de Ranking com indicação explícita dos parâmetros de configuração ativos, mensagens literais do GDD para coleções vazias (`"No matches for these settings yet."` e `"No completed matches yet."`), estados de erro isolados por aba com botão "Retry", e alinhamento da invalidação do `outboxService` para o prefixo `['history']`.
   - Declaração explícita de capabilities: criação da nova capability `ranking-and-history` e delta na capability existente `menu-options`.

2. **Delta Specs em `specs/`**:
   - `specs/ranking-and-history/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 5 requisitos canônicos normativos com descrições concisas (<= 500 caracteres) e cenários `WHEN/THEN/AND` com 4 hashtags (`####`):
     - `Requirement: Navegação acessível por abas no Menu Principal`: estrutura semântica WAI-ARIA (`tablist`, `tab`, `tabpanel`), navegação horizontal por teclado e desacoplamento das ações principais ("Play", "Options", "Last Result").
     - `Requirement: Consulta paginada e apresentação de Ranking com filtro explícito`: query key granular `['ranking', configurationKey, page, pageSize]`, 10 itens por página, `keepPreviousData`, exibição de posição, capitão e pontuação, além de exibição explícita dos parâmetros de configuração ativos no cabeçalho.
     - `Requirement: Consulta paginada e formatação do Histórico de Partidas`: query key `['history', playerId, page, pageSize]` filtrada pelo `playerId` local, ordenação cronológica decrescente, data formatada no locale do usuário, duração ativa em segundos e motivos legíveis de encerramento (`Time expired` e `Ship destroyed`).
     - `Requirement: Resiliência visual, cancelamento de requisições e mensagens do GDD`: cancelamento de requisições em voo com `AbortSignal`, mensagens literais canônicas para coleções vazias e tratamento de erro isolado por aba com botão "Retry".
     - `Requirement: Sincronização reativa de cache pós-confirmação da Outbox`: invalidação automática dos prefixos `['ranking']` e `['history']` após confirmação HTTP 200/201 de partida entregue pela Outbox, com atualização em segundo plano na aba ativa.
   - `specs/menu-options/spec.md`: Delta da capability existente sob `## MODIFIED Requirements`:
     - `Requirement: Menu local com ações honestas`: substituição das reservas indisponíveis de Ranking e Histórico por abas ativas, acessíveis e integradas a dados reais, preservando a disponibilidade incondicional e local de "Play" e "Options".

3. **`design.md`**:
   - Decisões técnicas e arquiteturais detalhadas:
     - Padrão WAI-ARIA completo para alternância e acessibilidade das abas, com foco controlado por teclado (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
     - Query keys compostas e granulares para isolamento rígido de cache por configuração de partida e por jogador local.
     - Paginação sem oscilação de layout (evitando flicker e layout shift) com `placeholderData: keepPreviousData` do TanStack Query v5.
     - Repasse do `signal` de `queryFn` para os métodos `getRanking` e `getPlayerMatches` do cliente Axios em `src/data/client.ts`, cancelando requisições obsoletas no nível de socket HTTP.
     - Formatação semântica e honesta de dados: resumo do filtro no cabeçalho do Ranking, data/hora local, duração em segundos e motivos legíveis no Histórico.
     - Mensagens literais do GDD para coleções vazias.
     - Isolamento estrito de falhas por aba com botão "Retry", sem travar a navegação nem bloquear a jogabilidade local.
     - Invalidação por prefixo em `outboxService.ts` cobrindo `['ranking']` e `['history']`.
     - Análise de riscos e mitigações (respostas fora de ordem, percepção de dados perdidos ao mudar configuração, responsividade em viewports de 320 CSS pixels, isolamento do fluxo de combate).

4. **`tasks.md`**:
   - 11 tarefas rastreáveis distribuídas em 4 grupos lógicos estruturados:
     - Grupo 1: Infraestrutura de Dados, AbortSignal e Invalidação da Outbox (3 tarefas).
     - Grupo 2: Componentes de UI de Abas, Tabelas e Paginação (3 tarefas).
     - Grupo 3: Integração no Menu Principal e Resiliência Visual (3 tarefas).
     - Grupo 4: Testes Automatizados de Integração e Validação do Fluxo (2 tarefas).
   - Cada tarefa define explicitamente seus critérios e comandos de verificação (`npm test`, verificação visual ou testes de componente/integração).

## 3. Validação Estrita OpenSpec

Validações executadas via shell PowerShell com Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change implement-ranking-and-history --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate implement-ranking-and-history --strict` | 0 | Change `implement-ranking-and-history` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 18 itens validados com sucesso (17 specs existentes + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `implement-ranking-and-history` referente ao Incremento 12 está concluído e validado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e acionar o executor da fase `apply` (`/root/i12_apply`) para iniciar a implementação das abas, hooks TanStack Query, cancelamento via `AbortSignal`, integração ao `MainMenu` e testes automatizados.
