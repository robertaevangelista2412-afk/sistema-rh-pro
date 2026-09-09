// RH PRO — Férias e Documentos de Férias por mês
// ALTERAÇÃO EXCLUSIVA: filtro funcional por mês nas duas listas.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function mesDaData(valor){
    const s=norm(valor);
    let m=s.match(/\b\d{1,2}[\/.\-](\d{1,2})[\/.\-]\d{2,4}\b/);
    if(m)return Number(m[1]);
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)\s+de\s+\d{4}\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1;}
    return 0;
  }
  function localizarTabela(d,tipo){
    const id=tipo==='ferias'?'feriasTabelaUnica':'ferDocTabelaUnica';
    const direto=d.getElementById(id);
    if(direto?.querySelector('table'))return direto.querySelector('table');
    return Array.from(d.querySelectorAll('table')).find(t=>{
      const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');
      if(tipo==='ferias')return h.includes('matricula')&&h.includes('colaborador')&&h.includes('data inicio');
      return h.includes('colaborador')&&h.includes('tipo')&&h.includes('arquivo')&&h.includes('data');
    })||null;
  }
  function colunaData(t,tipo){
    const hs=Array.from(t.querySelectorAll('thead th')).map(h=>norm(h.textContent));
    if(tipo==='ferias'){
      const i=hs.findIndex(x=>x==='data inicio');
      if(i>=0)return i;
    }
    const i=hs.findIndex(x=>x==='data');
    return i;
  }
  function filtrar(t,tipo,mes){
    if(!t)return;
    const idx=colunaData(t,tipo);
    t.querySelectorAll('tbody tr').forEach(tr=>{
      const cells=Array.from(tr.querySelectorAll('td'));
      if(!cells.length)return;
      let valor=idx>=0?(cells[idx]?.textContent||''):'';
      let m=mesDaData(valor);
      if(!m){
        const datas=cells.map(c=>c.textContent||'').filter(v=>/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/.test(v));
        if(datas.length)m=mesDaData(tipo==='ferias'?(datas[datas.length-2]||datas[0]):datas[0]);
      }
      tr.style.display=(mes===0||m===mes)?'':'none';
    });
  }
  function criarAbas(d,tipo){
    const tabela=localizarTabela(d,tipo);
    if(!tabela)return;
    const host=tabela.closest('.panel')||tabela.parentElement;
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const chave=tipo==='ferias'?'__feriasMes':'__ferDocMes';
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div');box.id=id;
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:50;';
      host.insertBefore(box,tabela.parentElement===host?tabela:host.firstChild);
    }
    let selecionado=Number(d.defaultView[chave]||0);
    if(selecionado<0||selecionado>12)selecionado=0;
    box.dataset.rhMesSelecionado=String(selecionado);
    box.innerHTML='';
    meses.forEach((nome,i)=>{
      const b=d.createElement('button');
      b.type='button';b.textContent=nome;b.dataset.rhMes=String(i);
      b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;'+(i===selecionado?'background:#123b67;color:#fff;':'background:#e9eef4;color:#123b67;');
      b.onclick=function(ev){
        ev.preventDefault();ev.stopPropagation();
        const n=Number(this.dataset.rhMes);
        d.defaultView[chave]=n;
        box.dataset.rhMesSelecionado=String(n);
        box.querySelectorAll('button').forEach((x,k)=>{x.style.background=k===n?'#123b67':'#e9eef4';x.style.color=k===n?'#fff':'#123b67';});
        filtrar(localizarTabela(d,tipo),tipo,n);
      };
      box.appendChild(b);
    });
    filtrar(tabela,tipo,selecionado);
  }
  let docAtual=null,obs=null;
  function boot(){
    let d;try{d=frame.contentDocument;}catch(e){return;}
    if(!d||!d.body)return;
    criarAbas(d,'ferias');criarAbas(d,'docs');
    const root=d.getElementById('main')||d.body;
    if(docAtual!==d){
      docAtual=d;
      if(obs)try{obs.disconnect();}catch(e){}
      obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(boot,30);});
      obs.observe(root,{childList:true,subtree:true});
    }
  }
  frame.addEventListener('load',function(){setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(function(){
    boot();
    try{
      const d=frame.contentDocument,w=frame.contentWindow;
      if(!d)return;
      filtrar(localizarTabela(d,'ferias'),'ferias',Number(w.__feriasMes||0));
      filtrar(localizarTabela(d,'docs'),'docs',Number(w.__ferDocMes||0));
    }catch(e){}
  },300);
})();
