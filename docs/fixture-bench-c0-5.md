# ΦPRESS C0.5 · Modular Fixture & Cartridge Engineering Bench

> **Research architecture study, not a manufactured appliance.** The visual diagram is not CAD, a pressure or electrical specification, a thermal safety calculation, a BOM for purchasing, or permission to energize equipment. No hardware has been constructed or measured.

## Questions answered by this rung

1. Can a proposed garment fixture fit inside a proposed slim cabinet after approximate cavity/service allowances?
2. Is the fixture conceptually compatible with wet treatment and/or conditioned-air finishing?
3. Is the selected process split into a dry loop, bounded wetting, immediate extraction, a sealed dirty-water tank and optional independently ventilated thermal path?
4. Are the power, energy, water and service requirements stated openly, including conservative design exclusions for battery-operated wet/thermal cycles?
5. What experiment, calibration or physical design review would be needed before anybody can claim performance?

## Conceptual layout

- Separate dry garment storage from the active wet treatment bay.
- **Fixture mounts**: shirt body/sleeve tension form; brim-supporting washable-hat cradle; removable textile shoe rack.
- **Dry air path**: filtered air circulation only; does not independently remove water from a sealed cabinet.
- **Wet path**: hypothesized localized micro-mist + nested-vortex circulation, immediately followed by effluent extraction into a removable, contained collection reservoir. Actual spray delivery, flow field and particle removal are not yet demonstrated.
- **Conditioned air path**: separately engineered ventilation and heat rejection, not an arbitrary hot box placed inside a closet. A real thermal system requires independent thermal cutoffs and qualified design work.
- **Monitoring and safeguards**: sensor observation and software are informational. Mechanical leak containment, independent closed-door/thermal protections and appropriate electrical isolation are separate, mandatory future engineering.

The interactive bench highlights selected modules and produces an **advisory receipt**. It does not control them.

## Model inputs and formulas

External cabinet envelope defaults to 700 × 700 × 1800 mm. To illustrate service space and wall allowance, the study subtracts **100 mm width, 150 mm depth and 520 mm height** to derive hypothetical treatment cavity size. It adds **60 mm width/depth and 80 mm height** to a selected fixture's nominal envelope as exploratory clearance margin.

These allowances are **not physical design requirements**, not ventilation or strength clearances and not derived from a certified device. Actual garments, hinges, drains, filters, condensation, fans and service reach must be dimensioned by mechanical engineering and verified in physical prototypes.

### Illustrative sequential process profiles

| Mode | Stages, not simultaneous | Target water dose | Nominal active peak | Energy / cycle |
|---|---|---:|---:|---:|
| Watch | 2 W × 30 min | 0 mL | 2 W | 1 Wh |
| Air refresh | 25 W × 15 min | 0 mL | 25 W | 6.25 Wh |
| BubbleGear wet | 180 W × 30 min | 120 mL | 180 W | 90 Wh |
| Conditioned finish | 600 W × 25 min | 0 mL | 600 W | 250 Wh |
| Wet → finish | above wet then above finish | 120 mL | 600 W | 340 Wh |

The wattages, temperatures, treatment times, water dose and performance are **invented model study inputs**, not claims for a product or known device. Ancillary and startup loads are omitted. The full wet/thermal pathway is not authorized for battery use in the study, irrespective of the battery's rated size. Low-power modes still check both continuous watts and usable watt-hours before a theoretical battery cycle counts as model-plausible.

The capacity guard checks the dirty-water reservoir against the assumed water dose; real effluent volume, added condensate, blockage margin, spill response and filter requirements could be higher.

## Cartridge manifest contract

Research fixtures are declared in `fixtures/shirt.json`, `fixtures/hat.json`, and `fixtures/shoe.json`, using `schemas/fixture-manifest.v0.1.schema.json`.

Manifest fields include:

- Exact contract version and fixture ID
- Nominal envelope dimensions in millimeters
- Mechanical mount description
- Modes available for exploratory evaluation
- Candidate temperature cap (a **research policy, not a garment-safe temperature**)
- Eligible material *scope*, notes, and an explicitly empty list of validated claims

These are declarative manifests **only**. They never grant actuator permission; allow-listed fixtures and a separate qualified physical safety controller would be needed in a real system. The JavaScript fixture catalog is duplicated intentionally for the stand-alone UI; tests verify full manifest/catalog agreement until a later module-loading architecture is designed.

## Inspect and falsify

The page exposes why a modeled design is blocked: inadequate fit, incompatible material/form, an unisolated wet bay, insufficient water recovery, no approved ventilation path, reported leak, unreviewed fabric, blocked service access or missing assumed mains power. The status is *PLAUSIBLE IN MODEL*, not safe-to-build or safe-to-use.

### Suggested pre-hardware experiments

- Dimensional mockup with unpowered cardboard or 3D-printed fixture envelopes, real garments and door swing/maintenance reach.
- Independent water-transport study with standardized swatches and measured effluent, evaporation and fabric residuals. Use the registered E0 protocol (`docs/experiment-plan.md`).
- Visual observation of slip, wrinkles, garment support geometry and material damage after low-energy non-heated handling.
- Independent energy and ventilation heat-removal study, supervised by qualified mechanical/electrical engineers.
- Fail-safe design review for wet electrical compartments, tank overflow, filters, pumps, door access, overheating, steam exposure and battery placement before any energized integrated prototype.
- Measurement uncertainties and negative results published alongside positive ones.

## Software and testing

`src/fixture-bench.mjs` is a pure deterministic evaluator with no hardware I/O. `fixture-bench.html` and `assets/fixture-bench.js` provide an offline UI, SVG packaging diagram and local JSON/CSV exports; no external scripts or telemetry. Node tests cover candidate fit and material incompatibility, tank/isolation/vent checks, watt-versus-watt-hour gating, deterministic receipts, expected modularity and three manifest contracts.

## Follow-on engineering

C0.6 should use **actual measurement data**, uncertainty and falsifiable results rather than incrementing the number of diagrams. A simulated fan and a modeled vortex do not prove cleaning. An open-source cabinet becomes interesting only when real textiles, water, energy and lifetime durability agree with the claims.
