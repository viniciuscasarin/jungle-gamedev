# Design

## Context

Ver `proposal.md` para motivação e `specs/responsive-hud/spec.md` para os contratos de comportamento.

- `BattleHud.tsx` coloca `.control-guide` antes de `.battle-control-row` dentro da banda inferior. A dica fica acima da maior altura do joypad ou das skills. O CSS final usa skills 2×2 de 52 px no landscape de até 400 px de altura, sobrescrevendo uma regra anterior de quatro colunas.
- `.battle-top` e `.battle-bottom` têm `pointer-events: none`; somente botões e joypad recuperam eventos. O X precisará conservar esse comportamento nativo sem receber `data-control` de gameplay.
- A região `battle-live-region` hoje engloba instruções, auto-sail, pausa e anúncios. A arena depende do id `sailing-instructions` via `aria-describedby`; remover o bloco inteiro quebraria essa descrição.
- `observeArenaResize` observa o tamanho do host e das bandas, e `pixiPreview.resize()` mede seus retângulos para orientar a câmera. Mudar apenas a posição de um grupo pode não disparar `ResizeObserver`.
- A resposta pública do Netlify injeta `/.netlify/scripts/hud?variant=public`. Na inspeção de 30/10/2026, o script cria `iframe#nl-badge-frame`, fixo embaixo à direita, inicialmente 216×92 px e com `z-index: 2147483645`. Depois atualiza tamanho e recorte e remove o iframe quando ocultado. Essas são observações da versão atual, não uma API estável do provedor.
- As suítes existentes têm medição de hitboxes e insets, contatos touch via CDP, simulação de safe areas e anúncios de pausa/retomada. O adaptador local de armazenamento já trata erros ao adquirir Web Storage, padrão a preservar.

## Goals / Non-Goals

**Goals:**

- Isolar a compatibilidade com a badge do componente de combate e medir somente a geometria externa necessária.
- Posicionar dica e grupos de controle de forma independente, conservando um centro de combate legível em 568×320 e 844×390.
- Manter descrição, anúncios e preferência de fechamento com ciclos de vida independentes da dica visual.

**Non-Goals:**

- Controlar o conteúdo do iframe, alterar recorte ou prioridade da badge, consumir mensagens privadas do Netlify ou modificar o provedor.
- Prometer acesso simultâneo a todos os controles enquanto o usuário abre o popover externo.
- Criar um sistema genérico de resolução de colisões de overlays ou modificar a simulação e a política de orientação.

## Decisions

### 1. Observar o iframe conhecido e reservar sua geometria externa

Criar um adaptador DOM pequeno, separado do HUD, que encontra `iframe#nl-badge-frame`, mede a interseção do seu retângulo com o viewport e publica a ocupação ao shell. Tratar ausência, remoção e elemento oculto como ocupação zero. Não ler `contentDocument`, capturar mensagens nem injetar scripts no iframe.

Observar inclusão/remoção com `MutationObserver` e dimensões com `ResizeObserver`; mudanças relevantes de estilo, estado de prontidão e viewport solicitam nova leitura agrupada por `requestAnimationFrame`. O iframe começa com recorte vazio: não tratá-lo como badge visível antes de estar pronto. Concentrar os identificadores e essa compatibilidade no adaptador, com descarte idempotente de observadores e callbacks. Não fazer polling por frame.

Publicar a ocupação em propriedades CSS ou props próprias do HUD; em modo desktop, não aplicar a reserva. No touch, usar a borda superior do retângulo para subir as skills, com 8 px de separação, e sua borda esquerda para limitar a largura da dica no rodapé. A ausência da badge produz reserva zero, inclusive em dev e preview. A medição do iframe inteiro é conservadora e evita interpretar o formato de `clip-path`; a garantia se refere ao estado recolhido.

Alternativas: aumentar `z-index` esconderia parte da badge sem resolver a disputa; uma margem fixa global desperdiçaria espaço em ambientes sem badge e dependeria das dimensões atuais do provedor. Um sistema para qualquer overlay seria desproporcional ao problema observado.

### 2. Dica na base e controles independentes

Reorganizar a banda touch com áreas independentes para joypad à esquerda, skills à direita e dica na faixa central inferior disponível. A dica fica na borda inferior útil, com safe area e no máximo 12 px de espaçamento; não participa como bloco acima de toda a linha de controles. Limitar sua largura pelos retângulos do joypad, das skills e da badge, permitindo quebra de linha.

Em landscape compacto, permitir quatro skills em linha quando a reserva vertical da badge tornar o grupo 2×2 alto demais. Preservar Q/W/E/R, os estados textuais e hitboxes de 48×48 px ou maiores. O ajuste deve evitar também a banda superior, sem levantar o joypad inteiro quando somente o canto direito precisa de reserva. A dica usa o espaço inferior remanescente à esquerda da badge, entre os grupos quando disponível. Validar o encaixe pelas medidas reais, incluindo a área de 48×48 px do X.

