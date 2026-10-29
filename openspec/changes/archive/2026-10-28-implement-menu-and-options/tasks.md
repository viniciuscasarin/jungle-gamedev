# Tasks

## 1. Rascunho, validação e confirmação

- [x] 1.1 Criar helper puro de strings em segundos reutilizando OPTION_METADATA e validação de domínio, sem parseInt/arredondamento/clamp; comprovar limites, passos, frações válidas, sessão fracionária, spawn inválido, vazio, whitespace, texto, não finitos e limites excedidos em Vitest.
- [x] 1.2 Implementar formulário Options com rascunho isolado, labels, unidades/limites/passo, ajuda/erros associados, aria-invalid e Save disabled com guarda de submit; comprovar que entradas inválidas e Enter não chegam ao writer em testes proporcionais de helper/fluxo.
- [x] 1.3 Integrar Save por createLocalAdapter somente após validação e sucesso confirmado, Cancel/Escape sem escrita e reabertura por leitura defensiva; testar corrupção de JSON/versão/formato/valores, validação antes do writer e erro de escrita preservando valor anterior, com testes de storage/integração.
- [x] 1.4 Documentar em inglês em ARCHITECTURE.md o contrato draft→validação→Save, unidades e independência do snapshot; conferir que o documento corresponde ao helper e ao adapter implementados e que os testes afetados passam.

## 2. Menu, navegação e recuperação acessível

- [x] 2.1 Direcionar outputs de Playwright e capturas para project/automation-reports/07-implement-menu-and-options antes de executar novos E2E; conferir configuração e diretórios produzidos sem sobrescrever evidências01–06.
- [x] 2.2 Acrescentar Options ao menu, preservar Play/guia/Last Result condicional e apresentar reservas honestas de Ranking/Match History sem consultas ou ARIA tabs incompletas; verificar DOM e ausência de requests remotos em E2E de menu com/sem resultado.
- [x] 2.3 Implementar foco de entrada/retorno e navegação local por Tab/Shift+Tab/Enter/Space/Escape e touch, sem Options em Loading/Playing/Paused nem listeners de combate no formulário; verificar foco e ações com Playwright dev/preview e eventos reais de teclado/toque.
- [x] 2.4 Separar aviso corrente de opções dos avisos de identidade/resultado e conservar formulário/draft/erro em Save negado; verificar por E2E corrupção→defaults sem escrita→Save→Play sem aviso antigo, preservação de avisos independentes e falha→retry/Cancel com conteúdo salvo intacto.
- [x] 2.5 Adicionar E2E Save-refresh, Cancel/Escape-reabrir e Save inválido e atualizar README em inglês com reprodução e diretório real das evidências; executar e conferir os casos introduzidos.

## 3. Assets, estados e layout

- [x] 3.1 Completar catálogo/metadados de UI usados e separar novos recursos exclusivos DOM da carga obrigatória Pixi; testar dimensões, retângulos/bordas/âncoras lógicos 1× frente a atlas default/retina e conjunto de carga da arena, preservando cache e Retry existentes.
- [x] 3.2 Aplicar painel flexível por border-image/nine-slice, backdrop decorativo, proporções e label rect de botões; implementar primary normal/hover/pressed/disabled e secondary normal/pressed/foco sem herdar estados primários; verificar estilos/estado por E2E e capturas legíveis com foco e erros.
- [x] 3.3 Garantir layout desktop 1280×900, 320×568 e landscape 844×390 com safe areas e rolagem vertical quando necessária; inspecionar capturas de menu com/sem Last Result e Options válido/inválido/aviso/falha, sem corte, sobreposição, distorção ou overflow horizontal, e registrar conclusão visual em evidência07.
- [x] 3.4 Verificar fallback de imagem exclusiva DOM indisponível mantendo texto/controles legíveis e Play funcional por E2E; atualizar ASSET_CREDITS.md em inglês com uso efetivo, metadados e transformações reais sem inventar licença, conferindo catálogo e resultado do teste.

## 4. Integração com configuração capturada e replay

- [x] 4.1 Comprovar em E2E dev/preview Save pela UI→Play com configuração salva capturada, alteração externa de storage sem mutar run e ausência de Options na sessão ativa; usar diagnósticos somente de leitura e registrar setup observado.
- [x] 4.2 Concluir partida pelo relógio controlado da simulação, voltar ao menu, salvar novas opções pela UI, consultar Last Result e acionar Play Again; comprovar novo matchId/opções atuais e resultado histórico intacto, além de Cancel/Save falho não substituírem o último Save.
- [x] 4.3 Atualizar README/ARCHITECTURE em inglês com demonstração do snapshot/replay e limites de escopo reais; executar regressão afetada de lifecycle, falha/Retry e teardown após mudanças de navegação/catalogação e registrar resultados sem enfraquecer verificações anteriores.

## 5. Verificação integrada e handoff

- [x] 5.1 Executar npm.cmd run lint, npm.cmd run typecheck, npm.cmd test e npm.cmd run build antes de npm.cmd run e2e contra dev e preview; corrigir falhas do escopo e registrar comandos, exit codes e evidências07, preservando os diretórios01–06.
- [x] 5.2 Executar openspec.cmd validate implement-menu-and-options --strict e openspec.cmd validate --all --strict; conferir cobertura dos critérios07 e escrever relatório apply com resultados e limitações reais, sem marcar tarefa concluída com evidência ausente.

## Workflow follow-up

- Outra fase verify audita código, artefatos, testes e capturas, corrige divergências no escopo e registra verificação independente antes de archive.
- Após verify satisfatório, sincronizar as três delta specs, preservar Purposes e cenários existentes, conferir main specs e arquivar pela CLI; registrar o resultado na fase archive.













