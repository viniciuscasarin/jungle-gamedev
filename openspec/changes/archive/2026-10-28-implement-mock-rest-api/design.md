# Design

## Context

A arquitetura do jogo atingiu maturidade em simulação determinística, renderização PixiJS e acessibilidade visual/auditiva. Contudo, as seções 12 e 13 do GDD exigem que os dados de ranking e histórico de partidas sejam consumidos através de uma fronteira REST padronizada, operando sobre um Mock Service Worker (MSW) persistente. Atualmente, não há cliente HTTP, interceptação de rede nem repositório de partidas confirmadas, e os botões de Ranking e Match History no menu principal permanecem desabilitados.

Para motivação e escopo detalhados, consulte `proposal.md` e a especificação em `specs/mock-rest-api/spec.md`.

## Goals / Non-Goals

**Goals:**
- Configurar Mock Service Worker (MSW) para interceptação de rotas `/api/*` tanto em ambiente de navegador (Service Worker em `vite dev`, `vite preview` e build estático) quanto em testes automatizados (Node `setupServer` com Vitest).
- Implementar cliente HTTP padronizado e tipado com Axios (`src/data/client.ts` e `src/data/contracts.ts`) cobrindo `GET /api/ranking`, `GET /api/players/:playerId/matches` e `POST /api/matches`.
- Desenvolver repositório persistido de partidas confirmadas (`src/mocks/store.ts`) sob a chave `pirate-battle.confirmed-matches.v1` no LocalStorage com isolamento estrito da partida ativa.
- Implementar fixtures determinísticas de capitães e geração de identidade local persistente (`Captain-XXXX` e UUID v4).
- Assegurar ordenação determinística triplamente chaveada para o ranking: `score` DESC, `completedAt` ASC e `matchId` ASC.
- Garantir idempotência estrita em `POST /api/matches`: retentativas idênticas retornam o registro canônico (200/201), enquanto payloads divergentes para o mesmo `matchId` retornam HTTP 409 Conflict tipado.
- Garantir resiliência na inicialização: lentidão ou falha no registro do Service Worker não impede a inicialização da aplicação nem o início de combate ("falha no serviço não impede Play").

**Non-Goals:**
- Construir as telas visuais de ranking e histórico na interface do usuário (essas telas completas, filtros visuais e integração com TanStack Query são escopo específico dos incrementos 11 e 12).
- Desenvolver um backend compartilhado entre navegadores ou multiplayer remoto (o GDD v0.2 estipula explicitamente que a identidade e o ranking são restritos aos dados do navegador local e suas fixtures determinísticas).
- Alterar o motor autoritativo da simulação pura (`src/simulation/`), que já emite o `CompletedMatchResult` imutável.

## Decisions

### 1. Interceptação REST Isomórfica com MSW (Browser Worker + Node Server)
- **Decisão**: Configurar `msw` com arquitetura de handlers únicos compartilhados (`src/mocks/handlers.ts`). Para o navegador, instanciar `setupWorker` (`src/mocks/browser.ts`) usando o script `public/mockServiceWorker.js`. Para a suíte de testes Vitest, instanciar `setupServer` (`src/mocks/server.ts`).
- **Racional**: Assegura que o comportamento dos endpoints, validações e retornos de erro sejam idênticos em tempo de desenvolvimento, testes automatizados e pré-visualização de build (`vite preview`).
- **Alternativas consideradas**:
  - *Mocks manuais via Axios interceptors*: Rejeitado por não interceptar requisições em nível de rede (Fetch/XHR nativo) e não refletir com fidelidade o comportamento real de rede.
  - *Servidor Node/Express rodando em porta paralela*: Rejeitado por exigir processos em segundo plano complexos, dificultando testes em CI e execuções estáticas no GitHub Pages / build publicado.

### 2. Store Persistido Desacoplado no LocalStorage
- **Decisão**: Criar `src/mocks/store.ts` gerenciando o armazenamento local sob a chave explícita `pirate-battle.confirmed-matches.v1`. O store mantém a lista completa de partidas confirmadas, provê métodos para consulta paginada, inserção idempotente e semeadura inicial de fixtures determinísticas.
- **Racional**: A seção 12 do GDD exige a separação clara entre os dados da partida ativa e o acervo de partidas confirmadas. A chave pré-existente `pirate-battle.last-result.v1` armazena apenas o snapshot do último resultado para apresentação imediata de telas de fim de jogo e não deve ser misturada com o histórico acumulado.
- **Alternativas consideradas**:
  - *Usar a mesma chave de último resultado como array*: Rejeitado por violar o desacoplamento arquitetural e aumentar o risco de perda de histórico em operações de reset de sessão.

