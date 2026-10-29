/**
 * ΦPRESS C0.9 · observation ledger and calibration declarations.
 * Fully local and source-conservative. No actual lab measurements, safety
 * certification, sensor connectivity or trusted provenance validation.
 */
import { COLUMNS, parseCSV as parseE0CSV, toCSV as e0ToCSV } from './evidence.mjs';

export const REGISTRY_SCHEMA='phipress.e0.instrument-register.v0.9';
export const LEDGER_SCHEMA='phipress.e0.observation-ledger.v0.9';
export const MEASURES=Object.freeze({
 initial_soil_mg:{unit:'mg',kind:'soil',required:true},
 residual_soil_mg:{unit:'mg',kind:'soil',required:true},
 recovered_soil_mg:{unit:'mg',kind:'soil',required:true},
 water_ml:{unit:'mL',kind:'resource',required:true},
 energy_wh:{unit:'Wh',kind:'resource',required:true},
 seconds:{unit:'s',kind:'resource',required:true},
 damage_score:{unit:'score',kind:'ordinal',required:true},
 redeposition_mg:{unit:'mg',kind:'soil',required:true}
});
export const EVENT_COLUMNS=Object.freeze([
 'record_id','trial_id','specimen_id','batch_id','measurement',
 'value','unit','standard_uncertainty','instrument_id','observed_at_utc',
 'operator_id','raw_reference','blank_reference','method_reference','notes'
]);
const stringOk=(s,min=1,max=120)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max;
const safeId=s=>stringOk(s,1,100)&&/^[A-Za-z0-9][A-Za-z0-9_. -]*$/.test(s);
const finite=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
const isoUtc=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(x)&&!Number.isNaN(Date.parse(x))
  &&new Date(x).toISOString().replace('.000Z','Z')===x;
