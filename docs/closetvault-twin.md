# ΦPRESS ClosetVault · C0.4 reduced-order digital twin

**Status:** open-source illustrative physics model. No real sensor feed, actuator output, textile performance validation or certified product. The model never connects to pumps, heating equipment, batteries or any remote service.

## Why a time-series model?

The earlier C0.3 advisory supervisor considered a static snapshot. C0.4 asks a different question: how can water move through a small storage enclosure over 24–72 hours, and what does an illustrative operating schedule cost?

The model is intentionally narrow. Unlike an arbitrary visual cleaning-success percentage, it **conserves modeled water** across well-defined compartments, while still making clear that its rates are unmeasured assumptions.

## State variables and transfers

The simulation represents:

- Water vapor in **well-mixed cabinet air** (g)
- A **finite garment moisture reservoir** (g)
- Water condensed on the **coldest interior surface** (g), potentially undesirable
- Water recovered in a **hypothetical dehumidification tank** (g)
- **Net water exchanged with room air** (signed g)
- Electrical energy (Wh) and an optional finite battery usable capacity (Wh)

Conservation check, with signed exchange term:

\`\`\`text
initial_air_g + initial_garment_g + ambient_exchange_g
  = final_air_g + final_garment_g
    + accumulated_surface_condensate_g + recovered_tank_water_g
\`\`\`

The test suite checks the unrounded mass-balance residual for each example scenario.

### Physical equations represented

Saturated vapor pressure uses the Magnus form for temperature in Celsius:

\`\`\`text
e_s(T) [hPa] = 6.112 × exp(17.62 T / (243.12 + T))
rho_s(T) [g/m3] = 216.7 × e_s(T) / (273.15 + T)
rho_v(T, RH) = rho_s(T) × RH / 100
\`\`\`

The well-mixed room-to-cabinet water exchange uses an exponential first-order mixing approximation:

\`\`\`text
air_water_after = ambient_equivalent_g
  + (air_water_before - ambient_equivalent_g) × exp(-ACH × dt_hours)
\`\`\`

This captures exchange of vapor mass under an assumed air-change rate. It does not model spatial airflow, leak locations, turbulence or transient external conditions.

Garment evaporation is bounded by remaining garment water, at a *user-supplied hypothetical g/h rate*. A recirculating fan increases this invented evaporation rate by 35% during fan intervals to illustrate **why internal airflow can speed release without removing the water**. This multiplier has not been measured.

Surface condensation uses equilibrium vapor partial pressure at a chosen cold-surface temperature and an illustrative capped formation rate of 12 g/h. Supersaturation beyond the air's 100% RH capacity is additionally tracked as accumulated surface moisture so the model does not silently discard vapor. **No wet-surface evaporation, heat release or dynamic surface temperature is modeled.**

The optional 'recovery' scenario uses an **assumed 8 g/h** removal when a hysteresis policy requests it and AC, an available tank, reported no-leak condition and a clear vent are all present. An assumed **65 W** active load applies. These are not component ratings, manufacturer specs or validated drying rates.

### Timeline, power, schedule

- 10-minute fixed timesteps
- 24, 48 or 72 simulated hours
- Watch: illustrative 1.5 W
- Fan: illustrative 8 W for 10 minutes per hour, otherwise watch
- Recovery: illustrative 65 W with RH 60% 'on' / 55% 'off' policy, otherwise watch
- Battery: nominal Wh × assumed 0.85 usable fraction; no charging; energy cannot go negative
- Mains: active wet recovery allowed **only on assumed AC**, never on the demonstration battery, regardless of its capacity
- If a battery cannot supply the next timestep, that step has no modeled electrical power. Battery peak/surge, voltage conversion, cell safety, age and wiring are outside scope.

**Critical:** the supervisor checks and the digital twin are **research aids, not interchangeable safety controllers**. Any real system requires separate hardware-rated protections independent of these JavaScript calculations.

## What is *not* simulated?

The cabinet air temperature is held fixed. External room temperature is a fixed input. There is no heat balance, dehumidifier heat rejection, adsorption into wood/fabric, sorption hysteresis, actual appliance moisture transfer, fan pressure curve, vapor diffusion through textile stacks, condensation drainage, mold growth model, cooling coils, filter performance, garment damage, bacterial load, or fire/explosion safety simulation. Surface water never evaporates in this version. Energy excludes start-up surge and charger/inverter losses.

**Do not infer** that a green chart means fabric is clean, dry, preserved, odor-free or safe, or that a fan is a dehumidifier. No actual experiment or device was used to set the rates.

## Browser lab

Open \`twin.html\` from a static server or GitHub Pages (once Pages is configured). It accepts scenario presets, changes to room RH, starting RH, cold surface, amount/rate of garment moisture, air exchange, illustrative power mode and power source.

A chart plots cabinet RH versus the fixed room RH. The result area reports high-RH time, condensation, recovered water, energy and finite battery, as well as the water conservation residual. The CSV and JSON export buttons operate fully in the browser, with no telemetry.

## What to measure before fitting this model

1. Measure internal cabinet air volume, actual temperature, RH, coldest surface and outside air. Store calibrated sensor readings and accuracy limits.
2. Estimate ventilation/infiltration ACH by a competent test method. Do not infer outside exchange from fan watts alone.
3. Weigh standardized garments **before and after** the study, and independently weigh the condensate tray and recovery reservoir.
4. Log true active/idle power with appropriate certified instrumentation. Record start-up peak and temperature rise separately.
5. Compare 24h+ humidity and surface-condensation histories under representative hot, damp and normal conditions.
6. Fit evaporation, air exchange, and condensation coefficients from a training dataset; hold out independent validation runs.
7. Report confidence intervals, model residuals, RH sensor drift and missed transition events. Revise model or reject simplifying assumptions when they fail.
8. Independently assess installation clearance, fire loading, moisture containment, adhesives, optics, acoustic/vibration exposure, electrical safeguards and textile health before a physical prototype.

### Suggested future CSV schema for *measured* data

\`\`\`text
experiment_id,timestamp_utc,cabinet_air_c,room_air_c,cabinet_rh_percent,
room_rh_percent,cold_surface_c,garment_mass_g,reservoir_mass_g,
surface_condensate_g,energy_wh,active_device_w,notes
\`\`\`

Unlike the model exports, measured datasets must explicitly record sensor calibration, instrument uncertainty, failed sensor intervals and the experimental apparatus.

## Design ethos

Reproducible inputs, energy transparency, water-mass accountability, no SaaS, no cloud dependency, no hidden 'free-energy' claims. This is a research bridge toward qualified physical testing, not a workaround for engineering safety reviews.
