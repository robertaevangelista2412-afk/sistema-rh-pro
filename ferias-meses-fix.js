// RH PRO — Férias e Documentos de Férias por mês
// CORREÇÃO EXCLUSIVA: filtro visual por mês. NÃO altera, exclui ou recria os dados salvos.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const mesAtual=new Date().getMonth()+1;
  const KEY_F='RH_PRO_FERIAS_MES';
  const KEY_D='RH_PRO_DOC_FERIAS_MES';

  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function storage(d){try{return d.defaultView?.localStorage||null}catch(e){return null}}
  function lerMes(d,key){
    try{const n=Number(storage(d)?.getItem(key));return Number.isInteger(n)&&n>=0&&n<=12?n:mesAtual}catch(e){return mesAtual}
  }
  function salvarMes(d,key,n){try{storage(d)?.setItem(key,String(n))}catch(e){}}

  // Retorna o mês da primeira data válida encontrada no texto.
  function mesDaData(valor){
    const s=norm(valor).trim(); if(!s)return 0;
    let m=s.match(/\b\d{1,2}[\/.\-](\d{1,2})[\/.\-]\d{2,4}\b/);
    if(m){const n=Number(m[1]);if(n>=1&&n<=12)return n;}
    m=s.match(/\b\d{4}[\/.\-](\d{1,2})[\/.\-]\d{1,2}\b/);
    if(m){const n=Number(m[1]);if(n>=1&&n<=12)return n;}
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)(?:\s+de\s+\d{2,4})?\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1;}
    return 0;
  }

  function localizarTabela(d,tipo){
    const id=tipo==='ferias'?'feriasTabelaUnica':'ferDocTabelaUnica';
    const direto=d.getElementById(id);
    if(direto){const t=direto.querySelector('table');if(t)return t;}
    return Array.from(d.querySelectorAll('table')).find(t=>{
      const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');
      if(tipo==='ferias')return h.includes('matricula')&&h.includes('colaborador')&&h.includes('data inicio');
      return h.includes('colaborador')&&h.includes('tipo')&&h.includes('arquivo')&&h.includes('data');
    })||null;
  }

  function mesDaLinha(tr,tipo){
    const cells=Array.from(tr.cells||[]); if(!cells.length)return 0;
    const t=tr.closest('table');
    const hs=Array.from(t?.querySelectorAll('thead th')||[]).map(h=>norm(h.textContent));
    let idx=-1;
    if(tipo==='ferias')idx=hs.findIndex(x=>x.includes('data inicio'));
    else idx=hs.findIndex(x=>x==='data'||x.includes('data'));
    if(idx>=0){const m=mesDaData(cells[idx]?.textContent||'');if(m)return m;}
    for(const c of cells){const m=mesDaData(c.textContent||'');if(m)return m;}
    return 0;
  }

  function pintar(box,n){
    box.querySelectorAll('button[data-rh-mes]').forEach(b=>{
      const ativo=Number(b.dataset.rhMes)===n;
      b.classList.toggle('active',ativo);
      b.style.background=ativo?'#123b67':'#e9eef4';
      b.style.color=ativo?'#fff':'#123b67';
    });
  }

  function aplicarLinha(tr,mostrar){
    tr.hidden=!mostrar;
    tr.classList.toggle('rh-mes-oculta',!mostrar);
    // O !important evita que o CSS da tabela ou uma nova renderização reexiba a linha.
    tr.style.setProperty('display',mostrar?'':'none','important');
  }

  function filtrar(d,tipo,mes){
    const t=localizarTabela(d,tipo); if(!t)return;
    const rows=Array.from(t.tBodies?.[0]?.rows||[]);
    rows.forEach(tr=>{
      if(tr.querySelector('th'))return;
      let m=mesDaLinha(tr,tipo);
      // Fallback direto para datas dd/mm/aaaa. Isso garante 03/08/2026 = Agosto.
      if(!m){
        const texto=norm(tr.textContent||'');
        const achado=texto.match(/\b\d{1,2}\/(\d{1,2})\/\d{2,4}\b/);
        if(achado)m=Number(achado[1]);
      }
      aplicarLinha(tr,mes===0||m===mes);
    });
  }

  function selecionar(tipo,n){
    const d=frame.contentDocument; if(!d)return;
    const key=tipo==='ferias'?KEY_F:KEY_D;
    salvarMes(d,key,n);
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const box=d.getElementById(id); if(box){box.dataset.rhMesSelecionado=String(n);pintar(box,n);}
    // Executa várias vezes porque o sistema original pode redesenhar a tabela após a troca de tela.
    filtrar(d,tipo,n);
    [80,250,600,1200].forEach(ms=>setTimeout(()=>filtrar(d,tipo,n),ms));
  }

  function criarAbas(d,tipo){
    const tabela=localizarTabela(d,tipo); if(!tabela)return;
    const host=tabela.closest('.panel')||tabela.parentElement; if(!host)return;
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const key=tipo==='ferias'?KEY_F:KEY_D;
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div'); box.id=id; box.setAttribute('data-rh-ferias-meses','1');
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:9999;';
      meses.forEach((nome,i)=>{
        const b=d.createElement('button'); b.type='button'; b.textContent=nome; b.dataset.rhMes=String(i);
        b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;';
        b.addEventListener('click',function(ev){ev.preventDefault();ev.stopImmediatePropagation();selecionar(tipo,i);return false},true);
        box.appendChild(b);
      });
      host.insertBefore(box,host.firstChild);
    }
    const n=lerMes(d,key);
    box.dataset.rhMesSelecionado=String(n);
    pintar(box,n);
    filtrar(d,tipo,n);
  }

  let ultimoDoc=null,observer=null;
  function boot(){
    let d;try{d=frame.contentDocument}catch(e){return}
    if(!d||!d.body)return;
    criarAbas(d,'ferias');criarAbas(d,'docs');
    if(ultimoDoc!==d){
      ultimoDoc=d;
      if(observer)try{observer.disconnect()}catch(e){}
      const root=d.getElementById('main')||d.body;
      observer=new MutationObserver(function(){
        clearTimeout(observer._timer);
        observer._timer=setTimeout(function(){
          const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');
          const mf=bf?Number(bf.dataset.rhMesSelecionado):lerMes(d,KEY_F);
          const md=bd?Number(bd.dataset.rhMesSelecionado):lerMes(d,KEY_D);
          criarAbas(d,'ferias');criarAbas(d,'docs');
          filtrar(d,'ferias',mf);filtrar(d,'docs',md);
        },40);
      });
      observer.observe(root,{childList:true,subtree:true});
    }
  }

  frame.addEventListener('load',function(){setTimeout(boot,100);setTimeout(boot,500);setTimeout(boot,1200);});
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));
  setInterval(function(){try{const d=frame.contentDocument;if(!d)return;const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');const mf=bf&&bf.dataset.rhMesSelecionado!==undefined?Number(bf.dataset.rhMesSelecionado):lerMes(d,KEY_F);const md=bd&&bd.dataset.rhMesSelecionado!==undefined?Number(bd.dataset.rhMesSelecionado):lerMes(d,KEY_D);if(bf)pintar(bf,mf);if(bd)pintar(bd,md);filtrar(d,'ferias',mf);filtrar(d,'docs',md)}catch(e){}},500);
})();
