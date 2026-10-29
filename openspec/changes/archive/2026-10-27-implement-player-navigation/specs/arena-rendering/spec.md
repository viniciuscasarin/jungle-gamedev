# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Arena estática composta`
- TO: `### Requirement: Arena composta com player autoritativo`

## MODIFIED Requirements

### Requirement: Arena composta com player autoritativo

A arena SHALL mostrar água, duas ilhas de litoral arredondado e o navio player no mundo de 960×540 unidades, usando assets individuais fornecidos e geometria da configuração. Samples SHALL servir somente de referência visual. O navio SHALL manter proporções, iniciar em (480,270) apontando para cima e apresentar posição e rumo dos snapshots autoritativos.

#### Scenario: Carregamento concluído
- **WHEN** o carregamento e a inicialização gráfica concluem
- **THEN** a água ocupa o mundo, as ilhas ficam a noroeste e sudeste e o player aparece ao centro com vela azul clara
- **AND** somente a arena montada executa navegação, sem combate, spawns ou relógio de término de partida neste incremento

#### Scenario: Litoral e decoração
- **WHEN** o mapa é inspecionado junto à geometria documentada
- **THEN** a borda sólida acompanha areia visível dentro da tolerância registrada, inclusive nos cantos
- **AND** água decorativa e folhagem não acrescentam obstáculos implícitos

#### Scenario: Apresentação e propriedade do loop
- **WHEN** snapshots novos são produzidos e a arena passa por montagens e desmontagens repetidas
- **THEN** o navio apresenta o estado atual com no máximo um loop de apresentação por recurso montado
- **AND** nenhuma inicialização tardia ou recurso desmontado mantém loop ou input ativo
