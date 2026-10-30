# Especificação: edição editorial do Guia EAE1244

Módulo: revisão visual do `html`, conforme o [mapa de capacidades](CAPABILITY-MAP.md). Não consome nem altera os dados de `fontes`, `caderno`, `atlas` e `oficina`.

Status: **aprovada e implementada em 29/10/2026**, em execução contínua a pedido do usuário. Plano em [tasks/plan.md](tasks/plan.md), tarefas 33–40 em [tasks/todo.md](tasks/todo.md). Desvios registrados em Decisões de implementação.

## Objetivo

O guia funciona e está verificado, mas tem aparência genérica de interface, sem esplendor visual. Esta entrega o transforma em um objeto editorial, com a aparência de uma edição impressa bem composta: livro de estudo ou revista acadêmica. Isso vale tanto para a tipografia quanto para a composição das páginas.

- **Usuário:** o próprio aluno, em sessões longas de leitura e escrita até a prova de 19/11/2026.
- **Sucesso:** abrir o guia parece abrir um livro bem feito, e não um painel de aplicativo. Nenhuma frase de efeito genérica permanece na interface.
- **Escopo:** layout e apresentação de Caderno, Atlas, Busca, Praticar e índice; texto de interface (rótulos, títulos de seção, avisos, rodapés).
- **Fora do escopo:** conteúdo de estudo (resumos, posições, relações, roteiros, parágrafos comentados, citações e páginas), novos recursos, alteração de esquema dos dados, logotipo ou identidade, modo escuro.

## Premissas

1. Desktop (1280–1440 px) é a tela principal. Celular continua plenamente utilizável, sem rolagem horizontal da página.
2. O pacote continua offline. Fontes são incorporadas ao `index.html` como WOFF2 em base64; nenhuma requisição externa.
3. A revisão substitui a "Direção visual" de [SPEC-html.md](SPEC-html.md). Os demais contratos daquela especificação continuam valendo: segurança de DOM, acessibilidade, estados, pacote e verificação.
4. A frase citada, "Uma aula, um percurso", não aparece literalmente em `web/`, `data/` nem no pacote gerado. Ela é tratada como exemplo da categoria de texto a eliminar. Ver Perguntas em aberto.

## Direção editorial

### Tipografia

- Uma família serifada de texto, com itálico, versaletes ou small caps e algarismos de texto, cobrindo todos os diacríticos do português. Candidatas com licença OFL: **Source Serif 4** (preferida, pela legibilidade em tela e pelos tamanhos ópticos), Newsreader e EB Garamond. A escolha final é feita no protótipo.
- A mesma família compõe títulos, corpo e a maior parte dos controles. Uma sem serifa do sistema fica reservada a campos e a dados tabulares pequenos, quando a serifa prejudicar a leitura.
- Escala modular: corpo de 18–19 px no desktop, entrelinha de 1,5–1,6 e coluna de 60–70 caracteres. Títulos com contraste de tamanho real, e não só de peso.
- Recursos editoriais: cabeço corrido (aula · autor), autoria em versaletes, linha fina (standfirst) para a tese, numeração de parágrafos do argumento, aspas e travessões tipográficos, algarismos de texto no corpo e tabulares nas tabelas.
- Subconjunto latino nos arquivos de fonte; no máximo quatro arquivos (regular, itálico, semibold e, se necessário, semibold itálico) e até 600 KiB no total, já em base64.

### Cor e superfície

- Papel quente (marfim claro), tinta quase preta e uma única cor de destaque de época, como vermelho de impressão ou azul-tinta, usada com parcimônia em numerais, fios e links.
- Fios finos e espaço em branco organizam a página. Sem cartões com sombra, sem cantos arredondados como linguagem principal e sem gradientes.
- Contraste de pelo menos 4,5:1 no texto normal, inclusive no texto secundário sobre o papel.

### Ornamento

- Fios, filetes duplos, florão ou asterismo (⁂) entre seções, letra capitular opcional na abertura de cada leitura e numerais romanos ou de texto nas aulas.
- Nada que precise de imagens externas. Ornamentos são tipográficos ou SVG embutido e decorativo (`aria-hidden`).

## Composição por tela

### Sumário (índice lateral)

A barra lateral passa a ser um **sumário de livro**: número da aula em numeral de destaque, títulos das leituras e autores em versaletes, linhas pontilhadas ou fios até o estado ("pendente" em texto). O seletor de recorte e o acesso aos originais ficam no sumário, como notas de rodapé dele. No celular, o sumário abre como página sobreposta, e não como gaveta de aplicativo.

### Caderno: página de leitura

