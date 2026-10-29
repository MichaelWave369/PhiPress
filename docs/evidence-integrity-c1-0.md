# ΦPRESS C1.0 · Evidence Integrity and Independent Review Package

> **Status: software infrastructure only.** No real physical experiment, calibrated apparatus, independently authenticated records, successful cleaning outcome or safety certification is claimed. A valid SHA-256 fingerprint proves byte equality to a *chosen value*, not when/where/by whom a file was created.

## Purpose

C0.9 captures a masked E0 observation record with declared methods, calibration windows, instrument IDs and references to raw files. C1.0 makes those references more inspectable:

1. Calculate actual **SHA-256 digests of user-selected local file bytes** using Web Crypto in the browser.
2. Build an inspectable, versioned **manifest** mapping logical reference IDs to their filenames, file sizes, digests and evidence roles.
3. Import a previously saved manifest and **re-hash selected files** to verify unchanged bytes.
4. Import a C0.9 audit JSON and verify that every declared observation/instrument reference is present, with the expected **raw**, **blank**, **method**, or **calibration** category.
5. Review one standard-uncertainty breakdown using independent Type A/Type B components and explicitly stated source references.
6. Export a combined local **review JSON**. The original source bytes remain in the user's custody.

This is not a secure provenance system. The browser cannot attest to a person's identity, detect manipulation *before* a manifest was created, establish an independent timestamp, verify an instrument certificate or prove a real cleaning trial happened. For those, independently controlled records, calibration traceability, third-party witnesses and an externally registered prospective protocol are necessary.

## Recommended workflow

### 1. Prepare the C0.9 masked ledger

Use **C0.7** to generate and independently freeze the E0 study plan prior to physical testing. If physical testing is later authorized, create real observation files and blank controls under a qualified research protocol. **C0.9** verifies the data structure but does not establish measurement authenticity. Export its **audit JSON**, which contains:

- Masked roster (not the treatment assignment key)
- Self-declared instrument registry
- Per-specimen event records, with raw/blank/method references

### 2. Preserve source files with stable reference IDs

In C1.0 choose local raw measurements, blanks, actual method documents, and actual calibration/rubric files.

The browser **reads** local file bytes for SHA-256, but never uploads them to a server. Its asset list is limited to 64 files, 32 MiB per file and 96 MiB total per selection; larger files must be handled with an independently reviewed offline archiving tool instead of pretending they were hashed here.

Each selected file gets:

\`\`\`json
{
  "reference_id": "RAW-TRIAL-001",
  "filename": "instrument-reading-001.csv",
  "category": "raw",
  "bytes": 1234,
  "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
\`\`\`

The hash above is **a placeholder**, not a real file digest.

Supported roles: \`raw\`, \`blank\`, \`calibration\`, \`method\`, \`protocol\`, \`other\`. Reference IDs are logical keys; the filename is the physical file identifier. The manifest refuses duplicate keys or filenames, invalid SHA-256 strings, path separators/traversal filenames, unsupported roles and impossible file lengths. No paths from the user's filesystem are stored.

**C0.9 contract linkages:**

- \`event.raw_reference\` must name a C1.0 \`raw\` asset.
- \`event.blank_reference\` on soil measurements must name a \`blank\` asset.
- \`event.method_reference\` must name a \`method\` asset.
- \`instrument.calibration_reference\` must name a \`calibration\` asset.
- \`instrument.method_reference\` must name a \`method\` asset.

Reference strings are not automatically filenames: use the C1.0 UI to assign the exact logical reference IDs recorded in the C0.9 ledger.

A reference **match** still doesn't demonstrate whether the linked file contains the correct method or certificate. That requires a reviewer reading the records and independently verifying their origin.

### 3. Export, archive and independently preserve the manifest

The file's schema is \`phipress.e0.integrity-manifest.v1.0\`, and its top-level \`status\` and \`rootOfTrust\` fields explicitly disavow authentication.

Hashing and exporting a manifest in the same session is **self-assembled provenance**. For genuine independent review:

- Keep original, read-only copies of all underlying files.
- Externally preserve the original file bytes and manifest with a reviewable versioned history.
- Obtain an independently verifiable timestamp and study-registration record **before** outcome collection where needed.
- Retain complete trial failures, exclusions, blank measurements and corrections.
- Where possible, use a qualified independent reviewer to compare hashes against preserved originals.

To check integrity later, import the saved manifest and select those actual files again. The software then compares freshly hashed SHA-256 values, filenames and byte sizes. It fails if an expected file is missing, altered, or if unexpected files appear. This can demonstrate **post-manifest bitwise integrity**, never original truthfulness.

## Uncertainty-component worksheet

The page has a four-term **example** budget, editable for one E0 measurement channel:

- Type A repeatability
- Type B calibration
- Type B blank correction
- Type B resolution

It uses a root-sum-of-squares approximation for **standard uncertainties** \(u_i\), assuming independent, uncorrelated contributions:

\`\`\`text
u_c = sqrt(u_repeat^2 + u_calibration^2
           + u_blank^2 + u_resolution^2)

U(k=2) = 2 u_c
\`\`\`

The software checks whether a user-declared reported standard uncertainty agrees within the study's simple 1% or 0.0001-unit tolerance. Source-reference fields distinguish an unlabeled numerical demonstration from a user-declared provenance record. **Those strings have not been authenticated.**

A \(k=2\) expanded uncertainty is **not automatically a 95% confidence interval**. It assumes uncorrelated components and does not model systematic bias, correction uncertainty, coverage factors, effective degrees of freedom, sampling variance, or other hidden measurement effects. The worksheet is not a completed GUM uncertainty budget and must not be used to make performance or safety claims.

Authoritative reference for the *general* first-order propagation principle: [NIST TN 1297, section 5](https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-5-combined-standard-uncertainty).

## Falsification and limitations

- Structural completeness of C0.9 records is not verification of physical measurements.
- A perfect file hash does not prove what any sensor measured.
- A signed or timestamped record, if later added, does not by itself prove cleaning efficacy.
- Self-declared calibration windows are not certified and must be independently verified.
- If C0.9 data is incomplete, C1.0 must **not** silently declare the evidence audit complete even if all existing files match.
- A browser page cannot approve or operate energized pumps, batteries, dryers, high-pressure systems or enclosed heated appliances.
- The manifest does **not** embed raw files. Exporting a review package requires preserving source assets separately. Filename conflicts and duplicate refs are rejected to avoid ambiguous links.
- No SAAS, accounts, telemetry, network calls, or hidden background processes are used.

## Source, reproducibility and test coverage

- \`src/integrity.mjs\`: pure manifest validation, file selection comparison, reference audit and RSS uncertainty review.
- \`assets/integrity.js\`: browser file selection and Web Crypto SHA-256, JSON import/export, UI.
- \`integrity.html\` and \`assets/integrity.css\`: local evidence audit interface.
- \`tests/integrity.test.mjs\`: determinism, malformed digest/path, missing/altered files, reference role mismatches, numeric uncertainty and explicit zero physical-verification flags.
- Existing C0.9 tests remain mandatory; CI runs the entire test suite and syntax checks both new modules.

## Next physical gate

Only publish physical cleaning claims after real E0 experiments with safe reviewed apparatus, genuine calibration/method records, independent swatches, a prospectively registered analysis and complete measurement uncertainty. C1.0 organizes the evidence; it doesn't supply it.

An optional future C1.1 can add cryptographic signatures from independent reviewers, multi-file archive portability and reproducible protocol snapshots **only if there is a real external trust anchor**. Avoid labels such as "certified" or "witnessed" when they cannot be verified.
