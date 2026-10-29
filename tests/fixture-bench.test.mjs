import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DESIGN,FIXTURES,MODES,evaluateDesign,normalizeDesign } from '../src/fixture-bench.mjs';

const run=(o={})=>evaluateDesign({...DEFAULT_DESIGN,...o});
const failures=(o)=>run(o).checks.filter(c=>c.required&&!c.pass).map(c=>c.id);
test('nominal shirt cabinet + AC sequential cleaning clears model checks',()=>{
 const r=run();
 assert.equal(r.plausible,true);
 assert.ok(r.modules.some(x=>x.id==='vortex'));
 assert.ok(r.modules.some(x=>x.id==='heat'));
 assert.ok(r.metrics.totalEnergyWh>0);
 assert.equal(r.advisoryOnly,true);
});
test('non-matching geometry is blocked rather than reporting a fit',()=>{
 assert.ok(failures({outerWidthMm:500}).includes('fixture-fit'));
 assert.ok(failures({outerHeightMm:1300}).includes('fixture-fit'));
 assert.ok(failures({outerDepthMm:480}).includes('fixture-fit'));
});
test('all fixture allowances are explicitly measurable',()=>{
 for(const fixture of Object.keys(FIXTURES)){
  const r=run({fixture,mode:'refresh'});
  assert.equal(r.cavity.widthMm,r.input.outerWidthMm-100);
  assert.equal(r.envelope.widthMm,FIXTURES[fixture].widthMm+60);
  assert.ok(r.metrics.totalEnergyWh>0);
 }
});
test('hat and shoe disallow heated press even with cooler temperature',()=>{
 for(const fixture of ['hat','shoe']){
  assert.ok(failures({fixture,mode:'finish',finishTemperatureC:25}).includes('mode-compatibility'));
  assert.ok(failures({fixture,mode:'cleanFinish',finishTemperatureC:25}).includes('mode-compatibility'));
 }
});
test('heating shirt beyond trial cap fails provisional policy',()=>{
 assert.ok(failures({mode:'finish',finishTemperatureC:70}).includes('temperature-policy'));
});
test('wet path requires isolation, collection, volume and tank access',()=>{
 assert.ok(failures({wetBayIsolated:false}).includes('wet-bay-isolation'));
 assert.ok(failures({tankReady:false}).includes('collection-ready'));
 assert.ok(failures({dirtyTankCapacityMl:30}).includes('tank-capacity'));
 assert.ok(failures({waterDoseMl:25}).includes('water-dose'));
});
test('wet/thermal request blocked without mains even with huge battery',()=>{
 for(const mode of ['wet','finish','cleanFinish']){
  assert.ok(failures({mode,mainsAvailable:false,batteryWh:99999,batteryOutputW:20000}).includes('mains-policy'));
 }
});
test('battery-only refresh requires both watts and watt-hours',()=>{
 assert.ok(failures({mode:'refresh',mainsAvailable:false,batteryOutputW:10}).includes('battery-peak'));
 assert.ok(failures({mode:'refresh',mainsAvailable:false,batteryWh:0}).includes('battery-energy'));
 const r=run({mode:'refresh',mainsAvailable:false,batteryWh:100,batteryOutputW:100});
 assert.equal(r.plausible,true);
});
test('watch remains possible without maintenance statuses but reports advisory',()=>{
 const r=run({mode:'watch',leakDry:false,doorClosed:false,materialReviewed:false,ventClear:false});
 assert.equal(r.plausible,true);
 assert.equal(r.advisoryOnly,true);
});
test('unsafe active scenarios fail relevant guards',()=>{
 for(const [key,id] of [
  ['doorClosed','door-status'],['leakDry','leak-containment'],
  ['ventClear','ventilation'],['serviceAccessible','service-access'],
  ['materialReviewed','fabric-review']
 ]) assert.ok(failures({[key]:false}).includes(id),key);
});
test('planned parts are distinct and correspond to the requested process',()=>{
 for(const mode of Object.keys(MODES)){
  const x=run({mode});
  assert.equal(new Set(x.modules.map(p=>p.id)).size,x.modules.length);
  assert.equal(x.modules.some(p=>p.id==='vortex'),MODES[mode].wet);
  assert.equal(x.modules.some(p=>p.id==='heat'),MODES[mode].heated);
 }
});
test('sequential phase energy and peak accounting are coherent',()=>{
 const x=run();
 assert.equal(x.metrics.peakPowerW,600);
 assert.equal(x.metrics.totalMinutes,55);
 assert.equal(x.metrics.totalEnergyWh,340);
 assert.equal(x.metrics.liquidDoseMl,120);
});
test('unknown mode/fixture or invalid data throws instead of silently passing',()=>{
 for(const change of [
  {mode:'sterilize'},{fixture:'unknown'},{outerWidthMm:Infinity},
  {outerHeightMm:0},{dirtyTankCapacityMl:-10},{waterDoseMl:NaN},
  {mainsAvailable:'true'},{finishTemperatureC:100},
  {batteryUsableFraction:0}
 ]) assert.throws(()=>normalizeDesign(change),RangeError);
});
test('deterministic model and explicit check receipts',()=>{
 assert.deepEqual(run(),run());
 const r=run({mode:'refresh',mainsAvailable:false,batteryWh:0});
 assert.equal(r.plausible,r.checks.filter(c=>c.required).every(c=>c.pass));
 assert.equal(r.result,'BLOCKED IN MODEL');
 assert.ok(r.warnings.length>0);
});
