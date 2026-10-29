# Tarefas — fontes

## 1. Validar o primeiro download
- [x] Transferir a leitura da aula 17 e comparar SHA-256 no navegador e no projeto.
- [x] Conferir o PDF com `pdfinfo` e abrir uma página renderizada.
- Resultado: Mark Harrison, 26 páginas, 211.784 bytes; hash coincidente e primeira página conferida. A transferência leva menos tempo que o download remoto; os downloads seguintes são acompanhados em segundo plano.
- Verificação: hash coincidente, PDF legível, nenhuma credencial persistida.
- Dependências: nenhuma.
- Arquivos: `.gitignore`, inventário inicial e arquivos locais do piloto.

## 2. Processar um PDF por página
- [x] Implementar `process` com preservação do original, metadados e extração paginada.
- [x] Rejeitar HTML de login, bytes truncados e caminhos fora do projeto; manter páginas sem texto como pendência.
- Verificação: `python3 -m unittest discover -s tests/fontes -p 'test_*.py' -v`; piloto real com número de páginas conferido.
- Dependências: 1.
- Arquivos: `scripts/fontes.py`, `tests/fontes/test_fontes.py`, fixtures sintéticas geradas pelo teste.

## 3. Verificar cobertura e reexecuções
- [x] Implementar `verify` para integridade, páginas e recortes total/prioritário, com códigos de saída corretos.
- [x] Testar reexecução, versões anteriores, nomes repetidos, ausência de arquivos e seleção vazia.
- Verificação: suíte de testes e adulteração controlada em diretório temporário.
- Dependências: 2.
- Arquivos: `scripts/fontes.py`, `tests/fontes/test_fontes.py`.

## Checkpoint do piloto
- [x] Piloto completo no disco; testes passam; mudanças em commits separados.

## 4. Ampliar o acervo
- [x] Inventariar todos os recursos e aulas, com classificação e instruções de leitura.
- [x] Baixar e processar primeiro as leituras das aulas 17–28 e depois as demais e os arquivos de apoio.
- Verificação: contagens e IDs confrontados com o curso; hashes e estados no manifesto.
- Dependências: 3.
- Arquivos: `data/fontes/inventory.json`, `data/fontes/manifest.json`, acervo local.

## 5. Revisar a extração
- [x] Aulas 17–28 (14 leituras): início, meio e fim conferidos; `verify --scope priority` passa. Demais recursos: revisão pendente.
- [ ] Resolver OCR, formatos sem suporte e páginas vazias; registrar notas de revisão.
- Verificação: originais e extrações conferidos; `verify --scope priority` e `verify --scope all`.
- Dependências: 4.
- Arquivos: manifesto, extrações locais, relatório de revisão.

## 6. Concluir e documentar
- [ ] Reconciliar o inventário com a página atual do curso e registrar cobertura final.
- [ ] Atualizar README, mapa e tarefas com resultado real e pendências, se houver.
- Verificação: suíte completa, verificador local, Git sem mudanças pendentes e ponte de transferência encerrada.
- Dependências: 5.
- Arquivos: `README.md`, `CAPABILITY-MAP.md`, `tasks/todo.md`, relatório de fontes.

---

# Tarefas — caderno

## 7. Revisar os slides das aulas 17–23 (pré-requisito, módulo fontes)
- [x] Resolver os slides sem texto (OCR ou nota de revisão) em `6604666`, `6610411`, `6613285`, `6619031` e `6622877`; marcar como `reviewed`.
- Resultado: 25 slides sem texto eram tabelas e gráficos das leituras; conferidos na renderização e registrados com legenda. A extração não captura os números dessas imagens.
- Verificação: nenhuma página sinalizada sem resolução; `python3 scripts/fontes.py verify --manifest data/fontes/manifest.json --scope priority` continua passando.
- Arquivos: manifesto, extrações locais.

## 8. Validador do caderno
- [x] Teste que falha, depois `scripts/caderno.py` com `validate` e `coverage`: esquema, páginas, trechos literais, afirmações sem fonte, escopos e códigos de saída.
- Verificação: `python3 -m unittest discover -s tests/caderno -p 'test_*.py' -v`; falha controlada com trecho adulterado.
- Dependências: nenhuma. Arquivos: `scripts/caderno.py`, `tests/caderno/`.

