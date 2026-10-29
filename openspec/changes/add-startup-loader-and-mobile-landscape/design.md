# Design

## Context

Ver `proposal.md` para a motivação e os deltas em `specs/` para o comportamento esperado. A mudança atravessa bootstrap, recursos DOM/Pixi, áudio, input, pausa e foco, justificando este design.

Estado observado:

- `index.html` contém somente um `#root` vazio e o script de entrada. `src/main.tsx` aguarda `initMocks()` antes de renderizar React; uma tela exclusivamente React não cobre essa espera nem a transferência inicial dos módulos.
- `src/render/assetManifest.ts` cataloga imagens visuais, mas `ASSET_URLS` exclui `DOM_ASSET_IDS`. CSS e imagens do menu carregam independentemente; o catálogo não inclui o logo branco existente em `assets/logo_jungle_gaming.svg`.
- `createAssetCache` compartilha trabalho pendente, conserva sucessos parciais e controla leases, mas não publica progresso. `sessionAssets` alimenta `createLoadingAttempt` somente na entrada da arena. A inicialização gráfica e seu tratamento de falha continuam necessários mesmo com texturas prontas.
- `audioEngine` transfere e decodifica sons sob demanda. Seu desbloqueio e a reprodução dependem de gesto, enquanto falhas de áudio já têm alternativa silenciosa.
- O shell integra `pause`/`resume` ao dono do renderer e ao áudio. A proteção precisa coordenar esses caminhos, inclusive a conclusão tardia de preparação, sem desmontar a arena existente.
- Os testes Playwright usam desktop com `hasTouch: true` e um projeto mobile portrait 390×844. Presença de touch não distingue os dois projetos. Vários testes e snapshots mobile pressupõem acesso direto ao menu e combate em portrait.

## Goals / Non-Goals

**Goals:**

- Tornar verificável a condição de prontidão inicial, reaproveitando a propriedade de recursos já existente.
- Cobrir a janela anterior ao React e transferir a apresentação sem revelar conteúdo incompleto.
- Tratar orientação como uma restrição do shell independente do modo corrente de input e da simulação pura.
- Manter somente o contexto de foco ativo e impedir que conclusão assíncrona ou Resume contorne a proteção.

**Non-Goals:**

- Modificar contratos ou regras da simulação, implementar um novo motor de áudio ou mover a inicialização Pixi para antes de Play.
- Prometer bloqueio físico universal de orientação, criar PWA, depender de detecção por user-agent ou girar canvas e coordenadas por CSS.
- Contabilizar ranking, histórico, telemetria ou todos os arquivos do diretório de assets como parte do carregamento.

## Decisions

### 1. Cobertura estática antes do bootstrap e transferência após commit

Adicionar a `index.html` uma apresentação inicial mínima fora da árvore gerenciada pelo React, com estilos críticos locais para fundo preto, logo, barra e texto legível. O logo referencia o asset existente através de URL processada pelo Vite, respeitando o caminho base da aplicação. Marcar a imagem para prioridade alta; sua disponibilidade também participa da preparação. A área continua preta enquanto o próprio logo é transferido.

O ponto de entrada inicia o coordenador de recursos e a inicialização de mocks sem exigir que um termine para iniciar o outro. O shell React assume a mesma apresentação, incluindo estado de progresso, falha e orientação, antes de remover a cobertura estática. A transferência ocorre após commit da tela sucessora, com um único progressbar exposto às tecnologias assistivas. Não remover a cobertura somente porque `application.render()` foi chamado. Falha fatal de bootstrap deve deixar mensagem e recuperação legíveis em vez de uma tela preta permanente.

Alternativa descartada: criar somente um componente Loading em `App`, pois continuaria existindo um intervalo vazio enquanto módulos e mocks são inicializados.

### 2. Um coordenador de preparação por sessão, com consumidores especializados

Criar um coordenador em módulo próprio de bootstrap, com estado observável `loading | ready | failed`, contagem total, concluídos, falhas e geração da tentativa. O conjunto é estabilizado antes de publicar progresso: texturas de `ASSET_URLS`, imagens de `DOM_ASSET_IDS`, logo e arquivos de `AUDIO_MANIFEST`, deduplicados por identidade/URL. Usar os mesmos URLs dos consumidores finais; incluir no catálogo qualquer imagem de interface efetivamente usada que a inspeção de CSS revelar fora dele.

- Texturas de combate: aquecer o `sessionAssets` existente e acrescentar uma inscrição de progresso baseada nos recursos resolvidos. A lease do aquecimento é liberada após concluir, mas as texturas permanecem no cache da sessão. Play continua adquirindo sua própria lease e inicializando seu renderer.
- Imagens DOM e logo: carregar por `Image`, aguardar `decode()` quando suportado e conservar o resultado da preparação por sessão. Não criar texturas Pixi para essas imagens. Assets de CSS e `img` usam a mesma identidade processada pelo bundler para aproveitar o cache do navegador.
- Áudio: separar a transferência de dados da criação/desbloqueio do contexto e da decodificação. Compartilhar os dados e promises pendentes com `audioEngine`; a primeira reprodução decodifica os bytes preparados, sem nova transferência. A participação de áudio pode terminar em alternativa silenciosa sem bloquear o produto.

