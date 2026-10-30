# Verificação de fix-mobile-hud-overlays

Data: 30/10/2026. Schema: `spec-driven`.

## Resultado implementado

O HUD touch mede a geometria externa de `iframe#nl-badge-frame` e eleva somente as skills, com separação de 8 CSS px. Sem badge, a reserva exclusiva é zero; o desktop não aplica a reserva. A dica fica na base útil, com X `Dismiss control tips`, hitbox mínima de 48×48 px e retorno de foco à arena disponível. O fechamento usa uma chave própria de `sessionStorage`, com alternativa em memória entre montagens. Descrição dos comandos e anúncios discretos têm ciclos independentes da dica visual.

## Ambiente e verificações

Node 26.11.1, npm 11.20.0 e Playwright 1.64.1 com Chromium 156.0.8078.4. Desenvolvimento em `http://127.0.0.1:5183`, preview em `http://127.0.0.1:4183`, após build local. Os comandos selecionaram explicitamente o runtime instalado e o cache local de browsers; não instalaram dependências.

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Passou |
| `npm run lint` | Passou |
| `npm test` | 403 testes, 36 arquivos, passaram |
| `npm run build` | Passou; permanece o aviso de chunk acima de 500 kB |
| Arena: bandas, safe areas e ciclos de montagem/input | 14 passaram na rodada que inclui os oito cenários novos da badge |
| Badge: presença inicial/tardia, resize, posição, remoção, dica aberta/fechada e input simultâneo | 8 passaram, nos dois perfis e nas duas origens |
| Feedback, áudio e acessibilidade desktop | 22 passaram, nas duas origens |
| Feedback mobile existente | 8 passaram, nas duas origens |
| Fechamento, persistência e anúncios mobile novos | 14 passaram, nas duas origens |
| Orientação, proteção portrait, fullscreen e retomada | 32 passaram, nas duas origens |
| Baselines visuais de batalha desktop/mobile | 2 passaram e 2 foram ignorados por pertencerem ao outro perfil; nenhum snapshot foi atualizado |

Os logs `typecheck.log`, `lint.log`, `unit-tests.log`, `build.log`, `badge-e2e.log`, `feedback-desktop-e2e.log`, `feedback-mobile-e2e.log`, `feedback-mobile-new-e2e.log` e `orientation-e2e.log` ficam nesta pasta. As medições de retângulos, hit testing e insets das quatro capturas finais estão em `live-clock-geometry.json`. Os testes também anexam medições ao contexto de execução; o reporter de lista não conserva esses corpos como arquivos após sucesso.

Os testes verificam 568×320 e 844×390 com safe areas CSS de 7 px no topo, 6 px à direita, 9 px embaixo e 5 px à esquerda. Medem hitboxes de pelo menos 48×48 px, separação da badge, ausência de colisão entre grupos, X acionável por `elementFromPoint`, dica até 12 px acima da safe area inferior, canvas integral e player centralizado na câmera útil. Também verificam identidade da partida, posição/saúde do player, score, cooldowns e modo de input durante as atualizações de layout. Contatos CDP reais exercitam navegação e disparo simultâneos.

Os testes de preferência cobrem sessão sem preferência, dados inválidos, getter/leitura/escrita que falham, nova partida, reload, pausa, rotação e troca desktop/touch. Enter, Space e toque fecham somente a dica. As verificações de acessibilidade consultam descrição acessível e região de status exposta, incluindo durante pausa; exercitam pontuação, dano crítico, dez segundos e ausência de anúncios rotineiros.

O relógio controlado dos testes novos aguarda o registro nativo do service worker antes de avançar o startup. Isso evita esgotar artificialmente o timeout do mock e enviar uma consulta de ranking ao servidor estático. Uma primeira execução unitária teve falha de temporização no teste existente `out-of-order`; a execução integral posterior, sem E2E concorrente, passou com 403/403.

## Inspeção visual

As quatro imagens abaixo foram inspecionadas, com fixture local da badge, safe areas controladas e relógio normal. Foram capturadas no Chromium completo instalado, em headless com perfil temporário, fora do sandbox. O headless shell dentro do sandbox apresentou artefatos de composição nas capturas com iframe; as imagens finais abaixo ficaram livres desses artefatos.

- [568×320, dica aberta](live-clock-568-open.png)
- [568×320, dica fechada](live-clock-568-closed.png)
- [844×390, dica aberta](live-clock-844-open.png)
- [844×390, dica fechada](live-clock-844-closed.png)

O script reproduzível é `capture-live-clock.mjs`. Ele aceita `PLAYWRIGHT_CAPTURE_ORIGIN` e `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. No ambiente usado, a origem foi o preview na porta 4183 e o executável foi `chromium-1248/chrome-win64/chrome.exe` do cache do Playwright. As imagens adicionais dos testes com relógio virtual permanecem identificadas pelos nomes dos perfis e portas.

## Integração observada e limites

A fixture cria um iframe local de 216×92 px, sem carregar conteúdo remoto. Resize usa 200×72 px; a mudança de posição usa 16 px acima da base. A chegada inicial ocorre antes da montagem da arena; a tardia ocorre durante a partida.

Uma leitura do [script público do Netlify](https://jungle-gamedev.netlify.app/.netlify/scripts/hud?variant=public) confirmou o seletor, o tamanho inicial e o recorte vazio `path("M0 0Z")`, também coberto no teste do adaptador. Isso é uma observação da integração atual, sem contrato oficial do provedor. O adaptador não acessa conteúdo do iframe, não interpreta o formato visível e não consome mensagens privadas.

Não houve publicação. A correção não foi validada no site de produção nem em aparelho físico. Safe areas, orientação, toque e semântica acessível foram exercitados por emulação; não houve teste com leitor de tela real. A garantia de combate simultâneo cobre somente a badge recolhida, conforme a especificação; o popover expandido fica fora do escopo.
