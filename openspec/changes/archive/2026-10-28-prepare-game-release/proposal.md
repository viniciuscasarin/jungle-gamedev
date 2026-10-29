# Proposal

## Why

O projeto Pirate Battle 2D concluiu com sucesso a implementação funcional do ciclo de jogo, a camada de persistência resiliente, o mock de rede com cenários de falha, a suíte de testes ponta a ponta e a otimização de desempenho. Para finalizar a entrega técnica estipulada na Seção 15 ("Delivery sequence and estimate") e Seção 16 ("Playtest questions and remaining decisions") do Game Design Document (GDD), é indispensável consolidar uma preparação rigorosa de release.

Esta mudança estabelece os requisitos operacionais para que qualquer avaliador ou desenvolvedor consiga instalar, compilar, testar e reproduzir cenários de rede e falhas induzidas pelo README, higieniza a codificação da documentação técnica (eliminando mojibake), formaliza a matriz de inventário e licenças de ativos em `ASSET_CREDITS.md` sem presunção de licenças livres, valida a integridade autossuficiente do pacote de produção gerado em `dist/` com MSW e preview local, e audita formalmente os marcos de entrega distinguindo itens entregues, validados e pendentes de destino externo.

## What Changes

- Revisão e higienização documental de `README.md` e `ARCHITECTURE.md` em inglês limpo, corrigindo caracteres corrompidos de codificação (mojibake) e adicionando orientações claras para execução em Windows PowerShell (`npm.cmd` vs `npm.ps1`).
- Estruturação de um guia operacional passo a passo no `README.md` para execução direta dos 12 cenários de rede do MSW via query parameter (`?networkScenario=...`), métodos de reset e reprodução de falhas (falha pontual de assets via `?assetScenario=fail-once`, corrupção de LocalStorage e retries da Outbox).
- Finalização de `ASSET_CREDITS.md` com o inventário completo dos 520 arquivos do repositório e o catálogo estrito de 33 imagens e 27 efeitos sonoros utilizados em runtime, registrando formalmente que ativos proprietários do desafio permanecem com status pendente de comprovação de licença de terceiros (sem presunção de CC0/MIT), ao mesmo tempo em que comprova a liberação de elementos gráficos procedurais e dependências de software de código aberto (MIT/Apache-2.0).
- Verificação e automação da integridade do pacote de produção (`dist/`): assegurar a presença de `index.html`, `mockServiceWorker.js` e bundles estáticos, confirmando a total ausência de dependências de serviços externos pagos, chaves de API secretas ou variáveis `.env`.
- Implementação de teste automatizado de sanidade do release (`tests/releasePackage.test.ts`) para verificação contínua dos artefatos em `dist/` e tolerância a variações de temporização.
- Consolidação da matriz formal de entrega cobrindo os 5 marcos da Seção 15 do GDD, registrando a paridade entre código, build e evidências de testes, e explicitando os bloqueios concretos para publicação pública externa (necessidade de credenciais/destino externo fornecidos pelo usuário).

## Capabilities

### New Capabilities
- `release-preparation`: Especifica os requisitos de empacotamento, integridade autossuficiente do release, documentação operacional de setup e reprodução de falhas, inventário e auditoria rigorosa de licenças de ativos, suíte de sanidade de release e a matriz de auditoria dos marcos da Seção 15 do GDD.

### Modified Capabilities

## Impact

- **Documentação**: Atualizações estruturadas em `README.md`, `ARCHITECTURE.md` e `ASSET_CREDITS.md`.
- **Testes**: Adição de `tests/releasePackage.test.ts` e ajuste fino de tolerância de temporização em `tests/outbox.test.ts`.
- **Build & Distribuição**: Verificação formal do diretório `dist/` e do funcionamento do servidor local de `preview` com Service Worker MSW.
- **Compatibilidade e Dependências**: Nenhuma nova dependência de terceiros é introduzida; compatibilidade retroativa e integridade da base de código são 100% preservadas.
