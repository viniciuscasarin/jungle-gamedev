# Design

## Context

Ver proposal.md para motivação. A base arquivada 01–03 já fornece configuração imutável, StepInput.fire simultâneo, snapshots de projéteis/score/cooldown e eventos de dano/destruição/score. Porém engine.ts ignora fire e não avança cooldown; input/desktop.ts captura somente R. navigationLoop.ts possui um RAF e acumulador limitado; freeze limpa input e tempo. collision.ts varre círculo contra faces/vértices do litoral para deslizar o casco. pixiPreview.ts apresenta somente player e fornece diagnóstico readonly; React recebe apenas mudanças discretas de navegação.

As specs runtime/render ainda dizem sem combate: os deltas substituem essas restrições temporárias. Contratos/config são sem DOM e incluídos na verificação core. Assets Chaser/Shooter já têm identidade verificada; cannon_ball.png foi inspecionado no explore como esfera transparente 10×10, com metadados default/retina conferidos. Não há AGENTS.md adicional encontrado.

## Goals / Non-Goals

**Goals:** reutilizar o passo e dono existentes, tornar cada hit e atribuição de score auditáveis, e permitir ensaio real de Q/W/E com alvos puros sem mudar regras por flag.

**Non-Goals:** abstração de scheduler de entidades, pool antecipado, motor de física, IA/spawn, disparo autônomo de inimigo, ciclo de partida ou resultado. O mínimo de contato de Chaser serve à precedência obrigatória desta etapa. Não ampliar a suite para funcionalidades futuras.

## Decisions

### 1. Domínio explícito e preparação somente inicial

Manter createSimulation como dono das entidades internas e snapshots. Separar helpers puros de armas/sweep/dano em módulos próximos quando isso reduzir complexidade; não introduzir ECS. Entidades têm id, arquétipo, facção, saúde e estado vivo derivado de saúde positiva. Remover mortos das coleções de colisão/ação imediatamente; o snapshot do player pode permanecer com saúde 0 para inspeção e auto-sail Off.

Adicionar dados iniciais opcionais puros à criação da simulação/loop, copiados e congelados, para inimigos e balas. A configuração e seed continuam separadas. IDs únicos, números finitos, vida positiva, saúde dentro do máximo do arquétipo e posições de fixture coerentes devem ser verificados; fixtures de teste podem iniciar contato entre cascos para provar a ordem. Não aceitar funções ou comandos mutantes. O adaptador traduz apenas `?combatScenario=targets` para dados antes da criação. Fluxo normal mantém enemies/projectiles vazios e score 0.

Projétil interno captura ownerId, faction, damage, direção normalizada, posição, raio e remainingLifetimeMs. Sua validade não depende da sobrevivência do owner. Eventos damage/destruction.sourceId identificam o navio emissor; projectile.id identifica a bala no snapshot. Score usa autoria capturada do player. Expor no contrato os dados autoritativos necessários sem objetos Pixi; manter cópias históricas profundamente imutáveis e eventos somente do último passo. Alternativa rejeitada: procurar o owner vivo a cada hit, que perderia facção e autoria após sua morte.

### 2. Convenção geométrica e emissão

Em coordenadas de tela e rumoθ, frente F=(cosθ,sinθ), bombordo P=(sinθ,−cosθ), estibordo S=−P. Q usa F; W usa P; E usa S. Atualizar rumo e posição pela navegação antes de criar novas balas. Em cada broadside, deslocamentos longitudinais s=−14,0,+14 vezes F; vetores de velocidade idênticos e perpendiculares ao casco. Q usa s=0.

Adicionar à configuração raio técnico inicial da bala 5 unidades e folga de emissão0,5 unidade, hipóteses documentadas e imutáveis. Não derivar colisão da textura nem mudar valores de armas do GDD. Para broadside, calcular afastamento lateral suficiente para a distância do centro ser pelo menos hullRadius+projectileRadius+clearance, considerando s; Q usa esse afastamento frontal. Usar o segmento do ponto de emissão longitudinal até o muzzle, com o mesmo sweep contra mundo/ilhas e teste de ocupação final, ignorando o próprio casco. Uma bala bloqueada é consumida na emissão, sem devolução de cooldown. Isso evita que um muzzle já além da borda fina atravesse costa adjacente. Apenas testar posição final foi rejeitado por permitir nascer atrás do sólido.

