# Proposal

## Why

A arena de combate e o ciclo de vida de partidas foram implementados com sucesso, mas o jogo ainda não dispõe de uma camada de rede, contratos de dados ou infraestrutura de persistência para ranking comparativo e histórico de partidas (seções 12 e 13 do GDD). O incremento 10 introduz o Mock Service Worker (MSW) resiliente em desenvolvimento, preview, testes e build publicado, contratos REST tipados com Axios, fixtures determinísticas de capitães e um store persistido desacoplado no LocalStorage para partidas confirmadas com garantia de idempotência e ordenação estrita.

## What Changes

- **Infraestrutura REST com Mock Service Worker (MSW)**:
  - Instalação e configuração do MSW para interceptação transparente de chamadas `/api/*` em ambiente de navegador (via Service Worker em `vite dev`, `vite preview` e build estático) e em testes unitários/integração no Node/Vitest (via `setupServer`).
  - Criação do script de worker do MSW em `public/mockServiceWorker.js`.
  - Inicialização assíncrona tolerante a falhas (`initMocks()`) em `src/main.tsx` assegurando que atrasos ou falhas no Service Worker não bloqueiem a renderização ou a jogabilidade ("falha no serviço não impede Play").

- **Contratos REST e Cliente HTTP com Axios**:
  - Definição tipada dos contratos de endpoints:
    - `GET /api/ranking?configurationKey=...&page=1&pageSize=10`: Retorna lista paginada de partidas ranqueadas para a mesma configuração canônica.
    - `GET /api/players/:playerId/matches?page=1&pageSize=10`: Retorna histórico cronológico de partidas do jogador identificado.
    - `POST /api/matches`: Registra atomicamente uma partida confirmada com validação completa e payload imutável.
  - Implementação do cliente HTTP tipado (`src/data/client.ts` e `src/data/contracts.ts`) encapsulando chamadas com Axios, timeouts explícitos e tratamento padronizado de erros.

- **Store Persistido de Partidas Confirmadas e Desacoplamento**:
  - Implementação de repositório em `src/mocks/store.ts` gerenciando a coleção de partidas confirmadas sob a chave `pirate-battle.confirmed-matches.v1`.
  - Isolamento estrito entre o store de partidas confirmadas e o estado efêmero/imediato da partida em andamento (`pirate-battle.last-result.v1`).
  - Fallback defensivo em memória caso o LocalStorage esteja desabilitado ou indisponível.

- **Identidade Local e Fixtures Determinísticas**:
  - Geração de identidade local persistente para o jogador no primeiro acesso (UUID v4 e nome legível `Captain-XXXX` derivado), sem dependência de autenticação externa.
  - Fixtures determinísticas de capitães adversários para popular o ranking e histórico sem criar duplicatas entre recarregamentos.
  - Escopo estritamente local documentado e refletido: a aplicação não simula nem anuncia backend compartilhado entre navegadores ou multiplayer online.

- **Ordenação Canônica e Idempotência Estrita**:
  - Ordenação determinística incondicional no ranking: `score` decrescente, `completedAt` crescente (quem atingiu primeiro) e desempate por `matchId` lexicográfico.
  - Agrupamento exclusivo de ranking por `configurationKey` canônica idêntica, excluindo seed, identidade do jogador, dimensões de tela e preferências de áudio/acessibilidade.
  - Idempotência estrita em `POST /api/matches`: retentativas com mesmo `matchId` e payload idêntico retornam o registro canônico existente (200/201); envios conflitantes (mesmo `matchId` com payload divergente) retornam erro tipado HTTP 409.
  - Fonte única de verdade: Ranking e Histórico leem o mesmo store consolidado, impedindo discrepâncias parciais.

## Capabilities

### New Capabilities
- `mock-rest-api`: Infraestrutura REST mockada via MSW, contratos de dados paginados para ranking e histórico, persistência local desacoplada e registro idempotente de partidas.

### Modified Capabilities
<!-- Nenhuma capability existente tem seus requisitos alterados. simulation-contracts e game-configuration já forneciam a modelagem canônica de CompletedMatchResult e configurationKey. -->

## Impact

- **Dependências**: Inclusão de `axios` em `dependencies` e `msw` em `devDependencies` em `package.json`.
- **Código Fonte**:
  - Criação de `src/data/contracts.ts` e `src/data/client.ts`.
  - Criação de `src/mocks/handlers.ts`, `src/mocks/store.ts`, `src/mocks/fixtures.ts`, `src/mocks/browser.ts`, `src/mocks/server.ts` e `src/mocks/init.ts`.
  - Criação de `public/mockServiceWorker.js`.
  - Atualização de `src/main.tsx` para orquestrar `initMocks()` antes do React DOM mount.
- **Documentação**: Atualização de `ARCHITECTURE.md` para documentar a camada de dados REST e mocks do MSW.
- **Testes**: Criação de `tests/mockApi.test.ts` cobrindo validação de contratos, ordenação do ranking, paginação, idempotência e conflitos de registro.
