import {
 MOCKUP_DEFAULTS,UNCERTAINTY_DEFAULTS,INSTRUMENTS,HAZARDS,
 inspectMockup,propagateSoilUncertainty,preflightReceipt
} from '../src/preflight.mjs';

const $=id=>document.getElementById(id);
const dimensions=[
 'cavityWidthMm','cavityDepthMm','cavityHeightMm','doorOpeningWidthMm','serviceReachMm',
 'widthAllowanceMm','depthAllowanceMm','heightAllowanceMm'
];
const numFields=[
 'initialSoilMg','residualSoilMg','recoveredSoilMg','uInitialMg','uResidualMg','uRecoveredMg',
 'waterMl','uWaterMl','energyWh','uEnergyWh'
];
let mockup=inspectMockup(),budget=propagateSoilUncertainty();
const presets={
 shirt:{...MOCKUP_DEFAULTS},
 hat:{...MOCKUP_DEFAULTS,fixture:'hat',cavityHeightMm:900},
 shoe:{...MOCKUP_DEFAULTS,fixture:'shoe',cavityHeightMm:920},
 narrow:{...MOCKUP_DEFAULTS,cavityWidthMm:400,doorOpeningWidthMm:370},
 blocked:{...MOCKUP_DEFAULTS,serviceReachMm:50,doorOpeningWidthMm:410}
};
const fmt=(n,p=1)=>Number(n).toLocaleString(undefined,{maximumFractionDigits:p,minimumFractionDigits:p});
function save(filename,content,type){
 const blob=new Blob([content],{type}),url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function mockupInputs(){
 const input={fixture:$('fixture').value,stage:$('stage').value,measurementsSource:$('measurementsSource').value};
 for(const id of dimensions)input[id]=Number($(id).value);
 return input;
}
function budgetInputs(){
 const input={source:$('reading-source').value};
 for(const id of numFields){
  const raw=$(id).value.trim();
  input[id]=raw===''?NaN:Number(raw);
 }
 return input;
}
function rect(id,x,y,width,height){
 const element=$(id);
 for(const [key,value] of Object.entries({x,y,width,height}))element.setAttribute(key,Number(value).toFixed(2));
}
function layout(x){
 const svg=$('geometry-svg');
 const cab=x.input,fixture=x.fixture,required=x.required;
 const cW=cab.cavityWidthMm,cD=cab.cavityDepthMm,cH=cab.cavityHeightMm;
 // Scale by the maximum candidate envelope when it exceeds the cavity,
 // so the graphic still depicts an overlarge fixture without cropping.
 const topScale=Math.min(235/Math.max(cW,required.widthMm),240/Math.max(cD,required.depthMm));
 const w=cW*topScale,h=cD*topScale,ew=required.widthMm*topScale,eh=required.depthMm*topScale;
 const xx=160-w/2,yy=65+(240-h)/2;
 rect('top-cavity',xx,yy,w,h);
 rect('top-envelope',160-ew/2,yy+h/2-eh/2,ew,eh);
 rect('top-fixture',160-fixture.widthMm*topScale/2,yy+h/2-fixture.depthMm*topScale/2,fixture.widthMm*topScale,fixture.depthMm*topScale);
 const sideScale=Math.min(220/Math.max(cD,required.depthMm),385/Math.max(cH,required.heightMm));
 const sd=cD*sideScale,sh=cH*sideScale,er=required.depthMm*sideScale,eh2=required.heightMm*sideScale;
 const sx=470-sd/2,sy=65+(380-sh)/2;
 rect('side-cavity',sx,sy,sd,sh);
 rect('side-envelope',470-er/2,sy+sh/2-eh2/2,er,eh2);
 rect('side-fixture',470-fixture.depthMm*sideScale/2,sy+sh/2-fixture.heightMm*sideScale/2,fixture.depthMm*sideScale,fixture.heightMm*sideScale);
 for(const id of ['top-envelope','side-envelope'])$(id).setAttribute('stroke',x.envelopePass?'#a0eee0':'#f0ad85');
 $('top-text').textContent='Cavity '+fmt(cW,0)+' × '+fmt(cD,0)+' mm';
 $('top-require').textContent='Needed '+fmt(required.widthMm,0)+' × '+fmt(required.depthMm,0)+' mm';
 $('side-text').textContent='Cavity '+fmt(cD,0)+' × '+fmt(cH,0)+' mm';
 $('side-require').textContent='Needed '+fmt(required.depthMm,0)+' × '+fmt(required.heightMm,0)+' mm';
 svg.setAttribute('aria-label','Schematic top and side view for '+cab.fixture+
  ', cavity '+cW+' by '+cD+' by '+cH+' mm; does not prove fabrication fit');
}
function renderGeometry(){
 try{
  mockup=inspectMockup(mockupInputs());
  for(const id of dimensions)$(id+'-out').textContent=String(mockup.input[id])+' mm';
  $('geometry-status').textContent=mockup.result;
  $('geometry-status').classList.toggle('blocked',!mockup.envelopePass);
  $('geometry-origin').textContent=mockup.input.measurementsSource==='hypothetical'?'HYPOTHETICAL VALUES':'USER VALUES · UNVERIFIED';
  $('geometry-checks').replaceChildren(...mockup.checks.map(c=>{
   const div=document.createElement('div');div.className=c.pass?'':'fail';
   div.textContent=(c.pass?'✓ ':'✕ ')+c.id.toUpperCase()+' / '+c.detail;
   return div;
  }));
  $('summary-fit').textContent=mockup.envelopePass?'FITS IN MODEL':'CONFLICT';
  layout(mockup);
 }catch(e){
  mockup=null;$('geometry-status').textContent='INVALID INPUT';
  $('summary-fit').textContent='INVALID';
 }
 updateSummary();
}
function renderBudget(){
 try{
  budget=propagateSoilUncertainty(budgetInputs());
  $('input-error').hidden=true;
  $('budget-origin').textContent=budget.source==='hypothetical'?'HYPOTHETICAL VALUES · NOT LAB RESULTS':'USER-ENTERED · NOT VERIFIED';
  $('removal').textContent=fmt(budget.removalPercent)+'%';
  $('removal-u').textContent='standard u ≈ '+fmt(budget.uRemovalPercent,2)+' percentage points';
  $('recovery').textContent=fmt(budget.recoveryPercent)+'%';
  $('recovery-u').textContent='standard u ≈ '+fmt(budget.uRecoveryPercent,2)+' percentage points';
  $('unaccounted').textContent=fmt(budget.unaccountedSoilMg)+' mg';
  $('unaccounted-u').textContent='standard u ≈ '+fmt(budget.uUnaccountedSoilMg,2)+' mg';
  $('water-eff').textContent=budget.removedMgPerMl===null?'undefined':fmt(budget.removedMgPerMl,3)+' mg/mL';
  $('water-eff-u').textContent=budget.uRemovedMgPerMl===null?'u undefined':'standard u ≈ '+fmt(budget.uRemovedMgPerMl,3)+' mg/mL';
  $('energy-eff').textContent=budget.removedMgPerWh===null?'undefined':fmt(budget.removedMgPerWh,3)+' mg/Wh';
  $('energy-eff-u').textContent=budget.uRemovedMgPerWh===null?'u undefined':'standard u ≈ '+fmt(budget.uRemovedMgPerWh,3)+' mg/Wh';
  $('budget-warnings').replaceChildren(...budget.flags.map(f=>{
   const li=document.createElement('li');li.textContent=f;return li;
  }));
 }catch(e){
  budget=null;$('input-error').hidden=false;$('input-error').textContent=e.message;
  for(const id of ['removal','recovery','unaccounted','water-eff','water-eff-u','energy-eff','energy-eff-u'])$(id).textContent='—';
 }
 updateSummary();
}
function renderRegister(id,items,prefix){
 $(id).replaceChildren(...items.map(item=>{
  const row=document.createElement('label');row.className='check-row';
  const cb=document.createElement('input');cb.type='checkbox';cb.id=prefix+item.id;
  cb.addEventListener('change',updateSummary);
  const block=document.createElement('span');
  if(item.severity){
   const severity=document.createElement('span');severity.className='severity';severity.textContent=item.severity;block.append(severity);
  }
  const title=document.createElement('strong');title.textContent=item.name;
  const desc=document.createElement('p');desc.textContent=item.record||item.mitigation;
  block.append(title,desc);row.append(cb,block);return row;
 }));
}
function flags(items,prefix){
 return Object.fromEntries(items.map(item=>[item.id,$(prefix+item.id).checked]));
}
function getReceipt(){
 if(!mockup||!budget)return null;
 return preflightReceipt({mockup:mockup.input,uncertainty:budget.inputs,
  instruments:flags(INSTRUMENTS,'instrument-'),hazards:flags(HAZARDS,'hazard-')});
}
function updateSummary(){
 const have=INSTRUMENTS.filter(x=>$('instrument-'+x.id)?.checked).length;
 const risks=HAZARDS.filter(x=>$('hazard-'+x.id)?.checked).length;
 $('summary-instruments').textContent=have+'/'+INSTRUMENTS.length;
 $('summary-hazards').textContent=risks+'/'+HAZARDS.length;
 for(const id of ['export-svg','export-mockup','export-budget','export-receipt']){
  $(id).disabled=(id==='export-svg'||id==='export-mockup'?!mockup:
     id==='export-budget'?!budget:!mockup||!budget);
 }
}
for(const id of dimensions)$(id).addEventListener('input',()=>{
 if(id!=='fixture'&&$('measurementsSource').value==='hypothetical')$('measurementsSource').value='user-entered-unverified';
 renderGeometry();
});
for(const id of ['fixture','stage','measurementsSource'])$(id).addEventListener('input',renderGeometry);
for(const id of numFields)$(id).addEventListener('input',()=>{
 if($('reading-source').value==='hypothetical')$('reading-source').value='user-entered-unverified';
 renderBudget();
});
$('reading-source').addEventListener('input',renderBudget);
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
 const config=presets[button.dataset.preset];if(!config)return;
 for(const id of dimensions)$(id).value=String(config[id]);
 $('fixture').value=config.fixture;$('stage').value='unpowered';
 $('measurementsSource').value='hypothetical';
 renderGeometry();
}));
$('export-svg').addEventListener('click',()=>{
 if(!mockup)return;
 const clone=$('geometry-svg').cloneNode(true);
 clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
 const text=new XMLSerializer().serializeToString(clone);
 save('phipress-C0-8-NONFABRICATION-SKETCH.svg',text,'image/svg+xml');
});
$('export-mockup').addEventListener('click',()=>{
 if(!mockup)return;
 save('phipress-C0-8-mockup-UNVERIFIED.json',JSON.stringify(mockup,null,2),'application/json');
});
$('export-budget').addEventListener('click',()=>{
 if(!budget)return;
 save('phipress-C0-8-uncertainty-UNVERIFIED.json',JSON.stringify(budget,null,2),'application/json');
});
$('export-receipt').addEventListener('click',()=>{
 const r=getReceipt();if(!r)return;
 save('phipress-C0-8-preflight-NO-APPROVAL.json',JSON.stringify(r,null,2),'application/json');
});
renderRegister('instrument-list',INSTRUMENTS,'instrument-');
renderRegister('hazard-list',HAZARDS,'hazard-');
renderGeometry();renderBudget();
