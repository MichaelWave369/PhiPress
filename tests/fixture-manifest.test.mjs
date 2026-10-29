import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIXTURES, MODES } from '../src/fixture-bench.mjs';

const read=(path)=>JSON.parse(readFileSync(new URL(path, import.meta.url),'utf8'));
const schema=read('../schemas/fixture-manifest.v0.1.schema.json');

test('manifest schema fixes version, known fixtures, and zero claims',()=>{
 assert.equal(schema.properties.contractVersion.const,'phipress.fixture-manifest.v0.1');
 assert.equal(schema.properties.validatedClaims.maxItems,0);
 assert.equal(schema.additionalProperties,false);
});
for(const id of Object.keys(FIXTURES)){
 test('manifest describes '+id+' exactly as used by the bench',()=>{
  const m=read('../fixtures/'+id+'.json'),x=FIXTURES[id];
  assert.equal(m.contractVersion,'phipress.fixture-manifest.v0.1');
  assert.equal(m.fixtureId,id);
  assert.equal(m.displayName,x.name);
  assert.deepEqual(m.envelopeMm,{width:x.widthMm,depth:x.depthMm,height:x.heightMm});
  assert.deepEqual(m.allowedModes,x.modes);
  assert.equal(m.mount,x.mount);
  assert.equal(m.materialScope,x.materials);
  assert.equal(m.candidateMaxTemperatureC,x.maxCandidateTempC);
  assert.deepEqual(m.validatedClaims,[]);
  assert.ok(m.allowedModes.every(mode=>Object.hasOwn(MODES,mode)));
  assert.deepEqual(Object.keys(m).sort(),schema.required.slice().sort());
 });
}
