# Spec — arrowheads must follow the connector's tangent, not its chord

**Status:** C1/C2/C3 shipped in v0.8.165 · C4 decided (option **a**, no change) · **Severity:** high
**Area:** SVG export (`frontend/src/utils/export.ts`) **and** the architectural canvas renderer
(`frontend/src/shapes/renderers/connector-renderer.ts`)

Found while auditing the 101 structure diagrams generated for the *design-patterns katas*
(`~/lab/katas/design-patterns/content/**/diagrams/**/structure.svg`), rendered headlessly via
`window.Yappy.importDSL` → `window.Yappy.exportSVG(false)`.

> **Review note (2026-07-31).** The root cause in §3 was re-verified against the source and the
> §2 evidence table reproduces exactly. Two claims did not survive review and have been
> corrected in place: the bug is **not** export-only (§1, §4 — the architectural canvas renderer
> is worse), and the aggregate counts in §2 were mislabelled. Acceptance criteria 3 and 5 were
> also unsound; see §6. Corrections are marked **[R]**.

---

## 1. Symptom

In exported SVG, UML arrowheads (hollow triangle, hollow/filled diamond) and open-V arrowheads
are **rotated away from the line they terminate**. The tip sits in the right place; the glyph
points the wrong way.

Visually: in a `tree-down` class diagram, the child directly below its parent gets a perfect
arrowhead, and the children to the left and right get heads tilted by up to 45°.

**[R] Not export-only.** The *sketch* canvas renderer is correct, which is what the original
report was checked against. The **architectural** renderer has the same chord bug at the end
head *plus* a ~90° error at the start head (§3.1). Measured on one connector, same geometry,
both styles — truth for this element is start −90°, end +90°:

| | start head | end head |
|---|---|---|
| sketch | −87.7° ✓ | +90.6° ✓ |
| **architectural** | **−14.6°** (glyph is at 0°, due east) | **+106°** (the chord, ≈109°) |

## 2. Evidence

From the committed `content/behavioral/diagrams/09-strategy/structure.svg` — four cubic
connectors, comparing the chord angle (what export uses) against the true tangent at the
endpoint (`atan2(end − cp2)`):

```
end=(218,426)  chord= 90.0°  true_tangent= 90.0°  delta=  0.0°
end=( 31,696)  chord=131.5°  true_tangent= 90.0°  delta= 41.5°
end=(218,696)  chord= 90.0°  true_tangent= 90.0°  delta=  0.0°
end=(404,696)  chord= 48.5°  true_tangent= 90.0°  delta=-41.5°
```

That table reproduces exactly on re-measurement. Error is 0° when the two boxes are exactly
stacked and maximal when the horizontal and vertical offsets are equal.

**[R] Corrected aggregates.** The original text read *"70 files have at least one arrowhead
off by >5°, worst-case-per-file median ≈ 31°"*. Re-measured across the same 101 files, "70"
is the number of arrowhead **glyphs**, not files:

| | |
|---|---|
| cubic connectors examined | 1360 |
| files containing a cubic whose chord ≠ tangent | 99 / 101 |
| UML arrowhead glyphs found | 70, spread over 22 files |
| median per-file worst delta (files with a glyph) | 22.5° |
| maximum delta | 45.0° |

Caveat on the corrected numbers: open-V arrowheads export as rough.js line *pairs*, not
`<polygon>`, so a glyph scan cannot see them — the true affected-file count is somewhere
between 22 and 99. The severity is unchanged either way.

## 3. Root cause

`export.ts:804`, inside the `el.type === 'arrow'` branch:

```js
const angle = Math.atan2(el.height, el.width);   // ← bounding-box chord
```

`el.height`/`el.width` describe the straight line from `(el.x, el.y)` to
`(el.x + w, el.y + h)`. But the stroke actually drawn is `connectorCurvePath(el)`
(`export.ts:315-340`), a cubic whose default control points are **axis-aligned along the
dominant axis**:

```js
const [cp1, cp2] = Math.abs(w) > Math.abs(h)
    ? [{ x: start.x + w / 2, y: start.y }, { x: end.x - w / 2, y: end.y }]
    : [{ x: start.x, y: start.y + h / 2 }, { x: end.x, y: end.y - h / 2 }];
```

So the true tangent at each endpoint is exactly horizontal or vertical, while the head is
rotated to the diagonal. The two are only equal when the connector is straight or perfectly
axis-aligned.

Why it hits everything: `dsl-engine.ts:339` (`curveType: edge.curveType ?? 'bezier'`) and
`api.ts:2048` (`options?.curveType ?? 'bezier'`) both default connectors to bezier, and
`connect()` never sets `controlPoints` — verified: the identifier does not appear in
`api.ts` at all — so every DSL-generated edge takes the default-cp branch above.

### 3.1 [R] Second site — the architectural canvas renderer

`connector-renderer.ts`, in `renderArchitectural`:

