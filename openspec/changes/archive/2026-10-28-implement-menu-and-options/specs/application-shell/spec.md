# Spec Delta

## MODIFIED Requirements

### Requirement: Tela inicial mínima acessível

A aplicação SHALL exibir Pirate Battle e Main Menu, Options, Loading, Playing, Paused e Result, com Play, Options, Save, Cancel, Retry, Pause, Resume, Play Again, Main Menu e Last Result onde aplicáveis. Texto, instruções de mouse/Q/W/E/R e status de score, tempo restante, cooldowns, auto-sail e congelamento SHALL estar em inglês e permanecer semânticos independentemente do canvas, com layout utilizável a partir de 320 CSS pixels.

#### Scenario: Primeiro acesso
- **WHEN** o usuário abre a aplicação no navegador
- **THEN** encontra o título principal, explicação legível de mouse, Q frontal, W bombordo, E estibordo e R auto-sail, além de Play acessível por teclado e toque
- **AND** tecnologias assistivas conseguem ler o conteúdo sem depender do canvas

#### Scenario: Visualização estreita
- **WHEN** o viewport tem 320 CSS pixels de largura
- **THEN** conteúdo e ações continuam legíveis, sem rolagem horizontal obrigatória, sobreposição ou corte do título

#### Scenario: Loading e arena
- **WHEN** Play é acionado
- **THEN** Loading fica perceptível e expõe status semântico durante a preparação
- **AND** somente o sucesso completo apresenta Arena com Main Menu, instruções dos controles, score zero, armas prontas e auto-sail Off inicial

#### Scenario: Congelamento acessível
- **WHEN** a navegação congela por perda de foco ou documento oculto
- **THEN** a interface informa Paused, auto-sail Off e ação Resume acessível por teclado
- **AND** Resume devolve foco ao contexto de jogo sem ligar auto-sail, manter ataques ou atualizar React a cada frame

#### Scenario: Indicadores mínimos de combate
- **WHEN** uma arma entra em recarga ou uma morte real pontua
- **THEN** a interface apresenta readiness ou cooldown restante em segundos de Q/W/E e o score autoritativo
- **AND** a publicação usa eventos discretos ou cadência limitada, permanece congelada na pausa e não encobre o mundo em portrait ou landscape

#### Scenario: Tempo e resultado semântico
- **WHEN** Playing avança ou ocorre término
- **THEN** a interface expõe segundos restantes arredondados e limitados a zero, saúde, score e estado, com atualizações discretas ou limitadas
- **AND** pausa e resultado são anunciados de forma polida sem anúncio por frame; Result mostra duração ativa e motivo legíveis

#### Scenario: Diálogos e restauração de foco
- **WHEN** Pause ou confirmação de abandono é aberta por teclado ou toque
- **THEN** controles semânticos mantêm foco visível e contido no diálogo, sem capturar hotkeys de gameplay
- **AND** Keep Playing retorna a Paused com foco em Resume; Resume devolve foco ao contexto de jogo, Main Menu ao Play e Result ao título ou ação principal

#### Scenario: Options no shell
- **WHEN** Options é aberto no menu e encerrado por Save bem-sucedido, Cancel ou Escape
- **THEN** a navegação usa controles e campos semânticos, entrada foca título ou primeiro campo e o retorno foca Options no menu
- **AND** Loading, Playing e Paused não oferecem edição de opções e continuam obedecendo aos contratos existentes de sessão
