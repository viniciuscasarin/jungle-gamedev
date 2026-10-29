# Proposal

## Why

Atualmente, o Mock Service Worker (MSW) opera com dados estáticos e mecanismos ad-hoc de teste de queda de rede, impossibilitando a validação reprodutível dos comportamentos de resiliência e concorrência exigidos pelo GDD. Esta mudança introduz um orquestrador central de simulação de rede com 12 perfis regulamentares, controles de diagnóstico acessíveis no menu e política segura de reset de fixtures sem afetar partidas ativas ou dados de sessão.

## What Changes

- Criação do orquestrador de cenários de rede (`src/mocks/scenarios.ts`) com catálogo tipado cobrindo os 12 perfis exigidos pelo GDD: `default`, `empty`, `multi-page`, `slow-jitter`, `out-of-order`, `timeout`, `offline`, `error-4xx`, `error-5xx`, `isolated-tab-failure`, `commit-timeout` e `temporary-outage`.
- Resolução hierárquica e reativa do cenário ativo com precedência: Parâmetro de URL (`?networkScenario=<id>`) > Armazenamento Local (`pirate-battle.network-scenario.v1`) > Override em memória (`window.__pbNetworkScenario`) > Fallback `default`.
- Integração declarativa dos interceptores MSW em `src/mocks/handlers.ts` e remoção de condicionais hardcoded em `src/data/client.ts`.
- Política estrita de reset de mock data (`resetMockData`): restaura fixtures canônicas em `pirate-battle.confirmed-matches.v1`, reinicia contadores de cenários voláteis e invalida cache TanStack Query, preservando integralmente `pirate-battle.options.v1`, `pirate-battle.identity.v1`, `pirate-battle.last-result.v1`, `pirate-battle.outbox.v1` e preferências de áudio.
- Garantia de desacoplamento e isolamento da simulação de combate ativa no componente `<Arena>`, que jamais é reiniciada ou afetada por alternâncias de cenário ou resets de fixtures.
- Adição de painel visual acessível de controle de cenários e diagnóstico no `MainMenu` com `<select>`, botão de reset, descrição contextual e feedback em `aria-live`.
- Suíte abrangente de testes automatizados unitários, de integração e de UI validando todos os 12 perfis e invariantes de estado.

## Capabilities

### New Capabilities
- `network-scenario-controls`: Orquestrador de cenários de simulação de rede MSW com 12 perfis regulamentares, resolução de precedência em cascata, política segura de reset de fixtures, desacoplamento de partidas ativas e painel de diagnóstico no menu principal.

### Modified Capabilities
- `mock-rest-api`: Interceptação HTTP via MSW integrada ao orquestrador de cenários de rede e compatibilidade com reset seletivo de fixtures no repositório persistido.

## Impact

- Código afetado:
  - `src/mocks/scenarios.ts` (novo módulo com tipos, catálogo, orquestração e listeners)
  - `src/mocks/handlers.ts` (integração dos 12 cenários e latências aos endpoints `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches`)
  - `src/mocks/store.ts` (ajuste fino no método `reset` para compatibilidade estrita)
  - `src/data/client.ts` (limpeza de fallbacks e parâmetros ad-hoc em favor do orquestrador)
  - `src/ui/screens/MainMenu.tsx` e `src/ui/screens/MainMenu.css` (painel de diagnóstico expansível e acessível)
- Testes:
  - Novo arquivo `tests/scenarios.test.ts` e novos testes de componentes cobrindo interações do painel.
- APIs e dependências: Nenhuma nova dependência externa necessária; utiliza MSW e TanStack Query já instalados.
