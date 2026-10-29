# Proposal

## Why

O repositório contém o GDD v0.2, assets e OpenSpec, mas nenhuma aplicação executável, configuração de build ou contratos de jogo. Uma base verificável permite implementar os próximos incrementos sem misturar regras com React/PixiJS nem perder a rastreabilidade dos valores propostos no GDD.

## What Changes

- Criar aplicação React, PixiJS e TypeScript estrito com Vite, npm, versões diretas fixadas, lockfile e scripts de desenvolvimento, preview, build, lint, typecheck e testes.
- Entregar tela inicial mínima, responsiva e semanticamente acessível, com uma prévia decorativa do renderer e tratamento legível de falha; comprovar montagem e desmontagem seguras sob React Strict Mode.
- Centralizar configuração tipada, limites e valores iniciais propostos no GDD, unidades, versões de mapa/balanceamento e captura profundamente imutável; manter a seed separada.
- Definir contratos puros de input por passo, snapshots, eventos e resultado completo imutável, sem executar movimento, combate ou ciclo de partida.
- Documentar estrutura, comandos, decisões, isolamento das regras e fronteiras futuras de dados, armazenamento e testes em README e ARCHITECTURE, em inglês.
- Validar instalação limpa, qualidade, isolamento da configuração, execução mínima e repetibilidade dos artefatos de build.

Ficam fora do escopo combate, navegação, carregamento dos assets de jogo, mapa final, telas finais, persistência, requisições HTTP e integrações Axios/TanStack Query/MSW/Playwright. As fronteiras dessas integrações serão documentadas agora e implementadas nos incrementos próprios.

## Capabilities

### New Capabilities

- `application-shell`: inicialização acessível da aplicação e ciclo de vida seguro da integração React/PixiJS.
- `game-configuration`: configuração central tipada, validação, unidades, versões e snapshots isolados com seed independente.
- `simulation-contracts`: contratos independentes de plataforma para entrada, estado observável, eventos e resultado de uma partida.

### Modified Capabilities

Nenhuma: o inventário de specs principais está vazio.

## Impact

Serão adicionados fontes, testes, configuração de ferramentas, `package.json`, `package-lock.json`, `.gitignore`, `README.md` e `ARCHITECTURE.md`. React será responsável pelo DOM e PixiJS pelo canvas; domínio e contratos não terão dependências de DOM, frameworks, rede ou relógio global. Os assets e documentos existentes serão preservados. Não haverá API, alteração de infraestrutura, push ou publicação.
