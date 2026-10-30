# Design

## Context

Ver motivação e escopo em `proposal.md`. O projeto separa React, apresentação Pixi e simulação headless a 60 passos/s. `config.ts` captura um retângulo 960×540, duas ilhas com um contorno convexo cada e início em (480,270). `collision.ts` aplica paredes do retângulo a cascos e projéteis. `navigation.ts` monta uma malha do mundo inteiro e guarda grafos em um `Map` global sem descarte. O diretor sorteia candidatos no perímetro finito.

`viewport.ts` enquadra o mundo inteiro com `min` entre escalas e reserva faixas medidas do HUD. O adaptador desktop armazena alvo lógico com clamp ao mundo; com câmera móvel esse alvo faria o player navegar em direção a um ponto antigo. Barras de saúde também são limitadas pelas dimensões finitas. Os tiles de areia, grama, litoral e água necessários já estão no manifesto.

`validation.ts` compara o formato histórico com `DEFAULT_CONFIG`, rejeita coordenadas negativas fora dos rumos e exige ilhas dentro do retângulo. Alterar apenas os defaults tornaria inválidos resultados e itens da outbox existentes. A change concluída `add-startup-loader-and-mobile-landscape` ainda está ativa e modifica o mesmo requisito de enquadramento, além do HUD touch; a implementação existente já exige landscape no mobile.

## Goals / Non-Goals

**Goals:**
- Separar a descrição finita e imutável do gerador do terreno materializado sob demanda.
- Garantir conectividade por construção, com custo de consulta ligado à área necessária e às entidades atuais.
- Preservar determinismo por passo e resultados históricos, mantendo o renderer fora das decisões de gameplay.
- Tornar câmera, mouse, terreno e colisões coerentes durante travessias, pausas e mudanças de viewport.

**Non-Goals:**
- Não salvar um universo inteiro nem introduzir alterações persistentes no terreno.
- Não criar formato de ilha livre por ruído, costa côncava arbitrária, novos assets ou dependências.
- Não introduzir descarte de inimigos por distância, cap de inimigos, zoom interativo ou novos objetivos de partida.
- Não garantir aritmética espacial de precisão ilimitada: o mundo não tem borda jogável, mas as sessões existentes continuam limitadas a 180 segundos e coordenadas finitas representáveis.

## Decisions

### 1. Uma change coesa com etapas implementáveis

Geração, geometria, câmera, input e spawn compartilham contratos que deixam de pressupor mundo finito. Manter uma change evita liberar uma etapa com paredes ou spawns incompatíveis. As tarefas isolam entregas pequenas e verificáveis. Separar changes independentes exigiria estados intermediários de gameplay e coordenação de vários deltas sobre os mesmos requisitos.

### 2. Configuração procedural versionada e leitura histórica separada

Introduzir um descritor de mundo com discriminante procedural, versão de gerador, tamanho de região, posição inicial, catálogo geométrico, layouts e perfis de espaçamento. `GameConfig` da execução usa esse descritor; dados persistidos aceitam união explícita entre configuração procedural e os formatos finitos históricos suportados. Não usar o novo `DEFAULT_CONFIG` como schema de validação de dados antigos.

Defaults técnicos iniciais propostos, sujeitos à calibração documentada antes de concluir a implementação:

| Parâmetro | Valor inicial | Papel |
| --- | --- | --- |
| Mapa / gerador | `ocean-v1` / `archipelago-v1` | Distinguir regras procedurais das arenas existentes |
| Lado de região | 1280 unidades | Conter pequenos layouts e permitir consultas locais |
| Tile de terreno | 40×40 unidades | Reutilizar proporção lógica atual sem esticar texturas |
| Margem de água em cada borda | 80 unidades | Garantir corredor de ao menos 160 entre sólidos de regiões vizinhas |
| Alvos próximo / médio / distante | 160 / 280 / 440 unidades | Posicionar pares designados dentro dos layouts |
| Tolerância de distância-alvo | 1 unidade | Comparar litorais reais sem tolerância visual arbitrária |
| Raio inicial de água livre | 160 unidades | Proteger início em (480,270) e manobra |
| Faixa de spawn ao player | 240–520 unidades | Manter encontros próximos sem depender da câmera |
| Capacidade ociosa do cache de terreno | 8 regiões | Evitar retenção de todo o percurso |
| Capacidade ociosa de grafos locais | 8 entradas | Limitar memoização por região e raio |

