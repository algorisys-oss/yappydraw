# VectorCraft review 2: two days, 663 commits later

**Reviewed:** 2026-10-09 · **Subject:** [storytold/vectorcraft](https://github.com/storytold/vectorcraft) @ `c2711df3`
(v0.7.0) · **Previous review:** [`vectorcraft-review.md`](vectorcraft-review.md) @ `a26aa5b` (v0.4.0, 2026-10-07)
· **Yappy at:** v0.8.279

**Method.** Updated the clone in `temp/vectorcraft`. Three read-only passes over the diff `a26aa5b..c2711df3`
(print & colour; geometry, effects & import; architecture, testing & process), each told what Yappy already has
so it reported only what's new or better. Key claims were spot-checked against the source (cited below). Unlike
the first review, nothing was built or run this time. VectorCraft paths are relative to its repo root.

---

## 1. TL;DR

In two days VectorCraft went v0.4.0 → v0.7.0: **663 commits, +116k lines across 573 files.** Almost all of it is
**import** (native Affinity, Illustrator editing data, EPS, `.ase` swatches, deeper PDF/SVG), **type** (mojikumi,
vertical type, bidi) and **translations**. The geometry core and the architecture barely moved.

Meanwhile Yappy shipped four of the first review's eight picks, and went past one of them: v0.8.279 has the
vector PDF the review queued for "Phase C", plus CMYK, spot colours, PDF/X-4 and a print preview. That makes the
two print pipelines directly comparable for the first time, and **print is where VectorCraft now teaches the
most**.

Recommended next, in order:

| # | Pick | Why now | Effort |
|---|---|---|---|
| 1 | **Harden PDF/X-4:** CMYK blending space on transparency groups + a self-verify pass — ✅ **done 2026-10-09** (bug #433) | Closes the two gaps we already listed before anyone preflights; VectorCraft has both | ~1 day |
| 2 | **Model-based undo test + junk-params sweep** (fast-check) — ✅ **done 2026-10-09** (found bug #434 + a hollow sweep test) | Our sweep exists; this is the other half of the safety net | ~2 days |
| 3 | **Overprint, end to end** (flag, Overprint Black, `/OP /op /OPM 1`, preview, separations view) | The biggest remaining hole in Yappy's print story | ~4–5 days |
| 4 | **The effect stack** (still the first review's #4) | Still the largest parity gap; VectorCraft's model is unchanged and proven | ~2 weeks |
| 5 | **Flat Logo trace + centre-line strokes** | A step change for Image Trace on logos; pure algorithms, portable | ~1 week |

---

## 2. Status of the first review's picks

| # | Pick (review 1) | Yappy status | Where |
|---|---|---|---|
| 1 | `vectorcraft-pathops` → WASM for booleans | **Open** | — |
| 2 | Typed command registry, one `execute()` | **Done** (v0.8.276) | `Yappy.commands`, palette with reasons |
| 3 | Begin/Preview/Commit + labelled, selection-restoring history | **Half done**: labelled history, selection restore and rollback shipped (v0.8.275); Begin/Preview/Commit open | `Yappy.command(label, fn)` |
| 4 | Non-destructive effect stack | **Open** (effects now *export* correctly, still bespoke fields) | — |
| 5 | Command sweep + import fuzzing + model-based undo | **Sweep done** (`tests/command-sweep.spec.ts`); fuzzing and model-based open | — |
| 6 | Perf-budget harness + render fixes | **Harness + rAF coalescing done**; pan reprojection and identity caches open | `tests/perf-budget.spec.ts` |
| 7 | Native document embedded in exported SVG/PDF | **Open** | — |
| 8 | Live MCP bridge | **Open** | — |
| — | (Phase C) Vector PDF | **Done and exceeded**: CMYK, spot, PDF/X-4, print preview (v0.8.279) | `docs/cmyk-print-plan.md` |
| — | (Phase A) shortcut-conflict test; help dialog from the registry | **Open** (help hotkeys still hand-written) | — |

---

## 3. What VectorCraft added since `a26aa5b`

### 3.1 Print and colour: mostly unchanged code, now worth comparing

The print modules themselves (`pdf/src/{pdfx,marks,lab_spot,editing}.rs`, `pdf/src/print/*`, `render/src/proof.rs`)
have an empty diff. The changes are live-text PDF with subset fonts, CMYK images kept CMYK from import to export,
ICC CMYK→RGB with BPC, a "greys to K" option, and `.ase` import. The comparison that matters is §4.

### 3.2 Geometry and effects: small, targeted

- **Shape Builder:** open paths now act as cutting edges (`pathops/src/planar.rs:321`), Erase deletes edges
  (`planar.rs:359`), and merges are **exact**. `FaceMerger` unites faces from the planar map itself, so no
  hairline is left between them (`pathops/src/pathfinder.rs:273`). A proptest checks every piece cuts cleanly
  (`planar.rs:1052`).
- **Shaper tool:** recognises freehand shapes and keeps the original art editable (`engine/src/cmd/shaper.rs`).
  **Live corners** work on any path (`geom/src/corners.rs`).
- **Effect stack:** the model is unchanged (`doc/src/appearance.rs:306`, effects on fill, stroke or object). A
  pixel-filter pipeline was added (Radial/Smart Blur, Unsharp Mask: `effects/src/pixel/`).
- **Blends, Repeat, Envelope, Mesh, Width, Brushes:** essentially unchanged. **Yappy is level or ahead** here
  (Width profiles, Puppet Warp, Gradient Mesh, Transform Effect).

### 3.3 Import: the bulk of the work, mostly not for us

- **Native Affinity import** (`crates/affinity`, AF.1–AF.3): containers v8–12, structure fitted against
  embedded thumbnails across 189 public files; effects and adjustments are named in warnings, never dropped
  silently. It has fuzz targets and a corpus test.
- **Illustrator editing data** (`eps/src/import/ai/`): layers, text, transparency from `.ai` private data.
- **PDF import** rebuilds wrapped text as area type (`pdf/src/import_lines.rs`); **SVG import** gained layers,
  clipped layers and `data-*`.
- **A lossy-overwrite guard:** if an import dropped anything, Save/Export ask before overwriting the original
  (`engine/src/cmd/fileio/load.rs:286,408`; test `engine/tests/lossy_overwrite.rs`).
- **Legal footing is mixed.** The project says no Adobe spec was used, yet `eps/src/import/mod.rs:17-19` cites the AI
  File Format Spec 7.0. That's one more reason to leave AI and Affinity import alone (§6).

### 3.4 Tracing

- **Flat Logo mode** (`trace/src/logo/`): reads each pixel as a blend of the logo's flat colours, places
  outlines to a fraction of a pixel, restores corners, and snaps runs to exact lines and arcs. It refuses
  photos (`trace/src/lib.rs:57`).
- **Create Strokes:** centre-line tracing via a chamfer distance transform + Zhang–Suen thinning
  (`trace/src/centerline.rs`).

### 3.5 Architecture, testing, process

- **Undo groups:** a scrubbed numeric field or a drag is one undo step, and Escape drops it from the journal
  too (`engine/src/lib.rs:1329-1366`, `ui-egui/src/scrub.rs`).
- **MCP M1** (`crates/mcp/src/tools.rs:83-122`): `command_list`, `command_run`, `command_batch`,
  `doc_inspect`, `render_preview`, `ui_screenshot`, a `vectorcraft://commands` resource, and unknown argument
  keys rejected with -32602. **`command_batch` is not atomic** (each step is its own undo step). Yappy's
  `Yappy.command(label, fn)` already gives us atomic batches.
- **Testing:**
  - The command sweep now also runs with **junk params**.
  - Import fuzzing grew (+688 lines).
  - The **model-based undo** test is unchanged (`engine/tests/model_based.rs`): random command sequences,
    invariants every step, undo-all = start, redo-all = end, journal replay = same document. Minimal
    reproductions it finds live in `known_bugs.rs`, `#[ignore]`d.
  - There is still no per-PR CI, and `AGENTS.md:20` names a `cargo xtask cleanroom` step that doesn't exist.
- **i18n:** TSV catalogs, with ratchet tests that every status and *error* message is translated (scanned
  from 12 crates), plus "reads as" spot checks per language. Ours checks UI strings only.

---

## 4. Print, head to head

| | VectorCraft | Yappy v0.8.279 | Verdict |
|---|---|---|---|
| Vector PDF, live text, subset fonts | krilla; respects font **fsType** (outlines when embedding is forbidden) | svg2pdf.js + jsPDF; subset TTF (WOFF unwrapped) | Take fsType handling |
| Colour engine | moxcms; **no bundled ICC**, its own parametric "SWOP-like" press model sampled into a LUT profile | lcms + real CC0 FOGRA39/GRACoL | Yappy's profiles are real characterisations |
| Black | greys → K is an *option* (`engine/src/cmd/colormgmt.rs:237-299`) | exact `#000000` → K only | Add their wider greys→K option |
| Spot colours | Separation; **Lab** alternates; Registration as `/All`; single-ink spot gradients | Separation, CMYK alternate; spot text/gradients fall back to CMYK | Take Lab/`/All`/spot gradients |
| **Overprint** | per fill/stroke, Overprint Black, `/OP /op /OPM 1`, Multiply preview | **none** | **Gap** |
| Separations preview | per plate, spots included | none (we verified plates with Ghostscript only) | **Gap** |
| Ink limit | TAC 300% inside the generic model only | none | Neither has a user check |
| PDF/X | X-1a, X-3, X-4; **groups blend in CMYK** (`pdf/src/export.rs:324`); **verify pass** refuses non-conforming output (`pdf/src/pdfx.rs:199-224`) | X-4 only; no group `/CS`; no self-check | **Take both now** |
| Soft proof | 17³ LUT, paper simulation, colour-blindness | 33³ LUT on the GPU | Yappy's is finer; paper/CVD are nice extras |
| Printer's marks, print dialog | trim, registration, colour bars, page info; tiling, negative, emulsion | bleed only | Later |
| Native document in export | in PDF and SVG (`pdf/src/editing.rs`, `svg/src/export.rs:623`) | none | Still review 1's #7 |
| External validator | none (no veraPDF/Ghostscript/qpdf) | none (Poppler + Ghostscript checks by hand) | Same blind spot |

Neither project has run a real PDF/X preflight. The difference is that VectorCraft refuses to write a file its own
checks reject, while we document the gaps.

---

## 5. Recommended picks, with what to read

1. **Harden PDF/X-4 (~1 day).** In `utils/pdf-x.ts`, rewrite every transparency group's `/CS` to DeviceCMYK,
   but keep luminosity soft-mask groups RGB, because mask luminance is screen luminance. Then add `verifyPdfX4()`
   over the written file: every font has a `FontFile*`, no `/DeviceRGB` outside mask groups, `OutputIntents`
   present, a TrimBox on every page, and XMP and Info agreeing. Export fails loudly if the check fails.
   Read `pdf/src/export.rs:324-386`, `pdf/src/pdfx.rs:199-224`, `pdf/src/tests_pdfx.rs`.
   *This should happen before Rajesh's preflight, not after.*
2. **Model-based undo + junk-params sweep (~2 days).** Use fast-check over `Yappy.commands`: random sequences,
   invariants after each step, undo-all/redo-all round-trips, and a `known-bugs` spec for minimal reproductions.
   Add junk params to `tests/command-sweep.spec.ts`. Read `engine/tests/model_based.rs`,
   `testkit/src/{strategies,invariants}.rs`, `engine/tests/command_sweep.rs`, `engine/tests/known_bugs.rs`.
3. **Overprint (~4–5 days).**
   - An `overprint` flag per fill/stroke and an Overprint Black command.
   - An ExtGState with `/OP /op /OPM 1`, written by the colour wrapper the same way spot colours are.
   - Overprint preview (Multiply in the print-preview pass) and a separations view, whose plate math we already
     have.
   Read `doc/src/overprint.rs`, `pdf/src/forms.rs`, `render/src/proof.rs`, `engine/src/cmd/overprint.rs`.
4. **Effect stack (~2 weeks).** The first review's #4, unchanged and still the biggest parity gap. Replace the
   feather/glow/shadow fields with `{id, params, visible}[]` on the element and on each appearance fill/stroke,
   and migrate old files. Read `doc/src/appearance.rs:300-620`, `effects/src/lib.rs:165-560`,
   `effects/src/raster.rs`.
5. **Flat Logo + centre-line trace (~1 week).** Port the algorithms to TypeScript (MIT OR Apache-2.0, with
   attribution per review 1 §12). Read `trace/src/logo/*.rs`, `trace/src/centerline.rs`.

**Small and cheap, any time:**
- A wider "greys → K" export option.
- fsType-aware font embedding.
- Lab spot alternates, Registration `/All`, and single-ink spot gradients as Separation shadings.
- Undo groups for scrubbing a number field.
- A lossy-overwrite guard when we gain lossy imports.
- An i18n ratchet for error and toast messages.

**Still open from review 1:** pathops WASM (#1, which now also brings the Shape Builder face-merge idea), the
native document in exports (#7), the live MCP bridge (#8; their M1 tool list is the reference, and our
transactions make batches atomic), and Begin/Preview/Commit (#3).

---

## 6. Not worth taking

- **Affinity and Illustrator import:** high effort, reverse-engineered formats, and an internally inconsistent
  account of where the AI knowledge came from. Yappy has no import requests that need them.
- **Their parametric "generic CMYK" model in place of ICC profiles:** clever, but real CC0 characterisations
  are better ground truth for a press.
- **Type composition** (mojikumi, vertical type, bidi): impressive, not where Yappy's users are.
- **Their CI/process as a model:** no per-PR CI, and a documented `cleanroom` CI step that doesn't exist.
  Yappy's "no documented command runs it = nobody runs it" rule (CLAUDE.md) already covers this lesson.

---

## 7. Caveats

- This pass read code; it did not build or run VectorCraft (the first review did). Performance and
  correctness claims are VectorCraft's own, as written in its code and docs.
- The parts §5 relies on were checked by hand against the source: `export.rs:324` (CMYK blending), `overprint.rs`,
  `engine/tests/model_based.rs`, `trace/src/logo/mod.rs`, and the TAC model in `cms/generic.rs`. Other citations
  come from the read-only passes and weren't individually re-verified.
- Licensing is as in review 1 §12: MIT OR Apache-2.0. Port with a header naming the source file, and never copy
  anything from `docs/brand/`.
