// RH PRO — Férias e Documentos de Férias por mês
// CORREÇÃO EXCLUSIVA: preserva/recupera Férias e Documentos de Férias da nuvem e filtra por mês.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  const meses=['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nomes=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const mesAtual=new Date().getMonth()+1;
  const KEY_F='RH_PRO_FERIAS_MES', KEY_D='RH_PRO_DOC_FERIAS_MES';
  const SUPA_URL='https://ydqqxvtfvnhxpydccciu.supabase.co';
  const SUPA_KEY='sb_publishable_A-x4W6e_ES8k7fQR3TgGhw_DeVLH50O';
  let cloudDb=null, merged=false;

  function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function st(d){try{return d.defaultView?.localStorage||null}catch(e){return null}}
  function ler(d,k){try{const n=Number(st(d)?.getItem(k));return Number.isInteger(n)&&n>=0&&n<=12?n:mesAtual}catch(e){return mesAtual}}
  function saveMes(d,k,n){try{st(d)?.setItem(k,String(n))}catch(e){}}
  function mesData(v){
    const s=norm(v).trim(); if(!s)return 0; let m=s.match(/\b\d{1,2}[\/.\-](\d{1,2})[\/.\-]\d{2,4}\b/);
    if(m){const n=+m[1];if(n>=1&&n<=12)return n} m=s.match(/\b\d{4}[\/.\-](\d{1,2})[\/.\-]\d{1,2}\b/);
    if(m){const n=+m[1];if(n>=1&&n<=12)return n} m=s.match(/\b\d{1,2}\s+de\s+([a-z]+)(?:\s+de\s+\d{2,4})?\b/);
    if(m){const i=nomes.indexOf(m[1]);if(i>=0)return i+1} return 0;
  }
  function tabela(d,tipo){
    const id=tipo==='ferias'?'feriasTabelaUnica':'ferDocTabelaUnica', box=d.getElementById(id);
    if(box){const t=box.querySelector('table');if(t)return t}
    return [...d.querySelectorAll('table')].find(t=>{const h=norm(t.querySelector('thead')?.textContent||t.rows[0]?.textContent||'');return tipo==='ferias'?(h.includes('matricula')&&h.includes('colaborador')&&h.includes('data inicio')):(h.includes('colaborador')&&h.includes('tipo')&&h.includes('arquivo')&&h.includes('data'))})||null;
  }
  function mesLinha(tr,tipo){
    const cs=[...tr.cells||[]], t=tr.closest('table'); if(!cs.length)return 0;
    const hs=[...t?.querySelectorAll('thead th')||[]].map(x=>norm(x.textContent));
    let i=tipo==='ferias'?hs.findIndex(x=>x.includes('data inicio')):hs.findIndex(x=>x==='data'||x.includes('data'));
    if(i>=0){const m=mesData(cs[i]?.textContent);if(m)return m}
    for(const c of cs){const m=mesData(c.textContent);if(m)return m}
    const x=norm(tr.textContent||'').match(/\b\d{1,2}\/(\d{1,2})\/\d{2,4}\b/); return x?+x[1]:0;
  }
  function filtrar(d,tipo,mes){const t=tabela(d,tipo);if(!t)return;[...t.tBodies?.[0]?.rows||[]].forEach(tr=>{if(tr.querySelector('th'))return;const ok=mes===0||mesLinha(tr,tipo)===mes;tr.hidden=!ok;tr.classList.toggle('rh-mes-oculta',!ok);tr.style.setProperty('display',ok?'':'none','important')})}
  function pintar(box,n){box?.querySelectorAll('button[data-rh-mes]').forEach(b=>{const on=+b.dataset.rhMes===n;b.classList.toggle('active',on);b.style.background=on?'#123b67':'#e9eef4';b.style.color=on?'#fff':'#123b67'})}
  function selecionar(tipo,n){const d=frame.contentDocument;if(!d)return;saveMes(d,tipo==='ferias'?KEY_F:KEY_D,n);const box=d.getElementById(tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix');if(box){box.dataset.rhMesSelecionado=n;pintar(box,n)};filtrar(d,tipo,n);[80,250,600,1200].forEach(ms=>setTimeout(()=>filtrar(d,tipo,n),ms))}
  function abas(d,tipo){const t=tabela(d,tipo);if(!t)return;const host=t.closest('.panel')||t.parentElement;if(!host)return;const id=tipo==='ferias'?'feriasMesesFix':'ferDocMesesFix', key=tipo==='ferias'?KEY_F:KEY_D;let box=d.getElementById(id);
    if(!box){box=d.createElement('div');box.id=id;box.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 14px;position:relative;z-index:9999';meses.forEach((nome,i)=>{const b=d.createElement('button');b.type='button';b.textContent=nome;b.dataset.rhMes=i;b.style.cssText='border:0;border-radius:8px;padding:9px 13px;font-weight:700;cursor:pointer';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();selecionar(tipo,i)},true);box.appendChild(b)});host.insertBefore(box,host.firstChild)}
    const n=ler(d,key);box.dataset.rhMesSelecionado=n;pintar(box,n);filtrar(d,tipo,n);
  }
  async function recuperar(d){
    if(merged||!window.supabase)return;
    try{
      if(!cloudDb)cloudDb=window.supabase.createClient(SUPA_URL,SUPA_KEY);
      const {data:ses}=await cloudDb.auth.getSession();const uid=ses?.session?.user?.id;if(!uid)return;
      const {data:r,error}=await cloudDb.from('rhpro_sync').select('data').eq('user_id',uid).maybeSingle();if(error||!r?.data?.RH_PRO_DATA)return;
      const remote=JSON.parse(r.data.RH_PRO_DATA), local=JSON.parse(st(d)?.getItem('RH_PRO_DATA')||'{}');
      const unir=(a,b)=>{const A=Array.isArray(a)?a:[],B=Array.isArray(b)?b:[],out=[...A],seen=new Set(A.map(x=>JSON.stringify(x)));for(const x of B){const k=JSON.stringify(x);if(!seen.has(k)){seen.add(k);out.push(x)}}return out};
      const f=unir(local['Férias'],remote['Férias']), df=unir(local['Documentos Férias'],remote['Documentos Férias']);
      if(f.length!==(Array.isArray(local['Férias'])?local['Férias'].length:0)||df.length!==(Array.isArray(local['Documentos Férias'])?local['Documentos Férias'].length:0)){
        const mergedData={...local,'Férias':f,'Documentos Férias':df};st(d)?.setItem('RH_PRO_DATA',JSON.stringify(mergedData));
        try{d.defaultView.eval('data["Férias"]='+JSON.stringify(f)+';data["Documentos Férias"]='+JSON.stringify(df)+';save()')}catch(e){}
      }
      merged=true;
    }catch(e){console.warn('RH PRO Férias: recuperação preservada',e)}
  }
  let last=null,obs=null;
  async function boot(){const d=frame.contentDocument;if(!d?.body)return;await recuperar(d);abas(d,'ferias');abas(d,'docs');if(last!==d){last=d;if(obs)try{obs.disconnect()}catch(e){};const root=d.getElementById('main')||d.body;obs=new MutationObserver(()=>{clearTimeout(obs._t);obs._t=setTimeout(()=>{abas(d,'ferias');abas(d,'docs');const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');filtrar(d,'ferias',bf?+bf.dataset.rhMesSelecionado:ler(d,KEY_F));filtrar(d,'docs',bd?+bd.dataset.rhMesSelecionado:ler(d,KEY_D))},40)});obs.observe(root,{childList:true,subtree:true})}}
  frame.addEventListener('load',()=>[100,500,1200].forEach(ms=>setTimeout(boot,ms)));[200,800,1600,3000].forEach(ms=>setTimeout(boot,ms));
  setInterval(()=>{try{const d=frame.contentDocument;if(!d)return;const bf=d.getElementById('feriasMesesFix'),bd=d.getElementById('ferDocMesesFix');if(bf)pintar(bf,+bf.dataset.rhMesSelecionado);if(bd)pintar(bd,+bd.dataset.rhMesSelecionado);filtrar(d,'ferias',bf?+bf.dataset.rhMesSelecionado:ler(d,KEY_F));filtrar(d,'docs',bd?+bd.dataset.rhMesSelecionado:ler(d,KEY_D))}catch(e){}},700);
})();
