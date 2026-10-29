# Especificação: oficina de respostas do Guia EAE1244

Módulo: `oficina`, conforme o [mapa de capacidades](CAPABILITY-MAP.md). Depende de `caderno` e `atlas`.

Status: **aprovada pelo usuário em 29/10/2026**, com solicitação de execução incremental. Implementação em andamento.

## Objetivo

Transformar o conhecimento das aulas 17–28 em prática de escrita discursiva: formular uma tese, relacionar autores, explicar mecanismos, comparar casos e concluir com as ressalvas necessárias. O usuário estuda principalmente pelo futuro HTML e prepara-se para a prova de 19/11/2026.

A oficina fornece exercícios e conteúdo de apoio para esse HTML. A interface de escrita, a revelação dos roteiros e o armazenamento local das tentativas pertencem ao módulo `html`.

## Premissas aprovadas

1. Produzir **16 questões originais de treino**, uma guiada e uma autônoma para cada um dos oito temas do atlas. As questões não são previsões da prova nem atribuídas ao professor.
2. O exemplo sobre padrão-ouro e Grande Depressão calibra o estilo: avaliar uma afirmação, comparar trajetórias e distinguir causa, transmissão e economia política. O conteúdo desse exemplo não será usado para preencher lacunas das aulas anteriores.
3. Usar somente os oito temas válidos do atlas e as 14 entradas completas do caderno prioritário. Nenhuma nova leitura, pesquisa externa ou releitura independente dos PDFs.
4. O treino guiado oferece perguntas de planejamento. O autônomo traz uma nova formulação sobre o mesmo tema, com apoio de resposta disponível separadamente nos dados. Não basta duplicar o enunciado trocando palavras.
5. Não impor tempo, extensão ou sistema de notas sem conhecer as regras da prova. A autoavaliação usa critérios explícitos, sem correção automática por IA.
6. No verbete de Harrison, comparar países e medidas dentro de uma leitura. Nas comparações entre períodos ou países distintos, explicitar o limite da aproximação. Em particular, Harrison não recebe uma teoria da Era de Ouro.

## Conteúdo dos exercícios

Cada questão exige pelo menos duas operações entre avaliar uma tese, comparar autores, comparar casos e classificar mecanismos. O conjunto cobre as quatro operações; nem toda questão precisa ter a mesma estrutura.

Os oito pares acompanham os temas existentes: mobilização de guerra; fim de Bretton Woods; Era de Ouro; planejamento soviético; Estado e industrialização; dívida e reformas; crises financeiras depois de 1971; capital humano e convergência.

Exemplo concreto do par piloto, sujeito à conferência de conteúdo na implementação:

- **Guiada:** “O fim de Bretton Woods foi uma consequência inevitável da conversibilidade do dólar em ouro. Avalie a afirmação com Eichengreen, Frieden e Meissner, distinguindo fragilidade do desenho, transmissão da crise e custos políticos do ajuste.”
- **Autônoma:** “Por que a cooperação monetária e as medidas de defesa do dólar não preservaram Bretton Woods? Compare as explicações dos autores e use um episódio para sustentar sua conclusão.”

Cada exercício contém:

- Enunciado que possa ser entendido sem ler o roteiro, com autores e recorte identificáveis.
- Perguntas de planejamento apenas no modo guiado: qual tese defender, que relação entre autores usar, qual caso escolher e que ressalva preservar.
- Roteiro com tese possível, argumentos, contrapontos e conclusão. Formulações alternativas fundamentadas são admitidas.
- **Um parágrafo de exemplo**, em português, que mostre como ligar afirmação, autor, mecanismo, evidência e ressalva. É um fragmento comentado de resposta, sem substituir uma redação inteira.
- Pelo menos dois erros frequentes específicos, acompanhados de uma orientação de revisão. Exemplos: tratar correlação como causalidade, inventar oposição entre autores ou confundir desaceleração com colapso.
- Critérios para o aluno revisar a própria resposta: atendimento ao enunciado; tese; fidelidade às leituras; encadeamento causal e comparação; uso de casos/evidências; ressalvas e conclusão.

Roteiros, parágrafos e orientações são interpretações de estudo. Toda afirmação histórica ou atribuição a autor nesses conteúdos tem apoio identificável no atlas ou no caderno. Orientações gerais de escrita não precisam de uma citação histórica.

