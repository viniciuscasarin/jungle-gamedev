# Explore — implement-enemies-and-spawning

Concluído27/10/2026 por `/root/i05_explore`, somente leitura, sem arquivos/change/
código/estado/delegação. CLI list raiz válida/changes vazias; list-specs8;
validate specs strict exit0,8/8. Archive04 confirma dependência. Sem AGENTS.md
nos caminhos consultados. Sem testes de produto/browser nesta exploração.

## Base e integração

Config já centraliza valores Chaser/Shooter/spawn e seeduint32 separada. Engine
resolve balas antes contato, dano/morte/score atômicos, Chaser25/autodestruição0score,
Shooter sem dano de casco; inimigos ainda estacionários e seed sem RNG. Collision
hullIsValid/sweepSolid/sweepCircle aceitam raio, mas moveHull usa raio player e deve
generalizar preservando comportamento. Render já reconcilia inimigos/balas/cache;
assets existem, trabalho visual novo é telegraph/diagnóstico sem HUDfinal.

## Decisões propostas

- Pequenos módulos puros IA/navegação/diretor/RNG, estado/deadlines privados e
  snapshots somente apresentação/inspeção. Sem Math.random/timers/DOM/renderregras.
- Waypoints determinísticos validados por raio; hipótese grid~20u, nós e segmentos
  seguros por sweepSolid, cache mapa/raio, endpoints realmente conectados/desempates
  estáveis/smoothing só segmento seguro. Mesmo serviço prova rota de spawn.
- Giro/velocidade configurados; Chaser persegue player atual; Shooter atrás de ilha
  avança por waypoints atéLOS, não estaciona tentando tiro bloqueado.
- Histerese210/270: começa aproximar>270 até240; afastar<210 até240; hold restante.
  Afastamento por giro+frente permitido, não exigir reverse. Tiro só heading real,
  distância<=300/LOS/erro<=10°. Deadline começa entrada alcance, sair reinicia espera
  cheia; LOS/erro bloqueiam emissão sem zerar recarga se ainda emalcance. Pronto
  aguarda elegibilidade e dispara, sem preditiva. Registrar política explicitamente.
- Generalizar emissão só para raio/emissor/facção inimigos; LOS considera bala
  circular/sólido e segmento casco→muzzle, colisão final autoritativa.
- Separação complementa colisão cascos. Não corrigir vetor+clamp empurrando emterra;
  movimentos/correções seguros contra cenário/cascos, ordem determinística/centros
  coincidentes. Player pode bloquear emShooter emvez de empurrar. Chaser contato
  letal deve ser resolvido antes de separação apagar o contato.
- Diretor agenda absoluta tempo ativo:interval,2interval…; reserva materializa600ms
  depois; alternância só sucesso materializado, cancelamento sem reposição/backlog
  e mantém arquétipo pendente. RNG avança explicitamente/reproduzivelmente inclusive
  candidatos rejeitados. Busca finita com skip não é cap de inimigos.
- Candidatos perímetro com casco inteiro:>=240player, cenário/cascos/reservas e rota
  válida; revalidar tudo na materialização. Freeze paralisa passos/deadlines/telegraph;
  player morto interrompe diretor/ações e respeitar completed quando disponível,
  sem full lifecycle nesta etapa.

## Reconciliações e escopo

GDD descreve ambos em6s, mas agenda3/6s+telegraph0.6 implica3.6/6.6s. Priorizar
algoritmo explícito prompt05:duas oportunidades até6s/aparições até6.6 se seguras;
registrar discrepância sem reduzir telegraph. Atualizar limites temporários semIA/
spawn em runtime/render/combat. Diagnóstico combatScenario=targets continua
estacionário explicitamente selecionado, com IA/diretor desativados só nessemodo;
não inferir que qualquer InitialCombatData desativa sistemas.

Novas capacidades enemy-behavior/spawn-director; deltas contracts/runtime/render/
combat/config se parâmetros técnicos reais novos. Código engine/contracts/collision/
combat, novos módulos puros, render; README/ARCHITECTURE inglês. Sem asset-loading
novo, Options/API/resultados/mobile/full lifecycle.

## Validação planejável

Perseguição/contorno duas ilhas/giro/velocidade; Shooter210/240/270/300/10°/LOS/
reentrada/cooldown cheio; separação costa/bordas/player parado e andando; projétil
mata antescontato/0score suicídio/morto sem ação. Diretor3/3.6/6/6.6s/seeds iguais e
distintas/cancelamento player-casco/falta candidato/alternância só sucesso/sem backlog
oucap/freeze reserva. E2E clock controlado+controles reais/diagnóstico readonly,
ambos arquétipos/LOS/killscore por colisões/telegraph/freeze/teardown. Preservar
regressões navegação/combate e atualizar expectativas default vazio só primeiros
segundos. Evidências05 preservando01-04. Lint/typecheck/core/build/test/browser
proporcionais e inspeção visual. Nenhum bloqueio para propose.
