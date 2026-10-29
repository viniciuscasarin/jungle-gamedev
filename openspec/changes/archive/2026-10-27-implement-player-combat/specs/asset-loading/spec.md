# Spec Delta

## MODIFIED Requirements

### Requirement: Catálogo visual verificado

O sistema SHALL disponibilizar um catálogo tipado de assets com papéis semânticos, arquivos e dimensões lógicas verificados para player, Chaser, Shooter, bala de canhão, água, ilhas e UI. IDs próximos SHALL não implicar sequência de animação ou dano sem verificação visual e documental.

#### Scenario: Identidades dos navios
- **WHEN** o catálogo é consultado
- **THEN** player corresponde a ship_5 de vela azul clara, Chaser a ship_3 de vela vermelha e Shooter a ship_8 de vela escura, todos dos PNGs default fornecidos
- **AND** o mapeamento registra dimensão 66×113 e orientação original para baixo

#### Scenario: Densidade e metadados
- **WHEN** uma textura possui variante retina ou metadados de layout
- **THEN** dimensões lógicas são distinguidas de pixels físicos e os retângulos/bordas lógicos da UI são preservados
- **AND** nenhuma variante é tratada como 2× somente por seu nome

#### Scenario: Bala fornecida
- **WHEN** a arena prepara os recursos necessários ao combate
- **THEN** o catálogo inclui assets/png/default/ship_parts/cannon_ball.png, esfera cinza transparente verificada de 10×10 pixels e unidades lógicas
- **AND** a bala participa do carregamento obrigatório, cache compartilhado e créditos com procedência e pendências reais
