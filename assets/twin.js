import { runTwin, TWIN_DEFAULTS, TWIN_SCENARIOS } from '../src/twin.mjs';

const $=id=>document.getElementById(id);
const ids=['ambientRH','initialRH','surfaceTemperatureC','garmentWaterG','evaporationGPerHour','airChangesPerHour','batteryCapacityWh'];
const checks=['hasMains','ventClear','leakClear','recoveryAvailable'];
let latest=null;
const units={ambientRH:'%',initialRH:'%',surfaceTemperatureC:' °C',garmentWaterG:' g',evaporationGPerHour:' g/h',airChangesPerHour:' ACH',batteryCapacityWh:' Wh'};
const pretty=(n,p=1)=>Number(n).toFixed(p);
function values(){
 const out={...TWIN_DEFAULTS,mode:$('mode').value,hours:Number($('hours').value)};
 for(const id of ids)out[id]=Number($(id).value);
 for(const id of checks)out[id]=$(id).checked;
 return out;
}
function apply(scenario){
 const s=TWIN_SCENARIOS[scenario];if(!s)return;
 $('mode').value=s.mode;$('hours').value=String(s.hours);
 for(const id of ids) $(id).value=String(s[id]);
 for(const id of checks) $(id).checked=s[id];
 render();
}
function sizeCanvas(canvas){
 const dpr=Math.min(window.devicePixelRatio||1,2);
 const w=Math.max(100,canvas.clientWidth),h=Math.max(140,canvas.clientHeight);
 const pw=Math.round(w*dpr),ph=Math.round(h*dpr);
 if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
 const ctx=canvas.getContext('2d');
 ctx.setTransform(dpr,0,0,dpr,0,0);
 return {ctx,w,h};
}
function chart(result){
 const {ctx,w,h}=sizeCanvas($('rh-chart'));
 ctx.clearRect(0,0,w,h);
 const l=48,r=w-18,t=17,b=h-37;
 const px=hour=>l+(hour/result.inputs.hours)*(r-l);
 const py=rh=>b-(rh/100)*(b-t);
 ctx.font='11px ui-monospace,monospace';
 ctx.textAlign='right';
 for(const y of [0,25,50,65,75,100]){
  const yy=py(y);
  ctx.beginPath();ctx.moveTo(l,yy);ctx.lineTo(r,yy);
  ctx.strokeStyle=y===65?'rgba(218,162,125,.6)':'rgba(108,158,173,.19)';
  ctx.setLineDash(y===65?[5,5]:[]);
  ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=y===65?'#d8ab80':'#709ca8';ctx.fillText(String(y),l-9,yy+4);
 }
 ctx.textAlign='center';
 for(const hr of [0,result.inputs.hours/4,result.inputs.hours/2,3*result.inputs.hours/4,result.inputs.hours]){
  ctx.fillStyle='#7b9daa';ctx.fillText(pretty(hr,0)+'h',px(hr),h-15);
 }
 ctx.beginPath();ctx.moveTo(l,py(65));ctx.lineTo(r,py(65));ctx.strokeStyle='rgba(215,155,118,.6)';ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.moveTo(px(0),py(result.inputs.ambientRH));ctx.lineTo(px(result.inputs.hours),py(result.inputs.ambientRH));
 ctx.strokeStyle='#d2bb85';ctx.lineWidth=1.6;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.moveTo(px(0),py(result.inputs.initialRH));
 for(const item of result.series)ctx.lineTo(px(item.hour),py(item.rh));
 ctx.strokeStyle='#95e9d6';ctx.lineWidth=2.5;ctx.stroke();
}
function insight(r){
 const m=r.metrics;
 const messages=[];
 if(m.condensationHours>0)messages.push('Cold-surface condensation occurs in this scenario. '+pretty(m.surfaceCondensateG)+' g is modeled on a surface, not safely removed.');
 if(m.highRHHours>0)messages.push('The cabinet spends '+pretty(m.highRHHours)+' hours at or above the illustrative 65% RH caution line.');
 if(r.inputs.mode==='fan')messages.push('The fan circulates internal air; it does not remove water from a sealed cabinet. It may accelerate evaporation from damp clothes.');
 if(r.inputs.mode==='dry'){
  if(m.dehumHours>0)messages.push('The assumed recovery module operates '+pretty(m.dehumHours)+' hours and collects '+pretty(m.recoveredWaterG)+' g. Reject heat is not modeled.');
  if(m.blockedDryHours>0)messages.push('The recovery mode is inhibited for '+pretty(m.blockedDryHours)+' hours because AC or a required reported condition is unavailable.');
 }
 if(m.unpoweredHours>0)messages.push('The hypothetical battery cannot support the entire run and simulated monitoring loses power for '+pretty(m.unpoweredHours)+' hours.');
 if(messages.length===0)messages.push('No high-RH or surface-condensation event occurred under these fixed assumptions. This does not establish safe storage conditions for real garments.');
 const finding=$('finding');
 finding.textContent=messages.join(' ');
 finding.classList.toggle('warning',m.condensationHours>0||m.blockedDryHours>0||m.unpoweredHours>0||m.highRHHours>0);
}
function render(){
 const s=values();
 latest=runTwin(s);
 for(const id of ids)$(id+'-value').textContent=String(s[id])+units[id];
 const m=latest.metrics;
 $('final-rh').textContent=pretty(m.finalRH)+'%';
 $('high-hours').textContent=pretty(m.highRHHours)+' h';
 $('surface-water').textContent=pretty(m.surfaceCondensateG)+' g';
 $('tank-water').textContent=pretty(m.recoveredWaterG)+' g';
 $('total-energy').textContent=pretty(m.consumedWh)+' Wh';
 $('battery-rem').textContent=pretty(m.batteryRemainingWh)+' Wh';
 $('balance-error').textContent=pretty(m.waterBalanceErrorG,8)+' g';
 $('recovery-hours').textContent=pretty(m.dehumHours)+' h';
 $('restriction-detail').textContent=pretty(m.blockedDryHours)+' h blocked recovery; '+pretty(m.unpoweredHours)+' h unpowered';
 insight(latest);
 chart(latest);
}
function download(name,type,content){
 const blob=new Blob([content],{type});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 URL.revokeObjectURL(url);
}
$('export-json').addEventListener('click',()=>{
 if(!latest)return;
 download('phipress-closetvault-c0-4.json','application/json',JSON.stringify(latest,null,2));
});
$('export-csv').addEventListener('click',()=>{
 if(!latest)return;
 const columns=['hour','rh','dewPointC','airWaterG','garmentWaterG','surfaceCondensateG','recoveredWaterG','ambientExchangeG','energyWh','batteryRemainingWh','active'];
 const rows=[columns.join(','),...latest.series.map(row=>columns.map(c=>String(row[c])).join(','))];
 download('phipress-closetvault-c0-4.csv','text/csv;charset=utf-8',rows.join('\n')+'\n');
});
for(const id of ['mode','hours',...ids,...checks]) $(id).addEventListener('input',render);
document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>apply(button.dataset.scenario)));
window.addEventListener('resize',()=>{if(latest)chart(latest);});
apply('normal');
