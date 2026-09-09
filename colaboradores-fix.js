// RH PRO — Colaboradores
// ALTERAÇÃO EXCLUSIVA: salário com R$ e status Ativo/Inativo por cor.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  function doc(){try{return frame.contentDocument;}catch(e){return null;}}
  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function addStyles(d){
    if(d.getElementById('rhColaboradoresFixStyles'))return;
    const s=d.createElement('style');s.id='rhColaboradoresFixStyles';
    s.textContent=`
      .rh-salario{font-weight:700;white-space:nowrap}
      .rh-status{display:inline-flex;align-items:center;justify-content:center;min-width:78px;padding:6px 11px;border-radius:999px;font-weight:700;font-size:12px;line-height:1;white-space:nowrap}
      .rh-status.ativo{background:#123b67!important;color:#fff!important}
      .rh-status.inativo{background:#c62828!important;color:#fff!important}
      .rh-salario-field-wrap{display:flex!important;align-items:center!important;gap:6px!important}
      .rh-salario-prefix{font-weight:700;color:#374151;white-space:nowrap}
    `;
    d.head.appendChild(s);
  }
  function formatMoney(v){
    let s=String(v??'').trim();if(!s)return '';
    s=s.replace(/R\$\s*/gi,'').replace(/\s/g,'');
    let n;
    if(s.includes(',')&&s.includes('.'))n=Number(s.replace(/\./g,'').replace(',','.'));
    else if(s.includes(','))n=Number(s.replace(',','.'));
    else n=Number(s);
    if(!Number.isFinite(n))return v;
    return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }
  function findEmployeeTable(d){
    const byId=d.getElementById('colaboradoresTabelaUnica');
    if(byId?.querySelector('table'))return byId.querySelector('table');
    return Array.from(d.querySelectorAll('table')).find(t=>{
      const h=Array.from(t.querySelectorAll('thead th')).map(x=>norm(x.textContent));
      return h.includes('matricula')&&h.includes('nome completo')&&h.includes('salario')&&h.includes('status');
    })||null;
  }
  function formatTable(d){
    const table=findEmployeeTable(d);if(!table)return;
    const heads=Array.from(table.querySelectorAll('thead th')).map(x=>norm(x.textContent));
    const salaryIdx=heads.indexOf('salario'),statusIdx=heads.indexOf('status');
    Array.from(table.tBodies||[]).forEach(tb=>Array.from(tb.rows).forEach(tr=>{
      if(tr.querySelector('th'))return;
      const cells=tr.cells;
      if(salaryIdx>=0&&cells[salaryIdx]){
        const c=cells[salaryIdx],raw=c.textContent.trim();
        if(raw&&!c.querySelector('.rh-salario')){c.textContent='';const span=d.createElement('span');span.className='rh-salario';span.textContent=formatMoney(raw);c.appendChild(span);}
      }
      if(statusIdx>=0&&cells[statusIdx]){
        const c=cells[statusIdx],raw=c.textContent.trim(),v=norm(raw);
        if((v==='ativo'||v==='inativo')&&!c.querySelector('.rh-status')){c.textContent='';const span=d.createElement('span');span.className='rh-status '+v;span.textContent=v==='ativo'?'Ativo':'Inativo';c.appendChild(span);}
      }
    }));
  }
  function formatSalaryField(d){
    const labels=Array.from(d.querySelectorAll('label'));
    const label=labels.find(l=>norm(l.textContent).replace(/\s+/g,' ').startsWith('salario'));
    if(!label||label.getAttribute('data-rh-salario-field'))return;
    const input=label.querySelector('input');if(!input)return;
    label.setAttribute('data-rh-salario-field','1');
    const wrap=d.createElement('div');wrap.className='rh-salario-field-wrap';
    const prefix=d.createElement('span');prefix.className='rh-salario-prefix';prefix.textContent='R$';
    input.parentNode.insertBefore(wrap,input);wrap.appendChild(prefix);wrap.appendChild(input);
  }
  function boot(){const d=doc();if(!d||!d.body)return;addStyles(d);formatTable(d);formatSalaryField(d);}
  frame.addEventListener('load',()=>{setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(boot,700);
})();
