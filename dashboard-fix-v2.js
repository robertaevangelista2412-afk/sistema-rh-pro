// RH PRO — correção exclusiva do Dashboard
(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function dateParts(v){const m=String(v??'').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(!m)return null;let y=+m[3];if(y<100)y+=2000;return [+m[1],+m[2],y]}
  function dateValue(v){const p=dateParts(v);return p?new Date(p[2],p[1]-1,p[0]):null}
  function getData(d){try{return JSON.parse(d.defaultView.localStorage.getItem('RH_PRO_DATA')||'{}')}catch(e){return {}}}
  function statusColaborador(r){return norm(r?.[11]??r?.status??'')}
  function isActive(r){const s=statusColaborador(r);return s==='ativo'||s==='active'||s.includes('ativo')&&!s.includes('inativo')}
  function isVacationInMonth(r,month,year){
    const ini=dateValue(r?.[6]??r?.['Data início']);
    const fim=dateValue(r?.[7]??r?.['Data fim'])||ini;
    if(!ini||!fim)return false;
    const first=new Date(year,month-1,1), last=new Date(year,month,0,23,59,59,999);
    return ini<=last && fim>=first;
  }
  function isPendingTask(r){
    const s=norm(r?.[4]??r?.status??'');
    return s!=='' && !['concluido','concluida','concluido(a)','cancelado','cancelada'].includes(s);
  }
  function dashboard(d){
    const data=getData(d);
    const col=Array.isArray(data['Colaboradores'])?data['Colaboradores']:[];
    const tasks=Array.isArray(data['Tarefas RH'])?data['Tarefas RH']:(Array.isArray(data['Tarefas'])?data['Tarefas']:[]);
    const now=new Date(), month=now.getMonth()+1, year=now.getFullYear();
    const total=col.length;
    const active=col.filter(isActive).length;
    const fer=Array.isArray(data['Férias'])?data['Férias']:[];
    const vacations=fer.filter(r=>isVacationInMonth(r,month,year));
    const pending=tasks.filter(isPendingTask).length;
    const main=d.getElementById('main'); if(!main)return;
    const cards=[...main.querySelectorAll('.cards .card')];
    if(cards.length>=4){
      const vals=[total,active,vacations.length,pending];
      cards.slice(0,4).forEach((c,i)=>{const n=c.querySelector('.n');if(n)n.textContent=String(vals[i])});
    }
    // No quadro de Férias do Dashboard, mostrar somente quem está de férias no mês atual.
    const panels=[...main.querySelectorAll('.panel')];
    const ferPanel=panels.find(p=>norm(p.querySelector('h2,h3')?.textContent||'').includes('ferias'));
    const table=ferPanel?.querySelector('table');
    if(table){
      [...table.querySelectorAll('tbody tr')].forEach(tr=>{
        const cells=[...tr.cells];
        if(!cells.length)return;
        const start=cells.find(c=>dateParts(c.textContent));
        let ok=false;
        if(start){
          const dates=cells.map(c=>dateValue(c.textContent)).filter(Boolean);
          const ini=dates[0], fim=dates[1]||ini;
          const first=new Date(year,month-1,1), last=new Date(year,month,0,23,59,59,999);
          ok=!!ini&&!!fim&&ini<=last&&fim>=first;
        }
        tr.hidden=!ok;
        tr.style.display=ok?'':'none';
      });
    }
  }
  function boot(){try{const d=frame.contentDocument;if(!d?.body)return;dashboard(d)}catch(e){}}
  frame.addEventListener('load',()=>setTimeout(boot,500));
  [800,1800,3500,6000].forEach(ms=>setTimeout(boot,ms));
  setInterval(boot,2000);
})();
