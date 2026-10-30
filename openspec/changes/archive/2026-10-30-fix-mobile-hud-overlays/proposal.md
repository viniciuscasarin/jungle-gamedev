# Proposal

## Why

No mobile, a badge Powered by Netlify cobre os botões de ação no canto inferior direito, e a dica de arrastar aparece alta demais por estar acima de todo o grupo de controles. O jogador precisa acessar as ações sem obstrução e poder dispensar essa orientação para liberar a visão da arena.

## What Changes

- Reposicionar os controles touch para evitar a badge recolhida do Netlify, preservando safe areas, alvos mínimos de 48×48 CSS px e acesso simultâneo ao joypad e às armas.
- Colocar a dica touch no rodapé, entre os grupos de controles quando houver espaço, com quebra de linha e largura adaptadas para evitar a badge e as ações.
- Acrescentar um botão X acessível para fechar somente a dica visual mobile. Adotar como padrão proposto a persistência durante a sessão da aba, inclusive entre partidas e recargas.
- Separar os anúncios acessíveis da dica dispensável e conservar uma descrição dos comandos para a arena após o fechamento.
- Recalcular o enquadramento a partir da geometria efetiva do HUD após mudanças de layout, sem deslocar a posição lógica do navio ou reiniciar a partida.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `responsive-hud`: convivência dos controles touch com a badge de hospedagem, dica no rodapé com fechamento por sessão e independência dos anúncios acessíveis.

## Impact

Afeta `src/ui/BattleHud.tsx`, `src/ui/styles.css` e a integração do HUD em `src/ui/App.tsx`; pode exigir um adaptador DOM para observar a badge e ajustes em `src/render/resizeObserver.ts` para mudanças de posição sem mudança de tamanho. A verificação reutiliza `tests/hud.test.ts`, `tests/resizeObserver.test.ts`, `tests/e2e/arena.spec.ts`, `tests/e2e/battle-feedback.spec.ts` e os helpers existentes. O README documentará a dica dispensável e o comportamento quando a badge está presente.

Não inclui publicação, remoção ou alteração da badge, modificações da conta Netlify, novas dependências, balanceamento, API, ranking ou persistência de resultados. O popover expandido do Netlify está fora da garantia de jogabilidade simultânea: o alvo desta correção é a badge recolhida. O layout visual desktop e a proteção portrait existente são preservados.
