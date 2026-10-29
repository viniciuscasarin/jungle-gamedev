# Validação — preparação inicial e landscape mobile

Data: 29/10/2026. Mudança: `add-startup-loader-and-mobile-landscape`.

## Ambiente efetivamente verificado

- Windows, runtime de referência Node **26.11.1** e npm **11.20.0**.
- Playwright 1.64.1, Chromium headless **156.0.8078.4**.
- Dev em `http://127.0.0.1:5173` e build/preview em `http://127.0.0.1:4173`.
- Desktop 1280×900, ponteiro primário fine e touch adicional emulado; janela fine
  estreita 320×568 também permanece utilizável.
- Mobile coarse emulado: landscape 844×390 e 568×320, proteção portrait 390×844.
  Viewport quadrado e classificação coarse/fine também têm testes unitários.

Não houve dispositivo mobile físico disponível neste ambiente. Não foram
verificados Safari, Firefox, rotação física, notch real ou reprodução audível em
hardware. As evidências Chromium e os mocks de APIs não comprovam bloqueio físico
universal. Os insets não nulos são CSS controlado, identificados como emulação.

## Verificações de código

`npm run typecheck`, `npm run lint`, `npm test` e `npm run build` passaram no runtime
de referência. Vitest: **375 testes, 33 arquivos**. O build conserva os avisos
informativos de tamanho de chunk; não houve erro de compilação.

Os testes cobrem deduplicação do conjunto de 80 recursos, progresso fora de ordem,
sucessos parciais, Retry somente do trabalho faltante, timeout de 30 segundos e
conclusão obsoleta. Leases concorrentes e cache quente preservam as texturas; uma
conclusão tardia não descarrega a textura em uso. Imagens DOM aguardam decode e
nunca são convertidas em texturas apenas para decorar a interface.

Áudio: transferência sem criar/desbloquear AudioContext, ausência de reprodução
antes de gesto, reaproveitamento dos bytes no primeiro efeito, mute e alternativa
silenciosa, incluindo abort por timeout. O Chromium consultado expõe Web Audio,
Screen Orientation e fullscreen; a disponibilidade da função não garante que o
navegador aceite uma solicitação real de bloqueio.

## Evidência de navegador

Resultado consolidado: **84/84 cenários de fluxo aprovados**, nos dois projetos,
incluindo os percursos completos de Options e Result. Dez regressões selecionadas
da arena passaram (o cancelamento gráfico foi repetido após ajustar a observação
de RAF ao relógio controlado), além dos oito cenários visuais. A validação de áudio
inclui também uma partida iniciada em mute e desmutada sem nova transferência.

A suíte de fluxo verifica carregamento inicial, mocks e módulos atrasados, progresso
abaixo de 100 enquanto o bootstrap está pendente, frases a cada três segundos sem
deslocamento, um único progressbar acessível, falha/Retry de logo, DOM e textura e
erro fatal do bundle. O listener estático também funciona após o Vite mover o script
de entrada no build de produção.

Os caminhos de orientação permitido, fullscreen necessário, recusado e API ausente
são simulados explicitamente. Em todos eles, o viewport continua decidindo a
proteção, a rotação manual funciona e sair de fullscreen não solicita novo bloqueio.

Rotações com contatos mantidos verificam liberação de comandos/capturas, auto-sail
Off, conservação de matchId, posição, saúde, score, tempo e cooldowns, e retorno a
Paused até Resume. Preparação gráfica que termina em portrait permanece no passo
zero. Options conserva rascunho e foco no campo editado em rotações repetidas;
Escape não contorna a proteção. Retry em portrait, Tab, alvos mínimos de 48×48,
safe areas controladas e reduced-motion também são exercitados.

Regressões da arena verificam cinco ciclos de montagem/descarte, texturas quentes,
falha pós-Play com `assetScenario=fail-once`, falha gráfica, cancelamento de preparação
e limpeza de contatos sem canvas, listeners ou capturas órfãos. Os listeners de
orientação do shell permanecem como baseline entre partidas. O cenário completo
de Options → partida → Result → Last Result foi verificado em desktop e mobile.

## Inspeção visual

Foram inspecionadas capturas de abertura, progresso parcial, falha inclusive sem
logo, proteção portrait, menu e batalha pausada em landscape. Fundo preto, branco
sólido, contorno de 2 CSS px, proporção 2:1 do logo e texto/ações legíveis foram
confirmados. O menu conserva rolagem vertical em landscape curto. Somente três
snapshots mobile mudaram: menu, Options e batalha; os baselines desktop passaram.

- Capturas diretas: arquivos PNG nesta pasta.
- Evidências adicionais: `arena-evidence/`; capturas de Options constam nos anexos
  do relatório de fluxo.
- Relatório de fluxo: `flow-report/index.html`; log: `final-e2e.log`.
- Resumo da execução final: `flow-summary.json` (passed, nenhuma falha).
- Relatório visual: `visual-report/index.html` (8 cenários aprovados; 8 seleções
  opostas de projeto ignoradas, conforme o filtro desktop/mobile preexistente).
- Recuperação estática: `bootstrap-report/index.html` (8 cenários aprovados).
- Cancelamento gráfico: `cancel-report/index.html` (2 cenários aprovados).
- Logs locais: `unit-tests.log` e `build.log`.

Nenhuma publicação, migração de dados ou alteração de regras de gameplay faz parte
desta validação. A mudança permanece disponível para revisão antes de arquivamento.
