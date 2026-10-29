# Design

## Context

Atualmente, `MainMenu.tsx` exibe blocos desabilitados em `<div className="future-actions">` que indicam a indisponibilidade de Ranking e Histórico. Por outro lado, o Mock REST API já fornece os endpoints `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches`, enquanto o `outboxService` garante o despacho confiável em segundo plano de partidas concluídas.

Para consolidar a experiência visual e a navegação exigidas pelo GDD (seções 9, 10 e 12), é necessário transformar essa área em abas acessíveis e desacopladas, gerenciadas por `@tanstack/react-query`, preservando a integridade das ações locais ("Play", "Options" e "Last Result") e assegurando comportamento determinístico sob condições adversas de rede ou latência.

Para a motivação detalhada da mudança, consulte [proposal.md](proposal.md).

## Goals / Non-Goals

**Goals:**
- Implementar navegação de abas acessível no Menu Principal utilizando o padrão WAI-ARIA (`tablist`, `tab`, `tabpanel`), com suporte pleno a teclado e toque.
- Encapsular as consultas de Ranking e Histórico em hooks dedicados do TanStack Query (`useRanking` e `usePlayerHistory`), garantindo cache isolado e paginação de 10 itens por página.
- Evitar oscilações visuais (layout shift / flicker) durante a paginação por meio de `placeholderData: keepPreviousData`.
- Adicionar suporte a cancelamento de requisições de rede obsoletas via `AbortController` e repasse do `signal` ao Axios em `src/data/client.ts`.
- Exibir com precisão literal as mensagens do GDD para coleções vazias (`"No matches for these settings yet."` e `"No completed matches yet."`).
- Exibir explicitamente a configuração de partida ativa como filtro no cabeçalho do Ranking, prevenindo a impressão de que scores anteriores sumiram.
- Garantir isolamento estrito de falhas por aba com apresentação de mensagem de erro e botão "Retry", sem travar a navegação nem bloquear a jogabilidade local.
- Sincronizar automaticamente as consultas em cache invalidando os prefixos `['ranking']` e `['history']` após confirmação de entrega pela Outbox.

**Non-Goals:**
- Criar backend remoto ou autenticação real com contas de usuários (permanece estritamente mockado via MSW e `localStorage`).
- Adicionar filtros interativos complexos ou ordenações dinâmicas não previstas no GDD (a ordenação permanece determinística pelo backend).
- Modificar o fluxo de combate, renderização PixiJS ou simulação da arena.
- Alterar o esquema de dados de partidas confirmadas sob `pirate-battle.confirmed-matches.v1`.

## Decisions

### 1. Navegação de Abas WAI-ARIA com Navegação por Teclado
- **Decisão:** Estruturar o container no `MainMenu` com `role="tablist"` (`aria-label="Rankings and History"`), botões com `role="tab"` (`aria-selected`, `aria-controls`, `tabIndex={0}` na aba ativa e `-1` na inativa) e painéis com `role="tabpanel"` (`aria-labelledby`, `hidden` quando inativo, `tabIndex={0}`). Suportar navegação por teclado com setas `ArrowLeft` / `ArrowRight` (e `Home` / `End`) para ciclar o foco entre as abas.
- **Alternativas consideradas:**
  - *Abas simples com botões e divs sem atributos ARIA:* Rejeitada por violar os requisitos de acessibilidade do GDD (seção 10).
  - *Navegação por rota/URL:* Rejeitada por adicionar complexidade de roteador desnecessária ao escopo de single-page arcade menu.

### 2. Estrutura de Query Keys Granulares e Paginação Suave
- **Decisão:** Definir chaves compostas e granulares:
  - Ranking: `['ranking', configurationKey, page, pageSize]` (com `pageSize = 10`)
  - Histórico: `['history', playerId, page, pageSize]` (com `pageSize = 10`)
  Utilizar `placeholderData: keepPreviousData` do TanStack Query v5 para reter as linhas da página anterior enquanto os novos dados são buscados em segundo plano, sinalizando o estado discreto de atualização com `aria-busy="true"` no container da tabela.
