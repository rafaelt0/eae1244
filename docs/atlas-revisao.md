# Revisão do atlas — aulas 17–28

Revisão realizada pelo agente em 28/10/2026. Não substitui a revisão do usuário. O material interpreta as entradas completas do caderno e preserva suas referências e limites; não acrescenta pesquisa externa.

## Resultado técnico

- Oito temas: sete debates entre leituras e um verbete de Harrison.
- 14 de 14 leituras prioritárias cobertas; nenhuma pendente no atlas.
- 16 testes do atlas, 23 de fontes e 22 do caderno passaram, sem exclusões.
- `atlas validate`, `atlas coverage`, `caderno validate --scope priority` e `fontes verify --scope priority` passaram nos arquivos reais.
- A alteração deliberada da condição que exige fontes das duas obras fez falhar o teste de relações. O código foi restaurado e a suíte voltou a passar.
- A revisão encontrou uma lacuna na restrição às aulas 17–28: foi reproduzida em teste e corrigida. Não foram alterados fontes, caderno nem seus dados.

## Teste de suficiência dos oito roteiros

Cada verificação abaixo percorreu `thesis`, `arguments_for`, `counterarguments` e `conclusion` no `verdict_outline`, conferindo se suas bases resolvem para posições ou relações. Os caminhos de resposta são interpretações de estudo, não gabaritos nem previsões de questões da prova.

1. **[Bretton Woods](../data/atlas/fim-bretton-woods.json).** Para avaliar a primazia do ouro, o roteiro permite reconstruir Triffin, apresentar a objeção de Meissner e explicar a decisão política americana com Frieden. Conclusão possível: desenho vulnerável, pressão financeira e recusa do ajuste operam em níveis diferentes. Relações-chave: `peso-do-ouro`, `ajuste-e-politica`, `desenho-e-decisao`.

2. **[Guerra e mobilização](../data/atlas/guerra-e-mobilizacao.json).** Para avaliar se a base produtiva torna a mobilização dispensável, o roteiro concede a capacidade aliada e depois distingue intensidade, coordenação, ajuda externa e sustentabilidade. A comparação URSS–Alemanha permite argumentar sem confundir intensidade com eficiência. Há uma leitura, sem relação fictícia entre autores.

3. **[Era de Ouro](../data/atlas/crescimento-era-de-ouro.json).** Para avaliar recuperação automática, o roteiro concede reconstrução e atraso relativo, acrescenta capital e PTF e usa instituições e o caso britânico como qualificações. Harrison é contexto de mobilização anterior; a aproximação sobre coordenação é explicitamente limitada. A hipótese específica dos contratos sociais permanece uma hipótese.

4. **[Planejamento soviético](../data/atlas/planejamento-sovietico.json).** Para avaliar uma falha de incentivos invariável, o roteiro distingue crescimento inicial, desaceleração e colapso político. Contrapõe qualidade das escolhas em Allen a incentivos e informação em Eichengreen; Frieden situa reformas e ruptura. Relações-chave: `incentivos-ou-escolhas`, `limite-da-expansao-extensiva`, `reforma-e-colapso`.

5. **[Estado e industrialização](../data/atlas/estado-e-industrializacao.json).** Para avaliar o contraste entre êxito asiático e fracasso uniforme dos demais, o roteiro explica coordenação em Rodrik, ganhos e limites latino-americanos em Bértola/Ocampo e fases soviéticas em Allen. Permite contestar a premissa da pergunta e comparar instrumentos, capacidades e controle de rendas. Os casos nacionais são diferentes, sem experimento comum.

6. **[Crise da dívida e reformas](../data/atlas/crise-da-divida-e-reformas.json).** Para avaliar se a crise provou a falência produtiva da ISI, o roteiro separa gatilho externo, exposição e fragilidade interna. Relaciona Bértola/Ocampo, Meissner e Frieden; a transição pós-socialista em Eichengreen limita generalizações sobre pacotes de mercado. Permanência da abertura comercial não é medida de seu efeito causal sobre crescimento.

7. **[Crises financeiras depois de 1971](../data/atlas/crises-financeiras-pos-1971.json).** Para avaliar ganhos automáticos e indisciplina fiscal como causa universal, o roteiro apresenta benefícios potenciais e confronta a evidência. MCE de 1992 e Ásia de 1997 distinguem credibilidade, balanços, prazos e contágio. Meissner e Crafts condicionam benefícios; Frieden oferece a sequência histórica. Comércio, IDE e crédito não são equivalentes.

8. **[Capital humano e convergência](../data/atlas/capital-humano-e-convergencia.json).** Para avaliar a suficiência da escolaridade, o roteiro liga Li a Rodrik pelas complementaridades e aos dois textos de Crafts pelas instituições e pela capacidade de absorção tecnológica. Distingue correlação de causalidade, renda de bem-estar e trajetória passada de cenário futuro. A projeção de 2017 não foi atualizada como observação de 2026.

## Amostragem de conteúdo e proveniência

- **Convergência:** `limite-da-expansao-extensiva`, conferida contra a acumulação e a mudança de fase em Allen e a expansão extensiva em Eichengreen. Concordância parcial não apaga as explicações distintas.
- **Divergência:** `peso-do-ouro` e `incentivos-ou-escolhas`, conferidas contra as afirmações e referências de ambas as leituras. A divergência é de peso e interpretação causal, sem inventar uma negação de todos os demais mecanismos.
- **Contexto:** `periodos-e-medidas`, conferida contra a medida de esforço de Harrison e a contabilidade do crescimento de Crafts/Toniolo. O contexto não vira uma teoria de reconstrução atribuída a Harrison.
- **Fonte correta:** uma referência de slide presente no argumento introdutório do caderno de Allen foi identificada na conferência. O atlas usa, naquela posição e relação, apoio da própria leitura. O caderno não foi reescrito.

## Limites preservados

O validador confere estrutura, vínculo ao caderno, pertencimento às obras e presença literal na página extraída. Ele não prova que uma interpretação histórica seja correta. A revisão semântica foi feita pelo agente; a revisão do usuário continua pendente.

As páginas são físicas do PDF. OCR, tabelas e figuras mantêm os limites já registrados no caderno; não foram acrescentados números a partir de imagens. `absent` significa falta de base na entrada consumida, sem atribuir rejeição ao autor. A classificação dos mecanismos e os roteiros estão marcados como interpretação.

As 17 leituras das aulas anteriores, as pendências de fontes fora do recorte, a oficina e o HTML final não foram concluídos nesta entrega.