## Entradas e contrato com os módulos anteriores

- `data/fontes/manifest.json`, necessário aos validadores já existentes.
- `data/caderno/<resource_id>.json`, com `status: complete` e referências válidas.
- `data/atlas/<debate_id>.json`, validado pelo módulo atlas.

Não modificar esquemas, resumos, relações ou extrações desses módulos. Ao encontrar uma insuficiência, registrá-la em vez de completar o exercício com informação presumida.

As bases da oficina apontam para itens existentes, sem duplicar as citações literais. Formato:

```json
{
  "module": "atlas",
  "entry_id": "fim-bretton-woods",
  "section": "relations",
  "item": "peso-do-ouro"
}
```

Alvos permitidos:

- Atlas: `positions`, com `item` igual ao `resource_id`; `relations`, com `item` igual ao ID da relação.
- Caderno: `argument`, `mechanisms`, `cases`, `concepts`, `evidence` ou `limits`, com `entry_id` igual ao `resource_id` e `item` igual ao índice inteiro do item, começando em zero.

Cada alvo deve existir e pertencer ao recorte declarado no exercício. Uma relação do atlas envolve as duas obras do par. Uma referência ao caderno envolve sua própria obra. O relatório de cobertura conta obras efetivamente usadas nas bases do roteiro ou do parágrafo, não apenas listadas nos metadados.

## Saída: `data/oficina/<exercise_id>.json`

JSON UTF-8, `schema_version: 1`, campos em `snake_case`:

- `exercise_id`: identificador único em kebab-case, igual ao nome do arquivo.
- `debate_id`: um dos oito IDs do atlas, tema principal do exercício.
- `mode`: `guided` ou `independent`; um de cada por tema.
- `title`, `prompt`: título e enunciado em português.
- `lessons`, `works`: aulas das obras efetivamente usadas e seus `resource_id`; somente o recorte prioritário.
- `skills`: lista sem repetição de `assess_thesis`, `compare_authors`, `compare_cases`, `classify_mechanisms`.
- `planning_prompts`: lista de perguntas no modo guiado; lista vazia no autônomo.
- `answer_outline`: `interpretation: true` e listas `thesis`, `arguments_for`, `counterarguments`, `conclusion`; cada item contém `text` e `basis`, uma lista de alvos no formato acima.
- `worked_paragraph`: `interpretation: true`, `text`, `basis` e `commentary`, explicando como o parágrafo organiza o argumento.
- `common_mistakes`: lista de objetos com `mistake`, `revision` e `basis` para sustentar a correção de conteúdo.
- `self_review`: seis objetos com `criterion` e `question`. Critérios: `task`, `thesis`, `source_fidelity`, `reasoning`, `evidence`, `qualification`. As perguntas são adaptadas ao exercício e não atribuem pontuação.

Todo exercício tem pelo menos uma base de seu tema principal. Questões que usam `compare_authors` precisam mobilizar substantivamente pelo menos duas obras; quantidade de obras não comprova automaticamente uma comparação adequada. Harrison admite uma obra quando a operação é comparar casos.

## Tecnologia, estrutura e estilo

Python 3 e biblioteca padrão, como os validadores existentes. Reutilizar a validação dos módulos anteriores; não gerar exercícios automaticamente a partir de modelos de frase.

```text
SPEC-oficina.md
scripts/oficina.py        validação de exercícios e relatório de cobertura
tests/oficina/            testes e fixtures sintéticas
data/oficina/             16 exercícios em JSON
docs/oficina-revisao.md   suficiência, amostragem e limites da entrega
```

Funções pequenas, `pathlib`, mensagens e relatórios de CLI em português. Exemplo de estilo esperado:

```python
def validate_exercise(exercise: dict, atlas: dict, caderno: dict) -> list[str]:
    errors = []
    if exercise.get("mode") not in {"guided", "independent"}:
        errors.append("mode: esperado guided ou independent.")
    return errors
```

O exemplo ilustra estilo; não constitui implementação do módulo. Conteúdo textual em português, com nomes de autores, conceitos e títulos coerentes com o caderno.

## Comandos previstos

