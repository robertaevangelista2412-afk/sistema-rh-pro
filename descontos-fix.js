(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function boot(){
    let w,d,store;
    try{w=frame.contentWindow;d=frame.contentDocument;store=w.eval('data')}catch(e){return}
    if(!w||!d||!store||!d.getElementById('main'))return;
    if(w.__RHPRO_DESCONTOS_FIX)return;
    w.__RHPRO_DESCONTOS_FIX=true;
    w.__RHPRO_DESCONTO_EDIT_INDEX=-1;
    w.renderDescontosRows=function(){
      const q=(d.getElementById('descSearch')?.value||'').toLowerCase();
      const all=store['Descontos']||[];
      const rs=all.filter(r=>r.join(' ').toLowerCase().includes(q));
      let h='<table><thead><tr><th>Matrícula</th><th>Colaborador</th><th>Tipo de desconto</th><th>Competência</th><th>Valor</th><th>Status</th><th>Observações</th><th>Ações</th></tr></thead><tbody>';
      if(!rs.length) h+='<tr><td colspan="8" class="empty">Nenhum desconto cadastrado.</td></tr>';
      rs.forEach(r=>{
        const i=all.indexOf(r);
        const status=String(r[5]||'').trim();
        const key=status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
        const statusHtml='<span class="status-desconto '+w.esc(key)+'">'+w.esc(status||'—')+'</span>';
        h+='<tr>'
          +'<td>'+w.esc(r[0]||'')+'</td>'
          +'<td>'+w.esc(r[1]||'')+'</td>'
          +'<td>'+w.esc(r[2]||'')+'</td>'
          +'<td>'+w.esc(r[3]||'')+'</td>'
          +'<td>'+w.esc(r[4]||'')+'</td>'
          +'<td>'+statusHtml+'</td>'
          +'<td>'+w.esc(r[6]||'')+'</td>'
          +'<td><button class="mini" type="button" data-desc-edit="'+i+'">✏️ Editar</button><button class="mini" type="button" data-desc-del="'+i+'">Excluir</button></td></tr>';
      });
      h+='</tbody></table>';
      const box=d.getElementById('descTable'); if(box)box.innerHTML='<div id="descontosTabelaUnica">'+h+'</div>';
      const wrap=d.getElementById('descontosTabelaUnica');
      if(wrap&&!wrap.__bound){wrap.__bound=true;wrap.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.descEdit!==undefined){w.editarDesconto(Number(b.dataset.descEdit));}if(b.dataset.descDel!==undefined){w.excluirDesconto(Number(b.dataset.descDel));}})}
    };
    w.editarDesconto=function(i){
      const r=(store['Descontos']||[])[i]; if(!r)return;
      const set=(id,v)=>{const el=d.getElementById(id);if(el)el.value=v||''};
      set('descEmployee',r[1]);set('descType',r[2]);set('descComp',r[3]);set('descValue',r[4]);set('descStatus',r[5]);set('descNote',r[6]);
      w.__RHPRO_DESCONTO_EDIT_INDEX=i;
      const btn=d.querySelector('button[onclick*="saveDesconto"]');if(btn){btn.textContent='✏️ Salvar alteração';btn.dataset.editing='1';}
      const msg=d.getElementById('descMsg');if(msg)msg.textContent='Editando desconto. Altere os dados e salve.';
      d.getElementById('descEmployee')?.focus();
    };
    w.saveDesconto=function(){
      const r=['',d.getElementById('descEmployee')?.value||'',d.getElementById('descType')?.value||'',d.getElementById('descComp')?.value||'',d.getElementById('descValue')?.value||'',d.getElementById('descStatus')?.value||'',d.getElementById('descNote')?.value||''];
      const msg=d.getElementById('descMsg');
      if(!r[1]){if(msg)msg.textContent='Selecione o colaborador.';return;}
      const idx=w.__RHPRO_DESCONTO_EDIT_INDEX;
      if(idx>=0&&(store['Descontos']||[])[idx]){store['Descontos'][idx]=r;w.__RHPRO_DESCONTO_EDIT_INDEX=-1;if(msg)msg.textContent='Desconto alterado com sucesso.';}
      else{store['Descontos']=store['Descontos']||[];store['Descontos'].push(r);if(msg)msg.textContent='Desconto lançado com sucesso.';}
      if(typeof w.save==='function')w.save();
      const btn=d.querySelector('button[onclick*="saveDesconto"]');if(btn){btn.textContent='+ Adicionar desconto';delete btn.dataset.editing;}
      w.renderDescontosRows();
    };
    const main=d.getElementById('main');
    if(main&&!main.__descFixBound){main.__descFixBound=true;main.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.descEdit!==undefined)w.editarDesconto(Number(b.dataset.descEdit));if(b.dataset.descDel!==undefined)w.excluirDesconto(Number(b.dataset.descDel));});}
    if(String(d.querySelector('h1')?.textContent||'').trim()==='Descontos')w.renderDescontosRows();
  }
  frame.addEventListener('load',()=>setTimeout(boot,500));setTimeout(boot,800);setTimeout(boot,2500);setInterval(boot,1500);
})();