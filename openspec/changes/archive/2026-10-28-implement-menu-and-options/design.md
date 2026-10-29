# Design

## Context

Ver motivação em proposal.md. A base 01–06 está arquivada e possui 11 specs válidas. `App` já possui menu, preparo, Loading, arena, pausa, Result e Last Result; `start` relê opções para cada Play/Play Again. `preparePlay` captura configuração completa imutável. Configuração e lifecycle já especificam limites, snapshot, replay e storage: esta change acrescenta a interface, não novas regras nessas capabilities.

`OPTION_METADATA` define labels, defaults 120000/3000ms, limites e passos; `createGameConfig` e `validateOptions` rejeitam formatos e valores inválidos. `createLocalAdapter` usa `pirate-battle.options.v1`, envelope `{ version: 1, data }`, leitura defensiva e escrita booleana. `saveOptions` valida antes do writer e pode lançar para dados inválidos. A UI precisa validar antes de chamá-lo.

Há duas lacunas observadas: `boot.notice` agrega avisos de opções/identidade/resultado e `start` pode ressuscitar aviso já resolvido; `ASSET_URLS` inclui todo o manifesto na carga Pixi, inclusive UI. CSS estica painéis e imagens e não distingue todos os estados secundários.

## Goals / Non-Goals

**Goals:** separar rascunho, persistência e configuração capturada; manter transações de Save honestas; delimitar recursos DOM/Pixi; tornar conteúdo variável e foco previsíveis; produzir evidência reproduzível dos fluxos introduzidos.

**Non-Goals:** máquina global de rotas, estado remoto, nova arquitetura de domínio, autosave ou edição de partida existente. A composição React continua pequena, sem dependência adicional; responsabilidades de simulação/input permanecem fora do formulário.

## Decisions

### Navegação local e foco

Adicionar um estado local explícito para Options e um componente de formulário próprio, mantendo intacta a preparação/execução da arena. Abrir somente pelo menu, sem executar nem manter uma arena oculta. Entrada foca título com tabIndex -1 ou primeiro campo. Save bem-sucedido, Cancel e Escape retornam ao menu e focam Options; retorno de arena e Result conserva foco Play existente. Enter submete o formulário somente válido; Cancel é button type=button e Escape tem comportamento local. Nenhum listener de gameplay é instalado na tela.

Ranking e Match History serão reservas visíveis, indisponíveis e acompanhadas de explicação em inglês. Preferir ações nativas disabled com texto explicativo sem criar role=tab/tablist incompleto. Não usar fixtures, pedidos HTTP nem estados artificiais de consulta. Fazer abas completas exigiria conteúdo e contrato de seleção ausentes neste incremento.

### Strings como rascunho e domínio como autoridade

Manter as duas entradas como strings, inicializadas da leitura defensiva e convertidas de ms para segundos. Usar campos semânticos rotulados com teclado numérico/decimal adequado e ajuda persistente com unidades, limites e passo. Tipo textual com inputMode permite preservar vazio e texto inválido para feedback; valores numéricos derivados nunca substituem o rascunho enquanto se digita.

Extrair pequeno helper puro de parsing/validação em `src/ui/`, sem React ou storage. Rejeitar string vazia/whitespace; aceitar representação decimal completa em segundos, converter com Number somente após checagem da entrada e exigir finitude. Converter os dois valores para ms exatamente, sem parseInt, arredondamento ou clamp, e reutilizar `validateOptions`/`createGameConfig` para limites/passo. Erros apresentados em segundos vêm de OPTION_METADATA convertido, sem duplicar constantes autoritativas. Representações não decimais ou incompletas produzem erro, em vez de interpretação parcial.

Associar labels, ajuda e erros com ids e aria-describedby; usar aria-invalid quando aplicável e região de erro de gravação acessível, sem anunciar a cada tecla desnecessariamente. Save disabled quando inválido, com estado visual fornecido, e guarda de validação no submit protege Enter e chamadas indiretas. Validação HTML isolada ou armazenar números no onChange foi descartado: pode aceitar vazio como zero, perder texto intermediário ou normalizar inválidos silenciosamente.

### Save como única confirmação

Abrir Options relê storage e não grava. Cancel/Escape desmontam o rascunho, e reabrir lê novamente os salvos/defaults. Submit válido chama `saveOptions` uma vez e só fecha após true. O retorno false ou erro inesperado conserva tela, strings e último valor persistido, mostra erro honesto e permite Retry por Save ou Cancel. O adapter existente não deve ser alterado para engolir entradas inválidas: o formulário garante esse contrato antes da chamada.

Não manter um cache de draft como opção autoritativa. Assim Save falho e Cancel não vazam para `start`, e refresh recupera somente o envelope efetivamente salvo. Não trocar chave ou versão nem migrar resultados históricos.

### Avisos com origem identificável

Separar aviso de opções corrente dos avisos independentes de identidade, resultado e disponibilidade. Inicialização, abertura de Options e `start` atualizam somente a parte das opções a partir da leitura. Uma leitura válida ou Save bem-sucedido resolve essa parte; falha de escrita preserva erro atual. Cancel após corrupção conserva explicação e não repara storage automaticamente. Nunca reconstruir aviso de opções a partir da string imutável de boot, nem limpar o conjunto inteiro ao salvar.

