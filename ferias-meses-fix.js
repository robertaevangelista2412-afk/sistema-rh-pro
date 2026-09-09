// RH PRO — Férias e Documentos de Férias por mês
// CORREÇÃO EXCLUSIVA: mostra por padrão somente o mês vigente e permite trocar o mês.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const mesAtual=new Date().getMonth()+1;
  const KEY_F='RH_PRO_FERIAS_MES',KEY_D='RH_PRO_DOC_FERIAS_MES';

  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
  function doc(d){try{return d.defaultView?.localStorage||null}catch(e){return null}}
  function ler(d,k){try{const n=Number(doc(d)?.getItem(k));return Number.isInteger(n)&&n>=0&&n<=12?n:mesAtual}catch(e){return mesAtual}}
  function mesData(v){
    const s=norm(v);
    let m=s.match(/\b\d{1,2}[\/.\-](\d{1,2})[\/.\-]\d{2,4}\b/);
    if(m)return +m[1];
    m=s.match(/\b\d{4}[\/.\-](\d{1,2})[\/.\-]\d{1,2}\b/);
    if(m)return +m[1];
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1}
    return 0;
  }
  function tabela(d,tipo){
    const id=tipo==='ferias'?'feriasTabelaUnica':'ferDocTabelaUnica';
    const box=d.getElementById(id);
    if(box){const t=box.querySelector('table');if(t)return t}
    return [...d.querySelectorAll('table')].find(t=>{
      const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');
      if(tipo==='ferias')return h.includes('colaborador')&&(h.includes('inicio')||h.includes('data inicio'))&&h.includes('fim');
      return h.includes('colaborador')&&h.includes('tipo')&&h.includes('data');
    })||null;
  }
  function mesLinha(tr,tipo){
    const cells=[...tr.cells||[]];
    if(!cells.length)return 0;
    const t=tr.closest('table');
    const hs=[...t?.querySelectorAll('thead th')||[]].map(x=>norm(x.textContent));
    let idx=tipo==='ferias'
      ?hs.findIndex(x=>x==='inicio'||x.includes('data inicio'))
      :hs.findIndex(x=>x==='data'||x.includes('data'));
    if(idx>=0){const m=mesData(cells[idx]?.textContent);if(m)return m}
    for(const c of cells){const m=mesData(c.textContent);if(m)return m}
    return 0;
  }
  function filtrar(d,tipo,mes){
    const t=tabela(d,tipo);if(!t)return;
    [...t.querySelectorAll('tbody tr')].forEach(tr=>{
      if(tr.querySelector('th'))return;
      const m=mesLinha(tr,tipo);
      const ok=mes===0||m===mes;
      tr.hidden=!ok;
      tr.classList.toggle('rh-mes-oculta',!ok);
      tr.style.setProperty('display',ok?'':'none','important');
    });
  }
  function pintar(box,n){
    box?.querySelectorAll('button[data-rh-mes]').forEach(b=>{
      const on=+b.dataset.rhMes===n;
      b.classList.toggle('active',on);
      b.style.background=on?'#123b67':'#e9eef4';
      b.style.color=on?'#fff':'#123b67';
    });
  }
  function selecionar(tipo,n){
    const d=frame.contentDocument;if(!d)return;
    const key=tipo==='ferias'?KEY_F:KEY_D;
    try{doc(d)?.setItem(key,String(n))}catch(e){}
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const box=d.getElementById(id);
    if(box){box.dataset.rhMesSelecionado=n;pintar(box,n)}
    filtrar(d,tipo,n);
    [100,300,700,1200].forEach(ms=>setTimeout(()=>filtrar(d,tipo,n),ms));
  }
  function criarAbas(d,tipo){
    const t=tabela(d,tipo);if(!t)return;
    const host=t.closest('.panel')||t.parentElement;if(!host)return;
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const key=tipo==='ferias'?KEY_F:KEY_D;
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div');
      box.id=id;
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;position:relative;z-index:9999';
      meses.forEach((nome,i)=>{
        const b=d.createElement('button');
        b.type='button';b.textContent=nome;b.dataset.rhMes=i;
        b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer';
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();selecionar(tipo,i)},true);
        box.appendChild(b);
      });
      host.insertBefore(box,host.firstChild);
    }
    const n=ler(d,key);
    box.dataset.rhMesSelecionado=n;
    pintar(box,n);
    filtrar(d,tipo,n);
  }
  let lastDoc=null,observer=null;
  function boot(){
    try{
      const d=frame.contentDocument;
      if(!d?.body)return;
      criarAbas(d,'ferias');
      criarAbas(d,'docs');
      if(lastDoc!==d){
        lastDoc=d;
        if(observer)try{observer.disconnect()}catch(e){}
        const root=d.getElementById('main')||d.body;
        observer=new MutationObserver(()=>{
          clearTimeout(observer._rhT);
          observer._rhT=setTimeout(()=>{
            criarAbas(d,'ferias');criarAbas(d,'docs');
            const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');
            filtrar(d,'ferias',bf?+bf.dataset.rhMesSelecionado:ler(d,KEY_F));
            filtrar(d,'docs',bd?+bd.dataset.rhMesSelecionado:ler(d,KEY_D));
          },80);
        });
        observer.observe(root,{childList:true,subtree:true});
      }
    }catch(e){}
  }
  frame.addEventListener('load',()=>[100,500,1200].forEach(ms=>setTimeout(boot,ms)));
  [200,800,1600,3000,5000].forEach(ms=>setTimeout(boot,ms));
  setInterval(()=>{
    try{
      const d=frame.contentDocument;if(!d)return;
      const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');
      criarAbas(d,'ferias');criarAbas(d,'docs');
      filtrar(d,'ferias',bf?+bf.dataset.rhMesSelecionado:ler(d,KEY_F));
      filtrar(d,'docs',bd?+bd.dataset.rhMesSelecionado:ler(d,KEY_D));
    }catch(e){}
  },700);
})();
