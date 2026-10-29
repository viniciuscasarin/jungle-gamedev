# Proposal

## Why

O ciclo local de partidas está concluído, mas o jogador ainda precisa alterar storage para configurar a sessão. O incremento 07 oferece menu e Options acessíveis, persistência explícita e aparência coerente com os assets fornecidos, cumprindo GDD 8–11 sem antecipar integrações remotas.

## What Changes

- Acrescentar Options ao menu com Play, guia compacto, Last Result condicional e espaços identificados como indisponíveis para Ranking e Match History.
- Editar Game session time e Enemy spawn time em segundos com rascunho isolado, unidades, limites, passos e erros acessíveis; Save somente válido, Cancel descarta.
- Restaurar defaults com explicação para dados corrompidos; falha de escrita conserva formulário, edição e valores salvos anteriores sem anunciar sucesso. Resolver somente avisos de opções recuperadas, preservando avisos independentes.
- Aplicar metadados de conteúdo, âncoras, bordas e estados reais dos botões a controles React, com foco visível, teclado e touch, layout utilizável em desktop, 320px e landscape.
- Preservar snapshot imutável e resultado histórico, comprovando que Play e Play Again usam o último Save. Recursos exclusivos DOM não tornam a carga da arena dependente de novas imagens de menu.

## Capabilities

### New Capabilities

- `menu-options`: navegação local, edição validada com Save/Cancel, recuperação honesta e apresentação acessível do menu e formulário.

### Modified Capabilities

- `application-shell`: incluir Options no contrato da navegação semântica existente, preservando os cenários de arena, pausa, resultado e foco.
- `asset-loading`: explicitar catálogo dos estados de UI usados e separação dos recursos decorativos DOM frente à carga obrigatória da arena.

## Impact

Afeta `src/ui/App.tsx`, componentes/helpers locais do formulário, CSS e catálogo de assets, além de testes de formulário/storage/assets, E2E e documentação em inglês. Reutiliza OPTION_METADATA, createGameConfig/validateOptions, createLocalAdapter e preparePlay; não altera regras de configuração ou lifecycle já especificadas. Evidências serão gravadas no diretório do incremento 07, preservando 01–06.

Fora de escopo: Options em Playing/Paused, dados REST, consultas e fixtures de ranking/histórico, Axios/TanStack Query/MSW, controles de combate mobile, áudio, tuning, push e deploy. Nenhuma nova dependência de produção é necessária.
