# ΦPRESS ClosetVault + Φ-Midifier | Cabinet Study C0.2

**Status: speculative system architecture and interactive power-arithmetic study. No prototype, measurements, safety certification, or validated garment treatment results.**

## Design intent

Explore a **slim, wine-cooler-style garment care cabinet** that can fit in a suitable closet or serve as a stand-alone wardrobe. It integrates three independently serviceable subsystems:

- **ClosetVault:** low-energy temperature/RH/leak monitoring, filtered circulation, garment storage, alerts and maintenance logging.
- **Φ-Midifier:** optional, separately isolated **sound/light/vibration and thermal-management research accessory**. The earlier Φ-Midifier was an acoustic/vibration concept, **not a humidity generator**. Its behavior must be defined and measured, with no therapeutic, biological, sterilization, resonance-based stain-removal, or garment-cleaning claims. Lighting is cosmetic/inspection only unless evidence shows otherwise.
- **ΦPRESS:** on-demand, physically segregated wet-clean/extraction cartridge and shape-aware finishing system, pending actual textile experiments.

The cabinet owns storage, power allocation, ventilation and service access; the ΦPRESS cleaning module remains independently testable and removable. Avoid reproducing the canonical ΦBGE-01 engine in a second repo.

## Packaging options (targets only)

1. **Dry-only Vault Mini:** sensor/watch + small fan + removable filters + optional low-energy Φ-Midifier. Could be a closet insert or free-standing module.
2. **Vault + Wet Cartridge:** isolate one active garment bay from dry storage. Clean water, effluent, gaskets, leak tray and filter service must not expose stored garments.
3. **Vault + Thermal Finisher:** integrated heated dryer/press only after ventilation, power draw, thermal shutdown, fire loading, and installation clearances are independently designed.

Initial aspirational *external* envelope for a full-height unit: **450–600 mm width, 600–700 mm depth, 1500–1900 mm height**, not validated against garment drape, bending radius, service envelope or actual cooling airflow. It is **not** permission to install a hot or moisture-generating appliance inside an unventilated cabinet. A single-shirt treatment bay and several-item storage cabinet may require different sizes.

## Moisture and airflow design laws

- *Do not humidify stored clothing by default.* Track RH, temperature, condensation risk and leaks. Avoid high RH and residual moisture that foster mildew and odor.
- A sealed dry cabinet cannot continuously dehumidify without a sink for water and heat. Refrigerative dehumidification creates **condensate and reject heat**; a desiccant must be regenerated or replaced.
- Dedicated intake/exhaust or adequately engineered room/closet ventilation is mandatory wherever active heat/moisture removal requires it. Source guidance: ASHRAE Handbook, Mechanical Dehumidifiers (https://handbook.ashrae.org/Handbooks/S24/IP/s24_ch25/s24_ch25_ip.aspx), DOE Building America (https://basc.pnnl.gov/resource-guides/whole-house-dehumidification).
- Size door gasket, removable tanks, leak pan, condensate overflow cutoff, filtered circulation, service access and anti-tip anchoring. Do not make a certified clothing care product fit into another enclosed cabinet without its manufacturer-required clearance.
- Sensor data are not a safety interlock. Physical independent protection must disable heat, energized pumps, and door opening hazards.

## Energy and battery architecture

### Profiles in the browser estimator

All table entries are **deliberate toy targets** to teach power arithmetic; they are *not estimated measured watts of an existing product*.

| Mode | Assumed active draw | Active duration per day | Background draw other hours | Intended outcome |
|---|---:|---:|---:|---|
| Sensor watch | 1.5 W | 24 h | 0 W | Low-energy monitoring |
| Preservation airflow | 8 W | 4 h | 1.5 W | Intermittent circulation |
| Φ-Midifier vibration | 15 W | 0.3 h | 1.5 W | Experimental optional accessory |
| Gentle refresh | 120 W | 0.25 h | 1.5 W | Filtered airflow, no high-energy steam |
| BubbleGear wet clean | 220 W | 0.5 h | 1.5 W | Hypothetical pump/mist/extract only |
| Thermal dry + press | 900 W | 0.33 h | 1.5 W | Hypothetical heated finish |

The benchmark LG Styler model lists **1,500 W**, **120 V**, and explicit installation clearances; manufacturer source: https://www.lg.com/us/styler/lg-S3RERB . This is a market reference, **not a ΦPRESS projection**. Care cycles and environmental conditions influence actual energy.

```text
active_Wh = active_W × hours_per_day_active
background_Wh = monitoring_W × (24 - hours_per_day_active)
daily_Wh = active_Wh + background_Wh
usable_pack_Wh = certified_nominal_Wh × assumed_usable_factor
days_of_one_daily_profile = usable_pack_Wh ÷ daily_Wh
peak_feasible = active_W <= certified_continuous_output_W
```

**Battery/charge strategy:**

- Battery-first: watch, sensing and occasional circulation. Use a commercially certified battery/power module and approved charger, physically isolated from condensation/garment treatment.
- AC-first: actual heating, steam, thermal finishing and long wet cleaning, until measured data establish a safe low-power alternative.
- Hybrid: DC bus for monitoring, isolated AC power or safe external dock for active cycles. The estimated *daily* energy does not ensure inverter peak or surge capability.
- A 300 Wh battery × 85% assumed usable = 255 Wh. Sensor-watch target at 1.5 W continuously uses 36 Wh/day, about **7.1 days** if all assumptions hold. A 900 W dryer cannot run from a pack rated for only 150 W of sustained output regardless of Wh capacity.
- Solar is a possible charging source via commercially rated equipment, not an always-available guarantee. No battery pack assembly, heat/vibration charging shortcuts or free-energy claims.

The calculator intentionally excludes start-up surge, battery calendar aging, cell temperature limits, recharge losses, compressor cycles, inverter idle loss, and full sanitation/press cycles. Its purpose is transparent arithmetic and rejection of impossible peak-load combinations.

## Modular contract draft

Future physical host software may register modules with a local-only versioned interface (not implemented as hardware control at this rung):

```json
{
  "contractVersion": "0.1-proposal",
  "moduleId": "phipress.closetvault.midifier",
  "capabilities": ["visual_inspection_light", "bounded_acoustic_vibration"],
  "powerClass": "low_energy_optional",
  "requiresDryZone": true,
  "userInitiatedOnly": true,
  "safety": ["independent_overtemperature", "door_interlock", "mechanical_isolation"],
  "validatedGarmentClaims": []
}
```

Do **not** treat untrusted manifests as actuator authority. Only allow-listed, locally verified components may request actuation, and a separate safety controller enforces hard limits. Future PhiOS integration can expose status and receipts, never bypass local interlocks.

## C0.2 exit gates

- [x] Browser cabinet visualization and interactive, deterministic energy budget arithmetic.
- [x] Explicit distinction between previous Φ-Midifier research and independent moisture control.
- [x] Battery sustained-output rejection and usable-capacity assumptions.
- [ ] Validate physical fit with garment forms, access panels, and airflow clearances.
- [ ] Measure true standby/fan/sensor power with instrumentation.
- [ ] Calculate actual wet-clean recovery and drying loads from experimental results.
- [ ] Professional thermal/moisture/electrical and fire-safety review before energized prototype.
- [ ] Verify textiles after storage under high-humidity boundary conditions.
