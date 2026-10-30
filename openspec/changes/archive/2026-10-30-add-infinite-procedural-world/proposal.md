# Proposal

## Why

A arena fixa de 960×540 com duas ilhas limita a exploração, enquanto o enquadramento do mundo inteiro reduz o cenário e deixa áreas sem gameplay. A experiência desejada é navegar por um oceano contínuo com ilhas variadas, mantendo passagens previsíveis e as partidas com duração atual.

## What Changes

- **BREAKING**: substituir o mapa finito padrão por um mundo procedural sem perímetro jogável, dividido em regiões regeneráveis por seed e coordenadas, inclusive negativas.
- Introduzir modelos predefinidos de ilhas compactas, alongadas e largas, com composição visual e geometria sólida correspondentes, e perfis predefinidos de espaçamento entre litorais.
- Usar inicialmente 160, 280 e 440 unidades como distâncias-alvo de layouts; são hipóteses de calibração, não valores confirmados pelo usuário. Garantir folga navegável e compatibilidade entre regiões vizinhas.
- **BREAKING**: trocar a visão integral da arena por câmera que acompanha o player, mantém escala uniforme e preenche a tela com cenário sob o HUD e os controles.
- Substituir bordas físicas e malha global de navegação por consultas locais ao terreno e rotas conectadas entre regiões, preservando colisões contínuas de cascos e projéteis.
- Gerar inimigos em uma faixa configurada ao redor do player, independente da câmera, mantendo cadência, aviso, alternância, dano e pontuação atuais.
- Limitar retenção de terreno, grafos e sprites pela área consultada e pelas entidades ativas; reconstruir regiões revisitadas sem acumular histórico de exploração.
- Preservar opções de tempo de 60–180 segundos, padrão de 120 segundos, término por tempo ou morte, controles, pausa e exigência de landscape no mobile.

## Capabilities

### New Capabilities

- `procedural-world`: geração determinística por regiões, catálogo de ilhas, espaçamentos, conectividade, área inicial segura e reconstrução de terreno.

### Modified Capabilities

- `game-configuration`: descritor versionado do gerador e parâmetros capturados, validação de coordenadas assinadas e leitura de configurações históricas finitas.
- `arena-rendering`: câmera de acompanhamento, preenchimento da tela, apresentação regional e transformação mundo/tela.
- `player-navigation`: steering relativo à câmera e colisão com ilhas procedurais sem bordas artificiais.
- `player-combat`: emissão e impactos no terreno procedural, preservando lifetime e autoria ao atravessar regiões.
- `enemy-behavior`: rotas locais conectadas entre regiões e perseguição independente da visibilidade.
- `spawn-director`: seleção e revalidação em faixa ao redor do player, com RNG independente do terreno.
- `simulation-contracts`: descritores puros e imutáveis do terreno procedural e consultas sem dependência do renderer.
- `responsive-hud`: cenário sob os controles com área central legível, preservando acessibilidade e landscape mobile.
- `performance-budgets`: limites observáveis de caches e recursos durante travessia e revisita de regiões.

## Impact

Afeta `src/domain/config.ts`, validação e resultados históricos; `src/simulation` (contratos, engine, colisão, combate, IA e diretor); `src/render` (viewport, Pixi, barras de saúde e ciclo de vida); adaptador desktop e integração do HUD. Exige testes unitários, E2E, profiling com deslocamento e atualização de `GDD.md`, `ARCHITECTURE.md`, `README.md` e documentação da geometria.

A implementação usará as dependências e os tiles existentes. Configuração e seed bastam para reproduzir o terreno; resultados não armazenarão todas as regiões visitadas. Não inclui sobrevivência sem tempo, biomas, desembarque, minimapa, multiplayer, persistência de alterações nas ilhas ou publicação. A change concluída `add-startup-loader-and-mobile-landscape`, ainda não arquivada, contém requisitos de enquadramento que deverão ser reconciliados antes de sincronizar este delta.
