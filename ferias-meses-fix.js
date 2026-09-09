// RH PRO — organização de Férias e Documentos de Férias por mês
// Alteração exclusiva desta funcionalidade. Não altera o restante do sistema.
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
  function tabelaFerias(d){
    const host=d.getElementById('feriasTabelaUnica');
    if(host){const t=host.querySelector('table');if(t)return {host,table:t};}
    const t=Array.from(d.querySelectorAll('table')).find(t=>{
      const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');
      return h.includes('matricula')&&h.includes('colaborador')&&(h.includes('data inicio')||h.includes('periodo de ferias'));
    });
    return t?{host:t.closest('.panel')||t.parentElement,table:t}:null;
  }
  function tabelaDocs(d){
    const host=d.getElementById('ferDocTabelaUnica');
    if(host){const t=host.querySelector('table');if(t)return {host,table:t};}
    const t=Array.from(d.querySelectorAll('table')).find(t=>{
      const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');
      return h.includes('documento') && (h.includes('ferias') || h.includes('férias'));
    });
    return t?{host:t.closest('.panel')||t.parentElement,table:t}:null;
  }
  function colunaData(t){
    const hs=Array.from(t.querySelectorAll('thead th'));
    let i=hs.findIndex(h=>norm(h.textContent).includes('data inicio'));
    if(i<0)i=hs.findIndex(h=>norm(h.textContent)==='data');
    return i;
  }
  function filtrar(t,selecionado){
    if(!t)return;
    const idx=colunaData(t);
    t.querySelectorAll('tbody tr').forEach(tr=>{
      const cells=Array.from(tr.querySelectorAll('td'));
      if(!cells.length)return;
      let valor=idx>=0?(cells[idx]?.textContent||''):'';
      if(!/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(valor))
        valor=cells.map(c=>c.textContent||'').find(v=>/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(v))||'';
      tr.style.display=!selecionado||mes(valor)===selecionado?'':'none';
    });
  }
  function criarAbas(d,info,id,chave){
    if(!info||!info.host||!info.table)return;
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div');
      box.id=id;
      box.setAttribute('data-rh-ferias-meses','1');
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:50;';
      info.host.insertBefore(box,info.host.firstChild);
    }
    const selecionado=Number(d.defaultView[chave]||0);
    box.innerHTML='';
    meses.forEach((nome,i)=>{
      const b=d.createElement('button');
      b.type='button';b.textContent=nome;b.dataset.rhMes=String(i);
      b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;'+(i===selecionado?'background:#123b67;color:#fff;':'background:#e9eef4;color:#123b67;');
      b.onclick=function(){
        d.defaultView[chave]=i;
        const atual=chave==='__feriasMes'?tabelaFerias(d):tabelaDocs(d);
        if(atual)filtrar(atual.table,i);
        box.querySelectorAll('button').forEach((x,n)=>{x.style.background=n===i?'#123b67':'#e9eef4';x.style.color=n===i?'#fff':'#123b67';});
      };
      box.appendChild(b);
    });
    filtrar(info.table,selecionado);
  }
  let observado=null,obs=null;
  function boot(){
    let d;try{d=frame.contentDocument;}catch(e){return;}
    if(!d||!d.body)return;
    criarAbas(d,tabelaFerias(d),'feriasMesesFix','__feriasMes');
    criarAbas(d,tabelaDocs(d),'ferDocMesesFix','__ferDocMes');
    const root=d.getElementById('main')||d.body;
    if(root!==observado){
      observado=root;
      if(obs)try{obs.disconnect();}catch(e){}
      obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(boot,80);});
      obs.observe(root,{childList:true,subtree:true});
    }
  }
  frame.addEventListener('load',function(){setTimeout(boot,150);setTimeout(boot,700);setTimeout(boot,1500);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(boot,1500);
})();