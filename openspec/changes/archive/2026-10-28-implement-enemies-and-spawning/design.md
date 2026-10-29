# Design

## Context

Ver motivação em proposal.md. A base arquivada 01–04 já fornece configuração imutável com todos os valores de inimigos/spawn, seed uint32 separada, passos fixos, morte/score atômicos e render de entidades. `engine.ts` ainda deixa inimigos estacionários; `moveHull` usa raio do player, enquanto `hullIsValid`/`sweepSolid` já aceitam raio. `emitWeapon` ainda pressupõe arma e facção do player. O adaptador Pixi seleciona `combatScenario=targets` antes da criação; os testes desse modo dependem de alvos imóveis. Não há AGENTS.md nos caminhos consultados.

As deltas preservam integralmente cenários dos requisitos modificados e removem apenas limites temporários incompatíveis com 05. O futuro sync deve preservar Purpose das capabilities existentes; as duas novas possuem Purpose próprio.

## Goals / Non-Goals

**Goals:** manter regras puras em TypeScript, reprodução por input/seed, progresso navegável nas duas ilhas e tiro/spawn observáveis sem mutação de teste; preservar contratos readonly e propriedade atual do loop/cache.

**Non-Goals:** motor de física genérico, navegação do player por pathfinding, nova camada ECS, mudanças de balanceamento, cap/rampa, sistema completo de sessão ou novos serviços. A morte do player bloqueia novas ações de inimigos/diretor; não cria tela terminal ou resultado. `completed`, quando fornecido pelo ciclo de sessão futuro, também deve bloquear execução.

## Decisions

### Regras puras e estado privado

Adicionar módulos pequenos de navegação, comportamento, RNG e diretor; a engine orquestra fases. Estado de intenção do Shooter, deadlines, RNG e índice de alternância ficam privados à instância. Snapshot copia somente dados necessários para apresentação/inspeção, inclusive reservas. Não usar timers, DOM, React, Pixi, Date ou Math.random nas regras. Uma seleção explícita `normal`/`stationary-targets` na preparação controla IA/diretor; dados iniciais sozinhos nunca desativam sistemas. O URL adapter escolhe o modo, sem setter posterior. Evita quebrar testes de IA com InitialCombatData e mantém a demonstração anterior.

### Grafo por raio e colisão autoritativa

Construir grade de waypoints inicialmente a cada 20 unidades, filtrada pela mesma geometria com raio do arquétipo e pequena folga. Arestas ortogonais/diagonais precisam passar varredura circular completa; proibir corte de cantos. Cache somente por geometria/raio, nunca estado da partida. A* com ordem de nós/desempate estável; endpoints reais precisam de conexões visíveis seguras ao grafo, sem presumir que o nó mais próximo está conectado. Preferir segmento direto seguro e suavizar apenas segmentos novamente varridos. Replanejar ao mudar o destino relevante ou perder segmento seguro, com cadência técnica limitada inicialmente a 250ms; não refazer grafo por frame. Alvos que estejam além de um obstáculo usam a rota até a região alcançável do player. O mesmo serviço prova conectividade de candidatos do diretor.

Generalizar movimento circular para raio explícito preservando a chamada padrão do player. O grafo orienta; varredura e deslizamento existentes continuam autoritativos. A alternativa de steering direto com repulsão falha atrás de ilhas; um navmesh novo seria complexidade desnecessária para duas ilhas. Os números técnicos de grade/cadência/tolerância e busca finita ficam centralizados e documentados como hipóteses técnicas, sem duplicar valores já presentes no GameConfig.

### Chaser, Shooter e tiro

Chaser usa rumo para próximo waypoint e avanço configurado, perseguindo posição atual. Shooter inicia em hold quando já na banda; acima de preferred+hysteresis entra em approach até preferred, abaixo de preferred−hysteresis entra em retreat até preferred. Na configuração atual são 210/240/270. Com LOS bloqueada prioriza reposicionamento por rota até obter visão, inclusive quando na banda. Afastamento usa giro e avanço seguro; não é necessário introduzir reverse. Em hold pode girar parado para o alvo. Todas as rotações e deslocamentos respeitam velocidade angular/linear configurada.

Entrada na distância de ataque (<=300) inicia deadline `activeTime + cooldown`; saída (>300) apaga o deadline. Obstrução/erro angular dentro do alcance não reinicia recarga. Quando pronto aguarda elegibilidade; disparar define novo deadline. Rumo real determina a bala, com erro <=10°, sem posição futura. LOS usa trajetória circular da bala contra cenário e verificação casco→muzzle; não basta um raio sem espessura. Generalizar emissão existente com raio, facção, autoria e configuração da arma, preservando W/E. Não duplicar lógica de impacto/lifetime.

### Ordem de fases e separação