const dateOnly=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)
  &&!Number.isNaN(Date.parse(x+'T00:00:00Z'))
  &&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const csvCell=v=>{const s=String(v??'');return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
export function tableCSV(columns,records){
 return [columns.join(','),...records.map(row=>columns.map(col=>csvCell(row[col])).join(','))].join('\n')+'\n';
}
export function parseTableCSV(content,columns){
 if(typeof content!=='string'||content.length>2_000_000)throw new RangeError('CSV maximum is 2 MB');
 const src=content.replace(/^\uFEFF/,'');
 let rows=[],row=[],field='',quoted=false,justClosed=false,atStart=true;
 for(let i=0;i<src.length;i++){
  const c=src[i];
  if(quoted){
   if(c==='"'){if(src[i+1]==='"'){field+='"';i++;}else{quoted=false;justClosed=true;}}
   else field+=c;
  }else if(c===','||c==='\n'||c==='\r'){
   row.push(field);field='';justClosed=false;atStart=true;
   if(c!==','){
    if(c==='\r'&&src[i+1]==='\n')i++;
    if(row.some(x=>x.trim()!==''))rows.push(row);
    row=[];
   }
  }else if(c==='"'&&atStart){quoted=true;atStart=false;}
  else if(justClosed&&/\s/.test(c)){} // Optional whitespace after closing quote.
  else if(c==='"'||justClosed)throw new Error('Malformed quoted CSV field');
  else{field+=c;atStart=false;}
 }
 if(quoted)throw new Error('Unclosed CSV quote');
 row.push(field);if(row.some(x=>x.trim()!==''))rows.push(row);
 if(!rows.length)throw new Error('No header row');
 const header=rows.shift().map(x=>x.trim());
 if(header.length!==columns.length||header.some((x,i)=>x!==columns[i]))
   throw new Error('CSV header must match: '+columns.join(','));
 if(rows.length>10000)throw new RangeError('Maximum 10,000 observation rows');
 return rows.map((x,i)=>{
  if(x.length!==header.length)throw new Error('Line '+(i+2)+' has '+x.length+' columns');
  return Object.fromEntries(header.map((key,j)=>[key,x[j].trim()]));
 });
}
export function blankRegistry(){
 return {schema:REGISTRY_SCHEMA,
  warning:'BLANK TEMPLATE: Replace with real, documented instrument declarations. Nothing is independently verified.',
  instruments:[]};
}
export function blankEventsCSV(){return tableCSV(EVENT_COLUMNS,[]);}
export function validateRegistry(input){
 const errors=[],byId=new Map();
 if(!input||input.schema!==REGISTRY_SCHEMA||!Array.isArray(input.instruments))
  return {ok:false,errors:['Invalid instrument registry schema'],instruments:[],byId};
 if(input.instruments.length>100)errors.push('Maximum 100 instruments');
 for(const [i,instrument] of input.instruments.slice(0,100).entries()){
  const tag='Instrument '+(i+1);
  if(!instrument||typeof instrument!=='object'){errors.push(tag+': invalid declaration');continue;}
  const {instrument_id,display_name,supported_measurements,valid_from,valid_through,
   uncertainty_floor,calibration_reference,method_reference,declared_by}=instrument;
  const bad=[];
  if(!safeId(instrument_id)||byId.has(instrument_id))bad.push('nonunique/invalid instrument_id');
  if(!stringOk(display_name))bad.push('display_name');
  if(!Array.isArray(supported_measurements)||!supported_measurements.length
    ||new Set(supported_measurements).size!==supported_measurements.length
    ||supported_measurements.some(x=>!Object.hasOwn(MEASURES,x)))bad.push('supported_measurements');
  if(!dateOnly(valid_from)||!dateOnly(valid_through)||valid_from>valid_through)bad.push('calibration window');
  if(!uncertainty_floor||typeof uncertainty_floor!=='object'
    ||!Array.isArray(supported_measurements)
    ||supported_measurements.some(x=>!finite(uncertainty_floor[x],0,1_000_000)))bad.push('uncertainty_floor');
  if(!stringOk(calibration_reference)||!stringOk(method_reference)||!stringOk(declared_by))bad.push('calibration/method/operator reference');
  if(bad.length)errors.push(tag+': '+bad.join(', '));
  else byId.set(instrument_id,{
   instrument_id,display_name,supported_measurements,valid_from,valid_through,
   uncertainty_floor,calibration_reference,method_reference,declared_by,
   provenance:'SELF-REPORTED; DOCUMENTS AND CALIBRATION NOT VERIFIED'
  });
 }
 return {ok:errors.length===0&&byId.size>0,errors:errors.length?errors:byId.size?[]:['Registry contains no instruments'],
  instruments:[...byId.values()],byId,source:'USER-SUPPLIED, UNVERIFIED'};
}
export function validateMaskedRoster(csvText){
 const rows=parseE0CSV(csvText);
 if(!rows.length)throw new Error('Masked roster must contain planned specimens');
 const ids=new Set(),specs=new Set(),out=[];
 for(const [i,r] of rows.entries()){
  const tag='Roster row '+(i+2);
  for(const k of ['trial_id','specimen_id','batch_id','fabric','soil'])
   if(!safeId(r[k]))throw new Error(tag+': invalid '+k);
  if(ids.has(r.trial_id)||specs.has(r.specimen_id))throw new Error(tag+': duplicate trial or specimen');
  if(r.condition!=='')throw new Error(tag+': condition must be blank to preserve assessor masking');
  for(const m of Object.keys(MEASURES))if(r[m]!=='')
   throw new Error(tag+': measurement '+m+' must be blank in a planning roster');
  ids.add(r.trial_id);specs.add(r.specimen_id);
  out.push({trial_id:r.trial_id,specimen_id:r.specimen_id,batch_id:r.batch_id,fabric:r.fabric,soil:r.soil});
 }
 return {schema:'phipress.e0.masked-roster.v0.9',rows:out,
  provenance:'IMPORTED MASKED TEMPLATE; NOT INDEPENDENTLY REGISTERED'};
}
/**
 * Generate a masked sheet with all numeric and provenance fields blank.
 * Never treat a template as observations.
 */
export function eventTemplateCSV(roster){
 if(!roster?.rows?.length)throw new Error('Load a masked C0.7 roster first');
 const rows=roster.rows.flatMap(trial=>Object.entries(MEASURES).map(([name,metric])=>({
  record_id:trial.trial_id+'-'+name,
  trial_id:trial.trial_id,specimen_id:trial.specimen_id,batch_id:trial.batch_id,
  measurement:name,value:'',unit:metric.unit,standard_uncertainty:'',
  instrument_id:'',observed_at_utc:'',operator_id:'',
  raw_reference:'',blank_reference:'',method_reference:'',notes:''
 })));
 return tableCSV(EVENT_COLUMNS,rows);
}
export function inspectLedger(events,registry,roster){
 const errors=[],warnings=[];
 if(!Array.isArray(events)||events.length>10000)throw new RangeError('Ledger limited to 10,000 rows');
 if(!registry?.ok)errors.push('Load a valid, nonempty self-reported instrument register first');
 if(!roster?.rows?.length)errors.push('Load a blank masked E0 roster from C0.7 first');
 const instruments=registry?.byId||new Map();
 const planned=new Map((roster?.rows||[]).map(x=>[x.trial_id,x]));
 const accepted=[],recordIds=new Set(),channelIds=new Set();
 for(const [i,x] of events.entries()){
  const tag='Observation row '+(i+2);
  const problems=[];
  if(!x||typeof x!=='object'){errors.push(tag+': invalid row');continue;}
  for(const id of ['record_id','trial_id','specimen_id','batch_id','instrument_id','operator_id'])
   if(!safeId(x[id]))problems.push('invalid '+id);
  if(recordIds.has(x.record_id))problems.push('duplicate record_id');
  recordIds.add(x.record_id);
  if(!Object.hasOwn(MEASURES,x.measurement))problems.push('unknown measurement');
  const measure=MEASURES[x.measurement];
  if(measure&&x.unit!==measure.unit)problems.push('wrong unit (expected '+measure.unit+')');
  const numeric=x.value===undefined||String(x.value).trim()===''?NaN:Number(x.value);
  const unc=x.standard_uncertainty===undefined||String(x.standard_uncertainty).trim()===''?NaN:Number(x.standard_uncertainty);
  if(!finite(numeric,0,1_000_000))problems.push('invalid value');
  if(measure&&x.measurement==='initial_soil_mg'&&numeric<=0)problems.push('initial soil must exceed zero');
  if(measure&&x.measurement==='seconds'&&numeric<=0)problems.push('duration must exceed zero');
  if(measure&&x.measurement==='damage_score'&&(!Number.isInteger(numeric)||numeric>5))
   problems.push('damage score requires 0–5 integer');
  if(!finite(unc,0,1_000_000))problems.push('invalid standard uncertainty');
  if(!isoUtc(x.observed_at_utc))problems.push('UTC timestamp must be YYYY-MM-DDTHH:mm:ssZ');
  if(!stringOk(x.raw_reference)||!stringOk(x.method_reference))problems.push('raw/method references required');
  if(measure?.kind==='soil'&&!stringOk(x.blank_reference))problems.push('soil assay blank_reference required');
  const trial=planned.get(x.trial_id);
  if(!trial)problems.push('unknown planned trial_id');
  else if(x.specimen_id!==trial.specimen_id||x.batch_id!==trial.batch_id)
   problems.push('specimen/batch mismatch with masked roster');
  const inst=instruments.get(x.instrument_id);
  if(!inst)problems.push('instrument absent from registry');
  else{
   if(!inst.supported_measurements.includes(x.measurement))problems.push('instrument not assigned to this measurement');
   if(isoUtc(x.observed_at_utc)&&
      (x.observed_at_utc.slice(0,10)<inst.valid_from||x.observed_at_utc.slice(0,10)>inst.valid_through))
     problems.push('reading outside declared calibration window');
   if(measure&&finite(unc,0,1_000_000)&&unc<inst.uncertainty_floor[x.measurement])
     problems.push('reported uncertainty below declared instrument floor');
   if(x.method_reference!==inst.method_reference)problems.push('method differs from registered method reference');
  }
  const channel=x.trial_id+'|'+x.measurement;
  if(channelIds.has(channel))problems.push('duplicate measurement for specimen; preserve raw records, do not silently average');
  channelIds.add(channel);
  if(problems.length)errors.push(tag+': '+problems.join('; '));
  else accepted.push({...x,value:numeric,standard_uncertainty:unc});
 }
 const coverage=(roster?.rows||[]).map(row=>{
  const present=accepted.filter(x=>x.trial_id===row.trial_id).map(x=>x.measurement);
  return {...row,present,missing:Object.keys(MEASURES).filter(name=>!present.includes(name)),
   completed:present.length===Object.keys(MEASURES).length};
 });
 const completed=coverage.filter(x=>x.completed).length;
 const complete=errors.length===0&&coverage.length>0&&completed===coverage.length;
 if(events.length===0)warnings.push('No observation rows imported. There are no results to analyze.');
 if(registry?.ok)warnings.push('Calibration entries are declarations only. Certificates, drift, methods and instrument identity have not been verified.');
 if(accepted.some(x=>x.standard_uncertainty===0))warnings.push('Some entries claim zero standard uncertainty; justify against real instrument limitations.');
 if(completed<coverage.length)warnings.push((coverage.length-completed)+' specimen(s) have missing measurement channels. Do not substitute zeros.');
 warnings.push('Masked ledger contains no treatment assignments. Unblind only in C0.7 after assessor scoring is complete.');
 return {
  schema:LEDGER_SCHEMA,origin:'USER-SUPPLIED, UNVERIFIED',ok:complete,
  totalPlanned:coverage.length,submittedRows:events.length,acceptedRows:accepted.length,
  completedSpecimens:completed,errors,warnings,coverage,accepted,
  canExportMaskedE0:complete,physicalEvidenceVerified:false,
  calibrationIndependentlyVerified:false
 };
}
export function toMaskedE0CSV(ledger,roster){
 if(!ledger?.canExportMaskedE0||!roster?.rows?.length)
  throw new Error('A complete, error-free masked ledger and roster are required');
 const readings=new Map(ledger.accepted.map(x=>[x.trial_id+'|'+x.measurement,x]));
 const result=roster.rows.map(trial=>{
  const obj=Object.fromEntries(COLUMNS.map(k=>[k,'']));
  for(const key of ['trial_id','specimen_id','batch_id','fabric','soil'])obj[key]=trial[key];
  obj.condition='';
  for(const key of Object.keys(MEASURES)){
   const event=readings.get(trial.trial_id+'|'+key);
   if(!event)throw new Error('Missing '+key+' for '+trial.trial_id);
   obj[key]=event.value;
  }
  return obj;
 });
 return e0ToCSV(result);
}
