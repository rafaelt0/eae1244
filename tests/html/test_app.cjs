const {test} = require('node:test');
const assert = require('node:assert/strict');
const {normalize, searchDocs, createDraftStore, relatedTopics, studyExercise, collectText} = require('../../web/app.js');

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
