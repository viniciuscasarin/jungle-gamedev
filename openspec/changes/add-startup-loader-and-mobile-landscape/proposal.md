# Proposal

## Why

No primeiro acesso, o menu é apresentado antes de suas imagens estarem disponíveis, deixando elementos temporariamente invisíveis. O carregamento atual começa somente após Play e cobre texturas da arena; além disso, o mobile permite portrait, contrariando a experiência desejada de jogar sempre com o aparelho deitado.

## What Changes

- Apresentar uma tela preta desde a abertura, antes da inicialização assíncrona, com o logo existente `assets/logo_jungle_gaming.svg` centralizado.
- Exibir abaixo do logo uma barra com contorno branco sólido e preenchimento branco proporcional ao progresso real, seguida de frases engraçadas de pirata que alternam durante a espera.
- Preparar todos os assets visuais usados pelo menu, Options, HUD e arena antes de revelar o menu; compartilhar recursos com o carregamento posterior de Play, sem montar uma partida antecipadamente.
- Antecipar também a transferência dos sons usados pelo jogo, sem tocar áudio nem exigir desbloqueio antes de um gesto; áudio indisponível mantém o comportamento silencioso existente.
- Oferecer Retry sem recarregar a página quando um recurso visual falhar, mantendo os recursos já carregados e uma mensagem legível independente das imagens.
- **BREAKING**: os recursos decorativos visuais passam a participar da prontidão inicial; sua falha impede revelar uma interface incompleta até Retry concluir. Eles continuam separados das texturas de combate no renderer.
- **BREAKING**: no mobile, exigir landscape para acessar menu, opções, resultado e combate. Solicitar bloqueio nativo quando disponível, com tela para girar o aparelho como alternativa; retornar a portrait durante uma partida pausa e neutraliza comandos, exigindo Resume após voltar a landscape.

## Capabilities

### New Capabilities

- `mobile-orientation`: política de landscape no mobile, solicitação de bloqueio suportado pelo navegador, proteção em portrait e coordenação com pausa, foco e carregamento.

### Modified Capabilities

- `application-shell`: apresentação inicial antes do menu, visual e semântica do carregamento, frases temáticas e precedência das telas de orientação.
- `asset-loading`: preparação inicial rastreável de recursos visuais e transferência de áudio, progresso verificável, reaproveitamento de cache e recuperação de falhas.
- `responsive-hud`: apresentação touch em landscape e proteção da interface em portrait mobile.
- `arena-rendering`: enquadramento nos estados permitidos e preservação da partida quando a orientação interrompe sua apresentação.
- `touch-input`: exceção explícita à conservação de comandos em resize quando a mudança para portrait exige pausa.

## Impact

Afeta `index.html`, `src/main.tsx`, o shell em `src/ui/App.tsx`, estilos, os manifestos/cache em `src/render`, a preparação de recursos em `src/audio` e a integração de pausa e foco. Serão necessários adaptadores de carregamento inicial e orientação, testes unitários e E2E, atualização seletiva das expectativas mobile e documentação de arquitetura e assets.

Não altera regras, balanceamento, API, persistência ou publicação. Não transforma o projeto em PWA nem aplicativo nativo, não gira artificialmente o canvas e não carrega arquivos não utilizados apenas por estarem em `assets/`. A interface e as frases permanecem em inglês, seguindo o produto existente. A implementação deverá usar as dependências atuais.
