# Design

## Context

Ver motivação em `proposal.md`. Os incrementos 01–05 estão arquivados; existem dez capabilities principais. A engine já recebe configuração/seed imutáveis e dados iniciais opcionais, publica snapshots readonly, executa combate atômico e usa IA/diretor determinísticos. O contrato prevê `completed`, `ended` e `pausePressed`, mas a engine não termina; `freeze()` atualmente pode converter até um terminal em paused. O loop já limpa acumulador, baseline e input na pausa e cancela RAF.

`App.tsx` organiza uma tentativa de arena sem sessão ou storage. O renderer prepara `DEFAULT_CONFIG`/seed 0 e usa defaults também em mapa, raios e diagnósticos. `CompletedMatchResult` existe, mas sua materialização não valida um JSON desconhecido completo nem calcula chave canônica. Owner/cache/loading já isolam inicializações tardias e Strict Mode; preservar esse investimento. Não há dependência remota necessária ao ciclo.

## Goals / Non-Goals

**Goals:** manter regras e término reproduzíveis fora do navegador; garantir que a sessão produza somente um resultado e que replay tenha isolamento real; reutilizar ownership e cache existentes; tornar estado, foco e persistência honestos e testáveis.

**Non-Goals:** implementar efeitos novos para demonstrar congelamento, criar um framework de estados ou de storage, construir Options antecipadamente, reescrever IA/colisões, adicionar setters de testes, integrar rede ou mover main specs nesta fase. Valores de balanceamento e a reconciliação anterior de spawns 3,6/6,6s permanecem válidos.

## Decisions

### 1. Fronteira explícita de sessão

Adicionar um módulo pequeno de sessão entre React/adapters e domínio, com preparação imutável contendo `matchId`, identidade local e `MatchSetup`. Play e Play Again leem opções salvas atuais, constroem a configuração atual completa, geram ID/seed e capturam tudo antes de Loading. A identidade persistente mantém UUID e nome legível; geração de ID, seed e data UTC fica em adapters injetáveis, nunca na engine. Retry conserva a preparação lógica, usando somente nova geração de carregamento. Replay cria outra preparação e outra engine.

Na conclusão a engine entrega fatos puros: motivo, score, passo e tempo ativo. A sessão combina esses fatos com a preparação capturada e `completedAt` fornecido uma vez pela fronteira, materializa resultado profundamente imutável e tenta salvar antes de mostrá-lo como salvo. Um latch por matchId impede callback duplicado; resultados ou callbacks de gerações antigas não mudam uma tela mais nova. Alternativa rejeitada: geração de metadados na engine ou em renders React, que misturaria regras com relógio/global e Strict Mode.

### 2. Estados com ownership previsível

Representar Menu/Loading/Playing/Paused/Result como união discriminada ou reducer pequeno. Erro recuperável pertence a Loading; confirmação de abandono pertence a Paused; consultar Last Result usa Result sem arena. A arena pertence somente à sessão atual e pode conservar a cena congelada enquanto o resultado imediato é apresentado; seu avanço termina de qualquer modo. Ao sair ou iniciar replay, owner e tentativa são descartados antes de uma nova montagem assumir o host.

Transições: Play → Loading → Playing; Playing → Paused por ação manual/blur/hidden; Paused → Playing somente por Resume; Playing/Paused → confirmação via Main Menu; Keep Playing → Paused; Abandon → Menu sem conclusão; Playing → Result por término; Result → Loading por Play Again ou → Menu. Sair de Loading cancela diretamente. `Keep Playing` significa conservar a sessão, não retomar: a escolha de retornar a Paused com foco Resume evita movimento inesperado e segue a exigência de retomada explícita do GDD. Escape em confirmação pode equivaler a Keep Playing; Escape/P no diálogo de pausa não retomam. Bloquear hotkeys de gameplay nos diálogos.

Alternativa rejeitada: inferir sessão ativa a partir da presença do canvas ou reutilizar o objeto terminal via reset parcial. Isso deixa identidades, deadlines, RNG e callbacks difíceis de isolar.

### 3. Fronteira atômica do último passo

O relógio usa o índice de passos executados e `fixedStepMs`; opções válidas de 60–180 segundos inteiros são compatíveis com 1/60s. Comparar limites com epsilon documentado para evitar um passo extra por arredondamento; expor duração terminal limitada exatamente ao limite configurado no final por tempo e restante sem valores negativos. Não acelerar catch-up nem contar segundos descartados.

Preservar as fases de colisão existentes: resolver **todas** as balas já existentes com ordem estável e transições atômicas, depois movimento/contatos válidos do passo enquanto o player estiver vivo. Avaliar então morte antes de tempo, antes de novas emissões do player/Shooter, agenda ou materialização do diretor. Se letal por projétil, não executar movimento/contato posterior; se contato letal coincide com o limite, morte também prevalece. Nunca sair no meio da coleção de balas por causa da morte do player: a regressão `ignores allies…clamps health atomically` deve continuar produzindo score 2 nesse passo.

