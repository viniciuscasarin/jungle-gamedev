# Design

## Context

O Pirate Battle 2D possui sua base de código completamente implementada e validada ao longo dos incrementos 1 a 16 (motor determinístico, renderizador PixiJS, sintetizador de áudio, controles teclado/touch, API mock com MSW, persistência com Outbox em LocalStorage, menus e HUD em React, suíte E2E em Playwright e orçamentos de desempenho). No entanto, conforme diagnosticado na exploração (`project/automation-reports/17-publish-game-release/explore.md`), esses arquivos residem no diretório de trabalho como *untracked* em relação ao Git, nenhum remote está configurado localmente e a infraestrutura de publicação pública no Netlify ainda não está declarada no repositório.

Para cumprir o Milestone 5 do GDD ("Delivery sequence and estimate"), é necessário orquestrar a publicação em ambiente HTTPS estático com regras de roteamento SPA e cabeçalhos adequados para o Service Worker, além de versionar o projeto de forma modular no GitHub. Ver `proposal.md` para motivação e escopo geral.

## Goals / Non-Goals

**Goals:**
- Configurar o manifesto declarativo `netlify.toml` para automação de compilação (`npm run build`), diretório de saída (`dist`), fallback SPA (`/* -> /index.html 200`) e políticas de cabeçalhos HTTP.
- Definir cabeçalhos HTTP dedicados para `/mockServiceWorker.js` assegurando escopo global (`Service-Worker-Allowed: /`) e revalidação mandatória sob HTTPS.
- Estruturar e aplicar uma sequência estrita de 12 commits temáticos atômicos cobrindo 100% dos arquivos do workspace em conformidade com Conventional Commits.
- Conectar o repositório local ao remote `viniciuscasarin/jungle-gamedev` no branch `main` e sincronizar o histórico upstream.
- Estabelecer um roteiro de smoke test em 7 etapas na URL pública do Netlify cobrindo carregamento, assets, MSW, partida desktop/mobile, outbox e ranking.
- Documentar explicitamente a arquitetura client-side autônoma e o caráter local por navegador do Mock Service Worker.

**Non-Goals:**
- Não provisionar backend remoto centralizado ou banco de dados em nuvem. A arquitetura segue estritamente o modelo client-side offline-first com MSW e LocalStorage especificado no GDD.
- Não refatorar a simulação física, a renderização gráfica ou as regras de negócio consolidadas nos incrementos anteriores.
- Não executar commits, push ou deploys nesta fase de planejamento (exclusivo para a fase `apply`).
- Não modificar o arquivo `project/automation-state.json`.

## Decisions

### 1. Manifesto declarativo `netlify.toml`
- **Decisão**: Adotar um arquivo declarativo `netlify.toml` na raiz do repositório contendo as seções `[build]`, `[[redirects]]` e `[[headers]]`.
- **Justificativa**: Centraliza toda a infraestrutura de deploy como código (IaC), permitindo reproduzibilidade independente da UI do Netlify, versionamento auditável e aplicação automática a cada push em `main`.
- **Alternativas consideradas**:
  - *Configuração manual via painel web do Netlify*: Rejeitada por falta de rastreabilidade, risco de desvio de configuração e ausência de histórico no Git.
  - *Arquivo `_redirects` e `_headers` legados*: Rejeitada por ser fragmentada e menos expressiva que o formato TOML estruturado.

### 2. Cabeçalhos HTTP para `mockServiceWorker.js` e políticas de cache
- **Decisão**: Configurar explicitamente para `/mockServiceWorker.js`:
  - `Content-Type: application/javascript; charset=utf-8`
  - `Service-Worker-Allowed: /`
  - `Cache-Control: no-cache, no-store, must-revalidate`
  E para os assets gerados em `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`. Para `index.html`: `Cache-Control: public, max-age=0, must-revalidate`.
- **Justificativa**: A especificação de Service Workers exige contexto seguro (HTTPS) e restringe o escopo ao diretório onde o script está hospedado a menos que o cabeçalho `Service-Worker-Allowed: /` esteja presente. Além disso, o worker nunca pode ficar preso em cache de longa duração, permitindo atualizações imediatas, enquanto os bundles com hash podem ser armazenados agressivamente.
- **Alternativas consideradas**:
  - *Manter cabeçalhos padrão do CDN*: Rejeitada pelo risco de o CDN do Netlify aplicar cache prolongado ao script do worker ou de navegadores restringirem o escopo.

