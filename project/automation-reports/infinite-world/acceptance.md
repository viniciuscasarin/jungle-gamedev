# Acceptance report

Data: 2026-10-30. Change: add-infinite-procedural-world. Estado: implementação funcional verificada; 37/38 tarefas concluídas. A tarefa 7.2 permanece aberta porque os limites normativos de quadros não foram integralmente atendidos. Este relatório não aprova uma exceção.

## Scope

Oceano ocean-v1 / archipelago-v1, balance-v1. Terreno, colisão, projéteis, navegação e spawns usam a mesma configuração capturada. Câmera imediata preenche o host; mouse armazena direção relativa ao player. Entidades fora da tela continuam no core. Configurações finitas históricas permanecem legíveis sem migração destrutiva, sob suas próprias chaves. Não houve sincronização/arquivamento de specs, publicação, dependências ou assets novos.

## Calibration

| Parâmetro | Valor aprovado nesta implementação |
| --- | --- |
| Região | 1280×1280 unidades, índices assinados por floor |
| Tiles / modelos | 40×40; compact 160×120, elongated 160×280, wide 320×120 |
| Rotações aprovadas / usadas nos layouts | 0/90/180/270° / 0/90° |
| Layouts | 66, com duas a quatro ilhas; 54 pares e 12 variantes superiores |
| Pares designados | 160 / 280 / 440 entre litorais, tolerância 1 unidade |
| Outros pares / vizinhos | Mínimo 160; margem de água 80 por borda |
| Folga / água inicial | Manobra 40; disco livre de raio 160 em (480,270) |
| Spawn | Faixa 240–520 do player, 64 tentativas, aviso 600ms ativos |
| Retenção | Terreno exigido pelas ações + até 8 regiões ociosas; até 8 grafos locais; visual visível + uma região |
| Sessão / armas / navios | 120s padrão, opções 60–180s; velocidades, giro, saúde, armas, dano e score conservados |

A água fornecida tem alpha 255 em todos os pixels. A apresentação usa contexto opaco sem MSAA e água sem blending; sprites mantêm alpha e interpolação. Isso eliminou custo redundante do fundo sem alterar sólidos ou gameplay.

Os números de terreno são hipóteses técnicas iniciais de calibração, sem alegação de balanceamento por playtest. ocean-v1 e archipelago-v1 identificam as novas regras; balance-v1 conserva os parâmetros de combate anteriores.

## Geometry and determinism

measure-shoreline.py recompõe os tiles reais e mede a máscara RGB da areia contra os contornos. Nos três modelos: costa→contorno máximo 1,875 e contorno→costa máximo 1,901 unidades; limite documentado 4. Os overlays compact/elongated/wide-shoreline.png permitem inspeção. Rotações rígidas conservam a medição. Validação rejeita catálogo sem correspondência com os moldes visuais aprovados.

Testes verificam os 66 layouts, convexidade, margens, espaçamentos entre polígonos, disco inicial, modelos, coordenadas negativas, fronteiras exatas, IDs únicos, sementes 0 e 4294967295, ordens de consulta, evicção e reconstrução. Obstáculos convexos inflados ficam disjuntos e interiores; o corredor externo conecta a água e fornece manobra para todos os cascos. Rotas/steering contornam as três famílias nos dois sentidos. Consultas extras não alteram snapshots, eventos, RNG ou tamanho da configuração/resultado.

A travessia headless de 20 regiões inclui terreno, grafos e apresentação regional, retorno após evicção, troca rápida de câmera e liberação. Um teste mantém 20 regiões exigidas + 8 ociosas e confirma retorno a 8 quando cessa a necessidade. Caches pertencem à sessão; não há grafos globais.

Seeds de circunavegação visual: compact=3 (compact-compact-0-160), elongated=0 (elongated-compact-0-280), wide=4 (wide-wide-0-160), conforme island-family-seeds.json. E2E combina as três famílias, dev/preview e projetos desktop/mobile. A travessia com mouse passa x=2560 e retorna a coordenadas negativas; touch CDP em 568×320 ultrapassa a mesma fronteira. Os benchmarks percorrem até x≈27229 e y<0, cruzando mais de 20 regiões com tiros contínuos.

