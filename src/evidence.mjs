/**
 * ΦPRESS E0 C0.6 — reproducible textile swatch data inspection.
 * Analysis tool only: does not verify imported readings, control devices,
 * establish causal effects, or replace preregistered statistical analysis.
 */
export const COLUMNS=Object.freeze([
 'trial_id','specimen_id','batch_id','condition','fabric','soil',
 'initial_soil_mg','residual_soil_mg','recovered_soil_mg',
 'water_ml','energy_wh','seconds','damage_score','redeposition_mg'
]);
export const CONDITIONS=Object.freeze({
 A:'Plain water + suction',B:'Microbubble water + suction',
 C:'Plain water + simple jets + suction',D:'Plain water + nested vortices + suction',
 E:'Microbubble water + nested vortices + suction',F:'Nested vortices + no suction'
});
export const COMPARISONS=Object.freeze([
 {id:'D_C',treat:'D',control:'C',question:'Geometry: nested flow versus simple jets'},
 {id:'E_D',treat:'E',control:'D',question:'Bubble contribution with nested flow'},
 {id:'B_A',treat:'B',control:'A',question:'Bubble contribution without jets'},
 {id:'E_C',treat:'E',control:'C',question:'Combined treatment versus simple jets'}
]);
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const round=(x,n=3)=>Number(x.toFixed(n));
export function parseCSV(raw){
 if(typeof raw!=='string'||raw.length>2_000_000)throw new RangeError('CSV text is missing or exceeds 2 MB');
 const s=raw.replace(/^\uFEFF/,'');
 let rows=[],row=[],field='',quoted=false,afterQuote=false,atStart=true;
 for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(quoted){
   if(ch==='"'){
    if(s[i+1]==='"'){field+='"';i++;}
    else{quoted=false;afterQuote=true;}
   }else field+=ch;
  }else if(ch==='"'&&atStart){quoted=true;atStart=false;}
  else if(ch===','){
   row.push(field);field='';afterQuote=false;atStart=true;
  }else if(ch==='\n'||ch==='\r'){
   if(ch==='\r'&&s[i+1]==='\n')i++;
   row.push(field);
   if(row.some(c=>c.trim()!==''))rows.push(row);
   row=[];field='';afterQuote=false;atStart=true;
  }else{
   if(afterQuote&&!/\s/.test(ch))throw new Error('Unexpected characters after closing CSV quote');
   if(ch==='"')throw new Error('Unexpected quote inside CSV field');
   field+=ch;atStart=false;
  }
 }
 if(quoted)throw new Error('Unclosed CSV quote');
 row.push(field);
 if(row.some(c=>c.trim()!==''))rows.push(row);
 if(!rows.length)throw new Error('CSV is empty');
 const header=rows.shift().map(x=>x.trim());
 if(new Set(header).size!==header.length)throw new Error('Duplicate CSV columns');
 const missing=COLUMNS.filter(c=>!header.includes(c));
 if(missing.length)throw new Error('Missing columns: '+missing.join(', '));
 if(header.length!==COLUMNS.length)throw new Error('Unexpected columns: '+header.filter(c=>!COLUMNS.includes(c)).join(', '));
 if(rows.length>3000)throw new RangeError('Maximum 3000 specimen rows');
 return rows.map((cells,i)=>{
  if(cells.length!==header.length)throw new Error('Row '+(i+2)+': expected '+header.length+' values, found '+cells.length);
  return Object.fromEntries(header.map((col,j)=>[col,cells[j].trim()]));
 });
}
const validateNumber=(value,name,id,{min=0,max=1_000_000,integer=false}={})=>{
 if(value===null||value===undefined||String(value).trim()==='')throw new Error(id+': missing '+name);
 const n=Number(value);
 if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error(id+': invalid '+name);
 return n;
};
export function validateDataset(records){
 if(!Array.isArray(records)||records.length>3000)throw new RangeError('Dataset must be an array of up to 3000 rows');
 const trials=new Set(),specimens=new Set(),rows=[],errors=[];
 for(let i=0;i<records.length;i++){
  const r=records[i],tag='row '+(i+1);
  try{
   if(!r||typeof r!=='object')throw new Error(tag+': not an object');
   const out={};
   for(const key of ['trial_id','specimen_id','batch_id','fabric','soil']){
    const value=String(r[key]??'').trim();
    if(!value||value.length>100)throw new Error(tag+': missing or invalid '+key);
    out[key]=value;
   }
   out.condition=String(r.condition??'').trim();
   if(!Object.hasOwn(CONDITIONS,out.condition))throw new Error(tag+': unknown condition');
   if(trials.has(out.trial_id)||specimens.has(out.specimen_id))throw new Error(tag+': duplicate trial_id or specimen_id');
   for(const key of ['initial_soil_mg','residual_soil_mg','recovered_soil_mg','water_ml','energy_wh','seconds','damage_score','redeposition_mg']){
    out[key]=validateNumber(r[key],key,tag,{max:key==='seconds'?86400:key==='damage_score'?5:1_000_000,integer:key==='damage_score'});
   }
   if(out.initial_soil_mg<=0)throw new Error(tag+': initial_soil_mg must be greater than zero');
   if(out.seconds<=0)throw new Error(tag+': seconds must be greater than zero');
   out.removalPercent=100*(out.initial_soil_mg-out.residual_soil_mg)/out.initial_soil_mg;
   out.recoveryPercent=100*out.recovered_soil_mg/out.initial_soil_mg;
   out.unaccountedSoilMg=out.initial_soil_mg-out.residual_soil_mg-out.recovered_soil_mg;
   trials.add(out.trial_id);specimens.add(out.specimen_id);
   rows.push(out);
  }catch(e){errors.push(e.message);}
 }
 return {rows,errors,ok:errors.length===0&&rows.length>0};
}
function summarizeGroup(rows,condition){
 const subset=rows.filter(r=>r.condition===condition);
 if(!subset.length)return null;
 const n=subset.length;
 const stats=fields=>Object.fromEntries(fields.map(k=>[k,round(mean(subset.map(x=>x[k])))]));
 return {
  condition,label:CONDITIONS[condition],n,
  ...stats(['removalPercent','recoveryPercent','unaccountedSoilMg','water_ml','energy_wh','seconds','damage_score','redeposition_mg']),
  strata:[...new Set(subset.map(r=>r.fabric+' / '+r.soil+' / '+r.batch_id))].sort(),
  minRemovalPercent:round(Math.min(...subset.map(x=>x.removalPercent))),
  maxRemovalPercent:round(Math.max(...subset.map(x=>x.removalPercent)))
 };
}
function rng(seed){
 let value=seed>>>0;
 return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}
