# Spec Delta

## MODIFIED Requirements

### Requirement: Tela inicial mínima acessível

A aplicação SHALL exibir Pirate Battle e o fluxo mínimo Main Menu, Loading e Arena, com Play, Retry, Resume e Main Menu onde aplicáveis. Texto, instruções de mouse/Q/W/E/R e status mínimos de score, cooldowns, auto-sail e congelamento SHALL estar em inglês e permanecer semânticos independentemente do canvas, com layout utilizável a partir de 320 CSS pixels.

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
