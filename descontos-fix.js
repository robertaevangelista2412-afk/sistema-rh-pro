(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  function boot(){
    let w,d,store;
    try{w=frame.contentWindow;d=frame.contentDocument;store=w.eval('data')}catch(e){return}
    if(!w||!d||!store||!d.getElementById('main'))return;
    if(w.__RHPRO_DESCONTOS_FIX_V3)return;
    w.__RHPRO_DESCONTOS_FIX_V3=true;
    w.__RHPRO_DESCONTO_EDIT_INDEX=-1;

    function ajustarStatusDesconto(){
      const sel=d.getElementById('descStatus');
      if(!sel)return;
      const desejados=['Ativo','Quitado','Cancelado'];
      const atuais=[...sel.options].map(o=>o.textContent.trim());
      if(atuais.length===3 && atuais.every((x,i)=>x===desejados[i]))return;
      const valorAtual=String(sel.value||'').trim();
      sel.replaceChildren(...desejados.map(v=>{const o=d.createElement('option');o.value=v;o.textContent=v;return o;}));
      sel.value=desejados.includes(valorAtual)?valorAtual:'Ativo';
    }

    function statusValido(v){
      v=String(v||'').trim();
      return ['Ativo','Quitado','Cancelado'].includes(v)?v:'Ativo';
    }

    w.renderDescontosRows=function(){
      const q=(d.getElementById('descSearch')?.value||'').toLowerCase();
      const all=store['Descontos']||[];
      const rs=all.filter(r=>r.join(' ').toLowerCase().includes(q));
      let h='<table><thead><tr><th>Matrícula</th><th>Colaborador</th><th>Tipo de desconto</th><th>Competência</th><th>Valor</th><th>Status</th><th>Observações</th><th>Ações</th></tr></thead><tbody>';
      if(!rs.length)h+='<tr><td colspan="8" class="empty">Nenhum desconto cadastrado.</td></tr>';
      rs.forEach(r=>{
        const i=all.indexOf(r);
        const status=String(r[5]||'').trim();
        const key=status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
        const palette={ativo:'background:#183b63;color:#ffffff;',quitado:'background:#c62828;color:#ffffff;',cancelado:'background:#6b7280;color:#ffffff;'};
        const style='display:inline-block;padding:7px 14px;border-radius:999px;font-weight:700;font-size:13px;min-width:76px;text-align:center;white-space:nowrap;'+(palette[key]||'background:#64748b;color:#ffffff;');
        h+='<tr><td>'+w.esc(r[0]||'')+'</td><td>'+w.esc(r[1]||'')+'</td><td>'+w.esc(r[2]||'')+'</td><td>'+w.esc(r[3]||'')+'</td><td>'+w.esc(r[4]||'')+'</td><td><span class="status-desconto '+w.esc(key)+'" style="'+style+'">'+w.esc(status||'—')+'</span></td><td>'+w.esc(r[6]||'')+'</td><td><button class="mini" type="button" data-desc-edit="'+i+'">✏️ Editar</button> <button class="mini" type="button" data-desc-del="'+i+'">Excluir</button></td></tr>';
      });
      h+='</tbody></table>';
      const box=d.getElementById('descTable');
      if(box)box.innerHTML='<div id="descontosTabelaUnica">'+h+'</div>';
    };

    w.editarDesconto=function(i){
      const r=(store['Descontos']||[])[i];if(!r)return;
      const set=(id,v)=>{const el=d.getElementById(id);if(el)el.value=v==null?'':v;};
      set('descEmployee',r[1]);set('descType',r[2]);set('descComp',r[3]);set('descValue',r[4]);
      ajustarStatusDesconto();set('descStatus',statusValido(r[5]));set('descNote',r[6]);
      w.__RHPRO_DESCONTO_EDIT_INDEX=i;
      const btn=d.querySelector('button[onclick*="saveDesconto"]');if(btn){btn.textContent='✏️ Salvar alteração';btn.dataset.editing='1';}
      const msg=d.getElementById('descMsg');if(msg)msg.textContent='Editando desconto. Altere os dados e salve.';
      d.getElementById('descEmployee')?.focus();
    };

    w.saveDesconto=function(){
      ajustarStatusDesconto();
      const r=['',d.getElementById('descEmployee')?.value||'',d.getElementById('descType')?.value||'',d.getElementById('descComp')?.value||'',d.getElementById('descValue')?.value||'',statusValido(d.getElementById('descStatus')?.value),d.getElementById('descNote')?.value||''];
      const msg=d.getElementById('descMsg');
      if(!r[1]){if(msg)msg.textContent='Selecione o colaborador.';return;}
      store['Descontos']=store['Descontos']||[];
      const idx=w.__RHPRO_DESCONTO_EDIT_INDEX;
      if(idx>=0&&store['Descontos'][idx]){store['Descontos'][idx]=r;w.__RHPRO_DESCONTO_EDIT_INDEX=-1;if(msg)msg.textContent='Desconto alterado com sucesso.';}
      else{store['Descontos'].push(r);if(msg)msg.textContent='Desconto lançado com sucesso.';}
      if(typeof w.save==='function')w.save();
      const btn=d.querySelector('button[onclick*="saveDesconto"]');if(btn){btn.textContent='+ Adicionar desconto';delete btn.dataset.editing;}
      w.renderDescontosRows();
    };

    const main=d.getElementById('main');
    if(main&&!main.__descFixBoundV3){
      main.__descFixBoundV3=true;
      main.addEventListener('click',function(e){
        const b=e.target.closest('button');if(!b)return;
        if(b.dataset.descEdit!==undefined)w.editarDesconto(Number(b.dataset.descEdit));
        if(b.dataset.descDel!==undefined&&typeof w.excluirDesconto==='function')w.excluirDesconto(Number(b.dataset.descDel));
      });
    }

    if(typeof w.showSection==='function'&&!w.__RHPRO_DESC_SHOW_V3){
      const original=w.showSection;
      w.showSection=function(name){
        const result=original.apply(this,arguments);
        if(String(name||'').trim()==='Descontos'){
          ajustarStatusDesconto();
          w.renderDescontosRows();
          ajustarStatusDesconto();
        }
        return result;
      };
      w.__RHPRO_DESC_SHOW_V3=true;
    }

    if(String(d.querySelector('h1')?.textContent||'').trim()==='Descontos'){
      ajustarStatusDesconto();w.renderDescontosRows();ajustarStatusDesconto();
    }
  }
  frame.addEventListener('load',()=>setTimeout(boot,250));
  setTimeout(boot,600);
})();