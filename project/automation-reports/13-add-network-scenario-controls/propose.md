# Propose — add-network-scenario-controls (Incremento 13)

Concluído em 28/10/2026 por `/root/i13_propose`. Fase estritamente de planejamento conduzida com base em `.agents/skills/openspec-propose/SKILL.md` e sob a autorização prévia registrada no runbook `project/automation.md`. Nenhum código de produto (`src/`), teste (`tests/`), arquivo de configuração ou `project/automation-state.json` foi editado. Nenhum comando de commit, push, deploy ou publicação foi executado.

## 1. Escopo e Fontes Consultadas

- **Diretrizes e Requisitos**:
  - `GDD.md`: Seção 13 (Technical design boundaries: cenários MSW para sucesso, listas vazias, paginação múltipla, latência lenta/variável, out-of-order, timeout, erros de conexão, 4xx/5xx, falha por aba, timeout após commit e queda temporária seguida de recuperação; seletor documentado de cenários e ação de reset de fixtures; reset de dados mockados não pode afetar silenciosamente uma batalha ativa; fixtures e latência semeadas para testes reproduzíveis; dados confirmados e outbox sobrevivem ao refresh) e Seções 8, 9 e 12.
  - `project/automation-reports/13-add-network-scenario-controls/explore.md`: Diagnóstico arquitetural completo da base atual (MSW 3.0.3, `handlers.ts`, `store.ts`, `outboxStore.ts`), identificação do código provisório de simulação de indisponibilidade (`__mockNetworkOutage`), especificação formal dos 12 perfis regulamentares de simulação, resolução em cascata (URL > LocalStorage > Window > Default), política estrita de preservação de chaves locais do jogador e desacoplamento inviolável da simulação de combate no `<Arena>`.
  - `openspec/config.yaml`: Schema `spec-driven` e conformidade com idioma pt-BR (com cabeçalhos e termos normativos SHALL/MUST em inglês).
- **Inventário de Capacidades e Specs Existentes**:
  - Avaliação das specs existentes em `openspec/specs/`, em especial `mock-rest-api` (interceptação HTTP MSW e store de partidas confirmadas), `result-outbox` (fila atômica e retentativas pós-batalha) e `ranking-and-history` (visualização de abas paginadas com TanStack Query).

## 2. Artefatos Criados

A change `add-network-scenario-controls` foi criada em `openspec/changes/add-network-scenario-controls/` sob o schema `spec-driven`, contemplando todos os artefatos de planejamento exigidos:

1. **`proposal.md`**:
   - Motivação estruturada na necessidade de reproduzir, testar e verificar de forma determinística os 12 cenários de rede exigidos pelo GDD, substituindo mecanismos ad-hoc por um orquestrador desacoplado e controles de diagnóstico integrados.
   - Escopo completo de alterações: catálogo tipado dos 12 cenários, resolução de precedência em cascata, injeção declarativa nos interceptores MSW, política segura de reset de dados mockados com preservação incondicional de dados de usuário/sessão, garantia de não perturbação de partidas ativas na arena e painel visual acessível no `MainMenu`.
   - Declaração explícita de capabilities: criação da nova capability `network-scenario-controls` e delta na capability existente `mock-rest-api`.