## Compatibility

Fixtures literais finite-arena-v2.json e finite-result-v2.json preservam o schema e a chave canônica anterior. Cobertura: Last Result sem escrita no storage; rejeição de dados incompletos/adulterados; reidratação de outbox pendente, despacho real pelo mock REST, consumo da entrada confirmada, ranking e histórico. Play Again usa opções atuais e configuração procedural. O envelope REST não mudou.

## Verification

- Typecheck, incluindo core sem DOM: aprovado; repetido após os ajustes finais de E2E (checks-closeout.json).
- ESLint: aprovado; repetido no fechamento.
- Suíte completa: 400 testes aprovados em 34 arquivos (unit-tests.log); typecheck, lint e build com código de saída 0 em checks.json.
- Abertura, Retry, orientação e feedback: 34 E2E aprovados em dev/preview.
- Percurso com mouse real, combate, duas regiões, coordenadas negativas, pausa e resize: aprovado em dev/preview.
- Circunavegação real dos três modelos: aprovada em desktop/mobile e dev/preview.
- Touch real por CDP, 568×320, passagem dos limites antigos e regionais: aprovado em dev/preview e desktop/mobile.
- Foco, spawn, HUD, dano real e safe areas: seis E2E aprovados em desktop/mobile após atualização das asserções para a câmera.
- Snapshots de menu, Options e Result: aprovados e preservados. Somente duas referências de batalha/HUD foram atualizadas e inspecionadas: desktop pausado e mobile landscape. A câmera seguindo o player, o oceano e os grupos locais de HUD explicam as diferenças (snapshot-review.json).
- Perfis de 180s por software: ambos aprovados no mínimo de 30 FPS do harness SwiftShader. Isso não comprova a meta normativa de hardware (60 FPS, p95<20ms e zero intervalos >33,3ms).
- Fechamento sequencial: e2e-final.json registra 26 aprovados, 8 skips específicos de projeto e duas falhas do matcher de loader que ainda assumia a porta 5173. O matcher foi corrigido para APP_ORIGINS[0]; e2e-closeout.json registra seis aprovados, incluindo os quatro casos de loader e a auditoria de cinco ciclos. As falhas anteriores continuam disponíveis como evidência, sem serem contadas como sucesso.

Os E2E usam portas dedicadas 6173 (dev) / 6174 (preview) via PLAYWRIGHT_DEV_PORT e PLAYWRIGHT_PREVIEW_PORT; os defaults 5173/4173 continuam disponíveis. PLAYWRIGHT_BROWSERS_PATH aponta para o Chromium já instalado. O launcher local de Node exigia chamada do runtime 26.11.1 diretamente; nenhum runtime/dependência foi instalado.

## Performance

Ver benchmark-3000.json e benchmark-1000.json para medições headless de 10800 passos e 180000ms ativos, com seed 42, tiros e deslocamento além de 20 regiões. Ambos encerram pelo tempo, preservam inimigos ocultos, liberam terreno/grafos e respeitam o orçamento de CPU vigente.

| Headless, seed 42 | Média CPU/passo | p95 CPU/passo | Pico entidades | Gerações | Pico regiões |
| --- | --- | --- | --- | --- | --- |
| Spawn 3s | 0,235768ms | 0,5834ms | 56 | 65 | 25 |
| Spawn 1s | 0,625756ms | 1,2646ms | 133 | 59 | 30 |

Ambiente medido: Windows 10.0.26300, Ryzen 5 5600G, 12 processadores lógicos, Node 26.11.1 / npm 11.20.0, Chromium 156.0.8078.4, viewport 1280×900. Todos os perfis longos encerraram uma única vez por time_expired com 180000ms ativos e seed 42; a janela de amostragem após o input inicial durou aproximadamente 178s. O profiler registra intervalos reais de requestAnimationFrame, sem relógio de frames artificial. Recursos de partida são liberados ao retornar ao menu.

