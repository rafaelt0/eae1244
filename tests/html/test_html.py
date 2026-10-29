import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('guide_html', ROOT / 'scripts/html.py')
guide = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guide)


class PackageTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        (self.root / 'web').mkdir()
        (self.root / 'web/index.html').write_text('<!doctype html><style>/*STYLE*/</style><script type="application/json" id="guide-data">/*DATA*/</script><script>/*APP*/</script>')
        (self.root / 'web/style.css').write_text('body { color: black; }')
        (self.root / 'web/app.js').write_text('document.title = "Guide";')
        source = self.root / 'original.pdf'
        source.write_bytes(b'%PDF-1.4 synthetic original')
        self.original = {'source': source, 'path': 'originais/work.pdf',
                         'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}
        self.output = self.root / 'dist/guide'
        self.data = {'resources': [{'title': '</script><script>alert(1)</script>'}], 'atlas': [], 'exercises': []}

    def build(self, originals=None, data=None):
        return guide.build_package(self.root, self.output, data or self.data, originals or [self.original])

    def test_portable_package_contains_safe_inline_data_and_intact_original(self):
        self.build()
        html = (self.output / 'index.html').read_text()
        self.assertNotIn('</script><script>alert', html)
        self.assertIn('\\u003c/script', html)
        self.assertEqual((self.output / 'originais/work.pdf').read_bytes(), self.original['source'].read_bytes())
        self.assertEqual(guide.verify_package(self.output), [])
        with zipfile.ZipFile(self.output.with_suffix('.zip')) as archive:
            self.assertIn('guide/index.html', archive.namelist())
            self.assertEqual(archive.read('guide/originais/work.pdf'), self.original['source'].read_bytes())

    def test_source_hash_mismatch_does_not_replace_existing_package(self):
        self.build()
        before = (self.output / 'index.html').read_bytes()
        zip_before = self.output.with_suffix('.zip').read_bytes()
        self.original['source'].write_bytes(b'changed')
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual((self.output / 'index.html').read_bytes(), before)
        self.assertEqual(self.output.with_suffix('.zip').read_bytes(), zip_before)

    def test_verify_detects_original_and_html_tampering(self):
        for path in ('originais/work.pdf', 'index.html'):
            self.build()
            (self.output / path).write_bytes(b'changed')
            self.assertTrue(guide.verify_package(self.output))

    def test_zip_tampering_is_detected(self):
        self.build()
        self.output.with_suffix('.zip').write_bytes(b'bad zip')
        self.assertTrue(guide.verify_package(self.output))

    def test_paths_and_unowned_outputs_are_rejected(self):
        for bad in ('../escape.pdf', '/tmp/escape.pdf', 'originais/../../escape.pdf'):
            with self.subTest(path=bad), self.assertRaises(ValueError):
                self.build([{**self.original, 'path': bad}])
        self.output.mkdir(parents=True, exist_ok=True)
        (self.output / 'personal.txt').write_text('keep')
        with self.assertRaises(ValueError):
            self.build()
        self.assertEqual((self.output / 'personal.txt').read_text(), 'keep')
        with self.assertRaises(ValueError):
            guide.build_package(self.root, self.root / 'data', self.data, [self.original])

    def test_symlink_and_oversize_html_are_rejected(self):
        other = self.root / 'external'
        other.mkdir()
        (self.root / 'dist').symlink_to(other, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.build()
        (self.root / 'dist').unlink()
        with self.assertRaises(ValueError):
            self.build(data={'text': 'x' * (4 * 1024 * 1024)})

    def test_duplicate_destinations_are_rejected(self):
        with self.assertRaises(ValueError):
            self.build([self.original, self.original])

    def test_missing_prior_summaries_are_recorded_as_pending(self):
        resources = [{'resource_id': 'r1', 'kind': 'reading', 'lessons': [17], 'label': 'Priority', 'files': []},
                     {'resource_id': 'r2', 'kind': 'reading', 'lessons': [2], 'label': 'Earlier', 'files': []}]
        data, originals = guide.present_data({'resources': resources}, {}, [], [], self.root)
        self.assertIsNone(data['resources'][1]['summary'])
        self.assertEqual(data['counts']['pending'], 2)
        self.assertEqual(originals, [])


if __name__ == '__main__':
    unittest.main()
