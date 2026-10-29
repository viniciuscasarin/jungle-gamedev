# Spec Delta

## Purpose

Estabelecer contratos de dados independentes de plataforma para conectar input, simulação e apresentação sem transferir regras de jogo para a interface.

## ADDED Requirements

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

Os contratos SHALL expor snapshots e eventos somente com dados tipados e readonly, incluindo índice do passo e tempo ativo explícito. SHALL não depender de frameworks, canvas, DOM, HTTP, armazenamento ou relógio global para serem importados e utilizados.

#### Scenario: Consumidor sem navegador
- **WHEN** um teste executado sem DOM importa os contratos e constrói um snapshot e um evento válidos
- **THEN** pode inspecionar estado e tempo ativo sem inicializar renderer, rede ou relógio do sistema

#### Scenario: Eventos discriminados
- **WHEN** um consumidor recebe um evento de dano, destruição, pontuação ou término
- **THEN** pode identificar seu tipo e payload sem referências a objetos gráficos ou callbacks

### Requirement: Resultado completo imutável

O contrato de resultado SHALL conter matchId, playerId, playerName, completedAt UTC, score inteiro, activeDurationMs, endReason, configuration completa, configurationKey e seed. SHALL ser profundamente readonly e preservar valores capturados ao ser materializado para consumo.

#### Scenario: Construção de resultado de referência
- **WHEN** um teste materializa um resultado completo com configuration e seed separados
- **THEN** todos os campos obrigatórios são preservados, o motivo é player_destroyed ou time_expired e a duração explicita milissegundos ativos
- **AND** a cópia imutável não muda se os dados de origem forem editados

#### Scenario: Campos ausentes ou alteração de resultado
- **WHEN** um consumidor TypeScript omite um campo obrigatório ou tenta escrever em um resultado aninhado
- **THEN** a verificação estática rejeita o uso

### Requirement: Contratos sem execução antecipada de mecânicas

A fundação SHALL disponibilizar os contratos sem iniciar partida, simular combate, gerar resultado real, persistir dados ou chamar APIs. Configuração e contratos SHALL poder ser usados sem montar a interface.

#### Scenario: Importação isolada
- **WHEN** um consumidor importa configuração e contratos no ambiente de testes
- **THEN** nenhum loop, pedido de rede, leitura de armazenamento ou registro de resultado é iniciado