Manter a banda inferior medida abrangendo todos os grupos visíveis, mesmo que seu layout interno use posicionamento independente. Notificar explicitamente o caminho existente de resize quando a ocupação da badge alterar posições sem alterar dimensões observadas. Após fechamento, a dica deixa de participar da ocupação. O renderer continua com canvas integral e câmera baseada nas bandas; não somar a reserva da badge novamente aos insets já medidos.

Alternativas: apenas mover o texto para depois dos controles criaria outra faixa de altura e poderia colidir com a badge; subir toda a banda consumiria espaço vertical desnecessário em 320 px de altura.

### 3. Fechamento restrito à dica visual touch

Usar botão semântico `type="button"`, X visual, nome `Dismiss control tips`, foco visível e área mínima de 48×48 px. O fechamento remove o painel visual touch sem alterar os comandos. Se o botão removido tiver foco, devolver foco à arena somente quando estiver disponível, sem atravessar proteção portrait ou diálogo.

Registrar a preferência em chave própria versionada de `sessionStorage`, por exemplo `pirate-battle.touch-guide-dismissed.v1`, com valor validado. Adquirir o storage dentro de `try/catch`; em falha, usar estado em memória compartilhado entre montagens do HUD. Esse é o padrão proposto para a duração da escolha: sessão da aba, incluindo reload. Não usar `localStorage`, que transformaria a escolha em preferência permanente, nem estado apenas dentro de `BattleHud`, que voltaria a exibir a dica em cada partida.

A preferência vale somente para a dica touch. Mudar para desktop mantém seu guia visual; voltar para touch conserva o fechamento. Rotação, pausa e início de outra partida não apagam a escolha. Não é necessário incluir uma nova opção de configuração nesta entrega.

### 4. Descrição persistente e live region separadas

Manter `sailing-instructions` como descrição semântica estável dos comandos do modo, visualmente oculta quando a dica touch estiver dispensada, sem duplicar ids. Separar o painel visual e seu botão da região `role="status" aria-live="polite"` que mantém `data-testid="battle-live-region"` e recebe somente os anúncios discretos existentes. Não colocar texto de auto-sail, cooldown ou tempo rotineiro nessa região.

Conservar os limiares e a detecção de borda já implementados; a separação não deve remontar a live region a cada fechamento. Rever sua posição em relação ao wrapper `inert`/`aria-hidden` da pausa: a região precisa continuar exposta durante pausa/retomada, mas respeitar o bloqueio de orientação e o término da sessão. Testar a exposição semântica, além do texto anexado ao DOM. X não recebe atributos de arma e não deve encaminhar Enter/Space para gameplay.

Alternativa: esconder a dica inteira com `hidden` eliminaria também a descrição e os anúncios, contrariando os requisitos existentes.

### 5. Evidência local determinística e inspeção da integração real

Adicionar aos E2E uma fixture que insere iframe com a identidade e o retângulo da badge recolhida, sem carregar conteúdo remoto. Cobrir presença inicial, chegada tardia, resize, remoção e ausência, usando geometria real dos controles e `elementFromPoint` nos pontos acionáveis para detectar interceptação.

Executar 568×320 e 844×390 com insets controlados e dica aberta/fechada, além do desktop existente. Verificar movimento e disparo simultâneos, preferência entre partidas/reload, falha do storage e anúncios após fechamento. Capturar screenshots e inspecionar o resultado, sem aceitar snapshots automaticamente. Uma inspeção somente de leitura na URL pública pode confirmar a forma atual da badge; evidência local simulada deve ser identificada como tal. A publicação desta correção exige pedido separado.

## Risks / Trade-offs

- [Netlify pode trocar a identidade ou a apresentação do iframe] → Isolar o adaptador, documentar a integração observada e manter fixture e roteiro de inspeção pública; não apresentar o seletor como contrato oficial.
- [Retângulo do iframe contém transparência] → Reservar seu retângulo externo de forma conservadora; testar os dois landscape mínimos antes de aprovar o encaixe.
- [Mudança de posição não aciona observação de tamanho] → Disparar resize explícito pela atualização de ocupação e verificar insets e player sem reset.
- [Fechamento afeta anúncios ou foco] → Separar descrição, live region e painel; verificar árvore acessível, teclado e pausa após fechar.
- [Storage bloqueado] → Preferência em memória e jogo funcional, aceitando que reload possa reapresentar a dica nesse ambiente.

## Migration Plan

1. Implementar o adaptador da badge e integrar ocupação ao HUD touch, com reserva zero na ausência.
2. Reorganizar a dica, acrescentar fechamento por sessão e separar os canais de acessibilidade.
3. Executar testes focados, checks do projeto e inspeção visual dos cenários definidos; atualizar o README.
4. Não há migração de dados existentes. Reverter removendo a integração, os estilos e a preferência nova; uma chave de sessão remanescente é inerte. Não publicar nem alterar configurações da hospedagem nesta change.
