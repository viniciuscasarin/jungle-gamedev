# Design

## Context

Ver `proposal.md` para motivação. A aplicação atual usa `pixiPreview.ts` com Graphics, render manual e ticker parado; `previewOwner.ts` já protege montagem tardia e descarte idempotente. `GameConfig` contém envelopes explicitamente provisórios. React Strict Mode está habilitado. Vitest funciona sem DOM; Playwright ainda não é dependência do projeto. As três specs principais são application-shell, game-configuration e simulation-contracts; a última não muda.

O explore inspecionou preview, sample de combate, seis samples de telas, atlas e PNGs individuais. Este design reaproveita as observações registradas em `project/automation-reports/02-integrate-assets-and-arena-renderer/explore.md`, distinguindo o mapeamento observado das dimensões de composição propostas abaixo.

## Goals / Non-Goals

**Goals:** preparar dados de mapa puros, transformações reutilizáveis e um fluxo visual recuperável sem acoplar simulação à interface; validar assets e ciclos reais no navegador.

**Non-Goals:** criar arquitetura geral de engine, carregar todas as famílias de áudio/efeitos, representar mecanicamente futuros estados de partida, montar HUD funcional ou introduzir rede/storage. A arena continua estática e sem input de gameplay.

## Decisions

### 1. PNGs individuais e manifesto semântico

Usar imports/URLs Vite de PNGs default, com manifesto tipado em `src/render`, dimensões físicas/lógicas e orientação. Isso evita converter XML/JSON de atlas para exibir poucos assets. Atlas continua fonte de verificação; conversão não é necessária neste incremento. Não adicionar paths ou objetos Pixi a `GameConfig`.

| Papel | Arquivo fornecido | Evidência e uso |
| --- | --- | --- |
| Player | `assets/png/default/ships/ship_5.png` | Azul claro, emblema branco, 66×113; sprite estático central |
| Chaser | `assets/png/default/ships/ship_3.png` | Vermelho, emblema cruzado, 66×113; mapeamento sem spawn |
| Shooter | `assets/png/default/ships/ship_8.png` | Vela escura/caveira, casco mais largo, 66×113; mapeamento sem spawn |
| Água | `assets/png/default/tiles/tile_73.png` | Tile turquesa texturizado, repetido sem esticar o mundo |
| Ilha | `assets/png/default/tiles/tile_{6..9,22..25,38..41,54..57}.png` | Bloco 4×4 verificado com areia, grama e cantos |
| Decoração | `assets/png/default/tiles/tile_49.png`, `tile_70.png`, `tile_72.png` | Rocha, folhagem e palmeira; somente sobre terra |
| Painel | `assets/png/default/ui/menu/panel_menu.png` | Madeira/azul/dourado; estrutura do menu HTML |
| Título/botões | entradas nomeadas de `assets/spritesheet/ui_sheet.json` e PNGs individuais correspondentes | Usar os paths realmente presentes; HTML mantém labels e foco |
| Referência de ataque | `assets/png/default/ui/controls/icon_fire_front.png` | Projétil com rastro; registrar, sem botão de ataque ativo |

Os navios apontam originalmente para baixo. Ângulo do sprite: `headingRadians - π/2`, com âncora central; heading inicial −π/2 resulta em cima. Proposta de escala uniforme do player: 0,5, produzindo 33×56,5 unidades. Essa escala é visual, não altera o raio de casco já configurado. IDs consecutivos não definem dano/animação.

Metadados observados: ships atlas 1024×512; tile default64²/retina128² e tilesheets1024×384/2048×768; UI1024²/2048² com meta.scale1/2. Ship_5 default/retina têm hash idêntico: não pressupor resolução dobrada. No UI, `ui.layout`, bordas e content rect são lógicos1× mesmo na versão retina: panel_menu content=(26,30,332,420), bordas32/40/32/40. Usar esses dados para evitar esticar bordas sobre labels; não deduzir áreas de texto somente de alpha bounds. A UI pode usar CSS e imagens individuais, mantendo controles DOM reais.

### 2. Fluxo React restrito e tentativa identificada

Estados locais discriminados: menu, loading, failed e arena. `Play` inicia tentativa com geração única; Loading inclui status e Main Menu. Após carregar assets e inicializar renderer, o estado pronto informa `Static arena preview · No match is running`. Falha de asset ou gráfica mostra mensagem acessível, Retry e Main Menu. O foco acompanha o novo título/status e volta a Play no menu; botões mantêm navegação por teclado.

