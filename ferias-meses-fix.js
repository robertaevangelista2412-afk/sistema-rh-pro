/* RH PRO — Férias e Documentos de Férias organizados por mês */
(function(){
  const frame=document.getElementById('app');
  if(!frame) return;
  const meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  let activeFerias=0, activeDocs=0;
  function parseMonth(value){
    const s=String(value||'').trim();
    let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-]\d{2,4}$/);
    if(m) return Number(m[2]);
    m=s.match(/\b\d{1,2}\s+de\s+([a-zçãéíóú]+)\s+de\s+\d{4}\b/i);
    if(m){
      const names=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const i=names.indexOf(m[1].toLowerCase()); return i>=0?i+1:0;
    }
    return 0;
  }
  function addTabs(host,id,active,setActive,filter){
    if(!host) return;
    host.innerHTML='';
    ['Todos',...meses].forEach((label,i)=>{
      const b=host.ownerDocument.createElement('button'); b.type='button'; b.className='ferias-tab'+(active===i?' active':''); b.textContent=label;
      b.onclick=()=>{ setActive(i); filter(); };
      host.appendChild(b);
    });
  }
  function setupFerias(d){
    const wrap=d.getElementById('feriasTabelaUnica'); if(!wrap) return;
    let host=d.getElementById('feriasMesesFix');
    if(!host){host=d.createElement('div');host.id='feriasMesesFix';host.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px';wrap.parentNode.insertBefore(host,wrap);}
    const filter=()=>{ const table=wrap.querySelector('table'); if(!table)return; table.querySelectorAll('tbody tr').forEach(tr=>{ if(!activeFerias){tr.style.display='';return;} const c=tr.cells; const mm=parseMonth(c[6]?.textContent)||parseMonth(c[7]?.textContent); tr.style.display=mm===activeFerias?'':'none'; }); };
    addTabs(host,'ferias',activeFerias,i=>activeFerias=i,filter); filter();
  }
  function setupDocs(d){
    const wrap=d.getElementById('ferDocTabelaUnica'); if(!wrap) return;
    let host=d.getElementById('ferDocMesesFix');
    if(!host){host=d.createElement('div');host.id='ferDocMesesFix';host.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px';wrap.parentNode.insertBefore(host,wrap);}
    const filter=()=>{ const table=wrap.querySelector('table'); if(!table)return; table.querySelectorAll('tbody tr').forEach(tr=>{ if(!activeDocs){tr.style.display='';return;} let mm=0; for(const c of tr.cells){mm=parseMonth(c.textContent);if(mm)break;} tr.style.display=mm===activeDocs?'':'none'; }); };
    addTabs(host,'docs',activeDocs,i=>activeDocs=i,filter); filter();
  }
  function enhance(){try{const d=frame.contentDocument;if(!d)return;setupFerias(d);setupDocs(d);}catch(e){console.warn('RH PRO — meses de férias',e)}}
  function watch(){try{const d=frame.contentDocument,main=d&&d.getElementById('main');if(!main)return;if(!main.dataset.rhMesesObserved){main.dataset.rhMesesObserved='1';new MutationObserver(()=>setTimeout(enhance,60)).observe(main,{childList:true,subtree:true});}enhance();}catch(e){}}
  frame.addEventListener('load',watch); [100,600,1500,3000].forEach(t=>setTimeout(watch,t));
})();
