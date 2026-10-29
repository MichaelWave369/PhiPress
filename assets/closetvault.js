import { PROFILES, estimateEnergy } from '../src/energy.mjs';

const $ = id => document.getElementById(id);
const mode = $('power-mode'), battery = $('battery'), output = $('output'), efficiency = $('efficiency');
function fmt(n, digits=0) { return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits }); }
function update() {
  const key = mode.value;
  const cap = Number(battery.value), maxW = Number(output.value), eff = Number(efficiency.value) / 100;
  const plan = estimateEnergy(key, { capacityWh: cap, maxOutputW: maxW, efficiency: eff });
  $('battery-value').textContent = fmt(cap) + ' Wh';
  $('output-value').textContent = fmt(maxW) + ' W';
  $('efficiency-value').textContent = fmt(eff * 100) + '%';
  $('peak').textContent = fmt(plan.profile.watts, 1) + ' W';
  $('daily').textContent = fmt(plan.dailyWh, 1) + ' Wh';
  $('usable').textContent = fmt(plan.usableWh, 0) + ' Wh';
  $('days').textContent = plan.supportsPeak ? fmt(plan.daysIfDaily, 1) + ' days' : 'N/A';
  $('power-status').textContent = plan.supportsPeak ? 'POWER LIMIT OK (MODEL)' : 'BATTERY OUTPUT TOO LOW';
  $('power-status').classList.toggle('warning', !plan.supportsPeak);
  $('profile-note').textContent = plan.profile.note;
  $('power-detail').textContent = plan.supportsPeak
    ? 'One such daily profile uses an assumed ' + fmt(plan.dailyWh,1) + ' Wh; usable energy ÷ daily consumption gives illustrative days, ignoring charging and aging.'
    : 'The selected profile calls for ' + fmt(plan.profile.watts,1) + ' W, above the battery\'s assumed sustained output limit (' + fmt(maxW) + ' W). Use mains power or redesign the module; bigger Wh capacity alone does not solve this.';
  $('battery-fill').style.width = fmt(Math.min(100, plan.dailyWh / Math.max(plan.usableWh, 0.1) * 100), 1) + '%';
  document.querySelectorAll('.module-card').forEach(node => {
    const active = key === 'midifier' ? node.dataset.zone === 'service'
      : ['bubblegear','finish','refresh'].includes(key) ? node.dataset.zone === 'treatment'
      : node.dataset.zone === 'dry';
    node.classList.toggle('active-module', active);
  });
}
for(const control of [mode,battery,output,efficiency]) control.addEventListener('input', update);
update();
