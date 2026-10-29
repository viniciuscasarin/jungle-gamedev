# Automação sequencial do Pirate Battle

## Objetivo e autorização

Executar os incrementos de `project/prompts.md` na ordem, com um subagente novo
e contexto limpo para cada fase: `explore → propose → apply → verify → archive`.
Esta automação foi solicitada pelo usuário em 27/10/2026, incluindo delegação
a subagentes e execução sem interação. A autorização cobre antecipadamente
exploração, criação e revisão de artefatos, implementação, correções, testes,
sincronização de specs e arquivamento de cada incremento dentro desse roteiro.
Não esperar outra mensagem entre propose e apply nem confirmação rotineira de
sync/archive: esta é uma instrução explícita do usuário para esse fluxo.
Explore continua sem implementar código; cada fase termina antes da próxima.

Resolver decisões técnicas locais com base no GDD e registrar a justificativa.
Não reduzir requisitos para concluir uma fase. Não fazer push, publicar,
provisionar serviços pagos ou presumir credenciais/destino de hospedagem.
O incremento 17 só pode publicar se houver destino e autorização de publicação
explícitos e verificáveis; do contrário registrar `blocked_external`, sem
perguntar nem declarar o jogo publicado. O pedido de automação não define
destino de hospedagem nem constitui autorização específica de deploy.

## Fontes e ambiente

- Workspace: `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev`.
- Ler instruções aplicáveis, este arquivo, `project/automation-state.json`,
  contexto comum e bloco do incremento em `project/prompts.md`, `GDD.md`,
  `openspec/config.yaml`, specs e artefatos pertinentes.
- Não carregar prompts de incrementos futuros no contexto do executor.
- Skills do projeto em `.agents/skills/` são a referência para OpenSpec.
- Os nomes `openspec explore/propose/apply` no roteiro invocam workflows de
  skills; não inventar subcomandos CLI com esses nomes.
- Artefatos OpenSpec em pt-BR, headings estruturais e SHALL/MUST em inglês.
  Código, interface e documentação de entrega em inglês.
- Preservar alterações do usuário. Trabalhar neste checkout compartilhado,
  com apenas um executor ativo. Não criar checkouts separados por fase.

O shim global de Node não tinha versão ativa na preparação. Em **cada** shell
PowerShell de execução, antepor o runtime verificado ao PATH do processo:

```powershell
$env:PATH = 'C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1;' + $env:PATH
node --version
openspec.cmd --version
openspec.cmd list --json
```

Isso disponibiliza Node, npm e OpenSpec 1.14.1 sem `nvm use` global.
Se o runtime não existir mais, descobrir outra instalação existente compatível
antes de instalar algo. Respeitar as permissões efetivas do ambiente.

## Orquestração

1. A automação retorna a este chat a cada cinco minutos para retomar trabalho
   interrompido. O agendamento não determina a duração nem separa as fases.
2. Inspecionar os subagentes desta execução e o estado persistido. Se o executor
   registrado ainda estiver ativo, aguardá-lo; nunca lançar duplicata. Um registro
   `running` sozinho não prova que o agente continua vivo. Se não estiver acessível
   ou seu estado for incerto, reconciliar artefatos e processos antes de retomar;
   não assumir conclusão ou executar duas mutações concorrentes.
3. Escolher o primeiro incremento não arquivado e a primeira fase não concluída.
   Inspecionar changes ativas e arquivadas para reutilizar trabalho existente.
   Não começar um incremento antes do archive validado do anterior.
4. Criar um subagente novo com `fork_turns="none"`, herdando as configurações
   padrão de modelo. Passar explicitamente workspace, autorização acima, fase,
   incremento/change, caminhos de leitura, contexto comum e prompt daquele
   incremento. Informar que todos compartilham os arquivos. Não passar o histórico
   inteiro e não reutilizar o executor da fase anterior. Não criar novos chats.
5. Antes de delegar, registrar incremento, fase, tentativa e início no estado;
   após o spawn, registrar o identificador retornado. Só o orquestrador altera
   `automation-state.json`; executores gravam artefatos e relatório da própria fase.
6. Aguardar conclusão com ferramentas de colaboração, fazendo esperas limitadas.
   Conferir o resultado nos arquivos e na CLI; uma mensagem de sucesso sozinha
   não basta. Registrar evidências, falhas e o próximo passo no estado.
