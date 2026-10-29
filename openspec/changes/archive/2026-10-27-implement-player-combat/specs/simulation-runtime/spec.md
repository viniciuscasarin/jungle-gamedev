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
- **AND** score, inimigos e projéteis iniciam vazios ou zero e armas prontas; ataques respondem a inputs posteriores sem spawn, término automático ou resultados neste incremento

### Requirement: Publicação de estado independente

A simulação SHALL expor snapshots profundamente imutáveis e eventos tipados por passo, com passo e tempo ativo explícitos, sem objetos de apresentação. O consumidor SHALL poder apresentar o snapshot atual sem executar regras em renderizações de interface nem exigir atualização da árvore semântica a cada frame.

#### Scenario: Snapshot anterior preservado
- **WHEN** o consumidor guarda um snapshot e os eventos de um passo e a simulação executa passos posteriores
- **THEN** os dados guardados mantêm seus valores e coleções, inclusive sob tentativa de mutação
- **AND** navegar ou colidir somente com cenário não emite dano, pontuação ou término; impactos de combate emitem os eventos correspondentes

#### Scenario: Eventos não repetidos
- **WHEN** um passo com dano, destruição e score é seguido por passo neutro sem novos impactos
- **THEN** a coleção atual contém somente eventos do passo atual e não reapresenta os anteriores como novos