1. Resolver projéteis existentes em ordem estável, com destruições imediatas como na base.
2. Se player vivo, atualizar rumo e proposta de movimento do player e dos inimigos sobreviventes; validar cenário e contato entre cascos por varredura. Contato Chaser-player, inclusive no deslocamento, deve ser capturado antes de uma correção de separação; aplicar dano/autodestruição imediatamente. Se player morre, nenhuma ação posterior de inimigo ou diretor ocorre.
3. Resolver separação/correções restantes com ordem estável de IDs; preservar posições anteriores válidas quando não existe deslocamento seguro. Shooter pode bloquear player; preferir correção do inimigo, sem empurrar player para cenário. Centros coincidentes usam direção derivada de ordem de IDs. Correções passam pela mesma colisão cenário/cascos, sem somar vetor e fazer clamp no fim. Separação local orienta intenção antes da colisão, mas nunca substitui essa barreira.
4. Emitir armas do player e Shooter elegíveis; balas novas participam da próxima fase de projéteis. Remover estados privados de inimigos destruídos.
5. Com player vivo, processar reservas vencidas e oportunidades do diretor, depois publicar snapshot/eventos. Materializado só age a partir do próximo passo.

Movimentos sequenciais determinísticos são suficientes para velocidades e passo existentes; testes de encontros frontais/oblíquos, costa e bordas devem impedir tunneling, empilhamento persistente e perda de contato Chaser. Mantém prioridade de balas e evita exigir física de massas/impulsos.

### Diretor, RNG e prazos

Usar PRNG uint32 documentado, por exemplo Mulberry32 com estado privado e suporte à seed zero. Escolha inicial: até 64 amostras por oportunidade num perímetro retangular com inset raio+folga, sorteando distância ao longo do perímetro. Cada amostra consome uma extração, inclusive rejeitada; parada no primeiro candidato seguro é reproduzível. Busca finita não é cap de entidades. Validar distância ao player, casco inteiro, ilhas, cascos vivos, reservas e rota para o raio correto. IDs de reservas/navios/projéteis compartilham garantia de unicidade, inclusive contra IDs iniciais.

Próxima oportunidade começa em interval e avança por interval em tempo ativo absoluto, nunca `agora + interval` após atraso. Reserva dura telegraphMs e não altera índice de arquétipo. Ao prazo, revalidar tudo com estado atual; sucesso cria inimigo e avança índice; falha cancela sem substituição. Oportunidade falha continua na agenda normal e não vira fila. Congelamento não executa passos nem avança RNG. Catch-up continua limitado e o tempo descartado não cria oportunidades. Após morte não agendar/materializar; cancelar avisos pendentes para não sugerir inimigos futuros.

Conflito documental explícito: GDD §7 diz ambos até 6s, mas determina agenda 3/6s e aviso 0,6s. Aplicar algoritmo explícito do prompt 05: oportunidades 3/6s, aparições 3,6/6,6s se seguras. Não reduzir aviso nem antecipar primeira oportunidade. Registrar em documentação/testes como reconciliação rastreável, sem afirmar cumprimento literal da frase contraditória.

### Apresentação, diagnóstico e evidências

Pixi já renderiza assets 3/8 e balas: reconciliar anéis de reserva por ID, desenhar progresso de tempo ativo, remover em cancelamento/materialização/teardown, sem destruir texturas compartilhadas. `geometry=1` pode incluir cascos/waypoints/LOS derivados para inspeção readonly. Fluxo normal passa a demonstrar ambos; preservar `combatScenario=targets` estacionário. Se forem necessários cenários iniciais de IA reproduzíveis no browser, documentar seletores opt-in que apenas fornecem dados/config/seed antes da criação e usam modo normal; nenhum comando de morte, score ou teleporte.

Core cobre raios/rotas de ambas ilhas, endpoints, giro/velocidade, 210/240/270/300/10°, LOS espessa, primeira espera/reentrada, separação e prioridade de morte. Diretor cobre 3/3,6/6/6,6s, seeds iguais/distintas, reserva/revalidação/cancelamento, falta de candidato, alternância por sucesso, ausência de backlog/cap e freeze durante aviso. E2E usa clock controlado sem saturar catch-up, mouse/R/Q/W/E reais e snapshots readonly; mostrar ambos, tiro bloqueado por ilha, morte e score por colisões, telegraph/freeze/Resume e descarte. Preservar regressões de navegação/combate anteriores; expectativas de inimigos vazios no fluxo normal só valem antes da primeira materialização. Salvar evidências novas exclusivamente sob `project/automation-reports/05-implement-enemies-and-spawning/`.

## Risks / Trade-offs

- Grade discreta ou giro finito pode gerar enrosco → validar progresso por ambos lados de cada ilha e endpoints próximos à costa; corrigir conectividade e intenção sem reduzir colisores.
- Separação em grupo pode oscilar → ordem estável, barreira de colisão, folga mínima documentada e testes contra costa/player parado ou andando.
- Float nos deadlines pode atrasar um passo → reutilizar tolerância temporal existente e testar instante anterior/exato/posterior.
- Custo por inimigo cresce sem cap → cache do grafo e replanejamento limitado, sem acrescentar cap de gameplay; profiling extenso permanece etapa própria.
- Testes anteriores presumem mundo vazio → migrar apenas os que dependem de cenário estacionário para seleção explícita e manter testes novos do fluxo normal.

## Migration Plan

Sem migração de dados ou deploy. Implementar módulos puros e contratos, integrar engine, depois loop/Pixi e documentação. Rodar lint/typecheck/core/build/E2E dev+preview e inspeção visual. Em regressão, corrigir antes de verify/archive; não sincronizar specs nem marcar tarefas prontas sem evidência. Rollback local é reversível pelo conjunto desta change, preservando os incrementos arquivados e evidências anteriores.
