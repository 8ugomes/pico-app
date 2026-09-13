"""Consolidate selected Aura colors and vector masters; no photo manipulation."""
import json, shutil, re, colorsys, hashlib
from pathlib import Path
root=Path(__file__).resolve().parent
base=root.parent
p=next(p for p in json.loads((base/'aura-palettes.json').read_text())['palettes'] if p['id']=='manteiga')
for name in ['syne','manrope']:
 for ext in ['woff2','ttf']:
  shutil.copy2(base/f'assets/fonts/{name}.{ext}',root/f'fonts/{name}.{ext}')
 shutil.copy2(base/f'assets/fonts/{name}-OFL.txt',root/f'fonts/{name}-OFL.txt')
(root/'fonts/sources.json').write_text(json.dumps([f for f in json.loads((base/'assets/fonts/sources.json').read_text()) if f['font'] in ['syne','manrope']],ensure_ascii=False,indent=2)+'\n')
for file in (base/'assets/aura').glob('*.svg'):
 text=file.read_text().replace('#302238','#44342F').replace('#C7B5E8','#F2E3B5').replace('#F6F1E9','#F8F3E7')
 (root/'logo'/file.name).write_text(text)
# Name explicit colors. The approved outline itself is unchanged.
for kind in ['wordmark','lockup','mark']:
 for name,color in [('cacau','#44342F'),('manteiga','#F2E3B5'),('papel','#F8F3E7'),('black','#000000')]:
  text=(root/f'logo/{kind}.svg').read_text().replace('currentColor',color)
  (root/f'logo/{kind}-{name}.svg').write_text(text)
mark=(root/'logo/mark.svg').read_text()
body=re.search(r'<svg[^>]*>(.*)</svg>',mark).group(1)
mask='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#F2E3B5"/><g transform="translate(106 106) scale(3)" color="#44342F" fill="#44342F">'+body+'</g></svg>'
(root/'logo/pico-maskable-512.svg').write_text(mask)
# Stable app identity: light butter field, cocoa glyph, derived from the existing reverse variant.
shutil.copy2(root/'logo/app-icon-reverse.svg',root/'logo/pico-app.svg')
(root/'logo/provenance.json').write_text(json.dumps({'version':'1.0','direction':'Aura Manteiga','selected_by_user':True,'geometry_source':'../assets/aura/*.svg','modification':'Recolor only; original contours and spacing retained. Maskable layout uses a smaller glyph on a full square background.','wordmark_typeface':'Syne 800, adjusted spacing, converted to outlines','legal_clearance':'Not performed','maskable_safe_area':{'canvas':512,'safe_circle_center':[256,256],'safe_circle_radius':204.8,'glyph_bounds_conservative':[164.5,119.5,371.5,371.5]}},ensure_ascii=False,indent=2)+'\n')
light={'background':p['light']['bg'],'surface':p['light']['surface'],'surface-raised':'#FFFFFF','surface-overlay':'#FCF9F3','surface-input':'#FCF9F3','foreground':p['ink'],'text-secondary':p['light']['muted'],'text-muted':p['light']['muted'],'border-subtle':'#DFD7C7','border-control':p['light']['line'],'accent':p['ink'],'accent-ink':p['paper'],'accent-soft':p['light']['soft'],'accent-hover':'#59453D','accent-active':'#322724','focus':p['ink'],'selection-bg':p['ink'],'selection-ink':p['paper'],'disabled-bg':'#E6DED0','disabled-ink':'#73665F','success':'#275D45','success-bg':'#E5F0E8','warning':'#775017','warning-bg':'#FAEDD1','error':'#A02D45','error-bg':'#FAE8EB','info':'#50426A','info-bg':'#ECE5F4'}
dark={'background':p['dark']['bg'],'surface':p['dark']['surface'],'surface-raised':'#403733','surface-overlay':'#403733','surface-input':'#352E2B','foreground':p['paper'],'text-secondary':p['dark']['muted'],'text-muted':p['dark']['muted'],'border-subtle':'#5A504A','border-control':p['dark']['line'],'accent':p['accent'],'accent-ink':p['ink'],'accent-soft':p['dark']['soft'],'accent-hover':'#F8ECCB','accent-active':'#DFCA8F','focus':p['accent'],'selection-bg':p['accent'],'selection-ink':p['ink'],'disabled-bg':'#4A423A','disabled-ink':'#C4BEB6','success':'#A5D5B7','success-bg':'#233A2D','warning':'#F0CC85','warning-bg':'#46361F','error':'#FFB1C0','error-bg':'#4D2934','info':'#D7C8EB','info-bg':'#3C314B'}
light['border-control-raised']='#84786F'
dark['border-control-raised']='#9D948C'
brand={k:p[v] for k,v in [('cacau','ink'),('manteiga','accent'),('lavanda','support'),('papel','paper')]}
def lum(h):
 c=[int(h[i:i+2],16)/255 for i in [1,3,5]]
 c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
 return sum(v*w for v,w in zip(c,[.2126,.7152,.0722]))
def contrast(a,b):
 x,y=sorted([lum(a),lum(b)])
 return (y+.05)/(x+.05)
