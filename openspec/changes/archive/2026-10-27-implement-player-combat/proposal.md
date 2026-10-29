# Proposal

## Why

A navegação já entrega rumo e movimento autoritativos, mas Q/W/E ainda não produzem ataques, dano ou score. O próximo incremento precisa exercitar o combate da seção 6 do GDD com colisões reais antes de adicionar IA e spawn.

## What Changes

- Ativar canhão frontal e duas broadsides pelo rumo real, com três origens longitudinais nas laterais, cooldowns independentes e disparo mantido durante navegação.
- Simular projéteis com facção, lifetime ativo, emissão fora do casco e bloqueio adjacente, escolhendo o primeiro impacto varrido contra costa, limites e casco hostil.
- Aplicar dano uma vez, destruição atômica e um ponto por inimigo morto pelo player; resolver projéteis existentes antes de contato e impedir ações de mortos.
- Disponibilizar cenário de alvos opt-in por dados iniciais, separado do acesso normal, usando as mesmas entidades e regras de combate. Incluir somente contato mínimo do Chaser para provar a ordem exigida, sem IA ou spawn.
- Renderizar alvos e balas pelos assets verificados e mostrar instruções e indicadores semânticos mínimos de score/cooldown em inglês.
- Preservar navegação, congelamento, dono único do loop, cache e teardown. Validar regras sem DOM e combate por controles reais no navegador.

Fora de escopo: IA, perseguição, disparo autônomo do Shooter, diretor de spawn, ciclo completo de partida/resultados, touch, HUD final, API, áudio e efeitos completos. Saúde zero desativa a entidade; não entrega a tela final de partida.

## Capabilities

### New Capabilities

- `player-combat`: armas do player, projéteis, dano, destruição, score e cenário de diagnóstico no domínio real.

### Modified Capabilities

- `simulation-runtime`: estado inicial sem fixtures por padrão, execução de combate e eventos imutáveis por passo, mantendo determinismo e tempo ativo.
- `simulation-contracts`: dados de preparação e proveniência dos projéteis suficientes para combate e diagnóstico sem referências de plataforma.
- `game-configuration`: parâmetros técnicos centralizados para geometria da bala e emissão sem alterar as propostas numéricas do GDD.
- `arena-rendering`: apresentar projéteis e alvos vivos autoritativos com propriedade explícita dos sprites dinâmicos.
- `application-shell`: explicar Q/W/E/R e apresentar score e cooldowns mínimos sem atualização React por frame.
- `asset-loading`: incluir a bala fornecida no catálogo tipado verificado e no carregamento compartilhado.

## Impact

Afeta `src/simulation`, `src/domain/config.ts`, `src/input/desktop.ts`, adaptador Pixi e loop existentes, manifest, React/CSS, testes proporcionais e README/ARCHITECTURE/ASSET_CREDITS. Não exige dependências novas, rede ou alterações de serviço. As proibições temporárias de combate nas specs anteriores serão substituídas explicitamente; seus Purpose existentes serão preservados no sync.
