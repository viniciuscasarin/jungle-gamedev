# Tasks

## 1. Contratos, configuração e compatibilidade histórica

- [x] 1.1 Introduzir tipos puros de descritor procedural, região, modelo e ilha gerada com coordenadas assinadas e readonly profundo, preservando os contratos de input e eventos; verificar em `tests/contracts.test.ts` e no typecheck do core que os dados funcionam sem DOM e rejeitam mutações.
- [x] 1.2 Separar schema finito histórico da configuração atual e aceitar os formatos persistidos por validação explícita, sem completar valores com defaults; verificar fixtures literais anteriores em `tests/config.test.ts` e testes de resultados válidos, adulterados e coordenadas assinadas.
- [x] 1.3 Adaptar resultado, armazenamento e contratos de API/outbox ao formato de configuração versionado sem mudar o envelope REST; verificar Last Result, ranking, histórico e reenvio de item pendente legado nos testes existentes de lifecycle, outbox e rankingHistory.
- [x] 1.4 Definir constantes autoritativas de região, catálogo, espaçamentos, folgas e faixa de spawn, mantendo seed e caches fora da chave; verificar equivalência canônica, diferença entre versões e ausência de crescimento do resultado após consultas de terreno.
- [x] 1.5 Documentar em `ARCHITECTURE.md` os schemas ativo/histórico, coordenadas assinadas e composição da chave; verificar correspondência com as fixtures anteriores e os contratos novos, preservando opções de 60–180s e padrão de 120s.

## 2. Catálogo de ilhas e geração por regiões

- [x] 2.1 Criar modelos compactos, alongados e largos com contornos convexos e identificadores semânticos, usando dimensões e rotações aprovadas compatíveis com tiles de 40 unidades; verificar convexidade, dimensões e alinhamento previsto de cada modelo antes de aprovar o catálogo.
- [x] 2.2 Criar layouts regionais com duas a quatro ilhas, pares de espaçamento e alvos iniciais de 160/280/440 unidades com tolerância de 1 unidade; verificar exaustivamente os layouts e combinações permitidas por distância entre polígonos, não centros ou envelopes.
- [x] 2.3 Validar margens comuns de 80 unidades, conectividade de água e folga de manobra para todos os cascos; verificar vizinhos ortogonais/diagonais, rotas internas e contorno de cada modelo, rejeitando configuração ou catálogo incompatível antes de jogar.
- [x] 2.4 Implementar seleção pura por versão, seed e coordenadas com propriedade única das ilhas e variantes iniciais seguras; verificar seeds 0 e uint32 máxima, diversidade dos três modelos, fronteiras exatas, índices negativos, IDs estáveis, ordens de consulta e início em (480,270) com água livre de raio 160.
- [x] 2.5 Atualizar `GDD.md` e `ARCHITECTURE.md` com catálogo, layouts, medição entre litorais, margens e distinção entre pares designados e ilhas de regiões distintas; verificar que os valores aparecem como hipóteses iniciais de calibração e que as garantias coincidem com os testes geométricos.

## 3. Consultas de terreno, colisão e projéteis

- [x] 3.1 Introduzir serviço de terreno por sessão com consulta por região/AABB e cache ocioso limitado inicialmente a 8 regiões; verificar reconstrução idêntica, imutabilidade de dados anteriores, ausência de efeitos de gameplay e descarte de recursos no encerramento do executor.
- [x] 3.2 Adaptar validade e movimento de casco para consultar todos os sólidos da varredura expandida pelo raio, removendo paredes finitas do fluxo procedural; verificar contatos frontais, tangenciais e separação em fronteiras, coordenadas negativas e regiões frias nos testes de navegação/colisão.
- [x] 3.3 Adaptar emissão e varredura de projéteis ao terreno procedural, incluindo o segmento entre canhão e origem externa; verificar primeiro impacto, empate sólido/casco, alvo protegido, lifetime parcial, tiro em região fria e travessia de fronteiras sem consumo indevido em `tests/combat.test.ts`.
- [x] 3.4 Integrar consultas de terreno ao estado autoritativo sem acrescentar regiões visitadas à configuração ou snapshots de combate; verificar que consultas extras e evicções não alteram snapshots, eventos, RNG de inimigos ou resultado de execuções equivalentes.
- [x] 3.5 Documentar em `ARCHITECTURE.md` propriedade da sessão, broad phase, AABB de varredura e garantias de cache miss; verificar que a documentação explica como consultar terreno antes de qualquer interação e como liberar os recursos ao sair.

