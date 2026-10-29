# Spec Delta

## MODIFIED Requirements

### Requirement: Arena composta com player autoritativo

A arena SHALL mostrar água, duas ilhas de litoral arredondado, player, inimigos vivos, alvos de diagnóstico e projéteis do mundo configurado (960×540 por padrão), usando assets fornecidos e a configuração capturada. Samples SHALL servir somente de referência visual. Navios SHALL manter proporções, posição e rumo autoritativos; player SHALL iniciar na posição e rumo capturados, por padrão em (480,270) apontando para cima.

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
- **THEN** os respectivos elementos visuais aparecem ou são descartados sem alterar saúde ou score no renderer
- **AND** consumo e morte não deixam entidades visuais ativas nem destroem texturas compartilhadas

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
