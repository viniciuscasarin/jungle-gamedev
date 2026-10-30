# Spec Delta

## MODIFIED Requirements

### Requirement: Hierarquia do HUD touch

O HUD touch SHALL centralizar vida no topo com score, tempo e Pause próximos sem sobreposição. Joypad SHALL ficar embaixo à esquerda e Q/W/E/R embaixo à direita, em 2×2 quando necessário, deixando o centro inferior livre para a dica dispensável. O cenário SHALL preencher a tela sob os controles. Mobile SHALL permitir combate somente em landscape; portrait SHALL apresentar proteção com partida pausada.

#### Scenario: Portrait estreito e landscape
- **WHEN** o dispositivo mobile apresenta viewport 320×568, 390×844, 844×390 ou landscape com 320 CSS px de altura
- **THEN** em landscape vida, joypad, skills e Pause ficam acessíveis, sem rolagem horizontal ou recorte, com o player na área central legível
- **AND** cenário permanece sob os grupos e o grupo compacto preserva a ordem de leitura Q/W/E/R
- **AND** em portrait a proteção impede interação e foco nos controles do HUD

#### Scenario: Alternância de modo e áreas seguras
- **WHEN** modo de input ou safe areas muda sem reiniciar a partida
- **THEN** HUD e área de acompanhamento se ajustam sem reduzir o cenário a um retângulo entre faixas
- **AND** controles mantêm hitboxes mínimas de 48×48 CSS px no touch, foco e contraste, sem alterar posição lógica ou comandos por causa do layout

### Requirement: Semântica e guias de controle

HUD e ações SHALL expor nomes, estado, score, segundos arredondados, vida numérica e instruções do modo em DOM semântico em inglês. A descrição acessível dos comandos SHALL continuar disponível após fechar a dica visual touch. Readiness SHALL ser distinguível além de cor. Atualizações SHALL ser discretas ou limitadas, sem anúncios por frame, disparo ou fração de cooldown.

#### Scenario: Controles antes e durante a partida
- **WHEN** o usuário consulta o menu e depois entra em combate no modo escolhido
- **THEN** encontra guia correspondente de mouse/Q/W/E/R ou joypad/skills e nomes acessíveis para ações e estados, respeitando o fechamento prévio da dica visual touch na sessão
- **AND** botões e diálogos conservam foco visível e acesso por teclado; pause e resultado continuam anunciados de forma polida

#### Scenario: Descrição disponível após dispensar a dica
- **WHEN** o usuário fecha a dica visual touch e consulta a região de navegação com tecnologia assistiva
- **THEN** as instruções correspondentes ao modo de input continuam acessíveis e nenhuma referência de descrição aponta para conteúdo removido
- **AND** os estados de auto-sail e pausa continuam disponíveis nos respectivos controles e indicadores

## ADDED Requirements

### Requirement: Controles touch livres da badge de hospedagem

Em landscape touch, o HUD SHALL manter joypad, Q/W/E/R, dica e seu fechamento fora do retângulo ocupado pela badge recolhida Powered by Netlify, com separação mínima de 8 CSS px. O ajuste SHALL preservar safe areas, alvos de pelo menos 48×48 CSS px, cenário integral e controles sem sobreposição. Sem badge, SHALL não reservar espaço exclusivo para ela. A garantia não abrange o popover expandido pelo usuário.

#### Scenario: Badge presente em landscape compacto
- **WHEN** a batalha touch está em 568×320 ou 844×390 com badge recolhida no canto inferior direito e safe areas não nulas
- **THEN** as áreas acionáveis de joypad, Q/W/E/R e X ficam dentro da área útil, não se sobrepõem e permanecem a pelo menos 8 CSS px do retângulo da badge
- **AND** score, tempo, vida, Pause e o player permanecem legíveis; o cenário continua preenchendo o viewport
- **AND** o usuário consegue navegar e disparar simultaneamente sem a badge interceptar esses contatos

