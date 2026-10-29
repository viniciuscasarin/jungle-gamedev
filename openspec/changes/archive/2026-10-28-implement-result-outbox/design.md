# Design

## Context

A base de código dispõe de simulação de combate autoral em TypeScript, interface em React 19, ciclo de vida de partida completo (`match-lifecycle`) e infraestrutura de Mock REST API com MSW v3 e Axios (`mock-rest-api`). Os contratos REST tipados e a chave de partidas confirmadas `pirate-battle.confirmed-matches.v1` foram implementados no Incremento 10 com ordenação determinística e suporte a idempotência. No entanto, o envio de resultados via rede após o término do combate ainda não está conectado, e a fila de saída (Outbox pattern) para entrega resiliente descrita nas seções 8, 9 e 12 do GDD ainda não existe. Para mais detalhes sobre a motivação, consulte `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Implementar o padrão Outbox no cliente com persistência confiável em LocalStorage sob a chave `pirate-battle.outbox.v1`.
- Garantir que todo resultado de partida concluída seja salvo localmente em `Last Result` e na `Outbox` **antes** de qualquer disparo de requisição de rede (`POST /api/matches`).
- Integrar a biblioteca `@tanstack/react-query` para orquestrar a mutação de entrega de resultados com Axios.
- Garantir que itens da outbox sejam removidos **exclusivamente** após resposta de confirmação bem-sucedida (HTTP 200 ou 201).
- Preservar incondicionalmente o `matchId` e o payload original em retentativas, recarregamentos de página (refresh) e partidas subsequentes.
- Implementar política de retentativa com backoff exponencial limitado (ex.: 1s, 2s, 4s até 3 tentativas automáticas) para falhas transitórias (erros de rede, timeouts, HTTP 5xx).
- Evitar loops infinitos de retentativa em erros de validação (HTTP 400) ou conflito de payload (HTTP 409), registrando e exibindo mensagem explicativa.
- Recuperar com segurança timeouts pós-commit: o retry envia o payload idêntico e o servidor responde 200/201 reconhecendo o registro sem duplicar entradas.
- Exibir os estados semânticos de entrega exigidos pelo GDD na tela de Result: `Recording…`, `Recorded` e `Pending — Retry`.
- Disponibilizar indicador e ação de reenvio de pendências no Menu Principal, acessível mesmo após o jogador iniciar novas partidas.
- Assegurar isolamento visual estrito entre partidas: respostas ou eventos de partidas anteriores não podem alterar o estado visual da partida em andamento.
- Excluir partidas abandonadas da Outbox: abandonar partida ou sair durante o carregamento não gera registro local nem pendência de rede.
- Prover fallback resiliente em memória caso o LocalStorage esteja corrompido ou indisponível, impedindo que falhas de armazenamento travem o jogo.

**Non-Goals:**
- Sincronização em nuvem entre múltiplos dispositivos ou backend multiplayer compartilhado (o escopo do jogo é explicitamente local por navegador).
- Construção das abas interativas de Ranking e Histórico de Partidas com paginação completa (escopo do Incremento 12).
- Autenticação remota com credenciais ou contas de usuário (identidade persistida localmente gerada no primeiro acesso).

## Decisions

### 1. Integração do TanStack Query (`@tanstack/react-query`)
- **Decisão**: Adicionar `@tanstack/react-query` v5 como dependência de produto, configurando um `QueryClient` singleton em `src/data/queryClient.ts` e provendo-o na raiz via `QueryClientProvider`.
- **Configuração de Mutações**: Configurar `mutations: { retry: false }` no cliente global. As regras de retentativa com backoff exponencial da Outbox serão orquestradas deterministicamente pelo serviço da outbox (`outboxService`), evitando que o TanStack Query realize repetições cegas em memória que desconsiderem a persistência e o estado do disco.
- **Alternativas consideradas**: Usar apenas `fetch`/`axios` com `setInterval`: descartado porque o GDD (seções 12 e 13) exige explicitamente TanStack Query para gerenciar estado remoto, mutações e posterior invalidação de coleções de dados (`ranking` e `playerMatches`).

### 2. Modelo de Dados e Ciclo de Vida da Outbox (`pirate-battle.outbox.v1`)
- **Decisão**: A Outbox será um array serializado em JSON sob a chave `LOCAL_KEYS.outbox = 'pirate-battle.outbox.v1'`, estruturado como:
  ```typescript
  export type OutboxStatus = 'pending' | 'recording' | 'recorded' | 'failed';

  export interface OutboxEntry {
    matchId: string;
    result: CompletedMatchResult;
    status: OutboxStatus;
    attempts: number;
    lastAttemptAt: string | null;
    error: string | null;
    permanentFailure: boolean; // true para 400 ou 409
    createdAt: string;
  }
  ```
- **Sequência de Registro Atômica**:
  1. Partida atinge condição de término único (`player_destroyed` ou `time_expired`).
  2. `local.saveResult(result)` grava em `pirate-battle.last-result.v1`.
  3. `outboxStore.enqueue(result)` grava a entrada na outbox persistida.
  4. Dispara mutação `useSubmitMatchResult` com TanStack Query.
  5. Se o envio suceder (200/201), `outboxStore.remove(result.matchId)` remove o item da outbox e invalida as queries de ranking e histórico.
- **Alternativas consideradas**: Enviar primeiro via rede e só salvar na outbox se falhar: descartado porque fecha de aba ou crash durante o voo da requisição causaria perda irreversível do resultado. O padrão Outbox exige persistir *antes* de tentar a entrega.

### 3. Política de Retentativas e Tratamento de Erros
- **Decisão**:
  - **Erros Transitórios** (quedas de conexão, timeout, HTTP 500, 502, 503): O serviço aplica backoff exponencial limitado (1s, 2s, 4s, até um teto de 3 tentativas automáticas consecutivas). Se o limite for atingido, o status da entrada passa a `failed` (exibido como `Pending — Retry`), aguardando clique manual de Retry pelo usuário ou sincronização pelo menu.
  - **Erros de Validação (HTTP 400)**: Não sofrem retentativa automática (`permanentFailure: true`). O erro descritivo retornado pelo servidor é exibido na UI, mantendo o resultado acessível sem entrar em loop infinito.
  - **Conflito de Payload (HTTP 409)**: Ocorre se o mesmo `matchId` tentar registrar um payload divergente do já confirmado no servidor. Trata-se como erro permanente (`permanentFailure: true`), exibindo explicação clara de conflito na UI.
- **Alternativas consideradas**: Retentativa contínua indefinida com `setInterval`: descartado por risco de esgotamento de bateria, consumo excessivo de rede e frustração do usuário.

### 4. Recuperação Idempotente de Timeout Pós-Commit
- **Decisão**: No cenário em que a requisição de registro é processada e persistida pelo MSW no store confirmado, mas a resposta de rede sofre timeout antes de chegar ao cliente, o item permanece na outbox com status `pending`/`failed`. Na próxima retentativa (automática ou manual), o cliente envia exatamente o mesmo `matchId` e payload. O mock REST API reconhece a idempotência e responde HTTP 200 com o registro confirmado existente. A outbox detecta o sucesso e remove o item com segurança, evitando duplicações no histórico e ranking.

### 5. Estados Visuais de Entrega e Prevenção de Race Conditions
- **Decisão**:
  - A tela `Result` aceita o `matchId` da partida recém-concluída e consome o hook `useMatchOutboxStatus(matchId)`.
  - Mapeamento visual estrito:
    - `recording` -> **`Recording…`**
    - `recorded` -> **`Recorded`**
    - `pending` ou `failed` -> **`Pending — Retry`** (acompanhado de botão `Retry` para reenvio manual).
  - **Isolamento de Sessão**: O hook ignora respostas e eventos de outros `matchId`. Se uma partida anterior finalizar seu envio tardio enquanto a tela de resultado exibe uma partida recente, a tela recente permanece intocada.

### 6. Monitor de Pendências no Menu Principal
- **Decisão**: No `MainMenu`, um componente de status reativo inspeciona a Outbox:
  - Se houver 1 ou mais entradas na Outbox, exibe aviso semântico (ex.: *"1 pending match record"* ou *"N pending match records"*) acompanhado de um botão *"Retry Pending"*.
  - O acionamento de *"Retry Pending"* dispara o processamento em série ou paralelo de todas as entradas pendentes elegíveis.
  - Ao clicar em *"Last Result"*, o resultado do último jogo concluído é aberto e seu estado de envio reflete com precisão se já foi confirmado (`Recorded`) ou se ainda aguarda entrega (`Pending — Retry`).

### 7. Isolamento de Abandono de Partida
- **Decisão**: Quando o jogador aciona `Abandon` ou sai durante o estado de `Loading`, a sessão é descartada sem invocar `local.saveResult` nem `outboxStore.enqueue`. Partidas abandonadas jamais ingressam na Outbox e não geram requisição de registro.

## Risks / Trade-offs

- **[Risco: LocalStorage indisponível, bloqueado por privacidade ou cota excedida]**
  - *Mitigação*: `outboxStore` encapsula acessos em blocos defensivos com fallback automático para array em memória. A aplicação exibe notificação amigável e não interrompe a sessão de jogo.
- **[Risco: Múltiplas requisições simultâneas para o mesmo `matchId`]**
  - *Mitigação*: A entrada na outbox assume status `recording` enquanto a mutação está em trânsito; novas tentativas para o mesmo ID são desabilitadas até que a mutação atual retorne sucesso ou falha.
- **[Risco: Perda de dados se o jogador recarregar a página durante a tela de resultado]**
  - *Mitigação*: Como a persistência na outbox e em `Last Result` ocorre antes do disparo de rede, ao recarregar a página e abrir o Menu ou o Last Result, a outbox detecta a pendência e restaura o botão de retry.
- **[Risco: Conflito de renderização do React 19 com TanStack Query v5]**
  - *Mitigação*: O TanStack Query v5 suporta nativamente o React 19 (`npm view @tanstack/react-query peerDependencies`). Os hooks serão isolados em componentes React sem efeitos colaterais na simulação do PixiJS.
