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
