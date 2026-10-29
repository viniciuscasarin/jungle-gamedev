# Tasks

## 1. Navegação lógica e neutralização

- [x] 1.1 Interpretar steering direcional e movementRequested no engine com giro finito, velocidade frontal e colisão existentes; verificar testes puros de vetor nulo/não finito, menor arco, meia volta, avanço com R Off, coexistência com auto-sail e regras de mouse preservadas.
- [x] 1.2 Acrescentar neutralização explícita de auto-sail para troca de modo pelo loop/engine sem simular R nem avançar tempo; verificar snapshots antes/depois com posição, rumo, saúde, score, configuração e tempo iguais, somente auto-sail Off.
- [x] 1.3 Documentar em inglês no ARCHITECTURE.md os comandos manuais, retenção do último rumo, neutralização e propriedade da linha temporal; conferir correspondência com os testes e contratos de navegação.

## 2. Buffer composto e input touch

- [x] 2.1 Compor teclado e fontes por pointer ID no buffer compartilhado, com estado por arma, proprietário único do joypad e bordas consumíveis; verificar testes de dois IDs na mesma arma, release individual, dedo estranho, clear idempotente e bordas em frames com zero/vários passos.
- [x] 2.2 Implementar geometria pura do joypad em CSS px com dead zone inclusiva15%, vetor normalizado, movimento fixo e retenção de direção após release/centro; verificar fronteiras14,9/15/15,1%, fora do raio, inválidos, release R Off/On e giro até o último rumo.
- [x] 2.3 Integrar captura nativa por controle e handlers up/cancel/lostcapture ao recurso de batalha, mantendo Q/W/E ao arrastar fora; verificar testes do adapter de IDs independentes, limpeza repetida, controle original e cancelamento sem apagar fontes alheias.
- [x] 2.4 Implementar R touch por up válido dentro do botão, descartando cancel/lostcapture antes da confirmação e evitando click compatível duplicado; verificar cancel antes do próximo passo, release fora, up seguido de lostcapture/click e nova pressão válida.
- [x] 2.5 Definir modo inicial por ponteiro primário coarse e troca por input real, ignorando mouse compatível de touch e hasTouch isolado; verificar testes de híbrido, troca em ambas as direções, neutralização antes do novo gesto e resize sem troca.
- [x] 2.6 Integrar contexto composto/foco e limpeza de capturas/fontes em pausa, hidden, window blur, término e dispose; verificar testes de foco interno sem cancelar outros dedos, retorno sem comandos e contextos de menu/formulário/diálogo sem hotkeys de jogo.
- [x] 2.7 Documentar em inglês no ARCHITECTURE.md e README.md fonte/captura, regras de cancelamento/R e controles touch/híbridos; conferir exemplos com o comportamento verificado e não prometer hardware físico não testado.

## 3. HUD semântico e enquadramento responsivo

- [x] 3.1 Registrar ícones/botões/saúde já inspecionados no catálogo DOM com metadados corretos e fallback, sem bloquear assets Pixi; verificar testes do catálogo/loading e abrir visualmente qualquer asset adicional antes de uso, atualizando créditos/papel frontReference em inglês.
- [x] 3.2 Criar indicadores/controles semânticos React com ícone, letra, Ready, cooldown visual e segundos de Q/W/E, R On/Off e vida atual/máxima; derivar valores numéricos da publicação limitada existente e verificar status e preenchimento independentes com pausa exata, sem timer/RAF adicional.
- [x] 3.3 Aplicar layout desktop vida na base/QWER acima e touch vida topo/joypad esquerda/skills direita2×2 conforme espaço, score/time/Pause topo; verificar controles de pelo menos48×48 CSS px e guia de modo antes/durante play, foco visível e ações fora do canvas.
- [x] 3.4 Substituir faixas fixas por medição real do HUD compartilhada com owner/recurso/viewport, aplicando safe areas uma vez e atualizando sem resize do host; verificar testes de fit/inversão, layout alterado, insets não nulos, área zero e DPR sem multiplicar coordenadas de input.
- [x] 3.5 Atualizar README.md e ARCHITECTURE.md em inglês para HUD, leitura semântica, controles e fonte única de insets; conferir as instruções no app em320 portrait/landscape e manter fluxos anteriores de Options/Loading/Pause/Result.

## 4. Barras de saúde Pixi

- [x] 4.1 Apresentar barras horizontais por ship ID para player e todos os inimigos vivos/alvos opt-in, derivadas do snapshot e independentes do giro do casco; verificar proporção/clamp, posição, limite de mundo e tamanho CSS mínimo legível em testes de apresentação/geometria.
- [x] 4.2 Remover/destruir barras próprias na morte/saída, preservando cache de texturas e loop único; verificar inspeção somente leitura de contagens/retângulos e teardown sem Graphics residuais ou comandos de mutação para teste.
- [x] 4.3 Documentar em inglês no ARCHITECTURE.md e créditos os recursos gráficos e a estratégia de legibilidade/clamp; verificar screenshots com player, Chaser e Shooter danificados por combate real, navios girados, pausa e remoção da barra na morte.

## 5. Integração de navegador e evidências

- [x] 5.1 Direcionar resultados HTML/traces/screenshots do Playwright a project/automation-reports/08-implement-responsive-hud-and-touch antes das execuções e ampliar auditor de listeners/capturas/barras; verificar preservação das evidências01–07 e contadores nativos para os eventos novos, mantendo regressões antigas relevantes.
- [x] 5.2 Acrescentar E2E com multitouch real via CDP ou equivalente, IDs persistentes e pointer events confiáveis/captura nativa; verificar joypad junto de Q/W/E, ataques simultâneos e dano/score por trajetória/projétil/colisão real, sem mutar snapshot nem usar dispatch sintético como prova única.
- [x] 5.3 Verificar no browser release/drag-out/cancel/lostcapture, dois dedos na mesma arma, dedo alheio no joypad e R up/cancel sem duplicação; registrar evidência de ausência de comando preso após release e pausa/Resume com contatos mantidos.
- [x] 5.4 Verificar na mesma sessão resize/orientação/DPR e troca real mouse↔touch: comparar matchId/configuração/estado, retenção de comando lógico/auto-sail em resize e neutralização na troca de modo, sem reset ou passo artificial.
- [x] 5.5 Medir mundo/HUD/hitboxes/safe areas controladas e ausência de overflow em desktop1280×900 e touch320×568,390×844,844×390,568×320; capturar e abrir visualmente Ready, cooldown, R On, pausa congelada e barras por dano real, corrigindo sobreposições/recortes sem reduzir critérios.
- [x] 5.6 Executar cinco ciclos Play→Pause→Menu/Re-play, incluindo teardown com pointers ativos; verificar um canvas/loop, ausência de listeners/capturas/observers/barras órfãos e nova partida sem input herdado, preservando testes de foco, colisão e ciclo de vida anteriores.
- [x] 5.7 Executar npm.cmd run lint, npm.cmd run typecheck, npm.cmd test, npm.cmd run build, E2E dev/preview e openspec.cmd validate implement-responsive-hud-and-touch --strict; registrar comandos, exit codes, screenshots inspecionadas e limitações reais em apply.md, marcando somente tarefas efetivamente concluídas.

## Workflow follow-up

- Encerrar apply e entregar a verificação independente ao novo executor conforme project/automation.md; divergências materiais impedem archive.
- Após verificação satisfatória, sincronizar as quatro delta specs, conferir Purpose/cenários desktop preservados e arquivar esta change no workflow autorizado.
- Não publicar, fazer push ou alterar automation-state.json pelo executor desta fase.
