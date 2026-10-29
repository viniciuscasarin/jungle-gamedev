# Spec Delta

## Purpose

Completar o ciclo local de partida com captura reproduzível, pausa segura, resultado imutável e replay isolado, mantendo o jogo disponível sem serviços remotos.

## ADDED Requirements

### Requirement: Estados e preparação da sessão

A sessão SHALL oferecer Menu, Loading, Playing, Paused e Result. Play SHALL capturar novo matchId, identidade local, configuração completa e seed antes da simulação. Loading e falhas recuperáveis SHALL não consumir tempo ativo; Retry SHALL conservar a preparação da mesma tentativa lógica. Somente Playing SHALL executar gameplay.

#### Scenario: Início normal e recuperação
- **WHEN** Play é acionado e um asset falha antes de Retry bem-sucedido
- **THEN** Loading permanece visível e sem avanço de tempo até o sucesso
- **AND** o matchId, a configuração e a seed capturados são conservados durante Retry; sucesso entra em Playing com tempo e score zero

#### Scenario: Mudança externa após Play
- **WHEN** opções salvas ou objetos de origem mudam após a captura
- **THEN** a partida atual continua usando integralmente seus dados capturados
- **AND** nenhuma falha de armazenamento ou serviço remoto impede iniciar uma partida com dados locais válidos

### Requirement: Término único e precedência

A partida SHALL concluir exatamente uma vez ao atingir zero de saúde ou o limite de tempo ativo capturado. No mesmo passo final, player_destroyed SHALL prevalecer sobre time_expired. O término SHALL preservar todo score válido desse passo e congelar estado e resultado contra eventos posteriores; sobreviver SHALL não conceder pontos e score zero SHALL ser válido.

#### Scenario: Limite de tempo sem inimigos
- **WHEN** uma sessão válida de 60 segundos ativos chega ao limite com player vivo e score zero
- **THEN** conclui com time_expired, duração ativa de 60000ms e score zero
- **AND** passos, ataques, spawns, efeitos e comandos posteriores não alteram a conclusão

#### Scenario: Morte e empate
- **WHEN** dano real reduz o player a zero antes do limite ou exatamente no último passo de tempo
- **THEN** conclui uma vez com player_destroyed e duração ativa do passo letal
- **AND** o score inclui as mortes válidas causadas pelas balas existentes na resolução atômica desse passo

### Requirement: Pausa explícita e limpeza integral

Escape ou P por borda sem repeat, botão Pause, blur ou documento oculto SHALL pausar Playing, desligar auto-sail e limpar ataques, bordas, joypad e alvos transitórios. Pausa SHALL congelar relógio, entidades, cooldowns, IA, RNG, reservas e efeitos. Resume SHALL ser explícito, limpar input novamente e reiniciar a referência temporal sem catch-up.

#### Scenario: Pausa manual com ações mantidas
- **WHEN** Q/W/E e movimento estão ativos e Escape, P ou Pause é acionado
- **THEN** Paused congela o estado e os prazos ativos, com auto-sail Off e comandos neutralizados
- **AND** repeats não retomam a partida, Resume conserva o estado congelado e exige novos comandos de ataque e movimento

#### Scenario: Foco e visibilidade
- **WHEN** blur ou hidden ocorre durante Playing e o foco retorna muito tempo depois
- **THEN** a sessão permanece Paused até Resume explícito, sem avanço por tempo de parede
- **AND** inputs recebidos fora do contexto ativo ou durante um diálogo não ficam enfileirados

### Requirement: Confirmação de abandono sem resultado

Main Menu durante Playing SHALL pausar antes de abrir Abandon this match? com Keep Playing e Abandon. Em Paused SHALL abrir a mesma confirmação. Keep Playing SHALL retornar a Paused e exigir Resume. Abandon SHALL liberar a sessão e retornar ao menu sem produzir resultado ou substituir o último concluído. Sair de Loading SHALL cancelar sem registro.

#### Scenario: Cancelar a saída
- **WHEN** Main Menu abre a confirmação durante uma batalha e Keep Playing é escolhido
- **THEN** o diálogo fecha em Paused com foco em Resume, preservando o tempo ativo e estado congelados
- **AND** a simulação só volta após Resume

