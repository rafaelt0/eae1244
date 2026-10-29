"""Validação e cobertura do caderno de EAE1244."""

import argparse
import json
from pathlib import Path
import re
import sys
import unicodedata

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fontes import local_path, validate_resources  # noqa: E402

MAX_QUOTE_WORDS = 25
MECHANISM_KINDS = {"cause", "transmitter", "political_economy", "other"}
COMMON = ("resource_id", "file_id", "lessons", "authors", "title", "depth", "status", "thesis")
# seção -> campo textual obrigatório em cada item
DEEP_SECTIONS = {"argument": "claim", "mechanisms": "description", "cases": "outcome",
                 "concepts": "definition", "evidence": "fact"}
DEEP_FIELDS = ("year", "question", "limits", "figures_note")


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).replace("­", "")
    text = re.sub(r"(\w)-\s*\n\s*", r"\1", text)
    text = text.translate(str.maketrans("‘’“”", "''\"\""))
    return " ".join(text.split())


def is_priority(resource: dict) -> bool:
    return any(17 <= n <= 28 for n in resource["lessons"])


class Sources:
    """Acesso aos arquivos e páginas do manifesto, com cache por file_id."""

    def __init__(self, manifest: dict, root: Path):
        self.root = root
        self.files = {f["file_id"]: f for r in manifest["resources"] for f in r.get("files", [])}
        self.pages: dict[str, dict[int, str]] = {}

    def page_text(self, file_id: str, number: int) -> str | None:
        file = self.files.get(file_id)
        if file is None:
            return None
        if file_id not in self.pages:
            path = local_path(self.root, file["extraction"]["pages_path"])
            self.pages[file_id] = {p["pdf_page"]: normalize(p["text"])
                                   for p in json.loads(path.read_text(encoding="utf-8"))}
        return self.pages[file_id].get(number)


def check_refs(where: str, refs, sources: Sources) -> list[str]:
    if not isinstance(refs, list) or not refs:
        return [f"{where}: afirmação sem fonte."]
    errors = []
    for ref in refs:
        if not isinstance(ref, dict):
            errors.append(f"{where}: referência inválida.")
            continue
        file_id, page, quote = ref.get("file_id"), ref.get("pdf_page"), ref.get("quote")
        if not isinstance(quote, str) or not quote.strip():
            errors.append(f"{where}: trecho literal ausente.")
            continue
        if len(quote.split()) > MAX_QUOTE_WORDS:
            errors.append(f"{where}: trecho com mais de {MAX_QUOTE_WORDS} palavras.")
            continue
        text = sources.page_text(file_id, page) if type(page) is int else None
        if text is None:
            errors.append(f"{where}: arquivo ou página inexistente ({str(file_id)[:8]}, p. {page}).")
        elif normalize(quote) not in text:
            errors.append(f"{where}: trecho não encontrado na página {page}.")
    return errors


def check_items(entry: dict, section: str, text_field: str, sources: Sources) -> list[str]:
    items = entry.get(section)
    if not isinstance(items, list) or not items:
        return [f"{section}: seção vazia."]
    errors = []
    for index, item in enumerate(items, 1):
        where = f"{section}[{index}]"
        if not isinstance(item, dict) or not item.get(text_field):
            errors.append(f"{where}: campo '{text_field}' ausente.")
            continue
        if section == "mechanisms" and item.get("kind") not in MECHANISM_KINDS:
            errors.append(f"{where}: tipo de mecanismo inválido.")
        errors += check_refs(where, item.get("refs"), sources)
    return errors


