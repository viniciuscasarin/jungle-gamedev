# Spec Delta

## Purpose

Garantir que o navegador apresente uma aplicação inicial acessível e que seus recursos de renderização possam ser iniciados e liberados com segurança.

## ADDED Requirements

### Requirement: Tela inicial mínima acessível

A aplicação SHALL exibir o título Pirate Battle, uma descrição em inglês do estado inicial do projeto e uma prévia decorativa de renderização, com conteúdo semântico independente do canvas e layout utilizável a partir de 320 CSS pixels.

#### Scenario: Primeiro acesso
- **WHEN** o usuário abre a aplicação no navegador
- **THEN** encontra um título principal, uma explicação legível da fundação e uma prévia sem promessas de partida funcional
- **AND** tecnologias assistivas conseguem ler o conteúdo sem depender do canvas

#### Scenario: Visualização estreita
- **WHEN** o viewport tem 320 CSS pixels de largura
- **THEN** o conteúdo continua legível, sem rolagem horizontal obrigatória, sobreposição ou corte do título

### Requirement: Recursos de renderização com dono explícito

A aplicação SHALL manter no máximo um canvas ativo por área de prévia e SHALL liberar recursos, observadores e inscrições próprios ao desmontar, inclusive quando a inicialização assíncrona termina após a desmontagem.

#### Scenario: Montagem repetida
- **WHEN** a área de prévia é montada, desmontada e montada novamente
- **THEN** somente a instância atual permanece anexada
- **AND** as instâncias anteriores não mantêm loops, listeners ou recursos próprios vivos

#### Scenario: Inicialização tardia
- **WHEN** uma inicialização pendente conclui depois que a área foi desmontada
- **THEN** a instância tardia é descartada sem anexar canvas nem atualizar a interface desmontada

### Requirement: Falha de renderização legível

A aplicação SHALL manter o conteúdo semântico disponível e informar em inglês uma falha de inicialização do renderer, sem apresentar a prévia como inicializada.

#### Scenario: Renderer indisponível
- **WHEN** a inicialização gráfica rejeita ou o navegador não oferece um contexto compatível
- **THEN** a tela continua legível e apresenta uma mensagem de falha acessível
- **AND** não há rejeição de promise sem tratamento nem canvas órfão
