// RH PRO — Documentos RH/DP: edição + preservação da posição horizontal.
// Não recria a tabela. Apenas acrescenta o botão Editar e protege o scroll.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  function getData(w){
    try{return w.eval('data');}catch(e){return null;}
  }

  function boot(){
    let w,d;
    try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return}
    if(!w||!d)return;

    const box=d.getElementById('rhdpTabela');
    if(!box)return;

    if(!d.__RHPRO_DOC_FIX){
      d.__RHPRO_DOC_FIX=true;
      let lastLeft=0;
      let restoring=false;

      function getScroller(){
        let el=box;
        while(el&&el!==d.body){
          if(el.scrollWidth>el.clientWidth+2)return el;
          el=el.parentElement;
        }
        return box;
      }
      function remember(){
        const sc=getScroller();
        if(sc)lastLeft=sc.scrollLeft;
      }
      function restore(){
        if(restoring)return;
        restoring=true;
        const sc=getScroller();
        if(sc){
          sc.scrollLeft=lastLeft;
          requestAnimationFrame(function(){
            if(sc)sc.scrollLeft=lastLeft;
            restoring=false;
          });
        }else restoring=false;
      }

      box.addEventListener('scroll',remember,{passive:true});
      remember();
      const observer=new MutationObserver(function(){
        remember();
        addEditButtons();
        restore();
      });
      observer.observe(box,{childList:true,subtree:true});
      w.addEventListener('resize',restore);
    }

    function addEditButtons(){
      const table=box.querySelector('table');
      if(!table)return;
      const data=getData(w);
      const docs=data&&Array.isArray(data['Documentos RH DP'])?data['Documentos RH DP']:[];
      table.querySelectorAll('tbody tr').forEach(function(tr){
        const cells=tr.querySelectorAll('td');
        if(!cells.length)return;
        const action=cells[cells.length-1];
        if(!action||action.querySelector('[data-rhdp-edit]'))return;

        let index=-1;
        const del=Array.from(action.querySelectorAll('button')).find(function(b){
          return String(b.getAttribute('onclick')||'').includes('excluirDocumentoRHDp');
        });
        const match=del&&String(del.getAttribute('onclick')||'').match(/excluirDocumentoRHDp\((\d+)\)/);
        if(match)index=Number(match[1]);
        if(index<0){
          const nome=(cells[0]?.textContent||'').trim();
          index=docs.findIndex(function(r){return String(r[0]||'').trim()===nome;});
        }
        if(index<0)return;

        const b=d.createElement('button');
        b.className='mini';
        b.type='button';
        b.dataset.rhdpEdit='1';
        b.textContent='✏️ Editar';
        b.addEventListener('click',function(){editarDocumentoRHDp(index);});
        const first=action.querySelector('button');
        if(first)action.insertBefore(b,first);else action.appendChild(b);
      });
    }

    function editarDocumentoRHDp(index){
      const data=getData(w);
      const docs=data&&data['Documentos RH DP'];
      const r=docs&&docs[index];
      if(!r)return;

      const set=function(id,v){const el=d.getElementById(id);if(el)el.value=v||''};
      set('rhdpNome',r[0]);
      set('rhdpCategoria',r[1]);
      set('rhdpData',w.dataParaInput?w.dataParaInput(r[2]):r[2]);
      set('rhdpValidade',w.dataParaInput?w.dataParaInput(r[3]):r[3]);
      set('rhdpResponsavel',r[4]);
      set('rhdpObservacoes',r[5]);

      w.__RHPRO_RHDP_EDIT_INDEX=index;
      const btn=d.querySelector('button[onclick="salvarDocumentoRHDp()"]');
      if(btn){btn.textContent='✏️ Salvar alteração';btn.dataset.rhdpEditing='1';}
      const msg=d.getElementById('rhdpMsg');
      if(msg)msg.textContent='Editando documento. Altere os dados e clique em Salvar alteração.';
      d.getElementById('rhdpNome')?.scrollIntoView({behavior:'smooth',block:'center'});
    }

    w.editarDocumentoRHDp=editarDocumentoRHDp;

    if(!d.__RHPRO_RHDP_SAVE_PATCHED){
      d.__RHPRO_RHDP_SAVE_PATCHED=true;
      const originalSave=w.salvarDocumentoRHDp;
      if(originalSave){
        w.salvarDocumentoRHDp=async function(){
          const idx=Number.isInteger(w.__RHPRO_RHDP_EDIT_INDEX)?w.__RHPRO_RHDP_EDIT_INDEX:-1;
          if(idx<0)return originalSave();

          const data=getData(w);
          const docs=data&&data['Documentos RH DP'];
          const r=docs&&docs[idx];
          if(!r)return originalSave();

          const val=function(id){return d.getElementById(id)?.value||''};
          const nome=val('rhdpNome').trim();
          const cat=val('rhdpCategoria');
          const dataDoc=val('rhdpData');
          const valid=val('rhdpValidade');
          const resp=val('rhdpResponsavel').trim();
          const obs=val('rhdpObservacoes').trim();
          const file=d.getElementById('rhdpArquivo')?.files?.[0];
          const msg=d.getElementById('rhdpMsg');

          if(!nome){if(msg)msg.textContent='Informe o nome do documento.';return;}

          try{
            const fileId=r[8];
            const db=await w.openDocDB();
            try{
              await new Promise(function(resolve,reject){
                const tx=db.transaction('files','readwrite');
                const store=tx.objectStore('files');
                const req=store.get(fileId);
                req.onsuccess=function(){
                  const old=req.result||{id:fileId};
                  old.area='Documentos do RH e DP';
                  old.nome=nome;
                  old.categoria=cat;
                  old.dataDoc=dataDoc;
                  old.validade=valid;
                  old.responsavel=resp;
                  old.observacoes=obs;
                  if(file){
                    const allowed=['application/pdf','image/jpeg','image/png'];
                    if(!allowed.includes(file.type)){reject(new Error('Use PDF, JPG ou PNG.'));return;}
                    old.blob=file;
                    old.nomeArquivo=file.name;
                    r[6]=file.name;
                  }
                  store.put(old);
                };
                req.onerror=function(){reject(req.error||new Error('Arquivo não encontrado.'))};
                tx.oncomplete=resolve;
                tx.onerror=function(){reject(tx.error||new Error('Falha ao salvar.'))};
                tx.onabort=function(){reject(tx.error||new Error('Operação cancelada.'))};
              });
            }finally{try{db.close()}catch(e){}}

            r[0]=nome;
            r[1]=cat;
            r[2]=w.formatarDataBR_RHDP?w.formatarDataBR_RHDP(dataDoc):dataDoc;
            r[3]=w.formatarDataBR_RHDP?w.formatarDataBR_RHDP(valid):valid;
            r[4]=resp;
            r[5]=obs;
            r[7]=new Date().toLocaleDateString('pt-BR');
            if(w.save)w.save();

            w.__RHPRO_RHDP_EDIT_INDEX=-1;
            if(msg)msg.textContent='Documento alterado com sucesso.';
            const btn=d.querySelector('button[data-rhdp-editing="1"]');
            if(btn){btn.textContent='📎 Anexar documento';delete btn.dataset.rhdpEditing;}
            const input=d.getElementById('rhdpArquivo');if(input)input.value='';
            w.renderListaDocumentosRHDp();
            setTimeout(addEditButtons,100);
          }catch(e){
            console.error(e);
            if(msg)msg.textContent='Não foi possível alterar o documento: '+(e.message||'verifique o navegador.');
          }
        };
      }
    }

    addEditButtons();
  }

  frame.addEventListener('load',function(){setTimeout(boot,400);});
  setTimeout(boot,900);
  setTimeout(boot,2500);
  setInterval(boot,1800);
})();
