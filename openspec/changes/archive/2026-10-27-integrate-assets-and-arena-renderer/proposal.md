# Proposal

## Why

A fundação atual mostra somente água vetorial decorativa e não permite validar os assets, o carregamento recuperável ou o mapa antes da simulação. Este incremento entrega uma arena estática real e estabelece geometria, transformações e propriedade de recursos para a navegação seguinte, conforme GDD v0.2 §§5, 10, 11 e 13.

## What Changes

- Substituir a apresentação de fundação pelo fluxo mínimo `Main Menu → Play → Loading → Static Arena`, com `Retry`, `Main Menu` e status semântico em inglês.
- Adicionar manifesto tipado de PNGs fornecidos, mapeamento visual verificado e cache compartilhado que permite recuperar falhas, incluindo uma falha simulável documentada.
- Compor água, duas ilhas e navio player no mundo lógico 960×540; registrar Chaser, Shooter e UI verificados sem criar entidades inimigas ou controles ativos.
- Publicar geometria sólida das ilhas alinhada ao litoral visível na configuração pura, substituindo envelopes provisórios; manter proporções, coordenadas e faixas para HUD/controles em resize, portrait, landscape e DPR distinto.
- Tornar transformações mundo/tela testáveis e estender a proteção sob Strict Mode a texturas compartilhadas, inicialização parcial e descarte.
- Criar `ASSET_CREDITS.md` em inglês com procedência comprovada e lacunas de licença; atualizar documentação e validação proporcional do fluxo visual.
- Fora de escopo: simulação, movimento, colisão executável, combate, inimigos ativos, áudio, Options, ranking, persistência e publicação. Samples permanecem referências visuais, sem servir de arena achatada.

## Capabilities

### New Capabilities

- `asset-loading`: manifesto verificável, carregamento/cache compartilhado, falha recuperável e rastreabilidade dos assets.
- `arena-rendering`: composição estática do mapa e navio, enquadramento proporcional, DPR e transformações mundo/tela.

### Modified Capabilities

- `application-shell`: evoluir a tela de fundação para menu/loading/arena e recuperação acessível, preservando isolamento semântico e descarte seguro.
- `game-configuration`: promover as duas ilhas de envelopes provisórios a geometria sólida serializável, versionada e compartilhada com o renderer.

## Impact

Afeta `src/render`, `src/ui`, `src/domain/config.ts`, seus testes e documentação. PNGs individuais existentes entram no pipeline Vite sem conversão obrigatória de atlas. O mapa recebe versão nova por alterar geometria de gameplay; demais parâmetros permanecem os do GDD. Playwright terá somente suporte e E2E do fluxo atual, com lockfile atualizado se a dependência ainda ausente for adicionada. Não há API, serviço externo, nova regra de combate ou mudança em `simulation-contracts`.
