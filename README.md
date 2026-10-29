# ΦPRESS

**A research platform for garment renewal using nested fluid-flow cells, localized cleaning, contaminant extraction, controlled drying, and shape-aware finishing.**

> **Status: concept and browser simulation, not a tested cleaning appliance.**

ΦPRESS investigates whether one compact machine could clean, dry, and press compatible garments with far less handling than separate appliances. The proposed **ΦBGE-01 Nested BubbleGear Extraction Engine** combines micro-mist delivery, counter-rotating flow cells, optional acoustic agitation, and immediate vacuum recovery. These are **hypotheses** pending experiments. Bubble patterns are not literal gears.

## First release: digital research bench

A browser-based visualization illustrates a **toy particle-transport model** with adjustable circulation, moisture-assisted release, and extraction. It is **not computational fluid dynamics**, a validated stain-removal predictor, or hardware control software.

**Demo:** after deploying GitHub Pages (Settings → Pages → Deploy from branch → main → /(root)), open the project's Pages URL. No local installation required.

## ClosetVault · Optional Φ-Midifier + battery research

**[Open the ClosetVault concept lab](./closetvault.html)** to explore a wine-cooler-style cabinet with dry preservation, the separately isolated optional Φ-Midifier sound/light/vibration research accessory, and detachable ΦPRESS active cleaning. The live power-budget planner shows where battery operation makes sense and when heating exceeds the assumed battery's peak output. These values are hypothetical targets, not measured hardware performance.

Read [the cabinet architecture and constraints](./docs/closetvault-concept.md).

## ClosetVault Supervisor C0.3

Explore the [offline advisory supervisor](./supervisor.html) that compares simulated temperature, relative humidity, dew-point margin, leak, vent, fabric, tank, battery and AC constraints against proposed operating modes. It produces explainable receipts. It is not connected to equipment and is explicitly **not a safety controller**. See [Supervisor design notes](./docs/closetvault-supervisor.md).

## ClosetVault C0.4 · moisture and energy digital twin

**[Open the Digital Twin lab](./twin.html).** Explore 24–72 hours of synthetic humidity, garment moisture release, cold-surface condensation, hypothetical water recovery and power use. The model explicitly conserves water mass and exports local CSV/JSON datasets. It is not calibrated, does not control hardware, and cannot validate cleaning performance. Read the [model equations and experimental validation plan](./docs/closetvault-twin.md).

## Modular Fixture Bench C0.5

**[Open the Fixture Engineering Bench](./fixture-bench.html)** to test conceptual cabinet geometry, alternate shirt/hat/shoe mounts, dry and wet processing routes, service-isolation guards, and example power and water constraints. Export a reproducible model receipt or conceptual module list. Descriptors in `fixtures/` follow a versioned schema and are consistency-tested.

**No hardware**, safety certification, validated cleaning results, or product performance assertions are provided. Read the [C0.5 engineering study](./docs/fixture-bench-c0-5.md).

## E0 C0.6 · Evidence and swatch measurement lab

**[Open the E0 Evidence Lab](./evidence.html)** to inspect independent trial CSV files, track apparent soil removal separately from effluent recovery, compare nested-flow candidates only under explicit comparability guards, and export open analysis records.

The default chart is clearly labeled **synthetic demo, not physical evidence**. Uploaded CSV readings are user-supplied and unverified. Details: [E0 data contract and experiment method](./docs/e0-evidence-lab.md).

## E0 C0.7 · Preregistration preparation and masked assessment

**[Open the E0 Study Planner](./study.html)** for deterministic blocked allocation across the six planned conditions, separate operator keys and masked assessor worksheets, a local plan fingerprint, self-reported readiness checklist, and strict unblinding that audits missing, swapped and incomplete records.

This is **not trusted preregistration, verified lab work or a hardware safety approval**. Read [the C0.7 process and limits](./docs/e0-study-readiness.md). No real trials have been performed.

## Physical Experiment Preflight C0.8

**[Open the C0.8 Preflight Bench](./preflight.html)** to explore unpowered cabinet/fixture mockup dimensions, register proposed instruments and critical hazards, and study how assumed soil measurement uncertainty affects apparent removal and effluent recovery.

No electrical, pressure or heated hardware is approved by the tool. The diagram is not CAD and all data are hypothetical or user-supplied/unverified. See [preflight protocol and scientific limits](./docs/physical-preflight-c0-8.md).

## Research priorities

1. Create documented, reproducible textile swatch comparisons.
2. Separate removal from redeposition and assess fiber damage.
3. Quantify water, energy, consumable use, time, and repeatability.
4. Model the garment form, dryer/press stage, and cleaning modules separately.
5. Gate all physical prototyping behind electrical, thermal, pressure, moisture, and material safety reviews.

## Repository structure

- `index.html` and `assets/`: interactive browser BubbleGear research bench.
- `closetvault.html`: modular wardrobe concept with an interactive battery/power model.
- `src/energy.mjs`: transparent power arithmetic (illustrative profiles, not measurements).
- `src/twin.mjs` and `twin.html`: reduced-order moisture and energy timeline simulator, with CSV/JSON export.
- `src/fixture-bench.mjs` and `fixture-bench.html`: concept geometry, module routes, feasibility guards, offline design and BOM exports.
- `fixtures/` and `schemas/`: versioned declarative fixture research manifests.
- `src/evidence.mjs`, `evidence.html`, `schemas/e0-trial.v0.1.schema.json`: E0 CSV validation, guarded comparisons and reproducible analysis export.
- `src/engine.mjs`: deterministic educational transport model.
- `tests/`: lightweight model invariants and reproducibility checks.
- `docs/architecture.md`: modules, interfaces, assumptions, and safety constraints.
- `docs/closetvault-concept.md`: wardrobe packaging, Φ-Midifier integration, thermal/condensation/ventilation safety, and battery constraints.
- `docs/experiment-plan.md`: preregistered test matrix and falsification criteria.
- `docs/roadmap.md`: milestones and exit criteria.

## Principles

- **Measure, do not market:** prototype claims require controlled evidence.
- **Soil must leave the garment:** dislodging without extraction is inadequate.
- **Material compatibility matters:** wool, leather, adhesives, coatings, and structured hats/shoes need separate methods.
- **No ozone or high-pressure DIY shortcuts:** no uncontained acoustic, high-voltage, heating, or pressure experimentation.
- **Repairability and sovereignty:** open files, swappable modules, local-first operation.

## License

MIT for source and documentation in this repository. No safety certification or warranty is implied.

© 2026 Φ369 Labs contributors.
