/**
 * ΦPRESS C1.0 — local file-integrity manifest and observation evidence audit.
 * SHA-256 proves byte equality to a stated digest, NOT independent provenance,
 * laboratory calibration, safety, timestamp validity, or physical measurement.
 *
 * This module is pure JavaScript: hashing happens separately in the browser
 * using Web Crypto. No remote storage, device control or network access.
 */
import { MEASURES, validateRegistry, inspectLedger } from './observations.mjs';

export const INTEGRITY_SCHEMA='phipress.e0.integrity-manifest.v1.0';
export const CATEGORIES=Object.freeze(['raw','blank','calibration','method','protocol','other']);
export const MAX_ASSETS=64;
export const MAX_BYTES=32*1024*1024;
const digestOk=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const idOk=x=>typeof x==='string'&&x.length>=1&&x.length<=120
  &&!/[\u0000-\u001f\u007f]/.test(x)&&x===x.trim();
const filenameOk=x=>typeof x==='string'&&x.length>=1&&x.length<=160
  &&x!=='.'&&x!=='..'&&!x.includes('..')&&x===x.trim()
  &&!/[/\\:\u0000-\u001f\u007f]/.test(x);
const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export function validateAssets(records){
 const errors=[],normalized=[],ids=new Set(),filenames=new Set();
 if(!Array.isArray(records)||records.length>MAX_ASSETS)
  return {ok:false,errors:['Asset count must be 0–'+MAX_ASSETS],entries:[]};
 for(const [i,r] of records.entries()){
  const label='Asset '+(i+1),bad=[];
  if(!r||typeof r!=='object'){errors.push(label+': invalid entry');continue;}
  const {reference_id,filename,category,bytes,sha256}=r;
  if(!idOk(reference_id)||ids.has(reference_id))bad.push('invalid or duplicate reference_id');
  if(!filenameOk(filename)||filenames.has(filename))bad.push('invalid or duplicate filename');
  if(!CATEGORIES.includes(category))bad.push('unknown category');
  if(!Number.isSafeInteger(bytes)||bytes<0||bytes>MAX_BYTES)bad.push('invalid file byte length');
  if(!digestOk(sha256))bad.push('invalid SHA-256 digest (lowercase 64-character hex required)');
  if(bad.length)errors.push(label+': '+bad.join(', '));
  else{
   ids.add(reference_id);filenames.add(filename);
   normalized.push({reference_id,filename,category,bytes,sha256});
  }
 }
 return {ok:errors.length===0,errors,entries:normalized};
}
export function createManifest(entries){
 const verified=validateAssets(entries);
 if(!verified.ok)throw new Error(verified.errors.join(' | '));
 return {
  schema:INTEGRITY_SCHEMA,
  status:'SELF-ASSEMBLED, NOT AUTHENTICATED',
  digestAlgorithm:'SHA-256',
  rootOfTrust:'NONE — external publication or witnessed preservation is required',
  entries:verified.entries.sort((a,b)=>a.reference_id.localeCompare(b.reference_id,'en'))
 };
}
export function validateManifest(obj){
 if(!obj||obj.schema!==INTEGRITY_SCHEMA)return {ok:false,errors:['Unknown manifest schema'],entries:[]};
 if(obj.digestAlgorithm!=='SHA-256')return {ok:false,errors:['Only SHA-256 supported'],entries:[]};
 const checked=validateAssets(obj.entries);
 return {...checked,manifest:checked.ok?createManifest(checked.entries):null};
}
/**
 * Recheck locally selected files against a saved manifest. This requires the
 * browser to hash those file bytes freshly. A filename match alone never passes.
 */
