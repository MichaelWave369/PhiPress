import { createState, step, summary } from '../src/engine.mjs';

const $ = (id) => document.getElementById(id);
const canvas = $('chamber');
const ctx = canvas.getContext('2d');
const sampleCounts = { shirt: 260, shoe: 320, hat: 200 };
let state = createState({ count: sampleCounts.shirt, seed: 369 });
let running = false;
let last = 0;

const controls = () => ({
  circulation: Number($('circulation').value) / 100,
  mist: Number($('mist').value) / 100,
  extraction: Number($('extraction').value) / 100,
  soil: $('soil').value
});
function updateUI() {
  const m = summary(state);
  $('attached').textContent = String(m.attached);
  $('mobile').textContent = String(m.mobile);
  $('captured').textContent = String(m.captured);
  $('captured-pct').textContent = m.capturedPercent.toFixed(1) + '%';
  $('elapsed').textContent = m.time.toFixed(1) + ' simulated seconds';
  $('phase').textContent = m.captured > m.total * 0.55 ? 'RECOVERING PROXIES'
    : m.mobile > 0 ? 'MOBILIZING SOIL' : 'ATTACHED SOIL';
  $('run-state').textContent = running ? 'RUNNING' : 'PAUSED';
  $('toggle').textContent = running ? 'Ⅱ Pause simulation' : '▶ Run simulation';
  for (const name of ['circulation', 'mist', 'extraction']) {
    $(name + '-value').textContent = $(name).value + '%';
  }
}
function reset() {
  const name = $('garment').value;
  state = createState({ count: sampleCounts[name] ?? sampleCounts.shirt, seed: 369 });
  last = 0;
  updateUI();
}
$('toggle').addEventListener('click', () => { running = !running; last = 0; updateUI(); });
$('reset').addEventListener('click', reset);
$('garment').addEventListener('change', reset);
for (const id of ['circulation', 'mist', 'extraction']) {
  $(id).addEventListener('input', updateUI);
}
$('soil').addEventListener('change', updateUI);

function circle(x, y, r, stroke, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}
function draw() {
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2, cy = height / 2;
  const scale = Math.min(width, height) * 0.42;
  const t = state.time;
  const flow = controls().circulation;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.setLineDash([3, 9]);
  for (const r of [0.23, 0.49, 0.73, 0.96]) {
    circle(0, 0, scale * r, 'rgba(105,190,205,.21)', 1);
  }
  ctx.setLineDash([]);
  // Nine alternating vortex motifs and six inner loci. Display geometry is conceptual.
  for (let k = 0; k < 9; k++) {
    const a = 2 * Math.PI * k / 9;
    const x = scale * 0.64 * Math.cos(a);
    const y = scale * 0.64 * Math.sin(a);
    const direction = k % 2 ? -1 : 1;
    circle(x, y, scale * 0.13, 'rgba(98,218,220,.33)', 1);
    const phase = a + t * 0.7 * flow * direction;
    ctx.beginPath();
    ctx.arc(x, y, scale * 0.09, phase, phase + direction * 1.6, direction < 0);
    ctx.strokeStyle = 'rgba(116,231,228,.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (let k = 0; k < 6; k++) {
    const a = 2 * Math.PI * k / 6;
    const x = scale * 0.36 * Math.cos(a);
    const y = scale * 0.36 * Math.sin(a);
    circle(x, y, scale * 0.065, 'rgba(140,216,214,.30)', 1);
  }
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, scale * 0.14);
  gradient.addColorStop(0, 'rgba(104,236,214,.65)');
  gradient.addColorStop(1, 'rgba(104,236,214,.04)');
  ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(0, 0, scale * 0.14, 0, Math.PI * 2); ctx.fill();
  circle(0, 0, scale * 0.115, '#b2f9ec', 2);
  ctx.font = 'bold ' + Math.max(8, scale * 0.037) + 'px ui-monospace,monospace';
  ctx.fillStyle = '#dcfff7';
  ctx.textAlign = 'center';
  ctx.fillText('EXTRACT', 0, 3);
  ctx.fillStyle = '#dcbf87';
  for (const p of state.particles) {
    if (p.captured) continue;
    ctx.beginPath();
    ctx.arc(p.x * scale, p.y * scale, p.stuck ? 2.4 : 2.7, 0, Math.PI * 2);
    ctx.fillStyle = p.stuck ? 'rgba(221,177,111,.80)' : 'rgba(115,236,237,.95)';
    ctx.fill();
  }
  ctx.restore();
}
function frame(timestamp) {
  const elapsed = last === 0 ? 0 : Math.min(0.07, (timestamp - last) / 1000);
  last = timestamp;
  if (running) {
    // Up to 3x illustrative model time, separate from real clock time.
    const duration = elapsed * 3;
    if (duration > 0) step(state, controls(), duration);
    updateUI();
  }
  draw();
  requestAnimationFrame(frame);
}
updateUI();
requestAnimationFrame(frame);
