import copy
import importlib.util
import json
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("caderno", ROOT / "scripts/caderno.py")
caderno = importlib.util.module_from_spec(spec)
spec.loader.exec_module(caderno)

FID = "a" * 64
SLIDE_FID = "b" * 64
OTHER_FID = "c" * 64
PAGE_1 = "The gold standard transmitted the shock be-\ntween countries.   Early leavers recovered sooner."
PAGE_2 = "Countries that left gold in 1931 reached recovery earlier than the gold bloc."
REF = {"file_id": FID, "pdf_page": 1, "quote": "Early leavers recovered sooner"}


def resource(number, lessons, kind="reading", file_id=FID, review="reviewed", pages=2):
    return {
        "resource_id": f"moodle-resource-{number}", "label": "x", "lessons": lessons,
        "kind": kind, "requirement": "unspecified", "status": "verified",
        "source_url": f"https://edisciplinas.usp.br/mod/resource/view.php?id={number}",
        "files": [{"file_id": file_id, "extraction": {
            "status": "ready", "review_status": review, "page_count": pages,
            "pages_path": f".local/{file_id}.json"}}],
    }


def deep_entry(**overrides):
    entry = {
        "resource_id": "moodle-resource-1", "file_id": FID, "lessons": [18],
        "authors": ["Autor"], "title": "Título", "year": 1999, "depth": "deep",
        "status": "complete", "thesis": "O ouro transmitiu a crise.",
        "question": "O que propagou a crise?",
        "argument": [{"claim": "Quem saiu cedo se recuperou antes.", "refs": [REF]}],
        "mechanisms": [{"kind": "transmitter", "description": "Câmbio fixo.", "refs": [REF]}],
        "cases": [{"name": "Reino Unido", "period": "1931", "outcome": "Recuperação.", "refs": [REF]}],
        "concepts": [{"term": "padrão-ouro", "definition": "Regime cambial.", "refs": [REF]}],
        "evidence": [{"fact": "Recuperação em 1932.", "refs": [REF]}],
        "limits": ["Amostra de países."], "figures_note": [],
    }
    entry.update(overrides)
    return entry


class Workspace:
    def __init__(self, test, resources, entries=()):
        self.temp = tempfile.TemporaryDirectory()
        test.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / ".local").mkdir()
        (self.root / "data/caderno").mkdir(parents=True)
        pages = {FID: [PAGE_1, PAGE_2], SLIDE_FID: ["Slide um", "Slide dois"], OTHER_FID: [PAGE_1, PAGE_2]}
        for file_id, texts in pages.items():
            data = [{"pdf_page": n, "text": t} for n, t in enumerate(texts, 1)]
            (self.root / f".local/{file_id}.json").write_text(json.dumps(data), encoding="utf-8")
        self.manifest = {"schema_version": 1, "resources": resources}
        (self.root / "manifest.json").write_text(json.dumps(self.manifest), encoding="utf-8")
        for name, entry in entries:
            self.write_entry(name, entry)

    def write_entry(self, name, entry):
        (self.root / f"data/caderno/{name}.json").write_text(json.dumps(entry), encoding="utf-8")

    def run(self, *args):
        out, err = StringIO(), StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = caderno.main(list(args), root=self.root)
        return code, out.getvalue(), err.getvalue()

    def validate(self, scope="all"):
        return self.run("validate", "--manifest", "manifest.json", "--caderno", "data/caderno", "--scope", scope)


