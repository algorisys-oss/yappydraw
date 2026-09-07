# Spec — a connector must leave a box perpendicular to the edge it is anchored to

**Status:** C1 and C2 shipped in v0.8.166 · **Severity:** medium-high (15% of edge-anchored
endpoints, 33 of 101 diagrams)
**Area:** `frontend/src/utils/connector-geometry.ts` (`defaultControlPoints`) · plus one
independent label bug in `frontend/src/utils/export.ts`

> **Verification note (2026-07-31).** Both defects reproduced from the source and the corpus
> before the fix, and the corpus was re-rendered afterwards to confirm the result — the
> "parallel to its edge" count went **97 → 0**, worst residual 0.1°. One caveat on the audit
> method is recorded in §2. Corrections and additions from that pass are marked **[R]**.

Follow-up to `arrowhead-orientation-spec.md`. That fix landed and holds — every arrowhead now
sits within 0.12° of its curve's true tangent across all 101 katas diagrams. These are the
defects it *revealed*: the heads are now faithful to curves that themselves leave in the wrong
direction.

---

## 1. Symptom

An arrowhead lies **flat against the box edge it terminates on**, pointing sideways along the
edge instead of standing on it. The curve hugs the box for its first stretch, sometimes sliding
past a corner so the glyph appears to float in open space beside the node.

Reported from three katas diagrams, independently:

- **Abstract Factory** — the `Button ▷—— MacButton` realization triangle sits beside `Button`'s
  bottom-left corner pointing due east, while its sibling `Button ▷—— WinButton` is correct.
- **Decorator** — the `Decorator ◇—— Component` aggregation diamond floats above `Decorator`'s
  top-right corner, rotated flat.
- **Actor** — `Sender B -> Mailbox` arrives at `Mailbox`'s top edge pointing west, laid along
  the edge rather than into it.

## 2. Evidence

Measured off the exported SVGs. `startOut` / `endIn` are the outward tangents; the anchor edge
is derived from which box boundary the endpoint lies on.

| diagram · edge | endpoint | on edge | tangent | wanted |
|---|---|---|---|---|
| abstract-factory · `button --> macbtn` | (616.5, 220) | Button **bottom** | `0.0°` (east) | `+90°` |
| decorator · `decorator -> component` | (400.2, 370) | Decorator **top** | `0.0°` (east) | `−90°` |
| decorator · same, far end | (232.0, 220) | Component **bottom** | `180.0°` (west) | `+90°` |
| actor · `s2 -> mailbox` | (403.9, 220) | Sender B **bottom** | `0.0°` (east) | `+90°` |
| actor · same, far end | (221.7, 345) | Mailbox **top** | `180.0°` (west) | `−90°` |

Corpus-wide, over all 101 exported diagrams:

```
curve endpoints anchored on a box edge:                      653
  … leaving/arriving PARALLEL to that edge:                   98  (15%)
files affected:                                               33 / 101
```

Worst offenders: `concurrency/06-fan-out-fan-in` (7), `ai/15-semantic-caching` (5),
`ai/11-router`, `anti-patterns/01-god-object`, `concurrency/01-worker-pool` (4 each).

**[R] Reproduced at 653 / 97 / 33** — one endpoint short of the 98 above, which is within the
tolerance of how "on an edge" is decided. Every single failure measured **exactly 90.0°** off
its edge normal, confirming the mechanism precisely: these are not near-misses but departures
laid flat along the edge.

**[R] Audit caveat, worth recording for the next run.** These diagrams are drawn in the sketch
style, so rough.js emits **two jittered strokes per connector** and a naive scan of every
`<path>` cubic over-counts badly — 1697 "anchored endpoints", 21% bad, with nonsense tangents
like −43.8° that no rule in the codebase can produce. The default-control-point rule can only
ever emit an exactly axis-aligned departure, so filtering to tangents within 0.5° of
`0/±90/180` discards the jitter and recovers the real population. That filter is what turns
1697/354 into 653/97. Any re-run of this audit needs it.

## 3. Root cause

`connector-geometry.ts:158`:

```ts
export function defaultControlPoints(start: Pt, end: Pt, width: number, height: number): [Pt, Pt] {
    return Math.abs(width) > Math.abs(height)
        ? [{ x: start.x + width / 2, y: start.y }, { x: end.x - width / 2, y: end.y }]
        : [{ x: start.x, y: start.y + height / 2 }, { x: end.x, y: end.y - height / 2 }];
}
```

The departure axis comes from the **chord's dominant axis** — a property of the two boxes'
relative position. It ignores **which edge of each box the endpoint is actually anchored to**,
which is what determines the only sensible departure direction.

The two agree most of the time, which is why this went unnoticed: a `tree-down` layout usually
anchors on top/bottom edges *and* is vertically dominant. They diverge exactly when a node is
far enough sideways that `|dx| > |dy|` while the anchor is still on a horizontal edge — the
cross-hierarchy edges (`Button → MacButton` spans the full width of the diagram: dx = −507,
dy = +442). Then the curve leaves a bottom edge heading sideways.

The arrowhead is not wrong here. It faithfully follows a curve that leaves in a direction no
box connector should.

## 4. Required change

**C1 — derive the departure axis from the anchor's edge normal.**

The information is already on the element: `api.connect()` writes
`startBinding`/`endBinding` with `anchorFractionX` / `anchorFractionY`
(`api.ts:2117-2118`), so the edge each endpoint sits on is recoverable — `anchorFractionY === 0`
is the top edge, `=== 1` the bottom, `anchorFractionX === 0` / `=== 1` the left / right.
Equivalently it can be inferred from the endpoint's position against the bound node's bounding
box.

