# player-navigation Specification

## Purpose

Permitir que o jogador dirija um navio pelo mouse e auto-sail, mantendo o casco em água navegável e controles previsíveis durante mudanças de foco e viewport.

## Requirements

### Requirement: Direção lógica com giro limitado

O player SHALL girar pelo menor deslocamento angular até alvo no mundo ou direção válida normalizada, limitado pela velocidade angular configurada por passo, inclusive parado. Sem direção, sem alvo ou com alvo a até 12 unidades do centro no padrão, SHALL conservar o rumo. Alvo válido SHALL persistir ao sair do canvas; direção válida SHALL persistir após release do joypad até limpeza ou novo rumo, sem teleporte ou rotação instantânea.

#### Scenario: Antes do primeiro alvo e dentro da dead zone
- **WHEN** nenhum mouse válido foi observado ou a distância ao alvo é menor ou igual à dead zone
- **THEN** o rumo atual é preservado, inclusive com auto-sail ligado

#### Scenario: Giro parado e travessia angular
- **WHEN** o mouse aponta fora da dead zone, inclusive atravessando a fronteira de −π/π, com auto-sail desligado
- **THEN** o casco gira sem transladar pelo menor arco, no máximo π rad/s na configuração padrão
- **AND** o empate de meia volta usa uma direção determinística documentada

#### Scenario: Saída do canvas
- **WHEN** o ponteiro deixa o canvas após fornecer um alvo válido
- **THEN** o último alvo lógico continua orientando o player até novo alvo ou limpeza de input

#### Scenario: Direção manual e release
- **WHEN** o joypad fornece uma direção fora da dead zone e solicita avanço, inclusive com R Off
- **THEN** o navio avança somente pelo rumo atual atualizado com giro finito, usando a velocidade frontal configurada e a mesma colisão do mouse
- **AND** release remove o pedido manual; R Off para a translação e R On mantém avanço e giro para o último rumo selecionado

#### Scenario: Direção inválida
- **WHEN** o comando direcional tem vetor nulo ou componente não finita
- **THEN** não altera o rumo nem introduz valores inválidos no estado

### Requirement: Conversão e invariância do alvo

O input SHALL converter coordenadas client com origem do host e transformação corrente da câmera, aceitando coordenadas assinadas sem clamp de mapa finito. Mouse SHALL orientar em relação ao player apresentado; câmera em movimento com ponteiro parado SHALL conservar a direção escolhida. Resize e DPR SHALL não reinterpretar o comando lógico armazenado nem deslocar o casco. Área não renderizável SHALL ignorar conversões inválidas.

#### Scenario: Letterbox e origem deslocada
- **WHEN** o mouse informa posição em host deslocado com player e câmera fora da arena antiga
- **THEN** a posição é convertida pela inversa corrente em CSS pixels, sem clamp em [0,960]×[0,540]
- **AND** DPR não multiplica coordenadas CSS e a direção corresponde ao vetor do player para o ponteiro

#### Scenario: Resize e área vazia
- **WHEN** o host é redimensionado ou muda de DPR depois de armazenar um comando lógico
- **THEN** o comando e a posição autoritativa permanecem iguais até passos ou novos comandos válidos
- **AND** área útil temporariamente zero ignora novas conversões inválidas, sem NaN

#### Scenario: Ponteiro parado durante acompanhamento
- **WHEN** o jogador aponta para um lado, liga auto-sail e mantém o mouse parado enquanto a câmera acompanha o navio
- **THEN** o navio continua orientado para esse lado sem perseguir um ponto antigo do mundo ou entrar em círculos pela translação da câmera
- **AND** sair do canvas conserva a última direção válida até novo input ou limpeza contextual

#### Scenario: Dead zone e fontes de direção
- **WHEN** o mouse está a até 12 unidades lógicas do centro do player apresentado ou o usuário alterna entre mouse e joypad
- **THEN** a dead zone preserva o rumo e as fontes continuam sujeitas ao giro limitado, ao auto-sail e à limpeza de comandos existentes
- **AND** o suporte a alvos lógicos explícitos em consumidores sem DOM permanece determinístico

### Requirement: Auto-sail por borda de tecla

R SHALL alternar auto-sail uma vez por pressão válida, ignorando repeat e keydown duplicado antes de keyup. Auto-sail SHALL iniciar desligado e, ligado, solicitar somente avanço na direção atual à velocidade configurada, sem reverse, strafe ou navegação automática. A borda SHALL sobreviver até o próximo passo e ser consumida uma única vez. Pedido manual válido de avanço SHALL mover com R Off sem alterar o estado da passiva.

#### Scenario: Tecla mantida e múltiplos passos
- **WHEN** R recebe keydown, repeats e frames com zero ou vários passos antes do keyup
- **THEN** a pressão alterna o estado somente uma vez, sem perder a borda antes de existir passo
- **AND** outra pressão após keyup alterna novamente

