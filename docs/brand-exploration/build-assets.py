"""Generate editable proposal marks from licensed type and explicit vector geometry.

Uses fontTools only. Photographic artwork is authored separately with imagegen.
Run from this directory with a Python environment containing fontTools + brotli.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import json

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'
concepts = {
    'ritual': ('bodonimoda', {'wght': 700, 'opsz': 64}, '#521F35', '#F5ECDD', -12),
    'pulso': ('bricolagegrotesque', {'wght': 800, 'wdth': 80, 'opsz': 48}, '#254CF1', '#EDF2FA', -25),
    'aura': ('syne', {'wght': 800}, '#302238', '#C7B5E8', -18),
}
marks = {
    'ritual': '<path d="M22 82V18h29c21 0 30 10 30 25S69 68 49 68H34v14H22Zm12-25h16c13 0 19-5 19-14s-6-14-19-14H34v28Z"/><path d="M14 80h29v5H14z"/><circle cx="49" cy="43" r="5"/>',
    'pulso': '<path d="M14 85 28 16h32c23 0 34 11 30 31-4 18-18 28-38 28H34l-2 10H14Zm23-26h18c8 0 14-4 16-12s-3-13-12-13H42l-5 25Z"/><circle cx="57" cy="46" r="5"/>',
    'aura': '<path d="M27 81V39c0-18 11-27 26-27 17 0 28 11 28 27S70 66 54 66H41" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round"/><circle cx="53" cy="39" r="6"/>',
}
def wrap(body, box, color='currentColor', label='Pico Social'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="{label}" style="color:{color}" fill="currentColor">{body}</svg>'

for name, (family, axes, ink, paper, tracking) in concepts.items():
    folder = ASSETS / name
    folder.mkdir(parents=True, exist_ok=True)
    font = TTFont(ASSETS / 'fonts' / f'{family}.ttf')
    font = instantiateVariableFont(font, axes, inplace=False)
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    paths = []; x = 0; bounds = []
    for ch in 'pico':
        glyph = gs[cmap[ord(ch)]]; pen = SVGPathPen(gs)
        matrix = (1, 0, 0.16 if name == 'pulso' else 0, -1, x, 0)
        glyph.draw(TransformPen(pen, matrix))
        bp = BoundsPen(gs); glyph.draw(TransformPen(bp, matrix)); bounds.append(bp.bounds)
        paths.append('<path d="' + pen.getCommands() + '"/>')
        x += glyph.width + tracking
    xmin=min(b[0] for b in bounds); ymin=min(b[1] for b in bounds)
    xmax=max(b[2] for b in bounds); ymax=max(b[3] for b in bounds)
    box = f'{xmin-8} {ymin-8} {xmax-xmin+16} {ymax-ymin+16}'
    body = ''.join(paths)
    for suffix, color in [('','currentColor'),('-ink',ink),('-white','#FFFFFF')]:
        (folder/f'wordmark{suffix}.svg').write_text(wrap(body,box,color))
    # A separate descriptor in outlines keeps master lockups font-independent.
    descriptor = instantiateVariableFont(TTFont(ASSETS/'fonts'/'manrope.ttf'), {'wght':600}, inplace=False)
    dgs=descriptor.getGlyphSet(); dcmap=descriptor.getBestCmap(); dx=0; dpaths=[]
    for char in 'SOCIAL':
        glyph=dgs[dcmap[ord(char)]]; p=SVGPathPen(dgs)
        glyph.draw(TransformPen(p,(1,0,0,-1,dx,0)))
        dpaths.append('<path d="'+p.getCommands()+'"/>'); dx+=glyph.width+550
    scale=(xmax-xmin)*.65/(dx-550)
    cy=ymax+(ymax-ymin)*.29
    cx=xmin+(xmax-xmin)*.175
    lockup=body+f'<g transform="translate({cx} {cy}) scale({scale})">'+''.join(dpaths)+'</g>'
    lockbox=f'{xmin-8} {ymin-8} {xmax-xmin+16} {cy-ymin+20}'
    for suffix,color in [('','currentColor'),('-ink',ink),('-white','#FFFFFF')]:
        (folder/f'lockup{suffix}.svg').write_text(wrap(lockup,lockbox,color))
    for suffix,color in [('','currentColor'),('-ink',ink),('-white','#FFFFFF')]:
        (folder/f'mark{suffix}.svg').write_text(wrap(marks[name],'0 0 100 100',color))
    for mode,bg,fg in [('primary',ink,paper),('reverse',paper,ink)]:
        (folder/f'app-icon-{mode}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="{bg}"/><g transform="translate(76 76) scale(3.6)" fill="{fg}" color="{fg}">{marks[name]}</g></svg>')
    (folder/'logo-source.json').write_text(json.dumps({'status':'proposal','wordmark_typeface':family,'axes':axes,'tracking_font_units':tracking,'wordmark':'Font outlines with adjusted spacing; not a newly invented typeface.','symbol':'Custom vector construction; no trademark clearance performed.','canonical_assets':['wordmark.svg','mark.svg','app-icon-primary.svg']},indent=2)+'\n')

for file in (ASSETS/'fonts').glob('*.ttf'):
    if not file.with_suffix('.woff2').exists():
        f=TTFont(file); f.flavor='woff2'; f.save(file.with_suffix('.woff2'))
print('Three vector systems and four local WOFF2 fonts generated.')
