# Mapa de capacidades — Guia EAE1244

Status: mapa aprovado pelo usuário em 28/10/2026. A especificação de `fontes` está em revisão; implementação ainda não iniciada.

Direção aprovada: [caderno por aula + atlas de debates + oficina de respostas](docs/ideas/guia-eae1244.md).

| ID do módulo | Responsabilidade | Depende de | Especificação prevista após aprovação |
| --- | --- | --- | --- |
| `fontes` | Inventariar e baixar as leituras; preservar os originais e registrar origem, integridade e texto extraído com localização. | — | [SPEC-fontes.md](SPEC-fontes.md), em revisão |
| `caderno` | Produzir resumos por texto e aula, com referências às fontes e maior profundidade nas aulas 17–28. | `fontes` | `SPEC-caderno.md` |
| `atlas` | Relacionar autores e textos por debates, convergências, divergências e contexto, com evidências rastreáveis. | `caderno` | `SPEC-atlas.md` |
| `oficina` | Criar questões discursivas de treino, roteiros de resposta e critérios para revisar a própria resposta. | `caderno`, `atlas` | `SPEC-oficina.md` |
| `html` | Integrar o conteúdo em um HTML elegante e acessível, com busca, navegação por aula, respostas expansíveis e links aos originais. | `fontes`, `caderno`, `atlas`, `oficina` | `SPEC-html.md` |

Ordem de construção: `fontes` → `caderno` → `atlas` → `oficina` → `html`.

## Limites dos módulos

- `fontes` registra o que foi efetivamente obtido e permite verificar a proveniência; não produz interpretações dos textos.
- `caderno` fornece o conteúdo explicativo de cada leitura. `atlas` e `oficina` referenciam esse conteúdo sem alterar os originais.
- `atlas` produz relações fundamentadas. `oficina` usa essas relações para propor exercícios e caminhos de resposta.
- `html` apresenta os conteúdos aprovados; a interface não substitui nem inventa fontes, resumos ou relações.
- As dependências indicam consumo de dados. Não exigem aplicações, serviços ou pacotes separados.

## Premissas aprovadas com o mapa

- Uso pessoal, em português, para a prova discursiva de 19/11/2026.
- Organização principal pela sequência das aulas, com prioridade e profundidade maiores nas aulas 17–28.
- Entrega local, com o HTML utilizável sem internet após o download e os originais acessíveis no pacote local.
- Sem serviços de IA durante o uso, publicação na internet ou correção automática.

Os contratos de dados e os critérios de aceitação serão definidos nas especificações dos módulos. A próxima revisão é a de `SPEC-fontes.md`; os demais módulos serão especificados na ordem aprovada.