Rule, per endpoint independently (the two ends need not share an axis):

| anchor edge | departure direction | control point |
|---|---|---|
| top | up (`−90°`) | `{ x: p.x, y: p.y − k }` |
| bottom | down (`+90°`) | `{ x: p.x, y: p.y + k }` |
| left | left (`180°`) | `{ x: p.x − k, y: p.y }` |
| right | right (`0°`) | `{ x: p.x + k, y: p.y }` |

with `k` the current half-dominant-axis magnitude (keeps existing curves' shape where the axis
was already right, so the 85% that look correct today stay byte-identical). Corner anchors
(both fractions at 0 or 1) and unbound connectors fall back to today's dominant-axis rule.

Because `connectorGeometry` is now the single derivation, canvas and export both inherit this.

**[R] As shipped.** Implemented exactly as specified, via an exported `anchorEdge(binding)`
that reads `anchorFractionX/Y`. Two clarifications the implementation had to settle:

- **Non-box shapes also fall back.** `intersect()` returns an *ellipse* point for circles,
  stars, hexagons and a slope point for diamonds, so their anchor fractions land at neither 0
  nor 1 and no edge is claimed. Those connectors keep the chord rule. Giving a circle a radial
  normal is the obvious follow-up but is not this fix.
- **Magnitude uses `|w|` / `|h|`.** Taking the direction from the normal and the magnitude as a
  *signed* half-axis would have flipped the very cases the fix targets. Using the absolute
  value is what makes the already-correct cases bit-identical — verified by a unit test
  asserting `cp1`, `cp2` and `d` are unchanged for the vertically-dominant stacked case.

**C2 (independent) — connector labels must not wrap to the connector's bounding-box width.**

`export.ts:1145` runs a connector's `containerText` through
`wrapText(measureRenderer, para, maxWidth)` where `maxWidth` comes from `el.width`. For a
connector, `el.width` is the chord's `dx` — zero for a vertical edge. So `actor`'s
`mailbox -> actor "one at a time"` exports as four stacked single-word lines at
`(190, 477) … (190, 578)`, dropped straight down the connector and over the line itself:

```
  (190.0, 477.1)  'one'
  (190.0, 510.7)  'at'
  (190.0, 544.3)  'a'
  (190.0, 577.9)  'time'
```

The canvas renderer does not do this — `connector-renderer.ts:165` splits on `\n` and never
wraps. Another export-only divergence of the same family as the arrowhead bug. Export should
match: a connector label wraps only on explicit newlines, and its background box is centred on
the path midpoint.

**[R] As shipped.** Connector labels (`line` / `arrow` / `bezier`) now render with no wrap
width, and three further divergences from the canvas surfaced while fixing it:

- **The label anchor was the bounding-box centre, not the path midpoint.** These coincide for a
  default-control-point curve — which is why only the wrapping was visible — but diverge for any
  connector with authored control points. `ConnectorGeometry` gained a `mid` field computing the
  path midpoint the way the canvas always has (cubic at `t = 0.5`; arc-length midpoint for a
  connected elbow; bounding-box centre for a standalone polyline).
- **`textAlign: left/right` was being honoured**, offsetting the label by `el.x + 10` /
  `el.x + el.width - 10` — the chord's corner and `dx`, which describe no text box. The canvas
  hard-codes centre for connector labels; export now does too.
- **That label block was a seventh copy of the control-point derivation.** It is now the
  helper's, closing the last one in `connector-renderer.ts`.

## 5. Acceptance criteria

1. ✅ Every curve endpoint bound to a node leaves/arrives within 0.5° of that edge's outward
   normal. **Corpus re-rendered: 660 edge-anchored endpoints, "parallel to its edge" count
   97 → 0, worst residual 0.1°.**
2. ✅ Endpoints where the dominant-axis rule already matched the edge normal produce
   byte-identical output — asserted on `cp1`, `cp2` and the emitted `d`.
3. ✅ Unbound connectors and corner anchors are unchanged. **[R]** Extended to non-box shapes
   (circle/diamond/star/hexagon), whose anchors are not on an edge at all.
4. ✅ A multi-word connector label exports as one line; a label containing `\n` exports as one
   line per paragraph.
5. ✅ **[R] Added:** the v0.8.165 arrowhead fix must not regress — re-audited on the same
   re-rendered corpus at **74/74 glyphs within 0.5°, max 0.0°**.

## 6. Tests — **as shipped**

- **Unit** (`connector-geometry.test.ts`, +9 cases, 23 total): the four anchor edges × eight
  chord quadrants asserting the departure equals the edge normal regardless of which axis
  dominates; the reported Button → MacButton case (dx −507, dy +442 off a bottom edge); the
  byte-identical control; independent edges at the two ends; and the fallbacks — unbound,
  corner, non-box, and a binding with no anchor fractions at all.
- **E2E** (`tests/connector-anchor-direction.spec.ts`, 5 cases): builds wide, short boxes offset
  mostly sideways — so the endpoints still clip to horizontal edges while the chord is
  horizontally dominant, which is precisely the divergent case — exports, and checks the
  departure, the arrival and the arrowhead against the edge normals read off the real box
  rects. Plus the two label cases. **Four of the five fail on the pre-fix tree; the fifth is
  the "unchanged" control, which correctly passes both before and after.**
- **Corpus**: all 101 diagrams re-rendered through `npm run render:dsl` and re-audited. See §5.
  Mind the rough.js filter described in §2.
