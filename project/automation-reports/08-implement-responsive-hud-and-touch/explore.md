# Explore — implement-responsive-hud-and-touch

Concluído em 28/10/2026 por `/root/i08_explore`, somente leitura. Sem arquivos,
change ou suíte de produto. CLI list raiz válida/zero changes, list-specs12 e
strict specs exit0/12 válidas. Dependência07 arquivada e gates confirmados. Sem
AGENTS.md encontrado. Lidos skill/runbook, contexto comum e apenas bloco08 por
regex antes09, GDD/config/specs/código/testes pertinentes. Preservar checkout.

## Lacunas e base

Contrato já tem steering direction e movementRequested, config deadzone0.15, mas
engine ignora ambos e só move com auto-sail. Barras Pixi sobre navios ainda não
existem: implementar em08 apesar de prompt dizer preservar. Snapshot já tem saúde.
HUD provisório textual sem skills/ícones/joypad. Viewport aceita insets, porém render
fixa48/88, insuficientes. Input conhece teclado/mouse; host.blur limpa tudo e pode
cancelar outros dedos ao focar skill. Status React já limitado por mudanças, mas
cooldown só string. Owner/loop/cache/resize/DPR/pausa reutilizáveis sem outro loop.

## Decisões propostas

- Joypad vira vetor normalizado e solicitação de movimento; engine pura mantém
  giro finito/avanço frontal com movementRequested || autoSail, sem strafe/teleporte.
  Deadzone inclusiva15% do raio CSS útil; fora seleciona rumo e avanço em velocidade
  fixa. Release remove só pedido manual e conserva último vetor para R On continuar
  girando ao rumo; pausa/mudança de modo/descarte limpam vetor.
- Buffer unificado com fontes separadas: teclado, joypad e conjuntos de IDs por
  arma. Soltar um não apaga outro dedo/tecla na mesma arma. Captura no controle
  original; up/cancel/lostcapture idempotentes e dedo estranho não encerra joypad.
  Arrastar fora conserva ataque até soltar/cancelar.
- R touch confirma uma alternância só em liberação válida; cancel descarta pressão
  pendente, inclusive antes de passo; sem click compatível duplicado. R teclado
  mantém keydown. Modo inicial por pointer coarse, troca por input real, não apenas
  hasTouch/maxTouchPoints (E2E desktop também tem touch). Separar modo de largura:
  resize sozinho não troca modo/limpa alvo/auto-sail. Troca efetiva limpa fontes/
  capturas/bordas e neutraliza auto-sail explicitamente sem simular teclaR, mantendo
  posição/tempo/matchId/config. Contexto composto de batalha evita blur entre skills.
- Faixas DOM reservadas e medidas alimentam viewport; safe areas uma vez. Desktop
  topo score/time/Pause, base QWER/vida. Touch vida topo/joypad esquerda/skills direita
  2×2 se preciso. Mudança de modo/layout reapresenta insets mesmo sem host resize.
- Skills nome/ícone/letra/ready/segundos/preenchimento numérico da config capturada;
  R somente On/Off. Atualização limitada existente basta, sem relógio visual à parte.
  Pausa congela valores exatamente. Alvos≥48CSSpx, 320portrait/landscape sem recorte.
- Barras Pixi irmãs dos sprites, horizontais sem herdar giro, seguem posição/saúde,
  removidas na morte e liberam Graphics próprios. Legíveis na escala320 e contidas
  nos limites; não ampliar texturas obrigatórias só por decoração.

## Assets verificados

view_image abriu ícones front/left/right/forward/pause, round normal/hover/pressed,
health_frame/fill_green. Ícones48²; round64², outer4/4/56/56, centro32/32/ícone32²,
anchor0.5. Health256×48, anchor0/0, fill_rect30/15/196/20, clipping pela esquerda,
draw_order frame→fill. Não preencher largura256 nem dividir layout lógico por2 na
retina. Novos assets DOM podem usar DOM_ASSET_IDS/fallback sem afetar loadingPixi.
Amber/red/outros só tiveram metadados localizados: abrir visualmente antes de usar.
README/créditos frontReference desatualizados devem refletir uso. Licença desconhecida.

## Specs, arquivos e verificações

Novas responsive-hud e touch-input; player-navigation MODIFIED para comandos lógicos
e contexto preservando desktop; arena-rendering para faixas e barras; shell/assets
somente quando requisito realmente mudar. Código input/buffer/touch/engine, render/
loop/owner/viewport/manifest/observer, App/HUD/styles e docs/testes. Sem áudio/efeitos/
REST ou mudança de regras existentes. Evidências08 preservam01–07. Auditor nativo
de listeners deve incluir eventos de release/cancel/capture novos.

Testes puros: deadzone/fronteiras/vetores inválidos/giro/movimento semR/releaseRoffOn/
colisões/ataques; buffer múltiplosIDs/fontes/captura/dedo alheio/Rcancel/limpeza pausa,
hidden,modo,teardown. Browser touches reais via CDP ou equivalente para joypad+QWE,
trajetória/balas/colisões reais; eventos sintéticos isolados não provam multitouch
ou captura nativa. Resize/orientação/DPR no mesmo match semreset, troca real neutraliza;
medir retângulos mundo/HUD, alvos e overflow. Capturas desktop1280×900 e touch320×568,
390×844,844×390/landscape320altura; ready/cooldown/Ron/pausa/navios danificados por
combate real, barras horizontais e removidas na morte. Safeareas CSS/insets controlados
sem alegar notch físico. Foco/diálogos/cinco ciclos sem pointers/listeners/capturas/
gráficos residuais; lint/typecheck/test/build/strict/regressões afetadas. Sem bloqueio.
