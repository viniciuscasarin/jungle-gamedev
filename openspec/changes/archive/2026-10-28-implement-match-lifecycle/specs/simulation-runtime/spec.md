# Spec Delta

## MODIFIED Requirements

### Requirement: Execução autoritativa determinística

A simulação SHALL iniciar explicitamente a partir de configuração capturada e seed separada, executar passos de 1/60 s com input normalizado e produzir o mesmo estado para a mesma sequência de passos e dados iniciais. SHALL não depender de plataforma, apresentação, rede, relógio global ou aleatoriedade global.

#### Scenario: Reprodução sem navegador
- **WHEN** dois consumidores sem DOM inicializam a mesma preparação, dados iniciais e inputs por passo
- **THEN** os estados, eventos, índices e tempos ativos coincidem dentro da tolerância numérica documentada
- **AND** importar os módulos por si só não inicia loops nem outros efeitos de plataforma

#### Scenario: Estado inicial
- **WHEN** uma simulação é criada com a configuração padrão e sem dados opcionais de diagnóstico
- **THEN** começa no passo zero e tempo ativo zero, player em (480,270) com rumo −π/2, saúde 100 e auto-sail desligado
- **AND** score, inimigos e projéteis iniciam vazios ou zero e armas prontas; ataques respondem a inputs posteriores com IA e diretor ativos nas oportunidades posteriores, até o término único por tempo ou morte definido pelo ciclo da partida


### Requirement: Tempo congelado e retomada limpa

O executor SHALL parar o avanço autoritativo durante congelamento e descartar acumulador e referência temporal anteriores ao retomar uma partida pausada. Estado completed SHALL ser irreversível por freeze, resume ou input. A primeira apresentação após retomada SHALL estabelecer nova referência sem simular o intervalo congelado.

#### Scenario: Retomar depois de ausência longa
- **WHEN** a execução é congelada, permanece inativa e recebe retomada explícita
- **THEN** passo, posição e tempo ativo não avançam pelo período inativo
- **AND** somente durações novas posteriores à referência de retomada geram passos

#### Scenario: IA e diretor congelados
- **WHEN** congela durante perseguição, recarga inimiga ou reserva de spawn
- **THEN** posições, rumo, balas, cooldowns, RNG e progresso de telegraph não avançam
- **AND** retomada conserva os prazos ativos e não cria ações acumuladas no período inativo

## ADDED Requirements

### Requirement: Evento terminal e parada do executor

O passo final SHALL publicar ended uma única vez como último evento, após resolver impactos existentes e os danos válidos. Sua duração SHALL usar somente passos ativos até o limite capturado. O executor SHALL encerrar avanço e agendamento no terminal; passos posteriores SHALL não gerar eventos ou alterar estado. Apresentar ou redimensionar SHALL não consumir novamente eventos anteriores.

#### Scenario: Frame com vários passos
- **WHEN** o término ocorre no primeiro de vários passos acumulados elegíveis em um frame
- **THEN** somente o passo terminal avança e a conclusão é entregue uma única vez antes de parar o agendamento
- **AND** os demais callbacks do acumulador não consomem novos comandos nem produzem eventos de gameplay

#### Scenario: Terminal resistente à apresentação
- **WHEN** resize, apresentação repetida, freeze, resume, blur ou hidden ocorre após completed
- **THEN** o snapshot terminal conserva estado, passo, tempo, score, entidades e prazos
- **AND** nenhum ended ou resultado é reentregue e nenhum frame de avanço é agendado
