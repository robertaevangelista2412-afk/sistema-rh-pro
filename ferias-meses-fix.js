// RH PRO — Férias e Documentos de Férias por mês
// Fix definitivo: observa a tela real do aplicativo e recria as abas sempre que a tabela é redesenhada.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  function mes(v){
    const s=norm(v).trim();
    let m=s.match(/\b\d{1,2}[\/-](\d{1,2})[\/-]\d{2,4}\b/);
    if(m)return Number(m[1]);
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)\s+de\s+\d{4}\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1;}
    for(let i=0;i<nomes.length;i++)if(s.includes(nomes[i]))return i+1;
    return 0;
  }
  function tables(d){return Array.from(d.querySelectorAll('table'));}
  function header(t){return norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');}
  function vacationTable(d){
    return tables(d).find(t=>{
      const h=header(t);
      return h.includes('matricula')&&h.includes('colaborador')&&(h.includes('data inicio')||h.includes('periodo de ferias'));
    })||d.querySelector('#feriasTabelaUnica table');
  }
  function documentTable(d){
    return tables(d).find(t=>{
      const h=header(t);
      return h.includes('documento')&&(!h.includes('documentos rh dp')||h.includes('ferias'));
    })||d.querySelector('#ferDocTabelaUnica table');
  }
  function colData(t){
    const hs=t.querySelectorAll('thead th');
    for(let i=0;i<hs.length;i++){
      const h=norm(hs[i].textContent);
      if(h.includes('data inicio'))return i;
      if(h==='data')return i;
    }
    return -1;
  }
  function createTabs(d,id,table,type){
    if(!table)return;
    const host=table.closest('.panel')||table.parentElement;
    if(!host)return;
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div');
      box.id=id;
      box.setAttribute('data-rh-ferias-tabs',type);
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:5;';
      host.insertBefore(box,table);
    }
    const selected=Number(type==='ferias'?(d.defaultView.__feriasMes||0):(d.defaultView.__ferDocMes||0));
    box.innerHTML='';
    meses.forEach((nome,i)=>{
      const b=d.createElement('button');
      b.type='button'; b.textContent=nome; b.dataset.rhMes=String(i);
      b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;'+(i===selected?'background:#123b67;color:#fff;':'background:#e9eef4;color:#123b67;');
      b.onclick=function(){
        if(type==='ferias')d.defaultView.__feriasMes=i; else d.defaultView.__ferDocMes=i;
        filter(table,type,i);
        box.querySelectorAll('button').forEach((x,n)=>{x.style.background=n===i?'#123b67':'#e9eef4';x.style.color=n===i?'#fff':'#123b67';});
      };
      box.appendChild(b);
    });
    filter(table,type,selected);
  }
  function filter(t,type,m){
    const idx=colData(t);
    t.querySelectorAll('tbody tr').forEach(tr=>{
      const cells=tr.querySelectorAll('td');
      if(!cells.length)return;
      let value=idx>=0?cells[idx]?.textContent:'';
      if(!value && type==='ferias'){
        // fallback: procura qualquer célula que contenha uma data brasileira.
        value=Array.from(cells).map(c=>c.textContent).find(v=>/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(v))||'';
      }
      if(!value && type==='docs')value=Array.from(cells).map(c=>c.textContent).find(v=>/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(v))||'';
      tr.style.display=!m||mes(value)===m?'':'none';
    });
  }
  let observerStarted=false;
  function boot(){
    let d,w;try{d=frame.contentDocument;w=frame.contentWindow;}catch(e){return}
    if(!d||!w)return;
    const ft=vacationTable(d);
    const dt=documentTable(d);
    if(ft)createTabs(d,'feriasMesesFix',ft,'ferias');
    if(dt)createTabs(d,'ferDocMesesFix',dt,'docs');
    if(!observerStarted){
      observerStarted=true;
      const root=d.getElementById('main')||d.body;
      if(root)new MutationObserver(()=>setTimeout(boot,30)).observe(root,{childList:true,subtree:true});
    }
  }
  frame.addEventListener('load',()=>{setTimeout(boot,300);setTimeout(boot,900);setTimeout(boot,1800);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(boot,1500);
})();