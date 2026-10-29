# Spec Delta

## MODIFIED Requirements

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


