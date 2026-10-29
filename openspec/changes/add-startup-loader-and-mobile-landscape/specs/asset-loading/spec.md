# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
