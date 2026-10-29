# ΦPRESS / ΦBGE-01 · Experiment Plan E0

**Status:** prospective plan. No measurements have been collected.

## Research question

For washable fabric swatches, does a nested, counter-rotating flow-cell design combined with immediate extraction remove *more standardized soil* per unit water and energy than simpler cleaning approaches, without significantly increasing fabric wear or redeposition?

## Working hypotheses (to falsify)

- **H1:** active mist-assisted release + extraction removes more modelled/observed soil than extraction alone.
- **H2:** circulation-assisted cleaning improves removal compared with a flow-matched non-vortex control, *after controlling for delivered liquid and suction*.
- **H3:** localized circulation plus immediate recovery reduces post-treatment soil redeposition relative to a no-recovery condition.
- **H4:** any cleaning benefit can be achieved without unacceptable fabric damage or residual dampness.

## Bench groups

| Group | Liquid | Flow | Recovery | Purpose |
|---|---|---|---|---|
| A | water | none | yes | suction-only baseline |
| B | microbubble-enriched water | none | yes | isolated bubble contribution |
| C | plain water | simple jets | yes | flow-energy comparator |
| D | plain water | nested alternating vortices | yes | geometric effect |
| E | microbubble-enriched water | nested alternating vortices | yes | combination interaction |
| F | plain water | nested alternating vortices | no | redeposition control, if safe |

Match **volume, water temperature, exposure time, substrate, initial soil, nominal flow energy and recovery capacity** where the design allows. Document mismatches. Measure delivered air/bubble size and concentration where practical. Do not assume micro- or nanobubbles are produced merely by a pump.

## Materials and setup

- Start with plain, washable cotton swatches and standardized nonhazardous particle/oil surrogate soils.
- Measure initial contamination and choose non-destructive or independently validated analytical methods.
- Use a fixed extraction fixture; randomized run order and blinded scoring where feasible.
- Block test runs by swatch batch, contaminant type, operator, and device calibration.
- Include cleaning blanks and unsoiled controls; collect effluent and retained material for mass balance.
- Use **at least 10 independent specimens per condition as a pilot planning target**, then calculate sample size from the observed variance and a preregistered practical effect. Repeated reads from one specimen are not independent replicates.
- No pathogens, unknown industrial solvents, chemical fumes, uncontained high-voltage devices, or exposed high-power ultrasound.

## Primary and secondary measurements

**Primary:** fraction of standardized soil removed (quantified against initial soil and remaining soil), with confidence intervals; explicitly distinguish mobilization from actual recovery.

**Secondary:** soil in recovery reservoir, soil redeposition on witness swatches, residual moisture, drying energy, water volume, electrical energy, treatment time, fabric color change, shrinkage, pilling, and tear/tensile changes. Record equipment calibration and uncertainties.

## Falsification / go-no-go

An initial continuation gate could require: (1) a practically meaningful, replicated improvement over **C** rather than just over no treatment; (2) no disproportionate fabric damage; (3) contamination actually reaches the collection stream; (4) credible water/energy accounting. Set numerical thresholds and statistical analysis **before collecting confirmatory data**, based on pilot variance and use-case requirements. If differences vanish under controlled flow energy, simplify the geometry or reject H2.

## Data format

Use one row per independent specimen with `run_id, date, sample_id, fabric, soil, group, random_order, initial_soil, residual_soil, recovered_soil, water_ml, energy_wh, seconds, fabric_damage, notes` and units/calibration metadata. Store raw readings, blank corrections, instrument methods, photographs with consistent illumination, and analysis scripts. Preserve failed trials and deviations.

## Roadmap to physical work

First use software and published fluid/textile literature to narrow geometry. Next use low-energy, mechanically guarded wet test fixtures designed by qualified personnel. Only after evidence and a formal hazard review should a complete motorized, heated appliance enter development.

**The existing browser simulation is not evidence for H1–H4.**