### 3. Tempo e ordem de fases

Todos os tempos derivam de passos ativos; nenhum relógio de parede no core. Representar recarga por deadline em tempo ativo ou valor equivalente com tolerância numérica documentada. Primeira oportunidade é pronta. Se ativada em t, próxima ativação é o primeiro passo com tempo≥t+cooldown; a tolerância não permite tiro antecipado material nem acrescenta um passo por arredondamento. Manter Q/W/E independentes e não acumular disparos por tempo descartado. O cooldown publicado é max(0,deadline−tempoAtual).

Ordem fixa de cada passo:

1. Iniciar coleção nova de eventos e calcular tempo ativo/deadlines do passo.
2. Resolver projéteis existentes no início, em ordem determinística estável de ID, contra entidades vivas; aplicar mortes imediatamente.
3. Navegar player somente se vivo usando rumo atualizado, colisão e R existentes.
4. Resolver contato de Chasers ainda vivos com player vivo. Cada contato aplica 25 uma vez e autodestrói o Chaser, score 0; Shooter não causa dano. Se player morrer, impedir qualquer contato/ação posterior dele.
5. Criar ataques solicitados das armas prontas somente do player vivo, verificar muzzle e registrar cooldown. Balas novas aparecem neste snapshot e começam deslocamento no próximo passo.
6. Publicar snapshot e eventos imutáveis, com step e tempo ativo explícitos.

O passo que mata um Chaser por bala não executa seu contato posterior. Player morto ignora navegação e fogo; balas já em voo continuam independentes. Não converter isso em completed/ended nem criar timer/resultado: a finalização completa pertence a outra etapa. Congelamento para todo o passo, inclusive lifetime e recarga, e Resume já limpa held e baseline. Alternativa rejeitada: atualizar projétil recém-criado por dt inteiro no mesmo passo, que dificulta atribuir vida e instantes de emissão.

### 4. Sweep de projétil e dano

Reutilizar geometria pura de faces e vértices de collision.ts por helper apropriado; preservar deslizamento do casco. A bala não desliza. Para cada bala, dt útil=min(fixedStepMs,remainingLifetimeMs); calcular segmento por velocidade×dt útil e menor t normalizado em[0,1] entre limites reduzidos pelo raio, litoral inflado pelo raio e círculos de cascos hostis vivos somando raios. Incluir t0 para bloqueio inicial e tangência dentro da tolerância. Se houver empate, sólido tem prioridade; entre sólidos usar ID/ordem geométrica estável e entre navios ID estável. Não resolver por ordem de arrays de candidatos. Um impacto no instante final da vida ainda é válido; depois desse instante nada pode ser atingido.

Filtro de facção ocorre antes de escolher casco: aliados não consomem bala. Nunca inserir balas na lista de obstáculos. No hit hostil, limitar saúde a zero e emitir damage uma vez; somente transição saúde>0→0 emite destruction e eventual score 1. Após remover o alvo morto, próximas balas avaliam os alvos vivos restantes. Bala que atingiu morre independentemente de dano letal. Shoreline/limite/expiração só consomem, sem dano de costa. Alternativa rejeitada: overlap somente no destino, que atravessa obstáculos finos e escolhe alvo protegido.

### 5. Input, renderer e status mínimo

Estender buffer existente com held separado Q/W/E e preservar R por borda. Capturar gameplay keys somente no host pronto/ativo, sem modificadores/campos editáveis. Keyup, blur do host, freeze, saída e destroy limpam held; repeats de ataque não criam ativações adicionais. Mouse e teclas coexistem no StepInput já definido.

