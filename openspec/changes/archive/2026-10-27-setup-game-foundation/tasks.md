# Tasks

## 1. Toolchain

- [x] 1.1 Criar package.json com React/DOM, PixiJS, Vite, TypeScript, Vitest e ESLint nas versões compatíveis decididas, dependências diretas fixadas e packageManager/runtime documentados; verificar engines/peers com instalação sem flags de bypass e gerar package-lock.json válido.
- [x] 1.2 Configurar TypeScript estrito para fontes e ferramentas, Vite, ESLint e Vitest, além dos scripts dev, preview, build, lint, typecheck e test não interativo; verificar scripts existentes e executar lint/typecheck/test/build conforme os respectivos arquivos de cada grupo forem adicionados.
- [x] 1.3 Criar .gitignore e README em inglês com requisitos, instalação limpa e comandos disponíveis; conferir que node_modules/dist ficam ignorados, que arquivos de origem/lockfile não ficam ignorados e que os comandos documentados correspondem a package.json.

## 2. Typed configuration

- [x] 2.1 Implementar GameConfig profundamente readonly, metadados únicos de opções e valores/versões/unidades da tabela do design rastreados ao GDD; verificar por typecheck e teste de defaults que inclua navios, armas, spawn, controles, versões e alcance calculado sem constante duplicada.
- [x] 2.2 Implementar criação/validação das duas opções e MatchSetup com seed uint32 separada; verificar testes de limites válidos, granularidade inválida, valores fora de faixa, NaN/infinito e seeds 0/4294967295 e inválidas.
- [x] 2.3 Implementar cópia e proteção profunda da configuração, inclusive objetos e coleções aninhados; verificar testes que editem a origem e tentem alterar campos/arrays do snapshot, preservando o conteúdo capturado.
- [x] 2.4 Iniciar ARCHITECTURE em inglês com autoridade dos valores propostos, unidades, convenção de eixos/ângulos, arena-v1/balance-v1 e separação da seed; conferir a tabela contra GDD e código e declarar envelopes das ilhas como propostas, sem colisores finais.

## 3. Domain and simulation contracts

- [x] 3.1 Definir StepInput, entrada neutra, SimulationSnapshot e união discriminada SimulationEvent com passo e tempo ativo explícitos; verificar typecheck e exemplos em teste Node que representem direção/ataques simultâneos, ausência de alvo e eventos de dano/destruição/score/término sem objetos de plataforma.
- [x] 3.2 Definir CompletedMatchResult completo e materialização imutável a partir de dados fornecidos, sem gerar IDs/datas/chaves nem finalizar partida; verificar testes de cópia aninhada, invariantes básicos (score, duração, timestamp UTC e seed) e verificações estáticas negativas para campo ausente/mutação.
- [x] 3.3 Estabelecer as fronteiras domain/simulation/render/input/ui/storage/data sem serviços vazios, restringir imports de plataforma nos módulos puros e registrar o fluxo dos contratos em ARCHITECTURE; verificar lint ou check equivalente e importação em testes Node sem DOM/rede/storage/relógio global.
- [x] 3.4 Documentar em ARCHITECTURE os pontos futuros de integração de Axios, TanStack Query, MSW e Playwright e a semântica da configurationKey; verificar que não há dependências instaladas ou implementações antecipadas dessas integrações e que seed/identidade/preferências visuais são excluídas da chave futura.

## 4. Application shell and renderer ownership

- [x] 4.1 Criar entrada React com Strict Mode, título/descrição em inglês, conteúdo DOM semântico e preview Pixi estático decorativo, com layout desde 320 px; verificar build e inspeção do DOM (heading, status e canvas fora da árvore acessível) sem botão de partida fictício.
- [x] 4.2 Implementar owner local de inicialização assíncrona, resize e cleanup idempotente de Pixi com descarte tardio e falha legível; verificar testes de resolução/rejeição, desmontagem antes da resolução e montagem dupla, sem canvas ou inscrições anteriores retidos.
- [x] 4.3 Completar README/ARCHITECTURE em inglês com escopo real da tela, responsabilidade de recursos, ausência de loop de jogo e procedimento de validação gráfica; verificar que instruções distinguem preview e partida e não alegam integrações ou gameplay inexistentes.

## 5. Integration validation

- [x] 5.1 Executar npm ci a partir do lockfile e depois npm run lint, npm run typecheck, npm test e npm run build; registrar versões efetivas, comandos e exit codes no relatório apply e corrigir falhas antes de marcar a tarefa.
- [x] 5.2 Repetir build limpo com o mesmo ambiente e comparar lista ordenada e hashes SHA-256 de todos os arquivos em dist, ignorando somente timestamps do filesystem; registrar o resultado e o método reproduzível de comparação.
- [x] 5.3 Executar dev e preview e inspecionar no navegador desktop e 320 px, incluindo legibilidade, overflow, console, canvas único e montagens/desmontagens repetidas sob Strict Mode; registrar screenshots e evidências reais de renderer ativo, além do teste controlado de falha, sem instalar a suíte Playwright futura.
- [x] 5.4 Reconciliar implementação com os três delta specs e critérios do incremento, completar relatório apply com arquivos, comandos, decisões e limitações, e atualizar checkboxes apenas após evidência; verificar que não foram introduzidos combate, API, persistência ou telas finais.

## Workflow follow-up

- O orquestrador delegará verify a outro executor após apply, usando a autorização antecipada de project/automation.md.
- Após verificação satisfatória, outro executor sincronizará delta specs e arquivará a change; estas ações não fazem parte das tarefas de implementação nem desta fase propose.
