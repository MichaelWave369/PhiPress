/**
 * ΦPRESS C0.5 fixture and cartridge feasibility bench.
 * Purely advisory design-space evaluation. No actuator wiring, electrical
 * protection, safety-rated controller, measured cleaning, or certification.
 */

export const FIXTURES=Object.freeze({
  shirt:Object.freeze({name:'Shirt form',widthMm:470,depthMm:360,heightMm:920,mount:'Tensioned breathable torso',materials:'Cotton woven test shirt',modes:['watch','refresh','wet','finish','cleanFinish'],maxCandidateTempC:65,notes:'Arm and collar supports; clothing label review and fabric durability testing required.'}),
  hat:Object.freeze({name:'Hat cradle',widthMm:380,depthMm:370,heightMm:320,mount:'Brim-preserving cradle',materials:'Washable cap only',modes:['watch','refresh','wet'],maxCandidateTempC:38,notes:'Brim inserts, dyes and adhesives may be incompatible; no heated pressing permitted.'}),
  shoe:Object.freeze({name:'Shoe rack',widthMm:450,depthMm:430,heightMm:360,mount:'Two-piece ventilated rack',materials:'Compatible textile footwear only',modes:['watch','refresh','wet'],maxCandidateTempC:40,notes:'Leather, suede, glues and soles require individual review; no universal shoe-cleaning claim.'})
});
export const MODES=Object.freeze({
  watch:Object.freeze({name:'Watch / preserve',stages:[{id:'watch',label:'Monitor',watts:2,minutes:30}],waterMl:0,wet:false,heated:false}),
  refresh:Object.freeze({name:'Air refresh',stages:[{id:'air',label:'Filtered airflow',watts:25,minutes:15}],waterMl:0,wet:false,heated:false}),
  wet:Object.freeze({name:'BubbleGear wet path',stages:[{id:'wet',label:'Meter + extract',watts:180,minutes:30}],waterMl:120,wet:true,heated:false}),
  finish:Object.freeze({name:'Dry / press path',stages:[{id:'heat',label:'Conditioned airflow',watts:600,minutes:25}],waterMl:0,wet:false,heated:true}),
  cleanFinish:Object.freeze({name:'Wet clean → finish',stages:[{id:'wet',label:'Meter + extract',watts:180,minutes:30},{id:'heat',label:'Conditioned airflow',watts:600,minutes:25}],waterMl:120,wet:true,heated:true})
});
export const DEFAULT_DESIGN=Object.freeze({
  fixture:'shirt',mode:'cleanFinish',
  outerWidthMm:700,outerDepthMm:700,outerHeightMm:1800,
  finishTemperatureC:42,waterDoseMl:120,dirtyTankCapacityMl:600,
  doorClosed:true,leakDry:true,ventClear:true,wetBayIsolated:true,
  tankReady:true,materialReviewed:true,serviceAccessible:true,
  mainsAvailable:true,batteryWh:300,batteryOutputW:150,batteryUsableFraction:.85
});

export const MODULES=Object.freeze({
  chamber:{name:'Isolated treatment chamber',function:'Fixture enclosure',source:'Structure'},
  fixture:{name:'Interchangeable garment fixture',function:'Shape preservation',source:'Mechanical cartridge'},
  sensors:{name:'Observation + leak sensing',function:'Monitoring only',source:'Local control'},
  filter:{name:'Removable dry-air filter',function:'Lint and particle collection',source:'Dry path'},
  fan:{name:'Filtered circulation loop',function:'Air movement, NOT dehumidification',source:'Dry path'},
  mist:{name:'Metered liquid dispenser',function:'Hypothetical wetting',source:'Wet path'},
  vortex:{name:'Nested flow cartridge ΦBGE-01',function:'Experimental circulation geometry',source:'Wet path'},
  vacuum:{name:'Wet effluent collector',function:'Soil-laden liquid extraction',source:'Wet path'},
  tank:{name:'Serviceable dirty-water tank',function:'Contaminant isolation',source:'Wet path'},
  heat:{name:'Conditioned-air finisher',function:'Hypothetical shape drying',source:'Thermal path'},
  vent:{name:'Engineered heat/moisture route',function:'Reject air and heat externally',source:'Thermal / ventilation path'},
  leak:{name:'Independent leak containment',function:'Physical protection requirement',source:'Safety engineering'},
  interlocks:{name:'Independent door / thermal protections',function:'Safety-rated hardware not designed',source:'Safety engineering'},
  service:{name:'Removable service drawer',function:'Cleanable access to tank and filters',source:'Maintenance'}
});
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const round=(x,n=2)=>Number(x.toFixed(n));

export function normalizeDesign(raw={}){
  const s={...DEFAULT_DESIGN,...raw};
  if(!Object.hasOwn(FIXTURES,s.fixture)||!Object.hasOwn(MODES,s.mode))throw new RangeError('Unknown fixture or mode');
  for(const [key,lo,hi] of [
    ['outerWidthMm',300,2000],['outerDepthMm',300,2000],['outerHeightMm',600,3000],
    ['finishTemperatureC',10,80],['waterDoseMl',0,1000],['dirtyTankCapacityMl',0,10000],
    ['batteryWh',0,100000],['batteryOutputW',0,30000],['batteryUsableFraction',.01,1]
  ]) if(!finite(s[key],lo,hi)) throw new RangeError('Invalid '+key);
  for(const key of ['doorClosed','leakDry','ventClear','wetBayIsolated','tankReady','materialReviewed','serviceAccessible','mainsAvailable']){
    if(typeof s[key]!=='boolean')throw new RangeError('Invalid '+key);
  }
  return s;
}

