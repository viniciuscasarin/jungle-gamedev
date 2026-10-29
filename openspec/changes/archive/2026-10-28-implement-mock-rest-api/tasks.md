# Tasks

## 1. Setup e Infraestrutura de Mocks

- [x] 1.1 Adicionar dependências `axios` (dependencies) e `msw` (devDependencies) ao `package.json` e verificar instalação bem-sucedida via `npm install`
- [x] 1.2 Gerar script de worker `public/mockServiceWorker.js` e verificar presença e integridade do arquivo estático para desenvolvimento e preview
- [x] 1.3 Implementar inicializador resiliente `src/mocks/init.ts` com timeout defensivo e integrar chamada assíncrona ao `src/main.tsx`, verificando inicialização contínua sem bloqueio de renderização

## 2. Contratos REST e Cliente HTTP

- [x] 2.1 Definir interfaces e tipos canônicos em `src/data/contracts.ts` para paginação (`PaginatedResponse<T>`), requisição/resposta de ranking, histórico de partidas e erro tipado de conflito, verificando compilação do TypeScript (`npm run build -- --noEmit` ou `npx tsc --noEmit`)
- [x] 2.2 Implementar cliente HTTP Axios em `src/data/client.ts` encapsulando as chamadas para `GET /api/ranking`, `GET /api/players/:playerId/matches` e `POST /api/matches`, verificando tipagem estrita e tratamento de erros de rede

## 3. Repositório Persistido e Fixtures Determinísticas

- [x] 3.1 Criar fixtures determinísticas de capitães em `src/mocks/fixtures.ts` com partidas variadas na configuração padrão, verificando integridade dos dados e ausência de campos undefined
- [x] 3.2 Implementar store de partidas confirmadas em `src/mocks/store.ts` gerenciando a chave `pirate-battle.confirmed-matches.v1`, semeadura única de fixtures e fallback seguro em memória, verificando isolamento estrito contra a chave `pirate-battle.last-result.v1`
- [x] 3.3 Implementar ordenação determinística triplamente chaveada no store (`score` DESC, `completedAt` ASC, `matchId` ASC) e paginação com `page` e `pageSize`, verificando critérios de desempate e limites de fatiamento
- [x] 3.4 Implementar validação de idempotência em `src/mocks/store.ts` para retorno do registro canônico em retentativas idênticas e emissão de conflito tipado (409) para cargas divergentes com mesmo `matchId`, verificando integridade dos dados

## 4. Handlers REST do MSW e Suporte a Múltiplos Ambientes

- [x] 4.1 Implementar handlers REST em `src/mocks/handlers.ts` consumindo o store compartilhado para responder às rotas de ranking, histórico por jogador e registro de partidas, verificando respostas HTTP corretas (200, 201, 400, 409)
- [x] 4.2 Configurar integração do MSW para o navegador em `src/mocks/browser.ts` (`setupWorker`) e para o Node em `src/mocks/server.ts` (`setupServer`), verificando inicialização e interceptação de requisições em ambos os contextos

## 5. Testes Automatizados e Documentação

- [x] 5.1 Implementar testes unitários e de integração em `tests/mockApi.test.ts` validando paginação, filtros por `configurationKey`, ordenação determinística, histórico por jogador, idempotência de POST e conflitos 409, verificando aprovação total com `npm test`
- [x] 5.2 Implementar testes de resiliência e persistência garantindo que recarregamentos preservam dados confirmados no LocalStorage e que falha simulada no Service Worker não impede o início de batalha ("falha no serviço não impede Play"), verificando aprovação na suíte de testes
- [x] 5.3 Atualizar `ARCHITECTURE.md` com documentação detalhada sobre a camada REST mockada, contratos de dados, política de persistência desacoplada e isolamento de escopo local, verificando consistência arquitetural
