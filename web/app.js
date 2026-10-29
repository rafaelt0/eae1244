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
    for (const ref of unique) {
      const file=byFile[ref.file_id];
      box.append(el('blockquote',ref.quote));
      if (file) { const a=el('a',file.label+' · página física '+ref.pdf_page); a.href=file.href+'#page='+ref.pdf_page; a.target='_blank'; a.rel='noopener'; box.append(a); }
    }
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
  function menu() {
    const target=$('#menu');target.replaceChildren();
    const filter=$('#lesson').value;
    const visible=values=>filter==='all'||(filter==='priority'?values.some(n=>n>=17&&n<=28):values.includes(Number(filter)));
    let items=[];
    if(state.view==='caderno'||state.view==='acervo') items=data.resources.filter(r=>r.kind==='reading'&&visible(r.lessons)).map(r=>({id:r.id,name:title(r),detail:r.summary?r.authors.join(', '):'Resumo pendente',lessons:r.lessons,view:'caderno'}));
    for(const item of items.sort((a,b)=>Math.min(...a.lessons)-Math.min(...b.lessons))){const b=button(item.name,()=>{go(item.view,item.id);if(innerWidth<=760) $('.index-panel').open=false;},'menu-item'); b.replaceChildren(el('strong',item.name),el('small',lessons(item.lessons)+' · '+item.detail));if(state.id===item.id)b.setAttribute('aria-current','page');target.append(b);}
  }
  function showRoute(focus=false) {
    const [view,id]=location.hash.slice(1).split('/');
    const decoded=id?decodeURIComponent(id):state.id;
    if(view==='caderno'&&resources.has(decoded)) state={view,id:decoded};
    else if(view==='acervo') state={view:'acervo',id:'all'};
    content.replaceChildren();content.hidden=false;$('#results').hidden=true;
    if(state.view==='caderno')reading(resources.get(state.id)); else archive();
    menu();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-current',b.dataset.view===(state.view==='acervo'?'caderno':state.view)?'page':'false'));
    document.title=(content.querySelector('h1')?.textContent||'Guia')+' · EAE1244';
    if(focus){window.scrollTo(0,0);$('#content').focus({preventScroll:true});}
  }
  const nums=[...new Set(data.resources.filter(r=>r.kind==='reading').flatMap(r=>r.lessons))].sort((a,b)=>a-b);
  nums.forEach(n=>{const o=el('option','Aula '+n);o.value=n;$('#lesson').append(o);});
  $('#lesson').addEventListener('change',menu);
  $('#archive').addEventListener('click',()=>go('acervo','all'));
  document.querySelector('[data-view="caderno"]').addEventListener('click',()=>go('caderno','moodle-resource-6577587'));
  window.addEventListener('hashchange',()=>showRoute(true));
  if(innerWidth<=760)$('.index-panel').open=false;
  showRoute();
})();