## 9. Aulas 18–19 (piloto)
- [x] Entradas `deep` de Eichengreen cap. 2, Frieden (fim de Bretton Woods) e Meissner cap. 12, com `professor_emphasis` dos slides.
- [x] Teste de suficiência com a questão do padrão-ouro. Resultado: as aulas 18–19 cobrem o ouro em Bretton Woods, não na Grande Depressão (aulas 11–14). A questão de exemplo já foi cobrada pelo professor e serve só como modelo de estilo; seguimos a ordem original.
- Verificação: `validate` passa nessas entradas; esqueleto da resposta montado só com o caderno. Conferência manual da tese e do argumento.
- Dependências: 7, 8.

## Checkpoint do piloto
- [ ] Você revisa as três entradas e o formato antes de ampliar.

## 10. Aulas 17, 20, 21–23
- [x] Harrison (17); texto sobre a Europa (20); Allen e Eichengreen (21–22); Rodrik (23), cada um com `professor_emphasis` quando houver slides.
- Verificação: `validate` por entrada; conferência manual por amostragem.
- Dependências: 9.

## 11. Aulas 24–28
- [x] Li (24); Frieden cap. 16 e Meissner cap. 13 (25); Bertola e Ocampo (26 e 27); Crafts (28).
- Resultado: `validate --scope priority` passa, 14 de 14 leituras `complete`. Teste de suficiência: duas questões novas montáveis só com o caderno (crise da dívida latino-americana: choque externo ou falha interna, Bértola/Ocampo, Meissner e Frieden; URSS e Leste Asiático: Allen, Rodrik e Li).
- Verificação: `validate --scope priority` passa; segundo teste de suficiência com duas questões novas.
- Dependências: 10.

## 12. Aulas 2–16 (contexto curto)
- [ ] Entradas `short`, `partial`, para os demais recursos; pendências explícitas na cobertura.
- Verificação: `coverage` separa prioritárias e demais.
- Dependências: 11. Pode ficar parcial.

---

# Tarefas — atlas

Especificação, plano e tarefas aprovados pelo usuário em 28/10/2026. A tarefa 12 permanece pendente e não bloqueia este recorte prioritário.

## 13. Validar debates e calcular cobertura
- [x] Implementar `scripts/atlas.py validate` e `coverage`, reaproveitando a conferência de referências do caderno, com JSON por tema e códigos de saída 0/1/2.
- [x] Validar campos, enums, IDs únicos, uma posição por obra, pares de relações, matriz, referências internas do roteiro e exceção explícita para verbete.
- [x] Exigir obras com entrada `complete`, citações pertencentes às obras corretas e cobertura de todas as leituras prioritárias.
- Verificação: `python3 -m unittest discover -s tests/atlas -p 'test_*.py' -v`; testes de falha com citação ausente, página errada, fonte de terceiro, entrada parcial, relações incompletas e diretório sem debates. Fixtures sintéticas, sem PDFs.
- Dependências: 11. Arquivos: `scripts/atlas.py`, `tests/atlas/test_atlas.py` (escopo pequeno).

## 14. Piloto — fim de Bretton Woods
- [x] Escrever as posições de Eichengreen, Frieden e Meissner, relações fundamentadas, matriz de mecanismos, casos e diferenças de contexto.
- [x] Montar roteiro que avalie a tese sobre ouro e Triffin, confrontando-a com custos políticos e inviabilidade do ajuste, com conclusão marcada como interpretação.
- Verificação: executar os dois comandos do atlas da especificação; aceitar apenas pendências de cobertura das leituras ainda não escritas. Conferir manualmente as referências de uma convergência e uma divergência e registrar o teste de suficiência.
- Dependências: 13. Arquivos: `data/atlas/fim-bretton-woods.json`, `tasks/todo.md` (escopo pequeno).

