# ΦPRESS ClosetVault · Supervisor C0.3 (advisory only)

> **No hardware controller exists in this repository.** This is a browser-only policy thought experiment, not a certified sensing platform, electrical interlock, validated condensation model, or operational authorization.

## What changed

The cabinet concept now has an explicit, deterministic simulation of *when a proposed mode may be considered for a scenario*. The evaluator in `src/supervisor.mjs` is pure JavaScript and can be tested without any device, network connection, or browser. It consumes a snapshot and produces a receipt with check outcomes, warnings, moisture indicators and energy accounting.

The interactive page `supervisor.html` lets a researcher change conditions and load scenario presets: normal storage, high RH, cold-wall condensation, leaked water, and battery-only operation. Nothing is persisted or sent to a server.

## Scope

Modes mirror `src/energy.mjs`: sensor watch, preservation airflow, optional experimental Φ-Midifier vibration, gentle refresh, BubbleGear wet cleaning, thermal dry and press.

Checks include:

- Presence, type, range, and freshness of the synthetic sensor values. Invalid, unknown, NaN or stale inputs fail closed.
- Closed door and absent leaks for active cycles.
- Clear ventilation for active airflow and treatment.
- Adequate recovery tank and isolation for wet/thermal service.
- User-declared fabric compatibility for treatment modes (not proof of compatibility).
- Provisional high-humidity and dew-point margin warning/inhibit envelope for experimental treatments.
- Mains-only allowance for wet cleaning and heated finishing, even if a hypothetical battery has enough watt-hours.
- Battery continuous output (watts) **and** usable stored energy (watt-hours) before any low-power battery profile is considered.

The implemented dew-point approximation is Magnus-type for teaching; near-condensation is flagged when the coldest example surface is less than 2 °C above predicted dew point. This policy threshold **is not a safety standard** and does not accurately model complex fabric cavities, transients, sensor error, hysteresis or actual dehumidification.

### Model wording matters

`ELIGIBLE IN MODEL` does **not** mean safe to run, validated, approved, certified, or authorized. A model cannot enforce a seal, trip a thermal fuse, detect a failing battery, verify humidity sensor calibration, or remove moisture. These are software-side design checks only. A real appliance needs independently engineered, normally de-energized hardware interlocks and qualified compliance reviews.

## Privacy / sovereignty

Everything runs locally in the browser; no server, analytics, subscriptions, user account, external API, or telemetry. The optional copy button exports the *user-provided synthetic scenario* and computed result for collaborative analysis.

## Future engineering gates

1. Source or calibrate real temperature, RH, surface-temperature, condensate and flow sensors.
2. Specify measurement uncertainty, stale-data timeouts, mechanical state feedback and change-of-state race conditions.
3. Measure the actual power load and surge draw in each mode; no toy watts should migrate to an approved hardware design.
4. Build independent circuit-level protections and a physically isolated service bay, tested by qualified engineers.
5. Test a real condensation and ventilation system, respecting clearance and heat rejection constraints.
6. Review durability, mildew risk, fabric compatibility, maintenance and failure cases.
7. If a real controller is ever proposed, define an entirely separate vetted safety-rated architecture. **Do not port this advisory browser evaluator directly to actuator firmware.**
