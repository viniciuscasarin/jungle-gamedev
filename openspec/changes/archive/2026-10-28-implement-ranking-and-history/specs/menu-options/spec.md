# Spec Delta

## MODIFIED Requirements

### Requirement: Menu local com ações honestas

O menu SHALL oferecer Play, Options, guia compacto de controles, Last Result quando disponível e container com abas ativas e acessíveis para Ranking e Match History. O carregamento, paginação ou eventual falha nas abas SHALL operar de forma isolada e nunca bloquear as ações locais de Play ou Options.

#### Scenario: Menu sem e com resultado
- **WHEN** o usuário abre o menu sem resultado concluído ou retorna após uma conclusão
- **THEN** título, Play, Options e guia são legíveis e acionáveis por teclado e toque
- **AND** Last Result aparece somente quando há resultado recuperado ou mantido na visita e continua abrindo o resultado histórico

#### Scenario: Integrações futuras
- **WHEN** o menu apresenta Ranking e Match History
- **THEN** as seções são organizadas em abas operacionais e acessíveis alimentadas por consultas reais de dados
- **AND** Play e Options permanecem disponíveis sem dependência de rede ou bloqueio por estado de carregamento de dados
