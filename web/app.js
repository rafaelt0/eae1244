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
  if (typeof module !== 'undefined' && module.exports) { module.exports = {normalize, searchDocs, createDraftStore}; return; }
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
  let state = {view:'caderno', id:'moodle-resource-6577587'};
  const content = $('#article');
  function button(text, action, className='link-button') { const b = el('button', text, className); b.type='button'; b.addEventListener('click',action); return b; }
  function go(view, id) {
    $('#search').value=''; $('#results').hidden=true; $('#clear-search').hidden=true; content.hidden=false;
    const hash = '#' + view + '/' + encodeURIComponent(id);
    if (location.hash === hash) showRoute(true); else location.hash = hash;
  }
  function section(name) { const s=el('section',null,'content-section'); s.append(el('h2',name)); content.append(s); return s; }
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
    for (const item of items) { const entry=el(ordered?'li':'div',null,'item'); if(item.kind) entry.append(el('span',labels[item.kind]||item.kind,'kind')); if(item.name||item.term) entry.append(el('h3',item.name||item.term)); if(item.period) entry.append(el('p',item.period,'byline')); entry.append(el('p',item[field]),evidence(item.refs)); list.append(entry); }
    box.append(list);
  }
  function reading(resource) {
    heading(lessons(resource.lessons)+' · Caderno',title(resource),resource.authors.join(' · '));
    const meta=el('details',null,'source-meta'); meta.append(el('summary','Dados da leitura'),el('p',resource.title)); content.append(meta,originalLinks(resource));
    if(resource.files.some(f=>!f.reviewed)) content.append(el('p','A revisão da extração desta fonte ainda tem pendências. O original está disponível.','notice'));
    const entry=resource.summary;
    if(!entry){content.append(el('p','Resumo pendente. Esta leitura está no acervo, mas ainda não foi resumida. As aulas 17–28 concentram o conteúdo completo desta entrega.','notice'));return;}
    if(entry.status!=='complete') content.append(el('p','Resumo parcial. Confira os limites e o original.','notice'));
    content.append(el('p',entry.thesis,'lead'));
    if(entry.question) content.append(el('p',entry.question,'question'));
    const related=data.atlas.filter(t=>t.works.includes(resource.id));
    if(related.length){const links=el('div',null,'quick-links');links.append(button('Relacionar autores →',()=>go('atlas',related[0].debate_id)),button('Praticar esta leitura →',()=>go('praticar',data.exercises.find(e=>e.works.includes(resource.id)).exercise_id)));content.append(links);}
    listSection('O argumento, passo a passo',entry.argument,'claim',true);
    listSection('Mecanismos em jogo',entry.mechanisms,'description');
    listSection('Conceitos para a resposta',entry.concepts,'definition');
    listSection('Casos e comparações',entry.cases,'outcome');
    listSection('Evidências e resultados',entry.evidence,'fact');
    if(entry.limits?.length){const box=section('Limites e ressalvas'),ul=el('ul',null,'limits');entry.limits.forEach(t=>ul.append(el('li',t)));box.append(ul);}
    listSection('Ênfases do professor',entry.professor_emphasis,'point');
    if(entry.figures_note?.length){const box=section('Figuras e tabelas');entry.figures_note.forEach(t=>box.append(el('p',t)));}
    if(related.length){const box=section('Continuar relacionando'),links=el('div',null,'related');related.forEach(t=>links.append(button(t.title,()=>go('atlas',t.debate_id))));box.append(links);}
  }
  function archive() {
    heading('Acervo local','Originais e apoios','44 arquivos preservados · 31 leituras e 13 materiais de apoio');
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
    heading(lessons(topic.lessons)+' · Atlas',topic.title,topic.entry_type==='single_reading'?'Uma leitura, comparação entre casos':topic.works.length+' leituras em relação');
    content.append(el('p',topic.question,'question'),el('p',topic.thesis_statement,'lead'));
    const links=el('div',null,'quick-links');
    topic.works.forEach(rid=>links.append(button(title(resources.get(rid)),()=>go('caderno',rid))));
    links.append(button('Praticar este tema →',()=>go('praticar',topic.debate_id+'-guided')));content.append(links);
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
  let storage=null;try{storage=window.localStorage;}catch(_){}
  const drafts=createDraftStore(storage);
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
    const next=section('Continuar o estudo'),links=el('div',null,'related');links.append(button('Voltar ao atlas',()=>go('atlas',exercise.debate_id)));if(alternative)links.append(button(alternative.mode==='guided'?'Tentar a questão guiada':'Tentar a questão autônoma',()=>go('praticar',alternative.exercise_id)));next.append(links);
  }
  function menu() {
    const target=$('#menu');target.replaceChildren();
    const filter=$('#lesson').value;
    const visible=values=>filter==='all'||(filter==='priority'?values.some(n=>n>=17&&n<=28):values.includes(Number(filter)));
    const topicOrder=['guerra-e-mobilizacao','fim-bretton-woods','crescimento-era-de-ouro','planejamento-sovietico','estado-e-industrializacao','capital-humano-e-convergencia','crise-da-divida-e-reformas','crises-financeiras-pos-1971'];
    let items=[];
    if(state.view==='caderno'||state.view==='acervo') items=data.resources.filter(r=>r.kind==='reading'&&visible(r.lessons)).map(r=>({id:r.id,name:title(r),detail:r.summary?r.authors.join(', '):'Resumo pendente',lessons:r.lessons,view:'caderno'}));
    if(state.view==='atlas')items=data.atlas.filter(t=>visible(t.lessons)).map(t=>({id:t.debate_id,name:t.title,detail:t.works.length===1?'Leitura única':t.works.length+' leituras',lessons:t.lessons,view:'atlas',order:topicOrder.indexOf(t.debate_id)*2}));
    if(state.view==='praticar')items=data.exercises.filter(e=>visible(e.lessons)).map(e=>({id:e.exercise_id,name:e.title,detail:e.mode==='guided'?'Guiado':'Autônomo',lessons:e.lessons,view:'praticar',order:topicOrder.indexOf(e.debate_id)*2+(e.mode==='guided'?0:1)}));
    if(!items.length)target.append(el('p','Nenhum conteúdo nesta área para o recorte escolhido.','empty-note'));
    for(const item of items.sort((a,b)=>(a.order??Math.min(...a.lessons))-(b.order??Math.min(...b.lessons)))){const b=button(item.name,()=>{go(item.view,item.id);if(innerWidth<=760) $('.index-panel').open=false;},'menu-item'); b.replaceChildren(el('strong',item.name),el('small',lessons(item.lessons)+' · '+item.detail));if(state.id===item.id)b.setAttribute('aria-current','page');target.append(b);}
  }
  function showRoute(focus=false) {
    const [view,id]=location.hash.slice(1).split('/');
    let decoded;try{decoded=id?decodeURIComponent(id):state.id;}catch(_){decoded=state.id;}
    if(view==='caderno'&&resources.has(decoded)) state={view,id:decoded};
    else if(view==='atlas'&&topics.has(decoded))state={view,id:decoded};
    else if(view==='praticar'&&exercises.has(decoded))state={view,id:decoded};
    else if(view==='acervo') state={view:'acervo',id:'all'};
    content.replaceChildren();content.hidden=false;$('#results').hidden=true;
    if(state.view==='caderno')reading(resources.get(state.id)); else if(state.view==='atlas')atlasView(topics.get(state.id));else if(state.view==='praticar')practice(exercises.get(state.id));else archive();
    menu();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-current',b.dataset.view===(state.view==='acervo'?'caderno':state.view)?'page':'false'));
    document.title=(content.querySelector('h1')?.textContent||'Guia')+' · EAE1244';
    if(focus){window.scrollTo(0,0);$('#content').focus({preventScroll:true});}
  }
  const nums=[...new Set(data.resources.filter(r=>r.kind==='reading').flatMap(r=>r.lessons))].sort((a,b)=>a-b);
  nums.forEach(n=>{const o=el('option','Aula '+n);o.value=n;$('#lesson').append(o);});
  $('#lesson').addEventListener('change',menu);
  $('#archive').addEventListener('click',()=>go('acervo','all'));
  document.querySelector('[data-view="caderno"]').addEventListener('click',()=>go('caderno','moodle-resource-6577587'));
  document.querySelector('[data-view="atlas"]').addEventListener('click',()=>go('atlas','fim-bretton-woods'));
  document.querySelector('[data-view="praticar"]').addEventListener('click',()=>go('praticar','fim-bretton-woods-guided'));
  function collectText(value){if(typeof value==='string')return value;if(Array.isArray(value))return value.map(collectText).join(' ');if(value&&typeof value==='object')return Object.entries(value).filter(([k])=>!['refs','file_id','resource_id','basis'].includes(k)).map(([,v])=>collectText(v)).join(' ');return '';}
  const docs=[...data.resources.filter(r=>r.kind==='reading').map(r=>({view:'caderno',id:r.id,title:title(r),type:r.summary?'Caderno':'Resumo pendente',text:r.title+' '+r.authors.join(' ')+' '+lessons(r.lessons)+' '+collectText(r.summary)})),...data.atlas.map(t=>({view:'atlas',id:t.debate_id,title:t.title,type:'Atlas',text:collectText(t)})),...data.exercises.map(e=>({view:'praticar',id:e.exercise_id,title:e.title,type:e.mode==='guided'?'Treino guiado':'Treino autônomo',text:e.prompt+' '+e.works.map(author).join(' ')+' '+lessons(e.lessons)}))];
  function search(){const query=$('#search').value.trim(),results=$('#results');results.replaceChildren();$('#clear-search').hidden=!query;content.hidden=!!query;results.hidden=!query;if(!query)return;const matches=searchDocs(docs,query);const status=el('p',matches.length+' resultado'+(matches.length===1?'':'s'),'result-title');status.setAttribute('role','status');results.append(status);if(!matches.length)results.append(el('p','Nenhum resultado. Tente um autor, outra palavra ou limpe a busca.','notice'));for(const match of matches){const b=button('',()=>go(match.view,match.id),'result');b.append(el('small',match.type),el('h2',match.title),el('p',match.snippet));results.append(b);}}
  $('#search').addEventListener('input',search);
  $('#clear-search').addEventListener('click',()=>{$('#search').value='';search();$('#search').focus();});
  const mobileQuery=matchMedia('(max-width:760px)');
  mobileQuery.addEventListener('change',event=>{$('.index-panel').open=!event.matches;});
  window.addEventListener('hashchange',()=>showRoute(true));
  if(innerWidth<=760)$('.index-panel').open=false;
  showRoute();
})();
