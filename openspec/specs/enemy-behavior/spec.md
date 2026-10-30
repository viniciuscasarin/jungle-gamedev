# enemy-behavior Specification

## Purpose

Produzir adversários autônomos reproduzíveis que navegam pela água, respeitam os cascos e atacam somente nas condições táticas configuradas.

## Requirements

### Requirement: Perseguição do Chaser

Chaser vivo SHALL buscar a posição atual do player, girar e avançar com velocidades configuradas e sem arma de projétil. O contato SHALL aplicar uma única vez o dano configurado e autodestruir o Chaser sem conceder score, respeitando a prioridade das balas existentes.

#### Scenario: Perseguição e contato
- **WHEN** o player muda de posição durante uma aproximação
- **THEN** o Chaser atualiza a perseguição sem teleporte ou giro acima do limite
- **AND** ao tocar o player causa 25 de dano uma vez, desaparece e concede zero pontos na configuração padrão

#### Scenario: Chaser morto antes de agir
- **WHEN** projétil existente mata um Chaser que tocaria o player nesse passo
- **THEN** não move nem causa contato depois da morte e a pontuação segue a autoria do projétil

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

### Requirement: Distância tática do Shooter

Shooter SHALL buscar distância preferida configurada com histerese, usando rumo e avanço limitados. Se a ilha obstrui a visão, SHALL reposicionar por rota navegável até obter linha de visão em vez de permanecer estacionário tentando atirar através dela. Mira SHALL usar a posição atual do player sem predição.

#### Scenario: Banda e retenção de estado
- **WHEN** a configuração padrão observa distância acima de 270 ou abaixo de 210 unidades
- **THEN** inicia respectivamente aproximação ou afastamento até atingir 240 unidades
- **AND** sem estado de correção ativo mantém posição na banda 210–270 e não oscila por pequenas mudanças

#### Scenario: Player atrás de ilha
- **WHEN** o player está no alcance nominal mas protegido por uma ilha
- **THEN** o Shooter reposiciona com waypoints seguros, sem emitir tiros bloqueados através da terra

### Requirement: Tiro elegível e primeira espera completa

Shooter SHALL disparar uma bala frontal inimiga somente com player vivo, distância dentro do alcance, linha de visão livre e erro entre rumo real e alvo até a tolerância configurada. Ao entrar em alcance SHALL aguardar cooldown completo. Sair do alcance SHALL reiniciar essa espera; obstrução ou erro angular dentro dele SHALL impedir disparo sem reiniciar a recarga.

#### Scenario: Limites e primeiro disparo
- **WHEN** Shooter entra em distância até 300 unidades na configuração padrão
- **THEN** não dispara antes de 1500ms ativos nessa entrada
- **AND** só emite se erro angular for no máximo 10 graus e a trajetória circular da bala até o player estiver livre de sólidos

#### Scenario: Recarga pronta aguardando mira
- **WHEN** a recarga termina em alcance mas a mira ou linha de visão ainda impede disparo
- **THEN** aguarda elegibilidade e dispara na primeira oportunidade válida sem uma espera adicional
- **AND** após emitir aguarda outro cooldown completo, com dano 10, velocidade 260 e lifetime 1500ms padrão

#### Scenario: Saída e reentrada
- **WHEN** o Shooter sai para além do alcance antes de disparar e retorna
- **THEN** a reentrada exige outra espera completa mesmo que a recarga anterior estivesse pronta

### Requirement: Separação local com colisão entre cascos

Navios vivos SHALL usar separação local e colisão autoritativa para impedir sobreposição persistente sem dano de casco, exceto o contato letal do Chaser. Separação SHALL nunca empurrar o player para terra. Empates e centros coincidentes SHALL ter resolução determinística; separação SHALL não apagar um contato válido de Chaser antes de resolvê-lo.

#### Scenario: Shooter encostado no player
- **WHEN** player parado ou navegando encontra Shooter junto à costa ou a uma fronteira de região
- **THEN** os cascos permanecem válidos e separados, podendo bloquear avanço quando não existe deslocamento seguro
- **AND** não recebem dano de contato nem atravessam cenário; a fronteira sem terra não limita a separação

#### Scenario: Grupo e centros coincidentes
- **WHEN** vários inimigos se encontram, inclusive numa preparação com centros coincidentes
- **THEN** a separação usa direção estável, conserva cascos válidos e não produz NaN nem desloca o player para sólido

### Requirement: Continuidade de entidades fora da tela

Inimigos vivos SHALL continuar existindo, navegando e combatendo segundo as regras atuais após sair da tela. Ocultação visual ou liberação de terreno SHALL não destruir, reiniciar ou teleportar inimigos, nem conceder score. O terreno necessário às suas ações SHALL permanecer consultável até destruição ou fim da partida.

#### Scenario: Inimigo oculto e reencontro
- **WHEN** a câmera deixa um inimigo para trás e depois volta a apresentá-lo
- **THEN** seu ID, saúde, rumo e cooldown correspondem à evolução autoritativa dos passos executados
- **AND** a saída da tela não cria evento de destruição, score ou uma nova entidade substituta
