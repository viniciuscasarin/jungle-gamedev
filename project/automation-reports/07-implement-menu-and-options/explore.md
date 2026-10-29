# Explore — implement-menu-and-options

Concluído em 28/10/2026 por `/root/i07_explore`, somente leitura. Sem arquivo,
change, código ou estado alterado. CLI confirmou raiz local, zero changes e 11
specs válidas em strict. Nenhum AGENTS.md encontrado nos caminhos consultados.
Lidos skill, automação, contexto comum/bloco07 por regex antes08, GDD, configuração,
specs, código/testes/docs e evidências06. Os 190 testes/34 E2E anteriores foram
consultados, não repetidos. Preservar todos os arquivos untracked anteriores.

## Base existente

OPTION_METADATA/config já centralizam defaults120s/3s, sessão60–180 passo1 e
spawn1–10 passo0.5, internamente em ms. createGameConfig rejeita não finitos,
limites e passo. validateOptions aceita exatamente dois campos numéricos e
reutiliza essa validação. Storage em pirate-battle.options.v1 tem envelopes
versionados/leitura defensiva/aviso; saveOptions valida antes do writer e pode
lançar por dado inválido. Formulário precisa validar antes da chamada.

preparePlay captura configuração imutável e seed; App.start relê opções em cada
Play/PlayAgain e Retry mantém preparação. App já tem Play/guia/LastResult e todo
lifecycle, mas ainda não Options. Preservar esses contratos.

## Decisões propostas

- Tela React Options com rascunho isolado, strings editáveis e inputs rotulados,
  ajuda/unidades/limites em segundos. Abrir relê valores, corrupção usa defaults
  com explicação visível, sem reescrever storage antes de Save.
- Rejeitar vazio/whitespace, NaN/infinito, limites e granularidade; conversão ms
  sem parseInt/arredondamento/clamp. Reutilizar regra de domínio; mensagens em
  segundos. aria-invalid/describedby; Save disabled quando inválido e guard no submit.
- Cancel não escreve, reabrir restaura último Save; Enter/Escape com semântica
  clara e sem teclas de combate. Save válido usa adapter. Se escrita falhar,
  continuar Options com rascunho/erro acessível e valor anterior, sem sucesso falso.
  Sucesso/Cancel retornam menu e foco Options; entrada foca título/primeiro campo.
- Separar aviso atual das opções de boot.notice: Save válido resolve somente
  corrupção de opções, sem ressuscitar aviso antigo ou apagar identidade/resultado.
- Play/Options disponíveis; Ranking/MatchHistory podem ser reservados como ações
  indisponíveis explicitamente explicadas, sem fixtures/consulta/loading fictícios
  ou ARIA tabs incompletas. Sem Axios/TanStack/MSW nesta etapa.
- Não editar durante Playing. Testar alteração externa de storage após captura
  sem mudar run; replay usa último Save real pela UI depois de retornar ao menu.

## Assets e layout verificados

view_image abriu samples menu/options, backdrop, atlas completo, primary disabled
e secondary pressed. Samples1800×1000; backdrop918×515; botões256×88. Sample Options
só mostra MainMenu: GDD/prompt explícitos prevalecem para implementar Save/Cancel.
Backdrop só decorativo, não mapa. Painel384×480, anchor0.5/0.5, bordas32/40/32/40,
content(26,30,332,420). Botão outer(8,4,240,80), label(32.5,19.5,191,46.5).
Primary normal/hover/pressed/disabled existem; secondary só normal/pressed, sem
inventar secondary hover ou deixar estado primary vazar. Campos ui ficam em cada
frame; meta.ui descreve convenção. Retina dobra físico, ui.layout/bordas seguem1×.

UI_LAYOUT já contém parte dos metadados; CSS atual estica imagens e usa paddings
fixos. Planejar tamanho/retângulos/bordas, painel flexível nine-slice/border-image,
mensagens e 320px sem distorção. HTML real com foco/contraste/touch/scroll vertical
em landscape. Atualizar créditos só uso real, sem inventar autoria/licença.
Manifest alimenta ASSET_URLS/cache Pixi: separar assets exclusivos DOM para não
fazer imagens de menu novas bloquearem arena sem necessidade.

## Deltas, arquivos e validação

MODIFIED application-shell preservando seus sete cenários; nova menu-options;
asset-loading se catálogo/metadados novos exigirem. Config/lifecycle já cobrem
limites/snapshot/storage/replay: evitar duplicar requisitos sem mudança real.
App/componentes locais/styles/manifest, testes/parser/storage/E2E, docs/créditos e
config Playwright. Sem dados remotos, mobile de combate ou áudio.

Testar limites/fracionários/passo/vazio/não finitos, validação antes da escrita,
storage corrupto/negado, Cancel e erro Save preservando anteriores. E2E dev/preview
teclado/touch, erros/disabled, Save-refresh/Cancel-reabrir/corrupção-defaults/erro
honesto. Save→Play→snapshot, alteração externa sem mutação, fim real por relógio,
novo Save e LastResult histórico intacto→PlayAgain atual. Inspeção menu com/sem
resultado e Options válido/inválido/avisos/estados/foco em desktop320landscape,
sem overflow horizontal. Evidências07 preservam01-06. Lint/typecheck/build/testes
afetados e lifecycle pertinente. Nenhum bloqueio ou decisão de produto pendente.
