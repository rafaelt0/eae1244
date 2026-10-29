# Especificação: HTML de estudo do Guia EAE1244

## Evolução para hub público: direção B

O usuário escolheu **Percurso por aula** e solicitou takeover/full send em 29/10/2026. Este adendo prevalece sobre as restrições anteriores de uso exclusivamente pessoal/local e sobre a navegação lateral. O guia mantém a versão portátil e passa a oferecer um site público compartilhável, sem cadastro e com hospedagem gratuita. O usuário declarou autorização para republicar os originais.

Critérios desta evolução:

- Início por percursos das aulas, com ações **Estudar leituras**, **Comparar autores** e **Treinar respostas**, contexto mantido entre áreas e marcação **Quero rever**.
- Retomar leitura, seção/posição e exercício, preservando o modo guiado/autônomo. Rascunhos e autoavaliação existentes continuam na chave de armazenamento original; as novas preferências usam chave própria. Falhas de armazenamento mantêm a sessão e mostram a limitação.
- Busca global por trechos e abertura na seção relevante, com retorno à busca. Resultados de exercícios não revelam roteiros nem exemplos.
- Compartilhar links diretos com tema e seção, preservando rotas antigas. O site funciona para visitantes anônimos e não transmite o estado pessoal.
- Acervo integral: 31 leituras indexadas, 14 resumos completos, oito temas, 16 exercícios e 44 originais. Manter mecanismos, casos, limites, evidências, exemplos, erros frequentes e os 17 resumos pendentes com seu estado real.
- Visual B responsivo, contraste, foco visível, modos claro/escuro e sumário de leitura. Sem barra de alternativas nem código descartável no produto.
- Preservar geração/validação, integridade do ZIP e funcionamento local sem dependências remotas. Publicar apenas os artefatos necessários; manter o repositório de trabalho privado.
- Testar persistência, contexto e busca; verificar os fluxos reais em 320, 768, 1024 e 1440 px, incluindo falha de armazenamento, recarregamento, exportação e acesso aos PDFs. Submeter o diff à revisão Sol e ao CI antes de merge.

Decisões assumidas na execução autônoma: estado por navegador, sem sincronização automática, login, banco de dados, IA de execução ou telemetria. A publicação usará um plano gratuito e subdomínio fornecido pelo serviço; não comprar domínio nem ativar cobrança. Cloudflare Pages é a preferência inicial, condicionada à autenticação disponível. A conclusão pública exige prova de acesso sem login; uma prévia local não conta como publicação.

Módulo: `html`, conforme o [mapa de capacidades](CAPABILITY-MAP.md). Consome `fontes`, `caderno`, `atlas` e `oficina`.

Status: **aprovada pelo usuário em 29/10/2026**, com solicitação de execução. Implementação concluída e verificada: pacote offline, 14 resumos completos, oito temas e 16 exercícios. Os 17 resumos anteriores e a revisão do usuário permanecem pendentes.

## Objetivo

Entregar um guia elegante e interativo, em português, que seja o principal ambiente de estudo para a prova discursiva de 19/11/2026. Permitir ler os resumos, relacionar autores e praticar respostas sem alternar entre arquivos JSON.

O pacote funciona localmente, após descompactar e abrir `index.html`, com seus originais acessíveis por links relativos. O estudo não depende de login, conexão, servidor de IA ou publicação.

## Conteúdo e limites desta entrega

- 14 resumos completos das aulas 17–28, oito temas do atlas e 16 exercícios da oficina.
- Índice das 31 leituras do curso, além do acesso aos arquivos de apoio do manifesto. As 17 leituras anteriores sem resumo aparecem como **Resumo pendente**, com acesso ao original. O HTML não fabrica resumos para preencher essas lacunas.
- As pendências da revisão de fontes permanecem visíveis por recurso. Estar baixado não significa ter resumo ou extração revisada.
- Antes de integrar o conteúdo, conferir e corrigir em incremento próprio a referência de Eichengreen no contexto sobre Smithsonian, registrada nas tarefas. A correção deve usar o item pertinente já existente no caderno, sem mudar a interpretação histórica.
- Esta entrega produz o ambiente utilizável do recorte prioritário; não declara concluída a tarefa dos 17 resumos anteriores.

## Fluxos de uso

### Caderno

Página inicial abre o recorte prioritário. A navegação principal segue as aulas; o usuário pode incluir todas as leituras. Uma aula com várias leituras mostra cada obra e seu estado.

Ao escolher uma leitura, mostrar autoria, título e aula; tese e pergunta; argumento encadeado; conceitos; mecanismos; casos e evidências; limites; ênfases do professor e notas de figuras, quando existentes. As evidências podem ser expandidas junto à afirmação, com nome da obra, trecho e página física.

O usuário consegue sair de uma leitura para um tema relacionado ou exercício, sem precisar localizar IDs técnicos. IDs e caminhos do repositório não são rótulos da interface.

### Atlas

Listar os oito temas com suas perguntas. Cada tema apresenta a proposição avaliada, posições dos autores, convergências e divergências, diferenças de contexto, matriz de mecanismos, casos e roteiro interpretativo.

