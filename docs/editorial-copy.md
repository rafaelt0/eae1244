# Inventário do texto de interface

Tarefa 33 de [SPEC-editorial.md](../SPEC-editorial.md). Cobre as strings de `web/index.html` e `web/app.js`. Textos vindos de `data/`, como títulos, teses, posições e enunciados, ficam fora do inventário e não foram alterados.

Regra aplicada: frases de efeito, convites e títulos que explicam o óbvio foram cortados ou trocados pelo nome concreto da seção. Os textos de garantia da [especificação do HTML](../SPEC-html.md) permanecem, com redação enxuta quando foi possível.

## Removidos ou trocados pelo nome da seção

| Antes | Depois |
| --- | --- |
| Uma leitura, comparação entre casos | Autor · leitura única, comparação entre países |
| N leituras em relação | sobrenomes dos autores (Eichengreen · Frieden · Meissner) |
| O argumento, passo a passo | Argumento |
| Mecanismos em jogo | Mecanismos |
| Conceitos para a resposta | Conceitos |
| Casos e comparações; Casos para sustentar a comparação | Casos |
| Evidências e resultados | Evidências |
| Limites e ressalvas | Ressalvas |
| O que cada leitura afirma | Posições |
| Como as leituras se relacionam | Relações |
| Mapa dos mecanismos | Mecanismos (com tabela) |
| Um caminho para a resposta | Apêndice A, Roteiro de resposta |
| Antes de escrever | Planejamento |
| Sua resposta | Resposta |
| Depois da tentativa | Apêndices |
| Abrir roteiro de resposta; Ver parágrafo de exemplo; Rever erros frequentes | A. Roteiro de resposta; B. Parágrafo comentado; C. Erros frequentes |
| Revisar a própria resposta | Autoavaliação |
| Tese possível; Argumentos a desenvolver; Conclusão possível | Tese; Argumentos; Conclusão |
| Construa sua tese e desenvolva os argumentos. | removido; rótulo acessível "Texto da resposta" |
| Comece avaliando a afirmação. Depois relacione autores, mecanismos e casos. | removido (placeholder) |
| Rascunho vazio. Comece a escrever ou baixe sua resposta para guardá-la. | Rascunho vazio. |
| Relacionar leituras →; Praticar esta leitura →; Praticar este tema → | lista "Ver também" com área e destino (Atlas, *tema*; Praticar, *Questão 3, guiada*) |
| Continuar relacionando; Continuar o estudo; Voltar ao atlas; Tentar a questão guiada/autônoma | Ver também |
| Consultar: *título* | Atlas: *tema*; Caderno: *leitura* |
| Ver evidências · N | Evidências (N) |
| Dados da leitura | Referência completa |
| Abrir PDF original; Abrir arquivo original | PDF original; Arquivo original |
| Ver no caderno | o título da leitura passa a ser o link |
| Questão de estudo · *tema* | *tema* |
| Treino guiado; Treino autônomo | Guiado; Autônomo |
| Índice de estudo; Recorte de leitura; Aulas 17–28 · prioritárias | Sumário; Recorte; Aulas 17–28 |
| Ver originais e apoios | Originais e apoios |
| Guia local de estudo. Sem correção automática. | removido |
| EAE1244 · Estudo para a prova de 19/11/2026 (rodapé) | removido; a data já está no cabeçalho |
| Acervo local | Acervo |
| Os links abrem os arquivos do pacote. Baixado, resumido e revisado são estados diferentes. | Estar no acervo não significa ter resumo nem extração revisada. |
| N resultados | N entradas para “consulta”, sob o título Índice remissivo |
| Nenhum conteúdo nesta área para o recorte escolhido. | Nada nesta área para o recorte escolhido. |
| Classificação interpretativa. Abra um mecanismo para comparar seu papel nas leituras. | Classificação interpretativa. Abra um mecanismo para ler a justificativa de cada classificação. |

## Textos de garantia mantidos

| Texto atual | Garantia |
| --- | --- |
| Resumo pendente. A leitura está no acervo e o original pode ser aberto acima; os resumos completos cobrem as aulas 17–28. | Conteúdo ausente não aparece como resumido. |
| Resumo parcial. Confira as ressalvas e o original. | Estado parcial explícito. |
| A revisão da extração desta fonte ainda tem pendências. O original está disponível. | Pendências de fonte visíveis. |
| Não tratado no material usado | `absent` nunca vira rejeição do autor. |
| Interpretação de estudo. Outras conclusões fundamentadas são possíveis. | Roteiros são interpretações. |
| Marque o que você conferiu. Não há nota. | Autoavaliação sem nota. |
| Rascunho salvo neste navegador. / Salvamento indisponível. O texto continua nesta sessão; baixe uma cópia. | Salvamento só é afirmado quando confirmado. |
| Os rascunhos ficam só neste navegador; mudar de navegador ou mover o pacote pode não levá-los junto. Baixe uma cópia para guardá-los. | Limite do armazenamento local. |
| Interpretações de estudo. Confira as evidências e as ressalvas de cada leitura. | Aviso geral de interpretação. |
| Nenhum resultado. Tente um autor, outra palavra ou limpe a busca. | Estado sem resultado. |
| Pular para o conteúdo; Baixar minha resposta; Prova discursiva 19 nov. 2026 | Acesso por teclado, exportação e data da prova. |

## A frase citada

"Uma aula, um percurso" não existia no ramo em que a reforma começou. Ela vinha da página inicial criada em paralelo na `main` (PR #2). Na integração de 30/10/2026, a página inicial virou o sumário "Temas da prova" e a frase saiu. A string parecida "Uma leitura, comparação entre casos", no Atlas, também foi substituída.

## Textos da integração com a `main` (30/10/2026)

| Na `main` | Agora |
| --- | --- |
| Uma aula, um percurso. / Leia, compare os argumentos e construa sua resposta. | Temas da prova; linha fina com a contagem de temas e leituras |
| Continuar de onde parei; Retomar → | Marcador, com o nome da página e a área |
| Seu estudo começa aqui; Escolha um percurso abaixo para começar… | removido |
| Começar → | o título do tema é o link; Caderno, Atlas e Praticar ao lado |
| Quero rever; Na revisão | Marcar para rever; Marcado para rever |
| O que você quer rever / Seus temas marcados para voltar com mais atenção. | Para rever / Temas marcados neste navegador. |
| Para rever (aba com ícone) | Para rever, no rodapé do sumário, com a contagem |
| Aparência escura; Aparência clara | Página escura; Página clara |
| Compartilhar; Compartilhar este conteúdo | Copiar link; Link desta página |
| Nesta leitura | lista numerada das seções, sem rótulo |
| ← Voltar à busca | Voltar ao índice remissivo |
| Conferir no original · página física N | *arquivo*, página física N |
