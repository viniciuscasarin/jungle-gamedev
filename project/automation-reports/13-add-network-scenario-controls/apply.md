# Increment 13: Add Network Scenario Controls Apply Report

## Summary

O incremento 13 (`add-network-scenario-controls`) foi implementado com êxito no workspace `C:\Users\Vinicius\Dev\repos\challenges\jungle-gamedev`.
Todas as 9 tarefas descritas em `openspec/changes/add-network-scenario-controls/tasks.md` foram integralmente concluídas, com aprovação total de 100% da suíte de testes automatizados (337 testes unitários/integração em 24 arquivos de teste, correspondendo a 29 novos testes e regressão zero dos 308 testes pré-existentes), testes End-to-End no Playwright, verificação estrita de tipagem TypeScript, ESLint sem advertências, build de produção bem-sucedido e validação de especificações com o utilitário OpenSpec (`openspec.cmd validate add-network-scenario-controls --strict`).

## Implementações Realizadas

### 1. Orquestrador Central de Cenários de Rede (`src/mocks/scenarios.ts`)
- **Catálogo dos 12 Perfis Regulamentares**:
  - `default`: Operação determinística padrão (200 OK com fixtures canônicas e latência nominal de 0–50ms).
  - `empty`: Listas vazias (`{ items: [], totalItems: 0 }`) para ranking e histórico de partidas.
  - `multi-page`: Conjunto de dados expandido determinístico (36 fixtures completas em `MULTI_PAGE_FIXTURES`) permitindo 4 páginas de navegação na paginação do leaderboard.
  - `slow-jitter`: Sucesso 200 OK postergado com atraso variável jittered entre 1.500ms e 2.500ms para validar estados de loading e `aria-busy`.
  - `out-of-order`: Latência alternada entre requisições sucessivas (ímpar 1.500ms, par 150ms) para comprovar cancelamento via `AbortSignal` e proteção contra condições de corrida.
  - `timeout`: Atraso que ultrapassa o timeout do cliente HTTP (>30s) provocando erro de timeout e transição para retry.
  - `offline`: Erro de transporte imediato via `HttpResponse.error()` simulando modo avião / desconexão de rede física.
  - `error-4xx`: 400 Bad Request comprovando que erros permanentes de cliente interrompem retentativas cegas da outbox.
  - `error-5xx`: 500 Internal Server Error exercitando retentativas com backoff exponencial na outbox.
  - `isolated-tab-failure`: Falha seletiva com status 500 em `/api/ranking` e sucesso simultâneo 200 OK em `/api/players/:playerId/matches`.
  - `commit-timeout`: No endpoint `POST /api/matches`, o registro é persistido atomicamente no store de partidas confirmadas, mas a resposta HTTP é derrubada na 1ª tentativa; na retentativa com mesmo `matchId`, o endpoint reconhece a idempotência e responde 200 OK sem duplicar registros.
  - `temporary-outage`: As primeiras 2 requisições falham com erro de rede / 503; a 3ª requisição em diante responde com sucesso (auto-recuperação).
- **Resolução Hierárquica em Cascata**:
  - `getNetworkScenario()` avalia as fontes na seguinte ordem de precedência:
    1. Parâmetro de busca na URL (`?networkScenario=<id>`).
    2. Armazenamento persistido em LocalStorage (`pirate-battle.network-scenario.v1`).
    3. Override em memória em tempo de execução (`window.__pbNetworkScenario`).
    4. Fallback padrão seguro para `'default'`.
- **Compatibilidade e Listeners**:
  - Emissão reativa de eventos via `onScenarioChange` e sincronização multi-aba via evento `'storage'`.

### 2. Integração Declarativa aos Handlers do MSW (`src/mocks/handlers.ts`)
- Delegação integral dos comportamentos de rede ao orquestrador central nos interceptores:
  - `GET /api/ranking`: modular respostas de erro 4xx/5xx, offline, timeout, slow-jitter, out-of-order, dataset vazio e multi-page.
  - `GET /api/players/:playerId/matches`: modular respostas, garantindo sucesso normal durante `isolated-tab-failure`.
  - `POST /api/matches`: modular respostas de transporte, erro permanente 400, falha temporária e o fluxo específico de `commit-timeout` (persiste no store primeiro e derruba a resposta inicial, retornando 200 OK na retentativa idempotente).
- Alinhamento de `src/data/client.ts`: remoção de condicionais provisórias ad-hoc em favor do orquestrador central e inclusão de suporte a timeout configurado com tratamento padronizado para erros do tipo `TIMEOUT`.

### 3. Política Estrita de Reset de Mock Data (`resetMockData`)
- **Restauração Canônica**:
  - Restaura unicamente o dataset determinístico canônico sob `pirate-battle.confirmed-matches.v1`.
  - Reinicia contadores transitórios voláteis (`temporaryOutageCounter`, `outOfOrderCounter`, mapa de matches de `commitTimeout`).
  - Invalida as queries de ranking e histórico no TanStack Query (`['ranking']` e `['history']`).
