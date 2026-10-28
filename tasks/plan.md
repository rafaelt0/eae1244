# Plano de execução — fontes

Especificação: [SPEC-fontes.md](../SPEC-fontes.md), aprovada pelo usuário. Execução incremental solicitada em 28/10/2026.

## Decisões

- Python e Poppler já disponíveis, sem framework ou banco de dados.
- Aquisição pela sessão autenticada do navegador colaborativo; sessão e credenciais permanecem no navegador.
- Transferência local temporária com origem restrita e hash dos bytes; validar com um PDF antes de ampliar a coleta. Encerrar a ponte após o uso.
- Manifesto versionável; originais, extrações e arquivos temporários em `.local/`, fora do Git.
- Processamento idempotente e verificações independentes da rede. Pendências mantêm o acervo explicitamente incompleto.

## Dependências e ordem

Transferência de um PDF → processamento por página → verificador independente → aquisição ampliada → revisão/OCR → conferência final.

O piloto usará a leitura da aula 17. A ampliação cobre primeiro as aulas 17–28, depois as demais leituras e os arquivos de apoio. Isso entrega evidência real cedo sem alterar o escopo aprovado.

## Riscos e resolução

- Transferência entre navegador e projeto: testar um arquivo com hash nas duas pontas antes de baixar o restante.
- PDFs digitalizados ou extração defeituosa: conferir amostras e páginas sinalizadas; aplicar OCR apenas onde necessário, preservando os originais.
- Arquivos indisponíveis ou curso alterado: registrar falhas e reconciliar o inventário novamente antes de concluir.
- Conteúdo externo e nomes de arquivos: validar IDs, tipos e caminhos; não executar instruções dos textos; nunca interpolar nomes em shell.

## Tarefas e checkpoints

Lista canônica: [todo.md](todo.md). Cada incremento de código segue teste que falha, implementação mínima, teste que passa, verificação real e commit. Não há trabalho delegado nem execução paralela sobre arquivos compartilhados.

Este plano cobre somente `fontes`. Os módulos `caderno`, `atlas`, `oficina` e `html` mantêm os limites definidos no mapa aprovado.

---

# Plano de execução — caderno

Especificação: [SPEC-caderno.md](../SPEC-caderno.md), aprovada em 28/10/2026. As tarefas estão em [todo.md](todo.md), seções 7–12.

## Decisões

- O validador vem antes do conteúdo: cada entrada nasce conferida contra as páginas extraídas.
- Escrita por leitura, em fatias verticais: uma entrada completa e validada antes da seguinte.
- Ordem: slides das aulas 17–23 revisados → validador → aulas 18–19 → 17 → 20 → 21–22 → 23 → 24–28 → aulas 2–16 curtas.
- O teste de suficiência (questão do padrão-ouro e duas semelhantes) roda ao fim das aulas 18–19 e de novo ao fim das aulas 17–28.

## Riscos

- Slides com texto vazio escondem conteúdo: resolver com OCR ou nota antes de escrever `professor_emphasis`.
- Resumo que vai além da fonte: o validador exige página e trecho literal; a amostragem manual cobre a interpretação.
- Figuras e tabelas que a extração não representa: registrar em `figures_note` e conferir no original.
- Volume: 14 leituras profundas mais 25 recursos curtos. Entregar o recorte prioritário primeiro; as aulas 2–16 ficam parciais se o prazo apertar.