- **Alternativas consideradas:**
  - *Substituir a tabela por spinner a cada troca de página:* Rejeitada porque provoca efeito de piscar (flicker) e perda de foco para usuários de leitores de tela.
  - *Carregar todos os registros de uma vez e paginar em memória:* Rejeitada para preservar fidelidade aos contratos paginados REST e simulação honesta de dados remotos.

### 3. Cancelamento de Requisições Obsoletas com AbortController
- **Decisão:** Estender os métodos `getRanking` e `getPlayerMatches` em `src/data/client.ts` para aceitar um parâmetro opcional `options?: { signal?: AbortSignal }`, repassando-o para as chamadas Axios subjacentes. No `queryFn` do TanStack Query, repassar o `signal` fornecido pelo contexto da query.
- **Alternativas consideradas:**
  - *Ignorar o cancelamento e depender apenas do descarte de resposta pelo TanStack Query:* Rejeitada porque mantém conexões de rede em trânsito ativas desnecessariamente quando o usuário clica repetidamente nos botões de página ou alterna abas rapidamente.

### 4. Apresentação Explícita do Filtro e Mensagens Canônicas do GDD
- **Decisão:**
  - Na aba Ranking, renderizar um badge/resumo com os valores ativos de configuração (ex: `Configuration: 120s session · 3.0s enemy spawn`), tornando explícito que o ranking compara apenas partidas sob idênticas condições.
  - Para coleções sem dados (0 itens), exibir exatamente as mensagens literais do GDD:
    - Ranking: `"No matches for these settings yet."`
    - Histórico: `"No completed matches yet."`
  - Na formatação do Histórico, exibir data/hora no locale do usuário (`toLocaleString()`), duração ativa em segundos e motivos legíveis: `"Time expired"` e `"Ship destroyed"`.
- **Alternativas consideradas:**
  - *Mensagens genéricas como "No data found":* Rejeitada por desrespeitar os requisitos normativos do GDD (seção 9).

### 5. Isolamento de Falha por Aba com Ação de Retry
- **Decisão:** Tratar erros de query isoladamente dentro de cada painel de aba (`isError`), renderizando uma notificação acessível (`role="alert"`) e um botão "Retry" que invoca o método `refetch()` do TanStack Query. Uma falha no Ranking não afeta o Histórico (e vice-versa), e nenhuma falha bloqueia os botões principais "Play", "Options" ou "Last Result".
- **Alternativas consideradas:**
  - *Erro global ou ErrorBoundary bloqueando a tela inteira:* Rejeitada terminantemente, pois o pilar 4 do GDD afirma que "the battle remains available: ranking and history failures never prevent local gameplay".

### 6. Sincronização Automática com a Outbox
- **Decisão:** Atualizar `outboxService.ts` para invalidar consultas sob o prefixo `['history']` em adição a `['ranking']` após o despacho com sucesso de uma partida confirmada (`HTTP 200/201`).
- **Alternativas consideradas:**
  - *Manter invalidação de `['playerMatches']`:* Incompatível com a padronização canônica da query key `['history']`.

## Risks / Trade-offs

- **[Risco] Troca rápida de abas ou páginas causando respostas fora de ordem:**  
  → *Mitigação:* O TanStack Query já associa as respostas à query key específica e, combinado com o `AbortSignal` repassado ao Axios, cancela a requisição anterior na rede.
- **[Risco] Percepção de pontuações apagadas ao modificar configurações do jogo:**  
  → *Mitigação:* Exibição clara e destacada no cabeçalho do Ranking dos parâmetros de configuração da consulta corrente, informando que o filtro é específico para cada regra de batalha.
- **[Risco] Quebra de layout em viewports estreitos (320 CSS px):**  
  → *Mitigação:* Utilização de container com `overflow-x: auto` nas tabelas de dados, botões com áreas de toque mínimas de 44px e layout responsivo sem distorção das molduras visuais do menu.
- **[Risco] Bloqueio do fluxo de combate em caso de lentidão ou falha de rede:**  
  → *Mitigação:* Isolamento completo do estado das abas em relação ao ciclo de vida de início de partida (`handlePlay`), garantindo que o jogo inicie imediatamente independente do status das consultas HTTP.
