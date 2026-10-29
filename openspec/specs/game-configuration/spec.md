# game-configuration Specification

## Purpose

Fornecer uma fonte tipada e rastreável de parâmetros de jogo, permitindo capturar configurações reproduzíveis sem influência posterior de alterações externas.

## Requirements

### Requirement: Valores iniciais centralizados e versionados

A configuração SHALL representar valores iniciais do GDD v0.2 com unidades explícitas e versões de mapa e balanceamento. A calibração de armas e combate SHALL ser governada por identificador estável de versão de balanceamento, preservando a coerência dos parâmetros autoritativos. A geometria sólida refinada SHALL substituir envelopes e atualizar a versão do mapa. Limites das opções SHALL ter fonte única. Parâmetros derivados SHALL ser calculados a partir dos valores autoritativos.

#### Scenario: Configuração padrão
- **WHEN** um consumidor solicita os valores iniciais
- **THEN** recebe sessão de 120 segundos, intervalo de spawn de 3 segundos, mapa de 960 por 540 unidades e versões identificáveis
- **AND** os parâmetros de movimento, armas, inimigos, spawn e controles correspondem às propostas documentadas no GDD sob versão identificável de balanceamento
- **AND** a versão do mapa distingue a geometria sólida refinada dos envelopes da fundação

#### Scenario: Alcance derivado
- **WHEN** um consumidor calcula o alcance máximo de um projétil
- **THEN** utiliza velocidade multiplicada pela duração de vida
- **AND** não depende de uma constante de alcance duplicada e divergente

### Requirement: Validação das opções de partida

A criação da configuração SHALL aceitar sessão inteira entre 60 e 180 segundos e intervalo de spawn entre 1 e 10 segundos em passos de 0,5. Valores não finitos, fora dos limites ou fora da granularidade SHALL ser rejeitados antes de produzir configuração utilizável.

#### Scenario: Limites válidos
- **WHEN** são informados 60 ou 180 segundos de sessão e 1 ou 10 segundos de spawn
- **THEN** a configuração é aceita preservando as unidades declaradas

#### Scenario: Valores inválidos
- **WHEN** são informados sessão de 60,5 segundos, spawn de 1,1 segundo, NaN, infinito ou valor fora dos limites
- **THEN** a criação informa um erro e não entrega configuração parcialmente válida

### Requirement: Snapshot profundamente imutável

A captura de configuração SHALL copiar e proteger profundamente objetos e coleções aninhados. Alterações posteriores nos dados de origem SHALL não modificar o snapshot, e tentativas de mutar o snapshot SHALL não alterar seu conteúdo.

#### Scenario: Edição posterior da origem
- **WHEN** um snapshot é capturado e a origem sofre alterações em armas, opções ou geometria aninhada
- **THEN** todos os valores capturados permanecem iguais

#### Scenario: Mutação pelo consumidor
- **WHEN** um consumidor tenta alterar um campo ou uma coleção dentro do snapshot
- **THEN** o tipo impede a escrita e a proteção de runtime mantém o conteúdo original


#### Scenario: Captura de opções salvas atuais
- **WHEN** Play ou Play Again prepara uma nova partida
- **THEN** os valores locais válidos são aplicados aos parâmetros atuais de mapa e tuning antes da captura completa
- **AND** opções ausentes usam defaults e opções inválidas recuperam defaults com explicação visível; partidas e resultados anteriores permanecem imutáveis

### Requirement: Seed independente da configuração

O contrato de preparação de partida SHALL conter configuração e seed em campos separados. A seed SHALL ser um inteiro sem sinal de 32 bits e SHALL não compor os parâmetros da configuração nem o futuro agrupamento de ranking.

#### Scenario: Duas seeds para a mesma configuração
- **WHEN** duas preparações usam configurações idênticas e seeds diferentes
- **THEN** as configurações permanecem idênticas e independentes da seed

#### Scenario: Seed inválida
- **WHEN** a preparação recebe seed negativa, fracionária, não finita ou superior a 4294967295
- **THEN** a preparação é rejeitada antes de disponibilizar dados para uma partida

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

### Requirement: Geometria de projétil centralizada

Raio de colisão da bala e folga de emissão SHALL estar na configuração tipada em unidades lógicas, capturados com os demais parâmetros. Valores técnicos adicionais SHALL ser documentados como hipóteses geométricas e não substituir dano, quantidade, cadência, velocidade, lifetime ou espaçamento propostos no GDD.

#### Scenario: Dimensões e alcance consistentes
- **WHEN** combate e diagnóstico usam a configuração inicial
- **THEN** compartilham raio e folga explícitos e não dependem da dimensão física da textura para decidir colisões
- **AND** Q mantém dano 20, quantidade 1, cooldown 350ms, velocidade 420 e vida 1200ms; W/E mantêm dano 20, quantidade 3, cooldown 1200ms, velocidade 360, vida 1000ms e espaçamento 14
- **AND** alcance continua derivado de velocidade e lifetime e score por morte do player continua 1

### Requirement: Chave canônica da configuração de gameplay

A configuração SHALL possuir chave determinística derivada da representação canônica de todos os parâmetros de gameplay, incluindo opções, geometria, tuning e versões de mapa e balanceamento. A versão de balanceamento SHALL compor a representação canônica sem alterar a derivação. A chave SHALL excluir seed, identidade, tamanho de exibição e áudio/acessibilidade. Ordem de propriedades não SHALL alterar a chave; ordem de listas semanticamente relevantes SHALL ser preservada.

#### Scenario: Equivalência e distinção
- **WHEN** configurações equivalentes têm propriedades em ordens diferentes ou mudam somente seed e identidade externas
- **THEN** produzem a mesma chave
- **AND** alterar sessão, spawn, geometria, arma, regra, tuning de navegação ou versão produz chave diferente

#### Scenario: Resultado histórico autoconsistente
- **WHEN** uma configuração completa persistida é validada para recuperar Last Result
- **THEN** sua chave é conferida contra os próprios dados históricos
- **AND** defaults atuais não substituem tuning ou geometria históricos válidos
