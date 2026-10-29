# Proposal

## Why

Embora o Mock REST API (MSW) e os contratos de dados tenham sido estabelecidos no incremento 10, o jogo ainda não envia resultados para o servidor nem garante resiliência contra falhas de rede, recarregamentos de página (refresh) ou oscilações de conectividade (GDD seções 8, 9 e 12). Atualmente, ao término de uma partida o resultado é apenas gravado na chave efêmera `pirate-battle.last-result.v1` sem acionar mutação de rede nem persistir uma fila de saída (Outbox). O incremento 11 implementa o padrão Outbox confiável persistido no LocalStorage (`pirate-battle.outbox.v1`), mutações via TanStack Query com cliente Axios, estados semânticos de entrega na interface (`Recording…`, `Recorded`, `Pending — Retry`), backoff exponencial limitado, isolamento estrito contra abandonos e prevenção de race conditions entre partidas.

## What Changes

- **Integração de TanStack Query**:
  - Instalação e configuração de `@tanstack/react-query` compatível com React 19.
  - Criação do `QueryClient` singleton em `src/data/queryClient.ts` com políticas explícitas de mutação (retry manual orquestrado pela outbox) e encapsulamento no topo da aplicação com `QueryClientProvider`.
- **Fila de Saída Persistente (Outbox Pattern)**:
  - Criação da chave `pirate-battle.outbox.v1` e do módulo `src/data/outboxStore.ts` para persistência atômica pré-POST do resultado completo validado.
  - Gravação garantida do resultado tanto em `Last Result` quanto na Outbox antes de qualquer disparo de rede.
  - Remoção de itens da Outbox exclusivamente após confirmação bem-sucedida do servidor (HTTP 200/201).
  - Fallback gracioso em memória caso o LocalStorage esteja corrompido, cheio ou inacessível, assegurando que o combate e a interface nunca travem.
- **Ciclo de Entrega e Retentativas Confiáveis**:
  - Implementação de `outboxService` / hooks React para despacho de partidas pendentes via `POST /api/matches` usando a mutação do TanStack Query.
  - Preservação incondicional do `matchId` e do payload canônico original através de recarregamentos de página, timeouts e novas partidas.
  - Política de retentativa com backoff exponencial limitado (ex.: 1s, 2s, 4s até limite de 3 tentativas) para erros transitórios (5xx, Network Error, timeout).
  - Bloqueio imediato de loops infinitos de retentativa para erros de validação (HTTP 400) ou conflito de payload (HTTP 409), registrando e expondo mensagem clara de erro.
  - Recuperação idempotente em caso de timeout pós-commit (o servidor confirma o registro existente sem criar duplicatas).
- **Interface e Estados Semânticos de Entrega**:
  - Exibição em tempo real na tela `Result` dos estados semânticos exigidos pelo GDD: `Recording…`, `Recorded` e `Pending — Retry`.
  - Botão de reenvio manual (*Retry*) na tela `Result` quando em estado `Pending — Retry`.
  - Indicador de registros pendentes no Menu Principal com ação dedicada de sincronização/reenvio (*Retry Pending*), mantendo pendências acessíveis mesmo após o início de novas partidas.
  - Isolamento estrito de eventos e estados visuais: respostas lentas de partidas antigas não podem alterar o estado visual da tela de resultado da partida mais recente.
  - Exclusão absoluta de partidas abandonadas: partidas encerradas via Abandon ou canceladas no Loading jamais entram na Outbox.

## Capabilities

### New Capabilities

- `result-outbox`: Fila persistente local de resultados de partidas (`pirate-battle.outbox.v1`) com garantia de entrega pré-POST, mutação TanStack Query via Axios, retentativa com backoff exponencial limitado, tratamento idempotente pós-timeout e monitor de pendências no Menu Principal.

### Modified Capabilities

- `match-lifecycle`: Integração da conclusão da partida com gravação atômica pré-POST na Outbox, exclusão incondicional de partidas abandonadas e exibição semântica dos estados de entrega remota (`Recording…`, `Recorded`, `Pending — Retry`) na tela de resultado.

## Impact

- **Dependências**: Adição de `@tanstack/react-query` em `dependencies` no `package.json`.
- **Armazenamento Local**: Registro de `LOCAL_KEYS.outbox = 'pirate-battle.outbox.v1'` em `src/storage/local.ts`.
- **Arquitetura de Dados**:
  - Criação de `src/data/queryClient.ts` e `src/data/outboxStore.ts`.
  - Criação de hook de orquestração `src/data/useMatchOutbox.ts` (ou `outboxService.ts`).
- **Interface do Usuário**:
  - Modificação de `src/ui/screens/Result.tsx` para apresentar os estados `Recording…`, `Recorded` e `Pending — Retry` com ação de Retry manual e filtragem por `matchId`.
  - Modificação de `src/ui/screens/MainMenu.tsx` para exibir aviso de registros pendentes e botão de sincronização.
  - Ajustes em `src/App.tsx` para orquestrar o término de partida com salvamento na outbox e wrapping em `QueryClientProvider`.
- **Testes**: Criação de `tests/outbox.test.ts` (unitários da outbox e orquestração de rede) e `tests/outboxUi.test.ts` (estados de entrega e isolamento de UI).