export function verifySelection(manifest,hashedLocalFiles){
 const m=validateManifest(manifest);
 const errors=m.ok?[]:m.errors.slice();
 if(!Array.isArray(hashedLocalFiles))return {ok:false,errors:['Local files must be supplied'],matched:0,required:0};
 const actual=validateAssets(hashedLocalFiles.map(x=>({
  reference_id:x.filename,filename:x.filename,category:'other',bytes:x.bytes,sha256:x.sha256
 })));
 if(!actual.ok)errors.push(...actual.errors);
 if(!m.ok||!actual.ok)return {ok:false,errors,matched:0,required:m.entries.length};
 const byFilename=new Map(actual.entries.map(x=>[x.filename,x]));
 let matched=0;
 for(const entry of m.entries){
  const found=byFilename.get(entry.filename);
  if(!found)errors.push('Missing file for '+entry.reference_id+': '+entry.filename);
  else{
   if(found.bytes!==entry.bytes)errors.push('Byte length mismatch for '+entry.filename);
   if(found.sha256!==entry.sha256)errors.push('SHA-256 mismatch for '+entry.filename);
   if(found.bytes===entry.bytes&&found.sha256===entry.sha256)matched++;
  }
 }
 for(const file of actual.entries)
  if(!m.entries.some(e=>e.filename===file.filename))errors.push('Unexpected local file '+file.filename);
 return {ok:errors.length===0,errors,matched,required:m.entries.length};
}
export function auditReferences({manifest,roster,registry,events}={}){
 const manifestResult=validateManifest(manifest);
 const errors=manifestResult.ok?[]:manifestResult.errors.slice();
 const audit=inspectLedger(events??[],registry??validateRegistry(null),roster??null);
 if(audit.errors.length)errors.push(...audit.errors);
 const byRef=new Map((manifestResult.entries||[]).map(x=>[x.reference_id,x]));
 const needed=new Map();
 function expect(ref,category,location){
  if(typeof ref!=='string'||!ref.trim())return;
  const entry=byRef.get(ref);
  const key=category+'|'+ref;
  const use=needed.get(key)||{reference_id:ref,category,uses:[]};
  use.uses.push(location);needed.set(key,use);
  if(!entry)errors.push('Missing '+category+' asset for '+location+': '+ref);
  else if(entry.category!==category)errors.push('Wrong category for '+location+': '+ref+' requires '+category+', got '+entry.category);
 }
 for(const event of events||[]){
  expect(event.raw_reference,'raw',String(event.record_id??'unknown')+' raw');
  if(Object.hasOwn(MEASURES,event.measurement)&&MEASURES[event.measurement].kind==='soil')
   expect(event.blank_reference,'blank',String(event.record_id??'unknown')+' blank');
  expect(event.method_reference,'method',String(event.record_id??'unknown')+' method');
 }
 for(const inst of registry?.instruments||[]){
  expect(inst.calibration_reference,'calibration',inst.instrument_id+' calibration');
  expect(inst.method_reference,'method',inst.instrument_id+' method');
 }
 const dedup=[...new Set(errors)];
 const ready=audit.canExportMaskedE0&&manifestResult.ok&&dedup.length===0;
 return {
  schema:'phipress.e0.integrity-reference-audit.v1.0',
  readyInModel:ready,
  source:'SELF-DECLARED, USER-SUPPLIED — NO INDEPENDENT AUTHENTICATION',
  errors:dedup,
  references:[...needed.values()],
  linkedAssets:manifestResult.entries.length,
  observationLedger:audit,
  physicalEvidenceVerified:false,
  calibrationAuthenticated:false,
  safetyApproved:false,
  externallyTimestamped:false
 };
}
export function evaluateUncertaintyBudget(raw={}){
 const x={
  measurement:'initial_soil_mg',unit:'mg',
  reportedStandard:1,
  components:[
   {kind:'A',name:'repeatability',standard:0.5,reference_id:''},
   {kind:'B',name:'calibration',standard:0.5,reference_id:''},
   {kind:'B',name:'blank correction',standard:0.5,reference_id:''},
   {kind:'B',name:'resolution',standard:0.5,reference_id:''}
  ],
  ...raw
 };
 const errors=[];
 if(!Object.hasOwn(MEASURES,x.measurement))errors.push('Unknown measurement');
 else if(x.unit!==MEASURES[x.measurement].unit)errors.push('Unit mismatch');
 if(!finite(x.reportedStandard,0,1000000))errors.push('Invalid reported standard uncertainty');
 if(!Array.isArray(x.components)||x.components.length<1||x.components.length>25)
  errors.push('Need 1–25 documented uncertainty components');
 let sumSq=0;
 for(const [i,c] of (Array.isArray(x.components)?x.components:[]).entries()){
  if(!c||!['A','B'].includes(c.kind)||!idOk(c.name)||!finite(c.standard,0,1000000))
   errors.push('Invalid component '+(i+1));
  else sumSq+=c.standard*c.standard;
 }
 const combined=Math.sqrt(sumSq);
 const absDifference=finite(x.reportedStandard,0,1000000)
  ?Math.abs(x.reportedStandard-combined):null;
 const matching=absDifference!==null&&absDifference<=Math.max(0.0001,combined*.01);
 if(!matching)errors.push('Reported u differs from root-sum-of-squares components by more than 1% or 0.0001 units');
 const hasSourceRefs=Array.isArray(x.components)&&x.components.every(c=>c&&idOk(c.reference_id));
 const issues=[];
 if(!hasSourceRefs)issues.push('Uncertainty source references are missing; calculation is demonstrative, not traceable.');
 if(Array.isArray(x.components)&&x.components.some(c=>c.standard===0))
  issues.push('Zero standard uncertainty components require a defensible measurement-method explanation.');
 issues.push('Assumes uncorrelated components, first-order propagation, and no hidden systematic effects.');
 return {
  schema:'phipress.e0.uncertainty-review.v1.0',
  input:x,
  combinedStandard:Math.round(combined*1e6)/1e6,
  expandedK2:Math.round(2*combined*1e6)/1e6,
  reportedStandard:x.reportedStandard,
  reportedConsistent:matching,
  validArithmetic:errors.length===0,
  documentedByUser:hasSourceRefs,
  errors,issues,
  isConfidenceInterval:false,
  physicalCalibrationVerified:false
 };
}