#### Scenario: Inclusão tardia, redimensionamento e remoção da badge
- **WHEN** a badge recolhida aparece depois da arena, muda suas dimensões ou deixa de ocupar a tela
- **THEN** o HUD ajusta sua ocupação e o enquadramento sem reiniciar a partida, alterar posição lógica, saúde, score, cooldowns ou modo de input
- **AND** a reserva exclusiva da badge desaparece quando ela não ocupa mais a tela

#### Scenario: Ambiente sem badge
- **WHEN** a arena touch é aberta em desenvolvimento ou preview sem badge
- **THEN** os controles usam o rodapé com safe areas e sem margem reservada ao provedor
- **AND** o comportamento visual desktop permanece preservado com e sem badge

### Requirement: Dica touch no rodapé com fechamento acessível

A dica visual touch SHALL ficar ancorada na borda inferior útil da arena, respeitando safe areas, controles e badge; sua altura SHALL não ser determinada pela posição acima do joypad ou das skills. SHALL oferecer X com nome acessível em inglês, foco visível e alvo mínimo de 48×48 CSS px. Fechar SHALL ocultar somente a dica, sem pausar, disparar armas ou alternar auto-sail.

#### Scenario: Dica visível em landscape
- **WHEN** a dica está habilitada em uma batalha touch em 568×320 ou 844×390
- **THEN** o texto e X ficam na faixa inferior livre, com quebra de linha quando necessária, sem colisões ou rolagem
- **AND** o espaço abaixo da dica corresponde somente à safe area e ao espaçamento visual de até 12 CSS px, independentemente da altura das skills

#### Scenario: Fechamento por toque e teclado
- **WHEN** o usuário aciona X por toque, Enter ou Space
- **THEN** a dica e X deixam de ocupar espaço e foco, e a arena continua respondendo normalmente
- **AND** o fechamento não gera comandos de gameplay nem modifica estado da partida
- **AND** se X tinha foco, o foco retorna à região de navegação disponível

### Requirement: Fechamento da dica durante a sessão da aba

O fechamento da dica touch SHALL ser lembrado durante a sessão da aba, inclusive entre partidas, pausa, rotações, trocas de modo e recarga da página. Uma sessão de aba sem preferência prévia SHALL apresentar a dica inicialmente. Se o armazenamento da sessão estiver indisponível, SHALL permitir fechar e lembrar a escolha em memória até a página ser recarregada, sem interromper o jogo.

#### Scenario: Nova partida e recarga na mesma sessão
- **WHEN** o usuário fecha a dica, retorna ao menu, inicia outra partida e recarrega a página mantendo a mesma sessão da aba
- **THEN** a dica touch permanece dispensada em cada entrada na arena
- **AND** o guia visual desktop continua disponível ao mudar para mouse ou teclado

#### Scenario: Sessão nova sem preferência
- **WHEN** uma sessão da aba sem preferência de fechamento acessa sua primeira batalha touch
- **THEN** a dica aparece no rodapé com X disponível

#### Scenario: Armazenamento indisponível
- **WHEN** o navegador impede leitura ou escrita da preferência da sessão
- **THEN** a batalha permanece funcional e o usuário consegue fechar a dica
- **AND** a preferência é mantida entre partidas enquanto a página permanecer carregada

### Requirement: Anúncios acessíveis independentes da dica visual

Os anúncios polidos de saúde crítica, aviso de dez segundos, pontuação e pausa/retomada SHALL permanecer disponíveis após fechar a dica touch. A região de anúncios SHALL ser independente do texto visual e de seu X; mudanças rotineiras de tempo, cooldown, auto-sail ou geometria SHALL não produzir anúncios adicionais por frame ou disparo.

#### Scenario: Marcos anunciados com dica fechada
- **WHEN** a dica touch está fechada e ocorrem saúde crítica, aviso de dez segundos, destruição de inimigo ou pausa/retomada
- **THEN** os mesmos anúncios discretos da experiência com dica visível continuam disponíveis às tecnologias assistivas
- **AND** o X removido e o texto instrucional não são anunciados como parte desses marcos

#### Scenario: Atualizações rotineiras silenciosas
- **WHEN** tempo, cooldowns, auto-sail ou posicionamento do HUD mudam sem um marco a anunciar
- **THEN** a região de anúncios não emite mensagens adicionais por essas atualizações
