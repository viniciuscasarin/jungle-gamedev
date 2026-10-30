# Tasks

## 1. Ocupação da badge e integração com o HUD

- [x] 1.1 Criar o adaptador DOM isolado para medir `iframe#nl-badge-frame`, sem acessar seu conteúdo, observando presença, prontidão, geometria, ocultação e remoção; verificar por testes focados os estados ausente, chegada tardia, resize, remoção e descarte idempotente sem callbacks residuais ou polling por frame.
- [x] 1.2 Integrar a ocupação ao shell/HUD touch com reserva zero quando ausente e notificação explícita do caminho de resize em mudanças somente de posição; verificar em E2E com fixture da badge que os insets acompanham a geometria sem reiniciar matchId, alterar estado lógico ou aplicar reserva no desktop.
- [x] 1.3 Documentar no README a compatibilidade com a badge recolhida e o comportamento sem badge, identificando o seletor como integração observada e o popover como fora da garantia; verificar que o roteiro distingue fixture local de inspeção do site publicado.

## 2. Dica no rodapé e ações acessíveis

- [x] 2.1 Reorganizar o layout touch em `BattleHud.tsx` e `styles.css`, ancorando a dica na base útil e posicionando joypad/skills independentemente, com quebra de linha e grupo de skills compacto quando necessário; verificar em E2E 568×320 e 844×390, com badge e safe areas controladas, que todas as hitboxes têm pelo menos 48×48 px, não se sobrepõem, ficam 8 px afastadas da badge e a dica termina até 12 px acima da safe area inferior.
- [x] 2.2 Acrescentar X semântico `Dismiss control tips`, fechamento exclusivo da dica e retorno de foco à arena disponível; verificar toque, Enter e Space sem pausa, disparo ou alternância de auto-sail e confirmar que não há foco em elemento removido nem interferência com diálogos ou proteção portrait.
- [x] 2.3 Manter descrição estável `sailing-instructions` e separar a live region dos marcos do painel dispensável, revendo sua exposição durante pausa; adaptar `tests/hud.test.ts` e `tests/e2e/battle-feedback.spec.ts` para verificar descrição válida, região acessível após fechar, anúncios de saúde crítica/dez segundos/pontuação/pausa-retomada e ausência de anúncios rotineiros.
- [x] 2.4 Estender a fixture e as medições de `tests/e2e/arena.spec.ts` para presença inicial/tardia, resize e remoção da badge, dica aberta/fechada e input simultâneo; verificar retângulos, alvos acionáveis por `elementFromPoint`, navegação com disparo, cenário integral, player legível e geometria da câmera atualizada sem regressão de desktop ou portrait protegido.

## 3. Preferência de fechamento por sessão

- [x] 3.1 Persistir o fechamento touch em chave própria versionada de `sessionStorage`, com leitura validada, tratamento de erros e alternativa em memória compartilhada entre montagens; verificar sessão nova, dados inválidos, getters/escritas que lançam erro e ausência de interferência com opções, identidade, ranking ou outbox existentes.
- [x] 3.2 Cobrir em E2E retorno ao menu, nova partida, reload, pausa, rotação e troca touch/desktop; verificar dica fechada na mesma sessão, guia desktop disponível e preferência em memória entre partidas quando o storage falha, adaptando somente o reset de testes que precisar de uma sessão limpa.
- [x] 3.3 Atualizar o README com posição da dica, X e duração por sessão, incluindo a limitação após reload quando o storage está indisponível; verificar correspondência com os cenários automatizados e os textos reais em inglês.

## 4. Verificação integrada

- [x] 4.1 Executar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` no runtime de referência; verificar sucesso e corrigir somente problemas relacionados à change.
- [x] 4.2 Executar os E2E afetados em dev e preview, incluindo desktop, os dois landscape compactos com/sem badge, safe areas e portrait protegido; inspecionar screenshots com dica aberta/fechada e registrar evidências e limitações de emulação, sem publicar a aplicação ou alegar validação física não realizada.
