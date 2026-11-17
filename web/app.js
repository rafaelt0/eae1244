(function () {
  'use strict';
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function searchDocs(docs, query) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const hits = new Map();
    for (const doc of docs) {
      if (!terms.every(t => normalize(doc.title + ' ' + (doc.context || '') + ' ' + doc.text).includes(t))) continue;
      const body = normalize(doc.text), own = terms.find(t => body.includes(t)), key = doc.view + '/' + doc.id;
      if (hits.has(key) && (hits.get(key).own || !own)) continue;
      let start = Math.max(0, (own ? body.indexOf(own) : 0) - 65);
      if (start > 0) { const boundary = doc.text.indexOf(' ', start); if (boundary > 0 && boundary < start + 32) start = boundary + 1; }
      let end = start + 205;
      if (doc.text.length > end) { const boundary = doc.text.lastIndexOf(' ', end); if (boundary > start + 120) end = boundary; }
      hits.set(key, {...doc, own: !!own, snippet: (start ? '…' : '') + doc.text.slice(start, end) + (doc.text.length > end ? '…' : '')});
    }
    return [...hits.values()].map(({own, ...doc}) => doc);
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
  const hiddenKeys=new Set(['refs','basis','file_id','resource_id','between','works','id','item','debate_id','entry_id','entry_type','exercise_id','module','section','skills','status','depth','mode','criterion']);
  const labelledKeys=new Set(['kind','stance','type']);
  function collectText(value, labels={}){
    if(typeof value==='string')return value;
    if(Array.isArray(value))return value.map(v=>collectText(v,labels)).join(' ');
    if(value&&typeof value==='object')return Object.entries(value).filter(([k])=>!hiddenKeys.has(k)).map(([k,v])=>labelledKeys.has(k)?labels[v]||'':collectText(v,labels)).join(' ');
    return '';
  }
  const sectionId=name=>normalize(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const readingSections=[['Tese',['thesis','question']],['Argumento',['argument']],['Mecanismos',['mechanisms']],['Conceitos',['concepts']],['Casos',['cases']],['Evidências',['evidence']],['Tabelas',['tables']],['Ressalvas',['limits']],['Ênfases do professor',['professor_emphasis']],['Figuras e tabelas',['figures_note']]];
  const atlasSections=[['Proposição',['question','thesis_statement']],['Posições',['positions']],['Relações',['relations']],['Mecanismos',['mechanism_matrix']],['Casos',['cases']],['Diferenças de contexto',['context_differences']],['Apêndice',['verdict_outline']]];
  function buildSearchDocs(data, {title=r=>r.title, labels={}, question=()=>''}={}) {
    const docs=[],works=new Map(data.resources.map(r=>[r.id,r])),names=ids=>ids.map(id=>works.get(id)?.authors.join(' ')||'').join(' ');
    const lessonText=values=>'Aula'+(values.length>1?'s ':' ')+values.join(', ');
    const sections=(base,source,list)=>{for(const [name,fields] of list){const text=collectText(fields.map(f=>source[f]),labels);if(text.trim())docs.push({...base,section:sectionId(name),sectionName:name,text});}};
    for(const r of data.resources.filter(r=>r.kind==='reading')){
      const base={view:'caderno',id:r.id,title:title(r),type:(r.summary?r.authors.join(', '):'Resumo pendente')+' · '+lessonText(r.lessons),context:r.title+' '+r.authors.join(' ')+' '+lessonText(r.lessons)};
      if(r.summary)sections(base,r.summary,readingSections);else docs.push({...base,text:''});
    }
    for(const t of data.atlas)sections({view:'atlas',id:t.debate_id,title:t.title,type:lessonText(t.lessons),context:names(t.works)},t,atlasSections);
    for(const e of data.exercises)docs.push({view:'praticar',id:e.exercise_id,title:question(e)+e.title,type:(e.mode==='guided'?'Guiado':'Autônomo')+' · '+lessonText(e.lessons),context:names(e.works)+' '+lessonText(e.lessons),text:e.prompt});
    return docs;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {normalize, searchDocs, buildSearchDocs, createDraftStore, createStudyStore, relatedTopics, studyExercise, collectText}; return; }
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
  const surname = rid => { const a=resources.get(rid)?.authors||[]; const last=n=>n.split(' ').pop(); return !a.length?title(resources.get(rid)):a.length===1?last(a[0]):a.length===2?last(a[0])+' e '+last(a[1]):last(a[0])+' et al.'; };
  const lessons = values => 'Aula' + (values.length > 1 ? 's ' : ' ') + values.join(', ');
  const lessonSpan = values => { const v=[...values].sort((a,b)=>a-b); return v.length>1&&v.every((n,i)=>!i||n===v[i-1]+1)?v[0]+'–'+v[v.length-1]:v.join(', '); };
  const topicOrder=['guerra-e-mobilizacao','fim-bretton-woods','crescimento-era-de-ouro','planejamento-sovietico','estado-e-industrializacao','capital-humano-e-convergencia','crise-da-divida-e-reformas','crises-financeiras-pos-1971'];
  const exerciseOrder=[...data.exercises].sort((a,b)=>topicOrder.indexOf(a.debate_id)-topicOrder.indexOf(b.debate_id)||(a.mode==='guided'?0:1)-(b.mode==='guided'?0:1));
  const questionNumber=exercise=>exerciseOrder.indexOf(exercise)+1;
  const modeName=exercise=>exercise.mode==='guided'?'Guiado':'Autônomo';
  const orderedTopics=topicOrder.map(id=>topics.get(id)).filter(Boolean).concat(data.atlas.filter(t=>!topicOrder.includes(t.debate_id)));
  const topicNumber=topic=>orderedTopics.indexOf(topic)+1;
  const readingList=data.resources.filter(r=>r.kind==='reading');
  const priority=resource=>resource.lessons.some(n=>n>=17&&n<=28);
  const readingsOrder=[...readingList].sort((a,b)=>(priority(a)?0:1)-(priority(b)?0:1)||Math.min(...a.lessons)-Math.min(...b.lessons)||title(a).localeCompare(title(b),'pt-BR'));
  const contentViews=['caderno','atlas','praticar'];
  const indexViews=['inicio','caderno','atlas','praticar','rever','acervo','ajuda'];
  const areaName={inicio:'Início',caderno:'Caderno',atlas:'Atlas',praticar:'Praticar',rever:'Para rever',acervo:'Acervo',ajuda:'Como usar'};
  function readingStatus(resource) {
    const summary=resource.summary;
    if(!summary) return {key:'pending',label:'Sem resumo',detail:'Original disponível'};
    if(summary.status!=='complete') return {key:'partial',label:'Parcial',detail:'Extração em revisão'};
    if(summary.depth==='short') return {key:'short',label:'Resumo curto',detail:'Contexto'};
    return {key:'full',label:'Completo',detail:'Recorte prioritário'};
  }
  const compact = text => String(text||'').replace(/\s+/g,' ').trim();
  const firstSentence = text => compact((compact(text).match(/^.*?[.!?](?:\s|$)/)||[compact(text)])[0]);
  const clip = (text,size=150) => { const value=compact(text); return value.length>size?value.slice(0,size).replace(/\s+\S*$/,'')+'…':value; };
  let storage=null;try{storage=window.localStorage;}catch(_){}
  const study=createStudyStore(storage);
  const drafts=createDraftStore(storage);
  let state = {view:'inicio',id:'all'},context=topics.has(study.get().topic)?study.get().topic:null,lastSearch=null;
  const content = $('#article');
  function button(text, action, className='link-button') { const b = el('button', text, className); b.type='button'; b.addEventListener('click',action); return b; }
  function routeHref(view,id='',params={}) {
    const search=new URLSearchParams();
    for(const [key,value] of Object.entries(params)) if(value) search.set(key,value);
    return '#' + view + (id && id!=='all' ? '/' + encodeURIComponent(id) : '') + (search.size ? '?' + search : '');
  }
  function routeLink(view,id,text,className='link-button',params={}) {
    const link=el('a',text,className); link.href=routeHref(view,id,params); return link;
  }
  function studyUpdate(patch) {
    const saved=study.update(patch);
    $('#study-status').textContent=saved?'':'Marcações e posição de leitura indisponíveis neste navegador; valem só nesta sessão.';
    return saved;
  }
  function rememberPosition() {
    if(contentViews.includes(state.view)&&state.id!=='all'&&!content.hidden)studyUpdate({positions:{...study.get().positions,[state.view+'/'+state.id]:window.scrollY}});
  }
  function go(view, id='', options={}) {
    rememberPosition();
    if(topics.has(options.topic))context=options.topic;
    if(view==='atlas'&&topics.has(id))context=id;
    if(view==='praticar'&&exercises.has(id))context=exercises.get(id).debate_id||context;
    if(view==='caderno'&&resources.has(id)&&!topics.get(context)?.works.includes(id))context=relatedTopics(resources.get(id),data.atlas)[0]?.debate_id||null;
    const params={};if(context&&view==='caderno')params.tema=context;if(options.section)params.secao=options.section;if(options.query)params.busca=options.query;
    const hash=routeHref(view,id,params);
    if (location.hash === hash) showRoute(true); else location.hash = hash;
  }
  function section(name, parent=content) { const s=el('section',null,'content-section');s.id=sectionId(name);s.append(el('h2',name)); parent.append(s); return s; }
  function scrollToTarget(target) {
    if(!target)return;
    target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
    const bar=document.querySelector('.search-return'),offset=bar?bar.offsetHeight+14:0;
    window.scrollTo(0,Math.max(0,target.getBoundingClientRect().top+window.scrollY-offset));
  }
  function topicExercise(topic){const remembered=exercises.get(study.get().exercises[topic.debate_id]);return remembered?.debate_id===topic.debate_id?remembered:data.exercises.find(e=>e.debate_id===topic.debate_id&&e.mode==='guided');}
  function topicReading(topic){const remembered=study.get().readings[topic.debate_id];return topic.works.includes(remembered)?remembered:topic.works[0];}
  function topicPractice(topic){return exercises.get(topic.debate_id+'-guided')||data.exercises.find(e=>e.debate_id===topic.debate_id&&e.mode==='guided')||data.exercises.find(e=>e.debate_id===topic.debate_id);}
  function reviewButton(topic) {
    const label=on=>on?'Marcado para rever':'Marcar para rever';
    const b=button('',()=>{const saved=new Set(study.get().saved);saved.has(topic.debate_id)?saved.delete(topic.debate_id):saved.add(topic.debate_id);studyUpdate({saved:[...saved]});
      document.querySelectorAll('[data-save]').forEach(control=>{const active=saved.has(control.dataset.save);control.setAttribute('aria-pressed',String(active));control.textContent=label(active);});reviewCount();refreshStudyStats();if(state.view==='rever')showRoute();},'review-toggle');
    const on=study.get().saved.includes(topic.debate_id);b.dataset.save=topic.debate_id;b.textContent=label(on);b.setAttribute('aria-pressed',String(on));return b;
  }
  function reviewCount(){const n=study.get().saved.filter(id=>topics.has(id)).length;const target=$('#review-count');target.textContent=n?String(n):'';target.setAttribute('aria-label',n?n+' tema'+(n===1?'':'s')+' para rever':'Nenhum tema para rever');}
  function currentFilter(){return $('#lesson').value;}
  function filterLabel(value=currentFilter()){return value==='all'?'Todas as aulas':value==='priority'?'Aulas 17–28':'Aula '+value;}
  function matchesFilter(values){const filter=currentFilter();return filter==='all'||(filter==='priority'?values.some(n=>n>=17&&n<=28):values.includes(Number(filter)));}
  function setFilter(value){
    $('#lesson').value=value;studyUpdate({filter:value});menu();
    if(['inicio','caderno','atlas','praticar','rever'].includes(state.view))showRoute(false,{keepScroll:true});
    $('#lesson').focus({preventScroll:true});
  }
  function filterLine(){
    const line=el('p',null,'index-filter');
    line.append(el('span','Recorte: '+filterLabel(),'index-filter-label'));
    if(currentFilter()!=='priority')line.append(button('Aulas 17–28',()=>setFilter('priority'),'text-button'));
    if(currentFilter()!=='all')line.append(button('Todas as aulas',()=>setFilter('all'),'text-button'));
    return line;
  }
  function studyStats(){
    const saved=study.get().saved.filter(id=>topics.has(id));
    const answered=data.exercises.filter(e=>drafts.get(e.exercise_id).answer.trim()).length;
    const reviewed=data.exercises.filter(e=>drafts.get(e.exercise_id).checks.length).length;
    return {saved,answered,reviewed};
  }
  function refreshStudyStats(){
    const stats=studyStats();
    const saved=$('#stat-saved'),answered=$('#stat-answered');
    if(saved)saved.textContent=String(stats.saved.length);
    if(answered)answered.textContent=String(stats.answered);
  }
  function validRoute(route){return route&&(route.view==='caderno'?resources.has(route.id):route.view==='atlas'?topics.has(route.id):route.view==='praticar'?exercises.has(route.id):false);}
  function routeName(route){return route.view==='caderno'?title(resources.get(route.id)):route.view==='atlas'?topics.get(route.id).title:'Questão '+questionNumber(exercises.get(route.id))+'. '+exercises.get(route.id).title;}
  function heading(lessonText, area, name, byline, areaView) {
    const head=el('p',null,'running-head');
    head.append(el('span',lessonText),areaView?routeLink(areaView,'',area,'head-link'):el('span',area));
    content.append(head,el('h1',name));
    if(byline) content.append(el('p',byline,'byline'));
  }
  function seeAlso(parent, entries) {
    const box=section('Ver também',parent),list=el('ul',null,'see-also');
    for(const [area,name,action] of entries){const li=el('li');li.append(el('span',area,'see-area'),button(name,action));list.append(li);}
    box.append(list);return list;
  }
  function listSection(name, items, field, ordered=false) {
    if (!items?.length) return;
    const box=section(name), list=el(ordered?'ol':'div',null,ordered?'argument':'items');
    for (const item of items) { const entry=el(ordered?'li':'div',null,'item'), body=el('div',null,'item-body'); if(item.kind) body.append(el('span',labels[item.kind]||item.kind,'kind')); if(item.name||item.term) body.append(el('h3',item.name||item.term)); if(item.period) body.append(el('p',item.period,'period')); body.append(el('p',item[field])); entry.append(body,evidence(item.refs)); list.append(entry); }
    box.append(list);
  }
  function highlighted(text,query){
    const terms=normalize(query).split(/\s+/).filter(Boolean),fragment=document.createDocumentFragment();
    for(const token of String(text).split(/(\s+)/)){
      if(!token.trim()){fragment.append(document.createTextNode(token));continue;}
      const word=normalize(token).replace(/[^a-z0-9]+/g,'');
      const hit=word&&terms.some(term=>word.includes(term)||(word.length>=4&&term.includes(word)));
      if(hit)fragment.append(el('mark',token));else fragment.append(document.createTextNode(token));
    }
    return fragment;
  }
  function clearSearchState(){
    const [path,query='']=location.hash.slice(1).split('?');
    if(!query)return;
    const params=new URLSearchParams(query);params.delete('busca');params.delete('secao');
    try{history.replaceState(null,'','#'+path+(params.size?'?'+params:''));}catch(_){}
  }
  function evidence(refs) {
    if (!refs?.length) return document.createDocumentFragment();
    const box=el('details',null,'evidence');
    const unique=[...new Map(refs.map(r=>[r.file_id+':'+r.pdf_page+':'+r.quote,r])).values()];
    box.append(el('summary', 'Evidências ('+unique.length+')'));
    let loaded=false;
    box.addEventListener('toggle',()=>{
      if(!box.open||loaded)return;loaded=true;
      for (const ref of unique) {
        const file=byFile[ref.file_id];
        box.append(el('blockquote',ref.quote));
        if (file) { const a=el('a',file.label+', página física '+ref.pdf_page); a.href=file.href+'#page='+ref.pdf_page; a.target='_blank'; a.rel='noopener'; box.append(a); }
      }
    });
    return box;
  }
  function originalLinks(resource) {
    const box=el('div',null,'originals');
    for (const file of resource.files) { const a=el('a',file.type==='application/pdf'?'PDF original':'Arquivo original'); a.href=file.href; a.target='_blank'; a.rel='noopener'; a.title=file.name; box.append(a); }
    return box;
  }
  function topicStrip() {
    const topic=topics.get(context);if(!topic||!contentViews.includes(state.view)||state.id==='all')return;
    const strip=el('div',null,'topic-strip'),name=el('p',null,'topic-name');
    name.append(el('span','Tema '+topicNumber(topic),'see-area'),routeLink('atlas',topic.debate_id,topic.title,'title-link'));
    strip.append(name,reviewButton(topic),button('Copiar link',share,'text-button'));
    const actions=el('nav',null,'topic-actions');actions.setAttribute('aria-label','Este tema nas três áreas');
    actions.append(el('span','Neste tema:','topic-actions-label'));
    const targets=[['caderno',state.view==='caderno'?state.id:topicReading(topic),'Resumo'],['atlas',topic.debate_id,'Atlas'],['praticar',topicPractice(topic)?.exercise_id,'Praticar']];
    for(const [view,id,label] of targets){if(!id)continue;const link=routeLink(view,id,label,'topic-action');if(state.view===view)link.setAttribute('aria-current','page');actions.append(link);}
    strip.append(actions);content.append(strip);
  }
  function showShareDialog(note) {
    $('#share-url').value=location.href;
    $('#share-note').textContent=note;
    $('#share-dialog').showModal();$('#share-url').select();
  }
  function share(event) {
    const trigger=event?.currentTarget,url=location.href;
    const success=()=>{
      showShareDialog('Link copiado para a área de transferência. O endereço também está abaixo, caso precise copiar de novo.');
      if(trigger){const label=trigger.textContent;trigger.textContent='Link copiado';setTimeout(()=>{trigger.textContent=label;},1600);}
    };
    const fallback=()=>showShareDialog(location.protocol==='file:'?'Este endereço aponta para o arquivo neste computador; só abre aqui. Se preferir, selecione e copie o endereço abaixo.':'Copie o endereço abaixo. O navegador não liberou a área de transferência.');
    try{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(success,fallback);else fallback();}catch(_){fallback();}
  }
  $('#copy-share').addEventListener('click',()=>{
    const url=$('#share-url').value;
    const success=()=>{$('#share-note').textContent='Link copiado para a área de transferência.';};
    const fallback=()=>{$('#share-url').select();$('#share-note').textContent='Selecione o endereço e copie com o teclado ou o menu do navegador.';};
    try{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(success,fallback);else fallback();}catch(_){fallback();}
  });
  function pagerNav(view,items,currentId,className=''){
    const index=items.findIndex(item=>item.id===currentId);if(index<0)return null;
    const nav=el('nav',null,'pager'+(className?' '+className:''));nav.setAttribute('aria-label','Navegação entre '+(view==='caderno'?'leituras':view==='atlas'?'temas':'questões'));
    const previous=items[index-1],next=items[index+1];
    const left=el('div',null,'pager-slot');
    if(previous)left.append(routeLink(view,previous.id,'← '+previous.name,'pager-link pager-prev'));
    else left.append(el('span','Primeiro da lista','pager-empty'));
    const center=routeLink(view,'','Voltar ao índice','pager-index');
    const right=el('div',null,'pager-slot pager-slot-next');
    if(next)right.append(routeLink(view,next.id,next.name+' →','pager-link pager-next'));
    else right.append(el('span','Último da lista','pager-empty'));
    nav.append(left,center,right);return nav;
  }
  function pager(view,items,currentId){
    const nav=pagerNav(view,items,currentId);if(nav)content.append(nav);
  }
  function topPager(view,items,currentId){
    const nav=pagerNav(view,items,currentId,'pager-top');if(nav)content.append(nav);
  }
  function themeRows(reviewOnly) {
    const visibleTopics=orderedTopics.filter(t=>(!reviewOnly||study.get().saved.includes(t.debate_id))&&matchesFilter(t.lessons));
    const list=el('ol',null,'contents');
    for(const topic of visibleTopics){
      const li=el('li',null,'contents-row'),body=el('div',null,'contents-body'),links=el('ul',null,'contents-links');
      const name=el('h2');name.append(routeLink('caderno',topicReading(topic),topic.title,'title-link',{tema:topic.debate_id}));
      body.append(name,el('p',lessons(topic.lessons)+' · '+topic.works.map(surname).join(', '),'byline'));
      const guided=topicPractice(topic);
      const actions=[['Caderno',routeHref('caderno',topicReading(topic),{tema:topic.debate_id})],['Atlas',routeHref('atlas',topic.debate_id)],['Praticar',guided?routeHref('praticar',guided.exercise_id):'']];
      for(const [area,href] of actions){if(!href)continue;const item=el('li'),link=routeLink(area==='Caderno'?'caderno':area==='Atlas'?'atlas':'praticar',area==='Caderno'?topicReading(topic):area==='Atlas'?topic.debate_id:guided.exercise_id,area,'text-button');link.setAttribute('aria-label',area+': '+topic.title);item.append(link);links.append(item);}
      body.append(links);li.append(el('span',String(topicNumber(topic)),'toc-num'),body,reviewButton(topic));list.append(li);
    }
    const wrap=el('div',null,'contents-wrap');wrap.append(list);
    if(!visibleTopics.length)wrap.append(el('p',reviewOnly?'Nenhum tema marcado neste recorte. Use “Marcar para rever” no topo de cada página ou nas listas de temas.':'Nenhum tema neste recorte.','notice'));
    return wrap;
  }
  function resumeStrip(){
    const last=study.get().last,box=el('div',null,'resume');
    if(last&&validRoute(last)){
      box.append(el('p','Continuar de onde parou','resume-label'));
      box.append(routeLink(last.view,last.id,routeName(last),'resume-link'));
      box.append(el('span',areaName[last.view],'resume-area'));
    }else{
      box.append(el('p','Comece pelo recorte prioritário','resume-label'));
      box.append(routeLink('caderno','','Abrir o caderno das aulas 17–28','resume-link',{recorte:'priority'}));
      box.append(el('span','14 leituras completas','resume-area'));
    }
    return box;
  }
  function home(){
    heading('EAE1244 · Guia de estudo','Início','Seu guia para a prova de 19 de novembro','31 leituras · 8 debates entre autores · 16 questões discursivas');
    content.append(el('p','Leia os resumos, compare as posições dos autores e treine a resposta discursiva. O guia funciona offline; suas marcações e rascunhos ficam neste navegador.','home-lead'));
    const full=readingList.filter(r=>r.summary?.status==='complete'&&r.summary.depth!=='short').length;
    const short=readingList.filter(r=>r.summary?.status==='complete'&&r.summary.depth==='short').length;
    const guided=data.exercises.filter(e=>e.mode==='guided').length;
    const pathways=el('nav',null,'pathways');pathways.setAttribute('aria-label','Formas de estudar');
    for(const [num,area,strong,copy,cta,view] of [
      ['I','Caderno','Ler os resumos',full+' resumos completos e '+short+' curtos, com tese, argumento, evidências e ressalvas.','Abrir o caderno','caderno'],
      ['II','Atlas','Comparar autores','8 temas com posições, convergências, divergências e roteiro de resposta.','Ver os temas','atlas'],
      ['III','Praticar','Treinar respostas','16 questões discursivas, guiadas e autônomas, com autoavaliação e download.','Escolher questão','praticar']
    ]){const card=el('a',null,'pathway');card.href=routeHref(view);card.append(el('span',num,'pathway-num'),el('span',area,'pathway-label'),el('strong',strong),el('span',copy,'pathway-copy'),el('span',cta+' →','pathway-cta'));pathways.append(card);}
    content.append(pathways,resumeStrip());
    const stats=studyStats(),summary=el('section',null,'study-summary');summary.id='study-summary';
    summary.append(el('h2','Seu estudo neste navegador'));
    const line=el('p'),savedCount=el('strong',String(stats.saved.length),'stat-saved'),answeredCount=el('strong',String(stats.answered),'stat-answered');
    savedCount.id='stat-saved';answeredCount.id='stat-answered';
    line.append(savedCount,' tema'+(stats.saved.length===1?'':'s')+' para rever · ',answeredCount,' '+(stats.answered===1?'questão':'questões')+' com rascunho salvo');
    summary.append(line);
    summary.append(el('p','As marcações e os rascunhos ficam neste navegador. Use “Para rever” para reunir o que precisa reler antes da prova.','study-summary-note'));
    const summaryLinks=el('p',null,'study-summary-links');summaryLinks.append(routeLink('rever','','Abrir Para rever','text-button'),routeLink('ajuda','','Como usar este guia','text-button'));summary.append(summaryLinks);
    content.append(summary);
    const themes=el('section',null,'home-section');
    const head=el('div',null,'section-head');head.append(el('h2','Temas da prova'),routeLink('atlas','','Ver todos os temas →','text-button'));
    themes.append(head,el('p','Cada tema reúne o resumo de uma leitura, a comparação entre autores e uma questão de treino.','home-note'),filterLine(),themeRows(false));
    content.append(themes);
    const help=el('div',null,'help-band');
    help.append(el('p','Primeira vez aqui? O guia tem três áreas, busca global, marcações e rascunhos. Veja como aproveitar cada recurso.','help-band-copy'),routeLink('ajuda','','Como usar este guia →','text-button'));
    content.append(help);
    refreshStudyStats();
  }
  function readingRow(resource) {
    const status=readingStatus(resource),row=el('a',null,'index-row'),body=el('span',null,'row-body');
    row.href=routeHref('caderno',resource.id);
    const meta=[resource.authors.join(', '),lessons(resource.lessons)].filter(Boolean).join(' · ');
    body.append(el('span',title(resource),'row-title'),el('span',meta,'row-meta'),el('span',resource.summary?firstSentence(resource.summary.thesis):'Resumo pendente. Abra a leitura para consultar o original.','row-snippet'));
    row.append(el('span',lessonSpan(resource.lessons),'row-num'),body,el('span',status.label,'badge badge-'+status.key));
    const li=el('li');li.append(row);return li;
  }
  function cadernoIndex() {
    heading('Início / Caderno','Sumário','Caderno','Resumos por leitura, com tese, argumento, evidências e ressalvas.');
    const visible=readingsOrder.filter(r=>matchesFilter(r.lessons));
    const full=visible.filter(r=>readingStatus(r).key==='full').length,short=visible.filter(r=>readingStatus(r).key==='short').length;
    content.append(el('p',visible.length+' '+(visible.length===1?'leitura':'leituras')+' neste recorte: '+full+' com resumo completo, '+short+' com resumo curto de contexto e '+(visible.length-full-short)+' sem resumo ou em revisão.','index-lead'),filterLine());
    for(const [key,label,note] of [['priority','Aulas 17–28','Recorte prioritário da prova. Resumos completos, com evidências e roteiros.'],['context','Aulas 2–16','Contexto anterior ao recorte. Resumos curtos, para situar autores e conceitos.']]){
      const items=visible.filter(r=>(key==='priority')===priority(r));if(!items.length)continue;
      const box=el('section',null,'index-group');
      box.append(el('h2',label+' · '+items.length+' '+(items.length===1?'leitura':'leituras')),el('p',note,'index-note'));
      const list=el('ol',null,'index-list');for(const resource of items)list.append(readingRow(resource));box.append(list);content.append(box);
    }
    if(!visible.length)content.append(el('p','Nenhuma leitura neste recorte.','notice'));
  }
  function atlasIndex() {
    heading('Início / Atlas','Sumário','Atlas de debates','Posições, convergências e divergências entre autores, tema a tema.');
    const visible=orderedTopics.filter(t=>matchesFilter(t.lessons));
    content.append(el('p',visible.length+' temas comparam as leituras do recorte. Cada um traz a pergunta em exame, as posições dos autores, a matriz de mecanismos e um roteiro de resposta.','index-lead'),filterLine());
    const list=el('ol',null,'topic-index');
    for(const topic of visible){
      const li=el('li',null,'topic-row'),body=el('div',null,'topic-body'),name=el('h2');
      name.append(routeLink('atlas',topic.debate_id,topic.title,'title-link'));
      body.append(name,el('p',topic.question,'question'),el('p',lessons(topic.lessons)+' · '+topic.works.map(surname).join(', '),'byline'));
      if(topic.entry_type==='single_reading')body.append(el('p','Leitura única, com comparação entre países.','topic-note'));
      const actions=el('div',null,'row-actions');actions.append(routeLink('atlas',topic.debate_id,'Abrir tema','text-button'));
      const practice=topicPractice(topic);if(practice)actions.append(routeLink('praticar',practice.exercise_id,'Treinar este tema','text-button'));
      actions.append(routeLink('caderno',topicReading(topic),'Ler a leitura','text-button',{tema:topic.debate_id}));
      body.append(actions);li.append(el('span',String(topicNumber(topic)),'row-num'),body);list.append(li);
    }
    content.append(list);
    if(!visible.length)content.append(el('p','Nenhum tema neste recorte.','notice'));
  }
  function exerciseCard(exercise) {
    const draft=drafts.get(exercise.exercise_id),card=el('a',null,'exercise-card');
    card.href=routeHref('praticar',exercise.exercise_id);
    card.append(el('span','Questão '+questionNumber(exercise)+' · '+modeName(exercise),'mode-badge'),el('strong',exercise.title),el('span',clip(exercise.prompt,130),'exercise-prompt'));
    const states=[];if(draft.answer.trim())states.push('Rascunho salvo');if(draft.checks.length)states.push('Autoavaliação: '+draft.checks.length+' de '+exercise.self_review.length);if(!states.length)states.push('Sem rascunho');
    card.append(el('span',states.join(' · '),'exercise-state'));return card;
  }
  function praticarIndex() {
    heading('Início / Praticar','Sumário','Praticar','Questões discursivas com planejamento, roteiro e autoavaliação.');
    const visible=orderedTopics.filter(t=>matchesFilter(t.lessons));
    const answered=data.exercises.filter(e=>drafts.get(e.exercise_id).answer.trim()).length;
    const draftLine=answered?' '+answered+' '+(answered===1?'questão já tem':'questões já têm')+' rascunho salvo neste navegador.':' Nenhuma questão tem rascunho salvo ainda.';
    content.append(el('p','16 questões em dois modos. No guiado, há perguntas de planejamento; no autônomo, você escreve direto e confere os apêndices depois.'+draftLine,'index-lead'),filterLine());
    for(const topic of visible){
      const items=exerciseOrder.filter(e=>e.debate_id===topic.debate_id);if(!items.length)continue;
      const box=el('section',null,'exercise-group'),head=el('div',null,'exercise-group-head'),name=el('h2');
      name.append(routeLink('atlas',topic.debate_id,'Tema '+topicNumber(topic)+' · '+topic.title,'title-link'));
      head.append(name,el('p',lessons(topic.lessons)+' · '+topic.works.map(surname).join(', '),'byline'));
      const cards=el('div',null,'exercise-cards');for(const exercise of items)cards.append(exerciseCard(exercise));
      box.append(head,cards);content.append(box);
    }
    if(!visible.length)content.append(el('p','Nenhuma questão neste recorte.','notice'));
    content.append(el('p','Os rascunhos e a autoavaliação ficam só neste navegador. Baixe uma cópia para guardar.','storage-note'));
  }
  function help() {
    heading('Início / Ajuda','Como usar','Como usar este guia','Todas as funções, em um lugar.');
    content.append(el('p','O guia tem três áreas que olham para o mesmo conteúdo por ângulos diferentes. Você pode começar por qualquer uma delas; o tema atual acompanha a navegação.','index-lead'));
    const grid=el('div',null,'help-grid');
    for(const [label,copy] of [['Caderno','Leia o resumo de cada obra: tese, argumento, mecanismos, casos, evidências, tabelas e ressalvas.'],['Atlas','Compare autores: posições, relações, matriz de mecanismos, diferenças de contexto e roteiro.'],['Praticar','Responda uma questão, abra o roteiro quando quiser, marque a autoavaliação e baixe o texto.']]){const card=el('div',null,'help-card');card.append(el('h2',label),el('p',copy));grid.append(card);}
    content.append(grid);
    const find=section('Encontrar o conteúdo');
    find.append(el('p','Use o sumário à esquerda para percorrer leituras, temas ou questões. O seletor “Recorte” limita o sumário às aulas 17–28, a todas as aulas ou a uma aula específica.'));
    find.append(el('p','A busca no topo procura em títulos, autores, conceitos e texto dos resumos. Ela ignora acentos e maiúsculas e abre o resultado na seção encontrada. Depois de abrir um resultado, use “Voltar à busca” para retomar a lista.'));
    const keys=el('div',null,'shortcuts');
    keys.append(el('kbd',/Mac|iPhone|iPad/.test(navigator.userAgent)?'⌘ K':'Ctrl K'),el('span','ou / — ir para a busca'));
    keys.append(el('kbd','Esc'),el('span','limpar a busca e sair dela'));
    find.append(keys);
    const read=section('Ler e conferir');
    read.append(el('p','Cada leitura abre com a tese e um índice das seções. As evidências ficam recolhidas ao lado das afirmações; abra para ver o trecho e a página física do original.'));
    read.append(el('p','O link “PDF original” abre o arquivo preservado no pacote. “Copiar link” gera um endereço direto para a página atual, inclusive para uma seção específica.'));
    const cross=section('Trocar de área sem perder o fio');
    cross.append(el('p','Em qualquer leitura, tema ou questão, a faixa “Neste tema” leva ao resumo, ao atlas e à questão correspondentes. O tema também aparece no sumário, e o botão “Para rever” marca o assunto para a revisão final.'));
    const practice=section('Praticar e guardar respostas');
    practice.append(el('p','As questões têm dois modos: guiado, com perguntas de planejamento; e autônomo, para simular a prova. Roteiro, parágrafo comentado e erros frequentes começam recolhidos — abra quando quiser conferir seu texto.'));
    practice.append(el('p','A resposta é salva neste navegador enquanto você escreve. “Baixar minha resposta” exporta o enunciado, seu texto e a autoavaliação em um arquivo de texto. Se o navegador bloquear o armazenamento, o texto continua na sessão e o aviso fica visível.'));
    const saved=section('Voltar depois');
    saved.append(el('p','“Para rever” reúne os temas marcados. O guia também guarda a última página aberta e mostra um atalho “Continuar de onde parou” no início. Marcações, posição e rascunhos ficam neste navegador; não acompanham o link compartilhado nem o pacote.'));
    const print=section('Aparência e impressão');
    print.append(el('p','“Página escura” alterna o tema claro e o escuro. O guia respeita a preferência do sistema e pode ser impresso pelo navegador; menus, faixas de navegação e apoios recolhidos ficam fora da impressão.'));
  }
  function reading(resource) {
    heading(lessons(resource.lessons),'Caderno',title(resource),resource.authors.join(' · '),'caderno');
    const colophon=el('div',null,'colophon');const meta=el('details',null,'source-meta');meta.append(el('summary','Referência completa'),el('p',resource.title));colophon.append(originalLinks(resource),meta);content.append(colophon);
    topPager('caderno',readingsOrder.map(r=>({id:r.id,name:title(r)})),resource.id);
    const entry=resource.summary;
    if(resource.files.some(f=>!f.reviewed)&&entry?.status!=='partial') content.append(el('p','A revisão da extração desta fonte ainda tem pendências. O original está disponível.','notice'));
    if(!entry){content.append(el('p','Resumo pendente. A leitura está no acervo e o original pode ser aberto acima; os resumos completos cobrem as aulas 17–28.','notice'));pager('caderno',readingsOrder.map(r=>({id:r.id,name:title(r)})),resource.id);return;}
    if(entry.status!=='complete') content.append(el('p',entry.depth==='short'?'Resumo curto de contexto, feito sobre extração ainda não revisada. Confira as ressalvas e o original.':'Resumo parcial, feito sobre extração ainda não revisada. Confira as ressalvas e o original.','notice'));
    else if(entry.depth==='short') content.append(el('p','Resumo curto de contexto: tese, argumento e casos principais. Para detalhes e números, consulte o original.','notice'));
    const thesis=el('p',entry.thesis,'lead');thesis.id='tese';content.append(thesis);
    if(entry.question){const q=el('p',null,'question');q.append(el('span','Pergunta','question-label'),document.createTextNode(entry.question));content.append(q);}
    content.append(el('p','⁂','ornament'));
    listSection('Argumento',entry.argument,'claim',true);
    listSection('Mecanismos',entry.mechanisms,'description');
    listSection('Conceitos',entry.concepts,'definition');
    listSection('Casos',entry.cases,'outcome');
    listSection('Evidências',entry.evidence,'fact');
    if(entry.tables?.length){const box=section('Tabelas');for(const t of entry.tables){const figure=el('figure',null,'data-table');figure.append(el('figcaption',t.label+'. '+t.title));if(t.unit)figure.append(el('p',t.unit,'period'));const scroll=el('div',null,'table-wrap'),table=el('table'),head=el('tr');t.columns.forEach(c=>{const th=el('th',c);th.scope='col';head.append(th);});const thead=el('thead'),tbody=el('tbody');thead.append(head);for(const row of t.rows){const tr=el('tr');row.forEach((c,i)=>{const cell=el(i?'td':'th',c);if(!i)cell.scope='row';tr.append(cell);});tbody.append(tr);}table.append(thead,tbody);scroll.append(table);figure.append(scroll,el('p',t.supports,'table-supports'));if(t.note)figure.append(el('p',t.note,'table-note'));const file=byFile[t.file_id];if(file){const a=el('a',file.label+', página física '+t.pdf_page);a.href=file.href+'#page='+t.pdf_page;a.target='_blank';a.rel='noopener';figure.append(a);}box.append(figure);}}
    if(entry.limits?.length){const box=section('Ressalvas'),ul=el('ul',null,'limits');entry.limits.forEach(t=>ul.append(el('li',t)));box.append(ul);}
    listSection('Ênfases do professor',entry.professor_emphasis,'point');
    if(entry.figures_note?.length){const box=section('Figuras e tabelas');entry.figures_note.forEach(t=>box.append(el('p',t)));}
    const sections=[...content.querySelectorAll('.content-section')];
    if(sections.length>2){const toc=el('nav',null,'reading-toc'),list=el('ol');toc.setAttribute('aria-label','Seções desta leitura');
      for(const s of sections){const li=el('li'),link=el('a',s.querySelector('h2').textContent);link.href='#'+s.id;link.addEventListener('click',event=>{event.preventDefault();scrollToTarget(s);try{const params=new URLSearchParams(location.hash.split('?')[1]||'');params.set('secao',s.id);history.replaceState(null,'',routeHref('caderno',resource.id,Object.fromEntries(params)));}catch(_){}});li.append(link);list.append(li);}
      toc.append(list);thesis.before(toc);}
    const related=relatedTopics(resource,data.atlas);
    if(related.length){
      const primary=related.find(t=>t.debate_id===context)||related[0],exercise=primary===related[0]?studyExercise(resource.id,related,data.exercises):topicExercise(primary);
      const entries=[['Atlas',primary.title,()=>go('atlas',primary.debate_id)]];
      if(exercise)entries.push(['Praticar','Questão '+questionNumber(exercise)+', '+modeName(exercise).toLowerCase(),()=>go('praticar',exercise.exercise_id)]);
      related.filter(t=>t!==primary).forEach(t=>entries.push(['Atlas',t.title,()=>go('atlas',t.debate_id)]));
      seeAlso(content,entries).classList.add('quick-links');
    }
    pager('caderno',readingsOrder.map(r=>({id:r.id,name:title(r)})),resource.id);
  }
  function archive() {
    const support=data.resources.length-readingList.length;
    heading('Início / Acervo','Originais','Originais e apoios',data.resources.length+' arquivos: '+readingList.length+' leituras e '+support+' materiais de apoio');
    content.append(el('p','Estar no acervo não significa ter resumo nem extração revisada.','question'));
    content.append(el('p','Cada item abre o PDF ou o arquivo original preservado no pacote. Use o Caderno para ler o resumo e o Atlas para comparar autores.','index-lead'));
    const list=el('ol',null,'bibliography');
    for(const resource of data.resources){const box=el('li',null,'archive-item');const name=el('h2');name.append(resource.kind==='reading'?routeLink('caderno',resource.id,title(resource),'title-link'):document.createTextNode(title(resource)));box.append(name,el('p',[lessons(resource.lessons),resource.authors.join(', '),resource.kind==='reading'?(resource.summary?'com resumo':'resumo pendente'):'material de apoio'].filter(Boolean).join(' · ')),originalLinks(resource));list.append(box);}
    content.append(list);
  }
  function basisEvidence(bases) {
    const refs=[], links=el('div',null,'basis-links'), seen=new Set();
    for(const base of bases||[]) {
      if(base.module==='atlas') {
        const topic=topics.get(base.entry_id);
        const item=base.section==='positions'?topic?.positions.find(p=>p.resource_id===base.item):topic?.relations.find(r=>r.id===base.item);
        if(item?.refs)refs.push(...item.refs);
        const key='atlas:'+base.entry_id;
        if(!seen.has(key)){links.append(button('Atlas: '+topic.title,()=>go('atlas',base.entry_id)));seen.add(key);}
      } else {
        const resource=resources.get(base.entry_id), item=resource?.summary?.[base.section]?.[base.item];
        if(item?.refs)refs.push(...item.refs);
        const key='caderno:'+base.entry_id;
        if(resource&&!seen.has(key)){links.append(button('Caderno: '+title(resource),()=>go('caderno',base.entry_id)));seen.add(key);}
      }
    }
    const fragment=document.createDocumentFragment();fragment.append(evidence(refs),links);return fragment;
  }
  function answerOutline(parent, outline, office=false) {
    const names={thesis:'Tese',arguments_for:'Argumentos',counterarguments:'Contrapontos e ressalvas',conclusion:'Conclusão'};
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
  function appendix(parent, letter, name, id) { const d=el('details',null,'support-panel');if(id)d.id=id;const s=el('summary');s.append(el('span',letter,'appendix-letter'),document.createTextNode(name));d.append(s);parent.append(d);return d; }
  function atlasView(topic) {
    const authors=topic.works.map(surname);
    heading(lessons(topic.lessons),'Atlas',topic.title,topic.entry_type==='single_reading'?authors[0]+' · leitura única, comparação entre países':authors.join(' · '),'atlas');
    topPager('atlas',orderedTopics.map(t=>({id:t.debate_id,name:t.title})),topic.debate_id);
    const propositionBlock=el('div',null,'atlas-proposition');propositionBlock.id='proposicao';
    propositionBlock.append(el('p',topic.question,'question'));
    const proposition=el('blockquote',null,'proposition');proposition.append(el('span','Proposição em exame','question-label'),el('p',topic.thesis_statement));propositionBlock.append(proposition);content.append(propositionBlock);
    const works=el('ul',null,'see-also quick-links');
    topic.works.forEach(rid=>{const li=el('li');li.append(el('span','Caderno','see-area'),button(title(resources.get(rid)),()=>go('caderno',rid)));works.append(li);});
    const practice=exercises.get(topic.debate_id+'-guided')||topicPractice(topic);
    if(practice){const practiceLi=el('li');practiceLi.append(el('span','Praticar','see-area'),button('Questão '+questionNumber(practice)+', '+modeName(practice).toLowerCase(),()=>go('praticar',practice.exercise_id)));works.append(practiceLi);}
    content.append(works);
    const positions=section('Posições'),columns=el('div',null,'positions');
    for(const position of topic.positions){const box=el('div',null,'position');box.append(el('h3',author(position.resource_id)),el('span',labels[position.stance]||'Outro enfoque','kind'),el('p',position.summary),evidence(position.refs));columns.append(box);}
    positions.append(columns);
    if(topic.relations.length){const box=section('Relações');for(const relation of topic.relations){const item=el('div',null,'item'),body=el('div',null,'item-body');body.append(el('span',labels[relation.type],'kind'),el('h3',relation.between.map(author).join(' × ')),el('p',relation.text));item.append(body,evidence(relation.refs));box.append(item);}}
    const matrix=section('Mecanismos');matrix.append(el('p','Classificação interpretativa. Abra um mecanismo para ler a justificativa de cada classificação.','interpretation'));
    const rows=topic.mechanism_matrix.rows, cols=[...new Set(rows.flatMap(r=>r.classifications.map(c=>c.resource_id)))];
    const table=el('table',null,'matrix-table'),thead=el('thead'),hr=el('tr');hr.append(el('th','Mecanismo'));cols.forEach(rid=>{const th=el('th',author(rid));th.scope='col';hr.append(th);});thead.append(hr);table.append(thead);
    const tbody=el('tbody');
    for(const row of rows){const tr=el('tr'),th=el('th',row.mechanism);th.scope='row';tr.append(th);for(const rid of cols){const cell=row.classifications.find(c=>c.resource_id===rid);const td=el('td',cell?labels[cell.kind]:'—');td.dataset.author=author(rid);if(cell?.kind==='absent')td.className='absent';tr.append(td);}tbody.append(tr);}
    table.append(tbody);const wrap=el('div',null,'table-wrap');wrap.append(table);matrix.append(wrap);
    for(const row of rows){const detail=el('details',null,'mechanism-row');detail.append(el('summary',row.mechanism));const grid=el('div',null,'matrix-grid');for(const cell of row.classifications){const item=el('div',null,'matrix-cell');item.append(el('h3',author(cell.resource_id)),el('span',labels[cell.kind],'kind'),el('p',cell.explanation),evidence(cell.refs));grid.append(item);}detail.append(grid);matrix.append(detail);}
    const cases=section('Casos');
    for(const c of topic.cases){const box=el('div',null,'case');box.append(el('h3',c.name));for(const view of c.readings){box.append(el('p',author(view.resource_id),'case-author'),el('p',view.text),evidence(view.refs));}cases.append(box);}
    listSection('Diferenças de contexto',topic.context_differences,'text');
    const appendices=section('Apêndice');answerOutline(appendix(appendices,'A','Roteiro de resposta'),topic.verdict_outline);
    pager('atlas',orderedTopics.map(t=>({id:t.debate_id,name:t.title})),topic.debate_id);
  }
  function practice(exercise) {
    const topic=topics.get(exercise.debate_id);
    heading(lessons(exercise.lessons),'Praticar · '+modeName(exercise),exercise.title,topic.title,'praticar');
    topPager('praticar',exerciseOrder.map(e=>({id:e.exercise_id,name:'Questão '+questionNumber(e)+' · '+e.title})),exercise.exercise_id);
    const alternative=data.exercises.find(e=>e.debate_id===exercise.debate_id&&e.exercise_id!==exercise.exercise_id);
    const meta=el('div',null,'exercise-meta');
    meta.append(el('span','Questão '+questionNumber(exercise)+' de '+data.exercises.length,'exercise-meta-label'),routeLink('atlas',exercise.debate_id,'Ver o tema','text-button'));
    if(alternative)meta.append(routeLink('praticar',alternative.exercise_id,'Mudar para '+modeName(alternative).toLowerCase(),'text-button'));
    content.append(meta);
    const question=el('div',null,'exam-question');question.append(el('p','Questão '+questionNumber(exercise),'question-number'),el('p',exercise.prompt,'prompt'));content.append(question);
    const works=el('ul',null,'see-also quick-links');exercise.works.forEach(rid=>{const li=el('li');li.append(el('span',surname(rid),'see-area'),button(title(resources.get(rid)),()=>go('caderno',rid)));works.append(li);});content.append(works);
    if(exercise.planning_prompts.length){const planning=section('Planejamento'),ol=el('ol',null,'planning');exercise.planning_prompts.forEach(t=>ol.append(el('li',t)));planning.append(ol);}
    const writing=section('Resposta'),label=el('label','Texto da resposta','sr-only');label.htmlFor='answer';
    const textarea=el('textarea');textarea.id='answer';textarea.rows=14;textarea.spellcheck=true;textarea.value=drafts.get(exercise.exercise_id).answer;
    const sheet=el('div',null,'answer-sheet');sheet.append(label,textarea);
    const status=el('p',null,'save-status');status.id='save-status';status.setAttribute('role','status');
    function statusText(saved){const value=saved?'Rascunho salvo neste navegador.':'Salvamento indisponível. O texto continua nesta sessão; baixe uma cópia.';if(status.textContent!==value)status.textContent=value;status.classList.toggle('storage-warning',!saved);}
    const initialDraft=drafts.get(exercise.exercise_id);
    if(initialDraft.answer||initialDraft.checks.length||!drafts.available)statusText(drafts.available);
    else status.textContent='Rascunho vazio.';
    textarea.addEventListener('input',()=>{statusText(drafts.update(exercise.exercise_id,{answer:textarea.value}));syncDownload();});
    const download=button('Baixar minha resposta',()=>{const checks=drafts.get(exercise.exercise_id).checks;const text=exercise.title+'\n\n'+exercise.prompt+'\n\nMinha resposta\n\n'+(textarea.value.trim()?textarea.value:'[Rascunho vazio. Nenhum texto foi escrito.]')+'\n\nRevisão pessoal\n'+exercise.self_review.map(c=>(checks.includes(c.criterion)?'[x] ':'[ ] ')+c.question).join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=el('a');a.href=url;a.download=exercise.exercise_id+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);},'text-button');
    download.id='download-answer';
    function syncDownload(){const ready=!!textarea.value.trim()||!!drafts.get(exercise.exercise_id).checks.length;download.disabled=!ready;download.title=ready?'Baixar o enunciado, seu texto e a autoavaliação.':'Escreva uma resposta ou marque a autoavaliação para baixar.';}
    syncDownload();
    const tools=el('div',null,'sheet-foot');tools.append(status,download);
    writing.append(sheet,tools,el('p','Os rascunhos ficam só neste navegador; mudar de navegador ou mover o pacote pode não levá-los junto. Baixe uma cópia para guardá-los.','storage-note'));
    const support=section('Apêndices');
    answerOutline(appendix(support,'A','Roteiro de resposta','solution'),exercise.answer_outline,true);
    appendix(support,'B','Parágrafo comentado','example').append(el('p',exercise.worked_paragraph.text,'worked-example'),el('p',exercise.worked_paragraph.commentary,'interpretation'),basisEvidence(exercise.worked_paragraph.basis));
    const mistakes=appendix(support,'C','Erros frequentes');exercise.common_mistakes.forEach(m=>{mistakes.append(el('h3',m.mistake),el('p',m.revision),basisEvidence(m.basis));});
    const review=section('Autoavaliação');review.append(el('p','Marque o que você conferiu. Não há nota.','interpretation'));
    const checks=drafts.get(exercise.exercise_id).checks,list=el('div',null,'review-list');
    for(const criterion of exercise.self_review){const l=el('label',null,'review-item'),input=el('input');input.type='checkbox';input.checked=checks.includes(criterion.criterion);input.addEventListener('change',()=>{const set=new Set(drafts.get(exercise.exercise_id).checks);input.checked?set.add(criterion.criterion):set.delete(criterion.criterion);statusText(drafts.update(exercise.exercise_id,{checks:[...set]}));syncDownload();});l.append(input,el('span',criterion.question));list.append(l);}
    review.append(list);
    pager('praticar',exerciseOrder.map(e=>({id:e.exercise_id,name:'Questão '+questionNumber(e)+' · '+e.title})),exercise.exercise_id);
  }
  function menu() {
    const target=$('#menu'),panel=$('.index-panel');
    const show=['caderno','atlas','praticar','rever'].includes(state.view);
    panel.hidden=!show;
    if(!show){target.replaceChildren();return;}
    target.replaceChildren();
    const visible=values=>matchesFilter(values);
    let items=[];
    if(state.view==='rever')items=orderedTopics.filter(t=>study.get().saved.includes(t.debate_id)).map(t=>({id:t.debate_id,num:String(topicNumber(t)),name:t.title,detail:lessons(t.lessons),view:'atlas'}));
    else if(state.view==='caderno')items=readingsOrder.filter(r=>visible(r.lessons)).map(r=>({id:r.id,num:lessonSpan(r.lessons),name:title(r),detail:r.summary?r.authors.join(', '):'Sem resumo',view:'caderno',order:Math.min(...r.lessons)}));
    else if(state.view==='atlas')items=orderedTopics.filter(t=>visible(t.lessons)).map(t=>({id:t.debate_id,num:String(topicNumber(t)),name:t.title,detail:lessons(t.lessons)+' · '+(t.works.length===1?'leitura única':t.works.length+' leituras'),view:'atlas',order:topicNumber(t)}));
    else if(state.view==='praticar')items=exerciseOrder.filter(e=>visible(e.lessons)).map(e=>({id:e.exercise_id,num:String(questionNumber(e)),name:e.title,detail:modeName(e)+' · '+lessons(e.lessons),view:'praticar',order:questionNumber(e)}));
    $('#menu-caption').textContent=state.view==='rever'?'Tema':state.view==='atlas'?'Tema':state.view==='praticar'?'Questão':'Leitura';
    if(!items.length)target.append(el('p','Nada nesta área para o recorte escolhido.','empty-note'));
    for(const item of items.sort((a,b)=>(a.order??0)-(b.order??0))){const link=el('a',null,'menu-item');link.href=routeHref(item.view,item.id);link.append(el('span',item.num,'toc-num'),el('strong',item.name),el('small',item.detail));if(state.id===item.id)link.setAttribute('aria-current','page');link.addEventListener('click',()=>{if(innerWidth<=760)panel.open=false;});target.append(link);}
    const active=target.querySelector('[aria-current="page"]');
    if(active)requestAnimationFrame(()=>{const sidebar=$('.sidebar');if(!sidebar||sidebar.scrollHeight<=sidebar.clientHeight+4)return;const a=active.getBoundingClientRect(),s=sidebar.getBoundingClientRect();if(a.top<s.top+8||a.bottom>s.bottom-96)sidebar.scrollTop+=a.top-s.top-64;});
  }
  function setNavCurrent() {
    document.querySelectorAll('[data-view]').forEach(link=>{
      if(link.dataset.view===state.view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
  }
  function showRoute(focus=false, options={}) {
    const [path='',query='']=location.hash.slice(1).split('?'),params=new URLSearchParams(query);
    const [view='',rawId='']=path.split('/');
    let decoded='';try{decoded=rawId?decodeURIComponent(rawId):''}catch(_){decoded='';}
    let next=null;
    if(contentViews.includes(view)){
      const map={caderno:resources,atlas:topics,praticar:exercises}[view];
      if(decoded&&decoded!=='all'&&map.has(decoded))next={view,id:decoded};
      else if(!decoded||decoded==='all')next={view,id:'all'};
    }
    if(!next&&indexViews.includes(view))next={view,id:'all'};
    if(!next)next={view:'inicio',id:'all'};
    state=next;
    lastSearch=params.get('busca')?{query:params.get('busca')}:null;
    $('#search').value='';$('#clear-search').hidden=true;$('.search-wrap').classList.remove('has-query');
    const recorte=params.get('recorte');
    if(recorte&&['priority','all'].concat(nums.map(String)).includes(recorte)&&$('#lesson').value!==recorte){$('#lesson').value=recorte;studyUpdate({filter:recorte});}
    const requested=topics.get(params.get('tema'));
    if(state.view==='atlas'&&topics.has(state.id))context=state.id;
    else if(state.view==='praticar'&&exercises.has(state.id))context=exercises.get(state.id).debate_id;
    else if(state.view==='caderno'&&resources.has(state.id))context=requested?.works.includes(state.id)?requested.debate_id:topics.get(context)?.works.includes(state.id)?context:relatedTopics(resources.get(state.id),data.atlas)[0]?.debate_id||null;
    if(contentViews.includes(state.view)&&state.id!=='all'){
      const patch={last:{view:state.view,id:state.id},topic:context};
      if(context&&state.view==='caderno')patch.readings={...study.get().readings,[context]:state.id};
      if(context&&state.view==='praticar')patch.exercises={...study.get().exercises,[context]:state.id};
      studyUpdate(patch);
    }
    content.replaceChildren();content.hidden=false;$('#results').hidden=true;
    content.dataset.view=state.view;
    if(lastSearch){const ret=el('div',null,'search-return');ret.append(button('← Voltar à busca por “'+lastSearch.query+'”',()=>{$('#search').value=lastSearch.query;search();$('#search').focus();},'back-search'));content.append(ret);}
    if(contentViews.includes(state.view)&&state.id!=='all')topicStrip();
    if(state.view==='inicio')home();
    else if(state.view==='caderno'&&state.id==='all')cadernoIndex();
    else if(state.view==='caderno')reading(resources.get(state.id));
    else if(state.view==='atlas'&&state.id==='all')atlasIndex();
    else if(state.view==='atlas')atlasView(topics.get(state.id));
    else if(state.view==='praticar'&&state.id==='all')praticarIndex();
    else if(state.view==='praticar')practice(exercises.get(state.id));
    else if(state.view==='rever')reviewPage();
    else if(state.view==='acervo')archive();
    else if(state.view==='ajuda')help();
    setNavCurrent();menu();
    document.title=(content.querySelector('h1')?.textContent||'Guia')+' · EAE1244';
    reviewCount();
    if(options.keepScroll)return;
    const anchor=params.get('secao');
    requestAnimationFrame(()=>{const target=anchor&&document.getElementById(anchor);
      if(target)scrollToTarget(target);
      else{window.scrollTo(0,study.get().positions[state.view+'/'+state.id]||0);if(focus)$('#content').focus({preventScroll:true});}});
  }
  function reviewPage() {
    heading('Início / Para rever','Para rever','Para rever','Temas marcados neste navegador.');
    content.append(el('p','Aqui ficam os temas que você marcou para reler antes da prova. A marcação não altera o conteúdo e não acompanha o link compartilhado.','index-lead'),filterLine());
    content.append(themeRows(true));
  }
  const readingsList=readingList;
  const tally=[[readingsList.filter(r=>r.summary?.status==='complete'&&r.summary.depth!=='short').length,' completas'],[readingsList.filter(r=>r.summary?.status==='complete'&&r.summary.depth==='short').length,' curtas'],[readingsList.filter(r=>r.summary&&r.summary.status!=='complete').length,' parciais, com fonte em revisão'],[readingsList.filter(r=>!r.summary).length,' pendentes']].filter(([n])=>n);
  $('#coverage').append(readingsList.length+' leituras: ');tally.forEach(([n,label],i)=>{$('#coverage').append(el('strong',String(n)),label+(i<tally.length-1?', ':'.'));});
  const nums=[...new Set(data.resources.filter(r=>r.kind==='reading').flatMap(r=>r.lessons))].sort((a,b)=>a-b);
  nums.forEach(n=>{const o=el('option','Aula '+n);o.value=n;$('#lesson').append(o);});
  if([...$('#lesson').options].some(option=>option.value===study.get().filter))$('#lesson').value=study.get().filter;
  $('#lesson').addEventListener('change',()=>setFilter($('#lesson').value));
  const docs=buildSearchDocs(data,{title,labels,question:e=>'Questão '+questionNumber(e)+'. '});
  function search(){
    const query=$('#search').value.trim(),results=$('#results');results.replaceChildren();$('.search-wrap').classList.toggle('has-query',!!query);$('#clear-search').hidden=!query;content.hidden=!!query;results.hidden=!query;
    if(!query){lastSearch=null;document.querySelector('.search-return')?.remove();clearSearchState();menu();return;}
    $('.index-panel').hidden=true;
    const matches=searchDocs(docs,query);
    const head=el('p',null,'running-head');head.append(el('span','Início / Busca'),el('span','Todo o guia'));
    const status=el('p',matches.length+(matches.length===1?' entrada':' entradas')+' para “'+query+'”','result-title');status.setAttribute('role','status');
    results.append(head,el('h1','Resultados da busca'),status,el('p','A busca cobre todas as aulas, inclusive leituras fora do recorte do sumário.','result-scope'));
    if(!matches.length){results.append(el('p','Nenhum resultado. Tente um autor, outra palavra ou limpe a busca.','notice'));const suggestions=el('p',null,'suggestions');suggestions.append(el('span','Tente:','see-area'));for(const term of ['Bretton Woods','Triffin','dívida','convergência']){suggestions.append(button(term,()=>{$('#search').value=term;search();$('#search').focus();},'text-button'));}results.append(suggestions);}
    for(const [view,name] of [['caderno','Caderno'],['atlas','Atlas'],['praticar','Praticar']]){
      const group=matches.filter(m=>m.view===view);if(!group.length)continue;
      const box=el('section',null,'result-group');box.append(el('h2',name+' ('+group.length+')'));
      for(const match of group){const link=el('a',null,'result');link.href=routeHref(match.view,match.id,{secao:match.section,busca:query});const snippet=el('span',null,'snippet');snippet.append(highlighted(match.snippet,query));link.append(el('strong',match.title),el('small',match.type+(match.sectionName?' · '+match.sectionName:'')),snippet);box.append(link);}
      results.append(box);
    }
  }
  $('#search').addEventListener('input',search);
  $('#clear-search').addEventListener('click',()=>{$('#search').value='';search();$('#search').focus();});
  function focusSearch(){window.scrollTo(0,0);$('#search').focus();$('#search').select();}
  document.addEventListener('keydown',event=>{
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)||event.target.isContentEditable;
    if((event.key==='k'||event.key==='K')&&(event.metaKey||event.ctrlKey)){event.preventDefault();focusSearch();}
    else if(event.key==='/'&&!typing){event.preventDefault();focusSearch();}
    else if(event.key==='Escape'&&document.activeElement===$('#search')){$('#search').value='';search();$('#content').focus({preventScroll:true});}
  });
  if(/Mac|iPhone|iPad/.test(navigator.userAgent))$('#search-hint').textContent='⌘ K';
  function applyTheme(){const theme=study.get().theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):study.get().theme;document.documentElement.style.colorScheme=theme;$('#theme-toggle').textContent=theme==='dark'?'Página clara':'Página escura';}
  $('#theme-toggle').addEventListener('click',()=>{studyUpdate({theme:document.documentElement.style.colorScheme==='dark'?'light':'dark'});applyTheme();});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(study.get().theme==='system')applyTheme();});
  const mobileQuery=matchMedia('(max-width:760px)');
  mobileQuery.addEventListener('change',event=>{$('.index-panel').open=!event.matches;});
  document.querySelector('.skip')?.addEventListener('click',event=>{event.preventDefault();const target=$('#content');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});});
  document.querySelectorAll('[data-view]').forEach(link=>link.addEventListener('click',()=>{if(innerWidth<=760)$('.index-panel').open=false;}));
  let scrollTimer;
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(rememberPosition,180);},{passive:true});
  document.addEventListener('click',event=>{if(event.target.closest?.('a[href^="#"]'))rememberPosition();});
  window.addEventListener('hashchange',()=>showRoute(true));
  window.addEventListener('pagehide',rememberPosition);
  if(innerWidth<=760)$('.index-panel').open=false;
  if(!location.hash){try{history.replaceState(null,'','#inicio');}catch(_){}}
  applyTheme();reviewCount();
  showRoute();
})();
