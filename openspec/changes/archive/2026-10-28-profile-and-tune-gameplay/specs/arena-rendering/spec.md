# Spec Delta

## MODIFIED Requirements

### Requirement: Arena composta com player autoritativo

A arena SHALL mostrar água, ilhas de litoral arredondado, player, inimigos vivos, alvos de diagnóstico e projéteis do mundo configurado (960×540 por padrão), usando assets e configuração capturada. Samples SHALL servir de referência visual. Navios e player SHALL manter proporções, posição e rumo autoritativos; player inicia em (480,270) para cima. Projéteis efêmeros SHALL usar object pooling mitigando alocação e destruição de nós.

#### Scenario: Carregamento concluído
- **WHEN** o carregamento e a inicialização gráfica da configuração padrão concluem
- **THEN** a água ocupa o mundo, as ilhas ficam a noroeste e sudeste e o player aparece ao centro com vela azul clara
- **AND** a arena montada executa navegação, combate, IA e diretor somente durante Playing, com término autoritativo e apresentação congelada em Paused ou completed

#### Scenario: Litoral e decoração
- **WHEN** o mapa é inspecionado junto à geometria documentada
- **THEN** a borda sólida acompanha areia visível dentro da tolerância registrada, inclusive nos cantos
- **AND** água decorativa e folhagem não acrescentam obstáculos implícitos

#### Scenario: Apresentação e propriedade do loop
- **WHEN** snapshots novos são produzidos e a arena passa por montagens e desmontagens repetidas
- **THEN** os navios e projéteis apresentam o estado atual com no máximo um loop de apresentação por recurso montado
- **AND** nenhuma inicialização tardia ou recurso desmontado mantém loop ou input ativo

#### Scenario: Entidades dinâmicas e descarte
- **WHEN** o snapshot acrescenta ou remove projéteis, inimigos autônomos ou alvos do cenário opt-in
- **THEN** os respectivos elementos visuais aparecem ou são desativados e reciclados no pool sem alterar saúde ou score no renderer
- **AND** consumo, impacto ou término da partida desativam as entidades visuais e retornam sprites de projéteis ao pool sem destruir texturas compartilhadas

#### Scenario: Telegraph de reserva
- **WHEN** o snapshot contém uma reserva ativa de spawn
- **THEN** um anel visível de água marca sua posição e progresso autoritativos antes do inimigo aparecer
- **AND** congelamento conserva o progresso visual; cancelamento, materialização ou saída remove o anel sem deixar recursos órfãos

#### Scenario: Identidades autônomas
- **WHEN** Chaser e Shooter aparecem no fluxo normal
- **THEN** usam respectivamente vela vermelha e escura do catálogo existente e apresentam rumo e posição do snapshot
- **AND** o renderer não escolhe candidatos, calcula rotas nem decide disparos ou dano

#### Scenario: Configuração capturada em toda a apresentação
- **WHEN** a preparação usa geometria, posição inicial, raios ou opções diferentes dos defaults
- **THEN** mapa, player, entidades, telegraphs, diagnósticos, viewport e conversão de input usam a mesma configuração capturada da simulação
- **AND** resize e reapresentação conservam estado e configuração, sem executar regras nem reconsumir término

### Requirement: Efeitos visuais de combate
A arena PixiJS SHALL renderizar feedback tátil em combate com clarões (*muzzle flash*), partículas de madeira (`wood_1..4.png`), explosão em 3 frames (`explosion_1..3.png`), desvanecimento de naufrágio e indicador "+1" ao abater inimigos. Efeitos pós-morte SHALL ser cosméticos, sem colisão e sem pontuação extra. Partículas visuais e textos flutuantes SHALL utilizar object pooling para reciclagem de nós e mitigação de pausas de GC.

#### Scenario: Disparos com muzzle flash
- **WHEN** o jogador ou inimigo Shooter realiza um disparo frontal ou lateral
- **THEN** uma animação curta de clarão surge na posição dos canhões correspondentes alinhada à direção do tiro reaproveitando instâncias do pool
- **AND** o efeito não obstrui a leitura da trajetória do projétil

#### Scenario: Impactos no casco com detritos
- **WHEN** um navio recebe dano por projétil ou colisão
- **THEN** partículas de fragmentos de madeira gerenciadas por pool são projetadas radialmente a partir do ponto de impacto com rotação e desvanecimento rápido
- **AND** as partículas são desativadas e devolvidas ao pool ao completarem sua animação

#### Scenario: Destruição com explosão, detritos e fade de naufrágio
- **WHEN** um navio atinge integridade zero ou sofre colisão fatal
- **THEN** uma sequência de explosão de 3 frames é exibida com dispersão de detritos maiores
- **AND** o casco derrotado submerge com desvanecimento gradual de transparência sem interagir com novos tiros

#### Scenario: Indicador flutuante de pontuação
- **WHEN** uma embarcação inimiga é destruída conferindo ponto ao jogador
- **THEN** um indicador de texto "+1" obtido do pool surge sobre a posição da embarcação e flutua verticalmente com fade-out
- **AND** o nó de texto retorna ao pool após o término do fade
