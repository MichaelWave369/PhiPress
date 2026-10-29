# ΦPRESS System Architecture · Candidate v0.1

> **Research proposal only.** No physical cleaning efficacy, cycle time, device safety, or regulatory conformance is demonstrated.

## Mission and boundaries

Research a modular, compact garment renewal system that can **clean, recover contaminants, dry, and shape-finish** compatible textiles with fewer transfers and potentially less water. Any replacement of traditional laundry is a future hypothesis, not a product claim. Grease, biological soils, dyes, coatings, adhesives, footwear, hats, delicate fabrics, and heavily contaminated items may require different processes, chemistry, or conventional washing.

## Proposed material path

1. **Intake and inspection:** identify material, label instructions, colorfastness and incompatible structures; reject unsafe loads.
2. **Mount and isolate:** adjustable breathable garment form or replaceable fixture inside a sealed, accessible chamber.
3. **Dry particulate collection:** filtered airflow and lint extraction before introducing moisture.
4. **Wetting/release:** metered micro-mist; optional compatible chemistry; candidate microbubble delivery (compare experimentally to ordinary water).
5. **Transport:** alternating low-energy fluid circulation, flow-cell arrangements or gentle mechanical action. *Nested BubbleGear* means controlled rotating vortices, not meshing literal gas bubbles.
6. **Recovery:** bounded wet suction removes soil-laden moisture to a collection tank/filter; measure redeposition and retained wetness.
7. **Dry and press:** low-temperature air, moisture monitoring and garment tension; preserve fabric geometry.
8. **Verification:** inspect residual dampness, garment damage, and soil-removal evidence. Do not infer sterility or pathogen kill.

### ΦBGE-01: candidate flow geometry

- Nine counter-rotating outer flow cells around an annular textile treatment region.
- Six adjustable inner treatment zones for comparison.
- One central liquid-recovery collector.
- Alternative geometries (simple single jet, straight-line flow, no acoustic assist) are necessary controls.
- The 3–6–9 count is a **design-space starting point** and has no demonstrated physical advantage.
- Counter-rotating vortices may interfere destructively; CFD and bench testing must determine whether they help.
- Ultrasound, if eventually explored, requires enclosure, exposure assessment, material testing, and independent engineering review.

## Modules and interfaces

| Module | Inputs | Outputs | Candidate sensors |
|---|---|---|---|
| Garment fixture | garment and material profile | tension/geometry | clamp position, tension |
| Mist dispenser | water, optional chemistry | liquid dose | flow, level, leaks |
| Circulation cell array | isolated pump/actuation | measured flow field | flow, pressure, vibration |
| Contaminant collector | used liquid / air | dirty reservoir | flow, differential pressure |
| Drying/finishing | conditioned airflow | target moisture and shape | temperature, humidity |
| Supervisor (future) | sensor signals, user settings | permissive actuator requests | interlock state, thermal trip |

**Prototype controller is future work.** The current JavaScript research bench is expressly **not** an actuator controller. A physical system must fail safe independent of software and cannot rely on browser code for overtemperature, liquid leakage, pressure relief, or emergency stop.

## Software architecture (implemented v0.1)

- `src/engine.mjs` implements seeded discrete particle bookkeeping, heuristic adhesion rates, a nine-cell visual vortex field, inward extraction and count conservation.
- `assets/app.js` provides UI bindings and Canvas visualization.
- `index.html` and `assets/style.css` deliver a dependency-free static site deployable on GitHub Pages.
- `tests/engine.test.mjs` checks deterministic outcomes, value bounds, population conservation, and zero-extraction behavior.

### Explicit model limitations

No Navier–Stokes solver; no bubble nucleation/cavitation; no actual pressure; no acoustics; no heat/mass transfer; no soap chemistry; no fiber geometry; no textile tensile strength; no validated parameter calibration. Model capture % is **particle capture in an invented toy geometry**, not stain removal or garment cleaning efficacy. The release constants are arbitrary.

## Engineering hazards and gate criteria

- **Hot water/steam:** scalds, condensate and thermal damage; thermal cutoff, independent high-limit and door interlocks.
- **Liquid/electric power:** isolation, leakage pathways, grounding, GFCI/RCD as appropriate, containment.
- **Pumps/air handling:** rated pressure and mechanical relief; negative-pressure limitations and filter blockage detection.
- **Ultrasound:** potentially harmful airborne/structure-borne exposure and fabric damage; no exposed transducers or ad hoc high power.
- **Electrostatics/ozone:** high-voltage and ozone byproducts; excluded from initial prototype.
- **Biological hazards:** no sterilization or sanitization claims without dedicated verified standards.
- **Cross-contamination:** cleanable tank, filters, chamber, and footwear isolation.
- **Materials:** separate validation for elastane, wool, leather, adhesives, dyed fabrics, screen prints and waterproof coatings.

A competent mechanical/electrical safety review must precede any energized enclosed prototype. There are no physical build instructions or high-pressure system specifications in v0.1.

## Open research principles

Source open under MIT; design for repair, offline operation, transparent metrics, reproducible benchmarks, accessible interfaces, and optional service connectivity only.
