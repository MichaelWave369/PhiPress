/**
 * ΦPRESS C0.8 — unpowered mockup and measurement readiness.
 *
 * Research planning only. No rated clearances, safety approval, physical
 * device control, real metrology, manufacturing plans or hardware build.
 */
import { FIXTURES } from './fixture-bench.mjs';

export const MOCKUP_DEFAULTS=Object.freeze({
  fixture:'shirt',
  cavityWidthMm:600,cavityDepthMm:550,cavityHeightMm:1280,
  doorOpeningWidthMm:570,serviceReachMm:260,
  widthAllowanceMm:60,depthAllowanceMm:60,heightAllowanceMm:80,
  stage:'unpowered',
  measurementsSource:'hypothetical'
});

export const INSTRUMENTS=Object.freeze([
  {id:'dimensions',name:'Dimensional gauge / caliper',quantity:'Fixture and opening envelope (mm)',record:'Traceable reference, resolution and actual measured dimensions'},
  {id:'initial-soil',name:'Soil loading assay or calibrated balance',quantity:'Initial standardized soil (mg)',record:'Calibration and blank-corrected mass or validated assay'},
  {id:'residual-soil',name:'Post-treatment soil assay',quantity:'Residual soil (mg)',record:'Same validated method, controls and matrix corrections'},
  {id:'effluent-soil',name:'Effluent soil recovery assay',quantity:'Recovered soil (mg)',record:'Container blank, filter losses and recovery calibration'},
  {id:'liquid',name:'Volume / mass measurement',quantity:'Delivered water (mL)',record:'Volume correction and uncertainty at temperature'},
  {id:'electricity',name:'Suitable energy meter',quantity:'Cycle energy (Wh)',record:'Instrument range, calibration and complete system boundary'},
  {id:'time',name:'Time measurement',quantity:'Elapsed treatment (seconds)',record:'Start/stop conventions and uncertainty'},
  {id:'environment',name:'Temperature and RH monitoring',quantity:'Environment and fabric conditioning',record:'Calibration, time log and exposure context'},
  {id:'wear',name:'Blinded textile damage assessment',quantity:'Damage, shrinkage and colorfastness',record:'Predeclared scale, consistency checks and images'}
]);

export const HAZARDS=Object.freeze([
  {id:'electric-water',severity:'CRITICAL',name:'Liquid enters energized equipment',mitigation:'Isolation, containment and protective disconnection designed and independently verified'},
  {id:'heat-fire',severity:'CRITICAL',name:'Heat buildup in enclosed closet',mitigation:'Ventilation, independent thermal protection and fire/installation assessment'},
  {id:'pressure',severity:'HIGH',name:'Pump pressure, spray or fluid ejection',mitigation:'Rated components, containment and independent pressure hazard assessment'},
  {id:'battery',severity:'CRITICAL',name:'Battery in humid or wet cabinet',mitigation:'Certified module, isolated compartment, compliant charging and thermal review'},
  {id:'microbe',severity:'HIGH',name:'Stored moisture, mold and contaminated effluent',mitigation:'Moisture removal, validated hygiene protocol and service accessibility'},
  {id:'fabric',severity:'HIGH',name:'Damage to coatings, dyes, adhesives or fibers',mitigation:'Compatibility tests, exclusions and durability measurements'},
  {id:'operator',severity:'HIGH',name:'Exposure during access or cleaning',mitigation:'Physical guarding, interlock design, training and qualified independent assessment'}
]);

const num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const r=(n,d=4)=>Number(n.toFixed(d));