## 4. Navegação regional, IA e spawn

- [x] 4.1 Substituir a malha global por conexões de corredores regionais e A* local com endpoints reais e atalhos seguros; verificar rotas nos dois sentidos entre regiões, caminhos ao redor dos três modelos, raios distintos e progresso quando o player muda de região em `tests/enemies.test.ts`.
- [x] 4.2 Remover retenção global de grafos e introduzir cache local por preparação, região e raio, com capacidade ociosa inicial de 8 entradas; verificar determinismo com cache frio/quente, evicção e ausência de grafos retidos entre partidas.
- [x] 4.3 Adaptar diretor para candidatos na faixa de 240–520 unidades ao redor do player com RNG independente do terreno; verificar cadência 3s/6s, materialização 3,6s/6,6s, alternância por sucesso, 64 tentativas, consultas extras, viewports diferentes e player distante da origem.
- [x] 4.4 Revalidar faixa, terreno, ocupação e rota após 600ms ativos de reserva, incluindo região diferente e pausa; verificar cancelamento sem reposição imediata, sem backlog e sem avanço durante ausência ou estado terminal.
- [x] 4.5 Preservar IA, dano, score, entidades e projéteis fora da tela, sem despawn ou cap adicional; verificar reencontro com mesmo ID/saúde/cooldown e combate oculto com resultado idêntico ao de um consumidor sem renderer.
- [x] 4.6 Documentar em `GDD.md` e `ARCHITECTURE.md` rotas locais, conectividade regional, nova faixa de spawn e continuidade fora da tela; verificar correspondência com parâmetros capturados e conservação das regras de armas, giro, saúde e pontuação.

## 5. Câmera, mouse e HUD

- [x] 5.1 Trocar enquadramento integral por transformação de câmera com escala uniforme de preenchimento e âncora na área central livre do HUD; verificar ida/volta mundo-tela, coordenadas assinadas, host deslocado, DPR, área zero e ausência de letterbox em `tests/viewport.test.ts`.
- [x] 5.2 Adaptar mouse para direção relativa ao player apresentado, mantendo dead zone lógica de 12 unidades e suporte a alvos explícitos no core; verificar ponteiro parado com auto-sail/câmera em movimento, saída do canvas e conservação do comando após resize/DPR em `tests/navigation.test.ts`.
- [x] 5.3 Integrar acompanhamento imediato e reapresentação ao loop existente sem agendar outro loop; verificar pausa, Resume, término, desmontagem, troca de modo e resize sem alteração autoritativa, input preso ou reapresentação de eventos consumidos.
- [x] 5.4 Ajustar estilos e medição do HUD para cenário sob os grupos, preservando hitboxes, contraste, área central, safe areas e ordem de foco; verificar desktop estreito, mobile landscape em 844×390 e 568×320 e grupo compacto sem rolagem horizontal.
- [x] 5.5 Preservar proteção portrait mobile e retorno em Paused até Resume, incluindo inicialização tardia; verificar E2E de orientação/foco com posição, saúde, tempo, seed e cooldowns conservados antes de novo input.
- [x] 5.6 Atualizar `README.md` e `ARCHITECTURE.md` com câmera, steering e comportamento de resize/orientação; verificar instruções contra os controles reais e a transformação usada em apresentação e input.

## 6. Apresentação regional e diagnóstico visual

