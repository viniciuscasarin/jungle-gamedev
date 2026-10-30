# Spec Delta

## MODIFIED Requirements

### Requirement: Emissão segura fora do casco

Cada bala SHALL nascer completamente fora do casco considerando seu raio e verificar sólidos procedurais entre a origem de emissão e a posição externa, além da ocupação final. Disparo bloqueado por costa SHALL consumir a bala e ativar cooldown normal. Fronteiras de regiões ou de visibilidade SHALL não bloquear nem consumir projéteis.

#### Scenario: Canhão junto à costa
- **WHEN** o casco está encostado em ilha e dispara naquela direção, inclusive em fronteira de região
- **THEN** nenhuma bala aparece no outro lado do sólido
- **AND** as demais balas válidas conservam suas trajetórias e a arma entra em recarga

#### Scenario: Emissão fora da arena antiga
- **WHEN** o player dispara em coordenadas negativas ou além de 960×540 sobre água livre
- **THEN** a emissão segue o rumo e o padrão da arma sem bloqueio por limites antigos

### Requirement: Lifetime e primeiro impacto contínuo

Projéteis SHALL mover em linha reta pela velocidade e vida ativa restantes. A varredura circular SHALL escolher o primeiro impacto entre litoral procedural e cascos hostis vivos, consultando todas as regiões atravessadas. Impacto ou expiração SHALL consumir a bala, sem deslizamento, piercing ou colisão entre balas. Limites de região e tela SHALL não encerrar sua vida.

#### Scenario: Bala rápida e alvo protegido
- **WHEN** um deslocamento atravessaria uma ilha inteira antes de alcançar um inimigo
- **THEN** a bala é consumida no primeiro contato com o litoral e não causa dano ao alvo protegido
- **AND** a conclusão é igual com terreno previamente carregado ou consultado durante a varredura

#### Scenario: Ordem geométrica e empate
- **WHEN** mais de um sólido ou casco hostil intercepta o segmento no mesmo passo
- **THEN** somente o candidato de menor tempo de impacto é resolvido, independentemente da ordem das coleções e regiões
- **AND** empates usam a política determinística que prioriza sólido sobre casco

#### Scenario: Vida parcial e fronteiras
- **WHEN** a vida restante é menor que um passo ou termina antes de alcançar um alvo, inclusive ao cruzar regiões
- **THEN** o deslocamento é limitado a essa vida e a bala expira sem dano posterior
- **AND** colisões com litoral consideram o raio da bala e fronteiras sem sólido não a consomem

#### Scenario: Projétil temporariamente fora da tela
- **WHEN** um projétil sai da tela ou a câmera se afasta de seu emissor
- **THEN** conserva autoria, facção, dano e lifetime e continua resolvendo os impactos autoritativos
- **AND** ocultar o sprite não remove nem reinicia o projétil
