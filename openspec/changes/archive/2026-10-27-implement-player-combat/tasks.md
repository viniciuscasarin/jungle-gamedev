# Tasks

## 1. Contratos e preparação de combate

- [x] 1.1 Estender contratos de projétil com proveniência, facção, dano e dados de trajetória/vida necessários, mantendo snapshots/eventos readonly e sourceId como emissor; verificar typecheck e teste sem DOM de cópias históricas após dano e morte do owner.
- [x] 1.2 Centralizar raio técnico 5 e folga 0,5 em unidades lógicas, preservando todos os valores GDD de armas/saúde/score; verificar testes de config e captura imutável e documentar as hipóteses geométricas em ARCHITECTURE.md em inglês.
- [x] 1.3 Aceitar preparação opcional pura de entidades/balas, copiar e validar IDs e dados, mantendo default vazio e sem setters posteriores; verificar isolamento de origem, dados inválidos e determinismo com a mesma sequência em testes core.

## 2. Armas e tempo ativo

- [x] 2.1 Implementar Q frontal e W/E laterais pelo rumo/posição atualizados, com três origens longitudinais −14/0/+14 e vetores paralelos; verificar rumos cardinais/oblíquos, giro real, distância fora do casco e navegação com três armas simultâneas em testes puros.
- [x] 2.2 Implementar armas inicialmente prontas, cooldowns independentes e held com deadlines em tempo ativo; verificar primeira ativação, fronteiras 350/1200ms sem passo extra, release/repress, congelamento e stall descartado usando o acumulador/loop existente.
- [x] 2.3 Documentar convenções de frente/bombordo/estibordo, momento de emissão, cadência e nova bala movendo no passo seguinte em ARCHITECTURE.md; conferir fórmulas e comportamento com os testes de armas e tempo.

## 3. Sweep, lifetime e emissão bloqueada

- [x] 3.1 Reutilizar geometria contínua para bala circular contra litoral/limites e cascos hostis, selecionando menorTOI por bala e desempates determinísticos, sem alterar o slide do casco; verificar ilha inteira em um passo, alvo protegido, cantos/bordas, ordem invertida de candidatos e testes de navegação existentes.
- [x] 3.2 Verificar segmento emissão→muzzle e ocupação final contra sólido, consumir bala bloqueada sem devolver cooldown e preservar balas válidas da salva; verificar costa/limite adjacente frontal e lateral e caso onde somente testar muzzle permitiria atravessar o sólido.
- [x] 3.3 Integrar deslocamento limitado por lifetime restante e consumo no primeiro hit/expiração, sem bala×bala/friendly fire/piercing; verificar vida parcial, impacto no último instante válido, aliado antes de hostil, balas cruzadas e owner morto em testes core.
- [x] 3.4 Documentar raio, tolerâncias, critérios de empate, lifetime parcial e semântica de primeiro impacto em ARCHITECTURE.md; conferir que a descrição corresponde aos casos geométricos testados.

## 4. Dano, morte, score e precedência

- [x] 4.1 Aplicar dano único com saúde limitada a zero, morte atômica e score exatamente1 por inimigo morto por bala do player; verificar danos não letais, vários hits letais simultâneos, ambos os arquétipos, eventos por passo e ausência de pontos duplicados/cadáveres absorvendo tiros.
- [x] 4.2 Resolver balas existentes antes das ações/contato e incluir contato mínimo de Chaser estacionário 25/autodestruição/score 0, sem IA; verificar morte antes do contato, contato isolado, Shooter sem dano de casco e player morto sem navegar/disparar/causar contato posterior.
- [x] 4.3 Preservar balas de emissores destruídos e publicação histórica imutável, sem emitir resultado ou antecipar lifecycle; verificar autoria/facção após morte, congelamento e uma sequência determinística completa de combate e documentar ordem de fases em ARCHITECTURE.md.

## 5. Adaptadores e cenário reproduzível

- [x] 5.1 Estender buffer/listeners para Q/W/E held e R por borda sem exclusão de mouse/navegação, limpar em keyup/perda de contexto/freeze/teardown; verificar testes de buffer, repeats, modificadores e neutralização na retomada, preservando captura restrita ao host ativo.
- [x] 5.2 Criar fixture de alvos estacionários `combatScenario=targets` somente por preparação inicial com arquétipos/saúde/colisores reais em água e alcance; verificar default vazio e preparação repetível em teste de integração e documentar URL/controles e limites em README.md em inglês.
- [x] 5.3 Incorporar cannon_ball.png verificada 10×10 ao manifest/cache/créditos, renderizar balas e alvos vivos por snapshot e descartar sprites próprios; verificar teste de manifest/metadados, cache compartilhado, reconciliação e teardown sem destruir texturas de outro consumidor.
- [x] 5.4 Exibir instruções mouse/Q/W/E/R e indicadores semânticos mínimos Score, Ready/cooldown em segundos e R On/Off, com publicação limitada e imediata em transições; verificar estados iniciais/pausa e layout desktop 320px/landscape, documentando escopo atual sem alegar HUD final.
- [x] 5.5 Adicionar E2E proporcional usando mouse e Q/W/E/R reais para atingir e matar alvos com score derivado de colisões; anexar snapshots readonly/capturas de combate e conferir orientação, salva lateral e simultaneidade sem grantScore/kill/teleport ou setters de gameplay.
- [x] 5.6 Verificar no navegador held durante blur/hidden e Resume sem tiro herdado, cooldown/vida congelados, teclas fora do contexto, default sem alvos e saída/reentrada com balas ativas; manter checks existentes de um loop/cache/listeners e inspeção visual 320px/landscape sem enfraquecer asserções.

## 6. Verificação integrada

- [x] 6.1 Executar lint, typecheck incluindo core sem DOM, testes de regras afetadas e build; executar E2E pertinente em dev/preview conforme configuração do projeto, corrigir falhas introduzidas e registrar comandos/exit codes e evidências no relatório apply sem declarar cobertura indisponível.
- [x] 6.2 Revisar implementação/documentação contra os critérios do prompt04 e os sete deltas, executar `openspec.cmd validate implement-player-combat --strict` e registrar limites reais, sem tasks marcadas antes de suas evidências.

## Workflow follow-up

- O orquestrador inicia verify em executor novo com a autorização antecipada de project/automation.md.
- Após verify satisfatório e nenhuma task pendente, sincronizar deltas preservando os Purpose existentes e criar Purpose de player-combat; validar e arquivar em fase própria. Nenhuma dessas etapas é checkbox desta implementação.





















