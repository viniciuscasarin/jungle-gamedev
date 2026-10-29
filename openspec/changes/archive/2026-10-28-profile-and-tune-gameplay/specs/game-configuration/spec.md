# Spec Delta

## MODIFIED Requirements

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
