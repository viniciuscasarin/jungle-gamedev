# Pirate Battle — sequência de prompts de desenvolvimento

Base: `GDD.md` v0.2 e `openspec/config.yaml`, consultados em 27/10/2026.

O repositório contém o GDD, os assets e a configuração OpenSpec; ainda não contém implementação, specs ou changes. Os nomes abaixo são sugestões para changes futuras, não artefatos já existentes. Este roteiro não altera o GDD nem inicia a implementação.

## Como executar

Execute os incrementos na ordem indicada. Cada bloco é um prompt para copiar. Use o contexto comum junto do prompt da etapa, inclusive ao abrir uma nova conversa. Conclua a validação de uma etapa antes de iniciar a seguinte; os testes e a documentação crescem junto com o jogo.

Para cada incremento, execute este ciclo em mensagens separadas:

1. Envie o contexto comum e o prompt da etapa com `openspec propose`. Revise a proposta antes de implementar.
2. Envie: `openspec apply <nome-da-change>. Implemente apenas as tarefas desta change, preserve os incrementos anteriores e valide seus critérios de conclusão. Atualize tasks.md somente com trabalho realmente concluído. Informe comandos executados, resultados e limitações.`
3. Envie: `Verifique a implementação de <nome-da-change> contra proposal, design, delta specs, tasks e as seções aplicáveis do GDD. Corrija divergências dentro do escopo e execute as verificações afetadas. Não declare concluído sem evidência; relate bloqueios e decisões pendentes.`
4. Após a verificação satisfatória, envie: `openspec archive <nome-da-change>. Confira as tarefas e sincronize as delta specs com as specs principais antes de arquivar. Relate o resultado.`

Se uma change com o mesmo objetivo já existir, inspecione e continue o trabalho existente. Se uma dependência não estiver pronta, conclua-a antes de avançar. Caso um incremento fique grande, divida-o em changes menores mantendo os critérios e a ordem das dependências.

## Contexto comum

```text
Leia as instruções aplicáveis do repositório, GDD.md, openspec/config.yaml e as specs e changes existentes antes de agir. Use o GDD como referência de produto e mantenha as decisões rastreáveis nas specs. Diferencie requisitos obrigatórios, direções confirmadas e propostas de balanceamento; use as propostas como valores iniciais documentados, sem tratá-las como resultados de playtest. Se houver conflito material entre fontes, explicite-o antes de implementar a parte dependente.

Escreva os artefatos OpenSpec em pt-BR, preservando seus headings estruturais e palavras SHALL/MUST em inglês. Interface, identificadores de código e documentação de entrega devem estar em inglês, conforme o GDD.

Use React para telas, formulários, diálogos e status semântico; PixiJS para arena, entidades, efeitos e barras sobre navios; TypeScript estrito para a simulação autoral; Axios e TanStack Query para HTTP e estado remoto; MSW para a fronteira REST em desenvolvimento, testes e build publicado; Playwright para E2E e regressão visual. Não substitua essas responsabilidades por um motor pronto ou por regras executadas no render React.

Preserve módulos de domínio, simulação, renderização, input, interface, armazenamento e dados com contratos explícitos. Evite abstrações especulativas. A simulação não deve depender de React, PixiJS, rede ou relógio global. Centralize os parâmetros tipados e use seed e relógio controláveis para reproduzir cenários. Preserve a aplicação executável ao fim de cada incremento.

Implemente somente a etapa solicitada. Não acrescente campanha, multiplayer, upgrades, loot, bosses, autenticação ou backend real. Reutilize os assets fornecidos após verificar seus metadados e aparência. Não presuma que IDs consecutivos representam animações ou dano e não invente licenças.

Inclua validação proporcional ao risco: testes de regras e integração para comportamentos relevantes, E2E dos fluxos introduzidos e inspeção visual quando houver mudanças de interface. Testes de combate devem operar os controles reais, a simulação e colisões; não conceda pontos ou mortes diretamente para simular sucesso. Não afirme ter executado verificações indisponíveis.

Ao concluir, atualize tasks.md e a documentação pertinente; informe o comportamento entregue, como reproduzi-lo, as verificações executadas e o que ainda falta. Preserve alterações existentes do usuário e não publique nem faça push automaticamente por causa deste contexto.
```

## 01 — Fundação técnica e contratos

