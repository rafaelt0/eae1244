# Protótipo do hub EAE1244

Protótipo descartável para escolher a estrutura e o acabamento da interface. A decisão visual está pendente da avaliação do usuário. O código está isolado do guia entregue e não deve ser promovido diretamente para produção.

## Abrir

```bash
python3 scripts/prototype_hub.py
python3 -m http.server 8767 --bind 127.0.0.1 --directory .local/ux-proposta/taste
```

Abrir <http://localhost:8767/?variant=A>. O arquivo `.local/ux-proposta/taste/index.html` também pode ser aberto diretamente. CSS, JavaScript, ícones e dados estão incorporados; não há dependência de CDN.

Os PDFs não são copiados pelo gerador. Nesta sessão, a pasta `originais` da prévia aponta para o pacote local preservado, permitindo conferir as evidências. Para transportar o protótipo com os PDFs, colocar a pasta `originais` do pacote gerado junto ao `index.html`. O HTML sozinho preserva navegação e estudo, mas não contém os arquivos PDF.

## A pergunta e as alternativas

Qual estrutura ajuda o aluno a escolher o que estudar, encontrar explicações e retomar seu percurso sem precisar aprender os nomes internos da ferramenta?

- `?variant=A`: **Biblioteca editorial**. Navegação lateral, entrada por aula e uma leitura destacada como ponto de partida.
- `?variant=B`: **Percurso por aula**. Aulas em sequência; leitura, comparação e treino permanecem no contexto escolhido.
- `?variant=C`: **Explorar por perguntas**. Busca em destaque e debates como entrada para as leituras.

O seletor inferior e as teclas de seta alternam as interfaces. As setas preservam seu comportamento nativo durante escrita, seleção e interação com o diálogo. Tema, rascunhos e marcações permanecem ao trocar de interface. O estado relevante pode ser consultado no painel “Estado do protótipo”.

## Auditoria e direção visual

Modo: evolução da identidade do guia, com mudanças de organização expressamente solicitadas pelo usuário.

- Base preservada: azul `#1d4b70`, texto `#202d37`, tipografia editorial, fontes do sistema, marca H, controles nativos, evidências expansíveis e roteiros recolhidos.
- Atritos identificados: nomes internos Caderno/Atlas, destinos fixos nos botões de área, falta de retomada da leitura e pouco contexto para o primeiro acesso.
- Mudanças propostas: verbos e destinos claros, ponto de entrada por aula ou questão, percurso contextual e marcações para rever.
- A taste orienta tipografia, ritmo, paleta e acabamento da entrada editorial. Este é um produto de estudo; regras de landing pages sobre fotografias, heróis promocionais, depoimentos e logotipos não se aplicam às telas de leitura e escrita.
- `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 2`, `VISUAL_DENSITY: 4`. A leitura recebe prioridade; movimento apenas para feedback de interação.
- CSS nativo acompanha o projeto existente. As três alternativas compartilham a identidade, mas diferem na estrutura. A aparência clara/escura segue a preferência do sistema e pode ser alternada manualmente.
- Os ícones Phosphor são SVGs oficiais incorporados. Fonte: <https://github.com/phosphor-icons/core>, obtida em 29/10/2026. A licença MIT está em `assets/PHOSPHOR-LICENSE.txt`.
- Não há página pública anterior nem base de SEO para migrar nesta etapa. A publicação gratuita e os links públicos pertencem à implementação posterior.

## Interações disponíveis

- Conteúdo real das 14 leituras completas, oito temas e 16 exercícios.
- Busca por trechos, sem distinção de acentos, com abertura na seção correspondente.
- Sumário interno, conceitos e evidências expansíveis com página do PDF.
- Navegação entre leitura, comparação e treino, lembrando o autor e o modo de exercício dentro do tema.
- Texto e revisão pessoal mantidos durante a navegação e troca de interface.
- Download da resposta em texto, incluindo enunciado e revisão pessoal.
- Marcação de temas e lista para rever, com estado vazio explícito.
- Retomada da última tela e posição durante a sessão.
- Links locais que preservam interface, tema e tela. O diálogo esclarece que a prévia ainda precisa ser publicada para compartilhar com outras pessoas.

## Limites e decisões abertas

Tudo fica em memória e é descartado ao recarregar. Persistência durável e sincronização entre aparelhos não estão demonstradas. Não há nota automática, inferência de domínio, login, banco de dados, telemetria ou serviços pagos.

Os 17 resumos anteriores permanecem identificados como pendentes. O protótipo não altera os dados de origem. A escolha de uma alternativa não autoriza reduzir o conteúdo do guia completo.

O usuário confirmou que o produto final deve ser público, ter todas as funções acessíveis e hospedagem sem custo, e declarou autorização para republicar os originais. A implementação deverá manter o acervo e adaptar a distribuição à hospedagem estática escolhida. O ZIP offline de aproximadamente 71 MiB excede o limite de 25 MiB por arquivo do Cloudflare Pages; o site e os originais individuais cabem, mas o ZIP requer uma distribuição separada se entrar na interface pública.

Antes de implementar o vencedor, validar com colegas se os nomes orientam a escolha, se a aula ou a pergunta é a melhor entrada e se a retomada reduz o esforço de voltar ao estudo. A especificação de produção deve registrar o resultado.

## Conferência realizada em 29/10/2026

- Cada alternativa renderizou o início, 14 leituras, oito comparações e 16 exercícios: 117 estados nas três interfaces. Foram conferidas larguras de 320, 768 e 1440 px, além de uma passagem em 412 px, sem rolagem horizontal.
- O navegador colaborativo do T3 verificou o percurso inicial. Após perder a sessão e retornar erro de conexão ao abrir uma nova, a conferência restante usou Chromium local isolado pelo `chrome-devtools-axi`. As prévias HTML do T3 também foram renderizadas e inspecionadas.
- Busca sem acento, nenhum resultado, lista de revisão, retomada, consulta de PDF e permanência do treino autônomo após consultar uma leitura funcionaram. Os três PDFs conferidos retornaram 200 no servidor local.
- O arquivo exportado incluiu enunciado, texto digitado e critérios marcados. Trocar de interface preservou o rascunho e a revisão. Setas dentro do editor não acionaram a troca de interface. Tab e Enter permitiram usar o salto ao conteúdo.
- Os controles inspecionados tinham rótulos acessíveis. Os contrastes medidos para texto principal, texto secundário e botão foram, respectivamente, 12,88:1, 5,33:1 e 8,75:1 na aparência clara; 14,99:1, 8,96:1 e 8,33:1 na escura.
- A auditoria Lighthouse mobile final registrou 100 em acessibilidade e boas práticas. O bloqueio de indexação é intencional (`noindex`) por se tratar de um protótipo; esses resultados não representam certificação de acessibilidade nem validação do futuro site público. Relatórios locais: `.local/ux-proposta/lighthouse-verified/`.
- A primeira auditoria encontrou um nome acessível diferente do rótulo visível de revisão; o rótulo foi alinhado. Uma auditoria posterior identificou deslocamento no carregamento; reservar o espaço da navegação e definir a alternativa antes da primeira pintura eliminou esse apontamento na auditoria final.
- Geração, sintaxe JavaScript e integridade dos marcadores passaram. O HTML final tem aproximadamente 494 KiB. Nenhum arquivo da interface ou do corpus original foi alterado.

Código-fonte primário preservado na branch `prototype/hub-taste`. A decisão sobre a alternativa vencedora permanece pendente; esta branch não deve ser mesclada como implementação de produção.
