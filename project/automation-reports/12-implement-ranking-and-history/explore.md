# Explore — implement-ranking-and-history (Incremento 12)

**Data de conclusão:** 28/10/2026  
**Agente responsável:** `/root/i12_explore`  
**Modo de operação:** Exploração técnica, diagnóstico arquitetural e desenho preliminar (sem alterações em código de produto, `openspec/changes/` ou `project/automation-state.json`).

---

## 1. Resumo Executivo e Status da Exploração

O Incremento 12 tem por objetivo transformar os placeholders inativos de "Ranking" e "Match History" no Menu Principal em duas abas totalmente funcionais, paginadas e acessíveis, alimentadas por `@tanstack/react-query` e integradas aos endpoints do Mock REST API criados no Incremento 10 e confirmados pela Outbox no Incremento 11.

Durante a investigação:
1. Avaliou-se o layout de `MainMenu.tsx`, identificando a transição da atual seção `.future-actions` para um container acessível de abas baseado no padrão WAI-ARIA (`tablist`, `tab`, `tabpanel`).
2. Mapeou-se a integração de `@tanstack/react-query` v5.105 com query keys compostas e granulares:
   - Ranking: `['ranking', configurationKey, page, pageSize]`
   - Histórico: `['history', playerId, page, pageSize]`
3. Definiu-se a estratégia de paginação suave com 10 itens por página utilizando `placeholderData: keepPreviousData`, preservando a tabela visível durante transições de página sem piscamento de layout.
4. Identificou-se a necessidade de suporte a cancelamento de requests obsoletos via `AbortController` (integrando o parâmetro `signal` aos métodos `getRanking` e `getPlayerMatches` do cliente Axios em `src/data/client.ts`).
5. Confirmou-se o isolamento visual estrito: erros em qualquer uma das abas exibem mensagem dedicada e botão "Retry", sem bloquear o fluxo de jogo ("Play") ou edição de configurações ("Options").
6. Validaram-se as mensagens canônicas do GDD para coleções vazias:
   - Ranking: `"No matches for these settings yet."`
   - Histórico: `"No completed matches yet."`
7. Mapeou-se a sincronização reativa com a Outbox: ajuste em `outboxService.ts` para invalidar queries sob o prefixo `['history']` (além de `['ranking']`), assegurando atualização imediata após confirmação de entrega de nova partida.
8. Estruturou-se a modelagem no OpenSpec: criação da spec `ranking-and-history` e delta na spec `menu-options`.

---

## 2. Diagnóstico da Base Atual e Lacunas Identificadas

### 2.1 O que já está disponível no projeto
- **Endpoints REST mockados (MSW v3)**:
  - `GET /api/ranking?configurationKey=...&page=...&pageSize=...`: ordenação determinística (score DESC, completedAt ASC, matchId ASC) e filtragem estrita por `configurationKey`.
  - `GET /api/players/:playerId/matches?page=...&pageSize=...`: histórico cronológico decrescente por jogador.
  - `POST /api/matches`: gravação idempotente de partidas com base unificada em `pirate-battle.confirmed-matches.v1`.
- **Infraestrutura HTTP e Cache**:
  - `src/data/client.ts` com métodos `getRanking`, `getPlayerMatches` e `postMatch`.
  - `src/data/queryClient.ts` com instância configurada de `QueryClient`.
  - `App.tsx` já envolve toda a aplicação com `<QueryClientProvider client={queryClient}>`.
- **Outbox Persistente e Confiável**:
  - `outboxStore` e `outboxService` persistindo resultados e despachando em segundo plano com retentativas e backoff.
- **Identidade e Configurações**:
  - Identidade local do jogador (`playerId` UUID e `playerName` Captain-XXXX) persistida em `localStorage`.
  - `configurationKey(config)` derivando chave canônica unificada `gameplay-v1:...`.

### 2.2 Lacunas existentes para o Incremento 12
1. **Placeholders Inativos no MainMenu**:
   - `MainMenu.tsx` contém botões `disabled` em `<div className="future-actions">` que apenas exibem texto estático informando que Ranking e Histórico não estão disponíveis.
2. **Ausência de Hooks TanStack Query Dedicados**:
   - Não existem hooks React (`useRankingQuery`, `usePlayerHistoryQuery` ou equivalentes) para encapsular paginação, controle de estado, cache e cancelamento.