Dependência: nenhuma. Change sugerida: `setup-game-foundation`.

```text
openspec propose setup-game-foundation

Planeje a base executável do Pirate Battle conforme as seções 1, 8, 12 e 13 do GDD. Inspecione o repositório antes de escolher a estrutura. Configure React, PixiJS, TypeScript estrito, bundler, lockfile e comandos de desenvolvimento, build, lint, typecheck e testes. Registre versões compatíveis e as decisões iniciais em ARCHITECTURE.md.

Defina fronteiras dos módulos e contratos mínimos de GameConfig, input por passo, snapshot/eventos da simulação e resultado imutável. Centralize os valores propostos do GDD com unidades explícitas, versões de mapa/balanceamento e seed separada. Prepare a estrutura para integrar Axios, TanStack Query, MSW e Playwright nos incrementos próprios.

Critérios: instalação limpa e build reproduzível; tela inicial mínima acessível; comandos disponíveis e documentados; configuração tipada sem regras duplicadas na interface. Não implemente combate, API ou telas finais nesta etapa.
```

## 02 — Assets, carregamento e ciclo React/Pixi

Dependência: 01. Change: `integrate-assets-and-arena-renderer`.

```text
openspec propose integrate-assets-and-arena-renderer

Planeje o primeiro incremento visual pelas seções 5, 10, 11 e 13 do GDD. Inspecione preview, samples, sprites individuais e metadados dos atlas; registre um mapeamento visual verificado para player, Chaser, Shooter, tiles e UI. Implemente manifesto/cache de texturas, Loading com falha simulável, Retry e retorno ao menu.

Monte a arena lógica 960×540 com água e as duas ilhas propostas. Documente a geometria sólida alinhada ao litoral visível, para consumo pela simulação seguinte. Escale o mundo inteiro proporcionalmente, sem recorte, respeitando densidade de pixels, resize e espaço para HUD/controles em portrait e landscape. Exponha transformações mundo/tela testáveis.

Defina propriedade de recursos compartilhados e descarte renderer, subscriptions e listeners com segurança sob React Strict Mode. Inicie ASSET_CREDITS.md em inglês, registrando procedência conhecida e pendências reais de licença.

Critérios: arena e navio estáticos visíveis; loading e retry demonstráveis; resize preserva coordenadas; montagem/desmontagem repetida não duplica canvas ou ticker. Samples são referências, não a arena achatada.
```

## 03 — Simulação, navegação do jogador e colisão com cenário

Dependência: 02. Change: `implement-player-navigation`.

```text
openspec propose implement-player-navigation

Planeje a simulação autoral e um navio controlável segundo as seções 4, 5 e 13 do GDD. Use passo fixo de 1/60 s e catch-up limitado. Separe atualização autoritativa e apresentação; exponha snapshots/eventos sem render React a cada frame.

Implemente direção pelo mouse com velocidade angular finita, conversão de coordenadas e clamp ao mundo; dead zone de 12 unidades; retenção da orientação antes do primeiro alvo e do último alvo ao sair do canvas. R alterna auto-sail uma vez por keydown, ignorando repeat; começa desligado e permite girar parado, sem reverse ou strafe.

Implemente colisores circulares de casco e peças sólidas das ilhas, limites da arena e deslizamento tangencial sem dano. Rotação e resize não podem atravessar obstáculos nem alterar as regras. Restrinja a captura de teclas ao contexto de jogo. Inclua um mecanismo mínimo de congelamento e limpeza de input ao perder foco, a consolidar no ciclo de sessão.

Critérios: navegar e contornar ambas as ilhas; R não oscila ao segurar; rumo e velocidade independem do FPS; pausas de execução não geram avanço ilimitado; geometria e colisores são verificáveis em modo de diagnóstico.
```

## 04 — Armas, projéteis e resolução de dano

Dependência: 03. Change: `implement-player-combat`.

