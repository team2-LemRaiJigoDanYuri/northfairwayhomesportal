(function(){
  'use strict';

  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape==='function') return window.CSS.escape(value);
    return String(value).replace(/([ #;?%&,.+*~\\':"!^$[\]()=>|/@])/g,'\\$1');
  }

  function findLabel(control){
    if(!control) return null;
    if(control.id){
      const explicit=document.querySelector(`label[for="${cssEscape(control.id)}"]`);
      if(explicit) return explicit;
    }
    const group=control.closest('.form-group,.input-group,.record-filter-field,.home-filter-field');
    return group?.querySelector('label') || null;
  }

  function markRequiredFields(root=document){
    if(!root?.querySelectorAll) return;
    root.querySelectorAll('input[required],select[required],textarea[required]').forEach(control=>{
      const label=findLabel(control);
      if(!label || label.querySelector('.required-marker')) return;
      const marker=document.createElement('span');
      marker.className='required-marker';
      marker.setAttribute('aria-hidden','true');
      marker.textContent=' *';
      label.appendChild(marker);
    });
  }

  function fieldError(control){
    const group=control.closest('.form-group,.input-group') || control.parentElement;
    if(!group) return null;
    let el=group.querySelector(':scope > .field-validation-message');
    if(!el){
      el=document.createElement('small');
      el.className='field-validation-message';
      el.setAttribute('aria-live','polite');
      group.appendChild(el);
    }
    return el;
  }

  document.addEventListener('invalid',event=>{
    const control=event.target;
    if(!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return;
    control.classList.add('field-invalid');
    const msg=fieldError(control);
    if(msg) msg.textContent=control.validationMessage || 'Please complete this required field.';
    setTimeout(()=>{
      control.scrollIntoView({behavior:'smooth',block:'center'});
      control.focus({preventScroll:true});
    },0);
  },true);

  document.addEventListener('input',event=>{
    const control=event.target;
    if(!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
    if(control.checkValidity()){
      control.classList.remove('field-invalid');
      const msg=fieldError(control); if(msg) msg.textContent='';
    }
  },true);

  function init(){
    markRequiredFields(document);
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        mutation.addedNodes.forEach(node=>{
          if(node.nodeType!==1) return;
          if(node.matches?.('input[required],select[required],textarea[required]')) markRequiredFields(node.parentElement || document);
          else markRequiredFields(node);
        });
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  window.NFHFormUsability={markRequiredFields};
})();
