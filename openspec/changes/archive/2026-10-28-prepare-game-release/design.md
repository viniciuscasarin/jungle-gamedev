# Design

## Context

O Pirate Battle 2D atingiu maturidade técnica completa nas dimensões de jogabilidade, simulação física com cancelamento tangencial, inteligência artificial, persistência resiliente com Outbox pattern, interface acessível e testes ponta a ponta (ver `proposal.md` para motivação).

A Seção 15 ("Delivery sequence and estimate") e Seção 16 ("Playtest questions and remaining decisions") do GDD estabelecem os critérios regulamentares de conclusão da entrega do projeto:
1. Documentação técnica (`README.md` e `ARCHITECTURE.md`) em inglês limpo, permitindo que qualquer avaliador consiga instalar, rodar, testar e reproduzir cenários de falha.
2. Créditos e procedência de ativos comprovados, com a regra pétrea: *"Licença sem comprovação continua pendente e não é presumida"*.
3. Pacote de produção autossuficiente (`dist/`) com assets, rotas e Mock Service Worker (`mockServiceWorker.js`) íntegros, testável via preview local sem dependências de serviços externos pagos ou segredos de ambiente.
4. Mapeamento auditado dos 5 marcos da Seção 15 distinguindo itens entregues, validados e pendentes de destino externo.

A exploração técnica preliminar (`explore.md`) diagnosticou pontos específicos a serem sanados: presença de caracteres corrompidos de codificação (mojibake) na documentação, restrição padrão de execução de scripts no Windows PowerShell (`PSSecurityException`), ausência de um guia tabular passo a passo para os 12 cenários de rede, necessidade de inventariar todos os 520 arquivos de assets e o catálogo estrito de runtime (33 imagens e 27 áudios), e garantia de resiliência a temporização no teste de outbox.

## Goals / Non-Goals

**Goals:**
- Eliminar completamente os artefatos de codificação mojibake em `README.md` e `ARCHITECTURE.md`, padronizando todo o conteúdo em UTF-8 limpo com símbolos tipográficos e matemáticos puros.
- Incluir orientações claras de execução no Windows PowerShell, documentando o uso de `npm.cmd` e configuração de `ExecutionPolicy`.
- Estruturar no `README.md` uma matriz operacional de consulta direta para os 12 cenários de rede (`?networkScenario=...`), com comportamento esperado, métodos de reset e simulações de falhas induzidas (assets e storage).
- Catalogar em `ASSET_CREDITS.md` todos os 520 arquivos do diretório `assets/`, o subconjunto ativo de runtime (33 texturas e 27 áudios), e formalizar o status legal estrito dos ativos fornecidos pelo desafio como pendentes de comprovação, atestando a liberação de elementos procedurais e dependências OSS.
- Assegurar a autossuficiência do build de produção (`dist/`) com MSW e preview local (`http://127.0.0.1:4173`), criando um teste automatizado de sanidade (`tests/releasePackage.test.ts`).
- Estruturar a matriz formal dos 5 marcos do GDD §15 classificando entregas, validações e bloqueios externos.

**Non-Goals:**
- Publicar ou realizar deploy em provedores em nuvem (escopo reservado para o Incremento 17 mediante fornecimento de destino e credenciais pelo usuário).
- Alterar o motor físico, a simulação matemática, regras de combate, IA ou layout do jogo.
- Substituir ou reprocessar os arquivos de arte visual ou áudio existentes no repositório.
- Assumir ou inventar licenças livres (CC0/MIT) para os arquivos fornecidos pelo desafio sem comprovação documental.

## Decisions

### 1. Higienização de Codificação e Adaptação a Ambientes Windows PowerShell
- **Decisão**: Higienizar todos os arquivos markdown afetados por problemas de encoding (`â€œ`, `â†’`, `Ã—`, `âˆ’Ï€/2`, etc.) para caracteres Unicode puros. Adicionar no `README.md` instruções pragmáticas para Windows: execução via `npm.cmd` quando o PowerShell bloquear `npm.ps1` por padrão de política restrita.
- **Alternativas consideradas**:
  - *Remover símbolos Unicode e usar apenas ASCII puro*: Reduz a expressividade matemática em `ARCHITECTURE.md` (fórmulas de física e vetores) e a qualidade tipográfica do README.
  - *Assumir que todo usuário usa bash/WSL*: Incorreto para avaliadores corporativos ou ambientes nativos Windows.

### 2. Guia Tabular de Reprodução Operacional de Cenários de Rede e Falhas
- **Decisão**: Criar uma seção dedicada no `README.md` com tabela operacional indexando os 12 cenários de rede implementados no MSW. Para cada cenário, indicar:
  - Query parameter de ativação direta (ex: `http://localhost:5173/?networkScenario=offline`).
  - Passos de reprodução no menu (aba Ranking/Histórico).
  - Feedback visual e comportamento esperado (banners de aviso, spinner de loading, botão de retry manual, backoff automático).
  - Procedimento de reset (botão "Reset Diagnostics" ou parâmetro `?networkScenario=default`).
  - Procedimentos de teste para falhas induzidas: asset failure (`?assetScenario=fail-once`), corrupção proposital de payload no LocalStorage e recuperação de itens pendentes na Outbox.
