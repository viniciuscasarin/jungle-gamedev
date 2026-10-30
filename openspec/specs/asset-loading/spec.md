# asset-loading Specification

## Purpose

Disponibilizar os assets fornecidos de forma verificável e recuperável, com compartilhamento seguro entre consumidores e procedência documentada sem atribuições inventadas.

## Requirements

### Requirement: Catálogo visual verificado

O sistema SHALL disponibilizar um catálogo tipado de assets com papéis semânticos, arquivos e dimensões lógicas verificados para player, Chaser, Shooter, bala de canhão, água, ilhas e UI, incluindo os estados fornecidos usados pelos controles de menu. IDs próximos SHALL não implicar sequência de animação ou dano sem verificação visual e documental.

#### Scenario: Identidades dos navios
- **WHEN** o catálogo é consultado
- **THEN** player corresponde a ship_5 de vela azul clara, Chaser a ship_3 de vela vermelha e Shooter a ship_8 de vela escura, todos dos PNGs default fornecidos
- **AND** o mapeamento registra dimensão 66×113 e orientação original para baixo

#### Scenario: Densidade e metadados
- **WHEN** uma textura possui variante retina ou metadados de layout
- **THEN** dimensões lógicas são distinguidas de pixels físicos e os retângulos/bordas lógicos da UI são preservados
- **AND** nenhuma variante é tratada como 2× somente por seu nome

#### Scenario: Bala fornecida
- **WHEN** a arena prepara os recursos necessários ao combate
- **THEN** o catálogo inclui assets/png/default/ship_parts/cannon_ball.png, esfera cinza transparente verificada de 10×10 pixels e unidades lógicas
- **AND** a bala participa do carregamento obrigatório, cache compartilhado e créditos com procedência e pendências reais

#### Scenario: Estados reais dos controles de menu
- **WHEN** controles primários e secundários são desenhados no menu ou Options
- **THEN** primários usam normal, hover, pressed e disabled verificados; secundários usam normal e pressed fornecidos, com foco visível e sem herdar imagens primárias
- **AND** o layout respeita retângulos de conteúdo e label, âncoras e bordas em unidades lógicas 1×, inclusive com textura retina; painéis de altura variável preservam bordas sem esticar toda a arte

### Requirement: Carregamento compartilhado recuperável

O carregamento SHALL compartilhar texturas válidas e trabalho pendente entre consumidores concorrentes, incluindo a preparação inicial e Play. Uma falha SHALL permitir nova tentativa sem recarregar a página e sem manter rejeição permanente no cache. A arena SHALL ser apresentada como pronta somente após todos os assets obrigatórios estarem disponíveis.

#### Scenario: Consumidores concorrentes
- **WHEN** dois consumidores solicitam o mesmo conjunto durante um carregamento
- **THEN** compartilham o carregamento e recebem texturas utilizáveis sem duplicação por consumidor

#### Scenario: Falha e nova tentativa
- **WHEN** um asset obrigatório falha e o usuário escolhe Retry
- **THEN** a nova tentativa pode concluir com sucesso
- **AND** nenhuma arena parcial é anunciada como pronta nem rejeição permanece sem tratamento

#### Scenario: Primeiro Play após preparação inicial
- **WHEN** o usuário aciona Play após a preparação inicial bem-sucedida
- **THEN** as texturas previamente carregadas são reutilizadas sem novo carregamento pelo backend de assets
- **AND** a criação do renderer mantém sua própria validação e recuperação sem executar uma partida durante a preparação inicial

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

### Requirement: Recursos decorativos DOM independentes da arena

Recursos usados exclusivamente na decoração DOM de menu e Options SHALL participar da preparação visual inicial, incluindo seus estados interativos usados pelo jogo. Sua falha SHALL bloquear a revelação inicial do menu e permitir Retry. Após essa preparação, SHALL permanecer independentes das texturas obrigatórias de combate e não exigir alocação no renderer apenas para decorar DOM.

#### Scenario: Imagem de menu indisponível
- **WHEN** uma imagem exclusiva DOM falha na preparação inicial e os assets obrigatórios da arena estão disponíveis
- **THEN** a tela inicial apresenta falha recuperável, conservando texto, Retry e foco utilizáveis
- **AND** a imagem ausente é identificada como falha de preparação visual inicial, sem invalidar ou recarregar texturas de combate já disponíveis

