# Design

## Context

Ver motivação em `proposal.md`. A base 01–07 está arquivada e há 12 specs principais. `StepInput` já declara `steering: direction` e `movementRequested`, e a configuração já contém dead zone 0,15; porém `engine.ts` somente interpreta alvo e avança com auto-sail. `createInputBuffer` em `desktop.ts` usa booleanos por arma e um alvo de mouse. O listener `host.blur` limpa o buffer inteiro, o que conflita com vários controles DOM mantendo dedos ao mesmo tempo.

`pixiPreview.ts` já apresenta snapshots imutáveis, publica status somente quando seus valores mudam, possui um loop explícito e conserva viewport/DPR via owner e observer. A recarga publicada hoje é somente string. Não há barras sobre navios. `fitViewport` aceita insets, mas o renderer soma safe areas a faixas fixas 48/88; o HUD provisório em `App.tsx` e CSS não fornece joypad nem skills visuais. O E2E global usa `hasTouch: true` até no desktop, portanto capacidade touch isolada seria uma classificação incorreta.

O GDD 4/10 e prompt 08 confirmam controles e posição. A palavra “preserve” do prompt não descreve o estado do renderer: esta change precisa completar barras e interpretação direcional, sem modificar regras de combate ou colisão. `application-shell`, `asset-loading`, contratos e runtime já cobrem semântica, catálogo verificado, input lógico e descarte; não exigem deltas adicionais só por reorganizar arquivos. Purpose das specs existentes e seus cenários desktop permanecem.

## Goals / Non-Goals

**Goals:** Manter uma única simulação/linha temporal, converter touch em comandos lógicos, separar fontes mantidas de capturas nativas, compartilhar medições reais do layout com a transformação e conservar todos os contratos de desktop, pausa, sessão e cache.

**Non-Goals:** Não criar motor de UI ou abstrações para plataformas futuras. Não acrescentar áudio, efeitos de tiro/dano, REST, tuning de balanceamento, câmera móvel, inversão de marcha, strafe ou teleporte de teste. Não trocar tecnologias, adicionar loop React por frame nem publicar o jogo.

## Decisions

### 1. Completar o comando lógico no engine puro

Interpretar vetor direcional finito e não nulo com `atan2`, usando a mesma função de menor arco/limite angular e o mesmo desempate existente de meia volta. Movimento por passo usa `movementRequested || autoSailEnabled`, velocidade frontal fixa e rumo atualizado, passando pela resolução de ilhas, limites e contatos já existente. Vetor inválido conserva rumo e não contamina estado. O adapter normaliza antes do passo; a simulação também impede NaN de comandos inválidos.

O buffer conserva a última direção válida ao soltar/voltar à dead zone, removendo somente o pedido manual. Isso permite R On continuar girando até esse rumo, em vez de fixar o casco no ângulo intermediário do momento da soltura. O mouse continua com alvo lógico persistente, clamp e dead zone em unidades de mundo. A dead zone do joypad usa raio CSS do controle e comparação inclusiva `distância <= raio * 0.15`; deslocamento acima do raio é clampado visualmente, sem acelerar o navio. Alternativa de usar posição absoluta de touch como alvo de mouse foi descartada porque daria destino dependente do local do controle.

### 2. Buffer compartilhado com fontes independentes e adapter de captura

Manter o contrato puro de entrada, extraindo/extensando o buffer existente sem duplicar regras de R/armas. Teclado e cada pointer ID são fontes identificáveis; por arma, o estado lógico é a união das fontes mantidas. Joypad possui um único proprietário e direção/pedido manual separados; contatos adicionais não o roubam. Pointer IDs não são usados como índices de dedo nem pressupõem sequência.

Controles DOM capturam `pointerdown` por `setPointerCapture`, acompanham move no controle original e encerram por `pointerup`, `pointercancel` ou `lostpointercapture`. Encerramento é idempotente; liberá-lo não apaga outros controles. Q/W/E continuam mantidos quando arrastados para fora até release/cancel. R mantém uma pressão pendente e só confirma borda no up dentro da hitbox do mesmo controle, sem cancelamento prévio. Cancel/lostcapture antes do up descarta; lostcapture automático posterior ao up não desfaz confirmação consumível. Click compatível não executa segunda alternância. Ativação sem ponteiro por teclado usa uma rota semântica única, sem duplicar a borda global de R.

