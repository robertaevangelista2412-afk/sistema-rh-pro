// RH PRO — Colaboradores
// ALTERAÇÃO EXCLUSIVA: exibição de salário com R$ e status Ativo/Inativo por cor.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  function doc(){try{return frame.contentDocument;}catch(e){return null;}}
  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}

  function addStyles(d){
    if(d.getElementById('rhColaboradoresFixStyles'))return;
    const s=d.createElement('style');s.id='rhColaboradoresFixStyles';
    s.textContent=`
      #colaboradoresTabelaUnica .rh-salario{font-weight:700;white-space:nowrap}
      #colaboradoresTabelaUnica .rh-status{display:inline-flex;align-items:center;justify-content:center;min-width:78px;padding:6px 11px;border-radius:999px;font-weight:700;font-size:12px;line-height:1;white-space:nowrap}
      #colaboradoresTabelaUnica .rh-status.ativo{background:#123b67!important;color:#fff!important}
      #colaboradoresTabelaUnica .rh-status.inativo{background:#c62828!important;color:#fff!important}
      .rh-salario-field{position:relative!important}
      .rh-salario-prefix{display:inline-block;margin-right:6px;font-weight:700;color:#374151}
    `;
    d.head.appendChild(s);
  }

  function formatMoney(v){
    let s=String(v??'').trim(); if(!s)return '';
    s=s.replace(/R\$\s*/gi,'').replace(/\s/g,'');
    let n;
    if(s.includes(',') && s.includes('.')) n=Number(s.replace(/\./g,'').replace(',','.'));
    else if(s.includes(',')) n=Number(s.replace(',','.'));
    else n=Number(s);
    if(!Number.isFinite(n))return v;
    return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }

  function formatTable(d){
    const box=d.getElementById('colaboradoresTabelaUnica');
    if(!box)return;
    const table=box.querySelector('table');if(!table)return;
    const heads=Array.from(table.querySelectorAll('thead th')).map(x=>norm(x.textContent));
    const salaryIdx=heads.findIndex(x=>x==='salario'||x==='salário');
    const statusIdx=heads.findIndex(x=>x==='status');
    if(salaryIdx<0&&statusIdx<0)return;
    Array.from(table.tBodies||[]).forEach(tb=>Array.from(tb.rows).forEach(tr=>{
      if(tr.querySelector('th'))return;
      const cells=tr.cells;
      if(salaryIdx>=0&&cells[salaryIdx]){
        const c=cells[salaryIdx];
        if(!c.querySelector('.rh-salario')){
          const raw=c.textContent.trim();
          if(raw){c.textContent='';const span=d.createElement('span');span.className='rh-salario';span.textContent=formatMoney(raw);c.appendChild(span);}
        }
      }
      if(statusIdx>=0&&cells[statusIdx]){
        const c=cells[statusIdx],raw=c.textContent.trim(),v=norm(raw);
        if(v==='ativo'||v==='inativo'){
          const cls=v==='ativo'?'ativo':'inativo';
          if(!c.querySelector('.rh-status')){
            c.textContent='';const span=d.createElement('span');span.className='rh-status '+cls;span.textContent=v==='ativo'?'Ativo':'Inativo';c.appendChild(span);
          }
        }
      }
    }));
  }

  function formatSalaryField(d){
    const labels=Array.from(d.querySelectorAll('label'));
    const label=labels.find(l=>norm(l.firstChild?.textContent||l.textContent).startsWith('salario'));
    if(!label||label.getAttribute('data-rh-salario-field'))return;
    const input=label.querySelector('input');if(!input)return;
    label.setAttribute('data-rh-salario-field','1');
    input.classList.add('rh-salario-field');
    const prefix=d.createElement('span');prefix.className='rh-salario-prefix';prefix.textContent='R$';
    input.parentNode.insertBefore(prefix,input);
  }

  function boot(){
    const d=doc();if(!d||!d.body)return;
    addStyles(d);
    formatTable(d);
    formatSalaryField(d);
  }

  frame.addEventListener('load',()=>{setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(boot,700);
})();
