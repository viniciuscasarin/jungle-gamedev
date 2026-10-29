# Spec Delta

## MODIFIED Requirements

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
