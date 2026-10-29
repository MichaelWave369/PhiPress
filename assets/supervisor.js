import { DEFAULT_SNAPSHOT, evaluate } from '../src/supervisor.mjs';
const $=id=>document.getElementById(id);
const numberIds={temperatureC:'temp',humidityRH:'rh',surfaceTemperatureC:'surface',storedBatteryWh:'battery',batteryContinuousW:'peak'};
const boolIds=['sensorFresh','doorClosed','leakDry','ventilationClear','tankReady','wetBayIsolated','materialApproved','mainsAvailable'];
const scenarios={
 normal:{...DEFAULT_SNAPSHOT,mode:'preserve'},
 humid:{...DEFAULT_SNAPSHOT,mode:'midifier',humidityRH:84,surfaceTemperatureC:18},
 condensation:{...DEFAULT_SNAPSHOT,mode:'refresh',humidityRH:70,surfaceTemperatureC:12},
 leak:{...DEFAULT_SNAPSHOT,mode:'bubblegear',leakDry:false},
 battery:{...DEFAULT_SNAPSHOT,mode:'finish',mainsAvailable:false,storedBatteryWh:450,batteryContinuousW:150}
};
let receipt;
const pretty=(n,unit)=>n===null?'unknown':Number(n).toFixed(1)+' '+unit;
function read(){
 const snapshot={...DEFAULT_SNAPSHOT,mode:$('requested').value,usableFraction:.85};
 for(const [key,id] of Object.entries(numberIds)) snapshot[key]=Number($(id).value);
 for(const key of boolIds) snapshot[key]=$(key).checked;
 return snapshot;
}
function update(){
 const values=read();
 receipt=evaluate(values);
 for(const [key,id] of Object.entries(numberIds)){
   const unit=key==='humidityRH'?'%':(key==='temperatureC'||key==='surfaceTemperatureC')?'°C':key==='batteryContinuousW'?'W':'Wh';
   $(id+'-out').textContent=String(values[key])+' '+unit;
 }
 const state=$('decision-status');
 state.textContent=receipt.status;
 $('decision-status').parentElement.classList.toggle('blocked',!receipt.eligible);
 $('decision-description').textContent=receipt.eligible
 ?'This scenario passes provisional checks only. No real hardware activation is authorized.'
 :'One or more provisional checks failed. Review the conditions and independent safety requirements.';
 $('dew-point').textContent=pretty(receipt.dewPointC,'°C');
 $('dew-margin').textContent=pretty(receipt.dewPointMarginC,'°C');
 $('daily-energy').textContent=pretty(receipt.dailyEnergyWh,'Wh');
 $('power-path').textContent=receipt.powerPath;
 $('guard-checks').replaceChildren(...receipt.checks.map(x=>{
    const li=document.createElement('li'), mark=document.createElement('span'), detail=document.createElement('span');
    mark.className='guard-mark'+(x.pass?'':' fail');
    mark.textContent=x.pass?'✓':'✕';
    detail.textContent=x.id.replaceAll('-',' ').toUpperCase()+' · '+x.detail;
    li.append(mark,detail); return li;
 }));
 $('warnings').replaceChildren(...(receipt.warnings.length?receipt.warnings:['No additional model warnings for this example.']).map(w=>{
   const li=document.createElement('li');li.textContent=w;return li;
 }));
 $('copy-feedback').textContent='';
}
function applyScenario(name){
 const s=scenarios[name];if(!s)return;
 $('requested').value=s.mode;
 for(const [key,id] of Object.entries(numberIds)) $(id).value=String(s[key]);
 for(const key of boolIds) $(key).checked=s[key];
 update();
}
for(const id of ['requested',...Object.values(numberIds),...boolIds]) $(id).addEventListener('input',update);
document.querySelectorAll('[data-scenario]').forEach(el=>el.addEventListener('click',()=>applyScenario(el.dataset.scenario)));
$('copy-receipt').addEventListener('click',async()=>{
 const content=JSON.stringify({schema:'phipress.closetvault.simulated-policy-receipt.v0.3',snapshot:read(),result:receipt},null,2);
 try {
   if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable in this context');
   await navigator.clipboard.writeText(content);
   $('copy-feedback').textContent='Receipt copied';
 } catch {
   $('copy-feedback').textContent='Clipboard unavailable; use your browser’s console or a secure context';
 }
});
applyScenario('normal');
