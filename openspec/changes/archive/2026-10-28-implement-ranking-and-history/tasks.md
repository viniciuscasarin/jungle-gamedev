# Tasks

## 1. Infraestrutura de Dados, AbortSignal e Invalidação da Outbox

- [x] 1.1 Atualizar `src/data/client.ts` para aceitar `signal?: AbortSignal` em `getRanking` e `getPlayerMatches` e repassar para a instância Axios; verificar via teste unitário que o signal é repassado à requisição.
- [x] 1.2 Atualizar `src/data/outboxService.ts` para invalidar a query key com prefixo `['history']` em adição a `['ranking']` após confirmação HTTP 200/201; verificar via teste unitário do despachante.
- [x] 1.3 Implementar hooks `@tanstack/react-query` (`useRanking` e `usePlayerHistory`) utilizando chaves compostas e `placeholderData: keepPreviousData`; verificar via testes unitários dos hooks com query client mockado.

## 2. Componentes de UI de Abas, Tabelas e Paginação

- [x] 2.1 Criar container semântico de abas com WAI-ARIA (`tablist`, `tab`, `tabpanel`) e navegação por teclado (`ArrowLeft`, `ArrowRight`, `Home`, `End`); verificar atributos ARIA e foco via testes de componente com React Testing Library.
- [x] 2.2 Criar componente de visualização e paginação do Ranking (tabela com 10 itens por página, barra de paginação e cabeçalho com filtro explícito da configuração ativa); verificar renderização e navegação de páginas via testes de componente.
- [x] 2.3 Criar componente de visualização e paginação do Match History (filtrado pelo `playerId` local, formatação de data no locale, duração em segundos e motivos legíveis `Time expired` / `Ship destroyed`); verificar exibição dos campos via testes de componente.

## 3. Integração no Menu Principal e Resiliência Visual

- [x] 3.1 Integrar o container de abas no `MainMenu.tsx` substituindo os marcadores desabilitados da seção de ações futuras; verificar que os botões "Play", "Options" e "Last Result" permanecem acessíveis e funcionais.
- [x] 3.2 Implementar mensagens literais exatas do GDD para coleções vazias (`"No matches for these settings yet."` e `"No completed matches yet."`) e estado de erro isolado com botão "Retry" por aba; verificar comportamento via testes de tela.
- [x] 3.3 Assegurar layout responsivo para viewports estreitos (mínimo 320 CSS pixels) com suporte a `overflow-x: auto` e áreas de toque mínimas de 44px; verificar compatibilidade visual e de estilo sem quebrar molduras decorativas.

## 4. Testes Automatizados de Integração e Validação do Fluxo

- [x] 4.1 Criar suíte completa de testes de integração em `tests/rankingHistory.test.ts` cobrindo ciclo de vida de abas, paginação, mensagens literais, cancelamento de requisições e isolamento de erros; verificar execução com sucesso via comando `npm test`.
- [x] 4.2 Validar a sincronização reativa com a outbox: garantir que uma partida concluída despachada com sucesso invalida o cache e reflete a nova pontuação nas abas sem recarregar a aplicação; verificar via teste de integração fim a fim da camada de dados.
