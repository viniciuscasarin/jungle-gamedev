# Increment 10: Implement Mock REST API Apply Report

## Summary

O incremento 10 (`implement-mock-rest-api`) foi implementado com sucesso no workspace `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev`.
Todas as 14 tarefas planejadas em `openspec/changes/implement-mock-rest-api/tasks.md` foram concluídas e verificadas com aprovação estrita dos testes unitários, typechecking, linting, build de produção e validação do OpenSpec.

## Implementações Realizadas

1. **Instalação e Infraestrutura de Mocks**:
   - Adicionadas dependências `axios` e `msw` (v3.0.3) sem alteração de ambiente global.
   - Gerado o Service Worker canônico em `public/mockServiceWorker.js` via CLI do MSW.
   - Criado inicializador assíncrono defensivo `src/mocks/init.ts` com corrida de timeout (1500ms) e captura segura de erros. Integrado no bootstrap de `src/main.tsx` antes do render React, garantindo que falhas de Service Worker jamais bloqueiem o fluxo de jogo ("falha no serviço não impede Play").

2. **Contratos REST e Cliente HTTP**:
   - `src/data/contracts.ts` (e re-export em `src/api/contracts.ts`): definidos tipos para paginação (`PaginatedResponse<T>`), queries (`RankingQuery`, `PlayerMatchesQuery`), respostas e classes de erro semânticas (`ApiError`, `ConflictError` com HTTP 409, `ValidationError` com HTTP 400).
   - `src/data/client.ts` (e re-export em `src/api/client.ts`): cliente Axios encapsulando `getRanking`, `getPlayerMatches` e `postMatch` com fallback isomórfico para ambientes Node/Vitest e tratamento estrito de exceções.

3. **Repositório Persistido e Fixtures Determinísticas**:
   - `src/mocks/fixtures.ts`: 11 partidas determinísticas pré-computadas cobrindo múltiplos capitães históricos com pontuações, durações e timestamps pré-definidos para testes de desempate e ordenação.
   - `src/mocks/store.ts`: repositório de partidas confirmadas armazenado sob a chave `pirate-battle.confirmed-matches.v1`, estritamente desacoplado da partida ativa e da chave `pirate-battle.last-result.v1`.
   - Implementado algoritmo de ordenação triplamente chaveado:
     1. `score` DESC
     2. `completedAt` ASC (critério temporal: pontuação atingida primeiro)
     3. `matchId` ASC (desempate lexicográfico estável)
   - Implementada idempotência estrita em `addMatch`: payload idêntico com mesmo `matchId` retorna 200 OK com o registro canônico; payload divergente com mesmo `matchId` lança `ConflictError` (HTTP 409).
   - Suporte a fallback seguro em memória quando o LocalStorage lança exceções de cota ou permissão.

4. **Handlers REST e Suporte Multiambiente**:
   - `src/mocks/handlers.ts`: handlers REST do MSW para rotas `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches`.
   - `src/mocks/browser.ts`: `setupWorker(...handlers)` para o navegador.
   - `src/mocks/server.ts`: `setupServer(...handlers)` para execução em testes Vitest (Node).

5. **Identidade Local**:
   - `src/api/identity.ts`: persistência da identidade do jogador sob `pirate-battle.identity.v1`, gerando UUID v4 e nome legível `Captain-XXXX`.

6. **Testes Automatizados**:
   - `tests/api.test.ts`: 14 testes cobrindo ordenação determinística com critérios de desempate, filtragem por `configurationKey`, histórico por jogador, idempotência de registro de partida, conflito 409, rejeição de payloads inválidos 400, persistência entre reloads, resiliência de LocalStorage e inicialização defensiva.

7. **Documentação e OpenSpec**:
   - Atualizados `ARCHITECTURE.md` e `README.md` com detalhes arquiteturais do incremento 10 em inglês.
   - Marcadas as tarefas como concluídas em `openspec/changes/implement-mock-rest-api/tasks.md`.

## Verificações Executadas

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Linter | `npm.cmd run lint` | Passou (0 erros, 0 warnings) |
| Typecheck | `npm.cmd run typecheck` | Passou (`tsc` app + core com zero erros) |
| Testes Unitários | `npm.cmd test -- --run` | Passou (19 suites, 275 testes aprovados, regressão zero) |
| Build de Produção | `npm.cmd run build` | Passou (bundle Vite gerado com sucesso) |
| Validação OpenSpec | `openspec.cmd validate implement-mock-rest-api --strict` | Passou (`Change 'implement-mock-rest-api' is valid`) |
