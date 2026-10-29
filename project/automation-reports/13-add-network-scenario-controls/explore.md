# Explore — add-network-scenario-controls (Incremento 13)

**Data de conclusão:** 28/10/2026  
**Agente responsável:** `/root/i13_explore`  
**Modo de operação:** Exploração técnica, diagnóstico arquitetural e desenho preliminar de implementação (sem alterações em código de produto, `openspec/changes/` ou `project/automation-state.json`).

---

## 1. Resumo Executivo e Status da Exploração

O Incremento 13 tem como objetivo projetar e estruturar o sistema completo de **Cenários de Rede MSW e Controles de Diagnóstico**, em estrito atendimento à Seção 13 do Game Design Document (GDD):
> *"MSW scenarios must reproduce success, empty lists, multiple pages, slow and variable latency, out-of-order responses, timeout, connection errors, 4xx/5xx, per-tab failures, timeout after commit, and end-of-match outage followed by recovery. Provide a documented scenario selector and reset action. Resetting mock demo data must not silently affect an active battle. Seed fixtures and latency for reproducible tests. Confirmed data and the outbox survive refresh."*

Durante a investigação técnica:
1. **Mapeamento Arquitetural**: Projetou-se o orquestrador central em `src/mocks/scenarios.ts`, desacoplado do código de produção e consumido de maneira uniforme pelo Service Worker do navegador (`browser.ts`), pelo servidor Node para Vitest (`server.ts`) e pelos testes E2E do Playwright.
2. **Catálogo Completo dos 12 Cenários**: Definiu-se o contrato exato e os comportamentos dos 12 perfis de simulação de rede exigidos pelo GDD, incluindo casos complexos como *timeout após commit*, *respostas fora de ordem* e *queda temporária com recuperação automática*.
3. **Política Estrita de Reset de Estado**: Estabeleceu-se uma política explícita onde o "Reset Mock Data" restaura unicamente o dataset canônico de fixtures (`pirate-battle.confirmed-matches.v1`), preservando intocadas as opções do jogador (`pirate-battle.options.v1`), identidade (`pirate-battle.identity.v1`), último resultado (`pirate-battle.last-result.v1`), pendências da outbox (`pirate-battle.outbox.v1`) e preferências de áudio (`pirate-battle.sound-muted.v1`).
4. **Preservação Inviolável da Partida Ativa**: Garantiu-se que a alteração do cenário de rede ou o acionamento do reset de fixtures jamais reinicie, congele, encerre ou afete de qualquer forma uma partida em andamento no componente `<Arena>`.
5. **Seletor Visual e Painel de Diagnóstico na UI**: Desenhou-se um painel temático e acessível no `MainMenu` (`src/ui/screens/MainMenu.tsx`), compatível com WAI-ARIA, legível em viewports a partir de 320 CSS px e com suporte a `?networkScenario=<id>` na URL para automação e depuração.
6. **Estratégia OpenSpec**: Definiu-se a criação da spec primária `network-scenario-controls` acompanhada de delta pontual em `mock-rest-api`.

---

## 2. Diagnóstico da Base Atual e Lacunas Técnicas

### 2.1 O que já está implementado no projeto
- **MSW v3.0.3**:
  - `src/mocks/browser.ts`: `setupWorker(...handlers)` ativado em `src/main.tsx` via `initMocks()`.
  - `src/mocks/server.ts`: `setupServer(...handlers)` utilizado em testes Vitest (`tests/api.test.ts`, etc.).
  - `src/mocks/handlers.ts`: Handlers REST para `GET /api/ranking`, `GET /api/players/:playerId/matches` e `POST /api/matches`.
- **Repositório Persistido de Partidas Confirmadas**:
  - `src/mocks/store.ts`: Armazenamento de partidas sob `pirate-battle.confirmed-matches.v1` com ordenação determinística, paginação, suporte à idempotência em `POST /api/matches` e método `reset(fixtures)`.
  - `src/mocks/fixtures.ts`: 11 partidas determinísticas de capitães pré-populadas.
- **Outbox Persistente e Menu Reativo**:
  - `src/data/outboxStore.ts` e `src/data/outboxService.ts`: Fila atômica com backoff exponencial e recuperação automática.
  - `src/ui/screens/LeaderboardTabs.tsx`: Visualização paginada com TanStack Query, `keepPreviousData` e cancelamento via `AbortSignal`.

### 2.2 Lacunas identificadas para o Incremento 13
1. **Ausência de Módulo Orquestrador de Cenários**:
   - Atualmente, os handlers em `handlers.ts` operam de forma estática, sem uma camada intermediária que consulte o cenário ativo antes de despachar a resposta.
