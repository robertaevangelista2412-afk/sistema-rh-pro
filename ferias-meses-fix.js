// RH PRO — Férias e Documentos de Férias por mês
// Alteração exclusiva: abas Janeiro a Dezembro (e Todos) nas duas listas.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function mes(v){
    const s=norm(v).trim();
    let m=s.match(/\b\d{1,2}[\/-](\d{1,2})[\/-]\d{2,4}\b/);
    if(m)return Number(m[1]);
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)\s+de\s+\d{4}\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1;}
    for(let i=0;i<nomes.length;i++)if(s.includes(nomes[i]))return i+1;
    return 0;
  }
  function getTable(containerId,docId){
    const c=docId?document:null;
    return null;
  }
  function dataCol(t){
    const hs=Array.from(t.querySelectorAll('thead th'));
    let i=hs.findIndex(h=>norm(h.textContent).includes('data inicio'));
    if(i<0)i=hs.findIndex(h=>norm(h.textContent)==='data');
    return i;
  }
  function aplicarFiltro(t,mesSelecionado,tipo){
    if(!t)return;
    const idx=dataCol(t);
    t.querySelectorAll('tbody tr').forEach(tr=>{
      const cells=Array.from(tr.querySelectorAll('td'));
      if(!cells.length)return;
      let valor=idx>=0?(cells[idx]?.textContent||''):'';
      if(!valor)valor=cells.map(c=>c.textContent||'').find(v=>/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(v))||'';
      tr.style.display=!mesSelecionado||mes(valor)===mesSelecionado?'':'none';
    });
  }
  function tabelaDentro(d,containerId){
    const c=d.getElementById(containerId);
    return c?.querySelector('table')||null;
  }
  function criarAbas(d,hostId,boxId,tipo){
    const host=d.getElementById(hostId);
    if(!host)return;
    const tabela=host.querySelector('table');
    if(!tabela)return;
    let box=d.getElementById(boxId);
    if(!box){
      box=d.createElement('div');
      box.id=boxId;
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:20;';
      host.insertBefore(box,host.firstChild);
    }
    const chave=tipo==='ferias'?'__feriasMes':'__ferDocMes';
    const selecionado=Number(d.defaultView[chave]||0);
    box.innerHTML='';
    meses.forEach((nome,i)=>{
      const b=d.createElement('button');
      b.type='button';
      b.textContent=nome;
      b.dataset.rhMes=String(i);
      b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;'+(i===selecionado?'background:#123b67;color:#fff;':'background:#e9eef4;color:#123b67;');
      b.onclick=function(){
        d.defaultView[chave]=i;
        const t=host.querySelector('table');
        aplicarFiltro(t,i,tipo);
        box.querySelectorAll('button').forEach((x,n)=>{x.style.background=n===i?'#123b67':'#e9eef4';x.style.color=n===i?'#fff':'#123b67';});
      };
      box.appendChild(b);
    });
    aplicarFiltro(tabela,selecionado,tipo);
  }
  let docAtual=null,observer=null;
  function boot(){
    let d;
    try{d=frame.contentDocument;}catch(e){return;}
    if(!d||!d.body)return;
    criarAbas(d,'vacTable','feriasMesesFix','ferias');
    criarAbas(d,'feriasDocsTabela','ferDocMesesFix','docs');
    const main=d.getElementById('main')||d.body;
    if(docAtual!==d){
      docAtual=d;
      if(observer)try{observer.disconnect();}catch(e){}
      observer=new MutationObserver(function(){clearTimeout(observer._t);observer._t=setTimeout(boot,40);});
      observer.observe(main,{childList:true,subtree:true});
    }
  }
  frame.addEventListener('load',function(){setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(boot,1500);
})();