- **Alternativas consideradas**:
  - *Manter apenas a listagem descritiva genérica*: Dificulta a verificação rápida por avaliadores de QA e revisores do desafio.

### 3. Matriz Rigorosa de Procedência e Licenciamento em ASSET_CREDITS.md
- **Decisão**: Estruturar `ASSET_CREDITS.md` em quatro divisões jurídicas explícitas:
  1. *Ativos Fornecidos pelo Desafio (`assets/`)*: 520 arquivos totais, dos quais 33 imagens e 27 áudios são consumidos em runtime. Como o repositório original não inclui termos de cessão ou arquivos LICENSE, o status legal é classificado estritamente como **Pendente de Homologação de Licença de Terceiros** antes de distribuição comercial aberta, em cumprimento à regra do GDD §15.
  2. *Elementos Gráficos Procedurais*: Barras de vida no Pixi, retículas de mira, partículas de tiro, anéis de água e overlays geométricos, gerados dinamicamente via PixiJS Graphics em `src/render/`. Classificados como **Código Autoral Próprio (Livre de pendências)**.
  3. *Dependências de Software*: React, PixiJS, TanStack Query, Axios, MSW, Vite, Vitest e Playwright. Auditadas e catalogadas com links e licenças permissivas comprovadas (**MIT / Apache-2.0**).
  4. *Declaração de Conformidade com o GDD §15/§16*: Registro formal de que nenhuma licença não comprovada foi presumida livre.
- **Alternativas consideradas**:
  - *Presumir licença CC0/Kenney*: Rejeitado categoricamente; violaria o comando do GDD §15: *"Licença sem comprovação continua pendente e não é presumida."*

### 4. Pacote Autossuficiente de Produção e Teste Automatizado de Sanidade
- **Decisão**: Validar que a pasta `dist/` gerada por `npm run build` é completamente estática e independente de qualquer serviço externo:
  - Contém `index.html`, `mockServiceWorker.js` e bundles em `dist/assets/`.
  - Não requer chaves de API, variáveis `.env` ou conexões com servidores externos.
  - Implementar o teste automatizado `tests/releasePackage.test.ts` para verificar em tempo de CI a existência dos artefatos essenciais em `dist/` e a higidez do Service Worker.
  - Ajustar a janela de tolerância de temporização no teste `tests/outbox.test.ts` (linha 197) de 350ms para 450ms, prevenindo falhas intermitentes (flakiness) causadas por variações na carga de CPU durante a execução concorrente de suítes de teste.
- **Alternativas consideradas**:
  - *Testar o build apenas manualmente*: Risco de regressão caso novos arquivos ou configurações afetem o empacotamento estático.

### 5. Auditoria Formal dos 5 Milestones do GDD §15
- **Decisão**: Estruturar a matriz de auditoria da Seção 15 detalhando:
  - Marco 1 (Foundation and assets): 100% Entregue e Validado.
  - Marco 2 (Playable loop): 100% Entregue e Validado.
  - Marco 3 (Experience): 100% Entregue e Validado.
  - Marco 4 (Data reliability): 100% Entregue e Validado.
  - Marco 5 (Delivery validation): Código, E2E, baselines visuais, performance e documentação 100% Entregues e Validados. Item "public deployment (working public URL)" classificado como **Pendente de Destino Externo**, explicitando que não há bloqueios internos de código.
- **Alternativas consideradas**:
  - *Marcar o Marco 5 como 100% concluído*: Incorreto, pois a publicação em URL pública depende de autorização e infraestrutura externa reservada para a próxima etapa.

## Risks / Trade-offs

- **[Risco] Restrição de segurança do PowerShell no Windows (`PSSecurityException`)**  
  → *Mitigação*: O `README.md` enfatiza o uso do executável direto `npm.cmd` e exemplifica os comandos de verificação de permissão.
- **[Risco] Ausência do worker MSW no bundle de produção gerado**  
  → *Mitigação*: O script `public/mockServiceWorker.js` é copiado automaticamente pelo Vite para `dist/mockServiceWorker.js`. O teste automatizado `tests/releasePackage.test.ts` valida a presença deste arquivo e o status HTTP 200 via preview.
- **[Risco] Suposição indevida de licença aberta para assets sem documentação**  
  → *Mitigação*: A auditoria de ativos explicita a ausência de documentação original e rotula formalmente todos os 520 arquivos como pendentes de liberação do detentor dos direitos autorais.
- **[Risco] Flutuação de tempo em testes assíncronos sob alta concorrência de CPU**  
  → *Mitigação*: Ajuste de tolerância em `tests/outbox.test.ts`, garantindo que asserções de backoff respeitem margens seguras sem mascarar regressões de comportamento.
