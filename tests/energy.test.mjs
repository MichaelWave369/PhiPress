import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILES, estimateEnergy } from '../src/energy.mjs';

test('watch profile: 1.5 W for 24 hours is 36 Wh/day', () => {
  const a=estimateEnergy('watch');
  assert.equal(a.dailyWh,36);
  assert.equal(a.usableWh,255);
  assert.ok(Math.abs(a.daysIfDaily - 255/36)<1e-12);
});
test('active profile combines active usage and background monitor',()=>{
  const p=PROFILES.bubblegear;
  const a=estimateEnergy('bubblegear',{capacityWh:500,maxOutputW:500,efficiency:.8});
  assert.equal(a.dailyWh,p.watts*p.hours + p.monitorWatts*(24-p.hours));
  assert.equal(a.usableWh,400);
});
test('battery rated at 150 W cannot run 900 W finishing', () => {
  const a=estimateEnergy('finish');
  assert.equal(a.supportsPeak,false);
  assert.equal(a.daysIfDaily,null);
});
test('battery rated above finishing power passes peak feasibility only',()=>{
  const a=estimateEnergy('finish',{capacityWh:2000,maxOutputW:1000,efficiency:.75});
  assert.equal(a.supportsPeak,true);
  assert.ok(a.daysIfDaily>0);
});
test('unknown mode and nonphysical inputs rejected',()=>{
 assert.throws(()=>estimateEnergy('magic'),RangeError);
 for(const bad of [-1,NaN,Infinity]) assert.throws(()=>estimateEnergy('watch',{capacityWh:bad}),RangeError);
 assert.throws(()=>estimateEnergy('watch',{efficiency:0}),RangeError);
 assert.throws(()=>estimateEnergy('watch',{maxOutputW:-1}),RangeError);
});
test('profiles are positive and daily accounting nonnegative',()=>{
 for(const key of Object.keys(PROFILES)){
  const x=estimateEnergy(key,{capacityWh:3000,maxOutputW:2000,efficiency:.85});
  assert.ok(x.dailyWh>=x.energyPerCycleWh);
  assert.ok(x.dailyWh>0);
  assert.ok(x.usableWh<=3000);
 }
});