2. **Delta Specs em `specs/`**:
   - `specs/network-scenario-controls/spec.md`: Nova capability completa com `Purpose` (>50 caracteres) e 5 requisitos canônicos normativos com descrições concisas (<= 500 caracteres) e cenários `WHEN/THEN` formatados com exatamente 4 hashtags (`####`):
     - `Requirement: Catálogo de cenários de rede com 12 perfis regulamentares`: orquestrador com 12 perfis regulamentares (`default`, `empty`, `multi-page`, `slow-jitter`, `out-of-order`, `timeout`, `offline`, `error-4xx`, `error-5xx`, `isolated-tab-failure`, `commit-timeout` e `temporary-outage`).
     - `Requirement: Resolução hierárquica e precedência do cenário ativo`: ordem estrita de precedência (Parâmetro de URL `?networkScenario=<id>` > LocalStorage `pirate-battle.network-scenario.v1` > Override em memória `window.__pbNetworkScenario` > Fallback `default`).
     - `Requirement: Política estrita de reset de mock data e preservação de dados locais`: restauração canônica restrita a `pirate-battle.confirmed-matches.v1` e contadores transientes, com preservação inviolável de `pirate-battle.options.v1`, `pirate-battle.identity.v1`, `pirate-battle.last-result.v1`, `pirate-battle.outbox.v1` e áudio, além de invalidação do cache TanStack Query.
     - `Requirement: Desacoplamento e preservação da simulação ativa`: garantia de que a troca de cenário ou o reset de fixtures não reinicia, congela nem altera o estado, score ou timers de uma partida em andamento no `<Arena>`.
     - `Requirement: Painel visual de controle e diagnóstico na interface`: componente expansível no `MainMenu` com `<select>`, descrição textual dinâmica, botão primário "Reset Mock Data", botão condicional "Restore Default Scenario", anúncios em `role="status"` / `aria-live="polite"` e ergonomia para viewports a partir de 320 CSS px.
   - `specs/mock-rest-api/spec.md`: Delta da capability existente sob `## MODIFIED Requirements`:
     - `Requirement: Inicialização resiliente e interceptação com Mock Service Worker`: atualização do requisito preservando a resiliência na inicialização e estendendo a interceptação das rotas `/api/*` para delegar ao orquestrador de cenários de rede, aplicando latências, mutações e falhas configuradas.

3. **`design.md`**:
   - Decisões técnicas e arquiteturais detalhadas:
     - Módulo orquestrador central em `src/mocks/scenarios.ts` independente de frameworks de UI, consumível por browser, Vitest e Playwright.
     - Resolução em cascata permitindo isolamento em testes E2E via query string sem contaminação de LocalStorage.
     - Mapeamento declarativo de cada um dos 12 cenários em handlers MSW.
     - Isolamento estrito de `resetMockData` para proteger opções, identidade, outbox e áudio.
     - Arquitetura desacoplada da `<Arena>`, mantendo o loop de renderização/física intocado por alterações de rede.
     - Especificação de acessibilidade (WAI-ARIA, `aria-live`, alvos mínimos de 44px) e contenção visual no `MainMenu`.
     - Análise de riscos e mitigações (concorrência entre abas, vazamento de estado em testes, falsos positivos em `commit-timeout`, prevenção de esperas excessivas em testes unitários).

4. **`tasks.md`**:
   - 9 tarefas rastreáveis distribuídas em 4 grupos lógicos estruturados:
     - Grupo 1: Orquestrador de Cenários de Rede (2 tarefas: módulo tipado, resolução e função `resetMockData`).
     - Grupo 2: Integração Declarativa aos Handlers do MSW (3 tarefas: rotas GET/POST, 12 cenários, limpeza de parâmetros ad-hoc).
     - Grupo 3: Painel Visual de Diagnóstico e Controles na UI (2 tarefas: componente expansível, acessibilidade WAI-ARIA e estilização responsiva).
     - Grupo 4: Testes de Integração e Desacoplamento da Arena (2 tarefas: testes de desacoplamento e validação de suíte completa).
   - Cada tarefa define explicitamente seus critérios e comandos de verificação (`npm run build`, `npm test`, testes unitários/componentes em Vitest).

## 3. Validação Estrita OpenSpec

Validações executadas via shell PowerShell com Node `v26.11.1`:

| Comando | Exit Code | Resultado |
|---|---|---|
| `openspec.cmd status --change add-network-scenario-controls --json` | 0 | `isPlanningComplete: true`, `isComplete: true`, todos os 4 artefatos marcados como `done`. |
| `openspec.cmd validate add-network-scenario-controls --strict` | 0 | Change `add-network-scenario-controls` 100% válida sob validação estrita. |
| `openspec.cmd validate --all --strict` | 0 | 19 itens validados com sucesso (18 specs + 1 change), 0 falhas. |

## 4. Próximos Passos (Handoff para Apply)

O planejamento da change `add-network-scenario-controls` referente ao Incremento 13 está concluído e estritamente validado.
Nenhum código de produto foi implementado nesta etapa. O coordenador pode registrar a conclusão da fase de proposta e acionar o executor da fase `apply` (`/root/i13_apply`) para iniciar a implementação dos 12 perfis no orquestrador MSW, injeção nos handlers, painel de diagnóstico no `MainMenu` e testes automatizados.