export function bootstrapDifference(treat,control,{seed=369,repeats=1200}={}){
 if(!Array.isArray(treat)||!Array.isArray(control)||treat.length<3||control.length<3)throw new RangeError('At least 3 independent values per group');
 if(!Number.isInteger(repeats)||repeats<100||repeats>10000)throw new RangeError('Invalid bootstrap count');
 if([...treat,...control].some(x=>typeof x!=='number'||!Number.isFinite(x)))throw new RangeError('Invalid bootstrap input');
 const rand=rng(seed),draw=[];
 for(let i=0;i<repeats;i++){
  let a=0,b=0;
  for(let j=0;j<treat.length;j++)a+=treat[Math.floor(rand()*treat.length)];
  for(let j=0;j<control.length;j++)b+=control[Math.floor(rand()*control.length)];
  draw.push(a/treat.length-b/control.length);
 }
 draw.sort((a,b)=>a-b);
 return {difference:round(mean(treat)-mean(control)),
  low:round(draw[Math.floor((repeats-1)*.025)]),
  high:round(draw[Math.floor((repeats-1)*.975)]),
  method:'Unpaired percentile bootstrap; exploratory; fixed seed 369; '+repeats+' draws'};
}
function relativeGap(a,b){
 if(a===0&&b===0)return 0;
 return Math.abs(a-b)/Math.max((a+b)/2,0.000001);
}
export function analyzeDataset(dataset,{origin='unknown',seed=369}={}){
 const validated=validateDataset(dataset);
 if(!validated.ok){
  return {schema:'phipress.e0-analysis.v0.6',ok:false,errors:validated.errors.length?validated.errors:['No rows supplied'],origin};
 }
 const rows=validated.rows;
 const groups=Object.keys(CONDITIONS).map(c=>summarizeGroup(rows,c)).filter(Boolean);
 const byCondition=new Map(Object.keys(CONDITIONS).map(k=>[k,rows.filter(x=>x.condition===k)]));
 const comparisons=COMPARISONS.map(config=>{
  const a=byCondition.get(config.treat),b=byCondition.get(config.control);
  const strataA=[...new Set(a.map(x=>x.fabric+'|'+x.soil+'|'+x.batch_id))].sort();
  const strataB=[...new Set(b.map(x=>x.fabric+'|'+x.soil+'|'+x.batch_id))].sort();
  const reasons=[];
  if(a.length<3||b.length<3)reasons.push('Fewer than 3 independent specimens in one or both groups; no interval calculated.');
  if(strataA.length!==1||strataB.length!==1||strataA[0]!==strataB[0])
   reasons.push('Fabric, soil and batch are not one identical comparison stratum; do not pool conditions.');
  let result=null;
  const waterA=a.length?mean(a.map(x=>x.water_ml)):0,waterB=b.length?mean(b.map(x=>x.water_ml)):0;
  const energyA=a.length?mean(a.map(x=>x.energy_wh)):0,energyB=b.length?mean(b.map(x=>x.energy_wh)):0;
  if(a.length&&b.length&&relativeGap(waterA,waterB)>.05) reasons.push('Mean water doses differ more than 5%; potential confounding.');
  if(a.length&&b.length&&relativeGap(energyA,energyB)>.10) reasons.push('Mean energy inputs differ more than 10%; potential confounding.');
  const eligible=reasons.length===0;
  if(eligible)result=bootstrapDifference(a.map(x=>x.removalPercent),b.map(x=>x.removalPercent),{seed});
  return {
   ...config,treatedN:a.length,controlN:b.length,
   eligible,comparison:result,reasons,
   label:eligible?'DESCRIPTIVE INTERVAL ONLY':'NOT COMPARABLE UNDER EXPLORATORY GUARDS'
  };
 });
 const issues=[];
 if(rows.some(x=>x.unaccountedSoilMg<0))
  issues.push('Some trials report more recovered + residual soil than initial soil; inspect blanks, calibration or contamination.');
 if(rows.some(x=>x.removalPercent<0))
  issues.push('Some specimens have negative apparent removal (residual exceeds initial); retained rather than silently clamped.');
 if(groups.some(g=>g.n<10))
  issues.push('At least one condition has fewer than 10 independent specimens, below the E0 pilot planning target.');
 if(rows.some(x=>x.damage_score>0))
  issues.push('Nonzero garment damage scores are present; analyze durability separately from cleaning.');
 issues.push('Soil disappearance is not equivalent to recovery; consult unaccounted soil and redeposition.');
 issues.push('No p-value, material benefit, product efficacy, sanitation or causal claim is inferred from this exploratory dashboard.');
 return {
  schema:'phipress.e0-analysis.v0.6',ok:true,origin,
  specimenCount:rows.length,groups,comparisons,issues,
  assumptions:{
   independentSpecimens:true,bootstrapSeed:seed,
   materialAndBatchMustMatch:true,waterMeanGapLimit:.05,energyMeanGapLimit:.10,
   primary:'(initial_soil_mg - residual_soil_mg) / initial_soil_mg * 100',
   recovery:'recovered_soil_mg / initial_soil_mg * 100',
   unaccounted:'initial_soil_mg - residual_soil_mg - recovered_soil_mg',
   registration:'Exploratory only; not confirmatory analysis'
  }
 };
}
export function demoRows(){
 // Constructed toy values for interface demonstration. NEVER actual observations.
 const rows=[];
 for(const cond of Object.keys(CONDITIONS)){
  for(let i=0;i<10;i++){
   const initial=100;
   const offsets={A:27,B:33,C:45,D:53,E:58,F:51};
   const noise=((i*7+(cond.charCodeAt(0)-65)*3)%11)-5;
   const removal=offsets[cond]+noise;
   const residual=initial-removal;
   const recoveryRate=cond==='F'?0:[.76,.79,.84,.87,.88][cond.charCodeAt(0)-65];
   const recovered=Number((removal*recoveryRate).toFixed(2));
   rows.push({
    trial_id:'DEMO-'+cond+'-'+String(i+1).padStart(2,'0'),
    specimen_id:'SYN-'+cond+'-'+String(i+1).padStart(2,'0'),
    batch_id:'SYNTHETIC-BATCH-01',condition:cond,fabric:'cotton',soil:'inert-demo-soil',
    initial_soil_mg:initial,residual_soil_mg:residual,recovered_soil_mg:recovered,
    water_ml:cond==='F'?120:120,energy_wh:cond==='F'?10:12,
    seconds:300,damage_score:0,redeposition_mg:cond==='F'?Number((removal*.2).toFixed(2)):1.2
   });
  }
 }
 return rows;
}
export function toCSV(rows){
 return [COLUMNS.join(','),...rows.map(r=>COLUMNS.map(k=>{
  const val=String(r[k]??'');
  return /[",\r\n]/.test(val)?'"'+val.replaceAll('"','""')+'"':val;
 }).join(','))].join('\n')+'\n';
}