Os valores escolhidos pelo usuário são mundo infinito, formas e espaçamentos predefinidos e manutenção do tempo; os números acima são propostas técnicas. Mudanças de parâmetros de gameplay ou catálogo alteram a chave canônica e a versão apropriada. Seed continua separada; regiões geradas, câmera e caches não entram na chave. O descritor e a seed, já presentes no resultado, bastam para reconstruir o terreno, sem ampliar o envelope de REST.

A validação histórica congela o schema finito e confere sua própria chave original. Não converte resultados anteriores, não apaga armazenamento e não oferece reprodução de versões antigas do motor. `Play Again` continua preparando partida atual com as opções válidas. Coordenadas do mundo podem ser assinadas; limites positivos continuam obrigatórios para raios, dimensões, velocidades e durações.

Alternativa rejeitada: adicionar dimensões enormes e preencher `world.islands` à medida que se navega. Isso mistura configuração com estado, altera a chave durante a partida e perpetua custo global de navegação.

### 3. Regiões puras e layouts compatíveis por construção

Criar módulos de terreno em `src/simulation/world/` e contratos puros em `src/simulation/contracts.ts` ou módulo de tipos dedicado. A região de um ponto é calculada com `floor(coordenada / lado)`, inclusive em valores negativos; o limite superior é exclusivo. Um hash estável de versão, seed e par de índices assinados seleciona layout e variações. IDs incluem coordenadas completas da região e slot, sem depender da ordem de consulta. Separar o domínio aleatório do terreno do RNG sequencial do diretor.

O catálogo inicial possui três famílias convexas: compacta, alongada e larga. Cada uma usa composição por tiles quadrados e contorno medido correspondente; dimensões e rotações aprovadas pertencem ao catálogo, sem escalas aleatórias que distorçam o litoral. O domínio usa IDs semânticos de modelo; caminhos e texturas permanecem no renderer. Folhagem e pedras decorativas conservam o tratamento atual sem sólidos extras.

Cada layout regional posiciona de duas a quatro ilhas conforme as dimensões dos modelos. Define os pares usados para espaçamento e uma escolha discreta entre os três alvos. Toda combinação aprovada preserva distâncias mínimas entre todas as ilhas, inclusive pares não designados, e mantém sólidos integralmente dentro da região com margem mínima de água. A distância é a menor distância entre polígonos sólidos, não entre centros. Layouts, rotações e combinações de modelos são validados antes de entrar no catálogo.

Espaçamento predefinido significa distância controlada nos pares do layout; não significa que toda dupla de ilhas do oceano esteja a uma das três distâncias. Entre regiões, a margem compartilhada garante o mínimo de passagem, podendo existir trechos maiores de mar aberto. Esta distinção evita prometer uma restrição geometricamente impossível para todas as duplas e permite geração independente.

As bordas reservadas formam corredores contínuos. A validação de cada layout infla sólidos pelo maior raio de casco e folga de manobra e verifica que toda a água navegável relevante se conecta ao corredor exterior, incluindo caminhos ao redor de cada ilha. A margem considera também o raio de curva nominal `velocidade / velocidadeAngular`; 80 unidades excedem raio de curva e casco dos navios atuais. Validação geométrica e ensaios de navegação verificam os dois aspectos, sem presumir que ausência de sobreposição prove conectividade.

A região inicial usa variante previamente validada com água livre ao redor de (480,270); a seleção depende apenas da preparação. Ela também respeita as margens comuns. Não remover ilhas de forma adaptativa baseada no percurso. Uma configuração customizada com início diferente precisa de variante de início que satisfaça os mesmos invariantes ou deve ser rejeitada antes de jogar.

Alternativa rejeitada: distribuir ilhas aleatoriamente e rejeitar conflitos com regiões já carregadas. O resultado dependeria da ordem de exploração; corrigir depois uma ilha vizinha produziria terreno móvel. Ruído contínuo também não expressa diretamente os formatos e distâncias pedidos.

### 4. Serviço de terreno e colisão sob demanda

A sessão possui um serviço puro de consultas geométricas com memoização descartável, usado por engine, IA, diretor e renderer. Consultar uma região nunca altera estado autoritativo, RNG de combate ou eventos. Cada instância pertence à sessão e tem descarte explícito via ciclo de vida do executor; não manter caches globais entre partidas.

