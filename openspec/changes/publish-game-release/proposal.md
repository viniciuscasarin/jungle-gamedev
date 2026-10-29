# Proposal

## Why

Cumprir o Milestone 5 do Game Design Document (GDD Seção 15 - "Delivery sequence and estimate") e os requisitos finais do projeto Pirate Battle 2D, publicando a versão de produção em URL pública acessível e estável hospedada no Netlify a partir do repositório remoto `viniciuscasarin/jungle-gamedev`. Essa entrega formaliza o ciclo completo de desenvolvimento com um histórico de versionamento limpo e atômico estruturado por temas funcionais, garantindo que o jogo estático com backend simulado (Mock Service Worker) funcione plenamente em ambiente HTTPS para qualquer avaliador externo.

## What Changes

- Criação do manifesto declarativo `netlify.toml` na raiz do projeto com comando de build (`npm run build`), diretório de saída (`dist`), regra de redirecionamento SPA (`/* -> /index.html 200`) e políticas de cabeçalhos HTTP.
- Configuração de cabeçalhos HTTP para `/mockServiceWorker.js` garantindo escopo global (`Service-Worker-Allowed: /`) e revalidação mandatória (`Cache-Control: no-cache, no-store, must-revalidate`).
- Configuração de cabeçalhos de cache otimizados para assets imutáveis fingerprinted (`/assets/*`) e revalidação instantânea do `index.html`.
- Adição da suíte de testes automatizados `tests/deploymentPackage.test.ts` para validação da integridade de `netlify.toml` e consistência do pacote de distribuição estático.
- Organização e aplicação de 12 commits temáticos atômicos cobrindo todo o histórico do código, testes, documentação e infraestrutura, seguindo o padrão Conventional Commits.
- Configuração do remote `origin` apontando para `https://github.com/viniciuscasarin/jungle-gamedev.git`, transição do branch local para `main` e publicação remota via `git push`.
- Execução e registro do roteiro formal de smoke test ponta a ponta na URL pública HTTPS gerada pelo Netlify.
- Atualização do `README.md` com o link direto da URL pública e esclarecimento formal sobre o funcionamento do mock REST local por navegador.

## Capabilities

### New Capabilities
- `public-deployment`: Define os requisitos normativos de configuração declarativa da hospedagem estática no Netlify, empacotamento e entrega de Service Worker sob HTTPS, histórico de commits temáticos no GitHub, testes de integridade de release e validação operacional pós-deploy via smoke test na URL pública.

### Modified Capabilities

*(Nenhuma capacidade existente tem seus requisitos modificados. Todos os requisitos de simulação, áudio, render, combate, hud e outbox permanecem intactos).*

## Impact

- **Código e Configuração**: Adição de `netlify.toml` na raiz e novo arquivo de teste `tests/deploymentPackage.test.ts`. Atualização de `README.md`.
- **Controle de Versão**: Repositório Git local associado ao remote `origin` no GitHub com branch padrão `main` e histórico granular de 12 commits atômicos.
- **Ambiente de Hospedagem**: Netlify provisiona automaticamente builds contínuos a partir de `main`, entregando a aplicação estática com suporte a HTTPS e Service Worker.
- **Persistência e APIs**: Mantida estritamente a arquitetura client-side onde o Mock Service Worker e a Outbox operam isolados no LocalStorage do navegador do usuário, sem necessidade de servidores externos ou banco de dados compartilhado.