#### Scenario: Abandonar ou sair durante Loading
- **WHEN** Abandon é confirmado ou Main Menu é acionado durante Loading
- **THEN** recursos e tentativas pendentes são descartados e o menu permanece ativo mesmo após callbacks tardios
- **AND** nenhum resultado é criado ou persistido por essa sessão

### Requirement: Resultado local legível e recuperável

Result SHALL apresentar score final, duração ativa, Time expired ou Ship destroyed, estado honesto da persistência local, Play Again e Main Menu. O menu SHALL oferecer Last Result quando houver resultado concluído disponível. Abrir Last Result SHALL apresentar os dados históricos imutáveis sem iniciar simulação; a interface SHALL não afirmar confirmação remota inexistente.

#### Scenario: Exibição do fim e histórico local
- **WHEN** a partida conclui e o usuário retorna ao menu e abre Last Result
- **THEN** o mesmo resultado completo é exibido, com score, duração e motivo conservados
- **AND** nenhum loop de simulação ou novo registro é iniciado ao consultar o resultado

#### Scenario: Status de gravação real
- **WHEN** a escrita local conclui ou falha
- **THEN** Result informa respectivamente Saved on this device ou uma falha local legível
- **AND** a falha conserva o resultado na sessão e mantém Play Again e Main Menu disponíveis, sem usar Recorded ou Pending como afirmação de entrega remota

### Requirement: Replay com isolamento completo

Play Again SHALL criar novo matchId e nova preparação com opções salvas atuais, seed capturada e estado aleatório reiniciado. SHALL resetar saúde, score, relógio, armas, inimigos, diretor, reservas, projéteis, efeitos, input, steering e auto-sail Off. Nenhuma entidade, comando ou callback de execução anterior SHALL atingir o replay.

#### Scenario: Replay após fim ou Last Result
- **WHEN** Play Again é acionado após uma partida ou ao consultar Last Result
- **THEN** passa por Loading e inicia outra execução com novo ID, saúde cheia, score e tempo zero, armas prontas e sem estado herdado
- **AND** alterações válidas de opções salvas afetam a nova configuração, enquanto o resultado anterior conserva a configuração histórica

#### Scenario: Estado aleatório reproduzível
- **WHEN** duas execuções novas recebem explicitamente a mesma configuração, seed e inputs
- **THEN** começam com RNG e sequências de entidades reiniciados e produzem o mesmo gameplay
- **AND** a identidade nova da partida não muda as regras de geração

### Requirement: Persistência local defensiva

O último resultado concluído SHALL ser salvo localmente antes de qualquer futura integração remota. Dados persistidos SHALL ser tratados como desconhecidos e validados integralmente, incluindo configuração, chave, identidade, seed, score, duração e data UTC. JSON corrompido ou storage negado SHALL produzir recuperação legível sem bloquear Play. Resultado válido SHALL manter sua configuração histórica.

#### Scenario: Refresh durante combate
- **WHEN** existe resultado concluído salvo e a página é recarregada durante Playing ou Paused
- **THEN** a sessão em andamento é abandonada e o menu recupera somente o último resultado concluído
- **AND** nenhum autosave de partida ativa ou registro de abandono substitui esse resultado

#### Scenario: Dados inválidos e acesso negado
- **WHEN** leitura encontra JSON inválido, objeto incompleto, configuração aninhada inválida ou chave divergente, ou storage lança erro
- **THEN** os dados inválidos não são aceitos como resultado e a interface explica a recuperação ou indisponibilidade
- **AND** Play continua disponível e uma falha de escrita não apaga o resultado válido mantido em memória

### Requirement: Cinco ciclos sem recursos residuais

Cinco ciclos de início, término, replay e abandono SHALL conservar no máximo uma sessão e um canvas ativos. Saída ou substituição SHALL liberar entidades, loops, listeners, observadores, input e recursos próprios; pausas e terminal SHALL não manter avanço agendado. Texturas compartilhadas SHALL seguir a política de cache existente.

#### Scenario: Repetição sob Strict Mode
- **WHEN** cinco ciclos incluem Result, Play Again, pausa, abandono e navegação repetida sob Strict Mode
- **THEN** o menu termina sem canvas, recursos próprios, frames ou listeners da arena ativos
- **AND** cada nova partida começa limpa, sem crescimento sustentado de entidades nem callbacks antigos alterando a tela atual
