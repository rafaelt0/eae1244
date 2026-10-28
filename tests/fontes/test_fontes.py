import importlib.util
import hashlib
import json
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("fontes", ROOT / "scripts/fontes.py")
fontes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fontes)


def pdf_bytes(texts):
    """Small synthetic PDF: no course material is stored in test fixtures."""
    kids = " ".join(f"{4 + 2 * i} 0 R" for i in range(len(texts)))
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Count {len(texts)} /Kids [{kids}] >>".encode(),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    for index, text in enumerate(texts):
        stream = f"BT /F1 12 Tf 72 700 Td ({text}) Tj ET".encode()
        objects.extend([
            (f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
             f"/Resources << /Font << /F1 3 0 R >> >> "
             f"/Contents {5 + 2 * index} 0 R >>").encode(),
            f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream",
        ])
    result = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(result))
        result.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    start = len(result)
    result.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        result.extend(f"{offset:010d} 00000 n \n".encode())
    result.extend((f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\n"
                   f"startxref\n{start}\n%%EOF\n").encode())
    return bytes(result)


class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "sample.pdf"

    def test_preserves_page_order_and_blank_pages(self):
        self.path.write_bytes(pdf_bytes(["First page", "", "Third page"]))
        pages = fontes.extract_pdf(self.path)
        self.assertEqual([p["pdf_page"] for p in pages], [1, 2, 3])
        self.assertIn("First page", pages[0]["text"])
        self.assertEqual(pages[1]["text"], "")
        self.assertIn("empty_text", pages[1]["flags"])
        self.assertIn("Third page", pages[2]["text"])
        self.assertIsNone(pages[0]["printed_label"])

    def test_rejects_login_html_disguised_as_pdf(self):
        self.path.write_bytes(b"<html>Please log in</html>")
        with self.assertRaisesRegex(ValueError, "PDF"):
            fontes.extract_pdf(self.path)

    def test_rejects_truncated_pdf(self):
        self.path.write_bytes(pdf_bytes(["First page"])[:-12])
        with self.assertRaisesRegex(ValueError, "incompleto"):
            fontes.extract_pdf(self.path)


class SourceFixture:
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.incoming = self.root / ".local/fontes/recebidos"
        self.incoming.mkdir(parents=True)
        self.resource = {
            "resource_id": "moodle-resource-123", "label": "Leitura",
            "lessons": [18, 19], "kind": "reading", "requirement": "unspecified",
            "source_url": "https://edisciplinas.usp.br/mod/resource/view.php?id=123",
            "reading_instructions": [],
        }

    def receive(self, data, name="same.pdf"):
        path = self.incoming / "moodle-resource-123.bin"
        path.write_bytes(data)
        receipt = {
            "resource_id": self.resource["resource_id"], "original_name": name,
            "sha256": hashlib.sha256(data).hexdigest(), "byte_size": len(data),
            "retrieved_at": "2026-10-28T19:00:00+00:00",
        }
        path.with_suffix(".json").write_text(json.dumps(receipt))


class ProcessingTests(SourceFixture, unittest.TestCase):
    def test_preserves_original_and_extraction_on_rerun(self):
        data = pdf_bytes(["A complete synthetic page of text for testing"])
        self.receive(data)
        first = fontes.process_resource(self.resource, self.incoming, self.root)
        file = first["files"][0]
        self.assertEqual((self.root / file["relative_path"]).read_bytes(), data)
        self.assertEqual(file["sha256"], hashlib.sha256(data).hexdigest())
        self.assertEqual(file["extraction"]["page_count"], 1)
        self.assertEqual(file["extraction"]["review_status"], "pending")
        file["extraction"]["review_status"] = "reviewed"
        again = fontes.process_resource(self.resource, self.incoming, self.root, first)
        self.assertEqual(again["files"], first["files"])

    def test_changed_source_preserves_previous_version(self):
        self.receive(pdf_bytes(["The first version of a synthetic document"]))
        first = fontes.process_resource(self.resource, self.incoming, self.root)
        self.receive(pdf_bytes(["The second version of a synthetic document"]))
        second = fontes.process_resource(self.resource, self.incoming, self.root, first)
        self.assertEqual(second["previous_files"], first["files"])
        self.assertNotEqual(second["files"][0]["file_id"], first["files"][0]["file_id"])
        self.assertTrue((self.root / first["files"][0]["relative_path"]).is_file())

    def test_rerun_uses_preserved_original_when_incoming_is_gone(self):
        self.receive(pdf_bytes(["A preserved original remains usable after staging cleanup"]))
        first = fontes.process_resource(self.resource, self.incoming, self.root)
        for path in self.incoming.iterdir():
            path.unlink()
        again = fontes.process_resource(self.resource, self.incoming, self.root, first)
        self.assertEqual(again["files"], first["files"])
        self.assertEqual(again["status"], "verified")

    def test_detects_received_bytes_changed_after_transfer(self):
        self.receive(pdf_bytes(["Original text"]))
        (self.incoming / "moodle-resource-123.bin").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "hash_mismatch"):
            fontes.process_resource(self.resource, self.incoming, self.root)

    def test_refuses_paths_that_escape_the_project(self):
        with self.assertRaisesRegex(ValueError, "fora"):
            fontes.local_path(self.root, "../escape.pdf")

    def test_refuses_symlink_inside_the_project(self):
        target = self.root / "user-file.txt"
        target.write_text("keep")
        (self.root / "alias").symlink_to(target)
        with self.assertRaises(ValueError):
            fontes.local_path(self.root, "alias")


