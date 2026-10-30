# arena-rendering Specification

## Purpose

Apresentar o mapa estático com os assets fornecidos e preservar uma correspondência testável entre coordenadas lógicas e tela em diferentes tamanhos e densidades.

## Requirements

### Requirement: Arena composta com player autoritativo

A arena SHALL mostrar água contínua, ilhas procedurais, player, inimigos, alvos de diagnóstico e projéteis usando a configuração capturada e o terreno autoritativo. Player SHALL iniciar em (480,270) para cima; navios SHALL preservar proporções, posições e rumos. A apresentação SHALL acompanhar a região visível, reciclando recursos sem alterar gameplay; projéteis efêmeros SHALL usar pooling.

#### Scenario: Carregamento concluído
- **WHEN** o carregamento e a inicialização gráfica da configuração padrão concluem
- **THEN** a água preenche a tela e o player aparece na área central com vela azul clara e terreno inicial seguro
- **AND** a arena executa navegação, combate, IA e diretor somente durante Playing, com término autoritativo e apresentação congelada em Paused ou completed

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
- **THEN** os elementos visuais visíveis aparecem ou são reciclados sem alterar saúde ou score no renderer
- **AND** consumo, impacto ou término desativam os sprites de projéteis sem destruir texturas compartilhadas
- **AND** sair do campo de visão somente oculta a apresentação da entidade, preservando sua existência autoritativa

#### Scenario: Telegraph de reserva
- **WHEN** uma reserva ativa de spawn está dentro do campo de visão
- **THEN** um anel de água marca sua posição e progresso autoritativos antes de o inimigo aparecer
- **AND** congelamento conserva o progresso; cancelamento, materialização ou saída remove o anel sem recursos órfãos
- **AND** reservas fora da tela continuam sujeitas aos mesmos prazos e regras

#### Scenario: Identidades autônomas
- **WHEN** Chaser e Shooter aparecem no fluxo normal
- **THEN** usam respectivamente vela vermelha e escura do catálogo existente e apresentam rumo e posição do snapshot
- **AND** o renderer não escolhe candidatos, calcula rotas nem decide disparos ou dano

#### Scenario: Configuração capturada em toda a apresentação
- **WHEN** a preparação usa catálogo, posição inicial, raios ou opções diferentes dos defaults
- **THEN** terreno, entidades, telegraphs, diagnósticos e conversão de input usam a mesma configuração e seed capturadas da simulação
- **AND** resize e reapresentação conservam estado e configuração, sem executar regras nem reconsumir término

#### Scenario: Travessia e reconstrução visual
- **WHEN** a câmera cruza regiões e depois revisita terreno já liberado
- **THEN** o cenário aparece preparado antes de entrar na tela, sem buracos, cortes ou duplicação de ilhas
- **AND** a textura da água mantém continuidade espacial e as ilhas reconstruídas conservam suas posições e modelos

### Requirement: Transformações reversíveis de coordenadas

O sistema SHALL fornecer transformações puras mundo/tela baseadas na posição corrente da câmera, escala uniforme e origem do host em CSS pixels. As transformações SHALL aceitar coordenadas assinadas e não depender do DPR. Host sem área útil SHALL produzir estado não renderizável sem NaN ou divisão por zero.

#### Scenario: Ida e volta após resize
- **WHEN** pontos visíveis do mundo são convertidos para tela e de volta antes e depois de resize ou deslocamento da câmera
- **THEN** as coordenadas originais são recuperadas dentro da tolerância numérica documentada
- **AND** os offsets refletem a câmera e a área central livre dos controles

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

Cada navio vivo visível SHALL ter barra de saúde horizontal sobre sua posição, sem herdar rotação do casco. Preenchimento SHALL refletir o estado autoritativo e ser legível a partir de 320 CSS px. Barras SHALL acompanhar a câmera, permanecer dentro da tela quando seu navio estiver visível e desaparecer com morte, descarte visual ou saída do campo de visão.

#### Scenario: Player e arquétipos danificados
- **WHEN** player, Chaser e Shooter visíveis recebem dano real e giram ou se movem
- **THEN** suas barras acompanham posição e câmera, reduzem proporcionalmente e permanecem horizontais
- **AND** a barra do player permanece sobre o navio mesmo com vida também apresentada no HUD

#### Scenario: Pausa, limites e morte
- **WHEN** navios se aproximam das bordas da tela, a partida pausa, ocorre resize ou um navio chega a zero de vida
- **THEN** barras visíveis permanecem contidas e coerentes com o estado congelado ou reapresentado; barras de navios mortos ou fora da tela são removidas
- **AND** saída libera recursos próprios sem destruir texturas compartilhadas ou deixar outro loop ativo

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

### Requirement: Câmera de acompanhamento sem distorção

A câmera SHALL acompanhar o player na área central livre do HUD, preservando proporções e preenchendo todo o host com cenário sob os controles, sem letterbox. Resize e mudanças do HUD SHALL atualizar o enquadramento sem alterar o mundo. Mobile SHALL manter landscape obrigatório e exigir Resume após retorno de portrait.

#### Scenario: Redimensionamento e rotação
- **WHEN** o host muda de tamanho ou orientação
- **THEN** nas orientações permitidas o cenário continua preenchendo a tela, tiles e navios preservam proporções e o player permanece na área central livre dos controles
- **AND** posições lógicas não mudam; portrait mobile congela a partida sob a proteção de orientação

#### Scenario: HUD muda no mesmo host
- **WHEN** troca de modo ou reorganização de skills modifica as áreas ocupadas sem alterar o host
- **THEN** a área de acompanhamento é atualizada sem reiniciar a simulação ou deixar bandas vazias
- **AND** apresentação e input usam a mesma transformação corrente em CSS pixels

#### Scenario: Insets seguros e área temporariamente pequena
- **WHEN** existem safe areas não nulas ou a área central fica temporariamente vazia
- **THEN** insets não são aplicados duas vezes e nenhuma transformação inválida é consumida
- **AND** a apresentação retoma ao haver espaço sem alterar a partida

#### Scenario: Retorno de portrait mobile
- **WHEN** o aparelho retorna a landscape após a proteção de orientação
- **THEN** a câmera usa a área atual e preserva partida e configuração, sem canvas ou loop duplicado
- **AND** o mundo permanece congelado até Resume explícito, com transformação atualizada antes de aceitar input

#### Scenario: Câmera durante combate e pausa
- **WHEN** o player se move, pausa e retoma
- **THEN** a câmera acompanha o deslocamento sem modificar rumos, velocidades ou posições autoritativas
- **AND** pausa congela seu acompanhamento e não existem rotações de câmera ou zooms automáticos por proximidade de ilhas
