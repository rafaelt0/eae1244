# Revisão do HTML — guia local EAE1244

Conferência realizada em 29/10/2026. A revisão do usuário permanece pendente.

## Entrega

- [Abrir o guia](../dist/guia-eae1244/index.html).
- [Pacote offline completo](../dist/guia-eae1244.zip), aproximadamente 71 MB. Descompactar e abrir `index.html`, mantendo a pasta `originais` junto dele.
- HTML de aproximadamente 1 MiB, com apresentação, código e dados incorporados.
- 31 leituras indexadas, 14 resumos completos, oito temas, 16 exercícios e 44 originais preservados.
- Atualização de 29/10/2026: as 17 leituras anteriores passaram a ter resumos curtos, marcados como parciais e com aviso próprio. O sumário lateral conta completos, curtos e pendentes a partir dos dados.
- Atualização de 30/10/2026: revisadas as extrações das aulas 2–16, os 17 resumos curtos passaram a `complete` com profundidade `short` e aviso de resumo de contexto. A `main` recebeu em paralelo os PRs #2 (tema claro e escuro, ícones, percurso por tema, marcações e posição de leitura) e #3 (tabelas transcritas). A integração manteve a composição editorial e trouxe as funções: sumário de temas com marcador, lista "Para rever", tira do tema atual com "Copiar link", página escura em paleta própria (contraste mínimo 6,8:1), índice das seções da leitura, busca que abre a seção e volta ao índice remissivo, tabelas como figuras numeradas e restauração da posição de leitura. Os ícones não entraram: a direção editorial não usa ícones de interface. O slogan "Uma aula, um percurso.", que vinha do PR #2, foi removido. `browser.mjs` passou a 26 verificações, todas aprovadas nas 55 rotas.
- Atualização de 05/11/2026: as opções do seletor "Recorte" tinham fundo transparente e herdavam a tinta clara da página escura; o Chromium as desenhava sobre a lista branca padrão, ilegíveis. Agora usam o fundo e a tinta da folha nos dois temas. `browser.mjs` passou a 27 verificações, com contraste mínimo de 4,5:1 em cada opção nos dois temas.
- Na entrega original, os 17 resumos anteriores ficavam pendentes; o guia mostrava esse estado e permitia abrir os arquivos. Revisões de extração ainda pendentes também são identificadas. A entrega não declara completos esses resumos.

## Verificações automatizadas

Passaram 91 testes: 23 de fontes, 22 do caderno, 16 do atlas, 15 da oficina, dez de geração/empacotamento e cinco de lógica JavaScript.

Os testes de pacote cobrem integridade, adulteração, nomes e caminhos, saída não pertencente ao gerador, serialização segura e preservação da entrega anterior. Foi simulada uma falha na troca do ZIP após instalar a nova pasta: ambos os arquivos anteriores foram restaurados. Marcadores parecidos com os do template dentro dos dados permanecem literais.

Os testes JavaScript cobrem busca sem acentos, rascunhos e revisão entre exercícios e recarregamento, falha de armazenamento, dados persistidos malformados e preferência dos atalhos pela leitura/tema adequado. Uma alteração deliberada da normalização da busca foi detectada; o código foi restaurado e os testes passaram.

A geração real validou o conteúdo prioritário e os contratos consumidos. A verificação final conferiu o HTML, o índice dos originais, os 44 arquivos e a correspondência do ZIP. Nenhum hash divergente. Os dados do caderno e da oficina foram preservados; a referência pendente sobre Smithsonian no atlas foi corrigida em commit próprio (`ae24f61`), com evidência já existente no caderno.

## Navegador real e uso offline

O navegador colaborativo do T3 foi usado para o fluxo inicial de Caderno, Atlas, escrita e busca. Durante o redimensionamento, o serviço informou indisponibilidade do host e instruiu a não repetir a chamada. A conferência restante usou Chromium local isolado, controlado pelo `chrome-devtools-axi`, sem sessão pessoal ou credenciais.

O arquivo foi aberto diretamente por `file://`, com a rede em modo Offline. A navegação não depende de um servidor. Não houve erros de console ou requisições externas necessárias. O link de evidência abriu o PDF local de Harrison na página física indicada, no visualizador do navegador.

O roteiro reproduzível em `tests/html/browser.mjs` passou em 17 verificações:

