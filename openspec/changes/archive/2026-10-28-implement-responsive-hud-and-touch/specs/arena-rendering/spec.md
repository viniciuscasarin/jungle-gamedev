# Spec Delta

## MODIFIED Requirements

### Requirement: Mundo completo sem distorção

O enquadramento SHALL exibir o mundo inteiro com escala uniforme, centralização e letterbox quando necessário. SHALL reservar faixas superiores e inferiores correspondentes ao HUD/controles reais do modo corrente, respeitar safe areas uma única vez e manter conteúdo e ações legíveis a partir de 320 CSS pixels, em portrait e landscape. Alterações dessas faixas SHALL atualizar o enquadramento mesmo sem resize do host.

#### Scenario: Redimensionamento e rotação
- **WHEN** o host muda de tamanho ou orientação
- **THEN** o mundo permanece inteiro, os tiles continuam quadrados e os navios mantêm a razão de aspecto
- **AND** posições lógicas não mudam nem a arena é coberta pelas faixas reservadas

#### Scenario: HUD muda no mesmo host
- **WHEN** uma troca de modo ou reorganização do grupo de skills modifica as faixas ocupadas sem alterar o tamanho externo
- **THEN** a arena se ajusta à área livre efetiva sem sobrepor os controles ou reiniciar a simulação
- **AND** o mesmo enquadramento em CSS pixels serve à apresentação e à conversão de coordenadas de input

#### Scenario: Insets seguros e área temporariamente pequena
- **WHEN** existem safe areas não nulas ou a área útil fica temporariamente vazia
- **THEN** os insets não são aplicados duas vezes e nenhuma transformação inválida é consumida
- **AND** o enquadramento retoma quando houver área útil, preservando estado e configuração

## ADDED Requirements

### Requirement: Saúde sobre todos os navios vivos

Cada navio vivo SHALL ter barra de saúde horizontal sobre sua posição na arena PixiJS, sem herdar a rotação do casco. Preenchimento SHALL refletir saúde atual/máxima do estado autoritativo. As barras SHALL permanecer legíveis em 320 CSS px e dentro dos limites visíveis, acompanhar movimento e desaparecer na morte ou descarte.

#### Scenario: Player e arquétipos danificados
- **WHEN** player, Chaser e Shooter vivos recebem dano real de projéteis ou contato válido e giram ou se movem
- **THEN** suas barras acompanham a posição, reduzem proporcionalmente e permanecem horizontais
- **AND** a barra do player permanece sobre o navio mesmo com vida também apresentada no HUD

#### Scenario: Pausa, limites e morte
- **WHEN** navios se aproximam das bordas, a partida pausa, ocorre resize ou um navio chega a zero de vida
- **THEN** barras vivas permanecem contidas e coerentes com o estado congelado ou reapresentado; a barra do navio morto é removida
- **AND** saída da arena libera recursos próprios das barras sem destruir texturas compartilhadas ou deixar outro loop ativo
