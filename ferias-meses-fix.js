// RH PRO — Férias e Documentos de Férias por mês
// ALTERAÇÃO EXCLUSIVA: abas mensais e filtro. Não altera nem apaga os dados salvos.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const mesAtual=new Date().getMonth()+1;
  const KEY_F='RH_PRO_FERIAS_MES';
  const KEY_D='RH_PRO_DOC_FERIAS_MES';

  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}

  function lerMes(key){
    try{
      const n=Number(localStorage.getItem(key));
      return Number.isInteger(n)&&n>=0&&n<=12?n:mesAtual;
    }catch(e){return mesAtual;}
  }
  function salvarMes(key,n){try{localStorage.setItem(key,String(n));}catch(e){}}

  function mesDaData(valor){
    const s=norm(valor).trim();
    if(!s)return 0;
    let m=s.match(/(^|\D)(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(\D|$)/);
    if(m){const n=Number(m[3]);if(n>=1&&n<=12)return n;}
    m=s.match(/(^|\D)(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(\D|$)/);
    if(m){const n=Number(m[3]);if(n>=1&&n<=12)return n;}
    m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)(?:\s+de\s+\d{2,4})?\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1;}
    for(let i=0;i<nomes.length;i++)if(s.includes(nomes[i]))return i+1;
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

  function colunaData(t,tipo){
    if(!t)return -1;
    const hs=Array.from(t.querySelectorAll('thead th')).map(h=>norm(h.textContent));
    if(tipo==='ferias'){
      const i=hs.findIndex(x=>x.includes('data inicio'));
      if(i>=0)return i;
    }
    const i=hs.findIndex(x=>x==='data'||x.includes('data'));
    return i;
  }

  function mesDaLinha(tr,tipo){
    const cells=Array.from(tr.querySelectorAll('td'));
    if(!cells.length)return 0;
    const t=tr.closest('table');
    const idx=colunaData(t,tipo);
    if(idx>=0){const m=mesDaData(cells[idx]?.textContent||'');if(m)return m;}
    // Fallback: procura qualquer data na linha, sem depender da posição da coluna.
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

  function filtrar(d,tipo,mes){
    const t=localizarTabela(d,tipo);
    if(!t||!t.tBodies?.[0])return;
    Array.from(t.tBodies[0].rows).forEach(tr=>{
      if(tr.querySelector('th'))return;
      const m=mesDaLinha(tr,tipo);
      tr.style.display=(mes===0||m===mes)?'':'none';
    });
  }

  function selecionar(tipo,n){
    const key=tipo==='ferias'?KEY_F:KEY_D;
    salvarMes(key,n);
    const d=frame.contentDocument;
    if(!d)return;
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const box=d.getElementById(id);
    if(box)pintar(box,n);
    filtrar(d,tipo,n);
  }

  // Função global para que o clique continue funcionando mesmo quando o sistema
  // recriar a tabela ou a tela inteira.
  frame.contentWindow && (frame.contentWindow.__rhSelecionarMesFerias=function(tipo,n){selecionar(tipo,n);});

  function criarAbas(d,tipo){
    const tabela=localizarTabela(d,tipo);
    if(!tabela)return;
    const host=tabela.closest('.panel')||tabela.parentElement;
    if(!host)return;
    const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix';
    const key=tipo==='ferias'?KEY_F:KEY_D;
    let box=d.getElementById(id);
    if(!box){
      box=d.createElement('div');
      box.id=id;
      box.setAttribute('data-rh-ferias-meses','1');
      box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;padding:0;position:relative;z-index:50;';
      meses.forEach((nome,i)=>{
        const b=d.createElement('button');
        b.type='button';
        b.textContent=nome;
        b.dataset.rhMes=String(i);
        b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer;';
        b.onclick=function(ev){
          ev.preventDefault();
          ev.stopPropagation();
          if(d.defaultView&&typeof d.defaultView.__rhSelecionarMesFerias==='function') d.defaultView.__rhSelecionarMesFerias(tipo,i);
          else selecionar(tipo,i);
          return false;
        };
        box.appendChild(b);
      });
      host.insertBefore(box,host.firstChild);
    }
    const n=lerMes(key);
    box.dataset.rhMesSelecionado=String(n);
    pintar(box,n);
    filtrar(d,tipo,n);
  }

  let ultimoDoc=null;
  let observer=null;
  function boot(){
    let d;
    try{d=frame.contentDocument;}catch(e){return;}
    if(!d||!d.body)return;
    criarAbas(d,'ferias');
    criarAbas(d,'docs');

    if(ultimoDoc!==d){
      ultimoDoc=d;
      if(observer)try{observer.disconnect();}catch(e){}
      const root=d.getElementById('main')||d.body;
      observer=new MutationObserver(function(){
        clearTimeout(observer._timer);
        observer._timer=setTimeout(function(){
          criarAbas(d,'ferias');
          criarAbas(d,'docs');
        },80);
      });
      observer.observe(root,{childList:true,subtree:true});
    }
  }

  frame.addEventListener('load',function(){
    setTimeout(boot,100);
    setTimeout(boot,500);
    setTimeout(boot,1200);
  });
  [100,500,1200,2500,5000].forEach(t=>setTimeout(boot,t));

  // Reaplica somente o filtro visual. Nunca modifica data['Férias'] nem data['Documentos Férias'].
  setInterval(function(){
    try{
      const d=frame.contentDocument;
      if(!d)return;
      const bf=d.getElementById('feriasMesesFix');
      const bd=d.getElementById('ferDocMesesFix');
      const mf=lerMes(KEY_F), md=lerMes(KEY_D);
      if(bf)pintar(bf,mf);
      if(bd)pintar(bd,md);
      filtrar(d,'ferias',mf);
      filtrar(d,'docs',md);
    }catch(e){}
  },500);
})();
