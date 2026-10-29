import test from 'node:test';
import assert from 'node:assert/strict';
import { FIXTURES } from '../src/fixture-bench.mjs';
import {
 MOCKUP_DEFAULTS,UNCERTAINTY_DEFAULTS,INSTRUMENTS,HAZARDS,
 inspectMockup,propagateSoilUncertainty,preflightReceipt
} from '../src/preflight.mjs';

test('mockup has coherent dimensions and reports unpowered candidate only',()=>{
 const x=inspectMockup();
 assert.equal(x.envelopePass,true);
 assert.equal(x.result,'FITS HYPOTHETICAL ENVELOPE');
 assert.equal(x.poweredPrototypeApproved,false);
 assert.equal(x.printableSketchOnly,true);
 assert.equal(x.required.widthMm,FIXTURES.shirt.widthMm+MOCKUP_DEFAULTS.widthAllowanceMm);
});
test('all supported fixtures can be inspected deterministically',()=>{
 for(const f of Object.keys(FIXTURES)){
  const a=inspectMockup({fixture:f});
  assert.deepEqual(a,inspectMockup({fixture:f}));
  assert.ok(a.checks.every(c=>typeof c.pass==='boolean'));
 }
});
test('narrow width, short height, shallow depth, closed door fail checks',()=>{
 assert.ok(inspectMockup({cavityWidthMm:400}).checks.find(c=>c.id==='width').pass===false);
 assert.ok(inspectMockup({cavityHeightMm:600}).checks.find(c=>c.id==='height').pass===false);
 assert.ok(inspectMockup({cavityDepthMm:300}).checks.find(c=>c.id==='depth').pass===false);
 assert.ok(inspectMockup({doorOpeningWidthMm:350}).checks.find(c=>c.id==='door').pass===false);
 assert.ok(inspectMockup({serviceReachMm:100}).checks.find(c=>c.id==='service').pass===false);
});
test('exact boundary of 20 mm door and 200 mm service allowances passes',()=>{
 const p=inspectMockup({doorOpeningWidthMm:FIXTURES.shirt.widthMm+20,serviceReachMm:200});
 assert.ok(p.checks.find(c=>c.id==='door').pass);
 assert.ok(p.checks.find(c=>c.id==='service').pass);
});
test('cannot claim physical certification by switching stages or user-entered dimensions',()=>{
 const a=inspectMockup({stage:'future-powered',measurementsSource:'user-entered-unverified'});
 assert.equal(a.poweredPrototypeApproved,false);
});
test('invalid mockup values and source flags fail',()=>{
 for(const bad of [
  {fixture:'motor'},{stage:'certified'},{measurementsSource:'measured-and-verified'},
  {cavityWidthMm:NaN},{cavityHeightMm:-2},{widthAllowanceMm:Infinity},
  {serviceReachMm:'200'}
 ])assert.throws(()=>inspectMockup(bad),RangeError);
});
test('propagates independent uncertainties for soil mass accounting',()=>{
 const x=propagateSoilUncertainty();
 assert.equal(x.removalPercent,45);
 assert.equal(x.recoveryPercent,30);
 assert.equal(x.unaccountedSoilMg,15);
 assert.ok(Math.abs(x.uRemovalPercent-Math.hypot(.55,1))<.0001);
 assert.ok(Math.abs(x.uRecoveryPercent-Math.hypot(.3,1))<.0001);
 assert.ok(Math.abs(x.uUnaccountedSoilMg-Math.sqrt(3))<.0001);
 assert.equal(x.k2IsConfidenceInterval,false);
});
test('increased measurement uncertainty increases propagated uncertainty',()=>{
 const a=propagateSoilUncertainty();
 const b=propagateSoilUncertainty({uInitialMg:2,uResidualMg:2,uRecoveredMg:2});
 assert.ok(b.uRemovalPercent>a.uRemovalPercent);
 assert.ok(b.uRecoveryPercent>a.uRecoveryPercent);
 assert.ok(b.uUnaccountedSoilMg>a.uUnaccountedSoilMg);
});
test('water and energy uncertainties propagate into exploratory intensity ratios',()=>{
 const a=propagateSoilUncertainty();
 const b=propagateSoilUncertainty({uWaterMl:10,uEnergyWh:3});
 assert.ok(a.uRemovedMgPerMl>0&&a.uRemovedMgPerWh>0);
 assert.ok(b.uRemovedMgPerMl>a.uRemovedMgPerMl);
 assert.ok(b.uRemovedMgPerWh>a.uRemovedMgPerWh);
 const c=propagateSoilUncertainty({waterMl:0,energyWh:0});
 assert.equal(c.uRemovedMgPerMl,null);
 assert.equal(c.uRemovedMgPerWh,null);
});
test('negative removal and negative unaccounted soil are never clamped',()=>{
 const a=propagateSoilUncertainty({residualSoilMg:120,recoveredSoilMg:50});
 assert.ok(a.removalPercent<0);
 assert.ok(a.unaccountedSoilMg<0);
 assert.ok(a.flags.some(x=>x.includes('exceeds input')));
});
test('zero water, energy and all-zero uncertainty produce warnings',()=>{
 const a=propagateSoilUncertainty({waterMl:0,energyWh:0,uInitialMg:0,uResidualMg:0,uRecoveredMg:0});
 assert.equal(a.removedMgPerMl,null);
 assert.equal(a.removedMgPerWh,null);
 assert.ok(a.flags.some(x=>x.includes('Zero uncertainty')));
 assert.ok(a.flags.some(x=>x.includes('resource efficiency')));
});
test('invalid uncertainty inputs cannot be used to assert success',()=>{
 for(const bad of [
  {initialSoilMg:0},{residualSoilMg:-1},{uInitialMg:-1},{energyWh:Infinity},
  {waterMl:NaN},{uWaterMl:'2'},{source:'verified'}
 ])assert.throws(()=>propagateSoilUncertainty(bad),RangeError);
});
test('preflight never authorizes powered hardware even when all boxes checked',()=>{
 const fullInstruments=Object.fromEntries(INSTRUMENTS.map(x=>[x.id,true]));
 const fullHazards=Object.fromEntries(HAZARDS.map(x=>[x.id,true]));
 const a=preflightReceipt({instruments:fullInstruments,hazards:fullHazards});
 assert.equal(a.availableCount,INSTRUMENTS.length);
 assert.equal(a.riskReviewCount,HAZARDS.length);
 assert.equal(a.physicalDeviceApproval,false);
 assert.equal(a.evidenceOfPhysicalMeasurements,false);
 assert.ok(a.status.includes('NOT AUTHORIZED'));
});
test('partial checklists count only explicit true values and cannot self-certify',()=>{
 const a=preflightReceipt({instruments:{dimensions:true,liquid:'yes'},hazards:{battery:true}});
 assert.equal(a.availableCount,1);
 assert.equal(a.riskReviewCount,1);
 assert.equal(a.physicalDeviceApproval,false);
});
