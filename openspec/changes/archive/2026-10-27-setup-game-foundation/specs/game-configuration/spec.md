# Spec Delta

## Purpose

Fornecer uma fonte tipada e rastreável de parâmetros de jogo, permitindo capturar configurações reproduzíveis sem influência posterior de alterações externas.

## ADDED Requirements

### Requirement: Valores iniciais centralizados e versionados

A configuração SHALL representar os valores iniciais propostos no GDD v0.2, com unidades explícitas e versões de mapa e balanceamento. Limites das opções SHALL ter uma única fonte, sem regras duplicadas na interface. Parâmetros derivados SHALL ser calculados a partir dos valores autoritativos.

#### Scenario: Configuração padrão
- **WHEN** um consumidor solicita os valores iniciais
- **THEN** recebe sessão de 120 segundos, intervalo de spawn de 3 segundos, mapa de 960 por 540 unidades e versões iniciais identificáveis
- **AND** os parâmetros de movimento, armas, inimigos, spawn e controles correspondem às propostas documentadas no GDD

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

### Requirement: Seed independente da configuração

O contrato de preparação de partida SHALL conter configuração e seed em campos separados. A seed SHALL ser um inteiro sem sinal de 32 bits e SHALL não compor os parâmetros da configuração nem o futuro agrupamento de ranking.

#### Scenario: Duas seeds para a mesma configuração
- **WHEN** duas preparações usam configurações idênticas e seeds diferentes
- **THEN** as configurações permanecem idênticas e independentes da seed

#### Scenario: Seed inválida
- **WHEN** a preparação recebe seed negativa, fracionária, não finita ou superior a 4294967295
- **THEN** a preparação é rejeitada antes de disponibilizar dados para uma partida
