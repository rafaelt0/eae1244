const {test} = require('node:test');
const assert = require('node:assert/strict');
const {normalize, searchDocs, buildSearchDocs, createDraftStore, createStudyStore, relatedTopics, studyExercise, collectText} = require('../../web/app.js');

test('search ignores accents and case and returns matching context', () => {
  assert.equal(normalize('EDUCAÇÃO'), 'educacao');
  const result = searchDocs([{text:'A coordenação é importante.', title:'Estado', view:'atlas', id:'one'}], 'COORDENACAO');
  assert.equal(result.length, 1);
  assert.match(result[0].snippet, /coordenação/);
  assert.equal(searchDocs([{text:'growth', title:'Growth'}], 'absent').length, 0);
});
test('draft and checks survive switching exercises and reloading', () => {
  const values = new Map();
  const storage = {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const store = createDraftStore(storage);
  assert.equal(store.update('one', {answer:'Minha tese', checks:['thesis']}), true);
  store.update('two', {answer:'Outro argumento'});
  const reloaded = createDraftStore(storage);
  assert.equal(reloaded.get('one').answer,'Minha tese');
  assert.deepEqual(reloaded.get('one').checks,['thesis']);
});
test('blocked storage keeps the complete draft in memory', () => {
  const store = createDraftStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
  assert.equal(store.update('one', {answer:'Preservar'}), false);
  assert.equal(store.get('one').answer,'Preservar');
});
test('malformed stored data does not become a draft', () => {
  const store = createDraftStore({getItem:()=>'{"drafts":{"one":{"answer":7,"checks":"bad"}}}',setItem(){}});
  assert.equal(store.get('one').answer,'');
  assert.deepEqual(store.get('one').checks,[]);
});

test('reading shortcuts prefer the closest topic and its guided exercise', () => {
  const reading = {id:'harrison',lessons:[17]};
  const topics = [{debate_id:'growth',lessons:[17,20],works:['harrison','crafts']},
                  {debate_id:'war',lessons:[17],works:['harrison']}];
  const related = relatedTopics(reading,topics);
  assert.equal(related[0].debate_id,'war');
  const exercises = [{exercise_id:'context',debate_id:'growth',mode:'independent',works:['harrison']},
                     {exercise_id:'war-guided',debate_id:'war',mode:'guided',works:['harrison']}];
  assert.equal(studyExercise(reading.id,related,exercises).exercise_id,'war-guided');
});

test('search text keeps prose and labels, never internal identifiers', () => {
  const topic = {debate_id:'fim-bretton-woods', entry_type:'debate', positions:[{resource_id:'moodle-resource-1', stance:'qualifies', summary:'Meissner apresenta Triffin.', refs:[{file_id:'abc', quote:'boost'}]}],
                 relations:[{id:'ajuste', type:'converge', between:['moodle-resource-1'], text:'Ambos ligam o colapso.'}]};
  const text = collectText(topic, {qualifies:'Qualifica a tese', converge:'Convergência'});
  assert.match(text, /Meissner apresenta Triffin/);
  assert.match(text, /Qualifica a tese/);
  assert.match(text, /Convergência/);
  for (const raw of ['qualifies', 'converge', 'moodle-resource', 'fim-bretton-woods', 'debate', 'ajuste', 'boost']) assert.doesNotMatch(text, new RegExp('\\b' + raw + '\\b'));
});

test('study context, review list and reading position survive reload without changing drafts', () => {
  const values = new Map();
  const storage = {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  createDraftStore(storage).update('war-guided',{answer:'Minha resposta',checks:['thesis']});
  const study = createStudyStore(storage);
  study.update({saved:['war'],topic:'war',last:{view:'praticar',id:'war-independent'},
    readings:{war:'harrison'},exercises:{war:'war-independent'},positions:{'caderno/harrison':810},theme:'dark'});
  const restored = createStudyStore(storage).get();
  assert.deepEqual(restored.saved,['war']);
  assert.deepEqual(restored.last,{view:'praticar',id:'war-independent'});
  assert.equal(restored.readings.war,'harrison');
  assert.equal(restored.exercises.war,'war-independent');
  assert.equal(restored.positions['caderno/harrison'],810);
  assert.equal(restored.theme,'dark');
  assert.equal(createDraftStore(storage).get('war-guided').answer,'Minha resposta');
});

test('unavailable study storage preserves the session and reports failure', () => {
  const study = createStudyStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
  assert.equal(study.update({saved:['war']}),false);
  assert.deepEqual(study.get().saved,['war']);
  assert.equal(study.available,false);
});

test('invalid persisted study metadata is ignored instead of breaking navigation', () => {
  const storage = {getItem:()=>JSON.stringify({schema_version:1,saved:'wrong',last:{view:'unknown',id:'war'},
    readings:{war:7},positions:{bad:-10,infinite:'Infinity'},theme:'wrong'}),setItem(){}};
  const restored = createStudyStore(storage).get();
  assert.deepEqual(restored.saved,[]);
  assert.equal(restored.last,null);
  assert.equal(restored.readings.war,undefined);
  assert.equal(restored.positions.bad,undefined);
  assert.equal(restored.theme,'system');
});

test('search opens the matching section, lists each item once and never indexes solutions', () => {
  const docs=buildSearchDocs({resources:[{id:'r1',kind:'reading',title:'O crescimento',authors:['Autora'],lessons:[20],
    summary:{thesis:'Tese principal',concepts:[{term:'Convergência',definition:'Aproximação das rendas.'}]}}],atlas:[],
    exercises:[{exercise_id:'q1',title:'Questão',mode:'guided',prompt:'Explique o crescimento.',works:['r1'],lessons:[20],answer_outline:{thesis:[{text:'SOLUCAO_RESERVADA'}]}}]});
  const match=searchDocs(docs,'convergencia');
  assert.equal(match.length,1);
  assert.equal(match[0].id,'r1');assert.equal(match[0].section,'conceitos');
  assert.match(match[0].snippet,/Convergência/);
  assert.equal(searchDocs(docs,'Autora').filter(doc=>doc.view==='caderno').length,1);
  assert.equal(searchDocs(docs,'SOLUCAO_RESERVADA').length,0);
  assert.equal(searchDocs(docs,'Autora').some(doc=>doc.view==='praticar'),true);
});

test('table cells of a reading are searchable and point to the tables section', () => {
  const summary = {thesis:'Tese', tables:[{label:'Tabela 1', title:'Crescimento', supports:'Sustenta.', file_id:'f', pdf_page:4, columns:['País','1950-73'], rows:[['Coreia','5.9']]}]};
  const docs = buildSearchDocs({resources:[{id:'r', kind:'reading', title:'Rodrik', authors:['Rodrik'], lessons:[23], summary}], atlas:[], exercises:[]});
  const hit = searchDocs(docs, 'Coreia 5.9');
  assert.equal(hit.length, 1);
  assert.equal(hit[0].section, 'tabelas');
});
