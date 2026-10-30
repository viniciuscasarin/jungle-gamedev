# Spec Delta

## Purpose

Permitir exploração contínua de um oceano procedural com ilhas predefinidas e rotas navegáveis, reconstruindo o mesmo terreno por seed e coordenadas sem reter todo o percurso em memória.

## ADDED Requirements

### Requirement: Terreno determinístico sem perímetro jogável

O mundo SHALL gerar regiões a partir de configuração versionada, seed e coordenadas assinadas, sem bordas físicas de mapa. Conteúdo e IDs SHALL ser independentes da ordem de consulta, da câmera e de caches, inclusive após descarregar e reconstruir uma região.

#### Scenario: Exploração em ordens diferentes
- **WHEN** consumidores consultam as mesmas regiões com a mesma preparação em ordens distintas, incluindo coordenadas negativas
- **THEN** os modelos, posições, contornos e IDs de cada região coincidem
- **AND** carregar terreno não consome o RNG de inimigos nem altera entidades ou eventos de combate

#### Scenario: Ida e volta
- **WHEN** o player cruza os antigos limites da arena, afasta-se e revisita uma região já descarregada
- **THEN** navega sem parede, teleporte ou troca de partida e encontra o mesmo terreno
- **AND** o tempo ativo continua sujeito ao limite da sessão capturada

### Requirement: Catálogo de ilhas com geometria correspondente

As ilhas SHALL ser instâncias de modelos predefinidos compactos, alongados e largos. Cada modelo SHALL definir dimensões, litoral sólido e composição visual compatíveis. Instâncias SHALL manter tiles proporcionais e distinguir água, areia sólida e decoração sem colisão implícita.

#### Scenario: Variação e alinhamento
- **WHEN** regiões de uma amostra documentada de seeds são apresentadas e inspecionadas em diagnóstico
- **THEN** os três tipos de modelo aparecem na amostra e seus contornos acompanham a areia dentro da tolerância documentada
- **AND** nenhuma ilha muda de formato por resize, nova consulta ou reentrada na região

### Requirement: Perfis predefinidos de espaçamento

A distribuição SHALL usar perfis configurados próximo, médio e distante entre litorais de pares vizinhos definidos pelo layout, com distância-alvo e tolerância explícitas. Toda dupla de ilhas, inclusive de regiões distintas, SHALL respeitar a separação mínima navegável. Limites de região SHALL não permitir sobreposição ou passagens abaixo desse mínimo.

#### Scenario: Distâncias de um layout
- **WHEN** um layout é gerado com os valores iniciais de alvo 160, 280 e 440 unidades
- **THEN** cada par designado atende ao perfil escolhido medido entre os contornos sólidos, dentro da tolerância capturada
- **AND** distâncias entre centros ou envelopes não substituem essa medição

#### Scenario: Vizinhança entre regiões
- **WHEN** regiões adjacentes ou diagonais são geradas em qualquer ordem
- **THEN** não existem ilhas sobrepostas, duplicadas ou corredores menores que a separação mínima
- **AND** a garantia usa o maior casco configurado e a folga de manobra, mesmo que uma região ainda não tenha sido desenhada

### Requirement: Água conectada e manobra possível

Cada layout SHALL preservar água navegável ao redor de suas ilhas e conexões com regiões vizinhas para o maior casco configurado. A validação SHALL considerar contornos inflados e folga de manobra, impedindo bolsões isolados e gargalos intransponíveis.

#### Scenario: Travessia e contorno
- **WHEN** o player navega por passagens internas e cruza fronteiras entre regiões de layouts diferentes
- **THEN** existem rotas contínuas de água sem atravessar terra ou depender de uma região renderizada
- **AND** o navio consegue contornar os modelos e realizar manobras usando velocidade e giro atuais

### Requirement: Início seguro e repetível

A geração SHALL reservar uma área de água ao redor da posição inicial configurada, com espaço para casco e manobra. A exclusão de ilhas nessa área SHALL ser determinística e persistir na reconstrução das regiões afetadas.

#### Scenario: Preparação e revisita do início
- **WHEN** uma partida normal começa e depois retorna à área inicial
- **THEN** o player inicia em posição válida, com saúde, rumo e controles atuais, e o terreno inicial continua idêntico
- **AND** a reserva de água não adiciona inimigos ou projéteis iniciais

### Requirement: Terreno disponível antes da interação

Consultas de colisão, navegação e spawn SHALL obter terreno para toda a área necessária antes de resolver a interação. Ausência de dados no cache SHALL não ser interpretada como água livre. A liberação de recursos distantes SHALL não modificar a geometria do mundo.

#### Scenario: Movimento e projétil na fronteira
- **WHEN** um casco ou projétil alcança uma ilha de uma região ainda ausente da apresentação
- **THEN** a geometria necessária é consultada antes da varredura e o primeiro contato é respeitado
- **AND** pré-carregamento visual em outra ordem não altera o resultado autoritativo
