# Design

## Context

Ver proposal.md para motivação e os quatro deltas para comportamento. A base tem cinco specs sincronizadas e os incrementos 01/02 arquivados. `src/domain/config.ts` já centraliza mundo, velocidade 150 u/s, giro π rad/s, raio 18, dead zone 12, passo 1000/60 ms e catch-up cinco. `simulation/contracts.ts` já fornece preparação, input, snapshot e eventos readonly; `immutableCopy` protege dados. O core tem compilação sem DOM e lint contra imports de plataforma, relógio e RNG global.

`pixiPreview.ts` monta tiles e sprite, com ticker e scheduler Pixi desativados; hoje renderiza somente em resize. `previewOwner.ts` só monta depois de confirmar que a inicialização ainda pertence à navegação. `loadingAttempt.ts` intermedeia o recurso e a participação no cache. As transformações CSS e o observador ResizeObserver/window/matchMedia para DPR já são testados. App e E2E ainda exigem texto estático e zero RAF durante a arena: isso precisa evoluir explicitamente.

Os dois contornos convexos de 65 vértices, em coordenadas locais relativas às origens (135,95) e (665,325), já acompanham a areia. A tolerância artística de quatro unidades não representa penetração física permitida. Não é necessário modificar mapa arena-v2 nem balance-v1.

## Goals / Non-Goals

**Goals:**
- Manter decisões de navegação e colisão no core puro; plataforma fornece input e duração explícitos.
- Reutilizar geometria e ownership existentes e tornar comportamento reprodutível por passo e inspecionável sem setters de teste.
- Permitir evolução posterior do ciclo de sessão sem criá-lo antecipadamente.

**Non-Goals:**
- Não interpretar contratos futuros de armas, pausa manual e término como autorização para implementar suas mecânicas.
- Não adicionar interpolação, pathfinding, física externa, RNG, sistema genérico de entidades, benchmark de partida ou controle touch neste incremento.

## Decisions

### Core e publicação

Criar módulos pequenos de engine, navegação/geometria e acumulador em `src/simulation/`, usando `MatchSetup`, `StepInput`, `SimulationSnapshot` e `SimulationEvent`. Inicialização explícita captura configuração imutável e seed separada; não usa RNG. O passo é configuração.timing.fixedStepMs/1000 e o tempo ativo é índice×fixedStepMs, evitando acumular erro temporal. O estado inicial vem da configuração. Armas, inimigos, projéteis, score e término não executam comportamento; snapshots mantêm os campos neutros existentes e eventos ficam vazios.

Snapshots são cópias profundamente imutáveis; testes preservam snapshots antigos e tentam mutação. O estado interno pode ser mutável encapsulado, sem expor referências. React recebe somente mudança discreta de auto-sail/congelamento. Pixi lê o último snapshot a cada apresentação. Isso usa contratos já existentes e evita acoplar o ciclo autoritativo ao render React; reusar objetos mutáveis como snapshots violaria isolamento. Interpolação é adiável porque o primeiro objetivo é correção verificável.

### Acumulador e loop

Usar um RAF próprio por recurso montado, mantendo ticker/scheduler Pixi parados. A callback entrega delta explícito ao acumulador puro e apresenta o snapshot final. Executar até cinco passos completos por frame; depois de saturar, descartar excesso inteiro e preservar somente resto menor que fixedStepMs. Pequena tolerância temporal documentada trata arredondamento de fronteira; valores negativos/não finitos não avançam estado. A primeira callback estabelece baseline sem passo. Não recuperar backlog em frames seguintes. A alternativa delta variável tornaria giro e colisão dependentes da apresentação; manter todos os passos atrasados produziria trabalho e avanço ilimitados.