def validate_entry(entry: dict, resource: dict, sources: Sources, has_slides: bool) -> list[str]:
    missing = [f for f in COMMON if not entry.get(f)]
    if missing:
        return [f"campos obrigatórios ausentes: {', '.join(missing)}."]
    errors = []
    if entry["resource_id"] != resource["resource_id"]:
        errors.append("resource_id diverge do recurso.")
    files = {f["file_id"]: f for f in resource["files"]}
    if entry["file_id"] not in files:
        return errors + ["file_id não pertence ao recurso."]
    if entry["depth"] not in {"deep", "short"} or entry["status"] not in {"complete", "partial"}:
        return errors + ["depth ou status inválido."]
    extraction = files[entry["file_id"]]["extraction"]
    if extraction["status"] != "ready":
        errors.append("fonte sem extração pronta.")
    if entry["status"] == "complete" and extraction["review_status"] != "reviewed":
        errors.append("entrada 'complete' exige fonte revisada.")
    if entry["depth"] == "short":
        return errors + check_refs("refs", entry.get("refs"), sources)
    absent = [f for f in DEEP_FIELDS if f not in entry or entry[f] in (None, "")]
    if absent:
        errors.append(f"campos obrigatórios ausentes: {', '.join(absent)}.")
    if not entry.get("limits"):
        errors.append("limits: seção vazia.")
    for section, text_field in DEEP_SECTIONS.items():
        errors += check_items(entry, section, text_field, sources)
    if has_slides:
        errors += check_items(entry, "professor_emphasis", "point", sources)
    return errors


def load_entries(directory: Path, resource_id: str) -> list[tuple[Path, dict]]:
    found = []
    for path in sorted(directory.glob(f"{resource_id}*.json")):
        if path.stem != resource_id and not path.stem.startswith(f"{resource_id}--"):
            continue
        entry = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(entry, dict):
            raise ValueError(f"Entrada inválida: {path.name}.")
        found.append((path, entry))
    return found


def readings(manifest: dict, scope: str) -> list[dict]:
    selected = [r for r in validate_resources(manifest) if r["kind"] == "reading"
                and (scope == "all" or is_priority(r))]
    if not selected:
        raise ValueError("Recorte sem leituras.")
    return selected


def slides_for(manifest: dict, resource: dict) -> bool:
    return any(r["kind"] == "slides" and set(r["lessons"]) & set(resource["lessons"])
               for r in manifest["resources"])


def validate_caderno(manifest: dict, directory: Path, root: Path, scope: str) -> list[dict]:
    sources = Sources(manifest, root)
    issues = []
    for resource in readings(manifest, scope):
        rid = resource["resource_id"]
        entries = load_entries(directory, rid)
        if not entries:
            issues.append({"resource_id": rid, "message": "Entrada ausente."})
        for path, entry in entries:
            for message in validate_entry(entry, resource, sources, slides_for(manifest, resource)):
                issues.append({"resource_id": rid, "entry": path.name, "message": message})
    return issues


def coverage(manifest: dict, directory: Path) -> dict:
    result = {"priority": {"total": 0, "complete": 0, "partial": 0, "missing": 0},
              "other": {"total": 0, "complete": 0, "partial": 0, "missing": 0}}
    for resource in readings(manifest, "all"):
        group = result["priority" if is_priority(resource) else "other"]
        entries = load_entries(directory, resource["resource_id"])
        group["total"] += 1
        if not entries:
            group["missing"] += 1
        elif all(e.get("status") == "complete" for _, e in entries):
            group["complete"] += 1
        else:
            group["partial"] += 1
    return result


def main(argv: list[str] | None = None, root: Path | None = None) -> int:
    root = (root or Path(__file__).resolve().parents[1]).resolve()
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    validate = commands.add_parser("validate")
    validate.add_argument("--scope", choices=["all", "priority"], required=True)
    for command in (validate, commands.add_parser("coverage")):
        command.add_argument("--manifest", required=True)
        command.add_argument("--caderno", required=True)
    args = parser.parse_args(argv)
    try:
        manifest = json.loads(local_path(root, args.manifest).read_text(encoding="utf-8"))
        directory = local_path(root, args.caderno)
        if args.command == "coverage":
            print(json.dumps(coverage(manifest, directory), ensure_ascii=False))
            return 0
        issues = validate_caderno(manifest, directory, root, args.scope)
        print(json.dumps({"scope": args.scope, "issues": issues, "ok": not issues}, ensure_ascii=False))
        return int(bool(issues))
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"Entrada inválida: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