O progresso é a razão de recursos concluídos pelo total, não uma porcentagem de bytes. Não estimar tamanho nem simular avanço por relógio. Cache válido conta imediatamente; falha visual não conta como sucesso. Mesmo com todos os recursos contabilizados, publicar 100 e liberar o menu somente após o bootstrap estar pronto. Enquanto a etapa final estiver pendente, limitar a apresentação a um valor abaixo de 100 e informar a conclusão da inicialização como status, sem animar progresso fictício.

Não adicionar espera mínima no carregamento inicial. O atraso mínimo já existente na preparação após Play pode permanecer, pois cobre a inicialização gráfica e seu cenário demonstrável de falha com cache quente.

Alternativas descartadas: usar um timer de porcentagem ou carregar tudo exclusivamente pelo Pixi, pois não representam a prontidão das imagens DOM e desperdiçam recursos gráficos.

### 3. Recuperação explícita e conclusões tardias isoladas

Cada tentativa de recurso tem limite de 30 segundos. Falha ou timeout visual mantém a apresentação inicial com texto e botão Retry em CSS básico, sem depender de textura de botão ou do próprio logo. Áudio com falha/timeout termina silenciosamente. Retry reaproveita sucessos e inicia novamente somente trabalho faltante ou rejeitado, sem refresh.

Publicações e transição para `ready` são vinculadas à geração atual. Timeout precisa liquidar a participação da tentativa, liberar inscrições/leases e impedir rejeição permanente no cache. Cancelar transferências quando o adaptador permitir. Conclusões físicas tardias de operações não canceláveis não podem atualizar a interface antiga nem destruir texturas adotadas por outro consumidor; sua adoção ou liberação segue o dono de recursos existente. Cobrir isso com testes de timeout, Retry concorrente e conclusão fora de ordem.

Esta decisão altera expressamente a garantia antiga de que falha de imagem decorativa jamais bloqueia Play: a preparação inicial agora exige uma interface visual completa. A separação entre decoração DOM e recursos do renderer é preservada. O erro inicial oferece Retry; a falha posterior de gráficos continua oferecendo Retry e Main Menu, como hoje.

### 4. Layout estável e frases sem progresso artificial

Usar preto `#000` e branco `#fff`, logo proporcional, barra de largura responsiva limitada, contorno sólido de 2 CSS px e preenchimento branco uniforme, sem gradiente. Centralizar o grupo; reservar altura para a frase e respeitar safe areas. O progressbar expõe nome, mínimo, máximo e valor atual. O texto percentual pode acompanhar a barra para clareza.

Manter uma lista local em inglês e alternar a cada três segundos, sem repetição consecutiva. Lista inicial: “Bribing the kraken…”, “Teaching the parrot bad words…”, “Counting suspiciously acquired gold…”, “Untangling the captain's beard…” e “Checking the plank for splinters…”. A sequência pode ser determinística, facilitando testes. A região das frases não é uma live region; anúncios discretos ficam reservados ao estado de preparação e erro. Sem animação necessária, respeitando reduced-motion. Encerrar o timer ao concluir, falhar ou descartar a apresentação.

Alternativa descartada: esperar frases ou uma animação terminar para revelar o menu, pois acrescentaria latência sem necessidade.

### 5. Política mobile baseada no ponteiro primário e viewport efetivo

Um adaptador do shell observa `(pointer: coarse)` e dimensões reais do viewport. A restrição aplica-se quando o ponteiro primário é coarse; largura menor ou igual à altura não permite a experiência principal. A mudança de modalidade entre mouse e toque no jogo não altera essa classificação. Desktop fine com touch adicional e janelas estreitas mantém o comportamento responsivo existente.

Não solicitar fullscreen ao abrir a página. Na proteção, oferecer uma ação explícita para entrar em landscape; quando o ambiente exigir fullscreen e disponibilizar a API, solicitar fullscreen e depois o bloqueio, dentro do fluxo autorizado pela interação. Em ações de entrada como Play, aproveitar o gesto para tentar manter landscape quando possível, sem condicionar Play ao sucesso do bloqueio. Tratar ausência e rejeição de ambas as APIs. Orientação e fullscreen são progressivos: o viewport efetivo decide a proteção, mesmo que o método de bloqueio tenha resolvido.