#### Scenario: Movimento frontal contínuo
- **WHEN** auto-sail está ligado durante passos sem contato com cenário
- **THEN** o player avança a 150 unidades/s no mapa padrão, usando o rumo atualizado de cada passo
- **AND** desligar R sem pedido manual interrompe translação e preserva a possibilidade de girar

### Requirement: Casco contido e deslizamento sem dano

O movimento SHALL manter o casco circular fora dos sólidos procedurais, preservando componente tangencial quando possível. Fronteiras de região e de caches SHALL não ser obstáculos. Rotação SHALL não alterar o casco nem permitir penetração. Contato com cenário SHALL não alterar saúde nem emitir dano; todo deslocamento SHALL consultar a geometria necessária antes da colisão.

#### Scenario: Impacto frontal e limites
- **WHEN** o player avança frontalmente contra uma ilha ou cruza um antigo limite de mapa ou fronteira de região
- **THEN** para no primeiro contato com terra sem atravessar e cruza livremente fronteiras sem terra
- **AND** mantém saúde 100 na configuração padrão mesmo após contato repetido com litoral

#### Scenario: Contatos oblíquos e cantos
- **WHEN** o casco alcança litoral obliquamente ou um vértice arredondado
- **THEN** desliza ao longo da superfície quando existe deslocamento tangencial válido
- **AND** consegue afastar-se ou prosseguir tangencialmente sem ficar preso por um contato inicial

#### Scenario: Contornar ambas as ilhas
- **WHEN** o jogador dirige com mouse e R ao redor de modelos compactos, alongados e largos, inclusive próximos a fronteiras de região
- **THEN** completa rotas de água ao redor dos modelos sem alterar posições por atalhos de teste
- **AND** giro e resize durante contatos mantêm o casco em posição válida

### Requirement: Propriedade contextual do input

O sistema SHALL capturar comandos somente enquanto a arena pronta e ativa possui contexto de jogo, incluindo seus controles touch. Menus, Loading, falhas, congelamento, campos editáveis e atalhos com modificadores SHALL conservar seu comportamento normal. Sair ou desmontar SHALL liberar listeners, capturas e comandos pendentes; mudar foco entre controles da batalha SHALL preservar as demais fontes válidas.

#### Scenario: Interface fora do jogo
- **WHEN** R é pressionado no menu, em Loading, em erro, em campo editável ou com Ctrl/Alt/Meta
- **THEN** nenhum auto-sail é alternado e o evento não é consumido como comando de jogo

#### Scenario: Saída e reentrada
- **WHEN** o usuário sai com R mantido e abre a arena novamente
- **THEN** a nova arena inicia com auto-sail desligado, sem alvo ou borda herdados e sem listeners duplicados

#### Scenario: Foco em skill durante navegação touch
- **WHEN** um dedo mantém o joypad e outro aciona uma skill dentro do mesmo contexto de batalha
- **THEN** a mudança interna de foco não apaga o joypad nem os ataques de outros contatos
- **AND** sair do contexto limpa comandos sem afetar a navegação normal de menus e diálogos

### Requirement: Congelamento por perda de foco

Blur da janela ou documento oculto SHALL congelar imediatamente a execução, desligar auto-sail e limpar teclas, contatos, capturas, bordas, vetor e alvo de steering. Foco restaurado SHALL não retomar automaticamente. Resume explícito SHALL manter o rumo e retornar sem comandos mantidos, exigindo novo input para mover.

#### Scenario: Ausência e retorno explícito
- **WHEN** a janela perde foco ou o documento fica oculto durante navegação, inclusive com R mantido
- **THEN** posição, rumo e tempo ativo ficam congelados e auto-sail fica Off
- **AND** retornar foco não avança a simulação; Resume limpa a referência temporal e novo R ou joypad é necessário para navegar

#### Scenario: Contatos anteriores ao congelamento
- **WHEN** existem joypad, ataques ou pressão de R touch pendentes ao congelar
- **THEN** a liberação tardia desses contatos não produz disparo, movimento ou alternância após Resume

### Requirement: Diagnóstico fiel ao estado

O diagnóstico SHALL mostrar contornos sólidos, casco circular, rumo, limites da câmera e fronteiras informativas das regiões derivados da preparação e estado autoritativos. Fronteiras informativas SHALL não sugerir colisores inexistentes. Inspeção SHALL ser somente leitura e não permitir teleporte ou alteração de regras.

#### Scenario: Comparação do contato
- **WHEN** a arena é aberta com geometry=1 e o casco chega ao litoral
- **THEN** o contorno corresponde ao usado na colisão e acompanha câmera, giro, movimento e resize
- **AND** posição assinada, região, passo, tempo ativo e auto-sail permitem verificar o comportamento sem modificar a simulação
