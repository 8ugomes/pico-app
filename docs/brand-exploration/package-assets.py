"""Package the approved-to-deliver proposal files, without production data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent
destination = root / 'Pico-Social-Assets.zip'
extras = {
    'ASSETS-README.md': 'README.md',
    'DESIGN.md': 'DESIGN.md',
    'tokens.json': 'tokens.json',
    '.impeccable/design.json': 'design-system.json',
    'AURA-CORES.md': 'AURA-CORES.md',
    'aura-palettes.json': 'aura-palettes.json',
}
for source in extras:
    if not (root / source).is_file():
        raise FileNotFoundError(root / source)
with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
    for file in sorted((root / 'assets').rglob('*')):
        if file.is_file():
            archive.write(file, 'Pico-Social-Assets/' + str(file.relative_to(root)))
    for source, target in extras.items():
        archive.write(root / source, 'Pico-Social-Assets/' + target)
with ZipFile(destination) as archive:
    assert archive.testzip() is None
    print(f'{len(archive.namelist())} files; {destination.stat().st_size} bytes; archive verified.')
