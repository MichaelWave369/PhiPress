import {
 MEASURES,REGISTRY_SCHEMA,EVENT_COLUMNS,blankRegistry,blankEventsCSV,
 validateRegistry,validateMaskedRoster,parseTableCSV,
 inspectLedger,toMaskedE0CSV,eventTemplateCSV
} from '../src/observations.mjs';

const $=id=>document.getElementById(id);
let rawRegistry=blankRegistry(),registry=validateRegistry(rawRegistry);
let roster=null,events=[],report=null,localError='';
const filenameSafe=x=>String(x).replace(/[^A-Za-z0-9_.-]+/g,'_').slice(0,70);
const fileSave=(name,body,mime)=>{
 const blob=new Blob([body],{type:mime}),url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');anchor.href=url;anchor.download=name;
 document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
function downloadJSON(name,obj){fileSave(name,JSON.stringify(obj,null,2),'application/json');}
function limitImport(file){
 if(file.size>2_000_000)throw new RangeError('Files must not exceed 2 MB');
}
function message(id,text){$(id).textContent=text;}
function items(id,strings,max=15){
 $(id).replaceChildren(...strings.slice(0,max).map(s=>{
  const li=document.createElement('li');li.textContent=s;return li;
 }));
 if(strings.length>max){
  const li=document.createElement('li');li.textContent='... '+(strings.length-max)+' additional items in downloaded audit JSON';$(id).append(li);
 }
}
function render(){
 registry=validateRegistry(rawRegistry);
 report=inspectLedger(events,registry,roster);
 const valid=report.canExportMaskedE0;
 $('count-planned').textContent=String(report.totalPlanned);
 $('count-events').textContent=String(report.submittedRows);
 $('count-complete').textContent=String(report.completedSpecimens);
 $('audit-status').textContent=valid?'COMPLETE IN MODEL':'INCOMPLETE';
 $('audit-status').classList.toggle('pass',valid);
 $('audit-answer').classList.toggle('pass',valid);
 $('audit-answer').textContent=localError||(
  valid?'All planned specimens have one valid record in every required channel. Calibration is still self-reported, and readings remain unverified. You may export the masked C0.7 sheet.'
  :'Observations are incomplete or invalid. Import required files, resolve calibration/reference errors and keep the original raw records.');
 $('roster-state').textContent=roster?roster.rows.length+' masked specimens imported · treatment identities not included':'No roster loaded';
 $('registry-state').textContent=registry.ok?registry.instruments.length+' declarations · self-reported and unverified':
  'Invalid/incomplete register · '+registry.errors.slice(0,2).join(' | ');
 $('events-state').textContent=events.length+' event rows in memory · user-supplied, unverified';
 $('blank-events').disabled=!roster;
 $('export-masked').disabled=!valid;
 const allIssues=[...registry.errors,...(report.errors||[])];
 items('audit-errors',allIssues.length?allIssues:['No structural errors detected. Physical authenticity remains unverified.']);
 items('audit-warnings',report.warnings);
 $('coverage-body').replaceChildren(...report.coverage.slice(0,100).map(x=>{
  const tr=document.createElement('tr');tr.className=x.completed?'complete':'';
  const values=[x.trial_id,x.specimen_id,String(x.present.length)+' / 8',
   x.completed?'ALL PRESENT':x.missing.join(', ')];
  for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}
  return tr;
 }));
 $('instrument-inventory').replaceChildren(...registry.instruments.map(x=>{
  const span=document.createElement('span');span.textContent=x.instrument_id+' · '+x.supported_measurements.join(' + ')+' · through '+x.valid_through;
  return span;
 }));
}
const readFile=async(id,handler)=>{
 const input=$(id),file=input.files?.[0];if(!file)return;
 try{limitImport(file);await handler(await file.text());localError='';}
 catch(error){localError=id+': '+error.message;}
 finally{input.value='';render();}
};
$('roster-file').addEventListener('change',()=>readFile('roster-file',async text=>{
 roster=validateMaskedRoster(text);events=[]; // prevent old measurements mixing with new roster
}));
$('registry-file').addEventListener('change',()=>readFile('registry-file',async text=>{
 const proposed=JSON.parse(text),checked=validateRegistry(proposed);
 if(!checked.ok)throw Error(checked.errors.slice(0,6).join(' | '));
 rawRegistry=proposed;
}));
$('events-file').addEventListener('change',()=>readFile('events-file',async text=>{
 events=parseTableCSV(text,EVENT_COLUMNS);
}));
$('blank-registry').addEventListener('click',()=>downloadJSON('phipress-C0.9-EMPTY-instrument-register.json',blankRegistry()));
$('export-registry').addEventListener('click',()=>downloadJSON('phipress-C0.9-SELF-REPORTED-instrument-register.json',rawRegistry));
$('blank-log').addEventListener('click',()=>fileSave('phipress-C0.9-BLANK-events.csv',blankEventsCSV(),'text/csv;charset=utf-8'));
$('blank-events').addEventListener('click',()=>{
 if(!roster)return;
 fileSave('phipress-C0.9-BLANK-masked-observation-sheet.csv',eventTemplateCSV(roster),'text/csv;charset=utf-8');
});
for(const [id,spec] of Object.entries(MEASURES)){
 const option=document.createElement('option');option.value=id;option.textContent=id+' ('+spec.unit+')';
 $('instrument-measure').append(option);
}
$('instrument-form').addEventListener('submit',event=>{
 event.preventDefault();
 const measure=$('instrument-measure').value;
 const instrument={
  instrument_id:$('instrument-id').value.trim(),
  display_name:$('instrument-name').value.trim(),
  supported_measurements:[measure],
  valid_from:$('instrument-from').value,
  valid_through:$('instrument-through').value,
  uncertainty_floor:{[measure]:Number($('instrument-floor').value)},
  calibration_reference:$('instrument-calref').value.trim(),
  method_reference:$('instrument-method').value.trim(),
  declared_by:$('instrument-operator').value.trim()
 };
 const proposed={schema:REGISTRY_SCHEMA,warning:'SELF-REPORTED INSTRUMENT DECLARATIONS; NOT VERIFIED',instruments:[...rawRegistry.instruments,instrument]};
 const checked=validateRegistry(proposed);
 if(!checked.ok){
  $('builder-error').hidden=false;$('builder-error').textContent=checked.errors.slice(0,4).join(' | ');
  return;
 }
 rawRegistry=proposed;
 $('builder-error').hidden=true;
 $('instrument-id').value='';$('instrument-name').value='';
 localError='';render();
});
$('export-audit').addEventListener('click',()=>{
 downloadJSON('phipress-C0.9-UNVERIFIED-audit.json',{
  schema:'phipress.e0.audit-export.v0.9',warning:'NO MEASUREMENTS OR CALIBRATIONS ARE INDEPENDENTLY VERIFIED',
  maskedRoster:roster,registry:rawRegistry,events,report,localError,
  exportedLocally:true
 });
});
$('export-masked').addEventListener('click',()=>{
 if(!report?.canExportMaskedE0||!roster)return;
 try{fileSave('phipress-C0.9-COMPLETE-UNVERIFIED-masked-E0.csv',
  toMaskedE0CSV(report,roster),'text/csv;charset=utf-8');}
 catch(e){localError=e.message;render();}
});
render();
