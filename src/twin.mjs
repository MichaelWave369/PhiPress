/**
 * ΦPRESS ClosetVault C0.4 — reduced-order, educational moisture/energy twin.
 * Not a CFD solver, garment safety guarantee, validated humidity controller,
 * battery pack controller, or physical actuator control code.
 * Water accounting: initial air + initial garment + net ambient exchange =
 * final air + final garment + surface condensate + recovered condensate.
 */
import { dewPointC } from './supervisor.mjs';

export const TWIN_DEFAULTS = Object.freeze({
  mode: 'watch',
  hours: 24,
  cabinetVolumeM3: 1,
  cabinetTemperatureC: 22,
  surfaceTemperatureC: 20,
  ambientTemperatureC: 22,
  ambientRH: 55,
  initialRH: 48,
  airChangesPerHour: 0.22,
  garmentWaterG: 9,
  evaporationGPerHour: 0.7,
  hasMains: true,
  batteryCapacityWh: 300,
  batteryUsableFraction: 0.85,
  ventClear: true,
  leakClear: true,
  recoveryAvailable: true
});

export const TWIN_SCENARIOS=Object.freeze({
  normal: Object.freeze({...TWIN_DEFAULTS,mode:'watch'}),
  humid: Object.freeze({...TWIN_DEFAULTS,mode:'watch',ambientRH:83,garmentWaterG:18,evaporationGPerHour:1.2,surfaceTemperatureC:18}),
  wetshirt: Object.freeze({...TWIN_DEFAULTS,mode:'fan',ambientRH:63,garmentWaterG:36,evaporationGPerHour:2,surfaceTemperatureC:18}),
  drying: Object.freeze({...TWIN_DEFAULTS,mode:'dry',ambientRH:75,garmentWaterG:22,evaporationGPerHour:1.5,surfaceTemperatureC:19}),
  battery: Object.freeze({...TWIN_DEFAULTS,mode:'fan',hasMains:false,batteryCapacityWh:80,ambientRH:65})
});

const stepHours=1/6; // 10 minutes, fixed simulation step
const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const satPressureHpa=(t)=>6.112*Math.exp(17.62*t/(243.12+t));
export function saturationDensityGPerM3(tempC){
  if(!finite(tempC,-20,60)) throw new RangeError('temperature out of range');
  return 216.7*satPressureHpa(tempC)/(273.15+tempC);
}
export function vaporDensityFromRH(tempC,rh){
  if(!finite(rh,0,100)) throw new RangeError('relative humidity out of range');
  return saturationDensityGPerM3(tempC)*rh/100;
}
export function inputs(raw={}){
  const s={...TWIN_DEFAULTS,...raw};
  if(!['watch','fan','dry'].includes(s.mode)) throw new RangeError('Unknown schedule');
  if(![24,48,72].includes(s.hours)) throw new RangeError('Time span must be 24, 48 or 72 hours');
  for(const [key,low,high] of [
    ['cabinetVolumeM3',0.1,10],['cabinetTemperatureC',0,45],
    ['surfaceTemperatureC',-5,45],['ambientTemperatureC',-5,45],
    ['ambientRH',1,100],['initialRH',1,100],['airChangesPerHour',0,10],
    ['garmentWaterG',0,2000],['evaporationGPerHour',0,100],
    ['batteryCapacityWh',0,100000],['batteryUsableFraction',0.01,1]
  ]){
    if(!finite(s[key],low,high)) throw new RangeError('Invalid '+key);
  }
  for(const key of ['hasMains','ventClear','leakClear','recoveryAvailable']){
    if(typeof s[key]!=='boolean') throw new RangeError('Invalid '+key);
  }
  return s;
}
const round=(x,places=3)=>Number(x.toFixed(places));

