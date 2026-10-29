"""Validação e cobertura do atlas de debates de EAE1244."""

import argparse
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from caderno import (Sources, check_refs, is_priority, load_entries, readings,
                     slides_for, validate_entry)
from fontes import local_path

STANCES = {'supports', 'rejects', 'qualifies', 'other'}
KINDS = {'cause', 'transmitter', 'political_economy', 'other', 'absent'}
RELATIONS = {'converge', 'diverge', 'context'}
OUTLINE = ('thesis', 'arguments_for', 'counterarguments', 'conclusion')


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def records(value, where, errors, required=True):
    if not isinstance(value, list) or (required and not value):
        errors.append(f'{where}: lista ausente ou vazia.')
        return []
    if any(not isinstance(item, dict) for item in value):
        raise ValueError(f'{where}: esperado objeto em cada item.')
    return value


def identifiers(value):
    return isinstance(value, list) and all(nonempty(x) for x in value) and len(set(value)) == len(value)


def reference_keys(value):
    if isinstance(value, dict):
        if {'file_id', 'pdf_page', 'quote'}.issubset(value):
            yield (value['file_id'], value['pdf_page'], value['quote'])
        else:
            for child in value.values():
                yield from reference_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from reference_keys(child)


def cited(where, refs, works, entries, sources):
    """Conferir página, trecho e pertencimento às obras indicadas."""
    errors = check_refs(where, refs, sources)
    if not isinstance(refs, list):
        return errors
    wanted = {entries[r]['file_id'] for r in works if r in entries}
    found = {r.get('file_id') for r in refs if isinstance(r, dict) and isinstance(r.get('file_id'), str)}
    if not wanted.issubset(found) or found - wanted:
        errors.append(f'{where}: referências devem pertencer a todas e somente às obras indicadas.')
    known = {key for rid in works if rid in entries for key in reference_keys(entries[rid])}
    if any(key not in known for key in reference_keys(refs)):
        errors.append(f'{where}: referência não presente no caderno consumido.')
    return errors


def validate_debate(entry, resources, entries, sources):
    errors = []
    for field in ('debate_id', 'title', 'question', 'thesis_statement'):
        if not nonempty(entry.get(field)):
            errors.append(f'{field}: texto obrigatório.')
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', entry.get('debate_id', '') or ''):
        errors.append('debate_id: identificador inválido.')
    if entry.get('schema_version') != 1 or type(entry.get('schema_version')) is not int:
        errors.append('schema_version: esperado 1.')
    kind = entry.get('entry_type')
    works = entry.get('works')
    if not identifiers(works) or not works:
        return errors + ['works: lista de IDs únicos obrigatória.']
    if kind not in {'debate', 'single_reading'} or (kind == 'debate' and len(works) < 2) or (kind == 'single_reading' and len(works) != 1):
        errors.append('entry_type: debate exige duas obras; single_reading exige uma.')
    if any(r not in resources or r not in entries for r in works):
        return errors + ['works: obra desconhecida ou sem caderno completo.']
    lessons = sorted({n for r in works for n in resources[r]['lessons']})
    if entry.get('lessons') != lessons:
        errors.append('lessons: deve corresponder às aulas das obras.')
    positions = records(entry.get('positions'), 'positions', errors)
    if [p.get('resource_id') for p in positions].count(None) or sorted(p.get('resource_id', '') for p in positions) != sorted(works):
        errors.append('positions: deve haver uma posição por obra.')
    for position in positions:
        rid = position.get('resource_id')
        if position.get('stance') not in STANCES or not nonempty(position.get('summary')):
            errors.append('positions: stance ou summary inválido.')
        errors += cited('positions', position.get('refs'), [rid], entries, sources)
    relations = records(entry.get('relations'), 'relations', errors, required=kind != 'single_reading')
    relation_ids = [r.get('id') for r in relations]
    if not identifiers(relation_ids):
        errors.append('relations: IDs ausentes ou repetidos.')
    if kind == 'single_reading' and relations:
        errors.append('relations: verbete não compara obras.')
    if kind == 'debate' and not any(r.get('type') in {'converge', 'diverge'} for r in relations):
        errors.append('relations: debate exige convergência ou divergência fundamentada.')
    for relation in relations:
        pair = relation.get('between')
        if not identifiers(pair) or len(pair) != 2 or not set(pair).issubset(works):
            errors.append('relations: par inválido.')
            continue
        if relation.get('type') not in RELATIONS or not nonempty(relation.get('text')):
            errors.append('relations: tipo ou texto inválido.')
        errors += cited('relations', relation.get('refs'), pair, entries, sources)
    matrix = entry.get('mechanism_matrix', {})
    if not isinstance(matrix, dict):
        raise ValueError('mechanism_matrix: esperado objeto.')
    if matrix.get('interpretation') is not True:
        errors.append('mechanism_matrix: marcar interpretation como true.')
    for row in records(matrix.get('rows'), 'mechanism_matrix.rows', errors):
        if not nonempty(row.get('mechanism')):
            errors.append('mechanism_matrix: mecanismo sem nome.')
        cells = records(row.get('classifications'), 'classifications', errors)
        if sorted(c.get('resource_id', '') for c in cells) != sorted(works):
            errors.append('classifications: deve haver uma classificação por obra.')
        for cell in cells:
            if cell.get('kind') not in KINDS or not nonempty(cell.get('explanation')):
                errors.append('classifications: tipo ou explicação inválido.')
            if cell.get('kind') == 'absent':
                if cell.get('refs') != []:
                    errors.append('classifications: absent exige refs vazias e explicação de limite.')
            else:
                errors += cited('classifications', cell.get('refs'), [cell.get('resource_id')], entries, sources)
    return errors + validate_context_and_outline(entry, works, relation_ids, entries, sources)


