# Proposal

## Why

Atualmente, o Menu Principal exibe marcadores desabilitados para "Ranking" e "Match History", impedindo que os jogadores consultem suas pontuações passadas e a classificação comparativa contra outros capitães. Com a infraestrutura REST mockada e a outbox resiliente já entregues nos incrementos anteriores, é o momento de ativar essas telas com paginação honesta, navegação acessível por abas, cache reativo e resiliência visual completa, assegurando que falhas de rede nunca impeçam o fluxo principal de jogo.

## What Changes

- Substituição dos botões desabilitados na seção de ações futuras do `MainMenu` por um container de abas acessível e navegável via teclado, implementando o padrão WAI-ARIA (`tablist`, `tab`, `tabpanel`).
- Criação dos hooks dedicados em `@tanstack/react-query` (`useRankingQuery` e `usePlayerHistoryQuery`) com chaves de consulta granulares e compostas (`['ranking', configurationKey, page, pageSize]` e `['history', playerId, page, pageSize]`).
- Adoção de paginação suave com 10 itens por página utilizando `placeholderData: keepPreviousData`, preservando as linhas visíveis durante transições de página sem oscilação de layout.
- Atualização do cliente HTTP Axios em `src/data/client.ts` para repassar o `AbortSignal` fornecido pelo TanStack Query, garantindo cancelamento imediato de requisições de rede obsoletas.
- Apresentação explícita do filtro de configuração ativa no cabeçalho da aba Ranking (exibindo duração da sessão e intervalo de spawn de inimigos), prevenindo a percepção de pontuações apagadas ao alternar opções.
- Exibição das mensagens literais do GDD para coleções vazias: `"No matches for these settings yet."` para Ranking e `"No completed matches yet."` para Histórico de Partidas.
- Isolamento visual e funcional de falhas: erros em qualquer uma das abas exibem mensagem dedicada e ação de "Retry", sem bloquear as opções do menu ("Play", "Options", "Last Result").
- Alinhamento da invalidação de cache em `outboxService.ts` para invalidar queries sob o prefixo canônico `['history']` juntamente com `['ranking']` após a confirmação de entrega de resultados de partidas.

## Capabilities

### New Capabilities
- `ranking-and-history`: Apresentação paginada, isolada e acessível de Ranking e Histórico de Partidas no Menu Principal com gerenciamento de cache TanStack Query, cancelamento de requisições obsoletas e sincronização automática com confirmações da Outbox.

### Modified Capabilities
- `menu-options`: Atualiza o requisito de Menu local substituindo as reservas de interface indisponíveis de Ranking e Histórico por abas ativas, acessíveis e operacionais.

## Impact

- Componentes de UI: `src/ui/MainMenu.tsx`, além de novos componentes visuais para abas, tabelas e paginação em `src/ui/`.
- Camada de Dados e Cache: `src/data/client.ts` (suporte a `signal`), novos hooks de consulta em `src/data/hooks/` (ou `src/data/queries.ts`) e `src/data/outboxService.ts` (alinhamento de invalidação).
- Dependências: Nenhuma dependência externa nova necessária (`@tanstack/react-query` e `axios` já estão instalados e configurados).
- Testes: Novos testes de integração e componentes cobrindo navegação WAI-ARIA, paginação, mensagens literais, isolamento de erro e sincronização de cache.
