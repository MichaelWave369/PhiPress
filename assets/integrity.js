import {
 CATEGORIES,MAX_ASSETS,MAX_BYTES,
 createManifest,validateManifest,verifySelection,auditReferences,
 evaluateUncertaintyBudget
} from '../src/integrity.mjs';
import { MEASURES,validateRegistry } from '../src/observations.mjs';
const $=id=>document.getElementById(id);
let importedC09=null,localAssets=[],savedManifest=null,assetManifest=null,
 fileAudit=null,referenceAudit=null,uncertainty=null,error='';
const fmt=(value,d=3)=>Number(value).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:d});
const bytesToHex=buffer=>[...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,'0')).join('');
function exportFile(filename,body){
 const blob=new Blob([body],{type:'application/json'}),
   uri=URL.createObjectURL(blob),a=document.createElement('a');
 a.download=filename;a.href=uri;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(uri),1000);
}
function readFile(id,onSuccess){
 const input=$(id),file=input.files?.[0];
 if(!file)return;
 (async()=>{
  if(file.size>4_000_000)throw new Error('JSON import exceeds 4 MB');
  await onSuccess(JSON.parse(await file.text()));
  error='';
 })().catch(e=>{error=e.message;})
 .finally(()=>{input.value='';render();});
}
$('c09-file').addEventListener('change',()=>readFile('c09-file',async data=>{
 if(data.schema!=='phipress.e0.audit-export.v0.9'||!data.maskedRoster?.rows
   ||!data.registry||!Array.isArray(data.events))
  throw new Error('Expected complete JSON audit exported by ΦPRESS C0.9');
 const registry=validateRegistry(data.registry);
 if(!registry.ok)throw new Error('Registry invalid: '+registry.errors.slice(0,4).join(' | '));
 importedC09={roster:data.maskedRoster,registry,events:data.events};
}));
$('manifest-file').addEventListener('change',()=>readFile('manifest-file',async data=>{
 const checked=validateManifest(data);
 if(!checked.ok)throw new Error(checked.errors.join(' | '));
 savedManifest=checked.manifest;
 for(const a of localAssets){
  const item=savedManifest.entries.find(x=>x.filename===a.filename);
  if(item){a.reference_id=item.reference_id;a.category=item.category;}
 }
 renderAssets(); 
}));
$('raw-files').addEventListener('change',()=>{
 const input=$('raw-files'),files=[...(input.files||[])];
 (async()=>{
  if(!crypto?.subtle)throw new Error('Secure context required for Web Crypto SHA-256');
  if(files.length>MAX_ASSETS)throw new Error('Maximum '+MAX_ASSETS+' files at a time');
  if(files.some(f=>f.size>MAX_BYTES))throw new Error('One or more files exceed 32 MiB');
  if(files.reduce((sum,f)=>sum+f.size,0)>96*1024*1024)throw new Error('Total input exceeds 96 MiB');
  const assets=[];
  for(const file of files){
   const hash=bytesToHex(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()));
   assets.push({filename:file.name,reference_id:file.name,category:'raw',bytes:file.size,sha256:hash});
  }
  const existing=savedManifest?.entries||[];
  for(const a of assets){
   const match=existing.find(x=>x.filename===a.filename);
   if(match){a.reference_id=match.reference_id;a.category=match.category;}
  }
  localAssets=assets;
  error='';
  renderAssets();render();
 })().catch(e=>{error=e.message;render();})
 .finally(()=>{input.value='';});
});
function renderAssets(){
 const body=$('asset-rows');body.replaceChildren();
 if(!localAssets.length){
  const tr=document.createElement('tr'),td=document.createElement('td');
  td.colSpan=3;td.textContent='No files selected. Select files to hash their contents locally.';
  tr.append(td);body.append(tr);return;
 }
 for(const asset of localAssets){
  const tr=document.createElement('tr'),desc=document.createElement('td'),
    refCell=document.createElement('td'),catCell=document.createElement('td'),
    ref=document.createElement('input'),cat=document.createElement('select');
  const name=document.createElement('strong');name.className='asset-filename';name.textContent=asset.filename;
  const hash=document.createElement('small');hash.className='asset-digest';
  hash.textContent=fmt(asset.bytes,0)+' bytes · SHA-256 '+asset.sha256;
  desc.append(name,hash);
  ref.value=asset.reference_id;ref.maxLength=120;ref.setAttribute('aria-label','Reference ID for '+asset.filename);
  ref.addEventListener('input',()=>{
   asset.reference_id=ref.value;savedManifest=null;render();
  });
  for(const c of CATEGORIES){
   const option=document.createElement('option');option.value=c;option.textContent=c;
   cat.append(option);
  }
  cat.value=asset.category;cat.setAttribute('aria-label','Evidence role for '+asset.filename);
  cat.addEventListener('change',()=>{asset.category=cat.value;savedManifest=null;render();});
  refCell.append(ref);catCell.append(cat);tr.append(desc,refCell,catCell);body.append(tr);
 }
}
function render(){
 const errors=[];
 if(error)errors.push(error);
 $('source-status').textContent=importedC09?
  importedC09.events.length+' C0.9 event rows, '+importedC09.roster.rows.length+' planned specimens. All declarations unverified.':
  'No C0.9 observation audit imported';
 $('file-status').textContent=localAssets.length?
  localAssets.length+' local files hashed with SHA-256; raw contents remain on device.':
  'No files selected; no digests computed.';
 $('manifest-status').textContent=savedManifest?
  'Saved manifest loaded. Rechecking its digests against local file bytes.':
  'No saved manifest; local manifest is newly self-assembled (not independently authenticated).';
 try{assetManifest=createManifest(localAssets);}
 catch(e){assetManifest=null;errors.push('Invalid file inventory: '+e.message);}
 $('export-manifest').disabled=!assetManifest||!localAssets.length;
 $('asset-issues').textContent=assetManifest?
  localAssets.length+' unique assets · self-assembled digest catalog':
  'Invalid or incomplete file catalog.';
 fileAudit=savedManifest?verifySelection(savedManifest,localAssets):null;
 $('verify-status').textContent=fileAudit?
  fileAudit.ok?'BYTE MATCH CONFIRMED':'FILE MISMATCH':'NO SAVED MANIFEST';
 $('verify-status').classList.toggle('passed',!!fileAudit?.ok);
 $('verify-detail').textContent=fileAudit?
  fileAudit.matched+'/'+fileAudit.required+' saved entries match file names, sizes, and SHA-256 bytes. This is not provenance authentication.':
  'Export a new local manifest, preserve it externally, then reimport that saved copy with the original files to check byte integrity.';
 if(fileAudit&&!fileAudit.ok)errors.push(...fileAudit.errors);
 if(importedC09&&assetManifest){
  referenceAudit=auditReferences({
   manifest:savedManifest||assetManifest,
   roster:importedC09.roster,registry:importedC09.registry,
   events:importedC09.events
  });
  $('link-status').textContent=referenceAudit.readyInModel?'ALL LINKS PRESENT':'MISSING / INVALID LINKS';
  $('link-status').classList.toggle('passed',referenceAudit.readyInModel);
  $('link-detail').textContent=referenceAudit.observationLedger.completedSpecimens+
   '/'+referenceAudit.observationLedger.totalPlanned+' specimens have all required channels. '+ 
   referenceAudit.references.length+' evidence references examined. All values remain unverified.';
  if(!referenceAudit.readyInModel)errors.push(...referenceAudit.errors);
 }else{
  referenceAudit=null;
  $('link-status').textContent='NOT ENOUGH INPUTS';
  $('link-status').classList.remove('passed');
  $('link-detail').textContent='Need C0.9 audit JSON and locally hashed source files.';
 }
 if(!importedC09)errors.push('Import the C0.9 audit to inspect measurement-source links.');
 if(!localAssets.length)errors.push('Select evidence files. None are fabricated by this page.');
 $('error-rows').replaceChildren(...[...new Set(errors)].slice(0,30).map(message=>{
  const li=document.createElement('li');li.textContent=message;return li;
 }));
 if(errors.length>30){
  const li=document.createElement('li');li.textContent=(errors.length-30)+' more errors are retained in the exported review receipt.';$('error-rows').append(li);
 }
}
function getBudgetInput(){
 const measurement=$('measure').value,unit=MEASURES[measurement].unit;
 const components=[
  ['A','repeatability',1],
  ['B','calibration',2],
  ['B','blank correction',3],
  ['B','resolution',4]
 ].map(([kind,name,i])=>({
  kind,name,standard:$('component-'+i).value===''?NaN:Number($('component-'+i).value),
  reference_id:$('reference-'+i).value.trim()
 }));
 return {measurement,unit,reportedStandard:$('reported-u').value===''?NaN:Number($('reported-u').value),components};
}
function renderBudget(){
 uncertainty=evaluateUncertaintyBudget(getBudgetInput());
 const u=uncertainty,unit=u.input.unit;
 $('combined-u').textContent=fmt(u.combinedStandard,5)+' '+unit;
 $('expanded-u').textContent=fmt(u.expandedK2,5)+' '+unit;
 $('agree-u').textContent=u.reportedConsistent?'MATCHES MODEL':'DOES NOT MATCH';
 $('refs-u').textContent=u.documentedByUser?'DECLARED':'MISSING';
 $('unc-provenance').textContent=u.documentedByUser?
  'USER-DECLARED REFERENCES · NOT AUTHENTICATED':'EXAMPLE / INCOMPLETE SOURCES · NOT VERIFIED';
 $('unc-errors').replaceChildren(...[...u.errors,...u.issues].map(message=>{
  const li=document.createElement('li');li.textContent=message;return li;
 }));
}
for(const name of Object.keys(MEASURES)){
 const opt=document.createElement('option');
 opt.value=name;opt.textContent=name+' ('+MEASURES[name].unit+')';$('measure').append(opt);
}
for(const id of ['measure','reported-u',...Array.from({length:4},(_,i)=>'component-'+(i+1)),...Array.from({length:4},(_,i)=>'reference-'+(i+1))])
 $(id).addEventListener('input',renderBudget);
$('export-uncertainty').addEventListener('click',()=>exportFile('phipress-C1-0-uncertainty-UNVERIFIED.json',JSON.stringify(uncertainty,null,2)));
$('export-manifest').addEventListener('click',()=>{
 if(assetManifest)exportFile('phipress-C1-0-SHA256-manifest.json',JSON.stringify(assetManifest,null,2));
});
$('export-review').addEventListener('click',()=>exportFile('phipress-C1-0-evidence-review-UNVERIFIED.json',JSON.stringify({
 schema:'phipress.e0.evidence-review.v1.0',
 warning:'This is user-supplied metadata; not authenticated measurement, calibration, safety or a timestamp.',
 manifest:savedManifest||assetManifest,
 localFiles:localAssets.map(({filename,sha256,bytes})=>({filename,sha256,bytes})),
 fileAudit,referenceAudit,uncertainty,
 origin:'LOCAL BROWSER / UNVERIFIED',
 withoutSourceBytes:true
},null,2)));
renderAssets();renderBudget();render();