```bash
python3 scripts/oficina.py validate --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas --oficina data/oficina
python3 scripts/oficina.py coverage --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas --oficina data/oficina
python3 -m unittest discover -s tests/oficina -p 'test_*.py' -v
```

Ambos os comandos inspecionam os exercícios antes de contabilizá-los. O relatório mostra questões válidas/inválidas, modos por tema, habilidades cobertas e obras prioritárias usadas ou ausentes. Código 0: dados válidos e cobertura completa; 1: exercício inválido ou cobertura incompleta; 2: argumentos ou entradas ilegíveis/malformadas. Durante os incrementos, cobertura incompleta continua explícita.

Não há build de interface neste módulo. Os testes usam fixtures sintéticas; a validação real depende das extrações locais já exigidas pelos validadores de fontes, caderno e atlas.

## Estratégia de testes e verificação

### Automática

- Conferir esquema, campos obrigatórios, enums, IDs duplicados e correspondência entre ID e arquivo.
- Exigir exatamente um exercício de cada modo por tema para cobertura completa; rejeitar cobertura calculada a partir de exercícios inválidos.
- Conferir alvos inexistentes, índices fora de faixa, referências a obras não declaradas e dependências inválidas ou incompletas.
- Conferir a marcação de interpretação e as bases de cada parte do roteiro, do parágrafo e dos erros frequentes.
- Exigir perguntas de planejamento no modo guiado e sua ausência no autônomo; conferir os seis critérios de autoavaliação.
- Exigir cobertura dos oito temas, das 14 leituras e das quatro habilidades. Metadados sem uso substantivo nas bases não bastam para cobrir uma leitura.
- Provar falhas com fixtures: referência adulterada, obra de fora do recorte, falsa cobertura, exercício duplicado e exercício autônomo sem contraponto.

### Revisão de conteúdo

Verificar se cada enunciado é respondível com o material declarado, se os dois exercícios do tema pedem raciocínios distintos e se o parágrafo faz uma relação concreta entre ideias. Conferir por amostragem fidelidade aos autores, adequação dos casos e rastreabilidade até a fonte por intermédio do caderno ou atlas.

Para cada questão, montar uma resposta em tópicos usando somente as bases indicadas e registrar eventuais lacunas. Essa revisão é feita pelo agente e não será apresentada como aprovação do usuário. O validador não julga qualidade da escrita nem prova a interpretação histórica.

## Limites

### Sempre

- Separar enunciado, apoio de planejamento, roteiro e critérios de revisão, permitindo ao HTML revelar o apoio depois da tentativa.
- Preservar autoria, diferenças de período e os limites registrados nas fontes consumidas.
- Permitir conclusões alternativas sustentadas, evitando apresentar um roteiro como resposta única.
- Manter explícita qualquer cobertura incompleta.

### Consultar antes

- Acrescentar leituras das aulas 2–16 ou conteúdo externo.
- Mudar o escopo de 16 questões ou alterar de forma incompatível os contratos existentes.
- Incluir notas, correção automática, serviços externos ou publicação.

### Nunca

- Prever questões da prova ou atribuir os exercícios ao professor.
- Usar a presença de palavras-chave como prova de domínio do conteúdo.
- Inventar divergências, casos, números ou causalidade para completar um roteiro.
- Reescrever caderno, atlas ou extrações para fazer a oficina passar na validação.

## Critérios de sucesso

1. Há 16 questões válidas: dois exercícios por tema, um de cada modo.
2. As 14 leituras prioritárias aparecem nas bases de roteiros ou parágrafos, e as quatro habilidades estão cobertas.
3. Cada exercício apresenta roteiro completo, parágrafo de exemplo, dois ou mais erros frequentes e seis perguntas de autoavaliação.
4. Nenhuma base aponta para item ausente, obra indevida ou dependência inválida.
5. As 16 respostas em tópicos podem ser construídas somente com as bases declaradas; o relatório registra a conferência e seus limites.
6. O conteúdo pode ser consumido pelo HTML sem exigir rede, IA em execução ou um novo serviço.

## Decisões aprovadas

16 questões em dois modos, com um parágrafo de exemplo por exercício. A confirmação do usuário acompanhou o pedido de implementação incremental. Detalhes de interface permanecem no módulo `html`.
