document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const desktopSidebarToggle = document.getElementById('desktopSidebarToggle');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('pageTitle');

    const setSidebarOpen = (open) => {
        if (!sidebar) return;
        sidebar.classList.toggle('open', open);
        document.body.classList.toggle('sidebar-open', open);
        if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    const syncDesktopToggle = () => {
        if (!desktopSidebarToggle) return;
        const collapsed = document.body.classList.contains('sidebar-collapsed');
        desktopSidebarToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        desktopSidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        desktopSidebarToggle.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
        const icon = desktopSidebarToggle.querySelector('i');
        if (icon) icon.className = collapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
    };
    if (sidebarToggle) sidebarToggle.addEventListener('click', () => setSidebarOpen(!sidebar.classList.contains('open')));
    if (desktopSidebarToggle) desktopSidebarToggle.addEventListener('click', () => {
        if (window.innerWidth < 1024) return;
        const collapsed = document.body.classList.toggle('sidebar-collapsed');
        sessionStorage.setItem('nfhSidebarCollapsed', collapsed ? '1' : '0');
        syncDesktopToggle();
    });
    if (window.innerWidth >= 1024 && sessionStorage.getItem('nfhSidebarCollapsed') === '1') document.body.classList.add('sidebar-collapsed');
    syncDesktopToggle();
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', () => setSidebarOpen(false));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && window.innerWidth < 1024 && sidebar?.classList.contains('open')) {
            setSidebarOpen(false);
            sidebarToggle?.focus();
        }
    });

    navItems.forEach((item, index) => {
        item.style.setProperty('--nav-order', index);
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-tab');
            navItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            const tc = document.getElementById(target);
            if (tc) { tc.classList.add('active'); tc.scrollTop = 0; }
            if (pageTitle) pageTitle.textContent = item.querySelector('span').textContent;
            if (window.innerWidth < 1024) setSidebarOpen(false);
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) setSidebarOpen(false);
        syncDesktopToggle();
    }, { passive: true });

    document.querySelectorAll('[data-activity-time]').forEach(el => {
        const raw = (el.dataset.activityTime || '').trim();
        const parsed = new Date(raw.replace(' ', 'T'));
        if (!Number.isNaN(parsed.getTime())) el.textContent = parsed.toLocaleString('en-US', {month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).replace(',', ' •');
    });

    const initialHash=(window.location.hash || '').replace('#','');
    if(initialHash){
        const initialNav=Array.from(navItems).find(item=>(item.getAttribute('href')||'')===`#${initialHash}`);
        if(initialNav) setTimeout(()=>initialNav.click(),0);
    }

    requestAnimationFrame(() => document.body.classList.add('navigation-ready'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => openModal('logoutModal'));
});

function openModal(id){ const m=document.getElementById(id); if(m) m.classList.add('show'); }
function closeModal(id){ const m=document.getElementById(id); if(m) m.classList.remove('show'); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }

// Professional in-system confirmation, toast, and inline validation utilities.
let activeConfirmResolve = null;
let activeConfirmTrigger = null;

