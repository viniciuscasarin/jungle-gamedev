# Proposal

## Why

Navegação e combate já funcionam, mas o fluxo normal permanece sem adversários. O incremento 05 transforma os arquétipos existentes em oponentes autônomos e introduz encontros reproduzíveis e seguros conforme GDD §§5–7.

## What Changes

- Chaser persegue por rotas seguras; Shooter controla distância, reposiciona diante de ilhas e dispara com alcance, mira, linha de visão e primeira recarga completa.
- Waypoints consideram o raio do casco, separação local e colisão autoritativa entre navios e cenário.
- Diretor usa seed, agenda em tempo ativo, alternância somente após materialização bem-sucedida, reserva e telegraph de 600ms revalidado.
- Render apresenta inimigos e anéis autoritativos; congelamento paralisa IA, balas, recargas e spawn. O diagnóstico estacionário continua opt-in e explicitamente isolado.
- Substituir limites temporários das specs anteriores que proibiam IA/spawn. Preservar navegação, armas, autoria, morte atômica e pontuação existentes.
- Registrar a reconciliação: a agenda padrão em 3/6s com telegraph implica primeiras aparições em 3,6/6,6s quando seguras; o algoritmo explícito do prompt 05 prevalece sobre a frase do GDD de ambos aparecerem até 6s.

## Capabilities

### New Capabilities

- `enemy-behavior`: perseguição, navegação por waypoints, distância tática, tiro e separação dos inimigos.
- `spawn-director`: escolha reproduzível de posições, agenda, reserva, telegraph, cancelamento e alternância.

### Modified Capabilities

- `simulation-runtime`: fluxo normal com IA/diretor determinísticos e congelamento abrangente.
- `simulation-contracts`: dados de reservas para apresentação e seleção explícita de diagnóstico estacionário.
- `arena-rendering`: apresentação e descarte de inimigos autônomos e telegraphs.
- `player-combat`: remover proibição transitória de perseguição/spawn preservando prioridade de projéteis e modo de alvos.

## Impact

Afeta `src/simulation/{engine,collision,combat,contracts}.ts`, pequenos módulos puros de navegação/IA/RNG/diretor, integração do loop/Pixi e testes. Reutiliza configuração e assets existentes; parâmetros técnicos novos estritamente necessários ficam tipados e documentados, sem duplicar balanceamento. README e ARCHITECTURE serão atualizados em inglês. Sem dependências novas previstas, lifecycle completo, telas finais, Options, controles móveis, áudio, API, persistência, push ou publicação. Evidências ficam no diretório do incremento 05, preservando 01–04.
