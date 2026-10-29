# Spec Delta

## MODIFIED Requirements

### Requirement: Tela inicial mínima acessível

A aplicação SHALL exibir Pirate Battle e o fluxo mínimo Main Menu, Loading e Arena, com ações Play, Retry, Resume e Main Menu onde aplicáveis. Texto, instruções de mouse/R e status discretos de auto-sail/congelamento SHALL estar em inglês e permanecer semânticos independentemente do canvas, com layout utilizável a partir de 320 CSS pixels.

#### Scenario: Primeiro acesso
- **WHEN** o usuário abre a aplicação no navegador
- **THEN** encontra o título principal, uma explicação legível da navegação com mouse e R e Play acessível por teclado e toque
- **AND** tecnologias assistivas conseguem ler o conteúdo sem depender do canvas

#### Scenario: Visualização estreita
- **WHEN** o viewport tem 320 CSS pixels de largura
- **THEN** conteúdo e ações continuam legíveis, sem rolagem horizontal obrigatória, sobreposição ou corte do título

#### Scenario: Loading e arena
- **WHEN** Play é acionado
- **THEN** Loading fica perceptível e expõe status semântico durante a preparação
- **AND** somente o sucesso completo apresenta Arena com Main Menu, instruções de navegação e auto-sail Off inicial

#### Scenario: Congelamento acessível
- **WHEN** a navegação congela por perda de foco ou documento oculto
- **THEN** a interface informa Paused, auto-sail Off e ação Resume acessível por teclado
- **AND** Resume devolve foco ao contexto de jogo sem ligar auto-sail nem atualizar React a cada frame