function showToast(message, type='info', timeout=4200){
    const container=document.getElementById('toastContainer');
    if(!container || !message) return;
    const toast=document.createElement('div');
    toast.className=`system-toast toast-${type}`;
    const icon={success:'fa-circle-check',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'}[type] || 'fa-circle-info';
    toast.innerHTML=`<span class="toast-icon" aria-hidden="true"><i class="fa-solid ${icon}"></i></span><div class="toast-message"></div><button type="button" class="toast-close" aria-label="Dismiss notification">×</button>`;
    toast.querySelector('.toast-message').textContent=message;
    toast.querySelector('.toast-close').addEventListener('click',()=>dismissToast(toast));
    container.appendChild(toast);
    requestAnimationFrame(()=>toast.classList.add('show'));
    if(timeout) setTimeout(()=>dismissToast(toast),timeout);
}
function dismissToast(toast){
    if(!toast || toast.dataset.closing==='true') return;
    toast.dataset.closing='true'; toast.classList.remove('show');
    setTimeout(()=>toast.remove(),220);
}

function showConfirmModal({title='Confirm Action',message='',confirmText='Confirm',type='primary',context=[]}={}){
    const modal=document.getElementById('systemConfirmModal');
    if(!modal) return Promise.resolve(false);
    activeConfirmTrigger=document.activeElement;
    document.getElementById('systemConfirmTitle').textContent=title;
    document.getElementById('systemConfirmMessage').textContent=message;
    const contextWrap=document.getElementById('systemConfirmContext');
    contextWrap.innerHTML='';
    (context||[]).filter(item=>item && item.value!==undefined && item.value!=='').forEach(item=>{
        const row=document.createElement('div'); row.className='confirm-context-row';
        const label=document.createElement('span'); label.textContent=item.label;
        const value=document.createElement('strong'); value.textContent=String(item.value);
        row.append(label,value); contextWrap.appendChild(row);
    });
    contextWrap.hidden=!contextWrap.children.length;
    const confirmBtn=document.getElementById('systemConfirmButton');
    confirmBtn.textContent=confirmText;
    confirmBtn.className=`btn confirm-primary confirm-${type}`;
    modal.classList.add('show');
    confirmBtn.disabled=false;
    setTimeout(()=>confirmBtn.focus(),0);
    return new Promise(resolve=>{ activeConfirmResolve=resolve; });
}
function closeSystemConfirm(result=false){
    const modal=document.getElementById('systemConfirmModal');
    if(modal) modal.classList.remove('show');
    const resolver=activeConfirmResolve; activeConfirmResolve=null;
    if(resolver) resolver(Boolean(result));
    setTimeout(()=>activeConfirmTrigger?.focus?.(),0);
}
function confirmSystemAction(){ closeSystemConfirm(true); }

function clearInlineError(input){
    if(!input) return;
    input.classList.remove('field-invalid');
    const error=input.closest('.form-group')?.querySelector('.inline-validation-message');
    if(error) error.remove();
}
function showInlineError(input,message){
    if(!input){ showToast(message,'warning'); return; }
    clearInlineError(input); input.classList.add('field-invalid');
    const group=input.closest('.form-group') || input.parentElement;
    const error=document.createElement('div'); error.className='inline-validation-message'; error.setAttribute('role','alert'); error.textContent=message;
    group.appendChild(error); input.focus();
    input.addEventListener('input',()=>clearInlineError(input),{once:true});
}

function mirrorSubmitter(form, submitter){
    if (!form || !submitter || !submitter.name) return;
    let actionMirror=form.querySelector('input[data-submit-action-mirror="true"]');
    if(!actionMirror){ actionMirror=document.createElement('input'); actionMirror.type='hidden'; actionMirror.dataset.submitActionMirror='true'; form.appendChild(actionMirror); }
    actionMirror.name=submitter.name; actionMirror.value=submitter.value;
}
function lockWorkflowSubmit(form, submitter){
    if (!form || form.dataset.submitting === 'true') return false;
    mirrorSubmitter(form,submitter);
    form.dataset.submitting='true';
    form.querySelectorAll('button[type="submit"]').forEach(btn=>{btn.disabled=true;});
    if(submitter){ submitter.dataset.originalText=submitter.textContent; submitter.textContent='Processing…'; }
    return true;
}

async function submitPreviewAction(event, legacyMessage){
    event.preventDefault();
    const form=event.currentTarget, submitter=event.submitter;
    if(!submitter) return false;
    const action=(submitter.value || submitter.textContent || '').trim().toLowerCase();
    const reqId=document.getElementById('previewReqId')?.textContent || form.closest('tr')?.querySelector('code')?.textContent || '';
    let title='Confirm Action', message=legacyMessage || 'Confirm this action?', confirmText=submitter.textContent.trim(), type='primary';
    const feeName=form.querySelector('input[name="fee_name"]')?.value || '';
    if(feeName && action==='approve'){title='Approve Fee Change';message=`Are you sure you want to approve the proposed fee change for ${feeName}?`;confirmText='Yes, Approve Fee';}
    else if(feeName && action==='reject'){title='Reject Fee Change';message=`Are you sure you want to reject the proposed fee change for ${feeName}?`;confirmText='Yes, Reject Fee';type='danger';}
    else if(action==='approve'){title='Approve Document Request';message='Are you sure you want to approve this document request and continue it through the configured workflow?';confirmText='Yes, Approve Request';}
    else if((submitter.textContent||'').toLowerCase().includes('paid')){title='Confirm Face-to-Face Payment';message='Confirm that the Treasurer has received the cash payment and recorded the correct transaction details?';confirmText='Confirm Payment';}
    const ok=await showConfirmModal({title,message,confirmText,type,context:[{label:'Request ID',value:reqId}]});
    if(!ok) return false;
    if(!lockWorkflowSubmit(form,submitter)) return false;
    form.submit();
    return false;
}
// Automatically calculates the total amount due (Monthly Due x Missing Months)
function calculateAdjustment() {
    const monthlyDue = parseFloat(document.getElementById('adjMonthlyDue')?.value) || 0;
    const missingMonths = parseInt(document.getElementById('adjMissing')?.value, 10) || 0;
    const endMonthValue = document.getElementById('adjEndMonth')?.value || '';
    const proposedField = document.getElementById('adjProposed');
    const preview = document.getElementById('adjPeriodPreview');
    const previewText = document.getElementById('adjPeriodPreviewText');

    if (missingMonths > 0) proposedField.value = (monthlyDue * missingMonths).toFixed(2);
    else proposedField.value = '';

    if (!endMonthValue || missingMonths <= 0) {
        if (preview) preview.hidden = true;
        if (previewText) previewText.textContent = '—';
        return;
    }
    const [year,month] = endMonthValue.split('-').map(Number);
    const endDate = new Date(year, month-1, 1);
    const startDate = new Date(year, month-1-(missingMonths-1), 1);
    const fmt = d => d.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    const period = missingMonths === 1 ? fmt(endDate) : `${fmt(startDate)} – ${fmt(endDate)}`;
    if (previewText) previewText.textContent = period;
    if (preview) preview.hidden = false;
}

function duesLookupNormalize(value){
    return String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
}

function filterAdjustmentHomeowners(){
    const input=document.getElementById('adjHomeownerSearch');
    const hidden=document.getElementById('adjUserId');
    const results=document.getElementById('adjHomeownerResults');
    const noMatch=document.getElementById('adjHomeownerNoMatch');
    if(!input || !hidden || !results) return;

    if(hidden.value && input.value !== (input.dataset.selectedLabel || '')){
        hidden.value='';
        document.getElementById('adjSelectedHomeowner')?.setAttribute('hidden','');
    }

    const query=duesLookupNormalize(input.value);
    const options=Array.from(results.querySelectorAll('.homeowner-search-result'));
    if(!query){
        options.forEach(option=>option.hidden=true);
        if(noMatch) noMatch.hidden=true;
        results.hidden=true;
        return;
    }

    let shown=0;
    options.forEach(option=>{
        const match=duesLookupNormalize(option.dataset.search).includes(query);
        const visible=match && shown < 8;
        option.hidden=!visible;
        if(visible) shown+=1;
    });
    if(noMatch) noMatch.hidden=shown!==0;
    results.hidden=false;
}

function selectAdjustmentHomeowner(option){
    const input=document.getElementById('adjHomeownerSearch');
    const hidden=document.getElementById('adjUserId');
    const results=document.getElementById('adjHomeownerResults');
    const card=document.getElementById('adjSelectedHomeowner');
    if(!option || !input || !hidden) return;
    const name=option.dataset.name || 'Homeowner';
    const publicId=option.dataset.publicId || 'No Homeowner ID';
    const property=option.dataset.property || '';
    const outstanding=Number(option.dataset.outstanding || 0);
    const unpaidMonths=Number(option.dataset.unpaidMonths || 0);
    const label=`${name} — ${publicId}`;
    hidden.value=option.dataset.userId || '';
    input.value=label;
    input.dataset.selectedLabel=label;
    clearInlineError(input);
    if(results) results.hidden=true;
    const nameEl=document.getElementById('adjSelectedHomeownerName');
    const metaEl=document.getElementById('adjSelectedHomeownerMeta');
    if(nameEl) nameEl.textContent=name;
    if(metaEl) metaEl.textContent=`${publicId}${property ? ` · ${property}` : ''}`;
    const balanceEl=document.getElementById('adjSelectedHomeownerBalance');
    if(balanceEl) balanceEl.textContent=unpaidMonths>0 ? `Current outstanding: ${unpaidMonths} month${unpaidMonths===1?'':'s'} · ₱${outstanding.toFixed(2)}` : 'No currently outstanding monthly dues';
    if(card) card.hidden=false;
}

function clearAdjustmentHomeowner(){
    const input=document.getElementById('adjHomeownerSearch');
    const hidden=document.getElementById('adjUserId');
    const results=document.getElementById('adjHomeownerResults');
    if(input){ input.value=''; delete input.dataset.selectedLabel; input.focus(); clearInlineError(input); }
    if(hidden) hidden.value='';
    if(results) results.hidden=true;
    document.getElementById('adjSelectedHomeowner')?.setAttribute('hidden','');
    const balanceEl=document.getElementById('adjSelectedHomeownerBalance'); if(balanceEl) balanceEl.textContent='—';
}

async function submitAdjustment(){
    const searchInput=document.getElementById('adjHomeownerSearch');
    const userId=document.getElementById('adjUserId')?.value || '';
    const monthsInput=document.getElementById('adjMissing');
    const endMonthInput=document.getElementById('adjEndMonth');
    const reasonInput=document.getElementById('adjReason');
    const missingMonths=monthsInput?.value || '';
    const endMonth=endMonthInput?.value || '';
    const proposed=document.getElementById('adjProposed')?.value || '';
    clearInlineError(searchInput); clearInlineError(monthsInput); clearInlineError(endMonthInput); clearInlineError(reasonInput);
    if(!userId){ showInlineError(searchInput,'Search for and select a homeowner by name or Homeowner ID.'); searchInput?.focus(); return; }
    if(!endMonth){ showInlineError(endMonthInput,'Select the latest month included in the missing-dues period.'); endMonthInput?.focus(); return; }
    if(!missingMonths || parseInt(missingMonths,10)<=0){ showInlineError(monthsInput,'Please enter a valid number of missing months.'); monthsInput?.focus(); return; }
    if((reasonInput?.value || '').trim().length < 3){ showInlineError(reasonInput,'Please provide a short reason for the missing dues entry.'); reasonInput?.focus(); return; }
    const homeowner=document.getElementById('adjSelectedHomeownerName')?.textContent || 'Selected homeowner';
    const homeownerMeta=document.getElementById('adjSelectedHomeownerMeta')?.textContent || '';
    const period=document.getElementById('adjPeriodPreviewText')?.textContent || '—';
    const ok=await showConfirmModal({
        title:'Apply Missing Monthly Dues',
        message:'Record these missing monthly dues and notify the homeowner?',
        confirmText:'Apply Missing Dues',
        type:'primary',
        context:[{label:'Homeowner',value:homeowner},{label:'Homeowner ID / Property',value:homeownerMeta},{label:'Missing Period',value:period},{label:'Missing Months',value:missingMonths},{label:'Total',value:proposed ? `₱${Number(proposed).toFixed(2)}` : ''}]
    });
    if(!ok) return;
    window.NFHLoading?.show('Applying missing monthly dues…');
    fetch('/api/treasurer/adjustment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        user_id:userId,monthly_due:document.getElementById('adjMonthlyDue').value,missing_months:missingMonths,end_month:endMonth,
        proposed_adjustment:proposed,reason:reasonInput?.value || ''
    })})
    .then(async r=>{const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||'Unable to apply missing dues.'); return d;})
    .then(d=>{ if(d.status==='success'){showToast(d.message||'Missing dues recorded.','success');setTimeout(()=>location.reload(),700);} else showToast(d.message||'Unable to apply missing dues.','error'); })
    .catch(e=>showToast(e.message||'Unable to apply missing dues.','error'))
    .finally(()=>window.NFHLoading?.hide());
}

