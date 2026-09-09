// RH PRO — Férias e Documentos de Férias por mês
// ALTERAÇÃO EXCLUSIVA: filtro funcional por mês nas duas listas.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=v=>String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const mesAtual=new Date().getMonth()+1;
  function mesDaData(valor){
    const s=norm(valor).trim(); if(!s)return 0;
    let m=s.match(/(?:^|\D)\d{1,2}[\/.\-](\d{1,2})[\/.\-]\d{2,4}(?:\D|$)/);
    if(m){const n=Number(m[1]);if(n>=1&&n<=12)return n;}
    m=s.match(/(?:^|\D)\d{4}[\/.\-](\d{1,2})[\/.\-]\d{1,2}(?:\D|$)/);
    if(m){const n=Number(m[1]);if(n>=1&&n<=12)return n;}
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)(?:\s+de\s+\d{2,4})?\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1;}
    for(let i=0;i<nomes.length;i++)if(s.includes(nomes[i]))return i+1;
    return 0;
  }
  function localizarTabela(d,tipo){
    const id=tipo==='ferias'?'feriasTabelaUnica':'ferDocTabelaUnica';
    const direto=d.getElementById(id);
    if(direto?.querySelector('table'))return direto.querySelector('table');
    return Array.from(d.querySelectorAll('table')).find(t=>{
      const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');
      if(tipo==='ferias')return h.includes('matricula')&&h.includes('colaborador')&&(h.includes('data inicio')||h.includes('periodo de ferias'));
      return h.includes('colaborador')&&h.includes('tipo')&&h.includes('arquivo')&&h.includes('data');
    })||null;
  }
  function colunaData(t,tipo){
    const hs=Array.from(t.querySelectorAll('thead th')).map(h=>norm(h.textContent));
    if(tipo==='ferias'){const i=hs.findIndex(x=>x.includes('data inicio'));if(i>=0)return i;}
    return hs.findIndex(x=>x==='data'||x.includes('data'));
  }
  function mesDaLinha(tr,tipo){
    const cells=Array.from(tr.querySelectorAll('td')); if(!cells.length)return 0;
    const t=tr.closest('table'),idx=colunaData(t,tipo);
    if(idx>=0){const m=mesDaData(cells[idx]?.textContent||'');if(m)return m;}
    for(const c of cells){const m=mesDaData(c.textContent||'');if(m)return m;}
    return 0;
  }
  function filtrar(t,tipo,mes){
    if(!t)return; const corpo=t.tBodies?.[0]; if(!corpo)return;
    Array.from(corpo.rows).forEach(tr=>{if(tr.querySelector('th'))return;const m=mesDaLinha(tr,tipo);tr.style.display=(mes===0||m===mes)?'':'none';});
  }
  function selecionado(w,chave){const n=Number(w[chave]);return Number.isInteger(n)&&n>=0&&n<=12?n:mesAtual;}
  function pintar(box,n){box.querySelectorAll('button[data-rh-mes]').forEach(b=>{const ativo=Number(b.dataset.rhMes)===n;b.style.background=ativo?'#123b67':'#e9eef4';b.style.color=ativo?'#fff':'#123b67';});}
  function criarAbas(d,tipo){
    const tabela=localizarTabela(d,tipo); if(!tabela)return;
    const host=tabela.closest('.panel')||tabela.parentElement; if(!host)return;
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix',chave=tipo==='ferias'?'__feriasMes':'__ferDocMes';
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div');box.id=id;box.setAttribute('data-rh-ferias-meses','1');
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:50;';
      meses.forEach((nome,i)=>{const b=d.createElement('button');b.type='button';b.textContent=nome;b.dataset.rhMes=String(i);b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;';b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();const n=Number(b.dataset.rhMes);d.defaultView[chave]=n;box.dataset.rhMesSelecionado=String(n);pintar(box,n);filtrar(localizarTabela(d,tipo),tipo,n);});box.appendChild(b);});
      host.insertBefore(box,host.firstChild);
    }
    const n=selecionado(d.defaultView,chave);box.dataset.rhMesSelecionado=String(n);pintar(box,n);filtrar(tabela,tipo,n);
  }
  let docAtual=null,obs=null;
  function boot(){
    let d;try{d=frame.contentDocument;}catch(e){return;}if(!d||!d.body)return;
    criarAbas(d,'ferias');criarAbas(d,'docs');
    const root=d.getElementById('main')||d.body;
    if(docAtual!==d){docAtual=d;if(obs)try{obs.disconnect();}catch(e){}obs=new MutationObserver(muts=>{const relevante=muts.some(m=>!m.target?.closest?.('[data-rh-ferias-meses]'));if(relevante){clearTimeout(obs._t);obs._t=setTimeout(boot,80);}});obs.observe(root,{childList:true,subtree:true});}
  }
  frame.addEventListener('load',()=>{setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(()=>{try{const d=frame.contentDocument,w=frame.contentWindow;if(!d)return;filtrar(localizarTabela(d,'ferias'),'ferias',selecionado(w,'__feriasMes'));filtrar(localizarTabela(d,'docs'),'docs',selecionado(w,'__ferDocMes'));}catch(e){}},500);
})();
