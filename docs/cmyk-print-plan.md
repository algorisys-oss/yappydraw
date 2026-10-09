# CMYK, spot colour & PDF/X — plan

Status: **approved** (2026-10-09, Rajesh). P1–P6 done 2026-10-09; P5 awaits a real preflight. Branch: `feat/vector-pdf-export` (builds on the vector PDF).
Affinity-parity item; decisions D1–D3 below were made by Rajesh on 2026-10-09.

## Decisions

| | Decision | Consequence |
|---|---|---|
| D1 | **ICC colour management** (press-accurate), not a formula | `lcms-wasm` (MIT, 316 kB WASM + 41 kB JS) + bundled CMYK profiles, lazy-loaded only when CMYK is used |
| D2 | **Images converted to CMYK** | every bitmap in a CMYK PDF is re-encoded as 4-channel DeviceCMYK (+ SMask for alpha) |
| D3 | **Spot colours and PDF/X-4 in this round** | Separation colour spaces and an OutputIntent written into the PDF by hand (jsPDF has no API for either) |

## Facts established (2026-10-09)

- **Profiles we can ship.** colord's `FOGRA39L_coated.icc` (Europe / ISO Coated, 122 kB) is
  **CC0-1.0**; `GRACoL_TR006_coated.icc` (US, 121 kB) is CC0 + NPES terms (redistributable; the
  CGATS TR006 data must be credited). Source: colord `data/profiles/`, Debian copyright file.
  The ECI, Adobe and IDEAlliance originals are *not* redistributable without permission.
  FOGRA39 and GRACoL (CGATS TR006) are registered ICC characterisations, which is what a PDF/X
  OutputIntent's `OutputConditionIdentifier` names.
- **svg2pdf.js sets every vector colour through `pdf.setFillColor/setDrawColor/setTextColor(r,g,b)`**,
  per instance — interceptable. jsPDF's own 4-argument forms emit DeviceCMYK (`k`/`K`).
- **jsPDF gradients are hard-wired to RGB**: `putShadingPattern` writes `/ColorSpace /DeviceRGB`
  and `interpolateAndEncodeRGBStream` encodes 3 components. CMYK gradients need their own
  shading objects — the riskiest piece (P3).
- **jsPDF hooks available**: events `putCatalog`, `putResources`, `postPutResources`, `putPage`,
  `putInfo`; `__private__.setPdfVersion`. Enough for OutputIntents, an ICC stream, XMP, PDF 1.6.

## Data model

- `Swatch` gains `cmyk?: [c, m, y, k]` (0–100). When set it is the **source of truth** for print;
  the swatch's hex is derived from it through the profile (CMYK→sRGB) so the screen shows what
  will print.
- `Swatch` gains `spot?: { name: string }` — a named spot ink (e.g. "PANTONE 186 C"). Its `cmyk`
  is the required alternate (what a CMYK-only device prints).
- Document `printSettings?: { profile: 'fogra39' | 'gracol'; bleed?: number }`. Default FOGRA39.
- Format: additive optional fields, no version bump; `docs/yappy-format-spec.md` updated; api.ts
  setters.

Element colours are hex strings; the link to a swatch is `fillSwatchId` / `strokeSwatchId`
(already exists). Export maps an element colour to its swatch's exact CMYK / spot **by swatch
link first, hex match second**, then ICC conversion.

## Phases

### P1 — Colour engine (`utils/color-management.ts`) — ✅ done 2026-10-09
Lazy `lcms-wasm` + profile load; transforms sRGB→CMYK (relative colorimetric + black-point
compensation, the print default), CMYK→sRGB, and a soft-proof sRGB→CMYK→sRGB. Batch API for
pixel buffers. `lcms.wasm` via Vite `?url`; precache excluded like the outline fonts.
Tests: known reference conversions (paper white, 100 K, primaries) within ΔE tolerance, using
the same lcms build under bun.
*Note:* `lcms-wasm` lists `tape` as a runtime dependency — harmless, but check it doesn't leak
into the published OSS bundle.

### P2 — CMYK swatches & picker — ✅ done 2026-10-09
CMYK sliders in the colour picker / swatch editor (C M Y K 0–100, with the converted on-screen
swatch), `cmyk` + `spot` on swatches, spot-name field, out-of-gamut warning when an RGB colour
moves noticeably on conversion. Help doc + api.ts (`setSwatchCmyk`, `addSpotSwatch`).
*Shipped as:* a per-swatch print editor in the Swatches panel (`components/swatch-print-editor.tsx`),
API `setSwatchCmyk` / `setSwatchSpot`. **Decision:** exact inks live on swatches only, not in the
general colour picker — an unlinked element colour is RGB and is separated through the profile
anyway, and global colours are how Affinity/InDesign carry print inks too.

