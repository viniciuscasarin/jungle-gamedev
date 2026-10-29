# Spec Delta

## Purpose

Define os requisitos normativos para o empacotamento de produção, configuração declarativa de hospedagem estática no Netlify, versionamento temático no GitHub, integridade de cabeçalhos do Service Worker e validação operacional via smoke test na URL pública entregue do Pirate Battle.

## ADDED Requirements

### Requirement: Manifesto declarativo de hospedagem Netlify
O repositório SHALL conter na raiz um manifesto `netlify.toml` que define o comando de build `npm run build`, o diretório de publicação `dist`, a regra de redirecionamento SPA (`/* -> /index.html 200`) e os cabeçalhos de segurança HTTP.

#### Scenario: Redirecionamento de rotas e segurança global
- **WHEN** uma requisição para uma rota interna ou recurso estático é processada pelo Netlify
- **THEN** a regra SPA entrega `index.html` com status 200 e os cabeçalhos de proteção (X-Frame-Options, X-Content-Type-Options e Referrer-Policy) são injetados na resposta

#### Scenario: Políticas de cache para bundle e HTML
- **WHEN** o navegador requisita `index.html` ou bundles com fingerprint em `/assets/*`
- **THEN** `index.html` é servido com `must-revalidate` e os arquivos de `/assets/*` recebem cache imutável de longa duração

### Requirement: Entrega e cabeçalhos do Mock Service Worker em produção
O manifesto de hospedagem SHALL configurar cabeçalhos específicos para `/mockServiceWorker.js`, assegurando `Service-Worker-Allowed: /`, `Content-Type: application/javascript; charset=utf-8` e diretivas que desabilitam cache persistente.

#### Scenario: Registro e escopo global do Service Worker
- **WHEN** o navegador carrega a aplicação na URL pública HTTPS e inicializa o Mock Service Worker
- **THEN** o worker é registrado com sucesso no escopo raiz `/` sem restrições de subcaminho

#### Scenario: Revalidação estrita do script do worker
- **WHEN** o navegador solicita `/mockServiceWorker.js` na origem de produção
- **THEN** os cabeçalhos `no-cache, no-store, must-revalidate` garantem que atualizações do script sejam refletidas sem retenção em cache obsoleto

### Requirement: Versionamento modular e commits temáticos no GitHub
O código do projeto, suítes de teste, assets, especificações e documentação SHALL ser versionado no GitHub através de commits temáticos atômicos organizados por subsistema e sincronizado no branch `main` do repositório remoto.

#### Scenario: Histórico estruturado por subsistema
- **WHEN** o histórico de commits do repositório é inspecionado na branch `main`
- **THEN** cada commit isola um domínio funcional específico (setup, simulação, render, áudio, input, api, outbox, ui, testes, documentação e deploy) em conformidade com Conventional Commits

#### Scenario: Sincronização upstream com remote origin
- **WHEN** o branch local `main` é sincronizado com o remote `viniciuscasarin/jungle-gamedev`
- **THEN** o repositório remoto reflete o histórico completo e disponibiliza o código-fonte para o pipeline do Netlify

### Requirement: Testes automatizados de integridade do deploy
A suíte de testes automatizados SHALL validar a existência, estrutura sintática e diretivas obrigatórias do arquivo `netlify.toml`, bem como a conformidade do pacote final de distribuição.

#### Scenario: Validação das diretivas do netlify.toml
- **WHEN** a suíte de testes de deployment é executada via Vitest
- **THEN** os testes confirmam a presença do comando de build, publish dist, redirect SPA 200 e cabeçalhos essenciais do `mockServiceWorker.js`

#### Scenario: Verificação pré-deploy da integridade do build
- **WHEN** os scripts de verificação estrita (`typecheck`, `lint`, `test` e `build`) são disparados
- **THEN** todos os comandos completam com código de saída zero sem violações ou warnings impeditivos

### Requirement: Roteiro de smoke test da versão pública em produção
A entrega SHALL ser validada através de smoke test na URL pública de produção, confirmando entrada direta, integridade de assets, inicialização do MSW, jogabilidade fluida, persistência local e recuperação de outbox.

#### Scenario: Acesso direto e ciclo de jogo na URL pública
- **WHEN** o avaliador acessa a URL pública HTTPS e completa uma sessão de batalha
- **THEN** os assets carregam sem erros, a simulação opera a 60 FPS e o resultado da partida é processado pela API simulada

#### Scenario: Isolamento e persistência por navegador
- **WHEN** o jogo é acessado em navegadores ou sessões anônimas distintas
- **THEN** cada ambiente mantém seu próprio estado de ranking e outbox no LocalStorage da origem, sem interferência cruzada

### Requirement: Transparência documental e orientações de release
O arquivo `README.md` SHALL disponibilizar o link direto para a URL pública em produção, instruções de navegação e a documentação do caráter local por navegador do Mock Service Worker.

#### Scenario: Disponibilização da URL pública no README
- **WHEN** o usuário ou avaliador consulta a seção de deploy no `README.md`
- **THEN** encontra o endereço público ativo no Netlify e as instruções de verificação operacional

#### Scenario: Esclarecimento sobre o mock client-side
- **WHEN** a documentação de arquitetura é consultada sobre o funcionamento da API
- **THEN** o texto explicita que o MSW roda localmente no navegador via Service Worker e Web Storage, sem persistência em banco de dados centralizado
