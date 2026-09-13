"""Package the selected identity, including its standalone PDF."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, hashlib
root=Path(__file__).resolve().parent
pdf=root.parents[2]/'output/pdf/Pico-Social-Manual-Aura-Manteiga.pdf'
files=[]
for name in ['MANUAL.md','PROMPT-PRODUCAO.md','IMPLEMENTACAO.md','tokens.json','tokens.css','contrast.json']:
 files.append((root/name,name))
for folder in ['logo','fonts','applications']:
 files.extend((p,str(p.relative_to(root))) for p in sorted((root/folder).rglob('*')) if p.is_file())
files.extend([(pdf,pdf.name),(root.parent/'assets/aura/photo.png','imagery/aura-photo-sintetica.png'),(root.parent/'assets/aura/prompts.md','imagery/proveniencia.md'),(root.parent/'assets/ICONS-LICENSE.txt','licenses/LUCIDE-ISC.txt')])
manifest=[{'path':target,'bytes':source.stat().st_size,'sha256':hashlib.sha256(source.read_bytes()).hexdigest()} for source,target in files]
(root/'package-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
readme='Pico Social / Aura Manteiga / versão 1.0\n\nDireção escolhida: Aura, paleta Manteiga. Leia MANUAL.md e o PDF. Para implementar e publicar, use PROMPT-PRODUCAO.md com IMPLEMENTACAO.md e os tokens no projeto Pico.app.\n\nSVGs são os mestres; PNG/ICO são exportações. Fontes e licenças incluídas. Imagem e peças sociais são exemplos sintéticos identificados; não representam contas ou arenas reais. A galeria HTML editável permanece no repositório em docs/brand-exploration/aura-manteiga. Este pacote não contém dados privados, credenciais ou implementação de produção.\n'
archive=root/'Pico-Social-Aura-Manteiga.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
 z.writestr('Pico-Social-Aura-Manteiga/README.txt',readme)
 for source,target in files:z.write(source,'Pico-Social-Aura-Manteiga/'+target)
 z.write(root/'package-manifest.json','Pico-Social-Aura-Manteiga/package-manifest.json')
with ZipFile(archive) as z:
 assert z.testzip() is None
 print(len(z.namelist()),'files;',archive.stat().st_size,'bytes; verified.')
