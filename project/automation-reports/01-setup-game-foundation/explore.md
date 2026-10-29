# Explore — setup-game-foundation

Status: concluído em 27/10/2026 pelo executor `/root/i01_explore`, somente leitura.

## Evidências

- OpenSpec 1.14.1 e Node 26.11.1 disponíveis com PATH local do runbook.
- `openspec.cmd list --json` e `list --specs --json`: raiz válida, listas vazias.
- Sem aplicação/package.json/lockfile/testes e sem AGENTS.md aplicável encontrado.
- Lidos GDD v0.2, configuração, contexto comum e somente incremento 01.
- Preservados automation.md e automation-state.json existentes.

## Decisões para propose

Usar React + Vite + TypeScript estrito + npm e lockfile, versões diretas fixadas.
Implementar tela mínima sem prometer partida existente e adapter Pixi imperativo
com inicialização assíncrona e cleanup seguro sob Strict Mode. Domínio/simulação
sem imports de React, Pixi, DOM, rede ou relógio global. Documentar fronteiras
domain, simulation, render, input, ui, storage e data sem serviços vazios.

Contratos: GameConfig profundamente readonly, MatchSetup com seed uint32 separada,
StepInput puro, SimulationSnapshot/eventos, CompletedMatchResult completo conforme
GDD. Copiar e congelar configuração aninhada, com versões arena-v1/balance-v1 e
unidades explícitas. Extrair todos os parâmetros do GDD; distâncias derivadas de
projéteis não são uma segunda fonte autoritativa. Geometria de ilha é proposta e
será alinhada à arte no incremento próprio. Não implementar combate, API ou telas
finais. README e ARCHITECTURE em inglês; OpenSpec em pt-BR.

## Compatibilidade investigada

Metadados npm consultados pelo executor: React/DOM 19.3.1, tipos 19.3.0,
PixiJS 8.22.0, Vite 8.3.5, plugin-react 6.1.2, Vitest 5.0.5, ESLint 10.13.0,
typescript-eslint 8.72.1, hooks 7.1.1, refresh 0.5.7. TS latest 7.0.2 não está
na faixa de typescript-eslint (>=4.8.4 <6.1.0): escolher TS 6.0.3 ou 5.9.3.
Compatibilidade executável ainda depende de npm ci/typecheck/test/build no apply.
Referências: https://pixijs.com/8.x/guides/components/application e
https://vite.dev/guide/.

## Aceite a planejar

Instalação limpa com npm ci; lint/typecheck/test/build; repetição de build e
comparação de artefatos; dev/preview; inspeção visual desktop/estreita e semântica;
montagem/desmontagem repetida sem canvas/recursos duplicados; snapshot isolado de
mutações da fonte. Falha de renderer deve ser legível e não falsificar evidência
visual. Axios/TanStack/MSW/Playwright são integrações de incrementos posteriores.

## Limitações e próximo passo

Não houve instalação, implementação ou teste de aplicação nesta fase. Licenças
dos assets ainda não comprovadas. Nenhum bloqueio para propose. Criar os
artefatos completos e validar antes de delegar apply a outro executor.
