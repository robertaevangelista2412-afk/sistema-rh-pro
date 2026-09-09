// RH PRO — Férias: mês vigente por padrão, sem apagar dados
(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  const KF='RH_PRO_FERIAS_MES', KD='RH_PRO_DOC_FERIAS_MES';
  const monthNow=()=>new Date().getMonth()+1;
  const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  function ls(d){try{return d.defaultView.localStorage}catch(e){return null}}
  function md(v){const m=String(v??'').match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/);return m?{d:+m[1],m:+m[2],y:(+m[3]<100?2000:+m[3])}:null}
  function table(d,type){const id=type==='f'?'feriasTabelaUnica':'ferDocTabelaUnica';const box=d.getElementById(id);return box?.querySelector('table')||null}
  function rowMonth(tr,type){
    const t=tr.closest('table'); const hs=[...t.querySelectorAll('thead th')].map(x=>norm(x.textContent));
    let idx=type==='f'?hs.findIndex(x=>x.includes('data inicio')||x==='inicio'):hs.findIndex(x=>x==='data'||x.includes('data'));
    if(idx>=0){const p=md(tr.cells[idx]?.textContent);if(p)return p.m}
    const ps=[...tr.cells].map(c=>md(c.textContent)).filter(Boolean); return ps[0]?.m||0;
  }
  function filter(d,type,month){const t=table(d,type);if(!t)return;[...t.querySelectorAll('tbody tr')].forEach(tr=>{if(tr.querySelector('th'))return;const ok=rowMonth(tr,type)===month;tr.hidden=!ok;tr.style.setProperty('display',ok?'':'none','important')})}
  function forceCurrentOnce(d){
    const l=ls(d); if(!l)return;
    const m=monthNow();
    try{l.setItem(KF,String(m));l.setItem(KD,String(m))}catch(e){}
    const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');
    if(bf){bf.dataset.rhMesSelecionado=m;bf.querySelectorAll('[data-rh-mes]').forEach(b=>b.classList.toggle('active',+b.dataset.rhMes===m))}
    if(bd){bd.dataset.rhMesSelecionado=m;bd.querySelectorAll('[data-rh-mes]').forEach(b=>b.classList.toggle('active',+b.dataset.rhMes===m))}
    filter(d,'f',m);filter(d,'d',m);
  }
  let initialized=false,last=null,obs=null;
  function boot(){try{const d=frame.contentDocument;if(!d?.body)return;if(d!==last){last=d;initialized=false;if(obs)obs.disconnect();obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(()=>{const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');const mf=bf?+(bf.dataset.rhMesSelecionado||0):0,mdoc=bd?+(bd.dataset.rhMesSelecionado||0):0;if(!initialized){forceCurrentOnce(d);initialized=true}else{filter(d,'f',mf||monthNow());filter(d,'d',mdoc||monthNow())}},60)});obs.observe(d.getElementById('main')||d.body,{childList:true,subtree:true})}if(!initialized){forceCurrentOnce(d);initialized=true}}catch(e){}}
  frame.addEventListener('load',()=>[300,900,1800].forEach(ms=>setTimeout(boot,ms)));[500,1200,2500,5000].forEach(ms=>setTimeout(boot,ms));
})();
