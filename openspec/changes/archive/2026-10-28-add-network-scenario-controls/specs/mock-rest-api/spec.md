# Spec Delta

## MODIFIED Requirements

### Requirement: Inicialização resiliente e interceptação com Mock Service Worker
A interceptação HTTP das rotas `/api/*` SHALL ser provida por Mock Service Worker (MSW) em desenvolvimento, preview, build publicado e testes automatizados. A inicialização do MSW SHALL ser assíncrona e resiliente, de modo que falhas no registro não impeçam o carregamento do jogo. Os handlers do MSW SHALL integrar-se ao orquestrador de cenários de rede, aplicando as latências, falhas e comportamentos de dados definidos pelo perfil ativo.

#### Scenario: Interceptação transparente em ambiente de navegador
- **WHEN** a aplicação for executada em desenvolvimento, preview ou build de produção no navegador
- **THEN** as requisições para `/api/ranking`, `/api/players/:playerId/matches` e `/api/matches` SHALL ser interceptadas pelo Service Worker sem gerar erros de rede 404

#### Scenario: Interceptação em ambiente de testes automatizados
- **WHEN** os testes unitários ou de integração forem executados sob o runtime Node/Vitest
- **THEN** as chamadas de API disparadas pelo cliente HTTP SHALL ser interceptadas pelo MSW Node server com os mesmos contratos de resposta

#### Scenario: Falha de inicialização do mock sem bloqueio de jogabilidade
- **WHEN** o registro do Service Worker do MSW falhar ou exceder o tempo limite de inicialização
- **THEN** a aplicação SHALL inicializar a interface e permitir o fluxo de batalha ("Play") normalmente sem travar em tela de carregamento perpétua

#### Scenario: Modulação dinâmica de requisições pelo cenário ativo
- **WHEN** qualquer rota de API for interceptada pelo Service Worker ou Node server
- **THEN** o processamento da resposta SHALL delegar ao orquestrador de cenários de rede para injetar a latência, mutação de payload ou resposta de erro configurada
