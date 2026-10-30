# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Compatibilidade dos resultados de mapas finitos

Resultados válidos produzidos com os mapas finitos existentes SHALL continuar legíveis em Last Result, histórico, ranking e outbox. A validação SHALL identificar a representação histórica sem completá-la com novos defaults nem reclassificar o resultado como mundo procedural.

#### Scenario: Atualização com dados locais existentes
- **WHEN** o jogo atualizado lê resultado ou envio pendente com configuração finita válida e chave correspondente
- **THEN** preserva os dados e o fluxo de leitura ou envio, sem apagar armazenamento por diferença de formato
- **AND** partidas novas usam a configuração procedural atual com agrupamento de ranking distinto pela chave de gameplay
