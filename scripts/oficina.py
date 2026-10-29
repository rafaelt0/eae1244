"""Validação e cobertura da oficina de respostas de EAE1244."""

import argparse
from collections import Counter
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from atlas import OUTLINE, identifiers, inspect_atlas, nonempty, records
from caderno import load_entries, readings
from fontes import local_path

SKILLS = {'assess_thesis', 'compare_authors', 'compare_cases', 'classify_mechanisms'}
CRITERIA = {'task', 'thesis', 'source_fidelity', 'reasoning', 'evidence', 'qualification'}
CADERNO_SECTIONS = {'argument', 'mechanisms', 'cases', 'concepts', 'evidence', 'limits'}
MODES = {'guided', 'independent'}


def resolve_basis(base, atlas, caderno):
    """Resolver um alvo para as obras que ele efetivamente sustenta."""
    if not isinstance(base, dict):
        raise ValueError('basis: esperado objeto.')
    module, eid, section, item = (base.get(k) for k in ('module', 'entry_id', 'section', 'item'))
    if not nonempty(eid) or not nonempty(section):
        return None
    if module == 'atlas' and eid in atlas:
        if section == 'positions' and isinstance(item, str):
            position = next((p for p in atlas[eid]['positions'] if p['resource_id'] == item), None)
            return {item} if position else None
        if section == 'relations' and isinstance(item, str):
            relation = next((r for r in atlas[eid]['relations'] if r['id'] == item), None)
            return set(relation['between']) if relation else None
    if module == 'caderno' and eid in caderno and section in CADERNO_SECTIONS:
        items = caderno[eid].get(section, [])
        if type(item) is int and 0 <= item < len(items):
            return {eid}
    return None


def check_basis(value, works, atlas, caderno, errors, where):
    bases = records(value, where + '.basis', errors)
    used, themes = set(), set()
    for base in bases:
        resolved = resolve_basis(base, atlas, caderno)
        if not resolved:
            errors.append(f'{where}: base inexistente ou inválida.')
            continue
        if not resolved.issubset(works):
            errors.append(f'{where}: base envolve obra não declarada.')
            continue
        used |= resolved
        if base['module'] == 'atlas':
            themes.add(base['entry_id'])
    return used, themes


