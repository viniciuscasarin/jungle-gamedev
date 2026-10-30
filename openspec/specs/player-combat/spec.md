# player-combat Specification

## Purpose

Permitir ataques direcionais do jogador e resolver projéteis, dano e destruição de forma reproduzível, atribuindo score somente a mortes reais causadas por seus ataques.

## Requirements

### Requirement: Armas orientadas pelo casco

Q SHALL emitir uma bala frontal. W e E SHALL emitir três balas paralelas para bombordo e estibordo, com origens distribuídas longitudinalmente pelo casco e separadas pelo espaçamento configurado. A direção SHALL usar o rumo real atualizado do navio, inclusive durante giro e navegação, sem mira independente.

#### Scenario: Rumos cardinais e oblíquos
- **WHEN** o jogador dispara Q/W/E em diferentes rumos, inclusive durante giro limitado
- **THEN** Q segue a frente real, W segue a perpendicular esquerda e E a direita
- **AND** cada broadside tem três origens distintas separadas por 14 unidades na configuração padrão, sem leque ou homing

#### Scenario: Ataques simultâneos em movimento
- **WHEN** Q/W/E estão mantidos com mouse e auto-sail ativos
- **THEN** cada arma pronta dispara seu padrão e o casco continua navegando pelas mesmas regras de giro e colisão

### Requirement: Cadência independente em tempo ativo

As três armas SHALL iniciar prontas, manter cooldowns independentes e disparar enquanto mantidas sempre que prontas. Somente passos ativos SHALL recarregar; congelamento e tempo descartado não contam. Soltar uma arma SHALL interromper novas ativações sem reiniciar sua recarga.

#### Scenario: Pressão inicial e recarga
- **WHEN** Q/W/E são mantidos desde o primeiro passo e a simulação avança
- **THEN** cada arma dispara inicialmente e volta a ficar pronta após seu cooldown, com a primeira oportunidade de passo elegível, sem atraso numérico adicional
- **AND** a configuração padrão usa 350ms para Q e 1200ms para W e E, sem compartilhar recargas

#### Scenario: Pausa e retomada
- **WHEN** foco é perdido com armas mantidas durante recarga
- **THEN** cooldowns e projéteis congelam e input mantido é limpo
- **AND** Resume não dispara nem recupera o intervalo congelado; um novo comando é necessário

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

### Requirement: Facções e proveniência estáveis

Fogo do player SHALL atingir somente inimigos; fogo inimigo SHALL atingir somente o player. Balas SHALL conservar facção, autoria e dano capturados mesmo após destruição do emissor, até a conclusão do passo terminal da partida. Casco aliado SHALL não sofrer dano nem consumir a bala; todo projétil SHALL continuar sujeito a cenário e lifetime.

#### Scenario: Aliado no trajeto
- **WHEN** uma bala passa por casco aliado antes de um casco hostil
- **THEN** o aliado não recebe dano nem interrompe o projétil e somente o primeiro alvo hostil válido pode ser atingido

#### Scenario: Emissor destruído
- **WHEN** o emissor morre com uma bala já em voo
- **THEN** a bala conserva as regras e autoria originais e pode resolver um impacto posterior enquanto a partida não concluiu
- **AND** duas balas que se cruzam não colidem entre si

### Requirement: Dano único e destruição atômica

Um impacto válido SHALL aplicar o dano configurado no máximo uma vez e consumir a bala. A transição de saúde positiva para zero SHALL produzir uma única destruição imediata, com saúde limitada a zero. Entidades destruídas SHALL parar de mover, disparar, colidir e causar dano, preservando a resolução de balas já emitidas até a fronteira terminal da partida.

#### Scenario: Salva letal e excesso de dano
- **WHEN** várias balas atingem o mesmo inimigo no mesmo passo
- **THEN** cada bala causa no máximo um dano e somente a transição vivo para destruído emite destruição
- **AND** o cadáver não absorve impactos posteriores nem executa ações

#### Scenario: Player destruído
- **WHEN** dano válido reduz a saúde do player a zero
- **THEN** não navega, dispara nem causa novo contato em fases posteriores e auto-sail fica Off
- **AND** a conclusão e seu resultado são regidos pelo ciclo da partida após resolver todas as balas existentes desse passo


#### Scenario: Salvas existentes no passo letal
- **WHEN** uma bala inimiga mata o player e outras balas existentes do player matam inimigos no mesmo passo
- **THEN** todas as colisões dessa fase são resolvidas atomicamente com sua autoria e score, independentemente de a bala letal ser processada antes
- **AND** ended aparece uma única vez depois dos eventos de dano, destruição e score; não há nova emissão ou materialização após a condição terminal

### Requirement: Score por morte atribuída ao player

Cada inimigo destruído por projétil de autoria do player SHALL conceder exatamente um ponto, independentemente de arquétipo ou arma. Nenhum dano não letal, sobrevivência, cadáver ou autodestruição por contato SHALL conceder pontos.

#### Scenario: Mortes reais e hits simultâneos
- **WHEN** tiros do player destroem Chaser ou Shooter, inclusive com várias balas letais no mesmo passo
- **THEN** cada inimigo concede um único ponto e um evento de score com o total correto
- **AND** dano não letal e novas tentativas de atingir o cadáver não mudam o score

### Requirement: Projéteis existentes antes de contato

O passo SHALL resolver balas já existentes antes de contato de Chaser com player e de ações posteriores. Chaser vivo em contato SHALL aplicar uma vez seu dano configurado e autodestruir sem score. Chaser morto por projétil nessa fase SHALL não causar contato. Perseguição e spawn SHALL preservar essa prioridade; contatos válidos SHALL ser resolvidos antes que a separação possa apagá-los.

#### Scenario: Morte antes do contato
- **WHEN** uma bala existente mata um Chaser que tocaria o player no mesmo passo
- **THEN** a morte concede um ponto ao player e o Chaser não aplica dano de contato

#### Scenario: Contato sem morte por projétil
- **WHEN** um Chaser vivo toca o player
- **THEN** aplica 25 de dano na configuração padrão, autodestrói uma única vez e concede zero pontos
- **AND** casco de Shooter não causa dano de contato

### Requirement: Alvos de diagnóstico no domínio real

Um cenário documentado opt-in SHALL inicializar alvos determinísticos como dados puros usando os arquétipos, saúde, colisores e resolução reais. O acesso normal SHALL iniciar sem esses alvos e habilitar IA e diretor de spawn. A inspeção SHALL ser somente leitura; demonstrações de mortes e score SHALL usar controles reais e colisões, sem setters de sucesso.

#### Scenario: Demonstração reproduzível
- **WHEN** a aplicação é aberta com combatScenario=targets e o usuário aciona Play e Q/W/E
- **THEN** vê alvos e balas autoritativos, pode causar dano e ganhar pontos por mortes reais
- **AND** o modo estacionário explicitamente selecionado não agenda inimigos, não injeta score e não usa IA autônoma

#### Scenario: Fluxo normal limpo
- **WHEN** o mesmo fluxo é aberto sem seletor de combate
- **THEN** não existem alvos de diagnóstico nem projéteis pré-carregados, e o diretor pode introduzir inimigos nas oportunidades regulares
- **AND** sair e entrar novamente restaura a preparação selecionada sem estado herdado
