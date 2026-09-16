(function(){
 const frame=document.getElementById('app');if(!frame)return;
 const pad=n=>String(n).padStart(2,'0');
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
 const parse=s=>{let x=String(s||'').trim(),m=x.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);m=x.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(+m[1],+m[2]-1,+m[3]):null};
 const fmt=d=>pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear();
 const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 const monthLabel=d=>new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(d).replace(/^./,c=>c.toUpperCase());
 let hooked=false;
 function boot(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
  if(!w||!d||!w.data||!w.MODULES)return;
  const cols=w.MODULES['Tarefas RH'];const main=d.getElementById('main');
  if(!Array.isArray(cols)||!cols.length||!main)return;
  const title=String(d.querySelector('h1')?.textContent||'');
  if(!/Tarefas RH/i.test(title))return;
  const dateIdx=Math.max(0,cols.findIndex(c=>/data|dia|prazo/i.test(c)));
  const statusIdx=cols.findIndex(c=>/^status$/i.test(c));
  const textIdx=cols.map((c,i)=>i).filter(i=>i!==dateIdx&&i!==statusIdx);
  const titleIdx=textIdx.find(i=>/tarefa|atividade|descri|assunto|título|titulo/i.test(cols[i]))??textIdx[0]??0;
  if(!d.getElementById('rhpro-tarefas-v2-style')){const s=d.createElement('style');s.id='rhpro-tarefas-v2-style';s.textContent='.rhpro-t2{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:14px}.rhpro-t2 .mes{font-size:22px;font-weight:800;color:#123b67;min-width:220px;text-align:center}.rhpro-t2-cal{overflow:auto;border:1px solid #d7dee7;border-radius:12px;background:#fff}.rhpro-t2-head,.rhpro-t2-days{display:grid;grid-template-columns:repeat(7,minmax(125px,1fr));min-width:875px}.rhpro-t2-head div{padding:10px;background:#eef2f6;text-align:center;font-weight:800;color:#123b67;font-size:12px}.rhpro-t2-day{min-height:150px;border-top:1px solid #d7dee7;border-right:1px solid #d7dee7;padding:8px;cursor:pointer}.rhpro-t2-day:hover{background:#f7fbff}.rhpro-t2-num{font-weight:800;color:#123b67;margin-bottom:6px}.rhpro-t2-item{background:#f4f7fb;border-left:4px solid #123b67;border-radius:7px;padding:7px;margin:5px 0;font-size:12px}.rhpro-t2-item small{display:block;color:#6b7280;margin-top:3px}.rhpro-t2-add{font-size:11px;color:#9aa4af;margin-top:10px}';d.head.appendChild(s)}
  let month=w.__RHPRO_TAREFAS_MONTH||new Date(new Date().getFullYear(),new Date().getMonth(),1);w.__RHPRO_TAREFAS_MONTH=month;
  const data=()=>w.data['Tarefas RH']||[];
  const rows=()=>data().map((r,i)=>({r,i,d:parse(r[dateIdx])})).filter(x=>x.d&&x.d.getFullYear()===month.getFullYear()&&x.d.getMonth()===month.getMonth());
  const statuses=()=>['Pendente','Agendado','Em andamento','Concluído','Cancelado'];
  function render(){
   const rs=rows(),first=new Date(month.getFullYear(),month.getMonth(),1),start=(first.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),cells=[];
   for(let i=0;i<start;i++)cells.push('<div class="rhpro-t2-day" style="background:#f8fafc;cursor:default"></div>');
   for(let day=1;day<=days;day++){const dt=new Date(month.getFullYear(),month.getMonth(),day),items=rs.filter(x=>fmt(x.d)===fmt(dt));cells.push('<div class="rhpro-t2-day" data-day="'+iso(dt)+'"><div class="rhpro-t2-num">'+day+'</div>'+items.map(x=>'<div class="rhpro-t2-item" data-edit="'+x.i+'"><b>'+esc(x.r[titleIdx]||'Tarefa')+'</b>'+(statusIdx>=0&&x.r[statusIdx]?'<small>'+esc(x.r[statusIdx])+'</small>':'')+'</div>').join('')+'<div class="rhpro-t2-add">+ adicionar tarefa</div></div>')}
   while(cells.length%7)cells.push('<div class="rhpro-t2-day" style="background:#f8fafc;cursor:default"></div>');
   main.innerHTML='<div class="top"><div><h1>✅ Tarefas RH</h1><div class="muted">Organizadas por mês, com espaço maior para as tarefas de cada dia.</div></div></div><div class="panel"><div class="rhpro-t2"><button id="t2-prev" class="secondary" type="button">‹ Mês anterior</button><button id="t2-today" class="secondary" type="button">Hoje</button><div class="mes">'+esc(monthLabel(month))+'</div><button id="t2-next" class="secondary" type="button">Próximo mês ›</button><button id="t2-new" class="primary" type="button">+ Nova tarefa</button></div><div style="font-size:13px;color:#6b7280;margin-bottom:14px">'+rs.length+' tarefa(s) cadastrada(s) neste mês. Clique em um dia para adicionar.</div><div class="rhpro-t2-cal"><div class="rhpro-t2-head"><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div><div>DOM</div></div><div class="rhpro-t2-days">'+cells.join('')+'</div></div></div>';
   main.querySelector('#t2-prev').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);w.__RHPRO_TAREFAS_MONTH=month;render()};
   main.querySelector('#t2-next').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);w.__RHPRO_TAREFAS_MONTH=month;render()};
   main.querySelector('#t2-today').onclick=()=>{const n=new Date();month=new Date(n.getFullYear(),n.getMonth(),1);w.__RHPRO_TAREFAS_MONTH=month;render()};
   main.querySelector('#t2-new').onclick=()=>form(-1);
   main.querySelectorAll('[data-day]').forEach(el=>el.onclick=e=>{if(!e.target.closest('[data-edit]'))form(-1,el.dataset.day)});
   main.querySelectorAll('[data-edit]').forEach(el=>el.onclick=e=>{e.stopPropagation();form(+el.dataset.edit)});
  }
  function form(index,chosen){
   const old=index<0?Array(cols.length).fill(''):data()[index]||Array(cols.length).fill('');if(index<0&&chosen)old[dateIdx]=chosen;
   let h='<div class="top"><div><h1>'+(index<0?'Nova':'Editar')+' — Tarefa RH</h1><div class="muted">Preencha a tarefa e a data.</div></div></div><div class="panel"><div class="grid">';
   cols.forEach((c,i)=>{if(i===dateIdx){const dt=parse(old[i]);h+='<label>'+esc(c)+'<input id="t2-f'+i+'" type="date" value="'+(dt?iso(dt):'')+'"></label>'}else if(i===statusIdx){h+='<label>'+esc(c)+'<select id="t2-f'+i+'"><option value="">Selecione</option>'+statuses().map(v=>'<option value="'+esc(v)+'" '+(old[i]===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'}else{const big=i===titleIdx||/descri|observa|detalhe|anota/i.test(c);h+='<label>'+esc(c)+(big?'<textarea id="t2-f'+i+'">'+esc(old[i]||'')+'</textarea>':'<input id="t2-f'+i+'" value="'+esc(old[i]||'')+'">')+'</label>'}});
   h+='</div><div class="actions" style="margin-top:18px"><button id="t2-save" class="primary" type="button">Salvar tarefa</button><button id="t2-cancel" class="secondary" type="button">Cancelar</button>'+(index>=0?'<button id="t2-delete" class="secondary" type="button">Excluir tarefa</button>':'')+'</div></div>';main.innerHTML=h;
   main.querySelector('#t2-save').onclick=()=>{const r=cols.map((_,i)=>main.querySelector('#t2-f'+i)?.value||'');if(!r[dateIdx])return alert('Informe a data.');const dt=parse(r[dateIdx]);if(!dt)return alert('Data inválida.');r[dateIdx]=fmt(dt);w.data['Tarefas RH']=w.data['Tarefas RH']||[];if(index<0)w.data['Tarefas RH'].push(r);else w.data['Tarefas RH'][index]=r;if(typeof w.save==='function')w.save();month=new Date(dt.getFullYear(),dt.getMonth(),1);w.__RHPRO_TAREFAS_MONTH=month;render()};
   main.querySelector('#t2-cancel').onclick=render;if(index>=0)main.querySelector('#t2-delete').onclick=()=>{if(confirm('Excluir esta tarefa?')){w.data['Tarefas RH'].splice(index,1);if(typeof w.save==='function')w.save();render()}};
  }
  if(!hooked&&typeof w.showSection==='function'){const old=w.showSection;w.showSection=function(n){const r=old.apply(this,arguments);if(String(n||'')==='Tarefas RH')setTimeout(boot,50);return r};hooked=true}
  render();
 }
 frame.addEventListener('load',()=>{setTimeout(boot,300);setTimeout(boot,1000)});
 setInterval(boot,800);
})();
