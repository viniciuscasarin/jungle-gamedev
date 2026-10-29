# Design

## Context

Conforme `proposal.md`, não existe aplicação ou conjunto de testes para migrar. O inventário OpenSpec está vazio. Foram inspecionados a árvore do repositório, GDD v0.2, configuração, contexto comum e somente bloco 01 do roteiro, além do relatório explore. Não foi encontrado AGENTS.md aplicável. Esta change é transversal e introduz dependências, contratos e integração gráfica, justificando este design.

O ambiente verificado oferece Node 26.11.1, npm 11.20.0 e OpenSpec 1.14.1. Em PowerShell será usado o PATH de processo documentado em `project/automation.md`. A autorização da automação divide propose e apply em executores separados; esta fase cria somente planejamento.

## Goals / Non-Goals

**Goals:**
- Estabelecer direção de dependências que mantenha dados e regras utilizáveis sem navegador.
- Capturar valores de configuração sem referências mutáveis compartilhadas.
- Exercitar a integração assíncrona real do renderer com React, incluindo destruição durante inicialização.
- Deixar decisões verificáveis e comandos repetíveis para incrementos futuros.

**Non-Goals:**
- Criar uma implementação vazia de cada serviço futuro, motor genérico, barramento global ou framework de plugins.
- Implementar o loop fixo, RNG, configuração canônica de ranking, algoritmos de colisão, estados completos da partida ou persistência nesta fundação.
- Usar as imagens de referência como telas funcionais ou escolher sprites/colisores finais sem inspeção própria.

## Decisions

### Toolchain e versões

Usar React + React DOM, PixiJS 8, TypeScript estrito, Vite e npm. O bundler suporta aplicação pequena sem roteamento antecipado; React controla DOM e Pixi possui um adapter imperativo local. Alternativas de framework com SSR e bibliotecas de engine aumentariam responsabilidades sem necessidade deste jogo.

A seleção inicial de versões diretas, baseada nos metadados registrados em explore, é React/DOM 19.3.1, tipos React/DOM 19.3.0, PixiJS 8.22.0, Vite 8.3.5, plugin React 6.1.2, TypeScript 5.9.3, Vitest 5.0.5, ESLint 10.13.0, typescript-eslint 8.72.1, hooks 7.1.1 e refresh 0.5.7. TypeScript 7 foi descartado por estar fora da faixa de compatibilidade observada do lint; 5.9.3 reduz risco de adoção comparado à alternativa 6.0.3. Estas versões são decisões iniciais, não prova de compatibilidade executável. Apply verifica engines/peers, fixa versões sem `^`/`~`, gera lockfile e registra ajustes compatíveis necessários; nunca usa `--force` ou `--legacy-peer-deps` para ocultar conflitos. Tipos Node e dependências auxiliares de teste serão fixados de forma compatível quando necessários.

Registrar `packageManager` com npm 11.20.0 e o runtime de referência no README; registrar engines compatíveis com as ferramentas efetivamente instaladas. Disponibilizar `dev`, `preview`, `build`, `lint`, `typecheck`, `test` não interativo e, opcionalmente, `test:watch`. `typecheck` verifica fontes e configurações com `strict` e sem emissão; testes não substituem compilação. Build gera `dist/`; node_modules, dist e relatórios locais descartáveis serão ignorados. Não alterar configuração global do Node.

### Fronteiras mínimas

| Módulo | Responsabilidade e dependências |
| --- | --- |
| `src/domain` | Tipos básicos, configuração, preparação e resultado; somente TypeScript e funções puras |
| `src/simulation` | Contratos de passo, snapshot e eventos; pode importar domain; nenhum DOM, React, Pixi, rede, storage ou relógio global |
| `src/render` | Adapter Pixi, propriedade de canvas/recursos e transformação visual; consome dados de domain/simulation |
| `src/input` | Fronteira documentada para futuros adapters de teclado/pointer/touch produzirem StepInput; não há listeners de gameplay agora |
| `src/ui` | Tela React, estado de inicialização/falha e CSS; consome adapters e contratos, sem constantes de regra duplicadas |
| `src/storage` | Fronteira documentada para persistência e recuperação futuras, sem implementação agora |
| `src/data` | Fronteira documentada para HTTP/mocks/cache, sem implementação agora |

Criar arquivos apenas onde há responsabilidade implementada. Os três módulos reservados podem ser identificados em ARCHITECTURE e por documentação curta se útil, sem classes/interfaces vazias. Não introduzir reexports indiscriminados nem permitir dependências reversas do domínio. Um lint de imports ou verificação equivalente impede dependências de plataforma nos módulos puros; a configuração TS do núcleo não precisa de bibliotecas DOM. Não adicionar aliases que exijam resolução diferente em testes e bundler sem motivo.

Axios será o transporte de data; TanStack Query fará leituras/mutações remotas na integração React; MSW interceptará a fronteira REST em desenvolvimento, testes e build publicado; storage será o dono de outbox e identidade; Playwright fará E2E/visual. Documentar esses pontos de integração e sua postergação, sem instalar/apresentar fluxos fictícios.

