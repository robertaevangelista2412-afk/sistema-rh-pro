(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const monthText=d=>months[d.getMonth()]+'/'+d.getFullYear();
  function parseCompetencia(v){
    const s=String(v||'').trim().toLowerCase();
    const m=s.match(/(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*\/?\s*(\d{4})?/i);
    if(m){
      const aliases={janeiro:0,fevereiro:1,'março':2,marco:2,abril:3,maio:4,junho:5,julho:6,agosto:7,setembro:8,outubro:9,novembro:10,dezembro:11};
      return {month:aliases[m[1].toLowerCase()],year:m[2]?Number(m[2]):null};
    }
    const n=s.match(/^(0?[1-9]|1[0-2])\s*\/\s*(\d{4})$/);
    return n?{month:Number(n[1])-1,year:Number(n[2])}:null;
  }
  function boot(){
    let w,d,store;
    try{w=frame.contentWindow;d=frame.contentDocument;store=w.eval('data')}catch(e){return}
    if(!w||!d||!store||!d.getElementById('main'))return;
    if(!d.getElementById('rhpro-dp-month-style')){
      const st=d.createElement('style');st.id='rhpro-dp-month-style';
      st.textContent='.rhpro-dp-monthbar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:14px}.rhpro-dp-monthbar .month{font-size:22px;font-weight:800;color:#123b67;min-width:220px;text-align:center}.rhpro-dp-info{font-size:13px;color:#6b7280;margin:0 0 12px}.rhpro-dp-empty{padding:32px;text-align:center;color:#6b7280}.rhpro-dp-nowrap th,.rhpro-dp-nowrap td{white-space:nowrap;word-break:normal;overflow-wrap:normal}@media(max-width:700px){.rhpro-dp-monthbar .month{order:-1;flex-basis:100%}.rhpro-dp-monthbar button{flex:1}}';
      d.head.appendChild(st);
    }
    let month=w.__RHPRO_DP_HOLERITE_MONTH||new Date(new Date().getFullYear(),new Date().getMonth(),1);
    w.__RHPRO_DP_HOLERITE_MONTH=month;

    function renderPoint(){
      if(typeof w.renderDepartamentoPessoal==='function'){
        w.renderDepartamentoPessoal();
        setTimeout(()=>{try{w.abrirDPSubaba('Folhas de ponto assinadas')}catch(e){}},0);
      }
    }

    function render(){
      const main=d.getElementById('main'); if(!main)return;
      const docs=store['DP Documentos']||[];
      const selected=docs.map((r,i)=>({r,i,p:parseCompetencia(r[2])})).filter(x=>x.r[0]==='Holerites assinados'&&x.p&&x.p.month===month.getMonth()&&x.p.year===month.getFullYear());
      const total=docs.filter(r=>r[0]==='Holerites assinados').length;
      main.innerHTML='<div class="top"><div><h1>💰 Departamento Pessoal</h1><div class="muted">Holerites assinados organizados por mês.</div></div></div>'+
      '<div class="actions"><button id="dpHoleriteTab" class="dp-tab active" type="button">📄 Holerites assinados</button><button id="dpPontoTab" class="dp-tab" type="button">🕒 Folhas de ponto assinadas</button></div>'+
      '<div class="panel"><div class="rhpro-dp-monthbar"><button id="rh-dp-prev" class="secondary" type="button">‹ Mês anterior</button><button id="rh-dp-today" class="secondary" type="button">Hoje</button><div class="month">'+esc(monthText(month))+'</div><button id="rh-dp-next" class="secondary" type="button">Próximo mês ›</button></div>'+
      '<div class="rhpro-dp-info">Mostrando '+selected.length+' holerite(s) de '+esc(monthText(month))+'. Total cadastrado: '+total+'.</div>'+
      '<div class="grid"><label>Colaborador<select id="dpFuncionario"><option value="">Selecione o colaborador</option>'+((store['Colaboradores']||[]).filter(r=>r[1]).map(r=>'<option>'+esc(r[1])+'</option>').join(''))+'</select></label>'+
      '<label>Competência<input id="dpCompetencia" value="'+esc(monthText(month))+'" readonly></label>'+
      '<label>Arquivo PDF assinado<input id="dpArquivo" type="file" accept="application/pdf,.pdf"></label></div>'+
      '<div class="actions" style="margin-top:16px"><button id="rh-dp-upload" class="primary" type="button">📎 Anexar PDF</button></div><div id="dpMsg" class="muted"></div></div>'+
      '<div class="panel" style="margin-top:18px"><h2>Holerites de '+esc(monthText(month))+'</h2><div class="actions"><input id="rh-dp-search" class="search" placeholder="Pesquisar colaborador neste mês..."></div><div class="table-wrap"><table class="rhpro-dp-nowrap"><thead><tr><th>Colaborador</th><th>Competência</th><th>Arquivo</th><th>Data</th><th>Ações</th></tr></thead><tbody id="rh-dp-body"></tbody></table></div></div>';

      const body=d.getElementById('rh-dp-body');
      function table(){
        const q=(d.getElementById('rh-dp-search').value||'').toLowerCase().trim();
        const list=selected.filter(x=>x.r.join(' ').toLowerCase().includes(q));
        body.innerHTML=list.length?list.map(x=>'<tr><td>'+esc(x.r[1])+'</td><td>'+esc(x.r[2])+'</td><td>'+esc(x.r[3])+'</td><td>'+esc(x.r[4])+'</td><td><button class="mini" data-open="'+x.i+'">👁️ Abrir</button><button class="mini" data-del="'+x.i+'">🗑️ Excluir</button></td></tr>').join(''):'<tr><td colspan="5"><div class="rhpro-dp-empty">Nenhum holerite cadastrado neste mês.</div></td></tr>';
      }
      table();
      d.getElementById('rh-dp-search').oninput=table;
      d.getElementById('rh-dp-prev').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);w.__RHPRO_DP_HOLERITE_MONTH=month;render()};
      d.getElementById('rh-dp-next').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);w.__RHPRO_DP_HOLERITE_MONTH=month;render()};
      d.getElementById('rh-dp-today').onclick=()=>{const n=new Date();month=new Date(n.getFullYear(),n.getMonth(),1);w.__RHPRO_DP_HOLERITE_MONTH=month;render()};
      d.getElementById('dpPontoTab').onclick=renderPoint;
      d.getElementById('rh-dp-upload').onclick=()=>{try{w.anexarDocumentoDP()}catch(e){const m=d.getElementById('dpMsg');if(m)m.textContent='Não foi possível anexar o arquivo.';}};
      body.onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=Number(b.dataset.open??b.dataset.del);const doc=(store['DP Documentos']||[])[i];if(!doc)return;if(b.dataset.open!==undefined)w.abrirArquivoDP(doc[5]);if(b.dataset.del!==undefined)w.excluirArquivoDP(i);};
    }

    if(!w.__RHPRO_DP_MONTH_WRAPPED&&typeof w.showSection==='function'){
      const old=w.showSection;
      w.showSection=function(n){const r=old.apply(this,arguments);if(String(n||'')==='Departamento Pessoal')setTimeout(render,180);return r};
      w.__RHPRO_DP_MONTH_WRAPPED=true;
    }
  }
  frame.addEventListener('load',()=>{setTimeout(boot,120);setTimeout(boot,900);setTimeout(boot,2200)});
  setTimeout(boot,500);setTimeout(boot,1800);
})();