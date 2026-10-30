# Plano de execução — fontes

Especificação: [SPEC-fontes.md](../SPEC-fontes.md), aprovada pelo usuário. Execução incremental solicitada em 28/10/2026.

## Decisões

- Python e Poppler já disponíveis, sem framework ou banco de dados.
- Aquisição pela sessão autenticada do navegador colaborativo; sessão e credenciais permanecem no navegador.
- Transferência local temporária com origem restrita e hash dos bytes; validar com um PDF antes de ampliar a coleta. Encerrar a ponte após o uso.
- Manifesto versionável; originais, extrações e arquivos temporários em `.local/`, fora do Git.
- Processamento idempotente e verificações independentes da rede. Pendências mantêm o acervo explicitamente incompleto.

## Dependências e ordem

Transferência de um PDF → processamento por página → verificador independente → aquisição ampliada → revisão/OCR → conferência final.

O piloto usará a leitura da aula 17. A ampliação cobre primeiro as aulas 17–28, depois as demais leituras e os arquivos de apoio. Isso entrega evidência real cedo sem alterar o escopo aprovado.

## Riscos e resolução

- Transferência entre navegador e projeto: testar um arquivo com hash nas duas pontas antes de baixar o restante.
- PDFs digitalizados ou extração defeituosa: conferir amostras e páginas sinalizadas; aplicar OCR apenas onde necessário, preservando os originais.
- Arquivos indisponíveis ou curso alterado: registrar falhas e reconciliar o inventário novamente antes de concluir.
- Conteúdo externo e nomes de arquivos: validar IDs, tipos e caminhos; não executar instruções dos textos; nunca interpolar nomes em shell.

## Tarefas e checkpoints

Lista canônica: [todo.md](todo.md). Cada incremento de código segue teste que falha, implementação mínima, teste que passa, verificação real e commit. Não há trabalho delegado nem execução paralela sobre arquivos compartilhados.

Este plano cobre somente `fontes`. Os módulos `caderno`, `atlas`, `oficina` e `html` mantêm os limites definidos no mapa aprovado.

---

# Plano de execução — caderno

Especificação: [SPEC-caderno.md](../SPEC-caderno.md), aprovada em 28/10/2026. As tarefas estão em [todo.md](todo.md), seções 7–12.

## Decisões

- O validador vem antes do conteúdo: cada entrada nasce conferida contra as páginas extraídas.
- Escrita por leitura, em fatias verticais: uma entrada completa e validada antes da seguinte.
- Ordem: slides das aulas 17–23 revisados → validador → aulas 18–19 → 17 → 20 → 21–22 → 23 → 24–28 → aulas 2–16 curtas.
- O teste de suficiência (questão do padrão-ouro e duas semelhantes) roda ao fim das aulas 18–19 e de novo ao fim das aulas 17–28.

## Riscos

- Slides com texto vazio escondem conteúdo: resolver com OCR ou nota antes de escrever `professor_emphasis`.
- Resumo que vai além da fonte: o validador exige página e trecho literal; a amostragem manual cobre a interpretação.
- Figuras e tabelas que a extração não representa: registrar em `figures_note` e conferir no original.
- Volume: 14 leituras profundas mais 25 recursos curtos. Entregar o recorte prioritário primeiro; as aulas 2–16 ficam parciais se o prazo apertar.

---

# Plano de execução — atlas

Especificação: [SPEC-atlas.md](../SPEC-atlas.md), aprovada em 28/10/2026. **Plano e tarefas aprovados pelo usuário em 28/10/2026.** As tarefas 13–19 estão em [todo.md](todo.md); as pendências anteriores permanecem registradas.

## Base conferida

As 14 leituras das aulas 17–28 têm entradas `complete` e passaram em `scripts/caderno.py validate --scope priority`. As outras 17 leituras continuam fora deste incremento. O atlas consome o caderno; o acesso às páginas extraídas serve apenas para conferir as referências, sem produzir novas interpretações dos PDFs.

## Decisões de implementação