export function inspectMockup(input={}){
  const x={...MOCKUP_DEFAULTS,...input};
  if(!Object.hasOwn(FIXTURES,x.fixture))throw new RangeError('Unknown fixture');
  if(!['unpowered','future-powered'].includes(x.stage))throw new RangeError('Unknown mockup stage');
  if(!['hypothetical','user-entered-unverified'].includes(x.measurementsSource))throw new RangeError('Unknown dimensional source');
  for(const [key,min,max]of [
    ['cavityWidthMm',100,3000],['cavityDepthMm',100,3000],['cavityHeightMm',100,3000],
    ['doorOpeningWidthMm',0,3000],['serviceReachMm',0,2000],
    ['widthAllowanceMm',0,400],['depthAllowanceMm',0,400],['heightAllowanceMm',0,400]
  ])if(!num(x[key],min,max))throw new RangeError('Invalid '+key);
  const f=FIXTURES[x.fixture];
  const required={
    widthMm:f.widthMm+x.widthAllowanceMm,
    depthMm:f.depthMm+x.depthAllowanceMm,
    heightMm:f.heightMm+x.heightAllowanceMm
  };
  const margins={
    widthMm:x.cavityWidthMm-required.widthMm,
    depthMm:x.cavityDepthMm-required.depthMm,
    heightMm:x.cavityHeightMm-required.heightMm,
    doorMm:x.doorOpeningWidthMm-f.widthMm,
    serviceMm:x.serviceReachMm-200
  };
  const checks=[
    {id:'width',pass:margins.widthMm>=0,detail:'Target fixture clearance within cavity width'},
    {id:'depth',pass:margins.depthMm>=0,detail:'Target fixture clearance within cavity depth'},
    {id:'height',pass:margins.heightMm>=0,detail:'Target fixture clearance within cavity height'},
    {id:'door',pass:margins.doorMm>=20,detail:'Exploratory 20 mm nominal door-opening difference'},
    {id:'service',pass:margins.serviceMm>=0,detail:'Exploratory 200 mm service-reach allowance'}
  ];
  const envelopePass=checks.every(c=>c.pass);
  return {
    schema:'phipress.unpowered-mockup.v0.8',
    input:x,fixtureName:f.name,
    fixture:{widthMm:f.widthMm,depthMm:f.depthMm,heightMm:f.heightMm},
    required,margins,checks,envelopePass,
    result:envelopePass?'FITS HYPOTHETICAL ENVELOPE':'ENVELOPE CONFLICT',
    poweredPrototypeApproved:false,
    printableSketchOnly:true,
    warnings:[
      'These are static schematic boxes, not verified CAD, actual cut patterns or structural dimensions.',
      'No hinge sweep, bracing, garments in motion, airflow ducting, anti-tip anchoring or leak tray is modeled.',
      'The 20 mm door and 200 mm service allowances are trial assumptions, not safety/manufacturer standards.',
      'Passing geometry does not authorize powered pumps, heating, ultrasound, batteries or closet installation.'
    ]
  };
}

