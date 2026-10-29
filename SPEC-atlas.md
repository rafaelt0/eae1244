# Especificação: atlas do Guia EAE1244

Módulo: `atlas`, conforme o [mapa de capacidades](CAPABILITY-MAP.md). Depende de `caderno`.

Status: **aprovada pelo usuário em 28/10/2026**, com os oito temas propostos, Harrison como verbete de uma leitura e Bretton Woods como piloto. Implementação ainda não iniciada; plano e tarefas em revisão.

## Objetivo

Relacionar os autores das aulas 17–28 por **debates**: o que cada um afirma sobre a mesma pergunta, onde convergem, onde divergem e por que, com evidência rastreável. O atlas responde à dificuldade de relacionar textos, que é o que a P2 dissertativa cobra (avaliar uma tese, comparar casos, classificar mecanismos).

Uso pessoal, em português, para a P2 de 19/11/2026. A questão de exemplo do professor (padrão-ouro e Grande Depressão) já foi cobrada e serve só como modelo de estilo.

## Premissas

1. Cada debate nasce de uma pergunta que várias leituras respondem. Ele se apoia somente nas entradas `complete` do `caderno`; não relê os PDFs por conta própria.
2. O escopo inicial é o recorte prioritário (aulas 17–28). Debates que dependem das aulas 2–16, como o ouro na Grande Depressão (aulas 11–14), ficam para depois, quando essas leituras forem revisadas e resumidas.
3. O atlas não inventa relações: toda convergência ou divergência cita trechos das duas leituras.
4. A classificação dos mecanismos (causa, transmissor, economia política) é interpretação nossa, como no `caderno`, e é marcada como tal.
5. Português, com termos técnicos originais quando ajudam.

## Debates aprovados

| Id | Pergunta em disputa | Leituras | Aulas |
| --- | --- | --- | --- |
| `fim-bretton-woods` | O fim de Bretton Woods foi um defeito de desenho (o ouro e o dilema de Triffin), um problema político (autonomia doméstica contra câmbio) ou a inviabilidade do ajuste? | Eichengreen, Frieden cap. 15, Meissner cap. 12 | 18–19 |
| `crescimento-era-de-ouro` | A Era de Ouro foi catch-up automático ou resultado de incentivos e instituições? | Crafts e Toniolo, Harrison (mobilização e reconstrução como pano de fundo) | 17, 20 |
| `planejamento-sovietico` | O que explica o sucesso inicial e o esgotamento do planejamento central? | Allen, Eichengreen cap. 10, Frieden cap. 16 | 21–22, 25 |
| `estado-e-industrializacao` | O Estado como coordenador do investimento: por que funcionou na Coreia e em Taiwan e não na ISI latino-americana nem na URSS? | Rodrik, Bértola e Ocampo (aula 26), Allen | 21–23, 26 |
| `crise-da-divida-e-reformas` | A crise da dívida foi choque externo ou falha interna, e o que as reformas de mercado entregaram? | Bértola e Ocampo (aula 27), Meissner cap. 13, Frieden cap. 16, Eichengreen cap. 10 | 21–22, 25–27 |
| `crises-financeiras-pos-1971` | Por que os fluxos de capital voltaram a gerar crises depois de Bretton Woods, e o que a liberalização trouxe ao crescimento? | Meissner cap. 13, Frieden cap. 16, Crafts | 25, 28 |
| `capital-humano-e-convergencia` | Capital humano, instituições e geografia: o que sustenta ou limita a convergência de renda? | Li et al., Crafts e Toniolo, Crafts, Rodrik | 20, 23, 24, 28 |
| `guerra-e-mobilizacao` | A vitória aliada foi uma questão de produção ou de intensidade de mobilização? | Harrison | 17 |

O último tem uma só leitura principal e entra como **verbete** (posição do autor mais o que os slides destacam), sem comparação entre autores, a não ser que apareça outro texto.

## Saída: `data/atlas/<debate_id>.json`

`schema_version: 1`, `snake_case`, UTF-8.

