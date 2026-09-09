/* RH PRO — Férias e Documentos de Férias organizados por mês
   Correção robusta: cria as abas dentro das próprias áreas e filtra pela data correta.
*/
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function month(v){
    const s=norm(v).trim();
    let m=s.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-]\d{2,4}\b/);
    if(m)return Number(m[2]);
    m=s.match(/\b(\d{1,2})\s+de\s+([a-z]+)\s+de\s+\d{4}\b/);
    if(m){const i=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].indexOf(m[2]);if(i>=0)return i+1;}
    const names=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const i=names.findIndex(x=>s.includes(x));
    return i>=0?i+1:0;
  }
  function findTable(d,keywords){
    const tables=[...d.querySelectorAll('table')];
    return tables.find(t=>{const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');return keywords.every(k=>h.includes(norm(k)));})||null;
  }
  function findDateColumn(table,preferred){
    const cells=table.querySelectorAll('thead th');
    for(let i=0;i<cells.length;i++)if(preferred.some(k=>norm(cells[i].textContent).includes(norm(k))))return i;
    return -1;
  }
  function makeTabs(d,table,id,getSelected,setSelected){
    if(!table)return;
    const parent=table.closest('.panel')||table.parentElement;
    if(!parent)return;
    let box=d.getElementById(id);
    if(!box){box=d.createElement('div');box.id=id;box.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;';parent.insertBefore(box,table);}
    const selected=getSelected();
    if(box.dataset.selected!==String(selected)||box.childElementCount!==meses.length){
      box.dataset.selected=String(selected);box.innerHTML='';
      meses.forEach((label,i)=>{const b=d.createElement('button');b.type='button';b.textContent=label;b.className='ferias-tab';b.style.cssText='border:0;border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer;background:'+(i===selected?'#123b67':'#e9eef4')+';color:'+(i===selected?'#fff':'#123b67')+';';b.onclick=()=>{setSelected(i);apply();};box.appendChild(b);});
    }
    function apply(){
      const m=getSelected();
      box.dataset.selected=String(m);
      box.querySelectorAll('button').forEach((b,i)=>{b.style.background=i===m?'#123b67':'#e9eef4';b.style.color=i===m?'#fff':'#123b67';});
      const idx=findDateColumn(table,preferredFor(table));
      table.querySelectorAll('tbody tr').forEach(tr=>{
        if(!m){tr.style.display='';return;}
        const c=tr.cells;
        const val=idx>=0?c[idx]?.textContent:[...c].map(x=>x.textContent).join(' ');
        tr.style.display=month(val)===m?'':'none';
      });
    }
    function preferredFor(t){
      const text=norm(t.querySelector('thead')?.textContent||'');
      if(text.includes('periodo de ferias'))return ['data inicio','periodo de ferias','data fim'];
      return ['data inicio','data de inicio','data','periodo de ferias'];
    }
    apply();
  }
  let feriasMes=0,docsMes=0;
  function boot(){
    let d;try{d=frame.contentDocument;}catch(e){return} if(!d)return;
    const ferTable=findTable(d,['Colaborador','Data início'])||d.querySelector('#feriasTabelaUnica table');
    const docsTable=findTable(d,['Documento'])||d.querySelector('#ferDocTabelaUnica table');
    if(ferTable)makeTabs(d,ferTable,'feriasMesesFix',()=>feriasMes,i=>feriasMes=i);
    if(docsTable)makeTabs(d,docsTable,'ferDocMesesFix',()=>docsMes,i=>docsMes=i);
  }
  frame.addEventListener('load',()=>{[300,900,1800].forEach(t=>setTimeout(boot,t));});
  setInterval(boot,1200);
})();