### 3. Ordenação Determinística do Ranking (Score DESC, CompletedAt ASC, MatchId ASC)
- **Decisão**: Ordenar a coleção de partidas no ranking segundo o algoritmo:
  ```typescript
  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeCompare = a.completedAt.localeCompare(b.completedAt);
    if (timeCompare !== 0) return timeCompare;
    return a.matchId.localeCompare(b.matchId);
  });
  ```
  O filtro de ranking compara estritamente a `configurationKey` canônica.
- **Racional**: Garante desempate consistente e reprodutível. Jogadores que alcançaram a pontuação primeiro (`completedAt` menor/mais antigo) têm precedência; persistindo o empate temporal, a ordem lexicográfica de `matchId` impede instabilidade de ordenação entre renderizações.

### 4. Idempotência Estrita e Detecção de Conflitos em POST /api/matches
- **Decisão**: Antes de inserir um novo registro no store, o handler verifica a existência de uma partida com o mesmo `matchId`:
  - Se existir e o payload for equivalente nos campos canônicos (`score`, `completedAt`, `activeDurationMs`, `endReason`, `configurationKey`, `seed`, `playerId`), retorna status 200/201 com o registro persistido existente.
  - Se existir mas qualquer campo canônico divergir, retorna status 409 com corpo JSON tipado:
    `{ error: 'Conflict', code: 'MATCH_PAYLOAD_CONFLICT', message: 'Match ID already registered with divergent payload' }`.
- **Racional**: Previne registros duplicados em caso de retentativas de rede, assegurando que ranking e histórico leiam exatamente a mesma base e rejeitem dados corrompidos.

### 5. Inicialização Resiliente do MSW (`initMocks`)
- **Decisão**: Encapsular a inicialização em `src/mocks/init.ts` chamada em `src/main.tsx` antes de `createRoot(...).render(...)`. A inicialização possui um timeout defensivo (ex: 1500ms via `Promise.race`) e tratamento de exceções. Caso o Service Worker falhe ao registrar (ex: bloqueio de cookies/storage em modo anônimo, ou ausência de suporte), emite um `console.warn` e prossegue com a montagem do app.
- **Racional**: Atende expressamente ao requisito fundamental do GDD: "falha no serviço não impede Play".

### 6. Identidade Local e Fixtures Determinísticas
- **Decisão**: Gerenciar a identidade local através da chave `pirate-battle.identity.v1`. Caso inexistente, gerar UUID v4 e nome legível `Captain-XXXX` derivado dos primeiros caracteres hexadecimais em caixa alta. Criar em `src/mocks/fixtures.ts` uma lista fixa de partidas determinísticas com capitães icônicos (ex: *Captain Anne Bonny*, *Captain Calico Jack*, *Captain Blackbeard*) associadas à `DEFAULT_CONFIGURATION_KEY`.
- **Racional**: Garante ranking populado e testável desde a primeira visita, sem necessitar de autenticação de usuários externa.

## Risks / Trade-offs

- **[Risk] Falha de registro do Service Worker em ambientes restritos (e.g. iframe, modo privado)**
  → *Mitigação*: Timeout defensivo e fallback gracioso em `initMocks()`, mantendo o jogo executável mesmo sem interceptação mockada ativa.
- **[Risk] Esgotamento de cota do LocalStorage (`QuotaExceededError`)**
  → *Mitigação*: O store em `src/mocks/store.ts` captura erros de escrita no LocalStorage e mantém uma cópia em memória RAM dos dados da sessão atual como fallback seguro.
- **[Risk] Inconsistência entre os testes em Node/Vitest e a execução no browser**
  → *Mitigação*: Compartilhamento integral dos mesmos handlers (`src/mocks/handlers.ts`) e da mesma lógica de store (`src/mocks/store.ts`) entre `setupWorker` e `setupServer`.

## Migration Plan

1. Adicionar dependências `axios` e `msw` ao `package.json`.
2. Gerar `public/mockServiceWorker.js` via comando MSW CLI ou template canônico.
3. Implementar módulos de dados e mocks em `src/data/` e `src/mocks/`.
4. Integrar `initMocks()` em `src/main.tsx`.
5. Validar cobertura através de testes unitários em Vitest (`tests/mockApi.test.ts`) e testes de inicialização/preview.
6. A mudança é 100% aditiva e não quebra telas nem partidas em andamento.
