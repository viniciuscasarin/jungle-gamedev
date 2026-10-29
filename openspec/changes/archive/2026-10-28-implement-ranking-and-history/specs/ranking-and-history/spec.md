# Spec Delta

## Purpose

Fornecer apresentação paginada, reativa e acessível de Ranking e Histórico de Partidas no Menu Principal, com controle de cache via TanStack Query, cancelamento de requisições obsoletas e atualização automática pós-partida.

## ADDED Requirements

### Requirement: Navegação acessível por abas no Menu Principal
O Menu Principal SHALL fornecer um container de abas estruturado conforme o padrão WAI-ARIA com `role="tablist"`, abas `role="tab"` (`aria-selected`, `aria-controls`) e painéis `role="tabpanel"` (`aria-labelledby`). A navegação por teclado SHALL suportar alternância de foco entre as abas via setas horizontais sem bloquear as ações locais de Play e Options.

#### Scenario: Estrutura semântica WAI-ARIA e alternância de abas
- **WHEN** o usuário visualiza o Menu Principal e clica na aba "Ranking" ou "Match History"
- **THEN** a aba selecionada recebe `aria-selected="true"`, `tabIndex={0}` e expõe o painel associado com `role="tabpanel"`
- **AND** a aba inativa recebe `aria-selected="false"`, `tabIndex={-1}` e seu painel correspondente fica oculto

#### Scenario: Isolamento das ações principais do menu
- **WHEN** o usuário alterna entre abas ou as abas realizam consultas de dados
- **THEN** os botões "Play", "Options" e "Last Result" permanecem sempre ativos, interativos e acionáveis
- **AND** nenhuma operação nas abas bloqueia ou atrasa a navegação local do jogo

### Requirement: Consulta paginada e apresentação de Ranking com filtro explícito
A aba Ranking SHALL consultar `/api/ranking` usando `@tanstack/react-query` com chave canônica `['ranking', configurationKey, page, pageSize]`, paginação de 10 itens por página e `placeholderData: keepPreviousData`. O cabeçalho da aba SHALL apresentar explicitamente a configuração de partida ativa utilizada como filtro.

#### Scenario: Exibição ordenada e paginada de capitães
- **WHEN** a aba Ranking carrega os registros para a configuração de partida atual
- **THEN** exibe os registros em ordem decrescente de pontuação, exibindo posição (#1, #2...), nome do capitão e pontuação
- **AND** a barra de paginação expõe os controles de página anterior e próxima, respeitando o limite de 10 itens por página

#### Scenario: Exibição explícita dos parâmetros de configuração ativos
- **WHEN** a aba Ranking é visualizada
- **THEN** um resumo legível dos parâmetros ativos (ex: duração de sessão e intervalo de spawn) é exibido no cabeçalho
- **AND** fica explícito que alterações nas configurações do jogo filtram um grupo distinto de pontuações sem apagar scores anteriores

#### Scenario: Paginação suave sem piscamento de layout
- **WHEN** o usuário navega da página 1 para a página 2 do Ranking
- **THEN** os dados da página 1 permanecem visíveis enquanto a nova página carrega em segundo plano
- **AND** o container da tabela sinaliza carregamento discreto (`aria-busy="true"`) sem desmontar a estrutura tabular

### Requirement: Consulta paginada e formatação do Histórico de Partidas
A aba Match History SHALL consultar `/api/players/:playerId/matches` com chave `['history', playerId, page, pageSize]`, filtrando exclusivamente as partidas do jogador local em ordem cronológica decrescente. Os itens SHALL formatar data/hora no locale do usuário, duração em segundos e motivos legíveis de encerramento (`Time expired` e `Ship destroyed`).

#### Scenario: Listagem cronológica do histórico local
- **WHEN** a aba Match History é ativada para o jogador corrente
- **THEN** exibe a lista de partidas associadas exclusivamente ao `playerId` local, ordenadas da conclusão mais recente para a mais antiga
- **AND** cada linha apresenta data formatada no fuso e idioma do usuário, pontuação, duração ativa e motivo de término

#### Scenario: Formatação de encerramento e data no locale
- **WHEN** o registro possui motivo `time_expired` ou `player_destroyed`
- **THEN** a interface renderiza respectivamente `Time expired` ou `Ship destroyed`
- **AND** a duração ativa é formatada em segundos sem incluir telas de carregamento ou pausa

### Requirement: Resiliência visual, cancelamento de requisições e mensagens do GDD
As consultas de Ranking e Histórico SHALL repassar o `AbortSignal` ao cliente HTTP Axios para cancelamento de requisições obsoletas. Coleções vazias SHALL exibir as mensagens literais do GDD: "No matches for these settings yet." para Ranking e "No completed matches yet." para Histórico. Falhas de rede SHALL exibir aviso de erro e botão Retry isolados por aba.

#### Scenario: Mensagens literais para coleções vazias
- **WHEN** a consulta de Ranking retorna 0 itens para a configuração ativa
- **THEN** o painel exibe exatamente a mensagem "No matches for these settings yet."
- **WHEN** a consulta de Match History retorna 0 partidas concluídas para o jogador local
- **THEN** o painel exibe exatamente a mensagem "No completed matches yet."

#### Scenario: Isolamento de falha de rede e ação de Retry
- **WHEN** a requisição de uma aba falha por erro de rede ou código HTTP 5xx
- **THEN** o painel afetado exibe mensagem de erro acessível (`role="alert"`) e um botão "Retry"
- **AND** o erro fica restrito à respectiva aba, sem propagar falhas para a outra aba nem para os botões "Play" e "Options"
- **AND** acionar "Retry" dispara nova tentativa de consulta com foco recuperado

#### Scenario: Cancelamento de requisições em voo com AbortSignal
- **WHEN** o usuário troca rapidamente de página ou alterna entre abas antes da resposta anterior chegar
- **THEN** a requisição de rede em voo anterior é cancelada via `AbortController`
- **AND** respostas tardias descartadas não sobrescrevem os dados da página ou aba atualmente selecionada

### Requirement: Sincronização reativa de cache pós-confirmação da Outbox
Após a confirmação bem-sucedida de entrega de uma partida pelo serviço de outbox, as consultas em cache sob as chaves com prefixo `['ranking']` e `['history']` SHALL ser invalidadas. Caso o jogador esteja visualizando qualquer uma das abas no Menu Principal, os novos dados confirmados SHALL ser atualizados em segundo plano automaticamente.

#### Scenario: Invalidação automática após entrega da outbox
- **WHEN** o serviço de outbox confirma a entrega de uma nova partida concluída (HTTP 200/201)
- **THEN** as chaves de query com prefixo `['ranking']` e `['history']` são marcadas como invalidadas no `QueryClient`

#### Scenario: Atualização em segundo plano na aba ativa
- **WHEN** a invalidação ocorre enquanto o jogador está no Menu Principal visualizando uma das abas
- **THEN** o TanStack Query dispara refetch em segundo plano sem desestruturar a visualização atual
- **AND** os dados da tabela são atualizados exibindo a pontuação recém-registrada
