<img src="assets/icon.svg" width="64" height="64" alt="">

# EAE1244 — guia de estudo

Material em português para estudar História Econômica Geral do Século XX e construir respostas discursivas para a prova de 19/11/2026. Prioridade: aulas 17–28 e relações entre autores.

## Estado do projeto

O caderno contém 14 resumos completos do recorte prioritário. O atlas contém oito temas com posições, relações fundamentadas, mecanismos, casos, diferenças de contexto e roteiros de resposta. A [revisão do atlas](docs/atlas-revisao.md) registra os testes e a suficiência dos oito roteiros.

O HTML final ainda não foi implementado. Permanecem pendentes a oficina de respostas, os resumos curtos das outras 17 leituras e parte da revisão das fontes anteriores. O [mapa](CAPABILITY-MAP.md) e as [tarefas](tasks/todo.md) registram o escopo e o progresso.

## Atlas

- [Guerra e mobilização](data/atlas/guerra-e-mobilizacao.json) — aula 17, verbete de Harrison.
- [Fim de Bretton Woods](data/atlas/fim-bretton-woods.json) — aulas 18–19, ouro, ajuste e política.
- [Crescimento na Era de Ouro](data/atlas/crescimento-era-de-ouro.json) — aulas 17 e 20, contexto bélico e catch-up condicionado.
- [Planejamento soviético](data/atlas/planejamento-sovietico.json) — aulas 21–22 e 25, crescimento, desaceleração e colapso.
- [Estado e industrialização](data/atlas/estado-e-industrializacao.json) — aulas 21–23 e 26, coordenação, capacidades e limites.
- [Crise da dívida e reformas](data/atlas/crise-da-divida-e-reformas.json) — aulas 21–22, 25 e 27, choque, exposição e escolhas.
- [Crises financeiras depois de 1971](data/atlas/crises-financeiras-pos-1971.json) — aulas 25 e 28, mecanismos e ganhos condicionais.
- [Capital humano e convergência](data/atlas/capital-humano-e-convergencia.json) — aulas 20, 23, 24 e 28, educação, instituições e tecnologia.

Cada `verdict_outline` propõe uma tese, argumentos favoráveis, contra-argumentos e conclusão, com referências internas às posições e relações. Esses roteiros são interpretações para estudo. As citações indicam a página física do PDF, que pode diferir da numeração impressa.

## Dados e acervo local

- `data/fontes/`: inventário e manifesto de proveniência.
- `data/caderno/`: resumos por leitura.
- `data/atlas/`: comparações e roteiros, no esquema descrito em [SPEC-atlas.md](SPEC-atlas.md).
- `.local/fontes/`: originais e extrações paginadas; arquivos locais não versionados.
- `.local/entregas/fontes-eae1244.zip`: pacote local dos 44 arquivos baixados, com índice.

A validação real exige as extrações locais apontadas pelo manifesto. Clonar o repositório não transfere esse acervo. Os testes usam fixtures sintéticas e dispensam os PDFs da bibliografia.

## Verificação

Python 3 e biblioteca padrão para os validadores; Poppler para o processamento de PDFs e os testes de fontes. Sem serviço remoto de IA em execução.

```bash
python3 scripts/fontes.py verify --manifest data/fontes/manifest.json --scope priority
python3 scripts/caderno.py validate --manifest data/fontes/manifest.json --caderno data/caderno --scope priority
python3 scripts/atlas.py validate --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas
python3 scripts/atlas.py coverage --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas

python3 -m unittest discover -s tests/fontes -p 'test_*.py' -v
python3 -m unittest discover -s tests/caderno -p 'test_*.py' -v
python3 -m unittest discover -s tests/atlas -p 'test_*.py' -v
```

O atlas retorna 0 quando os dados são válidos e todas as leituras prioritárias estão cobertas; 1 para debates inválidos ou cobertura incompleta; 2 para argumentos ou entradas ilegíveis/malformadas. `coverage` também valida os debates antes de contabilizá-los. Citações devem constar no caderno consumido e na página indicada; relações exigem evidência das duas obras.