- Atalhos de Harrison abrem o tema da guerra e a questão guiada correspondente.
- Roteiro e exemplo começam recolhidos; mecanismos e apoio abrem por ação do usuário.
- O texto sobrevive à mudança entre áreas, e rascunho e critérios sobrevivem ao recarregamento quando o armazenamento funciona.
- Busca sem acentos e estado sem resultado funcionam, sem revelar roteiro nem apagar a resposta.
- O arquivo exportado contém enunciado, texto digitado e revisão pessoal.
- Uma falha provocada em `Storage.setItem` gera aviso e mantém o texto na sessão; a troca de área não o perde.
- As 55 páginas de conteúdo renderizam sem erro: 31 leituras, oito temas e 16 exercícios.
- Os 44 links de originais estão no acervo.
- Tab encontra o link de salto e Enter posiciona o foco no conteúdo.

Para repetir o roteiro, usar uma sessão de navegador dedicada, abrir o `index.html` gerado e executar `chrome-devtools-axi run < tests/html/browser.mjs`. O teste preserva o valor anterior da chave de rascunhos da sessão. Node.js é usado apenas nos testes de desenvolvimento; o guia entregue requer somente o navegador.

## Responsividade e revisão visual

Caderno, Atlas e Praticar foram conferidos em 320, 768, 1024 e 1440 px. Nenhuma rolagem horizontal da página nos 12 estados. O acervo também foi conferido em 320 px: 44 arquivos acessíveis, sem transbordamento. A navegação recolhe em telas pequenas e fica disponível ao voltar para desktop.

Capturas finais conferidas:

- [Caderno, desktop](../.local/html-qa/1440-caderno.png) e [celular](../.local/html-qa/320-caderno.png).
- [Atlas, desktop](../.local/html-qa/1440-atlas.png) e [celular](../.local/html-qa/320-atlas.png).
- [Praticar, desktop](../.local/html-qa/1440-praticar.png) e [celular](../.local/html-qa/320-praticar.png).

O wrapper de captura local retornou um aviso de caminho não informado pelo MCP, embora os seis PNGs tenham sido salvos; os arquivos foram abertos e conferidos visualmente.

Os controles têm rótulos e foco visível, a estrutura usa títulos e regiões semânticas e os painéis usam `details`/`summary` nativos. A árvore de acessibilidade confirmou os controles de navegação e formulário. Os pares principais de cores foram calculados: texto 14,08:1; secundário 5,43:1; azul 9,16:1; aviso 6,12:1; placeholder 4,74:1. Essa conferência não é uma certificação de acessibilidade nem teste de todos os leitores de tela.

## Limites e uso

Rascunhos não entram no ZIP nem são enviados a terceiros. O armazenamento depende do navegador e da localização do arquivo; a interface informa sua disponibilidade e oferece download em texto. Mover o pacote ou mudar de navegador pode não transportar os rascunhos. O comportamento do salto `#page` depende do visualizador, por isso a página física também aparece em texto.

As classificações, comparações e roteiros continuam identificados como interpretações de estudo. A interface apresenta o conteúdo existente e seus limites. Não há nota automática, avaliação de domínio ou previsão das questões da prova.

O servidor local usado na prévia é opcional. A pasta e o ZIP gerados ficam em `dist/`, fora do Git, pois contêm o acervo local. A geração exige as fontes preservadas; os testes usam fixtures sintéticas.

## Edição editorial (29/10/2026)

Recomposição visual conforme [SPEC-editorial.md](../SPEC-editorial.md). O inventário do texto de interface está em [editorial-copy.md](editorial-copy.md). Os dados de estudo não foram alterados.

- Fontes Source Serif 4 incorporadas em base64 pelo gerador. O teste novo rejeita URL remota, `@import`, caminho fora de `web/fonts/` e fonte ausente. HTML com 1,12 MiB.
- 92 testes passaram: 23 de fontes, 22 do caderno, 16 do atlas, 15 da oficina, 11 de geração e cinco de lógica JavaScript. `html.py verify` não apontou divergências.
- `tests/html/browser.mjs` passou nas 17 verificações e nas 55 rotas, sem erros de console. Três seletores foram trocados pelos equivalentes do novo layout, com as mesmas asserções.
- Nenhuma rolagem horizontal nas 56 rotas, incluindo o acervo, em 320, 768, 1024 e 1440 px, medida por `scrollWidth`.
- Contraste sobre o papel `#f6f1e6`: texto 15,4:1, secundário 6,8:1, destaque 6,9:1 e aviso 6,4:1.
- Com o pacote aberto por `file://`, as únicas requisições são o próprio arquivo e os recursos embutidos.