Consultas por AABB enumeram todas as regiões intersectadas, incluindo sólidos necessários à expansão pelo raio. A ilha tem uma única região proprietária e IDs estáveis, evitando duplicatas nas consultas e renderização. Regiões ausentes são geradas sincronamente por trabalho finito antes de responder; nunca tratar cache miss como água. A simplicidade do catálogo permite começar sem worker ou pipeline assíncrono.

Generalizar as operações de círculo e varredura atuais para consumir sólidos consultados, removendo testes de paredes apenas no mundo procedural. Para movimento e projéteis, a AABB cobre o segmento completo expandido pelo raio, não apenas endpoints. Emissão segura, prioridade de primeiro impacto, autoria e lifetime permanecem como hoje. A ordem de sólidos usa IDs estáveis para manter empates reproduzíveis.

O cache distingue dados requeridos pela consulta atual e dados ociosos em LRU. Após uma consulta, reter no máximo a capacidade ociosa, além de referências estritamente necessárias a consumidores em uso. Dados imutáveis entregues antes não são mutados na evicção. A reconstrução não muda resultados nem deixa uma fronteira física.

### 5. Rotas regionais e locais, sem grafo do mundo inteiro

Substituir o grafo global de `navigation.ts` por planejamento em duas escalas. Os corredores de borda dão conectividade garantida entre vizinhos ortogonais. Para regiões distintas, selecionar o próximo corredor por caminho regional determinístico, reduzindo distância Manhattan com desempate fixo. Não executar busca sobre espaço infinito nem guardar uma lista de todas as regiões visitadas.

Dentro de cada região, A* local reutiliza a lógica de validação e atalhos seguros com o raio do casco, ligando a posição real ao próximo corredor ou destino real. Portais e seus segmentos de ligação são dados geométricos verificados, com largura suficiente e conexão pela margem de água. O inimigo mantém somente o trecho necessário e replaneja na cadência atual; quando o player muda de região, atualiza o próximo trecho. Shooter continua usando distância tática e linha de visão autoritativas.

Grafos locais usam chave por versão, seed, região e raio efetivo e LRU de capacidade limitada. Evicção ou consulta visual nunca pode mudar desempates. Rota indisponível não autoriza atravessar sólidos; ausência de conexão num layout aprovado é falha de validação a corrigir, não justificativa para aceitar inimigo preso.

Alternativas rejeitadas: ampliar a malha global, que cresce com o mundo, ou usar somente steering reativo, que não garante contorno de ilhas. A hierarquia pode produzir caminhos maiores; isso é aceitável frente a conectividade, previsibilidade e custo limitado.

### 6. Câmera imediata, fundo contínuo e mouse direcional

Manter referência visual 960×540, agora como enquadramento de apresentação e não como tamanho do mundo. Usar escala uniforme `max(larguraHost/960, alturaHost/540)` para preencher o host; proporções diferentes mostram um recorte dessa referência. Posicionar o player no centro da área livre calculada a partir dos controles e safe areas medidos, enquanto o cenário continua sob todos os grupos. O acompanhamento é imediato, sem rotação ou suavização que introduza atraso de mira.

```text
preparacao: configuracao + seed
              |
              v
       consultas de terreno
        |             |
        v             v
 simulacao fixa   apresentacao regional
        |             ^
        v             |
     snapshot --> camera e HUD
```

`viewport.ts` passa a representar câmera, escala e offsets em CSS pixels; a origem projetada pode ser negativa. O fundo usa água repetida cobrindo o host, com fase de textura vinculada às coordenadas do mundo. Renderer monta ilhas do retângulo visível expandido por uma região, preparando-as antes da entrada na tela. Libera sprites distantes sem destruir texturas compartilhadas. Barras são calculadas com limites de tela e câmera em vez de largura/altura finitas do mundo.

O mouse é convertido pela transformação da apresentação corrente em vetor entre player apresentado e ponteiro, aplicando a dead zone em unidades lógicas. O adaptador armazena direção normalizada para os passos seguintes, como o joypad; câmera em movimento não reinventa um alvo fixo. Resize ou DPR atualiza a transformação e conserva o comando armazenado até novo input válido. Eventos posteriores usam a nova transformação. Alvos de mundo explícitos continuam suportados no core e seus testes.

HUD permanece DOM, em inglês, com hitboxes e safe areas atuais. Somente os grupos necessários recebem input; sobreposições visuais não devem criar bandas opacas cobrindo a largura toda. Pausa congela acompanhamento e gameplay; resize reapresenta o mesmo estado congelado. Portrait mobile continua bloqueando ações e exige Resume ao voltar. Respeitar reduced-motion existente sem introduzir efeitos adicionais.

