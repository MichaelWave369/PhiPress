import test from 'node:test';
import assert from 'node:assert/strict';
import {
 REGISTRY_SCHEMA,MEASURES,EVENT_COLUMNS,blankRegistry,blankEventsCSV,
 parseTableCSV,tableCSV,validateRegistry,validateMaskedRoster,
 inspectLedger,toMaskedE0CSV
} from '../src/observations.mjs';
import { createPlan,assessorTemplateCSV } from '../src/study-plan.mjs';
import { parseCSV as parseE0CSV } from '../src/evidence.mjs';

const plan=createPlan({blocks:1,replicatesPerCondition:3});
const roster=validateMaskedRoster(assessorTemplateCSV(plan));
const now='2026-10-01T12:30:00Z';
const instruments=[
 {instrument_id:'MASS',display_name:'Research mass assay',supported_measurements:['initial_soil_mg','residual_soil_mg','recovered_soil_mg','redeposition_mg'],valid_from:'2026-01-01',valid_through:'2026-12-31',uncertainty_floor:{initial_soil_mg:0.1,residual_soil_mg:0.1,recovered_soil_mg:0.1,redeposition_mg:0.1},calibration_reference:'CAL-MASS-001',method_reference:'SOIL-METHOD-01',declared_by:'LAB-OP'},
 {instrument_id:'UTIL',display_name:'Research resource meter',supported_measurements:['water_ml','energy_wh','seconds'],valid_from:'2026-01-01',valid_through:'2026-12-31',uncertainty_floor:{water_ml:.1,energy_wh:.05,seconds:.1},calibration_reference:'CAL-UTIL-001',method_reference:'RESOURCE-METHOD-01',declared_by:'LAB-OP'},
 {instrument_id:'WEAR',display_name:'Blinded wear assessor',supported_measurements:['damage_score'],valid_from:'2026-01-01',valid_through:'2026-12-31',uncertainty_floor:{damage_score:0},calibration_reference:'RUBRIC-TRAINING-01',method_reference:'DAMAGE-RUBRIC-01',declared_by:'LAB-OP'}
];
const registry=validateRegistry({schema:REGISTRY_SCHEMA,instruments});
function eventsFor(people=roster.rows){
 return people.flatMap((t,j)=>Object.entries(MEASURES).map(([key,metric],i)=>{
  const instrument=metric.kind==='soil'?'MASS':metric.kind==='ordinal'?'WEAR':'UTIL';
  return {
   record_id:'OBS-'+j+'-'+i,trial_id:t.trial_id,specimen_id:t.specimen_id,batch_id:t.batch_id,
   measurement:key,value:String(key==='initial_soil_mg'?100:key==='residual_soil_mg'?60:
    key==='recovered_soil_mg'?30:key==='water_ml'?120:key==='energy_wh'?12:
    key==='seconds'?300:key==='damage_score'?0:1),
   unit:metric.unit,standard_uncertainty:metric.kind==='ordinal'?'0':'1',
   instrument_id:instrument,observed_at_utc:now,operator_id:'ASSESSOR-1',
   raw_reference:'RAW-DATA-PENDING',blank_reference:metric.kind==='soil'?'BLANK-01':'',
   method_reference:instrument==='MASS'?'SOIL-METHOD-01':instrument==='WEAR'?'DAMAGE-RUBRIC-01':'RESOURCE-METHOD-01',
   notes:'Synthetic test fixture. NOT PHYSICAL EVIDENCE'
  };
 }));
}
test('empty templates contain no fictitious instruments or observations',()=>{
 assert.equal(blankRegistry().instruments.length,0);
 assert.equal(blankEventsCSV(),EVENT_COLUMNS.join(',')+'\n');
 assert.equal(validateRegistry(blankRegistry()).ok,false);
});
test('CSV parser safely round trips quotations, commas and newlines',()=>{
 const e={...eventsFor(roster.rows.slice(0,1))[0],notes:'text, with "quoted"\nlines'};
 const csv=tableCSV(EVENT_COLUMNS,[e]);
 assert.deepEqual(parseTableCSV(csv,EVENT_COLUMNS),[{...e}]);
 assert.throws(()=>parseTableCSV('other,header\n1,2',EVENT_COLUMNS),/header/);
 assert.throws(()=>parseTableCSV(EVENT_COLUMNS.join(',')+'\n"unterminated',EVENT_COLUMNS),/Unclosed/);
});
test('registry declarations are explicitly unverified and tied to method and uncertainty floors',()=>{
 assert.equal(registry.ok,true);
 assert.equal(registry.instruments.length,3);
 assert.ok(registry.instruments.every(x=>x.provenance.includes('NOT VERIFIED')));
});
test('malformed or empty instrument registry is rejected',()=>{
 assert.equal(validateRegistry(blankRegistry()).ok,false);
 assert.equal(validateRegistry({schema:'wrong',instruments}).ok,false);
 assert.equal(validateRegistry({schema:REGISTRY_SCHEMA,instruments:[instruments[0],instruments[0]]}).ok,false);
 assert.equal(validateRegistry({schema:REGISTRY_SCHEMA,instruments:[{...instruments[0],valid_through:'2025-01-01'}]}).ok,false);
});
test('masked roster rejects treatment conditions and invented measurement values',()=>{
 const csv=assessorTemplateCSV(plan);
 assert.equal(roster.rows.length,18);
 assert.ok(roster.rows.every(x=>!('condition' in x)));
 const filled=parseE0CSV(csv);
 filled[0].condition='A';
 const write=rows=>[Object.keys(filled[0]).join(','),...rows.map(r=>Object.values(r).join(','))].join('\n')+'\n';
 assert.throws(()=>validateMaskedRoster(write(filled)),/condition/);
});
test('a complete valid ledger can produce a still-blinded E0 worksheet',()=>{
 const observations=eventsFor();
 const report=inspectLedger(observations,registry,roster);
 assert.equal(report.ok,true,report.errors.join(' | '));
 assert.equal(report.completedSpecimens,roster.rows.length);
 assert.equal(report.acceptedRows,roster.rows.length*8);
 const csv=toMaskedE0CSV(report,roster);
 const rows=parseE0CSV(csv);
 assert.ok(rows.every(x=>x.condition===''&&x.initial_soil_mg==='100'&&x.damage_score==='0'));
 assert.equal(report.physicalEvidenceVerified,false);
});
test('missing channels never become zero measurements',()=>{
 const a=eventsFor().slice(1);
 const report=inspectLedger(a,registry,roster);
 assert.equal(report.ok,false);
 assert.equal(report.completedSpecimens,17);
 assert.throws(()=>toMaskedE0CSV(report,roster),/complete/);
});
test('duplicate channel cannot be silently treated as additional specimen',()=>{
 const events=eventsFor();
 events.push({...events[0],record_id:'NEW'});
 const r=inspectLedger(events,registry,roster);
 assert.equal(r.ok,false);
 assert.ok(r.errors.some(x=>x.includes('duplicate measurement')));
});
test('calibration window and method mismatch stop output',()=>{
 const events=eventsFor();events[0]={...events[0],observed_at_utc:'2027-01-01T12:30:00Z'};
 assert.ok(inspectLedger(events,registry,roster).errors.some(x=>x.includes('calibration window')));
 const e2=eventsFor();e2[0]={...e2[0],method_reference:'DIFFERENT'};
 assert.ok(inspectLedger(e2,registry,roster).errors.some(x=>x.includes('method')));
});
test('below uncertainty floor or incompatible unit/device blocks results',()=>{
 const events=eventsFor();events[0]={...events[0],standard_uncertainty:'0'};
 assert.ok(inspectLedger(events,registry,roster).errors.some(x=>x.includes('uncertainty below')));
 const e2=eventsFor();e2[0]={...e2[0],unit:'gram'};
 assert.ok(inspectLedger(e2,registry,roster).errors.some(x=>x.includes('unit')));
 const e3=eventsFor();e3[0]={...e3[0],instrument_id:'WEAR'};
 assert.ok(inspectLedger(e3,registry,roster).errors.some(x=>x.includes('not assigned')));
});
test('no made-up provenance or blank controls are accepted for soil measurements',()=>{
 const events=eventsFor();events[0]={...events[0],raw_reference:''};
 assert.ok(inspectLedger(events,registry,roster).errors.some(x=>x.includes('raw/method')));
 const e2=eventsFor();e2[0]={...e2[0],blank_reference:''};
 assert.ok(inspectLedger(e2,registry,roster).errors.some(x=>x.includes('blank_reference')));
});
test('invalid timestamps or numeric records fail closed',()=>{
 for(const bad of ['2026-10-01','2026-02-30T12:00:00Z','2026-10-01T10:00:00-07:00']){
  const events=eventsFor();events[0]={...events[0],observed_at_utc:bad};
  assert.equal(inspectLedger(events,registry,roster).ok,false,bad);
 }
 const events=eventsFor();events[0]={...events[0],value:''};
 assert.equal(inspectLedger(events,registry,roster).ok,false);
});
test('roster identity mismatch blocks even otherwise complete ledger',()=>{
 const a=eventsFor();a[0]={...a[0],specimen_id:'SWAPPED'};
 assert.ok(inspectLedger(a,registry,roster).errors.some(x=>x.includes('specimen/batch')));
});