Renderer reconcilia sprites por IDs de inimigos/projéteis do snapshot, mapeia arquétipos ao manifest e bala ao asset verificado. Descartar objetos próprios quando somem sem destruir texturas emprestadas; não acrescentar ticker/RAF. Estado discreto de destruição é suficiente, sem animação completa. Diagnóstico continua readonly, pode mostrar saúde e coleções reais; não criar funções de grantScore/kill/teleport.

Manter React para instruções e score; mostrar Q/W/E com Ready ou segundos restantes e R On/Off, sem HUD final ou botões touch. Limitar publicação de cooldown a no máximo 10Hz ou somente mudança de décimo visível, com atualização imediata para score/pronto/pausa; não setState por frame. Evitar aria-live repetitivo para ticks de cooldown. Preservar mundo inteiro e faixas reservadas em 320px e landscape. Atualizar texto antigo que afirma ausência de combate.

### 6. Cenário e verificação proporcionais

Fixture `targets`: player padrão no centro apontando para cima; alvos estacionários com saúde/raio do GDD, pelo menos um à frente e um a cada lado em água livre e alcance real. Sugestão inicial: Chaser(480,145), Shooter(350,270), Shooter(610,270). Os alvos não perseguem/disparam e usam colisão/dano/destruição reais. O seletor não muda as regras. Testes de contato/ordem/facção inimiga podem fornecer balas/entidades iniciais puras, sem IA nem controles mutantes em runtime.

Node: padrões em rumos cardinais/oblíquos e giro; origens/paralelismo; held e fronteiras temporais; independência; pause/stall/lifetime parcial; sweep de ilha completa, canto, limite, muzzle adjacente, alvo atrás de terra e menorTOI; facções e balas cruzadas; dano único e várias balas letais com um score; projétil antes de contato e contato isolado0score; mortos inativos e balas do owner morto; histórico imutável e input simultâneo. Reutilizar fixtures e helpers mínimos, sem matrix especulativa de IA ou ciclo de partida.

Playwright: abrir fixture documentada, operar mouse/Q/W/E/R reais e avançar relógio de teste sobre loop real para acertar e destruir alvos. Conferir snapshots readonly, score semântico e captura visual de balas/alvos/indicadores; verificar blur/Resume com held limpo e tempo congelado, fluxo padrão vazio, teclado fora do contexto e descarte com sprites dinâmicos. Preservar checks de cache/owner e ampliar expectativa de assets sem enfraquecê-los. Reutilizar cobertura de navegação/resize e inspecionar320px/landscape. Não conceder vida/dano/morte/pontos por evaluate.

## Risks / Trade-offs

- [Muzzle circular difere da arte alongada] → especificar raio autoritativo e distribuição longitudinal; confirmar origens fora do círculo e inspeção visual.
- [Reuso do sweep altera navegação] → manter testes existentes de litoral/deslizamento e isolar a seleção de impacto sem resposta de slide.
- [Arredondamento atrasa cadência ou expande alcance] → deadlines e tolerância explícitos, testar fronteiras e vida parcial.
- [Ordem de arrays muda morte/score] → IDs estáveis, seleção global de menor t por bala, desempates e transição atômica.
- [Fixture vaza para fluxo normal] → seleção apenas antes da criação, URL documentada e teste default vazio.
- [Sprite morto ou listener órfão] → reconciliação por snapshot e ciclo de teardown existente; executar ensaio de saída/reentrada com projéteis ativos.
- [Crescimento da etapa para inimigos completos] → contato mínimo estacionário e dados iniciais; nenhuma perseguição, spawn ou tiro autônomo.

## Migration Plan

Implementar nesta aplicação local por tarefas pequenas, manter executável e validar regras antes do adaptador visual. Sem migração de dados persistidos ou dependência nova. Rollback consiste em reverter os arquivos desta change e artefatos correspondentes, preservando a navegação da base. Após verify satisfatório, sincronizar deltas preservando Purpose das seis capabilities existentes e criar player-combat com o Purpose fornecido; só então arquivar. Esta fase termina no planejamento; o orquestrador inicia apply em outro executor conforme autorização antecipada de project/automation.md.
