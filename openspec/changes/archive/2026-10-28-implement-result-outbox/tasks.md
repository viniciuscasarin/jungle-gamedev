# Tasks

## 1. Setup e Infraestrutura do TanStack Query

- [x] 1.1 Adicionar dependência `@tanstack/react-query` ao `package.json` e verificar instalação e compatibilidade com React 19 via `npm install` e `npm run typecheck`
- [x] 1.2 Implementar singleton `QueryClient` em `src/data/queryClient.ts` com configuração `mutations: { retry: false }` e encapsular a aplicação com `QueryClientProvider` em `src/main.tsx`, verificando inicialização contínua sem quebras na montagem

## 2. Persistência da Outbox e Fallback Defensivo

- [x] 2.1 Registrar chave `LOCAL_KEYS.outbox = 'pirate-battle.outbox.v1'` em `src/storage/local.ts` e definir os tipos `OutboxStatus` e `OutboxEntry` em `src/data/contracts.ts`, verificando tipagem estrita com `npm run typecheck`
- [x] 2.2 Implementar repositório `src/data/outboxStore.ts` com métodos `getEntries`, `getEntry`, `enqueue`, `remove`, `updateEntry` e fallback defensivo em memória caso o LocalStorage esteja corrompido ou indisponível, verificando operações de armazenamento com testes unitários em `tests/outbox.test.ts`

## 3. Serviço de Despacho, Backoff Exponencial e Idempotência

- [x] 3.1 Implementar camada de serviço e mutação (`src/data/outboxService.ts` / `src/data/useMatchOutbox.ts`) conectando o despacho de partidas pendentes a `postMatch` via TanStack Query e Axios, verificando que itens só são removidos após HTTP 200/201 em `tests/outbox.test.ts`
- [x] 3.2 Implementar mecanismo de retentativas com backoff exponencial limitado (1s, 2s, 4s até 3 tentativas) para falhas transitórias (5xx, timeouts e erros de conexão), verificando agendamento e transição para `failed` em `tests/outbox.test.ts`
- [x] 3.3 Implementar contenção de erros permanentes para HTTP 400 (validação) e HTTP 409 (conflito de payload), interrompendo retentativas automáticas e gravando mensagem legível de erro sem loops infinitos, verificando comportamento em `tests/outbox.test.ts`
- [x] 3.4 Validar recuperação idempotente de timeout pós-commit (simulação de timeout de rede após persistência no mock store retornando 200 na retentativa e removendo da outbox sem duplicatas), verificando aprovação em `tests/outbox.test.ts`

## 4. Integração de Telas e Ciclo de Vida da Sessão

- [x] 4.1 Integrar finalização de partida em `src/App.tsx` para gravar atomicamente em `Last Result` e na Outbox antes de qualquer requisição de rede, e garantir que cancelamentos em `Loading` ou ações em `Abandon this match?` não enfileirem na outbox, verificando integridade em `tests/outboxUi.test.ts`
- [x] 4.2 Atualizar o componente `Result.tsx` para exibir os estados semânticos `Recording…`, `Recorded` e `Pending — Retry` com botão de `Retry` manual e filtragem estrita pelo `matchId` da partida exibida para isolar respostas de partidas anteriores, verificando renderização em `tests/outboxUi.test.ts`
- [x] 4.3 Atualizar o `MainMenu.tsx` para inspecionar a outbox e exibir aviso semântico de registros pendentes com botão de ação `Retry Pending`, verificando sincronização de pendências em `tests/outboxUi.test.ts`

## 5. Testes E2E, Documentação e Validação Final

- [x] 5.1 Implementar testes de ponta a ponta com Playwright em `tests/e2e/outbox.spec.ts` cobrindo o fluxo completo offline: término de combate sem rede -> exibição de `Pending — Retry` -> restauração da rede -> clique em Retry -> transição para `Recorded` e sincronização via menu
- [x] 5.2 Atualizar `ARCHITECTURE.md` documentando o padrão Outbox cliente, diagrama de estados de entrega remota, garantias de idempotência e fallback de persistência
- [x] 5.3 Executar validação estrita da suíte completa de testes (`npm test`, `npm run typecheck`, `npm run build`), verificando aprovação de 100% dos testes e ausência de regressões