- **Preservação Inviolável**:
  - Preserva incondicionalmente:
    - `pirate-battle.options.v1`: Configurações de batalha.
    - `pirate-battle.identity.v1`: Identidade e UUID do capitão.
    - `pirate-battle.last-result.v1`: Snapshot do último combate concluído.
    - `pirate-battle.outbox.v1`: Fila atômica de submissões pendentes.
    - `pirate-battle.sound-muted.v1`: Preferências de áudio.

### 4. Desacoplamento da Simulação de Combate Ativa
- A alternância de cenários de rede e a execução de `resetMockData()` operam exclusivamente na camada de transporte/mocks em background.
- O loop de física, renderização, saúde do navio do jogador, pontuação e temporizador da `<Arena>` prosseguem continuamente sem interrupções, recarregamento de página ou reinicialização.
- O cenário ativo no momento do encerramento da partida é o que rege o comportamento da submissão da outbox.

### 5. Painel Visual de Diagnóstico e Controles na UI (`NetworkScenarioPanel.tsx` e `MainMenu.css`)
- Componente `<NetworkScenarioPanel>` integrado ao `MainMenu.tsx` logo abaixo do `LeaderboardTabs`.
- Estrutura semântica com `<details>` e `<summary>` acessíveis.
- Menu `<select>` contendo os 12 perfis regulamentares com nomes amigáveis.
- Badge informativo e parágrafo descritivo do perfil ativo.
- Botão "Reset Mock Data" com área de toque mínima de 44px.
- Botão condicional "Restore Default Scenario" exibido quando o perfil ativo for diferente de `default`.
- Anúncio de feedback textual via contêiner acessível com `role="status"` e `aria-live="polite"`.
- Estilização responsiva em `MainMenu.css` com alvos mínimos de 44px e contenção em telas estreitas de 320px sem gerar rolagem horizontal indesejada.

### 6. Documentação
- Atualizado `ARCHITECTURE.md` em inglês com a arquitetura detalhada do orquestrador, matriz dos 12 cenários, política estrita de reset e isolamento da arena.
- Atualizado `README.md` em inglês com instruções passo a passo para reproduzir cada cenário via UI, URL query param, LocalStorage ou console, além dos passos para retornar ao estado default.

## Verificações e Testes Executados

1. **Linting**:
   ```powershell
   npm.cmd run lint
   ```
   *Resultado*: Concluído com código 0 (sem advertências ou erros no ESLint).

2. **Checagem Estrita de Tipos**:
   ```powershell
   npm.cmd run typecheck
   ```
   *Resultado*: Concluído com código 0 (0 erros de tipagem em `tsconfig.json` e `tsconfig.core.json`).

3. **Testes Unitários e de Integração**:
   ```powershell
   npm.cmd test -- --run
   ```
   *Resultado*: 24 arquivos de teste passaram com sucesso (337 testes aprovados de 337).
   - `tests/scenarios.test.ts`: 23 testes aprovados cobrindo os 12 perfis, resolução hierárquica, política estrita de reset de mock data e desacoplamento da arena.
   - `tests/networkUi.test.ts`: 6 testes aprovados validando renderização do painel, opções dos 12 cenários, botão de restauração condicional e anúncios ARIA live.
   - Regressão zero nos 308 testes dos incrementos 01–12 (`tests/api.test.ts`, `tests/outbox.test.ts`, `tests/rankingHistory.test.ts`, etc.).

4. **Testes End-to-End (Playwright)**:
   ```powershell
   npm.cmd run e2e -- tests/e2e/network-scenarios.spec.ts
   npm.cmd run e2e -- tests/e2e/outbox.spec.ts
   ```
   *Resultado*:
   - `tests/e2e/network-scenarios.spec.ts`: 10/10 testes aprovados (dev e preview) cobrindo expansão do painel, alternância de cenários, restauração do default, query param `?networkScenario=empty`, paginação de 4 páginas com `?networkScenario=multi-page`, ação de reset e contenção de layout/alvos de 44px em viewport de 320px.
   - `tests/e2e/outbox.spec.ts`: 6/6 testes aprovados (dev e preview) confirmando compatibilidade plena com o fluxo de outbox.

5. **Build de Produção**:
   ```powershell
   npm.cmd run build
   ```
   *Resultado*: Compilação e empacotamento com Vite/Rolldown concluídos com código 0 em 533ms.

6. **Validação do OpenSpec**:
   ```powershell
   openspec.cmd validate add-network-scenario-controls --strict
   ```
   *Resultado*: `Change 'add-network-scenario-controls' is valid` com código 0.
