# Proposal

## Why

A arena já permite navegação, combate e inimigos, mas não conclui uma partida nem oferece um replay isolado. O incremento 06 fecha o ciclo jogável previsto no GDD §§3, 8 e 9, preservando a simulação pura e permitindo recuperar o último resultado sem rede.

## What Changes

- Introduzir Menu/Loading/Playing/Paused/Result, confirmação de abandono, término único por tempo ou morte e resultado profundamente imutável; morte prevalece no mesmo passo final.
- Capturar identidade da sessão, configuração completa, chave canônica e seed na fronteira de Play; somente passos ativos avançam relógio, combate, IA, reservas e efeitos existentes.
- Implementar Escape/P, botão Pause, blur/hidden, Resume explícito, limpeza de input e baseline sem catch-up; confirmação Keep Playing retorna a Paused.
- Mostrar score, duração ativa, motivo, estado local de gravação, Play Again e Main Menu; replay usa nova engine e novo ID, opções salvas atuais e reset integral.
- Persistir Last Result concluído localmente, com validação completa de JSON e tolerância a storage indisponível; refresh e abandono não sobrescrevem o último concluído.
- Remover limites temporários de specs que excluíam término/resultado e conservar a resolução atômica de todas as balas existentes no último passo, antes do único evento ended.
- Verificar ambos os finais, congelamento e cinco ciclos sem órfãos, com controles e colisões reais.

Fora de escopo: formulário Options, HUD/touch completos, novos efeitos ou áudio, REST/MSW/outbox, ranking, histórico remoto, profiling prolongado e publicação. O adapter de opções prepara o contrato local sem antecipar a tela do incremento seguinte.

## Capabilities

### New Capabilities

- `match-lifecycle`: estados da sessão, captura, término, pausa, abandono, resultado, replay e Last Result local.

### Modified Capabilities

- `application-shell`: telas e diálogos semânticos, status de tempo e foco; descarte nos novos caminhos.
- `simulation-runtime`: término autoritativo, congelamento terminal e entrega única de eventos no loop.
- `simulation-contracts`: contratos puros de término e resultado, retirando a exclusão temporária de mecânicas já implementadas.
- `game-configuration`: chave canônica de parâmetros de gameplay e opções locais validadas na captura.
- `arena-rendering`: apresentação de configuração capturada e estados congelados com término.
- `player-combat`: delimitar balas existentes até a conclusão atômica do passo terminal, sem ações posteriores.

## Impact

Afeta `src/domain/config.ts`, `result.ts`, contratos/engine, input, loop/owner/loading/render, `App.tsx`, estilos e novos módulos pequenos de sessão/storage. Amplia testes Vitest/Playwright e documentação de entrega em inglês. Não exige novas dependências ou APIs. Preserva assets, regras de combate/IA/spawn e evidências 01–05; evidências próprias ficam em `project/automation-reports/06-implement-match-lifecycle/`.