```text
openspec propose implement-player-combat

Planeje armas e resolução de combate conforme a seção 6 do GDD. Q dispara um projétil frontal; W e E disparam três projéteis paralelos a bombordo e estibordo, distribuídos pelo casco. Use orientação real do navio, cooldowns independentes, armas inicialmente prontas e disparo contínuo enquanto seguradas, simultâneo à navegação.

Implemente lifetime, spawn fora do casco com verificação de obstáculo adjacente, colisão varrida escolhendo o primeiro impacto, facções e consumo no primeiro hit válido. Sem friendly fire, piercing ou colisão entre projéteis. Adicione alvos de diagnóstico fora do fluxo final para exercitar dano e destruição, usando o mesmo domínio que os inimigos utilizarão.

Implemente transição atômica vivo→destruído e um ponto por inimigo destruído pelo jogador. Projéteis existentes são resolvidos antes de contato; entidades mortas não agem posteriormente. Preserve os valores iniciais centralizados do GDD.

Critérios: direções e três origens de cada broadside verificadas; cooldowns por tempo ativo; projétil rápido não atravessa ilhas; hit aplica dano uma vez; hits simultâneos não duplicam pontos. Mantenha um indicador mínimo de score e cooldown para demonstração.
```

## 05 — Inimigos e diretor de spawn

Dependência: 04. Change: `implement-enemies-and-spawning`.

```text
openspec propose implement-enemies-and-spawning

Planeje Chaser, Shooter e spawn pelas seções 5–7 do GDD. Chaser persegue e navega ao redor de ilhas; contato causa 25 de dano uma vez, autodestruição e zero pontos. Shooter aproxima, mantém distância preferida de 240 com histerese de 30, ataca em alcance 300, linha de visão livre e erro angular máximo de 10°. Aguarda um cooldown completo antes do primeiro tiro em alcance; sem mira preditiva e sem dano por contato.

Use waypoints com obstáculos inflados pelo raio do casco, separação local e colisão autoritativa. Separe navios sem empurrar o jogador para terra ou fora da arena.

Diretor: primeiro agendamento após intervalo completo; alternância Chaser/Shooter iniciando por Chaser e avançando somente em spawn bem-sucedido; RNG com seed; posições seguras a pelo menos 240 unidades do jogador e com rota navegável. Telegraph de 0,6 s ativos, reserva e revalidação na materialização. Cancele posição insegura e pule oportunidades sem backlog. Sem cap arbitrário de inimigos ou rampa oculta.

Critérios: ambos os arquétipos demonstráveis; nenhum atravessa ou atira através de ilha; Chaser morto por projétil não causa contato depois; spawn não sobrepõe cascos e é reproduzível; sem spawn ou telegraph avançando durante congelamento.
```

## 06 — Partida completa, pausa e replay

Dependência: 05. Change: `implement-match-lifecycle`.

```text
openspec propose implement-match-lifecycle

Planeje a máquina Menu/Loading/Playing/Paused/Result pelas seções 3, 8 e 9 do GDD. Capture configuração completa e seed no início; timer, cooldowns, spawns e efeitos usam somente tempo ativo. Finalize exatamente uma vez por tempo ou morte. Na mesma etapa final, morte tem precedência sobre tempo; o resultado congelado não aceita eventos posteriores.

Implemente Escape/P, pausa por blur/document hidden, Resume explícito e reset da referência de relógio. Pause limpa ataques, joypad e alvos transitórios e desliga auto-sail, sem catch-up ao voltar. Adicione confirmação de abandono com Keep Playing/Abandon. Abandono não gera registro.

Entregue Result com score, duração ativa, motivo, Play Again e Main Menu. Replay cria novo ID e reseta saúde, score, relógio, armas, inimigos, projéteis, efeitos, input, steering e RNG, capturando as configurações salvas atuais. Persista Last Result localmente antes de qualquer integração remota; refresh durante combate abandona a partida sem substituir o último resultado concluído.

Critérios: loop menu→partida→resultado→replay jogável; ambos os finais; congelamento integral na pausa e no resultado; cinco ciclos sem entidades, listeners ou loops residuais. Sem exigência de API para jogar.
```

## 07 — Menu, opções e configuração persistida

Dependência: 06. Change: `implement-menu-and-options`.

```text
openspec propose implement-menu-and-options

Planeje menu e Options pelas seções 8–11 do GDD usando os assets de UI e controles React semânticos. Inclua Play, Options, guia de controles e Last Result quando disponível. Reserve integração futura para as abas de dados, sem apresentar fixtures locais como consultas prontas.

Options: Game session time entre 60 e 180 segundos inteiros e Enemy spawn time entre 1 e 10 segundos em incrementos de 0,5. Valide números finitos, limites e passo; mostre unidades e erros acessíveis. Save persiste somente valores válidos; Cancel descarta edição. Dados persistidos corrompidos restauram defaults com explicação visível.

Critérios: navegação por teclado e touch; persistência após refresh; Cancel preserva configurações anteriores; edição não modifica snapshot de partida existente; replay usa o último Save; layouts usam corretamente metadados e estados dos botões.
```

