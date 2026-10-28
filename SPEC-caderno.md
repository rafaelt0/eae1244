# Especificação: caderno do Guia EAE1244

Módulo: `caderno`, conforme o [mapa de capacidades](CAPABILITY-MAP.md). Depende de `fontes`.

Status: aprovada pelo usuário em 28/10/2026, incluindo a revisão prévia dos slides das aulas 17–23, a manutenção do mapa e a ordem de escrita iniciando pelas aulas 18–19. Nada foi implementado.

## Objetivo

Produzir, para cada leitura do curso, um resumo estruturado e rastreável que permita ao aluno estudar sem reabrir o PDF e reconstruir o argumento de cada autor em uma resposta discursiva.

Uso pessoal, em português, para a P2 de 19/11/2026. A P2 é dissertativa e cobra sobretudo a segunda parte do curso (aulas 17–28). Exemplo de questão do professor, que calibra o que o caderno precisa sustentar:

> O padrão-ouro foi a causa principal da propagação da Grande Depressão. Avalie essa afirmação comparando a trajetória de países que abandonaram o padrão-ouro cedo e tarde, e discuta se o ouro operou como causa, como transmissor ou como um problema de economia política.

Essa questão pede avaliar uma tese, comparar casos e classificar mecanismos. Por isso o caderno registra, de cada texto, a tese, o mecanismo causal, os casos e a evidência, e não apenas o assunto.

## Premissas

1. Os resumos usam somente as leituras e os slides extraídos pelo módulo `fontes`. Conhecimento externo não entra no texto do caderno.
2. As aulas 17–28 recebem profundidade total; as aulas 2–16 recebem resumo curto de contexto (`depth: short`).
3. Os slides das aulas 17–23 são fonte de **ênfase do professor** e entram no caderno como seção própria, subordinada à leitura da mesma aula.
4. Recursos ainda não revisados em `fontes` produzem entradas marcadas `partial`. Elas aparecem no HTML com esse aviso.
5. O texto do caderno é escrito em português; termos técnicos e títulos originais permanecem no idioma da fonte quando ajudam a estudar.

## Entradas

- `data/fontes/manifest.json` e as páginas em `.local/fontes/paginas/<file_id>.json`.
- Condição para uma entrada `complete`: o arquivo está `ready` e `reviewed` em `fontes`. Para `partial`, basta `ready`.
- Referência usada em todo o módulo: `resource_id` + `file_id` + `pdf_page`.

## Saída: `data/caderno/<resource_id>.json`

`schema_version: 1`, `snake_case`, UTF-8.

| Campo | Conteúdo |
| --- | --- |
| `resource_id`, `file_id`, `lessons` | Origem e aula(s). |
| `authors`, `title`, `year` | Obras e autores. Um PDF com mais de uma obra gera uma entrada por obra, cada uma com `pdf_pages: [início, fim]`. |
| `depth` | `deep` ou `short`. |
| `status` | `complete` ou `partial`. |
| `thesis` | Tese central em uma ou duas frases. |
| `question` | A pergunta que o autor responde. |
| `argument` | Passos encadeados do argumento. Cada passo tem `claim` e `refs`. |
| `mechanisms` | Mecanismos causais. Cada um tem `kind` (`cause`, `transmitter`, `political_economy` ou `other`), descrição e `refs`. |
| `cases` | Países ou episódios usados, com período, resultado e `refs`. |
| `concepts` | Termos-chave com definição curta e `refs`. |
| `evidence` | Dados e fatos citados, com `refs`. |
| `limits` | Limitações, pressupostos e objeções possíveis. |
| `professor_emphasis` | Só para aulas com slides: pontos destacados nos slides, com `refs`. |
| `figures_note` | Figuras e tabelas que a extração não representa, com a página, para consulta no original. |

`refs` é uma lista de `{file_id, pdf_page, quote}`. `quote` é um trecho literal curto (até 25 palavras) que deve aparecer na página citada.

Resumo, tese e argumento são paráfrases. Citação literal só em `quote`.

## Comandos