Ao terminar, marcar completed, desligar auto-sail, impedir reservas futuras e acrescentar **um** `ended` ao final da coleção, após dano/destruição/score. Conservar os fatos finais em snapshot/result; não atualizar entidades nem efeitos depois da fronteira. `step`, `freeze`, `resume`, blur e hidden não reabrem completed. Um novo `step` inerte não publica novos eventos; a referência de eventos guardada por um consumidor continua imutável.

Alternativas rejeitadas: terminar imediatamente dentro do primeiro callback de dano (perde impactos válidos/score do mesmo passo), ou esperar o frame seguinte (permite emissões/spawns indevidos). Término por tempo ocorre após as colisões e contatos do último passo ativo, sem criar ações novas na fronteira expirada.

### 4. Entrega de eventos e parada do loop

Estender `createNavigationLoop` para entregar os eventos de cada passo explicitamente, antes de passar ao próximo callback do acumulador, com identificação de passo e guarda de terminal. Isso preserva eventos quando um frame contém vários passos. Consumir conclusão pela execução do passo, jamais dentro de `present`, `resize` ou assinatura de status. Mesmo que o acumulador invoque callbacks adicionais, a guarda terminal impede consumir input ou simular; parar o RAF e limpar baseline/acumulador/input ao concluir. Um cursor/latch local por execução impede entrega duplicada.

Snapshots continuam disponíveis para inspeção/render sem efeitos. Publicar tempo restante arredondado, saúde, score e estado no DOM em mudanças relevantes ou cadência limitada; o renderer pode apresentar frames ativos sem fazer React atualizar a cada frame. Alternativa rejeitada: consultar `events()` dentro de `present`, pois resize/reapresentação repetiria ended ou perderia passos intermediários.

### 5. Input e tempo de pausa

Estender o buffer/bindings para Escape/KeyP como bordas sem repeat/keydown duplicado, contextualizadas na arena pronta e ativa. Botão Pause e blur/hidden chamam o mesmo caminho de congelamento; `pausePressed` deve pausar antes de executar outro passo ativo. Limpar ataques, toggles, alvo, solicitação de movimento e estado neutro de joypad, sem criar joypad visual nesta etapa. Entrada durante pausa é ignorada e limpa de novo no Resume. Retomar foco não retoma o jogo; após Resume o primeiro RAF só fixa baseline. Nenhuma recarga, IA, RNG, bala, reserva ou efeito existente avança na ausência. Remover agendamento durante paused/terminal.

Foco sai do host para diálogo; foco inicial em Resume, containment por controles semânticos, restauração para host após Resume, para Play após menu e para título/ação ao entrar Result. Não capturar modificadores ou eventos de controles editáveis. Alternativa rejeitada: pausa somente visual com RAF ativo e input acumulado.

### 6. Configuração consistente e chave canônica

Passar a preparação capturada ao renderer e aos adapters, retirando os acessos de gameplay a `DEFAULT_CONFIG` de `pixiPreview.ts`. Usá-la em mapa, posição inicial, viewport, clamp do pointer, collider overlay, telegraphs, diagnósticos e engine. Seletores opt-in existentes (`targets`, `empty`, `island`) devem preparar dados/configuração na fronteira antes da captura, sem alterar regras depois. A configuração capturada e a registrada no resultado precisam ser a mesma efetivamente executada.

Implementar serialização canônica pura: ordenar chaves de objetos recursivamente, preservar ordem de arrays semanticamente relevantes, aceitar somente valores válidos serializáveis. Usar representação canônica completa com prefixo de versão como `configurationKey`, sem nova biblioteca de hash nem risco de colisão introduzido por hash curto. Incluir todos os campos de gameplay atuais: opções, versões, geometria, navios, armas, projéteis, Shooter, spawn, controles de gameplay, regras, navegação, diretor e timing. Preferências de apresentação futuras ficam fora de GameConfig ou são excluídas explicitamente; seed/identidade já são campos separados. Alteração de ordem de propriedades não muda a chave. Alternativa rejeitada: chave baseada somente nas duas opções ou construída a partir dos defaults atuais de um resultado histórico.

### 7. Storage mínimo, validado e tolerante a falhas

Adicionar adapter local pequeno, fora do core, com chaves versionadas documentadas para opções, identidade e Last Result (por exemplo `pirate-battle.options.v1`, `pirate-battle.identity.v1`, `pirate-battle.last-result.v1`). Persistir somente dados concluídos, não a sessão ativa. Não usar `beforeunload` para produzir resultado. Refresh simplesmente reabre Menu; Last Result válido continua acessível. A ausência de resultado não deve exibir uma ação vazia.

