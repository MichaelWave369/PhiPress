# ΦPRESS C0.7 · E0 preregistration preparation and masked-assessment workflow

> **Research planning only.** There is still **no physical BubbleGear experiment or validated cleaning technology**. The software generates prospective allocation documents and audits user-supplied data. It does not prove scientific merit, actual measurements, approved laboratory safety or a true prospective registration.

## Why this rung exists

C0.6 can inspect CSV data after the fact. That is not enough: a fair comparison requires the experiment to define specimen allocations, measurement endpoints, controls, uncertainty, stopping rules and analysis procedures **before the experiment**. C0.7 makes a reproducible, balanced assignment and makes it harder to quietly relabel or omit samples once outcomes exist.

This workflow is **assessor-blinded only**. The equipment operator necessarily knows which method is applied, and must keep that key away from the person scoring residual soil and fabric damage. The same person operating and scoring, or a shared computer showing the allocation key, invalidates blinding.

## Inputs and planned conditions

The user supplies a safe project ID, fabric and nonhazardous soil description, seed, a 1–5 preparation-block count, and 3–20 independent swatches per condition in each block. Conditions are the existing A–F registry from \`src/evidence.mjs\`:

| ID | Candidate |
|---|---|
| A | Plain water + suction |
| B | Microbubble-enriched water + suction |
| C | Plain water + simple jets + suction |
| D | Plain water + nested vortices + suction |
| E | Microbubble-enriched water + nested vortices + suction |
| F | Nested vortices + no suction, where appropriate and safe |

F is a redeposition-control concept and might be omitted from a later, narrower preregistered study based on engineering review. If excluded, do not quietly alter a study already frozen.

The planner uses seeded **Fisher–Yates shuffling inside each preparation batch**, with identical A–F specimen counts within every block. The linear-congruential pseudorandom generator is repeatable, not cryptographically secret or assured of ideal allocation concealment. The operator sheet is exported separately from the blinded assessor sheet.

### Files to save before collection

1. **Plan manifest JSON**: study parameters, seed, sequential assignments and intended comparisons; it is the operator-side, unblinded record.
2. **Operator key CSV**: trial ID, specimen ID, batch, planned order, condition and textile labels. Restrict access to the operator.
3. **Masked assessor CSV**: all E0 measurement fields from \`schemas/e0-trial.v0.1.schema.json\`, unique trial/specimen/batch identifiers, fabric/soil, **blank condition values and blank measurements**. This is a data-collection template, not a data set.

The SHA-256 fingerprint shown in the browser is calculated over the same exported **pretty-printed UTF-8 JSON bytes** of the plan manifest. It can be used to detect later content changes when the file is preserved. A hash generated locally, even with a clock on the user’s machine, is **not a trusted timestamp** and cannot show when the researcher committed to the plan.

To establish prospective provenance, upload the plan to an independent versioned repository or study registration platform **before data are collected**, preserve an externally verifiable commit timestamp or registration reference, and freeze the original plan rather than retroactively editing it. Do not paste specimen condition keys into publicly accessible artifacts before blinded scoring is complete if that would compromise the study.

## Real experimental prerequisites, not software assurances

The checkboxes in the UI record **self-attestations**, not verified certification. Necessary independent work includes:

- Written definition of the fabric, soil surrogate, preparation and residual/effluent analytical method, treatment exposure and trial exclusions.
- A qualified physical safety review for all water, pressure, electrical, moving or heated equipment; no unreviewed energized prototype.
- Instrument IDs, traceable calibration where available, raw blanks, specimen moisture conditioning and measurement uncertainty in soil mass, water and energy.
- Randomized preparation/exposure order with separate operator and blind outcome assessor.
- A prospectively specified primary comparison (not whichever pair looks best), meaningful effect threshold, sample-size plan, treatment failures and stopping rules.
- Explicit treatment of blocked experimental runs, missing values, deviations, redos and rescues in raw data, not data imputation disguised as observations.

Completing the software checklist is **not** approval to build or run physical equipment.

## Unblinding sequence

1. Only after outcome scoring is complete, take the filled **masked assessor CSV**.
2. Import it into the same browser session where the generated plan remains loaded. The page does not store plans or measurements on a server or local storage.
3. The tool requires the original number of rows, no duplicate trial IDs or specimen IDs, no unknown trial IDs, exact agreement of specimen, batch, fabric and soil, **blank condition cells**, and valid numeric observations according to C0.6.
4. If any check fails, **all unblinding exports are withheld**. The researcher must preserve original files and document corrections, instead of quietly dropping rows.
5. If checks pass, download **UNVERIFIED unblinded E0 CSV** and an audit JSON containing the plan, joined rows, the exploratory analysis and self-reported readiness status. Both are still user-provided and unverified measurements.

The E0 C0.6 analysis uses soil removal, effluent recovery, unaccounted soil, redeposition, water, electricity, time and damage. Its percentile bootstrap intervals are exploratory. C0.7 does not transform those into confirmatory evidence or independently attest to data authenticity.

## Scientific and software limitations

- Balanced allocation does not correct operator effects, differences in flow, pressure, wetting efficiency or treatment dose.
- Local deterministic shuffling and SHA-256 do not prove an independent blinded protocol or that a test predates outcomes.
- Assessor CSV contains the fabric and batch descriptors; if those expose a treatment, masking fails in practice.
- This v0.7 workflow expects all planned samples. A **preregistered missing-data handling plan** is required for real failures before a confirmatory comparison is possible.
- No hardware, calibrated sensors, thermodynamics, validated microbiological safety or universal fabrics.
- Browser file handling is local-only. Nothing is retained after closing or reloading unless the user downloads it; lost keys cannot be recovered from a public interface.
- The source is open, MIT-licensed and can be inspected independently.

## Next experimental gate

After obtaining qualified review and physically safe test fixtures, perform a small **independent pilot** to establish variance and measurement feasibility, then preregister a confirmatory C versus D comparison (nested flow versus conventional jets) with effect size, power calculation, adjusted confidence intervals and wear/water/energy limits. Publish failures and null outcomes.