export const UNCERTAINTY_DEFAULTS=Object.freeze({
  initialSoilMg:100,residualSoilMg:55,recoveredSoilMg:30,
  uInitialMg:1,uResidualMg:1,uRecoveredMg:1,
  waterMl:120,uWaterMl:2,energyWh:12,uEnergyWh:.2,
  source:'hypothetical'
});
export function propagateSoilUncertainty(input={}){
 const x={...UNCERTAINTY_DEFAULTS,...input};
 if(!['hypothetical','user-entered-unverified'].includes(x.source))throw new RangeError('Invalid reading source');
 for(const key of ['initialSoilMg','residualSoilMg','recoveredSoilMg','uInitialMg','uResidualMg','uRecoveredMg','waterMl','uWaterMl','energyWh','uEnergyWh']){
  if(!num(x[key],0,1000000))throw new RangeError('Invalid '+key);
 }
 if(x.initialSoilMg<=0)throw new RangeError('Initial soil must be positive');
 // Independent input first-order propagation (zero covariance assumption).
 const {initialSoilMg:i,residualSoilMg:q,recoveredSoilMg:e,uInitialMg:ui,uResidualMg:uq,uRecoveredMg:ue}=x;
 const removalPct=100*(i-q)/i;
 const recoveryPct=100*e/i;
 const unaccountedMg=i-q-e;
 const uRemovalPct=Math.hypot(100*q*ui/(i*i),100*uq/i);
 const uRecoveryPct=Math.hypot(100*e*ui/(i*i),100*ue/i);
 const uUnaccountedMg=Math.hypot(ui,uq,ue);
 const apparentRemovedMg=i-q;
 const uRemovedMg=Math.hypot(ui,uq);
 // Exploratory ratio propagation: assumes no covariance with denominator.
 const uRemovedMgPerMl=x.waterMl>0
   ?Math.hypot(uRemovedMg/x.waterMl,Math.abs(apparentRemovedMg)*x.uWaterMl/(x.waterMl*x.waterMl))
   :null;
 const uRemovedMgPerWh=x.energyWh>0
   ?Math.hypot(uRemovedMg/x.energyWh,Math.abs(apparentRemovedMg)*x.uEnergyWh/(x.energyWh*x.energyWh))
   :null;
 const flags=[];
 if(unaccountedMg<0)flags.push('Residual plus recovered soil exceeds input; investigate blanks, contamination or systematic bias.');
 if(removalPct<0)flags.push('Residual exceeds initial soil; negative apparent removal retained.');
 if([ui,uq,ue].every(v=>v===0))flags.push('Zero uncertainty inputs are unrealistic until independently justified.');
 if(x.waterMl===0||x.energyWh===0)flags.push('Water or energy is zero; resource efficiency ratios are undefined.');
 flags.push('Uncorrelated-input first-order approximation only; covariance, bias, calibration and sampling variance not included.');
 return {
  schema:'phipress.uncertainty-budget.v0.8',source:x.source,inputs:x,
  removalPercent:r(removalPct),uRemovalPercent:r(uRemovalPct),expandedRemovalK2:r(2*uRemovalPct),
  recoveryPercent:r(recoveryPct),uRecoveryPercent:r(uRecoveryPct),expandedRecoveryK2:r(2*uRecoveryPct),
  unaccountedSoilMg:r(unaccountedMg),uUnaccountedSoilMg:r(uUnaccountedMg),
  removedSoilMg:r(apparentRemovedMg),uRemovedSoilMg:r(uRemovedMg),
  removedMgPerMl:x.waterMl>0?r(apparentRemovedMg/x.waterMl):null,
  uRemovedMgPerMl:uRemovedMgPerMl===null?null:r(uRemovedMgPerMl),
  removedMgPerWh:x.energyWh>0?r(apparentRemovedMg/x.energyWh):null,
  uRemovedMgPerWh:uRemovedMgPerWh===null?null:r(uRemovedMgPerWh),
  flags,
  estimatesAreMeasurementsVerified:false,
  k2IsConfidenceInterval:false
 };
}
export function preflightReceipt({mockup=MOCKUP_DEFAULTS,uncertainty=UNCERTAINTY_DEFAULTS,instruments={},hazards={}}={}){
 const geometry=inspectMockup(mockup),budget=propagateSoilUncertainty(uncertainty);
 const equipment=INSTRUMENTS.map(item=>({...item,selfReportedAvailable:instruments[item.id]===true}));
 const risks=HAZARDS.map(h=>({...h,selfReportedReviewed:hazards[h.id]===true}));
 const availableCount=equipment.filter(x=>x.selfReportedAvailable).length;
 const riskReviewCount=risks.filter(x=>x.selfReportedReviewed).length;
 return {
  schema:'phipress.physical-readiness.v0.8',
  status:'RESEARCH PLAN ONLY — NOT AUTHORIZED FOR ENERGIZED TESTING',
  geometry,budget,equipment,risks,availableCount,riskReviewCount,
  unpoweredMockupCandidate:geometry.envelopePass,
  evidenceOfPhysicalMeasurements:false,
  physicalDeviceApproval:false,
  note:'Checkboxes are unverified claims. This tool cannot provide electrical, thermal, pressure, battery or appliance safety certification.'
 };
}
