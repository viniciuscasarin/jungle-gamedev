# Spec Delta

## MODIFIED Requirements

### Requirement: Catálogo visual verificado

O sistema SHALL disponibilizar um catálogo tipado de assets com papéis semânticos, arquivos e dimensões lógicas verificados para player, Chaser, Shooter, bala de canhão, água, ilhas e UI, incluindo os estados fornecidos usados pelos controles de menu. IDs próximos SHALL não implicar sequência de animação ou dano sem verificação visual e documental.

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

#### Scenario: Estados reais dos controles de menu
- **WHEN** controles primários e secundários são desenhados no menu ou Options
- **THEN** primários usam normal, hover, pressed e disabled verificados; secundários usam normal e pressed fornecidos, com foco visível e sem herdar imagens primárias
- **AND** o layout respeita retângulos de conteúdo e label, âncoras e bordas em unidades lógicas 1×, inclusive com textura retina; painéis de altura variável preservam bordas sem esticar toda a arte

## ADDED Requirements

### Requirement: Recursos decorativos DOM independentes da arena

Recursos usados exclusivamente na decoração DOM de menu e Options SHALL não ampliar a carga obrigatória que determina a prontidão da arena. A indisponibilidade de uma nova imagem decorativa SHALL conservar texto, controles e foco utilizáveis, sem impedir Play por uma dependência gráfica alheia ao combate.

#### Scenario: Imagem de menu indisponível
- **WHEN** uma nova imagem exclusiva DOM não carrega e os assets obrigatórios da arena estão disponíveis
- **THEN** controles e conteúdo continuam legíveis e Play pode completar a preparação da arena
- **AND** a imagem decorativa ausente não é reportada como falha de asset obrigatório do combate
