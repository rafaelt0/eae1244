import copy
import importlib.util
import json
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

fixtures = load('atlas_fixtures', ROOT / 'tests/atlas/test_atlas.py')
oficina = load('oficina', ROOT / 'scripts/oficina.py')


def target(n=1, **overrides):
    return {'module': 'atlas', 'entry_id': 'test-debate', 'section': 'positions',
            'item': fixtures.rid(n), **overrides}


def exercise(theme='test-debate', mode='guided'):
    basis = [target(1, entry_id=theme), target(2, entry_id=theme)]
    point = {'text': 'Reasoned claim.', 'basis': basis}
    return {'schema_version': 1, 'exercise_id': f'{theme}-{mode}', 'debate_id': theme,
        'mode': mode, 'title': 'Title', 'prompt': 'Assess and compare.', 'lessons': [18],
        'works': [fixtures.rid(1), fixtures.rid(2)],
        'skills': ['assess_thesis', 'compare_authors', 'compare_cases', 'classify_mechanisms'],
        'planning_prompts': ['What is the mechanism?'] if mode == 'guided' else [],
        'answer_outline': {'interpretation': True, **{s: [copy.deepcopy(point)]
            for s in ('thesis', 'arguments_for', 'counterarguments', 'conclusion')}},
        'worked_paragraph': {'interpretation': True, 'text': 'Linked argument.',
            'basis': basis, 'commentary': 'Connect evidence and claim.'},
        'common_mistakes': [{'mistake': f'Mistake {n}', 'revision': 'Explain the link.', 'basis': basis}
            for n in (1, 2)],
        'self_review': [{'criterion': c, 'question': 'Did I explain this?'}
            for c in ('task', 'thesis', 'source_fidelity', 'reasoning', 'evidence', 'qualification')]}


