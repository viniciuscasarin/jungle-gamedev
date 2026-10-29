# Spec Delta

## Purpose

Fornece contratos REST padronizados, interceptação de rede mockada via Mock Service Worker e repositório persistido de partidas confirmadas para alimentar ranking e histórico.

## ADDED Requirements

### Requirement: Contratos REST paginados para Ranking e Histórico
Os endpoints REST de ranking e histórico de partidas SHALL retornar respostas paginadas contendo `items`, `page`, `pageSize` e `totalItems`. O ranking SHALL filtrar exclusivamente por `configurationKey` canônica e ordenar por pontuação decrescente, timestamp de conclusão crescente e `matchId` lexicográfico. O histórico SHALL filtrar por `playerId` e ordenar em cronologia decrescente.

#### Scenario: Paginação e ordenação determinística de ranking
- **WHEN** uma requisição GET para `/api/ranking?configurationKey=CANONICAL_KEY&page=1&pageSize=10` for executada
- **THEN** a resposta SHALL retornar status 200 contendo `items`, `page: 1`, `pageSize: 10`, `totalItems` e registros ordenados primariamente por `score` decrescente, secundariamente por `completedAt` crescente e em terceiro lugar por `matchId` em ordem lexicográfica

#### Scenario: Filtragem estrita de ranking por configuração idêntica
- **WHEN** o endpoint `/api/ranking` for consultado com uma `configurationKey` específica
- **THEN** a lista `items` SHALL conter unicamente partidas cujos snapshots possuam a exata mesma chave de configuração, desconsiderando variações de seed ou preferências visuais

#### Scenario: Consulta de histórico de partidas por jogador
- **WHEN** uma requisição GET para `/api/players/:playerId/matches?page=1&pageSize=10` for executada
- **THEN** a resposta SHALL retornar status 200 contendo apenas as partidas pertencentes àquele `playerId`, ordenadas do término mais recente para o mais antigo

#### Scenario: Consulta de página além do limite total
- **WHEN** qualquer endpoint paginado for consultado com número de página superior ao total disponível
- **THEN** a resposta SHALL retornar status 200 com lista `items: []` vazia e metadados preservados de `page`, `pageSize` e `totalItems`

### Requirement: Registro idempotente e resolução de conflitos em POST /api/matches
O endpoint `POST /api/matches` SHALL registrar partidas concluídas usando `matchId` como chave de idempotência. O envio de payload idêntico com o mesmo `matchId` SHALL retornar o registro canônico existente com sucesso (200/201). O envio de payload divergente com o mesmo `matchId` SHALL retornar erro tipado de conflito HTTP 409. O registro SHALL compartilhar base única entre ranking e histórico.

#### Scenario: Registro inédito de partida concluída com sucesso
- **WHEN** uma requisição POST para `/api/matches` for enviada com um `CompletedMatchResult` válido e `matchId` inédito
- **THEN** o endpoint SHALL persistir o registro na base compartilhada e retornar status 201 com o objeto canônico imutável gravado

#### Scenario: Retentativa idempotente com payload idêntico
- **WHEN** uma requisição POST para `/api/matches` for reenviada com `matchId` já existente e payload com campos idênticos
- **THEN** o endpoint SHALL retornar status 200 ou 201 contendo o registro canônico pré-existente sem gerar entradas duplicadas no ranking ou histórico

#### Scenario: Conflito tipado para mesmo matchId com payload divergente
- **WHEN** uma requisição POST para `/api/matches` for enviada com `matchId` já registrado mas com pontuação, duração ou configuração divergente
- **THEN** o endpoint SHALL rejeitar a requisição com status 409 Conflict e corpo JSON tipado descrevendo a incompatibilidade de dados

#### Scenario: Rejeição de payload incompleto ou inválido
- **WHEN** uma requisição POST para `/api/matches` for enviada com campos obrigatórios ausentes, score não numérico ou formato UTC inválido
- **THEN** o endpoint SHALL rejeitar a requisição com status 400 Bad Request e detalhes semânticos da validação

