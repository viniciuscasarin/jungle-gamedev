# Spec Delta

## ADDED Requirements

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
