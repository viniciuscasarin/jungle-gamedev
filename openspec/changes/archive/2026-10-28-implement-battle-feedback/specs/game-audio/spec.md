# Spec Delta

## Purpose

Prover o subsistema sonoro do jogo com reprodução orientada a eventos, polifonia controlada, priorização de alertas críticos, transições de limiar único, controle de mute e ausência de backlog acústico no ciclo de vida da partida.

## ADDED Requirements

### Requirement: Desbloqueio e ciclo de vida do subsistema de áudio
O subsistema de áudio SHALL utilizar a Web Audio API com desbloqueio exclusivo acionado após gesto do usuário (clique, toque ou tecla). Caso a API não esteja disponível no ambiente de execução, o subsistema SHALL ativar um adaptador nulo (*no-op*) sem lançar exceções.

#### Scenario: Primeiro gesto do usuário desbloqueia áudio
- **WHEN** o usuário interage pela primeira vez com qualquer controle da aplicação (clique, toque ou tecla)
- **THEN** o contexto de áudio transita para o estado desbloqueado e ativo
- **AND** nenhum som é emitido antes dessa primeira interação

#### Scenario: Ambiente sem suporte a Web Audio
- **WHEN** a aplicação executa em ambiente sem suporte a `AudioContext` (como testes automatizados)
- **THEN** as chamadas de reprodução e controle de áudio operam em modo silencioso sem falhar

### Requirement: Polifonia controlada e prioridade de vozes
A reprodução de efeitos sonoros transitórios SHALL limitar a concorrência a no máximo 4 vozes simultâneas, adotando algoritmo de substituição (*voice stealing*) que encerra a voz mais antiga de menor prioridade quando o limite for atingido. Alertas críticos de saúde, tempo e fim de partida SHALL possuir prioridade máxima e nunca ser descartados em favor de disparos ou impactos.

#### Scenario: Limite de vozes simultâneas atingido
- **WHEN** mais de 4 disparos ou impactos requisitam reprodução concorrente
- **THEN** a emissão mais antiga de menor prioridade é interrompida suavemente
- **AND** o novo efeito é reproduzido sem saturação ou corte abrupto

#### Scenario: Prioridade incondicional de alertas críticos
- **WHEN** um aviso de vida crítica ou contagem final coincide com rajadas de canhão ou impactos na água
- **THEN** o alerta crítico é executado integralmente sem ser descartado ou suprimido pelas vozes de disparo

### Requirement: Sentinelas de transição de limiar acústico
Os alertas sonoros de saúde crítica (≤25% de HP) e de contagem regressiva final (10 segundos restantes) SHALL ser executados exatamente uma única vez por partida no momento da transição do limiar correspondente, sem repetição contínua enquanto o estado persistir.

#### Scenario: Transição para saúde crítica
- **WHEN** a integridade do navio do jogador cruza o limiar de superior a 25% para 25% ou menos
- **THEN** o efeito sonoro de alerta de saúde baixa é disparado exatamente uma vez
- **AND** danos subsequentes mantendo a vida abaixo de 25% não repetem o alerta

#### Scenario: Transição para os 10 segundos finais
- **WHEN** o cronômetro ativo da partida atinge ou cruza pela primeira vez o limiar de 10 segundos restantes
- **THEN** o efeito sonoro de aviso de tempo é disparado exatamente uma vez
- **AND** a passagem dos segundos subsequentes não dispara novos alertas de tempo

### Requirement: Controle de mute e persistência
O sistema SHALL disponibilizar controle de mute que silencia imediatamente todo o áudio do jogo através de nó de atenuação principal (master gain). O estado de silenciamento SHALL ser persistido no armazenamento local do navegador e restaurado na inicialização da aplicação.

#### Scenario: Silenciamento imediato via mute
- **WHEN** o usuário aciona o controle de mute no HUD ou nas Opções
- **THEN** todos os sons em reprodução e futuros efeitos são atenuados a zero
- **AND** a preferência de áudio mudo é salva no armazenamento local

#### Scenario: Restauração da preferência salva
- **WHEN** a aplicação é carregada com preferência persistida de mute ativo
- **THEN** o subsistema de áudio inicia com o ganho principal zerado sem emitir som

### Requirement: Coordenação acústica no ciclo de vida e pausa
A transição para o estado pausado SHALL silenciar loops contínuos de navegação e reproduzir o som de pausa. O subsistema SHALL descartar qualquer fila ou backlog de sons acumulados durante a pausa, garantindo que a retomada (*resume*) não dispare efeitos retroativos atrasados.

#### Scenario: Pausa interrompe loops e toca jingle
- **WHEN** a partida entra em estado pausado
- **THEN** os sons de navegação e ambiente em loop são pausados imediatamente
- **AND** o som de pausa é reproduzido

#### Scenario: Retomada sem backlog acústico
- **WHEN** a partida é retomada após período em pausa
- **THEN** o som de retomada é emitido
- **AND** nenhum som de disparo, dano ou impacto ocorrido antes ou acumulado durante a pausa é reproduzido
