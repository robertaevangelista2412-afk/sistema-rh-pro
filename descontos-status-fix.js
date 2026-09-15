(function(){
  const frame=document.getElementById('app');
  if(!frame)return;
  function aplicar(){
    let d;
    try{d=frame.contentDocument}catch(e){return}
    if(!d)return;
    const sel=d.getElementById('descStatus');
    if(!sel)return;
    const atual=sel.value;
    const desejados=['Ativo','Quitado','Cancelado'];
    const textos=[...sel.options].map(o=>o.textContent.trim());
    if(textos.length!==3||textos.some((x,i)=>x!==desejados[i])){
      sel.innerHTML='<option>Ativo</option><option>Quitado</option><option>Cancelado</option>';
      if(desejados.includes(atual))sel.value=atual;
    }
  }
  function iniciar(){
    let d;
    try{d=frame.contentDocument}catch(e){return}
    if(!d)return;
    aplicar();
    const main=d.getElementById('main');
    if(main&&!main.__statusDescontoObserver){
      main.__statusDescontoObserver=true;
      new MutationObserver(aplicar).observe(main,{childList:true,subtree:true});
    }
  }
  frame.addEventListener('load',()=>setTimeout(iniciar,300));
  setTimeout(iniciar,700);
})();