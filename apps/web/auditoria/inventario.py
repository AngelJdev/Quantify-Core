"""Inventario de objetos Git; no altera ramas, stash ni respaldo."""
from pathlib import Path
import csv
import hashlib
import io
import json
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
STASH = '4b9ec89ffa13bef298b232e400246e95aff8976e'
REMOTE = 'cc08cc714f4ed93a3b4d90d2d3a1af036ce8fc60'

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def tree(ref):
    return dict(line.split('\t', 1)[::-1] for line in git('ls-tree', '-r', ref).decode().splitlines())

def blob(ref, path):
    return git('show', ref + ':' + path)

untracked = tree(STASH + '^3')
tracked = git('diff', '--name-only', STASH + '^1', STASH).decode().splitlines()
stash = {p: STASH + '^3' for p in untracked} | {p: STASH for p in tracked}
remote = {p: REMOTE for p in tree(REMOTE) if p.startswith('apps/web/')}
rows = []
for path in sorted(stash.keys() | remote.keys()):
    a = blob(stash[path], path) if path in stash else None
    b = blob(REMOTE, path) if path in remote else None
    status = ('identico' if a == b else 'diferente') if a is not None and b is not None else ('solo-stash' if a is not None else 'solo-scaffold')
    rows.append({'archivo': path, 'comparacion': status, 'origen_stash': 'rastreado' if path in tracked else 'no-rastreado' if a is not None else '', 'sha256_stash': hashlib.sha256(a).hexdigest() if a is not None else '', 'sha256_scaffold': hashlib.sha256(b).hexdigest() if b is not None else ''})
with (OUT / 'inventario.csv').open('w', encoding='utf8', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=list(rows[0])); writer.writeheader(); writer.writerows(rows)
metadata = {'stash': STASH, 'scaffold': git('rev-parse', REMOTE).decode().strip(), 'base': '5591a6ed0994a630ac8641cdac43f0ad7ea85a0b', 'archivos_stash': len(stash), 'archivos_scaffold': len(remote), 'clasificacion': {s: sum(r['comparacion'] == s for r in rows) for s in sorted({r['comparacion'] for r in rows})}}
(OUT / 'referencias.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf8')
# Extract a read-only Git snapshot for independent npm/QA, never into apps/web.
target = ROOT / '.audit/scaffold'
if target.exists():
    raise SystemExit('Snapshot existente; inspeccionar antes de extraer nuevamente: ' + str(target))
target.mkdir(parents=True)
archive = git('archive', REMOTE, 'apps/web', 'packages/design-tokens')
with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
    tar.extractall(target, filter='data')
print(json.dumps(metadata, indent=2))
