(function () {
  'use strict';
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function searchDocs(docs, query) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return docs.filter(doc => terms.every(t => normalize(doc.title + ' ' + doc.text).includes(t))).map(doc => {
      const index = Math.max(0, normalize(doc.text).indexOf(terms[0]));
      const start = Math.max(0, index - 65);
      return {...doc, snippet: (start ? '…' : '') + doc.text.slice(start, start + 205) + (doc.text.length > start + 205 ? '…' : '')};
    });
  }
  function createDraftStore(storage) {
    let drafts = Object.create(null), available = !!storage;
    try {
      const saved = JSON.parse(storage?.getItem('eae1244:practice:v1') || 'null');
      if (saved?.schema_version === 1 && saved.drafts && typeof saved.drafts === 'object') {
        for (const [id, value] of Object.entries(saved.drafts)) {
          if (value && typeof value.answer === 'string' && Array.isArray(value.checks) && value.checks.every(c => typeof c === 'string')) drafts[id] = value;
        }
      }
    } catch (_) { available = false; }
    return {
      get available() { return available; },
      get(id) { return drafts[id] || {answer: '', checks: []}; },
      update(id, patch) {
        drafts[id] = {...this.get(id), ...patch};
        try { if (!storage) throw Error('Unavailable'); storage.setItem('eae1244:practice:v1', JSON.stringify({schema_version: 1, drafts})); available = true; }
        catch (_) { available = false; }
        return available;
      }
    };
  }
  function createStudyStore(storage) {
    const stringMap = value => Object.fromEntries(Object.entries(value && typeof value==='object' ? value : {}).filter(([,item])=>typeof item==='string'));
    function clean(value={}) {
      const last=value.last;
      return {schema_version:1, saved:Array.isArray(value.saved)?[...new Set(value.saved.filter(id=>typeof id==='string'))]:[],
        last:last && ['caderno','atlas','praticar'].includes(last.view) && typeof last.id==='string'?{view:last.view,id:last.id}:null,
        topic:typeof value.topic==='string'?value.topic:null, readings:stringMap(value.readings),exercises:stringMap(value.exercises),
        positions:Object.fromEntries(Object.entries(value.positions && typeof value.positions==='object'?value.positions:{}).filter(([,position])=>Number.isFinite(position)&&position>=0)),
        theme:['light','dark','system'].includes(value.theme)?value.theme:'system',
        filter:typeof value.filter==='string' && /^(priority|all|\d+)$/.test(value.filter)?value.filter:'priority'};
    }
    let state=clean(),available=!!storage;
    try { const saved=JSON.parse(storage?.getItem('eae1244:study:v1')||'null');if(saved?.schema_version===1)state=clean(saved); }
    catch(_){available=false;}
    return {get available(){return available;},get(){return state;},update(patch){
      state=clean({...state,...patch});
      try {if(!storage)throw Error('Unavailable');storage.setItem('eae1244:study:v1',JSON.stringify(state));available=true;}
      catch(_){available=false;}return available;
    }};
  }
  function relatedTopics(resource, allTopics) {
    const distance=topic=>topic.lessons.filter(n=>!resource.lessons.includes(n)).length;
    return allTopics.filter(t=>t.works.includes(resource.id)).sort((a,b)=>distance(a)-distance(b)||a.works.length-b.works.length);
  }
  function studyExercise(rid, related, allExercises) {
    const candidates=allExercises.filter(e=>e.works.includes(rid));
    const primary=candidates.filter(e=>e.debate_id===related[0]?.debate_id);
    return primary.find(e=>e.mode==='guided')||primary[0]||candidates.find(e=>e.mode==='guided')||candidates[0];
  }
  function buildSearchDocs(data, readingTitle=resource=>resource.title) {
    const docs=[],works=new Map(data.resources.map(resource=>[resource.id,resource]));
    const text=value=>{if(typeof value==='string')return value;if(Array.isArray(value))return value.map(text).join(' ');if(value&&typeof value==='object')return Object.entries(value).filter(([key])=>!['refs','file_id','resource_id','basis'].includes(key)).map(([,value])=>text(value)).join(' ');return '';};
    const readingSections={thesis:'tese-central',question:'tese-central',argument:'o-argumento-passo-a-passo',mechanisms:'mecanismos-em-jogo',concepts:'conceitos-para-a-resposta',cases:'casos-e-comparacoes',evidence:'evidencias-e-resultados',tables:'tabelas',limits:'limites-e-ressalvas',professor_emphasis:'enfases-do-professor',figures_note:'figuras-e-tabelas'};
    for(const resource of data.resources.filter(resource=>resource.kind==='reading')){
      const base={view:'caderno',id:resource.id,title:readingTitle(resource),type:resource.summary?'Leitura':'Resumo pendente'},context=resource.title+' '+resource.authors.join(' ')+' Aula '+resource.lessons.join(' ');
      if(resource.summary){for(const [field,section]of Object.entries(readingSections))if(resource.summary[field])docs.push({...base,section,text:context+' '+text(resource.summary[field])});}
      else docs.push({...base,text:context});
    }
    const atlasSections={question:'',thesis_statement:'',positions:'o-que-cada-leitura-afirma',relations:'como-as-leituras-se-relacionam',mechanism_matrix:'mapa-dos-mecanismos',cases:'casos-para-sustentar-a-comparacao',context_differences:'diferencas-de-contexto',verdict_outline:'um-caminho-para-a-resposta'};
    for(const topic of data.atlas)for(const[field,section]of Object.entries(atlasSections))if(topic[field])docs.push({view:'atlas',id:topic.debate_id,title:topic.title,type:'Comparação',section,text:text(topic[field])+' '+topic.works.map(id=>works.get(id)?.authors.join(' ')||'').join(' ')});
    for(const exercise of data.exercises)docs.push({view:'praticar',id:exercise.exercise_id,title:exercise.title,type:exercise.mode==='guided'?'Treino guiado':'Treino autônomo',text:exercise.prompt+' '+exercise.works.map(id=>works.get(id)?.authors.join(' ')||'').join(' ')+' Aula '+exercise.lessons.join(' ')});
    return docs;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {normalize, searchDocs, buildSearchDocs, createDraftStore, createStudyStore, relatedTopics, studyExercise}; return; }
  const $ = selector => document.querySelector(selector);
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
  let data;
  try { data = JSON.parse($('#guide-data').textContent); } catch (_) { $('#article').append(el('p', 'Não foi possível abrir os dados do guia. Use uma cópia íntegra do pacote.', 'notice')); return; }
  const resources = new Map(data.resources.map(r => [r.id, r]));
  const topics = new Map(data.atlas.map(t => [t.debate_id, t]));
  const exercises = new Map(data.exercises.map(e => [e.exercise_id, e]));
  const byFile = data.files;
  const labels = {cause:'Causa', transmitter:'Transmissão', political_economy:'Economia política', other:'Outro papel', absent:'Não tratado no material usado', converge:'Convergência', diverge:'Divergência', context:'Contexto', supports:'Sustenta a tese', rejects:'Rejeita a tese', qualifies:'Qualifica a tese'};
  const shortTitles = {'6577587':'Mobilização para a Segunda Guerra','6601122':'O ouro e Bretton Woods','6601124':'O fim de Bretton Woods','6601125':'O sistema de Bretton Woods','6601131':'O crescimento na Era de Ouro','6614378':'Ascensão e declínio soviético','6614379':'O colapso do planejamento central','6614380':'Estado e investimento no Leste Asiático','6614388':'Capital humano e o futuro da China','6614394':'Crise e mudança','6614400':'Fluxos de capital e crises financeiras','6614390':'Industrialização latino-americana','6614395':'Dívida e retorno ao mercado','6614397':'A economia mundial nos anos 1990'};
  const title = resource => shortTitles[resource.id.split('-').pop()] || resource.title;
  const author = rid => resources.get(rid)?.authors.join(', ') || resources.get(rid)?.title || 'Leitura';
  const lessons = values => 'Aula' + (values.length > 1 ? 's ' : ' ') + values.join(', ');
  let storage=null;try{storage=window.localStorage;}catch(_){}
  const study=createStudyStore(storage);
  const drafts=createDraftStore(storage);
  let state = {view:'inicio',id:'all'},context=topics.has(study.get().topic)?study.get().topic:null,lastSearch=null;
  const topicNames={'guerra-e-mobilizacao':'Guerra e mobilização','fim-bretton-woods':'O fim de Bretton Woods','crescimento-era-de-ouro':'O crescimento na Era de Ouro','planejamento-sovietico':'Planejamento soviético','estado-e-industrializacao':'Estado e industrialização','capital-humano-e-convergencia':'Capital humano e convergência','crise-da-divida-e-reformas':'Dívida e reformas','crises-financeiras-pos-1971':'Integração e crises financeiras'};
  const orderedTopics=[...data.atlas].sort((a,b)=>Object.keys(topicNames).indexOf(a.debate_id)-Object.keys(topicNames).indexOf(b.debate_id));
  const content = $('#article');
  function button(text, action, className='link-button') { const b = el('button', text, className); b.type='button'; b.addEventListener('click',action); return b; }
  function uiIcon(name) {
    const span=el('span',null,'ui-icon');span.setAttribute('aria-hidden','true');
    // These are repository-owned Phosphor UI assets, never course or visitor text.
    const source=data.icons?.[name];if(source){const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;svg.setAttribute('focusable','false');span.append(document.importNode(svg,true));}
    return span;
  }
  function studyUpdate(patch) {
    const saved=study.update(patch);
    $('#study-status').textContent=saved?'':'Salvamento do percurso indisponível. As marcações e a navegação ficam apenas nesta sessão; baixe suas respostas.';
    return saved;
  }
  function rememberPosition() {
    if(['caderno','atlas','praticar'].includes(state.view)&&!content.hidden)studyUpdate({positions:{...study.get().positions,[state.view+'/'+state.id]:window.scrollY}});
  }
  function go(view, id='all', options={}) {
    rememberPosition();
    if(topics.has(options.topic))context=options.topic;
    if(view==='atlas')context=id;
    if(view==='praticar')context=exercises.get(id)?.debate_id||context;
    if(view==='caderno'&&!topics.get(context)?.works.includes(id))context=relatedTopics(resources.get(id),data.atlas)[0]?.debate_id||null;
    lastSearch=options.query?{query:options.query}:null;
    $('#search').value=''; $('#results').hidden=true; $('#clear-search').hidden=true; content.hidden=false;
    const params=new URLSearchParams();if(context)params.set('tema',context);if(options.section)params.set('secao',options.section);
    const hash = '#' + view + '/' + encodeURIComponent(id)+(params.size?'?'+params:'');
    if (location.hash === hash) showRoute(true); else location.hash = hash;
  }
  function section(name) { const s=el('section',null,'content-section');s.id=normalize(name).replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');s.append(el('h2',name)); content.append(s); return s; }
  function topicName(topic){return topicNames[topic.debate_id]||topic.title;}
  function topicExercise(topic){const remembered=exercises.get(study.get().exercises[topic.debate_id]);return remembered?.debate_id===topic.debate_id?remembered:data.exercises.find(e=>e.debate_id===topic.debate_id&&e.mode==='guided');}
  function topicReading(topic){const remembered=study.get().readings[topic.debate_id];return topic.works.includes(remembered)?remembered:topic.works[0];}
  function reviewButton(topic) {
    const b=button('',()=>{const saved=new Set(study.get().saved);saved.has(topic.debate_id)?saved.delete(topic.debate_id):saved.add(topic.debate_id);studyUpdate({saved:[...saved]});
      document.querySelectorAll('[data-save]').forEach(control=>{const active=saved.has(control.dataset.save);control.setAttribute('aria-pressed',String(active));control.textContent=active?'Na revisão':'Quero rever';});if(state.view==='rever')showRoute();},'review-toggle');
    b.dataset.save=topic.debate_id;const saved=study.get().saved.includes(topic.debate_id);b.textContent=saved?'Na revisão':'Quero rever';b.setAttribute('aria-pressed',String(saved));return b;
  }
  function validRoute(route){return route&&(route.view==='caderno'?resources.has(route.id):route.view==='atlas'?topics.has(route.id):route.view==='praticar'?exercises.has(route.id):false);}
  function home(reviewOnly=false) {
    heading('',reviewOnly?'O que você quer rever':'Uma aula, um percurso.',reviewOnly?'Seus temas marcados para voltar com mais atenção.':'Leia, compare os argumentos e construa sua resposta.');
    if(!reviewOnly){const last=study.get().last,box=el('section',null,'resume-study');box.append(el('h2',validRoute(last)?'Continuar de onde parei':'Seu estudo começa aqui'));
      if(validRoute(last)){const name=last.view==='caderno'?title(resources.get(last.id)):last.view==='atlas'?topicName(topics.get(last.id)):exercises.get(last.id).title;box.append(el('p',name),button('Retomar →',()=>go(last.view,last.id,{topic:study.get().topic}),'primary-button'));}
      else box.append(el('p','Escolha um percurso abaixo para começar. Você pode consultar as leituras e voltar à sua resposta a qualquer momento.'));
      content.append(box);
    }
    const list=el('div',null,'lesson-journey'),filter=$('#lesson').value;
    const selected=orderedTopics.filter(t=>(!reviewOnly||study.get().saved.includes(t.debate_id))&&(filter==='priority'||filter==='all'||t.lessons.includes(Number(filter))));
    for(const topic of selected){const row=el('section',null,'lesson-row'),meta=el('p',lessons(topic.lessons),'lesson-number'),description=el('div'),actions=el('div',null,'lesson-actions');description.append(el('h2',topicName(topic)),el('p',topic.works.map(author).join(' / ')));
      const start=button('Começar →',()=>go('caderno',topicReading(topic),{topic:topic.debate_id}),'primary-button');start.setAttribute('aria-label','Começar: '+topicName(topic));actions.append(start,reviewButton(topic));row.append(meta,description,actions);list.append(row);}
    content.append(list);
    if(!selected.length)content.append(el('p',reviewOnly?'Sua lista está vazia neste recorte. Marque “Quero rever” em um percurso.':'Nenhum percurso neste recorte. Escolha outra aula ou consulte todas as leituras.','notice'));
    if(!reviewOnly){const links=el('div',null,'quick-links');links.append(button('Explorar todas as leituras',()=>go('leituras')),button('Ver todos os exercícios',()=>go('exercicios')));content.append(links,el('p',data.counts.complete+' leituras resumidas; '+data.counts.pending+' resumos anteriores pendentes. As marcações e os rascunhos são pessoais, neste navegador.','storage-note'));}
  }
  function collection(view) {
    if(view==='leituras'){heading('','Estudar leituras','Entenda a tese, os argumentos e os conceitos de cada texto.');for(const resource of data.resources.filter(r=>r.kind==='reading')){const row=el('section',null,'collection-item');row.append(el('p',lessons(resource.lessons),'byline'),el('h2',title(resource)),el('p',resource.summary?resource.authors.join(', '):'Resumo pendente'),button(resource.summary?'Estudar leitura →':'Ver original e estado →',()=>go('caderno',resource.id)));content.append(row);}}
    if(view==='temas'){heading('','Comparar autores','Concordâncias, divergências e diferenças de contexto sustentadas pelas leituras.');for(const topic of orderedTopics){const row=el('section',null,'collection-item');row.append(el('p',lessons(topic.lessons),'byline'),el('h2',topicName(topic)),el('p',topic.question),button(topic.works.length===1?'Comparar casos →':'Comparar autores →',()=>go('atlas',topic.debate_id)));content.append(row);}}
    if(view==='exercicios'){heading('','Treinar respostas','Escreva primeiro. Consulte os apoios quando precisar e revise seus argumentos.');for(const topic of orderedTopics){const row=el('section',null,'collection-item');row.append(el('h2',topicName(topic)));for(const exercise of data.exercises.filter(e=>e.debate_id===topic.debate_id))row.append(button((exercise.mode==='guided'?'Guiado: ':'Autônomo: ')+exercise.title,()=>go('praticar',exercise.exercise_id),'exercise-choice'));content.append(row);}}
  }
  function journey() {
    const topic=topics.get(context);if(!topic||!['caderno','atlas','praticar'].includes(state.view))return;
    const box=el('section',null,'journey-context'),nav=el('nav',null,'journey-steps');nav.setAttribute('aria-label','Percurso desta aula');box.append(el('p',lessons(topic.lessons),'byline'),el('h2',topicName(topic)));
    for(const [label,view,id] of [['Estudar leituras','caderno',topicReading(topic)],[topic.works.length===1?'Comparar casos':'Comparar autores','atlas',topic.debate_id],['Treinar respostas','praticar',topicExercise(topic).exercise_id]]){const b=button(label,()=>go(view,id,{topic:topic.debate_id}),'journey-step');if(state.view===view)b.setAttribute('aria-current','step');nav.append(b);}
    nav.append(reviewButton(topic),button('Compartilhar',share,'journey-step'));box.append(nav);content.append(box);
  }
  function share() {
    $('#share-url').value=location.href;
    $('#share-note').textContent=location.protocol==='file:'?'Este é um arquivo local. Para compartilhar com outras pessoas, use o endereço da versão publicada.':'Copie este link para abrir o mesmo conteúdo. Rascunhos e marcações pessoais não são incluídos.';
    $('#share-dialog').showModal();$('#share-url').select();
  }
  function evidence(refs) {
    if (!refs?.length) return document.createDocumentFragment();
    const box=el('details',null,'evidence');
    const unique=[...new Map(refs.map(r=>[r.file_id+':'+r.pdf_page+':'+r.quote,r])).values()];
    box.append(el('summary', 'Ver evidências · '+unique.length));
    let loaded=false;
    box.addEventListener('toggle',()=>{
      if(!box.open||loaded)return;loaded=true;
      for (const ref of unique) {
        const file=byFile[ref.file_id];
        box.append(el('blockquote',ref.quote));
        if (file) { const a=el('a',file.label+' · página física '+ref.pdf_page); a.href=file.href+'#page='+ref.pdf_page; a.target='_blank'; a.rel='noopener'; box.append(a); }
      }
    });
    return box;
  }
  function originalLinks(resource) {
    const box=el('div',null,'originals');
    for (const file of resource.files) { const a=el('a',file.type==='application/pdf'?'Abrir PDF original':'Abrir arquivo original'); a.href=file.href; a.target='_blank'; a.rel='noopener'; a.title=file.name; box.append(a); }
    return box;
  }
  function heading(kicker, name, subtitle) { content.append(el('p',kicker,'eyebrow'),el('h1',name)); if(subtitle) content.append(el('p',subtitle,'byline')); }
  function listSection(name, items, field, ordered=false) {
    if (!items?.length) return;
    const box=section(name), list=el(ordered?'ol':'div',null,ordered?'argument':'items');
    for (const item of items) { const entry=el(field==='definition'?'details':ordered?'li':'div',null,'item');if(field==='definition')entry.classList.add('concept-detail'); if(item.kind) entry.append(el('span',labels[item.kind]||item.kind,'kind')); if(item.name||item.term) entry.append(el(field==='definition'?'summary':'h3',item.name||item.term)); if(item.period) entry.append(el('p',item.period,'byline')); entry.append(el('p',item[field]),evidence(item.refs)); list.append(entry); }
    box.append(list);
  }
  function reading(resource) {
    heading(lessons(resource.lessons)+' · Estudar leituras',title(resource),resource.authors.join(' · '));
    const meta=el('details',null,'source-meta'); meta.append(el('summary','Dados da leitura'),el('p',resource.title)); content.append(meta,originalLinks(resource));
    if(resource.files.some(f=>!f.reviewed)) content.append(el('p','A revisão da extração desta fonte ainda tem pendências. O original está disponível.','notice'));
    const entry=resource.summary;
    if(!entry){content.append(el('p','Resumo pendente. Esta leitura está no acervo, mas ainda não foi resumida. As aulas 17–28 concentram o conteúdo completo desta entrega.','notice'));return;}
    if(entry.status!=='complete') content.append(el('p','Resumo parcial. Confira os limites e o original.','notice'));
    const thesis=el('p',entry.thesis,'lead');thesis.id='tese-central';content.append(thesis);
    if(entry.question) content.append(el('p',entry.question,'question'));
    const related=relatedTopics(resource,data.atlas);
    if(related.length){const links=el('div',null,'quick-links'),primary=related.find(topic=>topic.debate_id===context)||related[0],exercise=topicExercise(primary);links.append(button('Comparar leituras →',()=>go('atlas',primary.debate_id)));if(exercise)links.append(button('Treinar resposta →',()=>go('praticar',exercise.exercise_id)));content.append(links);}
    listSection('O argumento, passo a passo',entry.argument,'claim',true);
    listSection('Mecanismos em jogo',entry.mechanisms,'description');
    listSection('Conceitos para a resposta',entry.concepts,'definition');
    listSection('Casos e comparações',entry.cases,'outcome');
    listSection('Evidências e resultados',entry.evidence,'fact');
    if(entry.tables?.length){const box=section('Tabelas');for(const t of entry.tables){const figure=el('figure',null,'data-table');figure.append(el('figcaption',t.label+' · '+t.title));if(t.unit)figure.append(el('p',t.unit,'byline'));const scroll=el('div',null,'table-scroll'),table=el('table'),head=el('tr');t.columns.forEach(c=>{const th=el('th',c);th.scope='col';head.append(th);});const thead=el('thead'),tbody=el('tbody');thead.append(head);for(const row of t.rows){const tr=el('tr');row.forEach((c,i)=>{const cell=el(i?'td':'th',c);if(!i)cell.scope='row';tr.append(cell);});tbody.append(tr);}table.append(thead,tbody);scroll.append(table);figure.append(scroll,el('p',t.supports,'table-supports'));if(t.note)figure.append(el('p',t.note,'table-note'));const file=byFile[t.file_id];if(file){const a=el('a','Conferir no original · página física '+t.pdf_page);a.href=file.href+'#page='+t.pdf_page;a.target='_blank';a.rel='noopener';figure.append(a);}box.append(figure);}}
    if(entry.limits?.length){const box=section('Limites e ressalvas'),ul=el('ul',null,'limits');entry.limits.forEach(t=>ul.append(el('li',t)));box.append(ul);}
    listSection('Ênfases do professor',entry.professor_emphasis,'point');
    if(entry.figures_note?.length){const box=section('Figuras e tabelas');entry.figures_note.forEach(t=>box.append(el('p',t)));}
    if(related.length){const box=section('Continuar relacionando'),links=el('div',null,'related');related.forEach(t=>links.append(button(t.title,()=>go('atlas',t.debate_id))));box.append(links);}
    const toc=el('nav',null,'reading-toc');toc.setAttribute('aria-label','Nesta leitura');toc.append(el('strong','Nesta leitura'));
    for(const s of content.querySelectorAll('.content-section')){const link=el('a',s.querySelector('h2').textContent);link.href='#'+s.id;link.addEventListener('click',event=>{event.preventDefault();s.setAttribute('tabindex','-1');s.focus({preventScroll:true});s.scrollIntoView({block:'start'});});toc.append(link);}
    thesis.before(toc);
  }
  function archive() {
    heading('Acervo','Originais e apoios','44 arquivos preservados · 31 leituras e 13 materiais de apoio');
    content.append(el('p','Os links abrem os arquivos do pacote. Baixado, resumido e revisado são estados diferentes.','question'));
    for(const resource of data.resources){const box=el('div',null,'archive-item');box.append(el('h2',title(resource)),el('p',lessons(resource.lessons)+' · '+(resource.kind==='reading'?(resource.summary?'Com resumo':'Resumo pendente'):'Material de apoio')),originalLinks(resource));if(resource.kind==='reading')box.append(button('Ver no caderno',()=>go('caderno',resource.id)));content.append(box);}
  }
  function basisEvidence(bases) {
    const refs=[], links=el('div',null,'basis-links'), seen=new Set();
    for(const base of bases||[]) {
      if(base.module==='atlas') {
        const topic=topics.get(base.entry_id);
        const item=base.section==='positions'?topic?.positions.find(p=>p.resource_id===base.item):topic?.relations.find(r=>r.id===base.item);
        if(item?.refs)refs.push(...item.refs);
        const key='atlas:'+base.entry_id;
        if(!seen.has(key)){links.append(button('Consultar: '+topic.title,()=>go('atlas',base.entry_id)));seen.add(key);}
      } else {
        const resource=resources.get(base.entry_id), item=resource?.summary?.[base.section]?.[base.item];
        if(item?.refs)refs.push(...item.refs);
        const key='caderno:'+base.entry_id;
        if(resource&&!seen.has(key)){links.append(button('Consultar: '+title(resource),()=>go('caderno',base.entry_id)));seen.add(key);}
      }
    }
    const fragment=document.createDocumentFragment();fragment.append(evidence(refs),links);return fragment;
  }
  function answerOutline(parent, outline, office=false) {
    const names={thesis:'Tese possível',arguments_for:'Argumentos a desenvolver',counterarguments:'Contrapontos e ressalvas',conclusion:'Conclusão possível'};
    parent.append(el('p','Interpretação de estudo. Outras conclusões fundamentadas são possíveis.','interpretation'));
    for(const key of Object.keys(names)) {
      parent.append(el('h3',names[key]));
      for(const point of outline[key]) {
        const box=el('div',null,'outline-point');box.append(el('p',point.text));
        if(office)box.append(basisEvidence(point.basis));
        parent.append(box);
      }
    }
  }
  function atlasView(topic) {
    heading(lessons(topic.lessons)+' · Comparar autores',topic.title,topic.entry_type==='single_reading'?'Uma leitura, comparação entre casos':topic.works.length+' leituras em relação');
    content.append(el('p',topic.question,'question'),el('p',topic.thesis_statement,'lead'));
    const links=el('div',null,'quick-links');
    topic.works.forEach(rid=>links.append(button(title(resources.get(rid)),()=>go('caderno',rid))));
    links.append(button('Treinar resposta →',()=>go('praticar',topicExercise(topic).exercise_id)));content.append(links);
    const positions=section('O que cada leitura afirma');
    for(const position of topic.positions){const box=el('div',null,'item');box.append(el('span',labels[position.stance]||'Outro enfoque','kind'),el('h3',author(position.resource_id)),el('p',position.summary),evidence(position.refs));positions.append(box);}
    if(topic.relations.length){const box=section('Como as leituras se relacionam');for(const relation of topic.relations){const item=el('div',null,'item');item.append(el('span',labels[relation.type],'kind'),el('h3',relation.between.map(author).join(' × ')),el('p',relation.text),evidence(relation.refs));box.append(item);}}
    const matrix=section('Mapa dos mecanismos');matrix.append(el('p','Classificação interpretativa. Abra um mecanismo para comparar seu papel nas leituras.','interpretation'));
    for(const row of topic.mechanism_matrix.rows){const detail=el('details',null,'mechanism-row');detail.append(el('summary',row.mechanism));const grid=el('div',null,'matrix-grid');for(const cell of row.classifications){const item=el('div',null,'matrix-cell');item.append(el('h3',author(cell.resource_id)),el('span',labels[cell.kind],'kind'),el('p',cell.explanation),evidence(cell.refs));grid.append(item);}detail.append(grid);matrix.append(detail);}
    const cases=section('Casos para sustentar a comparação');
    for(const c of topic.cases){const box=el('div',null,'item');box.append(el('h3',c.name));for(const view of c.readings){box.append(el('p',author(view.resource_id),'case-author'),el('p',view.text),evidence(view.refs));}cases.append(box);}
    listSection('Diferenças de contexto',topic.context_differences,'text');
    answerOutline(section('Um caminho para a resposta'),topic.verdict_outline);
  }
  function practice(exercise) {
    const mode=exercise.mode==='guided'?'Guiado':'Autônomo';
    heading(lessons(exercise.lessons)+' · Treino '+mode.toLowerCase(),exercise.title,'Questão de estudo · '+topics.get(exercise.debate_id).title);
    content.append(el('p',exercise.prompt,'lead'));
    const works=el('div',null,'quick-links');exercise.works.forEach(rid=>works.append(button(title(resources.get(rid)),()=>go('caderno',rid))));content.append(works);
    if(exercise.planning_prompts.length){const planning=section('Antes de escrever'),ol=el('ol');exercise.planning_prompts.forEach(t=>ol.append(el('li',t)));planning.append(ol);}
    const writing=section('Sua resposta'),label=el('label','Construa sua tese e desenvolva os argumentos.','editor-label');label.htmlFor='answer';
    const textarea=el('textarea');textarea.id='answer';textarea.rows=13;textarea.placeholder='Comece avaliando a afirmação. Depois relacione autores, mecanismos e casos.';textarea.value=drafts.get(exercise.exercise_id).answer;
    const status=el('p',null,'save-status');status.id='save-status';status.setAttribute('role','status');
    function statusText(saved){const value=saved?'Rascunho salvo neste navegador.':'Salvamento indisponível. O texto continua nesta sessão; baixe uma cópia.';if(status.textContent!==value)status.textContent=value;status.classList.toggle('storage-warning',!saved);}
    const initialDraft=drafts.get(exercise.exercise_id);
    if(initialDraft.answer||initialDraft.checks.length||!drafts.available)statusText(drafts.available);
    else status.textContent='Rascunho vazio. Comece a escrever ou baixe sua resposta para guardá-la.';
    textarea.addEventListener('input',()=>statusText(drafts.update(exercise.exercise_id,{answer:textarea.value})));
    writing.append(label,textarea,status);
    const download=button('Baixar minha resposta',()=>{const checks=drafts.get(exercise.exercise_id).checks;const text=exercise.title+'\n\n'+exercise.prompt+'\n\nMinha resposta\n\n'+textarea.value+'\n\nRevisão pessoal\n'+exercise.self_review.map(c=>(checks.includes(c.criterion)?'[x] ':'[ ] ')+c.question).join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=el('a');a.href=url;a.download=exercise.exercise_id+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    writing.append(download,el('p','Os rascunhos ficam neste navegador. Trocar de navegador ou mover o pacote pode não transportar o texto. Baixe uma cópia para guardá-lo.','storage-note'));
    const support=section('Depois da tentativa');
    const solution=el('details',null,'support-panel');solution.id='solution';solution.append(el('summary','Abrir roteiro de resposta'));answerOutline(solution,exercise.answer_outline,true);support.append(solution);
    const example=el('details',null,'support-panel');example.id='example';example.append(el('summary','Ver parágrafo de exemplo'),el('p',exercise.worked_paragraph.text,'worked-example'),el('p',exercise.worked_paragraph.commentary,'interpretation'),basisEvidence(exercise.worked_paragraph.basis));support.append(example);
    const mistakes=el('details',null,'support-panel');mistakes.append(el('summary','Rever erros frequentes'));exercise.common_mistakes.forEach(m=>{mistakes.append(el('h3',m.mistake),el('p',m.revision),basisEvidence(m.basis));});support.append(mistakes);
    const review=section('Revisar a própria resposta');review.append(el('p','Marque o que você conferiu. Esta revisão não gera nota.','interpretation'));
    const checks=drafts.get(exercise.exercise_id).checks;
    for(const criterion of exercise.self_review){const l=el('label',null,'review-item'),input=el('input');input.type='checkbox';input.checked=checks.includes(criterion.criterion);input.addEventListener('change',()=>{const set=new Set(drafts.get(exercise.exercise_id).checks);input.checked?set.add(criterion.criterion):set.delete(criterion.criterion);statusText(drafts.update(exercise.exercise_id,{checks:[...set]}));});l.append(input,el('span',criterion.question));review.append(l);}
    const alternative=data.exercises.find(e=>e.debate_id===exercise.debate_id&&e.exercise_id!==exercise.exercise_id);
    const next=section('Continuar o estudo'),links=el('div',null,'related');links.append(button('Voltar à comparação',()=>go('atlas',exercise.debate_id)));if(alternative)links.append(button(alternative.mode==='guided'?'Tentar a questão guiada':'Tentar a questão autônoma',()=>go('praticar',alternative.exercise_id)));next.append(links);
  }
  function menu() {
    const target=$('#menu');target.replaceChildren();
    const filter=$('#lesson').value;
    const visible=values=>filter==='all'||(filter==='priority'?values.some(n=>n>=17&&n<=28):values.includes(Number(filter)));
    const topicOrder=['guerra-e-mobilizacao','fim-bretton-woods','crescimento-era-de-ouro','planejamento-sovietico','estado-e-industrializacao','capital-humano-e-convergencia','crise-da-divida-e-reformas','crises-financeiras-pos-1971'];
    let items=[];
    if(['caderno','acervo','leituras','inicio','rever'].includes(state.view)) items=data.resources.filter(r=>r.kind==='reading'&&visible(r.lessons)).map(r=>({id:r.id,name:title(r),detail:r.summary?r.authors.join(', '):'Resumo pendente',lessons:r.lessons,view:'caderno'}));
    if(['atlas','temas'].includes(state.view))items=data.atlas.filter(t=>visible(t.lessons)).map(t=>({id:t.debate_id,name:t.title,detail:t.works.length===1?'Leitura única':t.works.length+' leituras',lessons:t.lessons,view:'atlas',order:topicOrder.indexOf(t.debate_id)*2}));
    if(['praticar','exercicios'].includes(state.view))items=data.exercises.filter(e=>visible(e.lessons)).map(e=>({id:e.exercise_id,name:e.title,detail:e.mode==='guided'?'Guiado':'Autônomo',lessons:e.lessons,view:'praticar',order:topicOrder.indexOf(e.debate_id)*2+(e.mode==='guided'?0:1)}));
    if(!items.length)target.append(el('p','Nenhum conteúdo nesta área para o recorte escolhido.','empty-note'));
    for(const item of items.sort((a,b)=>(a.order??Math.min(...a.lessons))-(b.order??Math.min(...b.lessons)))){const b=button(item.name,()=>{go(item.view,item.id);if(innerWidth<=760) $('.index-panel').open=false;},'menu-item'); b.replaceChildren(el('strong',item.name),el('small',lessons(item.lessons)+' · '+item.detail));if(state.id===item.id)b.setAttribute('aria-current','page');target.append(b);}
  }
  function showRoute(focus=false) {
    const [path,query='']=location.hash.slice(1).split('?'),params=new URLSearchParams(query);
    const [view,id]=path.split('/');
    let decoded;try{decoded=id?decodeURIComponent(id):state.id;}catch(_){decoded=state.id;}
    if(view==='caderno'&&resources.has(decoded)) state={view,id:decoded};
    else if(view==='atlas'&&topics.has(decoded))state={view,id:decoded};
    else if(view==='praticar'&&exercises.has(decoded))state={view,id:decoded};
    else if(view==='acervo') state={view:'acervo',id:'all'};
    else if(['inicio','rever','leituras','temas','exercicios'].includes(view))state={view,id:'all'};
    document.body.dataset.view=state.view;
    const requested=topics.get(params.get('tema'));
    if(state.view==='atlas')context=state.id;
    if(state.view==='praticar')context=exercises.get(state.id).debate_id;
    if(state.view==='caderno')context=requested?.works.includes(state.id)?requested.debate_id:topics.get(context)?.works.includes(state.id)?context:relatedTopics(resources.get(state.id),data.atlas)[0]?.debate_id||null;
    if(['caderno','atlas','praticar'].includes(state.view)){
      const patch={last:{...state},topic:context};
      if(context&&state.view==='caderno')patch.readings={...study.get().readings,[context]:state.id};
      if(context&&state.view==='praticar')patch.exercises={...study.get().exercises,[context]:state.id};
      studyUpdate(patch);
    }
    content.replaceChildren();content.hidden=false;$('#results').hidden=true;
    if(lastSearch)content.append(button('← Voltar à busca',()=>{$('#search').value=lastSearch.query;search();$('#search').focus();},'back-search'));
    journey();
    if(state.view==='caderno')reading(resources.get(state.id)); else if(state.view==='atlas')atlasView(topics.get(state.id));else if(state.view==='praticar')practice(exercises.get(state.id));else if(state.view==='acervo')archive();else if(state.view==='inicio'||state.view==='rever')home(state.view==='rever');else collection(state.view);
    const area={leituras:'caderno',temas:'atlas',exercicios:'praticar',acervo:'caderno'}[state.view]||state.view;
    menu();document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===area)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.title=(content.querySelector('h1')?.textContent||'Guia')+' · EAE1244';
    const anchor=params.get('secao');
    requestAnimationFrame(()=>{const target=anchor&&document.getElementById(anchor);if(target){target.querySelectorAll('details.concept-detail').forEach(d=>{d.open=true;});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}else{window.scrollTo(0,study.get().positions[state.view+'/'+state.id]||0);if(focus)$('#content').focus({preventScroll:true});}});
  }
  const nums=[...new Set(data.resources.filter(r=>r.kind==='reading').flatMap(r=>r.lessons))].sort((a,b)=>a-b);
  nums.forEach(n=>{const o=el('option','Aula '+n);o.value=n;$('#lesson').append(o);});
  if([...$('#lesson').options].some(option=>option.value===study.get().filter))$('#lesson').value=study.get().filter;
  $('#lesson').addEventListener('change',()=>{studyUpdate({filter:$('#lesson').value});menu();if(['inicio','rever'].includes(state.view))showRoute();});
  $('#archive').addEventListener('click',()=>go('acervo','all'));
  document.querySelectorAll('[data-view]').forEach(control=>control.addEventListener('click',()=>{
    const view=control.dataset.view,topic=topics.get(context);
    if(topic&&['caderno','atlas','praticar'].includes(state.view)&&['caderno','atlas','praticar'].includes(view))go(view,view==='caderno'?topicReading(topic):view==='atlas'?topic.debate_id:topicExercise(topic).exercise_id,{topic:topic.debate_id});
    else go({caderno:'leituras',atlas:'temas',praticar:'exercicios'}[view]||view);
  }));
  const docs=buildSearchDocs(data,title);
  function search(){const query=$('#search').value.trim(),results=$('#results');results.replaceChildren();$('#clear-search').hidden=!query;content.hidden=!!query;results.hidden=!query;if(!query)return;const matches=searchDocs(docs,query);const status=el('p',matches.length+' trecho'+(matches.length===1?'':'s')+' encontrado'+(matches.length===1?'':'s'),'result-title');status.setAttribute('role','status');results.append(status);if(!matches.length)results.append(el('p','Nenhum resultado. Tente um autor, outra palavra ou limpe a busca.','notice'));for(const match of matches){const b=button('',()=>go(match.view,match.id,{section:match.section,query}),'result');b.append(el('small',match.type),el('h2',match.title),el('p',match.snippet));results.append(b);}}
  $('#search').addEventListener('input',search);
  $('#clear-search').addEventListener('click',()=>{$('#search').value='';search();$('#search').focus();});
  function applyTheme(){const theme=study.get().theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):study.get().theme;document.documentElement.style.colorScheme=theme;$('#theme-toggle').textContent=theme==='dark'?'Aparência clara':'Aparência escura';}
  $('#theme-toggle').addEventListener('click',()=>{studyUpdate({theme:document.documentElement.style.colorScheme==='dark'?'light':'dark'});applyTheme();});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(study.get().theme==='system')applyTheme();});
  document.querySelectorAll('[data-icon]').forEach(node=>node.append(uiIcon(node.dataset.icon)));
  window.addEventListener('hashchange',()=>{rememberPosition();showRoute(true);});
  window.addEventListener('pagehide',rememberPosition);
  applyTheme();
  showRoute();
})();
