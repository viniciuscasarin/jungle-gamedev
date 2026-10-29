# Spec Delta

## MODIFIED Requirements

### Requirement: Estado e eventos independentes da apresentação

Os contratos SHALL expor snapshots e eventos somente com dados tipados e readonly, incluindo índice do passo e tempo ativo explícito. Projéteis SHALL ter autoria estável e dados suficientes para reproduzir direção, facção, dano e vida restante. SHALL não depender de frameworks, canvas, DOM, HTTP, armazenamento ou relógio global para serem importados e utilizados.

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

## ADDED Requirements

### Requirement: Dados iniciais opcionais sem mutação posterior

A preparação de diagnóstico SHALL aceitar dados iniciais puros e imutáveis de entidades e projéteis com IDs únicos, reutilizando os contratos de combate. A ausência desses dados SHALL produzir o estado normal. O consumidor SHALL não ganhar comandos de teleporte, dano, morte ou score depois da inicialização.

#### Scenario: Captura e isolamento
- **WHEN** o consumidor fornece dados iniciais e depois modifica seus objetos de origem
- **THEN** a simulação preserva a captura original e seus snapshots somente leitura
- **AND** os resultados seguintes derivam de passos, inputs e regras, sem callbacks de sucesso