export function runTwin(raw={}){
  const s=inputs(raw);
  const volume=s.cabinetVolumeM3;
  const satCabinet=saturationDensityGPerM3(s.cabinetTemperatureC);
  const ambientG=vaporDensityFromRH(s.ambientTemperatureC,s.ambientRH)*volume;
  // Same partial pressure at the cooler surface; convert using the AIR temperature.
  const coldSurfaceEquilibriumG=216.7*satPressureHpa(s.surfaceTemperatureC)
    /(273.15+s.cabinetTemperatureC)*volume;
  const initialAirG=volume*vaporDensityFromRH(s.cabinetTemperatureC,s.initialRH);
  let airG=initialAirG;
  let garmentG=s.garmentWaterG;
  let surfaceCondensateG=0;
  let recoveredG=0;
  let ambientExchangeG=0;
  let batteryWh=s.batteryCapacityWh*s.batteryUsableFraction;
  let energyWh=0, mainsWh=0, batteryUsedWh=0;
  let highRHHours=0, condensingHours=0, fanHours=0, dehumHours=0, blockedDryHours=0, unpoweredHours=0;
  let maxRH=s.initialRH;
  let dryLatch=false;
  const series=[];
  for(let i=0;i<s.hours/stepHours;i++){
    const time=(i+1)*stepHours;
    const rhBefore=airG/(satCabinet*volume)*100;
    const fanRequested=s.mode==='fan'&&i%6===0;
    // Provisional hysteresis is for scenario exploration; not a qualified controller.
    if(s.mode==='dry'){
      if(rhBefore>=60) dryLatch=true;
      else if(rhBefore<=55) dryLatch=false;
    }
    const dehumRequested=s.mode==='dry'&&dryLatch;
    const dehumAllowed=dehumRequested&&s.hasMains&&s.ventClear&&s.leakClear&&s.recoveryAvailable;
    const fanAllowed=fanRequested&&s.ventClear&&s.leakClear;
    if(dehumRequested&&!dehumAllowed) blockedDryHours+=stepHours;
    let active=dehumAllowed?'DRY':fanAllowed?'FAN':'WATCH';
    let watts=active==='DRY'?65:active==='FAN'?8:1.5;
    let wh=watts*stepHours;
    if(!s.hasMains){
      if(batteryWh+1e-10>=wh){
        batteryWh=Math.max(0,batteryWh-wh);
        batteryUsedWh+=wh;
      }else{
        active='OFF';watts=0;wh=0;unpoweredHours+=stepHours;
      }
    }else mainsWh+=wh;
    energyWh+=wh;
    if(active==='FAN') fanHours+=stepHours;
    if(active==='DRY') dehumHours+=stepHours;

    // Moisture 1: air exchange with ambient. Fan is INTERNAL recirculation;
    // it does not increase the externally specified ACH or remove water.
    const postExchange=ambientG+(airG-ambientG)*Math.exp(-s.airChangesPerHour*stepHours);
    ambientExchangeG+=postExchange-airG;
    airG=postExchange;

    // Moisture 2: finite garment moisture transfers into cabinet air.
    const evaporationMultiplier=active==='FAN'?1.35:active==='DRY'?1.2:1;
    const evaporated=Math.min(garmentG,s.evaporationGPerHour*evaporationMultiplier*stepHours);
    garmentG-=evaporated;
    airG+=evaporated;

    // Moisture 3: hypothetical low-capacity desiccation, only with AC, a
    // free recovery reservoir and a clear vent. Heat rejection not modeled.
    if(active==='DRY'){
      const recovered=Math.min(airG,8*stepHours); // 8 g/h is an assumption, not a spec
      airG-=recovered;
      recoveredG+=recovered;
    }

    // Moisture 4: candidate cold-surface condensation with a finite rate.
    // This stores water on the surface; it is NOT removed from the cabinet.
    const excess=Math.max(0,airG-coldSurfaceEquilibriumG);
    const condensation=Math.min(excess,12*stepHours);
    surfaceCondensateG+=condensation;
    airG-=condensation;
    if(condensation>1e-9) condensingHours+=stepHours;

    // Under 10-minute timesteps, extreme sources can exceed saturation.
    // Collect that oversaturation separately rather than deleting water.
    const supersaturation=Math.max(0,airG-volume*satCabinet);
    if(supersaturation>0){
      surfaceCondensateG+=supersaturation;
      airG-=supersaturation;
    }
    const rh=Math.max(0,Math.min(100,airG/(satCabinet*volume)*100));
    maxRH=Math.max(maxRH,rh);
    if(rh>=65) highRHHours+=stepHours;
    const dew=dewPointC(s.cabinetTemperatureC,Math.max(1,rh));
    series.push({
      hour:round(time,4),
      rh:round(rh,2),
      dewPointC:round(dew,2),
      airWaterG:round(airG,4),
      garmentWaterG:round(garmentG,4),
      surfaceCondensateG:round(surfaceCondensateG,4),
      recoveredWaterG:round(recoveredG,4),
      ambientExchangeG:round(ambientExchangeG,4),
      energyWh:round(energyWh,4),
      batteryRemainingWh:round(batteryWh,4),
      active
    });
  }
  const finalBalance=airG+garmentG+surfaceCondensateG+recoveredG;
  const startingBalance=initialAirG+s.garmentWaterG;
  const waterBalanceErrorG=finalBalance-startingBalance-ambientExchangeG;
  return {
    schema:'phipress.closetvault.reduced-order-twin.v0.4',
    assumptions:{
      timeStepMinutes:10,temperatureHeldConstant:true,
      externalAirExchangeACH:s.airChangesPerHour,
      fanIsInternalRecirculation:true,
      fanW:8,watchW:1.5,dryW:65,dryRecoveryGph:8,
      surfaceCondensationCapGph:12,
      modesAreHypothetical:true
    },
    inputs:s,
    metrics:{
      initialAirG:round(initialAirG,4),
      finalRH:series.at(-1).rh,
      maxRH:round(maxRH,2),
      highRHHours:round(highRHHours,3),
      condensationHours:round(condensingHours,3),
      surfaceCondensateG:round(surfaceCondensateG,4),
      recoveredWaterG:round(recoveredG,4),
      garmentWaterRemainingG:round(garmentG,4),
      ambientExchangeG:round(ambientExchangeG,4),
      consumedWh:round(energyWh,4),
      mainsWh:round(mainsWh,4),
      batteryUsedWh:round(batteryUsedWh,4),
      batteryRemainingWh:round(batteryWh,4),
      fanHours:round(fanHours,3),
      dehumHours:round(dehumHours,3),
      blockedDryHours:round(blockedDryHours,3),
      unpoweredHours:round(unpoweredHours,3),
      waterBalanceErrorG:round(waterBalanceErrorG,9)
    },
    series
  };
}
