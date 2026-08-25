(function(){
  const frame=document.getElementById('app'); if(!frame)return;
  function boot(){
    let w,d,store;
    try{w=frame.contentWindow;d=frame.contentDocument;store=w.eval('data')}catch(e){return}
    if(!w||!d||!store||!d.getElementById('main'))return;
    if(!w.__RHPRO_DOCS_EDIT_FIX){
      w.__RHPRO_DOCS_EDIT_FIX=true;
      w.__RHPRO_DOC_EDIT_INDEX=-1;
      const originalSave=w.salvarDocumentoRHDp;
      w.renderListaDocumentosRHDp=function(){
        const q=(d.getElementById('rhdpBusca')?.value||'').toLowerCase();
        const all=store['Documentos RH DP']||[];
        const rs=all.filter(r=>r.join(' ').toLowerCase().includes(q));
        let h='<table><thead><tr><th>Documento</th><th>Categoria</th><th>Data</th><th>Validade</th><th>Responsável</th><th>Arquivo</th><th>Ações</th></tr></thead><tbody>';
        if(!rs.length) h+='<tr><td colspan="7" class="empty">Nenhum documento cadastrado.</td></tr>';
        rs.forEach(r=>{const i=all.indexOf(r);h+='<tr><td>'+w.esc(r[0]||'')+'</td><td>'+w.esc(r[1]||'')+'</td><td>'+w.esc(r[2]||'')+'</td><td>'+w.esc(r[3]||'')+'</td><td>'+w.esc(r[4]||'')+'</td><td>'+w.esc(r[6]||'')+'</td><td><button class="mini" type="button" data-rhdp-open="'+w.esc(r[8]||'')+'">👁️ Abrir</button><button class="mini" type="button" data-rhdp-edit="'+i+'">✏️ Editar</button><button class="mini" type="button" data-rhdp-del="'+i+'">🗑️ Excluir</button></td></tr>';});
        h+='</tbody></table>';
        const box=d.getElementById('rhdpTabela');if(box)box.innerHTML='<div id="rhdpTabelaUnicaReal">'+h+'</div>';
        const wrap=d.getElementById('rhdpTabelaUnicaReal');
        if(wrap&&!wrap.__bound){wrap.__bound=true;wrap.addEventListener('click',function(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.rhdpOpen!==undefined)w.abrirDocumentoRHDp(b.dataset.rhdpOpen);if(b.dataset.rhdpEdit!==undefined)w.editarDocumentoRHDp(Number(b.dataset.rhdpEdit));if(b.dataset.rhdpDel!==undefined)w.excluirDocumentoRHDp(Number(b.dataset.rhdpDel));});}
      };
      w.editarDocumentoRHDp=function(i){
        const r=(store['Documentos RH DP']||[])[i];if(!r)return;
        const set=(id,v)=>{const el=d.getElementById(id);if(el)el.value=v||''};
        set('rhdpNome',r[0]);set('rhdpCategoria',r[1]);
        const toISO=v=>{const p=String(v||'').split('/');return p.length===3?p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'):''};
        set('rhdpData',toISO(r[2]));set('rhdpValidade',toISO(r[3]));set('rhdpResponsavel',r[4]);set('rhdpObservacoes',r[5]);
        w.__RHPRO_DOC_EDIT_INDEX=i;
        const btn=d.querySelector('button[onclick*="salvarDocumentoRHDp"]');if(btn){btn.textContent='✏️ Salvar alteração';btn.dataset.editing='1';}
        const msg=d.getElementById('rhdpMsg');if(msg)msg.textContent='Editando documento. O arquivo anexado será mantido.';
        d.getElementById('rhdpNome')?.focus();
      };
      w.salvarDocumentoRHDp=async function(){
        const idx=w.__RHPRO_DOC_EDIT_INDEX;
        if(idx>=0&&(store['Documentos RH DP']||[])[idx]){
          const nome=(d.getElementById('rhdpNome')?.value||'').trim();
          const categoria=d.getElementById('rhdpCategoria')?.value||'';
          const dataDoc=d.getElementById('rhdpData')?.value||'';
          const validade=d.getElementById('rhdpValidade')?.value||'';
          const responsavel=(d.getElementById('rhdpResponsavel')?.value||'').trim();
          const obs=(d.getElementById('rhdpObservacoes')?.value||'').trim();
          const msg=d.getElementById('rhdpMsg');if(!nome){if(msg)msg.textContent='Informe o nome do documento.';return;}
          const r=store['Documentos RH DP'][idx];
          const fmt=v=>{const p=String(v||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:''};
          r[0]=nome;r[1]=categoria;r[2]=fmt(dataDoc);r[3]=fmt(validade);r[4]=responsavel;r[5]=obs;
          w.__RHPRO_DOC_EDIT_INDEX=-1;
          if(typeof w.save==='function')w.save();
          if(msg)msg.textContent='Documento alterado com sucesso.';
          const btn=d.querySelector('button[onclick*="salvarDocumentoRHDp"]');if(btn){btn.textContent='📎 Anexar documento';delete btn.dataset.editing;}
          w.renderListaDocumentosRHDp();return;
        }
        if(typeof originalSave==='function')return originalSave();
      };
    }
    if(d.getElementById('rhdpTabela'))w.renderListaDocumentosRHDp();
  }
  frame.addEventListener('load',()=>setTimeout(boot,600));
  setTimeout(boot,900);setTimeout(boot,2600);setInterval(boot,1800);
})();