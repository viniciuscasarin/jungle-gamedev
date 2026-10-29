# performance-budgets Specification

## Purpose

Estabelecer os orçamentos quantitativos normativos de desempenho, limites de latência de quadros, sustentação de recursos de memória em ciclos sucessivos de partida e procedimentos de profiling reproduzíveis em ambiente de referência documentado.

## Requirements

### Requirement: Orçamento de taxa de quadros e intervalo entre frames

A aplicação SHALL sustentar taxa média de 60 FPS com percentil p95 de intervalo entre frames não superior a 20.0ms durante uma partida padrão de 180 segundos em build otimizado de produção no ambiente de referência documentado. O motor de jogo não SHALL apresentar quedas severas de taxa de quadros (intervalos superiores a 33.3ms) durante o combate ativo na arena.

#### Scenario: Sessão completa de 180 segundos no ambiente de referência
- **WHEN** uma partida completa com duração de 180 segundos é executada no build otimizado com taxa padrão de spawn de 3.0s
- **THEN** a taxa média de quadros registrada é de pelo menos 60.0 FPS
- **AND** o percentil 95 (p95) dos intervalos de quadros coletados permanece estritamente abaixo de 20.0ms
- **AND** nenhum frame drop severo superior a 33.3ms ocorre durante a fase de combate ativo

### Requirement: Resiliência em teste de estresse de spawn acelerado

A simulação e a renderização SHALL suportar o regime de estresse de spawn a cada 1.0 segundo mantendo estabilidade numérica e visual sem congelamento progressivo. O diretor de spawn SHALL aplicar teto geométrico natural e descartar candidatos inseguros sem acúmulo patológico de backlog, e a simulação SHALL limitar passos de compensação a no máximo 5 ticks por frame renderizado.

#### Scenario: Execução em regime de estresse com intervalo de 1.0s
- **WHEN** a partida é iniciada com a opção de intervalo de spawn configurada em 1.0 segundo
- **THEN** o diretor de spawn descarta tentativas sem candidatos válidos sem enfileirar requisições pendentes
- **AND** a simulação avança sem ultrapassar o teto de 5 passos de compensação por frame
- **AND** a arena mantém colisão e renderização contínuas sem travamento da interface

### Requirement: Sustentação de recursos e ausência de vazamentos em ciclos repetidos

O ciclo de vida da arena SHALL garantir liberação completa de nós gráficos, ouvintes e canais de áudio, mantendo retenção de memória estável após 5 ciclos completos de partida e retorno ao menu. Ao final dos ciclos e após coleta de lixo, não SHALL haver instâncias PixiJS ativas, listeners de evento órfãos ou crescimento progressivo descontrolado no heap de JavaScript.

#### Scenario: Auditoria de recursos após 5 ciclos de partida e retorno
- **WHEN** a aplicação completa 5 ciclos sucessivos de transição Menu -> Jogo -> Partida Ativa -> Menu
- **THEN** o diagnóstico de recursos reporta exatamente zero aplicações PixiJS ativas, zero observadores de tela e zero listeners órfãos
- **AND** todos os nós e canais de áudio de combate e navegação retornam ao estado ocioso
- **AND** a medição de memória utilizada no heap de JavaScript após coleta de lixo mantém-se estável em comparação ao ciclo inicial

### Requirement: Harness automatizado de profiling e telemetria

O projeto SHALL fornecer rotinas automatizadas de medição contendo benchmark headless de CPU para o loop de simulação e profiler de ponta a ponta no navegador Chromium. O relatório gerado SHALL registrar métricas de FPS, p95 de latência de frame, pico de entidades ativas, consumo de heap e os metadados do ambiente de referência executado.

#### Scenario: Execução do benchmark headless de simulação
- **WHEN** a suíte de benchmark headless é executada por 10.800 ticks virtuais
- **THEN** o tempo médio de CPU consumido por passo de simulação permanece inferior a 0.8ms
- **AND** são exportadas métricas de tempo total, média, p95 e pico de entidades para cenários normal e de estresse

#### Scenario: Execução do profiler E2E no navegador
- **WHEN** o teste automatizado de profiling é executado contra o build otimizado servido em preview
- **THEN** a telemetria coleta intervalos de quadros via Performance API e métricas de heap via Chrome DevTools Protocol
- **AND** os resultados de FPS médio, p95, janks e contagem de entidades são validados contra os orçamentos estabelecidos