Iniciar listeners e RAF em `mount`, depois da autorização do owner e da área estar pronta, nunca na inicialização assíncrona nem durante a espera mínima de Loading. O recurso é dono de cancelamento e subscriptions. Freeze pode cancelar o RAF e apresentar uma última vez; Resume agenda um único RAF com baseline novo. Destroy é idempotente e cancela RAF, remove listeners e referências antes de descartar cena/texturas emprestadas. Se o contrato do recurso ganhar método de retomada, todos os wrappers de `loadingAttempt` devem propagá-lo; callbacks discretos também podem fornecer ponte explícita sem furar ownership. Não criar loop global ou iniciar recursos quando a promise resolve obsoleta.

### Input desktop e steering

Criar adaptador em `src/input/` que recebe transform/host atuais e produz input normalizado, sem levar DOM ao core. Pointer usa client−boundingClientRect, `screenToWorld`, clamp aos limites do mundo. Armazenar alvo em unidades lógicas; mouse novo usa transformação atual, resize/DPR não reconverte alvo anterior. Área não renderizável ignora conversão. Pointerleave conserva alvo. Aceitar mouse nesta etapa sem inventar joypad touch.

Core conserva heading quando não há target ou distância≤dead zone. Fora dela, calcula atan2 e diferença normalizada ao menor arco, limita a ±turnSpeed×dt e normaliza heading; empate exato de π escolhe arco positivo. Atualizar rumo antes da translação. Auto-sail move somente para frente com velocidade×dt; no padrão são 3° e 2,5 unidades por passo. Sem navegação automática, reverse ou strafe.

R usa `code=KeyR`, ignora repeat e keydown duplicado até keyup. O adaptador mantém uma fila de bordas válidas: cada pressão sobrevive a frames sem passo e uma borda é entregue uma vez por passo, inclusive quando várias pressões chegam entre frames. Isso preserva cada alternância com o contrato booleano existente. Nunca multiplicar uma borda pelos vários passos do mesmo frame. Limpeza descarta a fila e estados mantidos. O adaptador não captura outras teclas ainda sem mecânica.

O contexto de jogo é um elemento semântico/focável da arena pronta. Mouse na arena e foco inicial/Resume podem ativá-lo; não tornar um host `aria-hidden` focável. Escutar no contexto ou filtrar activeElement/origem; excluir campos editáveis, controles de navegação, menu/loading/falha/freeze e Ctrl/Alt/Meta/atalhos. PreventDefault somente para R efetivamente capturado. Keyup deve liberar o latch mesmo quando foco interno muda; mudanças que retiram posse limpam estados sem alternar. Essa opção preserva teclado de interface sem listener global incondicional.

### Colisão autoritativa

Usar o círculo de raio configurado contra segmentos e vértices dos polígonos convexos, translacionados pela origem da ilha. Limites válidos do centro são [r,width−r]×[r,height−r]. O sprite continua 33×56,5; tamanho visual/vela não define colisão. Rotação de círculo não muda ocupação. Não substituir os contornos por envelopes nem usar tolerância artística como folga física.

Resolver deslocamento por sweep do centro contra litoral expandido pelo raio: testar faces/segmentos e círculos dos vértices, escolher primeiro impacto, avançar até contato seguro e projetar o restante removendo componente de entrada na normal. Repetir para contatos subsequentes e limites; empates usam ordem estável de ilha/feature. Distância epsilon inicial 1e−7 unidades, tolerância de asserção de não penetração 1e−6 e até oito iterações por movimento, como constantes numéricas documentadas do solver. Em esgotamento, descartar resto e manter última posição válida. Valores só podem ser refinados com evidência dos testes, sem flexibilizar os requisitos.

Contatos em t≈0 tangenciais ou afastando não bloqueiam; rejeitar raiz fora do segmento/intervalo, normal inválida e movimento quase zero. Testes cobrem tangente exata, vértices, contatos repetidos e canto com duas normais. Sweep evita depender da amostragem final e mantém regra contínua; simples clamp seguido de depenetração pode prender em cantos ou aceitar travessia. Saúde é constante e eventos de colisão de cenário não geram dano. Não implementar separação entre navios ainda inexistentes.