Criar um contexto composto de batalha englobando canvas/skills, com gameplay habilitado somente em Playing. Não usar blur individual do canvas para apagar outros dedos. Saída real de contexto, pausa, hidden, window blur, término e destroy limpam buffer e capturas; Resume exige novos comandos. `touch-action: none` e prevenção de scrolling ficam limitados aos controles/canvas de batalha; menus e diálogos mantêm interação nativa. Alternativa de booleano por arma foi descartada porque um release apagaria outra fonte ainda ativa.

### 3. Modo de input independente do tamanho

Escolher inicialmente touch quando o ponteiro primário for coarse, desktop caso contrário. `hasTouch`/`maxTouchPoints` são capacidade, não decisão isolada. Eventos reais de touch selecionam touch; mouse válido de steering e teclado de gameplay selecionam desktop. Eventos de mouse/click de compatibilidade gerados pelo toque não fazem troca de volta; filtros usam tipo/origem do evento e a rota única de ativação. Outros eventos de menu/foco não trocam modo de jogo.

Na troca efetiva, limpar fontes, alvos/vetores, bordas e capturas e desligar auto-sail explicitamente na simulação/loop, sem simular uma tecla R e sem passo artificial. Aplicar o novo gesto válido depois da neutralização. Essa operação não pausa nem altera matchId, configuração, posição, rumo, saúde, score ou relógio. Resize/orientação/DPR apenas reorganizam layout e não selecionam outro modo. Alternativa de breakpoint para modo foi descartada por desligar R durante simples rotação da tela e confundir notebooks híbridos.

### 4. Faixas DOM medidas como fonte única de viewport

Componentes React apresentam grupos superior/inferior conforme `responsive-hud`. Medir ocupação real dessas faixas, incluindo guias, espaçamento e safe areas; fornecer insets ao renderer por contrato explícito através do owner/recurso. Safe areas entram uma única vez: se já incluídas na medição, não somar de novo em Pixi. Medições são relativas ao mesmo host em CSS px e só notificam quando valores mudam, evitando ciclo de ResizeObserver.

Mudança de modo, quebra 2×2, conteúdo ou safe area reapresenta a transformação mesmo sem resize externo. `fitViewport` continua puro; apresentação e inversão de mouse usam exatamente a mesma transformação. Reserva inteira da faixa inferior mantém o mar fora da região de joypad/skills, inclusive no portrait; centro inferior não recebe painel de vida desktop em touch. Estado sem área útil continua não renderizável até recuperar espaço. Alternativa de aumentar constantes 48/88 foi descartada porque não acompanha conteúdo nem safe areas.

Top HUD comporta vida touch, score/time e Pause com hitbox mínima. Main Menu continua acessível via pausa/fluxo existente; se mantido como ação direta adicional, ocupa faixa medida e não o mundo. Em desktop, a linha Q/W/E/R e a vida compartilham centro. CSS de controles de combate não herda o tamanho/padding dos botões grandes de menu; alvos mantêm pelo menos 48×48 CSS px e espaçamento. Quebra visual usa espaço disponível, independentemente de modo.

### 5. Status limitado e assets DOM verificados

Estender `ArenaStatus` com valores numéricos/quantizados de recarga restante e duração capturada, para derivar preenchimento e texto na mesma publicação limitada existente (por exemplo décimos de segundo), sem segundo relógio, timer ou RAF. `Ready` é zero autoritativo; texto em segundos arredonda coerentemente. Pausa não avança recarga visual nem tempo; R tem somente On/Off. Semântica contém nome/tecla/estado e saúde numérica, além do desenho; não colocar cada fração em live region. Menu e arena mostram guia do modo antes e durante play, preservando guias e atalhos desktop.

Reutilizar ícones front/left/right/forward/pause, botões round normal/hover/pressed e health_frame/fill_green já abertos visualmente no explore. Registrar catálogo/metadata: ícones 48×48; round 64×64, outer (4,4,56,56), centro (32,32), ícone 32×32, anchor 0,5; saúde 256×48, fill_rect (30,15,196,20), clipping pela esquerda e draw_order frame→fill. Não preencher a largura256 nem inferir divisão retina. Atualizar o papel `frontReference` e créditos/README para uso efetivo. Qualquer amber/red ou outro asset novo exige `view_image` antes de uso. Ícones/health de DOM pertencem a `DOM_ASSET_IDS` e têm fallback textual/visual, sem expandir por decoração os assets Pixi obrigatórios. Licença desconhecida continua documentada como desconhecida.

### 6. Barras de navios em Pixi sem rotação