| Browser, spawn | FPS médio | p95 intervalo | p95 CPU render | Intervalos >33,3ms | Resultado normativo |
| --- | --- | --- | --- | --- | --- |
| SwiftShader, 3s | 35,1209 | 33,4ms | 0,9ms | Não usado como referência hardware | Não comprovado |
| SwiftShader, 1s | 33,8114 | 33,4ms | 0,9ms | Não usado como referência hardware | Não comprovado |
| AMD D3D11 sincronizado, 3s | 59,9122 | 17ms | 0,9ms | 1 | Reprovado |
| AMD D3D11 sem limite, 3s | 1028,1390 | 1,8ms | 0,9ms | 79 | Reprovado |
| AMD D3D11 sem limite, 1s | 891,8471 | 2ms | 0,6ms | 1 | Reprovado |

A referência sincronizada usa PLAYWRIGHT_HARDWARE_GPU=capped, --enable-gpu e --use-angle=d3d11. A amostra sem limite usa PLAYWRIGHT_HARDWARE_GPU=1 e acrescenta --disable-frame-rate-limit / --disable-gpu-vsync: mede capacidade sem sincronização, não representa a apresentação normal. O navegador completo foi executado fora do sandbox com autorização automática, em perfil temporário isolado, para permitir a GPU AMD. O harness padrão usa SwiftShader dentro do sandbox. Ver hardware-probe-native.json, browser-profile-3000.json e os arquivos browser-profile-hardware-uncapped-*.json / browser-profile-software-*.json.

A especificação vigente exige >=60,0 FPS, p95<20ms e zero intervalos >33,3ms. Nenhuma amostra de hardware atende os três critérios simultaneamente. A causa dos intervalos isolados não foi demonstrada; não são atribuídos automaticamente ao jogo ou ao ambiente. O perfil sincronizado de stress não foi repetido após essa reprovação. Por isso 7.2 continua pendente; aceitar taxa nominal próxima de 60 por si só não resolveria o intervalo severo. Os demais subcritérios de CPU, métricas, liberação e cinco ciclos foram executados e passaram.

A primeira medição expôs regeneração excessiva ao reter apenas oito regiões totais. A correção conserva regiões requeridas pelas entidades/rotas + oito ociosas. A broad phase espacial mantém a ordem das verificações e reduz pares distantes, sem cap/despawn ou alteração de dano/score. Workers de testes são serializados para não contaminar a medição de CPU por passo com carga de outros arquivos.

Cinco ciclos com exploração: zero aplicações/recursos/listeners de partida e nenhum canvas após sair. Na repetição final (memory-five-cycles.json), nós DOM estáveis em 318; heap após GC de 11,01 / 11,51 / 11,86 / 12,80 / 12,42 MiB, variação final de 1,41 MiB e máxima de 1,79 MiB, dentro do orçamento vigente de 5 MB. Cada ciclo navegou de x=480 para além de x=1500 com input real e preservou zero recursos após sair. Essa amostra inclui aquecimento do navegador e não demonstra heap perfeitamente plano nem substitui medição prolongada em aparelho físico.

## Traceability

- Descritor/versionamento e compatibilidade: src/domain/config.ts, historicalFiniteConfig.ts e validation.ts; testes config/lifecycle/outbox/contracts e fixtures literais.
- Geração, catálogo, topologia e consultas: src/simulation/world/ e proceduralWorld.test.ts; shoreline-measurements.json e overlays medem a tolerância visual.
- Colisão, combate, rotas, IA e spawns: src/simulation/{collision,combat,navigation,enemies,director,engine}.ts; testes combat/navigation/enemies e percurso headless.
- Câmera, streaming visual, input e HUD: src/render/, src/input/desktop.ts e src/ui/styles.css; viewport/touch, procedural-world E2E, orientação e snapshots.
- Orçamentos e ciclo de vida: simulation-benchmark.test.ts e performance-profile.spec.ts; JSONs acima. A pendência corresponde a openspec/specs/performance-budgets/spec.md, sem alteração silenciosa dos critérios.
- Valores e arquitetura finais: README.md, GDD.md, ARCHITECTURE.md e ASSET_CREDITS.md. Nenhum parâmetro de combate foi alterado; balance-v1 permanece vigente.

