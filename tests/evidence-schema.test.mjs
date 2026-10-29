import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLUMNS, CONDITIONS } from '../src/evidence.mjs';
const s=JSON.parse(readFileSync(new URL('../schemas/e0-trial.v0.1.schema.json',import.meta.url),'utf8'));

test('E0 JSON Schema has all CSV columns exactly once',()=>{
 assert.deepEqual(s.required,COLUMNS);
 assert.deepEqual(Object.keys(s.properties),COLUMNS);
 assert.equal(s.additionalProperties,false);
});
test('experimental condition schema matches analysis registry',()=>{
 assert.deepEqual(s.properties.condition.enum,Object.keys(CONDITIONS));
});
test('no negative water/energy/damage and initial soil must be positive',()=>{
 assert.equal(s.properties.initial_soil_mg.exclusiveMinimum,0);
 assert.equal(s.properties.water_ml.minimum,0);
 assert.equal(s.properties.energy_wh.minimum,0);
 assert.equal(s.properties.damage_score.maximum,5);
});