Tratar `JSON.parse` como `unknown`: conferir envelope/versão, objetos/arrays necessários, tipos e limites de **todos** os campos de configuração aninhada, números finitos, IDs/nomes não vazios, versões, geometria utilizável, enumerações, seed uint32, score inteiro não negativo, duração coerente e data UTC válida. Conferir chave canônica contra a configuração validada. Não reconstruir resultado histórico com `createGameConfig(options)` porque isso apagaria tuning/mapa históricos. Estrutura incompleta, incompatível ou inválida é rejeitada; resultado válido é copiado e congelado. Adapter de opções valida os dois valores pelos metadados e reconstrói tuning atual para a próxima captura. Sem formulário Options.

Capturar erros de acesso, quota e parse. Opções corrompidas usam defaults com explicação visível; identidade inválida é recuperada; resultado inválido não é exibido como concluído. Falha de escrita mantém resultado em memória nesta sessão e informa que não foi salvo neste dispositivo. O último resultado persistido anteriormente não é removido por uma nova tentativa de escrita falha. `Saved on this device` só após sucesso; não usar `Recorded`/`Pending — Retry` como se houvesse entrega remota. Integrações futuras serão responsáveis por seus próprios estados. Alternativa rejeitada: confiar em cast TypeScript do JSON ou deixar `localStorage` lançar durante render e impedir Play.

### 8. Evidência proporcional ao risco

Core: finais por tempo/morte/empate, limite exato e score zero; score 2 da salva letal; ended único/último; snapshot/result imutáveis; zero ações após terminal; seed/replay; captura/configuração/key; validação completa e storage negado/corrompido. Loop/input: Escape/P por borda, limpeza, input contextual, zero RAF em pausa/terminal, baseline após ausência longa, frame multistep e resize sem conclusão duplicada.

E2E em dev e preview, armazenamento isolado: timer real da simulação com sessão **válida de 60s** e cenário `empty`, morte por IA real normal ou dados iniciais declarados antes da engine (sem setter de saúde/score), pausa manual/blur/hidden, telegraph/recarga congelados, foco/diálogos, Keep Playing/Abandon, Result/Last Result, refresh em combate, falha de storage, replay e opções salvas atuais. Pode avançar relógio de teste em frames compatíveis com o limite de cinco passos, sem alterar regras ou injetar término. Atualizar helpers antigos de saída para confirmar abandono e evitar falso verde.

Cinco ciclos devem misturar término/replay/abandono e observar canvas, recursos Pixi, entidades, RAF, listeners nativos, subscriptions e observers, inclusive Strict Mode e inicialização tardia. Não afirmar benchmark de memória/FPS; registrar contadores e limites do ambiente. Capturar visualmente Paused, confirmação, Result e Menu com Last Result em desktop, 320px e landscape. Salvar relatório HTML, anexos e traces de falhas em evidências 06; preservar 01–05. Executar lint, typecheck app/core sem DOM, Vitest, build, E2E completo e OpenSpec strict. VERIFY independente audita antes de sync/archive.

## Risks / Trade-offs

- [Retorno antecipado corta score do último passo] → manter fase de balas inteira e regressão existente com score 2; ended sempre último.
- [Completed volta a playing ou é consumido duas vezes] → guardas de estado no core, latch da sessão e entrega por passo separada de render/resize.
- [Replay conserva RNG/deadlines/reservas] → nova engine e novo owner por preparação; testes de cinco ciclos e de reprodução.
- [Storage indisponível ou JSON parcialmente válido] → parser completo de unknown, tratamento de erros e fallback em memória com status honesto.
- [Configuração gravada diverge do que render/física executam] → captura única antes da inicialização e remoção de defaults em todos os caminhos do renderer.
- [Key canônica completa aumenta payload local] → custo pequeno para um único resultado/configuração; representação simples e sem colisões; revisar armazenamento somente quando integração futura exigir.
- [Testes antigos assumem saída imediata/ausência de terminal] → atualizar expectativas afetadas conservando casos de colisão/IA e seus asserts reais, sem apagar regressões.

## Migration Plan

Não há formato de storage de produto anterior a migrar; iniciar envelopes versionados e recuperação explícita. Aplicar código, testes e docs apenas na fase apply autorizada, mantendo a aplicação executável. Esta fase não faz deploy. No archive posterior, sincronizar os sete deltas preservando os Purpose existentes e todos os cenários; o novo Purpose de match-lifecycle será copiado. Validar main specs estritamente antes e depois do archive. Se a implementação precisar ser revertida, preservar dados desconhecidos/versionados sem convertê-los em resultados novos e reverter somente os arquivos do incremento, sem tocar evidências ou trabalho anterior.
