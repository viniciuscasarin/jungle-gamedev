# Spec Delta

## MODIFIED Requirements

### Requirement: Tela inicial mínima acessível

A aplicação SHALL exibir Pirate Battle e o fluxo mínimo Main Menu, Loading e Static Arena, com ações Play, Retry e Main Menu onde aplicáveis. Texto e status SHALL estar em inglês, indicar que a arena é estática e permanecer semânticos independentemente do canvas, com layout utilizável a partir de 320 CSS pixels.

#### Scenario: Primeiro acesso
- **WHEN** o usuário abre a aplicação no navegador
- **THEN** encontra o título principal, uma explicação legível do preview estático e Play acessível por teclado e toque
- **AND** tecnologias assistivas conseguem ler o conteúdo sem depender do canvas

#### Scenario: Visualização estreita
- **WHEN** o viewport tem 320 CSS pixels de largura
- **THEN** conteúdo e ações continuam legíveis, sem rolagem horizontal obrigatória, sobreposição ou corte do título

#### Scenario: Loading e arena
- **WHEN** Play é acionado
- **THEN** Loading fica perceptível e expõe status semântico durante a preparação
- **AND** somente o sucesso completo apresenta Static Arena com Main Menu e aviso de que nenhuma partida está rodando

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
