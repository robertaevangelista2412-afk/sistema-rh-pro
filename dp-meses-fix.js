// RH PRO — Holerites assinados organizados por mês
(function(){
 const frame=document.getElementById('app'); if(!frame)return;
 const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 function mes(v){
  const t=norm(v), names=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const i=names.findIndex(x=>t.includes(x)); if(i>=0)return i+1;
  const n=t.match(/\b(0?[1-9]|1[0-2])\b/); return n?Number(n[1]):0;
 }
 function boot(){
  let w,d;try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
  if(!w||!d)return;
  // Remove a aba separada de folhas de ponto assinadas.
  const ponto=d.getElementById('dpPontoTab'); if(ponto)ponto.remove();
  const titulo=d.getElementById('dpTitulo'), tabela=d.getElementById('dpTable');
  if(!titulo||!tabela)return;
  const holeriteTab=d.getElementById('dpHoleriteTab');
  if(holeriteTab){holeriteTab.textContent='📄 Holerites assinados';holeriteTab.classList.add('active');}
  if(titulo.textContent.trim()!=='Holerites assinados'){
    titulo.textContent='Holerites assinados';
    w.__dpTipo='Holerites assinados';
  }
  let box=d.getElementById('dpMeses');
  if(!box){box=d.createElement('div');box.id='dpMeses';(tabela.closest('.panel')||tabela.parentElement).insertBefore(box,tabela);}
  const selected=Number(w.__dpMes)||0;
  box.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 14px">'+meses.map((m,i)=>'<button type="button" data-dp-mes="'+i+'" style="border:0;border-radius:8px;padding:10px 14px;font-weight:700;cursor:pointer;'+(i===selected?'background:#123b67;color:#fff;':'background:#e9eef4;color:#123b67;')+'">'+m+'</button>').join('')+'</div>';
  box.querySelectorAll('[data-dp-mes]').forEach(b=>b.onclick=function(){
    w.__dpMes=Number(this.dataset.dpMes);
    if(typeof w.renderDPArquivos==='function')w.renderDPArquivos();
    else filterTable(w.__dpMes);
    setTimeout(boot,80);
  });
  function filterTable(m){
    const rows=[...tabela.querySelectorAll('tbody tr')];
    rows.forEach(tr=>{
      const cells=tr.querySelectorAll('td');
      if(cells.length<2)return;
      const ok=!m||mes(cells[1].textContent)===m;
      tr.style.display=ok?'':'none';
    });
  }
  filterTable(selected);
 }
 frame.addEventListener('load',()=>{setTimeout(boot,500);setTimeout(boot,1800);});
 setInterval(boot,1000);
})();