- Abertura: cabeço corrido, número da aula, título da obra, autor em versaletes e tese como linha fina. Pergunta da leitura em itálico.
- Argumento encadeado em parágrafos numerados na coluna principal.
- **Notas de margem** a partir de 1024 px: evidências (obra, trecho, página física) e conceitos aparecem na margem direita, alinhados à afirmação que sustentam. Abaixo de 1024 px, ficam como notas recolhíveis junto ao parágrafo.
- Mecanismos, casos e limites com títulos de seção editoriais; "limites" como ressalvas destacadas por fio, não por caixa colorida.
- Atalhos para tema e exercício viram uma remissão no fim do capítulo ("Ver também: Atlas, *Guerra e mobilização*; Praticar, exercício guiado").

### Atlas: comparação impressa

- Abertura com proposição avaliada como epígrafe e pergunta do tema.
- Posições dos autores em colunas paralelas, à maneira de uma edição comparada, que no celular se empilham.
- Matriz de mecanismos como **tabela impressa**: autores nas colunas e mecanismos nas linhas, com a classificação dada por texto curto mais marca tipográfica. A cor nunca é a única pista. "Não tratado no material usado" permanece com esse texto.
- Convergências, divergências e contexto como seções corridas; o roteiro interpretativo, como apêndice recolhido.

### Praticar: folha de prova

- Enunciado composto como questão de prova numerada, com as obras relacionadas como bibliografia da questão.
- Área de resposta com aparência de folha (margem, pauta opcional e fonte de texto legível), sem perder a acessibilidade do `textarea`.
- Planejamento (modo guiado), roteiro, parágrafo comentado e erros frequentes como **apêndices** recolhidos, numerados. Eles começam fechados, como hoje.
- Autoavaliação como lista de conferência impressa; o estado de salvamento é uma nota discreta, mas visível.

### Busca: índice remissivo

Resultados agrupados por tipo (Leituras, Temas, Exercícios), com o termo destacado no trecho e composição de índice remissivo. Os estados de vazio e de nenhum resultado são escritos de forma direta.

### Originais

Lista de arquivos como **bibliografia**, com autor, título, formato e estado, mantendo os 44 links.

## Texto de interface

- Remover frases de efeito, slogans, introduções motivacionais e rótulos que repetem o que a estrutura já mostra.
- Rótulos restantes são concretos e informativos: "Aula 21 · Planejamento soviético", "Evidências", "Ressalvas", "Ver também".
- Inventário obrigatório antes de implementar: listar toda string de interface de `web/index.html` e `web/app.js` com a decisão (manter, reescrever ou remover). Exemplos já identificados para revisão: "Continuar o estudo", "Continuar relacionando", "Construa sua tese e desenvolva os argumentos.", "Guia local de estudo. Sem correção automática.", "Casos para sustentar a comparação" e "Conceitos para a resposta".
- Permanecem obrigatoriamente os textos que carregam garantias da especificação do HTML: "Resumo pendente", "Não tratado no material usado", avisos de armazenamento indisponível e de rascunho, o aviso de interpretação de estudo e "Pular para o conteúdo". A redação pode ser enxugada sem perder o sentido.
- Strings vindas de `data/` não são editadas.

## Arquitetura

Sem mudança de arquitetura: HTML, CSS e JavaScript nativos, gerados por `scripts/html.py`.

```text
SPEC-editorial.md          esta especificação
web/index.html             estrutura semântica revisada
web/style.css              nova apresentação (tokens, tipografia, composição)
web/app.js                 composição das telas; lógica de busca, rascunhos e rotas inalterada
web/fonts/                 WOFF2 com subconjunto latino e OFL.txt; novo
scripts/html.py            incorporação das fontes como /*FONTS*/ ou dentro de STYLE
tests/html/                testes atualizados para os novos ganchos
docs/editorial-copy.md     inventário do texto de interface; novo
docs/html-revisao.md       capturas antes/depois e verificação
```

As funções exportadas por `app.js` (`normalize`, `searchDocs`, `createDraftStore`, `relatedTopics`, `studyExercise`) mantêm comportamento e assinatura. A renderização continua por `textContent` e DOM seguro; o redesenho não introduz `innerHTML` com conteúdo dos dados.

Estilo de código: o mesmo do `app.js` atual, com o helper `el` e a composição por funções de tela.

```javascript
function runningHead(lesson, author) {
  const head = el('p', null, 'running-head');
  head.append(el('span', 'Aula ' + lesson), el('span', author, 'smallcaps'));
  return head;
}
```

## Comandos

```bash
# Gerar o pacote
python3 scripts/html.py build --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas --oficina data/oficina --output dist/guia-eae1244

# Conferir pacote e hashes
python3 scripts/html.py verify --output dist/guia-eae1244

# Testes de geração e de lógica
python3 -m unittest discover -s tests/html -p 'test_*.py' -v
node --test tests/html/test_app.cjs

# Prévia local e roteiro de navegador
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist/guia-eae1244
chrome-devtools-axi run tests/html/browser.mjs
```

