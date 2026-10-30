# mobile-orientation Specification

## Purpose

Garantir que a experiência mobile seja utilizada em landscape, com alternativa acessível quando o navegador não permite bloquear a orientação e preservação segura da partida durante rotações.

## Requirements

### Requirement: Orientação obrigatória na experiência mobile

A aplicação SHALL permitir acesso a menu, Options, Result e combate somente em landscape no mobile. Em portrait SHALL exibir uma proteção opaca com instrução em inglês para girar o aparelho, sem interação ou foco na interface subjacente. A política SHALL considerar o ponteiro primário coarse, sem classificar desktop como mobile apenas por largura pequena ou suporte adicional a toque.

#### Scenario: Acesso inicial em portrait
- **WHEN** a aplicação é aberta com ponteiro primário coarse e viewport mais alto que largo
- **THEN** a instrução para girar o aparelho ocupa a tela e os controles subjacentes ficam indisponíveis
- **AND** os assets continuam carregando e o estado atual de progresso permanece disponível na proteção

#### Scenario: Entrada em landscape
- **WHEN** o viewport mobile passa a ser mais largo que alto
- **THEN** a proteção é retirada e a aplicação mostra o carregamento, erro ou tela já pronta correspondente ao estado atual
- **AND** a mudança não reinicia o carregamento nem cria outra partida

#### Scenario: Desktop estreito ou híbrido
- **WHEN** um dispositivo de ponteiro primário fine tem uma janela portrait ou suporte adicional a toque
- **THEN** a proteção de orientação não aparece apenas por essas condições
- **AND** a seleção de controles por input real continua funcionando

### Requirement: Bloqueio nativo com alternativa funcional

A aplicação SHALL solicitar landscape pelos recursos de orientação disponíveis após interação explícita, atendendo às condições exigidas pelo navegador. Ausência, recusa ou perda do bloqueio SHALL manter a proteção em portrait e permitir o uso em landscape, sem erro fatal ou rejeição não tratada. A experiência SHALL não depender da disponibilidade de fullscreen.

#### Scenario: Navegador permite bloqueio
- **WHEN** o usuário aciona a ação de entrar em landscape e o navegador permite a solicitação
- **THEN** a aplicação solicita a orientação landscape e somente libera a interface após confirmar viewport compatível

#### Scenario: Bloqueio ausente ou recusado
- **WHEN** os recursos de fullscreen ou orientação estão ausentes ou uma solicitação rejeita
- **THEN** o aviso continua utilizável e instrui girar fisicamente o aparelho
- **AND** girar para landscape libera a interface sem exigir uma solicitação bem-sucedida

#### Scenario: Saída de fullscreen
- **WHEN** o usuário sai de fullscreen e o navegador remove o bloqueio
- **THEN** a política acompanha o viewport efetivo, reapresentando a proteção se estiver em portrait
- **AND** nenhuma sequência automática de novas solicitações interrompe o usuário

### Requirement: Pausa e retomada seguras por orientação

Entrar em portrait mobile durante uma partida SHALL pausar a simulação, limpar comandos e capturas, desligar auto-sail e suspender loops sonoros. Voltar a landscape SHALL preservar a mesma partida em Paused até Resume explícito. A proteção SHALL impedir início ou retomada enquanto a orientação continuar incompatível, inclusive quando a preparação gráfica concluir durante portrait.

#### Scenario: Rotação durante navegação e disparos
- **WHEN** uma partida em Playing entra em portrait com joypad ou armas pressionados e auto-sail ligado
- **THEN** comandos e capturas são liberados, auto-sail fica Off e tempo, cooldowns, efeitos e mundo ficam congelados
- **AND** matchId, configuração, posição, saúde e score são preservados

#### Scenario: Retorno com partida pausada
- **WHEN** o aparelho volta a landscape após a pausa por orientação
- **THEN** o diálogo Paused oferece Resume com foco acessível
- **AND** a partida só avança após Resume, sem restaurar movimento ou disparos antigos

#### Scenario: Preparação conclui em portrait
- **WHEN** Play foi acionado em landscape e a preparação termina após o aparelho entrar em portrait
- **THEN** a partida pronta permanece congelada e coberta pela proteção
- **AND** retornar a landscape exige Resume antes de avançar o tempo ativo

### Requirement: Prioridade visual e ciclo de vida da proteção

A proteção SHALL respeitar safe areas, conservar texto e ação acessíveis sem assets adicionais e prevalecer sobre menu, diálogos e resultado em portrait mobile. Durante a inicialização SHALL preservar acesso ao progresso e a Retry em caso de falha. Sair e retornar da proteção SHALL restaurar foco somente em conteúdo atualmente disponível, sem acumular listeners ou temporizadores.

#### Scenario: Falha de carregamento em portrait
- **WHEN** um asset visual falha enquanto a proteção está ativa
- **THEN** o erro e Retry permanecem legíveis e acionáveis junto à instrução de rotação
- **AND** Retry continua a preparação sem liberar o menu em portrait

#### Scenario: Rotações repetidas e diálogo aberto
- **WHEN** Options ou um diálogo está aberto e o aparelho alterna repetidamente entre portrait e landscape
- **THEN** a proteção impede foco e interação abaixo dela em portrait e restaura o contexto correto em landscape
- **AND** não há diálogos concorrentes capturando foco, listeners duplicados nem perda de dados digitados
