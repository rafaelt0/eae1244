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
- [ ] Conferir início, meio e fim de cada arquivo e todas as páginas sinalizadas.
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