function initSystemFeedback(){
    (window.SERVER_FLASH_MESSAGES || []).forEach(item=>showToast(item.message,item.category==='success'?'success':item.category==='error'?'error':item.category==='warning'?'warning':'info'));
    document.getElementById('systemConfirmCancel')?.addEventListener('click',()=>closeSystemConfirm(false));
    document.getElementById('systemConfirmButton')?.addEventListener('click',confirmSystemAction);
    document.getElementById('systemConfirmModal')?.addEventListener('click',e=>{if(e.target===e.currentTarget) closeSystemConfirm(false);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && document.getElementById('systemConfirmModal')?.classList.contains('show')){e.preventDefault();closeSystemConfirm(false);}});
    document.querySelectorAll('form[data-system-confirm]').forEach(form=>form.addEventListener('submit',async e=>{
        if(form.dataset.confirmed==='true') return;
        e.preventDefault();
        const submitter=e.submitter;
        const ok=await showConfirmModal({title:form.dataset.confirmTitle||'Confirm Action',message:form.dataset.systemConfirm,confirmText:form.dataset.confirmText||submitter?.textContent?.trim()||'Confirm',type:form.dataset.confirmType||'primary'});
        if(!ok) return;
        mirrorSubmitter(form,submitter);
        form.dataset.confirmed='true';
        form.submit();
    }));
}
document.addEventListener('DOMContentLoaded',()=>{
    initSystemFeedback();
    const endMonth=document.getElementById('adjEndMonth');
    if(endMonth && !endMonth.value){const d=new Date();endMonth.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;endMonth.max=endMonth.value;calculateAdjustment();}
});

