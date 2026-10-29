# Proposal

## Why

O combate já funciona por mouse e teclado, mas o HUD provisório e a ausência de controles touch impedem jogar em dispositivos móveis. O incremento 08 concretiza a direção confirmada das seções 4 e 10 do GDD, completando também os comandos direcionais e as barras sobre navios que ainda faltam na implementação.

## What Changes

- Apresentar HUD desktop com vida central na base, Q/W/E/R imediatamente acima e score, tempo e Pause no topo; no touch, vida no topo, joypad inferior esquerdo e skills inferiores direitas, com grupo 2×2 em espaços limitados.
- Acrescentar joypad com dead zone inclusiva de 15%, rumo com giro finito e avanço frontal, conservando o último rumo ao soltar com R On.
- Compor comandos por fontes e pointer IDs independentes, com captura por controle, ataques simultâneos, release/cancel seguros e R touch confirmado uma vez por liberação válida.
- Detectar modo por capacidade inicial e input real; troca efetiva limpa transitórios e desliga auto-sail, enquanto resize conserva a partida e o modo.
- Exibir ícones, teclas, readiness, preenchimento e segundos de cooldown derivados do tempo ativo; R exibe On/Off sem cooldown.
- Renderizar barras horizontais em PixiJS sobre todos os navios vivos e enquadrar a arena inteira entre faixas reais do HUD, respeitando safe areas e alvos de pelo menos 48 CSS px.
- Comprovar o comportamento com testes de domínio, multitouch real no navegador, regressões e inspeção visual desktop/portrait/landscape.

## Capabilities

### New Capabilities

- `responsive-hud`: posição, semântica e feedback dos indicadores e controles nos layouts desktop e touch.
- `touch-input`: joypad, composição de fontes, captura independente, cancelamento e transição segura de modo.

### Modified Capabilities

- `player-navigation`: interpretar direção e pedido manual de avanço, ampliar propriedade contextual e limpeza para controles compostos, preservando mouse e R.
- `arena-rendering`: reservar faixas medidas do HUD e apresentar barras horizontais de saúde em todos os navios vivos.

## Impact

Afeta `src/input`, contratos de controle/engine, loop/owner e apresentação Pixi, viewport/observação de layout, UI React/CSS, catálogo DOM de assets, testes e documentação em inglês. Reutiliza configuração capturada, regras de colisão, combate, pausa, cache e único loop existentes, sem dependências de produto novas obrigatórias. Áudio, efeitos de batalha, REST, balanceamento e publicação ficam fora deste incremento. Artefatos e evidências 01–07 serão preservados; nenhum código será implementado nesta fase.
