# release-preparation Specification

## Purpose

Define os requisitos de conformidade para a preparação e auditoria de entrega do jogo Pirate Battle 2D, abrangendo documentação operacional com instruções limpas de instalação e reprodução de falhas, catalogação e auditoria rigorosa de licenças de ativos sem presunção de licenças livres, garantia de integridade autossuficiente do pacote de produção com MSW e validação formal dos marcos da Seção 15 do GDD.

## Requirements

### Requirement: Documentação operacional e de reprodução de ambiente
O repositório SHALL fornecer documentação técnica em inglês limpo em `README.md` e `ARCHITECTURE.md` com instruções reproduzíveis de instalação (`npm ci`), desenvolvimento (`npm run dev`), empacotamento (`npm run build`), preview de produção (`npm run preview`) e testes (`npm test`, `npm run test:e2e`), detalhando contingências para execução em Windows PowerShell.

#### Scenario: Instalação e execução em ambiente Windows PowerShell
- **WHEN** um desenvolvedor executa o setup e os comandos de desenvolvimento em terminal Windows PowerShell com políticas restritas
- **THEN** a documentação orienta o uso explícito de `npm.cmd` ou configuração de ExecutionPolicy permitindo execução livre de erros

#### Scenario: Compilação e visualização de preview local
- **WHEN** os comandos de build e preview documentados são executados sequencialmente
- **THEN** o projeto compila sem erros nos verificadores de tipos estritos e o preview inicia servindo a aplicação pronta para avaliação

### Requirement: Guia operacional de cenários de rede e reprodução de falhas
O repositório SHALL documentar no `README.md` a matriz operacional completa dos 12 cenários de rede do MSW com parâmetros de consulta diretos (`?networkScenario=...`), comportamentos observáveis na interface, comandos de reset e instruções acionáveis para reprodução de falhas induzidas em assets e armazenamento local.

#### Scenario: Execução direta de cenário de rede via URL
- **WHEN** a aplicação é carregada com o parâmetro `?networkScenario=offline` ou qualquer outro cenário de rede suportado
- **THEN** o comportamento correspondente é ativado imediatamente e o usuário visualiza os estados de erro, retry ou isolamento documentados

#### Scenario: Simulação de falha de asset e corrupção de storage
- **WHEN** o avaliador injeta falha pontual de asset via query param ou simula corrupção de schema no LocalStorage
- **THEN** a aplicação aciona os mecanismos de retry ou fallback para memória documentados sem travar a interface do jogo

### Requirement: Inventário e matriz de licenças de ativos
O arquivo `ASSET_CREDITS.md` SHALL catalogar todos os arquivos de ativos do repositório e o subconjunto ativo em tempo de execução, identificando a procedência e a situação legal de cada componente e declarando formalmente que ativos de terceiros sem comprovação documental permanecem pendentes e não são presumidos como licença livre.

#### Scenario: Verificação de ativos pendentes de homologação
- **WHEN** a auditoria de licenças é consultada para os assets de imagens e sons fornecidos no pacote do desafio
- **THEN** os ativos são classificados como pendentes de comprovação documental formal pelo titular de direitos, sem presunção de licença livre

#### Scenario: Comprovação de código autoral e dependências abertas
- **WHEN** a auditoria de licenças examina as geometrias procedurais e as bibliotecas de software de terceiros em `package.json`
- **THEN** as geometrias procedurais são comprovadas como código autoral próprio e as bibliotecas de software são atestadas sob licenças MIT ou Apache-2.0

### Requirement: Integridade do pacote autossuficiente de produção
O build de produção gerado no diretório `dist/` SHALL ser completamente autossuficiente, contendo `index.html`, o worker `mockServiceWorker.js` e os bundles estáticos fingerprinted, operando de forma autônoma sem exigir chaves secretas de API, variáveis `.env` ou servidores remotos para seu funcionamento pleno.

#### Scenario: Execução autônoma com Mock Service Worker em produção
- **WHEN** o servidor de preview local serve os arquivos estáticos gerados em `dist/` sem nenhum servidor de backend externo ativo
- **THEN** a aplicação inicializa, o Service Worker intercepta com sucesso as rotas REST locais e as operações de ranking e histórico funcionam

#### Scenario: Ausência de credenciais e dependências de serviços pagos
- **WHEN** os artefatos compilados e os arquivos de configuração são inspecionados para release
- **THEN** nenhum arquivo de segredo de ambiente, token confidencial ou dependência de API externa proprietária é encontrado

### Requirement: Matriz formal de marcos de entrega
O relatório de entrega SHALL consolidar a correspondência entre os cinco marcos da Seção 15 do GDD ("Delivery sequence and estimate"), o código-fonte versionado, os artefatos de compilação e as evidências de teste, distinguindo inequivocamente itens entregues, validados e pendentes de ação externa.

#### Scenario: Auditoria dos marcos 1 a 4 e validações técnicas do marco 5
- **WHEN** a matriz de conformidade com a Seção 15 do GDD é avaliada
- **THEN** os marcos de fundação, ciclo de combate, experiência, dados resilientes, testes E2E e orçamentos de desempenho são comprovados como validados

#### Scenario: Declaração de bloqueios concretos para publicação pública
- **WHEN** a condição de saída de publicação pública em URL externa do marco 5 é inspecionada
- **THEN** o item é categorizado como pendente de destino e credenciais fornecidos pelo usuário, atestando a inexistência de bloqueios internos no código

### Requirement: Suíte automatizada de sanidade do release
A base de código SHALL disponibilizar testes automatizados que verifiquem a integridade dos arquivos gerados no diretório de distribuição `dist/`, a presença do worker do MSW e a tolerância temporal das rotinas de teste para prevenir regressões e falhas intermitentes.

#### Scenario: Execução da verificação de integridade de release
- **WHEN** a suíte de testes de sanidade do release é executada após o comando de build
- **THEN** o teste valida a presença e legibilidade de `dist/index.html` e `dist/mockServiceWorker.js`, atestando a higidez do pacote
