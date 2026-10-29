# Explore — implement-result-outbox (Incremento 11)

Concluído em 28/10/2026 por `/root/i11_explore`, operando estritamente em modo de análise e exploração técnica. Nenhuma alteração em código de produto, `openspec/changes/` ou `project/automation-state.json` foi efetuada.

---

## 1. Contexto e Diagnóstico da Base Atual

A base de código concluiu com êxito o **Incremento 10** (`implement-mock-rest-api`), dispondo atualmente de:
- Servidor Mock REST via **Mock Service Worker (MSW v3)** operacional em desenvolvimento (`vite dev`), testes automatizados (`vitest`) e build publicado (`dist` / `vite preview`).
- Contratos REST tipados em `src/data/contracts.ts` e cliente HTTP Axios em `src/data/client.ts` com métodos `getRanking`, `getPlayerMatches` e `postMatch`.
- Store persistente compartilhado de partidas confirmadas (`pirate-battle.confirmed-matches.v1`) com semeadura de capitães determinísticos, ordenação estrita e registro idempotente de `POST /api/matches` (retorna 200/201 para payload idêntico e 409 `ConflictError` para payload divergente).
- Suíte sólida com 275 testes unitários e de integração passando em Vitest (`npm test`) e verificação estrita de tipagem TypeScript (`npm run typecheck`).

### 1.1 Lacunas Identificadas para o Incremento 11 (GDD seções 8, 9 e 12)
1. **Ausência da Biblioteca `@tanstack/react-query`**:
   - Atualmente, as chamadas HTTP em `src/data/client.ts` usam Axios diretamente.
   - O `package.json` ainda não inclui `@tanstack/react-query`, exigido pelas seções 12 e 13 do GDD para gerenciar mutações de registro e consultas paginadas.
2. **Inexistência de Outbox Persistente (`pirate-battle.outbox.v1`)**:
   - Ao término de uma partida (`App.tsx` linha 213, `onComplete`), o resultado é apenas gravado em `pirate-battle.last-result.v1` via `local.saveResult(result)`.
   - Nenhuma chamada para `postMatch` é disparada.
   - Não existe fila local confiável (Outbox pattern) para guardar partidas pendentes antes do envio à rede e garantir entrega após falhas transitórias, offline ou recargas de página.
3. **Falta dos Estados de Entrega Semânticos na UI**:
   - Na tela de `Result`, a interface exibe apenas `"Saved on this device"` ou mensagem de falha local.
   - Os estados de entrega obrigatórios do GDD — `Recording…`, `Recorded` e `Pending — Retry` — ainda não estão implementados.
4. **Ausência de Gerenciamento de Pendências no Menu Principal**:
   - Caso um envio falhe ou fique pendente, o jogador não possui mecanismo no Menu Principal para visualizar registros pendentes ou acionar retentativa independente da partida atual.
5. **Falta de Isolamento entre Sessões e Prevenção de Race Conditions**:
   - Se uma partida anterior tiver seu envio atrasado ou retentado em segundo plano, sua resposta de rede não pode, sob hipótese alguma, sobrescrever ou alterar o estado visual da tela de resultado da partida mais recente.

---

## 2. Investigação de Tecnologias e Compatibilidade

### 2.1 Avaliação do TanStack Query com React 19
- **Versão no NPM**: `@tanstack/react-query@5.105.0`
- **Peer Dependencies**: `react: "^18 || ^19"`, `@types/react: "^18 || ^19"`
- **Compatibilidade**: Verificada via `npm view @tanstack/react-query peerDependencies`. Compatibilidade nativa e total com o React 19.3.1 utilizado no projeto.
- **Configuração Recomendada**:
  - `QueryClient` singleton em `src/data/queryClient.ts`.
  - Configurações globais padrão:
    - `queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 }`
    - `mutations: { retry: false }` — o controle de retry das mutações da outbox deve ser orquestrado com precisão pela lógica da outbox para respeitar a persistência, limites de retentativa e backoff exponencial sem retries descontrolados em memória.
  - O `QueryClientProvider` deve encapsular a árvore de componentes no ponto de entrada (`main.tsx` ou topo de `App.tsx`).

---

## 3. Arquitetura da Outbox Persistente (`pirate-battle.outbox.v1`)

