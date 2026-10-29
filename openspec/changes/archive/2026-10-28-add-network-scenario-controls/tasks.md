# Tasks

## 1. Orquestrador de Cenários de Rede

- [x] 1.1 Criar tipos, catálogo dos 12 cenários e orquestrador de resolução em cascata (URL > LocalStorage > Window > Default) com listeners de evento em `src/mocks/scenarios.ts`, verificando ausência de erros de compilação via `npm run build`.
- [x] 1.2 Implementar a função `resetMockData()` com restauração canônica de fixtures e preservação incondicional de opções, identidade, outbox e áudio, verificando o isolamento de chaves via novos testes unitários em `tests/scenarios.test.ts`.

## 2. Integração Declarativa aos Handlers do MSW

- [x] 2.1 Integrar os cenários `default`, `empty`, `multi-page`, `slow-jitter`, `out-of-order`, `timeout` e `offline` nos handlers de GET `/api/ranking` e GET `/api/players/:playerId/matches`, verificando respostas e latências via testes em `tests/scenarios.test.ts`.
- [x] 2.2 Integrar os cenários `error-4xx`, `error-5xx`, `isolated-tab-failure`, `commit-timeout` e `temporary-outage` aos endpoints de GET e POST `/api/matches`, verificando idempotência em commit-timeout e auto-recuperação via testes em `tests/scenarios.test.ts`.
- [x] 2.3 Substituir parâmetros ad-hoc em `src/data/client.ts` e alinhar `src/mocks/store.ts` com o orquestrador central, verificando que `tests/api.test.ts` e `tests/outbox.test.ts` continuam passando sem regressões com `npm test`.

## 3. Painel Visual de Diagnóstico e Controles na UI

- [x] 3.1 Construir o componente expansível de diagnóstico com `<details>`, `<select>` com os 12 cenários, descrição contextual e botão de reset em `src/ui/screens/MainMenu.tsx`, verificando montagem e disparo de eventos via testes em `tests/mainMenu.test.tsx`.
- [x] 3.2 Implementar feedback com `role="status"` e `aria-live="polite"`, botão condicional "Restore Default Scenario" e estilos responsivos com alvo mínimo de 44px e contenção em 320px em `src/ui/screens/MainMenu.css`, verificando acessibilidade sem erros no console.

## 4. Testes de Integração e Desacoplamento da Arena

- [x] 4.1 Criar testes de desacoplamento demonstrando que alterações de cenário e disparos de reset de fixtures não afetam o estado, score ou timers de uma partida ativa em andamento, verificando aprovação em `tests/scenarios.test.ts`.
- [x] 4.2 Executar a suíte completa de validação com `npm test` e `npm run build`, confirmando que todos os 12 cenários e fluxos da aplicação operam com estabilidade e cobertura.

## Workflow follow-up

- Revisar a proposta e especificações criadas antes de iniciar a implementação.
- Executar o workflow de aplicação (`openspec apply`) para implementar o código de produto e testes.
