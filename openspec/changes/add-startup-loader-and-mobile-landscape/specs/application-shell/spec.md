# Spec Delta

## MODIFIED Requirements

### Requirement: Tela inicial mínima acessível

A aplicação SHALL exibir Pirate Battle e Main Menu, Options, Loading, Playing, Paused e Result, com Play, Options, Save, Cancel, Retry, Pause, Resume, Play Again, Main Menu e Last Result onde aplicáveis. Texto, instruções de mouse/Q/W/E/R e status de score, tempo restante, cooldowns, auto-sail e congelamento SHALL estar em inglês e permanecer semânticos independentemente do canvas, com layout utilizável a partir de 320 CSS pixels. O primeiro acesso SHALL apresentar o carregamento inicial antes do menu e respeitar a proteção de orientação no mobile.

#### Scenario: Primeiro acesso
- **WHEN** o usuário abre a aplicação no navegador
- **THEN** encontra primeiro a tela de carregamento inicial e, após sua conclusão e com orientação permitida, o título principal, explicação legível de mouse, Q frontal, W bombordo, E estibordo e R auto-sail, além de Play acessível por teclado e toque
- **AND** tecnologias assistivas conseguem ler o conteúdo sem depender do canvas

#### Scenario: Visualização estreita
- **WHEN** o viewport tem 320 CSS pixels de largura
- **THEN** o conteúdo disponível continua legível, sem rolagem horizontal obrigatória, sobreposição ou corte do título
- **AND** em portrait mobile o conteúdo disponível é a proteção de orientação, preservando progresso e recuperação do carregamento inicial

#### Scenario: Loading e arena
- **WHEN** Play é acionado
- **THEN** Loading fica perceptível e expõe status semântico durante a preparação
- **AND** somente o sucesso completo e a orientação permitida apresentam Arena com Main Menu, instruções dos controles, score zero, armas prontas e auto-sail Off inicial

#### Scenario: Congelamento acessível
- **WHEN** a navegação congela por perda de foco ou documento oculto
- **THEN** a interface informa Paused, auto-sail Off e ação Resume acessível por teclado
- **AND** Resume devolve foco ao contexto de jogo sem ligar auto-sail, manter ataques ou atualizar React a cada frame

#### Scenario: Indicadores mínimos de combate
- **WHEN** uma arma entra em recarga ou uma morte real pontua
- **THEN** a interface apresenta readiness ou cooldown restante em segundos de Q/W/E e o score autoritativo
- **AND** a publicação usa eventos discretos ou cadência limitada, permanece congelada na pausa e não encobre o mundo nas orientações permitidas; portrait mobile apresenta a proteção com a partida pausada

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

## ADDED Requirements

### Requirement: Tela inicial preta com identidade e progresso

A abertura SHALL apresentar fundo preto opaco cobrindo o viewport antes da inicialização assíncrona. O logo Jungle Gaming fornecido SHALL aparecer centralizado e proporcional, com barra abaixo dele, contorno branco sólido e preenchimento branco sobre interior preto, seguida da frase. A barra SHALL expor progresso real em semântica acessível. Menu e controles SHALL permanecer indisponíveis até a preparação concluir.

#### Scenario: Primeira renderização com rede lenta
- **WHEN** a página abre com scripts, serviço de mock ou imagens ainda pendentes
- **THEN** o fundo inicial já é preto, sem revelar o menu parcialmente carregado
- **AND** logo, barra e frase são apresentados assim que seus recursos mínimos estão disponíveis, independentemente da inicialização do jogo

#### Scenario: Progresso parcial
- **WHEN** parte dos recursos conclui enquanto outros continuam pendentes
- **THEN** a barra branca avança conforme o progresso informado pelo carregamento, mantendo contorno branco sólido e região restante preta
- **AND** um progressbar com nome acessível expõe o valor atual sem depender de cor ou animação

#### Scenario: Preparação concluída
- **WHEN** todos os recursos obrigatórios estão prontos e a preparação inicial conclui
- **THEN** o progresso chega a 100% e a aplicação revela o menu somente em orientação permitida
- **AND** voltar ao menu durante a mesma sessão não repete a preparação inicial nem adiciona espera artificial

### Requirement: Frases temáticas durante a espera

O carregamento inicial SHALL exibir frases curtas e engraçadas de pirata em inglês abaixo da barra, alternando a cada três segundos enquanto a preparação estiver pendente. As frases SHALL não indicar progresso fictício, aumentar a duração da espera nem provocar deslocamento do layout. Trocas SHALL não disparar anúncios acessíveis contínuos.

#### Scenario: Espera prolongada
- **WHEN** o carregamento continua pendente por mais de seis segundos
- **THEN** pelo menos três frases diferentes são apresentadas, sem repetição consecutiva
- **AND** logo, barra e área de texto mantêm posições estáveis

#### Scenario: Conclusão ou falha
- **WHEN** a preparação conclui, falha ou a aplicação é descartada
- **THEN** a alternância para e não mantém temporizadores ou atualizações em uma tela antiga
- **AND** uma conclusão rápida libera o menu sem esperar a próxima frase

### Requirement: Erro inicial independente de assets

Uma falha de preparação visual SHALL manter a tela preta com mensagem legível em inglês e Retry sem depender de imagens de botões, logo ou canvas. A falha SHALL não revelar o menu incompleto nem deixar progresso aparentando sucesso. Retry SHALL funcionar sem refresh, inclusive sob a proteção de orientação.

#### Scenario: Logo ou imagem de interface indisponível
- **WHEN** o logo ou uma imagem visual obrigatória falha ou excede o limite de espera
- **THEN** a mensagem de falha e Retry continuam visíveis e acessíveis por teclado e toque
- **AND** a interface não depende do asset que falhou para permitir recuperação

#### Scenario: Recuperação completa
- **WHEN** Retry é acionado e os recursos pendentes carregam com sucesso
- **THEN** o menu pode ser exibido com imagens prontas após a preparação concluir e a orientação permitir
- **AND** o foco vai para uma ação válida da tela apresentada
