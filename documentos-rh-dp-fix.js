// RH PRO — Documentos RH/DP: preserva a posição horizontal da tabela.
// Importante: este fix NÃO recria a tabela em intervalos. Ele apenas impede que
// uma atualização do conteúdo faça o scroll voltar para o início.
(function(){
  const frame=document.getElementById('app');
  if(!frame)return;

  function boot(){
    let d;
    try{d=frame.contentDocument}catch(e){return}
    if(!d)return;
    if(d.__RHPRO_DOC_SCROLL_FIX)return;

    const box=d.getElementById('rhdpTabela') || d.getElementById('documentosTabelaUnica');
    if(!box)return;

    d.__RHPRO_DOC_SCROLL_FIX=true;

    function getScroller(){
      let el=box;
      while(el && el!==d.body){
        if(el.scrollWidth>el.clientWidth+2) return el;
        el=el.parentElement;
      }
      return box;
    }

    let lastLeft=0;
    let restoring=false;

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
      }else{
        restoring=false;
      }
    }

    box.addEventListener('scroll',remember,{passive:true});
    remember();

    const observer=new MutationObserver(function(){
      if(lastLeft>0)restore();
    });
    observer.observe(box,{childList:true,subtree:true});

    // Também protege contra mudanças de layout que alterem a largura da tabela.
    window.addEventListener('resize',function(){
      if(lastLeft>0)restore();
    });
  }

  frame.addEventListener('load',function(){setTimeout(boot,300)});
  setTimeout(boot,900);
  setTimeout(boot,2500);
})();
