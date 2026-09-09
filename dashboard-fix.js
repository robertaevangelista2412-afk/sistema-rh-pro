// RH PRO — Dashboard: indicadores por período atual
// ALTERAÇÃO EXCLUSIVA: corrige os números dos 4 cards do Dashboard.
// Não altera aniversariantes, cadastros ou dados salvos.
(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function data(){try{return frame.contentWindow.eval('data')||{}}catch(e){try{const r=frame.contentWindow.localStorage.getItem('RH_PRO_DATA');return r?JSON.parse(r):{}}catch(_){return {}}}}
  function monthOf(v){
    const s=norm(v).trim(); if(!s)return 0;
    let m=s.match(/\b\d{1,2}[\/.\-](\d{1,2})[\/.\-]\d{2,4}\b/); if(m)return Number(m[1]);
    m=s.match(/\b\d{4}[\/.\-](\d{1,2})[\/.\-]\d{1,2}\b/); if(m)return Number(m[1]);
    const names=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const i=names.findIndex(x=>s.includes(x)); return i>=0?i+1:0;
  }
  function isActive(v){const s=norm(v).replace(/[^a-z]/g,'');return s==='ativo'||s==='ativa'||s==='active';}
  function isDone(v){const s=norm(v).trim();return /^(concluido|concluida|concluido|cancelado|cancelada|finalizado|finalizada|feito|feita)$/.test(s);}
  function countActive(rows){
    if(!Array.isArray(rows))return 0;
    let foundStatus=false,count=0;
    rows.forEach(r=>{
      if(!Array.isArray(r))return;
      const status=r[11];
      if(String(status??'').trim()){foundStatus=true;if(isActive(status))count++;}
    });
    return foundStatus?count:rows.length;
  }
  function countVacations(rows,now){
    if(!Array.isArray(rows))return 0;
    const y=now.getFullYear(),m=now.getMonth()+1;
    return rows.filter(r=>Array.isArray(r)&&monthOf(r[6])===m && (String(r[6]||'').includes(String(y))||!String(r[6]||'').trim())).length;
  }
  function countPending(rows){
    if(!Array.isArray(rows))return 0;
    return rows.filter(r=>Array.isArray(r)&&!isDone(r[4])).length;
  }
  function setCard(label,value){
    const d=frame.contentDocument; if(!d)return;
    const target=norm(label);
    const cards=[...d.querySelectorAll('.card')];
    const card=cards.find(c=>norm(c.textContent).includes(target));
    if(!card)return;
    const n=card.querySelector('.n'); if(n)n.textContent=String(value);
  }
  function apply(){
    const d=frame.contentDocument; if(!d)return;
    const title=norm(d.querySelector('h1')?.textContent||'');
    if(!title.includes('dashboard'))return;
    const store=data(), now=new Date();
    const colaboradores=Array.isArray(store['Colaboradores'])?store['Colaboradores']:[];
    const ferias=Array.isArray(store['Férias'])?store['Férias']:[];
    const tarefas=Array.isArray(store['Tarefas RH'])?store['Tarefas RH']:[];
    setCard('total de colaboradores',colaboradores.length);
    setCard('total de colaboradores ativos',countActive(colaboradores));
    setCard('férias cadastradas',countVacations(ferias,now));
    setCard('tarefas pendentes',countPending(tarefas));
  }
  function boot(){
    apply();
    try{
      const d=frame.contentDocument,main=d?.getElementById('main');
      if(main&&!main.__rhDashboardFix){
        main.__rhDashboardFix=true;
        new MutationObserver(()=>{clearTimeout(main.__rhDashboardTimer);main.__rhDashboardTimer=setTimeout(apply,30)}).observe(main,{childList:true,subtree:true});
      }
      const w=frame.contentWindow;
      if(w&&!w.__rhDashboardShowWrapped&&typeof w.showSection==='function'){
        const old=w.showSection; w.showSection=function(n){const r=old.apply(this,arguments);if(norm(n)==='dashboard')setTimeout(apply,80);return r};
        w.__rhDashboardShowWrapped=true;
      }
    }catch(e){}
  }
  frame.addEventListener('load',()=>{setTimeout(boot,300);setTimeout(boot,1000);setTimeout(boot,2000)});
  setInterval(boot,1500);
})();
