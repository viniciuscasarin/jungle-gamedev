# Propose — publish-game-release (Incremento 17)

Concluído em 29/10/2026 por `/root/i17_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md` e diretrizes do usuário. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado nesta fase. Nenhum comando de commit, push, deploy ou publicação foi executado.

---

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Parâmetros Autorizados**:
  - Repositório remoto autorizado: `viniciuscasarin/jungle-gamedev` (acesso autenticado via `gh CLI` e Git Credential Manager).
  - Destino de hospedagem: Netlify (integrado ao repositório GitHub da conta).
  - Diretriz estrita de versionamento: ao commitar, separar os commits por tema, subsistema e funcionalidade (histórico granular, limpo e profissional).
  - `GDD.md`: Seção 15 ("Delivery sequence and estimate" — Milestone 5 "Delivery validation") e Seção 16 ("Playtest questions and remaining decisions" — validação operacional da URL pública).
  - `project/automation-reports/17-publish-game-release/explore.md`: Diagnóstico consolidado de remotes Git, análise da árvore de trabalho untracked, especificação técnica de `netlify.toml`, compatibilidade do Mock Service Worker (MSW) sob HTTPS estático, plano de 12 commits atômicos temáticos e protocolo de 7 etapas de smoke test pós-publicação.
  - `openspec/config.yaml`: Schema `spec-driven` e conformidade com o idioma pt-BR (mantendo cabeçalhos estruturais e palavras normativas SHALL/MUST em inglês).
- **Inventário de Capacidades e Specs Existentes**:
  - Avaliação das 22 specs existentes em `openspec/specs/`, definindo a fronteira arquitetural para a nova especificação primária `public-deployment`.

---

## 2. Artefatos Criados

A change `publish-game-release` foi criada em `openspec/changes/publish-game-release/` sob o schema `spec-driven`, contemplando todos os artefatos de planejamento exigidos:

1. **`proposal.md`**:
   - Motivação fundamentada na necessidade de cumprir o Milestone 5 do GDD ("Delivery validation"), publicando a versão de produção do Pirate Battle 2D em URL pública HTTPS no Netlify integrada ao repositório GitHub `viniciuscasarin/jungle-gamedev`.
   - Escopo detalhado das alterações: criação do manifesto `netlify.toml` (comando de build, publish dist, redirect SPA 200 e cabeçalhos de segurança e cache); cabeçalhos dedicados para `/mockServiceWorker.js` (`Service-Worker-Allowed: /` e `no-cache`); testes automatizados de integridade de release (`tests/deploymentPackage.test.ts`); plano de 12 commits temáticos atômicos em Conventional Commits; sincronização com o branch `main` no GitHub; protocolo de 7 etapas de smoke test pós-deploy; e atualização de `README.md` com a URL pública e esclarecimento do mock client-side por navegador.
   - Declaração explícita da nova capability: `public-deployment`.

2. **Delta Specs em `specs/`**:
   - `specs/public-deployment/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 6 requisitos canônicos normativos com descrições concisas (<= 500 caracteres) e cenários `WHEN/THEN` formatados com exatamente 4 hashtags (`####`):
     - `Requirement: Manifesto declarativo de hospedagem Netlify`: manifesto `netlify.toml` na raiz especificando build command `npm run build`, publish `dist`, redirect SPA 200 (`/* -> /index.html 200`) e cabeçalhos de segurança (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
     - `Requirement: Entrega e cabeçalhos do Mock Service Worker em produção`: cabeçalhos dedicados para `/mockServiceWorker.js` com `Service-Worker-Allowed: /`, `Content-Type: application/javascript; charset=utf-8` e `Cache-Control: no-cache, no-store, must-revalidate`.
     - `Requirement: Versionamento modular e commits temáticos no GitHub`: histórico granular organizado em 12 commits temáticos atômicos por subsistema e sincronizado no branch `main` com o remote `viniciuscasarin/jungle-gamedev`.
     - `Requirement: Testes automatizados de integridade do deploy`: suíte automatizada `tests/deploymentPackage.test.ts` validando a sintaxe e diretivas do manifesto `netlify.toml` e o pacote de distribuição.
     - `Requirement: Roteiro de smoke test da versão pública em produção`: protocolo em 7 etapas atestando entrada direta, refresh SPA, carregamento de assets, inicialização do MSW, combate fluido a 60 FPS, registro de outbox e isolamento de sandbox de dados por navegador.
     - `Requirement: Transparência documental e orientações de release`: documentação no `README.md` com link direto da URL pública de produção e esclarecimento de que o Mock REST roda 100% client-side via Service Worker e LocalStorage.

3. **`design.md`**:
   - Decisões técnicas e arquiteturais fundamentadas no relatório de exploração:
     - Decisão 1: Manifesto declarativo `netlify.toml` para orquestração reproduzível de build e deploy como código (IaC).
     - Decisão 2: Cabeçalhos específicos para `/mockServiceWorker.js` e políticas de cache para bundle e HTML.
     - Decisão 3: Estratégia dos 12 commits atômicos temáticos em Conventional Commits (`setup`, `simulation`, `render`, `audio`, `input`, `api`, `data`, `ui`, `e2e`, `docs`, `openspec`, `deploy`).
     - Decisão 4: Configuração de remote origin HTTPS e adoção do branch padrão `main` para alinhamento com GitHub e Netlify.
     - Decisão 5: Roteiro de smoke test em 7 etapas na URL pública e teste automatizado de integridade.
     - Decisão 6: Documentação explícita do caráter local por navegador do Mock REST API e isolamento de Web Storage.
   - Análise de riscos e mitigações (bloqueio de worker, controle de cache e disponibilidade de deploy).
   - Plano de migração detalhado e estratégia de rollback instantâneo via Netlify.

4. **`tasks.md`**:
   - 14 tarefas rastreáveis distribuídas em 4 grupos lógicos estruturados:
     - Grupo 1: Configuração do Netlify e Testes de Integridade (3 tarefas: criação de `netlify.toml`, implementação de `tests/deploymentPackage.test.ts` e verificação estrita de typecheck, lint, test e build).
     - Grupo 2: Sequência de Commits Temáticos e Sincronização GitHub (4 tarefas: configuração de remote origin e branch `main`, execução dos commits 01 a 06, execução dos commits 07 a 12 e push upstream com `git push -u origin main`).
     - Grupo 3: Validação da Hospedagem Netlify e Smoke Test Pós-Publicação (4 tarefas: acompanhamento do build no Netlify, smoke test de acesso/assets/MSW, smoke test de partida/outbox/ranking e validação do caráter local em aba anônima).
     - Grupo 4: Finalização da Documentação e Auditoria OpenSpec (3 tarefas: atualização do `README.md` com a URL pública, sincronização da spec `public-deployment` e validação estrita do OpenSpec).
   - Cada tarefa define explicitamente seus critérios objetivos e comandos de verificação.

---

## 3. Validação Estrita OpenSpec

Validações executadas via shell PowerShell com Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change publish-game-release --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate publish-game-release --strict` | 0 | Change `publish-game-release` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 23 itens validados com sucesso (22 specs + 1 change), 0 falhas. |

---

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `publish-game-release` referente ao Incremento 17 está rigorosamente concluído e estritamente validado.
Nenhum código de produto foi implementado, nenhum commit foi gerado e nenhum push foi executado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e acionar o executor da fase `apply` (`/root/i17_apply`) para executar a criação dos arquivos de infraestrutura e testes de deploy, a sequência de 12 commits temáticos, o push para o GitHub, o deploy no Netlify, o smoke test pós-publicação e a finalização da entrega do Pirate Battle.
