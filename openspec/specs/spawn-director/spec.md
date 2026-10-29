# spawn-director Specification

## Purpose

Introduzir inimigos em oportunidades regulares de tempo ativo, com posições seguras, aviso visual antecipado e escolhas reproduzíveis a partir da seed.

## Requirements

### Requirement: Agenda sem backlog ou limite artificial

O diretor SHALL iniciar após um intervalo completo e oferecer uma oportunidade por múltiplo do intervalo em tempo ativo. Oportunidades sem candidato seguro SHALL ser puladas sem backlog. SHALL não impor cap arbitrário de inimigos nem rampa oculta de frequência ou dificuldade.

#### Scenario: Agenda padrão e aviso
- **WHEN** começa uma partida padrão com posições seguras disponíveis
- **THEN** as primeiras oportunidades ocorrem em 3s e 6s ativos, sem inimigo imediato
- **AND** com telegraph de 0,6s as primeiras materializações ocorrem em 3,6s e 6,6s ativos

#### Scenario: Falta de posição
- **WHEN** uma oportunidade não encontra posição segura após sua busca finita
- **THEN** não reserva nem materializa inimigo para ela
- **AND** só tenta novamente no próximo horário regular, sem explosão de reposições posteriores

### Requirement: Escolha por seed e alternância por sucesso

O diretor SHALL usar um gerador determinístico derivado da seed capturada, sem aleatoriedade global. SHALL alternar Chaser e Shooter iniciando por Chaser e avançar a sequência somente após materialização bem-sucedida. Candidatos rejeitados e cancelamentos SHALL ter consumo de RNG reproduzível.

#### Scenario: Replay e seeds distintas
- **WHEN** duas execuções usam configuração, seed, passos e inputs iguais
- **THEN** candidatos, reservas, cancelamentos, posições e arquétipos coincidem
- **AND** seeds distintas podem produzir posições distintas sem alterar a sequência de arquétipos bem-sucedidos

#### Scenario: Cancelamento preserva arquétipo
- **WHEN** a reserva do próximo Chaser ou Shooter é cancelada
- **THEN** a próxima oportunidade tenta o mesmo arquétipo pendente
- **AND** somente um inimigo realmente materializado avança a alternância

### Requirement: Posição segura com rota navegável

Cada candidato SHALL ficar perto do perímetro, conter o casco inteiro no mundo, estar fora das ilhas e de outros cascos e reservas, manter ao menos a distância configurada ao player e ter rota navegável até a região do player para seu raio. Validação SHALL usar a mesma geometria autoritativa da navegação.

#### Scenario: Reserva inicial segura
- **WHEN** uma posição é selecionada na configuração padrão
- **THEN** seu centro está a pelo menos 240 unidades do player e seu casco não sobrepõe player, inimigos, ilhas, limites ou outra reserva
- **AND** existe rota de água com conexões seguras entre a posição real e a região alcançável do player

### Requirement: Reserva com telegraph e revalidação

Uma posição selecionada SHALL ser reservada e apresentada por 600ms ativos configurados antes da materialização, sem colisão ou dano do aviso. Ao vencer o prazo SHALL revalidar distância, cenário, cascos, reservas e rota com o estado atual. Reserva insegura SHALL ser cancelada sem materializar ou realocar imediatamente.

#### Scenario: Materialização segura
- **WHEN** a reserva permanece segura durante seu aviso completo
- **THEN** o anel é removido e um único inimigo com saúde e raio configurados aparece naquela posição
- **AND** seu ID é estável e único entre entidades e reservas da execução

#### Scenario: Player ou outro casco ocupa o aviso
- **WHEN** o player se aproxima abaixo da distância mínima ou outro casco torna a posição insegura antes do prazo
- **THEN** a revalidação cancela a reserva e remove o aviso sem dano ou sobreposição
- **AND** não cria um substituto nem acumula oportunidade para depois

### Requirement: Diretor subordinado ao tempo ativo e vida do player

Congelamento SHALL parar agenda, RNG, reservas e progresso de telegraph. Retomada SHALL conservar tempo ativo restante sem recuperar tempo de parede. Player destruído ou estado completed SHALL impedir novos agendamentos e materializações; avisos pendentes SHALL deixar de produzir inimigos.

#### Scenario: Pausa durante reserva
- **WHEN** a execução congela no meio dos 600ms e permanece ausente por vários intervalos
- **THEN** reserva, posições e tempo ativo permanecem iguais
- **AND** após Resume somente os passos ativos restantes permitem materializar, sem backlog

#### Scenario: Morte durante reserva
- **WHEN** o player é destruído antes de uma materialização pendente
- **THEN** nenhum inimigo materializa nem é agendado depois da morte
