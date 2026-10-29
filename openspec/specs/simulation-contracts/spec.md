# simulation-contracts Specification

## Purpose

Estabelecer contratos de dados independentes de plataforma para conectar input, simulação e apresentação sem transferir regras de jogo para a interface.

## Requirements

### Requirement: Entrada normalizada por passo

O contrato de entrada SHALL representar direção desejada ou alvo no mundo lógico, solicitação de movimento, estados mantidos das três armas e bordas de alternância de auto-sail e pausa. SHALL aceitar ausência de alvo inicial e estado neutro, sem eventos nativos de plataforma.

#### Scenario: Comandos simultâneos
- **WHEN** o adaptador representa direção, movimento e três ataques mantidos no mesmo passo
- **THEN** todos os comandos coexistem no contrato sem exclusão mútua
- **AND** auto-sail e pausa são comandos de borda distintos dos ataques mantidos

#### Scenario: Entrada neutra
- **WHEN** não há alvo válido nem ações do usuário
- **THEN** o contrato representa ausência de direção e nenhum comando ativo sem inventar coordenadas

### Requirement: Estado e eventos independentes da apresentação

Os contratos SHALL expor snapshots e eventos somente com dados tipados e readonly, incluindo índice do passo e tempo ativo explícito. Projéteis SHALL ter autoria estável e dados suficientes para reproduzir direção, facção, dano e vida restante. Eventos de simulação SHALL discriminar dano, destruição, pontuação, término, disparos de armas e impactos de projéteis na água. SHALL não depender de frameworks, canvas, DOM, HTTP, armazenamento ou relógio global para serem importados e utilizados.

#### Scenario: Consumidor sem navegador
- **WHEN** um teste executado sem DOM importa os contratos e constrói um snapshot e um evento válidos
- **THEN** pode inspecionar estado e tempo ativo sem inicializar renderer, rede ou relógio do sistema

#### Scenario: Eventos discriminados
- **WHEN** um consumidor recebe um evento de dano, destruição, pontuação ou término
- **THEN** pode identificar seu tipo e payload sem referências a objetos gráficos ou callbacks
- **AND** dano e destruição preservam a autoria mesmo depois de removido o emissor

#### Scenario: Projétil independente do emissor
- **WHEN** uma bala sobrevive à destruição do navio que a disparou
- **THEN** seus dados autoritativos continuam definindo trajetória, alvos válidos, dano e expiração sem consultar um navio vivo

#### Scenario: Eventos de disparo e impacto na água
- **WHEN** canhões disparam ou um projétil expira na água sem atingir navios ou terra
- **THEN** a simulação emite respectivamente eventos puros de tipo 'fire' e 'water_hit'
- **AND** os eventos fornecem coordenadas lógicas e rumo sem acoplamento a bibliotecas gráficas ou de áudio

### Requirement: Resultado completo imutável

O contrato de resultado SHALL conter matchId, playerId, playerName, completedAt UTC, score inteiro, activeDurationMs, endReason, configuration completa, configurationKey e seed. SHALL ser profundamente readonly e preservar valores capturados ao ser materializado para consumo.

#### Scenario: Construção de resultado de referência
- **WHEN** um teste materializa um resultado completo com configuration e seed separados
- **THEN** todos os campos obrigatórios são preservados, o motivo é player_destroyed ou time_expired e a duração explicita milissegundos ativos
- **AND** a cópia imutável não muda se os dados de origem forem editados

#### Scenario: Campos ausentes ou alteração de resultado
- **WHEN** um consumidor TypeScript omite um campo obrigatório ou tenta escrever em um resultado aninhado
- **THEN** a verificação estática rejeita o uso


#### Scenario: Materialização da conclusão autoritativa
- **WHEN** a sessão recebe a conclusão de um passo real com metadados explícitos
- **THEN** o resultado usa o mesmo score, motivo, duração ativa, configuração e seed da execução
- **AND** identidade e data são fornecidas pela fronteira de sessão, sem relógio ou aleatoriedade global nos contratos

### Requirement: Contratos sem execução antecipada de mecânicas

Importar contratos e configuração SHALL não iniciar partida, simular combate, materializar resultado, acessar storage ou chamar APIs. Consumidores explícitos SHALL poder preparar, executar e concluir partidas usando esses dados puros sem montar a interface; efeitos de plataforma SHALL permanecer na fronteira de sessão.

#### Scenario: Importação isolada
- **WHEN** um consumidor importa configuração e contratos no ambiente de testes
- **THEN** nenhum loop, pedido de rede, leitura de armazenamento ou registro de resultado é iniciado

### Requirement: Dados iniciais opcionais sem mutação posterior

A preparação SHALL aceitar dados iniciais puros e imutáveis de entidades e projéteis com IDs únicos, reutilizando os contratos de combate. A ausência desses dados SHALL produzir o estado normal com IA e diretor. Diagnóstico estacionário SHALL ser seleção explícita independente da presença de dados. O consumidor SHALL não ganhar comandos de teleporte, dano, morte ou score depois da inicialização.

#### Scenario: Captura e isolamento
- **WHEN** o consumidor fornece dados iniciais e depois modifica seus objetos de origem
- **THEN** a simulação preserva a captura original e seus snapshots somente leitura
- **AND** os resultados seguintes derivam de passos, inputs e regras, sem callbacks de sucesso

#### Scenario: Dados iniciais com comportamento normal
- **WHEN** um teste inicializa inimigos sem selecionar explicitamente o modo estacionário
- **THEN** continuam sujeitos à IA e ao diretor normais
- **AND** somente a seleção explícita de alvos estacionários desativa ambos para esse diagnóstico

### Requirement: Reservas de spawn como dados de apresentação

Snapshots SHALL disponibilizar reservas de spawn profundamente readonly com ID, posição, arquétipo e tempo ativo suficiente para apresentar seu progresso. Reservas SHALL não ser navios vivos nem conceder dano, colisão ou score. Inspeção SHALL não fornecer comandos para materializar inimigos ou alterar prazos.

#### Scenario: Aviso independente do renderer
- **WHEN** um consumidor sem DOM executa até uma oportunidade de spawn
- **THEN** consegue inspecionar a reserva e tempo restante sem inicializar apresentação
- **AND** guardar esse snapshot preserva seus valores após materialização ou cancelamento posterior