### Requirement: Repositório persistido de partidas confirmadas e desacoplamento
As partidas confirmadas SHALL ser persistidas no armazenamento local sob a chave `pirate-battle.confirmed-matches.v1`, isoladas da partida ativa e do resultado imediato. O store SHALL manter os registros íntegros após recarregamento da aplicação. Em caso de indisponibilidade ou falha no armazenamento local, o repositório SHALL operar com fallback seguro em memória sem lançar exceções não tratadas.

#### Scenario: Persistência de partidas confirmadas após recarregamento
- **WHEN** partidas forem confirmadas e a aplicação sofrer um recarregamento completo de página
- **THEN** o repositório SHALL carregar todas as partidas confirmadas previamente persistidas sem perdas de registros

#### Scenario: Desacoplamento entre partida ativa e partidas confirmadas
- **WHEN** uma nova partida for iniciada, pausada ou reinicializada na arena de batalha
- **THEN** o acervo de partidas confirmadas no store sob `pirate-battle.confirmed-matches.v1` SHALL permanecer inalterado

#### Scenario: Fallback defensivo em memória quando armazenamento falha
- **WHEN** o acesso ao LocalStorage estiver restrito, cheio ou lançar exceções no ambiente do usuário
- **THEN** o store SHALL reter os dados em memória RAM permitindo operações normais da sessão sem interrupção de fluxo

### Requirement: Inicialização resiliente e interceptação com Mock Service Worker
A interceptação HTTP das rotas `/api/*` SHALL ser provida por Mock Service Worker (MSW) em desenvolvimento, preview, build publicado e testes automatizados. A inicialização do MSW SHALL ser assíncrona e resiliente, de modo que atrasos ou falhas no registro do Service Worker não impeçam o carregamento da interface nem o início de novas partidas.

#### Scenario: Interceptação transparente em ambiente de navegador
- **WHEN** a aplicação for executada em desenvolvimento, preview ou build de produção no navegador
- **THEN** as requisições para `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches` SHALL ser interceptadas pelo Service Worker sem gerar erros de rede 404

#### Scenario: Interceptação em ambiente de testes automatizados
- **WHEN** os testes unitários ou de integração forem executados sob o runtime Node/Vitest
- **THEN** as chamadas de API disparadas pelo cliente HTTP SHALL ser interceptadas pelo MSW Node server com os mesmos contratos de resposta

#### Scenario: Falha de inicialização do mock sem bloqueio de jogabilidade
- **WHEN** o registro do Service Worker do MSW falhar ou exceder o tempo limite de inicialização
- **THEN** a aplicação SHALL inicializar a interface e permitir o fluxo de batalha ("Play") normalmente sem travar em tela de carregamento perpétua

### Requirement: Fixtures determinísticas de capitães e identidade de jogador
O repositório SHALL ser inicializado com partidas fictícias determinísticas de outros capitães, garantindo dados comparativos desde o primeiro acesso sem duplicatas em recargas subsequentes. A identidade do jogador local SHALL ser gerada na primeira visita com identificador UUID e nome legível no formato Captain-XXXX, operando estritamente no escopo do navegador local.

#### Scenario: Semeadura inicial determinística de fixtures sem duplicação
- **WHEN** a aplicação for aberta pela primeira vez em um navegador sem dados prévios
- **THEN** o store SHALL ser populado com fixtures predefinidas de capitães adversários, e recarregamentos posteriores não SHALL reinserir duplicatas

#### Scenario: Geração de identidade persistente Captain-XXXX
- **WHEN** um usuário acessar o jogo pela primeira vez sem identidade persistida
- **THEN** o sistema SHALL gerar e armazenar um UUID v4 estável e um nome legível no padrão `Captain-XXXX` onde XXXX é uma sequência de 4 caracteres alfanuméricos

#### Scenario: Escopo estritamente local sem backend compartilhado
- **WHEN** dados de ranking ou partidas forem visualizados pelo usuário
- **THEN** os registros SHALL refletir exclusivamente o armazenamento do navegador local e suas fixtures, sem pressupor infraestrutura multiplayer compartilhada