O usuário pode abrir a leitura de origem e a evidência de cada relação. `absent` aparece como **Não tratado no material usado**, nunca como rejeição do autor. O verbete de Harrison é identificado como leitura única, com comparação entre países.

### Praticar

Listar exercícios por tema e modo, usando **Guiado** e **Autônomo** como rótulos. Ao abrir um exercício, mostrar primeiro enunciado, obras relacionadas e espaço de escrita. As perguntas de planejamento aparecem apenas no modo guiado.

O aluno escolhe quando abrir roteiro, parágrafo comentado e erros frequentes. Esses apoios começam recolhidos. Os seis critérios de autoavaliação permitem marcar a revisão da própria resposta, sem calcular nota ou inferir domínio.

Preservar o texto ao mudar de área ou exercício. Tentar salvar rascunhos e marcações no armazenamento do navegador, com estado de salvamento visível. Se o armazenamento estiver indisponível, manter o texto na sessão e informar isso sem interromper o treino. Oferecer **Baixar minha resposta** em arquivo de texto, incluindo o enunciado. A interface deve esclarecer que mover o pacote ou trocar de navegador pode não transportar os rascunhos.

### Busca

Uma busca global encontra aulas, autores, títulos, conceitos e conteúdo explicativo nos três modos. Ignorar diferenças de maiúsculas e acentos. Cada resultado mostra o tipo e um trecho com contexto, abrindo a leitura, tema ou exercício correspondente.

Buscar não revela respostas de exercícios nem apaga texto digitado. Fornecer estado de nenhum resultado e ação para limpar a busca. O índice informa o estado de conteúdos pendentes.

### Originais e referências

Copiar os 44 arquivos preservados para a pasta `originais/` do pacote, com nomes seguros e um índice de correspondência. Conferir hashes antes de empacotar. PDFs podem receber `#page=N` nos links de evidência; a página física também aparece em texto porque o comportamento depende do visualizador.

Arquivos de slides e outros apoios são acessados pelo formato original. Links à página do curso são suplementares; a consulta local não depende deles.

## Direção visual

Leitura do projeto: ferramenta pessoal de estudo acadêmico, com linguagem editorial sóbria e navegação de caderno.

- Fundo claro, texto escuro e uma cor de destaque azul. Tokens coerentes para texto, superfície, bordas, foco e estados. Aparência única nesta entrega.
- Títulos em fonte serifada do sistema e controles em fonte sem serifa do sistema. Nenhuma fonte remota.
- Coluna de leitura com largura confortável, corpo de aproximadamente 17 px e entrelinha generosa; hierarquia clara entre tese, argumento e evidência.
- Em desktop, navegação lateral e leitura principal. Em telas pequenas, navegação recolhível e conteúdo em uma coluna; matrizes se adaptam sem forçar rolagem horizontal da página.
- Relações indicadas por texto, não apenas por cor. Espaçamento e divisórias organizam a leitura; evitar grades de cartões repetidos, efeitos decorativos e área inicial que afaste o conteúdo da tela.
- Movimento restrito a feedback de interação; respeitar preferência de movimento reduzido. Imagens decorativas não são necessárias para estudar este conteúdo.
- O material real, incluindo títulos longos e parágrafos, será usado na conferência visual.

## Arquitetura e contrato de geração

HTML, CSS e JavaScript nativos, sem framework ou dependência de CDN. Um gerador Python incorpora dados e recursos da interface no documento final. Nenhum `fetch` de JSON é necessário durante o estudo.

```text
SPEC-html.md
web/index.html            estrutura semântica
web/style.css             apresentação e responsividade
web/app.js                navegação, busca, estudo e rascunhos
scripts/html.py           validação, geração e empacotamento
tests/html/               fixtures e testes de geração
dist/guia-eae1244/         index.html e originais/; gerados, fora do Git
dist/guia-eae1244.zip      pacote portátil; fora do Git
docs/html-revisao.md       evidências de verificação e limites
```

O gerador consome as versões vigentes dos dados; reaproveita os validadores prioritários e o da oficina. Dados prioritários inválidos impedem uma nova entrega. Resumos ausentes fora do recorte aparecem como pendência, sem impedir o pacote prioritário.

O pacote é montado em área temporária antes de substituir uma saída anterior. Validar caminhos, nomes e hashes; impedir saída fora do diretório escolhido e não seguir caminhos arbitrários recebidos dos dados.

Ao incorporar JSON, escapar sequências capazes de encerrar um bloco de script. Ao apresentar conteúdo, usar texto e elementos DOM seguros, evitando interpretar os textos das leituras como HTML. Exemplo de estilo:

```javascript
function createParagraph(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  return paragraph;
}
```

O HTML apresenta os contratos existentes; não reescreve resumos, posições ou questões. Uma correção factual identificada pertence ao módulo de origem e recebe verificação e commit próprios.

## Comandos previstos

