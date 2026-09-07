# Animation Studio — the five Callipeg picks

Source: a feature review of Callipeg (iPad 2D animation app) against Yappy's frame
timeline, Aug 2026. Callipeg is a **raster** cel app; Yappy's Animation Studio is a
**vector** cel app with Flash-style tweening, so only the timing/flipping workflow
transfers — the raster half (alpha lock, rasterize, PSD/TGA) is deliberately skipped.

Full comparison lives in the review; this file is the implementation record for the
five items picked for build.

## The picks

| # | Feature | Why |
|---|---|---|
| 1 | Frame copy / cut / paste / duplicate + cross-layer frame selection | Yappy's most conspicuous missing basic — no way to reuse a cel |
| 2 | Timing tools: set duration, split-on-N, default new-cel duration | "Shoot on twos" was impossible without repeated manual F5 |
| 3 | Timeline zoom + fit + frames↔seconds ruler | `CELL_W` was a hard constant; long timelines were unnavigable |
| 4 | Step-by-cel, ruler markers, mark in/out playback + export range | Flipping is the core traditional-animation gesture; Yappy only stepped by frame |
| 5 | Out of pegs — transform the onion ghost without moving the drawing | Callipeg's most distinctive idea; nothing like it in Yappy |

## Decisions

**Selection model is rectangular** (`{ layerIds: string[]; frames: number[] }`), not a
per-row set. Callipeg's tap-and-drag selection is rectangular in practice, and a
rectangle keeps every frame op a simple loop over rows. The old single-layer shape
(`{ layerId, frames }`) is gone; `layerIds[0]` is the anchor row.

**Paste overwrites, it does not ripple.** Pasting N frames replaces whatever occupied
the destination range. Rippling on paste makes the destination timing unpredictable,
and Callipeg's own paste is an overwrite; ripple is what Insert Frame (F5) is for.

**The frame clipboard is in-process, not the system clipboard.** Cels carry element
snapshots, which have no sane text/HTML serialisation, and hijacking Ctrl+C in a
drawing app would break element copy/paste. Frame copy lives on Ctrl+Alt+C/V and the
frame context menu.

**Split duplicates content per cel.** Splitting a 48-frame drawn cel on 1s yields 48
independent cels, each a deep copy — that is what makes draw-during-playback and
per-cel cleanup possible. Splitting a blank cel yields blank cels (no copies).

**New-cel duration is a document setting, not a preference.** It rides on
`AnimTimeline.newCelFrames` so a doc handed to someone else keeps its exposure
convention. F6/F7 apply it by inserting `d-1` frames after the new keyframe, which
ripples following cels — matching Callipeg's default "push neighbours" behaviour.

**Markers live on the timeline, not on keyframes.** `AnimKeyframe.label` already
exists and moves WITH its cel; markers must stay put on the ruler when cels move
(Callipeg makes the same split, and says so explicitly). Both are kept.

**Out of pegs is per-keyframe, ghost-only.** `AnimKeyframe.peg` is a
`{ x, y, angle, scale }` applied ONLY when that cel renders as an onion ghost. It
never touches the stored elements, never affects playback, and never exports —
that is the whole point of the feature.

## Status

- [x] 1 — frame clipboard + cross-layer selection
- [x] 2 — timing tools
- [x] 3 — timeline zoom + ruler metric
- [x] 4 — step-by-cel, markers, mark in/out
- [x] 5 — out of pegs

## Deliberately not built

Ping-pong/random cycles, linked cels, per-sheet onion bar, draw-during-playback,
transformation layers, video/rotoscope layers, audio waveform + fades, PNG-sequence
export. All are on the review's Tier 2/3 list; none are prerequisites for the five
above.