class VerificationTests(SourceFixture, unittest.TestCase):
    def reviewed_manifest(self):
        self.receive(pdf_bytes(["A synthetic document used to verify the local corpus"]))
        resource = fontes.process_resource(self.resource, self.incoming, self.root)
        resource["files"][0]["extraction"]["review_status"] = "reviewed"
        return {"schema_version": 1, "resources": [resource]}

    def test_verified_priority_corpus_is_not_total_corpus(self):
        manifest = self.reviewed_manifest()
        manifest["resources"].append({**self.resource, "resource_id": "moodle-resource-456",
                                      "source_url": "https://edisciplinas.usp.br/mod/resource/view.php?id=456",
                                      "lessons": [2], "status": "pending", "files": []})
        self.assertEqual(fontes.verify_manifest(manifest, self.root, "priority"), [])
        self.assertTrue(fontes.verify_manifest(manifest, self.root, "all"))

    def test_verifier_detects_changed_original(self):
        manifest = self.reviewed_manifest()
        file = manifest["resources"][0]["files"][0]
        (self.root / file["relative_path"]).write_bytes(b"tampered")
        issues = fontes.verify_manifest(manifest, self.root, "all")
        self.assertTrue(any("hash_mismatch" in str(issue) for issue in issues))

    def test_verifier_detects_changed_pages(self):
        manifest = self.reviewed_manifest()
        extraction = manifest["resources"][0]["files"][0]["extraction"]
        (self.root / extraction["pages_path"]).write_text("[]")
        self.assertTrue(fontes.verify_manifest(manifest, self.root, "all"))

    def test_unreviewed_text_is_not_ready_for_the_notebook(self):
        manifest = self.reviewed_manifest()
        manifest["resources"][0]["files"][0]["extraction"]["review_status"] = "pending"
        self.assertTrue(fontes.verify_manifest(manifest, self.root, "all"))

    def test_empty_scope_and_unknown_schema_are_errors(self):
        for manifest in [{"schema_version": 1, "resources": []},
                         {"schema_version": 2, "resources": []}]:
            with self.subTest(manifest=manifest), self.assertRaises(ValueError):
                fontes.verify_manifest(manifest, self.root, "all")


class CLITests(SourceFixture, unittest.TestCase):
    def run_cli(self, *args):
        with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
            return fontes.main(list(args), root=self.root)

    def prepare(self):
        self.receive(pdf_bytes(["A full synthetic reading with sufficient text for extraction"]))
        path = self.root / "data/fontes/inventory.json"
        path.parent.mkdir(parents=True)
        path.write_text(json.dumps({"schema_version": 1, "resources": [self.resource]}))
        return path

    def test_process_and_verify_report_review_and_integrity(self):
        self.prepare()
        code = self.run_cli("process", "--inventory", "data/fontes/inventory.json",
                            "--incoming", ".local/fontes/recebidos", "--output", "data/fontes")
        self.assertEqual(code, 0)
        path = self.root / "data/fontes/manifest.json"
        manifest = json.loads(path.read_text())
        self.assertEqual(manifest["coverage"]["readings"]["verified"], 1)
        self.assertEqual(manifest["coverage"]["readings"]["ready"], 0)
        self.assertEqual(self.run_cli("verify", "--manifest", str(path), "--scope", "all"), 1)
        file = manifest["resources"][0]["files"][0]
        file["extraction"]["review_status"] = "reviewed"
        path.write_text(json.dumps(manifest))
        self.assertEqual(self.run_cli("verify", "--manifest", str(path), "--scope", "all"), 0)
        (self.root / file["relative_path"]).write_bytes(b"tampered")
        self.assertEqual(self.run_cli("verify", "--manifest", str(path), "--scope", "all"), 1)

    def test_invalid_inventory_is_rejected_before_writing(self):
        path = self.prepare()
        inventory = json.loads(path.read_text())
        inventory["resources"][0]["source_url"] = 7
        path.write_text(json.dumps(inventory))
        code = self.run_cli("process", "--inventory", str(path), "--incoming",
                            ".local/fontes/recebidos", "--output", "data/fontes")
        self.assertEqual(code, 2)
        self.assertFalse((path.parent / "manifest.json").exists())


if __name__ == "__main__":
    unittest.main()
