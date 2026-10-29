# Explore — implement-player-navigation

Concluído em 27/10/2026 por `/root/i03_explore_recovery`, somente leitura.
Primeiro executor não produziu trabalho por quota; nova tentativa ocorreu após
ordinaryUsageAllowed=true. Sem mudança de produto, scaffold ou suíte de produto.

## Evidências e base

Lidos skill explore, automação, contexto comum/bloco03, GDD4/5/13 e pausa8,
config/specs/código/docs/evidências02. Nenhum AGENTS.md encontrado. CLI list raiz
válida/changes vazias; list specs cinco capacidades; validate specs strict exit0,
5 aprovadas. Entregas01/02 untracked devem ser preservadas sem limpeza/commit.

Config existente: mundo960×540, início480/270 heading−π/2,150u/s, giroπrad/s,
raio18, deadzone12, autosail off, passo1000/60ms, catch-up5, arena-v2/balance-v1.
IlhasNW135/95 eSE665/325,160×120 com65 vértices convexos locais cada. Auditoria
matemática confirmou65 vértices, cross mínimo0.390625, área17758.984375.
Não refazer mapa nem transformar tolerância artística4u em penetração física.
Viewport CSS mundo↔tela e contratos StepInput/snapshot/eventos já existem;
core sem DOM com lint de isolamento/relógio/RNG global.

## Decisões propostas

- Simulação pura inicializada de MatchSetup, passo/input explícitos, config
  capturada/seed separada, tempo ativo derivado do índice de passos, sem RNG.
- Um RAF próprio por recurso montado, Pixi ticker parado; acumulador explícito,
  até5 passos/frame, descarta excesso inteiro preservando fração<1 passo.
  Nenhuma renderização React por frame, snapshots atuais bastam sem interpolação.
- Bordas R consumidas uma vez por passo: latch não perde pressão antes de dt;
  ignora repeat/keydown duplicado, keyup libera nova pressão. Não capturar
  atalhos/modificadores/inputs editáveis ou fora de arena pronta/montada.
- Ponteiro client−rect→viewport lógico→clamp mundo. Sem alvo conserva rumo;
  pointerleave retém último; distância≤12 conserva rumo; fora, menor diferença
  angular limitada por giro×dt com wrap/desempate180° determinísticos. Giro antes
  da translação, somente frente. Defaults2.5u/3° por passo. R off permite giro.
- Resize/DPR não reconvertem alvo antigo nem avançam/alteram física; ponteiro
  futuro usa transformação nova. Área zero ignora conversão inválida.
- Colisão círculo contra segmentos/vértices dos polígonos convexos, mundo
  contraído para centros[18,942]×[18,522]. Sweep primeiro impacto, projeção
  tangencial do restante, epsilon/iterações finitos documentados; esgotamento
  mantém posição válida. Contatos t≈0 tangenciais/afastando não podem prender.
  Rotação não muda casco; sem dano/health100.
- Blur/hidden freeze imediato, autosail off, limpa teclas/bordas/target transitório,
  acumulador/baseline zerados. Resume HTML explícito; foco não retoma. Heading
  retido até novo ponteiro; sem movimento até novoR. Não implementar full lifecycle.
- React status discretos autosail/freeze e instruções inglês. Pixi snapshot por
  apresentação. Foco acessível no contexto da arena/Resume; menu/loading/erro/pausa
  não capturamR. Remover mensagens que afirmam cena estática.
- Diagnóstico geometry=1 inclui litoral/casco/limites/rumo derivado da mesma fonte;
  read-only diagnostics podem expor passo/tempo/posição, sem setters/teleporte.

## Specs e arquivos

MODIFIED application-shell/Tela inicial mínima acessível (Static Arena/aviso antigo)
e arena-rendering/Arena estática composta (proíbe movimento/relógio). Preservar
loading/erro/semântica/mapa. Novas capacidades sugeridas simulation-runtime e
player-navigation. Não mudar asset-loading/mapa/config sem necessidade; listas de
inimigos/projéteis e eventos podem permanecer vazias sem antecipar combate.

Módulos simulation engine/acumulador/geometria, input desktop; adaptar pixiPreview,
App/docs. Iniciar loop/listeners no mount, nunca initialize enquanto recurso está
destacado ou esperando300ms; wrappers devem propagar extensão do recurso. Preservar
owner/cache/loading e segurança init tardia. E2E existente precisa trocar exigências
estáticas/RAF0 por um loop durante arena e0 após saída. Evidências novas03 não
sobrescrevem relatórios02; ajustar configuração de saída proporcionalmente.

## Verificação a planejar

FPS30/60/120/144 mesmos resultados sem saturação; interrupção longa≤5 passos sem
backlog; snapshots imutáveis; R held/repeat/borda multistep; giro/wrap/deadzone/clamp/
letterbox/exit; resize invariância; colisão frontal/tangencial/cantos ambas ilhas,
limites/contatos repetidos/health constante. Browser real navega ambas ilhas com
mouse/R, diagnóstico, blur/Resume sem catchup, resize e cinco ciclos StrictMode
sem RAF/listeners órfãos. Checks proporcionais apply/verify. Chromium existente
via PLAYWRIGHT_CHROMIUM_EXECUTABLE; loopback/teardown podem exigir exec escalado
já aprovado anteriormente. Nenhum bloqueio. Sem combate/touch/API/resultados/deploy.