### Configuração com unidades e autoridade explícitas

`GameConfig` é composta somente por dados serializáveis profundamente readonly; nomes incluem unidades (`Ms`, `Units`, `UnitsPerSecond`, `RadiansPerSecond`) ou tipos documentados. O mundo usa x para a direita, y para baixo, ângulo zero para a direita e ângulos positivos no sentido horário. A posição inicial é (480, 270), direção para cima = -π/2. Converter graus para radianos em um único ponto; não guardar dois valores autoritativos da mesma grandeza.

A tabela abaixo orienta a extração do GDD. Todos os valores de balanceamento/mapa continuam propostas iniciais, sem alegar playtest. `arena-v1` e `balance-v1` identificam o conjunto inicial. Unidades de relógio no contrato são milissegundos; velocidades usam unidades por segundo.

| Grupo | Valores autoritativos iniciais |
| --- | --- |
| Opções | Sessão 120000 ms, limites 60000–180000 ms, passo 1000 ms; spawn 3000 ms, limites 1000–10000 ms, passo 500 ms |
| Mundo | 960 × 540 unidades; início (480, 270), heading -π/2; envelopes de ilhas NW x130–300/y90–220 e SE x660–830/y320–450 |
| Navios | HP player/chaser/shooter 100/40/60; velocidades 150/115/90 unidades/s; giros equivalentes a 180/140/110 graus/s; raios 18/16/18 unidades; contato chaser 25, shooter 0 |
| Arma frontal | Dano 20, 1 projétil, cooldown 350 ms, velocidade 420 unidades/s, vida 1200 ms |
| Cada broadside | Dano 20, 3 projéteis, cooldown 1200 ms, velocidade 360 unidades/s, vida 1000 ms, separação longitudinal 14 unidades |
| Arma shooter | Dano 10, 1 projétil, cooldown 1500 ms, velocidade 260 unidades/s, vida 1500 ms; primeiro tiro espera um cooldown |
| Shooter | Alcance de ataque 300 unidades, distância preferida 240, histerese 30, tolerância angular equivalente a 10 graus |
| Spawn | Distância mínima do player 240 unidades, telegraph 600 ms, sequência alternada chaser/shooter iniciada por chaser; sem teto inicial de inimigos |
| Controle | Dead zone mouse 12 unidades, joypad 0,15 normalizado, auto-sail inicial desligado |
| Regras fixas | Proteção de dano 0 ms; ponto por destruição do inimigo pelo player 1, por contato suicida 0; sem friendly fire, piercing, splash, dano de shoreline ou colisão entre projéteis |
| Tempo técnico | Passo fixo proposto 1000/60 ms; limite de recuperação inicial proposto de 5 passos por frame, sem loop implementado agora |

Os envelopes das ilhas são metadados de proposta, não colisores finais. Geometria arredondada e arte serão alinhadas no incremento próprio e versionadas quando mudarem gameplay. Alcances de projéteis de 504/360/390 unidades são derivados de velocidade × duração; não os armazenar como configuração independente. Cores, tamanho de tela, opções de acessibilidade/áudio, breakpoints, duração de efeitos e paginação de rede não são configuração de gameplay; quando implementados terão seus próprios donos e não entrarão na chave comparável de ranking. Limiares visuais do GDD (60%/25% HP e 10 s finais) serão centralizados pelo módulo de feedback quando existir, sem misturá-los à identidade de gameplay.

Uma função pura cria configuração padrão ou aplica as duas opções validadas usando os mesmos metadados de limites que a UI consumirá futuramente. Aceitar somente números finitos, sessão inteira em segundos e spawn em meio segundo; usar erro explícito de validação (por exemplo RangeError) antes de retornar valor. Não publicar configuração parcial. Não há formulário de Options agora.

Capturar por cópia profunda de dados simples e congelamento recursivo; `Readonly` superficial e somente `Object.freeze` na raiz não bastam. Congelar o padrão e não compartilhar arrays/objetos mutáveis com a origem. `MatchSetup` possui `configuration` e `seed` separados; validar seed uint32, inclusive 0 e 4294967295. Evitar coerção bitwise que transforme valores inválidos em seed válida. Não implementar RNG ou gerar seed com relógio global no domínio.

### Contratos de simulação e resultado

O contrato `StepInput` usa união discriminada de alvo em unidades do mundo, direção normalizada ou ausência de direção; mantém solicitação de movimento, três flags de fogo mantido, borda de toggle auto-sail e borda de pausa. Não contém MouseEvent, KeyboardEvent, PointerEvent ou referências DOM. O adapter futuro resolve repetição de teclado, clamping e captura de pointer antes dessa fronteira. Uma entrada neutra é representável.

`SimulationSnapshot` inclui passo inteiro, tempo ativo ms, estado observável de partida, score, player, coleções readonly de entidades/projéteis e cooldowns necessários aos consumidores. Identificadores e vetores são valores, nunca sprites. Definir campos mínimos coerentes com o GDD sem implementar entidades ou estado global. `SimulationEvent` é uma união discriminada de eventos de dano, destruição, score e término, com passo/tempo ativo e IDs/payload apropriados. Os eventos futuros podem ampliar a união sem introduzir callbacks ou um bus nesta fase. Documentar que React consumirá eventos/status discretos ou limitados em frequência, e Pixi consumirá snapshots; nenhum dos dois decide dano ou pontuação.