### P3 — CMYK vector PDF — ✅ done 2026-10-09
Export dialog: **Colour: RGB | CMYK (print)** under Vector. Intercept the three colour setters
on the jsPDF instance → swatch-exact or ICC-converted CMYK. Gradients: own Type 2/3 shading
objects with a CMYK sample function (replacing jsPDF's RGB ones — via hooks if possible,
otherwise a post-pass that rewrites the shading dictionaries and rebuilds the xref).
Images (D2): intercept `addImage`, decode → RGBA → lcms → raw DeviceCMYK + SMask.
Text colour goes through `setTextColor` like the rest.
*Shipped as:* gradients via the post-pass (`utils/pdf-rewrite` `PdfFile` + `convertShadingsToCmyk`),
images via a registered `jsPDF.API.processYDCMYK` processor; `Yappy.setSwatchCmyk` landed early
(P2's data side) because the exact-swatch path needed it.

### P4 — Spot colours — ✅ done 2026-10-09
`/Separation /<name> /DeviceCMYK <tint transform>` colour-space resources (one per spot used),
selected with `cs`/`scn` operators written in place of the intercepted CMYK operator. Tint
transform = Type 2 exponential function from 0 to the alternate CMYK. Limit (documented): spot
inside gradients and images falls back to the CMYK alternate.
*Shipped as:* `/YDSpotN cs|CS 1 scn|SCN` written by the colour wrapper; the Separation arrays
(tint transform inline, Type 2) added to every jsPDF resource dictionary in the post-pass. Text
in a spot colour also uses the alternate — jsPDF writes text colour inside the text object, with
no seam. Verified with Ghostscript `tiffsep`: a `PANTONE 186 C` plate carrying the spot fill and
outline, absent from the process plates.

### P5 — PDF/X-4 — ✅ done 2026-10-09 (structure; preflight pending)
PDF 1.6 header; `OutputIntents` with `/S /GTS_PDFX`, `OutputConditionIdentifier` (FOGRA39 /
CGATS TR 006), `RegistryName http://www.color.org`, `DestOutputProfile` = the embedded ICC;
`GTS_PDFXVersion (PDF/X-4)` in Info **and** XMP metadata; `/Trapped /False`; document ID;
`TrimBox` (+ `BleedBox` when bleed is set) on every page. Requires CMYK mode. Fonts: every font
must be embedded, so the Helvetica/Times/Courier substitutes are replaced by bundled
Inter/Merriweather/Source Code Pro in X mode.
Validation: we have no PDF/X validator locally (veraPDF covers PDF/A, not PDF/X). Structural
checks in specs, plus a manual preflight in Acrobat/Affinity before calling it done — this
needs Rajesh or a print shop.
*Shipped as:* `utils/pdf-x.ts` `applyPdfX4` over `PdfFile` (output intent + embedded profile,
XMP + matching Info, TrimBox/BleedBox, PDF 1.6, unused standard fonts removed); X mode embeds a
bundled stand-in instead of a standard font; bleed expands each page region. Poppler reports the
result as ISO 15930 (PDF/X), PDF 1.6, every font embedded. **Not yet done: a real preflight.**
~~Known gaps a preflight may flag: no explicit page transparency-group blending space, and jsPDF's
catalog `/OpenAction`.~~ Both fixed 2026-10-09 (bug #433), with a `verifyPdfX4` self-check that
refuses a non-conforming file. A real preflight is still the final word.

### P6 — Print preview (soft proof) — ✅ done 2026-10-09
View toggle that renders the canvas through the soft-proof transform (cached per colour), so
out-of-gamut RGB brights show how they'll print.
*Shipped differently:* not per colour (that misses images, gradients and effects) but per pixel —
a 33³ sRGB→CMYK→sRGB lookup table (`engine.proofLut`) applied to the finished frame in a WebGL2
shader on an overlay (`utils/print-preview.ts`); the canvas underneath goes transparent but keeps
its pointer events. Command `view-print-preview`, API `setPrintPreview` / `isPrintPreview`.

## Risks

1. **Gradients (P3)** — no jsPDF API; the post-pass touches PDF structure. Fallback: banded
   vector gradients (256 steps) in CMYK mode.
2. **PDF/X conformance (P5)** — easy to get 95 % right and fail preflight on one key. Can't be
   proven here without a validator.
3. **Bundle** — +360 kB WASM/JS and ~120 kB per profile, all lazy; must stay off the cold path
   and out of the PWA precache.
4. **Colour-picker UX (P2)** — CMYK sliders next to the existing RGB/HSV ones without clutter.

## Order

P1 → P3 (CMYK PDF, the first shippable value) → P2 → P4 → P5 → P6. Each phase commits with
tests and docs; P3 is the first point worth a release.
