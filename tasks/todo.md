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
