import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, normalizeControls, step, summary } from '../src/engine.mjs';

test('repeatable seeded initial state', () => {
  const a = createState({ seed: 369, count: 30 });
  const b = createState({ seed: 369, count: 30 });
  assert.deepEqual(a, b);
  assert.equal(summary(a).attached, 30);
});
test('mass-count bookkeeping always conserves model particles', () => {
  const s = createState({ count: 120, seed: 99 });
  for (let k = 0; k < 500; k++) {
    const m = step(s, { circulation: .9, mist: 1, extraction: 1, soil: 'dust' }, .2);
    assert.equal(m.attached + m.mobile + m.captured, m.total);
    assert.ok(m.capturedPercent >= 0 && m.capturedPercent <= 100);
    assert.ok(m.releasedPercent >= m.capturedPercent);
  }
});
test('no extraction means no captured proxies', () => {
  const s = createState({ count: 80 });
  for (let k = 0; k < 400; k++) step(s, { circulation: 1, mist: 1, extraction: 0 }, .2);
  assert.equal(summary(s).captured, 0);
});
test('active extraction captures some mobilized proxies', () => {
  const s = createState({ count: 150, seed: 369 });
  for (let k = 0; k < 500; k++) step(s, { circulation: .5, mist: 1, extraction: 1, soil: 'dust' }, .2);
  assert.ok(summary(s).captured > 0);
});
test('deterministic time stepping', () => {
  const a = createState({ count: 24, seed: 12 });
  const b = createState({ count: 24, seed: 12 });
  for (let k = 0; k < 40; k++) { step(a, undefined, .1); step(b, undefined, .1); }
  assert.deepEqual(a, b);
  assert.ok(Math.abs(summary(a).time - 4) < 1e-10);
});
test('controls are bounded and unfamiliar soils fall back safely', () => {
  assert.deepEqual(normalizeControls({ circulation: -10, mist: 4, extraction: NaN, soil: 'unobtainium' }), {
    circulation: 0, mist: 1, extraction: 0, soil: 'dust'
  });
  assert.throws(() => createState({ count: 5000 }), RangeError);
  assert.throws(() => step(createState(), {}, 2), RangeError);
});
