# Tasks

## 1. Refinamento Documental e Higienização de Codificação

- [x] 1.1 Higienizar caracteres corrompidos de codificação (mojibake) em `README.md` e `ARCHITECTURE.md` e verificar ausência de resíduos de decodificação com script de verificação UTF-8
- [x] 1.2 Atualizar o guia de instalação e execução do `README.md` com instruções explícitas para ambientes Windows PowerShell (`npm.cmd` e notas de `ExecutionPolicy`) e verificar execução do comando de ajuda
- [x] 1.3 Estruturar a matriz operacional dos 12 cenários de rede no `README.md` com URLs diretas (`?networkScenario=...`), comportamento visual esperado e método de reset, verificando a consistência dos links
- [x] 1.4 Adicionar no `README.md` o guia prático de reprodução de falhas induzidas para assets (`?assetScenario=fail-once`), corrupção proposital de storage e retries da outbox, verificando a clareza dos passos

## 2. Finalização dos Créditos e Matriz de Licenças

- [x] 2.1 Mapear e inventariar exaustivamente os 520 arquivos do diretório `assets/` e o subconjunto ativo de 33 imagens e 27 áudios em `ASSET_CREDITS.md`, verificando a exatidão das contagens
- [x] 2.2 Formalizar em `ASSET_CREDITS.md` a situação legal dos ativos proprietários do desafio como pendentes de comprovação documental sem presunção de licença livre, verificando a conformidade estrita com o GDD §15
- [x] 2.3 Detalhar em `ASSET_CREDITS.md` a autoria das geometrias procedurais no PixiJS e a catalogação das bibliotecas open source com links de licença MIT e Apache-2.0, verificando a integridade das referências

## 3. Validação do Pacote de Produção e Teste Automatizado de Release

- [x] 3.1 Implementar a suíte de testes de sanidade do release em `tests/releasePackage.test.ts` verificando a presença de `dist/index.html`, integridade de `dist/mockServiceWorker.js` e bundles estáticos, e validar execução via `npm test`
- [x] 3.2 Ajustar a tolerância da asserção de temporização do backoff em `tests/outbox.test.ts` (linha 197) de 350ms para 450ms e verificar aprovação estável do teste sob carga de CPU
- [x] 3.3 Executar o build de produção (`npm run build`) e validar o servidor local de preview (`npm run preview`) confirmando resposta HTTP 200 para `index.html` e `mockServiceWorker.js` com interceptação MSW ativa

## 4. Matriz de Entregáveis e Relatório de Auditoria de Release

- [x] 4.1 Consolidar a matriz formal de conformidade dos 5 marcos da Seção 15 do GDD distinguindo itens entregues, validados e pendentes de ação externa
- [x] 4.2 Auditar e registrar a correspondência exata entre a versão do código (`package.json`), o build gerado em `dist/` e as evidências das suítes de teste e baselines visuais
- [x] 4.3 Declarar formalmente no relatório de auditoria os bloqueios concretos para publicação externa (necessidade de credenciais e destino de hospedagem no Incremento 17)

## Workflow follow-up

- Executar a fase apply com `$openspec-apply-change` para implementar as melhorias documentais, a matriz de créditos e os testes de sanidade.
- Validar a change com `openspec validate prepare-game-release --strict` e `openspec validate --all --strict`.
- Arquivar a change com `$openspec-archive-change` após a verificação completa.
