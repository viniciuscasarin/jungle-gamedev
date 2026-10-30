# Spec Delta

## ADDED Requirements

### Requirement: Retenção limitada durante exploração procedural

Terreno, grafos e nós visuais SHALL ser retidos somente pelas áreas atualmente necessárias e por uma capacidade ociosa explícita. Seus limites SHALL não crescer com o total de regiões já visitadas. Descarte SHALL liberar recursos sem invalidar entidades ativas, consultas em andamento ou texturas compartilhadas.

#### Scenario: Travessia prolongada e revisita
- **WHEN** um percurso determinístico atravessa ao menos 20 regiões distintas e revisita uma região inicial descarregada
- **THEN** diagnósticos demonstram contagens dentro dos limites calculados para consultas ativas e capacidade ociosa, sem crescimento proporcional ao histórico
- **AND** o terreno revisitado coincide com o original e nenhum cache de grafos permanece globalmente acumulado após sair da partida

#### Scenario: Perfil com streaming em sessão máxima
- **WHEN** o profiling executa uma partida de 180 segundos com deslocamento contínuo, atravessando regiões em regime normal e de spawn acelerado
- **THEN** coleta tempo de geração e rotas, pico de regiões residentes, grafos, sprites e entidades, além das métricas existentes
- **AND** os orçamentos vigentes de CPU, quadros e recuperação limitada continuam aplicáveis sem desabilitar travessias para obter aprovação

#### Scenario: Cinco ciclos com exploração
- **WHEN** cinco ciclos de partida e retorno ao menu incluem travessia e reconstrução de regiões
- **THEN** os recursos próprios de terreno, rotas e apresentação são liberados com os demais recursos da arena
- **AND** o diagnóstico retorna a zero recursos de partida ativos e o heap após coleta não apresenta crescimento progressivo ligado ao histórico de regiões
