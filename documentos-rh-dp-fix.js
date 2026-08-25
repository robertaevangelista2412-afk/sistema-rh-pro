// RH PRO — Documentos RH/DP: mantém a posição horizontal e adiciona EDITAR
// sem recriar a tabela durante a navegação horizontal.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

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
      function remember(){const sc=getScroller();if(sc)lastLeft=sc.scrollLeft;}
      function restore(){
        if(restoring||lastLeft<=0)return;
        restoring=true;
        const sc=getScroller();
        if(sc){sc.scrollLeft=lastLeft;requestAnimationFrame(()=>{if(sc)sc.scrollLeft=lastLeft;restoring=false;});}
        else restoring=false;
      }
      box.addEventListener('scroll',remember,{passive:true});
      const observer=new MutationObserver(()=>restore());
      observer.observe(box,{childList:true,subtree:true});
      window.addEventListener('resize',restore);
      remember();
    }

    // Só acrescenta o botão à célula de ações. Não substitui a tabela.
    function addEditButtons(){
      const table=box.querySelector('table');
      if(!table)return;
      const docs=w.data&&Array.isArray(w.data['Documentos RH DP'])?w.data['Documentos RH DP']:[];
      const rows=table.querySelectorAll('tbody tr');
      rows.forEach(tr=>{
        const cells=tr.querySelectorAll('td');
        if(!cells.length)return;
        const action=cells[cells.length-1];
        if(!action||action.querySelector('[data-rhdp-edit]'))return;
        const buttons=action.querySelectorAll('button');
        let index=-1;
        if(buttons.length){
          const del=Array.from(buttons).find(b=>String(b.getAttribute('onclick')||'').includes('excluirDocumentoRHDp'));
          const m=del&&String(del.getAttribute('onclick')||'').match(/excluirDocumentoRHDp\((\d+)\)/);
          if(m)index=Number(m[1]);
        }
        if(index<0){
          const nome=(cells[0]?.textContent||'').trim();
          index=docs.findIndex(r=>String(r[0]||'').trim()===nome);
        }
        if(index<0||!docs[index])return;
        const b=d.createElement('button');
        b.className='mini';b.type='button';b.dataset.rhdpEdit='1';b.textContent='✏️ Editar';
        b.addEventListener('click',()=>w.editarDocumentoRHDp(index));
        const first=action.querySelector('button');
        if(first)action.insertBefore(b,first);else action.appendChild(b);
      });
    }

    if(!w.editarDocumentoRHDp){
      w.__RHPRO_RHDP_EDIT_INDEX=-1;
      w.editarDocumentoRHDp=function(index){
        const docs=w.data['Documentos RH DP']||[];const r=docs[index];
        if(!r)return;
        const set=(id,v)=>{const el=d.getElementById(id);if(el)el.value=v||''};
        set('rhdpNome',r[0]);set('rhdpCategoria',r[1]);set('rhdpData',w.dataParaInput?w.dataParaInput(r[2]):r[2]);set('rhdpValidade',w.dataParaInput?w.dataParaInput(r[3]):r[3]);set('rhdpResponsavel',r[4]);set('rhdpObservacoes',r[5]);
        w.__RHPRO_RHDP_EDIT_INDEX=index;
        const btn=d.querySelector('button[onclick="salvarDocumentoRHDp()"]');
        if(btn){btn.textContent='✏️ Salvar alteração';btn.dataset.rhdpEditing='1';}
        const msg=d.getElementById('rhdpMsg');if(msg)msg.textContent='Editando documento. Altere os dados e clique em Salvar alteração.';
        d.getElementById('rhdpNome')?.scrollIntoView({behavior:'smooth',block:'center'});
      };

      const originalSave=w.salvarDocumentoRHDp;
      if(originalSave){
        w.salvarDocumentoRHDp=async function(){
          const idx=w.__RHPRO_RHDP_EDIT_INDEX;
          if(idx<0)return originalSave();
          const docs=w.data['Documentos RH DP']||[];const r=docs[idx];
          if(!r)return originalSave();
          const val=id=>d.getElementById(id)?.value||'';
          const nome=val('rhdpNome').trim(),cat=val('rhdpCategoria'),dataDoc=val('rhdpData'),valid=val('rhdpValidade'),resp=val('rhdpResponsavel').trim(),obs=val('rhdpObservacoes').trim();
          const file=d.getElementById('rhdpArquivo')?.files?.[0];const msg=d.getElementById('rhdpMsg');
          if(!nome){if(msg)msg.textContent='Informe o nome do documento.';return;}
          try{
            let fileId=r[8];
            if(file){
              const allowed=['application/pdf','image/jpeg','image/png'];
              if(!allowed.includes(file.type)){if(msg)msg.textContent='Use PDF, JPG ou PNG.';return;}
              const db=await w.openDocDB();
              await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({id:fileId,blob:file,area:'Documentos do RH e DP',nome,categoria:cat,dataDoc,validade:valid,responsavel:resp,observacoes:obs,nomeArquivo:file.name});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
              try{db.close()}catch(e){}
              r[6]=file.name;
            }else{
              const db=await w.openDocDB();
              try{
                await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');const req=tx.objectStore('files').get(fileId);req.onsuccess=()=>{const old=req.result||{id:fileId};old.area='Documentos do RH e DP';old.nome=nome;old.categoria=cat;old.dataDoc=valid;old.validade=valid;old.responsavel=resp;old.observacoes=obs;tx.objectStore('files').put(old)};req.onerror=()=>reject(req.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
              }finally{try{db.close()}catch(e){}}
            }
            r[0]=nome;r[1]=cat;r[2]=w.formatarDataBR_RHDP?w.formatarDataBR_RHDP(dataDoc):dataDoc;r[3]=w.formatarDataBR_RHDP?w.formatarDataBR_RHDP(valid):valid;r[4]=resp;r[5]=obs;r[7]=new Date().toLocaleDateString('pt-BR');
            w.save();w.__RHPRO_RHDP_EDIT_INDEX=-1;
            if(msg)msg.textContent='Documento alterado com sucesso.';
            const btn=d.querySelector('button[data-rhdp-editing="1"],button[onclick="salvarDocumentoRHDp()"]');if(btn){btn.textContent='📎 Anexar documento';delete btn.dataset.rhdpEditing;}
            const input=d.getElementById('rhdpArquivo');if(input)input.value='';
            w.renderListaDocumentosRHDp();
          }catch(e){console.error(e);if(msg)msg.textContent='Não foi possível alterar o documento.';}
        };
      }
    }

    addEditButtons();
  }

  frame.addEventListener('load',()=>setTimeout(boot,400));
  setTimeout(boot,900);setTimeout(boot,2500);setInterval(boot,1800);
})();
