# application-shell Specification

## Purpose

Garantir que o navegador apresente uma aplicação inicial acessível e que seus recursos de renderização possam ser iniciados e liberados com segurança.

## Requirements

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

### Requirement: Recursos de renderização com dono explícito

A aplicação SHALL manter no máximo um canvas ativo por host e SHALL liberar recursos próprios, observadores, listeners e inscrições ao sair da arena ou desmontar, inclusive com inicialização assíncrona tardia. Texturas compartilhadas SHALL seguir a política do cache. Callbacks obsoletos SHALL não alterar uma navegação ou tentativa mais recente.

#### Scenario: Montagem repetida
- **WHEN** a arena é montada, desmontada e montada novamente sob Strict Mode
- **THEN** somente a instância atual permanece anexada
- **AND** instâncias anteriores não mantêm loops, listeners ou recursos próprios vivos, sem duplicação de canvas ou ticker

#### Scenario: Inicialização tardia
- **WHEN** uma inicialização pendente conclui depois que seu host foi desmontado
- **THEN** a instância tardia é descartada sem anexar canvas nem atualizar a interface desmontada

#### Scenario: Retorno durante carregamento
- **WHEN** o usuário escolhe Main Menu durante Loading e uma tentativa anterior conclui depois
- **THEN** o menu permanece ativo e a tentativa antiga libera sua participação nos recursos
- **AND** um novo Play pode carregar normalmente sem adotar callbacks antigos

### Requirement: Falha de renderização legível

A aplicação SHALL manter conteúdo semântico disponível e informar em inglês falhas de assets ou inicialização gráfica, sem apresentar a arena como pronta. SHALL disponibilizar Retry e Main Menu para recuperar ou sair do erro sem rejeições não tratadas nem recursos órfãos.

#### Scenario: Renderer indisponível
- **WHEN** a inicialização gráfica rejeita ou o navegador não oferece contexto compatível
- **THEN** a tela continua legível e apresenta mensagem de falha acessível, Retry e Main Menu
- **AND** não há rejeição de promise sem tratamento nem canvas órfão

#### Scenario: Asset indisponível
- **WHEN** o carregamento de um asset obrigatório falha
- **THEN** o erro permanece visível até uma ação de recuperação ou retorno
- **AND** Retry inicia nova tentativa e Main Menu restaura o menu sem montar arena parcial
