# ΦPRESS C0.6 · E0 textile evidence bench

> **Status: experiment-readiness and data analysis tooling. No physical BubbleGear experiment has been performed by this repo. The default dataset in the browser is fabricated and labeled SYNTHETIC DEMO. Imported results remain USER-SUPPLIED, UNVERIFIED.**

## Goal

Compare the proposed Nested BubbleGear extraction geometry to simpler water/suction and jet controls, with measured soil residuals, effluent collection, redeposition, water, electrical energy, cycle time and textile damage.

A negative result, failed experiment or unsuitable geometry is useful evidence. Never declare that ΦPRESS replaces a washer/dryer unless repeatable physical comparisons warrant it.

## Conditions

- **A:** plain water with suction, no circulation head
- **B:** microbubble-enriched water and suction
- **C:** plain water with simple jets plus suction
- **D:** plain water with nested vortices plus suction
- **E:** microbubble-enriched water with nested vortices plus suction
- **F:** nested vortices without suction, exploratory redeposition-only control when safely feasible

These are **planned test conditions**, not completed results. Device configurations must be characterized with actual flow, dose, pressure, delivered energy, water temperature and specimen exposure. Don't assume a pump produces micro/nanobubbles just because it moves water.

### Comparison hierarchy

1. D versus C: geometry beyond an ordinary jet at matched energy/water/flow conditions.
2. E versus D: incremental microbubble contribution within nested flow.
3. B versus A: microbubble contribution without jets.
4. E versus C: combined configuration versus ordinary jets, exploratory.

A separate comparison to an appropriate existing washing process is needed before any washer-replacement claim.

## Research data schema

Every CSV **row represents an independent textile specimen** (one unit of analysis). Do not turn repeated photos or repeated measurements of the same swatch into extra n. A trial and specimen identifier must each be unique.

| Field | Meaning |
|---|---|
| trial_id | Unique independent experiment-run ID |
| specimen_id | Unique specimen identifier |
| batch_id | Preparation batch or experimental block |
| condition | A–F as defined above |
| fabric | Fabric category/preparation (keep naming stable) |
| soil | Standardized, nonhazardous soil surrogate/method |
| initial_soil_mg | Corrected soil amount before treatment, milligrams; must be >0 |
| residual_soil_mg | Corrected soil remaining after treatment, milligrams |
| recovered_soil_mg | Soil independently quantified in effluent, milligrams |
| water_ml | Measured delivered water volume, milliliters |
| energy_wh | Measured device electricity including system boundary, watt-hours |
| seconds | Measured elapsed treatment time, seconds |
| damage_score | Preregistered ordinal visual damage score 0–5, with blinded rubric |
| redeposition_mg | Soil added to a standardized witness swatch, milligrams |

CSV header order matches the built-in template. A JSON Schema is in schemas/e0-trial.v0.1.schema.json. The browser's JavaScript validator enforces IDs, numeric types, ranges, allowed conditions and duplicate specimen identity, but does **not** verify that a physical measurement was made, the instrument was calibrated, or the protocol was followed.

Missing values must never be entered as zero just to pass validation. Reject or separately annotate incomplete records in the raw archive and report missingness; do not fabricate substitutes.

## Metrics and mass accounting

- **Apparent soil removal** = (initial soil − residual soil) / initial soil × 100%.
- **Effluent recovery fraction** = recovered soil / initial soil × 100%.
- **Unaccounted soil** = initial − residual − recovered soil (mg).
- **Redeposition** = independently assessed witness swatch soil (mg).
- Damage, water, energy and cycle time are reported separately; a cleaner outcome with worse wear may not be useful.
- A negative apparent removal or a negative unaccounted-soil amount is retained, not clamped to zero; investigate actual calibration, blanks, losses and cross contamination.

**Important:** the terms here are analytical surrogates. A weight increase on a swatch includes moisture, fiber loss or treatment residues unless those components are independently separated. A dye colorimetric reading cannot simply be labeled “soil mg” without a validated calibration procedure.

The interface will not calculate a descriptive treatment interval when either group has fewer than 3 independent specimens, when fabric/soil/batch strata differ, or when mean water or energy differ by more than 5% and 10% respectively. These values are **exploratory comparison guards** rather than adequate confounding control. Meeting them is not proof of randomized equivalence, equal flow energy or valid causality.

For eligible *single-stratum* comparisons, the tool uses an unpaired 1,200-resample percentile bootstrap with a fixed pseudo-random seed (369). It is a descriptive **exploratory** interval only, not a statistical significance claim, multiplicity-adjusted inference, or preregistered analysis.

## Method for a real pilot

1. Freeze the experimental procedure, staining and measurement rubric, random assignment and stopping rules **before** data collection. Current docs are a prospective draft until dated and registered.
2. Use independently prepared swatches from controlled fabric/soil batches; start with at least 10 per condition as a planning target, then calculate sample size from pilot variance and a meaningful effect threshold.
3. Randomize trial order and blind the outcome assessor where possible. Record temperature, flows, actual dose, collection losses and environmental conditions.
4. Collect treatment effluent and witness swatches. Include unsoiled blanks and baseline/recovery calibration samples.
5. Preserve raw images, calibration curves, instrument IDs and failed runs. Audit missing data and exclusion decisions openly.
6. Compare flow-matched C versus D first. Verify the physical vortex field independently; nine cells and six zones were aesthetic/design hypotheses, not established optimal geometry.
7. Evaluate fabric durability, shrinkage, residual moisture, colorfastness and energy/volume under a transparent operating boundary.
8. Register the confirmatory estimand, sample size, effect threshold, confidence interval method and multiple-comparison correction before confirmatory work. A pilot dashboard is not a substitute for that study plan.

### Standards worth consulting (not compliance claims)

- [AATCC TM130-2025 — Soil Release: Oily Stain Release](https://members.aatcc.org/store/tm130/538/): a published oily-soil release evaluation for home-laundered garments; it is **not the identical gravimetric method** defined in this prototype CSV.
- [ISO 6330:2021 — Domestic washing and drying procedures](https://www.iso.org/standard/75934.html): a controlled reference for textile laundering comparisons.
- [ASTM D4966-22(2026) — Martindale abrasion](https://store.astm.org/standards/d4966): informs complementary wear evaluation; its own scope and limitations apply.

These documents may be licensed. Do not reproduce proprietary procedures without authorization. Independent experimental design review is required before representing tests as conforming to any standard.

## The browser lab

- Evidence Lab: evidence.html
- Logic: src/evidence.mjs
- UI: assets/evidence.js and assets/evidence.css
- Test suite: tests/evidence.test.mjs
- Contract: schemas/e0-trial.v0.1.schema.json

Runs on a static GitHub Pages deployment with no account, backend, telemetry, npm installation or external JS dependency.

The default dataset is **SYNTHETIC DEMO**: deterministic rows invented by a formula to exercise the chart and guards. A CSV import is marked **USER-SUPPLIED UNVERIFIED**, never independently proven. The browser does not transmit a local file. Export JSON includes all records, source flags, model formulas and warnings; CSV exports allow template and toy example downloads.

## Follow-on C0.7 gate

Only advance to experimental model calibration after actual soil measurements, statistically defensible controls, duplicate-independent specimens, documented instrument uncertainty and a qualified safety review for any electrically powered wet fixture. Report negative outcomes. The prototype is currently **software design tooling, not a cleaning technology validation**.