7. Após sucesso, iniciar imediatamente a próxima fase em outro subagente; após
   archive, iniciar imediatamente o próximo incremento. Continuar enquanto houver
   trabalho autorizado. Se houver interrupção ou limite de execução, salvar estado
   para o próximo disparo. Não depender de resposta do usuário para continuar.

## Contratos das fases

- **explore:** usar `openspec-explore` para investigar somente o incremento atual,
  dependências, estado do código e decisões necessárias. Sem código de produto ou
  scaffold de change. Devolver descobertas e decisões propostas ao orquestrador,
  que as registra no relatório para o próximo executor.
- **propose:** usar `openspec-propose` com o bloco original e o relatório de
  explore. Gerar/revisar todos os artefatos exigidos pelo schema, conferir que
  cobrem os critérios do incremento e validar a change. Não implementar código.
  Encerrar a fase; o orquestrador inicia apply com a autorização antecipada acima.
- **apply:** usar `openspec-apply-change` para a change selecionada, executar as
  tarefas, testes proporcionais e verificações exigidas pelo roteiro. Marcar
  checkboxes somente quando o comportamento estiver implementado e verificado.
- **verify:** outro executor audita código e evidências contra proposal, design,
  delta specs, tasks, critérios do incremento e GDD. Executar verificações afetadas
  e corrigir divergências dentro do escopo, conforme o prompt de verificação do
  roteiro. Registrar comandos, exit codes, evidências visuais quando exigidas e
  limitações reais. Falhas materiais impedem archive e o próximo incremento.
- **archive:** usar `openspec-archive-change` e `openspec-sync-specs`. A escolha
  antecipada é sincronizar as delta specs e arquivar somente após artifacts,
  tasks e verificação completos. Conferir o merge das specs antes de mover a
  change e respeitar os caminhos resolvidos pela CLI. Nunca arquivar com testes
  obrigatórios falhando, tarefas pendentes, sync bloqueado ou verificação ausente.

Quando a CLI expuser uma impossibilidade real (raiz ausente, store inválido,
artefatos faltando), corrigir apenas quando dentro da autorização existente.
Não contornar os checks da CLI, usar flags de bypass ou afirmar validação sem
executá-la. Se uma change precisar de subdivisão, registrar as subchanges e
concluir/verificar/arquivar todas antes do próximo incremento.

## Progresso, recuperação e conclusão

- Estado em `project/automation-state.json`; relatórios em
  `project/automation-reports/<incremento>-<change>/<fase>.md`.
- Cada relatório registra escopo, decisões, arquivos/artefatos, verificações e
  resultados, limitações e handoff mínimo. Não despejar logs inteiros no estado.
- Reconciliar o estado com o disco e OpenSpec após qualquer interrupção.
  `tasks.md` sozinho não prova verificação; existência no archive sozinha não
  prova sync. Manter as evidências de cada fase.
- Erros corrigíveis: até três tentativas por fase, cada uma em novo subagente,
  usando o relatório anterior. Ao esgotar, registrar `blocked` e a causa concreta;
  não pular a etapa nem repetir indefinidamente a mesma falha.
- Em bloqueio externo, reavaliar no próximo disparo somente se houver evidência
  de mudança relevante. Sem mudança, retornar silenciosamente e sem novos agentes.
- Não pedir escolhas ou aprovações rotineiras. Se o ambiente negar uma operação
  indispensável, registrar a negativa e a limitação; autorização de workflow não
  amplia permissões de ferramentas. Informar uma vez o bloqueio que exija ação.
- Permanecer silencioso quando não houver mudança acionável; notificar somente
  conclusão, falha relevante ou bloqueio que exija ação. Não enviar mensagens a
  terceiros. Ao terminar todos os incrementos autorizados, registrar `completed`,
  informar entregas/evidências/pendências e remover o heartbeat desta automação
  pela ferramenta de automações. Se não puder removê-lo, manter o estado terminal
  e não executar novo trabalho nos disparos seguintes. Não arquivar este chat.

## Uso

A automação ativa aparece em Scheduled/Automações no aplicativo. O computador e
o aplicativo precisam continuar ligados para trabalhar com este repositório local.
O estado inicial está em `ready`, incremento 01, fase `explore`. A criação da
automação prepara o fluxo; não significa que a implementação ou seus testes já
foram executados. O primeiro disparo inicia o desenvolvimento automaticamente.
