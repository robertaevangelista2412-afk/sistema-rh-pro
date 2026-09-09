// RH PRO — Dashboard: somente contadores reais + férias do mês vigente
(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function dateParts(v){const m=String(v??'').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);if(!m)return null;let y=+m[3];if(y<100)y+=2000;return [+m[1],+m[2],y]}
  function dateValue(v){const p=dateParts(v);return p?new Date(p[2],p[1]-1,p[0]):null}
  function getData(d){try{return JSON.parse(d.defaultView.localStorage.getItem('RH_PRO_DATA')||'{}')}catch(e){return {}}}
  function isActive(r){
    // Mesma regra original do sistema: vazio ou "Ativo" conta como ativo.
    const s=norm(r?.[11]);
    return !s || s==='ativo' || s==='active';
  }
  function isVacationInMonth(r,month,year){
    // "Férias cadastradas" conta os lançamentos cuja DATA DE INÍCIO pertence ao mês vigente.
    // Assim, férias iniciadas em agosto não entram no contador de setembro, mesmo que atravessem o mês.
    const ini=dateValue(r?.[6]);
    return !!ini && ini.getMonth()+1===month && ini.getFullYear()===year;
  }
  function isPendingTask(r){
    const s=norm(r?.[4]);
    return !!s && s!=='concluido' && s!=='concluida' && s!=='cancelado' && s!=='cancelada';
  }
  function apply(d){
    const data=getData(d);
    const col=Array.isArray(data['Colaboradores'])?data['Colaboradores'].filter(r=>r&&r[1]):[];
    const total=col.length;
    const active=col.filter(isActive).length;
    const tasks=Array.isArray(data['Tarefas RH'])?data['Tarefas RH']:[];
    const pending=tasks.filter(isPendingTask).length;
    const now=new Date(), month=now.getMonth()+1, year=now.getFullYear();
    const fer=Array.isArray(data['Férias'])?data['Férias']:[];
    const vacations=fer.filter(r=>isVacationInMonth(r,month,year));
    const main=d.getElementById('main'); if(!main)return;
    const cards=[...main.querySelectorAll('.cards .card')];
    if(cards.length>=4){
      [total,active,vacations.length,pending].forEach((v,i)=>{const n=cards[i]?.querySelector('.n');if(n)n.textContent=String(v)});
    }
    // O quadro de Férias do Dashboard mostra exclusivamente quem está de férias no mês vigente.
    const panel=[...main.querySelectorAll('.panel')].find(p=>norm(p.querySelector('h2')?.textContent||'').includes('ferias'));
    const table=panel?.querySelector('table');
    if(table){
      [...table.querySelectorAll('tbody tr')].forEach(tr=>{
        const cells=[...tr.cells];
        const dates=cells.map(c=>dateValue(c.textContent)).filter(Boolean);
        const ok=dates.length>=2 && dates[0] <= new Date(year,month,0,23,59,59,999) && dates[1] >= new Date(year,month-1,1);
        tr.style.display=ok?'':'none';
      });
    }
  }
  function install(d){
    if(!d?.body)return;
    if(!d.__rhDashboardFixInstalled && typeof d.renderDashboard==='function'){
      const original=d.renderDashboard;
      d.renderDashboard=function(){
        const out=original.apply(this,arguments);
        setTimeout(()=>apply(d),0);
        return out;
      };
      d.__rhDashboardFixInstalled=true;
    }
    apply(d);
  }
  function boot(){try{install(frame.contentDocument)}catch(e){}}
  frame.addEventListener('load',()=>[100,500,1200].forEach(ms=>setTimeout(boot,ms)));
  [300,800,1600,3000].forEach(ms=>setTimeout(boot,ms));
  setInterval(boot,1500);
})();
