# Spec Delta

## Purpose

Oferecer navegação local e edição acessível das opções de partida, com confirmação explícita, persistência defensiva e apresentação fiel aos assets fornecidos.

## ADDED Requirements

### Requirement: Menu local com ações honestas

O menu SHALL oferecer Play, Options, guia compacto de controles e Last Result quando disponível. Ranking e Match History SHALL ter espaços identificados como indisponíveis nesta etapa, sem consultas, resultados, loading ou sucesso fictícios. Essas reservas SHALL não bloquear as ações locais.

#### Scenario: Menu sem e com resultado
- **WHEN** o usuário abre o menu sem resultado concluído ou retorna após uma conclusão
- **THEN** título, Play, Options e guia são legíveis e acionáveis por teclado e toque
- **AND** Last Result aparece somente quando há resultado recuperado ou mantido na visita e continua abrindo o resultado histórico

#### Scenario: Integrações futuras
- **WHEN** o menu apresenta Ranking e Match History
- **THEN** informa em inglês que estão indisponíveis, sem fingir uma consulta concluída nem expor controles de abas funcionais incompletos
- **AND** Play e Options permanecem disponíveis sem dependência de rede

### Requirement: Rascunho de opções em segundos

Options SHALL carregar os valores salvos válidos ou defaults em rascunho independente, com Game session time e Enemy spawn time rotulados em segundos. SHALL informar limites e passos e preservar o texto editável, inclusive estados temporariamente vazios ou inválidos, sem alterar a configuração salva durante a edição.

#### Scenario: Abrir e editar
- **WHEN** Options é aberto e o usuário edita um dos campos
- **THEN** os valores iniciais correspondem ao último Save válido ou aos defaults de 120 e 3 segundos na ausência de valores
- **AND** edição não escreve storage nem altera a outra opção, uma configuração capturada ou o resultado anterior

### Requirement: Validação acessível antes da confirmação

O formulário SHALL aceitar somente sessão finita de 60–180 segundos inteiros e spawn finito de 1–10 segundos em passos de 0,5. Vazio, whitespace e valores inválidos SHALL produzir erro inline associado ao campo. Save SHALL ficar indisponível enquanto inválido, e qualquer submissão inválida SHALL ser rejeitada sem gravação ou correção silenciosa.

#### Scenario: Limites e passos
- **WHEN** o usuário informa sessão 60 ou 180 e spawn 1, 1.5 ou 10
- **THEN** Save torna-se disponível e os valores permanecem exatos, com unidades, limites e passos visíveis

#### Scenario: Entradas inválidas
- **WHEN** um campo recebe vazio, whitespace, texto não numérico, NaN, infinito, sessão 60.5, spawn 1.1 ou valor fora dos limites
- **THEN** o campo expõe estado inválido e mensagem acessível em segundos e Save fica indisponível
- **AND** Enter ou outra submissão não grava, não arredonda, não trunca e não limita silenciosamente o valor

### Requirement: Save e Cancel explícitos

Save válido SHALL persistir ambas as opções e retornar ao menu somente após escrita bem-sucedida. Cancel ou Escape em Options SHALL descartar o rascunho sem escrita e retornar ao menu. Reabrir SHALL recuperar os últimos valores salvos, inclusive após refresh.

#### Scenario: Save seguido de refresh
- **WHEN** o usuário salva 90 segundos e 2.5 segundos, recarrega e reabre Options
- **THEN** encontra os mesmos valores e Play captura essas opções para uma nova partida

#### Scenario: Cancel e Escape
- **WHEN** o usuário altera valores válidos ou inválidos e escolhe Cancel ou Escape
- **THEN** retorna ao menu sem gravar e, ao reabrir, encontra os valores anteriores
- **AND** nenhuma opção muda por blur, troca de campo ou simples navegação

### Requirement: Recuperação e falha de armazenamento honestas

Opções persistidas corrompidas SHALL recuperar defaults com explicação visível, sem escrita automática. Falha de Save SHALL manter Options aberto, rascunho e valores salvos anteriores, com erro acessível e possibilidade de tentar novamente ou cancelar. Recuperação bem-sucedida SHALL resolver apenas o aviso de opções correspondente, sem apagar avisos independentes.

#### Scenario: Corrupção recuperada
- **WHEN** JSON, versão, formato, limites ou passos das opções persistidas são inválidos
- **THEN** menu e Options explicam a recuperação e o formulário usa defaults válidos sem sobrescrever storage antes de Save
- **AND** após Save bem-sucedido e novo Play, o aviso antigo de opções não reaparece; avisos de identidade ou resultado continuam disponíveis

#### Scenario: Escrita negada
- **WHEN** o armazenamento rejeita Save de um rascunho válido
- **THEN** Options permanece aberto com os mesmos valores editados e erro anunciado, sem afirmar sucesso
- **AND** os valores salvos anteriores permanecem intactos; nova tentativa pode salvar e Cancel continua descartando a edição

### Requirement: Navegação e layout acessíveis

Menu e Options SHALL usar controles semânticos, foco visível, nomes acessíveis, contraste legível e alvos de toque utilizáveis. Entrada em Options SHALL focar seu título ou primeiro campo; Save/Cancel/Escape SHALL restaurar foco em Options no menu. Conteúdo e mensagens SHALL caber a partir de 320 CSS pixels, permitindo rolagem vertical em landscape sem deformar bordas decorativas.

#### Scenario: Teclado e toque
- **WHEN** o usuário navega com Tab e Shift+Tab, ativa com Enter ou Space onde aplicável, ou toca controles
- **THEN** alcança os campos e ações, lê ajuda e erros associados e termina no destino com foco restaurado
- **AND** teclas digitadas no formulário não acionam controles de combate

#### Scenario: Viewports e conteúdo variável
- **WHEN** menu com ou sem Last Result e Options válido, inválido ou com avisos são exibidos em desktop, largura de 320px e landscape baixo
- **THEN** título, campos, avisos e ações ficam legíveis e alcançáveis sem corte, sobreposição ou overflow horizontal
- **AND** áreas seguras, bordas e proporções da arte são respeitadas

### Requirement: Options restrito à navegação local

Options SHALL estar disponível somente fora de uma sessão ativa. A integração do formulário SHALL preservar os contratos existentes de snapshot imutável, resultado histórico e replay com as opções do último Save; um rascunho descartado ou uma escrita falha SHALL não tornar-se configuração de outra partida.

#### Scenario: Partida capturada e replay
- **WHEN** Save é seguido de Play, o storage muda externamente durante a partida e, após o término real, o usuário volta ao menu, salva outras opções, abre Last Result e escolhe Play Again
- **THEN** a partida e o resultado anteriores conservam a configuração capturada, e o replay usa o novo Save com outro matchId
- **AND** Options não é oferecido em Loading, Playing ou Paused; Cancel e Save falho não substituem o último Save
