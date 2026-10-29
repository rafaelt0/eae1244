// Run inside chrome-devtools-axi run, on the local generated guide.
const base = await page.eval(() => location.href.split('#')[0]);
const checks = [];
function check(name, ok) { if (!ok) throw Error(name); checks.push(name); }
await page.open(base);
await page.click('.quick-links button:nth-of-type(1)');
check('reading opens its primary topic', await page.eval(() => location.hash === '#atlas/guerra-e-mobilizacao'));
await page.open(base);
await page.click('.quick-links button:nth-of-type(2)');
check('reading opens its guided exercise', await page.eval(() => location.hash === '#praticar/guerra-e-mobilizacao-guided'));
await page.open(base + '#praticar/fim-bretton-woods-guided');
await page.wait('#answer');
const before = await page.eval(() => localStorage.getItem('eae1244:practice:v1'));
try {
check('supports start closed', await page.eval(() => !document.querySelector('#solution').open && !document.querySelector('#example').open));
await page.fill('#answer', 'QA: tese, mecanismo e contraponto.');
await page.click('[data-view="atlas"]');
check('atlas renders mechanisms', await page.eval(() => document.querySelectorAll('.mechanism-row').length === 3));
await page.click('.mechanism-row > summary');
check('mechanism opens', await page.eval(() => document.querySelector('.mechanism-row').open));
await page.click('[data-view="praticar"]');
await page.wait('#answer');
check('draft survives navigation', await page.eval(() => document.querySelector('#answer').value === 'QA: tese, mecanismo e contraponto.'));
await page.fill('#search', 'COORDENACAO');
check('accent-insensitive search and no answer reveal', await page.eval(() => document.querySelectorAll('#results .result').length > 0 && !document.querySelector('#solution').open));
await page.fill('#search', 'no-such-result-123456789');
check('empty result state', await page.eval(() => document.querySelector('#results').textContent.includes('Nenhum resultado')));
await page.click('#clear-search');
await page.click('#solution > summary');
check('answer reveal is voluntary', await page.eval(() => document.querySelector('#solution').open));
if(!await page.eval(() => document.querySelector('.review-item input').checked)) await page.click('.review-item input');
await page.open(base + '#praticar/fim-bretton-woods-guided');
await page.wait('#answer');
check('draft and self-review survive reload', await page.eval(() => document.querySelector('#answer').value === 'QA: tese, mecanismo e contraponto.' && document.querySelector('.review-item input').checked));
await page.eval(() => {
  window.__originalObjectURL = URL.createObjectURL;
  URL.createObjectURL = blob => { window.__exportedAnswer = blob; return window.__originalObjectURL(blob); };
});
await page.click('#article section:nth-of-type(2) > button');
check('export contains prompt and answer', await page.eval(async () => {
  const text = await window.__exportedAnswer.text();
  return text.includes('QA: tese, mecanismo e contraponto.') && text.includes('O fim de Bretton Woods') && text.includes('[x]');
}));
await page.eval(() => { window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('QA blocked storage'); }; });
await page.fill('#answer', 'QA: mantido na sessão sem armazenamento.');
check('blocked storage is visible', await page.eval(() => document.querySelector('#save-status').textContent.includes('indisponível')));
await page.click('[data-view="atlas"]');
await page.click('[data-view="praticar"]');
check('blocked storage preserves session draft', await page.eval(() => document.querySelector('#answer').value === 'QA: mantido na sessão sem armazenamento.'));
await page.eval(() => { Storage.prototype.setItem = window.__setItem; window.__errors = []; addEventListener('error', e => __errors.push(e.message)); addEventListener('unhandledrejection', e => __errors.push(String(e.reason))); });
const routes = await page.eval(async () => {
  const data = JSON.parse(document.querySelector('#guide-data').textContent);
  const routes = [...data.resources.filter(r => r.kind === 'reading').map(r => ['caderno', r.id, r]), ...data.atlas.map(t => ['atlas', t.debate_id, t]), ...data.exercises.map(e => ['praticar', e.exercise_id, e])];
  const failures = [];
  for (const [view, id, item] of routes) {
    location.hash = view + '/' + id;
    await new Promise(r => setTimeout(r, 20));
    if (!document.querySelector('#article h1')) failures.push(id + ': heading');
    if (view === 'praticar' && (!document.querySelector('#answer') || document.querySelector('#solution').open || document.querySelector('h1').textContent !== item.title)) failures.push(id + ': practice');
    if (view === 'atlas' && document.querySelector('h1').textContent !== item.title) failures.push(id + ': atlas');
    if (view === 'caderno' && !document.querySelector('.originals a')?.href.endsWith(item.files[0].href)) failures.push(id + ': original');
    if (view === 'caderno' && !item.summary && ![...document.querySelectorAll('.notice')].some(n => n.textContent.includes('Resumo pendente'))) failures.push(id + ': pending');
  }
  return {count:routes.length, failures, errors:window.__errors};
});
check('all 55 content routes render', routes.count === 55 && routes.failures.length === 0 && routes.errors.length === 0);
await page.click('#archive');
check('44 originals accessible', await page.eval(() => document.querySelectorAll('.archive-item .originals a').length === 44));
await page.open(base);
await page.press('Tab');
check('keyboard skip link', await page.eval(() => document.activeElement.textContent === 'Pular para o conteúdo'));
await page.press('Enter');
check('skip link moves focus to main', await page.eval(() => document.activeElement.id === 'content'));
console.log(JSON.stringify({checks, routes}));

} finally {
  await page.eval(`() => {const previous = ${JSON.stringify(before)}; if(previous === null) localStorage.removeItem('eae1244:practice:v1'); else localStorage.setItem('eae1244:practice:v1', previous);}`);
}
