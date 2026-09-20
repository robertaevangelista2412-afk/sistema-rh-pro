// RH PRO — Dashboard: contadores/férias + Agenda da Semana
(function(){
  const frame=document.getElementById('app'); if(!frame)return;

  function norm(v){
    return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }
  function dateParts(v){
    const m=String(v??'').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if(!m)return null;
    let y=+m[3]; if(y<100)y+=2000;
    return [+m[1],+m[2],y];
  }
  function dateValue(v){
    const p=dateParts(v);
    return p?new Date(p[2],p[1]-1,p[0]):null;
  }
  function dateKey(v){
    const p=dateParts(v);
    return p?String(p[2]).padStart(4,'0')+'-'+String(p[1]).padStart(2,'0')+'-'+String(p[0]).padStart(2,'0'):null;
  }
  function esc(v){
    const d=frame.contentDocument;
    if(d && typeof d.defaultView?.esc==='function')return d.defaultView.esc(v);
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function getData(d){
    try{return JSON.parse(d.defaultView.localStorage.getItem('RH_PRO_DATA')||'{}')}
    catch(e){return {}}
  }
  function isActive(r){
    const s=norm(r?.[11]);
    return !s || s==='ativo' || s==='active';
  }
  function isVacationInMonth(r,month,year){
    const ini=dateValue(r?.[6]);
    return !!ini && ini.getMonth()+1===month && ini.getFullYear()===year;
  }
  function isPendingTask(r){
    const s=norm(r?.[4]);
    return !!s && s!=='concluido' && s!=='concluida' && s!=='cancelado' && s!=='cancelada';
  }

  function currentWeek(){
    const now=new Date();
    now.setHours(0,0,0,0);
    const start=new Date(now);
    start.setDate(now.getDate()-((now.getDay()+6)%7)); // segunda-feira
    const end=new Date(start);
    end.setDate(start.getDate()+6); // domingo
    return {start,end};
  }

  function fmtDay(d){
    return new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}).format(d)
      .replace(/^./,c=>c.toUpperCase());
  }

  function fmtRange(start,end){
    const f=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'});
    return f.format(start)+' a '+f.format(end);
  }

  function renderAgendaSemana(d){
    const main=d.getElementById('main'); if(!main)return;

    const old=d.getElementById('rhAgendaSemanaDashboard');
    if(old)old.remove();

    // A Agenda da Semana existe somente no Dashboard.
    // Identificamos o Dashboard pela presença dos painéis de
    // "Aniversariantes do mês" e "Férias". Em outras abas, como
    // "Agenda RH", esses dois painéis não existem.
    const birthdayPanel=[...main.querySelectorAll('.panel')].find(p=>norm(p.querySelector('h2')?.textContent||'').includes('aniversariantes'));
    const vacationPanel=[...main.querySelectorAll('.panel')].find(p=>norm(p.querySelector('h2')?.textContent||'').includes('ferias'));
    if(!birthdayPanel || !vacationPanel)return;

    const data=getData(d);
    const agenda=Array.isArray(data['Agenda RH'])?data['Agenda RH']:[];
    const {start,end}=currentWeek();
    const startKey=start.getFullYear()+'-'+String(start.getMonth()+1).padStart(2,'0')+'-'+String(start.getDate()).padStart(2,'0');
    const endKey=end.getFullYear()+'-'+String(end.getMonth()+1).padStart(2,'0')+'-'+String(end.getDate()).padStart(2,'0');

    const events=agenda
      .map((r,idx)=>({
        idx,
        date:r?.[0]||'',
        time:r?.[1]||'',
        title:r?.[2]||'',
        description:r?.[3]||'',
        participants:r?.[4]||'',
        location:r?.[5]||'',
        status:r?.[6]||'',
        notes:r?.[7]||'',
        key:dateKey(r?.[0])
      }))
      .filter(e=>e.key && e.key>=startKey && e.key<=endKey)
      .sort((a,b)=>(a.key+' '+a.time).localeCompare(b.key+' '+b.time,'pt-BR'));

    let body='';
    if(!events.length){
      body='<div class="empty" style="padding:22px">Nenhum compromisso cadastrado para esta semana.</div>';
    }else{
      body=events.map(e=>{
        const dt=dateValue(e.date);
        const day=dt?fmtDay(dt):esc(e.date);
        return '<div class="rh-week-item" style="padding:11px 0;border-bottom:1px solid #e5e7eb;display:flex;gap:12px;align-items:flex-start">'
          +'<div style="min-width:82px;font-weight:700;color:#123b67">'+esc(day)+'</div>'
          +'<div style="min-width:55px;font-weight:700">'+esc(e.time||'')+'</div>'
          +'<div style="flex:1"><div style="font-weight:700">'+esc(e.title||'Sem título')+'</div>'
          +(e.description?'<div class="muted" style="margin-top:3px">'+esc(e.description)+'</div>':'')
          +((e.participants||e.location)?'<div class="muted" style="margin-top:4px">'+(e.participants?'👥 '+esc(e.participants):'')+(e.participants&&e.location?' · ':'')+(e.location?'📍 '+esc(e.location):'')+'</div>':'')
          +'</div>'
          +(e.status?'<span class="badge">'+esc(e.status)+'</span>':'')
          +'</div>';
      }).join('');
    }

    const panel=d.createElement('div');
    panel.id='rhAgendaSemanaDashboard';
    panel.className='panel';
    panel.style.marginTop='18px';
    panel.innerHTML='<h2>📆 Agenda da Semana</h2>'
      +'<div class="muted" style="margin:-8px 0 10px">Semana de '+esc(fmtRange(start,end))+'</div>'
      +'<div>'+body+'</div>';

    const vacationPanel=[...main.querySelectorAll('.panel')].find(p=>norm(p.querySelector('h2')?.textContent||'').includes('ferias'));
    const birthdayPanel=[...main.querySelectorAll('.panel')].find(p=>norm(p.querySelector('h2')?.textContent||'').includes('aniversariantes'));
    if(vacationPanel) main.insertBefore(panel,vacationPanel);
    else if(birthdayPanel) birthdayPanel.insertAdjacentElement('afterend',panel);
    else main.appendChild(panel);
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
      [total,active,vacations.length,pending].forEach((v,i)=>{
        const n=cards[i]?.querySelector('.n'); if(n)n.textContent=String(v);
      });
    }

    const panel=[...main.querySelectorAll('.panel')].find(p=>norm(p.querySelector('h2')?.textContent||'').includes('ferias'));
    const table=panel?.querySelector('table');
    if(table){
      [...table.querySelectorAll('tbody tr')].forEach(tr=>{
        const cells=[...tr.cells];
        const dates=cells.map(c=>dateValue(c.textContent)).filter(Boolean);
        const ok=dates.length>=2 &&
          dates[0] <= new Date(year,month,0,23,59,59,999) &&
          dates[1] >= new Date(year,month-1,1);
        tr.style.display=ok?'':'none';
      });
    }

    renderAgendaSemana(d);
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
