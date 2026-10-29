# Spec Delta

## Purpose

Disponibilizar os assets fornecidos de forma verificável e recuperável, com compartilhamento seguro entre consumidores e procedência documentada sem atribuições inventadas.

## ADDED Requirements

### Requirement: Catálogo visual verificado

O sistema SHALL disponibilizar um catálogo tipado de assets com papéis semânticos, arquivos e dimensões lógicas verificados para player, Chaser, Shooter, água, ilhas e UI. IDs próximos SHALL não implicar sequência de animação ou dano sem verificação visual e documental.

#### Scenario: Identidades dos navios
- **WHEN** o catálogo é consultado
- **THEN** player corresponde a ship_5 de vela azul clara, Chaser a ship_3 de vela vermelha e Shooter a ship_8 de vela escura, todos dos PNGs default fornecidos
- **AND** o mapeamento registra dimensão 66×113 e orientação original para baixo

#### Scenario: Densidade e metadados
- **WHEN** uma textura possui variante retina ou metadados de layout
- **THEN** dimensões lógicas são distinguidas de pixels físicos e os retângulos/bordas lógicos da UI são preservados
- **AND** nenhuma variante é tratada como 2× somente por seu nome

### Requirement: Carregamento compartilhado recuperável

O carregamento SHALL compartilhar texturas válidas e trabalho pendente entre consumidores concorrentes. Uma falha SHALL permitir nova tentativa sem recarregar a página e sem manter rejeição permanente no cache. A arena SHALL ser apresentada como pronta somente após todos os assets obrigatórios estarem disponíveis.

#### Scenario: Consumidores concorrentes
- **WHEN** dois consumidores solicitam o mesmo conjunto durante um carregamento
- **THEN** compartilham o carregamento e recebem texturas utilizáveis sem duplicação por consumidor

#### Scenario: Falha e nova tentativa
- **WHEN** um asset obrigatório falha e o usuário escolhe Retry
- **THEN** a nova tentativa pode concluir com sucesso
- **AND** nenhuma arena parcial é anunciada como pronta nem rejeição permanece sem tratamento

### Requirement: Falha demonstrável com cache quente

O sistema SHALL oferecer um cenário documentado e determinístico de falha única de assets por acesso configurado, que também funcione com cache quente. A próxima tentativa com Retry SHALL utilizar o caminho normal de sucesso. O cenário SHALL poder ser desligado sem alterar arquivos do produto.

#### Scenario: Reproduzir recuperação
- **WHEN** o cenário de falha única é ativado e Play é acionado
- **THEN** o estado de falha de carregamento fica visível mesmo se os assets já estiverem em cache
- **AND** Retry carrega a arena sem exigir refresh

### Requirement: Texturas compartilhadas sobrevivem a consumidores descartados

O descarte de um consumidor SHALL liberar sua participação sem destruir texturas ainda usadas por outro. O descarte final do cache SHALL ocorrer somente sem consumidores ativos nem trabalho pendente capaz de entregar recursos não contabilizados.

#### Scenario: Um consumidor permanece
- **WHEN** dois consumidores compartilham texturas e um é desmontado
- **THEN** o outro continua podendo renderizar sem textura destruída

#### Scenario: Último consumidor e inicialização tardia
- **WHEN** o descarte final é solicitado após saída dos consumidores enquanto um carregamento ainda conclui
- **THEN** a conclusão não anexa recursos a consumidores antigos e os recursos remanescentes seguem a política documentada de liberação final

### Requirement: Procedência e pendências explícitas

O arquivo ASSET_CREDITS.md SHALL documentar em inglês os recursos fornecidos usados, evidência de origem disponível, transformações efetuadas e pendências reais de autoria/licença. SHALL não atribuir autor ou licença por semelhança visual.

#### Scenario: Licença ausente
- **WHEN** os arquivos fornecidos não documentam autor e licença
- **THEN** os créditos identificam o repositório/challenge como procedência conhecida e registram autoria e licença como não documentadas
- **AND** nenhuma licença inventada é apresentada como comprovada
