(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function boot(){
    let w,d,store;
    try{w=frame.contentWindow;d=frame.contentDocument;store=w.eval('data')}catch(e){return}
    if(!w||!d||!store||!d.getElementById('main'))return;
    if(w.__RHPRO_DOCS_EDIT_FIX)return;
    w.__RHPRO_DOCS_EDIT_FIX=true;
    w.__RHPRO_DOC_EDIT_INDEX=-1;
    const originalRender=w.renderDocumentRows;
    w.renderDocumentRows=function(){
      const q=(d.getElementById('docSearch')?.value||'').toLowerCase();
      const all=store['Documentos']||[];
      const rs=all.filter(r=>r.join(' ').toLowerCase().includes(q));
      let h='<table><thead><tr><th>Colaborador</th><th>Documento</th><th>Arquivo</th><th>Data</th><th>Observação</th><th>Ações</th></tr></thead><tbody>';
      if(!rs.length) h+='<tr><td colspan="6" class="empty">Nenhum documento anexado.</td></tr>';
      rs.forEach(r=>{const i=all.indexOf(r);h+='<tr><td>'+w.esc(r[1]||'')+'</td><td>'+w.esc(r[2]||'')+'</td><td>'+w.esc(r[6]||'')+'</td><td>'+w.esc(r[3]||'')+'</td><td>'+w.esc(r[7]||'')+'</td><td><button class="mini" type="button" data-doc-open="'+w.esc(r[0]||'')+'">👁️ Abrir</button><button class="mini" type="button" data-doc-edit="'+i+'">✏️ Editar</button><button class="mini" type="button" data-doc-del="'+i+'">🗑️ Excluir</button></td></tr>';});
      h+='</tbody></table>';
      const box=d.getElementById('docTable');if(box)box.innerHTML='<div id="documentosTabelaUnica">'+h+'</div>';
      const wrap=d.getElementById('documentosTabelaUnica');
      if(wrap&&!wrap.__bound){wrap.__bound=true;wrap.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.docOpen!==undefined)w.viewDocument(b.dataset.docOpen);if(b.dataset.docEdit!==undefined)w.editarDocumento(Number(b.dataset.docEdit));if(b.dataset.docDel!==undefined)w.deleteDocument(Number(b.dataset.docDel));});}
    };
    w.editarDocumento=function(i){
      const r=(store['Documentos']||[])[i];if(!r)return;
      const set=(id,v)=>{const el=d.getElementById(id);if(el)el.value=v||''};
      set('docEmployee',r[1]);set('docType',r[2]);set('docNote',r[7]);
      w.__RHPRO_DOC_EDIT_INDEX=i;
      const attach=d.querySelector('button[onclick*="attachDocument"]');
      if(attach){attach.textContent='✏️ Salvar alteração';attach.dataset.editing='1';}
      const msg=d.getElementById('docMsg');if(msg)msg.textContent='Editando documento. Altere os dados e salve. O arquivo anexado será mantido.';
      d.getElementById('docEmployee')?.focus();
    };
    w.attachDocument=function(){
      const idx=w.__RHPRO_DOC_EDIT_INDEX;
      const employee=d.getElementById('docEmployee')?.value||'';
      const type=d.getElementById('docType')?.value||'';
      const note=d.getElementById('docNote')?.value||'';
      const msg=d.getElementById('docMsg');
      if(!employee){if(msg)msg.textContent='Selecione o colaborador.';return;}
      if(idx>=0&&(store['Documentos']||[])[idx]){
        const r=store['Documentos'][idx];r[1]=employee;r[2]=type;r[7]=note;
        w.__RHPRO_DOC_EDIT_INDEX=-1;
        if(typeof w.save==='function')w.save();
        if(msg)msg.textContent='Documento alterado com sucesso.';
        const btn=d.querySelector('button[onclick*="attachDocument"]');if(btn){btn.textContent='📎 Anexar documento';delete btn.dataset.editing;}
        w.renderDocumentRows();return;
      }
      if(typeof w.__RHPRO_ORIGINAL_ATTACH_DOCUMENT==='function')return w.__RHPRO_ORIGINAL_ATTACH_DOCUMENT();
    };
    if(!w.__RHPRO_ORIGINAL_ATTACH_DOCUMENT&&typeof originalRender==='function){
      // The normal new-document flow is retained by the main application; this hook only changes the edit state.
    }
    if(String(d.querySelector('h1')?.textContent||'').trim()==='Documentos')w.renderDocumentRows();
  }
  frame.addEventListener('load',()=>setTimeout(boot,600));setTimeout(boot,900);setTimeout(boot,2600);setInterval(boot,1800);
})();