| Campo | Conteúdo |
| --- | --- |
| `debate_id`, `title`, `lessons` | Identificação. |
| `question` | A pergunta em disputa. |
| `thesis_statement` | Uma afirmação avaliável, no estilo de prova ("X foi a causa principal de Y"). |
| `works` | Leituras do debate, por `resource_id`, todas com entrada `complete` no `caderno`. |
| `positions` | Uma por obra: `resource_id`, `stance` (`supports`, `rejects`, `qualifies` ou `other` em relação à `thesis_statement`), `summary` e `refs`. |
| `relations` | Pares de obras: `between` (dois `resource_id`), `type` (`converge`, `diverge` ou `context`), `text` e `refs` das duas leituras. |
| `mechanism_matrix` | Linhas por mecanismo (ex.: dilema de Triffin, inflação americana, controles de capital): `kind` atribuído por obra (`cause`, `transmitter`, `political_economy`, `other` ou `absent`) e `refs`. |
| `cases` | Países ou episódios que aparecem em mais de uma obra, com a leitura de cada uma e `refs`. |
| `context_differences` | Diferenças de período, país, método ou dados que explicam parte da divergência, com `refs`. |
| `verdict_outline` | Esqueleto de resposta: tese, argumentos a favor, contra-argumentos e conclusão possível, marcado como `interpretation`. Sem `refs` próprios, mas cada ponto aponta para `positions` ou `relations`. |

`refs` segue o formato do `caderno`: `{file_id, pdf_page, quote}`, com trecho literal de até 25 palavras presente na página citada.

## Comandos

```bash
# Validar todos os debates
python3 scripts/atlas.py validate --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas

# Relatório de cobertura: debates, obras por debate, leituras prioritárias que ainda não aparecem em nenhum debate
python3 scripts/atlas.py coverage --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas

# Testes
python3 -m unittest discover -s tests/atlas -p 'test_*.py' -v
```

Códigos de saída: 0 sucesso; 1 debate inválido ou leitura prioritária fora de qualquer debate; 2 argumentos ou entradas inválidos.

## Estrutura

```text
SPEC-atlas.md
scripts/atlas.py        validação e cobertura (reaproveita a conferência de refs de scripts/caderno.py)
tests/atlas/            testes e fixtures sintéticas
data/atlas/             um JSON por debate
```

## Estratégia de testes e verificação

- **Automática:**
  - o esquema e os campos obrigatórios estão presentes;
  - toda obra citada existe no manifesto e tem entrada `complete` no `caderno`;
  - todo `quote` aparece na página citada;
  - toda `position`, `relation` e linha da matriz tem `refs`, e as `relations` citam as duas obras do par;
  - cada debate tem pelo menos duas obras (exceto verbetes marcados), uma `position` por obra e pelo menos uma `relation` do tipo `diverge` ou `converge`;
  - toda leitura prioritária aparece em pelo menos um debate.
- **Manual:** você confere por amostragem se a convergência ou divergência apontada existe nos textos e se a `thesis_statement` é uma pergunta plausível de prova.
- **Teste de suficiência:** para cada debate, escrever o esqueleto de resposta a uma questão no estilo do professor usando só o atlas e o caderno.
- Fixtures sintéticas pequenas; sem PDFs da bibliografia no repositório.

## Limites

### Sempre
- Citar página e trecho literal das duas leituras em cada relação.
- Marcar classificação de mecanismos e `verdict_outline` como interpretação.
- Registrar divergências entre textos e slides, e diferenças de período ou dados, em `context_differences`.

### Consultar antes
- Incluir debates que dependem das aulas 2–16 ou de conteúdo externo.
- Mudar o esquema de forma incompatível.
- Atribuir a um autor uma posição sobre uma pergunta que ele não discute: nesse caso registrar `absent`, não inferir.

### Nunca
- Afirmar que dois autores divergem sem trecho de ambos.
- Reescrever o `caderno` ou as extrações de `fontes`.
- Preencher lacunas de OCR com conteúdo presumido.

## Critérios de sucesso

1. Cada leitura das aulas 17–28 aparece em pelo menos um debate, e `validate` passa.
2. Cada debate com mais de uma obra tem posições, ao menos uma relação fundamentada, matriz de mecanismos e esqueleto de resposta.
3. O debate `fim-bretton-woods` permite montar a resposta "defeito de desenho, problema político ou inviabilidade do ajuste?" sem abrir os PDFs.
4. Nenhuma `ref` aponta para página inexistente nem para trecho ausente.
5. O relatório de cobertura mostra debates, obras por debate e leituras prioritárias fora de qualquer debate.

## Questões abertas

Nenhuma sobre o escopo: a aprovação mantém os oito temas separados, inclui `guerra-e-mobilizacao` como verbete e começa por `fim-bretton-woods`, seguindo depois a ordem das aulas.
