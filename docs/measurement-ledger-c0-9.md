# ΦPRESS C0.9 · Traceable observation ledger and calibration declarations

> **Status: data infrastructure only.** No instruments, laboratories, calibration certificates, measurements, physical ΦPRESS machine or cleaning efficacy have been independently verified. A structurally complete record is not scientific validation or permission for energized testing.

## The problem C0.9 addresses

Previous rungs created a prospective experimental plan (C0.7), nonpowered fixture mockup and illustrative measurement uncertainty study (C0.8), and CSV analysis tools (C0.6). The missing step was a **record of every observation**, including who reported it, where the raw instrument file lives, which assay method was used, the calibration record declared for the instrument, the timestamp of each measurement and the exact specimen in the masked plan.

C0.9 builds that local-first record system without assuming a test has been conducted.

## Operator and assessor workflow

1. Complete and externally freeze a proposed E0 study protocol *before* any real experimental work. The plan generator in C0.7 is a drafting aid, not independent preregistration.
2. Export the **masked assessor CSV** from C0.7. It has planned \`trial_id\`, \`specimen_id\`, \`batch_id\`, \`fabric\`, \`soil\`, and blank \`condition\` and numeric columns.
3. Import that exact CSV into \`observations.html\`. The ledger deliberately **rejects** a roster containing treatment identities or filled measurements.
4. Download an **observation CSV template**, with exactly eight blank numeric/provenance event rows per planned independent specimen.
5. Create or import a **self-reported instrument registry**. A separate instrument entry is required for each unique instrument ID. The browser's manual builder creates one measurement channel per entry; the JSON format permits a physical instrument to support several channels.
6. Only after a qualified safety and metrology review authorizes a real experimental procedure, enter **actual, unmodified** observations alongside raw-data files, blank reference and instrument-method references. The browser does not connect to or control measuring equipment.
7. Import the observation CSV. Correct all identity, blank, unit, timestamp, calibration-window and completeness errors. **Keep original raw records and changes**; do not silently discard failed trials, round unknowns to zero, fabricate references or average repeated readings.
8. Once complete, export a *still-masked* E0 CSV. Return to C0.7 for controlled unblinding **after assessment is finished** and use C0.6 for descriptive analysis.

**Masking:** this ledger never needs the treatment key. Using a C0.7 masked assessor worksheet preserves the separation of operator and assessor roles. The ledger does not authenticate that separate people actually performed those roles.

## Data contract: instrument register JSON

The file has \`"schema": "phipress.e0.instrument-register.v0.9"\` and an \`"instruments"\` array with one or more records.

Each record includes:

- \`instrument_id\` and \`display_name\`, unique readable identifiers.
- \`supported_measurements\`, an array of one or more of the eight E0 measurement names.
- \`valid_from\` and \`valid_through\`, ISO \`YYYY-MM-DD\` dates defining a **declared** calibration/rubric window.
- \`uncertainty_floor\`, an object keyed by supported measurement names and values in those measures' units.
- \`calibration_reference\` and \`method_reference\`, identifiers of *externally retained* records.
- \`declared_by\`, the person or role supplying the declaration.

A reference string does **not** prove the referenced certificate exists, that it came from an accredited lab or that an instrument was calibrated correctly. Calibrations and traceable methods must be assessed independently. The quality gate checks a timestamp is inside the *declared* date window, never that a certificate is authentic.

### Example descriptor shape only (fictional, NOT calibration evidence)

\`\`\`json
{
  "schema": "phipress.e0.instrument-register.v0.9",
  "instruments": [
    {
      "instrument_id": "EXAMPLE-MASS-01",
      "display_name": "Illustrative assay instrument",
      "supported_measurements": ["initial_soil_mg", "residual_soil_mg"],
      "valid_from": "2020-01-01",
      "valid_through": "2020-12-31",
      "uncertainty_floor": {
        "initial_soil_mg": 0.1,
        "residual_soil_mg": 0.1
      },
      "calibration_reference": "FICTIONAL-CALIBRATION",
      "method_reference": "FICTIONAL-METHOD",
      "declared_by": "EXAMPLE-NOT-A-REAL-LAB"
    }
  ]
}
\`\`\`

**Do not use example reference IDs as actual records.** The example window deliberately ended years ago.

## Data contract: observation CSV

Each row is an individual **measurement event for one independent specimen**, not a separate experiment or independent sample. Its fixed CSV columns are:

\`\`\`text
record_id,trial_id,specimen_id,batch_id,measurement,value,unit,
standard_uncertainty,instrument_id,observed_at_utc,operator_id,
raw_reference,blank_reference,method_reference,notes
\`\`\`

Required quality rules:

| Field | Rule |
|---|---|
| record_id | Globally unique measurement event ID |
| trial_id / specimen_id / batch_id | Match one masked C0.7 planned specimen exactly |
| measurement | One of the eight E0 measurement channels below |
| value | Nonnegative finite numeric observation; initial soil and duration must exceed zero |
| unit | Exact units for the measurement channel |
| standard_uncertainty | Nonnegative finite number at least the registered instrument floor |
| instrument_id | Exists in declared registry, supporting the selected measurement |
| observed_at_utc | Exact UTC ISO timestamp \`YYYY-MM-DDTHH:mm:ssZ\`, within declared window |
| operator_id | Named person/role who reports the observation |
| raw_reference | Required identifier to original raw measurement file/log |
| blank_reference | Required for soil assay channels |
| method_reference | Required; must equal the instrument's declared method |
| notes | May record deviations, anomalies or limitations |

**E0 channels and exact units:** \`initial_soil_mg\` (mg), \`residual_soil_mg\` (mg), \`recovered_soil_mg\` (mg), \`water_ml\` (mL), \`energy_wh\` (Wh), \`seconds\` (s), \`damage_score\` (0–5 integer score), and \`redeposition_mg\` (mg).

Physical damage scoring is ordinal, so it requires a validated assessor rubric and inter-rater assessment, not a claim that a visual inspector has an electrical calibration certificate. The registry accepts rubric/training references, while the research team remains responsible for their legitimacy.

### Important validation boundaries

- The program rejects **duplicate channel records per trial** when creating a single E0 outcome. Repeated instrument measurements require a separately justified reconciliation method and must remain in raw data; the software does not silently average or cherry-pick them.
- It rejects incomplete outcomes, mismatched specimen/batch IDs, invalid or missing values, invalid UTC timestamps, units, undocumented raw/method references, measurement channels not declared by instruments and readings outside declared calibration dates.
- It does **not** verify that data originate from physical experiments, that measured soil is actual soil rather than retained moisture/fiber loss, that the operator used the right settings, or that all exclusions have been included.
- It does not hash or fetch underlying raw files, because raw references are metadata strings in this iteration. Any future evidence integrity system must clearly distinguish user-computed hashes from independently authenticated provenance.
- The E0 export includes **no treatment assignments**. An assessor should never import the operator key into this ledger.
- The default state contains **zero measured records and zero declared instruments**. No fake demonstration dataset is inserted.
- No cloud account, server upload, storage service or external telemetry is used. Files exist only in the browser session until explicitly exported; refresh loses in-memory work.

## Artifact map and verification

- \`observations.html\` · local browser ledger interface
- \`assets/observations.js\` · upload, instrument-builder and audit UI
- \`assets/observations.css\` · interface styling
- \`src/observations.mjs\` · strict file parsing, registration, masking and quality gates
- \`tests/observations.test.mjs\` · deterministic tests for complete/incomplete rows, quotations, masked conditions, unit consistency, declared calibration dates and uncertainty-floor rejection
- \`docs/measurement-ledger-c0-9.md\` · this contract

The local JSON audit preserves user-supplied input records, declaration metadata, incomplete channels, errors, and explicit claims of **unverified** provenance. A green test run checks the software's rules, not a laboratory's accuracy.

## C1.0 next gate

Before real cleaning trials, require a written laboratory method, independent hazard review, traceable calibration certificates or equivalent suitable instrument assessments, a pre-registered study and witnessed physical measurements with retained raw assets. A future C1.0 can add explicit instrument uncertainty budgets, raw file hashes and immutable manifest review, but should never auto-certify measurement authenticity from a self-reported metadata record.
