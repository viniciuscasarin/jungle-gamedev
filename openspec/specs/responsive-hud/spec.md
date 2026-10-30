# responsive-hud Specification

## Purpose

Apresentar informações e controles de combate com hierarquia consistente e acesso semântico, ajustando sua posição ao modo de input e ao espaço disponível sem ocultar a arena.

## Requirements

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

Cada ação touch SHALL ter área acionável mínima de 48×48 CSS px, separação suficiente e padding das safe areas. Bordas e ícones fornecidos SHALL decorar controles sem substituir seus nomes, hitboxes ou feedback textual. Mudanças de layout SHALL manter controles dentro da área útil. Em portrait mobile SHALL somente as ações da proteção de orientação e recuperação inicial permanecer disponíveis.

#### Scenario: Retângulos mínimos e insets
- **WHEN** os controles são medidos nas orientações permitidas com insets seguros não nulos
- **THEN** joypad, Q/W/E/R e Pause possuem hitboxes mínimas, não se sobrepõem e permanecem afastados das áreas inseguras
- **AND** foco e estados pressionado/ready/cooldown permanecem legíveis sem depender somente da arte

#### Scenario: Proteção em portrait mobile
- **WHEN** o aparelho entra em portrait com safe areas não nulas
- **THEN** a instrução de rotação e suas ações disponíveis ficam dentro da área útil e têm alvos de toque de pelo menos 48×48 CSS px
- **AND** os controles de combate subjacentes não recebem input nem foco

### Requirement: Anúncios acessíveis via live regions
O BattleHUD SHALL disponibilizar uma região DOM com `role="status"` e `aria-live="polite"` para anunciar com discrição marcos fundamentais da partida (saúde crítica ≤25%, contagem regressiva de 10 segundos, pontuação por destruição de inimigo e transições de pausa/retomada). A região SHALL NOT anunciar atualizações a cada segundo rotineiro, tiros individuais ou oscilações contínuas de recarga de armas.

#### Scenario: Anúncio de saúde crítica
- **WHEN** a vida do navio do jogador cruza o limiar de 25% ou menos
- **THEN** a live region emite uma única mensagem de texto claro alertando dano crítico

#### Scenario: Anúncio de 10 segundos restantes
- **WHEN** o tempo de combate atinge o limiar de 10 segundos finais
- **THEN** a live region emite um anúncio único alertando a contagem final da partida

#### Scenario: Anúncio de destruição e pontuação
- **WHEN** uma embarcação inimiga é derrotada
- **THEN** a live region anuncia a pontuação conquistada e o total acumulado

#### Scenario: Ausência de anúncios por frame ou disparo
- **WHEN** canhões disparam ou o cronômetro avança normalmente fora dos 10 segundos finais
- **THEN** a live region permanece em silêncio sem emitir anúncios redundantes

### Requirement: Controle e indicação acessível de mute de áudio
O BattleHUD e a tela de Opções SHALL disponibilizar botão interativo para alternar o estado de mute do áudio, expondo rótulo semântico acessível (`aria-label`), estado atual e ícone visual indicativo. O controle SHALL ter área mínima de toque de 48×48 CSS px no modo touch e foco visível no teclado.

#### Scenario: Alternância de áudio no HUD com label acessível
- **WHEN** o usuário aciona o controle de som no HUD
- **THEN** o rótulo semântico e o ícone visual alternam entre silenciado e ativo
- **AND** o estado visual reflete a preferência persistida

#### Scenario: Sincronização entre HUD e opções
- **WHEN** o estado de mute é modificado na tela de Opções ou no HUD durante o jogo
- **THEN** o outro ponto de controle reflete imediatamente o mesmo estado atualizado

### Requirement: Contenção e restauração de foco em diálogos
Todos os diálogos modais (Pausa, Opções, Confirmação de Abandono e Resultado) SHALL reter o foco de navegação por teclado em ciclo fechado (*focus trap*) enquanto estiverem abertos. Ao serem encerrados, o foco do teclado SHALL ser restaurado para o elemento disparador correspondente.

#### Scenario: Ciclo de foco confinado no diálogo modal
- **WHEN** o diálogo de pausa ou opções está visível e o usuário navega com Tab ou Shift+Tab
- **THEN** o foco transita exclusivamente entre os botões interativos do próprio diálogo

#### Scenario: Restauração de foco ao fechar diálogo
- **WHEN** o diálogo de pausa é fechado por ação de retorno ou tecla Escape
- **THEN** o foco do teclado é devolvido ao controle de pausa ou elemento que iniciou a ação