3. **Ausência de `AbortSignal` no Cliente Axios**:
   - `client.ts` atualmente descarta o `signal` do TanStack Query, impossibilitando que requisições obsoletas (por troca rápida de página ou aba) sejam abortadas no nível de rede.
4. **Descompasso na Invalidação da Outbox**:
   - `outboxService.ts` atualmente invalida `['ranking']` e `['playerMatches']`. A query key recomendada e padronizada para o histórico é `['history']`. É necessário alinhar a invalidação para cobrir `['history']`.
5. **Apresentação Explícita do Filtro de Configuração**:
   - Falta exibir na interface do Ranking qual configuração está sendo consultada (ex: "Configuration: 120s match · 3.0s spawn"), prevenindo a impressão de que scores sumiram caso o jogador altere as opções de partida.

---

## 3. Arquitetura de Abas no Menu Principal

### 3.1 Padrão WAI-ARIA e Acessibilidade
Para garantir conformidade com as diretrizes do GDD (seções 9 e 10):
- **Container de Abas**:
  - Elemento com `role="tablist"` e `aria-label="Rankings and History"`.
- **Botões de Aba**:
  - Cada aba possui `role="tab"`, `id="tab-ranking"` e `id="tab-history"`.
  - `aria-selected`: `true` para a aba ativa e `false` para a inativa.
  - `aria-controls`: aponta para o ID do painel correspondente (`panel-ranking` / `panel-history`).
  - `tabIndex`: `0` na aba selecionada e `-1` nas demais.
  - Navegação por teclado: suporte a `ArrowLeft` / `ArrowRight` (e `Home` / `End`) para alternar foco entre abas.
- **Painéis de Conteúdo**:
  - Elementos com `role="tabpanel"`, `id="panel-ranking"` e `id="panel-history"`.
  - `aria-labelledby` referenciando a aba associada.
  - `hidden` quando a aba não estiver ativa.
  - `tabIndex={0}` para permitir foco em navegação sequencial por teclado.

### 3.2 Desacoplamento e Não Bloqueio
- O carregamento ou eventual falha de rede em qualquer aba opera de forma **100% isolada**:
  - Os botões "Play", "Options" e "Last Result" permanecem sempre ativos e clicáveis.
  - Uma falha na aba Ranking não impede a navegação para a aba Match History (e vice-versa).
  - O estado do jogo nunca trava caso o MSW ou a rede demore a responder.

### 3.3 Layout e Responsividade (Mínimo 320 CSS px)
- As tabelas e paginação devem caber em telas estreitas (320px) e suportar rolagem horizontal interna (`overflow-x: auto`) sem quebrar a borda decorativa da janela do menu:
  - No desktop: visualização em tabela clássica de alta legibilidade.
  - No mobile / 320px: fontes compactadas, colunas prioritárias legíveis, áreas de toque de botões de paginação e retry com pelo menos 44px de altura.

---

## 4. Design dos Hooks TanStack Query

### 4.1 Estrutura de Query Keys Granulares
As chaves de consulta devem incluir todos os parâmetros de filtragem e paginação:
```typescript
// Ranking Query Key
export const rankingQueryKey = (configurationKey: string, page: number, pageSize = 10) =>
  ['ranking', configurationKey, page, pageSize] as const;

// Player History Query Key
export const playerHistoryQueryKey = (playerId: string, page: number, pageSize = 10) =>
  ['history', playerId, page, pageSize] as const;
```

### 4.2 Paginação Suave com `keepPreviousData`
No TanStack Query v5, para evitar o efeito de "piscar" (flicker) com esqueleto a cada troca de página:
```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function useRanking(configurationKey: string, page: number, pageSize = 10) {
  return useQuery({
    queryKey: rankingQueryKey(configurationKey, page, pageSize),
    queryFn: ({ signal }) => apiClient.getRanking({ configurationKey, page, pageSize }, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function usePlayerHistory(playerId: string, page: number, pageSize = 10) {
  return useQuery({
    queryKey: playerHistoryQueryKey(playerId, page, pageSize),
    queryFn: ({ signal }) => apiClient.getPlayerMatches(playerId, { page, pageSize }, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: Boolean(playerId),
  });
}
```