```js
const cp1 = el.controlPoints?.[0] || { x: start.x, y: start.y };
const cp2 = el.controlPoints?.[1] || cp1;
```

Alone among the six copies of this derivation, this one has **no default-control-point
fallback**. Given the paragraph above — no authored `controlPoints`, ever, on a DSL or API
edge — it collapses to `cp1 = cp2 = start`, so:

- `startAngle = atan2(0, 0)` = **0** — the start head points due east, a ~90° error. `atan2`
  of the zero vector is 0, not an error, so nothing complains.
- `endAngle` = the chord — the identical bug to export.

## 4. What is already correct (do not "fix")

- **Sketch canvas rendering.** `renderBezier` derives the angle from `cp1`/`cp2` correctly,
  including the default-cp fallback. **[R] The architectural renderer does not** — see §3.1.
  The original claim that this bug was export-only was checked against sketch only.
- **Tip positions.** Export places the tips at `(el.x, el.y)` and `(el.x + w, el.y + h)`, which
  match the path's `M` and final point. Only rotation is wrong.
- **Glyph construction.** `umlArrowheadGlyph()` (`export.ts:290-307`) builds the polygon in a
  local frame and rotates by `ang` — correct given a correct `ang`.
- **Angle convention.** Both `drawArrowhead()` and `umlArrowheadGlyph()` take an *outward*
  angle: the direction the tip faces. Start heads therefore want the tangent pointing back out
  of the start (`atan2(start − cp1)`), end heads the tangent pointing out of the end
  (`atan2(end − cp2)`). Existing call sites already follow this; keep it.
- **`curveType` from the text DSL.** `text-parser.ts:249-254` already hoists `curveType` out of
  an edge's inline `{ }` block onto `edge.curveType`, so `a -> b { curveType: straight }` works
  today. No change needed for authors who want straight UML lines.

## 5. Required changes

### C1 (P0) — one shared geometry helper, used by both canvas and export — **SHIPPED v0.8.165**

New module `frontend/src/utils/connector-geometry.ts`:

```ts
export interface ConnectorGeometry {
    start: { x: number; y: number };   // tip position for the start arrowhead
    end:   { x: number; y: number };   // tip position for the end arrowhead
    startAngle: number;                // rad, outward (pointing back out of the start)
    endAngle:   number;                // rad, outward (direction of travel at the end)
    d: string | null;                  // SVG path data; null ⇒ straight, caller draws a line
}

export function connectorGeometry(el: DrawingElement): ConnectorGeometry;
```

Rules, mirroring what the canvas does today:

**Endpoints** — if `normalizePoints(el.points).length >= 2`, use the first and last point offset
by `el.x`/`el.y`; otherwise `(el.x, el.y)` and `(el.x + el.width, el.y + el.height)`.

**`curveType === 'straight'`** — `d = null`; `endAngle = atan2(end − start)`;
`startAngle = endAngle + π`.

**`curveType === 'bezier'`**

| control points | path | `startAngle` | `endAngle` |
|---|---|---|---|
| ≥ 2 | `C cp1, cp2, end` | `atan2(start − cp1)` | `atan2(end − cp2)` |
| 1 | `Q cp1, end` | `atan2(start − cp1)` | `atan2(end − cp1)` |
| 0 | `C` with the dominant-axis default cps | `atan2(start − cp1)` | `atan2(end − cp2)` |

**`curveType === 'elbow'`** — if there are ≥ 2 distinct points, build the polyline from them and
take the angles from the first and last *non-degenerate* segment (dedupe consecutive points
within 0.1px, as `renderElbow` already does at `connector-renderer.ts:353-355`). Otherwise
synthesise the mid-jog exactly as `connectorCurvePath` does today and take the angles from its
first and last segment — both are axis-aligned.

**Degenerate guard** — if a control point coincides with its endpoint (distance < 1e-6),
`atan2(0, 0)` returns 0 and the head points due east.

> **[R] Shipped as a walk, not a straight fall-back to the chord.** For a cubic whose `cp1`
> sits on the start, the true tangent is toward `cp2` — the chord is merely the *last*
> resort. `outwardAngle(tip, candidates)` therefore steps along the control polygon
> (`[cp1, cp2, end]` at the start, `[cp2, cp1, start]` at the end) and takes the first
> candidate more than 1e-6 away, falling back to 0 only for a genuinely zero-length
> connector. This is what makes §3.1 safe as well.

**[R] As shipped**, `ConnectorGeometry` also carries `cp1`/`cp2`/`quadratic` and the deduped
elbow `points`, so `definePath` can stroke from the very same control points the angles were
derived from rather than recomputing them.

Then:

- `export.ts` — `connectorCurvePath` deleted; the arrow branch takes `geom.d`,
  `geom.start`/`geom.end` and `geom.startAngle`/`geom.endAngle`, feeding both the UML-glyph
  and open-V branches. The `+ π` on the start head is gone, since `startAngle` is already
  outward.
