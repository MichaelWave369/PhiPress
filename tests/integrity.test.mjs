import test from 'node:test';
import assert from 'node:assert/strict';
import {
 INTEGRITY_SCHEMA,createManifest,validateAssets,validateManifest,
 verifySelection,auditReferences,evaluateUncertaintyBudget
} from '../src/integrity.mjs';
import { REGISTRY_SCHEMA,validateRegistry,validateMaskedRoster } from '../src/observations.mjs';
import { createPlan,assessorTemplateCSV } from '../src/study-plan.mjs';

const SHA_A='a'.repeat(64),SHA_B='b'.repeat(64);
const file=(reference_id,category,sha256=SHA_A,filename=reference_id+'.csv')=>({
 reference_id,category,bytes:123,sha256,filename
});
const sample=[file('raw-1','raw'),file('blank-1','blank',SHA_B),
 file('method-1','method'),file('cal-1','calibration')];
const manifest=createManifest(sample);
test('manifest stores sorted exact references without pretending provenance',()=>{
 assert.equal(manifest.schema,INTEGRITY_SCHEMA);
 assert.deepEqual(manifest.entries.map(x=>x.reference_id),['blank-1','cal-1','method-1','raw-1']);
 assert.equal(validateManifest(manifest).ok,true);
 assert.equal(manifest.rootOfTrust.startsWith('NONE'),true);
});
test('digest invalid, duplicate reference/file, traversal and category mismatch fail',()=>{
 assert.equal(validateAssets([{...sample[0],sha256:'sha256:123'}]).ok,false);
 assert.equal(validateAssets([sample[0],sample[0]]).ok,false);
 assert.equal(validateAssets([{...sample[0],filename:'../bad'}]).ok,false);
 assert.equal(validateAssets([{...sample[0],filename:'dir\\\\bad'}]).ok,false);
 assert.equal(validateAssets([{...sample[0],category:'calibrated-and-approved'}]).ok,false);
 assert.equal(validateManifest({schema:'unknown',entries:sample}).ok,false);
});
test('verification requires actual local hash and byte match, not filename',()=>{
 const correct=sample.map(x=>({filename:x.filename,bytes:x.bytes,sha256:x.sha256}));
 assert.deepEqual(verifySelection(manifest,correct),{ok:true,errors:[],matched:4,required:4});
 assert.equal(verifySelection(manifest,correct.map((x,i)=>i?x:{...x,sha256:SHA_B})).ok,false);
 assert.equal(verifySelection(manifest,correct.slice(0,-1)).ok,false);
 assert.equal(verifySelection(manifest,[...correct,{filename:'extra',bytes:1,sha256:SHA_A}]).ok,false);
});
test('pure audit verifies all raw, blank, method and calibration links, not certificates',()=>{
 const plan=createPlan({blocks:1,replicatesPerCondition:3});
 const roster=validateMaskedRoster(assessorTemplateCSV(plan));
 const instrument={instrument_id:'MASS',display_name:'Declared instrument',
  supported_measurements:['initial_soil_mg'],valid_from:'2026-01-01',valid_through:'2026-12-31',
  uncertainty_floor:{initial_soil_mg:0.1},calibration_reference:'cal-1',
  method_reference:'method-1',declared_by:'USER'};
 const registry=validateRegistry({schema:REGISTRY_SCHEMA,instruments:[instrument]});
 const x=roster.rows[0];
 const ev={record_id:'REC',trial_id:x.trial_id,specimen_id:x.specimen_id,batch_id:x.batch_id,
  measurement:'initial_soil_mg',value:100,unit:'mg',standard_uncertainty:1,
  instrument_id:'MASS',observed_at_utc:'2026-10-01T00:00:00Z',operator_id:'OP',
  raw_reference:'raw-1',blank_reference:'blank-1',method_reference:'method-1',notes:''};
 const audit=auditReferences({manifest,registry,roster,events:[ev]});
 assert.ok(audit.references.some(r=>r.reference_id==='raw-1'));
 assert.ok(audit.references.some(r=>r.reference_id==='cal-1'));
 assert.equal(audit.readyInModel,false); // missing specimen channels
 assert.equal(audit.physicalEvidenceVerified,false);
 assert.equal(audit.calibrationAuthenticated,false);
 const wrong=createManifest(sample.map(x=>x.reference_id==='raw-1'?{...x,category:'method'}:x));
 assert.ok(auditReferences({manifest:wrong,registry,roster,events:[ev]})
  .errors.some(x=>x.includes('Wrong category')));
});
test('uncertainty components propagate root sum of squares deterministically',()=>{
 const r=evaluateUncertaintyBudget();
 assert.equal(r.validArithmetic,true);
 assert.equal(r.combinedStandard,1);
 assert.equal(r.expandedK2,2);
 assert.equal(r.documentedByUser,false);
 assert.equal(r.isConfidenceInterval,false);
 assert.equal(r.physicalCalibrationVerified,false);
});
test('wrong units, missing component, inconsistent u and bogus sources are flagged',()=>{
 assert.equal(evaluateUncertaintyBudget({unit:'Wh'}).validArithmetic,false);
 assert.equal(evaluateUncertaintyBudget({components:[]}).validArithmetic,false);
 assert.equal(evaluateUncertaintyBudget({reportedStandard:3}).reportedConsistent,false);
 const r=evaluateUncertaintyBudget({components:[{kind:'B',name:'calibration',standard:1,reference_id:'CAL'}]});
 assert.equal(r.validArithmetic,true);
 assert.equal(r.documentedByUser,true);
});
test('measurement type and independent uncertainty input checked for valid numeric range',()=>{
 const r=evaluateUncertaintyBudget({measurement:'energy_wh',unit:'Wh',reportedStandard:1});
 assert.equal(r.validArithmetic,true);
 assert.equal(evaluateUncertaintyBudget({reportedStandard:NaN}).validArithmetic,false);
 assert.equal(evaluateUncertaintyBudget({components:[{kind:'A',name:'repeatability',standard:-1,reference_id:'a'}]}).validArithmetic,false);
});