Loading permanece perceptível por mínimo de 300ms antes do sucesso/erro; o timer pertence à tentativa e é cancelado na saída. O URL `?assetScenario=fail-once` arma uma falha apenas na primeira tentativa de Play daquela sessão da página, antes de consultar o cache. Retry segue o loader normal; novo Play na mesma página não rearma. Refresh com o parâmetro rearma; remover o parâmetro desliga. Isso torna falha/retry demonstráveis com cache quente, sem criar painel de cenários futuro ou degradar URLs normais.

Cada callback confere a geração vigente e o descarte. Main Menu durante Loading invalida a tentativa e libera sua participação. Não cancelar uma promise global ainda necessária por outro consumidor. Distinguir a falha simulada de uma falha real em documentação, mantendo ambos recuperáveis.

### 3. Cache com lease e dono de textura

O cache de sessão mantém uma promise de carregamento e conjunto de texturas por manifesto; aquisições concorrentes compartilham ambas. A aquisição cria participação antes do await; toda saída/falha a libera exatamente uma vez. Rejeição limpa a entrada pendente, permitindo nova tentativa; falhas parciais liberam somente recursos sem outros usuários, conforme política explícita.

O renderer recebe texturas emprestadas e possui app/stage/sprites/canvas/observadores. Destruir display objects não destrói textura/source compartilhados. O cache mantém texturas prontas entre visitas ao menu para reuso; zero participantes não exige descarregamento imediato. Um método de descarte final, exercitado em testes e no encerramento do dono do cache, bloqueia novas aquisições e espera resolver/limpar trabalho pendente antes de unload, somente sem leases ativos. Não chamar unload em cada cleanup do efeito Strict Mode.

Manter o dono do cache no escopo de sessão do adaptador, com fechamento explícito para testes/HMR. Preservar `previewOwner` ou renomeá-lo para arena sem perder suas garantias: recurso inicialmente destacado, checagem antes de anexar, cleanup idempotente e caminhos de init parcial com/sem renderer. Uma textura carregada tardiamente continua contabilizada mesmo se o consumidor saiu.

Alternativa de cache por montagem causaria downloads/decodificações duplicados e quebraria o benefício no Strict Mode; destruir texturas no renderer quebraria outro consumidor.

### 4. Composição e geometria de litoral

Refinar os envelopes dentro das regiões do GDD para ilhas com origem NW=(135,95) e SE=(665,325), cada uma de160×120 unidades. Usar tiles40×40: linha superior6/7/8/9, linha central22/23/24/25 e inferior54/55/56/57. A família38..41 permanece documentada como linha interior alternativa; o mapa usa uma linha interior para caber na altura proposta. Confirmar continuidade da composição no browser antes de concluir; nenhum sample achatado entra no renderer. Water tiles também usam escala uniforme.

`world.islands` substitui `proposedIslandEnvelopes`: id, origem, dimensões e contorno convexo local, ou peças convexas locais quando a borda exigir, em números e arrays readonly. Coordenadas locais são transladadas pela origem da ilha; documentar ordem dos vértices, origem y para baixo e peças sem autointerseção. Configuração fornece posição/dimensões/geometria; renderer fornece IDs de tiles e decoração. Dimensões de célula são derivadas da dimensão da ilha, evitando uma segunda definição de tamanho do mapa.

Medir a linha de areia sólida dos PNGs escolhidos durante a montagem: não usar alpha pois o tile contém água opaca. Aproximar cantos arredondados por segmentos convexos e manter erro máximo de4 unidades lógicas em relação à fronteira visível areia/água. Registrar vértices efetivos e pontos de comparação em ARCHITECTURE, incluindo overlay temporário/screenshot de geometria no relatório. Ajustar vértices para essa tolerância é tarefa de implementação do design; não trocar pelo retângulo do envelope. Água decorativa, sombra/wake e vegetação não ampliam o contorno.

Atualizar `mapVersion` para `arena-v2`; preservar `balance-v1` e demais valores. Atualizar testes de configuração que hoje fazem igualdade do envelope e cobrir vértices no snapshot. Não implementar detector ou resolvedor de colisões agora; a próxima simulação consumirá estes dados.

### 5. Transformações puras e layout com faixas