def validate_context_and_outline(entry, works, relation_ids, entries, sources):
    errors = []
    for case in records(entry.get('cases'), 'cases', errors):
        if not nonempty(case.get('name')):
            errors.append('cases: nome obrigatório.')
        views = records(case.get('readings'), 'cases.readings', errors)
        ids = [view.get('resource_id') for view in views]
        if not identifiers(ids) or not set(ids).issubset(works) or len(ids) < min(2, len(works)):
            errors.append('cases: caso deve ser compartilhado por duas obras, exceto verbete.')
        for view in views:
            if not nonempty(view.get('text')):
                errors.append('cases: descrição obrigatória.')
            errors += cited('cases', view.get('refs'), [view.get('resource_id')], entries, sources)
    for context in records(entry.get('context_differences'), 'context_differences', errors):
        ids = context.get('works')
        if not identifiers(ids) or not ids or not set(ids).issubset(works):
            errors.append('context_differences: obras inválidas.')
            continue
        if not nonempty(context.get('text')):
            errors.append('context_differences: texto obrigatório.')
        errors += cited('context_differences', context.get('refs'), ids, entries, sources)
    outline = entry.get('verdict_outline', {})
    if not isinstance(outline, dict):
        raise ValueError('verdict_outline: esperado objeto.')
    if outline.get('interpretation') is not True:
        errors.append('verdict_outline: marcar interpretation como true.')
    anchors = {'position:' + r for r in works} | {'relation:' + r for r in relation_ids if isinstance(r, str)}
    for section in OUTLINE:
        for point in records(outline.get(section), f'verdict_outline.{section}', errors):
            basis = point.get('basis')
            if not nonempty(point.get('text')) or not identifiers(basis) or not basis or not set(basis).issubset(anchors):
                errors.append(f'verdict_outline.{section}: texto ou referência interna inválida.')
    return errors


def inspect_atlas(manifest, caderno_dir, atlas_dir, root):
    resources = {r['resource_id']: r for r in readings(manifest, 'all')}
    sources = Sources(manifest, root)
    entries, dependency_errors = {}, {}
    for rid, resource in resources.items():
        loaded = load_entries(caderno_dir, rid)
        if len(loaded) != 1 or loaded[0][1].get('status') != 'complete':
            continue
        entry = loaded[0][1]
        errors = validate_entry(entry, resource, sources, slides_for(manifest, resource))
        if errors:
            dependency_errors[rid] = errors
        else:
            entries[rid] = entry
    issues, debates, seen = [], [], set()
    for path in sorted(atlas_dir.glob('*.json')):
        entry = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(entry, dict):
            raise ValueError(f'{path.name}: esperado objeto JSON.')
        errors = validate_debate(entry, resources, entries, sources)
        did = entry.get('debate_id')
        if did in seen:
            errors.append('debate_id repetido.')
        if path.stem != did:
            errors.append('debate_id diverge do nome do arquivo.')
        seen.add(did)
        for rid in entry.get('works', []):
            errors += [f'{rid}: caderno inválido: {e}' for e in dependency_errors.get(rid, [])]
        issues += [{'entry': path.name, 'message': e} for e in errors]
        debates.append({'debate_id': did, 'works': entry.get('works', []), 'valid': not errors})
    covered = {r for d in debates if d['valid'] for r in d['works']}
    priority = {rid for rid, r in resources.items() if is_priority(r)}
    report = {'debates': debates, 'priority_total': len(priority),
              'covered_priority': sorted(priority & covered), 'missing_priority': sorted(priority - covered)}
    return {'ok': not issues and not report['missing_priority'], 'issues': issues, 'coverage': report}


def main(argv=None, root=None):
    root = (root or Path(__file__).resolve().parents[1]).resolve()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate', 'coverage'])
    for flag in ('manifest', 'caderno', 'atlas'):
        parser.add_argument('--' + flag, required=True)
    args = parser.parse_args(argv)
    try:
        manifest = json.loads(local_path(root, args.manifest).read_text(encoding='utf-8'))
        caderno_dir, atlas_dir = (local_path(root, p) for p in (args.caderno, args.atlas))
        if not caderno_dir.is_dir() or not atlas_dir.is_dir():
            raise ValueError('Diretório de caderno ou atlas inexistente.')
        report = inspect_atlas(manifest, caderno_dir, atlas_dir, root)
        print(json.dumps(report, ensure_ascii=False))
        return int(not report['ok'])
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f'Entrada inválida: {error}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
