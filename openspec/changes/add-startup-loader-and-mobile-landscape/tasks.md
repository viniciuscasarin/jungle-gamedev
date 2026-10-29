# Tasks

## 1. Preparação compartilhada de recursos

- [x] 1.1 Definir o conjunto deduplicado de recursos usados, incluindo logo, imagens DOM, texturas e áudio, conciliando os URLs do catálogo com CSS e imagens reais; verificar com teste que nenhum recurso utilizado fica fora da preparação e arquivos sem uso não entram na contagem.
- [x] 1.2 Acrescentar progresso por recurso ao cache de texturas e criar a preparação de imagens DOM com carregamento/decodificação, conservando leases e ownership existentes; verificar testes de consumidores concorrentes, cache quente e primeiro Play sem novo carregamento de textura.
- [x] 1.3 Separar a transferência antecipada de áudio da criação/desbloqueio do contexto e compartilhar dados com a reprodução; verificar testes de ausência de som antes do gesto, mute, alternativa silenciosa e primeiro efeito sem nova transferência do arquivo.
- [x] 1.4 Criar o coordenador inicial com conjunto estável, progresso real, prontidão final e Retry de trabalho faltante; verificar testes de conclusões fora de ordem, deduplicação, sucessos parciais e progresso abaixo de 100 enquanto a preparação não está pronta.
- [x] 1.5 Implementar limite de 30 segundos por tentativa de recurso e isolar publicações de gerações antigas, liberando recursos e inscrições com segurança; verificar falha visual recuperável, timeout silencioso de áudio, Retry após timeout e conclusão tardia sem substituir a tentativa atual ou destruir textura compartilhada em uso.
- [x] 1.6 Atualizar a documentação de recursos em `ARCHITECTURE.md` e os créditos do logo em `ASSET_CREDITS.md`, registrando somente procedência verificável; verificar que a documentação descreve progresso por quantidade, política de falha visual e áudio e propriedade do cache conforme os testes.

## 2. Apresentação inicial antes do menu

- [x] 2.1 Adicionar cobertura estática e estilos críticos em `index.html`, usando o logo fornecido e URLs compatíveis com o build, e integrá-la ao bootstrap em `src/main.tsx`; verificar em E2E com módulos/mocks atrasados que o fundo inicial é preto e o menu parcial nunca aparece.
- [x] 2.2 Criar a apresentação React do carregamento com logo proporcional, contorno branco sólido de 2 CSS px, preenchimento branco e progressbar semântico, transferindo a cobertura somente após commit; verificar por E2E os estados inicial/parcial/completo, somente uma apresentação acessível ativa e menu liberado apenas após prontidão.
- [x] 2.3 Implementar as frases de pirata em inglês a cada três segundos com espaço reservado e descarte do temporizador; verificar com relógio controlado três frases diferentes, ausência de repetição consecutiva, layout estável e conclusão rápida sem espera artificial ou anúncios contínuos.
- [x] 2.4 Integrar erro inicial e Retry com CSS independente de imagens, incluindo falha do logo e erro fatal de bootstrap legível; verificar E2E com imagem DOM e textura indisponíveis e recuperação sem refresh, sem revelar interface incompleta ou marcar progresso como sucesso.
- [x] 2.5 Registrar no `README.md` o fluxo de preparação inicial e como reproduzir espera e recuperação, preservando o cenário existente de falha pós-Play com cache quente; verificar os passos documentados e guardar evidências visuais de loader, progresso parcial e erro em desktop e mobile.

## 3. Landscape mobile e pausa coordenada

- [x] 3.1 Criar o adaptador de orientação por ponteiro primário coarse e viewport efetivo, com descarte de listeners e reavaliação em retorno de página; verificar testes de landscape, portrait, viewport quadrado, desktop fine estreito e desktop com suporte adicional a toque.
- [x] 3.2 Implementar solicitação de landscape a partir de interação explícita, tratando fullscreen condicional, ausência e recusa das APIs sem repetição automática; verificar testes dos caminhos permitido/recusado/indisponível e saída de fullscreen, mantendo rotação física como alternativa funcional.
- [x] 3.3 Integrar a proteção opaca ao shell, ao loader, ao erro e aos diálogos, com conteúdo abaixo indisponível e foco ativo único; verificar E2E de Retry em portrait, safe areas, alvos de 48×48 CSS px, teclado e preservação do rascunho de Options em rotações repetidas.
- [x] 3.4 Coordenar entrada em portrait com pausa, limpeza de capturas/comandos, auto-sail Off e suspensão de loops sonoros; verificar por E2E a preservação de matchId, posição, saúde, score, tempo e cooldowns com contatos mantidos e retorno a landscape em Paused até Resume explícito.
- [x] 3.5 Bloquear início/Resume sob proteção, incluindo Escape e conclusão tardia da inicialização gráfica, sem desmontar a partida; verificar teste com preparação retardada que nenhum passo ativo ocorre em portrait e que retorno atualiza o viewport antes de aceitar input.
- [x] 3.6 Atualizar no `README.md` e em `ARCHITECTURE.md` a política landscape, classificação de mobile, alternativa sem bloqueio e requisitos de retomada; verificar correspondência com os casos de compatibilidade e limites observados nas APIs.

## 4. Integração e regressões do fluxo completo

- [x] 4.1 Adaptar configuração/helpers Playwright e expectativas que pressupõem jogo mobile em portrait, preservando testes dedicados à proteção em 390×844 e fluxos jogáveis em 844×390 e 568×320; verificar que testes de menu, Options, resultado, arena e snapshots afetados continuam exercitando o projeto mobile em vez de serem desabilitados.
- [x] 4.2 Executar as verificações de integração com `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`, usando o runtime de referência; verificar sucesso e corrigir falhas relacionadas à mudança sem alterar regras de gameplay.
- [x] 4.3 Executar E2E relevante em dev e preview, cobrindo cache frio/quente, falha/Retry inicial, falha gráfica pós-Play e rotações repetidas com diálogos; verificar ausência de menu parcial, rejeições não tratadas, comandos presos, canvas/loops extras e regressões nos fluxos existentes.
- [x] 4.4 Inspecionar capturas de loader, erro, proteção portrait, menu e batalha landscape, incluindo safe areas e reduced-motion, atualizando somente snapshots afetados; verificar contraste preto/branco, proporção do logo, texto legível e ausência de recorte ou sobreposição.
- [x] 4.5 Registrar em relatório de validação os navegadores e dispositivos efetivamente verificados, com comportamento de orientação, fullscreen e áudio; verificar em dispositivo físico quando disponível e, se indisponível, registrar essa limitação e distinguir evidência emulada de bloqueio físico real, sem alegar suporte universal.
