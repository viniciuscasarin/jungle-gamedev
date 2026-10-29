# Spec Delta

## MODIFIED Requirements

### Requirement: Mundo completo sem distorção

O enquadramento SHALL exibir o mundo inteiro com escala uniforme, centralização e letterbox quando necessário. SHALL reservar faixas superiores e inferiores correspondentes ao HUD/controles reais do modo corrente, respeitar safe areas uma única vez e manter conteúdo e ações legíveis a partir de 320 CSS pixels nas orientações permitidas: portrait ou landscape no desktop e somente landscape no mobile. Alterações dessas faixas SHALL atualizar o enquadramento mesmo sem resize do host.

#### Scenario: Redimensionamento e rotação
- **WHEN** o host muda de tamanho ou orientação
- **THEN** nas orientações permitidas o mundo permanece inteiro, os tiles continuam quadrados e os navios mantêm a razão de aspecto
- **AND** posições lógicas não mudam nem a arena é coberta pelas faixas reservadas; entrar em portrait mobile congela a partida sob a proteção de orientação

#### Scenario: HUD muda no mesmo host
- **WHEN** uma troca de modo ou reorganização do grupo de skills modifica as faixas ocupadas sem alterar o tamanho externo
- **THEN** a arena se ajusta à área livre efetiva sem sobrepor os controles ou reiniciar a simulação
- **AND** o mesmo enquadramento em CSS pixels serve à apresentação e à conversão de coordenadas de input

#### Scenario: Insets seguros e área temporariamente pequena
- **WHEN** existem safe areas não nulas ou a área útil fica temporariamente vazia
- **THEN** os insets não são aplicados duas vezes e nenhuma transformação inválida é consumida
- **AND** o enquadramento retoma quando houver área útil, preservando estado e configuração

#### Scenario: Retorno de portrait mobile
- **WHEN** o aparelho retorna a landscape após a proteção de orientação
- **THEN** a arena usa a área útil atual e mantém a mesma partida e configuração, sem canvas ou loop duplicado
- **AND** o mundo fica congelado até Resume explícito, com transformação atualizada antes de aceitar novo input
