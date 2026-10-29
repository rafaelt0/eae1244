import copy
import importlib.util
import json
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('atlas', ROOT / 'scripts/atlas.py')
atlas = importlib.util.module_from_spec(spec)
spec.loader.exec_module(atlas)


def rid(n):
    return f'moodle-resource-{n}'


def ref(n):
    return {'file_id': str(n) * 64, 'pdf_page': 1, 'quote': f'Evidence from work {n}.'}


def debate():
    return {
        'schema_version': 1, 'entry_type': 'debate', 'debate_id': 'test-debate',
        'title': 'Debate', 'lessons': [18], 'question': 'Why?', 'thesis_statement': 'Gold mattered.',
        'works': [rid(1), rid(2)],
        'positions': [{'resource_id': rid(n), 'stance': 'qualifies', 'summary': 'Position',
                       'refs': [ref(n)]} for n in (1, 2)],
        'relations': [{'id': 'adjustment', 'between': [rid(1), rid(2)], 'type': 'converge',
                       'text': 'Both discuss adjustment.', 'refs': [ref(1), ref(2)]}],
        'mechanism_matrix': {'interpretation': True, 'rows': [
            {'mechanism': 'Adjustment', 'classifications': [
                {'resource_id': rid(n), 'kind': 'cause', 'explanation': 'A cause.', 'refs': [ref(n)]}
                for n in (1, 2)]}]},
        'cases': [{'name': 'Country', 'readings': [
            {'resource_id': rid(n), 'text': 'Outcome', 'refs': [ref(n)]} for n in (1, 2)]}],
        'context_differences': [{'text': 'Methods differ.', 'works': [rid(1), rid(2)],
                                 'refs': [ref(1), ref(2)]}],
        'verdict_outline': {'interpretation': True, **{
            section: [{'text': 'Argument', 'basis': ['position:' + rid(1), 'relation:adjustment']}]
            for section in ('thesis', 'arguments_for', 'counterarguments', 'conclusion')}},
    }


class AtlasTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in ('.local', 'data/caderno', 'data/atlas'):
            (self.root / path).mkdir(parents=True)
        resources = []
        for n in (1, 2, 3):
            file_id = str(n) * 64
            page = [{'pdf_page': 1, 'text': f'Evidence from work {n}. Unused evidence.'}]
            (self.root / f'.local/{n}.json').write_text(json.dumps(page))
            resources.append({'resource_id': rid(n), 'label': 'Work', 'lessons': [18] if n < 3 else [5],
                'kind': 'reading', 'requirement': 'unspecified', 'status': 'verified',
                'source_url': f'https://edisciplinas.usp.br/mod/resource/view.php?id={n}', 'files': [{'file_id': file_id,
                'extraction': {'status': 'ready', 'review_status': 'reviewed', 'page_count': 1,
                               'pages_path': f'.local/{n}.json'}}]})
            self.write(f'data/caderno/{rid(n)}.json', {'resource_id': rid(n), 'file_id': file_id,
                'lessons': [18] if n < 3 else [5], 'authors': ['Author'], 'title': 'Work',
                'depth': 'short', 'status': 'complete', 'thesis': 'Claim', 'refs': [ref(n)]})
        self.write('manifest.json', {'schema_version': 1, 'resources': resources})
        self.write('data/atlas/test-debate.json', debate())

    def write(self, path, data):
        (self.root / path).write_text(json.dumps(data), encoding='utf-8')

    def run_cli(self, command='validate'):
        out, err = StringIO(), StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = atlas.main([command, '--manifest', 'manifest.json', '--caderno', 'data/caderno',
                               '--atlas', 'data/atlas'], root=self.root)
        return code, out.getvalue(), err.getvalue()

    def check_bad(self, entry, message=None):
        self.write('data/atlas/test-debate.json', entry)
        code, out, err = self.run_cli()
        self.assertEqual(code, 1, out + err)
        if message:
            self.assertIn(message, out)

    def test_complete_debate_and_coverage_pass(self):
        for command in ('validate', 'coverage'):
            code, out, err = self.run_cli(command)
            self.assertEqual(code, 0, out + err)
            self.assertEqual(json.loads(out)['coverage']['missing_priority'], [])

    def test_missing_required_sections_fail(self):
        for field in ('question', 'positions', 'relations', 'mechanism_matrix', 'cases',
                      'context_differences', 'verdict_outline'):
            with self.subTest(field=field):
                entry = debate()
                del entry[field]
                self.check_bad(entry)

    def test_duplicate_ids_and_positions_fail(self):
        entry = debate()
        entry['positions'].append(copy.deepcopy(entry['positions'][0]))
        self.check_bad(entry)
        entry = debate()
        entry['relations'].append(copy.deepcopy(entry['relations'][0]))
        self.check_bad(entry)
        self.write('data/atlas/test-debate.json', debate())
        self.write('data/atlas/copy.json', debate())
        self.assertEqual(self.run_cli()[0], 1)

    def test_relations_require_evidence_from_both_works(self):
        for refs in ([ref(1)], [ref(1), ref(3)], []):
            entry = debate()
            entry['relations'][0]['refs'] = refs
            self.check_bad(entry)

    def test_quote_corruption_and_wrong_page_fail(self):
        for change in ({'quote': 'Fabricated quote'}, {'pdf_page': 2}, {'file_id': '9' * 64},
                       {'quote': 'word ' * 26}):
            entry = debate()
            entry['positions'][0]['refs'] = [{**ref(1), **change}]
            self.check_bad(entry)

    def test_quote_must_already_belong_to_caderno(self):
        entry = debate()
        entry['positions'][0]['refs'][0]['quote'] = 'Unused evidence.'
        self.check_bad(entry, 'caderno')

    def test_case_and_matrix_require_their_own_evidence(self):
        entry = debate()
        entry['cases'][0]['readings'][1]['refs'] = [ref(1)]
        self.check_bad(entry)
        entry = debate()
        entry['mechanism_matrix']['rows'][0]['classifications'].pop()
        self.check_bad(entry)

    def test_position_cannot_use_other_work(self):
        entry = debate()
        entry['positions'][0]['refs'] = [ref(2)]
        self.check_bad(entry)

    def test_partial_or_invalid_caderno_dependency_fails(self):
        path = self.root / f'data/caderno/{rid(1)}.json'
        entry = json.loads(path.read_text())
        for change in ({'status': 'partial'}, {'refs': []}):
            self.write(str(path.relative_to(self.root)), {**entry, **change})
            self.assertEqual(self.run_cli()[0], 1)

    def test_missing_priority_reading_fails_both_commands(self):
        entry = debate()
        entry['entry_type'] = 'single_reading'
        entry['works'] = [rid(1)]
        entry['positions'] = entry['positions'][:1]
        entry['relations'] = []
        entry['mechanism_matrix']['rows'][0]['classifications'] = entry['mechanism_matrix']['rows'][0]['classifications'][:1]
        entry['cases'][0]['readings'] = entry['cases'][0]['readings'][:1]
        entry['context_differences'] = [{'text': 'Scope', 'works': [rid(1)], 'refs': [ref(1)]}]
        for points in list(entry['verdict_outline'].values())[1:]:
            points[0]['basis'] = ['position:' + rid(1)]
        self.write('data/atlas/test-debate.json', entry)
        for command in ('validate', 'coverage'):
            code, out, err = self.run_cli(command)
            self.assertEqual(code, 1, out + err)
            report = json.loads(out)
            self.assertEqual(report['coverage']['missing_priority'], [rid(2)])
            self.assertEqual(report['issues'], [], out)

    def test_outline_requires_interpretation_and_resolved_basis(self):
        for key, value in (('interpretation', False), ('thesis', []),
                           ('conclusion', [{'text': 'x', 'basis': ['relation:missing']}])):
            entry = debate()
            entry['verdict_outline'][key] = value
            self.check_bad(entry)

    def test_matrix_requires_all_works_and_explained_absence(self):
        entry = debate()
        cell = entry['mechanism_matrix']['rows'][0]['classifications'][0]
        cell.update(kind='absent', explanation='Not addressed in this entry.', refs=[])
        self.write('data/atlas/test-debate.json', entry)
        self.assertEqual(self.run_cli()[0], 0)
        cell['explanation'] = ''
        self.check_bad(entry)
        entry = debate()
        entry['mechanism_matrix']['interpretation'] = False
        self.check_bad(entry)

    def test_unknown_work_invalid_enums_lessons_and_pairs_fail(self):
        changes = [('works', [rid(1), rid(9)]), ('lessons', [5]), ('schema_version', 2),
                   ('entry_type', 'anything')]
        for key, value in changes:
            entry = debate()
            entry[key] = value
            self.check_bad(entry)
        entry = debate()
        entry['relations'][0]['between'] = [rid(1), rid(1)]
        self.check_bad(entry)
        entry = debate()
        entry['positions'][0]['stance'] = 'maybe'
        self.check_bad(entry)

    def test_readings_outside_approved_priority_scope_fail(self):
        entry = debate()
        entry['works'].append(rid(3))
        entry['lessons'] = [5, 18]
        entry['positions'].append({'resource_id': rid(3), 'stance': 'other',
                                   'summary': 'Earlier context', 'refs': [ref(3)]})
        entry['mechanism_matrix']['rows'][0]['classifications'].append({
            'resource_id': rid(3), 'kind': 'other', 'explanation': 'Context', 'refs': [ref(3)]})
        self.check_bad(entry, '17–28')

    def test_empty_directory_is_incomplete(self):
        (self.root / 'data/atlas/test-debate.json').unlink()
        self.assertEqual(self.run_cli()[0], 1)

    def test_bad_json_and_missing_input_return_two(self):
        path = self.root / 'data/atlas/test-debate.json'
        path.write_text('{')
        self.assertEqual(self.run_cli()[0], 2)
        path.unlink()
        (self.root / 'data/atlas').rmdir()
        self.assertEqual(self.run_cli()[0], 2)


if __name__ == '__main__':
    unittest.main()
