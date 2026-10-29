# ΦPRESS C0.8 · Physical Experiment Preflight

> **READ FIRST:** This project is experimental planning software only. No physical cleaning mechanism, powered prototype, lab measurement, or safety certification has been verified. The C0.8 browser tools may not be used as construction drawings, electrical instructions, pressure design, a safe cleaning procedure or permission to operate an appliance.

## The experimental question

**Can our proposed ΦBGE-01 nested-flow cleaning head physically extract more standardized soil from washable fabric than a simpler, equally controlled jet-and-extraction system?**

The honest path toward answering that is sequential:

1. Verify an **unpowered fixture fit** with actual swatches and cardboard/foam envelopes.
2. Define a measurement method for *initial*, *residual*, and *recovered* soil, including blanks, calibration and uncertainty.
3. Freeze the E0 pilot protocol and allocation **before data collection**.
4. Obtain qualified independent hazard review before testing any energized equipment that contacts liquid.
5. If the physical test can be conducted safely, run and publish results for all conditions and failures, including null findings.

C0.8 implements steps 1–3 as **planning tools**, not completion of any physical step.

## Stage A · Unpowered mechanical-fit study

A scaled schematic of top and side envelopes is shown in \`preflight.html\`. It uses the same source fixture dimensions as \`src/fixture-bench.mjs\`:

| Conceptual fixture | Nominal width | Nominal depth | Nominal height |
|---|---:|---:|---:|
| Shirt form | 470 mm | 360 mm | 920 mm |
| Hat cradle | 380 mm | 370 mm | 320 mm |
| Shoe rack | 450 mm | 430 mm | 360 mm |

These dimensions were proposed during earlier software design. **None has been measured as a fabricated object.**

The user may enter a hypothetical or independently observed *cabinet cavity* width/depth/height and desired extra fixture allowances. The software computes:

\`\`\`text
required_width = nominal_fixture_width + study_width_allowance
required_depth = nominal_fixture_depth + study_depth_allowance
required_height = nominal_fixture_height + study_height_allowance

margin_width = observed_or_assumed_cavity_width - required_width
margin_depth = observed_or_assumed_cavity_depth - required_depth
margin_height = observed_or_assumed_cavity_height - required_height
\`\`\`

A **provisional** 20 mm difference between door opening and fixture width and a **provisional** 200 mm reach for service access are *exploratory examples*, **not** manufacturer or building standards. Real door-hinge swing, access panels, fabrication tolerance, airflow routes, vibration supports, cross-contamination, loaded garment deformation, condensate and fire loading are not modeled.

The SVG export is a **non-fabrication sketch** showing the tested assumptions. It is not an exact-size print template, CNC file, pattern, licensed CAD representation, certified dimensional drawing or proof of assembly fit. Do not use it to fabricate powered equipment.

## Stage B · Instrument inventory and traceability

Before any physical swatch test, develop methods to establish:

- **Initial and residual standardized soil mass** using a valid method, including dry mass, conditioned fabric moisture, blanks and possible fiber loss.
- **Recovered soil mass in effluent**, accounting for tubing, filters, containers and incomplete collection.
- **Delivered water**, energy across a declared system boundary, and elapsed cycle time.
- **Room conditions**, wet/dry mass, visual fabric damage and retained moisture.
- **Uncertainty** for every reading, including calibration, systematic errors, repeatability, instrument resolution, biological/material heterogeneity and operator contribution.
- **Actual geometry**, removable fixture access and cleaning/recovery maintenance.

The instrument checklist is **self-reported**. The software neither connects to equipment nor validates calibration certificates, test methods, training or experimental ethics.

## Stage C · First-order uncertainty exploration

The worksheet accepts \(i\): initial soil mass, \(q\): residual soil mass, and \(e\): recovered soil mass, all in milligrams, alongside **standard uncertainties** \(u_i\), \(u_q\), \(u_e\).

\`\`\`text
apparent_removed_mg = i - q
removal_percent = 100 (i - q) / i
effluent_recovery_percent = 100 e / i
unaccounted_soil_mg = i - q - e
\`\`\`

For the simplified **uncorrelated-input, first-order** approximation:

\`\`\`text
u(removal_percent)
 = sqrt([100 q u_i / i²]² + [100 u_q / i]²)

u(recovery_percent)
 = sqrt([100 e u_i / i²]² + [100 u_e / i]²)

u(unaccounted_mg)
 = sqrt(u_i² + u_q² + u_e²)

u(removed_mg)
 = sqrt(u_i² + u_q²)
\`\`\`

A factor of \(k = 2\) may be shown as an *illustrative expanded uncertainty* but is **not automatically a 95% confidence interval**. Coverage interpretation requires distributional assumptions, degrees of freedom, correlations and the complete uncertainty budget.

These laws follow the general first-order **law of propagation of uncertainty**. Authoritative reference: NIST Technical Note 1297, Section 5, [Combined Standard Uncertainty](https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-5-combined-standard-uncertainty) and [Appendix A, Law of Propagation of Uncertainty](https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-appendix-law-propagation-uncertainty). See also [NIST Section 4, Type B Evaluation](https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-4-type-b-evaluation-standard-uncertainty), which explains deriving uncertainty components from instrument specifications, calibration certificates and other evidence.

**Important:** the default \(i = 100\), \(q = 55\), \(e = 30\) mg and 1 mg standard uncertainty per soil measurement are made-up example inputs, not physical ΦPRESS measurements. The browser identifies those values as **HYPOTHETICAL** and labels any edited readings **USER-ENTERED, UNVERIFIED**.

Unaccounted soil can be negative. Never clamp a measurement discrepancy to zero. Apparent soil removal does not establish what was recovered, whether fabric was damaged or whether a contaminant was destroyed.

### What this worksheet does *not* do

It does not model covariances or correlations between measurements. It does not correct biases, account for fabric moisture conditioning, separate soil from damaged fibers, or establish the assay's accuracy or sensitivity. Water and energy efficiency ratios are exploratory; resource uncertainties must be evaluated for every derived ratio before reporting a validated resource-efficiency claim. A real test requires a study-specific budget compiled and reviewed by someone competent in measurement science.

## Stage D · Explicit hazard register

The interface keeps liquid/electrical coupling, trapped heat, moving fluid pressure, batteries, contaminated water, textile damage and operator exposure visible. Checkboxes record user-reported review only. No number of checks can authorize energized equipment.

**Excluded from C0.8:** actuator wiring, uncontained heaters, pumps, high-pressure spray, exposed ultrasonic systems, mains-powered wet cabinets, battery pack assembly, pressurized CO₂, ozone-generating systems and enclosure installation procedures. No "safe recipe" for those hazards can be inferred from the software.

Future physical equipment needs professional review of electrical isolation, splash containment, pressure ratings, door and heat interlocks, ventilation/heat rejection, anti-tip/structural support, service access, code requirements and emergency response.

## Reproducible artifacts and no SaaS

- \`src/preflight.mjs\` implements pure mockup fit, simple uncertainty math, instrument list and hazard record.
- \`preflight.html\`, \`assets/preflight.js\` and \`assets/preflight.css\` run in a static browser.
- \`tests/preflight.test.mjs\` checks geometry, invalid states, propagation, signed soil accounting and impossible software safety approvals.
- Users can export a **non-fabrication SVG sketch**, geometry JSON, uncertainty JSON or complete preflight research receipt.
- No telemetry, server-side upload, device connection, user account, payment or cloud API.
- All checkboxes are explicitly **self-attested**, and all data remain local in memory until users choose to download.

## What is the next real milestone?

**C0.9 should be an observational evidence package** containing actual dimension logs, instrument calibration references and a specimen/blank capture checklist. Physical activity must not begin until the relevant independent safety review and a frozen E0 protocol exist. A green CI run does not imply that any experimental apparatus was built, certified or tested.
