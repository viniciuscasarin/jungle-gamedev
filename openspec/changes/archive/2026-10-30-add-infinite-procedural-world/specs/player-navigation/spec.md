# Spec Delta

## MODIFIED Requirements

### Requirement: Conversão e invariância do alvo

O input SHALL converter coordenadas client com origem do host e transformação corrente da câmera, aceitando coordenadas assinadas sem clamp de mapa finito. Mouse SHALL orientar em relação ao player apresentado; câmera em movimento com ponteiro parado SHALL conservar a direção escolhida. Resize e DPR SHALL não reinterpretar o comando lógico armazenado nem deslocar o casco. Área não renderizável SHALL ignorar conversões inválidas.

#### Scenario: Letterbox e origem deslocada
- **WHEN** o mouse informa posição em host deslocado com player e câmera fora da arena antiga
- **THEN** a posição é convertida pela inversa corrente em CSS pixels, sem clamp em [0,960]×[0,540]
- **AND** DPR não multiplica coordenadas CSS e a direção corresponde ao vetor do player para o ponteiro

#### Scenario: Resize e área vazia
- **WHEN** o host é redimensionado ou muda de DPR depois de armazenar um comando lógico
- **THEN** o comando e a posição autoritativa permanecem iguais até passos ou novos comandos válidos
- **AND** área útil temporariamente zero ignora novas conversões inválidas, sem NaN

#### Scenario: Ponteiro parado durante acompanhamento
- **WHEN** o jogador aponta para um lado, liga auto-sail e mantém o mouse parado enquanto a câmera acompanha o navio
- **THEN** o navio continua orientado para esse lado sem perseguir um ponto antigo do mundo ou entrar em círculos pela translação da câmera
- **AND** sair do canvas conserva a última direção válida até novo input ou limpeza contextual

#### Scenario: Dead zone e fontes de direção
- **WHEN** o mouse está a até 12 unidades lógicas do centro do player apresentado ou o usuário alterna entre mouse e joypad
- **THEN** a dead zone preserva o rumo e as fontes continuam sujeitas ao giro limitado, ao auto-sail e à limpeza de comandos existentes
- **AND** o suporte a alvos lógicos explícitos em consumidores sem DOM permanece determinístico

### Requirement: Casco contido e deslizamento sem dano

O movimento SHALL manter o casco circular fora dos sólidos procedurais, preservando componente tangencial quando possível. Fronteiras de região e de caches SHALL não ser obstáculos. Rotação SHALL não alterar o casco nem permitir penetração. Contato com cenário SHALL não alterar saúde nem emitir dano; todo deslocamento SHALL consultar a geometria necessária antes da colisão.

#### Scenario: Impacto frontal e limites
- **WHEN** o player avança frontalmente contra uma ilha ou cruza um antigo limite de mapa ou fronteira de região
- **THEN** para no primeiro contato com terra sem atravessar e cruza livremente fronteiras sem terra
- **AND** mantém saúde 100 na configuração padrão mesmo após contato repetido com litoral

#### Scenario: Contatos oblíquos e cantos
- **WHEN** o casco alcança litoral obliquamente ou um vértice arredondado
- **THEN** desliza ao longo da superfície quando existe deslocamento tangencial válido
- **AND** consegue afastar-se ou prosseguir tangencialmente sem ficar preso por um contato inicial

#### Scenario: Contornar ambas as ilhas
- **WHEN** o jogador dirige com mouse e R ao redor de modelos compactos, alongados e largos, inclusive próximos a fronteiras de região
- **THEN** completa rotas de água ao redor dos modelos sem alterar posições por atalhos de teste
- **AND** giro e resize durante contatos mantêm o casco em posição válida

### Requirement: Diagnóstico fiel ao estado

O diagnóstico SHALL mostrar contornos sólidos, casco circular, rumo, limites da câmera e fronteiras informativas das regiões derivados da preparação e estado autoritativos. Fronteiras informativas SHALL não sugerir colisores inexistentes. Inspeção SHALL ser somente leitura e não permitir teleporte ou alteração de regras.

#### Scenario: Comparação do contato
- **WHEN** a arena é aberta com geometry=1 e o casco chega ao litoral
- **THEN** o contorno corresponde ao usado na colisão e acompanha câmera, giro, movimento e resize
- **AND** posição assinada, região, passo, tempo ativo e auto-sail permitem verificar o comportamento sem modificar a simulação
