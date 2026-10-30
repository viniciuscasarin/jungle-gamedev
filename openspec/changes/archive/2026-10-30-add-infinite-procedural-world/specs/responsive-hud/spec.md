# Spec Delta

## MODIFIED Requirements

### Requirement: Hierarquia do HUD desktop

O HUD desktop SHALL centralizar vida atual/máxima na base e Q/W/E/R imediatamente acima, nessa ordem. Score, tempo restante e Pause SHALL permanecer no topo com safe areas. O cenário SHALL preencher a tela sob os grupos do HUD, preservando contraste e uma área central para acompanhar o player; não SHALL reservar bandas sem cenário.

#### Scenario: Combate por mouse e teclado
- **WHEN** a arena pronta usa modo desktop
- **THEN** vida e skills ocupam a parte inferior central, score e tempo ficam no topo e Pause é uma ação semântica acessível
- **AND** indicadores e instruções estão em inglês e o cenário continua sob os controles sem letterbox
- **AND** a posição de acompanhamento do player considera os grupos do HUD para preservar sua leitura

### Requirement: Hierarquia do HUD touch

O HUD touch SHALL centralizar vida no topo com score, tempo e Pause próximos sem sobreposição. Joypad SHALL ficar embaixo à esquerda e Q/W/E/R embaixo à direita, em 2×2 quando necessário, deixando o centro inferior livre. O cenário SHALL preencher a tela sob os controles. Mobile SHALL permitir combate somente em landscape; portrait SHALL apresentar proteção com partida pausada.

#### Scenario: Portrait estreito e landscape
- **WHEN** o dispositivo mobile apresenta viewport 320×568, 390×844, 844×390 ou landscape com 320 CSS px de altura
- **THEN** em landscape vida, joypad, skills e Pause ficam acessíveis, sem rolagem horizontal ou recorte, com o player na área central legível
- **AND** cenário permanece sob os grupos e o grupo compacto preserva a ordem de leitura Q/W/E/R
- **AND** em portrait a proteção impede interação e foco nos controles do HUD

#### Scenario: Alternância de modo e áreas seguras
- **WHEN** modo de input ou safe areas muda sem reiniciar a partida
- **THEN** HUD e área de acompanhamento se ajustam sem reduzir o cenário a um retângulo entre faixas
- **AND** controles mantêm hitboxes mínimas de 48×48 CSS px no touch, foco e contraste, sem alterar posição lógica ou comandos por causa do layout