### 3. Sequência de 12 commits temáticos atômicos
- **Decisão**: Organizar os arquivos não rastreados do projeto em 12 commits atômicos temáticos:
  1. `chore(setup)`: Tooling, TypeScript, Vite & ESLint (`.gitignore`, `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `index.html`).
  2. `feat(simulation)`: Deterministic Engine, Physics & Combat (`src/domain/*`, `src/simulation/*`, `tests/simulation*.test.ts`, etc.).
  3. `feat(render)`: PixiJS Arena Renderer & Visual Effects (`src/render/*`, `tests/render*.test.ts`, `tests/viewport.test.ts`, etc.).
  4. `feat(audio)`: Web Audio Synthesizer & Sound Effects (`src/audio/*`, `tests/audio.test.ts`).
  5. `feat(input)`: Keyboard, Mouse & Touch Input Controls (`src/input/*`, `tests/touch.test.ts`).
  6. `feat(api)`: MSW REST Mock, Contracts & Scenarios (`public/mockServiceWorker.js`, `src/api/*`, `src/mocks/*`, `tests/api.test.ts`, etc.).
  7. `feat(data)`: Match Outbox, Storage & Query Layer (`src/storage/*`, `src/data/*`, `tests/storage.test.ts`, `tests/outbox*.test.ts`).
  8. `feat(ui)`: React HUD, Menus, Leaderboard & Lifecycle (`src/main.tsx`, `src/ui/*`, `tests/hud.test.ts`, etc.).
  9. `test(e2e)`: Playwright Suite & Visual Regression Baselines (`playwright.config.ts`, `tests/e2e/*`).
  10. `docs`: Architecture, Asset Credits & Delivery Guides (`README.md`, `ARCHITECTURE.md`, `ASSET_CREDITS.md`, `tests/releasePackage.test.ts`).
  11. `chore(openspec)`: Specs, Archived Changes & Reports (`openspec/specs/*`, `openspec/changes/archive/*`, `project/*`).
  12. `chore(deploy)`: Netlify Hosting Config & Public Release (`netlify.toml`, `openspec/changes/publish-game-release/*`, `openspec/specs/public-deployment/*`, `tests/deploymentPackage.test.ts`).
- **Justificativa**: Atende formalmente à diretriz do usuário (*"separar os commits por tema, funcionalidades, etc."*), estabelece histórico modular, legível e profissional, e facilita revisões de código.
- **Alternativas consideradas**:
  - *Commit monolítico ("feat: complete project")*: Rejeitada por contrariar as diretrizes do usuário e dificultar auditorias.
  - *Commit individual por arquivo (+100 commits)*: Rejeitada por gerar ruído excessivo e fragmentação desnecessária.

### 4. Configuração de branch `main` e remote GitHub
- **Decisão**: Configurar o remote `origin` apontando para `https://github.com/viniciuscasarin/jungle-gamedev.git`, renomear o branch local atual de `master` para `main` com `git branch -M main` e publicar com `git push -u origin main`.
- **Justificativa**: O Netlify e o GitHub adotam `main` como branch padrão para integração contínua e publicação automática.
- **Alternativas consideradas**:
  - *Manter branch `master`*: Rejeitada para manter padronização moderna e evitar reconfigurações manuais de branch no painel do Netlify.

### 5. Roteiro de smoke test em 7 etapas pós-publicação
- **Decisão**: Formalizar e executar um protocolo de verificação da URL pública do Netlify:
  1. *Entrada Direta*: Acesso à raiz HTTPS, status HTTP 200, carregamento de HTML e bundle.
  2. *Refresh*: Recarregamento F5 comprovando regra de SPA fallback sem 404.
  3. *Assets*: Imagens PNG e áudios WAV servidos sem erros.
  4. *MSW sob HTTPS*: Console log `[MSW] Mocking enabled`, interceptação de `/api/ranking` e `/api/health`.
  5. *Partida Desktop e Mobile*: Combate funcional a 60 FPS com controles de teclado/mouse e touch.
  6. *Encerramento e Outbox*: Registro de partida, post em `/api/matches` com status 201 e atualização da aba de Ranking.
  7. *Isolamento por Navegador*: Acesso em janela anônima validando sandbox de LocalStorage independente.
- **Justificativa**: Cumpre com rigor o critério de entrega do Milestone 5 do GDD (*"URL pública funcional vinculada à versão entregue e smoke test registrado"*).

### 6. Documentação do caráter local do mock por navegador
- **Decisão**: Registrar explicitamente no `README.md` e em `design.md` que o backend opera através de Mock Service Worker (MSW) client-side com persistência em `LocalStorage`.
- **Justificativa**: Esclarece aos avaliadores que pontuações e históricos não são sincronizados entre diferentes computadores ou visitantes, pois cada navegador opera sua própria sandbox local isolada e privada, conforme desenhado para a arquitetura do desafio.

## Risks / Trade-offs

- **[Risco: Bloqueio de Service Worker por extensões de terceiros ou modo privado restrito]** → *Mitigação*: A implementação em `src/mocks/init.ts` já conta com timeout de 1500ms e captura defensiva de exceções. Se o worker falhar ou for bloqueado, o jogo prossegue em modo de simulação autônoma sem travar a interface.
- **[Risco: Conflito de cache entre builds sucessivos do Netlify]** → *Mitigação*: Configuração de `Cache-Control: public, max-age=0, must-revalidate` para `index.html` e uso de hashes nos nomes de arquivos em `/assets/*` gerados pelo Vite.
- **[Risco: Falha de deploy externo no Netlify por timeout de build]** → *Mitigação*: A compilação é estática e veloz (<5s); validação prévia de `npm run build` local garante que o Netlify executará exatamente o mesmo comando com sucesso. Conforme diretriz, se houver indisponibilidade externa no Netlify, o status permanecerá explicitamente relatado.

## Migration Plan

1. **Fase Apply - Preparação e Infraestrutura**:
   - Criar `netlify.toml` na raiz.
   - Criar `tests/deploymentPackage.test.ts` e validar localmente com Vitest.
   - Executar verificadores estritos (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`).
2. **Fase Apply - Git e Versionamento**:
   - Renomear branch para `main` (`git branch -M main`).
   - Adicionar remote origin (`git remote add origin https://github.com/viniciuscasarin/jungle-gamedev.git`).
   - Executar os 12 commits temáticos respeitando o mapeamento planejado.
   - Realizar o push para o GitHub (`git push -u origin main`).
3. **Fase Apply - Publicação e Smoke Test**:
   - Acompanhar publicação automática no Netlify.
   - Obter URL pública gerada.
   - Executar o protocolo de smoke test em 7 etapas.
   - Atualizar `README.md` com a URL pública e detalhes de release.
4. **Estratégia de Rollback**:
   - Em caso de necessidade de reversão, o painel do Netlify oferece rollback instantâneo com um clique para qualquer deploy anterior com base nos hashes de commit do Git.
