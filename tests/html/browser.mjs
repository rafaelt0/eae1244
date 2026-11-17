// Run inside chrome-devtools-axi run, on the local generated guide.
const base = await page.eval(() => location.href.split('#')[0]);
const checks = [];
function check(name, ok) { if (!ok) throw Error(name); checks.push(name); }
const savedStudy = await page.eval(() => localStorage.getItem('eae1244:study:v1'));
const savedPractice = await page.eval(() => localStorage.getItem('eae1244:practice:v1'));
await page.eval(() => localStorage.removeItem('eae1244:study:v1'));
await page.eval(() => localStorage.removeItem('eae1244:practice:v1'));
await page.open(base);
check('opens on the start page with three study pathways', await page.eval(() => document.querySelectorAll('.contents-row').length === 8 && document.querySelectorAll('.pathway').length === 3));
check('start page shows the recorte and hides the reading menu', await page.eval(() => !document.querySelector('.recorte').hidden && document.querySelector('.index-panel').hidden));

await page.click('.pathway');
check('caderno pathway opens the caderno index', await page.eval(() => location.hash === '#caderno' && document.querySelector('h1').textContent === 'Caderno'));
check('caderno index shows the priority recorte first', await page.eval(() => document.querySelectorAll('.index-row').length === 14 && document.querySelectorAll('.index-group').length === 1));
await page.click('.index-filter .text-button');
check('caderno index expands to all 31 readings', await page.eval(() => document.querySelectorAll('.index-row').length === 31 && document.querySelectorAll('.index-group').length === 2 && document.querySelectorAll('.badge-short').length === 17));
await page.open(base + '#caderno/moodle-resource-6577587');
check('reading opens from the index with its section list', await page.eval(() => !!document.querySelector('.reading-toc') && document.querySelector('.topic-action[aria-current="page"]').textContent === 'Resumo'));
check('reading exposes navigation at the top and bottom', await page.eval(() => !!document.querySelector('.pager-top') && !!document.querySelector('.pager:not(.pager-top)')));
await page.click('.reading-toc a');
check('reading section updates the shareable URL', await page.eval(() => location.hash.includes('secao=')));
check('topic strip points Resumo to the current reading', await page.eval(() => document.querySelector('.topic-action').getAttribute('href').split('?')[0] === location.hash.split('?')[0]));
await page.click('.topic-action:nth-of-type(2)');
check('topic strip opens the atlas', await page.eval(() => location.hash === '#atlas/guerra-e-mobilizacao' && document.querySelectorAll('.mechanism-row').length === 3));
await page.click('.topic-action:nth-of-type(3)');
check('topic strip opens the guided exercise', await page.eval(() => location.hash === '#praticar/guerra-e-mobilizacao-guided'));
await page.open(base + '#praticar/fim-bretton-woods-guided');
await page.wait('#answer');
const before = await page.eval(() => localStorage.getItem('eae1244:practice:v1'));
try {
check('topic strip names the current topic', await page.eval(() => document.querySelector('.topic-strip').textContent.includes('Bretton Woods')));
await page.click('.topic-strip .review-toggle');
check('review mark is pressed', await page.eval(() => document.querySelector('.topic-strip .review-toggle').getAttribute('aria-pressed') === 'true' && document.querySelector('#review-count').textContent === '1'));
await page.click('[data-view="rever"]');
check('review list shows the marked topic', await page.eval(() => document.querySelectorAll('.contents-row').length === 1 && document.querySelector('.contents-row').textContent.includes('Bretton Woods')));
await page.click('.contents-row .review-toggle');
check('review list empties when unmarked', await page.eval(() => document.querySelectorAll('.contents-row').length === 0 && document.querySelector('.notice')));
await page.open(base);
check('resume strip returns to the last page', await page.eval(() => /^Continuar de onde parou/.test(document.querySelector('.resume')?.textContent || '') && document.querySelector('.resume-link')?.getAttribute('href').startsWith('#praticar/')));
check('start page reports study state', await page.eval(() => !!document.querySelector('#stat-saved') && !!document.querySelector('#stat-answered')));
await page.click('#theme-toggle');
const scheme = await page.eval(() => document.documentElement.style.colorScheme);
check('theme toggle switches and persists', scheme === 'dark' || scheme === 'light');
await page.open(base);
check('theme survives reload', (await page.eval(() => document.documentElement.style.colorScheme)) === scheme);
check('lesson options readable in both themes', await page.eval(() => {
  const root = document.documentElement, saved = root.style.colorScheme;
  const rgba = value => value.match(/[\d.]+/g).map(Number);
  const luminance = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const readable = [...document.querySelectorAll('#lesson option')].length > 0 && ['dark', 'light'].every(theme => {
    root.style.colorScheme = theme;
    return [...document.querySelectorAll('#lesson option')].every(option => {
      const style = getComputedStyle(option), back = rgba(style.backgroundColor), [a, b] = [luminance(rgba(style.color)), luminance(back)].sort((x, y) => y - x);
      return (back[3] ?? 1) === 1 && (a + 0.05) / (b + 0.05) >= 4.5;
    });
  });
  root.style.colorScheme = saved;
  return readable;
}));
await page.fill('#search', 'convergencia');
await page.click('#results .result-group .result');
check('search opens the matching section', await page.eval(() => /secao=/.test(location.hash) && /busca=/.test(location.hash) && !!document.querySelector('.back-search')));
check('search result highlights the matched term', await page.eval(() => document.querySelectorAll('#results .snippet mark').length > 0));
check('search input clears while the back link keeps the query', await page.eval(() => document.querySelector('#search').value === '' && document.querySelector('.back-search').textContent.includes('convergencia')));
check('back to search stays visible while reading', await page.eval(() => {const bar=document.querySelector('.search-return');const rect=bar.getBoundingClientRect();return getComputedStyle(bar).position === 'sticky' && rect.top >= 0 && rect.top < 100;}));
check('search target is not covered by the sticky return bar', await page.eval(() => {
  const bar=document.querySelector('.search-return');
  const section=new URLSearchParams(location.hash.split('?')[1]).get('secao');
  const target=section && document.getElementById(section);
  return !!target && target.getBoundingClientRect().top >= bar.getBoundingClientRect().bottom - 1;
}));
await page.click('.back-search');
check('back to search restores the results', await page.eval(() => document.querySelector('#search').value === 'convergencia' && !document.querySelector('#results').hidden));
await page.open(base + '#praticar/fim-bretton-woods-guided');
await page.wait('#answer');
check('supports start closed', await page.eval(() => !document.querySelector('#solution').open && !document.querySelector('#example').open));
await page.fill('#answer', 'QA: tese, mecanismo e contraponto.');
await page.click('[data-view="atlas"]');
check('atlas tab opens the atlas index', await page.eval(() => location.hash === '#atlas' && document.querySelectorAll('.topic-row').length === 8));
await page.open(base + '#atlas/fim-bretton-woods');
check('atlas renders mechanisms', await page.eval(() => document.querySelectorAll('.mechanism-row').length === 3));
await page.open(base + '#atlas/fim-bretton-woods?secao=proposicao');
check('atlas search target exists and is visible', await page.eval(() => {
  const target=document.getElementById('proposicao');
  if(!target) return false;
  const rect=target.getBoundingClientRect();
  return rect.top >= 0 && rect.top < 100;
}));
await page.click('.mechanism-row > summary');
check('mechanism opens', await page.eval(() => document.querySelector('.mechanism-row').open));
await page.click('[data-view="praticar"]');
check('practice tab opens the practice index', await page.eval(() => location.hash === '#praticar' && document.querySelectorAll('.exercise-card').length === 16 && document.body.textContent.includes('Rascunho salvo')));
await page.open(base + '#praticar/fim-bretton-woods-guided');
await page.wait('#answer');
check('draft survives navigation', await page.eval(() => document.querySelector('#answer').value === 'QA: tese, mecanismo e contraponto.'));
await page.fill('#search', 'COORDENACAO');
check('accent-insensitive search and no answer reveal', await page.eval(() => document.querySelectorAll('#results .result').length > 0 && !document.querySelector('#solution').open));
await page.fill('#search', 'no-such-result-123456789');
check('empty result state offers suggestions', await page.eval(() => document.querySelector('#results').textContent.includes('Nenhum resultado') && document.querySelectorAll('.suggestions button').length === 4));
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
await page.click('#download-answer');
check('export contains prompt and answer', await page.eval(async () => {
  const text = await window.__exportedAnswer.text();
  return text.includes('QA: tese, mecanismo e contraponto.') && text.includes('O fim de Bretton Woods') && text.includes('[x]');
}));
await page.eval(() => { window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('QA blocked storage'); }; });
await page.fill('#answer', 'QA: mantido na sessão sem armazenamento.');
check('blocked storage is visible', await page.eval(() => document.querySelector('#save-status').textContent.includes('indisponível')));
await page.click('[data-view="caderno"]');
check('caderno tab opens the caderno index', await page.eval(() => location.hash === '#caderno' && document.querySelectorAll('.index-row').length === 31));
await page.eval(() => { location.hash = '#praticar/fim-bretton-woods-guided'; });
await page.wait('#answer');
check('blocked storage preserves session draft', await page.eval(() => document.querySelector('#answer').value === 'QA: mantido na sessão sem armazenamento.'));
await page.eval(() => { Storage.prototype.setItem = window.__setItem; });
await page.open(base + '#ajuda');
check('help documents all three areas and shortcuts', await page.eval(() => document.querySelectorAll('.help-card').length === 3 && document.querySelectorAll('.shortcuts kbd').length === 2));
check('help has no skipped heading levels', await page.eval(() => {
  const levels=[...document.querySelectorAll('#article h1,#article h2,#article h3')].map(h=>Number(h.tagName[1]));
  return levels.length > 0 && levels.every((level,index)=>index === 0 || level <= levels[index-1] + 1);
}));
await page.open(base);
await page.press('/');
check('slash focuses the search', await page.eval(() => document.activeElement.id === 'search'));
await page.eval(() => { window.__errors = []; addEventListener('error', e => __errors.push(e.message)); addEventListener('unhandledrejection', e => __errors.push(String(e.reason))); });
const routes = await page.eval(async () => {
  const data = JSON.parse(document.querySelector('#guide-data').textContent);
  const routes = [...data.resources.filter(r => r.kind === 'reading').map(r => ['caderno', r.id, r]), ...data.atlas.map(t => ['atlas', t.debate_id, t]), ...data.exercises.map(e => ['praticar', e.exercise_id, e])];
  const failures = [];
  for (const [view, id, item] of routes) {
    location.hash = view + '/' + id;
    await new Promise(r => setTimeout(r, 20));
    if (!document.querySelector('#article h1')) failures.push(id + ': heading');
    if (!document.querySelector('.pager')) failures.push(id + ': pager');
    if (view === 'praticar' && (!document.querySelector('#answer') || document.querySelector('#solution').open || document.querySelector('h1').textContent !== item.title)) failures.push(id + ': practice');
    if (view === 'atlas' && document.querySelector('h1').textContent !== item.title) failures.push(id + ': atlas');
    if (view === 'caderno' && !document.querySelector('.originals a')?.href.endsWith(item.files[0].href)) failures.push(id + ': original');
    if (view === 'caderno' && !item.summary && ![...document.querySelectorAll('.notice')].some(n => n.textContent.includes('Resumo pendente'))) failures.push(id + ': pending');
    if (view === 'caderno' && item.summary && item.summary.status !== 'complete' && ![...document.querySelectorAll('.notice')].some(n => n.textContent.includes('ainda não revisada'))) failures.push(id + ': partial');
    if (view === 'caderno' && item.summary?.depth === 'short' && ![...document.querySelectorAll('.notice')].some(n => n.textContent.includes('Resumo curto'))) failures.push(id + ': short');
    if (view === 'caderno' && item.summary?.tables?.length && document.querySelectorAll('.data-table').length !== item.summary.tables.length) failures.push(id + ': tables');
  }
  return {count:routes.length, failures, errors:window.__errors};
});
check('all 55 content routes render', routes.count === 55 && routes.failures.length === 0 && (routes.errors || []).length === 0);
await page.click('#archive');
check('44 originals accessible', await page.eval(() => document.querySelectorAll('.archive-item .originals a').length === 44));
await page.open(base + '#caderno/moodle-resource-6577587');
check('source reference target meets the 24px minimum', await page.eval(() => document.querySelector('.source-meta summary').getBoundingClientRect().height >= 24));
await page.eval(() => window.scrollTo(0, 1200));
await new Promise(r => setTimeout(r, 360));
check('reading position is saved while scrolling', await page.eval(() => JSON.parse(localStorage.getItem('eae1244:study:v1')).positions['caderno/moodle-resource-6577587'] > 1000));
await page.eval(() => { location.hash = '#inicio'; });
await new Promise(r => setTimeout(r, 250));
await page.eval(() => { location.hash = '#caderno/moodle-resource-6577587'; });
await new Promise(r => setTimeout(r, 350));
check('reading position is restored on return', await page.eval(() => window.scrollY > 1000));
await page.eval(() => { document.activeElement?.blur(); document.body.setAttribute('tabindex','-1'); document.body.focus(); });
await page.press('Tab');
check('keyboard skip link', await page.eval(() => document.activeElement.textContent === 'Pular para o conteúdo'));
await page.press('Enter');
check('skip link keeps the route and focuses main', await page.eval(() => location.hash.startsWith('#caderno/') && document.activeElement.id === 'content'));
await page.open(base + '#caderno/moodle-resource-6614397');
check('sidebar keeps the current reading visible', await page.eval(() => {
  const sidebar=document.querySelector('.sidebar'), active=document.querySelector('.menu-item[aria-current="page"]');
  if(!sidebar||!active) return false;
  const s=sidebar.getBoundingClientRect(), a=active.getBoundingClientRect();
  return a.top>=s.top-1 && a.bottom<=s.bottom+1;
}));
await page.open(base + '#praticar/crescimento-era-de-ouro-guided');
await page.wait('#answer');
check('download waits for text or self-review', await page.eval(() => document.querySelector('#download-answer').disabled));
await page.fill('#answer', 'Rascunho mínimo.');
check('download enables after writing', await page.eval(() => !document.querySelector('#download-answer').disabled));
await page.click('.topic-strip > button.text-button');
check('share dialog has an accessible name and copy action', await page.eval(() => document.querySelector('#share-dialog').getAttribute('aria-labelledby') === 'share-title' && !!document.querySelector('#copy-share')));
await page.eval(() => document.querySelector('#share-dialog').close());
console.log(JSON.stringify({checks, routes}));

} finally {
  await page.eval(`() => {for (const [key, previous] of [['eae1244:practice:v1', ${JSON.stringify(savedPractice)}], ['eae1244:study:v1', ${JSON.stringify(savedStudy)}]]) { if(previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous); }}`);
}