Esse ajuste é necessário para o cenário corrupção → defaults → Save → Play, e precisa preservar avisos simultâneos de Last Result inválido e identidade indisponível. Uma única string global foi descartada por perder a origem necessária à resolução correta.

### Arte, metadados e independência de carga

Reutilizar PNGs individuais fornecidos, sem conversões e sem flatten dos samples. `sample_options.png` só mostra Main Menu, mas GDD/prompt explícitos exigem Save/Cancel e prevalecem. Backdrop `ui_scene_background.png` é decoração estática de menu, não colisão.

Registrar assets usados e completar metadados tipados: painel 384×480, anchor (0.5,0.5), content (26,30,332,420), bordas left/top/right/bottom 32/40/32/40; botão 256×88, outer (8,4,240,80), label (32.5,19.5,191,46.5). Cada frame carrega seus campos ui; meta.ui define convenção. Atlas retina dobra pixels físicos, mantendo esses valores lógicos 1×. Preferir default medido; retina não é obrigação.

Painel de altura variável usa border-image/nine-slice equivalente com centro repetido/preenchido e bordas preservadas, com insets de conteúdo derivados da arte. Botões mantêm proporção e posicionam texto dentro do label rect, inclusive em 320px; permitir texto secundário/ajuda fora da imagem quando necessário. Primário usa normal/hover/pressed/disabled. Secundário usa normal/pressed; não existe hover próprio e hover não pode herdar imagem primária. Foco é contorno semântico adicional, sem inventar sprite. Disabled não recebe aparência hover/pressed ou cursor de ação.

Separar catálogo DOM e conjunto obrigatório da arena, ou declarar explicitamente o subconjunto usado por Pixi; conservar exports/contratos necessários aos consumidores existentes. Novos assets DOM não entram em ASSET_URLS de combate por iteração indiscriminada. Falta de imagem decorativa mantém fundo CSS, texto e controles legíveis; não introduz erro obrigatório de arena. Atualizar testes de manifesto/cache somente conforme a separação real e créditos pelos recursos efetivamente usados.

### Snapshot e replay como integração existente

Não mudar `preparePlay`, configuração nem finalização para acomodar o formulário. Validar via UI Save → Play → observar configuração capturada; alterar storage externo durante Playing e constatar snapshot idêntico. Concluir por relógio real da simulação controlado em teste, retornar ao menu, fazer novo Save, abrir Last Result e acionar Play Again. Novo matchId e opções novas coexistem com resultado histórico intacto. Options não aparece em Loading/Playing/Paused; a edição posterior acontece somente após voltar ao menu.

### Validação e evidências

Testes puros do parser cobrem limites, frações válidas, sessão fracionária, spawn fora do passo, vazio, whitespace, não numéricos/não finitos e valores fora dos limites. Testes do adapter existente cobrem validação antes do writer, envelope corrompido e falha de escrita que mantém conteúdo anterior. Testes UI/E2E cobrem mensagens/aria, Save disabled/guard, navegação/foco e recarregamento; não adicionar infraestrutura de DOM de teste se os testes puros e Playwright cobrirem as fronteiras.

Playwright dev e preview: fluxo teclado (Tab/Shift+Tab/Enter/Space/Escape), touch via eventos reais, Save-refresh, Cancel-reabrir, defaults explicados sem escrita, Save negado e recuperação, avisos independentes, snapshot/replay e imagem DOM indisponível. Reusar relógio/controladores de observação existentes para término real; não injetar score, morte ou resultado para demonstrar sucesso. Setup de storage corrompido/negado é fixture de ambiente, não consulta remota fictícia.

Inspecionar imagens de menu com/sem Last Result; Options válido/inválido/aviso/falha; primary normal/hover/pressed/disabled e secondary normal/pressed/foco. Desktop 1280×900, 320×568 e landscape 844×390: sem overflow horizontal, texto cortado, distorção ou ações inalcançáveis. Rolagem vertical é válida. Redirecionar Playwright/browser-evidence para `project/automation-reports/07-implement-menu-and-options`, preservando integralmente 01–06. Executar lint, typecheck, Vitest, build antes do E2E e regressão pertinente de lifecycle/carregamento; registrar comandos, exit codes e limitações reais.

## Risks / Trade-offs

- [Bordas de painel e texto variável em tela baixa] → nine-slice, fluxo normal/rolagem vertical, safe areas e inspeção visual em três viewports.
- [Input decimal e valor intermediário] → strings preservadas, parsing completo e domínio autoritativo, com testes de passo sem normalização silenciosa.
- [Storage pode falhar inclusive no getter] → adapter defensivo existente; sucesso só após escrita confirmada e erro recuperável no formulário.
- [Aviso antigo reaparece ou aviso independente some] → origem separada e regressão corrupção+Save+Play com outros avisos simultâneos.
- [Alteração do manifesto afeta cache/diagnósticos] → explicitar conjunto Pixi e verificar carregamento/Retry/teardown existentes e ausência de dependência em nova decoração DOM.
- [E2E headless não prova dispositivo físico] → declarar essa limitação; evidência touch e layout demonstra navegador sem alegar benchmark mobile.

## Migration Plan

Implementar e verificar apenas esta change sobre o checkout existente, sem alteração de schema de storage. Atualizar docs de entrega em inglês e preservar evidências anteriores. Rollback de UI não exige migração de dados: os envelopes v1 continuam válidos. Não há deploy nesta fase nem publicação autorizada por esta change.
