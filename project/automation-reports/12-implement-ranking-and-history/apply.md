# Increment 12: Implement Ranking and History Apply Report

## Summary

O incremento 12 (`implement-ranking-and-history`) foi implementado com sucesso no workspace `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev`.
Todas as 11 tarefas planejadas em `openspec/changes/implement-ranking-and-history/tasks.md` foram concluídas e verificadas com aprovação estrita de 100% dos testes unitários (308 testes, 22 suítes, regressão zero dos 295 testes anteriores), testes end-to-end do Playwright, typechecking, linting, build de produção e validação do OpenSpec.

## Implementações Realizadas

1. **Camada de Dados e Cancelamento de Requisições HTTP**:
   - Atualizado `src/data/contracts.ts`: adicionada a interface `RequestOptions { signal?: AbortSignal }` e estendidas as interfaces de query `RankingQuery` e `PlayerMatchesQuery` para suportar `signal?: AbortSignal`.
   - Atualizado `src/data/client.ts`: estendidos os métodos `getRanking` e `getPlayerMatches` com parâmetro opcional `options?: RequestOptions`. O `signal` é propagado diretamente para o cliente Axios tanto a partir de `options.signal` quanto de `query.signal`. Adicionado tratamento explícito para re-lançar erros de cancelamento (`isAxiosCancel` / `name === 'AbortError' / 'CanceledError'`), assegurando que TanStack Query gerencie cancelamentos de forma transparente sem converter em falha permanente de servidor.

2. **Invalidação Reativa da Outbox no TanStack Query**:
   - Atualizado `src/data/outboxService.ts`: estendido o callback de confirmação bem-sucedida de entrega (HTTP 200/201) para invalidar a chave de cache de histórico `queryClient.invalidateQueries({ queryKey: ['history'] })`, em sincronia com as chaves preexistentes `['ranking']` e `['playerMatches']`.

3. **Hooks TanStack Query e Chaves Canônicas**:
   - Implementado `src/data/queries.ts` com chaves canônicas de consulta:
     - Ranking: `['ranking', configurationKey, page, pageSize]`
     - Histórico: `['history', playerId, page, pageSize]`
   - Implementados os hooks reativos `useRanking` e `usePlayerHistory`:
     - Suporte nativo ao `AbortSignal` de cancelamento via parâmetro `signal` fornecido pela `queryFn` do TanStack Query v5.
     - Preservação da página anterior durante transições de paginação utilizando `placeholderData: keepPreviousData`.
     - Resiliência estrutural com extração segura via `useContext(QueryClientContext)` e fallback automático para `defaultQueryClient`, permitindo renderização isolada em testes unitários e SSR sem necessidade de `QueryClientProvider` mandatório.

4. **Navegação em Abas Acessíveis (WAI-ARIA Tabs)**:
   - Criado componente `src/ui/screens/LeaderboardTabs.tsx` implementando as diretrizes completas da especificação WAI-ARIA para abas:
     - Contêiner `role="tablist"` com `aria-label="Match records"`.
     - Abas com `role="tab"`, `id="tab-ranking"` / `id="tab-history"`, `aria-selected`, `aria-controls` e roving `tabIndex` (0 na aba ativa, -1 na inativa).
     - Painéis com `role="tabpanel"`, `tabIndex={0}`, `aria-labelledby` apontando para o id da aba correspondente.
     - Navegação por teclado completa: alternância com `ArrowLeft`, `ArrowRight`, `Home` e `End`, com foco automático na aba ativada.
     - Isolamento estrito de navegação: as teclas `ArrowLeft` e `ArrowRight` não afetam controles interativos externos (como botões de paginação ou menu principal).

5. **Aba de Ranking (`RankingTab`)**:
   - Exibe badge com filtro da configuração ativa atual (ex: `Quick — Normal (10 ship cap)`).
   - Tabela de classificação com colunas: Rank (`#`), Player, Score, Destroyed e Date.
   - Destaque semântico visual para o jogador local utilizando classe `.local-player-row` e indicação `(You)`.
   - Paginação canônica de 10 itens por página com botões `Previous` e `Next` e indicador acessível `Page X of Y`.
   - Mensagem canônica para ranking vazio: `"No matches for these settings yet."`.
   - Estado de erro isolado com botão de `Retry` dedicado acionando refetch da consulta sem degradar o restante da aplicação.

