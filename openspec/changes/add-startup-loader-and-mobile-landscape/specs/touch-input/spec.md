# Spec Delta

## MODIFIED Requirements

### Requirement: Seleção e troca segura do modo

O modo inicial SHALL considerar o ponteiro primário coarse; disponibilidade de touch isolada SHALL não forçar touch. Toque real SHALL selecionar touch e mouse/teclado de gameplay reais SHALL selecionar desktop, ignorando eventos compatíveis do toque. Troca efetiva SHALL limpar comandos, capturas e auto-sail sem reiniciar a partida. A política de orientação mobile SHALL permanecer independente da modalidade ativa de gameplay.

#### Scenario: Dispositivo híbrido e troca efetiva
- **WHEN** uma arena com touch disponível recebe mouse e depois toque real, ou o inverso
- **THEN** apresenta controles apropriados, limpa alvos, vetores, fontes mantidas e bordas antigas e deixa R Off
- **AND** preserva matchId, configuração, saúde, score, posição, rumo e tempo ativo, aplicando depois somente o novo gesto válido

#### Scenario: Resize não equivale a troca de input
- **WHEN** largura, orientação ou DPR muda sem novo input de outra modalidade e sem entrar na condição de bloqueio por portrait mobile
- **THEN** o modo, último comando lógico e auto-sail permanecem, sem reset da partida
- **AND** layout e transformação se atualizam para a nova área disponível

#### Scenario: Rotação que exige pausa
- **WHEN** a mudança de orientação coloca o dispositivo mobile em portrait
- **THEN** o modo de input não é alterado apenas pelo resize, mas a pausa de orientação limpa comandos, capturas e auto-sail
- **AND** trocar a modalidade de gameplay não permite contornar a proteção de orientação

### Requirement: Limpeza por contexto e ciclo de vida

Pausa, bloqueio por portrait mobile, ocultação, perda de foco da janela, término e descarte SHALL liberar capturas e limpar fontes, vetor, alvo e bordas pendentes. Resume SHALL exigir novo input e orientação permitida. Foco entre controles da batalha SHALL não cancelar outros dedos; controles fora da batalha SHALL conservar comportamento nativo.

#### Scenario: Pausa e retorno
- **WHEN** a partida pausa, entra na proteção de portrait mobile ou fica oculta com joypad e ataques mantidos
- **THEN** todos os comandos e capturas são liberados, auto-sail fica Off e a simulação permanece congelada
- **AND** retornar ou Resume não restaura contatos antigos, disparos ou movimento

#### Scenario: Foco composto e desmontagem repetida
- **WHEN** skills ganham foco dentro da batalha ou a arena é aberta e fechada cinco vezes
- **THEN** mudança interna de foco preserva os demais contatos válidos e cada saída libera listeners, capturas e comandos próprios
- **AND** menu, formulários e diálogos não capturam comandos de gameplay
