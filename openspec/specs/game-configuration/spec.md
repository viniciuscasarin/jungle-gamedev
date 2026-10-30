# game-configuration Specification

## Purpose

Fornecer uma fonte tipada e rastreável de parâmetros de jogo, permitindo capturar configurações reproduzíveis sem influência posterior de alterações externas.

## Requirements

### Requirement: Valores iniciais centralizados e versionados

A configuração SHALL centralizar opções e parâmetros autoritativos com unidades explícitas, versões de mapa, gerador e balanceamento. O mundo padrão SHALL ser procedural sem dimensões finitas; seu descritor SHALL capturar catálogo, layouts, espaçamentos e parâmetros de navegação e spawn. Limites das opções SHALL ter fonte única e parâmetros derivados SHALL usar valores autoritativos.

#### Scenario: Configuração padrão
- **WHEN** um consumidor solicita os valores iniciais
- **THEN** recebe sessão de 120 segundos, intervalo de spawn de 3 segundos e descritor de mundo infinito versionado
- **AND** preserva velocidades, giro, saúde, armas e regras de pontuação atuais; o tempo continua configurável de 60 a 180 segundos
- **AND** os perfis iniciais de layout têm alvos de 160, 280 e 440 unidades, com tolerância explícita e separação mínima validada

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

A configuração SHALL fornecer catálogo e regras de composição de ilhas em dados serializáveis e profundamente imutáveis, sem paths de asset ou dependência de plataforma. As instâncias geradas SHALL fornecer ID, modelo, posição assinada, dimensões e polígonos sólidos convexos. Render, colisão, navegação e spawn SHALL compartilhar esses mesmos contornos, distinguindo litoral, envelope e decoração.

#### Scenario: Mapa refinado
- **WHEN** um consumidor prepara um mundo procedural
- **THEN** obtém modelos predefinidos e regras versionadas em vez de duas posições fixas de ilhas
- **AND** a documentação registra unidades, convenção dos polígonos e tolerância de alinhamento ao litoral visível
- **AND** catálogo e geração podem ser usados sem DOM ou renderer

#### Scenario: Canto arredondado e água
- **WHEN** são comparados o envelope de uma ilha, suas peças sólidas e o litoral composto
- **THEN** as peças acompanham os cantos da areia e não tratam todo o retângulo-envelope como terra
- **AND** pixels de água e decorações sem obstáculo próprio não expandem a geometria sólida

#### Scenario: Snapshot de vértices
- **WHEN** a origem é alterada depois de capturar um snapshot ou o consumidor tenta modificar vértices capturados
- **THEN** a geometria do snapshot permanece inalterada, inclusive coleções e coordenadas aninhadas

#### Scenario: Validação assinada e parâmetros inválidos
- **WHEN** são validados dados procedurais com coordenadas negativas ou com catálogo, espaçamento ou tamanho de região inválidos
- **THEN** coordenadas assinadas finitas são aceitas e parâmetros incompatíveis com os cascos ou layouts são rejeitados antes de iniciar a partida
- **AND** dimensões, velocidades, raios e durações continuam sujeitos às suas restrições positivas

### Requirement: Geometria de projétil centralizada

Raio de colisão da bala e folga de emissão SHALL estar na configuração tipada em unidades lógicas, capturados com os demais parâmetros. Valores técnicos adicionais SHALL ser documentados como hipóteses geométricas e não substituir dano, quantidade, cadência, velocidade, lifetime ou espaçamento propostos no GDD.

#### Scenario: Dimensões e alcance consistentes
- **WHEN** combate e diagnóstico usam a configuração inicial
- **THEN** compartilham raio e folga explícitos e não dependem da dimensão física da textura para decidir colisões
- **AND** Q mantém dano 20, quantidade 1, cooldown 350ms, velocidade 420 e vida 1200ms; W/E mantêm dano 20, quantidade 3, cooldown 1200ms, velocidade 360, vida 1000ms e espaçamento 14
- **AND** alcance continua derivado de velocidade e lifetime e score por morte do player continua 1

### Requirement: Chave canônica da configuração de gameplay

A configuração SHALL possuir chave determinística derivada de todos os parâmetros de gameplay, incluindo opções, catálogo, layouts, espaçamentos, tuning e versões. SHALL excluir seed, identidade, regiões materializadas, caches, tamanho de exibição e áudio/acessibilidade. Ordem de propriedades SHALL não alterar a chave; ordem de listas semanticamente relevantes SHALL ser preservada. Configurações históricas SHALL conservar sua representação canônica original.

#### Scenario: Equivalência e distinção
- **WHEN** configurações equivalentes têm propriedades em ordens diferentes ou mudam somente seed e identidade externas
- **THEN** produzem a mesma chave
- **AND** alterar sessão, spawn, geometria, layouts, espaçamento, arma, regra, tuning de navegação ou versão produz chave diferente

#### Scenario: Resultado histórico autoconsistente
- **WHEN** uma configuração completa persistida é validada para recuperar Last Result
- **THEN** sua chave é conferida contra os próprios dados históricos, inclusive nos mapas finitos existentes
- **AND** defaults atuais não substituem tuning ou geometria históricos válidos

#### Scenario: Exploração sem crescimento da configuração
- **WHEN** o player visita e descarrega muitas regiões na mesma partida
- **THEN** configuração, chave e seed capturadas permanecem iguais e o resultado conserva o descritor do gerador
- **AND** o payload persistido não contém uma lista crescente de regiões visitadas

### Requirement: Compatibilidade dos resultados de mapas finitos

Resultados válidos produzidos com os mapas finitos existentes SHALL continuar legíveis em Last Result, histórico, ranking e outbox. A validação SHALL identificar a representação histórica sem completá-la com novos defaults nem reclassificar o resultado como mundo procedural.

#### Scenario: Atualização com dados locais existentes
- **WHEN** o jogo atualizado lê resultado ou envio pendente com configuração finita válida e chave correspondente
- **THEN** preserva os dados e o fluxo de leitura ou envio, sem apagar armazenamento por diferença de formato
- **AND** partidas novas usam a configuração procedural atual com agrupamento de ranking distinto pela chave de gameplay
