# Spec Delta

## Purpose

Apresentar informações e controles de combate com hierarquia consistente e acesso semântico, ajustando sua posição ao modo de input e ao espaço disponível sem ocultar a arena.

## ADDED Requirements

### Requirement: Hierarquia do HUD desktop

O HUD desktop SHALL centralizar a vida atual/máxima na base e Q/W/E/R imediatamente acima, nessa ordem. Score, tempo restante e Pause SHALL permanecer no topo, com alinhamento comum de vida e skills e respeito às safe areas.

#### Scenario: Combate por mouse e teclado
- **WHEN** a arena pronta usa modo desktop
- **THEN** vida e skills ocupam a faixa inferior central, score e tempo ficam no topo e Pause é uma ação semântica acessível
- **AND** os indicadores e instruções estão em inglês e o mundo permanece totalmente visível entre as faixas

### Requirement: Hierarquia do HUD touch

O HUD touch SHALL centralizar a vida atual/máxima no topo, com score, tempo e Pause próximos sem sobreposição. Joypad circular SHALL ficar embaixo à esquerda e Q/W/E/R embaixo à direita, usando grupo 2×2 quando a largura exigir, deixando o centro inferior livre do painel desktop.

#### Scenario: Portrait estreito e landscape
- **WHEN** o modo touch é apresentado em 320×568, 390×844, 844×390 ou landscape com 320 CSS px de altura
- **THEN** vida, joypad, skills e Pause ficam integralmente acessíveis, sem rolagem horizontal ou recorte e sem encobrir o combate
- **AND** o grupo compacto preserva a ordem de leitura Q/W/E/R

### Requirement: Feedback autoritativo das skills

Cada ataque SHALL exibir ícone, tecla, readiness, preenchimento ou sweep de cooldown e segundos restantes enquanto indisponível, derivados do estado e da configuração capturados. R SHALL exibir ícone, letra e On/Off explícito, sem cooldown. O feedback SHALL congelar com a pausa.

#### Scenario: Armas independentes e retorno a Ready
- **WHEN** Q/W/E são usados, inclusive simultaneamente
- **THEN** cada indicador apresenta sua própria recarga restante e proporção visual, retornando a Ready ao chegar a zero
- **AND** o valor em segundos corresponde ao mesmo tempo ativo usado para permitir o próximo disparo

#### Scenario: Pausa com recargas e auto-sail
- **WHEN** a partida pausa durante recargas com R On
- **THEN** segundos, preenchimentos e tempo restante ficam exatamente congelados, R mostra Off e Resume não rearma ataques nem movimento

### Requirement: Semântica e guias de controle

HUD e ações SHALL expor nomes, estado, score, segundos arredondados, vida numérica e instruções do modo em DOM semântico em inglês. Readiness SHALL ser distinguível além de cor. Atualizações SHALL ser discretas ou limitadas, sem anúncios por frame, disparo ou fração de cooldown.

#### Scenario: Controles antes e durante a partida
- **WHEN** o usuário consulta o menu e depois entra em combate no modo escolhido
- **THEN** encontra guia correspondente de mouse/Q/W/E/R ou joypad/skills e nomes acessíveis para ações e estados
- **AND** botões e diálogos conservam foco visível e acesso por teclado; pause e resultado continuam anunciados de forma polida

### Requirement: Alvos touch e áreas seguras

Cada ação touch SHALL ter área acionável mínima de 48×48 CSS px, separação suficiente e padding das safe areas. Bordas e ícones fornecidos SHALL decorar controles sem substituir seus nomes, hitboxes ou feedback textual. Mudanças de layout SHALL manter controles dentro da área útil.

#### Scenario: Retângulos mínimos e insets
- **WHEN** os controles são medidos em portrait e landscape com insets seguros não nulos
- **THEN** joypad, Q/W/E/R e Pause possuem hitboxes mínimas, não se sobrepõem e permanecem afastados das áreas inseguras
- **AND** foco e estados pressionado/ready/cooldown permanecem legíveis sem depender somente da arte