## Limits and workflow

Chromium headless e touch por CDP não comprovam comportamento de hardware mobile, entalhes físicos ou APIs de bloqueio de orientação em todos os navegadores. Insets seguros são controlados por CSS. Neste runtime headless, a troca nativa de aba não emitiu window.blur; o E2E registra a emulação do evento de plataforma como fallback, sem comandos/setters de simulação. Rotação, input, foco DOM e ações de teclado/touch são exercitados pelos controles reais.

Rodadas iniciais simultâneas de navegador interferiram em servidores/foco; a aceitação usa rodadas sequenciais em servidores dedicados. Falhas intermediárias de execução não foram classificadas como critérios aprovados. A medição de costa usa os PNGs fornecidos e mantém os erros reais documentados.

Antes de sincronizar deltas, integrar e conciliar a change concluída add-startup-loader-and-mobile-landscape na ordem prevista. Esta aplicação não arquiva aquela change, não sincroniza specs e não publica o jogo.

Os arquivos de trace intermediários foram removidos após a análise para reduzir o volume dos artefatos. Logs, métricas JSON, contextos de falha e capturas relevantes foram preservados.

## Resumed implementation — 2026-10-30

A retomada preservou os critérios da tarefa 7.2. O renderer passou a reconciliar objetos somente quando muda o snapshot imutável, layout ou modo de input; efeitos e renderização continuam a cada RAF. O streaming visual evita refazer os conjuntos de proprietários enquanto permanece no mesmo intervalo regional. O profiler usa uma projeção somente leitura sem o catálogo capturado, reduzindo cópias da própria medição. Nenhuma regra de combate, relógio de simulação ou filtro de intervalos foi alterado.

Typecheck, lint, build e 29 testes direcionados passaram após esses ajustes. A repetição funcional e2e-resume-functional.json/log registrou 23 aprovados, dois skips por projeto e uma falha de carregamento do snapshot desktop. O trace confirmou HTTP 404 na página inicial enquanto o build era reconstruído; a repetição isolada com build estável passou em 6,9s (e2e-resume-snapshot-retry.json/log). Assim, os 24 casos executáveis passaram ao final, preservando a falha inicial e sem atualizar snapshots. A inspeção compacta foi verificada contra a completa, com igualdade de snapshot, ausência de setup e imutabilidade profunda. A suíte anterior de 400 testes permanece identificada como a execução completa anterior, não uma nova execução completa nesta retomada.

O perfil AMD D3D11 sem limite de FPS, spawn 3s, reprovou: 490,0416 FPS médios, p95 2,1ms, p95 CPU render 0,7ms e 843 intervalos >33,3ms. A janela de segurança de 195000,9ms terminou com 157266,7ms ativos e sem resultado terminal; portanto não foi uma sessão completa de 180s e não atende a aceitação. O regime de stress foi interrompido após essa reprovação e não tem resultado de aceitação nesta rodada. Ver browser-profile-resume-3000.json, e2e-resume-hardware.log e resume-attempt-summary.json. Os aliases browser-profile-3000/1000.json conservam as amostras anteriores; a nova tentativa usa o nome explícito resume.

Um controle de 15s com canvas WebGL vazio, mesma GPU/flags/viewport e sem jogo, registrou um intervalo >33,3ms (resume-environment-probe.json). Esse controle demonstra que o ambiente também pode produzir um intervalo severo, mas não demonstra a causa das 843 quedas do jogo. Não houve melhora comprovada no orçamento de quadros; nenhuma amostra reprovada foi descartada como ruído nem usada para marcar a tarefa.

A tarefa 7.2 continua aberta. O diagnóstico adicional requer decidir a próxima referência de validação ou revisar formalmente os critérios antes de aceitar qualquer exceção. Esta retomada não sincronizou, arquivou ou publicou a change.

