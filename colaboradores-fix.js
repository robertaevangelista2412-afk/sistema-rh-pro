// RH PRO — Colaboradores
// ALTERAÇÃO EXCLUSIVA: salário com máscara monetária e Status com seletor Ativo/Inativo.
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
      .rh-salario-field-wrap{display:flex!important;align-items:center!important;gap:6px!important;width:100%!important}
      .rh-salario-field-wrap .rh-salario-prefix{font-weight:700;color:#374151;white-space:nowrap}
      .rh-salario-field-wrap input{flex:1 1 auto!important;min-width:0!important}
      .rh-status-field{appearance:auto!important;-webkit-appearance:auto!important;cursor:pointer!important;background:#fff!important}
      .rh-status-field.ativo{border-color:#123b67!important;color:#123b67!important;font-weight:700!important}
      .rh-status-field.inativo{border-color:#c62828!important;color:#c62828!important;font-weight:700!important}
    `;
    d.head.appendChild(s);
  }
  function moneyNumber(v){
    let s=String(v??'').replace(/R\$/gi,'').replace(/\s/g,'');
    if(!s)return '';
    if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
    else if(s.includes(','))s=s.replace(',','.');
    const n=Number(s);
    return Number.isFinite(n)?n:null;
  }
  function formatMoneyInput(v){
    const n=moneyNumber(v);
    if(n===null)return '';
    return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function formatMoney(v){
    const n=moneyNumber(v);
    if(n===null)return v;
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
  function controlAfterLabel(d,label){
    const id=label.getAttribute('for');
    if(id){const el=d.getElementById(id);if(el)return el;}
    const inside=label.querySelector('input,select,textarea');
    if(inside)return inside;
    let el=label.nextElementSibling;
    while(el){
      if(['INPUT','SELECT','TEXTAREA'].includes(el.tagName))return el;
      const c=el.querySelector?.('input,select,textarea');
      if(c)return c;
      el=el.nextElementSibling;
    }
    const parent=label.parentElement;
    if(parent){
      const controls=Array.from(parent.querySelectorAll('input,select,textarea'));
      if(controls.length===1)return controls[0];
      const li=Array.from(parent.children).indexOf(label);
      if(li>=0){
        for(const e of controls){
          const ei=Array.from(parent.children).findIndex(ch=>ch.contains(e));
          if(ei>li)return e;
        }
      }
    }
    const all=Array.from(d.querySelectorAll('input,select,textarea'));
    const idx=all.findIndex(e=>e===label);
    return idx>=0?all[idx+1]||null:null;
  }
  function findSalaryControl(d){
    const labels=Array.from(d.querySelectorAll('label'));
    const label=labels.find(l=>norm(l.textContent).replace(/\s+/g,' ').startsWith('salario'));
    if(label){const c=controlAfterLabel(d,label);if(c&&c.tagName==='INPUT')return c;}
    return Array.from(d.querySelectorAll('input')).find(i=>norm(i.name).includes('salario')||norm(i.id).includes('salario')||norm(i.placeholder).includes('salario'))||null;
  }
  function formatSalaryField(d){
    const input=findSalaryControl(d);if(!input)return;
    if(input.getAttribute('data-rh-salario-ready')==='1')return;
    input.setAttribute('data-rh-salario-ready','1');
    let wrap=input.parentElement?.classList.contains('rh-salario-field-wrap')?input.parentElement:null;
    if(!wrap){
      wrap=d.createElement('div');wrap.className='rh-salario-field-wrap';
      const prefix=d.createElement('span');prefix.className='rh-salario-prefix';prefix.textContent='R$';
      input.parentNode.insertBefore(wrap,input);wrap.appendChild(prefix);wrap.appendChild(input);
    }
    const apply=()=>{const raw=String(input.value||'');if(raw.trim())input.value=formatMoneyInput(raw);};
    input.addEventListener('input',()=>{
      const digits=String(input.value||'').replace(/\D/g,'');
      if(!digits){input.value='';return;}
      input.value=(Number(digits)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    });
    input.addEventListener('blur',apply);
    input.addEventListener('focus',()=>{const n=moneyNumber(input.value);if(n!==null)input.value=n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});try{input.select();}catch(e){}});
    if(input.value.trim())input.value=formatMoneyInput(input.value);
  }
  function formatStatusField(d){
    const labels=Array.from(d.querySelectorAll('label'));
    const label=labels.find(l=>norm(l.textContent).replace(/\s+/g,' ').startsWith('status'));
    if(!label)return;
    let control=controlAfterLabel(d,label);
    if(!control){
      const select=d.createElement('select');
      select.innerHTML='<option value="">Selecione o status</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>';
      label.insertAdjacentElement('afterend',select);
      control=select;
    }
    if(control.tagName!=='SELECT'){
      const select=d.createElement('select');
      if(control.id)select.id=control.id;
      if(control.name)select.name=control.name;
      if(control.className)select.className=control.className;
      const current=norm(control.value||control.textContent||'');
      select.innerHTML='<option value="">Selecione o status</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>';
      select.value=current==='inativo'?'Inativo':current==='ativo'?'Ativo':'';
      control.replaceWith(select);
      control=select;
    }else if(!control.querySelector('option[value="Ativo"]')){
      const current=norm(control.value||'');
      control.innerHTML='<option value="">Selecione o status</option><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>';
      control.value=current==='inativo'?'Inativo':current==='ativo'?'Ativo':'';
    }
    control.classList.add('rh-status-field');
    const paint=()=>{
      const v=norm(control.value||'');
      control.classList.toggle('ativo',v==='ativo');
      control.classList.toggle('inativo',v==='inativo');
    };
    paint();
    if(control.getAttribute('data-rh-status-ready')!=='1'){
      control.setAttribute('data-rh-status-ready','1');
      control.addEventListener('change',paint);
    }
  }
  function boot(){
    const d=doc();
    if(!d||!d.body)return;
    addStyles(d);
    formatTable(d);
    formatSalaryField(d);
    formatStatusField(d);
  }
  frame.addEventListener('load',()=>{setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);setTimeout(boot,2500);});
  [100,500,1200,2500,5000,8000].forEach(t=>setTimeout(boot,t));
  setInterval(boot,700);
})();