2. **Mecanismo Provisório e Hardcoded de Outage**:
   - `client.ts` e `handlers.ts` possuem checagens rudimentares (`?networkScenario=outage` ou `__mockNetworkOutage`) construídas provisoriamente durante o Incremento 11 para testar a outbox. Essas checagens devem ser substituídas por um motor unificado e declarativo em `src/mocks/scenarios.ts`.
3. **Ausência dos 12 Cenários Exigidos pelo GDD**:
   - Não há suporte a `empty`, `multi-page`, `slow-jitter`, `out-of-order`, `timeout`, `offline`, `error-4xx`, `error-5xx`, `isolated-tab-failure`, `commit-timeout` e `temporary-outage`.
4. **Ausência de Painel de Controle de Cenários na UI**:
   - Não existe interface visual para desenvolvedores ou playtesters selecionarem cenários em runtime ou acionarem o reset de dados mockados.
5. **Falta de Sincronização entre LocalStorage e URL Params**:
   - A seleção do cenário ativo precisa ser reativa e compartilhada entre a URL (para testes Playwright) e o armazenamento local/memória (para navegação interativa).

---

## 3. Arquitetura do Orquestrador de Cenários (`src/mocks/scenarios.ts`)

### 3.1 Tipos e Catálogo de Cenários
Criação do módulo `src/mocks/scenarios.ts` com identificadores tipados:

```typescript
export type NetworkScenarioId =
  | 'default'
  | 'empty'
  | 'multi-page'
  | 'slow-jitter'
  | 'out-of-order'
  | 'timeout'
  | 'offline'
  | 'error-4xx'
  | 'error-5xx'
  | 'isolated-tab-failure'
  | 'commit-timeout'
  | 'temporary-outage';

export interface NetworkScenarioDefinition {
  readonly id: NetworkScenarioId;
  readonly label: string;
  readonly description: string;
}
```

### 3.2 Resolução em Cascata do Cenário Ativo
Para garantir compatibilidade entre testes automatizados, navegação em preview e uso interativo, o cenário ativo é resolvido de acordo com a seguinte precedência:

1. **Parâmetro de URL (`?networkScenario=<id>`)**: Precedência máxima. Permite que suites do Playwright e links diretos forcem cenários específicos sem depender de estado anterior no navegador.
2. **LocalStorage (`pirate-battle.network-scenario.v1`)**: Persiste a escolha feita pelo desenvolvedor/testador através do seletor da UI entre recarregamentos de página.
3. **Override em Memória (`window.__pbNetworkScenario`)**: Permite que scripts de teste e consoles de depuração alternem cenários instantaneamente sem I/O síncrono.
4. **Fallback Default (`'default'`)**: Estado nominal quando nenhuma configuração estiver ativa.

### 3.3 Estrutura de Gestão e Notificação de Mudanças
O módulo fornecerá métodos limpos:
- `getNetworkScenario(): NetworkScenarioId`
- `setNetworkScenario(scenario: NetworkScenarioId): void`
- `resetNetworkScenario(): void`
- `onScenarioChange(listener: (scenario: NetworkScenarioId) => void): () => void`
- `resetMockData(): void` (invoca `confirmedMatchesStore.reset()`, reseta contadores de cenários transientes e invalida queries TanStack Query)

---

## 4. Detalhamento dos 12 Cenários Exigidos pelo GDD