```bash
# Validar todas as entradas do caderno
python3 scripts/caderno.py validate --manifest data/fontes/manifest.json --caderno data/caderno --scope all

# Validar só as aulas 17–28
python3 scripts/caderno.py validate --manifest data/fontes/manifest.json --caderno data/caderno --scope priority

# Relatório de cobertura: leituras com entrada, completas, parciais e ausentes
python3 scripts/caderno.py coverage --manifest data/fontes/manifest.json --caderno data/caderno

# Testes
python3 -m unittest discover -s tests/caderno -p 'test_*.py' -v
```

Códigos de saída: 0 sucesso; 1 entrada ausente, parcial ou inválida no escopo; 2 argumentos ou entradas inválidos.

## Estrutura

```text
SPEC-caderno.md
scripts/caderno.py       validação e cobertura
tests/caderno/           testes e fixtures sintéticas
data/caderno/            uma entrada JSON por recurso
```

## Estilo

Python como em `scripts/fontes.py`: biblioteca padrão, `pathlib`, mensagens de CLI em português. O conteúdo dos JSONs é escrito à mão ou por agentes e conferido pelo validador; o validador não gera texto.

## Estratégia de testes e verificação

- **Automática (validador):**
  - o esquema e os campos obrigatórios estão presentes;
  - todo `file_id` e `pdf_page` citado existe no manifesto e nas páginas;
  - todo `quote` aparece na página citada, depois de normalizar espaço e hifenização de quebra de linha;
  - toda afirmação de `argument`, `mechanisms` e `cases` tem pelo menos uma `ref`;
  - as entradas `deep` têm todos os campos preenchidos e as `short` têm pelo menos `thesis` e `refs`;
  - toda leitura das aulas 17–28 tem entrada.
- **Manual (por amostragem, por leitura):** o aluno ou a revisão confere se a tese e o argumento representam o texto e se nenhuma afirmação vai além do que a fonte diz.
- **Teste de suficiência:** para as aulas 17–23, tentar responder à questão do padrão-ouro e a outras duas no mesmo estilo usando só o caderno. Lacunas viram correções nas entradas.
- Fixtures sintéticas pequenas; sem PDFs completos da bibliografia no repositório.

## Limites

### Sempre
- Citar página e trecho literal para cada afirmação.
- Marcar `partial` quando a fonte não foi totalmente revisada, e `figures_note` quando figuras ou tabelas carregam o argumento.
- Distinguir o que o autor afirma do que o resumo infere.

### Consultar antes
- Mudar o esquema de forma incompatível.
- Incluir conteúdo externo às leituras, como contexto histórico de outras fontes.
- Dividir uma obra em várias entradas de modo diferente do previsto.

### Nunca
- Atribuir a um autor uma tese que o trecho citado não sustenta.
- Preencher lacunas de OCR ou páginas ilegíveis com conteúdo presumido.
- Alterar os originais ou as extrações de `fontes`.
- Copiar trechos longos do texto original como se fossem resumo.

## Critérios de sucesso

1. As 14 leituras das aulas 17–28 têm entrada `complete` e `deep`, e `validate --scope priority` passa.
2. As leituras com slides nas aulas 17–23 têm `professor_emphasis`.
3. As aulas 2–16 têm entrada `short` marcada `partial`, ou aparecem como pendência na cobertura.
4. Nenhuma `ref` aponta para página inexistente nem para trecho ausente da página.
5. Com o caderno, é possível montar o esqueleto de resposta da questão do padrão-ouro, com tese, autores, casos e mecanismos, sem abrir os PDFs.
6. O relatório de cobertura mostra, separadamente, leituras prioritárias e demais.

## Pendências e decisões que dependem de você

1. **Revisão dos slides das aulas 17–23 em `fontes`.** É pré-requisito de `professor_emphasis`. Os slides com texto vazio precisam de OCR ou nota de revisão.
2. **Ajuste do mapa de capacidades.** O mapa aprovado diz que o `caderno` produz "resumos por texto e aula". Esta especificação acrescenta mecanismos e casos por texto, e `professor_emphasis`. Proponho manter o mapa como está e registrar a ampliação aqui. Em compensação, a organização por **debates** (como a questão do padrão-ouro) fica no `atlas`, e o modo treino no `oficina` e no `html`.
3. **Ordem de escrita.** Proponho começar pelas aulas 18–19 (Eichengreen, Frieden, Meissner), por responderem diretamente à questão de exemplo, e só depois seguir a ordem das aulas.