// Lightweight role-aware live metrics. Keeps the existing Flask/MySQL architecture.
async function refreshLiveMetrics(){
  try{
    const res=await fetch('/api/live-metrics',{headers:{'Accept':'application/json'},cache:'no-store'});
    if(!res.ok)return; const data=await res.json(); if(data.status!=='success')return;
    document.querySelectorAll('[data-metric]').forEach(el=>{
      const key=el.dataset.metric; if(!(key in data.metrics))return;
      const raw=data.metrics[key] ?? 0;
      const next=el.dataset.currency==='true' ? `₱${Number(raw||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : String(raw);
      if(el.classList.contains('nav-count-badge')) el.hidden=Number(raw||0) <= 0;
      if(el.textContent.trim()!==next){el.textContent=next;el.classList.remove('metric-updated');void el.offsetWidth;el.classList.add('metric-updated');}
    });
  }catch(e){console.debug('Live metrics unavailable',e);}
}
refreshLiveMetrics(); setInterval(refreshLiveMetrics,10000);

function closeAccountMenus(){
  document.querySelectorAll('.account-dropdown').forEach(menu=>menu.setAttribute('hidden',''));
  document.querySelectorAll('.account-menu-button').forEach(btn=>btn.setAttribute('aria-expanded','false'));
}
function toggleAccountMenu(btn){
  const menu=btn.parentElement.querySelector('.account-dropdown');
  if(!menu)return;
  const opening=menu.hasAttribute('hidden');
  closeAccountMenus();
  if(opening){menu.removeAttribute('hidden');btn.setAttribute('aria-expanded','true');}
}
function openAccountProfile(){closeAccountMenus();openModal('accountProfileModal')}
document.addEventListener('click',e=>{if(!e.target.closest('.account-menu-wrap'))closeAccountMenus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=document.querySelector('.account-menu-button[aria-expanded=\"true\"]');closeAccountMenus();open?.focus();}});

document.addEventListener('click', (event) => {
  const jump=event.target.closest('[data-tab-jump]'); if(!jump)return;
  const target=jump.dataset.tabJump; const nav=document.querySelector(`.sidebar .nav-item[data-tab="${target}"]`);
  if(nav){nav.click(); window.scrollTo({top:0,behavior:'smooth'});}
});

function settleMonthlyDuesFromButton(button){
    if(!button) return;
    return settleMonthlyDues(
        button.dataset.duesUserId,
        button.dataset.duesHomeowner,
        button.dataset.duesHomeownerId,
        Number(button.dataset.duesMissing || 0),
        Number(button.dataset.duesTotal || 0),
        button.dataset.duesOldest || '',
        button.dataset.duesPeriods || ''
    );
}

async function settleMonthlyDues(userId, homeowner, homeownerId, missingMonths, total, oldestDue, periods){
    if(!userId){ showToast('Unable to identify the selected homeowner.','error'); return; }
    const ok=await showConfirmModal({
        title:'Confirm Monthly Dues Clearance',
        message:'Confirm that the Treasurer has already received the actual face-to-face cash payment for all currently outstanding monthly dues before marking this homeowner as paid.',
        confirmText:'Confirm Payment',
        type:'primary',
        context:[
            {label:'Homeowner',value:homeowner || 'Selected homeowner'},
            {label:'Homeowner ID',value:homeownerId || '—'},
            {label:'Missing Months',value:String(missingMonths || 0)},
            {label:'Outstanding Periods',value:periods || oldestDue || '—'},
            {label:'Outstanding Amount',value:`₱${Number(total || 0).toFixed(2)}`},
            {label:'Oldest Unpaid Due',value:oldestDue || '—'}
        ]
    });
    if(!ok) return;
    window.NFHLoading?.show('Clearing outstanding monthly dues…');
    try{
        const res=await fetch('/api/treasurer/settle-dues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:userId})});
        const data=await res.json().catch(()=>({}));
        if(!res.ok || data.status!=='success'){ showToast(data.message || 'Unable to update monthly dues.','error'); return; }
        showToast(data.message,'success');
        setTimeout(()=>window.location.reload(),700);
    }catch(err){ showToast('Connection error while updating monthly dues.','error'); }finally{ window.NFHLoading?.hide(); }
}

window.filterAdjustmentHomeowners=filterAdjustmentHomeowners;
window.selectAdjustmentHomeowner=selectAdjustmentHomeowner;
window.clearAdjustmentHomeowner=clearAdjustmentHomeowner;
window.submitAdjustment=submitAdjustment;
window.settleMonthlyDues=settleMonthlyDues;
window.settleMonthlyDuesFromButton=settleMonthlyDuesFromButton;

function localIsoDate(){
    const d=new Date();
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
}
function openPaymentVerificationModal(reqId){
    const req=typeof ALL_REQUESTS!=='undefined' ? ALL_REQUESTS.find(r=>String(r.id)===String(reqId)) : null;
    const form=document.getElementById('paymentVerificationForm');
    if(!form || !req){ showToast('Unable to open payment and release for this request.','error'); return; }
    if(!['Ready for Payment & Release','Approved','Awaiting Payment Verification'].includes(req.status) || req.payment_status!=='Unpaid'){
        showToast('This request is not currently ready for face-to-face payment and release. Refresh the page to see its latest status.','warning'); return;
    }
    form.action='/officer/update_payment/'+encodeURIComponent(req.id);
    form.dataset.requestId=req.id; form.dataset.submitting='false';
    form.querySelectorAll('button[type="submit"]').forEach(btn=>{btn.disabled=false;if(btn.dataset.originalText){btn.textContent=btn.dataset.originalText;delete btn.dataset.originalText;}});
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value ?? '—';};
    set('paymentVerifyReqId',req.id); set('paymentVerifyHomeowner',req.homeowner||'—'); set('paymentVerifyType',req.request_type||'—');
    set('paymentVerifyAmount',`₱${Number(req.fee||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`);
    const orNo=document.getElementById('paymentVerifyOR'), date=document.getElementById('paymentVerifyDate'), released=document.getElementById('paymentDocumentReleased'), remarks=document.getElementById('paymentReleaseRemarks'), error=document.getElementById('paymentVerificationError');
    if(orNo)orNo.value=''; if(date)date.value=localIsoDate(); if(released)released.checked=true; if(remarks)remarks.value=''; if(error){error.hidden=true;error.textContent='';}
    const previewBtn=document.getElementById('paymentPreviewDocumentBtn'), downloadBtn=document.getElementById('paymentDownloadDocumentBtn');
    const syncDocumentLinks=()=>{
        const issueDate=date?.value || localIsoDate();
        const base=`/requests/${encodeURIComponent(req.id)}/document.pdf`;
        if(previewBtn)previewBtn.href=`${base}?issue_date=${encodeURIComponent(issueDate)}`;
        if(downloadBtn){downloadBtn.href=`${base}?download=1&issue_date=${encodeURIComponent(issueDate)}`;downloadBtn.setAttribute('download','');}
    };
    date?.addEventListener('change',syncDocumentLinks); syncDocumentLinks();
    const validity=document.getElementById('paymentStickerValidityFields'), from=document.getElementById('paymentStickerValidFrom'), until=document.getElementById('paymentStickerValidUntil');
    const isVehicle=req.request_type==='Vehicle Sticker Application'; if(validity)validity.hidden=!isVehicle;
    if(from&&until){from.required=isVehicle;until.required=isVehicle; if(isVehicle){const today=new Date();from.value=localIsoDate();until.value=`${today.getFullYear()}-12-31`;if(new Date(until.value)<today)until.value=`${today.getFullYear()+1}-12-31`;}else{from.value='';until.value='';}}
    const sync=()=>{const releasing=released?.checked!==false; if(validity)validity.hidden=!(isVehicle&&releasing); if(from)from.required=isVehicle&&releasing; if(until)until.required=isVehicle&&releasing;};
    released?.addEventListener('change',sync,{once:false}); sync(); openModal('paymentVerificationModal'); setTimeout(()=>date?.focus(),0);
}
async function submitPaymentVerification(event){
    event.preventDefault(); const form=event.currentTarget, submitter=event.submitter;
    const date=document.getElementById('paymentVerifyDate'), released=document.getElementById('paymentDocumentReleased'), orNo=document.getElementById('paymentVerifyOR'), error=document.getElementById('paymentVerificationError');
    if(!date?.value){if(error){error.textContent='Select the actual cash payment date.';error.hidden=false;}date?.focus();return false;}
    if(error){error.hidden=true;error.textContent='';}
    const reqId=form.dataset.requestId || document.getElementById('paymentVerifyReqId')?.textContent || '';
    const amount=document.getElementById('paymentVerifyAmount')?.textContent || '';
    const releaseNow=released?.checked!==false;
    const ok=await showConfirmModal({title:releaseNow?'Confirm Payment & Release':'Confirm Payment Only',message:releaseNow?'Confirm that the cash payment was received AND the prepared document was physically handed to the homeowner during this face-to-face transaction?':'Confirm that the cash payment was received, but the document was NOT yet released?',confirmText:releaseNow?'Yes, Complete Transaction':'Record Payment Only',type:'primary',context:[{label:'Request ID',value:reqId},{label:'Amount',value:amount},{label:'Payment',value:'Cash'},{label:'Document Released',value:releaseNow?'Yes':'No'},{label:'Existing OR No.',value:(orNo?.value||'').trim()||'Not provided'}]});
    if(!ok)return false; if(!lockWorkflowSubmit(form,submitter))return false; window.NFHLoading?.show(releaseNow?'Recording payment and release…':'Recording payment…'); form.submit(); return false;
}
document.addEventListener('click',event=>{const btn=event.target.closest('[data-payment-request-id]');if(btn)openPaymentVerificationModal(btn.dataset.paymentRequestId);});
window.openPaymentVerificationModal=openPaymentVerificationModal; window.submitPaymentVerification=submitPaymentVerification;


// Compact Ready for Release workflow. The queue stays inside the Officer Overview;
// the modal keeps the issuance action connected without creating another full-page view.
function openIssueModal(reqId, homeowner, requestType, paidRelease=false){
    const form=document.getElementById('issueRequestForm');
    if(!form || !reqId){ showToast('Unable to open the issuance form.','error'); return; }
    form.action=(paidRelease?'/officer/complete_release/':'/officer/issue_request/')+encodeURIComponent(reqId);
    form.dataset.confirmed='false';
    const idEl=document.getElementById('issueRequestId');
    const homeownerEl=document.getElementById('issueHomeowner');
    const typeEl=document.getElementById('issueRequestType');
    const remarks=document.getElementById('issueReleaseRemarks');
    const validity=document.getElementById('stickerValidityFields');
    const validFrom=document.getElementById('stickerValidFrom');
    const validUntil=document.getElementById('stickerValidUntil');
    if(idEl) idEl.textContent=reqId;
    if(homeownerEl) homeownerEl.textContent=homeowner || '—';
    if(typeEl) typeEl.textContent=requestType || '—';
    if(remarks) remarks.value='';
    const isVehicle=requestType==='Vehicle Sticker Application';
    if(validity) validity.hidden=!isVehicle;
    [validFrom,validUntil].forEach(input=>{ if(input){ input.required=isVehicle; if(!isVehicle) input.value=''; } });
    if(isVehicle && validFrom && validUntil){
        const today=new Date();
        const yyyy=today.getFullYear();
        validFrom.value=today.toISOString().slice(0,10);
        validUntil.value=`${yyyy}-12-31`;
        if(new Date(validUntil.value)<today){ validUntil.value=`${yyyy+1}-12-31`; }
    }
    openModal('issueRequestModal');
    setTimeout(()=>remarks?.focus(),0);
}

document.addEventListener('click',event=>{
    const paid=event.target.closest('[data-paid-release-id]');
    if(paid){openIssueModal(paid.dataset.paidReleaseId,paid.dataset.issueHomeowner,paid.dataset.issueType,true);return;}
    const btn=event.target.closest('[data-issue-request-id]');
    if(!btn) return;
    openIssueModal(btn.dataset.issueRequestId,btn.dataset.issueHomeowner,btn.dataset.issueType,false);
});


async function nfhUploadAccountImage(input, endpoint, kind){
  const file=input?.files?.[0]; if(!file)return;
  const data=new FormData(); data.append('file',file);
  window.NFHLoading?.show(`Updating ${kind}…`);
  try{
    const res=await fetch(endpoint,{method:'POST',body:data}); const payload=await res.json();
    if(!res.ok||payload.status!=='success'){showToast(payload.message||`Unable to update ${kind}.`,'error');return;}
    showToast(payload.message||`${kind} updated.`,'success');
    if(kind==='profile picture'){
      const url=payload.image_url;
      const preview=document.getElementById('accountPhotoPreview'); if(preview)preview.innerHTML=`<img src="${url}?v=${Date.now()}" alt="Current profile picture">`;
      ['headerProfileImage','dropdownProfileImage'].forEach(id=>{let img=document.getElementById(id);if(img){img.src=`${url}?v=${Date.now()}`;}else{const parent=id.startsWith('header')?document.querySelector('.account-avatar'):document.querySelector('.account-dropdown-avatar');if(parent)parent.innerHTML=`<img src="${url}?v=${Date.now()}" alt="" class="account-avatar-img" id="${id}">`;}});
    }else{
      const preview=document.getElementById('accountESignPreview'); if(preview)preview.innerHTML=`<img src="${payload.preview_url}?v=${Date.now()}" alt="Current e-signature">`;
      const remove=document.getElementById('removeESignBtn'); if(remove)remove.hidden=false;
    }
  }catch(err){showToast(`Connection error while updating ${kind}.`,'error');}
  finally{window.NFHLoading?.hide();input.value='';}
}
async function nfhRemoveESignature(){
  const ok=typeof showConfirmModal==='function'?await showConfirmModal({title:'Remove E-Signature',message:'Remove your current e-signature? Future documents that require your role will not show a signature until you upload a new one.',confirmText:'Remove',type:'danger'}):window.confirm('Remove current e-signature?');
  if(!ok)return;
  window.NFHLoading?.show('Removing e-signature…');
  try{const res=await fetch('/api/account/esign',{method:'DELETE'});const data=await res.json();if(!res.ok||data.status!=='success'){showToast(data.message||'Unable to remove e-signature.','error');return;}showToast(data.message,'success');const preview=document.getElementById('accountESignPreview');if(preview)preview.innerHTML='<span class="esign-empty"><i class="fa-solid fa-signature"></i> No e-signature uploaded</span>';document.getElementById('removeESignBtn').hidden=true;}catch(e){showToast('Connection error while removing e-signature.','error');}finally{window.NFHLoading?.hide();}
}
function initAccountMediaControls(){
  const profile=document.getElementById('officerProfilePhotoInput')||document.getElementById('adminProfilePhotoInput');
  const esign=document.getElementById('officerESignInput')||document.getElementById('adminESignInput');
  if(profile&&!profile.dataset.ready){profile.dataset.ready='1';profile.addEventListener('change',()=>nfhUploadAccountImage(profile,'/api/profile/photo','profile picture'));}
  if(esign&&!esign.dataset.ready){esign.dataset.ready='1';esign.addEventListener('change',()=>nfhUploadAccountImage(esign,'/api/account/esign','e-signature'));}
  const remove=document.getElementById('removeESignBtn');if(remove&&!remove.dataset.ready){remove.dataset.ready='1';remove.addEventListener('click',nfhRemoveESignature);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAccountMediaControls);else initAccountMediaControls();

async function saveOfficerAdminPassword(event){
    event?.preventDefault();
    const current=document.getElementById('accountCurrentPassword')?.value||'';
    const next=document.getElementById('accountNewPassword')?.value||'';
    const confirm=document.getElementById('accountConfirmPassword')?.value||'';
    if(!current||!next||!confirm){showToast('Complete all password fields.','warning');return false;}
    if(next.length<8){showToast('New password must be at least 8 characters.','warning');return false;}
    if(next!==confirm){showToast('New password and confirmation do not match.','warning');return false;}
    window.NFHLoading?.show('Updating password…');
    try{
        const response=await fetch('/api/settings/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current_password:current,new_password:next,confirm_password:confirm})});
        const result=await response.json();
        if(!response.ok||result.status!=='success'){showToast(result.message||'Unable to update password.','error');return false;}
        document.getElementById('accountSecurityForm')?.reset(); closeModal('accountSecurityModal'); showToast('Password changed successfully.','success');
    }catch(err){console.error(err);showToast('Unable to update password right now.','error');}finally{window.NFHLoading?.hide();}
    return false;
}


document.addEventListener('click', event => {
    const group=event.target.closest('.homeowner-lookup-group');
    if(!group){ const results=document.getElementById('adjHomeownerResults'); if(results) results.hidden=true; }
});
