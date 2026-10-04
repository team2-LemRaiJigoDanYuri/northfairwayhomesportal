(function(){
  function ensure(){
    let el=document.getElementById('nfhGlobalLoading');
    if(el) return el;
    el=document.createElement('div'); el.id='nfhGlobalLoading'; el.className='nfh-loading-overlay'; el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="nfh-loading-card" role="status" aria-live="polite"><div class="nfh-loading-spinner" aria-hidden="true"></div><strong id="nfhLoadingTitle">Processing…</strong><span id="nfhLoadingDetail">Please wait while the system completes your request.</span></div>';
    document.body.appendChild(el); return el;
  }
  function show(text,detail){const el=ensure(); const t=document.getElementById('nfhLoadingTitle'); const d=document.getElementById('nfhLoadingDetail'); if(t)t.textContent=text||'Processing…'; if(d)d.textContent=detail||'Please wait while the system completes your request.'; el.classList.add('is-visible');el.setAttribute('aria-hidden','false');document.body.classList.add('nfh-is-loading');}
  function hide(){const el=document.getElementById('nfhGlobalLoading'); if(el){el.classList.remove('is-visible');el.setAttribute('aria-hidden','true');}document.body.classList.remove('nfh-is-loading');}
  function busyButton(btn,text){if(!btn)return; if(!btn.dataset.nfhOriginalHtml) btn.dataset.nfhOriginalHtml=btn.innerHTML; btn.disabled=true;btn.classList.add('nfh-busy-button');if(text)btn.textContent=text;}
  function resetButton(btn){if(!btn)return;btn.disabled=false;btn.classList.remove('nfh-busy-button');if(btn.dataset.nfhOriginalHtml){btn.innerHTML=btn.dataset.nfhOriginalHtml;delete btn.dataset.nfhOriginalHtml;}}
  window.NFHLoading={show,hide,busyButton,resetButton};
  document.addEventListener('submit',function(e){
    const form=e.target;if(!(form instanceof HTMLFormElement))return;
    const btn=e.submitter||form.querySelector('[type="submit"]');
    setTimeout(function(){
      if(e.defaultPrevented || form.dataset.noGlobalLoading==='1') return;
      if(form.target==='_blank'){
        const label=form.dataset.loadingText||'Generating report…';
        busyButton(btn,'Generating…');
        show(label,'Preparing the PDF in a new tab.');
        setTimeout(()=>{hide();resetButton(btn);},1800);
        return;
      }
      const label=form.dataset.loadingText||'Processing…';busyButton(btn,label);show(label);
    },0);
  },true);
  document.addEventListener('click',function(e){
    const link=e.target.closest('a[data-loading-text]');if(!link||e.defaultPrevented)return;
    show(link.dataset.loadingText||'Loading…');
    if(link.target==='_blank') setTimeout(hide,1800);
  });
  window.addEventListener('pageshow',hide);
})();