6. **Aba de Histórico de Partidas (`MatchHistoryTab`)**:
   - Exibe badge indicando filtro pelo jogador local (`Player: <id>`).
   - Tabela de histórico com colunas: Date (formatada conforme localidade via `toLocaleDateString` + `toLocaleTimeString`), Score, Destroyed, Duration (em segundos) e Reason (`Time expired` ou `Ship destroyed`).
   - Paginação canônica de 10 itens por página com controles `Previous`, `Next` e indicador `Page X of Y`.
   - Mensagem canônica para histórico vazio: `"No completed matches yet."`.
   - Estado de erro isolado com botão de `Retry` dedicado.

7. **Integração no Menu Principal e Aplicação**:
   - Atualizado `src/ui/screens/MainMenu.tsx`: substituído o placeholder de ações futuras pela seção `.menu-leaderboards-container` renderizando `<LeaderboardTabs>`.
   - Ações essenciais (`Play`, `Options`, `Last Result`) permanecem plenamente funcionais no topo do menu, com a nova seção posicionada logo abaixo.
   - Atualizado `src/ui/App.tsx`: propagação limpa da chave de configuração e rótulo amigável (`configurationKey`, `configurationLabel`) para o `MainMenu`.

8. **Estilos Responsivos e Otimização para 320px**:
   - Atualizado `src/ui/styles.css`:
     - Estilos para `.tabs-header`, `.tab-button`, `.tab-content`, `.config-badge`, `.leaderboard-table-wrapper` e `.pagination-controls`.
     - Touch targets com altura mínima de 44px e área clicável ampla para dispositivos móveis.
     - Contêiner de tabela com `overflow-x: auto` permitindo rolagem horizontal suave em viewports estreitos.
     - Tratamento específico para viewports ultracompactos (<= 350px): redução de bordas e paddings do painel e `max-width: 100%` com `display: inline-block` no badge para garantir ausência de transbordamento horizontal da página em 320px.

9. **Testes Automatizados (Unitários, Integração e E2E)**:
   - `tests/rankingHistory.test.ts` (13 novos testes):
     - Cancelamento via `AbortSignal` no cliente HTTP.
     - Invalidação automática da chave `['history']` após sincronização de outbox bem-sucedida.
     - Resolução e ordenação canônica de chaves de query do TanStack Query.
     - Semântica WAI-ARIA de abas (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`).
     - Navegação via teclado (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
     - Renderização de linhas com destaque para o jogador local.
     - Mensagens canônicas de lista vazia para ranking e histórico.
     - Isolamento de erros com botão de retentativa dedicado.
     - Sincronização reativa de ponta a ponta após confirmação da outbox.
   - `tests/e2e/ranking-history.spec.ts` (4 testes Playwright):
     - Renderização padrão da aba de ranking com paginação.
     - Alternância de abas via clique e via teclado (`ArrowRight`, `ArrowLeft`).
     - Resiliência das opções de navegação (`Options` -> `Back to Menu` mantendo o leaderboard funcional).
     - Layout responsivo no viewport de 320px sem overflow horizontal na janela do navegador.
   - `tests/e2e/options.spec.ts`:
     - Atualizada asserção para verificar abas visíveis no lugar de botões inativos legados.

10. **Documentação e Validação**:
    - Atualizados `ARCHITECTURE.md` e `README.md` em inglês documentando a arquitetura do Incremento 12, chaves canônicas de consulta, navegação WAI-ARIA, estratégias de paginação e invalidação reativa.
    - Atualizado `openspec/changes/implement-ranking-and-history/tasks.md` com todas as 11 tarefas marcadas como concluídas (`[x]`).

## Verificações Executadas

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Linter | `npm.cmd run lint` | Passou (0 erros, 0 avisos) |
| Typecheck | `npm.cmd run typecheck` | Passou (`tsc -b src-core src && tsc -p tests/tsconfig.json` limpo) |
| Testes Unitários | `npm.cmd test -- --run` | Passou (22 suítes, 308 testes aprovados, regressão zero) |
| Build de Produção | `npm.cmd run build` | Passou (bundle Vite gerado com sucesso) |
| Validação OpenSpec | `openspec.cmd validate implement-ranking-and-history --strict` | Passou (`Change 'implement-ranking-and-history' is valid`) |
| Testes E2E (Ranking/Histórico) | `npx.cmd playwright test tests/e2e/ranking-history.spec.ts` | Passou (4 testes aprovados nos servidores dev e preview) |
| Testes E2E (Options) | `npx.cmd playwright test tests/e2e/options.spec.ts` | Passou (4 testes aprovados) |