class WorkshopTests(unittest.TestCase):
    def setUp(self):
        fixture = fixtures.AtlasTests()
        fixture.setUp()
        self.addCleanup(fixture.doCleanups)
        self.root = fixture.root
        self.write = fixture.write
        (self.root / 'data/oficina').mkdir()
        themes = ['test-debate', 'other-debate'] + [f'theme-{n}' for n in range(3, 9)]
        for theme in themes:
            other = fixtures.debate()
            other['debate_id'] = theme
            self.write(f'data/atlas/{theme}.json', other)
            for mode in ('guided', 'independent'):
                self.save(exercise(theme, mode))
        for n in (1, 2):
            path = self.root / f'data/caderno/{fixtures.rid(n)}.json'
            entry = json.loads(path.read_text())
            entry['argument'] = [{'claim': 'Evidence', 'refs': [fixtures.ref(n)]}]
            entry['limits'] = ['A documented limit.']
            self.write(str(path.relative_to(self.root)), entry)

    def save(self, entry, path=None):
        self.write(path or f'data/oficina/{entry["exercise_id"]}.json', entry)

    def run_cli(self, command='validate'):
        out, err = StringIO(), StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = oficina.main([command, '--manifest', 'manifest.json', '--caderno', 'data/caderno',
                                 '--atlas', 'data/atlas', '--oficina', 'data/oficina'], root=self.root)
        return code, out.getvalue(), err.getvalue()

    def bad(self, entry, message=None):
        self.save(entry)
        code, out, err = self.run_cli()
        self.assertEqual(code, 1, out + err)
        if message:
            self.assertIn(message, out)

    def test_complete_workshop_and_coverage_pass(self):
        for cmd in ('validate', 'coverage'):
            code, out, err = self.run_cli(cmd)
            self.assertEqual(code, 0, out + err)
            self.assertEqual(json.loads(out)['coverage']['valid_exercises'], 16)

    def test_missing_mode_and_empty_directory_are_incomplete(self):
        (self.root / 'data/oficina/test-debate-independent.json').unlink()
        self.assertEqual(self.run_cli()[0], 1)
        for path in (self.root / 'data/oficina').glob('*.json'):
            path.unlink()
        self.assertEqual(self.run_cli()[0], 1)

    def test_required_fields_and_outline_sections(self):
        for field in ('title', 'prompt', 'works', 'skills', 'worked_paragraph', 'common_mistakes', 'self_review'):
            entry = exercise()
            del entry[field]
            self.bad(entry)
        entry = exercise(mode='independent')
        entry['answer_outline']['counterarguments'] = []
        self.bad(entry, 'counterarguments')

    def test_basis_rejects_missing_relation_wrong_section_and_foreign_work(self):
        for bad in (target(section='relations', item='missing'), target(section='unknown'),
                    target(entry_id='missing'), target(3), target(module='unknown')):
            entry = exercise()
            entry['answer_outline']['thesis'][0]['basis'] = [bad]
            self.bad(entry)

    def test_caderno_indices_and_limits(self):
        base = {'module': 'caderno', 'entry_id': fixtures.rid(1), 'section': 'argument', 'item': 0}
        entry = exercise()
        entry['answer_outline']['thesis'][0]['basis'] = [base]
        self.save(entry)
        self.assertEqual(self.run_cli()[0], 0)
        for item in (-1, 1, True, '0'):
            entry['answer_outline']['thesis'][0]['basis'] = [{**base, 'item': item}]
            self.bad(entry)

    def test_each_support_item_needs_basis_and_interpretation(self):
        for section in ('answer_outline', 'worked_paragraph'):
            entry = exercise()
            entry[section]['interpretation'] = False
            self.bad(entry)
        for field in ('basis', 'text', 'commentary'):
            entry = exercise()
            del entry['worked_paragraph'][field]
            self.bad(entry)
        entry = exercise()
        entry['common_mistakes'][0]['basis'] = []
        self.bad(entry)

    def test_declared_works_without_substantive_use_do_not_count(self):
        entry = exercise()
        for section in ('thesis', 'arguments_for', 'counterarguments', 'conclusion'):
            entry['answer_outline'][section][0]['basis'] = [target(1)]
        entry['worked_paragraph']['basis'] = [target(1)]
        entry['skills'] = ['assess_thesis', 'compare_cases']
        self.bad(entry, 'sem uso')

    def test_planning_prompts_depend_on_mode(self):
        entry = exercise()
        entry['planning_prompts'] = []
        self.bad(entry)
        entry = exercise(mode='independent')
        entry['planning_prompts'] = ['Hint']
        self.bad(entry)

    def test_review_criteria_and_two_mistakes_required(self):
        entry = exercise()
        entry['self_review'].pop()
        self.bad(entry)
        entry = exercise()
        entry['common_mistakes'].pop()
        self.bad(entry)

    def test_duplicate_id_pair_and_filename_mismatch(self):
        self.save(exercise(), 'data/oficina/copy.json')
        self.assertEqual(self.run_cli()[0], 1)
        entry = exercise()
        entry['exercise_id'] = 'different-exercise'
        self.save(entry)
        self.assertEqual(self.run_cli()[0], 1)

    def test_unknown_theme_wrong_lessons_and_enums(self):
        for key, value in (('debate_id', 'unknown'), ('mode', 'auto'), ('schema_version', 2),
                           ('lessons', [5]), ('skills', ['unknown', 'compare_cases'])):
            entry = exercise()
            entry[key] = value
            self.bad(entry)

    def test_missing_atlas_theme_cannot_shrink_required_workshop(self):
        (self.root / 'data/atlas/theme-8.json').unlink()
        for mode in ('guided', 'independent'):
            (self.root / f'data/oficina/theme-8-{mode}.json').unlink()
        self.assertEqual(self.run_cli()[0], 1)

    def test_relation_and_caderno_limit_are_valid_bases(self):
        entry = exercise()
        entry['answer_outline']['thesis'][0]['basis'] = [target(section='relations', item='adjustment')]
        entry['common_mistakes'][0]['basis'] = [{'module': 'caderno', 'entry_id': fixtures.rid(1),
                                               'section': 'limits', 'item': 0}]
        self.save(entry)
        self.assertEqual(self.run_cli()[0], 0)

    def test_invalid_dependencies_fail(self):
        path = self.root / 'data/atlas/test-debate.json'
        entry = json.loads(path.read_text())
        entry['positions'][0]['refs'][0]['quote'] = 'Invented'
        self.write('data/atlas/test-debate.json', entry)
        self.assertEqual(self.run_cli()[0], 1)

    def test_malformed_inputs_return_two(self):
        path = self.root / 'data/oficina/test-debate-guided.json'
        path.write_text('{')
        self.assertEqual(self.run_cli()[0], 2)
        path.write_text('[]')
        self.assertEqual(self.run_cli()[0], 2)


if __name__ == '__main__':
    unittest.main()
