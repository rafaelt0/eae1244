"""Build the throwaway taste prototype from the existing study corpus."""

import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '.local/ux-proposta/taste'
SHORT_TITLES = {
    '6577587': 'Mobilização para a Segunda Guerra',
    '6601122': 'O ouro e Bretton Woods', '6601124': 'O fim de Bretton Woods',
    '6601125': 'O sistema de Bretton Woods', '6601131': 'O crescimento na Era de Ouro',
    '6614378': 'Ascensão e declínio soviético', '6614379': 'O colapso do planejamento central',
    '6614380': 'Estado e investimento no Leste Asiático', '6614388': 'Capital humano e o futuro da China',
    '6614394': 'Crise e mudança', '6614400': 'Fluxos de capital e crises financeiras',
    '6614390': 'Industrialização latino-americana', '6614395': 'Dívida e retorno ao mercado',
    '6614397': 'A economia mundial nos anos 1990',
}


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main():
    manifest = load(ROOT / 'data/fontes/manifest.json')
    summaries = {item['resource_id']: item for path in (ROOT / 'data/caderno').glob('*.json')
                 if (item := load(path))}
    resources, files = [], {}
    for resource in manifest['resources']:
        if resource['kind'] != 'reading':
            continue
        rid = resource['resource_id']
        summary = summaries.get(rid)
        resources.append({'id': rid, 'lessons': resource['lessons'],
                          'title': summary['title'] if summary else resource['label'],
                          'authors': summary['authors'] if summary else [],
                          'summary': {key: summary[key] for key in ('thesis', 'question', 'argument', 'concepts', 'limits')}
                          if summary else None})
        for file in resource['files']:
            files[file['file_id']] = {
                'href': 'originais/' + rid + '-' + file['file_id'][:12] + '.pdf',
                'label': summary['title'] if summary else resource['label'],
            }
    topic_keys = ('debate_id', 'title', 'lessons', 'works', 'question', 'positions', 'relations')
    topics = [{key: topic[key] for key in topic_keys} for path in (ROOT / 'data/atlas').glob('*.json')
              if (topic := load(path))]
    exercises = []
    for path in (ROOT / 'data/oficina').glob('*.json'):
        item = load(path)
        exercise = {key: item[key] for key in ('exercise_id', 'debate_id', 'mode', 'title', 'prompt',
                                             'lessons', 'works', 'planning_prompts', 'self_review')}
        exercise['answer_outline'] = {
            key: [{'text': point['text']} for point in item['answer_outline'][key]]
            for key in ('thesis', 'arguments_for', 'counterarguments', 'conclusion')}
        exercise['worked_paragraph'] = {key: item['worked_paragraph'][key] for key in ('text', 'commentary')}
        exercises.append(exercise)
    data = {'resources': resources, 'topics': topics,
            'exercises': exercises,
            'files': files, 'shortTitles': SHORT_TITLES,
            'icons': load(ROOT / 'web/prototype-icons.json'),
            'counts': {'complete': len(summaries), 'pending': len(resources) - len(summaries)}}
    replacements = {
        'STYLE': (ROOT / 'web/prototype-hub.css').read_text(),
        'APP': (ROOT / 'web/prototype-hub.js').read_text(),
        'DATA': json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026'),
    }
    template = (ROOT / 'web/prototype-hub.html').read_text()
    html = re.sub(r'/\*PROTOTYPE_(STYLE|APP|DATA)\*/', lambda match: replacements[match[1]], template)
    # Keep corpus punctuation in the data; visible typography uses the source text.
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / 'index.html').write_text(html)
    print(f'Built {OUTPUT / "index.html"} ({len(html.encode()) / 1024:.0f} KiB)')
    print('Open the file directly, or run: python3 -m http.server 8767 --bind 127.0.0.1 --directory .local/ux-proposta/taste')


if __name__ == '__main__':
    main()
