# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Mundo completo sem distorção
**Reason**: O mundo infinito não pode ser apresentado inteiro; letterbox e faixas sem cenário contrariam o preenchimento da tela.
**Migration**: Aplicar o requisito Câmera de acompanhamento sem distorção, preservando escala uniforme, safe areas, legibilidade e a proteção de orientação já implementada.

## ADDED Requirements

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
