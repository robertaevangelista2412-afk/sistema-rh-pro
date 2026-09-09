// RH PRO — correção exclusiva do Dashboard
(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function dateParts(v){const m=String(v??'').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);return m?[+m[1],+m[2],+m[3]]:null}
  function rows(d){
    try{return JSON.parse(d.defaultView.localStorage.getItem('RH_PRO_DATA')||'{}')}catch(e){return {}}
  }
  function isActive(r){
    const s=norm(r?.status||r?.[7]||r?.[8]||r?.[9]||'');
    return s==='ativo'||s==='active'||s.includes('ativo')&&!s.includes('inativo');
  }
  function dashboard(d){
    const data=rows(d), col=Array.isArray(data['Colaboradores'])?data['Colaboradores']:[], tasks=Array.isArray(data['Tarefas'])?data['Tarefas']:[];
    const now=new Date(), month=now.getMonth()+1, year=now.getFullYear();
    const active=col.filter(isActive).length;
    const inactive=col.length-active;
    const pending=tasks.filter(r=>{const s=norm(r?.status??r?.[3]??r?.[4]??'');return s==='pendente'||s==='pending'||s.includes('pendente')}).length;
    const fer=Array.isArray(data['Férias'])?data['Férias']:[];
    const vacation=fer.filter(r=>{const p=dateParts(r?.['Data início']??r?.[6]??'');return p&&p[1]===month&&(+p[2]<100?2000+p[2]:p[2])===year}).length;
    const main=d.getElementById('main'); if(!main)return;
    const cards=[...main.querySelectorAll('.cards .card')];
    if(cards.length<4)return;
    const vals=[active,inactive,vacation,pending];
    cards.forEach((c,i)=>{const n=c.querySelector('.n');if(n)n.textContent=vals[i]});
  }
  function boot(){try{const d=frame.contentDocument;if(!d?.body)return;dashboard(d)}catch(e){}}
  frame.addEventListener('load',()=>setTimeout(boot,300));
  [500,1200,2500].forEach(ms=>setTimeout(boot,ms));
  setInterval(boot,1500);
})();