### 3.1 Chave e Formato dos Dados
A Outbox será armazenada no `localStorage` sob a chave:
```typescript
export const OUTBOX_STORAGE_KEY = 'pirate-battle.outbox.v1';
```

Cada entrada na outbox representa uma partida finalizada aguardando confirmação no servidor REST mock:
```typescript
export type OutboxStatus = 'pending' | 'in_flight' | 'failed';

export type OutboxErrorCategory = 'transient' | 'validation' | 'conflict';

export interface OutboxEntry {
  readonly matchId: string;
  readonly payload: CompletedMatchResult;
  readonly createdAt: string; // ISO-8601 UTC
  readonly attempts: number;
  readonly status: OutboxStatus;
  readonly lastError?: string;
  readonly errorCategory?: OutboxErrorCategory;
  readonly lastAttemptAt?: number; // epoch ms
  readonly nextRetryAt?: number;    // epoch ms (para agendamento de backoff)
}
```

### 3.2 Ciclo de Vida do Registro e Princípio da Entrega Confiável
1. **Gravação Atômica Pré-POST**:
   - Ao disparar o término da partida (`time_expired` ou `player_destroyed`):
     - `local.saveResult(result)` persiste `pirate-battle.last-result.v1`.
     - Simultaneamente, `outboxStore.enqueue(result)` insere a entrada na fila persistida `pirate-battle.outbox.v1` com `status: 'pending'`.
     - **Regra Fundamental**: A persistência local em `last-result` e `outbox` ocorre de forma síncrona/atômica **antes** de qualquer requisição HTTP ser iniciada.
2. **Abandono Não Enfileira na Outbox**:
   - Quando o jogador usa `Main Menu -> Abandon` ou atualiza a página durante `Playing` ou `Paused`, o callback de término não é invocado.
   - Nenhuma entrada é enfileirada na outbox e o `last-result.v1` anterior é preservado intacto.
3. **Remoção Apenas Após Confirmação**:
   - Uma entrada da outbox **só é removida** quando o endpoint `POST /api/matches` responder com status 200 (recuperado por idempotência) ou 201 (criado com sucesso).
   - Se a requisição for interrompida, der timeout ou retornar erro de rede/5xx, a entrada permanece na outbox para retentativa.
4. **Fallback Defensivo em Memória**:
   - Se o `localStorage` estiver indisponível, em modo restrito ou com cota excedida, a outbox passa a operar em memória RAM durante a sessão, sem lançar exceções não tratadas e garantindo que o jogo e o combate nunca travem.

---

## 4. Mecanismo de Envio, Retry, Backoff e Tolerância a Timeout

### 4.1 Mecanismo de Envio via Mutation TanStack Query
- Um hook ou serviço `useOutbox` / `OutboxService` coordena o envio usando `useMutation`:
  ```typescript
  const mutation = useMutation({
    mutationFn: async (entry: OutboxEntry) => {
      return apiClient.postMatch(entry.payload);
    },
    onSuccess: (data, entry) => {
      outboxStore.remove(entry.matchId);
      // Invalida ranking e histórico no cache do React Query
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['playerMatches'] });
    },
    onError: (error, entry) => {
      outboxStore.recordFailure(entry.matchId, error);
    }
  });
  ```

### 4.2 Classificação de Erros e Política de Retry
Conforme as seções 8 e 12 do GDD:
1. **Erros Transitórios (Rede, Timeout, HTTP 5xx)**:
   - Categoria: `transient`.
   - Política: Retentativas automáticas limitadas a **no máximo 3 tentativas**, aplicando backoff exponencial com jitter ou intervalos progressivos (ex: 1s, 2s, 4s).
   - Ao atingir o limite ou durante o intervalo de espera, o status passa a `'failed'` (`Pending — Retry` na UI).
   - Ação manual de `Retry` permanece disponível para disparo imediato pelo jogador.
2. **Erros de Validação (HTTP 400 `ValidationError` / `INVALID_PAYLOAD`)**:
   - Categoria: `validation`.
   - Política: **Sem retentativas automáticas**. O payload foi considerado inválido pelas regras canônicas. Retentar infinitamente seria um desperdício de recursos.
   - Status: `'failed'`.
   - A UI exibe mensagem legível e explicativa (ex: *"Invalid match payload: duration does not match configuration"*).
