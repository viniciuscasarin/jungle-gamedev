# Spec Delta

## MODIFIED Requirements

### Requirement: Rotas por waypoints seguras para cada casco

Inimigos SHALL usar rotas que consideram sólidos procedurais inflados pelo raio do casco, com conexões seguras entre regiões e endpoints reais. Movimento e correções SHALL respeitar a colisão autoritativa e o deslizamento tangencial possível. Caches e fronteiras de região SHALL não bloquear a perseguição; rota inválida SHALL não autorizar atravessar terra.

#### Scenario: Contornar ambas as ilhas
- **WHEN** Chaser ou Shooter precisa alcançar o player do lado oposto de um modelo de ilha em uma rota disponível
- **THEN** progride por waypoints ao redor da ilha, mantendo o casco fora da terra, inclusive em coordenadas negativas
- **AND** não permanece indefinidamente pressionando a costa por escolher um segmento que cruza a ilha

#### Scenario: Endpoints fora dos nós
- **WHEN** origem ou destino real não coincide com um waypoint
- **THEN** os segmentos que os conectam à rota respeitam o raio do casco e a geometria sólida

#### Scenario: Perseguição entre regiões
- **WHEN** o player cruza várias regiões enquanto um inimigo continua vivo
- **THEN** o inimigo recalcula conexões seguras sem exigir uma malha de todo o mundo explorado
- **AND** a reconstrução ou liberação de caches não muda o resultado para os mesmos passos e inputs

### Requirement: Separação local com colisão entre cascos

Navios vivos SHALL usar separação local e colisão autoritativa para impedir sobreposição persistente sem dano de casco, exceto o contato letal do Chaser. Separação SHALL nunca empurrar o player para terra. Empates e centros coincidentes SHALL ter resolução determinística; separação SHALL não apagar um contato válido de Chaser antes de resolvê-lo.

#### Scenario: Shooter encostado no player
- **WHEN** player parado ou navegando encontra Shooter junto à costa ou a uma fronteira de região
- **THEN** os cascos permanecem válidos e separados, podendo bloquear avanço quando não existe deslocamento seguro
- **AND** não recebem dano de contato nem atravessam cenário; a fronteira sem terra não limita a separação

#### Scenario: Grupo e centros coincidentes
- **WHEN** vários inimigos se encontram, inclusive numa preparação com centros coincidentes
- **THEN** a separação usa direção estável, conserva cascos válidos e não produz NaN nem desloca o player para sólido

## ADDED Requirements

### Requirement: Continuidade de entidades fora da tela

Inimigos vivos SHALL continuar existindo, navegando e combatendo segundo as regras atuais após sair da tela. Ocultação visual ou liberação de terreno SHALL não destruir, reiniciar ou teleportar inimigos, nem conceder score. O terreno necessário às suas ações SHALL permanecer consultável até destruição ou fim da partida.

#### Scenario: Inimigo oculto e reencontro
- **WHEN** a câmera deixa um inimigo para trás e depois volta a apresentá-lo
- **THEN** seu ID, saúde, rumo e cooldown correspondem à evolução autoritativa dos passos executados
- **AND** a saída da tela não cria evento de destruição, score ou uma nova entidade substituta
