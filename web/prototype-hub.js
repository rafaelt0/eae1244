(function () {
  'use strict';
  const data = JSON.parse(document.getElementById('prototype-data').textContent);
  const $ = selector => document.querySelector(selector);
  const h = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const icon = name => (data.icons[name] || '').replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
  const resources = new Map(data.resources.map(item => [item.id, item]));
  const topics = new Map(data.topics.map(item => [item.debate_id, item]));
  const exercises = new Map(data.exercises.map(item => [item.exercise_id, item]));
  const variants = ['A', 'B', 'C'];
  const variantNames = {A:'Biblioteca editorial', B:'Percurso por aula', C:'Explorar por perguntas'};
  const shortTopics = {'guerra-e-mobilizacao':'Guerra e mobilização','fim-bretton-woods':'O fim de Bretton Woods','crescimento-era-de-ouro':'O crescimento na Era de Ouro','planejamento-sovietico':'Planejamento soviético','estado-e-industrializacao':'Estado e industrialização','capital-humano-e-convergencia':'Capital humano e convergência','crise-da-divida-e-reformas':'Dívida e reformas','crises-financeiras-pos-1971':'Integração e crises financeiras'};
  const order = Object.keys(shortTopics);
  const orderedTopics = [...data.topics].sort((a,b) => order.indexOf(a.debate_id) - order.indexOf(b.debate_id));
  const title = resource => data.shortTitles[resource.id.split('-').pop()] || resource.title;
  const lessonLabel = values => 'Aula' + (values.length > 1 ? 's ' : ' ') + values.join(', ');
  const authors = rid => resources.get(rid)?.authors.join(', ') || 'Leitura';
  const state = {variant:variants.includes(new URLSearchParams(location.search).get('variant')) ? new URLSearchParams(location.search).get('variant') : 'B', page:'home', id:null, topic:'fim-bretton-woods', query:'', saved:new Set(), drafts:Object.create(null), checks:Object.create(null), last:null, readingByTopic:Object.create(null), practiceByTopic:Object.create(null), scrolls:Object.create(null), theme:matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'};
  const activeTopic = () => topics.get(state.topic) || orderedTopics[0];
  const action = (label, page, id='', className='secondary', glyph='', topic='') => '<button type="button" class="'+className+'" data-go="'+page+'" data-id="'+h(id)+'"'+(topic?' data-topic="'+h(topic)+'"':'')+'>'+(glyph?icon(glyph):'')+h(label)+'</button>';
  const pageHeading = (heading, description='', meta='') => '<div class="page-head">'+(meta?'<p class="byline">'+h(meta)+'</p>':'')+'<h1>'+h(heading)+'</h1>'+(description?'<p>'+h(description)+'</p>':'')+'</div>';
  const bookmark = topic => '<button type="button" class="bookmark" data-save="'+h(topic.debate_id)+'" aria-pressed="'+state.saved.has(topic.debate_id)+'" aria-label="'+h((state.saved.has(topic.debate_id)?'Na revisão: ':'Quero rever: ')+shortTopics[topic.debate_id]+(state.saved.has(topic.debate_id)?'. Remover da revisão.':''))+'">'+icon(state.saved.has(topic.debate_id)?'check':'bookmark-simple')+'<span>'+(state.saved.has(topic.debate_id)?'Na revisão':'Quero rever')+'</span></button>';
  const topicMeta = topic => '<div class="topic-meta"><span>'+h(lessonLabel(topic.lessons))+'</span>'+bookmark(topic)+'</div>';
  function findTopic(rid) { return [...data.topics].filter(topic => topic.works.includes(rid)).sort((a,b) => a.works.length-b.works.length)[0] || activeTopic(); }
  function exerciseFor(topic, mode='guided') { return data.exercises.find(exercise => exercise.debate_id===topic.debate_id && exercise.mode===mode); }
  function announce(message) { $('#live-status').textContent=message; }
  function exposeState() { $('#state-output').textContent=JSON.stringify({interface:state.variant+' · '+variantNames[state.variant],tela:state.page,item:state.id,tema:state.topic,rever:[...state.saved],retomar:state.last,rascunhos:Object.fromEntries(Object.entries(state.drafts).map(([id,answer])=>[id,{caracteres:answer.length}])),revisao:state.checks,aparencia:state.theme,persistencia:'Memória desta sessão'},null,2); }
  function syncURL() {
    const url=new URL(location.href);url.searchParams.set('variant',state.variant);url.searchParams.set('topic',state.topic);url.hash=state.page+(state.id?'/'+encodeURIComponent(state.id):'');
    try { history.pushState({},'',url); } catch (_) { /* Inline previews can have an opaque origin. */ }
  }
  function readRoute() {
    const [page,encoded]=location.hash.slice(1).split('/');
    let id='';try{id=decodeURIComponent(encoded||'');}catch(_){return;}
    if(['home','readings','comparisons','exercises','saved'].includes(page)){state.page=page;state.id=null;}
    if(page==='reading'&&resources.has(id)){state.page=page;state.id=id;const requested=topics.get(new URLSearchParams(location.search).get('topic'));state.topic=requested?.works.includes(id)?requested.debate_id:findTopic(id).debate_id;}
    if(page==='compare'&&topics.has(id)){state.page=page;state.id=id;state.topic=id;}
    if(page==='practice'&&exercises.has(id)){state.page=page;state.id=id;state.topic=exercises.get(id).debate_id;}
    if(['reading','compare','practice'].includes(state.page))state.last={page:state.page,id:state.id};
    if(state.page==='reading')state.readingByTopic[state.topic]=state.id;
    if(state.page==='practice')state.practiceByTopic[state.topic]=state.id;
  }
  function go(page,id='',anchor='') {
    state.scrolls[state.page+':'+state.id]=window.scrollY;
    state.page=page;state.id=id||null;state.query='';$('#global-search').value='';
    if(page==='compare')state.topic=id;
    if(page==='reading'&&!activeTopic().works.includes(id))state.topic=findTopic(id).debate_id;
    if(page==='practice')state.topic=exercises.get(id).debate_id;
    if(page==='reading')state.readingByTopic[state.topic]=id;
    if(page==='practice')state.practiceByTopic[state.topic]=id;
    if(['reading','compare','practice'].includes(page))state.last={page,id};
    syncURL();render();
    requestAnimationFrame(()=>{const target=anchor&&document.getElementById(anchor);if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}else{$('#main').focus({preventScroll:true});window.scrollTo(0,state.scrolls[page+':'+state.id]||0);}});
  }
  function nav() {
    const section={reading:'readings',compare:'comparisons',practice:'exercises'}[state.page]||state.page;
    const items=[['home','house','Início','Escolher e retomar'],['readings','book-open','Estudar leituras','Teses, argumentos e conceitos'],['comparisons','arrows-left-right','Comparar autores','Concordâncias e diferenças'],['exercises','pencil-line','Treinar respostas','Escrever e revisar'],['saved','bookmark-simple','Para rever','Suas marcações']];
    $('#navigation').innerHTML='<nav class="area-nav" aria-label="Áreas de estudo">'+items.map(([page,glyph,label,help])=>'<button type="button" data-go="'+page+'" class="'+(page===section?'active':'')+'"'+(page===section?' aria-current="page"':'')+'>'+icon(glyph)+'<span>'+label+'<small>'+help+'</small></span></button>').join('')+'</nav><div class="side-meta"><p><strong>Prova discursiva</strong><br>19 de novembro de 2026</p><p>'+data.counts.complete+' leituras resumidas<br>'+data.topics.length+' temas de comparação<br>'+data.exercises.length+' exercícios</p><p>Aulas 17–28 prioritárias.<br>'+data.counts.pending+' resumos anteriores pendentes.</p></div>';
  }
  function resume() {
    let description='Abra uma leitura, comparação ou exercício. Seu ponto de retorno aparece aqui.';
    if(state.last){const previous=state.last;description=previous.page==='reading'?title(resources.get(previous.id)):previous.page==='compare'?shortTopics[previous.id]:exercises.get(previous.id).title;}
    return '<section class="resume"><h2>'+(state.last?'Continuar de onde parei':'Seu estudo começa aqui')+'</h2><p>'+h(description)+'</p>'+(state.last?action('Retomar',state.last.page,state.last.id,'text-button','arrow-right'):'')+'</section>';
  }
  function topicItem(topic) {
    const compareLabel=topic.works.length===1?'Comparar casos':'Comparar autores';
    return '<section class="topic-item">'+topicMeta(topic)+'<button type="button" class="topic-open" data-go="compare" data-id="'+h(topic.debate_id)+'"><h3>'+h(shortTopics[topic.debate_id])+'</h3></button><p>'+h(topic.works.map(authors).join(' / '))+'</p><div class="topic-links">'+action(compareLabel,'compare',topic.debate_id,'text-button')+action('Treinar resposta','practice',exerciseFor(topic).exercise_id,'text-button')+'</div></section>';
  }
  function homeA() {
    const resource=resources.get('moodle-resource-6601122');
    return pageHeading('Estude por aula. Conecte ideias.','Leituras, comparações e prática no mesmo lugar.')+'<div class="home-feature"><section class="start-reading"><p class="byline">Aulas 18–19</p><h2>O fim de Bretton Woods</h2><p>Comece pela leitura de Eichengreen e avance para a comparação com Frieden e Meissner.</p>'+action('Estudar leitura','reading',resource.id,'primary','book-open')+'</section>'+resume()+'</div><div class="section-head"><h2>Explore as aulas</h2><p>Escolha um tema ou marque o que quer rever.</p></div><div class="topic-grid">'+orderedTopics.map(topicItem).join('')+'</div>';
  }
  function homeB() {
    return '<div class="journey-intro">'+pageHeading('Uma aula, um percurso.','Leia, compare os argumentos e construa sua resposta.')+resume()+'</div><div class="journey-list">'+orderedTopics.map(topic=>'<section class="lesson-lane"><span class="lesson-number">'+h(lessonLabel(topic.lessons))+'</span><div><h2>'+h(shortTopics[topic.debate_id])+'</h2><p>'+h(topic.works.map(authors).join(' / '))+'</p></div><div class="lane-actions">'+action('Começar','reading',topic.works[0],'primary','arrow-right',topic.debate_id)+bookmark(topic)+'</div></section>').join('')+'</div>';
  }
  function homeC() {
    const suggestions=['Bretton Woods','Capital humano','Planejamento'];
    return pageHeading('Qual ideia você quer entender?','Parta de uma pergunta e encontre leituras, autores e exercícios.')+'<div class="questions-layout"><div>'+orderedTopics.map(topic=>'<section class="question-row">'+topicMeta(topic)+'<button type="button" class="topic-open" data-go="compare" data-id="'+h(topic.debate_id)+'"><h2>'+h(shortTopics[topic.debate_id])+'</h2></button><p>'+h(topic.question)+'</p>'+action('Explorar a questão','compare',topic.debate_id,'text-button','arrow-right')+'</section>').join('')+'</div><section class="questions-aside">'+resume()+'<div class="concept-suggestions"><h2>Um ponto de partida</h2><p>Busque um conceito para encontrar o trecho em que ele aparece.</p>'+suggestions.map(term=>'<button class="concept-link" type="button" data-query="'+h(term)+'">'+h(term)+' '+icon('arrow-right')+'</button>').join('')+'</div></section></div>';
  }
  function collectionPage(kind) {
    if(kind==='readings')return pageHeading('Estudar leituras','Entenda a tese, os argumentos e os conceitos de cada texto.')+'<div class="collection">'+data.resources.filter(resource=>resource.summary).map(resource=>'<section class="collection-item"><p>'+h(lessonLabel(resource.lessons))+'</p><h2>'+h(title(resource))+'</h2><p>'+h(resource.authors.join(', '))+'</p><div class="button-row">'+action('Estudar leitura','reading',resource.id,'secondary','book-open')+'</div></section>').join('')+'</div><p class="footnote">'+data.counts.pending+' leituras anteriores ainda estão sem resumo. O protótipo explora as '+data.counts.complete+' leituras completas.</p>';
    if(kind==='exercises')return pageHeading('Treinar respostas','Escreva primeiro. Consulte o roteiro e revise seus argumentos depois.')+'<div class="collection">'+orderedTopics.map(topic=>'<section class="collection-item"><p>'+h(lessonLabel(topic.lessons))+'</p><h2>'+h(shortTopics[topic.debate_id])+'</h2><p>Escolha o apoio para planejar sua resposta ou tente a questão autônoma.</p><div class="button-row">'+action('Treino guiado','practice',exerciseFor(topic).exercise_id,'secondary','pencil-line')+action('Treino autônomo','practice',exerciseFor(topic,'independent').exercise_id,'text-button')+'</div></section>').join('')+'</div>';
    const selected=kind==='saved'?orderedTopics.filter(topic=>state.saved.has(topic.debate_id)):orderedTopics;
    return pageHeading(kind==='saved'?'O que você quer rever':'Comparar autores',kind==='saved'?'Conteúdos que você marcou para voltar com mais atenção.':'Veja como as leituras concordam, divergem e se complementam.')+(selected.length?'<div class="topic-grid">'+selected.map(topicItem).join('')+'</div>':'<section class="empty"><h2>Sua lista de revisão está vazia</h2><p>Use “Quero rever” ao explorar um tema. A marcação aparece aqui.</p>'+action('Explorar aulas','home','','text-button','arrow-right')+'</section>');
  }
  function steps(topic) {
    const exercise=exercises.get(state.practiceByTopic[topic.debate_id])||exerciseFor(topic);
    return '<nav class="route-steps" aria-label="Percurso desta aula">'+[['reading',topic.works.includes(state.id)?state.id:state.readingByTopic[topic.debate_id]||topic.works[0],'Estudar leituras','book-open'],['compare',topic.debate_id,topic.works.length===1?'Comparar casos':'Comparar autores','arrows-left-right'],['practice',state.page==='practice'?state.id:exercise.exercise_id,'Treinar respostas','pencil-line']].map(([page,id,label,glyph])=>action(label,page,id,'step '+(state.page===page?'active':''),glyph)).join('')+'</nav>';
  }
  function context(topic) { return state.variant==='B'?'<section class="course-context"><p>'+h(lessonLabel(topic.lessons))+'</p><h2>'+h(shortTopics[topic.debate_id])+'</h2>'+steps(topic)+'</section>':steps(topic); }
  function evidence(refs=[]) {
    const unique=[...new Map(refs.map(ref=>[ref.file_id+':'+ref.pdf_page+':'+ref.quote,ref])).values()];
    if(!unique.length)return '';
    return '<details class="evidence"><summary>Consultar evidências ('+unique.length+')</summary>'+unique.map(ref=>{const file=data.files[ref.file_id];return '<blockquote>'+h(ref.quote)+'</blockquote>'+(file?'<a href="'+h(file.href)+'#page='+Number(ref.pdf_page)+'" target="_blank" rel="noopener">'+h(file.label)+' · página '+Number(ref.pdf_page)+'</a>':'<p>Página '+Number(ref.pdf_page)+' do original.</p>');}).join('')+'</details>';
  }
  function readingPage(resource) {
    const summary=resource.summary,topic=activeTopic();
    const toc='<nav class="reading-toc section-toc" aria-label="Seções desta leitura"><strong>Nesta leitura</strong><a href="#reading-thesis" data-anchor="reading-thesis">Tese central</a><a href="#reading-argument" data-anchor="reading-argument">O argumento</a><a href="#reading-concepts" data-anchor="reading-concepts">Conceitos</a><a href="#reading-limits" data-anchor="reading-limits">Limites e ressalvas</a><div class="button-row">'+bookmark(topic)+'<button class="secondary" type="button" data-share>'+icon('link-simple')+'Compartilhar</button></div></nav>';
    return action('Início','home','','back','arrow-left')+context(topic)+pageHeading(title(resource),resource.authors.join(' / '),lessonLabel(resource.lessons))+'<div class="study-layout"><article class="reading-sheet"><section id="reading-thesis"><h2>Tese central</h2><p class="thesis">'+h(summary.thesis)+'</p><details class="support"><summary>A pergunta da leitura</summary><p>'+h(summary.question)+'</p></details></section><section id="reading-argument" class="reading-section"><h2>O argumento, passo a passo</h2><ol class="argument">'+summary.argument.map(item=>'<li><p>'+h(item.claim)+'</p>'+evidence(item.refs)+'</li>').join('')+'</ol></section><section id="reading-concepts" class="reading-section"><h2>Conceitos para entender o texto</h2>'+summary.concepts.map(item=>'<details class="concept"><summary>'+h(item.term)+'</summary><p>'+h(item.definition)+'</p>'+evidence(item.refs)+'</details>').join('')+'</section><section id="reading-limits" class="reading-section"><h2>Limites e ressalvas</h2>'+summary.limits.map(item=>'<p>'+h(item)+'</p>').join('')+'</section><div class="button-row">'+action(topic.works.length===1?'Comparar casos':'Comparar autores','compare',topic.debate_id,'primary','arrows-left-right')+'</div></article>'+toc+'</div>';
  }
  function comparePage(topic) {
    const labels={converge:'Convergência',diverge:'Divergência',context:'Diferença de contexto'};
    return action('Início','home','','back','arrow-left')+context(topic)+pageHeading(shortTopics[topic.debate_id],topic.question,lessonLabel(topic.lessons))+'<div class="study-layout"><article class="reading-sheet"><h2>'+(topic.works.length===1?'Uma leitura, diferentes casos':'O que cada autor afirma')+'</h2>'+topic.positions.map(position=>'<section class="position"><h3>'+h(authors(position.resource_id))+'</h3><p>'+h(position.summary)+'</p>'+action('Consultar leitura','reading',position.resource_id,'text-button','book-open')+evidence(position.refs)+'</section>').join('')+(topic.relations.length?'<section class="reading-section"><h2>Como as leituras se relacionam</h2>'+topic.relations.map(relation=>'<div class="relation"><small>'+h(labels[relation.type]||'Relação entre leituras')+'</small><h3>'+h(relation.between.map(authors).join(' / '))+'</h3><p>'+h(relation.text)+'</p>'+evidence(relation.refs)+'</div>').join('')+'</section>':'')+'<div class="button-row">'+action('Treinar resposta','practice',exerciseFor(topic).exercise_id,'primary','pencil-line')+'</div></article><section class="reading-toc"><strong>Para este tema</strong><p>'+topic.works.length+' leitura'+(topic.works.length===1?'':'s')+' no acervo.</p>'+bookmark(topic)+'<div class="button-row"><button class="secondary" type="button" data-share>'+icon('link-simple')+'Compartilhar</button></div></section></div>';
  }
  function outline(exercise) {
    const labels={thesis:'Uma tese possível',arguments_for:'Argumentos a desenvolver',counterarguments:'Contrapontos e ressalvas',conclusion:'Uma conclusão possível'};
    return '<p class="review-help">Interpretação de estudo. Outras respostas fundamentadas são possíveis.</p>'+Object.entries(labels).map(([key,label])=>'<h3>'+label+'</h3>'+exercise.answer_outline[key].map(point=>'<p>'+h(point.text)+'</p>').join('')).join('');
  }
  function practicePage(exercise) {
    const topic=activeTopic(),alternative=exerciseFor(topic,exercise.mode==='guided'?'independent':'guided');
    return action('Início','home','','back','arrow-left')+context(topic)+pageHeading(shortTopics[topic.debate_id],'Construa sua resposta e depois confira os critérios de revisão.',lessonLabel(exercise.lessons))+'<div class="exercise-mode">'+action('Guiado','practice',exercise.mode==='guided'?exercise.exercise_id:alternative.exercise_id,exercise.mode==='guided'?'active':'')+action('Autônomo','practice',exercise.mode==='independent'?exercise.exercise_id:alternative.exercise_id,exercise.mode==='independent'?'active':'')+'</div><div class="study-layout"><article class="reading-sheet"><p class="exercise-prompt">'+h(exercise.prompt)+'</p>'+(exercise.planning_prompts.length?'<h3>Antes de escrever</h3><ol class="planning">'+exercise.planning_prompts.map(item=>'<li>'+h(item)+'</li>').join('')+'</ol>':'')+'<label class="answer-label" for="answer">Sua resposta</label><textarea class="answer" id="answer" placeholder="Apresente sua tese e desenvolva os argumentos.">'+h(state.drafts[exercise.exercise_id]||'')+'</textarea><p class="answer-status" id="answer-status" role="status">'+(state.drafts[exercise.exercise_id]?'Texto mantido nesta sessão.':'Seu texto permanece ao consultar leituras e trocar de interface nesta sessão.')+'</p><div class="button-row"><button type="button" class="secondary" data-download>'+icon('download-simple')+'Baixar resposta</button>'+action('Consultar comparação','compare',topic.debate_id,'text-button')+'</div><details class="support"><summary>Abrir roteiro de resposta</summary>'+outline(exercise)+'</details><details class="support"><summary>Ver parágrafo comentado</summary><p>'+h(exercise.worked_paragraph.text)+'</p><p>'+h(exercise.worked_paragraph.commentary)+'</p></details><section class="reading-section"><h2>Revisar minha resposta</h2><p class="review-help">Marque o que você conferiu. A revisão não gera nota.</p>'+exercise.self_review.map((item,index)=>'<label class="review-item"><input type="checkbox" data-check="'+index+'"'+((state.checks[exercise.exercise_id]||[]).includes(index)?' checked':'')+'><span>'+h(item.question)+'</span></label>').join('')+'</section></article><nav class="reading-toc" aria-label="Leituras para consulta"><strong>Leituras de apoio</strong>'+exercise.works.map(rid=>action(title(resources.get(rid)),'reading',rid,'action-link')).join('')+'</nav></div>';
  }
  const searchRecords=[];
  for(const resource of data.resources.filter(item=>item.summary)){
    const s=resource.summary,base={page:'reading',id:resource.id,title:title(resource),type:'Leitura',context:resource.authors.join(' ')+' '+lessonLabel(resource.lessons)};
    searchRecords.push({...base,text:s.thesis,anchor:'reading-thesis'});
    for(const point of s.argument)searchRecords.push({...base,text:point.claim,anchor:'reading-argument'});
    for(const point of s.concepts)searchRecords.push({...base,text:point.term+': '+point.definition,anchor:'reading-concepts'});
  }
  for(const topic of data.topics)searchRecords.push({page:'compare',id:topic.debate_id,title:shortTopics[topic.debate_id],type:'Comparação',text:topic.question+' '+topic.positions.map(position=>position.summary).join(' '),context:topic.works.map(authors).join(' ')});
  for(const exercise of data.exercises)searchRecords.push({page:'practice',id:exercise.exercise_id,title:exercise.title,type:exercise.mode==='guided'?'Treino guiado':'Treino autônomo',text:exercise.prompt,context:exercise.works.map(authors).join(' ')});
  function snippet(record,term) {
    const index=Math.max(0,normalize(record.text).indexOf(normalize(term))),start=Math.max(0,index-55),text=record.text.slice(start,start+225),relative=normalize(text).indexOf(normalize(term));
    const highlight=relative>=0?h(text.slice(0,relative))+'<mark>'+h(text.slice(relative,relative+term.length))+'</mark>'+h(text.slice(relative+term.length)):h(text);
    return (start?'…':'')+highlight+(record.text.length>start+225?'…':'');
  }
  function renderResults() {
    const query=state.query.trim(),terms=normalize(query).split(/\s+/).filter(Boolean),results=$('#results');
    results.hidden=!query;$('#page').hidden=!!query;$('#clear-search').hidden=!query;
    if(!query){results.replaceChildren();return;}
    const found=searchRecords.filter(record=>terms.every(term=>normalize(record.title+' '+record.context+' '+record.text).includes(term)));
    const shown=found.slice(0,35);
    results.innerHTML=pageHeading('O que encontramos',query)+'<p class="search-count" role="status">'+found.length+' trecho'+(found.length===1?'':'s')+' encontrado'+(found.length===1?'':'s')+(found.length>shown.length?' · mostrando os primeiros '+shown.length:'')+'</p>'+(found.length?shown.map(record=>'<section class="search-result"><button type="button" data-go="'+record.page+'" data-id="'+h(record.id)+'" data-target="'+h(record.anchor||'')+'"><small>'+h(record.type)+'</small><h2>'+h(record.title)+'</h2><p>'+snippet(record,query.split(/\s+/)[0])+'</p></button></section>').join(''):'<section class="empty"><h2>Nenhum resultado para esta busca</h2><p>Tente um autor, conceito ou outra palavra. Sua resposta de treino continua nesta sessão.</p><button type="button" class="text-button" data-query="">Limpar busca</button></section>');
  }
  function render() {
    document.body.dataset.variant=state.variant;document.body.dataset.page=state.page;$('#variant-select').value=state.variant;nav();
    let content='';
    if(state.page==='home')content=state.variant==='A'?homeA():state.variant==='B'?homeB():homeC();
    else if(state.page==='reading')content=readingPage(resources.get(state.id));
    else if(state.page==='compare')content=comparePage(topics.get(state.id));
    else if(state.page==='practice')content=practicePage(exercises.get(state.id));
    else content=collectionPage(state.page);
    $('#page').innerHTML=content+'<p class="footnote">EAE1244 · Material de estudo para a prova de 19/11/2026.<br>Conteúdo do acervo atual. Consulte as evidências e os limites de cada leitura.</p>';
    renderResults();exposeState();document.title=(variantNames[state.variant])+' · EAE1244';
  }
  function switchVariant(variant) {state.variant=variant;syncURL();render();announce('Interface '+variant+': '+variantNames[variant]+'. O tema, as marcações e o texto foram mantidos.');}
  function setQuery(query) {state.query=query;$('#global-search').value=query;renderResults();exposeState();}
  document.addEventListener('click',event=>{
    const button=event.target.closest('button,a');if(!button)return;
    if(button.hasAttribute('data-go')){event.preventDefault();if(button.dataset.topic)state.topic=button.dataset.topic;go(button.dataset.go,button.dataset.id,button.dataset.target);}
    if(button.hasAttribute('data-page')){event.preventDefault();go(button.dataset.page);}
    if(button.hasAttribute('data-save')){const id=button.dataset.save;state.saved.has(id)?state.saved.delete(id):state.saved.add(id);render();announce(state.saved.has(id)?'Tema adicionado à sua revisão.':'Tema removido da sua revisão.');}
    if(button.hasAttribute('data-query')){setQuery(button.dataset.query);$('#global-search').focus();window.scrollTo(0,0);}
    if(button.hasAttribute('data-anchor')){event.preventDefault();const target=document.getElementById(button.dataset.anchor);target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}
    if(button.hasAttribute('data-share')){$('#share-url').value=location.href;$('#share-dialog').showModal();$('#share-url').select();}
    if(button.hasAttribute('data-download')){const exercise=exercises.get(state.id),checked=state.checks[state.id]||[],answer=state.drafts[state.id]||'',text=exercise.title+'\n\n'+exercise.prompt+'\n\nMinha resposta\n\n'+answer+'\n\nRevisão pessoal\n'+exercise.self_review.map((item,index)=>(checked.includes(index)?'[x] ':'[ ] ')+item.question).join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=exercise.exercise_id+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Download da resposta solicitado.');}
  });
  document.addEventListener('input',event=>{if(event.target.id==='global-search')setQuery(event.target.value);if(event.target.id==='answer'){state.drafts[state.id]=event.target.value;$('#answer-status').textContent='Texto mantido nesta sessão. Consulte uma leitura e volte quando precisar.';exposeState();}});
  document.addEventListener('change',event=>{if(event.target.hasAttribute('data-check')){const checks=new Set(state.checks[state.id]||[]),index=Number(event.target.dataset.check);event.target.checked?checks.add(index):checks.delete(index);state.checks[state.id]=[...checks];exposeState();}});
  $('#clear-search').addEventListener('click',()=>{setQuery('');$('#global-search').focus();});
  $('#variant-select').addEventListener('change',event=>switchVariant(event.target.value));
  $('#variant-prev').addEventListener('click',()=>switchVariant(variants[(variants.indexOf(state.variant)+2)%3]));
  $('#variant-next').addEventListener('click',()=>switchVariant(variants[(variants.indexOf(state.variant)+1)%3]));
  document.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,select,[contenteditable],dialog'))return;if(event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();switchVariant(variants[(variants.indexOf(state.variant)+(event.key==='ArrowRight'?1:2))%3]);}});
  $('#theme-toggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyTheme();exposeState();});
  function applyTheme(){document.documentElement.style.colorScheme=state.theme;$('#theme-toggle').innerHTML=icon(state.theme==='dark'?'sun':'moon');$('#theme-toggle').setAttribute('aria-label',state.theme==='dark'?'Usar aparência clara':'Usar aparência escura');}
  window.addEventListener('popstate',()=>{state.variant=new URLSearchParams(location.search).get('variant')||'B';readRoute();render();});
  document.querySelectorAll('[data-icon]').forEach(element=>{element.innerHTML=icon(element.dataset.icon);});
  readRoute();applyTheme();render();
})();