- Python e biblioteca padrão, seguindo o CLI do caderno. Reutilizar `Sources`, `check_refs` e a seleção de leituras prioritárias; não modificar os módulos anteriores.
- Um JSON UTF-8 por tema, no esquema aprovado. Distinguir `entry_type: debate` de `entry_type: single_reading`; somente o segundo admite uma obra e nenhuma relação entre autores.
- Posições identificadas por `resource_id`; relações têm `id` estável dentro do debate. Cada ponto de `verdict_outline` contém texto e referências a posições ou relações existentes. Assim a resposta pode ser conferida sem duplicar citações.
- `mechanism_matrix` e `verdict_outline` trazem `interpretation: true`. A matriz contém mecanismos e classificações por obra. Uma célula `absent` significa que a entrada consumida do caderno não oferece base para atribuir aquele mecanismo ao autor; exige explicação e não é apresentada como discordância.
- Cada posição e cada classificação substantiva cita a própria obra. Cada relação cita as duas obras do par. Uma citação literal correta de uma terceira leitura não satisfaz esse requisito.
- Casos e diferenças de contexto trazem as leituras envolvidas e suas referências. Comparações históricas não pressupõem que os autores discutam o mesmo país ou respondam diretamente uns aos outros.
- `validate` e `coverage` avaliam os arquivos presentes e a cobertura do recorte inteiro: durante a escrita, a falta dos temas restantes gera código 1 e aparece como pendência. JSON/argumentos inválidos geram 2; sucesso integral gera 0. Não haverá opção para esconder cobertura incompleta.
- Execução sequencial, com teste, verificação e commit por incremento; sem novas dependências, serviços ou delegação.

## Ordem e checkpoints

1. **Tarefa 13 — validador e cobertura:** testes sintéticos primeiro, incluindo referência de obra errada, trecho adulterado, verbete e cobertura incompleta.
2. **Tarefa 14 — piloto Bretton Woods:** três posições, relações sustentadas, matriz e roteiro de resposta. Conferir se a divergência sobre o peso do ouro é distinguida da concordância sobre os problemas de ajuste.
3. **Checkpoint do piloto:** o conteúdo escrito passa nas regras estruturais; o relatório mostra as leituras ainda descobertas. Montar uma resposta só com caderno e atlas antes de ampliar.
4. **Tarefa 15 — guerra e Era de Ouro:** Harrison como verbete; sua presença no crescimento europeu é contextual, sem lhe atribuir uma teoria da reconstrução que o caderno não contém.
5. **Tarefa 16 — planejamento e industrialização:** preservar a divergência Allen–Eichengreen e comparar condições da coordenação estatal com Rodrik e Bértola/Ocampo.
6. **Checkpoint intermediário:** conferir por amostragem uma relação de cada tipo e suas duas referências; documentar diferenças de período e método que limitam a comparação.
7. **Tarefa 17 — dívida e finanças internacionais:** manter os dois temas separados. O primeiro compara explicações da crise e resultados das reformas; o segundo, mecanismos das crises e benefícios condicionais dos fluxos de capital.
8. **Tarefa 18 — capital humano e convergência:** completar a cobertura, preservando as ressalvas sobre correlação, causalidade e instituições.
9. **Tarefa 19 — conferência final:** oito temas, 14 leituras cobertas, testes dos três módulos, validação real, oito roteiros suficientes para responder às teses propostas e documentação do estado do projeto.

## Riscos e tratamento

- **Falsa oposição:** usar `context` quando os trechos mostram apenas focos diferentes; `diverge` requer proposições efetivamente incompatíveis ou pesos causais distintos, explicitados no texto.
- **Pergunta com premissa forte:** o tema Estado e industrialização precisa avaliar a ideia de que a ISI “não funcionou”. Bértola e Ocampo registram ganhos históricos e limites; esse balanço entra como qualificação da premissa, sem apagar os êxitos nem equiparar ISI e URSS.
- **Comparação entre períodos:** distinguir mobilização de guerra, crescimento extensivo, desaceleração e transição institucional. O mesmo rótulo de mecanismo não torna os episódios equivalentes.
- **Ausência tomada por negação:** `absent` descreve limite do material consumido; não permite concluir que o autor rejeita o mecanismo.
- **Citação literal sem sustentação:** o validador confere presença e proveniência; a revisão de conteúdo confere se o trecho e a afirmação do caderno sustentam a relação. Não declarar essa revisão automatizada.
- **OCR e tabelas:** manter os limites das entradas do caderno, sem novos números extraídos das figuras.

## Aprovação e limites

Este plano não inicia `oficina` nem `html`, e não resolve as 17 entradas anteriores ainda ausentes. A aprovação do plano e das tarefas autoriza executar os incrementos do atlas em sequência; novas decisões que mudem o escopo seguem os limites da especificação.

