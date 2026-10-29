# Spec Delta

## Purpose

Permitir que o jogador dirija um navio pelo mouse e auto-sail, mantendo o casco em água navegável e controles previsíveis durante mudanças de foco e viewport.

## ADDED Requirements

### Requirement: Direção lógica com giro limitado

O player SHALL girar pelo menor deslocamento angular até um alvo no mundo, limitado pela velocidade angular configurada por passo, inclusive parado. Sem alvo ou com alvo a até 12 unidades do centro na configuração padrão, SHALL conservar o rumo. Um alvo válido SHALL persistir ao sair do canvas, sem teleporte ou rotação instantânea.

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

### Requirement: Conversão e invariância do alvo

O input SHALL converter coordenadas client usando origem do host, escala e offsets CSS correntes e limitar o alvo ao mundo. Resize, orientação e DPR SHALL não reinterpretar o alvo lógico já armazenado, alterar regras ou deslocar o casco. Transformações não renderizáveis SHALL não produzir alvos inválidos.

#### Scenario: Letterbox e origem deslocada
- **WHEN** o mouse informa posição em host deslocado ou fora do retângulo do mundo dentro do canvas
- **THEN** o alvo corresponde à inversa mundo/tela corrente com clamp em [0,960]×[0,540] no mapa padrão
- **AND** o DPR não multiplica coordenadas CSS de input

#### Scenario: Resize e área vazia
- **WHEN** o host é redimensionado ou muda de DPR depois de armazenar um alvo
- **THEN** esse alvo e a posição autoritativa permanecem iguais até passos ou novos comandos válidos
- **AND** área útil temporariamente zero ignora novas conversões inválidas, sem NaN

### Requirement: Auto-sail por borda de tecla

R SHALL alternar auto-sail uma vez por pressão válida, ignorando repeat e keydown duplicado antes de keyup. Auto-sail SHALL iniciar desligado e, ligado, solicitar somente avanço na direção atual à velocidade configurada, sem reverse, strafe ou navegação automática. A borda SHALL sobreviver até o próximo passo e ser consumida uma única vez.

#### Scenario: Tecla mantida e múltiplos passos
- **WHEN** R recebe keydown, repeats e frames com zero ou vários passos antes do keyup
- **THEN** a pressão alterna o estado somente uma vez, sem perder a borda antes de existir passo
- **AND** outra pressão após keyup alterna novamente

#### Scenario: Movimento frontal contínuo
- **WHEN** auto-sail está ligado durante passos sem contato com cenário
- **THEN** o player avança a 150 unidades/s no mapa padrão, usando o rumo atualizado de cada passo
- **AND** desligar R interrompe translação e preserva a possibilidade de girar

### Requirement: Casco contido e deslizamento sem dano

O movimento SHALL manter o casco circular fora dos polígonos sólidos configurados das duas ilhas e dentro dos limites do mundo, preservando componente tangencial quando possível. Rotação SHALL não alterar o casco nem permitir penetração. Contato com cenário SHALL não alterar saúde nem emitir dano.

#### Scenario: Impacto frontal e limites
- **WHEN** o player avança frontalmente contra qualquer ilha ou uma borda do mundo
- **THEN** para no primeiro contato sem atravessar, sobrepor terra ou deixar parte do casco fora da arena
- **AND** mantém saúde 100 na configuração padrão mesmo após contato repetido

#### Scenario: Contatos oblíquos e cantos
- **WHEN** o casco alcança litoral obliquamente, um vértice arredondado ou um canto da arena
- **THEN** desliza ao longo da superfície quando existe deslocamento tangencial válido
- **AND** consegue afastar-se ou prosseguir tangencialmente sem ficar preso por um contato inicial

#### Scenario: Contornar ambas as ilhas
- **WHEN** o jogador dirige com mouse e R pelos quatro lados de cada ilha
- **THEN** consegue completar rotas pela água ao redor de ambas, sem alterar posições por atalhos de teste
- **AND** giro e resize durante contatos mantêm o casco em posição válida

### Requirement: Propriedade contextual do input

O sistema SHALL capturar R somente enquanto a arena pronta e ativa possui contexto de jogo. Menus, Loading, falhas, congelamento, campos editáveis e atalhos com modificadores SHALL conservar seu comportamento normal. Sair ou desmontar SHALL liberar listeners e limpar comandos pendentes.

#### Scenario: Interface fora do jogo
- **WHEN** R é pressionado no menu, em Loading, em erro, em campo editável ou com Ctrl/Alt/Meta
- **THEN** nenhum auto-sail é alternado e o evento não é consumido como comando de jogo

#### Scenario: Saída e reentrada
- **WHEN** o usuário sai com R mantido e abre a arena novamente
- **THEN** a nova arena inicia com auto-sail desligado, sem alvo ou borda herdados e sem listeners duplicados

### Requirement: Congelamento por perda de foco

Blur da janela ou documento oculto SHALL congelar imediatamente a execução, desligar auto-sail e limpar teclas, bordas e alvo de steering. Foco restaurado SHALL não retomar automaticamente. Resume explícito SHALL manter o rumo e retornar sem comandos mantidos, exigindo novo input para mover.

#### Scenario: Ausência e retorno explícito
- **WHEN** a janela perde foco ou o documento fica oculto durante navegação, inclusive com R mantido
- **THEN** posição, rumo e tempo ativo ficam congelados e auto-sail fica Off
- **AND** retornar foco não avança a simulação; Resume limpa a referência temporal e novo R é necessário para navegar

### Requirement: Diagnóstico fiel ao estado

O modo de diagnóstico SHALL permitir verificar visualmente polígonos sólidos, casco circular, limites e rumo derivados da configuração e estado autoritativos. Inspeção programática SHALL ser somente leitura e não conceder teleporte ou alteração de regras.

#### Scenario: Comparação do contato
- **WHEN** a arena é aberta com geometry=1 e o casco chega ao litoral
- **THEN** o contorno exibido corresponde ao usado na colisão e acompanha o navio após giro, movimento e resize
- **AND** informações de posição, passo, tempo ativo e auto-sail permitem conferir o comportamento sem modificar a simulação
