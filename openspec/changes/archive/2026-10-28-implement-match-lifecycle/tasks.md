# Tasks

## 1. Preparação, configuração e resultado puros

- [x] 1.1 Definir preparação de sessão e conclusão autoritativa com identidade/metadados explícitos, preservando MatchSetup e importação sem efeitos; verificar typecheck app/core e testes de captura profunda sem DOM.
- [x] 1.2 Implementar chave canônica de todos os parâmetros de gameplay e versões, independente de ordem de propriedades/seed/identidade/preferências; verificar equivalência, alterações por família de parâmetros e preservação da ordem de arrays relevantes em testes unitários.
- [x] 1.3 Implementar validação de unknown para configuração completa e CompletedMatchResult, incluindo tipos aninhados, geometria, limites, enums, identidade, seed, data UTC, score, duração e chave consistente; verificar round-trip histórico, campo ausente/errado em cada família, chave divergente e imutabilidade com Vitest.
- [x] 1.4 Documentar em ARCHITECTURE.md, em inglês, fronteira de sessão, dados puros, representação da chave e contrato histórico; conferir exemplos contra os testes e preservar o encoding não afetado.

## 2. Término autoritativo e loop

- [x] 2.1 Implementar limite exato de tempo ativo, morte/empate com precedência de morte e estado completed irreversível; verificar tempo válido de 60s em cenário vazio, morte por dano real, score zero, limite numérico e step/freeze/resume inertes após terminal.
- [x] 2.2 Integrar a fronteira terminal após todas as balas existentes e contatos válidos, antes de emissões/diretor, com ended único e último; preservar a regressão de combate score 2 no passo letal e testar ordem dano/destruição/score/ended, contato letal no limite e ausência de tiro/spawn tardio.
- [x] 2.3 Entregar eventos por passo no loop, impedir consumo de input/passos após terminal e cancelar RAF/baseline/acumulador; verificar frame multistep, apresentação/resize repetidos e callbacks tardios sem conclusão duplicada, com driver de frames controlável.
- [x] 2.4 Atualizar documentação do passo final e protocolo de eventos em ARCHITECTURE.md e ajustar expectativas antigas sem apagar cenários de colisão/IA; verificar suites core afetadas e importar a engine sem plataforma.

## 3. Storage e fronteira de sessão

- [x] 3.1 Criar adapter local versionado para opções válidas, identidade e Last Result, isolando leitura/escrita/parse e falhas de acesso/quota; verificar round-trip, dados inválidos, defaults explicados, resultado histórico sem reconstrução por defaults e storage negado em Vitest.
- [x] 3.2 Preparar Play/Play Again com novo ID, seed e opções salvas atuais, conservar preparação em Retry e materializar/salvar conclusão uma vez antes do status salvo; verificar fábricas injetadas, callback duplicado/obsoleto, data fornecida uma vez e reset completo de engine/RNG/IDs.
- [x] 3.3 Garantir que refresh/abandono não persistem sessão ativa nem sobrescrevem Last Result; falha de escrita retém resultado em memória e o dado anterior em storage, com status honesto; verificar esses caminhos em testes de sessão/storage e documentar chaves/fallback em ARCHITECTURE.md.

## 4. Input, renderer e pausa

- [x] 4.1 Implementar Escape/P por borda sem repeat/keydown duplicado e Pause contextual, passando pela mesma pausa de blur/hidden; verificar ausência de avanço no comando de pausa, limpeza de Q/W/E/R/steering/movimento/joypad neutro e ausência de comandos capturados em menus/diálogos/modificadores em testes de input/loop.
- [x] 4.2 Completar Resume explícito, com nova limpeza de input, auto-sail Off, reset da baseline e zero RAF enquanto paused/terminal; verificar ausência longa, foco restaurado sem retomada, cooldowns, balas, IA, RNG e reservas congelados sem catch-up.
- [x] 4.3 Passar configuração/seed capturadas a todo o renderer e input, incluindo mapa, playerStart, raios, viewport, clamp, overlays, telegraphs e diagnósticos opt-in preparados antes da captura; verificar cenário com configuração diferente dos defaults e regressões de resize/DPR/geometria sem alterar a sessão.
- [x] 4.4 Estender owner/resource para pause/resume/término e descarte sem duplicar listeners/canvas ou destruir texturas compartilhadas; verificar Strict Mode, cancelamento Loading, inicialização tardia e replay com testes de ownership; atualizar documentação técnica dos novos caminhos.

## 5. Telas, diálogos e fluxos jogáveis

- [x] 5.1 Integrar Menu/Loading/Playing/Paused/Result e status semântico de tempo restante, saúde, score e estado com publicação limitada; verificar loading/falha/retry sem relógio, zero negativo, pausa e resultado anunciados sem atualização por frame, e layout desktop/320px/landscape.
- [x] 5.2 Implementar Pause e confirmação Abandon this match? com Keep Playing/Abandon, foco contido/visível e retorno de Keep Playing a Paused; verificar teclado, hotkeys ignoradas nos diálogos, Resume explícito, restauração de foco e descarte sem resultado via E2E real.
- [x] 5.3 Entregar Result com score/duração/motivo/status local/Play Again/Main Menu e Last Result no menu sem montar simulação; verificar ambos os motivos, falha local legível, refresh conservando último concluído e recuperação histórica sem novo registro em E2E.
- [x] 5.4 Implementar replay com nova engine/configuração atual e reset de saúde/score/tempo/armas/inimigos/diretor/reservas/projéteis/efeitos/input/steering/auto-sail/RNG; verificar novo ID, opções salvas alteradas antes do replay e configuração histórica intacta, usando preparação anterior e controles reais.
- [x] 5.5 Atualizar README.md em inglês com loop, Escape/P/Pause/Resume, abandono, Play Again/Last Result, storage, cenários opt-in e reprodução dos finais; adaptar helpers E2E antigos à confirmação de saída e verificar os comandos documentados sem antecipar Options ou API.

## 6. Integração e evidências do incremento

- [x] 6.1 Executar E2E completos em dev e preview com storage isolado: tempo válido de 60s em empty, morte por IA real, pausa manual/blur/hidden, recargas/reservas congeladas, diálogos/foco, abandono, Result/Last Result/refresh, storage negado e replay/opções atuais; salvar HTML/anexos/traces em evidências 06, sem setters de saúde/score e sem alterar evidências 01–05.
- [x] 6.2 Executar cinco ciclos que misturem término/replay/abandono sob Strict Mode e inspecionar entidades/canvas/RAF/listeners/observers/subscriptions/recursos; confirmar zero recursos próprios da arena no menu e ausência de crescimento sustentado/callbacks obsoletos, com contadores e limitação de ambiente registrados.
- [x] 6.3 Inspecionar capturas de Paused, confirmação, Result e Menu com Last Result em desktop, 320px e landscape; corrigir cortes/overflow/foco/legibilidade e registrar evidências visuais do estado entregue.
- [x] 6.4 Executar npm.cmd run lint, npm.cmd run typecheck, npm.cmd test, npm.cmd run build, E2E e openspec.cmd validate implement-match-lifecycle --strict --json; registrar comandos, exit codes, arquivos, decisões e limitações em apply.md, marcando somente tarefas implementadas e verificadas.

## Workflow follow-up

- Encerrar apply e executar VERIFY independente em novo executor autorizado, corrigindo divergências materiais antes do archive.
- Após VERIFY satisfatório, sincronizar os sete deltas com main specs preservando Purpose e cenários, validar specs estritamente e arquivar em fase própria. Não implementar incrementos seguintes nesta change.
