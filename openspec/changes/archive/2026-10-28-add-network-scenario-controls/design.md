# Design

## Context

Conforme estabelecido na Seção 13 do Game Design Document (GDD) e detalhado em `proposal.md`, o ambiente de execução precisa reproduzir de forma determinística e verificável 12 perfis de comportamento de rede MSW (sucesso, listas vazias, paginação múltipla, latência lenta e variável, respostas fora de ordem, timeout, erros de conexão, 4xx/5xx, falha por aba, timeout após commit e queda seguida de recuperação).

Anteriormente, o projeto contava apenas com handlers MSW estáticos e mecanismos pontuais e ad-hoc de teste de indisponibilidade (`__mockNetworkOutage`). Este design formaliza a arquitetura do orquestrador central em `src/mocks/scenarios.ts`, integrando a resolução hierárquica de cenários, a política segura de reset de fixtures, o desacoplamento absoluto da simulação de combate ativa e os controles na interface do usuário.

## Goals / Non-Goals

**Goals:**
- Prover um módulo orquestrador desacoplado (`src/mocks/scenarios.ts`) consumido uniformemente pelo Service Worker no navegador (`browser.ts`), pelo servidor Node no Vitest (`server.ts`) e por automações no Playwright.
- Implementar e tipar integralmente os 12 perfis regulamentares de rede exigidos pelo GDD.
- Estabelecer uma resolução hierárquica clara para determinação do cenário ativo: Parâmetro de busca na URL > Armazenamento Local (`pirate-battle.network-scenario.v1`) > Override em memória (`window.__pbNetworkScenario`) > Fallback default (`default`).
- Definir uma política estrita de reset de mock data (`resetMockData`): restaura o dataset canônico `pirate-battle.confirmed-matches.v1`, reseta contadores de falhas voláteis e invalida cache TanStack Query, garantindo a integridade inviolável de `pirate-battle.options.v1`, `pirate-battle.identity.v1`, `pirate-battle.last-result.v1`, `pirate-battle.outbox.v1` e `pirate-battle.sound-muted.v1`.
- Garantir que a troca de cenários ou o acionamento de reset de dados jamais altere, reinicie ou afete uma batalha ativa no componente `<Arena>`.
- Disponibilizar um painel temático e acessível no `MainMenu` com `<select>`, botão de reset, descrição contextual, feedback em `role="status"` com `aria-live="polite"` e ergonomia mobile (mínimo 44px de toque e contenção em 320px).

**Non-Goals:**
- Não inclui criação de um servidor backend real ou banco de dados remoto (o projeto opera estritamente local com MSW e LocalStorage).
- Não altera os contratos de domínio de `CompletedMatchResult` ou payloads de envio da outbox.
- Não remove nem altera o mecanismo de enfileiramento atômico e retentativas da outbox desenvolvido nos incrementos anteriores, apenas fornece cenários de rede para exercitá-lo.

## Decisions

### 1. Orquestrador centralizado em `src/mocks/scenarios.ts`
- **Decisão**: Concentrar toda a lógica de estado de cenários, catálogo de definições, emissores de eventos (`onScenarioChange`) e política de reset em `src/mocks/scenarios.ts`.
- **Alternativas consideradas**:
  - *Lógica embutida nos handlers do MSW*: Dificulta testes unitários diretos sem simulação HTTP completa e cria acoplamento entre os handlers e a UI.
  - *Estado mantido em contexto React*: Inacessível pelos handlers do MSW quando estes rodam no escopo do Service Worker ou no servidor Vitest puro sem árvore React montada.
- **Justificativa**: O módulo singleton desacoplado em TypeScript puro é universalmente acessível tanto pelo React (UI), quanto pelos handlers do MSW e por scripts de teste.

### 2. Resolução em cascata do cenário ativo
- **Decisão**: A função `getNetworkScenario()` avalia as fontes na seguinte ordem de precedência:
  1. `URLSearchParams` (`?networkScenario=<id>`): Prioridade máxima, essencial para testes end-to-end do Playwright executarem cenários isolados sem efeito colateral em outras abas ou sessões.
  2. `localStorage` (`pirate-battle.network-scenario.v1`): Mantém a preferência selecionada manualmente pelo desenvolvedor/avaliador entre recargas de página.
  3. `window.__pbNetworkScenario`: Permite intervenção programática rápida em tempo de execução via console ou mocks de teste.
  4. Fallback `'default'`: Garante operação estável e determinística caso nenhum cenário seja indicado ou caso o valor persistido seja desconhecido.
- **Alternativas consideradas**:
  - *Apenas LocalStorage*: Dificultaria a paralelização e automação de testes no Playwright, pois abas compartilham o storage.
  - *Apenas URL*: Exigiria manter o parâmetro na URL em todas as navegações e transições de tela da SPA.