```bash
# Gerar a pasta e o ZIP depois de validar as entradas
python3 scripts/html.py build --manifest data/fontes/manifest.json --caderno data/caderno --atlas data/atlas --oficina data/oficina --output dist/guia-eae1244

# Conferir o pacote já gerado, seu conteúdo e os hashes dos originais
python3 scripts/html.py verify --output dist/guia-eae1244

# Testes de geração com fixtures sintéticas
python3 -m unittest discover -s tests/html -p 'test_*.py' -v

# Servidor exclusivamente local para inspeção no navegador
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist/guia-eae1244
```

Códigos de saída: 0 sucesso; 1 conteúdo prioritário ou pacote inválido; 2 argumentos ou entradas ilegíveis/malformadas. Os relatórios informam separadamente cobertura prioritária e pendências anteriores.

## Acessibilidade e estados

- Navegação e ações acessíveis por teclado, com foco visível e ordem coerente.
- Títulos hierárquicos, regiões de navegação, rótulos explícitos e link para pular ao conteúdo.
- Contraste mínimo de 4,5:1 para texto normal e 3:1 para texto grande. Estados não dependem só de cor.
- Controles de revelação expõem seu estado; mudança de leitura ou área posiciona o foco de modo previsível, sem tomar o foco durante a digitação.
- Estados definidos para busca vazia, nenhum resultado, resumo pendente, rascunho não salvo e dados indisponíveis. Falha de armazenamento não elimina o texto da sessão.
- A interface não exibe nota, diagnóstico de aprendizagem ou porcentagem de domínio derivada de cliques.

## Verificação

### Automática

- Testar geração com dados sintéticos, dados prioritários inválidos, ausência de resumos anteriores e saída anterior preservada quando a geração falha.
- Testar nomes e caminhos não confiáveis, adulteração de original e serialização contendo `</script>` ou marcação semelhante. Conteúdo deve ser apresentado como texto.
- Conferir integridade do ZIP, links locais aos arquivos preservados e contagens: 31 leituras indexadas, 14 resumos prioritários, oito temas e 16 exercícios na entrega real.
- Conferir que o HTML reúne seus recursos e tem no máximo 4 MiB, excluídos os originais. Nenhuma dependência remota para abrir ou usar o conteúdo.
- Exercitar busca sem acentos, navegação, revelação, rascunho e falha de armazenamento com testes que verifiquem comportamento observável.

### Navegador real

Usar o navegador colaborativo do T3 para testar a saída gerada. Conferir as larguras de 320, 768, 1024 e 1440 px; percorrer o fluxo por teclado; inspecionar console e requisições. Registrar capturas de Caderno, Atlas e Praticar em desktop e celular.

Verificar leitura completa de uma entrada, abertura de evidência e original, passagem ao atlas e a uma questão, digitação, troca e retorno de exercício, revelação voluntária e download da resposta. Testar recarregamento com armazenamento disponível e fallback quando indisponível.

Conferir a abertura local do pacote descompactado e o uso sem rede. Eventuais restrições do visualizador de PDFs ou do armazenamento em arquivos locais devem aparecer no relatório e ser cobertas por página indicada e download da resposta.

## Limites

### Sempre

- Priorizar estudo das aulas 17–28 e tornar as lacunas restantes visíveis.
- Exibir autores, referências, limites e interpretações sem rótulos técnicos desnecessários.
- Validar dados antes de gerar; preservar arquivos originais e conteúdo da tentativa do aluno.
- Entregar pasta portátil e ZIP e conferir o resultado no navegador real.

### Consultar antes

- Publicar na internet, adicionar telemetria ou serviços externos.
- Acrescentar bibliotecas, fontes remotas, login ou correção automática.
- Reduzir o conteúdo prioritário ou mudar de forma incompatível os contratos dos módulos anteriores.

### Nunca

- Mostrar conteúdo ausente como resumido, revisado ou concluído.
- Enviar rascunhos ou conteúdo das leituras para terceiros.
- Afirmar salvamento durável quando o navegador não o confirmou.
- Usar dados de demonstração como substitutos silenciosos do acervo real.

## Critérios de sucesso

1. O pacote abre localmente e permite estudar o conteúdo prioritário sem conexão.
2. O usuário encontra e lê os 14 resumos, os oito temas e os 16 exercícios; as outras leituras aparecem com seu estado real.
3. Busca, navegação por aula e vínculos entre leitura, tema, exercício e original funcionam sem apagar respostas digitadas.
4. Roteiros e exemplos começam recolhidos e podem ser abertos por escolha do aluno; os critérios de revisão não geram nota automática.
5. Os 44 arquivos preservados estão acessíveis no pacote e seus hashes passam na verificação.
6. Interface utilizável nas quatro larguras, por teclado e sem erros de console ou requisições externas necessárias.
7. A pasta, o ZIP e o relatório de revisão são entregues; pendências e limitações são explícitas.

## Decisões aprovadas

Interface de Caderno, Atlas e Praticar aprovada, com pacote local e cobertura prioritária completa. As 17 leituras anteriores entram no índice como resumos pendentes, conforme os dados atuais. O preenchimento desses resumos continua sendo uma tarefa do caderno.