def validate_exercise(entry, atlas, caderno, resources):
    errors, used, themes = [], set(), set()
    for field in ('exercise_id', 'debate_id', 'title', 'prompt'):
        if not nonempty(entry.get(field)):
            errors.append(f'{field}: texto obrigatório.')
    if not isinstance(entry.get('exercise_id'), str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', entry['exercise_id']):
        errors.append('exercise_id: identificador inválido.')
    if type(entry.get('schema_version')) is not int or entry['schema_version'] != 1:
        errors.append('schema_version: esperado 1.')
    if entry.get('debate_id') not in atlas or entry.get('mode') not in MODES:
        errors.append('debate_id ou mode inválido.')
    works = entry.get('works')
    if not identifiers(works) or not works or not set(works).issubset(resources):
        return errors + ['works: lista inválida ou obra fora do recorte.'], set()
    lessons = sorted({n for r in works for n in resources[r]['lessons']})
    if entry.get('lessons') != lessons:
        errors.append('lessons: deve corresponder às obras utilizadas.')
    skills = entry.get('skills')
    if not identifiers(skills) or len(skills) < 2 or not set(skills).issubset(SKILLS):
        errors.append('skills: ao menos duas habilidades válidas e distintas.')
        skills = []
    prompts = entry.get('planning_prompts')
    if not isinstance(prompts, list) or any(not nonempty(p) for p in prompts):
        errors.append('planning_prompts: lista de textos obrigatória.')
    elif (entry.get('mode') == 'guided' and not prompts) or (entry.get('mode') == 'independent' and prompts):
        errors.append('planning_prompts: preencher somente no modo guided.')
    outline = entry.get('answer_outline', {})
    if not isinstance(outline, dict):
        raise ValueError('answer_outline: esperado objeto.')
    if outline.get('interpretation') is not True:
        errors.append('answer_outline: marcar interpretation como true.')
    for section in OUTLINE:
        for point in records(outline.get(section), 'answer_outline.' + section, errors):
            if not nonempty(point.get('text')):
                errors.append(f'answer_outline.{section}: texto obrigatório.')
            sources, topics = check_basis(point.get('basis'), works, atlas, caderno, errors, section)
            used |= sources
            themes |= topics
    paragraph = entry.get('worked_paragraph', {})
    if not isinstance(paragraph, dict):
        raise ValueError('worked_paragraph: esperado objeto.')
    if paragraph.get('interpretation') is not True or any(not nonempty(paragraph.get(f)) for f in ('text', 'commentary')):
        errors.append('worked_paragraph: interpretação, texto e comentário obrigatórios.')
    sources, topics = check_basis(paragraph.get('basis'), works, atlas, caderno, errors, 'worked_paragraph')
    used |= sources
    themes |= topics
    return errors + validate_review(entry, works, atlas, caderno, used, themes, skills), used


def validate_review(entry, works, atlas, caderno, used, themes, skills):
    errors = []
    mistakes = records(entry.get('common_mistakes'), 'common_mistakes', errors)
    if len(mistakes) < 2:
        errors.append('common_mistakes: ao menos dois erros frequentes.')
    for mistake in mistakes:
        if any(not nonempty(mistake.get(f)) for f in ('mistake', 'revision')):
            errors.append('common_mistakes: erro e orientação de revisão obrigatórios.')
        check_basis(mistake.get('basis'), works, atlas, caderno, errors, 'common_mistakes')
    review = records(entry.get('self_review'), 'self_review', errors)
    if sorted(r.get('criterion', '') for r in review) != sorted(CRITERIA):
        errors.append('self_review: exigir os seis critérios, sem repetição.')
    if any(not nonempty(r.get('question')) for r in review):
        errors.append('self_review: pergunta obrigatória.')
    if set(works) - used:
        errors.append('works: obra declarada sem uso no roteiro ou parágrafo.')
    if 'compare_authors' in skills and len(used) < 2:
        errors.append('compare_authors: exige pelo menos duas obras efetivamente usadas.')
    if entry.get('debate_id') not in themes:
        errors.append('basis: roteiro ou parágrafo deve usar o tema principal do atlas.')
    return errors


def inspect_workshop(manifest, caderno_dir, atlas_dir, workshop_dir, root):
    dependencies = inspect_atlas(manifest, caderno_dir, atlas_dir, root)
    resources = {r['resource_id']: r for r in readings(manifest, 'priority')}
    caderno = {}
    for rid in resources:
        loaded = load_entries(caderno_dir, rid)
        if len(loaded) == 1:
            caderno[rid] = loaded[0][1]
    atlas = {}
    for path in sorted(atlas_dir.glob('*.json')):
        entry = json.loads(local_path(root, path).read_text(encoding='utf-8'))
        atlas[entry['debate_id']] = entry
    issues, exercises, seen_ids, seen_pairs = [], [], set(), set()
    if not dependencies['ok']:
        issues.append({'entry': 'dependencies', 'message': 'Atlas ou caderno inválido/incompleto.', 'report': dependencies})
    for path in sorted(workshop_dir.glob('*.json')):
        entry = json.loads(local_path(root, path).read_text(encoding='utf-8'))
        if not isinstance(entry, dict):
            raise ValueError(f'{path.name}: esperado objeto JSON.')
        errors, used = validate_exercise(entry, atlas, caderno, resources)
        eid, theme, mode = (entry.get(f) for f in ('exercise_id', 'debate_id', 'mode'))
        pair = (theme, mode)
        if eid in seen_ids or pair in seen_pairs:
            errors.append('exercise_id ou par tema/modo repetido.')
        if path.stem != eid:
            errors.append('exercise_id diverge do nome do arquivo.')
        if not dependencies['ok']:
            errors.append('Dependências inválidas ou incompletas.')
        seen_ids.add(eid)
        seen_pairs.add(pair)
        issues += [{'entry': path.name, 'message': e} for e in errors]
        exercises.append({'exercise_id': eid, 'debate_id': theme, 'mode': mode,
                          'valid': not errors, 'used_works': sorted(used), 'skills': entry.get('skills', [])})
    valid = [e for e in exercises if e['valid']]
    counts = Counter((e['debate_id'], e['mode']) for e in valid)
    covered = {rid for e in valid for rid in e['used_works']}
    skills = {skill for e in valid for skill in e['skills']}
    coverage = {'valid_exercises': len(valid), 'total_exercises': len(exercises),
                'modes_by_theme': {t: {m: counts[t, m] for m in sorted(MODES)} for t in sorted(atlas)},
                'missing_pairs': [{'debate_id': t, 'mode': m} for t in sorted(atlas) for m in sorted(MODES) if counts[t, m] != 1],
                'used_priority': sorted(covered), 'missing_priority': sorted(set(resources) - covered),
                'covered_skills': sorted(skills), 'missing_skills': sorted(SKILLS - skills)}
    ok = not issues and not any(coverage[k] for k in ('missing_pairs', 'missing_priority', 'missing_skills'))
    return {'ok': ok, 'issues': issues, 'exercises': exercises, 'coverage': coverage}


def main(argv=None, root=None):
    root = (root or Path(__file__).resolve().parents[1]).resolve()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate', 'coverage'])
    for flag in ('manifest', 'caderno', 'atlas', 'oficina'):
        parser.add_argument('--' + flag, required=True)
    args = parser.parse_args(argv)
    try:
        manifest = json.loads(local_path(root, args.manifest).read_text(encoding='utf-8'))
        directories = [local_path(root, getattr(args, field)) for field in ('caderno', 'atlas', 'oficina')]
        if any(not d.is_dir() for d in directories):
            raise ValueError('Diretório de entrada inexistente.')
        report = inspect_workshop(manifest, *directories, root)
        print(json.dumps(report, ensure_ascii=False))
        return int(not report['ok'])
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f'Entrada inválida: {error}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