### 7. Spawn e entidades independentes da visibilidade

O diretor usa seu fluxo determinístico em domínio separado para escolher ângulo e raio na faixa lógica 240–520 ao redor do player. Validar terreno, cascos, reservas e rota antes de reservar e novamente ao materializar; faixa completa também é revalidada. Preservar intervalo configurado, alternância por sucesso, 64 tentativas padrão, telegraph de 600ms e descarte de oportunidade sem backlog.

O anel é apresentado se sua posição estiver visível; não há garantia de spawn fora da tela nem mudança da faixa por viewport. Inimigos e balas fora da tela continuam autoritativos. Não introduzir despawn por distância: isso mudaria a pressão do combate sem decisão do usuário. A duração máxima e o intervalo mínimo já limitam o total de oportunidades por partida; terreno e rotas são consultados também para entidades ocultas, sem depender da região visível.

### 8. Verificação orientada às invariantes

- Testes headless de seed 0 e extrema, índices negativos, fronteiras exatas, ordens de consulta, reconstrução e independência do RNG.
- Validação exaustiva das combinações finitas do catálogo e de vizinhanças, distância de polígonos, margem, conectividade e manobra de todos os cascos.
- Colisão e emissão em regiões frias; projétil atravessando fronteira e primeiro impacto; rotas com origem/destino entre nós e regiões diferentes.
- Mouse parado em auto-sail, câmera em movimento, resize/DPR, safe areas, touch, perda de foco, pausa e ciclo portrait/landscape com os mesmos contratos atuais.
- Fixtures históricas literais do mapa finito em Last Result, histórico, ranking e outbox, sem gerá-las a partir dos novos defaults.
- Teste do serviço de terreno por ao menos 20 regiões com evicção e revisita; essa prova pode consultar regiões diretamente. E2E de navegação usa controles reais e nunca teleporta o player para simular sucesso.
- Benchmarks e profiling de sessão de 180s em deslocamento, spawn de 3s/1s e cinco ciclos, mantendo orçamentos vigentes. Telemetria inclui geração, rotas, regiões residentes, grafos e sprites.

## Risks / Trade-offs

- [Layouts revelarem uma grade visual] -> Variar os pequenos conjuntos, modelos e rotações aprovadas por seed; inspecionar percursos com várias regiões. As bordas não recebem marca visual no jogo normal.
- [Espaçamento alvo diferente do vão visual] -> Medir entre contornos e conferir areia via geometry=1; não usar envelopes como substituto da costa.
- [Geração e busca causarem picos no frame] -> Catálogo finito, consultas locais, pré-carregamento de uma região, caches limitados e perfil com travessia real; ajustar tamanho regional e catálogo sob versão se necessário.
- [Inimigos ocultos manterem custo de IA] -> Medir cenário de 180s/1s com todos os vivos, otimizar rotas locais sem apagar entidades ou reduzir regras silenciosamente.
- [Leitura histórica ser invalidada pelo novo schema] -> Validador histórico separado e fixtures anteriores, incluindo outbox pendente e chave canônica original.
- [Sincronização posterior sobrescrever enquadramento novo] -> Documentar precedência e conciliar a change de landscape antes de sincronizar; manter proteção mobile ao remover a exigência de mundo inteiro.

## Migration Plan

1. Na implementação, estabilizar os tipos procedural/histórico, validar os layouts e introduzir consultas de terreno com testes antes de alterar a apresentação.
2. Adaptar colisão, navegação, combate e diretor juntos ao novo contrato; manter schema e resultados antigos legíveis durante a transição.
3. Integrar câmera, input e composição por modelo; atualizar somente snapshots visuais afetados e as referências de GDD/arquitetura.
4. Executar verificações estáticas, testes, E2E e profiling. Registrar números efetivamente medidos e ajustes de hipóteses, sem declarar desempenho pela existência do plano.
5. Antes de sincronizar/arquivar, resolver a ordem documental com `add-startup-loader-and-mobile-landscape`: integrar seus deltas primeiro quando autorizado, depois este delta remove a visão integral e preserva landscape. Este planejamento não arquiva nem modifica aquela change.

Não há migração destrutiva de dados nem publicação neste escopo. Rollback de código posterior à circulação de resultados procedurais exige leitor compatível com ambos os formatos; não instruir o usuário a limpar storage nem prometer que um binário antigo reconhecerá o novo descritor.