class EntryValidationTests(unittest.TestCase):
    def check(self, entry, review="reviewed", slides=False):
        resources = [resource(1, [18], review=review)]
        if slides:
            resources.append(resource(2, [18], kind="slides", file_id=SLIDE_FID))
        ws = Workspace(self, resources, [("moodle-resource-1", entry)])
        return ws.validate()

    def test_valid_deep_entry_passes(self):
        code, out, _ = self.check(deep_entry())
        self.assertEqual(code, 0, out)
        self.assertTrue(json.loads(out)["ok"])

    def test_quote_matches_after_hyphenation_and_whitespace(self):
        ref = {**REF, "quote": "shock between countries. Early leavers"}
        entry = deep_entry(argument=[{"claim": "x", "refs": [ref]}])
        self.assertEqual(self.check(entry)[0], 0)

    def test_quote_missing_from_page_fails(self):
        ref = {**REF, "quote": "Early leavers collapsed"}
        code, out, _ = self.check(deep_entry(argument=[{"claim": "x", "refs": [ref]}]))
        self.assertEqual(code, 1)
        self.assertIn("trecho", out)

    def test_quote_on_wrong_page_fails(self):
        ref = {**REF, "pdf_page": 2}
        self.assertEqual(self.check(deep_entry(argument=[{"claim": "x", "refs": [ref]}]))[0], 1)

    def test_page_out_of_range_fails(self):
        ref = {**REF, "pdf_page": 3}
        self.assertEqual(self.check(deep_entry(argument=[{"claim": "x", "refs": [ref]}]))[0], 1)

    def test_unknown_file_id_fails(self):
        ref = {**REF, "file_id": "d" * 64}
        self.assertEqual(self.check(deep_entry(argument=[{"claim": "x", "refs": [ref]}]))[0], 1)

    def test_quote_longer_than_25_words_fails(self):
        ref = {**REF, "quote": " ".join(["word"] * 26)}
        self.assertEqual(self.check(deep_entry(argument=[{"claim": "x", "refs": [ref]}]))[0], 1)

    def test_claim_without_refs_fails(self):
        code, out, _ = self.check(deep_entry(argument=[{"claim": "sem fonte", "refs": []}]))
        self.assertEqual(code, 1)
        self.assertIn("sem fonte", out)

    def test_deep_entry_with_empty_section_fails(self):
        for field in ("argument", "mechanisms", "cases", "concepts", "evidence", "limits"):
            with self.subTest(field=field):
                self.assertEqual(self.check(deep_entry(**{field: []}))[0], 1)

    def test_missing_required_field_fails(self):
        entry = deep_entry()
        del entry["thesis"]
        self.assertEqual(self.check(entry)[0], 1)

    def test_invalid_mechanism_kind_fails(self):
        bad = [{"kind": "magic", "description": "x", "refs": [REF]}]
        self.assertEqual(self.check(deep_entry(mechanisms=bad))[0], 1)

    def test_complete_requires_reviewed_source(self):
        self.assertEqual(self.check(deep_entry(), review="pending")[0], 1)

    def test_partial_accepts_unreviewed_source(self):
        self.assertEqual(self.check(deep_entry(status="partial"), review="pending")[0], 0)

    def test_deep_entry_needs_professor_emphasis_when_slides_exist(self):
        self.assertEqual(self.check(deep_entry(), slides=True)[0], 1)
        emphasis = [{"point": "Questões do professor.", "refs": [{"file_id": SLIDE_FID, "pdf_page": 2, "quote": "Slide dois"}]}]
        self.assertEqual(self.check(deep_entry(professor_emphasis=emphasis), slides=True)[0], 0)

    def test_short_entry_needs_thesis_and_refs_only(self):
        entry = {"resource_id": "moodle-resource-1", "file_id": FID, "lessons": [18],
                 "authors": ["A"], "title": "T", "depth": "short", "status": "partial",
                 "thesis": "Tese.", "refs": [REF]}
        self.assertEqual(self.check(entry)[0], 0)
        self.assertEqual(self.check({**entry, "refs": []})[0], 1)

    def test_entry_must_match_its_resource(self):
        self.assertEqual(self.check(deep_entry(resource_id="moodle-resource-9"))[0], 1)
        self.assertEqual(self.check(deep_entry(file_id=OTHER_FID))[0], 1)


class ScopeAndCliTests(unittest.TestCase):
    def test_missing_entry_for_priority_reading_fails(self):
        ws = Workspace(self, [resource(1, [18]), resource(3, [5], file_id=OTHER_FID)])
        code, out, _ = ws.validate("priority")
        self.assertEqual(code, 1)
        report = json.loads(out)
        self.assertEqual([i["resource_id"] for i in report["issues"]], ["moodle-resource-1"])

    def test_priority_scope_ignores_other_lessons(self):
        ws = Workspace(self, [resource(1, [18]), resource(3, [5], file_id=OTHER_FID)],
                       [("moodle-resource-1", deep_entry())])
        self.assertEqual(ws.validate("priority")[0], 0)
        self.assertEqual(ws.validate("all")[0], 1)

    def test_scope_without_readings_is_invalid_input(self):
        ws = Workspace(self, [resource(2, [18], kind="slides", file_id=SLIDE_FID)])
        self.assertEqual(ws.validate("priority")[0], 2)

    def test_malformed_entry_json_is_invalid_input(self):
        ws = Workspace(self, [resource(1, [18])])
        (ws.root / "data/caderno/moodle-resource-1.json").write_text("{", encoding="utf-8")
        self.assertEqual(ws.validate()[0], 2)

    def test_entry_path_cannot_escape_project(self):
        ws = Workspace(self, [resource(1, [18])])
        code, _, err = ws.run("validate", "--manifest", "manifest.json", "--caderno", "../outside", "--scope", "all")
        self.assertEqual(code, 2)

    def test_coverage_separates_priority_from_rest(self):
        ws = Workspace(self, [resource(1, [18]), resource(3, [5], file_id=OTHER_FID), resource(4, [6], file_id=OTHER_FID + "")],
                       [("moodle-resource-1", deep_entry())])
        code, out, _ = ws.run("coverage", "--manifest", "manifest.json", "--caderno", "data/caderno")
        report = json.loads(out)
        self.assertEqual(report["priority"], {"total": 1, "complete": 1, "partial": 0, "missing": 0})
        self.assertEqual(report["other"]["missing"], 2)
        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
