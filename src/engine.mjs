// ΦPRESS research bench: deliberately simplified deterministic particle transport.
// NOT CFD, textile-cleaning efficacy, or a safe hardware controller.
export const DEFAULT_CONTROLS = Object.freeze({
  circulation: 0.7, mist: 0.55, extraction: 0.75, soil: 'dust'
});
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(Number(n)) ? Number(n) : lo));
const SOIL_RELEASE = Object.freeze({ dust: 1.0, sweat: 0.58, oil: 0.22 });
export function normalizeControls(values = {}) {
  return {
    circulation: clamp(values.circulation ?? DEFAULT_CONTROLS.circulation, 0, 1),
    mist: clamp(values.mist ?? DEFAULT_CONTROLS.mist, 0, 1),
    extraction: clamp(values.extraction ?? DEFAULT_CONTROLS.extraction, 0, 1),
    soil: Object.hasOwn(SOIL_RELEASE, values.soil) ? values.soil : 'dust'
  };
}
function random(state) {
  state.seed = (Math.imul(1664525, state.seed) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}
export function createState({ count = 260, seed = 369 } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 3000) throw new RangeError('count must be 1..3000');
  const state = { seed: seed >>> 0, time: 0, particles: [] };
  for (let i = 0; i < count; i++) {
    const radius = Math.sqrt(0.12 + 0.73 * random(state));
    const angle = random(state) * 2 * Math.PI;
    state.particles.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      stuck: true, captured: false
    });
  }
  return state;
}
export function summary(state) {
  const total = state.particles.length;
  let attached = 0, mobile = 0, captured = 0;
  for (const p of state.particles) {
    if (p.captured) captured++;
    else if (p.stuck) attached++;
    else mobile++;
  }
  return {
    total, attached, mobile, captured,
    released: mobile + captured,
    capturedPercent: 100 * captured / total,
    releasedPercent: 100 * (mobile + captured) / total,
    time: state.time
  };
}
export function step(state, controls = DEFAULT_CONTROLS, dt = 1 / 30) {
  if (!Number.isFinite(dt) || dt < 0 || dt > 1) throw new RangeError('dt must be in [0,1]');
  const c = normalizeControls(controls);
  const factor = SOIL_RELEASE[c.soil];
  // Rates are deliberately arbitrary and uncalibrated. They're hypotheses for UI exploration.
  const releaseRate = factor * (0.002 + 0.036 * c.mist + 0.018 * c.circulation);
  for (const p of state.particles) {
    if (p.captured) continue;
    if (p.stuck) {
      if (random(state) < 1 - Math.exp(-releaseRate * dt)) p.stuck = false;
      else continue;
    }
    const radius = Math.max(0.0001, Math.hypot(p.x, p.y));
    let vx = -p.y * 0.33 * c.circulation;
    let vy = p.x * 0.33 * c.circulation;
    // Nine alternating local vortices, a visual design hypothesis rather than a fluid solver.
    for (let k = 0; k < 9; k++) {
      const a = k * Math.PI * 2 / 9;
      const dx = p.x - 0.64 * Math.cos(a);
      const dy = p.y - 0.64 * Math.sin(a);
      const weight = Math.exp(-(dx * dx + dy * dy) / 0.085);
      const direction = k % 2 === 0 ? 1 : -1;
      vx += -dy * weight * direction * 0.65 * c.circulation;
      vy += dx * weight * direction * 0.65 * c.circulation;
    }
    // Extracted particles are terminal; removing them prevents modeled redeposition.
    vx -= p.x / radius * 0.34 * c.extraction;
    vy -= p.y / radius * 0.34 * c.extraction;
    p.x += vx * dt + (random(state) - 0.5) * 0.035 * dt;
    p.y += vy * dt + (random(state) - 0.5) * 0.035 * dt;
    const r = Math.hypot(p.x, p.y);
    if (r <= 0.115 && c.extraction > 0) p.captured = true;
    else if (r > 0.96) {
      p.x *= 0.96 / r;
      p.y *= 0.96 / r;
    }
  }
  state.time += dt;
  return summary(state);
}