| # | Cenário ID | Comportamento no Ranking | Comportamento no Histórico | Comportamento no POST /api/matches | Efeito Visível / Propósito de Teste |
|---|---|---|---|---|---|
| 1 | `default` | 200 OK determinístico (11 fixtures) | 200 OK determinístico | 201 Created / 200 Idempotente | Operação nominal com baixa latência (~0-50ms). |
| 2 | `empty` | 200 OK com `{ items: [], totalItems: 0 }` | 200 OK com `{ items: [], totalItems: 0 }` | 201 Created / 200 Idempotente | Exibe mensagens literais do GDD: *"No matches for these settings yet."* e *"No completed matches yet."*. |
| 3 | `multi-page` | 200 OK com dataset expandido (35+ itens, 4 páginas) | 200 OK com histórico expandido (25+ itens) | 201 Created / 200 Idempotente | Testa paginação completa: botões Prev/Next, indicadores "Page 1 of 4", navegação sem truncamento. |
| 4 | `slow-jitter` | 200 OK com atraso variável (1.500ms a 2.500ms) | 200 OK com atraso variável (1.500ms a 2.500ms) | 201/200 com atraso de ~2.000ms | Valida estados de carregamento suave (`aria-busy`), `keepPreviousData` sem piscamento e não bloqueio do menu. |
| 5 | `out-of-order` | Respostas sofrem latência alternada (req 1: 1.500ms, req 2: 150ms) | Respostas sofrem latência alternada | 201/200 OK | Valida que o `AbortSignal` cancela requisições anteriores e que respostas atrasadas jamais sobrescrevem páginas recentes. |
| 6 | `timeout` | Requisição nunca conclui ou excede o timeout do cliente (delay > 30s) | Idem | Idem | Testa comportamento sob timeout: Result vai para `Pending — Retry`, tabs exibem Retry manual. |
| 7 | `offline` | Falha imediata de rede (`HttpResponse.error()`) | Falha imediata de rede (`HttpResponse.error()`) | Falha imediata de rede (`HttpResponse.error()`) | Simula desconexão física/modo avião. Axios recebe `ERR_NETWORK`. |
| 8 | `error-4xx` | Retorna 400 Bad Request | Retorna 400 Bad Request | Retorna 400 Bad Request / 409 Conflict | Valida interrupção imediata de retentativas automáticas na outbox (`permanentFailure = true`) sem loop infinito. |
| 9 | `error-5xx` | Retorna 500 Internal Server Error | Retorna 500 Internal Server Error | Retorna 500 Internal Server Error | Valida retentativas automáticas com backoff exponencial na outbox até o limite de 3 tentativas antes de marcar failed. |
| 10 | `isolated-tab-failure` | Retorna 500 Internal Server Error | Retorna 200 OK com dados válidos | 201/200 OK | Demonstra isolamento total por aba: Ranking exibe erro e botão Retry, enquanto Histórico opera com sucesso total. |
| 11 | `commit-timeout` | 200 OK | 200 OK | **Grava atomicamente no store**, mas **aborta/derruba a resposta HTTP** | O cliente outbox não recebe a confirmação e agenda retry. O próximo retry envia payload idêntico, recebe 200 OK via idempotência sem duplicar o registro! |
| 12 | `temporary-outage` | Retorna erro nas primeiras 2 tentativas; 3ª tentativa em diante retorna 200 OK | Idem | Retorna falha nas 2 primeiras requisições; subsequente retorna 201/200 OK | Valida recuperação automática de ponta a ponta: partida conclui em falha -> outbox agenda retentativa -> serviço se restabelece -> sincronização bem-sucedida. |

---

## 5. Controle de Estado, Política de Reset e Preservação de Partida Ativa

### 5.1 Política Explícita de Reset de Mock Data
O GDD estabelece de forma categórica que o acionamento de "Reset Mock Data":
- **O QUE É RESTAURADO**:
  1. A chave `pirate-battle.confirmed-matches.v1` é resetada para o array canônico inicial `DETERMINISTIC_FIXTURES`.
  2. Contadores e estados voláteis de cenários temporários (como a contagem de falhas do cenário `temporary-outage` e o marcador de queda de `commit-timeout`) são reiniciados.
  3. O cache do TanStack Query sob os prefixos `['ranking']` e `['history']` é invalidado para atualizar a visualização imediatamente.
- **O QUE NUNCA É TOCADO**:
  1. **Opções do Jogador** (`pirate-battle.options.v1`): Durações de sessão e intervalos de spawn personalizados são mantidos intactos.
  2. **Identidade Local** (`pirate-battle.identity.v1`): O UUID e o nome `Captain-XXXX` permanecem inalterados.
  3. **Último Resultado** (`pirate-battle.last-result.v1`): O resumo da última partida concluída na sessão não é apagado.
  4. **Fila Outbox** (`pirate-battle.outbox.v1`): Partidas pendentes de envio pelo jogador continuam salvas para retentativa.
  5. **Preferência de Áudio** (`pirate-battle.sound-muted.v1`): O estado do som permanece o escolhido pelo usuário.

### 5.2 Garantia de Inviolabilidade da Partida Ativa
O componente `<Arena>` executa a simulação determinística de física e combate em uma thread de animação desacoplada de rede.
- Nenhuma alteração no cenário ativo de rede (`setNetworkScenario`) ou acionamento de reset de fixtures dispara recarregamento de página (`window.location.reload()`) ou desmontagem do componente `<Arena>`.
- Partidas em andamento continuam recebendo inputs de teclado/mouse/toque e atualizando a simulação sem qualquer sobressalto.
- Quando o combate chega ao fim (`player_destroyed` ou `time_expired`), o resultado é materializado e gravado na outbox local. A submissão via rede então responderá de acordo com o cenário que estiver configurado naquele instante.

---

## 6. Seletor Visual e Painel de Diagnóstico na UI

