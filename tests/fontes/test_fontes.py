import importlib.util
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


if __name__ == "__main__":
    unittest.main()
