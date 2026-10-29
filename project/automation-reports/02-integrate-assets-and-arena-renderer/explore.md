# Explore — integrate-assets-and-arena-renderer

Concluído em 27/10/2026 por `/root/i02_explore`, somente leitura, sem change/código.
Raiz CLI válida, nenhuma change ativa e três specs principais do incremento 01.
Nenhum AGENTS.md encontrado no workspace/ancestrais consultados. Lidos skill de
explore, automação, contexto comum e bloco 02, GDD/config/specs/código pertinente.

## Estado e dependência

Fundação arquivada em `openspec/changes/archive/2026-10-27-setup-game-foundation`.
`pixiPreview.ts` é Graphics estático com ticker parado/eventos desconectados;
`previewOwner.ts` já protege init tardio, descarte e StrictMode. App ainda não tem
menu/loading. A spec application-shell precisa evoluir o texto da fundação.
GameConfig contém envelopes de ilhas explicitamente não finais. Stack permanece
fixada; nenhum Playwright de projeto instalado.

## Mapeamento visual verificado

Foram abertos via view_image: preview, sample de combate, seis samples de telas,
tilesheet, UI atlas e candidatos individuais. Paths relativos ao workspace:

| Papel | Path | Observação |
| --- | --- | --- |
| Player | assets/png/default/ships/ship_5.png | vela azul clara, emblema branco, casco estreito |
| Chaser | assets/png/default/ships/ship_3.png | vela vermelha, emblema branco cruzado |
| Shooter | assets/png/default/ships/ship_8.png | vela escura/caveira, casco mais largo |
| Água | assets/png/default/tiles/tile_73.png | água turquesa texturizada |
| Ilha | tiles 6–9,22–25,38–41,54–57 | bloco 4×4, cantos arredondados, areia/grama |
| Decoração | tile_49,70,72.png | rocha, folhagem, palmeira |
| Menu | assets/png/default/ui/menu/panel_menu.png | painel azul/dourado/madeira |
| Front | assets/png/default/ui/controls/icon_fire_front.png | projétil com rastro |

Ship_2 foi inspecionado como alternativa escura de casco estreito; preferir ship_8.
Navios 3/5/8 medem 66×113 e apontam originalmente para baixo. Com heading zero à
direita, `rotation = headingRadians - π/2`; heading inicial -π/2 aponta para cima.
Nenhuma sequência de dano/animação foi inferida de IDs consecutivos.

XML ships_miscellaneous_sheet: ship3=(204,115,66,113), ship5=(68,77,66,113),
ship8=(0,307,66,113). Ambos os atlas ships são 1024×512; ship5 default/retina têm
hash idêntico. Tiles default 64²/retina128²; tilesheets1024×384/2048×768 sem margem.
UI atlas1024²/2048², meta.scale1/2, ui.layout em unidades lógicas1×. Não dividir
campos ui customizados por2 indiscriminadamente. JSON tem36 nomes/paths individuais.
Panel_menu conteúdo=(26,30,332,420), bordas32/40/32/40; botão label=(32.5,19.5,191,46.5);
health fill=(30,15,196,20). Preferir metadados de layout documentados a alpha_bounds.

## Decisões propostas

- Capacidades asset-loading/arena-rendering; modificar application-shell e ampliar
  game-configuration para geometria de gameplay real. Domínio sem asset paths/Pixi.
- Menu→Loading→Static Arena com Play/Retry/Main Menu e status semântico; texto
  honesto sobre preview estático. Sem Options/ranking/combate/controles ativos.
- Manifesto tipado com PNGs individuais e URLs Vite; cache/promise compartilhada,
  rejeição recuperável, ownership explícito. Cenário fail-once antes do cache e
  geração por tentativa evita callbacks obsoletos e permite Retry após cache quente.
- Renderer possui app/stage/sprites/canvas/listeners; cache possui texturas. Não
  destruir texturas compartilhadas no unmount. Unload final com nenhuma referência
  ativa; manter caminhos de init parcial/tardio. Preview pode continuar sem ticker.
- Proposta visual: ilhas 4×3 tiles de40 unidades, linhas superior/central/inferior
  do bloco, NW(135,95), SE(665,325), envelope160×120 cada; confirmar composição
  visual antes de fixar. Tiles quadrados/navios proporcionais. Collider segue areia
  sólida/cantos arredondados, não o retângulo-envelope nem água decorativa.
- Uma fonte de dimensões/posições/geometria de gameplay na config; layout de tiles
  no render. Registrar polígonos/peças convexas e tolerância após montagem visual.
- Reservar faixas HUD superior/controles inferiores, portrait/landscape sem recorte.
  Transformação pura: min(availableWidth/960,availableHeight/540), offsets centrados,
  mundo↔tela. DPR muda buffer, não CSS/lógica. Tratar host zero e mudança DPR.
- ASSET_CREDITS inglês: fornecidos no repo/challenge; autor/licença não documentados.
  Nenhum arquivo de licença/créditos encontrado; aparência não comprova licença.

## Validação planejável e riscos

Testar transformações/roundtrip/cantos/letterbox/DPR/resize; cache concorrente,
rejeição/retry/menu durante loading, init parcial/tardio, descarte/compartilhamento;
geometria pura; browser real fluxos e ciclos StrictMode com recursos/canvas/tickers;
screenshots desktop/320px/portrait/landscape/DPR alto; lint/typecheck/test/build.
Somente suporte Playwright proporcional ao fluxo atual, sem antecipar suíte ampla.
Riscos: falsa retina de ships, orientação invertida, textura compartilhada destruída,
cache de rejeição permanente e collider de envelope. Sem bloqueio para propose.
Nenhum teste de produto ou mudança de arquivo nesta fase.