checks=[]
for mode,t in [('light',light),('dark',dark)]:
 for fg in ['foreground','text-secondary','text-muted']:
  for bg in ['background','surface','surface-raised','accent-soft']:
   checks.append({'mode':mode,'foreground':fg,'background':bg,'ratio':contrast(t[fg],t[bg]),'required':4.5})
 for bg in ['accent','accent-hover','accent-active']:
  checks.append({'mode':mode,'foreground':'accent-ink','background':bg,'ratio':contrast(t['accent-ink'],t[bg]),'required':4.5})
 for state in ['success','warning','error','info']:
  checks.append({'mode':mode,'foreground':state,'background':state+'-bg','ratio':contrast(t[state],t[state+'-bg']),'required':4.5})
 for fg in ['focus','border-control']:
  for bg in ['background','surface']:
   checks.append({'mode':mode,'foreground':fg,'background':bg,'ratio':contrast(t[fg],t[bg]),'required':3})
for mode,t in [('light',light),('dark',dark)]:
 for bg in ['surface-raised','accent-soft']:
  checks.append({'mode':mode,'foreground':'border-control-raised','background':bg,'ratio':contrast(t['border-control-raised'],t[bg]),'required':3})
for c in checks:c['pass']=c['ratio']>=c['required']
assert all(c['pass'] for c in checks), [c for c in checks if not c['pass']]
data={'version':'1.0','name':'Pico Social / Aura Manteiga','status':'Selected visual direction; implementation specification; not yet deployed','brand':brand,'modes':{'light':light,'dark':dark},'gallery':{'light':p['light'],'dark':p['dark']},'typography':{'display':{'family':'Syne','weights':[600,700,800],'fallback':'Arial, sans-serif'},'body':{'family':'Manrope','weights':[400,500,600,700],'fallback':'-apple-system, BlinkMacSystemFont, system-ui, sans-serif'},'scale':{'brandHero':{'size':'clamp(32px, 6vw, 64px)','lineHeight':1.08,'weight':700},'pageTitle':{'size':'clamp(28px, 5vw, 36px)','lineHeight':1.12,'weight':700},'section':{'size':'24px','lineHeight':1.25,'weight':600},'dialog':{'size':'22px','lineHeight':1.3,'weight':600},'body':{'size':'16px','lineHeight':1.6,'weight':400},'label':{'size':'14px','lineHeight':1.5,'weight':600},'caption':{'size':'13px','lineHeight':1.5,'weight':500},'navigation':{'size':'12px','lineHeight':1.4,'weight':600}}},'geometry':{'control':'16px','card':'22px','panel':'30px','pill':'999px','feature':'24px 24px 70px 24px','heroImage':'130px 0 0 0','touchTarget':'44px','bodyInputSize':'16px','spacing':[4,8,12,16,20,24,32,48,64]},'motion':{'fast':'160ms','standard':'220ms','brand':'280ms','easing':'cubic-bezier(0.22, 1, 0.36, 1)','reduced':'No decorative movement or automatic transitions'},'themePolicy':'Light is the editorial reference; app follows prefers-color-scheme initially. No new account preference or persistence required.'}
(root/'tokens.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(root/'identity-data.js').write_text('window.PICO_IDENTITY='+json.dumps(data,ensure_ascii=False)+';\n')
(root/'contrast.json').write_text(json.dumps({'method':'WCAG sRGB relative luminance; unrounded comparison; solid colors only','checks':checks,'brandPairs':[{'foreground':a,'background':b,'ratio':contrast(brand[a],brand[b])} for a,b in [('cacau','manteiga'),('cacau','papel'),('cacau','lavanda'),('manteiga','papel'),('lavanda','papel')]],'limits':'No full WCAG certification; text over imagery, interactive implementations and assistive technologies require application QA.'},indent=2)+'\n')
css='/* Reference migration tokens. Integrate into globals.css; do not import unchanged over legacy CSS. */\n:root {\n'
for k,v in brand.items():css+=f'  --brand-{k}: {v};\n'
css+='  --font-body: "Manrope", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;\n  --font-display: "Syne", Arial, sans-serif;\n  --font-system: var(--font-body);\n  --radius-control: 1rem;\n  --radius-card: 1.375rem;\n  --radius-panel: 1.875rem;\n  --radius-pill: 999px;\n  --motion-fast: 160ms;\n  --motion-standard: 220ms;\n  --motion-brand: 280ms;\n}\n'
for mode,t in [('light',light),('dark',dark)]:
 selector=':root' if mode=='light' else '@media (prefers-color-scheme: dark) {\n:root'
 css+=selector+' {\n'+f'  color-scheme: {mode};\n'
 css+=''.join(f'  --{k}: {v};\n' for k,v in t.items())
 css+='  --graphite: var(--surface);\n  --sand: var(--brand-manteiga);\n  --green: var(--accent); /* Compatibility alias, migrate call sites over time. */\n  --glass: var(--surface);\n  --glass-strong: var(--surface-raised);\n  --glass-border: var(--border-subtle);\n}\n'
 if mode=='dark':css+='}\n'
css+='\n/* Tailwind 4: integrate with the existing @theme inline. */\n@theme inline {\n  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n  --color-accent: var(--accent);\n  --color-sand: var(--brand-manteiga);\n  --color-surface: var(--surface);\n  --font-sans: var(--font-body);\n}\n'
(root/'tokens.css').write_text(css)
print('Identity assets and',len(checks),'passing solid contrast pairs generated.')
