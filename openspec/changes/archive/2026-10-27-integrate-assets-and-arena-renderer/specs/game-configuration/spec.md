# Spec Delta

## MODIFIED Requirements

### Requirement: Valores iniciais centralizados e versionados

A configuração SHALL representar os valores iniciais propostos no GDD v0.2, com unidades explícitas e versões de mapa e balanceamento. A geometria sólida refinada pelas artes SHALL substituir envelopes provisórios e atualizar a versão do mapa. Limites das opções SHALL ter uma única fonte. Parâmetros derivados SHALL ser calculados a partir dos valores autoritativos.

#### Scenario: Configuração padrão
- **WHEN** um consumidor solicita os valores iniciais
- **THEN** recebe sessão de 120 segundos, intervalo de spawn de 3 segundos, mapa de 960 por 540 unidades e versões identificáveis
- **AND** os parâmetros de movimento, armas, inimigos, spawn e controles correspondem às propostas documentadas no GDD
- **AND** a versão do mapa distingue a geometria sólida refinada dos envelopes da fundação

#### Scenario: Alcance derivado
- **WHEN** um consumidor calcula o alcance máximo de um projétil
- **THEN** utiliza velocidade multiplicada pela duração de vida
- **AND** não depende de uma constante de alcance duplicada e divergente

## ADDED Requirements

### Requirement: Geometria sólida de ilhas compartilhada

A configuração SHALL fornecer duas ilhas identificadas com posição, dimensões e polígonos convexos ou peças sólidas em unidades lógicas, serializáveis e profundamente imutáveis. SHALL distinguir litoral sólido de envelope e decoração, sem paths de asset ou dependência de plataforma. Render e consumidores futuros SHALL usar essa mesma geometria de gameplay.

#### Scenario: Mapa refinado
- **WHEN** um consumidor lê a configuração padrão
- **THEN** encontra ilhas northwest e southeast dentro das regiões propostas pelo GDD, mantendo o centro e rotas de água ao redor
- **AND** a documentação registra coordenadas, convenção dos polígonos e tolerância de alinhamento ao litoral visível
- **AND** o formato pode ser usado em testes sem DOM ou renderer

#### Scenario: Canto arredondado e água
- **WHEN** são comparados o envelope de uma ilha, suas peças sólidas e o litoral composto
- **THEN** as peças acompanham os cantos da areia e não tratam todo o retângulo-envelope como terra
- **AND** pixels de água e decorações sem obstáculo próprio não expandem a geometria sólida

#### Scenario: Snapshot de vértices
- **WHEN** a origem é alterada depois de capturar um snapshot ou o consumidor tenta modificar vértices capturados
- **THEN** a geometria do snapshot permanece inalterada, inclusive coleções e coordenadas aninhadas
