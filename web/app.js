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
  if (typeof module !== 'undefined' && module.exports) { module.exports = {normalize, searchDocs, createDraftStore, relatedTopics, studyExercise, collectText}; return; }
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
  let state = {view:'caderno', id:'moodle-resource-6577587'};
  const content = $('#article');
  function button(text, action, className='link-button') { const b = el('button', text, className); b.type='button'; b.addEventListener('click',action); return b; }
  function go(view, id) {
    $('#search').value=''; $('#results').hidden=true; $('#clear-search').hidden=true; content.hidden=false;
    const hash = '#' + view + '/' + encodeURIComponent(id);
    if (location.hash === hash) showRoute(true); else location.hash = hash;
  }
  function section(name, parent=content) { const s=el('section',null,'content-section'); s.append(el('h2',name)); parent.append(s); return s; }
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
  function heading(lessonText, area, name, byline) {
    const head=el('p',null,'running-head');head.append(el('span',lessonText),el('span',area));
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
  function reading(resource) {
    heading(lessons(resource.lessons),'Caderno',title(resource),resource.authors.join(' · '));
    const colophon=el('div',null,'colophon');const meta=el('details',null,'source-meta');meta.append(el('summary','Referência completa'),el('p',resource.title));colophon.append(originalLinks(resource),meta);content.append(colophon);
    if(resource.files.some(f=>!f.reviewed)) content.append(el('p','A revisão da extração desta fonte ainda tem pendências. O original está disponível.','notice'));
    const entry=resource.summary;
    if(!entry){content.append(el('p','Resumo pendente. A leitura está no acervo e o original pode ser aberto acima; os resumos completos cobrem as aulas 17–28.','notice'));return;}
    if(entry.status!=='complete') content.append(el('p','Resumo parcial. Confira as ressalvas e o original.','notice'));
    content.append(el('p',entry.thesis,'lead'));
    if(entry.question){const q=el('p',null,'question');q.append(el('span','Pergunta','question-label'),document.createTextNode(entry.question));content.append(q);}
    content.append(el('p','⁂','ornament'));
    listSection('Argumento',entry.argument,'claim',true);
    listSection('Mecanismos',entry.mechanisms,'description');
    listSection('Conceitos',entry.concepts,'definition');
    listSection('Casos',entry.cases,'outcome');
    listSection('Evidências',entry.evidence,'fact');
    if(entry.limits?.length){const box=section('Ressalvas'),ul=el('ul',null,'limits');entry.limits.forEach(t=>ul.append(el('li',t)));box.append(ul);}
    listSection('Ênfases do professor',entry.professor_emphasis,'point');
    if(entry.figures_note?.length){const box=section('Figuras e tabelas');entry.figures_note.forEach(t=>box.append(el('p',t)));}
    const related=relatedTopics(resource,data.atlas);
    if(related.length){
      const exercise=studyExercise(resource.id,related,data.exercises);
      const entries=[['Atlas',related[0].title,()=>go('atlas',related[0].debate_id)]];
      if(exercise)entries.push(['Praticar','Questão '+questionNumber(exercise)+', '+modeName(exercise).toLowerCase(),()=>go('praticar',exercise.exercise_id)]);
      related.slice(1).forEach(t=>entries.push(['Atlas',t.title,()=>go('atlas',t.debate_id)]));
      seeAlso(content,entries).classList.add('quick-links');
    }
  }
  function archive() {
    heading('Acervo','Originais','Originais e apoios','44 arquivos: 31 leituras e 13 materiais de apoio');
    content.append(el('p','Estar no acervo não significa ter resumo nem extração revisada.','question'));
    const list=el('ol',null,'bibliography');
    for(const resource of data.resources){const box=el('li',null,'archive-item');const name=el('h2');name.append(resource.kind==='reading'?button(title(resource),()=>go('caderno',resource.id),'title-link'):document.createTextNode(title(resource)));box.append(name,el('p',[lessons(resource.lessons),resource.authors.join(', '),resource.kind==='reading'?(resource.summary?'com resumo':'resumo pendente'):'material de apoio'].filter(Boolean).join(' · ')),originalLinks(resource));list.append(box);}
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
    heading(lessons(topic.lessons),'Atlas',topic.title,topic.entry_type==='single_reading'?authors[0]+' · leitura única, comparação entre países':authors.join(' · '));
    content.append(el('p',topic.question,'question'));
    const proposition=el('blockquote',null,'proposition');proposition.append(el('span','Proposição em exame','question-label'),el('p',topic.thesis_statement));content.append(proposition);
    const works=el('ul',null,'see-also quick-links');
    topic.works.forEach(rid=>{const li=el('li');li.append(el('span','Caderno','see-area'),button(title(resources.get(rid)),()=>go('caderno',rid)));works.append(li);});
    const practiceLi=el('li');practiceLi.append(el('span','Praticar','see-area'),button('Questão '+questionNumber(exercises.get(topic.debate_id+'-guided'))+', guiada',()=>go('praticar',topic.debate_id+'-guided')));works.append(practiceLi);content.append(works);
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
  }
  let storage=null;try{storage=window.localStorage;}catch(_){}
  const drafts=createDraftStore(storage);
  function practice(exercise) {
    const topic=topics.get(exercise.debate_id);
    heading(lessons(exercise.lessons),'Praticar · '+modeName(exercise),exercise.title,topic.title);
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
    textarea.addEventListener('input',()=>statusText(drafts.update(exercise.exercise_id,{answer:textarea.value})));
    const download=button('Baixar minha resposta',()=>{const checks=drafts.get(exercise.exercise_id).checks;const text=exercise.title+'\n\n'+exercise.prompt+'\n\nMinha resposta\n\n'+textarea.value+'\n\nRevisão pessoal\n'+exercise.self_review.map(c=>(checks.includes(c.criterion)?'[x] ':'[ ] ')+c.question).join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=el('a');a.href=url;a.download=exercise.exercise_id+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);},'text-button');
    download.id='download-answer';
    const tools=el('div',null,'sheet-foot');tools.append(status,download);
    writing.append(sheet,tools,el('p','Os rascunhos ficam só neste navegador; mudar de navegador ou mover o pacote pode não levá-los junto. Baixe uma cópia para guardá-los.','storage-note'));
    const support=section('Apêndices');
    answerOutline(appendix(support,'A','Roteiro de resposta','solution'),exercise.answer_outline,true);
    appendix(support,'B','Parágrafo comentado','example').append(el('p',exercise.worked_paragraph.text,'worked-example'),el('p',exercise.worked_paragraph.commentary,'interpretation'),basisEvidence(exercise.worked_paragraph.basis));
    const mistakes=appendix(support,'C','Erros frequentes');exercise.common_mistakes.forEach(m=>{mistakes.append(el('h3',m.mistake),el('p',m.revision),basisEvidence(m.basis));});
    const review=section('Autoavaliação');review.append(el('p','Marque o que você conferiu. Não há nota.','interpretation'));
    const checks=drafts.get(exercise.exercise_id).checks,list=el('div',null,'review-list');
    for(const criterion of exercise.self_review){const l=el('label',null,'review-item'),input=el('input');input.type='checkbox';input.checked=checks.includes(criterion.criterion);input.addEventListener('change',()=>{const set=new Set(drafts.get(exercise.exercise_id).checks);input.checked?set.add(criterion.criterion):set.delete(criterion.criterion);statusText(drafts.update(exercise.exercise_id,{checks:[...set]}));});l.append(input,el('span',criterion.question));list.append(l);}
    review.append(list);
    const alternative=data.exercises.find(e=>e.debate_id===exercise.debate_id&&e.exercise_id!==exercise.exercise_id);
    const entries=[['Atlas',topic.title,()=>go('atlas',exercise.debate_id)]];
    if(alternative)entries.push(['Praticar','Questão '+questionNumber(alternative)+', '+modeName(alternative).toLowerCase(),()=>go('praticar',alternative.exercise_id)]);
    seeAlso(content,entries);
  }
  function menu() {
    const target=$('#menu');target.replaceChildren();
    const filter=$('#lesson').value;
    const visible=values=>filter==='all'||(filter==='priority'?values.some(n=>n>=17&&n<=28):values.includes(Number(filter)));
    let items=[];
    if(state.view==='caderno'||state.view==='acervo') items=data.resources.filter(r=>r.kind==='reading'&&visible(r.lessons)).map(r=>({id:r.id,num:lessonSpan(r.lessons),name:title(r),detail:r.summary?r.authors.join(', '):'Resumo pendente',lessons:r.lessons,view:'caderno'}));
    if(state.view==='atlas')items=data.atlas.filter(t=>visible(t.lessons)).map(t=>({id:t.debate_id,num:String(topicOrder.indexOf(t.debate_id)+1),name:t.title,detail:lessons(t.lessons)+' · '+(t.works.length===1?'leitura única':t.works.length+' leituras'),lessons:t.lessons,view:'atlas',order:topicOrder.indexOf(t.debate_id)}));
    if(state.view==='praticar')items=exerciseOrder.filter(e=>visible(e.lessons)).map(e=>({id:e.exercise_id,num:String(questionNumber(e)),name:e.title,detail:modeName(e)+' · '+lessons(e.lessons),lessons:e.lessons,view:'praticar',order:questionNumber(e)}));
    $('#menu-caption').textContent={praticar:'Questão',atlas:'Tema'}[state.view]||'Aula';
    if(!items.length)target.append(el('p','Nada nesta área para o recorte escolhido.','empty-note'));
    for(const item of items.sort((a,b)=>(a.order??Math.min(...a.lessons))-(b.order??Math.min(...b.lessons)))){const b=button(item.name,()=>{go(item.view,item.id);if(innerWidth<=760) $('.index-panel').open=false;},'menu-item'); b.replaceChildren(el('span',item.num,'toc-num'),el('strong',item.name),el('small',item.detail));if(state.id===item.id)b.setAttribute('aria-current','page');target.append(b);}
  }
  function showRoute(focus=false) {
    const [view,id]=location.hash.slice(1).split('/');
    let decoded;try{decoded=id?decodeURIComponent(id):state.id;}catch(_){decoded=state.id;}
    if(view==='caderno'&&resources.has(decoded)) state={view,id:decoded};
    else if(view==='atlas'&&topics.has(decoded))state={view,id:decoded};
    else if(view==='praticar'&&exercises.has(decoded))state={view,id:decoded};
    else if(view==='acervo') state={view:'acervo',id:'all'};
    content.replaceChildren();content.hidden=false;$('#results').hidden=true;
    content.dataset.view=state.view;
    if(state.view==='caderno')reading(resources.get(state.id)); else if(state.view==='atlas')atlasView(topics.get(state.id));else if(state.view==='praticar')practice(exercises.get(state.id));else archive();
    menu();document.querySelectorAll('[data-view]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-current',b.dataset.view===(state.view==='acervo'?'caderno':state.view)?'page':'false');});
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
  const docs=[...data.resources.filter(r=>r.kind==='reading').map(r=>({view:'caderno',id:r.id,title:title(r),type:r.summary?r.authors.join(', ')+' · '+lessons(r.lessons):'Resumo pendente · '+lessons(r.lessons),text:r.title+' '+r.authors.join(' ')+' '+lessons(r.lessons)+' '+collectText(r.summary,labels)})),...data.atlas.map(t=>({view:'atlas',id:t.debate_id,title:t.title,type:lessons(t.lessons),text:collectText(t,labels)})),...data.exercises.map(e=>({view:'praticar',id:e.exercise_id,title:'Questão '+questionNumber(e)+'. '+e.title,type:modeName(e)+' · '+lessons(e.lessons),text:e.prompt+' '+e.works.map(author).join(' ')+' '+lessons(e.lessons)}))];
  function search(){
    const query=$('#search').value.trim(),results=$('#results');results.replaceChildren();$('#clear-search').hidden=!query;content.hidden=!!query;results.hidden=!query;if(!query)return;
    const matches=searchDocs(docs,query);
    const status=el('p',matches.length+(matches.length===1?' entrada':' entradas')+' para “'+query+'”','result-title');status.setAttribute('role','status');results.append(el('h1','Índice remissivo'),status);
    if(!matches.length)results.append(el('p','Nenhum resultado. Tente um autor, outra palavra ou limpe a busca.','notice'));
    for(const [view,name] of [['caderno','Caderno'],['atlas','Atlas'],['praticar','Praticar']]){
      const group=matches.filter(m=>m.view===view);if(!group.length)continue;
      const box=el('section',null,'result-group');box.append(el('h2',name+' ('+group.length+')'));
      for(const match of group){const b=button('',()=>go(match.view,match.id),'result');b.append(el('strong',match.title),el('small',match.type),el('span',match.snippet,'snippet'));box.append(b);}
      results.append(box);
    }
  }
  $('#search').addEventListener('input',search);
  $('#clear-search').addEventListener('click',()=>{$('#search').value='';search();$('#search').focus();});
  const mobileQuery=matchMedia('(max-width:760px)');
  mobileQuery.addEventListener('change',event=>{$('.index-panel').open=!event.matches;});
  window.addEventListener('hashchange',()=>showRoute(true));
  if(innerWidth<=760)$('.index-panel').open=false;
  showRoute();
})();