## Estratégia de teste

- `test_app.cjs` e `test_html.py` continuam passando sem afrouxar asserções. Adicionar ao `test_html.py`: as fontes são incorporadas, nenhuma URL remota aparece em `@font-face` e o HTML fica em até 4 MiB.
- `browser.mjs` mantém todas as verificações comportamentais: 55 rotas, 44 originais, rascunho, revelação voluntária, armazenamento bloqueado, busca sem acento e link de pular. Se um seletor mudar com o novo layout, a verificação é atualizada para o seletor equivalente, nunca removida.
- Verificação visual no navegador real em 320, 768, 1024 e 1440 px, com capturas antes e depois de Caderno, Atlas, Praticar, Busca e Sumário registradas em `docs/html-revisao.md`.
- Contraste medido nos tokens finais; teclado percorrendo as notas de margem e os apêndices; `prefers-reduced-motion` respeitado.

## Limites

### Sempre

- Prototipar uma tela (uma leitura do Caderno com notas de margem) em duas ou três direções e obter a escolha do usuário antes de aplicar o estilo às demais telas.
- Usar o material real, com títulos longos e parágrafos extensos, nas conferências.
- Manter textos de garantia e estados definidos em [SPEC-html.md](SPEC-html.md).

### Consultar antes

- Adicionar arquivos de fonte ao repositório. Esta especificação propõe isso; a aprovação dela autoriza fontes OFL com o arquivo de licença.
- Mudar a página inicial, as rotas ou o fluxo entre áreas.
- Adicionar folha de impressão, modo escuro ou qualquer recurso novo.

### Nunca

- Editar `data/` ou reescrever conteúdo de estudo.
- Carregar fontes, imagens ou scripts da rede.
- Remover ou enfraquecer verificações dos testes para acomodar o layout.
- Representar classificação, estado ou relação apenas por cor.

## Critérios de sucesso

1. Caderno, Atlas, Praticar, Busca, Sumário e Originais seguem a composição editorial descrita, nas quatro larguras.
2. Fontes embutidas em funcionamento offline; nenhuma requisição externa no console de rede; HTML em até 4 MiB.
3. Notas de margem alinhadas no desktop e recolhíveis abaixo de 1024 px, acessíveis por teclado.
4. O inventário de texto de interface está registrado e aplicado; nenhuma frase de efeito remanescente na revisão do usuário.
5. Todos os testes automáticos e o roteiro `browser.mjs` passam com verificações equivalentes ou mais fortes.
6. Contraste AA em todos os tokens de texto; foco visível no novo estilo.
7. O usuário aprova o protótipo escolhido e, depois, o resultado aplicado às telas.

## Decisões de implementação

- Sem protótipo comparativo nem checkpoints intermediários: o usuário pediu execução contínua. A direção aplicada é papel marfim, tinta quase preta e vermelho de impressão (`#962d1f`).
- Source Serif 4 em quatro arquivos WOFF2 latinos (regular, itálico, semibold e semibold itálico), cerca de 83 KiB no total, via `@fontsource/source-serif-4` 5.3.1. Os versaletes são compostos com caixa-alta espaçada, porque o subconjunto publicado não garante `smcp`.
- As notas de margem começam em 1200 px, e não em 1024 px: com o sumário lateral, 1024 px não comporta a coluna de 38rem mais a margem de 15rem. Abaixo disso, as evidências ficam recolhidas sob o parágrafo.
- A matriz do Atlas vira lista por mecanismo abaixo de 1024 px, depois de transbordar em 768 px nos temas com quatro autores.
- No celular, o sumário continua um painel recolhível no topo, e não uma página sobreposta. A mudança não trazia ganho de leitura que justificasse o risco nos fluxos testados.
- Sumário numerado por aula no Caderno, por tema no Atlas e por questão em Praticar. A numeração das questões segue a ordem dos temas, com o modo guiado antes do autônomo.

## Perguntas em aberto

1. Onde aparece "Uma aula, um percurso"? Resolvida em 30/10/2026: vinha da página inicial do PR #2, feita em paralelo na `main`. Saiu na integração.
2. Página inicial: resolvida em 30/10/2026. O PR #2 já trazia uma página inicial, aprovada na `main`; na integração ela virou o sumário "Temas da prova", com marcador da última página lida.
3. Cor de destaque: vermelho de impressão ou azul-tinta? O protótipo pode mostrar as duas.
4. Habilidade "taste": não está instalada. Se você tiver uma fonte para ela, sigo as regras dela no protótipo; senão, sigo esta especificação com `frontend-ui-engineering`.