- `connector-renderer.ts` — `renderBezier`, `renderElbow`, `renderStraight`,
  `renderArchitectural` **and `definePath`** now call the helper. This is the point of the
  change: canvas/export parity becomes structural instead of a convention six call sites have
  to independently honour.
- `normalizePoints` moved to a new leaf module `utils/points.ts` (re-exported from
  `render-element`) so the helper is importable — and unit-testable — without dragging in the
  shape registry and roughjs.

**[R] Not converted:** `renderFlow` and `estimatePathLength` still carry their own copies.
Both are correct today and neither touches arrowheads, so they were left out of the blast
radius; they are the obvious next adopters.

### C2 (P0, folded into C1) — export must honour `el.points`

`connectorCurvePath` ignores `el.points` and always spans the bounding box. Today
`api.connect()` writes `points: [0, 0, dx, dy]`, so the two agree — but a user who drags a bound
connector's midpoint gets an exported path that ignores the reroute. The helper's endpoint rule
above closes this.

### C3 (P1) — elbow paths in export

`connectorCurvePath`'s elbow branch (`export.ts:320-326`) synthesises a 3-segment jog and, like
C2, ignores real waypoints. Once the helper owns path construction this is one code path.

### C4 (P2, decision needed) — the bezier default

`->` and `--` leave `curveType` undefined, and both `dsl-engine.ts:339` and `api.ts:2048` default
to `'bezier'`. For UML/tree diagrams a straight line is the conventional and expected form, and
`~>` already exists to ask for a curve explicitly. Options:

- **(a)** leave the default, document it, rely on `{ curveType: straight }` — zero breakage;
- **(b)** map `->`/`--` to `curveType: 'straight'` in `text-parser.ts:44-55` and
  `ysl/interpreter.ts:27-31` — changes the look of existing diagrams that relied on the default.

Recommendation: **(a)**. C1 makes the curved rendering correct, so this becomes a taste call
rather than a bug, and (b) silently restyles saved work.

## 6. Acceptance criteria

1. ✅ For every connector, the exported arrowhead's axis of symmetry is within **0.5°** of the
   drawn path's tangent at that endpoint, for all three `curveType`s and for both start and end
   heads. *Measured max delta on the shipped build: **0.000°**.*
2. ✅ Re-exporting `content/behavioral/diagrams/09-strategy/structure.ysl` yields the four
   deltas above as `0.0°`. (The 41.5° case is pinned as a unit test.)
3. ✅ **[R] Reworded.** Was *"canvas and export produce the same angles"* — which a broken
   renderer satisfies just as well as a correct one, and would have been *satisfied by the
   pre-fix architectural renderer if export had been made to match it*. It now reads: canvas
   and export must each match the drawn path's tangent, and therefore each other.
4. ✅ Straight connectors are unchanged. **[R]** "Pixel-identical export" is not directly
   assertable — rough.js strokes even a plain line as sketchy cubics seeded per render — so
   this is asserted as: the head of a straight connector follows the chord, which for a
   straight connector *is* the tangent.
5. ⚠️ **[R] Descoped to bezier and elbow.** A `straight` connector returns `d = null` and the
   caller draws a chord through the first and last point only — on canvas as well as in
   export. Making straight-with-waypoints emit a polyline would change what `renderStraight`
   has always drawn, and directly contradicts criterion 4. Bezier and elbow honour
   `el.points`, which is what C2 was actually about.

## 7. Tests — **as shipped**

- **Unit** — `frontend/src/utils/connector-geometry.test.ts` (`bun:test`), 14 cases: the
  curveType × control-point-count × quadrant table; the vertical- and horizontal-dominant
  default-cp cases asserting exactly ±90°/0°/180° *regardless of the off-axis offset* (five
  offsets each, which is the property the chord violated); the 41.5° regression case from §2;
  quadratic vs cubic; elbow waypoints and duplicate-waypoint collapse; and three degenerate
  cases — `cp1 === start` walking to `cp2`, both cps collapsed falling back to the chord, and
  a zero-length connector returning a finite angle rather than `NaN`.
- **Golden render** — `tests/arrowhead-orientation.spec.ts` (Playwright), 4 cases. Builds the
  tree-down shape the bug was worst on, exports SVG, then parses every `<polygon>` and the
  cubic it terminates and compares the glyph's own axis of symmetry against the curve's
  tangent — criterion 1 asserted numerically rather than by image diff, exactly as proposed.
  Also covers criteria 3 and 4.
- **Not automated** — the sketch-vs-architectural canvas comparison that found §3.1 was done
  by measuring the ink centroid around each tip in a headless canvas. It is reproducible but
  noisy (±1.5°, because the connector stroke shares the annulus with the glyph), so the
  committed guard for §3.1 is the unit table instead.

## 8. Out of scope

Layout quality (edge crossings, the S-curve on cross-hierarchy edges), arrowhead sizing, and
the stale yappy path baked into the katas' `scripts/render-diagrams.mjs`.
