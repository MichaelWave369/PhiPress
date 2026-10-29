import {
 DEFAULT_STUDY,REQUIRED_READINESS,createPlan,planSummary,
 operatorCSV,assessorTemplateCSV,readinessChecklist,unblindCSV
} from '../src/study-plan.mjs';

const $=id=>document.getElementById(id);
let plan=null,merged=null;
const inputIDs=['studyId','fabric','soil','blocks','replicates','seed'];
const currentConfig=()=>({
 studyId:$('studyId').value.trim(),
 fabric:$('fabric').value.trim(),soil:$('soil').value.trim(),
 blocks:Number($('blocks').value),
 replicatesPerCondition:Number($('replicates').value),
 seed:Number($('seed').value)
});
function download(filename,content,type){
 const blob=new Blob([content],{type}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=filename;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function clearMerge(){
 merged=null;
 $('audit-status').textContent='NO MEASUREMENTS IMPORTED';
 $('audit-status').classList.remove('blocked');
 $('audit-detail').textContent='No physical data have been supplied.';
 $('export-unblinded').disabled=true;$('export-audit').disabled=true;
}
function refreshButtons(){
 const enabled=!!plan;
 for(const id of ['export-plan','export-key','export-sheet'])$(id).disabled=!enabled;
}
function preview(){
 const rows=plan?plan.assignments.slice(0,12):[];
 $('preview').replaceChildren(...rows.map(a=>{
  const tr=document.createElement('tr');
  for(const value of [a.trial_id,a.specimen_id,a.batch_id,String(a.order),'BLINDED']){
   const td=document.createElement('td');td.textContent=value;tr.append(td);
  }
  return tr;
 }));
}
function updatePlan(){
 const error=$('setup-error');error.hidden=true;
 try{
  plan=createPlan(currentConfig());
  const s=planSummary(plan);
  $('total').textContent=String(s.total);
  $('per-group').textContent=String(s.perCondition);
  $('block-count').textContent=String(s.blocks);
  clearMerge();refreshButtons();preview();
  $('fingerprint').textContent='Computing…';
  const currentPlan=plan;
  if(!crypto?.subtle){
   $('fingerprint').textContent='SHA-256 unavailable without secure browser context';
   return;
  }
  crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(plan)))
   .then(bytes=>{
    if(plan===currentPlan)$('fingerprint').textContent=
     [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
   })
   .catch(()=>{if(plan===currentPlan)$('fingerprint').textContent='SHA-256 unavailable';});
 }catch(e){
  plan=null;refreshButtons();preview();clearMerge();
  error.hidden=false;error.textContent=e.message;
  $('total').textContent='—';$('per-group').textContent='—';$('block-count').textContent='—';
  $('fingerprint').textContent='Not generated';
 }
}
$('study-form').addEventListener('submit',event=>{event.preventDefault();updatePlan();});
for(const id of inputIDs)$(id).addEventListener('input',()=>{
 plan=null;refreshButtons();preview();clearMerge();
 $('fingerprint').textContent='Parameters changed: regenerate allocation';
});
$('export-plan').addEventListener('click',()=>{
 if(!plan)return;
 download(plan.config.studyId+'-E0-plan.json',JSON.stringify(plan,null,2),'application/json');
});
$('export-key').addEventListener('click',()=>{
 if(!plan)return;
 download(plan.config.studyId+'-OPERATOR-KEY.csv',operatorCSV(plan),'text/csv;charset=utf-8');
});
$('export-sheet').addEventListener('click',()=>{
 if(!plan)return;
 download(plan.config.studyId+'-MASKED-ASSESSOR.csv',assessorTemplateCSV(plan),'text/csv;charset=utf-8');
});
function renderChecklist(){
 $('checklist').replaceChildren(...REQUIRED_READINESS.map(x=>{
  const label=document.createElement('label');
  const input=document.createElement('input');
  input.type='checkbox';input.id='check-'+x.id;
  input.addEventListener('change',refreshReadiness);
  const text=document.createElement('span');text.textContent=x.label;
  label.append(input,text);return label;
 }));
 refreshReadiness();
}
function refreshReadiness(){
 const flags=Object.fromEntries(REQUIRED_READINESS.map(x=>[x.id,$('check-'+x.id).checked]));
 const r=readinessChecklist(flags);
 const el=$('readiness-status');
 el.textContent=r.readyBySelfReport?'COMPLETE BY SELF-REPORT':'NOT READY';
 el.classList.toggle('blocked',!r.readyBySelfReport);
 $('readiness-desc').textContent=r.readyBySelfReport
  ?'All checklist items are claimed complete, but none were independently checked. This does not authorize equipment operation.'
  :'A protocol, calibration, safe materials, independent review and assessor separation remain necessary. Check only items actually completed.';
}
$('measured-file').addEventListener('change',async()=>{
 const file=$('measured-file').files?.[0];if(!file||!plan)return;
 try{
  if(file.size>2_000_000)throw new Error('File larger than 2 MB');
  const result=unblindCSV(plan,await file.text());
  const status=$('audit-status');
  if(!result.ok){
   merged=null;status.textContent='AUDIT REJECTED';status.classList.add('blocked');
   $('audit-detail').textContent=result.errors.slice(0,8).join(' | ')+(result.errors.length>8?' …':'');
  }else{
   merged=result;status.textContent='CONSISTENT IN MODEL';status.classList.remove('blocked');
   $('audit-detail').textContent=result.merged.length+' independently identified rows joined to the allocation. Values remain USER-SUPPLIED AND UNVERIFIED; this is not measured-evidence authentication.';
  }
  $('export-unblinded').disabled=!merged;
  $('export-audit').disabled=!merged;
 }catch(e){
  merged=null;$('audit-status').textContent='AUDIT ERROR';$('audit-status').classList.add('blocked');
  $('audit-detail').textContent=e.message;
  $('export-unblinded').disabled=true;$('export-audit').disabled=true;
 }finally{$('measured-file').value='';}
});
$('export-unblinded').addEventListener('click',()=>{
 if(!merged||!plan)return;
 download(plan.config.studyId+'-E0-UNVERIFIED.csv',merged.csv,'text/csv;charset=utf-8');
});
$('export-audit').addEventListener('click',()=>{
 if(!merged||!plan)return;
 download(plan.config.studyId+'-E0-audit.json',JSON.stringify({
  warning:'Unverified imported data. No trusted timestamp, calibration or safety approval.',
  plan,analysis:merged.analysis,joinedRows:merged.merged,
  readiness:readinessChecklist(Object.fromEntries(REQUIRED_READINESS.map(x=>[x.id,$('check-'+x.id).checked])))
 },null,2),'application/json');
});
renderChecklist();updatePlan();
