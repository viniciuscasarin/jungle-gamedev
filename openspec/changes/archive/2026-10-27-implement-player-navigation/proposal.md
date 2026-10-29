# Proposal

## Why

A arena e sua geometria já estão verificadas, mas o navio permanece estático. O incremento 03 transforma essa base em navegação desktop reproduzível, validando movimento e colisões antes de introduzir combate.

## What Changes

- Executar simulação autoral TypeScript com passo fixo de 1/60 s, tempo ativo explícito, catch-up limitado e snapshots/eventos independentes da apresentação.
- Direcionar o casco pelo mouse com conversão e clamp ao mundo, dead zone, giro finito e retenção de alvo; alternar movimento frontal com R sem repetição involuntária.
- Resolver casco circular contra as duas ilhas configuradas e limites, preservando deslizamento tangencial sem dano; tornar geometria e casco inspecionáveis.
- Integrar um único loop de apresentação ao recurso montado, sem render React por frame e mantendo loading, retry, cache e descarte seguro.
- Substituir as mensagens de preview estático por instruções e status em inglês; congelar e limpar input em blur/documento oculto, exigindo Resume explícito.
- Validar regras, input, colisões e navegação real nas duas ilhas; preservar evidências dos incrementos anteriores.

Combate, inimigos, touch, ciclo completo de sessão, resultados, persistência, API e publicação ficam fora deste incremento. Os valores de balanceamento continuam hipóteses iniciais do GDD, sem alegação de playtest concluído.

## Capabilities

### New Capabilities

- `simulation-runtime`: execução determinística por passo, tempo ativo, snapshots e limite de recuperação de frames.
- `player-navigation`: direção desktop, auto-sail, colisão com cenário, contexto de input, congelamento mínimo e diagnóstico.

### Modified Capabilities

- `application-shell`: atualizar fluxo e conteúdo acessível para arena navegável, instruções e status discretos.
- `arena-rendering`: apresentar o navio a partir da simulação, retirando a exigência de cena sem movimento, mantendo mapa, assets, escala e densidade.

## Impact

Afeta `src/simulation/`, novo adaptador em `src/input/`, integração de `src/render/pixiPreview.ts` e seus recursos/wrappers, `src/ui/App.tsx`, testes unitários/E2E e README/ARCHITECTURE. Reutiliza contratos, configuração, polígonos arena-v2 e transformações existentes, sem novas dependências ou chamadas de rede. A configuração e os contratos continuam importáveis sem iniciar execução; somente a montagem explícita da arena inicia recursos. Evidências novas serão registradas em `project/automation-reports/03-implement-player-navigation/`.
