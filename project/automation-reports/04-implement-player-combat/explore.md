# Explore — implement-player-combat

Concluído27/10/2026 por `/root/i04_explore`, somente leitura. Nenhum arquivo/change
ou estado alterado. CLI list/list-specs exit0: raiz válida, nenhuma change ativa,
7 specs existentes. Sem AGENTS.md encontrado. Lidos skill/automação/contexto comum
e bloco04 por regex, GDD4/6/13, config/specs/código/testes pertinentes. Sem suite/build.

## Base reutilizável

Config centraliza350/1200ms, velocidades420/360, lifetimes1200/1000ms, dano20,
espaçamento14, score1 e demais valoresGDD6. StepInput.fire já tem3 flags simultâneos;
snapshot projéteis/score/cooldowns e eventos dano/destruição/score existem. Engine
ainda ignora fire, eventos vazios/cooldowns sem avanço. Sweep casco/shoreline convexa
em collision.ts pode fornecer geometria, mas projétil não deve deslizar. Input/R/loop/
freeze/cache/owner existentes devem ser preservados, sem novoRAF/relógio global.

## Decisões propostas

- Direções no heading atualizado: frente(cosθ,sinθ), bombordo(sinθ,−cosθ),
  estibordo(−sinθ,cosθ). Broadsides origens longitudinais−14/0/+14, velocidades
  paralelas. Mouse/R/Q/W/E coexistem. Cooldowns inicialmente0/independentes/tempo
  ativo, held dispara quando pronto; definir fronteira temporal sem atraso por
  arredondamento. Stall descartado/freeze não recarregam.
- Origens além do casco considerando raio da bala; verificar segmento emissão→muzzle
  e ocupação final para impedir nascer além de costa adjacente. Bloqueio consome bala
  e cooldown. Raio/clearance se introduzidos são hipóteses técnicas centralizadas,
  sem alterar númerosGDD. Sweep limitado por min(dt,lifetime restante), menorTOI
  global entre shoreline/limites/casco válido; desempate determinístico favorece
  sólido. Expiração não desloca além lifetime. Aliado não recebe dano nem consome.
- Registros internos puros owner/faction/damage/direction/lifetime independentes da
  sobrevivência do atirador; semântica sourceId estável documentada. Sem friendlyfire,
  piercing ou colisão bala×bala. Dano único/consumo primeirohit, morte positiva→0
  imediata, uma destruição/um ponto por inimigo morto pelo player; cadáver não age
  nem pontua novamente. Projéteis existentes resolvidos antes de contato/ações;
  novos tiros podem mover no passo seguinte com muzzle verificado imediatamente.
- Contato mínimo do Chaser pode ser incluído apenas para provar projectile-before-
  contact real:25dano uma vez/autodestruição/0ponto, sem IA/perseguição/spawn. Não
  antecipar incremento05. Sem hooks genéricos/schedulers especulativos.
- Fixture opt-in `?combatScenario=targets` traduzida para dados iniciais puros;
  default sem alvos. Arquétipos/saúde/colisores reais, mesmo domínio, sem setters
  window/teleporte/grantScore. ZeroHP desativa entidade, sem entregar gameover/
  countdown/resultados. Score/cooldown React throttled/discreto, sem render porframe.

## Assets e specs

`assets/png/default/ship_parts/cannon_ball.png` aberto via view_image: esfera cinza
transparente,10×10 confirmado por PNG/XMLdefault+retina. Incorporar manifest/cache
com papel explícito e créditos; sem inferência de IDs. Chaser/Shooter já catalogados.

Nova capability player-combat. MODIFIED simulation-runtime e arena-rendering que
ainda proíbem combate; application-shell instruções/status Q/W/E/score/cooldown.
Contratos/config somente se campos técnicos novos exigirem; asset-loading se catálogo
explicitamente ampliar. Código engine/contracts/combat/input/render/manifest/React;
README/ARCHITECTURE/ASSET_CREDITS inglês. Sem IA/spawn/mobile/API/áudio/efeitos completos.

## Validação a planejar

Node puro: direções cardinais/oblíquas/giro, três origens/espaçamento/paralelismo;
held/prontas/cadência independente/freeze/stall/lifetime parcial; sweep rápido ilha
inteira/costa/cantos/limites/muzzle adjacente/alvo protegido/menorTOI/facções/bala×bala;
dano único/multihits letais uma destruição+ponto/morto não age/contato isolado0score.
Snapshots/eventos históricos imutáveis e navegação com armas simultâneas.
Browser controles reais mouse/Q/W/E/R matam alvos por colisão sem injeção de sucesso;
blur/Resume limpa held e congela cooldown; desktop320/landscape; default sem fixtures;
teardown/cache com sprites dinâmicos e manifest ampliado sem enfraquecer checks.
Lint/typecheck/core semDOM/test/build/E2E pertinente/strict validate. Sem bloqueio.
