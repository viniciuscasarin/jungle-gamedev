# arena-rendering Specification

## Purpose

Apresentar o mapa estático com os assets fornecidos e preservar uma correspondência testável entre coordenadas lógicas e tela em diferentes tamanhos e densidades.

## Requirements

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

### Requirement: Mundo completo sem distorção

O enquadramento SHALL exibir o mundo inteiro com escala uniforme, centralização e letterbox quando necessário. SHALL reservar faixas superiores e inferiores correspondentes ao HUD/controles reais do modo corrente, respeitar safe areas uma única vez e manter conteúdo e ações legíveis a partir de 320 CSS pixels, em portrait e landscape. Alterações dessas faixas SHALL atualizar o enquadramento mesmo sem resize do host.

#### Scenario: Redimensionamento e rotação
- **WHEN** o host muda de tamanho ou orientação
- **THEN** o mundo permanece inteiro, os tiles continuam quadrados e os navios mantêm a razão de aspecto
- **AND** posições lógicas não mudam nem a arena é coberta pelas faixas reservadas

#### Scenario: HUD muda no mesmo host
- **WHEN** uma troca de modo ou reorganização do grupo de skills modifica as faixas ocupadas sem alterar o tamanho externo
- **THEN** a arena se ajusta à área livre efetiva sem sobrepor os controles ou reiniciar a simulação
- **AND** o mesmo enquadramento em CSS pixels serve à apresentação e à conversão de coordenadas de input

#### Scenario: Insets seguros e área temporariamente pequena
- **WHEN** existem safe areas não nulas ou a área útil fica temporariamente vazia
- **THEN** os insets não são aplicados duas vezes e nenhuma transformação inválida é consumida
- **AND** o enquadramento retoma quando houver área útil, preservando estado e configuração

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

### Requirement: Saúde sobre todos os navios vivos

Cada navio vivo SHALL ter barra de saúde horizontal sobre sua posição na arena PixiJS, sem herdar a rotação do casco. Preenchimento SHALL refletir saúde atual/máxima do estado autoritativo. As barras SHALL permanecer legíveis em 320 CSS px e dentro dos limites visíveis, acompanhar movimento e desaparecer na morte ou descarte.

#### Scenario: Player e arquétipos danificados
- **WHEN** player, Chaser e Shooter vivos recebem dano real de projéteis ou contato válido e giram ou se movem
- **THEN** suas barras acompanham a posição, reduzem proporcionalmente e permanecem horizontais
- **AND** a barra do player permanece sobre o navio mesmo com vida também apresentada no HUD

#### Scenario: Pausa, limites e morte
- **WHEN** navios se aproximam das bordas, a partida pausa, ocorre resize ou um navio chega a zero de vida
- **THEN** barras vivas permanecem contidas e coerentes com o estado congelado ou reapresentado; a barra do navio morto é removida
- **AND** saída da arena libera recursos próprios das barras sem destruir texturas compartilhadas ou deixar outro loop ativo

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

### Requirement: Modulação visual de estado do casco
A representação gráfica de cada navio vivo SHALL refletir visualmente sua integridade autoritativa em três faixas: *healthy* (saúde >60%), *damaged* (>25% até 60%, exibindo tonalidade de desgaste no casco) e *critical* (≤25%, exibindo escurecimento e animação contínua de chamas sobre o mastro/deck). As modulações visuais SHALL preservar inalterados os limites de colisão e a leitura das velas.

#### Scenario: Transições visuais de avaria
- **WHEN** o navio transita de integridade plena para faixa entre 25% e 60%
- **THEN** o casco recebe modulação visual de desgaste mantendo o colisor idêntico

#### Scenario: Chamas ativas em estado crítico
- **WHEN** a saúde de uma embarcação viva está em 25% ou menos
- **THEN** partículas ou sprites animados de fogo são renderizados continuamente sobre o deck
- **AND** a animação de chamas é removida no momento da destruição final

### Requirement: Congelamento visual e conformidade com reduced-motion
Todas as animações de partículas, clarões, explosões e afundamento SHALL congelar completamente durante o estado pausado da partida. Sob preferência do sistema por movimento reduzido (`prefers-reduced-motion: reduce`), o renderizador SHALL desativar tremores de tela (*screen shake*), suprimir efeitos estroboscópicos e reduzir a quantidade de partículas, preservando integralmente o determinismo e as regras da simulação.

#### Scenario: Efeitos congelados na pausa
- **WHEN** a partida entra em estado pausado enquanto partículas de explosão e detritos estão ativas
- **THEN** as posições, rotações e transparências de todas as partículas congelam no frame exato da pausa
- **AND** nenhum efeito avança até a retomada

#### Scenario: Respeito a prefers-reduced-motion
- **WHEN** a preferência por redução de movimento está ativa no sistema do usuário
- **THEN** tremores de tela são desativados e explosões utilizam transição estática de desvanecimento
- **AND** as trajetórias, velocidades e regras autoritativas dos navios permanecem inalteradas
