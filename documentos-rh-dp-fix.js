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


  // Documentos dos colaboradores: garante vários anexos, mesmo quando o HTML antigo estiver em cache.
  function bootMultipleEmployeeFiles(){
    let w,d;
    try{w=frame.contentWindow;d=frame.contentDocument}catch(e){return;}
    if(!w||!d)return;

    const input=d.getElementById('docFile');
    if(!input)return;

    input.multiple=true;
    input.setAttribute('multiple','multiple');

    if(!d.__RHPRO_DOC_MULTI_FILES)d.__RHPRO_DOC_MULTI_FILES=[];

    let list=d.getElementById('docSelectedFiles');
    if(!list){
      const actions=input.closest('div')?.nextElementSibling;
      const host=input.parentElement;
      if(!host)return;

      const more=d.createElement('button');
      more.type='button';
      more.id='docAddMoreFiles';
      more.textContent='➕ Adicionar mais arquivos';
      more.className='mini';
      more.style.marginTop='10px';
      more.style.padding='10px 14px';
      more.addEventListener('click',()=>input.click());

      list=d.createElement('div');
      list.id='docSelectedFiles';
      list.style.marginTop='10px';

      const hint=d.createElement('div');
      hint.className='muted';
      hint.id='docMultiHint';
      hint.style.marginTop='8px';
      hint.textContent='Você pode selecionar vários arquivos de uma vez ou adicionar mais arquivos em etapas.';

      input.insertAdjacentElement('afterend',more);
      more.insertAdjacentElement('afterend',list);
      list.insertAdjacentElement('afterend',hint);
    }

    function renderList(){
      const files=d.__RHPRO_DOC_MULTI_FILES||[];
      if(!files.length){list.innerHTML='<div class="muted">Nenhum arquivo selecionado.</div>';return;}
      list.innerHTML='<div style="font-weight:700;margin-bottom:8px">📎 Arquivos selecionados ('+files.length+')</div>'+
        files.map((file,i)=>'<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;border:1px solid #d8dee6;border-radius:8px;margin:5px 0"><span>📄 '+String(file.name).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span><button type="button" class="mini" data-doc-remove="'+i+'">✕ Remover</button></div>').join('');
      list.querySelectorAll('[data-doc-remove]').forEach(b=>b.addEventListener('click',()=>{
        d.__RHPRO_DOC_MULTI_FILES.splice(Number(b.dataset.docRemove),1);renderList();
      }));
    }

    if(!d.__RHPRO_DOC_MULTI_LISTENER){
      d.__RHPRO_DOC_MULTI_LISTENER=true;
      input.addEventListener('change',()=>{
        const selected=Array.from(input.files||[]);
        const arr=d.__RHPRO_DOC_MULTI_FILES;
        const seen=new Set(arr.map(f=>f.name+'|'+f.size+'|'+f.lastModified));
        selected.forEach(file=>{
          const key=file.name+'|'+file.size+'|'+file.lastModified;
          if(!seen.has(key)){arr.push(file);seen.add(key);}
        });
        input.value='';
        renderList();
      });

      // Em versões antigas, envia cada arquivo mantendo o mesmo colaborador e os mesmos dados.
      const nativeAttach=w.attachDocument;
      if(nativeAttach && !w.__RHPRO_DOC_MULTI_ATTACH_PATCHED && !String(nativeAttach).includes('__DOC_PENDING_FILES')){
        w.__RHPRO_DOC_MULTI_ATTACH_PATCHED=true;
        w.attachDocument=async function(){
          const files=(d.__RHPRO_DOC_MULTI_FILES||[]).slice();
          if(!files.length)return nativeAttach.apply(this,arguments);
          const employee=d.getElementById('docEmployee')?.value;
          if(!employee){const msg=d.getElementById('docMsg');if(msg)msg.textContent='Selecione o colaborador e pelo menos um arquivo.';return;}
          try{
            for(const file of files){
              const dt=new DataTransfer();dt.items.add(file);
              input.files=dt.files;
              await nativeAttach.apply(this,arguments);
            }
            d.__RHPRO_DOC_MULTI_FILES=[];
            input.value='';
            renderList();
            const msg=d.getElementById('docMsg');if(msg)msg.textContent=files.length+' documento(s) anexado(s) com sucesso.';
          }catch(e){console.error(e);}
        };
      }
    }
    renderList();
  }

  frame.addEventListener('load',function(){setTimeout(boot,400);setTimeout(bootMultipleEmployeeFiles,700);setTimeout(bootMultipleEmployeeFiles,1600);});
  setTimeout(boot,900);
  setTimeout(bootMultipleEmployeeFiles,1200);
  setTimeout(boot,2500);
  setTimeout(bootMultipleEmployeeFiles,3000);
  setInterval(boot,1800);
  setInterval(bootMultipleEmployeeFiles,1800);
})();
