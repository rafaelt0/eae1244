"""Geração e verificação do pacote offline de estudo EAE1244."""

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parent))
from caderno import load_entries
from fontes import local_path
from oficina import inspect_workshop

MAX_HTML = 4 * 1024 * 1024


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def package_path(root, name):
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name or not name:
        raise ValueError('Caminho inválido no pacote.')
    return local_path(root, name)


def embed_fonts(root, css):
    def inline(match):
        target = match[1].strip('"\'')
        if target.startswith('data:'):
            return match[0]
        if not re.fullmatch(r'fonts/[a-z0-9-]+\.woff2', target):
            raise ValueError('Recurso externo ou caminho inválido no CSS: ' + target)
        font = root / 'web' / target
        if not font.is_file():
            raise ValueError('Fonte ausente: ' + target)
        return 'url("data:font/woff2;base64,' + base64.b64encode(font.read_bytes()).decode('ascii') + '")'
    css = re.sub(r'url\(\s*([^)]*?)\s*\)', inline, css)
    if '@import' in css:
        raise ValueError('@import não é permitido no CSS do pacote.')
    return css


def present_data(manifest, summaries, atlas, exercises, root):
    resources, originals, file_index = [], [], {}
    extensions = {'application/pdf': '.pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'}
    for resource in manifest['resources']:
        rid = resource['resource_id']
        summary = summaries.get(rid)
        files = []
        for file in resource.get('files', []):
            fid = file['file_id']
            name = rid + '-' + fid[:12] + extensions.get(file['media_type'], '.bin')
            relative = 'originais/' + name
            item = {'id': fid, 'name': file['original_name'], 'href': relative,
                    'type': file['media_type'], 'reviewed': file.get('extraction', {}).get('review_status') == 'reviewed'}
            files.append(item)
            file_index[fid] = {**item, 'resource_id': rid, 'label': summary['title'] if summary else file['original_name']}
            originals.append({'source': local_path(root, file['relative_path']), 'path': relative, 'sha256': file['sha256']})
        resources.append({'id': rid, 'kind': resource['kind'], 'lessons': resource['lessons'],
            'title': summary['title'] if summary else (Path(files[0]['name']).stem if files else resource['label']),
            'authors': summary.get('authors', []) if summary else [], 'summary': summary,
            'files': files, 'source_url': resource.get('source_url', ''), 'label': resource['label']})
    readings = [r for r in resources if r['kind'] == 'reading']
    return {'resources': resources, 'atlas': atlas, 'exercises': exercises, 'files': file_index,
            'counts': {'readings': len(readings), 'complete': sum(bool(r['summary'] and r['summary'].get('status') == 'complete') for r in readings),
                       'pending': sum(not r['summary'] or r['summary'].get('status') != 'complete' for r in readings)}}, originals


def verify_package(output):
    errors = []
    try:
        package = json.loads((output / '_package.json').read_text(encoding='utf-8'))
        if package.get('schema_version') != 1:
            raise ValueError('Versão do pacote inválida.')
        expected = {'_package.json'}
        for item in package['files']:
            path = package_path(output, item['path'])
            expected.add(item['path'])
            if path.is_symlink() or not path.is_file() or digest(path) != item['sha256']:
                errors.append('Arquivo ausente ou adulterado: ' + item['path'])
        actual = {p.relative_to(output).as_posix() for p in output.rglob('*') if p.is_file()}
        if actual != expected:
            errors.append('Lista de arquivos diverge do índice do pacote.')
        with zipfile.ZipFile(output.with_suffix('.zip')) as archive:
            members = {output.name + '/' + name for name in expected}
            if set(archive.namelist()) != members or archive.testzip() is not None:
                errors.append('Conteúdo do ZIP diverge do pacote.')
            else:
                for name in expected:
                    if archive.read(output.name + '/' + name) != package_path(output, name).read_bytes():
                        errors.append('ZIP diverge do arquivo: ' + name)
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        errors.append(str(error))
    return errors


def publish(stage, output):
    """Trocar pasta e ZIP com restauração caso a publicação local falhe."""
    targets = [output, output.with_suffix('.zip')]
    backups, installed = [], []
    try:
        for index, target in enumerate(targets):
            if target.exists():
                backup = stage / f'backup-{index}'
                os.replace(target, backup)
                backups.append((backup, target))
        for target in targets:
            os.replace(stage / target.name, target)
            installed.append(target)
    except OSError:
        for target in installed:
            shutil.rmtree(target) if target.is_dir() else target.unlink()
        for backup, target in backups:
            os.replace(backup, target)
        raise


