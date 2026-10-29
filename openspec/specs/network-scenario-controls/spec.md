# network-scenario-controls Specification

## Purpose

Provê orquestração de cenários de simulação de rede MSW com 12 perfis regulamentares, controle de precedência, política segura de reset de fixtures e interface de diagnóstico acessível.

## Requirements

### Requirement: Catálogo de cenários de rede com 12 perfis regulamentares
O orquestrador de rede SHALL fornecer 12 perfis de simulação declarativos cobrindo os comportamentos do GDD: `default`, `empty`, `multi-page`, `slow-jitter`, `out-of-order`, `timeout`, `offline`, `error-4xx`, `error-5xx`, `isolated-tab-failure`, `commit-timeout` e `temporary-outage`. O comportamento de cada perfil SHALL modular respostas, latências e falhas nos endpoints `/api/*`.

#### Scenario: Simulação de listas vazias em empty
- **WHEN** o cenário ativo for `empty` e requisições GET para `/api/ranking` ou `/api/players/:playerId/matches` forem executadas
- **THEN** as respostas SHALL retornar status 200 contendo `items: []` e `totalItems: 0`

#### Scenario: Dataset expandido para paginação em multi-page
- **WHEN** o cenário ativo for `multi-page` e consultas paginadas forem efetuadas
- **THEN** o ranking SHALL disponibilizar mais de 30 partidas distribuídas em múltiplas páginas com navegação sem truncamento

#### Scenario: Latência elevada com jitter em slow-jitter
- **WHEN** o cenário ativo for `slow-jitter` e requisições forem disparadas aos endpoints `/api/*`
- **THEN** a resposta SHALL ser postergada por um intervalo variável entre 1.500ms e 2.500ms mantendo retorno de sucesso

#### Scenario: Respostas desordenadas em out-of-order
- **WHEN** o cenário ativo for `out-of-order` e múltiplas requisições assíncronas sucessivas forem emitidas
- **THEN** as respostas SHALL sofrer latências alternadas para validar cancelamento via AbortSignal e descarte de respostas obsoletas

#### Scenario: Simulação de timeout em timeout
- **WHEN** o cenário ativo for `timeout` e qualquer rota de API for consultada
- **THEN** a resposta não SHALL retornar dentro da janela útil do cliente, forçando estado de erro por timeout e transição para retry

#### Scenario: Simulação de desconexão física em offline
- **WHEN** o cenário ativo for `offline` e uma chamada for disparada pelo cliente HTTP
- **THEN** o interceptor SHALL rejeitar a chamada com falha imediata de rede sem resposta HTTP válida

#### Scenario: Simulação de erro permanente em error-4xx
- **WHEN** o cenário ativo for `error-4xx` e chamadas forem efetuadas
- **THEN** os endpoints SHALL responder com status HTTP na faixa 4xx (como 400 Bad Request), interrompendo retentativas cegas da outbox

#### Scenario: Simulação de falha de servidor em error-5xx
- **WHEN** o cenário ativo for `error-5xx` e requisições forem executadas
- **THEN** os endpoints SHALL responder com status 500 Internal Server Error permitindo teste de retentativas com backoff

#### Scenario: Falha seletiva isolada por aba em isolated-tab-failure
- **WHEN** o cenário ativo for `isolated-tab-failure` e as abas do menu forem consultadas
- **THEN** a rota `/api/ranking` SHALL retornar status 500 enquanto `/api/players/:playerId/matches` SHALL retornar status 200 com sucesso

#### Scenario: Timeout após commit atômico no store em commit-timeout
- **WHEN** o cenário ativo for `commit-timeout` e uma requisição POST para `/api/matches` for enviada
- **THEN** o interceptor SHALL persistir o resultado no store de partidas confirmadas mas derrubar a resposta HTTP com erro de rede

#### Scenario: Recuperação automática após indisponibilidade em temporary-outage
- **WHEN** o cenário ativo for `temporary-outage` e requisições forem enviadas sequencialmente
- **THEN** as 2 primeiras requisições SHALL falhar com erro de rede ou 503, e a 3ª requisição em diante SHALL retornar sucesso 200/201

### Requirement: Resolução hierárquica e precedência do cenário ativo
O cenário de rede ativo SHALL ser resolvido de acordo com a ordem estrita de precedência: parâmetro de busca na URL (`?networkScenario=<id>`), armazenamento local persistido (`pirate-battle.network-scenario.v1`), override síncrono em memória (`window.__pbNetworkScenario`) e fallback padrão (`default`).

#### Scenario: Precedência primária do parâmetro de URL
- **WHEN** a aplicação for carregada com parâmetro `?networkScenario=slow-jitter` na URL
- **THEN** o cenário `slow-jitter` SHALL prevalecer sobre qualquer valor configurado em LocalStorage ou na memória

