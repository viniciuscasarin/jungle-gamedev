# Spec Delta

## MODIFIED Requirements

### Requirement: Estado e eventos independentes da apresentação

Os contratos SHALL expor snapshots e eventos somente com dados tipados e readonly, incluindo índice do passo e tempo ativo explícito. Projéteis SHALL ter autoria estável e dados suficientes para reproduzir direção, facção, dano e vida restante. Eventos de simulação SHALL discriminar dano, destruição, pontuação, término, disparos de armas e impactos de projéteis na água. SHALL não depender de frameworks, canvas, DOM, HTTP, armazenamento ou relógio global para serem importados e utilizados.

#### Scenario: Consumidor sem navegador
- **WHEN** um teste executado sem DOM importa os contratos e constrói um snapshot e um evento válidos
- **THEN** pode inspecionar estado e tempo ativo sem inicializar renderer, rede ou relógio do sistema

#### Scenario: Eventos discriminados
- **WHEN** um consumidor recebe um evento de dano, destruição, pontuação ou término
- **THEN** pode identificar seu tipo e payload sem referências a objetos gráficos ou callbacks
- **AND** dano e destruição preservam a autoria mesmo depois de removido o emissor

#### Scenario: Projétil independente do emissor
- **WHEN** uma bala sobrevive à destruição do navio que a disparou
- **THEN** seus dados autoritativos continuam definindo trajetória, alvos válidos, dano e expiração sem consultar um navio vivo

#### Scenario: Eventos de disparo e impacto na água
- **WHEN** canhões disparam ou um projétil expira na água sem atingir navios ou terra
- **THEN** a simulação emite respectivamente eventos puros de tipo 'fire' e 'water_hit'
- **AND** os eventos fornecem coordenadas lógicas e rumo sem acoplamento a bibliotecas gráficas ou de áudio