Capturas antes, em `.local/editorial-qa/antes/`, e depois, em `.local/editorial-qa/depois/`: Caderno, Atlas, Praticar e busca em 1440 px, Caderno, Atlas e Praticar em 390 px, e acervo em 1024 px. Resultado aprovado pelo usuário em 29/10/2026.

### Revisão de acabamento

- A busca deixou de indexar identificadores internos, como `qualifies`, `converge`, IDs de leitura e de tema. As classificações passam a ser encontradas pelo rótulo em português, como "Qualifica a tese". Um teste novo cobre isso, e a consulta "qualifies" não retorna resultados no pacote real.
- Até 1023 px, a busca ocupa a segunda linha do cabeçalho, as abas cabem inteiras no sumário e as posições do Atlas se empilham sem o fio lateral.
- 93 testes passaram. `browser.mjs` passou nas 17 verificações e nas 55 rotas, e as 56 rotas continuam sem rolagem horizontal nas quatro larguras.

## Revisão de descoberta (17/11/2026)

Objetivo: permitir que um visitante de primeira viagem encontre todas as funções sem instrução externa, preservando a composição editorial. As mudanças estão em `web/index.html`, `web/style.css` e `web/app.js`; os dados não foram alterados.

### O que mudou

- **Início** (`#inicio`): três caminhos nomeados, retomada da última página, estatísticas locais, lista dos oito temas e atalho para "Como usar".
- **Índices reais** (`#caderno`, `#atlas`, `#praticar`): as abas deixaram de abrir um tema arbitrário. O Caderno lista as 31 leituras com estado (completo, curto, parcial ou sem resumo), o Atlas lista os oito debates com pergunta e autores, e Praticar lista as 16 questões por tema e modo, com indicação de rascunho.
- **Recorte sempre visível**: o seletor saiu de dentro do "Sumário" e aceita link direto, como `#caderno?recorte=priority`.
- **Continuidade**: faixa "Neste tema" em leituras, temas e questões, com a área atual marcada; navegação anterior/próxima no topo e no fim das três listas; retorno ao índice; o item ativo do sumário é trazido à vista.
- **Busca**: atalhos `Ctrl K`/`⌘ K` e `/`, sugestões quando não há resultado, escopo declarado, termos destacados, abertura na seção e barra fixa "Voltar à busca"; `Esc` limpa e devolve o foco ao conteúdo.
- **Ajuda** (`#ajuda`): documenta busca, evidências, originais, rascunhos, download, autoavaliação, tema, impressão e compartilhamento.
- **Copiar link**: tenta `navigator.clipboard.writeText`; confirma no diálogo, oferece um botão "Copiar" e mantém o campo selecionável como alternativa. O diálogo tem nome acessível.
- **Celular**: recorte em linha, atalhos do rodapé em linha, menu recolhido e todos os controles visíveis com pelo menos 24 px de altura; a navegação anterior/próxima chega a 43–44 px.

### Verificação automática

- 94 testes Python (23 fontes, 28 caderno, 16 atlas, 15 oficina, 12 geração) e 11 testes Node passaram.
- `html.py verify` não apontou divergências.
- `tests/html/browser.mjs` passou em 55 verificações de fluxo e nas 55 rotas, sem erro de página. O roteiro cobre início, índices, tema, revisão, retomada, tema claro/escuro, busca, rascunho, bloqueio de armazenamento, download, ajuda e atalhos.
- Uma medição CDP em 390 px confirmou todos os controles visíveis com pelo menos 24 px e a navegação anterior/próxima com 43–44 px. A mesma rodada percorreu as 55 rotas e verificou cópia de link, `Esc`, recorte por URL, retorno fixo à busca, pager no topo, link de salto e ausência de rolagem horizontal.
- 10 rotas em 320, 390, 768, 1024 e 1440 px não apresentaram rolagem horizontal (`scrollWidth`).

### Capturas

Em `.local/ux-qa/`:

- [Início, desktop](../.local/ux-qa/home-1440.png) e [celular](../.local/ux-qa/home-390.png).
- [Caderno, desktop](../.local/ux-qa/caderno-1440.png) e [celular](../.local/ux-qa/caderno-390.png).
- [Atlas, desktop](../.local/ux-qa/atlas-1440.png) e [celular](../.local/ux-qa/atlas-390.png).
- [Praticar, desktop](../.local/ux-qa/praticar-1440.png) e [celular](../.local/ux-qa/praticar-390.png).
- [Leitura, topo no desktop](../.local/ux-qa/reading-top-1440.png) e [no celular](../.local/ux-qa/reading-top-390.png).
- [Questão, desktop](../.local/ux-qa/practice-1440.png) e [celular](../.local/ux-qa/practice-390.png).
- [Ajuda, desktop](../.local/ux-qa/help-1440.png) e [celular](../.local/ux-qa/help-390.png).
- [Busca, desktop](../.local/ux-qa/search-1440.png).

### Conselho de revisão

- **GLM 5.3 Flash:** 9,5/10 na verificação final, com descoberta, clareza, hierarquia, celular, acessibilidade e completude entre 9,5 e 9,6.
- **DeepSeek V4.1 Flash:** 9,5/10 na reavaliação final, sem achados bloqueantes. Confirmou o destino de busca abaixo da barra fixa, a âncora `proposicao` do Atlas e "Referência completa" com 27 px.
- **MiMo V2.6 Flash:** revisão final em andamento.

As rodadas apontaram cópia de link sem confirmação, texto do Esc divergente, alvos de toque pequenos, escopo da busca não declarado, instrução de "Para rever" imprecisa, falta de cabeçalho na busca, barra fixa encobrindo o trecho, âncora `proposicao` ausente e "Referência completa" abaixo de 24 px. Todas as correções estão no pacote publicado.

### Acabamento final

Depois da primeira rodada do conselho, nove ajustes fecharam as lacunas restantes:

- O link "Pular para o conteúdo" não altera mais o endereço; ele foca o conteúdo sem trocar a rota.
- Resultados de busca abrem com uma barra fixa "Voltar à busca" que permanece visível ao rolar até a seção encontrada, mesmo em ressalvas e ênfases no fim da leitura.
- Leitura, tema e questão ganharam uma navegação anterior/próxima também no topo, além da que fecha a página.
- O sumário lateral traz o item ativo para a área visível e mantém "Para rever", "Originais" e "Como usar" fixos no rodapé.
- Todos os controles visíveis têm pelo menos 24 px de altura no celular; a navegação anterior/próxima tem 43–44 px.
- "Baixar minha resposta" só habilita quando há texto ou autoavaliação; se aberto vazio, o arquivo declara o rascunho vazio.
- O diálogo de link tem nome acessível e um botão "Copiar"; os termos encontrados aparecem destacados no resultado; `Esc` remove `busca`/`secao` do endereço, fecha a barra e devolve o foco ao conteúdo.
- Os links do índice de leitura atualizam `?secao=` no endereço, então "Copiar link" compartilha a seção aberta.
- O destino de busca é posicionado abaixo da barra fixa, sem encobrir a primeira linha; o Atlas ganhou a âncora `proposicao`, usada pelos resultados de busca; "Referência completa" também respeita os 24 px.
- Entre 761 e 900 px, os três percursos e os cartões da ajuda passam a uma coluna, evitando colunas de ~144 px no tablet.

A ordem de títulos da ajuda não salta níveis; as posições de leitura são salvas ao rolar e antes de clicar em um link interno, sem serem sobrescritas pelo `hashchange`. As 55 rotas continuam renderizando sem erro, e a medição de 10 rotas em cinco larguras não encontrou rolagem horizontal.

### Publicação no GitHub Pages (17/11/2026)

- Endereço: <https://rafaelt0.github.io/eae1244/>.
- Origem: branch `gh-pages`, commit `76e1ac1` (`Improve home layout at tablet widths`).
- O `index.html` publicado é idêntico ao pacote gerado (1.528.031 bytes); o build do Pages terminou como `built`.
- Os 44 originais responderam 200 no domínio público. Uma amostra de PDF foi baixada e o SHA-256 coincidiu com o arquivo do pacote (`e2b4265d…8be4ab4995`).
- A branch publica apenas `index.html`, `originais/` e `.nojekyll`; o ZIP offline continua fora do Pages.
