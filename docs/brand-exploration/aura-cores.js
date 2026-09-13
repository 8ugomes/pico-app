(() => {
  const {palettes}=window.AURA_PALETTES;
  const {screens,renderPhone}=window.PicoBrand;
  const query=new URLSearchParams(location.search);
  let selected=query.get('palette')||'all', screen=query.get('screen')||'profile', mode=query.get('mode')==='dark'?'dark':'light',noticeTimer;
  if(!palettes.some(p=>p.id===selected))selected='all';
  if(!screens.some(s=>s[0]===screen))screen='profile';
  const tabs=document.getElementById('palette-tabs');
  const selector=document.getElementById('aura-screen');
  const stage=document.getElementById('palette-comparison');
  tabs.innerHTML=`<button data-palette="all">Comparar todas</button>`+palettes.map(p=>`<button data-palette="${p.id}">${p.name}</button>`).join('');
  selector.innerHTML=screens.map(([id,title])=>`<option value="${id}">${title}</option>`).join('');
  function applyPalette(phone,p,appearance){
    phone.dataset.palette=p.id;
    for(const [token,value] of Object.entries(p[appearance]))if(!['radius','display'].includes(token))phone.style.setProperty('--'+token,value);
    phone.style.setProperty('--aura-hero-bg',p.accent);
    phone.style.setProperty('--aura-hero-ink',p.ink);
    phone.style.setProperty('--aura-hero-paper',p.paper);
    for(const img of phone.querySelectorAll('img')){
      const file=img.getAttribute('src').split('/').pop(),source=window.AURA_SVGS[file];
      if(!source)continue;
      const colored=source.replace(/#302238/gi,p.ink).replace(/#C7B5E8/gi,p.accent).replace(/#F6F1E9/gi,p.paper);
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(colored);
    }
  }
  function render(){
    const shown=selected==='all'?palettes:palettes.filter(p=>p.id===selected);
    stage.classList.toggle('one',shown.length===1);
    stage.innerHTML=shown.map(p=>`<article class="palette-column"><header class="palette-heading"><h2>${p.name}</h2><p>${p.description}</p></header>${renderPhone('aura',mode,screen)}<div class="palette">${[['Tinta',p.ink],['Cor principal',p.accent],['Apoio',p.support],['Papel',p.paper]].map(([name,hex])=>`<div><i style="background:${hex}"></i><strong>${name}</strong><br>${hex}</div>`).join('')}</div><p class="palette-color-note">${p.id==='lavanda'?'Paleta original da Aura.':'Somente cores alteradas.'} Syne + Manrope.</p></article>`).join('');
    shown.forEach((p,i)=>applyPalette(stage.querySelectorAll('.phone')[i],p,mode));
    document.querySelectorAll('[data-palette]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',el.dataset.palette===selected);});
    document.querySelectorAll('[data-appearance]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.appearance===mode));
    selector.value=screen;
    const info=screens.find(s=>s[0]===screen);document.getElementById('aura-context').textContent=`${info[1]} · Mesma tela, mesma fotografia e mesmo desenho em todas as opções.`;
    const url=new URL(location.href);url.searchParams.set('palette',selected);url.searchParams.set('screen',screen);url.searchParams.set('mode',mode);history.replaceState(null,'',url);
  }
  const notify=text=>{const n=document.getElementById('notice');n.textContent=text;n.classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>n.classList.remove('visible'),3500);};
  selector.addEventListener('change',()=>{screen=selector.value;render();});
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.palette){selected=b.dataset.palette;render();tabs.querySelector(`[data-palette="${selected}"]`).focus({preventScroll:true});}
    else if(b.dataset.appearance){mode=b.dataset.appearance;render();document.querySelector(`[data-appearance="${mode}"]`).focus({preventScroll:true});}
    else if(b.dataset.goto){screen=b.dataset.goto;render();notify('Navegação local entre estudos da Aura.');}
    else if(b.hasAttribute('data-pill')){b.parentElement.querySelectorAll('button').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',el===b);});notify('Filtro ilustrativo. Nenhum dado real é alterado.');}
    else if(b.hasAttribute('data-demo'))notify('Estudo visual: nada foi salvo, enviado ou publicado.');
  });
  document.addEventListener('submit',e=>e.preventDefault());
  window.AuraColors={palettes,applyPalette};
  render();
})();
