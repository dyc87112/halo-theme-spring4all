#!/usr/bin/env python3
"""Build a Halo theme ZIP using Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import re

root = Path(__file__).resolve().parents[1]
manifest = (root / 'theme.yaml').read_text()
name = re.search(r'^  name: ([A-Za-z0-9_-]+)\s*$', manifest, re.M)
version = re.search(r'^  version: ([A-Za-z0-9.+_-]+)\s*$', manifest, re.M)
if not name or not version:
    raise SystemExit('Cannot read theme name or version from theme.yaml')
required = ['theme.yaml', 'settings.yaml', 'LICENSE', 'THIRD-PARTY-LICENSES.txt', 'README.md']
files = [root / p for p in required]
files += sorted((root / 'templates').rglob('*'))
# Include only the theme Console UI runtime, not its sources or dependencies.
ui_runtime = root / 'ui-plugin' / 'dist'
if not (ui_runtime / 'ui-plugin.json').is_file():
    raise SystemExit('Missing Console UI runtime: run npm ci and npm run build in ui-plugin first')
files += sorted(ui_runtime.rglob('*'))
files = [p for p in files if p.is_file() and p.name != '.DS_Store']
if any(not (root / p).is_file() for p in required) or not (root / 'templates/layout.html').is_file():
    raise SystemExit('Required theme files are missing')
if any(p.is_symlink() for p in files):
    raise SystemExit('Symlinks are not supported in theme packages')
destination = root / 'dist'
destination.mkdir(exist_ok=True)
output = destination / f'{name[1]}-{version[1]}.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for p in files:
        archive.write(p, Path(name[1]) / p.relative_to(root))
with ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise SystemExit('ZIP integrity check failed')
print(f'{output} ({len(files)} files)')
