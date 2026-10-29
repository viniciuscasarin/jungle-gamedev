# Tasks

## 1. Runtime determinístico e navegação pura

- [x] 1.1 Criar inicialização explícita a partir de MatchSetup, estado inicial e publicação de snapshots/eventos profundamente imutáveis; verificar em testes sem DOM estado padrão, reprodução, preservação de snapshots anteriores e ausência de efeitos ao importar.
- [x] 1.2 Implementar passo autoritativo de direção/auto-sail com menor arco, empate de π determinístico, dead zone configurada, avanço frontal e nenhuma mecânica futura; verificar giro parado, ausência de alvo, distâncias 11,999/12/12,001, wrap, limites de giro e deslocamento por passo em testes.
- [x] 1.3 Implementar acumulador puro com duração explícita, máximo cinco passos, descarte inteiro do excesso e resto fracionário; verificar mesmos passos/posição/rumo a 30/60/120/144 FPS, deltas inválidos, stall longo e ausência de backlog no frame seguinte.
- [x] 1.4 Implementar transições explícitas de freeze/Resume com auto-sail Off, tempo ativo derivado de passos e baseline/acumulador limpos; verificar congelamento sem avanço e retomada sem catch-up em testes; documentar contratos e política temporal em inglês no ARCHITECTURE.md.

## 2. Colisão autoritativa com cenário

- [x] 2.1 Implementar sweep círculo contra segmentos/vértices das duas ilhas e limites contraídos pelo raio, usando geometria configurada e constantes numéricas documentadas; verificar impactos frontais, grande deslocamento sem travessia, quatro bordas e ausência de dano/eventos de dano em testes.
- [x] 2.2 Implementar projeção tangencial e contatos subsequentes com limite de iterações/fallback válido; verificar tangência em t≈0, afastamento, cantos/vértices de ambas as ilhas, canto da arena e contatos repetidos sem penetração nem bloqueio indevido.
- [x] 2.3 Integrar solver ao passo do player e validar trajetórias ao redor das duas ilhas, giro em contato e saúde constante em cada passo; registrar em ARCHITECTURE.md a diferença entre casco visual, collider, envelope e tolerância artística e física, com convenções e tolerâncias executáveis pelos testes.

## 3. Input desktop e captura contextual

- [x] 3.1 Criar adaptador mouse→alvo lógico com origem do host, inversa CSS corrente e clamp; verificar letterbox, origem deslocada, DPR, área zero, retenção no pointerleave e invariância do alvo guardado após resize em testes unitários/integração.
- [x] 3.2 Implementar latch e fila de bordas R ignorando repeat/duplicados, consumindo cada pressão uma vez por passo; verificar zero/vários passos por frame, duas pressões entre frames, keyup e limpeza sem comandos herdados.
- [x] 3.3 Restringir captura ao contexto semântico/focável de jogo pronto e excluir atalhos/editáveis/ações de interface; verificar que menu/loading/erro/freeze não consomem R e que perder posse, blur, hidden e destroy limpam teclas/fila/target; documentar em inglês política de input/foco no ARCHITECTURE.md.

## 4. Integração React/Pixi e operação acessível

- [x] 4.1 Integrar snapshot e único RAF próprio iniciado somente em mount, mantendo ticker Pixi parado; propagar contratos necessários por owner/loadingAttempt e descarte idempotente; verificar em testes de integração init tardia, espera Loading, saída durante init, freeze/Resume e cancelamento de RAF/listeners.
- [x] 4.2 Apresentar posição/rumo do snapshot e status discretos sem render React por frame; implementar UI em inglês com Arena, instruções mouse/R antes/durante play, Auto-sail On/Off, Paused e Resume explícito com foco acessível; verificar manualmente e em browser teclado, retorno de foco e legibilidade a320 CSS pixels.
- [x] 4.3 Preservar viewport/resize/DPR, loading/retry/cache e separação de coordenadas; verificar regressões existentes e invariância física/target em resize, rotação, densidade e contato com litoral; atualizar README.md em inglês com controles, freeze/Resume e limites atuais do incremento.
- [x] 4.4 Ampliar geometry=1 com casco, litoral, limites e rumo da fonte real e diagnóstico somente leitura com estado/step/tempo/posição; verificar visualmente contatos e transformações, testar imutabilidade dos dados inspecionados e documentar reprodução em README.md.

## 5. Verificação integrada e evidências

- [x] 5.1 Atualizar expectativas E2E estáticas e instrumentação de recursos para um RAF durante arena ativa e zero após saída/freeze; direcionar screenshots/reporter/output/traces ao diretório03 preservando02; verificar dev Strict Mode e preview por cinco ciclos Play/saída, sem canvas, listener, loop ou consumidor de cache órfão.
- [x] 5.2 Executar E2E com mouse/R reais ao redor dos quatro lados de ambas ilhas, contatos frontais/oblíquos, retenção do alvo e R mantido; anexar observações de posição/saúde/estado e screenshots com geometria, comprovando rotas e slide sem teleporte ou setter de gameplay.
- [x] 5.3 Executar fluxo browser de blur e hidden durante movimento, retorno de foco sem retomada, Resume sem backlog e novo R necessário; verificar exclusões contextuais de input, resize/portrait/landscape/DPR e UI desktop/320, registrando evidência visual e JSON no relatório03.
- [x] 5.4 Executar npm.cmd run lint, npm.cmd run typecheck, npm.cmd test, npm.cmd run build, E2E dev/preview e openspec.cmd validate implement-player-navigation --strict; registrar comandos, exit codes, ambiente, resultados e limitações reais em apply.md, mantendo tasks marcadas somente com comportamento e evidências concluídos.

## Workflow follow-up

- Encaminhar a change e evidências para verify independente, corrigindo divergências de escopo antes de archive.
- Após verify satisfatório, sincronizar deltas e conferir renomeação/conteúdo do requisito de arena, preservando o Purpose existente conforme o contrato da skill de sync; validar specs principais e arquivar pela CLI, conforme autorização da automação.
- Não publicar, fazer push ou editar automation-state.json como executor desta fase.
