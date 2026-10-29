# Spec Delta

## Purpose

Executar regras em passos reproduzíveis e independentes da apresentação, expondo estado e tempo ativo sem permitir recuperação ilimitada após interrupções.

## ADDED Requirements

### Requirement: Execução autoritativa determinística

A simulação SHALL iniciar explicitamente a partir de configuração capturada e seed separada, executar passos de 1/60 s com input normalizado e produzir o mesmo estado para a mesma sequência de passos. SHALL não depender de plataforma, apresentação, rede, relógio global ou aleatoriedade global.

#### Scenario: Reprodução sem navegador
- **WHEN** dois consumidores sem DOM inicializam a mesma preparação e executam os mesmos inputs por passo
- **THEN** os estados, índices e tempos ativos coincidem dentro da tolerância numérica documentada
- **AND** importar os módulos por si só não inicia loops nem outros efeitos de plataforma

#### Scenario: Estado inicial
- **WHEN** uma simulação é criada com a configuração padrão
- **THEN** começa no passo zero e tempo ativo zero, player em (480,270) com rumo −π/2, saúde 100 e auto-sail desligado
- **AND** score, inimigos e projéteis permanecem vazios ou zero, sem combate, término automático ou resultados neste incremento

### Requirement: Passo fixo e recuperação limitada

O executor SHALL consumir duração explícita em passos fixos e limitar cada frame ao máximo configurado de passos, inicialmente cinco. O excedente de passos inteiros SHALL ser descartado, preservando somente a fração inferior a um passo. Tempo ativo SHALL derivar dos passos executados e não incluir tempo descartado ou congelado.

#### Scenario: Diferentes frequências de apresentação
- **WHEN** a mesma duração e comandos por passo são apresentados a 30, 60, 120 e 144 FPS sem saturar o limite
- **THEN** a quantidade de passos, tempo ativo, posição e rumo finais coincidem dentro da tolerância documentada

#### Scenario: Frame interrompido por longo período
- **WHEN** um frame recebe duração equivalente a muitos segundos
- **THEN** executa no máximo cinco passos na configuração padrão
- **AND** o frame seguinte não recupera passos inteiros anteriormente descartados

### Requirement: Publicação de estado independente

A simulação SHALL expor snapshots profundamente imutáveis e eventos tipados, com passo e tempo ativo explícitos, sem objetos de apresentação. O consumidor SHALL poder apresentar o snapshot atual sem executar regras em renderizações de interface nem exigir atualização da árvore semântica a cada frame.

#### Scenario: Snapshot anterior preservado
- **WHEN** o consumidor guarda um snapshot e a simulação executa passos posteriores
- **THEN** o snapshot guardado mantém seus valores e coleções, inclusive sob tentativa de mutação
- **AND** navegar ou colidir com o cenário não emite dano, pontuação ou término; a lista de eventos pode permanecer vazia

### Requirement: Tempo congelado e retomada limpa

O executor SHALL parar o avanço autoritativo durante congelamento e descartar acumulador e referência temporal anteriores ao retomar. A primeira apresentação após retomada SHALL estabelecer nova referência sem simular o intervalo congelado.

#### Scenario: Retomar depois de ausência longa
- **WHEN** a execução é congelada, permanece inativa e recebe retomada explícita
- **THEN** passo, posição e tempo ativo não avançam pelo período inativo
- **AND** somente durações novas posteriores à referência de retomada geram passos