### Freeze mínimo e apresentação acessível

Blur/visibilitychange(hidden) congela imediatamente no adaptador/runtime, limpa teclas/fila/target, desliga auto-sail e zera acumulador/baseline. O core expõe transição explícita para snapshot paused, sem incrementar passo/tempo; Resume retorna playing mantendo posição/heading e sem alvo. Foco/visibilidade restaurados não retomam sozinhos; Resume HTML explícito, acionável por teclado, restaura contexto de jogo. Novo mouse define novo alvo e novo R habilita translação. Não adicionar diálogo de abandono, Escape/P, timer de término ou resultado: são consolidação futura do ciclo de sessão.

App troca textos estáticos por Arena, instruções de mouse/R e indicadores Auto-sail On/Off e Paused em inglês antes/durante navegação. Atualizar somente esses estados discretos. Preservar semântica de Loading/Retry/Main Menu, foco e layout mínimo320; espaço dos status não cobre arena nem exige HUD antecipado. Canvas continua apresentação aria-hidden com contexto semântico separado.

### Diagnóstico e evidências

Estender `?geometry=1` para litoral, círculo do casco, limites e vetor de rumo, todos derivados das fontes reais. Ampliar inspeção readonly existente com posição, heading, step, activeTimeMs, auto-sail e estado; nenhuma API de teleporte/input/score. E2E opera mouse/R e pode controlar tempo do navegador sobre o loop real, nunca alterar player diretamente. Instrumentação de recursos contabiliza RAF e listeners ativos, sem afirmar que ausência de ticker implica ausência de loop.

Vitest cobre determinismo, imutabilidade, acumulação/FPS30/60/120/144, long stall, steering/deadzone/wrap, fila de R, conversões e freeze. Geometria cobre ambas ilhas, cantos e bordas em trajetórias diretas, oblíquas e repetidas, verificando distância e saúde a cada passo. Integração cobre mount/destroy/init tardia e wrappers. E2E dev/preview preserva loading/retry/cache/resize/DPR e troca expectativas estáticas por um RAF na arena e zero após saída. Dirigir mouse/R por rotas dos quatro lados de cada ilha; confirmar retenção, contatos/slide, blur/Resume e cinco ciclos Strict Mode sem crescimento. Registrar screenshots desktop/320/portrait/landscape, JSON com observações e relatório HTML/traces das falhas em diretório03. Ajustar configuração do reporter e paths dos testes para não sobrescrever02.

## Risks / Trade-offs

- [Solver em contornos com arestas curtas] → casos reais das duas ilhas e testes de tangência/vértices, sweep e fallback válido limitado.
- [Pressão R perdida ou duplicada no catch-up] → fila por borda, consumo unitário por passo, testes de zero/vários passos e múltiplas pressões.
- [Freeze chega entre frames] → transição imediata e limpeza fora do próximo passo, cancelamento/baseline novo e testes com relógio controlado.
- [Loop ou input antes do mount/apos saída] → ownership existente, wrappers auditados e cinco ciclos E2E com contagem de recursos/listeners.
- [Navegador headless não mede jogabilidade humana nem performance de dispositivo] → declarar ambiente e limites; registrar operação real dos controles e inspeção visual, sem alegar benchmark60FPS.
- [Catch-up descartado reduz tempo simulado sob sobrecarga] → escolha explícita de segurança; tempo ativo conta só passos, com limite verificável.

## Migration Plan

Implementar em módulos puros, integrar input e apresentação preservando o fluxo executável, atualizar testes/documentação e somente então marcar tasks. Aplicar as deltas via sync/archive após verify independente; conferir a renomeação e o conteúdo MODIFIED de `arena-rendering`, preservando o Purpose existente conforme o contrato da skill de sync. O Purpose histórico não substitui os requisitos normativos atualizados. Não alterar specs principais nesta fase. Sem migração de dados ou deploy; rollback local pode restaurar integração estática preservando cache e assets.