## Checkpoint do piloto do atlas
- [x] Nenhum erro estrutural no piloto; leituras descobertas explicitadas no relatório.
- [x] Resposta sobre desenho, política e ajuste montável só com o piloto e o caderno.

- Resultado do piloto: nenhuma referência ou estrutura inválida; 3 de 14 leituras cobertas, 11 ainda pendentes. Roteiro suficiente: Triffin cria a tensão, as finanças transmitem a perda de confiança e a recusa do ajuste decide o desfecho. A diferença Eichengreen–Meissner é de primazia causal; a aproximação Frieden–Meissner é a resistência ao ajuste. Conferidas as referências das relações `peso-do-ouro` e `ajuste-e-politica`; revisão feita pelo agente, não presumida como revisão do usuário.

## 15. Guerra e crescimento europeu
- [ ] Escrever `guerra-e-mobilizacao` como verbete de Harrison, sem comparação fictícia entre autores.
- [ ] Escrever `crescimento-era-de-ouro`, distinguindo o argumento de Crafts/Toniolo do contexto de mobilização de Harrison.
- Verificação: validação dos arquivos presentes sem erro estrutural; roteiro de resposta por tema; contexto não apresentado como divergência.
- Dependências: 14. Arquivos: dois JSON em `data/atlas/`, `tasks/todo.md` (escopo médio).

## 16. Planejamento central e coordenação estatal
- [ ] Escrever `planejamento-sovietico`, com Allen, Eichengreen e Frieden: sucesso inicial, desaceleração e colapso distinguidos.
- [ ] Escrever `estado-e-industrializacao`, com Rodrik, Bértola/Ocampo e Allen: condições, resultados e limites da coordenação, incluindo as realizações da ISI.
- Verificação: validação sem novos erros; conferir contraste Allen–Eichengreen e qualificação da premissa de fracasso latino-americano; um roteiro por tema.
- Dependências: 15. Arquivos: dois JSON em `data/atlas/`, `tasks/todo.md` (escopo médio).

## Checkpoint intermediário do atlas
- [ ] Conferir uma relação `converge`, uma `diverge` e uma `context`, com evidência de ambas as obras.
- [ ] Diferenças de país, período e método registradas onde limitam as comparações.

## 17. Dívida e crises depois de 1971
- [ ] Escrever `crise-da-divida-e-reformas`, preservando choque externo, vulnerabilidades internas e diferenças entre reformas latino-americanas e transição pós-socialista.
- [ ] Escrever `crises-financeiras-pos-1971`, distinguindo mecanismos das crises e limites dos benefícios da liberalização, com Meissner, Frieden e Crafts.
- Verificação: validação sem novos erros; um roteiro por tema e conferência de que sínteses regionais não viraram afirmações universais.
- Dependências: 16. Arquivos: dois JSON em `data/atlas/`, `tasks/todo.md` (escopo médio).

## 18. Capital humano e convergência
- [ ] Escrever `capital-humano-e-convergencia`, com Li et al., Crafts/Toniolo, Crafts e Rodrik.
- [ ] Distinguir correlação, mecanismo causal e condições institucionais; preservar as ressalvas das projeções chinesas.
- Verificação: `validate` e `coverage` com código 0, oito temas e 14 leituras prioritárias cobertas; roteiro de resposta suficiente para avaliar a tese.
- Dependências: 17. Arquivos: `data/atlas/capital-humano-e-convergencia.json`, `tasks/todo.md` (escopo pequeno).

## 19. Conferência final do atlas
- [ ] Rever os oito roteiros usando só atlas e caderno, documentando a suficiência e limites; revisão do usuário não será presumida.
- [ ] Atualizar README, mapa, plano e tarefas com comandos, cobertura real e pendências dos módulos seguintes.
- [ ] Executar as suítes de fontes, caderno e atlas e as validações reais dos recortes prioritários; conferir o diff e registrar os incrementos em commits.
- Verificação: comandos da especificação e testes dos três módulos; fontes e caderno preservados; nenhum erro omitido do relatório.
- Dependências: 18. Arquivos: `README.md`, `CAPABILITY-MAP.md`, `tasks/plan.md`, `tasks/todo.md` (escopo médio).
