export function initCompactLayout({getCurrent,onOpen}) {
  const $=id=>document.getElementById(id);
  const details=$('step-details-panel');
  let selectedView=0,opener;
  function renderDetails() {
    const current=getCurrent(),view=current?.views[selectedView];
    if(!view)return;
    $('step-details-phase').textContent=view.phase.title;
    $('step-details-title').textContent=view.caption.title;
    $('step-details-count').textContent=`STEP ${view.step} / ${view.phase.stages.length}`;
    $('step-details-description').textContent=view.caption.description;
    const option=current.chapter.comparison?.options.find(o=>o.phaseId===view.phase.id);
    $('step-details-option').hidden=!option;
    if(option){$('step-details-option-title').textContent=option.label+' — '+option.title;$('step-details-option-description').textContent=option.description;}
  }
  document.querySelectorAll('[data-step-details]').forEach(button=>button.addEventListener('click',()=>{
    if(!getCurrent())return;
    onOpen();opener=button;selectedView=Number(button.dataset.stepDetails);renderDetails();details.showModal();
  }));
  $('close-step-details').addEventListener('click',()=>details.close());
  details.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  details.addEventListener('click',e=>{
    if(e.target!==details)return;
    const box=details.getBoundingClientRect();
    if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)details.close();
  });
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{
    $(button.dataset.command).click();
    $('settings-panel').close();
  }));
  const rotate=$('rotate');
  new MutationObserver(()=>document.querySelector('[data-command="rotate"]').setAttribute('aria-pressed',rotate.getAttribute('aria-pressed'))).observe(rotate,{attributes:true,attributeFilter:['aria-pressed']});
  window.addEventListener('wbp:statechange',()=>{if(details.open)renderDetails()});
}
