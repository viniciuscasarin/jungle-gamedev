# Spec Delta

## MODIFIED Requirements

### Requirement: Escolha por seed e alternância por sucesso

O diretor SHALL usar RNG determinístico derivado da seed capturada, independente da geração do terreno e da apresentação. SHALL alternar Chaser e Shooter iniciando por Chaser e avançar somente após materialização bem-sucedida. Candidatos rejeitados e cancelamentos SHALL ter consumo de RNG reproduzível; consultar ou reconstruir regiões SHALL não consumir esse fluxo.

#### Scenario: Replay e seeds distintas
- **WHEN** duas execuções usam configuração, seed, passos e inputs iguais
- **THEN** candidatos, reservas, cancelamentos, posições e arquétipos coincidem
- **AND** seeds distintas podem produzir posições distintas sem alterar a sequência de arquétipos bem-sucedidos

#### Scenario: Cancelamento preserva arquétipo
- **WHEN** a reserva do próximo Chaser ou Shooter é cancelada
- **THEN** a próxima oportunidade tenta o mesmo arquétipo pendente
- **AND** somente um inimigo materializado avança a alternância

#### Scenario: Câmera e consultas adicionais
- **WHEN** execuções equivalentes apresentam viewports distintos ou consultam previamente regiões extras
- **THEN** a sequência de sorteios do diretor e as decisões de gameplay permanecem iguais
- **AND** regiões distantes da câmera não atraem spawns adicionais

### Requirement: Posição segura com rota navegável

Cada candidato SHALL pertencer à faixa de distâncias configurada ao redor da posição atual do player, estar fora de sólidos procedurais, cascos e reservas e possuir rota segura para seu raio até a região do player. A seleção SHALL usar distâncias lógicas, sem depender do campo de visão ou do antigo perímetro do mundo.

#### Scenario: Reserva inicial segura
- **WHEN** uma posição é selecionada na configuração padrão
- **THEN** seu centro está entre 240 e 520 unidades do player e seu casco não sobrepõe player, inimigos, ilhas ou outra reserva
- **AND** existe rota de água com conexões seguras entre a posição real e a região alcançável do player

#### Scenario: Player longe da origem
- **WHEN** o player navega por várias regiões e alcança coordenadas negativas ou distantes da arena antiga
- **THEN** novas oportunidades usam a faixa ao redor da sua posição atual com a mesma cadência e número finito de tentativas
- **AND** falta de candidato seguro pula a oportunidade sem backlog, cap arbitrário ou materialização distante na origem

### Requirement: Reserva com telegraph e revalidação

Uma posição selecionada SHALL ser reservada por 600ms ativos configurados antes da materialização, sem colisão ou dano do aviso. Ao vencer o prazo SHALL revalidar faixa relativa ao player, terreno, cascos, reservas e rota. Reserva insegura SHALL ser cancelada sem materialização ou realocação imediata; sua validade SHALL não depender de estar visível.

#### Scenario: Materialização segura
- **WHEN** a reserva permanece segura durante seu aviso completo
- **THEN** o anel, quando visível, é removido e um único inimigo com saúde e raio configurados aparece naquela posição
- **AND** seu ID é estável e único entre entidades e reservas da execução

#### Scenario: Player ou outro casco ocupa o aviso
- **WHEN** o player torna a reserva externa à faixa válida ou outro casco torna a posição insegura antes do prazo
- **THEN** a revalidação cancela a reserva sem dano ou sobreposição
- **AND** não cria substituto nem acumula oportunidade para depois

#### Scenario: Fronteira e pausa durante aviso
- **WHEN** uma reserva está em outra região e a partida pausa antes da materialização
- **THEN** consulta de terreno e ocultação visual não antecipam seu prazo nem mudam sua posição
- **AND** após Resume somente o tempo ativo restante permite revalidar e materializar
