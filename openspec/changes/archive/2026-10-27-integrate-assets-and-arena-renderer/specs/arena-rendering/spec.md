# Spec Delta

## Purpose

Apresentar o mapa estático com os assets fornecidos e preservar uma correspondência testável entre coordenadas lógicas e tela em diferentes tamanhos e densidades.

## ADDED Requirements

### Requirement: Arena estática composta

A arena SHALL mostrar água, duas ilhas de litoral arredondado e o navio player no mundo de 960×540 unidades, usando assets individuais fornecidos e geometria da configuração. Samples SHALL servir somente de referência visual. O navio SHALL manter proporções e iniciar em (480,270), apontando para cima.

#### Scenario: Carregamento concluído
- **WHEN** o carregamento e a inicialização gráfica concluem
- **THEN** a água ocupa o mundo, as ilhas ficam a noroeste e sudeste e o player aparece ao centro com vela azul clara
- **AND** a cena não executa movimento, combate, spawns ou relógio de partida

#### Scenario: Litoral e decoração
- **WHEN** o mapa é inspecionado junto à geometria documentada
- **THEN** a borda sólida acompanha areia visível dentro da tolerância registrada, inclusive nos cantos
- **AND** água decorativa e folhagem não acrescentam obstáculos implícitos

### Requirement: Mundo completo sem distorção

O enquadramento SHALL exibir o mundo inteiro com uma escala uniforme, centralização e letterbox quando necessário. SHALL reservar faixas superiores e inferiores para HUD/controles, respeitar safe areas e manter conteúdo e ações legíveis a partir de 320 CSS pixels, em portrait e landscape.

#### Scenario: Redimensionamento e rotação
- **WHEN** o host muda de tamanho ou orientação
- **THEN** o mundo permanece inteiro, os tiles continuam quadrados e os navios mantêm a razão de aspecto
- **AND** posições lógicas não mudam nem a arena é coberta pelas faixas reservadas

### Requirement: Transformações reversíveis de coordenadas

O sistema SHALL disponibilizar transformações puras mundo↔tela baseadas na área útil, escala e offsets correntes. Coordenadas de tela SHALL usar CSS pixels relativos ao host, com origem e letterbox explícitos. Host sem área útil SHALL produzir estado não renderizável sem NaN ou divisão por zero.

#### Scenario: Ida e volta após resize
- **WHEN** centro e cantos do mundo são convertidos para tela e de volta antes e depois de resize
- **THEN** as coordenadas originais são recuperadas dentro da tolerância numérica documentada
- **AND** os offsets refletem a centralização e as faixas reservadas

#### Scenario: Área temporariamente vazia
- **WHEN** a área útil tem largura ou altura zero
- **THEN** nenhum transform inválido é consumido e a renderização pode retomar quando houver espaço

### Requirement: Densidade independente do mundo

A renderização SHALL adaptar seu buffer ao DPR atual e ao tamanho CSS sem alterar coordenadas lógicas ou a transformação em CSS pixels. Mudanças de DPR SHALL ser detectadas mesmo quando o tamanho CSS permanece igual.

#### Scenario: Outro monitor ou zoom
- **WHEN** o DPR muda com o mesmo tamanho de host
- **THEN** o buffer é atualizado para a densidade corrente e o player mantém a mesma posição CSS e lógica
- **AND** nenhum canvas adicional é criado
