# Tasks

## 1. Configuração do Netlify e Testes de Integridade

- [x] 1.1 Criar o arquivo `netlify.toml` na raiz com comando de build (`npm run build`), diretório de saída (`dist`), redirect SPA 200 (`/* -> /index.html`) e cabeçalhos de segurança e cache HTTP, verificando a sintaxe e a existência do arquivo no disco.
- [x] 1.2 Implementar a suíte de testes automatizados `tests/deploymentPackage.test.ts` para verificar o manifesto `netlify.toml`, as regras de redirecionamento SPA e os cabeçalhos do Service Worker, verificando a aprovação via `npx.cmd vitest run tests/deploymentPackage.test.ts`.
- [x] 1.3 Executar os verificadores estritos locais do projeto (`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test -- --run` e `npm.cmd run build`), verificando que todos completam com código de saída zero e geram `dist/` com `mockServiceWorker.js`.

## 2. Sequência de Commits Temáticos e Sincronização GitHub

- [x] 2.1 Configurar o remote `origin` apontando para `https://github.com/viniciuscasarin/jungle-gamedev.git` e renomear o branch local atual para `main`, verificando com `git remote -v` e `git branch`.
- [x] 2.2 Executar os commits temáticos 01 a 06 (`chore(setup)`, `feat(simulation)`, `feat(render)`, `feat(audio)`, `feat(input)`, `feat(api)`) isolando cada subsistema conforme o plano do design, verificando o histórico com `git log --oneline`.
- [x] 2.3 Executar os commits temáticos 07 a 12 (`feat(data)`, `feat(ui)`, `test(e2e)`, `docs`, `chore(openspec)`, `chore(deploy)`) cobrindo todos os arquivos restantes, verificando que o comando `git status` reporta árvore de trabalho limpa.
- [x] 2.4 Sincronizar o branch `main` com o repositório remoto via `git push -u origin main`, verificando a publicação completa dos commits no GitHub.

## 3. Validação da Hospedagem Netlify e Smoke Test Pós-Publicação

- [x] 3.1 Acompanhar o acionamento e a conclusão do build de produção no Netlify, confirmando a disponibilização e resolução da URL pública HTTPS.
- [x] 3.2 Executar as etapas 1 a 4 do protocolo de smoke test na URL pública (acesso direto, refresh SPA, carregamento de assets e inicialização do MSW sob HTTPS), verificando respostas HTTP 200 e mensagem de mocking no console.
- [x] 3.3 Executar as etapas 5 e 6 do protocolo de smoke test na URL pública (partida interativa desktop/mobile, disparo de canhões, encerramento com outbox e atualização de ranking), verificando envio bem-sucedido para a API simulada.
- [x] 3.4 Validar a etapa 7 do protocolo de smoke test abrindo o jogo em janela anônima ou navegador secundário, confirmando o isolamento do LocalStorage e o caráter local por visitante.

## 4. Finalização da Documentação e Auditoria OpenSpec

- [x] 4.1 Atualizar o `README.md` com a URL pública oficial do Netlify, instruções operacionais e esclarecimento sobre o caráter local por navegador do Mock Service Worker, verificando os links e formatação.
- [x] 4.2 Sincronizar a especificação delta `public-deployment` para as especificações principais em `openspec/specs/public-deployment/spec.md`, verificando a integridade do catálogo de especificações.
- [x] 4.3 Executar a validação estrita completa através de `openspec.cmd validate publish-game-release --strict` e `openspec.cmd validate --all --strict`, confirmando código de saída zero sem avisos pendentes.
