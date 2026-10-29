# Apply — integrate-assets-and-arena-renderer

Concluído em 27/10/2026 por `/root/i02_apply`. Change `spec-driven`, **21/21 tasks**
confirmadas pela CLI, estado `all_done`. Pronto para VERIFY independente.

## Escopo e fontes

Lidos skill `.agents/skills/openspec-apply-change/SKILL.md`, `project/automation.md`,
contexto comum e somente bloco 02 de prompts, GDD, config/specs principais, relatórios
explore/propose 02 e todos os contextFiles retornados por `instructions apply`.
Raiz local confirmada por `openspec.cmd list --json`; sem store ou raiz nova.
Autorização antecipada do roteiro cobre implementação/correções/testes desta fase.
Não houve spawn, alteração do estado da automação, sync/archive, push ou deploy.
GDD e assets fornecidos permanecem sem alteração (`git diff -- GDD.md assets` vazio).
Foram preservados os arquivos anteriores, inclusive os ainda untracked do incremento 01.

## Entrega

- Manifesto de 30 PNGs individuais com URLs Vite, dimensões físicas/lógicas medidas,
  orientação e metadados UI; player 5/Chaser 3/Shooter 8 verificados. Chaser/Shooter e
  referências adicionais são catálogo, sem entidades ativas. Sem sample achatado.
- Cache de sessão com promise compartilhada, leases idempotentes, rejeição recuperável,
  retenção de cargas parciais válidas e descarte final aguardando leases/cargas.
  Inicialização gráfica tardia conserva lease até seu recurso ser destruído.
- Configuração pura `arena-v2`, `balance-v1` preservado: duas ilhas 160×120 nas origens
  (135,95)/(665,325), contorno convexo local profundamente imutável. Renderer monta
  água e24 tiles das ilhas, decoração sobre terra e player(480,270) para cima.
- Transformações puras em CSS local ao host, escala uniforme, offsets e letterbox,
  estado seguro sem área útil, faixas 48/88px mais safe areas. DPR muda apenas buffer;
  ResizeObserver/window resize/media query rearmável atualizam sem reconstruir cena.
- Owner atual mantém recurso destacado, init parcial/tardio, descarte idempotente e
  callbacks obsoletos ignorados. Texturas ficam com cache; app/stage/sprites/canvas e
  subscriptions com renderer/owner. Ticker privado parado e nenhuma RAF contínua.
- Menu HTML com UI fornecida, Play→Loading mínimo 300ms→Static Arena, status semântico,
  foco acompanhando títulos/retorno, Retry e Main Menu inclusive durante Loading.
  `?assetScenario=fail-once` falha antes de adquirir cache e Retry segue caminho normal.
- README, ARCHITECTURE e ASSET_CREDITS em inglês descrevem fluxo, comandos, lifecycle,
  geometria/vértices, fórmulas e procedência sem inferir autor/licença.
- Playwright limitado ao fluxo atual, cinco testes rodados contra dev e preview.
  Nenhum combate, Options, ranking, storage/outbox ou integração futura foi antecipado.

## Evidência geométrica e visual

`measure-shoreline.py` recompõe tiles 6–9/22–25/54–57 e compara configuração com areia
selecionada por cor RGB, não inferindo terra de alpha bounds ou água opaca. Silhuetas
externas de linhas/colunas evitam fronteiras internas da grama.65 vértices convexos,
768 amostras, escala 0.625 unidades/pixel. Erro máximo areia→segmento **1.875** unidades;
reverso amostrado em 21 pontos/segmento **1.9008633**, ambos abaixo de 4. Fonte e overlay
em `island-source.png`/`shoreline-overlay.png`, números em `shoreline-measurements.json`.
ARCHITECTURE lista todos os vértices e convenção clockwise/x-direita/y-baixo.

Inspecionadas imagens reais em `browser-evidence/`: menu desktop e320×568, Loading,
falha simulada/gráfica, arena 1280×900,320×568,390×844,844×390 e844×390 DPR 2, para dev e
preview. Mundo completo, tiles quadrados, navio azul proporcional voltado para cima,
centro livre, litoral alinhado no overlay rosa e bandas sem cobrir arena. O botão
Main Menu recebeu texto claro para contraste sobre o botão secundário azul.
Menu 320px tem título e ações legíveis, sem scroll horizontal. Toque real no DOM e
Tab/Enter/foco exercitados. Os arquivos DPR 2 têm 1688×780 pixels para 844×390 CSS.

## Recursos vivos: cinco ciclos reais

`browser-observations.json` consolida anexos estruturados do relatório HTML final,
sem inventar números. Em **cada um dos cinco ciclos**, nos dois projetos:

| Recurso observado | Arena | Main Menu após saída |
| --- | --- | --- |
| Application/recurso/subscription do adaptador |1/1/1|0/0/0|
| Canvas anexado |1|0|
| ResizeObservers nativos (inclui o CanvasObserver Pixi) |2|0|
| Window resize/resolution query listeners |1/1|0/0|
| RAFs pendentes |0|0|
| Leases |1|0|
| Texturas válidas em cache |30|30|

Baseline inicial:0 em todos, inclusive texturas. Cache permanece utilizável entre
ciclos. HTML final registra console-issues vazio em todos os 10 testes; nenhum erro
inesperado ou rejeição sem tratamento. Diagnósticos de leitura são corroborados por
instrumentação de APIs nativas no navegador, não apenas mocks/counters próprios.

## Comandos finais e resultados