Esta retomada usou portas dedicadas 6273 (dev) e 6274 (preview). As travessias com mouse e touch, coordenadas negativas, pausa/resize, foco, multitouch com dano/score, HUD, áudio, reduced-motion e snapshots desktop/mobile passaram nos respectivos projetos. Os servidores temporários foram encerrados após a validação.

## Alternative browser validation — 2026-10-30

O usuário escolheu validar outra referência mantendo os critérios vigentes. Foi testado o Microsoft Edge 156.0.4314.50, baseado em Chromium, usando perfil temporário isolado, GPU AMD Radeon/D3D11 e o mesmo Windows/Ryzen 5600G. Trata-se de outro navegador na mesma máquina, não de hardware independente. O único host acessível nesta execução é o local; foi solicitada indicação de outra máquina ou runner com GPU para continuar essa opção.

O build de produção permaneceu estável, sem reconstrução ou outras suítes em paralelo. Seu index.html teve SHA-256 C9ABDE90D5A766ED44AB402337CC8533375A78F0CC18AAC14E395DEDA426E035. Foram usadas portas dedicadas 6373/6374. Nenhum código da aplicação, limiar de aprovação ou regra de gameplay foi alterado nesta rodada. A GPU foi executada fora do sandbox com autorização automática, em processo temporário isolado. O modo sem limite de FPS conservou os mesmos flags já documentados; sua medição representa capacidade sem sincronização com a tela.

Controle sem jogo: 30,047s de canvas WebGL vazio, 4964,8466 FPS médios, p95 0,4ms, 31 intervalos >33,3ms e máximo 238,3ms. Ver edge-environment-probe.json. O controle evidencia instabilidade possível sem jogo, mas não identifica a causa das quedas da aplicação.

Sessão seed 42 / spawn 3s: 468,5558 FPS médios, p95 2,1ms, p95 CPU render 0,4ms, 876 intervalos >33,3ms e máximo 680,5ms. Após 195115,9ms de relógio, a última amostra tinha 132916,7ms ativos e não havia resultado terminal. O teste reprovou por não completar a sessão de 180s; os intervalos severos também violam o orçamento. Picos: 44 entidades, 22 regiões, 961 sprites. O caso de stress e os cinco ciclos não foram repetidos no Edge após a reprovação da referência normal; não se alega aprovação deles nesse navegador.

Evidências: edge-environment.json, browser-profile-edge-3000.json, edge-attempt-summary.json e e2e-edge-reference.json/log. O campo hardwareReference do JSON identifica GPU física detectada, não aprovação da referência. Os aliases antigos foram preservados. Nenhuma falha foi descartada ou tratada como exceção. Os servidores temporários foram encerrados.

Resultado: 37/38 tarefas, com 7.2 aberta. Os limites >=60,0 FPS, p95<20ms e zero intervalos >33,3ms permanecem intactos. Para avançar com a escolha do usuário, falta acesso/indicação de uma máquina ou runner com GPU diferente; trocar apenas o navegador nesta máquina não resolveu a reprovação.

## Archive authorization — 2026-10-30

Após ciência da pendência de desempenho, o usuário solicitou arquivar a change e criar o commit. O encerramento administrativo conserva 37/38 tarefas, a 7.2 aberta e todos os critérios de desempenho. Isso não converte a medição em aprovação. Saídas brutas em subdiretórios permanecem locais; métricas, resumos, logs e overlays de nível raiz acompanham o commit.

## Archive result — 2026-10-30

Arquivada em `openspec/changes/archive/2026-10-30-add-infinite-procedural-world`, por autorização explícita do usuário, com 37/38 tarefas e a 7.2 aberta. As specs principais foram sincronizadas inline em ordem: loader/landscape e depois mundo procedural. O comando de arquivo usou --skip-specs para evitar repetir a sincronização já concluída; esse flag não significa ausência de sync. Todas as dez capabilities do delta procedural foram comparadas após a mesclagem. Validação: 25 specs aprovadas, nenhum erro e um aviso de texto longo no shell. Loader/landscape permanece ativa com nota da precedência.