#### Scenario: Estados de controles preparados
- **WHEN** a preparação inicial conclui e o usuário abre Options ou pressiona, destaca ou desabilita um controle
- **THEN** as imagens usadas nesses estados já estão disponíveis
- **AND** a interface não revela botões ou painéis incompletos por carregamento tardio desses recursos

### Requirement: Preparação inicial dos recursos usados

A aplicação SHALL preparar o logo e todos os assets visuais utilizados por menu, Options, HUD e arena antes de revelar o menu. Imagens SHALL estar carregadas e decodificadas ou utilizáveis pelo consumidor correspondente. Recursos duplicados SHALL ser contabilizados uma vez por identidade de carregamento. A preparação SHALL não incluir arquivos sem uso nem depender de respostas de ranking ou histórico.

#### Scenario: Conjunto visual completo
- **WHEN** uma imagem obrigatória de menu, HUD ou combate ainda está pendente
- **THEN** a preparação permanece visível e o menu indisponível
- **AND** a conclusão de outras imagens não libera uma interface parcial

#### Scenario: Independência de dados remotos
- **WHEN** os assets concluem e ranking ou histórico respondem lentamente ou falham
- **THEN** esses dados não impedem a conclusão da preparação inicial
- **AND** suas telas mantêm os estados de rede próprios já existentes

### Requirement: Progresso real e conclusão verificável

A preparação SHALL publicar progresso entre 0 e 100 baseado na quantidade de recursos concluídos de um conjunto estável. O valor SHALL não diminuir dentro da mesma tentativa nem avançar por temporizador. Recursos visuais com falha SHALL não contar como sucesso. O valor 100 SHALL ser reservado à prontidão completa; Retry SHALL contabilizar os sucessos preservados e tentar os recursos faltantes.

#### Scenario: Conclusões fora de ordem
- **WHEN** recursos terminam em ordem diferente da solicitação
- **THEN** o progresso acompanha cada conclusão sem duplicação, regressão ou salto para sucesso antes da prontidão completa

#### Scenario: Cache quente e Retry
- **WHEN** alguns recursos estão em cache e outro falha e depois é recuperado por Retry
- **THEN** recursos válidos continuam contabilizados e não são solicitados novamente ao backend
- **AND** a nova tentativa só chega a 100 após todos os recursos obrigatórios ficarem prontos

#### Scenario: Recurso sem resposta
- **WHEN** um recurso visual não conclui nem rejeita por 30 segundos na tentativa atual
- **THEN** a preparação apresenta falha recuperável em vez de esperar indefinidamente
- **AND** uma conclusão tardia não substitui o estado de uma tentativa posterior

### Requirement: Transferência antecipada de áudio sem reprodução

A preparação SHALL antecipar a transferência dos sons utilizados pelo jogo sem emitir áudio e sem depender de desbloquear sua reprodução. Áudio indisponível, sem suporte ou excedendo 30 segundos SHALL finalizar sua participação em modo silencioso, sem impedir o menu. A reprodução SHALL continuar exigindo gesto do usuário e respeitando mute, sem repetir transferências bem-sucedidas durante a mesma sessão.

#### Scenario: Entrada sem gesto
- **WHEN** a página prepara sons antes da primeira interação
- **THEN** seus dados podem ser transferidos, mas nenhum som é reproduzido nem o menu exige desbloqueio de áudio

#### Scenario: Som indisponível
- **WHEN** um som falha ou o ambiente não suporta o subsistema de áudio
- **THEN** a participação desse recurso termina com alternativa silenciosa explícita no estado de preparação
- **AND** os demais recursos podem concluir normalmente, sem rejeição não tratada

#### Scenario: Primeiro efeito após interação
- **WHEN** o usuário interage e o jogo solicita um som cuja transferência inicial concluiu
- **THEN** o subsistema reutiliza os dados preparados, realiza a decodificação necessária e respeita o estado de mute
- **AND** não baixa o mesmo arquivo novamente pelo caminho de reprodução