## 08 — Controles mobile e HUD responsivo

Dependência: 07. Change: `implement-responsive-hud-and-touch`.

```text
openspec propose implement-responsive-hud-and-touch

Planeje a direção confirmada das seções 4 e 10 do GDD. Desktop: vida na base central, Q/W/E/R imediatamente acima; score, tempo e pause no topo. Mobile: vida central no topo, joypad circular inferior esquerdo, skills inferiores direitas, grupo 2×2 quando necessário. Preserve barras sobre todos os navios vivos em PixiJS, sem girar com o casco.

Joypad tem dead zone de 15%, define rumo e solicita avanço com giro finito. Soltar para quando R está Off; com R On mantém avanço e último rumo. Use pointer IDs independentes, captura por controle, disparos simultâneos, liberação e cancelamento seguros; cancelamento não alterna R. Troca de modo de input limpa transitórios e desliga auto-sail.

Exiba ícones, teclas, readiness, cooldown visual e segundos restantes; R mostra On/Off sem cooldown. Tempo visual congela na pausa. Garanta alvos de pelo menos 48 CSS px, safe areas, viewport mínimo de 320 px, portrait e landscape com arena inteira entre HUD e controles.

Critérios: navegar e disparar com múltiplos dedos; release/cancel sem input preso; resize sem reinício; HUD não oculta combate; layout desktop e mobile comprovados visualmente.
```

## 09 — Feedback, áudio e acessibilidade

Dependência: 08. Change: `implement-battle-feedback`.

```text
openspec propose implement-battle-feedback

Planeje o acabamento das seções 10 e 11 do GDD. Integre muzzle flashes, impactos, explosão, debris, fade de naufrágio, +1 e dano visual usando assets verificados. Estados healthy >60%, damaged >25% até 60%, critical ≤25%; use overlays quando não houver variantes compatíveis. Efeitos após morte são somente visuais e não colidem nem pontuam.

Integre sons fornecidos por eventos, ambiente discreto, mute e início após gesto do usuário. Limite vozes e priorize alertas; avisos de pouca vida e dez segundos finais ocorrem por transição de limiar. Pause congela efeitos de gameplay e coordena áudio sem sons atrasados no resume. Respeite reduced motion sem alterar a simulação.

Complete foco visível, contenção/restauração em diálogos, labels e status DOM de saúde, score, segundos e estado. Use live regions para eventos relevantes sem anunciar cada frame ou tiro; diferencie inimigos além da cor.

Critérios: efeitos preservam leitura de tiros e litoral; mute e reduced motion verificáveis; teclado percorre telas e diálogos; cleanup encerra recursos de áudio e efeitos; créditos refletem apenas procedência comprovada.
```

## 10 — Contratos REST, fixtures e MSW persistente

Dependência: 09. Change: `implement-mock-rest-api`.

```text
openspec propose implement-mock-rest-api

Planeje a fronteira de dados das seções 12 e 13 do GDD. Implemente Axios, inicialização MSW em desenvolvimento/teste/build publicado e store persistido de matches confirmados, separado dos dados da partida ativa. Gere identidade local UUID e Captain-XXXX; outros jogadores vêm de fixtures determinísticas.

Contratos: GET /api/ranking?configurationKey=…&page=1&pageSize=10; GET /api/players/:playerId/matches?page=1&pageSize=10; POST /api/matches. Páginas retornam items, page, pageSize e totalItems. Registro contém os campos completos definidos no GDD, UTC e snapshot imutável.

Derive configurationKey de representação canônica de todos os parâmetros que afetam gameplay, mapa e balanceamento; exclua seed, identidade, viewport e preferências de acessibilidade/áudio. Ranking usa configuração idêntica, score decrescente, completedAt crescente e matchId lexicográfico. Cada partida tem uma entrada. POST idempotente retorna o registro existente para payload idêntico e conflito tipado para mesmo ID divergente; ranking/histórico compartilham commit único.

Critérios: contratos e ordenação testados; refresh mantém confirmados; duplicatas não são criadas; MSW pronto antes de requests; falha no serviço não impede Play. Não anuncie backend compartilhado entre navegadores.
```