- [x] 6.1 Compor cada modelo com os tiles existentes, água contínua e decoração sem novos sólidos, cobrindo o host com fase de textura vinculada ao mundo; verificar inspeção visual dos três modelos e alinhamento de costa/colisor em geometry=1, corrigindo catálogo ou composição quando necessário.
- [x] 6.2 Montar sprites das regiões visíveis mais margem de uma região e liberar nós distantes sem destruir texturas compartilhadas; verificar travessia, revisita e troca rápida de câmera com zero buracos, ilhas duplicadas ou nós acumulados.
- [x] 6.3 Adaptar barras, efeitos, telegraphs e culling para a câmera, mantendo entidades fora da tela no core; verificar barras horizontais contidas, avisos pelo tempo autoritativo e efeitos congelados durante pausa nos testes de render/HUD e E2E de battle-feedback.
- [x] 6.4 Atualizar diagnóstico somente leitura com região, posição assinada, contornos e limites de câmera; verificar que fronteiras informativas não têm colisão e que não surgem setters de teleporte, dano ou pontuação.
- [x] 6.5 Atualizar `ASSET_CREDITS.md` e geometria documentada em `ARCHITECTURE.md`; verificar inventário de tiles utilizados, proporções, tolerância real de costa e ausência de dependências ou assets novos.

## 7. Integração, desempenho e aceitação

- [x] 7.1 Adicionar percurso headless de consultas por pelo menos 20 regiões com evicção e retorno, incluindo terrain/grafos/renderer quando aplicável; verificar contagens dentro da capacidade ociosa mais recursos estritamente requeridos e conteúdo idêntico após reconstrução.
- [ ] 7.2 Ampliar benchmark e profiler existentes para sessão de 180s em deslocamento com spawn de 3s e 1s e cinco ciclos com exploração; verificar orçamentos vigentes de CPU/quadros, liberação completa e métricas de geração, rotas, regiões, grafos, sprites e heap, registrando ambiente e limitações efetivamente medidos.
- [x] 7.3 Exercitar percurso E2E com mouse e touch reais através de regiões e das coordenadas da arena antiga, contornando modelos e mantendo combate; verificar cenário preenchendo a tela, passagens, continuidade e término único pelo tempo capturado ou morte, sem teleporte por inspeção.
- [x] 7.4 Executar `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test` e `npm.cmd run build` no runtime de referência; verificar sucesso e ausência de alteração nas opções de sessão, dano, score e fluxos de resultado/outbox históricos.
- [x] 7.5 Executar E2E relevante em dev e preview e revisar snapshots afetados de arena/HUD, conservando cobertura de menu, loader, resultado e orientação; verificar ausência de novos canvas/listeners e atualizar somente imagens cuja diferença é explicada pela mudança.
- [x] 7.6 Registrar relatório de aceitação com seeds, percursos, dispositivos, métricas e valores finais de calibração, atualizando versões se parâmetros de gameplay mudarem; verificar rastreabilidade com specs e documentação e distinguir resultados executados de critérios ainda não atendidos.

## Workflow follow-up

- Antes de sincronizar deltas, conciliar com a change concluída `add-startup-loader-and-mobile-landscape`, integrando suas alterações documentais primeiro quando autorizado; esta change remove depois a visão integral preservando landscape e proteção portrait.
- Revisar e arquivar somente após a implementação e sua validação; publicação continua fora do escopo desta change.

## Validation note

7.2 permanece aberta: CPU, métricas e cinco ciclos passaram; a referência sincronizada mediu 59,9122 FPS, p95 17ms e um intervalo >33,3ms. Os limites vigentes exigem >=60 FPS e zero desses intervalos. Evidências e limitações em `project/automation-reports/infinite-world/acceptance.md`; nenhuma exceção foi aceita.

Retomada de 2026-10-30: removido trabalho repetido de apresentação e criada inspeção compacta para profiling; a nova tentativa não completou 180s ativos e registrou intervalos severos. 7.2 continua aberta; detalhes e controle WebGL sem jogo constam no relatório de aceitação, sem revisão dos critérios.

Validação alternativa de 2026-10-30: por escolha do usuário, critérios preservados. Edge/Chromium na mesma máquina também reprovou (876 intervalos severos, sessão incompleta). 7.2 permanece aberta; falta indicar/acessar outra máquina ou runner com GPU. Evidências no relatório de aceitação.