Não repetir solicitações automaticamente após saída de fullscreen. Observar mudanças de tamanho/orientação para acompanhar a situação atual. A proteção orienta a rotação física e funciona sem fullscreen. Referência de compatibilidade: [Screen Orientation, W3C](https://www.w3.org/TR/screen-orientation/), que permite condições impostas pelo navegador ao bloqueio.

Alternativas descartadas: depender exclusivamente do bloqueio nativo ou simular landscape com transformação CSS, que prejudicaria coordenadas, acessibilidade e safe areas.

### 6. Proteção de orientação como parte do shell e pausa sem desmontagem

A orientação e a preparação são estados independentes. Composição visual:

```text
bootstrap pendente + orientacao permitida --> loader inicial
bootstrap pendente + portrait mobile     --> loader com instrucao de rotacao
bootstrap falhou   + qualquer orientacao --> erro e Retry; instrucao se necessario
bootstrap pronto   + portrait mobile     --> protecao de orientacao
bootstrap pronto   + orientacao permitida --> tela atual da aplicacao
Playing --> portrait mobile --> Paused --> landscape --> Paused --> Resume
```

A proteção fica acima das telas, tornando o conteúdo abaixo `inert` e indisponível para tecnologias assistivas enquanto coberto. O contexto de foco anterior é registrado; ao retirar a proteção, restaurar foco somente a um elemento conectado e disponível. Para combate pausado, preferir Resume; para carregamento, status; para menu, Play. Diálogos subjacentes suspendem seu mecanismo de contenção de foco para não disputar com a proteção. Options conserva os valores ainda não salvos.

Ao entrar em portrait, usar a pausa já existente e a limpeza de input, incluindo `audioEngine.onPause()`, sem recriar run, renderer ou mundo. Guardar a restrição também no caminho de `resumeGame`, inclusive Escape do diálogo. Se o renderer ainda não estiver pronto, marcar pausa pendente e aplicá-la antes de montar/iniciar o loop ativo; a primeira atualização não pode consumir tempo de jogo durante a proteção. Voltar a landscape recalcula o viewport e apresenta Paused, exigindo Resume explícito. Nunca restaurar capturas, tiros ou auto-sail.

Limpar listeners, assinaturas e temporizadores em descarte/HMR. BFCache mantém a sessão, mas a orientação deve ser reavaliada em retorno antes de permitir input. O código de domínio/simulação não depende das APIs de navegador.

### 7. Verificação focada no comportamento alterado

Testes unitários cobrem progresso real, deduplicação, cache quente, Retry parcial, timeout e conclusão obsoleta; transferência de áudio sem gesto; classificação coarse/fine e transições de proteção. Reutilizar testes de leases e ownership existentes, acrescentando os novos casos sem espelhar componentes.

E2E intercepta recursos escolhidos para manter visualmente 0%, progresso parcial e falha. Verificar fundo, logo, contorno/preenchimento, semântica, frases por relógio controlado, ausência de menu antes da conclusão e recuperação de imagem DOM/combate. Cobrir a espera anterior ao React atrasando inicialização e módulos, com verificações da cobertura estática.

Separar testes mobile de portrait protegido dos fluxos jogáveis em landscape. Ajustar helpers e os snapshots afetados em vez de desabilitar o projeto mobile: manter 390×844 para a proteção; executar menu, Options, resultado e combate em 844×390 e 568×320. Manter desktop fine estreito para provar que não é bloqueado. Ensaiar rotação com dedos mantidos, preparação gráfica pendente, diálogo e formulário abertos, Retry em portrait e retorno do BFCache. Comparar estado autoritativo e número de canvas/loops antes e depois das rotações.

Os testes com APIs simuladas provam os caminhos de sucesso/recusa; não demonstram rotação física. Validar também em dispositivo real os caminhos disponíveis, documentando navegador, suporte e resultado, sem declarar suporte universal com base na emulação Chromium.

## Risks / Trade-offs

- [Mais bytes antes do menu] → Carregar somente recursos usados, em paralelo, com cache compartilhado e progresso visível; não esperar dados remotos de telas secundárias.
- [Imagem decorativa indisponível agora bloqueia a entrada] → Retry legível e independente de imagens, timeout e reaproveitamento de sucessos; mudança explicitada no delta de `asset-loading`.
- [Bloqueio de orientação varia entre navegadores] → Proteção por viewport continua funcional mesmo com ausência ou recusa das APIs.
- [Conclusão gráfica pode iniciar o loop sob a proteção] → Pausa pendente aplicada antes de iniciar tempo ativo e teste específico com preparação retardada.
- [Foco concorrente entre proteção e diálogo] → Apenas o contexto visível mantém contenção; testar teclado, Escape e formulário em rotações repetidas.
- [Timeout não cancela toda operação Pixi] → Isolar gerações e manter contabilidade de recursos tardios sem descarte de textura compartilhada em uso.
- [Métricas por quantidade não refletem bytes] → Exibir progresso como preparação de recursos, sem alegar porcentagem de download; a conclusão continua verificável.

## Migration Plan

1. Implementar coordenador e preparação compartilhada mantendo os contratos de sessão e falha pós-Play.
2. Integrar apresentação estática/React e proteção de orientação em uma mesma entrega, atualizando helpers e expectativas mobile junto aos deltas.
3. Executar typecheck, lint, testes unitários, build e E2E relevante em dev e preview; inspecionar evidências visuais desktop/mobile e registrar validação física disponível.
4. Não há migração de dados. Em reversão, remover a integração e os adaptadores da mudança e restaurar os testes/documentação correspondentes; identidade, opções, resultados e outbox permanecem compatíveis. Publicação segue um pedido separado.