`CompletedMatchResult` contém todos os campos da seção 12 do GDD: matchId, playerId, playerName, completedAt (ISO UTC), score inteiro, activeDurationMs, endReason (`player_destroyed` ou `time_expired`), configuration, configurationKey e seed. Tipar valores readonly profundamente e fornecer materialização de cópia imutável para dados de referência, sem gerar IDs/datas/chaves ou finalizar partida. Validar os invariantes básicos representados em runtime (score/duração não negativos e finitos, score inteiro, timestamp UTC válido, seed uint32) ao materializar. Snapshot de configuração permanece isolado. A derivação canônica de configurationKey fica para a integração pertinente; seu contrato já declara inclusão de todos os parâmetros de gameplay/versões e exclusão de seed, identidade e preferências visuais. Nenhum teste de referência conta como prova de combate ou finalização real.

### Tela e propriedade de recursos

Montar React em Strict Mode. Exibir heading, texto curto em inglês e preview estático de água com Pixi, sem menu final nem botão Play fictício. Conteúdo semântico é DOM; preview decorativo usa `aria-hidden` e não recebe foco. Aplicar contraste legível, padding responsivo, foco visível para controles que existirem e ausência de overflow em 320 px. Não é necessário carregar assets fornecidos neste incremento.

O effect React cria um owner por montagem. O owner inicializa `Application` assincronamente, verifica cancelamento antes de anexar o canvas e libera recursos ao sair. Cleanup é idempotente e cobre: inicialização bem-sucedida, rejeição, desmontagem antes da resolução e montagem dupla de Strict Mode. Recursos compartilhados só serão destruídos pelo dono definido; nesta prévia não há textura externa compartilhada. Resize usa o tamanho CSS do contêiner e densidade de tela sem mudar coordenadas lógicas. A prévia estática pode renderizar sob demanda, sem ticker contínuo desnecessário. Falha gráfica mantém heading/texto e exibe erro semântico, sem prometer canvas ativo.

### Estratégia de validação

- Vitest em Node para validação e snapshots profundos de configuração, seed de fronteira e materialização imutável do resultado; cobertura inclui mutação da origem e de objetos/arrays aninhados.
- Typecheck com exemplos de contrato e verificações negativas explícitas (`@ts-expect-error` justificadas) para campos ausentes/escritas indevidas; sem `any` para contornar o contrato.
- Testes de integração do owner com um substituto controlado da inicialização gráfica para rejeição e resolução tardia, sem substituir a inspeção gráfica real. Se necessário, usar ambiente DOM local de teste com versão fixa.
- `npm ci`, lint, typecheck, testes e build no ambiente documentado. Repetir build limpo com mesmo checkout/runtime/lockfile e comparar lista ordenada e SHA-256 de todos os arquivos de dist; timestamps de filesystem não fazem parte da comparação. Sem depender de rede durante build ou incluir timestamps aleatórios em assets.
- Rodar dev e preview, inspecionar no navegador desktop e 320 px; registrar console, canvas único, estado semântico e screenshot. Exercitar repetidas montagens/desmontagens, além dos testes automatizados do owner; falha gráfica real é limitação a resolver ou registrar explicitamente, nunca evidência visual bem-sucedida.

Não instalar o pacote Playwright nem construir suíte E2E/visual nesta fase. Ferramentas de navegador já disponíveis podem produzir evidência manual. Os testes automatizados e a inspeção proporcionais ao comportamento introduzido continuam obrigatórios.

## Risks / Trade-offs

- [Versões recentes e peers incompatíveis] → Confirmar instalação real e ajustar somente a combinação necessária; documentar a versão efetiva e executar todos os comandos, sem flags de bypass.
- [Race de inicialização Pixi no Strict Mode] → Owner com cancelamento e descarte tardio, testes com promise controlada e inspeção do canvas real.
- [Imutabilidade apenas estática] → Cópia e freeze recursivos, testes com arrays/objetos e mutação da origem.
- [Contrato antecipado ficar grande] → Limitar campos aos dados explícitos do GDD e não implementar engine, bus ou repositories futuros.
- [Mapa ou balanceamento propostos mudarem] → Marcar origem e unidades em ARCHITECTURE, versionar alterações pertinentes, tratar envelopes como propostas.
- [Licença de assets desconhecida] → Não adicionar arte externa nesta etapa; registrar investigação de proveniência para a entrega futura sem presumir licença.

## Migration Plan

Adicionar aplicação e ferramentas sem mover documentos/assets existentes. Confirmar lockfile com instalação limpa, rodar validações e salvar evidências no relatório apply. Esta change não publica nada. Como não existe aplicação prévia, rollback consiste em reverter somente os novos arquivos de produto/ferramentas desta implementação, preservando documentos do usuário e histórico OpenSpec.