Adicionar recursos gráficos próprios identificados por ship ID para player, Chaser, Shooter e alvos opt-in. Barras são irmãs dos sprites ou ficam em camada sobre o mundo, com posição derivada do snapshot e rotação zero; não filhas do casco giratório. Fill clampado em saúde/máxima. Usar dimensões mínimas legíveis em CSS px convertidas pela escala corrente quando necessário, com limite para não cobrir o casco/vizinhos. Próximo da borda superior/lateral, limitar o retângulo ao mundo visível mantendo relação visual com o navio.

Apresentação somente lê saúde. Morte remove e destrói Graphics próprios; destroy do recurso libera todas as barras e mantém texturas compartilhadas. Inspeção somente leitura pode expor contagens/retângulos/saúde/rotação para comparar com screenshot; não acrescenta comandos para editar saúde ou posição. Alternativa de barra DOM por navio foi descartada pelo contrato Pixi e custo de sincronizar entidades por React.

### 7. Evidência proporcional ao input nativo

Testes puros cobrem fronteiras da dead zone, vetores inválidos, giro/avanço sem R, release R Off/On, composição por fontes e captura/cancelamento/R sem duplicação. Preservar colisões em ambas as ilhas/limites, ataques orientados pelo casco e regras existentes.

No E2E Chromium usar contatos reais pelo protocolo de input do navegador (CDP `Input.dispatchTouchEvent` ou equivalente), conservando IDs entre sequências touchStart/move/end/cancel; registrar que os pointer events recebidos são confiáveis e verificar captura nativa. `dispatchEvent` sintético isolado pode testar limpeza defensiva, mas não satisfaz navegação e disparo multitouch. Executar joypad+Q/W/E sobre trajetórias e projéteis reais; pontos/dano/morte vêm do engine e colisões, nunca de mutação de snapshot. Cenários opt-in existentes podem preparar posições iniciais reproduzíveis, sem bypass após início. Dano de barra do player e de cada arquétipo deve vir de interação real válida.

Medir retângulos de mundo/HUD/alvos com 320×568, 390×844, 844×390 e 568×320 touch e 1280×900 desktop. Registrar desktop com Ready e cooldown/R On, touch portrait/landscape e pausa com recarga congelada. Exercitar resize/orientação/DPR na mesma sessão e troca real mouse↔touch com neutralização. Safe area simulada por CSS/insets controlados comprova cálculo, sem alegar dispositivo com notch físico. Cinco ciclos Play→Pause→Menu/Re-play auditam canvases, RAF, listeners novos (inclusive up/cancel/lostcapture), observers, capturas e barras.

`playwright.config.ts` atualmente aponta evidências07: mudar destino de saídas08 antes de executar; preservar relatórios01–07. Executar lint, typecheck, unit, build, E2E dev/preview e validação strict, além de inspeção das imagens produzidas. Atualizar seletores/status e contagens de listeners somente para refletir arquitetura observada, mantendo cobertura antiga de regras/foco/ciclos; não remover regressões para fazer passar.

## Risks / Trade-offs

- [Captura perdida ou foco no botão cancela outros dedos] → propriedade por ID/fonte e contexto composto; cenários reais de drag-out, cancel e vários contatos, incluindo dois na mesma arma.
- [Click de compatibilidade duplica R ou muda modo] → R por confirmação única e modo baseado na origem de input, com regressões de up/cancel antes do próximo passo.
- [HUD diverge do viewport ou safe area soma duas vezes] → contrato único de faixas medidas, retângulos verificados e atualização mesmo sem resize externo.
- [Landscape baixo reduz a arena] → escala uniforme mantém mundo inteiro; alvos e vida permanecem legíveis; medir 568×320 e ajustar espaçamento sem crop ou scroll horizontal.
- [Barras minúsculas ou fora do mundo] → mínimos CSS e clamp; capturas em320 com dano real e navios girando, contagens após morte/teardown.
- [Testes sintéticos dão falsa segurança] → CDP nativo obrigatório para multitouch, mantendo teste puro para fronteiras determinísticas; limitações reais devem ser relatadas, não substituídas por sucesso fictício.

## Migration Plan

Implementar por tarefas incrementais, preservando aplicação executável e fluxos anteriores. Não há migração de dados persistidos ou API. Somente a configuração capturada continua controlando regras. Rollback local reverte esta implementação e seus deltas antes do archive, sem apagar registros/resultados nem evidências anteriores. Após implementação e verificação independentes, sincronizar as quatro specs e arquivar pelo workflow autorizado; esta fase termina apenas com planejamento, sem apply ou edição de estado da automação.
