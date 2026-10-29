# Spec Delta

## MODIFIED Requirements

### Requirement: Hierarquia do HUD touch

O HUD touch SHALL centralizar a vida atual/máxima no topo, com score, tempo e Pause próximos sem sobreposição. Joypad circular SHALL ficar embaixo à esquerda e Q/W/E/R embaixo à direita, usando grupo 2×2 quando a largura exigir, deixando o centro inferior livre do painel desktop. No mobile SHALL estar disponível somente em landscape; portrait SHALL apresentar a proteção de orientação com combate pausado.

#### Scenario: Portrait estreito e landscape
- **WHEN** o dispositivo mobile apresenta viewport 320×568, 390×844, 844×390 ou landscape com 320 CSS px de altura
- **THEN** em landscape vida, joypad, skills e Pause ficam integralmente acessíveis, sem rolagem horizontal ou recorte e sem encobrir o combate
- **AND** o grupo compacto preserva a ordem de leitura Q/W/E/R; em portrait a proteção impede interação e foco nos controles do HUD

### Requirement: Alvos touch e áreas seguras

Cada ação touch SHALL ter área acionável mínima de 48×48 CSS px, separação suficiente e padding das safe areas. Bordas e ícones fornecidos SHALL decorar controles sem substituir seus nomes, hitboxes ou feedback textual. Mudanças de layout SHALL manter controles dentro da área útil. Em portrait mobile SHALL somente as ações da proteção de orientação e recuperação inicial permanecer disponíveis.

#### Scenario: Retângulos mínimos e insets
- **WHEN** os controles são medidos nas orientações permitidas com insets seguros não nulos
- **THEN** joypad, Q/W/E/R e Pause possuem hitboxes mínimas, não se sobrepõem e permanecem afastados das áreas inseguras
- **AND** foco e estados pressionado/ready/cooldown permanecem legíveis sem depender somente da arte

#### Scenario: Proteção em portrait mobile
- **WHEN** o aparelho entra em portrait com safe areas não nulas
- **THEN** a instrução de rotação e suas ações disponíveis ficam dentro da área útil e têm alvos de toque de pelo menos 48×48 CSS px
- **AND** os controles de combate subjacentes não recebem input nem foco
