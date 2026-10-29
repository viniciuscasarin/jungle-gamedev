# Spec Delta

## ADDED Requirements

### Requirement: Geometria de projétil centralizada

Raio de colisão da bala e folga de emissão SHALL estar na configuração tipada em unidades lógicas, capturados com os demais parâmetros. Valores técnicos adicionais SHALL ser documentados como hipóteses geométricas e não substituir dano, quantidade, cadência, velocidade, lifetime ou espaçamento propostos no GDD.

#### Scenario: Dimensões e alcance consistentes
- **WHEN** combate e diagnóstico usam a configuração inicial
- **THEN** compartilham raio e folga explícitos e não dependem da dimensão física da textura para decidir colisões
- **AND** Q mantém dano 20, quantidade 1, cooldown 350ms, velocidade 420 e vida 1200ms; W/E mantêm dano 20, quantidade 3, cooldown 1200ms, velocidade 360, vida 1000ms e espaçamento 14
- **AND** alcance continua derivado de velocidade e lifetime e score por morte do player continua 1
