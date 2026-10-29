import { PROFILES } from './energy.mjs';

// ΦPRESS C0.3 — an advisory, deterministic planning policy.
// Absolutely NOT machine control, safety certification or hardware interlock logic.
export const MODES = Object.freeze({
  watch: { label:'Sensor Watch', wet:false, thermal:false, requiresVent:false, requiresTank:false, requiresIsolation:false, requiresFabricCheck:false },
  preserve: { label:'Preservation Airflow', wet:false, thermal:false, requiresVent:true, requiresTank:false, requiresIsolation:false, requiresFabricCheck:false },
  midifier: { label:'Φ-Midifier Vibration', wet:false, thermal:false, requiresVent:false, requiresTank:false, requiresIsolation:false, requiresFabricCheck:true },
  refresh: { label:'Gentle Refresh', wet:false, thermal:false, requiresVent:true, requiresTank:false, requiresIsolation:false, requiresFabricCheck:true },
  bubblegear: { label:'BubbleGear Wet Clean', wet:true, thermal:false, requiresVent:true, requiresTank:true, requiresIsolation:true, requiresFabricCheck:true },
  finish: { label:'Thermal Dry + Press', wet:false, thermal:true, requiresVent:true, requiresTank:true, requiresIsolation:true, requiresFabricCheck:true }
});

export const DEFAULT_SNAPSHOT = Object.freeze({
  mode: 'watch',
  temperatureC: 22,
  humidityRH: 48,
  surfaceTemperatureC: 20,
  sensorFresh: true,
  doorClosed: true,
  leakDry: true,
  ventilationClear: true,
  tankReady: true,
  wetBayIsolated: true,
  materialApproved: true,
  mainsAvailable: true,
  storedBatteryWh: 300,
  batteryContinuousW: 150,
  usableFraction: .85
});

const finiteWithin=(x,min,max)=>typeof x==='number' && Number.isFinite(x) && x>=min && x<=max;
const numeric=(x)=>typeof x==='number' && Number.isFinite(x);
export function dewPointC(tempC, rh) {
  if (!finiteWithin(tempC,-20,60)||!finiteWithin(rh,1,100)) return null;
  const a=17.62,b=243.12, gamma=Math.log(rh/100)+a*tempC/(b+tempC);
  return b*gamma/(a-gamma);
}
export function evaluate(snapshot={}) {
  const s={...DEFAULT_SNAPSHOT,...snapshot};
  if (!Object.hasOwn(MODES,s.mode)||!Object.hasOwn(PROFILES,s.mode)) {
    throw new RangeError('Unknown mode');
  }
  const mode=MODES[s.mode], profile=PROFILES[s.mode];
  const checks=[];
  const warnings=[];
  const add=(id,pass,why)=>checks.push({id,pass:Boolean(pass),detail:why});
  const validTemp=finiteWithin(s.temperatureC,0,50);
  const validRH=finiteWithin(s.humidityRH,1,100);
  const validSurface=finiteWithin(s.surfaceTemperatureC,-5,55);
  const validPower=finiteWithin(s.storedBatteryWh,0,100000)
    && finiteWithin(s.batteryContinuousW,0,30000)
    && finiteWithin(s.usableFraction,.01,1);
  const validBooleans=['sensorFresh','doorClosed','leakDry','ventilationClear','tankReady','wetBayIsolated','materialApproved','mainsAvailable']
    .every(key=>typeof s[key]==='boolean');
  add('valid-inputs',validTemp&&validRH&&validSurface&&validPower&&validBooleans,
    'All temperature, RH, battery and binary indicators must have valid, known readings.');
  add('fresh-sensors',s.sensorFresh===true,
    'Stale sensor readings cannot support a reliable equipment decision.');
  const dp=validTemp&&validRH?dewPointC(s.temperatureC,s.humidityRH):null;
  const margin=dp!==null&&validSurface ? s.surfaceTemperatureC-dp:null;
  const condensationAlert=margin!==null&&margin<2;
  if(validRH&&s.humidityRH>=65) warnings.push('High example humidity: airflow alone does not remove moisture. Inspect ventilation and dehumidification strategy.');
  if(validRH&&s.humidityRH<30) warnings.push('Low example humidity: monitor fabrics and special storage requirements.');
  if(condensationAlert) warnings.push('Illustrative dew-point margin below 2 °C: condensation could form on cold surfaces.');
  if(s.mode!=='watch') {
    add('closed-door',s.doorClosed===true,'Door is confirmed closed for the requested active cycle.');
    add('leak-clear',s.leakDry===true,'A reported leak stops active modes in this model.');
  }
  if(mode.requiresVent) add('ventilation',s.ventilationClear===true,'Clear, engineered airflow path must be confirmed.');
  if(mode.requiresTank) add('collection',s.tankReady===true,'Collection reservoir must have capacity and be serviceable.');
  if(mode.requiresIsolation) add('wet-bay-isolation',s.wetBayIsolated===true,'Treatment bay must be isolated from dry garment storage.');
  if(mode.requiresFabricCheck) add('material-check',s.materialApproved===true,'Fabric compatibility must be assessed for the requested treatment.');
  if(s.mode!=='watch'&&s.mode!=='preserve') {
    add('moisture-envelope',validRH&&s.humidityRH<65&&!condensationAlert,
      'Experimental policy: no accessory or garment treatment in high RH or near-condensation conditions.');
  }
  const mainsOnly=mode.wet||mode.thermal;
  if(mainsOnly) add('mains-required',s.mainsAvailable===true,
    'Wet cleaning and heated finishing are AC-only in the current exploratory architecture.');
  const dailyWh=profile.watts*profile.hours+profile.monitorWatts*(24-profile.hours);
  const usableWh=validPower?s.storedBatteryWh*s.usableFraction:null;
  const peakOK=validPower&&s.batteryContinuousW>=profile.watts;
  const energyOK=validPower&&usableWh>=dailyWh;
  if(!s.mainsAvailable) {
    add('battery-output',peakOK,'Battery continuous output must meet the assumed active mode draw.');
    add('battery-budget',energyOK,'Usable battery charge must cover one whole illustrative daily profile.');
  }
  if(s.mode==='preserve'&&validRH&&s.humidityRH>=65) warnings.push('Airflow may mix air while leaving absolute humidity high; resolve source moisture first.');
  if(s.mode==='watch'&&s.leakDry===false) warnings.push('Leak flagged: monitoring remains informational; service response required.');
  if(mode.thermal) warnings.push('The thermal mode is conceptual. Passing this model is not approval to energize a heater.');
  if(mode.wet) warnings.push('The BubbleGear module is not a validated cleaning device; no energized prototype is authorized here.');
  const permitted=checks.every(x=>x.pass);
  return {
    mode:s.mode,modeLabel:mode.label,
    status:permitted?'ELIGIBLE IN MODEL':'BLOCKED IN MODEL',
    eligible:permitted,
    checks,warnings,
    dewPointC:dp,
    dewPointMarginC:margin,
    dailyEnergyWh:dailyWh,
    usableBatteryWh:usableWh,
    assumedActiveW:profile.watts,
    powerPath:s.mainsAvailable?'MAINS (ASSUMED)':'BATTERY (ASSUMED)',
    advisoryOnly:true
  };
}