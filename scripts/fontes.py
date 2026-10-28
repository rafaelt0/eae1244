"""Processamento local e verificável das fontes de EAE1244."""

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import urlparse, parse_qs


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


def local_path(root: Path, value: str | Path) -> Path:
    target = (root / value).resolve()
    if target == root.resolve() or not target.is_relative_to(root.resolve()):
        raise ValueError("Caminho fora do projeto.")
    return target


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".part", delete=False) as stream:
        temporary = Path(stream.name)
        stream.write(data)
    try:
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def json_bytes(value: dict | list) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def process_resource(resource: dict, incoming: Path, root: Path,
                     previous: dict | None = None) -> dict:
    rid = resource["resource_id"]
    if not re.fullmatch(r"moodle-resource-[0-9]+", rid):
        raise ValueError("Identificador de recurso inválido.")
    source = local_path(root, incoming / f"{rid}.bin")
    receipt = json.loads(source.with_suffix(".json").read_text(encoding="utf-8"))
    data = source.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if (receipt.get("resource_id") != rid or receipt.get("sha256") != digest
            or receipt.get("byte_size") != len(data)):
        raise ValueError("hash_mismatch: arquivo recebido difere do comprovante.")
    is_pdf = data.startswith(b"%PDF-")
    if not is_pdf and not data.startswith(b"PK\x03\x04"):
        raise ValueError("invalid_file: conteúdo não é PDF nem arquivo ZIP reconhecido.")
    suffix = ".pdf" if is_pdf else ".zip"
    relative = f".local/fontes/originais/{digest}{suffix}"
    target = local_path(root, relative)
    pages_path = f".local/fontes/paginas/{digest}.json"
    old_files = (previous or {}).get("files", [])
    reusable = next((f for f in old_files if f["file_id"] == digest), None)
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != digest:
        raise ValueError("hash_mismatch: original local foi alterado.")
    if reusable and reusable["relative_path"] == relative:
        extraction = reusable["extraction"]
        cached = local_path(root, extraction["pages_path"]) if extraction["pages_path"] else None
        if cached and cached.exists() and hashlib.sha256(cached.read_bytes()).hexdigest() == extraction.get("pages_sha256"):
            if not target.exists():
                atomic_write(target, data)
            return {**resource, "status": "verified", "files": [reusable],
                    "previous_files": (previous or {}).get("previous_files", []), "error": None}
    pages = extract_pdf(source) if is_pdf else []
    extraction = {
        "status": "needs_ocr" if any(p["flags"] for p in pages) else "ready",
        "method": "pdftotext" if is_pdf else None,
        "page_count": len(pages) if is_pdf else None,
        "pages_path": pages_path if is_pdf else None,
        "review_status": "pending", "review_notes": [], "pages_sha256": None,
    }
    if is_pdf:
        encoded = json_bytes(pages)
        atomic_write(local_path(root, pages_path), encoded)
        extraction["pages_sha256"] = hashlib.sha256(encoded).hexdigest()
    else:
        extraction["status"] = "unsupported"
    if not target.exists():
        atomic_write(target, data)
    file = {
        "file_id": digest, "original_name": receipt["original_name"],
        "relative_path": relative, "media_type": "application/pdf" if is_pdf else "application/zip",
        "byte_size": len(data), "sha256": digest, "retrieved_at": receipt["retrieved_at"],
        "extraction": extraction,
    }
    history = {f["file_id"]: f for f in (previous or {}).get("previous_files", []) + old_files
               if f["file_id"] != digest}
    return {**resource, "status": "verified", "files": [file],
            "previous_files": list(history.values()), "error": None}


def validate_resources(document: dict) -> list[dict]:
    if not isinstance(document, dict) or type(document.get("schema_version")) is not int or document["schema_version"] != 1:
        raise ValueError("Versão de esquema incompatível.")
    resources = document.get("resources")
    if not isinstance(resources, list) or not resources:
        raise ValueError("Inventário sem recursos.")
    seen = set()
    for item in resources:
        rid = item.get("resource_id") if isinstance(item, dict) else None
        if not isinstance(rid, str) or not re.fullmatch(r"moodle-resource-[0-9]+", rid) or rid in seen:
            raise ValueError("Recurso inválido ou duplicado.")
        seen.add(rid)
        lessons = item.get("lessons")
        if not isinstance(lessons, list) or any(type(n) is not int or n < 1 for n in lessons):
            raise ValueError("Números de aula inválidos.")
        if item.get("kind") not in {"reading", "slides", "syllabus", "exam", "other"}:
            raise ValueError("Tipo de recurso inválido.")
        if item.get("requirement") not in {"required", "complementary", "unspecified"}:
            raise ValueError("Indicação de leitura inválida.")
        url = urlparse(item.get("source_url", ""))
        if (url.scheme != "https" or url.netloc != "edisciplinas.usp.br"
                or url.path != "/mod/resource/view.php"
                or parse_qs(url.query) != {"id": [rid.removeprefix("moodle-resource-")]}):
            raise ValueError("URL de origem inválida.")
    return resources


def verify_file(file: dict, root: Path) -> None:
    original = local_path(root, file["relative_path"])
    data = original.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if digest != file["sha256"] or digest != file["file_id"] or len(data) != file["byte_size"]:
        raise ValueError("hash_mismatch: original local divergente.")
    extraction = file["extraction"]
    if extraction["status"] != "ready" or extraction["review_status"] != "reviewed":
        raise ValueError("Extração ou revisão ainda pendente.")
    encoded = local_path(root, extraction["pages_path"]).read_bytes()
    if hashlib.sha256(encoded).hexdigest() != extraction["pages_sha256"]:
        raise ValueError("hash_mismatch: páginas extraídas divergentes.")
    pages = json.loads(encoded)
    if not isinstance(pages, list) or not pages or len(pages) != extraction["page_count"]:
        raise ValueError("Contagem de páginas divergente.")
    for number, page in enumerate(pages, 1):
        if page.get("pdf_page") != number or not isinstance(page.get("text"), str):
            raise ValueError("Localização ou texto da página inválido.")
        unresolved = set(page.get("flags", [])) - set(page.get("resolved_flags", []))
        if unresolved or (page.get("resolved_flags") and not page.get("review_notes")):
            raise ValueError(f"Página {number} tem pendência de qualidade.")


def verify_manifest(manifest: dict, root: Path, scope: str) -> list[dict]:
    if scope not in {"all", "priority"}:
        raise ValueError("Recorte de verificação inválido.")
    resources = [r for r in validate_resources(manifest) if r["kind"] == "reading"
                 and (scope == "all" or any(17 <= n <= 28 for n in r["lessons"]))]
    if not resources:
        raise ValueError("Recorte sem leituras.")
    issues = []
    for resource in resources:
        try:
            files = resource.get("files")
            if resource.get("status") != "verified" or not isinstance(files, list) or not files:
                raise ValueError("Download ainda pendente.")
            for file in files:
                verify_file(file, root)
        except (ValueError, OSError, KeyError, TypeError, AttributeError) as error:
            issues.append({"resource_id": resource["resource_id"], "message": str(error)})
    return issues
