# Propose — prepare-game-release (Incremento 16)

Concluído em 28/10/2026 por `/root/i16_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seção 15 ("Delivery sequence and estimate" — fundação, loop jogável, experiência, confiabilidade de dados, validação de entrega e a regra regulamentar pétrea: *"Licença sem comprovação continua pendente e não é presumida"*) e Seção 16 ("Playtest questions and remaining decisions" — auditoria documental e fechamento de pendências).
  - `project/automation-reports/16-prepare-game-release/explore.md`: Diagnóstico consolidado da documentação (`README.md` e `ARCHITECTURE.md`), identificação de artefatos de codificação mojibake, notas de execução Windows PowerShell (`npm.cmd` vs `npm.ps1`), inventário dos 520 arquivos de assets e do catálogo ativo de runtime (33 imagens e 27 áudios), auditoria de integridade do build em `dist/` com MSW e preview local (`http://127.0.0.1:4173`), e estruturação da matriz de marcos do GDD §15.
  - `openspec/config.yaml`: Schema `spec-driven` e conformidade com idioma pt-BR (mantendo cabeçalhos estruturais e palavras normativas SHALL/MUST em inglês).
- **Inventário de Capacidades e Specs Existentes**:
  - Avaliação das 21 specs existentes em `openspec/specs/`, definindo a fronteira arquitetural para a nova especificação `release-preparation`.

## 2. Artefatos Criados

A change `prepare-game-release` foi criada em `openspec/changes/prepare-game-release/` sob o schema `spec-driven`, contemplando todos os artefatos de planejamento exigidos:

1. **`proposal.md`**:
   - Motivação estruturada na necessidade de preparar a entrega regulamentar do jogo Pirate Battle 2D conforme os requisitos das Seções 15 e 16 do GDD.
   - Escopo detalhado das alterações: revisão e higienização de codificação de `README.md` e `ARCHITECTURE.md` (eliminando mojibake e adicionando notas de Windows PowerShell); guia operacional passo a passo dos 12 cenários de rede do MSW com URLs diretas (`?networkScenario=...`), métodos de reset e simulação de falhas (assets e storage); finalização de `ASSET_CREDITS.md` com inventário de 520 arquivos e classificação de ativos proprietários como pendentes de licença sem presunção de CC0/MIT; verificação do pacote autossuficiente em `dist/` com `mockServiceWorker.js` e preview local; suíte de testes de sanidade de release (`tests/releasePackage.test.ts`); e consolidação da matriz de marcos do GDD §15.
   - Declaração explícita da nova capability: `release-preparation`.

2. **Delta Specs em `specs/`**:
   - `specs/release-preparation/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 6 requisitos canônicos normativos com descrições concisas (<= 500 caracteres) e cenários `WHEN/THEN` formatados com exatamente 4 hashtags (`####`):
     - `Requirement: Documentação operacional e de reprodução de ambiente`: documentação técnica em inglês limpo cobrindo `npm ci`, `dev`, `build`, `preview`, `test` e `test:e2e`, com instruções explícitas para Windows PowerShell (`npm.cmd` e notas de `ExecutionPolicy`).
     - `Requirement: Guia operacional de cenários de rede e reprodução de falhas`: matriz operacional dos 12 cenários de rede do MSW com URLs diretas (`?networkScenario=...`), estados esperados na UI, comandos de reset e procedimentos de falha induzida para assets (`?assetScenario=fail-once`) e LocalStorage.
     - `Requirement: Inventário e matriz de licenças de ativos`: inventário completo de todos os arquivos de assets e do catálogo de runtime em `ASSET_CREDITS.md`, atestando a classificação formal dos assets do desafio como pendentes de comprovação documental sem presunção de licença livre, comprovando a liberação de elementos procedurais autorais e dependências OSS.
     - `Requirement: Integridade do pacote autossuficiente de produção`: pacote `dist/` autônomo com `index.html`, `mockServiceWorker.js` e bundles estáticos, sem variáveis `.env`, chaves secretas ou dependências de serviços pagos.
     - `Requirement: Matriz formal de marcos de entrega`: correspondência auditada entre os cinco marcos da Seção 15 do GDD, código versionado, build e evidências de testes, distinguindo inequivocamente itens entregues, validados e pendentes de destino externo.
     - `Requirement: Suíte automatizada de sanidade do release`: testes automatizados de verificação da higidez dos artefatos em `dist/` e tolerância a variações temporais assíncronas.

3. **`design.md`**:
   - Decisões técnicas e arquiteturais detalhadas:
     - Higienização de codificação UTF-8 eliminando mojibake e notas operacionais de execução em ambientes Windows PowerShell (`npm.cmd`).
     - Guia tabular operacional dos 12 cenários de rede e testes práticos de reprodução de falhas induzidas em assets e persistência.
     - Matriz jurídica rigorosa de procedência e licenciamento em `ASSET_CREDITS.md` em cumprimento estrito ao GDD §15 ("Licença sem comprovação continua pendente e não é presumida").
     - Integridade autossuficiente do pacote de produção com teste automatizado `tests/releasePackage.test.ts` e ajuste de margem de temporização em `tests/outbox.test.ts` (linha 197: 350ms → 450ms) para estabilidade sob carga de CPU.
     - Auditoria formal dos 5 marcos da Seção 15 do GDD, declarando bloqueios concretos para publicação externa (dependência de destino/credenciais no Incremento 17).
     - Análise de riscos e mitigações associadas.

4. **`tasks.md`**:
   - 13 tarefas rastreáveis distribuídas em 4 grupos lógicos estruturados:
     - Grupo 1: Refinamento Documental e Higienização de Codificação (4 tarefas: higienização de mojibake, notas de Windows PowerShell, matriz dos 12 cenários de rede e guia de reprodução de falhas).
     - Grupo 2: Finalização dos Créditos e Matriz de Licenças (3 tarefas: inventário de 520 assets e catálogo de runtime, formalização do status pendente dos assets do desafio e catalogação de geometrias autorais e dependências OSS).
     - Grupo 3: Validação do Pacote de Produção e Teste Automatizado de Release (3 tarefas: implementação de `tests/releasePackage.test.ts`, ajuste de tolerância no teste de outbox e validação do servidor de preview com MSW).
     - Grupo 4: Matriz de Entregáveis e Relatório de Auditoria de Release (3 tarefas: matriz dos 5 marcos do GDD §15, paridade de versão/build/evidências e declaração de bloqueios de publicação externa).
   - Cada tarefa define explicitamente seus critérios e comandos de verificação.

## 3. Validação Estrita OpenSpec

Validações executadas via shell PowerShell com Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change prepare-game-release --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate prepare-game-release --strict` | 0 | Change `prepare-game-release` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 22 itens validados com sucesso (21 specs + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `prepare-game-release` referente ao Incremento 16 está concluído e estritamente validado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e acionar o executor da fase `apply` (`/root/i16_apply`) para iniciar a implementação das tarefas de documentação, auditoria de licenças, testes de release e validação final da entrega.
