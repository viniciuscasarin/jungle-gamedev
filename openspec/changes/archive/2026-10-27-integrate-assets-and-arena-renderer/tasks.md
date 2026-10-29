# Tasks

## 1. Asset Catalog and Cache

- [x] 1.1 Criar manifesto tipado dos PNGs verificados para player/Chaser/Shooter, água, litoral, decoração e UI, distinguindo dimensões físicas/lógicas e orientação; verificar paths pelo build Vite e correspondência com a tabela do design.
- [x] 1.2 Implementar carregamento compartilhado por promise e leases idempotentes, limpar rejeições recuperáveis e definir unload final seguro; verificar com Vitest concorrência, falha parcial, retry, consumidor sobrevivente e conclusão tardia após descarte.
- [x] 1.3 Criar ASSET_CREDITS.md em inglês e registrar mapeamento, metadados retina/UI, fonte repo/challenge, ausência de autoria/licença documentadas e transformações realizadas; conferir contra arquivos/metadados fornecidos sem atribuição inferida.
- [x] 1.4 Documentar em ARCHITECTURE o dono de texturas e o ciclo de cache quente/descarte final, incluindo encerramento de sessão/HMR; verificar que a documentação descreve a API efetivamente implementada e os testes de 1.2.

## 2. Map Geometry and Viewport

- [x] 2.1 Compor a proposta de ilhas160×120 com tiles40×40 nas origens (135,95)/(665,325), medir areia sólida e substituir proposedIslandEnvelopes por dados puros de ilhas/contorno ou peças convexas, com mapVersion arena-v2; verificar geometria finita, não autointersectante, dentro do mundo, centro livre e snapshot profundamente imutável em Vitest.
- [x] 2.2 Registrar em ARCHITECTURE coordenadas efetivas, convenção de vértices, peças e tolerância máxima4 unidades ao litoral, sem converter envelope ou decoração em obstáculo; verificar alinhamento com overlay da composição e salvar imagem de evidência do incremento.
- [x] 2.3 Expor cálculo puro de área útil/escala/offsets e funções mundo↔tela, com estado não renderizável para área zero; verificar cantos/centro, roundtrip≤1e−8, letterbox, insets e resize por Vitest.
- [x] 2.4 Documentar origem local CSS, fórmulas, separação DPR/buffer e política de safe areas/faixas48px superiores e88px inferiores; conferir valores e testes do módulo contra ARCHITECTURE.

## 3. Static Arena and Resource Owner

- [x] 3.1 Substituir Graphics decorativo por água em tiles, duas ilhas e sprite player proporcional ao centro com heading para cima, consumindo configuração e texturas do cache; verificar cena estática no navegador, sem sample achatado, inimigos ativos ou loop de simulação.
- [x] 3.2 Adaptar owner para recurso destacado, init parcial/tardio e geração por tentativa, liberando app/stage/sprites/canvas sem destruir texturas emprestadas; verificar testes existentes e novos de mount/resize/observe/init falhos, descarte idempotente e sequência Strict Mode.
- [x] 3.3 Integrar ResizeObserver, resize da janela e detecção de mudança isolada de DPR, com ticker estático parado e cleanup dos listeners/observadores; verificar testes do adaptador e browser mantendo uma instância/canvas, CSS e coordenadas após resize/DPR.
- [x] 3.4 Atualizar a seção de lifecycle em ARCHITECTURE e instruções de inspeção em README em inglês; conferir ownership real e registrar como observar canvas, ticker e recursos vivos sem introduzir API de gameplay.

## 4. Menu and Recoverable Loading

- [x] 4.1 Implementar menu mínimo com Pirate Battle/Play e fluxo Loading→Static Arena, status semântico e Main Menu, usando UI fornecida com controles HTML; verificar teclado/toque, foco, Loading perceptível por300ms e aviso inglês de preview estático no navegador.
- [x] 4.2 Implementar falha real/simulada, Retry e saída durante carregamento, com `?assetScenario=fail-once` anterior ao cache e callbacks obsoletos ignorados; verificar Vitest das transições/gerações e recuperação após falha, menu durante promessa pendente e nova tentativa.
- [x] 4.3 Ajustar layout portrait/landscape/320px com safe areas e faixas reservadas, sem HUD ou ataques funcionais; verificar ausência de scroll horizontal obrigatório, mundo completo, tiles quadrados e navio proporcional nos tamanhos do design.
- [x] 4.4 Atualizar README em inglês com fluxo entregue, URL de reprodução da falha única, Retry, limites reais e retorno ao menu; reproduzir os passos escritos com cache frio e quente, sem refresh obrigatório na recuperação.

## 5. Browser Integration and Acceptance

- [x] 5.1 Adicionar suporte Playwright restrito ao fluxo deste incremento, scripts/config e lockfile consistente; verificar instalação normal e documentar em README o comando E2E e pré-requisito do navegador.
- [x] 5.2 Criar e executar E2E Chromium para menu/loading/arena/menu, fail-once→Retry, cache quente e retorno durante carregamento atrasado; verificar status/acessibilidade, ausência de erros inesperados e inexistência de canvas órfão, guardando relatório e traces em falha.
- [x] 5.3 Exercitar cinco ciclos reais de Play/Main Menu sob Strict Mode e comprovar ausência de duplicação/crescimento de canvas, ticker e inscrições do adaptador; registrar contagens inicial/final e verificar que o cache compartilhado permanece utilizável entre ciclos.
- [x] 5.4 Inspecionar dev e build servido por preview em desktop,320×568,390×844,844×390 e DPR2, incluindo mudança de DPR com CSS constante; guardar screenshots e observações de proporção, heading, mapa/litoral, faixas e resize preservando coordenadas.
- [x] 5.5 Executar `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` e E2E do incremento; corrigir falhas de escopo, registrar comandos/exit codes/evidências e limitações reais no relatório apply, sem afirmar verificações indisponíveis.

## Workflow follow-up

- Entregar implementação e evidências para verify em novo executor, conforme autorização sequencial em project/automation.md.
- Após verify aprovado e tarefas completas, sincronizar as deltas e arquivar em fase própria; não executar sync/archive durante apply.
