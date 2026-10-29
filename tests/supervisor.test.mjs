import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,dewPointC,DEFAULT_SNAPSHOT,MODES} from '../src/supervisor.mjs';

const inspect=(mode,overrides={})=>evaluate({...DEFAULT_SNAPSHOT,mode,...overrides});
test('normal example watch and preserve are eligible',()=>{
 for(const mode of ['watch','preserve']) assert.equal(inspect(mode).eligible,true);
});
test('closed door and dry zone required for active cycles',()=>{
 assert.equal(inspect('bubblegear',{doorClosed:false}).eligible,false);
 assert.equal(inspect('bubblegear',{wetBayIsolated:false}).eligible,false);
 assert.equal(inspect('finish',{tankReady:false}).eligible,false);
});
test('mains required for wet and thermal modes even if large battery',()=>{
 for(const mode of ['bubblegear','finish']){
  const s=inspect(mode,{mainsAvailable:false,storedBatteryWh:5000,batteryContinuousW:2000});
  assert.equal(s.eligible,false);
  assert.ok(s.checks.some(c=>c.id==='mains-required'&&!c.pass));
 }
});
test('battery power class enforced for accessory cycles',()=>{
 assert.equal(inspect('midifier',{mainsAvailable:false,storedBatteryWh:300,batteryContinuousW:5}).eligible,false);
 assert.equal(inspect('midifier',{mainsAvailable:false,storedBatteryWh:300,batteryContinuousW:30}).eligible,true);
 assert.equal(inspect('preserve',{mainsAvailable:false,storedBatteryWh:10,batteryContinuousW:30}).eligible,false);
});
test('reported leak blocks active modes while watch reports warning',()=>{
 assert.equal(inspect('preserve',{leakDry:false}).eligible,false);
 const s=inspect('watch',{leakDry:false});
 assert.equal(s.eligible,true);
 assert.ok(s.warnings.some(x=>x.includes('Leak')));
});
test('humid/cold-surface envelope blocks experimental accessory',()=>{
 assert.equal(inspect('midifier',{humidityRH:82}).eligible,false);
 assert.equal(inspect('refresh',{surfaceTemperatureC:10,temperatureC:22,humidityRH:48}).eligible,false);
 assert.ok(inspect('watch',{surfaceTemperatureC:10}).warnings.some(x=>x.includes('condensation')));
});
test('stale or missing/invalid sensors fail closed',()=>{
 assert.equal(inspect('refresh',{sensorFresh:false}).eligible,false);
 assert.equal(inspect('refresh',{temperatureC:NaN}).eligible,false);
 assert.equal(inspect('refresh',{humidityRH:undefined}).eligible,false);
 assert.equal(inspect('refresh',{doorClosed:'yes'}).eligible,false);
 assert.equal(inspect('refresh',{storedBatteryWh:Infinity}).eligible,false);
});
test('dew point physically bounded and rejects invalid inputs',()=>{
 const point=dewPointC(22,50);
 assert.ok(point>10&&point<13);
 assert.equal(dewPointC(22,101),null);
 assert.equal(dewPointC(22,0),null);
 assert.equal(dewPointC(NaN,50),null);
});
test('every profile has nonnegative budget and documented active power',()=>{
 for(const mode of Object.keys(MODES)){
  const s=inspect(mode);
  assert.equal(s.mode,mode);
  assert.ok(s.dailyEnergyWh>=0&&s.assumedActiveW>0);
  assert.equal(s.advisoryOnly,true);
  assert.equal(s.checks.every(c=>c.pass),s.eligible);
 }
});
test('unknown mode rejected rather than silently authorized',()=>{
 assert.throws(()=>evaluate({...DEFAULT_SNAPSHOT,mode:'unknown'}),RangeError);
});