### 3. Modelagem e comportamento dos 12 perfis regulamentares
- **Decisão**: Mapear cada um dos 12 cenários a uma regra declarativa aplicada pelos interceptores de `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches`:
  1. `default`: 200 OK determinístico (11 fixtures canônicas, latência padrão 0-50ms).
  2. `empty`: 200 OK com `{ items: [], totalItems: 0 }` para testar mensagens literais de ausência de registros no ranking e histórico.
  3. `multi-page`: 200 OK com dataset expandido determinístico (35+ partidas), habilitando 4 páginas para validação dos controles de paginação (Next/Prev, "Page X of Y").
  4. `slow-jitter`: 200 OK com atraso assíncrono variável entre 1.500ms e 2.500ms, validando `aria-busy`, estados de loading e estabilidade do menu sem piscamento.
  5. `out-of-order`: Latência alternada (ex: requisição ímpar com 1.500ms, par com 150ms) para comprovar descarte de requisições anteriores via `AbortSignal`.
  6. `timeout`: Atraso deliberadamente superior ao timeout do cliente HTTP (> 30s) ou Promise não resolvida, forçando o cliente a abortar e transicionar o resultado para `Pending — Retry`.
  7. `offline`: Falha imediata de transporte HTTP via `HttpResponse.error()` (ou rejeição de rede equivalente), emulando modo avião.
  8. `error-4xx`: Resposta 400 Bad Request, forçando a outbox a identificar erro permanente de cliente e cessar retentativas automáticas.
  9. `error-5xx`: Resposta 500 Internal Server Error, acionando o ciclo de retentativas com backoff exponencial na outbox.
  10. `isolated-tab-failure`: Resposta 500 para `/api/ranking` e resposta 200 OK com sucesso para `/api/players/:playerId/matches`, demonstrando isolamento total entre abas.
  11. `commit-timeout`: No endpoint `POST /api/matches`, o registro **é persistido atomicamente no store**, mas a resposta HTTP é derrubada com erro de rede; na retentativa subsequente da outbox com o mesmo `matchId`, o endpoint reconhece a idempotência e responde 200 OK sem criar duplicatas.
  12. `temporary-outage`: As primeiras 2 requisições falham com erro de rede / 503; a 3ª requisição em diante responde com sucesso 200/201, validando a auto-recuperação da outbox.

### 4. Política estrita de reset de mock data (`resetMockData`)
- **Decisão**: Isolar estritamente o escopo do botão "Reset Mock Data":
  - **O que é restaurado**: Apenas `pirate-battle.confirmed-matches.v1` (revertendo ao conjunto de fixtures canônicas), zeramento de contadores de cenários voláteis (como o contador de quedas de `temporary-outage`) e invalidação do cache de queries no TanStack Query (`['ranking']` e `['history']`).
  - **O que é preservado incondicionalmente**:
    - `pirate-battle.options.v1`: Configurações de batalha (duração, intervalo de spawn).
    - `pirate-battle.identity.v1`: UUID e nome `Captain-XXXX` do jogador local.
    - `pirate-battle.last-result.v1`: Snapshot do último combate concluído.
    - `pirate-battle.outbox.v1`: Fila de submissões pendentes do jogador.
    - `pirate-battle.sound-muted.v1`: Preferência de áudio do usuário.
- **Alternativas consideradas**:
  - `localStorage.clear()`: Rejeitado taxativamente por violar os requisitos do GDD ao apagar identidade, fila de outbox e opções do jogador.

### 5. Desacoplamento e preservação de partida ativa
- **Decisão**: A alteração do cenário de rede e a execução de `resetMockData` operam exclusivamente na camada de dados e rede em background.
  - Não há recarregamento forçado de página (`location.reload`).
  - O componente `<Arena>` não assina o estado de cenários de rede; seu loop `requestAnimationFrame`, estado de entidades e timers de combate continuam rodando sem interrupção.
  - Apenas no término da partida, ao despachar a submissão para a outbox e efetuar a sincronização com `/api/matches`, a requisição sofrerá a influência do cenário ativo naquele instante.

### 6. Painel visual e acessível no Menu Principal
- **Decisão**: Integrar os controles no `MainMenu` logo abaixo de `LeaderboardTabs` utilizando elemento semântico `<details>` / `<summary>`, contendo `<label>`, `<select>` com os 12 cenários, descrição do cenário corrente, botão primário "Reset Mock Data", botão contextual "Restore Default Scenario" (visível apenas quando o cenário não for `default`) e container de status com `role="status"` e `aria-live="polite"`.
- **Acessibilidade e Layout**:
  - Garantia de alvos de toque >= 44 CSS px.
  - Sem overflow horizontal em telas a partir de 320 CSS px.
  - Estilização harmônica com o tema náutico da aplicação.

## Risks / Trade-offs

- **[Risco: Concorrência entre instâncias ou abas durante reset]**  
  → *Mitigação*: O reset escreve no LocalStorage e dispara o evento nativo `storage`, além de invocar `queryClient.invalidateQueries()`, sincronizando as abas abertas sem reinicializar o contexto global.
- **[Risco: Efeitos colaterais em testes E2E do Playwright por vazamento de estado em LocalStorage]**  
  → *Mitigação*: A prioridade máxima concedida a `?networkScenario=<id>` na URL permite que cada teste configure seu cenário diretamente na query string sem contaminar ou depender do LocalStorage.
- **[Risco: Cenário `commit-timeout` causar falsos positivos em testes de ranking]**  
  → *Mitigação*: O comportamento de commit sem resposta aplica-se estritamente ao endpoint `POST /api/matches`. As consultas de leitura `GET /api/ranking` e `GET /api/players/:id/matches` respondem normalmente 200 OK.
- **[Risco: Timeout excessivo (>30s) travar execuções de testes unitários]**  
  → *Mitigação*: Nos testes automatizados sob Vitest, o timeout pode ser acionado com atraso configurável ou cancelamento rápido simulado, evitandoesperas reais desnecessárias na suíte de testes.

## Migration Plan

1. A introdução de `src/mocks/scenarios.ts` substitui integralmente os parâmetros provisórios e hardcoded presentes em `src/data/client.ts` (`__mockNetworkOutage`).
2. O catálogo de cenários exportará tipos e helpers estáveis, permitindo que os testes existentes em `tests/api.test.ts` e `tests/outbox.test.ts` continuem funcionando sem quebras de compatibilidade.
3. Não há migração de esquema de banco de dados nem dados legados a converter, uma vez que a estrutura do store `pirate-battle.confirmed-matches.v1` permanece idêntica.

## Open Questions

- Nenhuma questão aberta pendente. Todas as decisões técnicas e comportamentais foram alinhadas e validadas na exploração técnica preliminar.
