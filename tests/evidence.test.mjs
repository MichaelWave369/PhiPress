import test from 'node:test';
import assert from 'node:assert/strict';
import {COLUMNS,parseCSV,validateDataset,analyzeDataset,bootstrapDifference,demoRows,toCSV} from '../src/evidence.mjs';
const rows=demoRows();
test('synthetic fixture is visibly labeled and not an observation',()=>{
 assert.equal(rows.length,60);
 assert.ok(rows.every(x=>x.trial_id.startsWith('DEMO-')&&x.specimen_id.startsWith('SYN-')));
});
test('CSV parser handles BOM, CRLF, quoted commas and escaped quotes',()=>{
 const data=toCSV([{...rows[0],fabric:'cotton, "woven"'}]).replace(/\n/g,'\r\n');
 const parsed=parseCSV('\uFEFF'+data);
 assert.equal(parsed.length,1);
 assert.equal(parsed[0].fabric,'cotton, "woven"');
 assert.equal(parsed[0].trial_id,rows[0].trial_id);
});
test('CSV parser rejects missing columns, malformed quote, extra field and extra columns',()=>{
 assert.throws(()=>parseCSV('a,b\n1,2'),/Missing columns/);
 assert.throws(()=>parseCSV(COLUMNS.join(',')+'\n"unterminated'),/Unclosed/);
 assert.throws(()=>parseCSV(COLUMNS.join(',')+'\n'+COLUMNS.map(()=>'x').join(',')+',x'),/expected/);
 assert.throws(()=>parseCSV(COLUMNS.join(',')+',EXTRA'),/Unexpected columns/);
});
test('validates unique specimen and trial, no silent duplicates',()=>{
 const d=validateDataset([...rows.slice(0,1),{...rows[0],trial_id:'different'}]);
 assert.equal(d.ok,false);
 assert.ok(d.errors.some(e=>e.includes('duplicate')));
});
test('rejects invalid baseline and impossible numeric inputs',()=>{
 for(const fields of [
  {initial_soil_mg:0},{initial_soil_mg:''},{residual_soil_mg:-1},
  {water_ml:'foo'},{energy_wh:Infinity},{damage_score:6},{seconds:0},
  {condition:'G'}
 ]){
  const a=validateDataset([{...rows[0],...fields}]);
  assert.equal(a.ok,false,JSON.stringify(fields));
 }
});
test('a specimen can have negative apparent removal without being removed',()=>{
 const r=validateDataset([{...rows[0],residual_soil_mg:120}]);
 assert.equal(r.ok,true);
 assert.equal(r.rows[0].removalPercent,-20);
});
test('correct primary, recovery, and unmatched soil arithmetic',()=>{
 const a=validateDataset([{...rows[0],initial_soil_mg:100,residual_soil_mg:35,recovered_soil_mg:50}]);
 assert.equal(a.ok,true);
 assert.equal(a.rows[0].removalPercent,65);
 assert.equal(a.rows[0].recoveryPercent,50);
 assert.equal(a.rows[0].unaccountedSoilMg,15);
});
test('missing comparison groups never invent confidence intervals',()=>{
 const a=analyzeDataset(rows.filter(x=>x.condition==='D'),{origin:'synthetic_demo'});
 assert.equal(a.ok,true);
 assert.ok(a.comparisons.every(x=>x.eligible===false&&x.comparison===null));
});
test('comparison is blocked for unmatched batch or fabric',()=>{
 const data=rows.filter(x=>['D','C'].includes(x.condition)).map(x=>x.condition==='D'?{...x,batch_id:'DIFFERENT'}:x);
 const a=analyzeDataset(data);
 assert.equal(a.comparisons.find(x=>x.id==='D_C').eligible,false);
});
test('comparison is blocked by water or energy mismatch',()=>{
 const original=rows.filter(x=>['D','C'].includes(x.condition));
 const water=analyzeDataset(original.map(x=>x.condition==='D'?{...x,water_ml:300}:x));
 assert.ok(water.comparisons.find(x=>x.id==='D_C').reasons.some(x=>x.includes('water')));
 const energy=analyzeDataset(original.map(x=>x.condition==='D'?{...x,energy_wh:30}:x));
 assert.ok(energy.comparisons.find(x=>x.id==='D_C').reasons.some(x=>x.includes('energy')));
});
test('bootstrap is deterministic, bounded for constant inputs',()=>{
 const x=bootstrapDifference([50,50,50],[20,20,20]);
 assert.deepEqual(x,bootstrapDifference([50,50,50],[20,20,20]));
 assert.equal(x.difference,30);
 assert.equal(x.low,30);
 assert.equal(x.high,30);
});
test('bootstrap rejects underpowered arrays and invalid values',()=>{
 assert.throws(()=>bootstrapDifference([1,2],[1,2,3]),RangeError);
 assert.throws(()=>bootstrapDifference([1,2,NaN],[1,2,3]),RangeError);
});
test('full synthetic demo produces descriptive comparisons only',()=>{
 const a=analyzeDataset(rows,{origin:'synthetic_demo'});
 assert.equal(a.ok,true);
 assert.equal(a.groups.length,6);
 assert.equal(a.specimenCount,60);
 assert.ok(a.comparisons.find(x=>x.id==='D_C').eligible);
 assert.ok(a.comparisons.find(x=>x.id==='D_C').comparison.low<a.comparisons.find(x=>x.id==='D_C').comparison.high);
 assert.equal(a.assumptions.registration,'Exploratory only; not confirmatory analysis');
});
test('round-trip CSV preserves row values',()=>{
 const r=parseCSV(toCSV(rows));
 const validated=validateDataset(r);
 assert.equal(validated.ok,true);
 assert.equal(validated.rows.length,rows.length);
 assert.equal(validated.rows[0].initial_soil_mg,100);
});
test('results flag soil mass discrepancies and damages, no loss of negative signs',()=>{
 const e=analyzeDataset([{...rows[0],recovered_soil_mg:999,damage_score:2,residual_soil_mg:140}]);
 assert.ok(e.issues.some(x=>x.includes('more recovered')));
 assert.ok(e.issues.some(x=>x.includes('negative apparent removal')));
 assert.ok(e.issues.some(x=>x.includes('damage')));
});
