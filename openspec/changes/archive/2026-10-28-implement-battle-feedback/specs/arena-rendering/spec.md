# Spec Delta

## ADDED Requirements

### Requirement: Efeitos visuais de combate
A arena PixiJS SHALL renderizar feedback visual tátil para eventos de combate, incluindo clarões de disparo (*muzzle flash*), partículas de detrito de madeira (`wood_1..4.png`) em impactos no casco, animação de explosão em 3 frames (`explosion_1..3.png`), desvanecimento (*fade*) progressivo de naufrágio na destruição e indicador flutuante "+1" ao abater navios inimigos. Efeitos pós-morte SHALL ser estritamente cosméticos, desprovidos de colisão e incapazes de gerar pontuação adicional.

#### Scenario: Disparos com muzzle flash
- **WHEN** o jogador ou inimigo Shooter realiza um disparo frontal ou lateral
- **THEN** uma animação curta de clarão surge na posição dos canhões correspondentes alinhada à direção do tiro
- **AND** o efeito não obstrui a leitura da trajetória do projétil

#### Scenario: Impactos no casco com detritos
- **WHEN** um navio recebe dano por projétil ou colisão
- **THEN** partículas de fragmentos de madeira são projetadas radialmente a partir do ponto de impacto com rotação e desvanecimento rápido

#### Scenario: Destruição com explosão, detritos e fade de naufrágio
- **WHEN** um navio atinge integridade zero ou sofre colisão fatal
- **THEN** uma sequência de explosão de 3 frames é exibida com dispersão de detritos maiores
- **AND** o casco derrotado submerge com desvanecimento gradual de transparência sem interagir com novos tiros

#### Scenario: Indicador flutuante de pontuação
- **WHEN** uma embarcação inimiga é destruída conferindo ponto ao jogador
- **THEN** um indicador de texto "+1" surge sobre a posição da embarcação e flutua verticalmente com fade-out

### Requirement: Modulação visual de estado do casco
A representação gráfica de cada navio vivo SHALL refletir visualmente sua integridade autoritativa em três faixas: *healthy* (saúde >60%), *damaged* (>25% até 60%, exibindo tonalidade de desgaste no casco) e *critical* (≤25%, exibindo escurecimento e animação contínua de chamas sobre o mastro/deck). As modulações visuais SHALL preservar inalterados os limites de colisão e a leitura das velas.

#### Scenario: Transições visuais de avaria
- **WHEN** o navio transita de integridade plena para faixa entre 25% e 60%
- **THEN** o casco recebe modulação visual de desgaste mantendo o colisor idêntico

#### Scenario: Chamas ativas em estado crítico
- **WHEN** a saúde de uma embarcação viva está em 25% ou menos
- **THEN** partículas ou sprites animados de fogo são renderizados continuamente sobre o deck
- **AND** a animação de chamas é removida no momento da destruição final

### Requirement: Congelamento visual e conformidade com reduced-motion
Todas as animações de partículas, clarões, explosões e afundamento SHALL congelar completamente durante o estado pausado da partida. Sob preferência do sistema por movimento reduzido (`prefers-reduced-motion: reduce`), o renderizador SHALL desativar tremores de tela (*screen shake*), suprimir efeitos estroboscópicos e reduzir a quantidade de partículas, preservando integralmente o determinismo e as regras da simulação.

#### Scenario: Efeitos congelados na pausa
- **WHEN** a partida entra em estado pausado enquanto partículas de explosão e detritos estão ativas
- **THEN** as posições, rotações e transparências de todas as partículas congelam no frame exato da pausa
- **AND** nenhum efeito avança até a retomada

#### Scenario: Respeito a prefers-reduced-motion
- **WHEN** a preferência por redução de movimento está ativa no sistema do usuário
- **THEN** tremores de tela são desativados e explosões utilizam transição estática de desvanecimento
- **AND** as trajetórias, velocidades e regras autoritativas dos navios permanecem inalteradas
