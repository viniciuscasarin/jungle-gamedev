# Spec Delta

## MODIFIED Requirements

### Requirement: Resultado local legível e recuperável

Result SHALL apresentar score final, duração ativa, Time expired ou Ship destroyed, estado de entrega na outbox (Recording…, Recorded ou Pending — Retry) com persistência local em Last Result, Play Again e Main Menu. O menu SHALL oferecer Last Result quando houver resultado concluído disponível. Abrir Last Result SHALL apresentar os dados históricos imutáveis e seu status de entrega atual sem iniciar simulação.

#### Scenario: Exibição do fim e histórico local
- **WHEN** a partida conclui e o usuário retorna ao menu e abre Last Result
- **THEN** o mesmo resultado completo é exibido, com score, duração e motivo conservados
- **AND** nenhum loop de simulação ou novo registro é iniciado ao consultar o resultado

#### Scenario: Status de gravação real
- **WHEN** a partida conclui e inicia a entrega remota ou sofre falha
- **THEN** Result informa honestamente o estado de entrega via outbox com Recording…, Recorded ou Pending — Retry
- **AND** a falha de rede conserva o resultado e mantém Play Again e Main Menu disponíveis com opção de retentativa
