# Spec Delta

## MODIFIED Requirements

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

