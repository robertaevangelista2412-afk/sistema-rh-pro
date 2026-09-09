/* RH PRO — Férias: escolhas para Colaborador e Status */
(function(){
  const frame=document.getElementById('app');
  if(!frame) return;
  const statuses=['Programada','Em férias','Concluída','Cancelada'];
  function getEmployees(d){
    try{
      const raw=d.defaultView?.localStorage?.getItem('RH_PRO_DATA');
      const obj=raw?JSON.parse(raw):null;
      return Array.isArray(obj?.['Colaboradores'])?obj['Colaboradores']:[];
    }catch(e){return[]}
  }
  function enhanceFerias(){
    try{
      const d=frame.contentDocument;
      if(!d) return;
      const main=d.getElementById('main');
      if(!main) return;
      const h=main.querySelector('h1');
      if(!h || !/^(Novo|Editar)\s+—\s+Férias$/i.test((h.textContent||'').trim())) return;
      const f1=d.getElementById('f1');
      if(f1 && f1.tagName!=='SELECT'){
        const current=f1.value||'';
        const sel=d.createElement('select');
        sel.id='f1';
        sel.name=f1.name||'';
        sel.setAttribute('aria-label','Colaborador');
        const names=[...new Set(getEmployees(d).map(r=>Array.isArray(r)?String(r[1]||'').trim():'').filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
        sel.innerHTML='<option value="">Selecione o colaborador</option>'+names.map(n=>`<option value="${String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}">${String(n).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`).join('');
        sel.value=current;
        f1.replaceWith(sel);
      }
      const f9=d.getElementById('f9');
      if(f9 && f9.tagName!=='SELECT'){
        const current=f9.value||'';
        const sel=d.createElement('select');
        sel.id='f9';
        sel.name=f9.name||'';
        sel.setAttribute('aria-label','Status das férias');
        sel.innerHTML='<option value="">Selecione o status</option>'+statuses.map(s=>`<option value="${s}">${s}</option>`).join('');
        sel.value=current;
        f9.replaceWith(sel);
      }
    }catch(e){ console.warn('RH PRO — não foi possível aplicar escolhas de Férias',e); }
  }
  function watch(){
    try{
      const d=frame.contentDocument;
      const main=d&&d.getElementById('main');
      if(main && !main.__feriasEscolhasObserver){
        main.__feriasEscolhasObserver=true;
        new MutationObserver(enhanceFerias).observe(main,{childList:true,subtree:true});
        enhanceFerias();
      }
    }catch(e){}
  }
  frame.addEventListener('load',watch);
  setTimeout(watch,100);
  setTimeout(watch,800);
  setTimeout(watch,1800);
})();