#### Scenario: Persistência e restauração via LocalStorage
- **WHEN** o usuário selecionar um cenário pelo painel da interface sem parâmetro forçado na URL
- **THEN** o cenário SHALL ser persistido sob `pirate-battle.network-scenario.v1` e restaurado fielmente após recarga da página

#### Scenario: Override dinâmico em memória para testes
- **WHEN** scripts de teste definirem `window.__pbNetworkScenario` sem parâmetro de URL ou LocalStorage ativo
- **THEN** o orquestrador SHALL adotar o cenário definido em memória imediatamente

#### Scenario: Fallback seguro para default
- **WHEN** nenhuma chave de URL, LocalStorage ou memória estiver definida ou quando o identificador for inválido
- **THEN** o orquestrador SHALL utilizar o cenário `default` com operação determinística nominal

### Requirement: Política estrita de reset de mock data e preservação de dados locais
O acionamento de `resetMockData` SHALL restaurar unicamente o dataset determinístico de partidas confirmadas sob `pirate-battle.confirmed-matches.v1` e reinicializar estados transientes de cenários. Todas as demais chaves locais do usuário SHALL ser preservadas intocadas.

#### Scenario: Restauração canônica de fixtures e contadores
- **WHEN** o procedimento de reset de dados mockados for executado
- **THEN** o store `pirate-battle.confirmed-matches.v1` SHALL ser restaurado para as fixtures canônicas e contadores de falhas temporárias SHALL ser zerados

#### Scenario: Preservação inviolável de dados de usuário e sessão
- **WHEN** o procedimento de reset de dados mockados for executado
- **THEN** as chaves `pirate-battle.options.v1`, `pirate-battle.identity.v1`, `pirate-battle.last-result.v1`, `pirate-battle.outbox.v1` e preferências de áudio SHALL permanecer inalteradas

#### Scenario: Invalidação imediata de dados em cache
- **WHEN** o reset de dados for concluído com sucesso
- **THEN** as consultas ativas do TanStack Query sob os domínios de ranking e histórico SHALL ser invalidadas para refletir o estado restaurado

### Requirement: Desacoplamento e preservação da simulação ativa
A alternância de cenários de rede ou o acionamento de reset de dados mockados SHALL operar de forma desacoplada da simulação de combate ativa no componente de arena. O loop de jogo, timers e inputs de batalha em andamento jamais SHALL ser reiniciados ou interrompidos por operações de rede.

#### Scenario: Batalha contínua durante alteração de cenário
- **WHEN** o cenário de rede for modificado enquanto uma partida estiver em execução na arena
- **THEN** o loop de física, rendering e controle do jogador SHALL prosseguir sem recarregamento de página, congelamentos ou perda de estado

#### Scenario: Batalha contínua durante reset de dados mockados
- **WHEN** a função de reset de dados mockados for acionada durante combate ativo
- **THEN** a pontuação corrente, integridade do navio e tempo restante da partida ativa não SHALL sofrer qualquer modificação

#### Scenario: Submissão de resultado ao término sob o cenário configurado
- **WHEN** uma partida ativa for finalizada após troca de cenário de rede
- **THEN** o resultado gerado SHALL ser registrado na outbox local e a tentativa de envio SHALL respeitar as regras do cenário ativo naquele momento

### Requirement: Painel visual de controle e diagnóstico na interface
A tela de Menu Principal SHALL renderizar um painel de controle e diagnóstico acessível para seleção do cenário ativo e disparo de reset de dados mockados. O painel SHALL fornecer feedback semântico via WAI-ARIA e adaptar-se a viewports móveis a partir de 320 CSS px.

#### Scenario: Seleção interativa de cenário com descrição contextual
- **WHEN** o usuário expandir o painel e selecionar um cenário na lista de seleção
- **THEN** a interface SHALL atualizar o cenário ativo e exibir a descrição textual do comportamento simulado

#### Scenario: Feedback de confirmação de reset em aria-live
- **WHEN** o usuário acionar o botão de reset de dados mockados
- **THEN** uma mensagem de confirmação SHALL ser anunciada em elemento com role="status" e aria-live="polite"

#### Scenario: Ação de restauração rápida do cenário default
- **WHEN** um cenário diferente de default estiver ativo
- **THEN** a interface SHALL disponibilizar botão secundário permitindo retornar instantaneamente ao cenário default

#### Scenario: Adaptação e contenção em telas estreitas
- **WHEN** a interface for renderizada em viewport com largura de 320 CSS px
- **THEN** todos os controles do painel de cenários SHALL manter alvos de toque mínimos de 44px e não SHALL provocar rolagem horizontal indesejada
