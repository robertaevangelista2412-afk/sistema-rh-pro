/* RH PRO — Férias organizadas por mês da Data início, sem alterar os demais módulos */
(function(){
  const frame=document.getElementById('app');
  if(!frame) return;
  const meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  let activeMonth=0; // 0 = Todos

  function parseMonth(value){
    const s=String(value||'').trim();
    let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-]\d{2,4}$/);
    if(m) return Number(m[2]);
    m=s.match(/\b(\d{1,2})\s+de\s+([a-zçãéíóú]+)\s+de\s+\d{4}\b/i);
    if(m){
      const names=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
      const i=names.indexOf(m[2].toLowerCase());
      return i>=0?i+1:0;
    }
    return 0;
  }

  function enhance(){
    try{
      const d=frame.contentDocument;
      if(!d) return;
      const main=d.getElementById('main');
      if(!main) return;
      const h=main.querySelector('h1');
      if(!h || !/^Férias$/i.test((h.textContent||'').trim())) return;

      let host=d.getElementById('feriasMesesFix');
      if(!host){
        host=d.createElement('div');
        host.id='feriasMesesFix';
        host.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px 0;';
        const tableWrap=main.querySelector('.table-wrap');
        if(tableWrap) tableWrap.parentNode.insertBefore(host,tableWrap);
        else h.parentNode.parentNode.insertBefore(host,h.parentNode.nextSibling);
      }
      host.innerHTML='';
      const labels=['Todos',...meses];
      labels.forEach((label,i)=>{
        const b=d.createElement('button');
        b.type='button';
        b.className='ferias-tab'+(activeMonth===i?' active':'');
        b.textContent=label;
        b.onclick=function(){ activeMonth=i; filterRows(); enhance(); };
        host.appendChild(b);
      });
      filterRows();
    }catch(e){ console.warn('RH PRO — Férias por mês',e); }
  }

  function filterRows(){
    try{
      const d=frame.contentDocument;
      const main=d&&d.getElementById('main');
      if(!main) return;
      const wrap=main.querySelector('.table-wrap');
      const table=wrap&&wrap.querySelector('table');
      if(!table) return;
      const rows=table.querySelectorAll('tbody tr');
      rows.forEach(tr=>{
        if(activeMonth===0){ tr.style.display=''; return; }
        const cells=tr.querySelectorAll('td');
        const start=cells[6] ? cells[6].textContent : '';
        tr.style.display=(parseMonth(start)===activeMonth)?'':'none';
      });
    }catch(e){}
  }

  function watch(){
    try{
      const d=frame.contentDocument;
      const main=d&&d.getElementById('main');
      if(!main) return;
      if(!main.dataset.feriasMesesObserved){
        main.dataset.feriasMesesObserved='1';
        new MutationObserver(function(){
          const h=main.querySelector('h1');
          if(h && /^Férias$/i.test((h.textContent||'').trim())) setTimeout(enhance,0);
        }).observe(main,{childList:true,subtree:true});
      }
      enhance();
    }catch(e){}
  }

  frame.addEventListener('load',watch);
  [100,600,1500,3000].forEach(t=>setTimeout(watch,t));
})();