### 4.3 Integração com `AbortController` (Cancelamento de Requests Obsoletos)
Atualizar `src/data/client.ts` para repassar o `signal` ao Axios:
```typescript
export interface RequestOptions {
  signal?: AbortSignal;
}

// client.ts:
async getRanking(query: RankingQuery, options?: RequestOptions): Promise<RankingResponse> {
  const response = await client.get<RankingResponse>('/api/ranking', {
    params: {
      configurationKey: query.configurationKey,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    },
    signal: options?.signal,
  });
  return response.data;
}

async getPlayerMatches(playerId: string, query?: PlayerMatchesQuery, options?: RequestOptions): Promise<PlayerMatchesResponse> {
  const response = await client.get<PlayerMatchesResponse>(`/api/players/${encodeURIComponent(playerId)}/matches`, {
    params: {
      page: query?.page ?? 1,
      pageSize: query?.pageSize ?? 10,
    },
    signal: options?.signal,
  });
  return response.data;
}
```
**Benefício:** Se o usuário clicar repetidamente em "Next", trocar de aba ou alternar filtros, as requisições em voo anteriores são canceladas imediatamente no browser, impedindo condições de corrida e desperdício de processamento.

---

## 5. Estados Visuais e Mensagens do GDD

### 5.1 Estados da Interface
| Estado | Comportamento Visual | Acessibilidade |
|---|---|---|
| **Loading Inicial** | Spinner ou indicador "Loading ranking…" / "Loading match history…" | `role="status"`, `aria-live="polite"` |
| **Background Refresh** | Mantém as linhas da página anterior com indicação sutil de atualização | `aria-busy="true"` no container da tabela |
| **Sucesso com Dados** | Renderiza tabela com 10 linhas por página e barra de paginação | `<table>` semântico, `aria-label="Leaderboard"` |
| **Coleção Vazia** | Exibe mensagem textual literal prescrita pelo GDD | `<p className="empty-notice">` |
| **Erro Isolado** | Exibe mensagem de erro e botão "Retry" | `role="alert"`, `button.retry` focado/acionável |

### 5.2 Mensagens Literais Canônicas do GDD (Seção 9)
- **Ranking Vazio:**
  > `"No matches for these settings yet."`
- **Histórico Vazio:**
  > `"No completed matches yet."`

### 5.3 Apresentação Explícita do Filtro no Ranking
O GDD exige explicitamente:
> *"Show the configuration filter so a changed setting does not appear to erase a previous score."*

Na aba de Ranking, o cabeçalho deve exibir:
- Um resumo legível dos parâmetros ativos:
  Exemplo: `Configuration: 120s session · 3.0s enemy spawn`
- Isso torna evidente ao jogador que o ranking é segmentado pela regra da partida e que partidas jogadas sob outros parâmetros (ex: 60s ou 90s) continuam registradas sob suas respectivas chaves.

### 5.4 Formatação dos Dados do Histórico
Conforme o GDD seções 9 e 12:
- **Data/Hora**: exibida no fuso horário e idioma local do usuário (`new Date(item.completedAt).toLocaleString()`).
- **Duração Ativa**: formatada em segundos (ex: `120.00 s` ou `2m 00s`).
- **Motivo de Término**: `Time expired` para `time_expired` e `Ship destroyed` para `player_destroyed`.
- **Pontuação**: número inteiro com destaque.
- **Configuração**: resumo compacto (ex: `120s / 3.0s spawn`).

---

## 6. Sincronização com a Outbox

### 6.1 Fluxo de Notificação e Invalidação
1. Quando uma partida termina, o resultado é colocado na Outbox (`outboxStore.enqueue`).
2. O serviço `outboxService.dispatchEntry` executa `postMatch` via HTTP.
3. Após a confirmação HTTP 200/201:
   - A entrada é removida da Outbox.
   - O `outboxService` aciona a invalidação de cache:
     ```typescript
     void qClient?.invalidateQueries({ queryKey: ['ranking'] });
     void qClient?.invalidateQueries({ queryKey: ['history'] });
     ```
4. O TanStack Query invalida por correspondência de prefixo (`queryKey: ['ranking']` e `queryKey: ['history']`), marcando como obsoletas todas as páginas em cache de ambas as coleções.
5. Se o jogador estiver no Menu Principal visualizando qualquer uma das abas, a interface atualiza os dados em segundo plano automaticamente, integrando a nova partida no ranking e no histórico sem recarregar a página.

---