3. **Conflito de Payload (HTTP 409 `ConflictError` / `MATCH_PAYLOAD_CONFLICT`)**:
   - Categoria: `conflict`.
   - Política: **Sem retentativas automáticas**. O `matchId` já se encontra registrado no backend mock com dados divergentes (ex.: score ou duração incompatível).
   - Status: `'failed'`.
   - A UI exibe aviso de conflito claro e preserva a entrada para inspeção ou descarte controlado.

### 4.3 Tolerância a Timeout Pós-Commit (Idempotência Estrita)
- **Cenário de Falha Crítica**:
  1. O cliente envia `POST /api/matches` com o `matchId` e payload da partida.
  2. O servidor mock (MSW) recebe a chamada e grava o resultado no repositório `pirate-battle.confirmed-matches.v1`.
  3. No entanto, antes que a resposta HTTP 201 chegue ao navegador, a conexão cai ou ocorre um timeout de rede.
  4. O cliente Axios intercepta a falha como erro de rede/timeout. A outbox mantém o registro com `status: 'failed'`.
- **Comportamento na Retentativa**:
  1. O cliente (via backoff automático, retry manual ou após refresh de página) reenvia `POST /api/matches` com o mesmo `matchId` e mesmo payload idêntico.
  2. No servidor mock (`src/mocks/store.ts`), a função `addMatch` localiza a partida pelo `matchId` e executa `matchesAreEqual(existing, validated)`.
  3. Como os payloads são idênticos, o servidor retorna status 200 com o registro já existente e `created: false`.
  4. O cliente recebe o 200 com sucesso, remove a entrada da outbox e confirma a entrega como `Recorded`.
  5. **Resultado**: O registro foi recuperado sem criar duplicatas no ranking nem no histórico de partidas.

---

## 5. Estados Visuais e Prevenção de Race Conditions

### 5.1 Estados de Entrega na Tela de Result
A tela de Result (`src/ui/App.tsx`) receberá a informação do status da outbox especificamente para o `matchId` da partida atual:

| Estado Visual | Condição do `matchId` | Comportamento da UI |
|---|---|---|
| **Recording…** | `status === 'in_flight'` | Exibe indicador de gravação em andamento com texto semântico (`role="status"`). Ações de navegação permanecem ativas. |
| **Recorded** | Entrada não existe na outbox (já confirmada) ou `status === 'recorded'` | Confirmação explícita de entrega do registro. |
| **Pending — Retry** | Entrada na outbox com `status === 'failed'` ou `status === 'pending'` após falha transitória | Exibe texto `Pending — Retry` acompanhado de botão de ação para retentar o envio imediatamente. |
| **Erro Explicativo** | Erro 400 ou 409 | Exibe texto legível detalhando o motivo da rejeição sem botão de retry cego. |

### 5.2 Prevenção de Race Conditions entre Partidas
- **Problema Potencial**: Um jogador conclui a Partida A (que falha e fica pendente na outbox). O jogador clica em `Play Again`, inicia a Partida B e a conclui. Se uma retentativa em background da Partida A terminar enquanto a tela de resultado da Partida B está aberta, ela não pode influenciar o componente visual da Partida B.
- **Solução Arquitetural**:
  - A tela `Result` aceita explicitamente o `matchId` da partida exibida: `<Result outcome={outcome} matchId={outcome.result.matchId} />`.
  - O hook de status consome a outbox filtrando estritamente por esse ID: `useMatchOutboxStatus(outcome.result.matchId)`.
  - Respostas ou eventos associados a outros `matchId`s são ignorados pela visualização ativa.

### 5.3 Painel de Pendências no Menu Principal
- O GDD exige: *"A pending notice remains reachable from the menu after the player starts another match. Pending records from earlier matches remain independent."*
- No Menu Principal (`main.menu-screen`):
  - Quando a outbox contiver 1 ou mais itens:
    - Exibir indicador visual: *"1 pending match record"* (ou N).
    - Botão *"Retry Pending"* para disparar o reenvio das partidas enfileiradas.
  - Ao clicar em *"Last Result"*:
    - Abre a visualização do último resultado concluído.
    - Se o último resultado ainda estiver na outbox, a tela de resultado exibirá seu status real (`Pending — Retry` com botão para reenviar). Se já foi confirmado, exibirá `Recorded`.