## Resultado do atlas

Oito temas concluídos, com as 14 leituras prioritárias cobertas, sem erros de validação. Verificações e teste de suficiência registrados em [docs/atlas-revisao.md](../docs/atlas-revisao.md). Foram preservados os dados e o código de fontes e caderno. As 17 leituras anteriores, a oficina e o HTML seguem pendentes.

---

# Plano de execução — oficina

Especificação: [SPEC-oficina.md](../SPEC-oficina.md), aprovada em 29/10/2026 com solicitação de implementação incremental. Este plano detalha essa execução sem alterar o formato aprovado. As tarefas anteriores permanecem registradas.

## Decisões e dependências

- Biblioteca padrão Python; reutilizar a validação do atlas e do caderno e seus dados, sem modificá-los.
- Validar o contrato com fixtures sintéticas antes de escrever o piloto. Alvos do atlas resolvem por IDs; índices do caderno são inteiros não negativos e precisam existir.
- Calcular cobertura somente a partir de exercícios válidos e obras usadas nas bases de roteiro/parágrafo. Exigir um exercício por modo por tema.
- Escrever cada par como incremento verificável. O piloto de Bretton Woods prova o fluxo; os demais seguem a ordem das aulas.
- Roteiros e parágrafos serão escritos para cada enunciado. Não gerar variações de exercícios por substituição automática de frases.
- O modo guiado inclui planejamento; o autônomo traz um problema diferente e mantém roteiro separado. A interface e persistência das tentativas pertencem ao HTML.
- Execução sequencial, com testes, conferência e commit por incremento. Sem dependências novas nem delegação.

## Ordem e verificação

1. Tarefa 20: validador, resolução de bases e cobertura, com testes de referência incorreta e falsa cobertura.
2. Tarefa 21: par de Bretton Woods; conferir se cada pergunta admite uma resposta sustentada e se os parágrafos mostram a ligação entre os argumentos.
3. Checkpoint: piloto estruturalmente válido, demais temas explicitamente pendentes.
4. Tarefa 22: guerra e Era de Ouro; preservar a comparação entre países em Harrison e seu papel contextual no crescimento europeu.
5. Tarefa 23: planejamento e industrialização; preservar a divergência Allen–Eichengreen e os ganhos latino-americanos.
6. Checkpoint: conferir amostra de base de relação do atlas e de item indexado do caderno.
7. Tarefa 24: dívida e finanças; distinguir choque, exposição, transmissão e política de reformas.
8. Tarefa 25: capital humano e convergência; distinguir correlação, causa e cenário.
9. Tarefa 26: revisar as 16 respostas em tópicos, validar os dados reais e documentar comandos e limitações. Executar as quatro suítes pertinentes e comprovar que um erro deliberado é detectado.

## Riscos

Referências corretas não provam que o parágrafo responde ao enunciado: conferir conteúdo manualmente. Mudanças de índices no caderno podem alterar o sentido de uma base: revisar o conteúdo, além da existência. Obras listadas sem uso não contam para cobertura. Os resultados são apoio à autoavaliação, sem notas automáticas ou alegação de gabarito único.

## Resultado da oficina

16 exercícios válidos, oito temas e 14 leituras efetivamente utilizadas. As quatro habilidades estão cobertas. Passaram 76 testes e as verificações reais. Suficiência e limites registrados em [docs/oficina-revisao.md](../docs/oficina-revisao.md). Os dados e o código dos módulos anteriores foram preservados.

---

# Plano de execução — HTML

Especificação aprovada em 29/10/2026; execução solicitada pelo usuário. Construção incremental do pacote local sem dependências novas.

1. Corrigir a referência pendente do atlas, conferir a evidência e validar em commit próprio.
2. Criar gerador e verificador com fixtures: serialização segura, hashes, caminhos e preservação da entrega anterior. Montar a saída em diretório temporário.
3. Entregar o primeiro fluxo de leitura, com dados reais embutidos, índice por aula e evidências. Testar no navegador colaborativo.
4. Acrescentar atlas e busca global, com vínculos por conteúdo e estados vazios.
5. Acrescentar prática, salvamento com fallback e download da resposta; verificar troca de tela, recarregamento e revelação voluntária.
6. Conferir teclado e quatro larguras, originais, ZIP e funcionamento local. Documentar evidências, limitações e 17 resumos ainda pendentes.

