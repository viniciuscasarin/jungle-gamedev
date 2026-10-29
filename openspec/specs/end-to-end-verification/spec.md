# end-to-end-verification Specification

## Purpose

Define a infraestrutura e os critérios de validação ponta a ponta (E2E) e de regressão visual do jogo sob execução Chromium desktop e mobile, assegurando conformidade estrita com a Seção 14 do GDD.

## Requirements

### Requirement: Execução de testes Playwright multi-plataforma
A suíte E2E SHALL executar os fluxos do jogo em dois perfis oficiais: Desktop Chrome (viewport 1280x900) e Mobile Chrome emulado (viewport 390x844 com suporte a touch), garantindo isolamento estrito de fixtures e storage entre cada teste.

#### Scenario: Execução limpa em desktop e mobile
- **WHEN** a suíte de testes Playwright é iniciada nos projetos desktop-chrome e mobile-chrome
- **THEN** cada execução inicia com armazenamento local, cookies e estado de sessão isolados sem contaminação entre testes.

### Requirement: Regressão visual determinística com baselines versionadas
O sistema de testes SHALL comparar capturas de tela das telas e estados regulamentares contra baselines versionadas (`toHaveScreenshot`), desativando animações CSS e utilizando sementes determinísticas para assegurar reprodutibilidade.

#### Scenario: Comparação visual estável do Menu Principal
- **WHEN** a captura de tela do Menu Principal é comparada contra a baseline versionada em desktop e mobile
- **THEN** a asserção visual passa dentro do limite estrito de tolerância de pixels sem falso-positivos causados por animações transitórias.

#### Scenario: Comparação visual de estado de batalha estável
- **WHEN** a arena é carregada com semente determinística fixa e simulação estática ou pausada
- **THEN** a renderização gráfica do canvas e dos elementos de HUD coincide pixel a pixel com a respectiva baseline de referência.

### Requirement: Verificação de controles e combate simultâneo
Os testes integrados SHALL acionar os controles reais de navegação e disparo (Q frontal, W bombordo, E boreste) de forma concorrente em movimento, verificando o disparo das salvas e os cooldowns independentes.

#### Scenario: Disparo simultâneo de baterias em navegação
- **WHEN** o jogador navega com Auto-sail ativado e dispara simultaneamente os canhões frontal, bombordo e boreste
- **THEN** sete projéteis são instanciados simultaneamente na simulação e cada bateria apresenta seu respectivo tempo de recarga isolado no HUD.

### Requirement: Verificação de colisão tangencial com ilhas
A simulação física em teste E2E SHALL comprovar que o navio em trajetória oblíqua contra uma ilha desliza suavemente ao longo de seu contorno sem atravessar a costa, sem parar e sem sofrer dano à saúde.

#### Scenario: Deslizamento oblíquo contra ilha
- **WHEN** o navio do jogador colide em ângulo oblíquo contra a costa de uma ilha
- **THEN** a física aplica deslizamento tangencial contínuo sem reduzir o HP da embarcação e sem prender o casco no terreno.

### Requirement: Destruição atômica de inimigos e pontuação única
Os testes E2E de combate SHALL verificar que múltiplas colisões simultâneas de uma mesma salva contra um único alvo computam dano combinado mas conferem exatamente um ponto ao score do jogador.

#### Scenario: Salva múltipla destruindo Chaser
- **WHEN** múltiplos projéteis de uma mesma salva de canhão atingem letalmente um navio Chaser no mesmo tick
- **THEN** o alvo é transicionado atomicamente para o estado destruído e o placar do jogador é incrementado em exatamente uma unidade.

### Requirement: Término de partida com prioridade estrita de destruição
Quando a saúde do jogador atinge zero simultaneamente ao esgotamento do relógio da partida, a condição terminal de morte da nau (`player_destroyed`) SHALL prevalecer incondicionalmente sobre o término por tempo (`time_expired`).

#### Scenario: Dano letal no instante de tempo esgotado
- **WHEN** o jogador sofre dano fatal no mesmo ciclo de atualização em que o tempo restante atinge zero
- **THEN** a tela de resultado e o registro persistido reportam término por nau destruída ("Ship destroyed") em vez de tempo esgotado.

### Requirement: Abandono seguro de partida sem efeitos colaterais
Ao confirmar o abandono de uma partida em andamento através do diálogo modal de confirmação, o sistema SHALL descartar o progresso sem gravar em `Last Result` e sem enfileirar registros na Outbox.

#### Scenario: Abandono confirmado no menu de pausa
- **WHEN** o jogador abre o menu de pausa, clica em retornar ao menu e confirma o abandono da partida
- **THEN** o jogo retorna à tela inicial sem atualizar o último resultado registrado e sem gerar itens pendentes na fila de sincronização.

### Requirement: Congelamento completo em pausa e perda de visibilidade
O sistema de simulação SHALL interromper o avanço do relógio, física, cooldowns e desativar o auto-sail quando o usuário pausar manualmente ou quando a aba perder visibilidade ou foco da janela.

#### Scenario: Pausa manual e perda de foco
- **WHEN** o comando de pausa é acionado ou ocorre perda de foco da janela ativa
- **THEN** a simulação congela imediatamente, o auto-sail é desligado e nenhum avanço compensatório de tempo ocorre após a retomada.

### Requirement: Ciclo de dados completo de partida a ranking e histórico
A conclusão regular de uma partida SHALL salvar os resultados localmente, despachar o registro assíncrono via Outbox e refletir a pontuação atualizada nas abas de Ranking e Histórico ao retornar ao menu.

#### Scenario: Propagação de partida concluída para ranking e histórico
- **WHEN** uma partida é completada com pontuação válida e o jogador retorna ao Menu Principal
- **THEN** a requisição HTTP mockada é confirmada pela Outbox e o novo resultado aparece listado no topo do histórico e posicionado no ranking.

### Requirement: Resiliência touch móvel a cancelamento de ponteiro
Em dispositivos móveis ou toque emulado, o disparo de eventos `pointercancel` SHALL liberar imediatamente os ponteiros afetados sem travar a navegação contínua e sem disparar comandos acidentais de cruzeiro.

#### Scenario: Interrupção de gesto de toque por pointercancel
- **WHEN** um evento pointercancel é emitido sobre o joypad analógico durante manobra
- **THEN** o controle de direção é neutralizado imediatamente sem travar o leme e sem alternar o estado do auto-sail.

### Requirement: Relatórios HTML e retenção de traces em falhas
A execução da suíte E2E Playwright SHALL produzir relatórios em formato HTML e capturar traces completos de depuração exclusivamente para testes que falharem (`retain-on-failure`).

#### Scenario: Geração de evidência em execução com falha
- **WHEN** uma asserção de teste ponta a ponta falha durante a execução da suíte
- **THEN** o Playwright preserva o arquivo de trace e o screenshot do ponto exato de falha no diretório de relatórios da automação.