Criar módulo puro de viewport no adaptador render, sem importar Pixi/DOM: entrada com largura/altura CSS do host, insets reservados e dimensão do mundo. Área útil: `W=hostWidth-left-right`, `H=hostHeight-top-bottom`; `s=min(W/960,H/540)`; `ox=left+(W-960*s)/2`, `oy=top+(H-540*s)/2`. `worldToScreen=(ox+x*s,oy+y*s)`; inversa subtrai offset e divide por s. Tela significa CSS pixels locais ao host; futura conversão de client coordinates descontará o bounding rect fora da função pura. Letterbox não implica clamp automático da inversa.

Host/área útil não positivos produzem resultado não renderizável; aguardar resize em vez de dividir por zero. DPR modifica buffer (`CSS×DPR` e autoDensity), não s/offsets/coordenadas. ResizeObserver e window resize atualizam layout; listener rearmável de media query de resolução detecta mudança isolada de DPR. Cleanup remove todos.

Reservar no mínimo48 CSS pixels superiores e88 inferiores, acrescidos de safe areas, para status/retorno e futuros controles; em portrait o espaço adicional pode virar letterbox. Só mostrar status e Main Menu nestas faixas agora, sem placeholders que pareçam controles funcionais. Layout mede espaço disponível e não força arena de tamanho fixo; mundo completo permanece visível em320×568,390×844 e844×390.

Render manual no init/resize: app ticker privado parado, sem RAF de gameplay. Manter event target Pixi desconectado e política já usada para scheduler da cena estática. Não iniciar ticker apenas para manter resize ou loading. Diferenças de tamanho do host não reconstruirão a cena ou texturas.

### 6. Validação proporcional e documentação

Vitest: transformações de cantos/centro, roundtrip≤1e−8, letterbox/insets, host zero e invariância CSS em DPR; cache concorrente/rejeição/Retry/leases/descarte tardio; owner com init parcial, saída durante loading, callbacks antigos e Strict Mode; configuração com geometria finita, convexidade/peças, bounds, centro livre e imutabilidade dos vértices. Preservar checks de pureza do core.

Adicionar somente infraestrutura Playwright necessária ao fluxo atual e poucos E2E Chromium: menu→loading→arena→menu; fail-once→Retry com cache frio/quente; saída durante tentativa atrasada; cinco ciclos reais sob Strict Mode com no máximo um canvas e contagem de recursos/tickers/listeners que retorna ao baseline. Usar observação/instrumentação limitada de adaptador para recursos, sem API de gameplay inventada. Stubs unitários sozinhos não provam cleanup no browser.

Inspecionar build servido por preview e dev, console sem erros inesperados, screenshots em desktop,320px,portrait,landscape e DPR2; conferir proporção, heading e litoral com overlay. Guardar evidências locais do incremento e traces em falha, sem antecipar baseline de combate/resultados ou suíte ampla. Executar lint, typecheck, Vitest, build e E2E deste incremento. README registra reprodução normal/fail-once, comandos e limitações; ARCHITECTURE registra cache, ownership, transform e geometria; ASSET_CREDITS registra somente origem repo/challenge e autoria/licença não documentadas, sem atribuição por aparência.

## Risks / Trade-offs

- [Borda visual irregular] → medir areia, usar peças convexas se necessário e validar overlay com tolerância4; não tornar o envelope collider.
- [Textura compartilhada destruída] → cache possui textura e renderer possui instâncias; testar consumidor sobrevivente e unload final.
- [Corrida Strict Mode/Retry/menu] → lease idempotente e geração por tentativa, com caminho de init parcial/tardio.
- [Retina apenas nominal ou orientação invertida] → usar dimensões observadas e matriz de heading verificada; DPR é independente da variante.
- [Falha fica invisível por cache rápido] → cenário fail-once anterior ao cache e Loading perceptível.
- [Licença ausente] → registrar pendência real em inglês; este incremento não resolve permissão de publicação.
- [Faixas reduzem arena em landscape] → escala uniforme/letterbox preservam o mundo; controles funcionais e legibilidade de combate serão avaliados quando existirem.

## Migration Plan

Sem dados persistidos nesta fase. Evoluir config/testes para arena-v2, introduzir manifesto/cache e renderer, então conectar o fluxo React e validar a aplicação. Atualizar docs no mesmo incremento. Rollback local reverte em conjunto renderer, config e texto de UI; não deixar geometria da versão nova combinada com desenho antigo. Não há deploy ou migração externa.
