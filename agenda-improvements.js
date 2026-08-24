(function(){
  const iframe = document.getElementById('app');
  if(!iframe) return;

  function install(){
    const w = iframe.contentWindow;
    const d = iframe.contentDocument;
    if(!w || !d || !w.MODULES || !w.data) return;
    if(w.__agendaImprovementsInstalled) return;
    w.__agendaImprovementsInstalled = true;

    w.__agendaMonth = w.__agendaMonth || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const originalShowSection = w.showSection;
    const originalEditForm = w.editForm;

    function pad(n){ return String(n).padStart(2,'0'); }
    function parseAgendaDate(value){
      const s=String(value||'').trim();
      let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if(m) return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
      m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(m) return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
      return null;
    }
    function formatDateBR(value){
      const dt=parseAgendaDate(value);
      if(!dt) return String(value||'');
      return pad(dt.getDate())+'/'+pad(dt.getMonth()+1)+'/'+dt.getFullYear();
    }
    function toInputDate(value){
      const dt=parseAgendaDate(value);
      return dt ? dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate()) : '';
    }
    function toSavedDate(value){
      const dt=parseAgendaDate(value);
      return dt ? pad(dt.getDate())+'/'+pad(dt.getMonth()+1)+'/'+dt.getFullYear() : String(value||'');
    }
    function normalizeTime(value){
      let s=String(value||'').trim().toUpperCase().replace(/H/g,'').replace(/\s+/g,'');
      if(!s) return '';
      s=s.replace(/[^0-9:]/g,'');
      let h='', m='';
      if(s.includes(':')){
        const parts=s.split(':'); h=parts[0]; m=parts[1]||'00';
      }else if(/^\d{1,2}$/.test(s)){
        h=s; m='00';
      }else if(/^\d{3,4}$/.test(s)){
        h=s.length===3?s.slice(0,1):s.slice(0,2); m=s.slice(-2);
      }else{return value;}
      h=String(parseInt(h,10)); m=String(parseInt(m||'0',10));
      if(!Number.isFinite(Number(h)) || !Number.isFinite(Number(m)) || Number(h)>23 || Number(m)>59) return value;
      return pad(Number(h))+':'+pad(Number(m))+'H';
    }
    function displayTime(value){ return normalizeTime(value) || ''; }
    function monthLabel(date){
      return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(date).replace(/^./,c=>c.toUpperCase());
    }
    function injectStyles(){
      if(d.getElementById('agenda-improvements-style')) return;
      const style=d.createElement('style');
      style.id='agenda-improvements-style';
      style.textContent=`
        .agenda-month-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px}
        .agenda-month-title{font-size:22px;font-weight:800;color:#123b67;text-align:center;flex:1;min-width:220px}
        .agenda-month-actions{display:flex;gap:8px;flex-wrap:wrap}
        .agenda-month-actions button{white-space:nowrap}
        .agenda-summary{font-size:13px;color:#6b7280;margin:4px 0 16px}
        .agenda-form-note{font-size:12px;color:#6b7280;margin-top:5px;font-weight:400}
        .agenda-time-input{font-variant-numeric:tabular-nums}
        .agenda-month-empty{padding:36px 20px;text-align:center;color:#6b7280;border:1px dashed #cfd6de;border-radius:10px;background:#fafbfc}
        .agenda-day{font-weight:700;white-space:nowrap}
        @media(max-width:700px){
          .agenda-month-title{order:-1;width:100%;flex-basis:100%;font-size:20px}
          .agenda-month-actions{width:100%;justify-content:center}
          .agenda-month-actions button{flex:1;min-width:0}
        }
      `;
      d.head.appendChild(style);
    }
    function monthRows(){
      const rows=(w.data['Agenda RH']||[]);
      const y=w.__agendaMonth.getFullYear(), m=w.__agendaMonth.getMonth();
      return rows.map((r,i)=>({r,i,dt:parseAgendaDate(r?.[0])})).filter(x=>x.dt && x.dt.getFullYear()===y && x.dt.getMonth()===m)
        .sort((a,b)=>{
          const ta=normalizeTime(a.r?.[1])||'99:99H', tb=normalizeTime(b.r?.[1])||'99:99H';
          return a.dt-b.dt || ta.localeCompare(tb);
        });
    }
    function renderAgenda(){
      injectStyles();
      const rsAll=w.data['Agenda RH']||[];
      const rs=monthRows();
      d.getElementById('main').innerHTML=`
        <div class="top">
          <div><h1>📅 Agenda RH</h1><div class="muted">Compromissos organizados por mês.</div></div>
        </div>
        <div class="panel">
          <div class="agenda-month-bar">
            <div class="agenda-month-actions">
              <button class="secondary" type="button" id="agendaPrev">‹ Mês anterior</button>
              <button class="secondary" type="button" id="agendaToday">Hoje</button>
              <button class="secondary" type="button" id="agendaNext">Próximo mês ›</button>
            </div>
            <div class="agenda-month-title">${w.esc(monthLabel(w.__agendaMonth))}</div>
            <div class="agenda-month-actions">
              <button class="primary" type="button" id="agendaNew">+ Novo compromisso</button>
            </div>
          </div>
          <div class="agenda-summary">Mostrando ${rs.length} compromisso(s) de ${monthLabel(w.__agendaMonth)}. Os compromissos de outros meses ficam guardados e aparecem quando você mudar de mês. Total cadastrado: ${rsAll.length}.</div>
          <div class="actions"><input id="agendaSearch" class="search" placeholder="Pesquisar neste mês..." oninput="window.__renderAgendaMonth()"></div>
          <div class="table-wrap" id="agendaTable"></div>
        </div>`;
      d.getElementById('agendaPrev').onclick=()=>{ w.__agendaMonth=new Date(w.__agendaMonth.getFullYear(),w.__agendaMonth.getMonth()-1,1); renderAgenda(); };
      d.getElementById('agendaNext').onclick=()=>{ w.__agendaMonth=new Date(w.__agendaMonth.getFullYear(),w.__agendaMonth.getMonth()+1,1); renderAgenda(); };
      d.getElementById('agendaToday').onclick=()=>{ const now=new Date(); w.__agendaMonth=new Date(now.getFullYear(),now.getMonth(),1); renderAgenda(); };
      d.getElementById('agendaNew').onclick=()=>w.__agendaEditForm(-1);
      w.__renderAgendaMonth=renderAgendaTable;
      renderAgendaTable();
    }
    function renderAgendaTable(){
      const box=d.getElementById('agendaTable');
      if(!box) return;
      const q=String(d.getElementById('agendaSearch')?.value||'').toLowerCase().trim();
      let rs=monthRows();
      if(q) rs=rs.filter(x=>x.r.join(' ').toLowerCase().includes(q));
      let h='<table><thead><tr><th>Data</th><th>Hora</th><th>Evento</th><th>Descrição</th><th>Participantes</th><th>Local</th><th>Status</th><th>Observações</th><th>Ações</th></tr></thead><tbody>';
      if(!rs.length){
        h+='<tr><td colspan="9"><div class="agenda-month-empty">Nenhum compromisso cadastrado neste mês.</div></td></tr>';
      }else{
        rs.forEach(x=>{
          const r=x.r, i=x.i;
          h+=`<tr><td class="agenda-day">${w.esc(formatDateBR(r[0]))}</td><td>${w.esc(displayTime(r[1]))}</td><td>${w.esc(r[2]||'')}</td><td>${w.esc(r[3]||'')}</td><td>${w.esc(r[4]||'')}</td><td>${w.esc(r[5]||'')}</td><td>${w.esc(r[6]||'')}</td><td>${w.esc(r[7]||'')}</td><td><button class="mini" onclick="window.__agendaEditForm(${i})">Editar</button><button class="mini" onclick="window.__agendaDelete(${i})">Excluir</button></td></tr>`;
        });
      }
      h+='</tbody></table>';
      box.innerHTML=h;
    }
    function agendaEditForm(index){
      injectStyles();
      const cols=w.MODULES['Agenda RH'];
      const existing=index<0?Array(cols.length).fill(''):(w.data['Agenda RH']||[])[index]||Array(cols.length).fill('');
      const statusOpts=['Agendado','Confirmado','Em andamento','Concluído','Cancelado'];
      const fields=cols.map((c,j)=>{
        if(c==='Status'){
          const cur=existing[j]||'Agendado';
          return `<label>${w.esc(c)}<select id="agendaF${j}">${statusOpts.map(o=>`<option value="${w.esc(o)}" ${cur===o?'selected':''}>${w.esc(o)}</option>`).join('')}</select></label>`;
        }
        if(c==='Data') return `<label>${w.esc(c)}<input id="agendaF${j}" type="date" value="${w.esc(toInputDate(existing[j]||''))}"></label>`;
        if(c==='Hora') return `<label>${w.esc(c)}<input id="agendaF${j}" class="agenda-time-input" type="text" inputmode="numeric" autocomplete="off" placeholder="Ex.: 9 ou 930" value="${w.esc(displayTime(existing[j]||''))}" onblur="window.__agendaFormatTime(this)"><div class="agenda-form-note">Digite 9 → 09:00H • 930 → 09:30H • 14 → 14:00H</div></label>`;
        return `<label>${w.esc(c)}<input id="agendaF${j}" value="${w.esc(existing[j]||'')}"></label>`;
      }).join('');
      d.getElementById('main').innerHTML=`
        <div class="top"><div><h1>${index<0?'Novo':'Editar'} — Agenda RH</h1><div class="muted">Cadastre o compromisso. A agenda será organizada automaticamente por mês.</div></div></div>
        <div class="panel"><div class="grid">${fields}</div>
        <div class="actions" style="margin-top:18px"><button class="primary" onclick="window.__agendaSave(${index})">Salvar compromisso</button><button class="secondary" onclick="window.__agendaBack()">Cancelar</button></div></div>`;
      const dateInput=d.getElementById('agendaF0');
      if(index<0 && !dateInput.value){
        const dt=w.__agendaMonth;
        const now=new Date();
        const day=(now.getFullYear()===dt.getFullYear()&&now.getMonth()===dt.getMonth())?now.getDate():1;
        dateInput.value=dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(day);
      }
      const timeInput=d.getElementById('agendaF1');
      timeInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();w.__agendaFormatTime(timeInput);}});
    }
    w.__agendaFormatTime=function(el){
      if(!el) return;
      const normalized=normalizeTime(el.value);
      if(normalized) el.value=normalized;
    };
    w.__agendaSave=function(index){
      const r=colsToArray();
      if(!r[0]){alert('Informe a data do compromisso.');return;}
      if(r[1]) r[1]=normalizeTime(r[1]);
      if(r[1] && !/^\d{2}:\d{2}H$/.test(r[1])){alert('Informe um horário válido, por exemplo 9, 930 ou 14:30.');return;}
      r[0]=toSavedDate(r[0]);
      const list=w.data['Agenda RH']||(w.data['Agenda RH']=[]);
      if(index<0) list.push(r); else list[index]=r;
      if(typeof w.save==='function') w.save();
      renderAgenda();
    };
    function colsToArray(){
      return w.MODULES['Agenda RH'].map((c,j)=>{
        const el=d.getElementById('agendaF'+j);
        return el ? (el.value||'') : '';
      });
    }
    w.__agendaBack=()=>renderAgenda();
    w.__agendaEditForm=agendaEditForm;
    w.__agendaDelete=function(index){
      const item=(w.data['Agenda RH']||[])[index];
      if(!item) return;
      if(!confirm('Excluir este compromisso?')) return;
      (w.data['Agenda RH']||[]).splice(index,1);
      if(typeof w.save==='function') w.save();
      renderAgenda();
    };
    w.showSection=function(name){
      if(name==='Agenda RH'){
        w.current=name;
        if(typeof w.setActive==='function') w.setActive(name);
        renderAgenda();
        return;
      }
      return originalShowSection.apply(w,arguments);
    };
    w.editForm=function(name,index){
      if(name==='Agenda RH') return agendaEditForm(index);
      return originalEditForm.apply(w,arguments);
    };
    w.renderAgendaRH=renderAgenda;
    if(w.current==='Agenda RH' || d.querySelector('h1')?.textContent?.includes('Agenda RH')) renderAgenda();
  }
  iframe.addEventListener('load', install);
  try{ install(); }catch(e){ console.error('RH PRO Agenda:',e); }
})();