### 6.1 Posicionamento e Integração no Menu Principal
- Localizado no `MainMenu` (`src/ui/screens/MainMenu.tsx`), logo abaixo de `LeaderboardTabs`.
- Estruturado em um container semântico e discreto:
  ```tsx
  <details className="network-scenario-panel" aria-label="Network Scenario Controls">
    <summary>Network Scenarios & Developer Tools</summary>
    <div className="scenario-panel-content">
      <div className="scenario-field">
        <label htmlFor="scenario-select">Active Scenario:</label>
        <select
          id="scenario-select"
          value={activeScenario}
          onChange={(e) => handleScenarioChange(e.target.value as NetworkScenarioId)}
        >
          {/* Opções dos 12 cenários */}
        </select>
      </div>
      <p className="scenario-description">{currentScenarioMeta.description}</p>
      <div className="scenario-actions">
        <button type="button" className="secondary" onClick={handleResetMockData}>
          Reset Mock Data
        </button>
        {activeScenario !== 'default' && (
          <button type="button" className="secondary" onClick={handleRestoreDefaultScenario}>
            Restore Default Scenario
          </button>
        )}
      </div>
      {statusNotice && <p className="scenario-status" role="status" aria-live="polite">{statusNotice}</p>}
    </div>
  </details>
  ```

### 6.2 Ergonomia e Acessibilidade (WCAG e Mobile)
- **Acessibilidade**:
  - Uso de elementos nativos `<select>`, `<button>`, `<label>` e `<details>`.
  - Mensagens de confirmação de reset renderizadas em containers com `role="status"` e `aria-live="polite"`.
- **Design Responsivo**:
  - O painel contrai em telas estreitas (320px) sem gerar estouro horizontal no layout.
  - Alvos de clique possuem altura mínima de 44 CSS px para toque confortável em telas táteis.
  - O visual utiliza a mesma paleta temática de pergaminho náutico (ouro envelhecido `#d4af37`, fundo marinho profundo e bordas chanfradas).

---

## 7. Modelagem no OpenSpec

Para a fase **Propose**, a modelagem será organizada da seguinte forma:

1. **Nova Especificação**: `openspec/specs/network-scenario-controls/spec.md`
   - Requisito 1: *Orquestrador de cenários de rede MSW com 12 perfis regulamentares*.
   - Requisito 2: *Controle de ativação e precedência de cenários (URL > Storage > Default)*.
   - Requisito 3: *Política estrita de reset de mock data e preservação de dados do usuário*.
   - Requisito 4: *Inviolabilidade e desacoplamento de partidas ativas*.
   - Requisito 5: *Painel de controle visual e acessível no Menu Principal*.
2. **Delta de Especificação**: `openspec/specs/mock-rest-api/spec.md`
   - Adicionar requisito/cenário indicando que as rotas `/api/*` delegam suas respostas e latências ao motor de cenários em `src/mocks/scenarios.ts`.

---

## 8. Estratégia de Testes Automatizados

1. **Testes Unitários e de Integração (Vitest)**:
   - Novo arquivo de teste `tests/scenarios.test.ts`:
     - Validação dos 12 cenários de forma isolada através do cliente de dados e do MSW Node server.
     - Teste de `commit-timeout`: POST /api/matches persiste no store mas retorna erro de rede; retentativa subsequente com o mesmo `matchId` retorna 200 OK sem criar duplicata.
     - Teste de `isolated-tab-failure`: Ranking retorna 500 e Histórico retorna 200.
     - Teste de `temporary-outage`: Requisição falha 2 vezes e sucede na 3ª.
     - Teste de `resetMockData()`: comprova restauração de `pirate-battle.confirmed-matches.v1` e preservação integral de `pirate-battle.options.v1`, `pirate-battle.identity.v1`, `pirate-battle.last-result.v1` e `pirate-battle.outbox.v1`.
2. **Testes de Integração com a UI (Vitest + Testing Library)**:
   - Alternância de cenários no seletor do `MainMenu`.
   - Acionamento do botão "Reset Mock Data" e exibição da mensagem de status sem quebrar navegação ou foco.

---

## 9. Conclusão e Recomendação para a Fase Propose

A exploração técnica confirmou a total viabilidade da solução arquitetural proposta. O design centralizado em `src/mocks/scenarios.ts` elimina o código provisório de simulação, unifica os 12 perfis do GDD sob uma interface declarativa robusta e entrega uma ferramenta indispensável para desenvolvedores, avaliadores e suites de testes automatizados.

Recomenda-se avançar diretamente para a fase **Propose** da change `add-network-scenario-controls`.