## 11 — Registro confiável e outbox

Dependência: 10. Change: `implement-result-outbox`.

```text
openspec propose implement-result-outbox

Planeje entrega de resultados segundo as seções 8, 9 e 12 do GDD. Ao finalizar, salve Last Result e uma outbox persistente antes do POST. Envie por mutation TanStack Query via Axios; remova da outbox apenas após confirmação. Retry preserva ID e payload, inclusive após refresh, timeout ou início de outra partida.

Exiba Recording…, Recorded e Pending — Retry; mantenha pendências acessíveis no menu e independentes do resultado atual. Faça backoff limitado para erros transitórios; erro de validação exige explicação sem loop infinito. Trate conflito de payload explicitamente. Respostas antigas não podem alterar o estado visual de uma partida mais recente.

Critérios: resultado preservado offline; abandono não entra na outbox; duas partidas com pendências independentes; timeout após commit recupera registro existente sem duplicata; recuperação após refresh e falha de armazenamento têm tratamento visível e não travam combate.
```

## 12 — Ranking e histórico paginados

Dependência: 11. Change: `implement-ranking-and-history`.

```text
openspec propose implement-ranking-and-history

Planeje abas Ranking e Match History no menu pelas seções 9 e 12 do GDD. Use queries TanStack Query com todas as páginas/filtros/identidade nas chaves, via Axios; dez linhas por página. Ranking mostra grupo de configuração e ordenação definida; histórico lista somente o jogador local com data no locale, score, duração, motivo e configuração.

Implemente loading inicial, vazio, erro com Retry e refresh mantendo linhas atuais. Refetch ao mostrar aba e invalidação de ambas as coleções após registro confirmado. Isole/cancele requests obsoletos para impedir que respostas atrasadas substituam filtro/página atuais. Apresente o filtro para que mudança de configuração não pareça apagar scores.

Critérios: paginação real com múltiplas páginas; mensagens vazias do GDD; falha isolada por aba; registro aparece em ambas; filtros e ordenação reproduzíveis; Play e Options disponíveis durante loading ou falha.
```

## 13 — Cenários reproduzíveis de falha

Dependência: 12. Change: `add-network-scenario-controls`.

```text
openspec propose add-network-scenario-controls

Planeje seletor documentado e reset de cenários MSW da seção 13 do GDD. Cubra sucesso, vazio, múltiplas páginas, latência lenta/variável, respostas fora de ordem, timeout, conexão interrompida, 4xx/5xx, falha isolada por aba, timeout após commit e indisponibilidade ao fim seguida de recuperação. Use seed para fixtures e latência; compartilhe os cenários com os testes.

Separe reset de fixtures do armazenamento de configuração, identidade, Last Result e outbox, com política explícita que preserve pendências por padrão. Reset não pode afetar silenciosamente partida ativa. Documente como reproduzir cada falha e voltar ao estado padrão.

Critérios: cada cenário tem efeito observável; timeout após commit exercita realmente o commit seguido de resposta perdida; recuperação não duplica registros; mudanças de cenário não reiniciam o combate nem apagam resultados sem ação explícita.
```

## 14 — Verificação integrada e regressão visual

Dependência: 13. Change: `validate-game-end-to-end`.

```text
openspec propose validate-game-end-to-end

Planeje a auditoria da seção 14 do GDD e das specs acumuladas. Mapeie cada critério a evidência existente; complete lacunas e corrija regressões. Execute build, lint, typecheck e testes relevantes. Configure Playwright em Chromium desktop e mobile com armazenamento/fixtures isolados e cenários determinísticos.

Cubra opções, loading/retry, mouse/R, Q/W/E simultâneos, multitouch e cancelamento, colisões, ambos os inimigos, cadência segura, pontuação única, finais por tempo/morte, prioridade simultânea, pausa manual/blur/hidden, replay, abandono, Last Result, outbox, paginação e respostas obsoletas. Use relógio de teste para avançar a simulação real sem atribuir kills/score por atalho.

Crie e inspecione baselines de menu, batalha estável com seed e resultado; inclua layouts portrait/landscape e foco quando aplicável. Gere relatório HTML e traces nas falhas. Não atualize baselines automaticamente para encobrir divergências.

Critérios: matriz de aceite rastreável, suíte reproduzível e relatório real; diferencie testes automatizados de inspeções manuais e registre limitações do ambiente. Não declare validado o que não executou.
```