Em todo shell, PATH do processo recebeu primeiro
`C:\Users\Vinicius\AppData\Local\Author Software\nvm\installs\v26.11.1`.
Usados `npm.cmd`/`openspec.cmd`, sem nvm global ou flags de bypass.

| Comando | Resultado capturado imediatamente |
| --- | --- |
| `npm.cmd install -D @playwright/test --save-exact` |Exit 0; versão 1.64.1 e lockfile atualizados|
| `npm.cmd ci` (após encerrar servidores da primeira tentativa) |**Exit 0**,191 pacotes instalados,192 auditados,0 vulnerabilidades reportadas|
| `npm.cmd run lint` |**Exit 0**|
| `npm.cmd run typecheck` |**Exit 0**, inclui testes E2E e core sem DOM|
| `npm.cmd test` |**Exit 0**,8 arquivos/71 testes aprovados (contagem corrigida em VERIFY independente)|
| `npm.cmd run build` |**Exit 0**,739 módulos; warning de chunk principal 512.34kB sem falha|
| Python/Pillow `measure-shoreline.py` |**Exit 0**, dois limites geométricos<4|
| `npm.cmd run e2e` com Chromium existente |**Exit 0**,10/10 aprovados em 1.4min;0 inesperados/flaky/skipped|
| `openspec.cmd validate integrate-assets-and-arena-renderer --strict` |**Exit 0**, change válida|
| `openspec.cmd instructions apply --change integrate-assets-and-arena-renderer --json` |**Exit 0**,21/21, remaining 0, state=all_done|

Os checks finais de instalação/lint/typecheck/test/build foram capturados no exec 68437;
E2E integral no exec 48947, com saída persistida em `e2e-final.log`. Versão do executável
confirmada por `--version`, exit 0: **Google Chrome for Testing 156.0.8078.4**, headless
shell revisão 1248 local. O E2E final foi executado fora do sandbox após aprovação
automática, permitindo teardown correto dos processos Windows de Vite/Chromium.
Cada checkbox foi comparado com sourcePath/line/description retornados pela CLI,
marcado individualmente somente após evidência e novamente consultado para confirmar
incremento de progresso. Snapshot final em `apply-instructions-final.json`.

## Falhas intermediárias e correções

- Um shell de leitura usou brace expansion incompatível com PowerShell; corrigido
  para paths explícitos antes de mutação. Typecheck inicial detectou referências a
  envelopes antigos nos testes; atualizado para geometria/snapshots reais.
- Vitest detectou release repetido em tentativa cancelada. Corrigida liberação
  única e retenção durante init gráfica; testes de consumidor sobrevivente, retry,
  carga tardia e init tardia aprovados. Não afrouxado o aceite.
- Emulação CDP de DPR altera devicePixelRatio antes de invalidar media queries.
  Tentativa inicial aguardava buffer 1688, recebia 844; depois o retorno 1× também
  precisou invalidar mídia. O teste agora alterna mídia nativa screen/vazia após
  métricas, sem invocar código da app nem despachar resize sintético. Isso faz a
  query nativa notificar nos dois sentidos. Unit test separado cobre rearm/cleanup.
  Raw Page.captureScreenshot evita que page.screenshot restaure métricas de contexto.
  Traces das falhas anteriores preservados em `failure-traces/`. Não foi removida
  a verificação DPR nem introduzido polling/ticker de produto para fazê-la passar.
- Primeiras suítes no sandbox produziram resultados, mas aguardaram teardown de
  servidores e foram interrompidas; não contabilizadas como execução integral exit 0.
  npm ci com DLL rolldown ainda em uso falhou EPERM(-4048), deixando dependências
  parciais; checks subsequentes falharam por ferramentas ausentes. Encerrados somente
  processos desta validação; npm ci normal e todos checks foram refeitos com sucesso.
- Uma gravação de ARCHITECTURE por Python encontrou encoding padrão cp 1252; documento
  foi reconstituído integralmente em UTF-8 e conferido, preservando contratos/dados da
  fundação e documentando o novo escopo. Não houve perda em GDD/assets.

## Arquivos e handoff

Principais mudanças: `src/render/assetManifest.ts`, `assetCache.ts`, `sessionAssets.ts`,
`viewport.ts`, `resizeObserver.ts`, `loadingAttempt.ts`, `pixiPreview.ts`; configuração
pura `src/domain/config.ts`; `src/ui/App.tsx/styles.css`, `src/main.tsx`, `index.html`;
testes de cache/manifesto/loading/viewport/observer e config; `tests/e2e/arena.spec.ts`,
`playwright.config.ts`, package/lock/tsconfig; README/ARCHITECTURE/ASSET_CREDITS e tasks.
O owner anterior e seus testes de falhas mount/resize/observe continuam preservados.

Evidência principal: `playwright-report/index.html`, `e2e-final.log`,
`browser-observations.json`, screenshots em `browser-evidence/`, medição/overlay,
`failure-traces/` e snapshots estruturados `report-*.json` extraídos do próprio HTML.

Não há bloqueio conhecido para VERIFY. O próximo executor deve auditar artefatos,
código e evidências de forma independente e corrigir divergências de escopo antes
de autorizar archive. Não usar tasks marcadas como única prova. Limitações reais:
Chromium local headless/viewports emulados (não aparelhos físicos), nenhuma medição
de performance de partida e autoria/licença dos assets ainda não documentadas.
Warning de bundle é informativo neste incremento. Sem alegação de jogo completo ou
publicado. Esta fase encerra aqui, sem iniciar VERIFY, sync ou archive.
