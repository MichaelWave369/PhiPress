import test from 'node:test';
import assert from 'node:assert/strict';
import { runTwin, TWIN_DEFAULTS, TWIN_SCENARIOS, inputs, saturationDensityGPerM3, vaporDensityFromRH } from '../src/twin.mjs';

const run=(o={})=>runTwin({...TWIN_DEFAULTS,...o});
test('expected saturation density is physically plausible at 20 C',()=>{
  const n=saturationDensityGPerM3(20);
  assert.ok(n>17&&n<18);
  assert.ok(Math.abs(vaporDensityFromRH(20,50)-n/2)<1e-10);
});
test('deterministic runs have 144, 288 or 432 points',()=>{
  for(const hours of [24,48,72]){
    const a=run({hours}), b=run({hours});
    assert.deepEqual(a,b);
    assert.equal(a.series.length,hours*6);
    assert.equal(a.series.at(-1).hour,hours);
  }
});
test('water mass bookkeeping closes under every built-in scenario',()=>{
  for(const s of Object.values(TWIN_SCENARIOS)){
    const a=runTwin(s);
    assert.ok(Math.abs(a.metrics.waterBalanceErrorG)<1e-7,JSON.stringify(a.metrics));
    assert.ok(a.series.every(p=>p.airWaterG>=0&&p.garmentWaterG>=0&&p.recoveredWaterG>=0&&p.surfaceCondensateG>=0));
  }
});
test('external humidity changes cabinet RH with nonzero infiltration',()=>{
  const a=run({garmentWaterG:0,ambientRH:25,airChangesPerHour:1});
  const b=run({garmentWaterG:0,ambientRH:90,airChangesPerHour:1});
  assert.ok(a.metrics.finalRH<b.metrics.finalRH);
});
test('internal fan does not remove moisture or increase external air exchange',()=>{
  const base={garmentWaterG:0,airChangesPerHour:0,initialRH:50};
  const watch=run({...base,mode:'watch'});
  const fan=run({...base,mode:'fan'});
  assert.equal(watch.metrics.finalRH,fan.metrics.finalRH);
  assert.equal(watch.metrics.ambientExchangeG,0);
  assert.equal(fan.metrics.ambientExchangeG,0);
  assert.ok(fan.metrics.consumedWh>watch.metrics.consumedWh);
});
test('fan can accelerate garment evaporation without removing the water',()=>{
  const base={garmentWaterG:100,evaporationGPerHour:1,airChangesPerHour:0,surfaceTemperatureC:30,initialRH:25};
  const watch=run({...base,mode:'watch'});
  const fan=run({...base,mode:'fan'});
  assert.ok(fan.metrics.garmentWaterRemainingG<watch.metrics.garmentWaterRemainingG);
});
test('simulated AC dehumidification reduces high RH duration vs watching',()=>{
  const base={garmentWaterG:30,evaporationGPerHour:1,ambientRH:75,initialRH:80,surfaceTemperatureC:26,airChangesPerHour:.2};
  const watch=run({...base,mode:'watch'});
  const dry=run({...base,mode:'dry'});
  assert.ok(dry.metrics.dehumHours>0);
  assert.ok(dry.metrics.highRHHours<watch.metrics.highRHHours);
  assert.ok(dry.metrics.recoveredWaterG>0);
  assert.ok(dry.metrics.consumedWh>watch.metrics.consumedWh);
});
test('AC-only recovery is blocked on battery regardless of energy size',()=>{
  const a=run({mode:'dry',initialRH:90,ambientRH:90,hasMains:false,batteryCapacityWh:3000});
  assert.equal(a.metrics.dehumHours,0);
  assert.ok(a.metrics.blockedDryHours>0);
  assert.equal(a.metrics.recoveredWaterG,0);
});
test('recovery does not run with leak or missing reservoir',()=>{
  for(const override of [{leakClear:false},{recoveryAvailable:false},{ventClear:false}]){
    const a=run({mode:'dry',initialRH:90,...override});
    assert.equal(a.metrics.dehumHours,0);
    assert.ok(a.metrics.blockedDryHours>0);
  }
});
test('battery depletes rather than becoming negative',()=>{
  const a=run({mode:'fan',hasMains:false,batteryCapacityWh:1,batteryUsableFraction:.5});
  assert.ok(a.metrics.unpoweredHours>0);
  assert.equal(a.metrics.mainsWh,0);
  assert.ok(a.metrics.batteryRemainingWh>=0);
  assert.ok(a.metrics.batteryUsedWh<=.5+1e-7);
  assert.ok(a.series.every(x=>x.batteryRemainingWh>=0));
});
test('surface condensate is retained rather than silently disappearing',()=>{
  const a=run({mode:'watch',initialRH:95,ambientRH:95,surfaceTemperatureC:9});
  assert.ok(a.metrics.surfaceCondensateG>0);
  assert.ok(a.metrics.condensationHours>0);
  assert.ok(Math.abs(a.metrics.waterBalanceErrorG)<1e-7);
});
test('invalid humidity, temperature, mode, ranges or binary inputs fail early',()=>{
  for(const override of [
    {mode:'sterilize'},{hours:25},{ambientRH:101},{ambientRH:NaN},
    {batteryCapacityWh:-1},{airChangesPerHour:Infinity},
    {hasMains:'true'},{cabinetVolumeM3:0},{surfaceTemperatureC:-40}
  ]) assert.throws(()=>inputs(override),RangeError);
});
test('valid outputs are bounded for every built-in scenario',()=>{
  for(const value of Object.values(TWIN_SCENARIOS)){
    const a=runTwin(value);
    assert.ok(a.series.every(p=>p.rh>=0&&p.rh<=100));
    assert.ok(a.metrics.consumedWh>=0);
    assert.equal(a.assumptions.temperatureHeldConstant,true);
  }
});
