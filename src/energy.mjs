/**
 * ΦPRESS ClosetVault energy arithmetic.
 * All device power and duty-cycle numbers are illustrative targets,
 * NOT measurements, product specifications or electrical engineering guarantees.
 */
export const PROFILES = Object.freeze({
  watch: Object.freeze({ label: 'Sensor Watch', watts: 1.5, hours: 24, monitorWatts: 0, note: 'Temperature/RH sensors and sleeping local controller.' }),
  preserve: Object.freeze({ label: 'Preservation Airflow', watts: 8, hours: 4, monitorWatts: 1.5, note: 'Brief circulation and passive humidity monitoring; not active dehumidification.' }),
  midifier: Object.freeze({ label: 'Φ-Midifier Vibration', watts: 15, hours: 0.3, monitorWatts: 1.5, note: 'Experimental isolated sound/vibration module, with no cleaning efficacy assumed.' }),
  refresh: Object.freeze({ label: 'Gentle Refresh', watts: 120, hours: 0.25, monitorWatts: 1.5, note: 'Illustrative filtered airflow and light treatment, without high-energy steam.' }),
  bubblegear: Object.freeze({ label: 'BubbleGear Wet Clean', watts: 220, hours: 0.5, monitorWatts: 1.5, note: 'Hypothetical pump, mist and extraction cycle; heat-assisted drying excluded.' }),
  finish: Object.freeze({ label: 'Thermal Dry + Press', watts: 900, hours: 0.33, monitorWatts: 1.5, note: 'Hypothetical heating-assisted finishing; AC power expected for this prototype rung.' })
});
const isFiniteInRange = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
export function estimateEnergy(profileKey, settings = {}) {
  const profile = PROFILES[profileKey];
  if (!profile) throw new RangeError('Unknown power profile');
  const capacityWh = settings.capacityWh ?? 300;
  const maxOutputW = settings.maxOutputW ?? 150;
  const efficiency = settings.efficiency ?? 0.85;
  if (!isFiniteInRange(capacityWh, 0, 100000) || !isFiniteInRange(maxOutputW, 0, 30000) || !isFiniteInRange(efficiency, 0.01, 1)) {
    throw new RangeError('Battery assumptions out of range');
  }
  const activeWh = profile.watts * profile.hours;
  const backgroundWh = profile.monitorWatts * (24 - profile.hours);
  const dailyWh = activeWh + backgroundWh;
  const usableWh = capacityWh * efficiency;
  const supportsPeak = profile.watts <= maxOutputW;
  const daysIfDaily = supportsPeak && dailyWh > 0 ? usableWh / dailyWh : null;
  const energyPerCycleWh = activeWh;
  return { profile, activeWh, backgroundWh, dailyWh, usableWh, energyPerCycleWh, supportsPeak, daysIfDaily };
}
