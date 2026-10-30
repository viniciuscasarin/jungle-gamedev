# Spec Delta

## ADDED Requirements

### Requirement: Contratos puros de terreno procedural

Os contratos SHALL representar regiões e instâncias de ilhas com IDs estáveis, coordenadas assinadas, modelo, dimensões e contornos sólidos em dados profundamente readonly. Consultas de terreno SHALL depender somente da configuração versionada, seed e área solicitada, sem objetos gráficos, relógio, rede ou armazenamento.

#### Scenario: Consumidor independente da apresentação
- **WHEN** um consumidor sem DOM solicita terreno para uma área com coordenadas negativas
- **THEN** obtém dados suficientes para colisão, navegação, spawn e composição visual sem inicializar o jogo ou o renderer
- **AND** os mesmos IDs e contornos são usados por todos os consumidores

#### Scenario: Região anterior preservada
- **WHEN** um consumidor guarda dados de uma região e o cache é liberado ou outras regiões são consultadas
- **THEN** o valor guardado conserva seus dados e impede mutação aninhada
- **AND** reconstruir a região produz conteúdo equivalente sem exigir identidade de objeto

### Requirement: Separação entre descritor de mundo e estado materializado

Preparação e resultado SHALL conservar configuração finita do gerador e seed separada, sem incluir regiões visitadas ou caches no contrato persistido. Consultas ou inspeções SHALL não avançar passos, consumir RNG de gameplay, emitir eventos nem oferecer comandos de alteração do terreno.

#### Scenario: Inspeção e persistência após exploração
- **WHEN** muitas regiões são consultadas e um resultado é materializado
- **THEN** configuração e seed bastam para reproduzir o terreno e o resultado não cresce com o percurso
- **AND** consultas extras não mudam snapshots, eventos ou resultado para a mesma sequência de inputs por passo