Python padrão para geração e testes; HTML/CSS/JS nativos para apresentação. Sem rede no uso. O estado de estudo não depende de um servidor, e o arquivo de dados não executa conteúdo das leituras. Mudanças no conteúdo consumido são verificadas em incrementos próprios.

## Resultado do HTML

Pacote local concluído com Caderno, Atlas, busca e Praticar. 91 testes passaram, além da conferência de 55 páginas e dos fluxos de interação. Rede desativada e abertura direta por arquivo verificadas. Relatório em [docs/html-revisao.md](../docs/html-revisao.md). Os 17 resumos anteriores não foram declarados completos.

---

# Plano de execução — edição editorial

Especificação: [SPEC-editorial.md](../SPEC-editorial.md), aprovada em 29/10/2026. Tarefas 33–40 em [todo.md](todo.md). Execução contínua pedida pelo usuário em 29/10/2026, sem os checkpoints intermediários.

## Decisões para as perguntas em aberto

Na falta de resposta, valem estes padrões, revisáveis a qualquer checkpoint:

- A frase "Uma aula, um percurso" é tratada como categoria. O inventário cobre todo o texto de interface.
- A página inicial e as rotas não mudam. O frontispício com sumário fica como proposta separada.
- O protótipo mostra as duas cores de destaque, vermelho de impressão e azul-tinta.
- A habilidade "taste" não está disponível. A execução segue esta especificação e `frontend-ui-engineering`.

## Fontes

O `fontTools` não está instalado, então não há subconjunto local. Usar os WOFF2 de subconjunto latino já publicados pelo Fontsource (`@fontsource/source-serif-4`, OFL), baixados uma vez e versionados em `web/fonts/` com `OFL.txt` e a origem registrada. O latim básico com Latin-1 cobre ã, õ, ç e os acentos. Conferir a cobertura com uma frase de teste. O gerador incorpora os arquivos em base64 no CSS, e o teste garante que não haja URL remota.

## Ordem e dependências

Inventário de texto → fontes no gerador → **protótipo e escolha** → base tipográfica e sumário → Caderno → Atlas → Praticar, Busca e Originais → texto aplicado, verificação e entrega.

O protótipo vem antes de qualquer mudança em `web/style.css`. Ele é uma página estática em `.local/prototipos/`, fora do Git, que compõe uma leitura real (aula 17, Harrison) em duas ou três direções lado a lado. Depois da escolha, cada tela é uma fatia vertical: CSS, composição em `app.js`, ajuste de seletores em `browser.mjs`, geração, conferência no navegador e commit.

## Riscos

- Notas de margem desalinhadas em afirmações longas: usar grade em CSS por parágrafo, com a nota na mesma linha da grade, e não posicionamento absoluto.
- A matriz do Atlas pode ficar larga demais em 320–768 px. Abaixo de 1024 px, a tabela vira uma lista por mecanismo, com cada autor e a classificação em texto.
- Seletores do `browser.mjs` podem quebrar. Atualizá-los na mesma fatia, mantendo cada verificação e a contagem de 55 rotas e 44 originais.
- Peso das fontes: medir o HTML após a tarefa 34; parar se passar de 600 KiB de fontes ou de 4 MiB no total.
- O gosto não é verificável por teste. Por isso há dois checkpoints com o usuário: o protótipo e o resultado final.

## Checkpoints

1. Depois da tarefa 33: você revisa o inventário de texto.
2. Depois da tarefa 35: você escolhe a direção do protótipo e a cor.
3. Depois da tarefa 37: você revisa o Caderno aplicado antes de Atlas e Praticar.
4. Depois da tarefa 40: aprovação final com capturas antes e depois.

## Resultado da edição editorial

Caderno, Atlas, Praticar, Busca, Sumário e Originais recompostos com tipografia embutida. 92 testes e as 17 verificações do roteiro de navegador passaram nas 55 páginas. Não há rolagem horizontal nas 56 rotas em 320, 768, 1024 e 1440 px, e o menor contraste de texto é 6,4:1. Desvios e capturas estão em [SPEC-editorial.md](../SPEC-editorial.md) e [docs/html-revisao.md](../docs/html-revisao.md). Resultado aprovado pelo usuário em 29/10/2026.
