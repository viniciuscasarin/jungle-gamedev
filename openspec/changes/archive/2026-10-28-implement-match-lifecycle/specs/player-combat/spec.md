# Spec Delta

## MODIFIED Requirements

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