def build_package(root, output, data, originals):
    if (root / 'dist').is_symlink() or output.is_symlink() or output.parent != root / 'dist' or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', output.name):
        raise ValueError('A saída deve ser uma pasta própria diretamente dentro de dist/.')
    if output.exists() and not (output / '_package.json').is_file():
        raise ValueError('A saída existente não pertence ao gerador; nada foi substituído.')
    if output.with_suffix('.zip').exists() and not output.exists():
        raise ValueError('ZIP existente sem pasta de entrega; nada foi substituído.')
    output.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.stage-', dir=output.parent) as temporary:
        stage = Path(temporary)
        folder = stage / output.name
        folder.mkdir()
        encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
        html = (root / 'web/index.html').read_text(encoding='utf-8')
        assets = {'STYLE': embed_fonts(root, (root / 'web/style.css').read_text()), 'DATA': encoded,
                  'APP': (root / 'web/app.js').read_text()}
        for name in assets:
            if html.count('/*' + name + '*/') != 1:
                raise ValueError('Marcador ausente ou repetido no template: ' + name)
        html = re.sub(r'/\*(STYLE|DATA|APP)\*/', lambda match: assets[match[1]], html)
        if len(html.encode('utf-8')) > MAX_HTML:
            raise ValueError('HTML ultrapassa 4 MiB.')
        (folder / 'index.html').write_text(html, encoding='utf-8')
        names = {'index.html', '_package.json', 'indice-originais.json'}
        for original in originals:
            destination = package_path(folder, original['path'])
            if original['path'] in names:
                raise ValueError('Destino repetido no pacote.')
            names.add(original['path'])
            source = local_path(root, original['source'])
            if digest(source) != original['sha256']:
                raise ValueError('Hash do original diverge: ' + original['path'])
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
            if digest(destination) != original['sha256']:
                raise ValueError('Cópia do original diverge.')
        (folder / 'indice-originais.json').write_text(json.dumps(data.get('files', {}), ensure_ascii=False, indent=2), encoding='utf-8')
        files = [{'path': p.relative_to(folder).as_posix(), 'sha256': digest(p)} for p in sorted(folder.rglob('*')) if p.is_file()]
        (folder / '_package.json').write_text(json.dumps({'schema_version': 1, 'files': files, 'counts': data.get('counts', {})}, ensure_ascii=False, indent=2), encoding='utf-8')
        with zipfile.ZipFile(stage / (output.name + '.zip'), 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(folder.rglob('*')):
                if path.is_file():
                    archive.write(path, output.name + '/' + path.relative_to(folder).as_posix())
        errors = verify_package(folder)
        if errors:
            raise ValueError('Pacote temporário inválido: ' + '; '.join(errors))
        publish(stage, output)
    return {'ok': True, 'output': str(output), 'counts': data.get('counts', {}), 'originals': len(originals)}


def main(argv=None, root=None):
    root = (root or Path(__file__).resolve().parents[1]).resolve()
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    build = commands.add_parser('build')
    for flag in ('manifest', 'caderno', 'atlas', 'oficina', 'output'):
        build.add_argument('--' + flag, required=True)
    commands.add_parser('verify').add_argument('--output', required=True)
    args = parser.parse_args(argv)
    try:
        output = local_path(root, args.output)
        if args.command == 'verify':
            errors = verify_package(output)
            print(json.dumps({'ok': not errors, 'issues': errors}, ensure_ascii=False))
            return int(bool(errors))
        manifest = json.loads(local_path(root, args.manifest).read_text())
        dirs = [local_path(root, getattr(args, f)) for f in ('caderno', 'atlas', 'oficina')]
        report = inspect_workshop(manifest, *dirs, root)
        if not report['ok']:
            print(json.dumps({'ok': False, 'dependencies': report}, ensure_ascii=False))
            return 1
        summaries = {r['resource_id']: entries[0][1] for r in manifest['resources']
                     if (entries := load_entries(dirs[0], r['resource_id']))}
        atlas, exercises = [[json.loads(local_path(root, p).read_text()) for p in sorted(d.glob('*.json'))] for d in dirs[1:]]
        data, originals = present_data(manifest, summaries, atlas, exercises, root)
        print(json.dumps(build_package(root, output, data, originals), ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        print('Entrada inválida: ' + str(error), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
