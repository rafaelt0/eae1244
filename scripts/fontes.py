"""Processamento local e verificável das fontes de EAE1244."""

import os
from pathlib import Path
import re
import subprocess


def extract_pdf(path: Path) -> list[dict]:
    path = path.resolve()
    data = path.read_bytes()
    if not data.startswith(b"%PDF-"):
        raise ValueError("Conteúdo recebido não é PDF.")
    if b"%%EOF" not in data[-2048:]:
        raise ValueError("PDF incompleto: marcador final ausente.")
    options = {
        "capture_output": True, "text": True, "encoding": "utf-8",
        "errors": "replace", "check": True, "timeout": 120,
        "env": {**os.environ, "LC_ALL": "C"}, "shell": False,
    }
    try:
        info = subprocess.run(["pdfinfo", str(path)], **options).stdout
        match = re.search(r"^Pages:\s+(\d+)", info, re.MULTILINE)
        if not match:
            raise ValueError("PDF sem contagem de páginas verificável.")
        output = subprocess.run(
            ["pdftotext", "-layout", "-enc", "UTF-8", "-eol", "unix",
             "-remove-hyphens", "none", str(path), "-"], **options,
        ).stdout
    except (subprocess.SubprocessError, OSError) as error:
        raise ValueError("Falha ao extrair o PDF com Poppler.") from error
    texts = output.split("\f")
    if texts and not texts[-1].strip():
        texts.pop()
    if len(texts) != int(match[1]):
        raise ValueError("Extração com quantidade de páginas divergente.")
    pages = []
    for number, raw in enumerate(texts, 1):
        text = raw.strip()
        flags = []
        if not text:
            flags.append("empty_text")
        elif sum(c.isalpha() for c in text) < 20:
            flags.append("low_text")
        if "\ufffd" in text:
            flags.append("encoding_issue")
        pages.append({
            "pdf_page": number, "printed_label": None, "text": text,
            "method": "pdftotext", "flags": flags, "review_notes": [],
        })
    return pages
