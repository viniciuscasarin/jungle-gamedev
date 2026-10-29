# Spec Delta

## Purpose

Garante entrega confiável de resultados de partidas através do padrão Outbox persistido localmente, retentativas com backoff exponencial, recuperação idempotente pós-timeout e monitoramento de pendências na interface.

## ADDED Requirements

### Requirement: Persistência atômica da outbox pré-POST
Ao concluir uma partida, o resultado completo SHALL ser persistido atomicamente na fila outbox sob a chave pirate-battle.outbox.v1 antes de qualquer requisição de envio de rede. A outbox SHALL preservar incondicionalmente o matchId, o payload canônico e o carimbo de data original mesmo após recarregamentos de página ou falhas de conectividade.

#### Scenario: Salvamento pré-POST da partida concluída
- **WHEN** uma partida conclui por player_destroyed ou time_expired
- **THEN** o resultado completo é gravado na outbox antes de iniciar a mutação de rede
- **AND** a entrada inclui matchId, payload canônico, contador de tentativas zero e status pending

#### Scenario: Preservação da fila após refresh
- **WHEN** a página é recarregada enquanto há itens na outbox aguardando envio
- **THEN** os itens permanecem preservados no LocalStorage com os mesmos matchIds e payloads originais
- **AND** a fila é reidratada no carregamento da aplicação para processamento

### Requirement: Remoção exclusiva pós-confirmação e recuperação de timeout
Um registro da outbox SHALL ser removido exclusivamente após o recebimento de resposta de confirmação de registro bem-sucedida (HTTP 200 ou 201). Requisições com timeout ou respostas ambíguas SHALL manter a entrada na outbox para retentativa com o mesmo matchId e payload idêntico; a retentativa subsequente SHALL recuperar o registro existente sem duplicá-lo no ranking e histórico.

#### Scenario: Remoção bem-sucedida após confirmação
- **WHEN** a mutação POST /api/matches retorna status HTTP 200 ou 201 com o registro confirmado
- **THEN** o item correspondente ao matchId é removido da chave pirate-battle.outbox.v1
- **AND** as consultas de ranking e histórico são sinalizadas para invalidação

#### Scenario: Recuperação idempotente após timeout pós-commit
- **WHEN** o servidor processa o registro com sucesso mas a resposta sofre timeout antes do cliente
- **THEN** a entrada permanece na outbox com status failed
- **AND** o reenvio automático ou manual do mesmo payload recebe confirmação 200 e limpa a outbox sem duplicar o registro no store remoto

### Requirement: Retentativa com backoff exponencial e contenção de erros permanentes
Falhas transitórias de rede, indisponibilidade e erros HTTP 5xx na entrega do resultado SHALL disparar retentativas automáticas com backoff exponencial limitado a no máximo 3 tentativas. Erros de validação HTTP 400 ou conflitos de payload HTTP 409 SHALL interromper imediatamente retentativas automáticas e marcar a entrada com falha permanente e explicação legível sem entrar em loop infinito.

#### Scenario: Retentativa com backoff para falha transitória
- **WHEN** o envio falha por queda de rede ou erro HTTP 500
- **THEN** o serviço agenda nova tentativa aplicando backoff exponencial com intervalo crescente
- **AND** caso esgote 3 tentativas, o status é fixado em failed com exibição de Pending — Retry para ação manual

#### Scenario: Bloqueio imediato de loop para erro 400 e 409
- **WHEN** o servidor responde HTTP 400 por validação inválida ou HTTP 409 por conflito de payload
- **THEN** as retentativas automáticas são imediatamente canceladas e permanentFailure é registrado como true
- **AND** a mensagem explicativa do erro é exposta na interface sem disparar novas requisições em loop

### Requirement: Estados semânticos de entrega e isolamento visual
A interface de entrega do resultado SHALL refletir honestamente os estados Recording…, Recorded e Pending — Retry. A visualização de um resultado ativo SHALL ser estritamente isolada por matchId, de modo que respostas atrasadas ou retentativas de partidas anteriores SHALL não alterar o estado visual nem sobrescrever a tela da partida mais recente.

#### Scenario: Ciclo de estados visuais de entrega
- **WHEN** um resultado é finalizado, enviado e confirmado com sucesso
- **THEN** a tela exibe Recording… durante a requisição em trânsito
- **AND** transiciona para Recorded imediatamente após a confirmação HTTP 200/201

#### Scenario: Falha de entrega e reenvio manual
- **WHEN** a entrega remota falha após as tentativas automáticas
- **THEN** a tela exibe Pending — Retry acompanhado de um botão Retry
- **AND** acionar Retry dispara nova tentativa de envio para o mesmo matchId e payload

#### Scenario: Isolamento visual entre partidas independentes
- **WHEN** uma resposta de envio atrasada de uma partida anterior é concluída enquanto a tela exibe o resultado de uma nova partida
- **THEN** o estado visual e os indicadores da nova partida permanecem inalterados
- **AND** apenas o item da partida anterior é removido da outbox em segundo plano

### Requirement: Monitoramento e reenvio de pendências no Menu Principal
O Menu Principal SHALL inspecionar a outbox e exibir aviso semântico de partidas pendentes e botão para acionar reenvio quando houver uma ou mais entradas na fila. As pendências de partidas anteriores SHALL permanecer acessíveis e independentes após o jogador iniciar novas partidas.

#### Scenario: Exibição de aviso e botão de retry no menu
- **WHEN** a outbox contém uma ou mais partidas não confirmadas
- **THEN** o Menu Principal exibe um aviso indicando a quantidade de registros pendentes e um botão Retry Pending
- **AND** clicar em Retry Pending dispara o envio das entradas pendentes

#### Scenario: Independência de pendências anteriores durante nova partida
- **WHEN** o jogador possui registros pendentes de partidas passadas e inicia uma nova partida
- **THEN** as pendências anteriores são preservadas inalteradas na outbox
- **AND** ao retornar ao menu o aviso de pendências continua disponível para sincronização

### Requirement: Resiliência contra falhas de armazenamento e abandono
O abandono de partida ou cancelamento durante o carregamento SHALL nunca enfileirar entradas na outbox. Falhas de acesso ou cota no LocalStorage SHALL acionar fallback defensivo em memória com aviso legível ao usuário, sem impedir a conclusão da partida ou interromper a execução do combate.

#### Scenario: Abandono não enfileira na outbox
- **WHEN** o jogador confirma abandono de partida em andamento ou cancela a sessão em Loading
- **THEN** nenhuma entrada é criada na outbox e nenhuma requisição POST é disparada
- **AND** o Menu Principal permanece limpo sem pendências originadas da sessão abandonada

#### Scenario: Fallback gracioso com LocalStorage indisponível
- **WHEN** o LocalStorage lança erro de cota ou bloqueio de permissão durante o enfileiramento na outbox
- **THEN** a aplicação mantém a fila em memória e tenta a entrega via rede normalmente
- **AND** exibe aviso amigável de restrição de armazenamento local sem travar o jogo
