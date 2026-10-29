# Propose — implement-menu-and-options

Planejamento concluído pelo executor `/root/i07_propose` em 28/10/2026. O executor
encontrou indisponibilidade de capacidade após escrever todos os artefatos, antes
do handoff final. O orquestrador reconciliou os arquivos em disco e a CLI; não foi
necessário recriar a change nem lançar outro executor de planejamento.

## Artefatos e decisões

Scaffold existente, proposal, design, três deltas e tasks. Nova capability
menu-options; application-shell e asset-loading modificadas. O design mantém
validação/configuração/storage/lifecycle existentes, rascunho isolado em segundos,
Save somente válido e confirmado, Cancel/Escape sem escrita, falha recuperável,
mensagens acessíveis e avisos independentes. Assets decoram HTML real, com painel
flexível/metadados/estados corretos e catálogo DOM separado da carga da arena.

As tarefas cobrem parser/limites, formulário/storage/foco/teclado/touch, corrupção,
Save-refresh/Cancel/falha, estados visuais e layouts, snapshot ativo e replay com
último Save, documentação e evidências07 preservando01–06. Sem dados remotos,
formulário durante partida, mobile de combate ou áudio. Não há código implementado
por esta fase; todos os checkboxes continuam pendentes.

## Reconciliação independente do orquestrador

- `openspec.cmd status --change implement-menu-and-options --json`: exit0,
  raiz local válida, schema spec-driven, quatro artefatos done e planejamento completo.
- `openspec.cmd validate implement-menu-and-options --strict`: exit0, change válida.
- Tasks e trecho final do design lidos diretamente do disco: critérios de validação,
  metadados, preservação de evidências, falhas de storage e snapshot/replay presentes.
- Nenhuma implementação ou teste de produto foi alegado nesta fase.

PATH somente do processo com Node26.11.1 do runbook; sem mudança global, push ou
deploy. Nenhum bloqueio de planejamento restante. Próxima fase autorizada: APPLY
em novo subagente, preservando a proposta e executando cada tarefa com evidência.
