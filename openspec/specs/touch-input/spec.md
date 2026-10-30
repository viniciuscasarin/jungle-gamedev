# touch-input Specification

## Purpose

Permitir navegação e ataques simultâneos por toque com propriedade independente de cada contato, neutralização segura de comandos e continuidade da mesma partida em dispositivos híbridos.

## Requirements

### Requirement: Joypad direcional com dead zone

O joypad SHALL aceitar um pointer ID proprietário e medir deslocamento em CSS px do centro ao raio útil. Até 15% inclusive SHALL não solicitar avanço; fora SHALL produzir direção normalizada e avanço à velocidade configurada, sem strafe. Soltar SHALL remover o pedido manual, preservando o último rumo selecionado para R On.

#### Scenario: Fronteira e giro finito
- **WHEN** o contato percorre o centro, 14,9%, 15% e além de 15% do raio útil
- **THEN** apenas o deslocamento acima da fronteira solicita movimento, com rumo correspondente e giro limitado pela configuração
- **AND** coordenadas inválidas e vetor nulo não geram NaN, velocidade proporcional, teleporte ou giro instantâneo

#### Scenario: Release com e sem auto-sail
- **WHEN** o dedo proprietário solta o joypad após selecionar um rumo
- **THEN** R Off interrompe avanço manual e R On continua avanço e giro em direção ao último rumo válido
- **AND** retornar à dead zone remove avanço manual sem apagar o último rumo selecionado

### Requirement: Captura independente e fontes compostas

Cada pointer SHALL permanecer capturado pelo controle original até release/cancel, com IDs independentes para joypad e armas. Ataque SHALL permanecer mantido enquanto existir alguma fonte ativa daquela arma. Soltar um contato SHALL não limpar outro contato ou tecla; atravessar controles SHALL não transferir propriedade.

#### Scenario: Navegar e disparar com múltiplos dedos
- **WHEN** um dedo mantém o joypad e outros mantêm Q/W/E, inclusive dois contatos na mesma arma
- **THEN** avanço e ataques ocorrem simultaneamente pelos cooldowns e colisões normais
- **AND** liberar um contato preserva os demais, inclusive ao arrastar para fora da hitbox original

#### Scenario: Contato estranho e perdas de captura
- **WHEN** outro dedo toca o joypad ocupado, solta fora dele ou ocorre pointercancel/lostpointercapture
- **THEN** somente o proprietário correspondente pode encerrar seu comando e limpeza repetida é idempotente
- **AND** nenhum contato cancelado deixa arma ou movimento preso

### Requirement: Auto-sail touch confirmado sem duplicação

R touch SHALL alternar uma vez após pointerup válido de uma pressão proprietária não cancelada, sem repetição por click compatível. Cancelamento SHALL descartar a pressão pendente e nunca alternar auto-sail, mesmo antes do próximo passo. A borda confirmada SHALL ser consumida uma única vez.

#### Scenario: Confirmação e cancelamento antes do passo
- **WHEN** R é pressionado e liberado validamente entre passos, seguido de click compatível
- **THEN** ocorre uma única alternância no próximo passo
- **AND** uma pressão cancelada em vez de liberada não produz alternância nem borda residual

#### Scenario: Liberação fora do botão
- **WHEN** a pressão de R termina fora de sua hitbox, perde captura antes da confirmação ou é cancelada pela pausa
- **THEN** a intenção pendente é descartada sem mudar R

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
