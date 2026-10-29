/**
 * ΦPRESS C0.7 — E0 preregistration preparation and blinded assessor workflow.
 * Pure local planning: not a trusted timestamp, measurement verification,
 * a laboratory safety approval, or proof of prospective registration.
 */
import { COLUMNS, CONDITIONS, parseCSV, toCSV, validateDataset, analyzeDataset } from './evidence.mjs';

export const STUDY_CONTRACT='phipress.e0.plan.v0.7';
export const REQUIRED_READINESS=Object.freeze([
 {id:'protocolReviewed',label:'Protocol and endpoints reviewed before data collection'},
 {id:'materialsChecked',label:'Material compatibility and nonhazardous soil documented'},
 {id:'safetyReviewed',label:'Qualified experiment safety review completed'},
 {id:'calibrationDocumented',label:'Instrument calibration, blanks and uncertainty documented'},
 {id:'measurementPlanDefined',label:'Recovery, water, energy and wear measurements specified'},
 {id:'randomizationApproved',label:'Allocation and exclusion decisions frozen before testing'},
 {id:'blindAssessorAvailable',label:'Separate outcome assessor can remain blinded'}
]);
export const DEFAULT_STUDY=Object.freeze({
 studyId:'PHIPRESS-E0-PILOT',blocks:2,replicatesPerCondition:10,
 seed:369,fabric:'cotton',soil:'inert_soil_surrogate'
});
const safeLabel=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9 _-]{1,63}$/.test(s);
function boundedInt(x,min,max){return typeof x==='number'&&Number.isSafeInteger(x)&&x>=min&&x<=max;}
export function validateStudy(raw={}){
 const s={...DEFAULT_STUDY,...raw};
 if(!safeLabel(s.studyId)||s.studyId.length>32)throw new RangeError('Invalid study ID: 2–32 letters, digits, spaces, underscores or dashes');
 if(!safeLabel(s.fabric)||!safeLabel(s.soil))throw new RangeError('Fabric and soil labels must be 2–64 safe characters');
 if(!boundedInt(s.blocks,1,5))throw new RangeError('Blocks must be 1–5');
 if(!boundedInt(s.replicatesPerCondition,3,20))throw new RangeError('Independent replicates per condition and block must be 3–20');
 if(!boundedInt(s.seed,0,4294967295))throw new RangeError('Seed must be a 32-bit unsigned integer');
 return s;
}
function rng(seed){
 let s=seed>>>0;
 return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};
}
function shuffled(items,random){
 const result=items.slice();
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
const str2csv=value=>{
 const s=String(value??'');
 return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;
};
const csv=(headers,records)=>[headers.join(','),...records.map(row=>headers.map(c=>str2csv(row[c])).join(','))].join('\n')+'\n';
export function createPlan(config={}){
 const s=validateStudy(config),random=rng(s.seed),conditions=Object.keys(CONDITIONS);
 const assignments=[];let globalIndex=0;
 for(let block=1;block<=s.blocks;block++){
  const allocation=[];
  for(const cond of conditions)for(let i=0;i<s.replicatesPerCondition;i++)allocation.push(cond);
  const order=shuffled(allocation,random);
  for(let i=0;i<order.length;i++){
   globalIndex++;
   const trial_id=s.studyId+'-B'+String(block).padStart(2,'0')+'-T'+String(i+1).padStart(3,'0');
   assignments.push({
    trial_id,specimen_id:s.studyId+'-S'+String(globalIndex).padStart(4,'0'),
    batch_id:s.studyId+'-B'+String(block).padStart(2,'0'),
    fabric:s.fabric,soil:s.soil,condition:order[i],order:i+1
   });
  }
 }
 const manifest={
  schema:STUDY_CONTRACT,
  status:'DRAFT UNTIL EXTERNALLY REGISTERED BEFORE COLLECTION',
  synthetic:false,
  generatedBy:'deterministic blocked Fisher-Yates pseudorandom allocation',
  config:s,
  comparisons:['D vs C','E vs D','B vs A','E vs C'],
  analysis:'Exploratory E0 analysis; not confirmatory inference',
  studyRequiresSeparateOperatorAndAssessor:true,
  registrationProof:'NONE — export and externally timestamp prior to data collection',
  assignments
 };
 return manifest;
}
export const OPERATOR_COLUMNS=['trial_id','specimen_id','batch_id','order','condition','fabric','soil'];
export function operatorCSV(plan){
 requirePlan(plan);
 return csv(OPERATOR_COLUMNS,plan.assignments);
}
export function assessorTemplateCSV(plan){
 requirePlan(plan);
 // Condition intentionally blank: operator alone holds condition key.
 // All measurement columns blank; cannot be mistaken for physical results.
 return csv(COLUMNS,plan.assignments.map(a=>{
  const r=Object.fromEntries(COLUMNS.map(k=>[k,'']));
  for(const key of ['trial_id','specimen_id','batch_id','fabric','soil'])r[key]=a[key];
  return r;
 }));
}
function requirePlan(plan){
 if(!plan||plan.schema!==STUDY_CONTRACT||!Array.isArray(plan.assignments))throw new TypeError('Unknown study plan');
 const seen=new Set();
 for(const a of plan.assignments){
  if(!Object.hasOwn(CONDITIONS,a.condition)||!a.trial_id||seen.has(a.trial_id))throw new Error('Invalid or duplicate plan assignment');
  seen.add(a.trial_id);
 }
}
export function readinessChecklist(flags={}){
 const results=REQUIRED_READINESS.map(item=>({
  ...item,
  complete:flags[item.id]===true,
  selfReported:true
 }));
 return {
  readyBySelfReport:results.every(x=>x.complete),
  results,
  warning:'Self-attested checklist only. Does not verify engineering, calibration, laboratory competency or safety.'
 };
}
export function unblindCSV(plan,sourceText){
 requirePlan(plan);
 const source=parseCSV(sourceText);
 const map=new Map(plan.assignments.map(a=>[a.trial_id,a]));
 const seen=new Set(),errors=[],merged=[];
 for(const [i,r]of source.entries()){
  const label='CSV row '+(i+2);
  if(!r.trial_id||!map.has(r.trial_id)){errors.push(label+': unknown trial_id');continue;}
  if(seen.has(r.trial_id)){errors.push(label+': duplicate trial_id');continue;}
  seen.add(r.trial_id);
  const a=map.get(r.trial_id);
  if(String(r.condition).trim()!=='')errors.push(label+': condition column must remain blank in blinded assessor sheet');
  for(const key of ['specimen_id','batch_id','fabric','soil']){
   if(r[key]!==a[key])errors.push(label+': '+key+' does not match frozen allocation');
  }
  merged.push({...r,condition:a.condition});
 }
 const missing=plan.assignments.filter(a=>!seen.has(a.trial_id)).map(a=>a.trial_id);
 if(missing.length)errors.push(missing.length+' planned specimens missing: '+missing.slice(0,4).join(', ')+(missing.length>4?' …':''));
 if(source.length!==plan.assignments.length)errors.push('Row count does not match allocation count');
 if(errors.length)return {ok:false,errors,missingCount:missing.length};
 const validated=validateDataset(merged);
 if(!validated.ok)return {ok:false,errors:validated.errors,missingCount:0};
 const analysis=analyzeDataset(merged,{origin:'user_supplied_unverified'});
 return {
  ok:analysis.ok,
  warnings:[
   'USER-SUPPLIED, UNVERIFIED measurements; not laboratory authentication.',
   'Operator-held allocation is joined only after assessor measurement entry.',
   'No trusted preregistration timestamp or independent calibration review was performed.'
  ],
  analysis,
  merged:validated.rows.map(r=>Object.fromEntries(COLUMNS.map(k=>[k,r[k]]))),
  csv:toCSV(merged),
  missingCount:0
 };
}
export function planSummary(plan){
 requirePlan(plan);
 const groups=Object.keys(CONDITIONS).map(c=>({
  condition:c,
  n:plan.assignments.filter(a=>a.condition===c).length
 }));
 return {total:plan.assignments.length,blocks:plan.config.blocks,perCondition:plan.config.blocks*plan.config.replicatesPerCondition,groups};
}