export function evaluateDesign(raw={}){
  const s=normalizeDesign(raw);
  const fixture=FIXTURES[s.fixture],mode=MODES[s.mode];
  // Pure packaging allowance for cavity wall, air gap and service drawer.
  // Not a real CAD or structural strength calculation.
  const cavity={
    widthMm:Math.max(0,s.outerWidthMm-100),
    depthMm:Math.max(0,s.outerDepthMm-150),
    heightMm:Math.max(0,s.outerHeightMm-520)
  };
  const envelope={
    widthMm:fixture.widthMm+60,
    depthMm:fixture.depthMm+60,
    heightMm:fixture.heightMm+80
  };
  const checks=[];
  const add=(id,pass,detail,required=true)=>checks.push({id,pass:Boolean(pass),detail,required});
  add('fixture-fit',Object.keys(cavity).every(k=>cavity[k]>=envelope[k]),
    'The fixture plus conceptual 30 mm side/depth and 40 mm top/bottom clearance must fit the reserved treatment cavity.');
  add('mode-compatibility',fixture.modes.includes(s.mode),
    'The selected garment fixture must permit this conceptual treatment path.');
  add('door-status',s.doorClosed,'Active treatment assumed inside a closed cabinet.',s.mode!=='watch');
  add('leak-containment',s.leakDry,'No leak reported for this dry/wet operation.',s.mode!=='watch');
  add('service-access',s.serviceAccessible,'Tank and filter service routes must remain accessible.',s.mode!=='watch');
  add('fabric-review',s.materialReviewed,'Garment label, fibers, coatings, adhesives and colors must be reviewed.',s.mode!=='watch');
  add('ventilation',s.ventClear,'Ventilation/air path reported available; a real installation still requires design review.',s.mode!=='watch');
  add('wet-bay-isolation',s.wetBayIsolated,'Wet treatment is isolated from stored clothing.',mode.wet);
  add('collection-ready',s.tankReady,'Contaminant collection path is available.',mode.wet||mode.heated);
  add('tank-capacity',s.dirtyTankCapacityMl>=s.waterDoseMl,
    'Assumed reservoir capacity must meet or exceed the maximum programmed liquid dose (not including condensate margin).',mode.wet);
  add('water-dose',s.waterDoseMl===mode.waterMl,
    'Requested dose equals the nominal hypothetical wet-profile dose; any changes require an experiment.',mode.wet);
  add('temperature-policy',s.finishTemperatureC<=fixture.maxCandidateTempC,
    'Chosen hypothetical air temperature stays within this unvalidated fixture design cap.',mode.heated);
  const requiresMains=mode.wet||mode.heated;
  add('mains-policy',s.mainsAvailable,'Wet/thermal cycles are mains-only in this design study.',requiresMains);

  const totalEnergyWh=mode.stages.reduce((sum,x)=>sum+x.watts*x.minutes/60,0);
  const peakPowerW=Math.max(...mode.stages.map(x=>x.watts));
  const totalMinutes=mode.stages.reduce((sum,x)=>sum+x.minutes,0);
  const usableBatteryWh=s.batteryWh*s.batteryUsableFraction;
  if(!s.mainsAvailable){
    add('battery-peak',s.batteryOutputW>=peakPowerW,'Continuous battery watts must meet assumed peak active watts.');
    add('battery-energy',usableBatteryWh>=totalEnergyWh,'Usable battery watt-hours must meet assumed full-cycle watt-hours.');
  }
  const parts=['chamber','fixture','sensors','filter','service'];
  if(s.mode!=='watch')parts.push('fan','vent','leak','interlocks');
  if(mode.wet)parts.push('mist','vortex','vacuum','tank');
  if(mode.heated)parts.push('heat');
  const modules=parts.map(id=>({id,...MODULES[id]}));
  const feasible=checks.filter(c=>c.required).every(c=>c.pass);
  const warnings=[
    'Illustrative packaging and power arithmetic, NOT a verified mechanical fit or a real safety approval.',
    'Power stages are assumed sequential; simultaneous parasitic loads and startup surge are not included.',
    'Passing the checks cannot authorize energized pumps, heaters, batteries or operation inside a closet.'
  ];
  if(mode.wet)warnings.push('Liquid recovery may require greater reservoir capacity than the metered dose; actual effluent is not modeled.');
  if(mode.heated)warnings.push('Heated airflow requires independent high-limit protection and safe heat rejection; cap is not a fabric safety standard.');
  if(!s.ventClear)warnings.push('Blocked airflow: cabinet cannot rely on its surrounding closet for ventilation.');
  return {
    schema:'phipress.fixture-study.v0.5',
    input:s,fixture,mode,cavity,envelope,
    checks,modules,
    result:feasible?'PLAUSIBLE IN MODEL':'BLOCKED IN MODEL',
    plausible:feasible,
    metrics:{
      peakPowerW,totalEnergyWh:round(totalEnergyWh),totalMinutes,
      liquidDoseMl:mode.wet?s.waterDoseMl:0,
      nominalTankMl:s.dirtyTankCapacityMl,
      usableBatteryWh:round(usableBatteryWh)
    },
    warnings,advisoryOnly:true
  };
}