## 7. Estratégia de Specs OpenSpec

### 7.1 Nova Spec vs Delta
- **Nova Spec Proposta: `ranking-and-history`**
  - **Purpose**: Especificar a apresentação de ranking e histórico de partidas paginados no Menu Principal, controle de abas acessíveis, gerenciamento de cache TanStack Query, estados de entrega e sincronização de cache pós-partida.
  - **Requirements**:
    1. *Navegação acessível por abas no Menu Principal* (WAI-ARIA, suporte a teclado, isolamento de fluxo).
    2. *Consulta paginada e cache de Ranking* (query key granular, 10 itens/página, `keepPreviousData`, filtro de configuração explícito).
    3. *Consulta paginada e cache de Histórico de Partidas* (query key por jogador local, ordenação cronológica decrescente, dados formatados no locale).
    4. *Resiliência visual, cancelamento de requisições e mensagens literais do GDD* (`AbortController`, loading inicial vs refresh, mensagens literais vazias, retry isolado por aba).
    5. *Sincronização reativa com confirmações da Outbox* (invalidação automática de `['ranking']` e `['history']`).
- **Delta em `menu-options`**:
  - Atualizar o requirement de Menu Local substituindo os placeholders desabilitados por abas ativas e operacionais.

---

## 8. Plano de Testes Automatizados

### 8.1 Testes Unitários e de Componente (`tests/rankingHistory.test.ts`)
1. **Renderização de Abas e ARIA**:
   - `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls` e estados visíveis.
   - Alternância de aba (Ranking <-> Match History).
2. **Exibição dos Dados do Ranking**:
   - Renderização correta das fixtures determinísticas de capitães.
   - Posição (#1, #2...), nome do capitão, score e data.
   - Resumo explícito da configuração filtrada no cabeçalho.
3. **Exibição do Histórico**:
   - Filtragem exclusiva do `playerId` local.
   - Exibição de score, duração formatada, motivo legível (`Time expired` / `Ship destroyed`) e data no locale.
4. **Paginação**:
   - Navegação página 1 -> página 2 -> página 1.
   - Desabilitação correta dos botões Previous/Next no início e fim.
   - Preservação dos dados visíveis durante a transição (`keepPreviousData`).
5. **Mensagens Vazias Literais**:
   - Ranking vazio exibe exatamente: `"No matches for these settings yet."`.
   - Histórico vazio exibe exatamente: `"No completed matches yet."`.
6. **Isolamento de Falha e Retry**:
   - Simulação de erro HTTP 500 no ranking exibindo botão "Retry".
   - Confirmação de que botões "Play" e "Options" permanecem 100% habilitados e acionáveis.
   - Clique em "Retry" reexecuta a query com sucesso após recuperação do serviço.
7. **Cancelamento de Requisição via AbortSignal**:
   - Verificação de passagem de `signal` do TanStack Query para a chamada Axios.

---

## 9. Matriz de Decisões Técnicas para a Fase Propose

| Decisão | Escolha Recomendada | Justificativa |
|---|---|---|
| **Query Key para Ranking** | `['ranking', configurationKey, page, pageSize]` | Garante isolamento estrito de cache por configuração e página. |
| **Query Key para Histórico** | `['history', playerId, page, pageSize]` | Garante isolamento por jogador local e paginação; compatível com invalidação por prefixo. |
| **Invalidação na Outbox** | Invalidar `['ranking']` e `['history']` em `outboxService.ts` | Alinha o serviço de entrega da outbox com as novas chaves canônicas de leitura. |
| **Transição de Páginas** | `placeholderData: keepPreviousData` | Evita piscamento de tela (layout shift) e esqueleto a cada página. |
| **Cancelamento de Requests** | Repasse do `signal` de `queryFn` ao Axios | Impede que respostas obsoletas de cliques rápidos sobrescrevam o estado atual. |
| **Acessibilidade de Abas** | WAI-ARIA tablist/tab/tabpanel | Conformidade com acessibilidade, navegação por teclado e semântica web. |
| **Apresentação de Filtro** | Badge/cabeçalho legível com `sessionDurationMs` e `enemySpawnIntervalMs` | Cumpre requisito estrito do GDD para evitar sensação de scores perdidos. |

---

*Relatório de exploração concluído e pronto para servir de base direta para a fase `propose` do Incremento 12.*
