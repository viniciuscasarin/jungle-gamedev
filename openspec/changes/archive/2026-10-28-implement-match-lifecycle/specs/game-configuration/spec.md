# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Chave canônica da configuração de gameplay

A configuração SHALL possuir chave determinística derivada da representação canônica de todos os parâmetros que afetam gameplay, incluindo opções, geometria, tuning e versões de mapa e balanceamento. A chave SHALL excluir seed, identidade, tamanho de apresentação e preferências de áudio ou acessibilidade. Ordem de propriedades de objetos SHALL não alterar a chave; ordem de listas semanticamente relevantes SHALL ser preservada.

#### Scenario: Equivalência e distinção
- **WHEN** configurações equivalentes têm propriedades em ordens diferentes ou mudam somente seed e identidade externas
- **THEN** produzem a mesma chave
- **AND** alterar sessão, spawn, geometria, arma, regra, tuning de navegação ou versão produz chave diferente

#### Scenario: Resultado histórico autoconsistente
- **WHEN** uma configuração completa persistida é validada para recuperar Last Result
- **THEN** sua chave é conferida contra os próprios dados históricos
- **AND** defaults atuais não substituem tuning ou geometria históricos válidos
