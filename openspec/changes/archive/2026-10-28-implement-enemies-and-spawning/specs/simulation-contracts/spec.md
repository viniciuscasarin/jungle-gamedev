# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Reservas de spawn como dados de apresentação

Snapshots SHALL disponibilizar reservas de spawn profundamente readonly com ID, posição, arquétipo e tempo ativo suficiente para apresentar seu progresso. Reservas SHALL não ser navios vivos nem conceder dano, colisão ou score. Inspeção SHALL não fornecer comandos para materializar inimigos ou alterar prazos.

#### Scenario: Aviso independente do renderer
- **WHEN** um consumidor sem DOM executa até uma oportunidade de spawn
- **THEN** consegue inspecionar a reserva e tempo restante sem inicializar apresentação
- **AND** guardar esse snapshot preserva seus valores após materialização ou cancelamento posterior