---

## 6. Mapeamento de Especificações (OpenSpec)

Para o Incremento 11:
1. **Nova Spec**:
   - `openspec/specs/result-outbox/spec.md`:
     - Requisitos de enfileiramento atômico local pré-POST.
     - Remoção exclusiva pós-confirmação (200/201).
     - Idempotência e recuperação de timeout pós-commit.
     - Backoff limitado para erros transitórios e bloqueio de retries em erros de validação (400) e conflito (409).
     - Estados visuais `Recording…`, `Recorded` e `Pending — Retry`.
     - Isolamento entre partidas e desacoplamento do abandono.
     - Painel de pendências e reenvio no Menu Principal.
2. **Delta Specs**:
   - Atualização em `openspec/specs/match-lifecycle/spec.md`:
     - Alinhar o requisito "Resultado local legível e recuperável" para conectar o término da partida com a Outbox confiável e os novos estados visuais de entrega remota.

---

## 7. Plano de Implementação e Verificação Proposto para a Fase Propose

### 7.1 Dependências e Setup
- Instalar `@tanstack/react-query` compatível com React 19.
- Criar `src/data/queryClient.ts` com instância configurada e exportada.
- Adicionar `QueryClientProvider` na raiz da aplicação.

### 7.2 Camada de Dados e Armazenamento da Outbox
- Atualizar `src/storage/local.ts` para registrar `LOCAL_KEYS.outbox = 'pirate-battle.outbox.v1'`.
- Criar `src/data/outboxStore.ts`:
  - Métodos: `getEntries()`, `getEntry(matchId)`, `enqueue(result)`, `remove(matchId)`, `recordAttempt(matchId)`, `recordFailure(matchId, error)`, `clear()`.
  - Fallback resiliente em memória se `localStorage` falhar.

### 7.3 Camada de Serviço e Mutação TanStack Query
- Criar `src/data/outboxService.ts` / hooks React:
  - Disparo de `postMatch` via mutation TanStack Query.
  - Backoff automático limitado (3 tentativas) para erros transitórios.
  - Tratamento sem repetição de `ValidationError` (400) e `ConflictError` (409).
  - Limpeza da outbox e invalidação de queries do TanStack Query (`ranking`, `playerMatches`) em caso de sucesso.

### 7.4 Integração na Interface de Usuário
- Modificar `App.tsx`:
  - Em `onComplete`: enfileirar na outbox antes de chamar a mutação de envio.
  - Garantir que `Abandon` não adicione nada à outbox.
  - Na tela `Result`: exibir `Recording…`, `Recorded`, `Pending — Retry` com botão de retry manual.
  - No `Menu`: exibir contador de pendências e botão de retry para sincronização.

### 7.5 Verificação e Testes Automatizados
- **Testes Unitários (`tests/outbox.test.ts`)**:
  - Enfileiramento antes do POST e preservação no LocalStorage.
  - Remoção após 200/201.
  - Tolerância a timeout pós-commit (POST idempotente recebendo 200 e limpando outbox sem duplicatas).
  - Retentativas com backoff para 5xx/network.
  - Parada de retentativas para 400 e 409 com erro registrado.
  - Isolamento de múltiplas partidas na outbox.
  - Abandono de partida nunca enfileira na outbox.
  - Fallback gracioso quando o LocalStorage está restrito ou indisponível.
- **Testes de UI / Componentes (`tests/outboxUi.test.ts`)**:
  - Exibição de `Recording…` durante envio em trânsito.
  - Transição para `Recorded` após sucesso.
  - Exibição de `Pending — Retry` e botão de Retry após falha.
  - Não interferência de respostas de partidas anteriores na partida ativa.
- **Testes E2E com Playwright (`tests/e2e/outbox.spec.ts`)**:
  - Ciclo completo de partida com mock de rede offline -> exibe `Pending — Retry` -> restaura rede -> clica em Retry -> transiciona para `Recorded`.
  - Menu principal exibindo pendência e permitindo sincronização.
