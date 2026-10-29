import { DEFAULT_DESIGN,FIXTURES,MODES,evaluateDesign } from '../src/fixture-bench.mjs';
const $=id=>document.getElementById(id);
const sliderIds=['outerWidthMm','outerDepthMm','outerHeightMm','waterDoseMl','dirtyTankCapacityMl','finishTemperatureC','batteryWh','batteryOutputW'];
const flags=['doorClosed','leakDry','ventClear','wetBayIsolated','tankReady','materialReviewed','serviceAccessible','mainsAvailable'];
const units={outerWidthMm:' mm',outerDepthMm:' mm',outerHeightMm:' mm',waterDoseMl:' mL',dirtyTankCapacityMl:' mL',finishTemperatureC:' °C',batteryWh:' Wh',batteryOutputW:' W'};
const presets={
 shirt:{...DEFAULT_DESIGN},
 hat:{...DEFAULT_DESIGN,fixture:'hat',mode:'wet'},
 shoe:{...DEFAULT_DESIGN,fixture:'shoe',mode:'refresh'},
 narrow:{...DEFAULT_DESIGN,outerWidthMm:480},
 battery:{...DEFAULT_DESIGN,mode:'cleanFinish',mainsAvailable:false},
 leak:{...DEFAULT_DESIGN,mode:'wet',leakDry:false}
};
let latest;
const fmt=(n,places=0)=>Number(n).toLocaleString(undefined,{maximumFractionDigits:places,minimumFractionDigits:places});
function read(){
 const x={...DEFAULT_DESIGN,fixture:$('fixture').value,mode:$('mode').value};
 for(const id of sliderIds)x[id]=Number($(id).value);
 for(const id of flags)x[id]=$(id).checked;
 return x;
}
function setPreset(id){
 const s=presets[id];if(!s)return;
 $('fixture').value=s.fixture;$('mode').value=s.mode;
 for(const name of sliderIds)$(name).value=String(s[name]);
 for(const name of flags)$(name).checked=s[name];
 render();
}
function setAttr(id,values){for(const [key,val] of Object.entries(values))$(id).setAttribute(key,String(val));}
function drawFit(r){
 const s=r.input;
 const maxW=500,maxD=340;
 const scale=Math.min(maxW/s.outerWidthMm,maxD/s.outerDepthMm);
 const outerW=s.outerWidthMm*scale,outerD=s.outerDepthMm*scale;
 const left=(620-outerW)/2,top=42+(340-outerD)/2;
 const innerW=r.cavity.widthMm*scale,innerD=r.cavity.depthMm*scale;
 const inX=left+(outerW-innerW)/2,inY=top+(outerD-innerD)/2;
 const fixtureW=r.envelope.widthMm*scale,fixtureD=r.envelope.depthMm*scale;
 const fx=inX+(innerW-fixtureW)/2,fy=inY+(innerD-fixtureD)/2;
 setAttr('outer-box',{x:left,y:top,width:outerW,height:outerD});
 setAttr('cavity-box',{x:inX,y:inY,width:innerW,height:innerD});
 setAttr('clearance-box',{x:fx,y:fy,width:fixtureW,height:fixtureD,fill:r.plausible?'#2d797c55':'#bd83563a',stroke:r.plausible?'#93e5d9':'#f2b37a'});
 const midX=fx+fixtureW/2,midY=fy+fixtureD/2;
 let art='';
 if(s.fixture==='shirt'){
  const x=midX,y=midY;art='M '+(x-20)+' '+(y-64)+' L '+x+' '+(y-74)+' L '+(x+20)+' '+(y-64)+' L '+(x+43)+' '+(y-39)+' L '+(x+30)+' '+(y-18)+' L '+(x+24)+' '+(y-25)+' L '+(x+24)+' '+(y+70)+' L '+(x-24)+' '+(y+70)+' L '+(x-24)+' '+(y-25)+' L '+(x-30)+' '+(y-18)+' L '+(x-43)+' '+(y-39)+' Z';
 }else if(s.fixture==='hat'){
  const x=midX,y=midY;art='M '+(x-62)+' '+(y+25)+' Q '+(x-65)+' '+(y-45)+' '+x+' '+(y-58)+' Q '+(x+65)+' '+(y-45)+' '+(x+62)+' '+(y+25)+' Z M '+(x-78)+' '+(y+25)+' Q '+x+' '+(y+72)+' '+(x+78)+' '+(y+25);
 }else{
  const x=midX,y=midY;art='M '+(x-68)+' '+(y-42)+' L '+(x+58)+' '+(y-42)+' Q '+(x+77)+' '+(y-20)+' '+(x+71)+' '+(y+2)+' L '+(x-62)+' '+(y+2)+' Z M '+(x-68)+' '+(y+18)+' L '+(x+58)+' '+(y+18)+' Q '+(x+77)+' '+(y+40)+' '+(x+71)+' '+(y+62)+' L '+(x-62)+' '+(y+62)+' Z';
 }
 $('fixture-path').setAttribute('d',art);
 $('outer-dim').textContent=fmt(s.outerWidthMm)+' × '+fmt(s.outerDepthMm)+' mm external';
 $('cavity-dim').textContent=fmt(r.cavity.widthMm)+' × '+fmt(r.cavity.depthMm)+' mm assumed cavity';
 $('fixture-dim').textContent=fmt(r.envelope.widthMm)+' × '+fmt(r.envelope.depthMm)+' mm required envelope';
 $('fit-label').textContent=r.fixture.name.toUpperCase();
 const fitPass=r.checks.find(x=>x.id==='fixture-fit').pass;
 $('fit-status').textContent=fitPass?'FIT IN MODEL':'CLEARANCE FAILURE';
 $('fit-status').classList.toggle('blocked',!fitPass);
 $('mount-description').textContent=r.fixture.mount;
 $('fixture-material').textContent=r.fixture.materials;
 $('cavity-height').textContent=fmt(r.cavity.heightMm)+' mm';
 $('fixture-height').textContent=fmt(r.envelope.heightMm)+' mm';
}
function route(r){
 const ids={intake:true,air:r.input.mode!=='watch',wet:r.mode.wet,recovery:r.mode.wet,heat:r.mode.heated};
 for(const [name,active] of Object.entries(ids))$('flow-'+name).classList.toggle('active',active);
}
function makeLi(text,pass=null){
 const li=document.createElement('li');
 if(pass!==null){
  const mark=document.createElement('strong');
  mark.textContent=pass?'✓':'✕';mark.className=pass?'':'fail';li.append(mark);
 }
 li.append(document.createTextNode(text));return li;
}
function csvCell(str){const val=String(str);return /[",\n]/.test(val)?'"'+val.replaceAll('"','""')+'"':val;}
function download(name,mime,body){
 const obj=new Blob([body],{type:mime}),url=URL.createObjectURL(obj),link=document.createElement('a');
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function render(){
 latest=evaluateDesign(read());
 const r=latest;
 for(const id of sliderIds)$(id+'-value').textContent=String(r.input[id])+units[id];
 drawFit(r);route(r);
 $('decision-text').textContent=r.result;
 $('decision').classList.toggle('blocked',!r.plausible);
 $('decision-context').textContent=r.plausible?'Conceptual constraints pass. No powered prototype is approved.':'One or more required design constraints fail; revise dimensions or selected path.';
 $('power-peak').textContent=fmt(r.metrics.peakPowerW)+' W';
 $('energy-cycle').textContent=fmt(r.metrics.totalEnergyWh,1)+' Wh';
 $('cycle-minutes').textContent=fmt(r.metrics.totalMinutes)+' min';
 $('dose').textContent=fmt(r.metrics.liquidDoseMl)+' mL';
 $('check-list').replaceChildren(...r.checks.filter(x=>x.required).map(x=>makeLi(x.id.replaceAll('-',' ').toUpperCase()+': '+x.detail,x.pass)));
 $('warnings').replaceChildren(...r.warnings.map(x=>makeLi(x)));
 $('bom-body').replaceChildren(...r.modules.map(module=>{
  const tr=document.createElement('tr');
  for(const val of [module.name,module.source,module.function]){
   const td=document.createElement('td');td.textContent=val;tr.append(td);
  }return tr;
 }));
}
$('export-json').addEventListener('click',()=>download('phipress-fixture-study-c0-5.json','application/json',JSON.stringify(latest,null,2)));
$('export-csv').addEventListener('click',()=>{
 const columns=['id','name','source','function'];
 const rows=[columns.join(','),...latest.modules.map(x=>columns.map(c=>csvCell(x[c])).join(','))];
 download('phipress-concept-bom-c0-5.csv','text/csv;charset=utf-8',rows.join('\n')+'\n');
});
document.querySelectorAll('[data-preset]').forEach(x=>x.addEventListener('click',()=>setPreset(x.dataset.preset)));
for(const id of ['fixture','mode',...sliderIds,...flags])$(id).addEventListener('input',render);
setPreset('shirt');
