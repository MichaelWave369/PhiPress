import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_STUDY,STUDY_CONTRACT,OPERATOR_COLUMNS,
 createPlan,operatorCSV,assessorTemplateCSV,readinessChecklist,unblindCSV,
 validateStudy,planSummary} from '../src/study-plan.mjs';
import {parseCSV,validateDataset,COLUMNS, toCSV} from '../src/evidence.mjs';

test('seeded blocked allocations are reproducible and count-balanced',()=>{
 const a=createPlan(),b=createPlan();
 assert.deepEqual(a,b);
 assert.equal(a.schema,STUDY_CONTRACT);
 assert.equal(a.assignments.length,120);
 const summary=planSummary(a);
 assert.equal(summary.perCondition,20);
 assert.ok(summary.groups.every(x=>x.n===20));
 const blocks=new Set(a.assignments.map(x=>x.batch_id));
 assert.equal(blocks.size,2);
 for(const batch of blocks)for(const condition of 'ABCDEF'){
  assert.equal(a.assignments.filter(x=>x.batch_id===batch&&x.condition===condition).length,10);
 }
});
test('different seeds change allocation without changing balances',()=>{
 const a=createPlan({seed:369}),b=createPlan({seed:370});
 assert.notDeepEqual(a.assignments.map(x=>x.condition),b.assignments.map(x=>x.condition));
 assert.deepEqual(planSummary(a),planSummary(b));
});
test('IDs are unique and bear no condition designation',()=>{
 const a=createPlan();
 assert.equal(new Set(a.assignments.map(x=>x.trial_id)).size,a.assignments.length);
 assert.equal(new Set(a.assignments.map(x=>x.specimen_id)).size,a.assignments.length);
 assert.ok(a.assignments.every(x=>!x.trial_id.includes('-'+x.condition+'-')));
});
test('operator allocation includes conditions; assessor template masks them',()=>{
 const a=createPlan({blocks:1,replicatesPerCondition:3});
 const operators=operatorCSV(a),assessors=assessorTemplateCSV(a);
 assert.deepEqual(operators.split('\n')[0].split(','),OPERATOR_COLUMNS);
 const assay=parseCSV(assessors);
 assert.equal(assay.length,18);
 assert.ok(assay.every(x=>x.condition===''));
 assert.ok(assay.every(x=>x.initial_soil_mg===''&&x.energy_wh===''));
 assert.ok(!assessors.includes('SYNTHETIC DEMO'));
});
test('can unblind complete independent records and feed existing E0 analyzer',()=>{
 const plan=createPlan({blocks:1,replicatesPerCondition:3});
 const blind=parseCSV(assessorTemplateCSV(plan)).map((x,i)=>({
  ...x,initial_soil_mg:'100',residual_soil_mg:String(70-i%4),
  recovered_soil_mg:'20',water_ml:'120',energy_wh:'12',
  seconds:'300',damage_score:'0',redeposition_mg:'1'
 }));
 const joined=unblindCSV(plan,toCSV(blind));
 assert.equal(joined.ok,true);
 assert.equal(joined.merged.length,18);
 assert.equal(joined.analysis.origin,'user_supplied_unverified');
 assert.equal(validateDataset(parseCSV(joined.csv)).ok,true);
 assert.ok(joined.merged.every((x,i)=>x.condition===plan.assignments[i].condition));
});
test('unknown rows, partial data, duplicate and condition leakage are rejected',()=>{
 const plan=createPlan({blocks:1,replicatesPerCondition:3});
 const blank=parseCSV(assessorTemplateCSV(plan));
 assert.equal(unblindCSV(plan,toCSV(blank)).ok,false);
 const changed=blank.map(x=>({...x}));
 changed[0].trial_id='UNKNOWN';
 assert.ok(unblindCSV(plan,toCSV(changed)).errors.some(x=>x.includes('unknown')));
 const only=toCSV(blank.slice(0,1));
 assert.ok(unblindCSV(plan,only).errors.some(x=>x.includes('missing')));
 const duplicated=blank.map(x=>({...x}));
 duplicated[1].trial_id=duplicated[0].trial_id;
 assert.ok(unblindCSV(plan,toCSV(duplicated)).errors.some(x=>x.includes('duplicate')));
 const leaked=blank.map(x=>({...x}));
 leaked[0].condition='D';
 assert.ok(unblindCSV(plan,toCSV(leaked)).errors.some(x=>x.includes('must remain blank')));
});
test('specimen identity and batch mismatch are blocked',()=>{
 const plan=createPlan({blocks:1,replicatesPerCondition:3});
 for(const name of ['specimen_id','batch_id','fabric','soil']){
  const rows=parseCSV(assessorTemplateCSV(plan));
  rows[0][name]='SWAPPED';
  const result=unblindCSV(plan,toCSV(rows));
  assert.ok(result.errors.some(x=>x.includes(name)),name);
 }
});
test('readiness is never certified and requires every self attestation',()=>{
 const absent=readinessChecklist({});
 assert.equal(absent.readyBySelfReport,false);
 const all=Object.fromEntries(absent.results.map(x=>[x.id,true]));
 const claimed=readinessChecklist(all);
 assert.equal(claimed.readyBySelfReport,true);
 assert.ok(claimed.results.every(x=>x.selfReported));
 assert.ok(claimed.warning.includes('Self-attested'));
});
test('reject potentially unsafe spreadsheet strings, invalid numbers and limits',()=>{
 for(const bad of [
  {studyId:'=1+1'},{studyId:'a'},{fabric:'@SUM(1)'},{soil:'abc,def'},
  {blocks:0},{blocks:6},{replicatesPerCondition:2},{replicatesPerCondition:21},
  {seed:-1},{seed:1.5},{seed:4294967296}
 ])assert.throws(()=>validateStudy(bad),RangeError);
});
test('different allowed block and replication sizes produce correct totals',()=>{
 for(const blocks of [1,3,5])for(const n of [3,10,20]){
  const p=createPlan({blocks,replicatesPerCondition:n});
  assert.equal(p.assignments.length,6*blocks*n);
  assert.equal(planSummary(p).perCondition,n*blocks);
 }
});