## 15 — Perfil de desempenho e ajustes medidos

Dependência: 14. Change: `profile-and-tune-gameplay`.

```text
openspec propose profile-and-tune-gameplay

Planeje profiling e playtest das seções 14–16 do GDD em build otimizado. Execute partida de três minutos no ambiente de referência e stress adicional com spawn de um segundo. Registre FPS, p95 de intervalo de frame, entidades vivas, hardware, navegador, resolução, seed/configuração e limitações. Analise memória/recursos após cinco ciclos de início/jogo/saída e investigue crescimento sustentado.

Avalie utilidade de front/broadsides, legibilidade portrait, navegação nas ilhas, mortes precoces no touch, tempo até primeiro kill e saturação. Otimize gargalos comprovados. Não introduza cap de inimigos ou altere regras para esconder problemas; mudanças de balanceamento precisam de justificativa, atualização de specs/configuração/versão e validação afetada.

Critérios: medições reais comparáveis antes/depois; meta de 60 FPS avaliada no ambiente documentado, sem garantia universal; evidência de cleanup; propostas ainda não validadas identificadas. Se o ambiente não permitir medição, mantenha esse aceite pendente.
```

## 16 — Documentação e preparação de entrega

Dependência: 15. Change: `prepare-game-release`.

```text
openspec propose prepare-game-release

Planeje a entrega da seção 15 do GDD. Revise README e ARCHITECTURE em inglês com setup limpo, comandos reais, controles, configurações, limites do mock, cenários/reset/falhas, simulação, colisão, React/Pixi, input, lifecycle, persistência, contratos, cache e recuperação da outbox. Finalize créditos com procedência/licenças comprovadas e explicite pendências. Inclua fonte, lockfile, assets, fixtures, mocks, testes e relatórios.

Prepare build e configuração de hospedagem com assets, rotas e worker MSW corretos. Verifique preview de produção, entrada direta e refresh; audite critérios do GDD e specs. Registre correspondência entre versão do código, build e evidências. Não publique durante esta preparação: deixe o pacote pronto e informe bloqueios concretos de entrega.

Critérios: outra pessoa consegue instalar, executar, testar e reproduzir falhas pelo README; preview funciona com MSW; relatório final distingue entregue, validado e pendente. Licença sem comprovação continua pendente e não é presumida.
```

## 17 — Publicação e verificação da versão entregue

Dependência: 16 e destino de hospedagem definido com autorização de publicação. Change: `publish-game-release`.

```text
openspec propose publish-game-release

Planeje a publicação da versão preparada do Pirate Battle no destino autorizado. Inspecione configurações de hospedagem existentes; se destino ou acesso estiverem ausentes, relate precisamente a informação necessária. Mantenha o artefato pronto enquanto isso.

Após aprovação do plano e autorização de publicação, publique a versão identificada e verifique a URL pública: entrada direta, refresh, assets, MSW no build, partida desktop/mobile, registro idempotente, ranking/histórico e recuperação de pendência. Confirme que URL e código entregue correspondem. Documente o caráter local por navegador do mock e os resultados reais da verificação.

Critérios: URL pública funcional vinculada à versão entregue e smoke test registrado. Não encerre como entrega completa apenas com build local ou deploy iniciado; falhas externas permanecem explicitamente pendentes.
```

## Mapa de cobertura

| Seções do GDD | Incrementos principais |
| --- | --- |
| 1–3: autoridade, escopo e experiência | Contexto comum, 01, 06 |
| 4–5: controles, arena e colisão | 02, 03, 08 |
| 6–7: combate, inimigos e spawn | 04, 05 |
| 8–9: ciclo, telas e persistência | 06, 07, 11, 12 |
| 10–11: responsividade, acessibilidade e assets | 02, 08, 09 |
| 12–13: dados e fronteiras técnicas | 01, 10–13 |
| 14: validação e desempenho | Validação incremental, 14, 15 |
| 15–16: entrega, playtest e decisões restantes | 15–17 |

A primeira partida desktop completa aparece no incremento 06; o controle mobile e HUD ficam completos no 08; a entrega de dados se completa no 13. A conclusão do jogo exige também validação, profiling, documentação e publicação verificadas nos incrementos 14–17.
