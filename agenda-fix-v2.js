(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function start(){
    let w,d; try{w=frame.contentWindow;d=frame.contentDocument;}catch(e){return;}
    if(!w||!d||!w.data)return;
    const esc=w.esc||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));};
    const pad=n=>String(n).padStart(2,'0');
    const date=s=>{let m=String(s||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?new Date(+m[3],+m[2]-1,+m[1]):null};
    const time=s=>{let x=String(s||'').toUpperCase().replace(/H/g,'').replace(/\s/g,'');if(!x)return '';let h,m;if(x.includes(':'))[h,m]=x.split(':');else if(/^\d{1,2}$/.test(x)){h=x;m='00'}else if(/^\d{3,4}$/.test(x)){h=x.length===3?x[0]:x.slice(0,-2);m=x.slice(-2)}else return s;h=+h;m=+m;return h<=23&&m<=59?pad(h)+':'+pad(m)+'H':s};
    const monthName=dt=>new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(dt).replace(/^./,c=>c.toUpperCase());
    let month=w.__agendaMonth||new Date(new Date().getFullYear(),new Date().getMonth(),1);w.__agendaMonth=month;
    function rows(){const all=w.data['Agenda RH']||[];return all.map((r,i)=>({r,i,d:date(r[0])})).filter(x=>x.d&&x.d.getFullYear()===month.getFullYear()&&x.d.getMonth()===month.getMonth()).sort((a,b)=>a.d-b.d||String(time(a.r[1])).localeCompare(String(time(b.r[1]))));}
    function draw(){
      const main=d.getElementById('main');if(!main)return;
      const rs=rows(), total=(w.data['Agenda RH']||[]).length;
      main.innerHTML='<div class="top"><div><h1>📅 Agenda RH</h1><div class="muted">Compromissos organizados por mês.</div></div></div><div class="panel"><div class="af-bar"><button id="af-prev" class="secondary">‹ Mês anterior</button><button id="af-today" class="secondary">Hoje</button><strong>'+esc(monthName(month))+'</strong><button id="af-next" class="secondary">Próximo mês ›</button><button id="af-new" class="primary">+ Novo compromisso</button></div><div class="af-info">Mostrando '+rs.length+' compromisso(s) de '+esc(monthName(month))+'. Total cadastrado: '+total+'.</div><div class="actions"><input id="af-search" class="search" placeholder="Pesquisar neste mês..."></div><div class="table-wrap"><table><thead><tr><th>Data</th><th>Hora</th><th>Evento</th><th>Descrição</th><th>Participantes</th><th>Local</th><th>Status</th><th>Observações</th><th>Ações</th></tr></thead><tbody id="af-body"></tbody></table></div></div>';
      const body=d.getElementById('af-body');function table(){const q=(d.getElementById('af-search').value||'').toLowerCase();let a=rows().filter(x=>x.r.join(' ').toLowerCase().includes(q));body.innerHTML=a.length?a.map(x=>'<tr><td><b>'+esc(x.r[0])+'</b></td><td>'+esc(time(x.r[1]))+'</td><td>'+esc(x.r[2])+'</td><td>'+esc(x.r[3])+'</td><td>'+esc(x.r[4])+'</td><td>'+esc(x.r[5])+'</td><td>'+esc(x.r[6])+'</td><td>'+esc(x.r[7])+'</td><td><button class="mini" data-e="'+x.i+'">Editar</button><button class="mini" data-d="'+x.i+'">Excluir</button></td></tr>').join(''):'<tr><td colspan="9"><div class="af-empty">Nenhum compromisso cadastrado neste mês.</div></td></tr>';}table();
      d.getElementById('af-prev').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);w.__agendaMonth=month;draw()};
      d.getElementById('af-next').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);w.__agendaMonth=month;draw()};
      d.getElementById('af-today').onclick=()=>{let n=new Date();month=new Date(n.getFullYear(),n.getMonth(),1);w.__agendaMonth=month;draw()};
      d.getElementById('af-new').onclick=()=>form(-1);d.getElementById('af-search').oninput=table;
      body.onclick=e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.e!==undefined)form(+b.dataset.e);if(b.dataset.d!==undefined&&confirm('Excluir este compromisso?')){w.data['Agenda RH'].splice(+b.dataset.d,1);w.save();draw()}};
    }
    function form(idx){
      const old=idx<0?Array(8).fill(''):(w.data['Agenda RH'][idx]||Array(8).fill(''));
      const vals=['Data','Hora','Evento','Descrição','Participantes','Local','Status','Observações'];
      let h='<div class="top"><div><h1>'+esc(idx<0?'Novo':'Editar')+' — Agenda RH</h1><div class="muted">Digite somente o número no horário. Ex.: 9 → 09:00H • 930 → 09:30H</div></div></div><div class="panel"><div class="grid">';
      vals.forEach((c,j)=>{if(j===0)h+='<label>'+c+'<input id="af-f'+j+'" type="date" value="'+(date(old[j])?date(old[j]).getFullYear()+'-'+pad(date(old[j]).getMonth()+1)+'-'+pad(date(old[j]).getDate()):'')+'"></label>';else if(j===1)h+='<label>'+c+'<input id="af-f1" inputmode="numeric" placeholder="9 ou 930" value="'+esc(time(old[j]))+'"><small>9 → 09:00H | 930 → 09:30H | 14 → 14:00H</small></label>';else if(j===6)h+='<label>'+c+'<select id="af-f6">'+['Agendado','Confirmado','Em andamento','Concluído','Cancelado'].map(o=>'<option '+((old[j]||'Agendado')===o?'selected':'')+'>'+o+'</option>').join('')+'</select></label>';else h+='<label>'+c+'<input id="af-f'+j+'" value="'+esc(old[j]||'')+'"></label>';});
      h+='</div><div class="actions" style="margin-top:18px"><button id="af-save" class="primary">Salvar compromisso</button><button id="af-cancel" class="secondary">Cancelar</button></div></div>';d.getElementById('main').innerHTML=h;
      d.getElementById('af-save').onclick=()=>{let r=vals.map((_,j)=>d.getElementById('af-f'+j).value||'');let t=time(r[1]);if(!r[0])return alert('Informe a data.');if(r[1]&&!/^\d{2}:\d{2}H$/.test(t))return alert('Horário inválido. Use 9, 930 ou 14:30.');let z=new Date(r[0]+'T00:00:00');r[0]=pad(z.getDate())+'/'+pad(z.getMonth()+1)+'/'+z.getFullYear();r[1]=t;if(idx<0)w.data['Agenda RH'].push(r);else w.data['Agenda RH'][idx]=r;w.save();month=new Date(z.getFullYear(),z.getMonth(),1);w.__agendaMonth=month;draw()};
      d.getElementById('af-cancel').onclick=draw;
    }
    const style=d.createElement('style');style.textContent='.af-bar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:14px}.af-bar strong{font-size:22px;color:#123b67;min-width:220px;text-align:center}.af-info{font-size:13px;color:#6b7280;margin-bottom:12px}.af-empty{padding:30px;text-align:center;color:#6b7280}label small{display:block;color:#6b7280;font-weight:400;margin-top:5px;font-size:11px}@media(max-width:700px){.af-bar strong{order:-1;flex-basis:100%}.af-bar button{flex:1}}';d.head.appendChild(style);
    function active(){return String(w.current||'')==='Agenda RH'||/Agenda RH/i.test(d.querySelector('h1')?.textContent||'')}
    function watch(){if(active()&&!d.getElementById('af-prev'))draw()}
    new MutationObserver(watch).observe(d.body,{childList:true,subtree:true});
    const oldShow=w.showSection;if(typeof oldShow==='function'){w.showSection=function(n){const r=oldShow.apply(this,arguments);if(n==='Agenda RH')setTimeout(draw,0);return r}}
    setInterval(watch,500);watch();
  }
  frame.addEventListener('load',()=>setTimeout(start,100));setTimeout(start,500);setTimeout(start,2000);
})();
