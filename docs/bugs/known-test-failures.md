# Test-failure triage (post-sweep) — RESOLVED + remaining

Full-suite sweep after fixing the collection blocker (2026-06-27). Triaged by
**"is the current app behaviour the intended one?"** — fix the *wrong side*.

Run self-hosting: `npx playwright test` (auto-starts Vite on :5173 via
`playwright.config.ts`).

## ✅ FIXED — real app bug

- **`deleteSlide(index)` didn't delete** a non-active slide below the active one.
  `setActiveSlide` (called inside deleteSlide's batch with the stale
  `activeSlideIndex`) saved the leaving slide via `setStore("slides", staleIndex,
  …)` with an out-of-range index, re-extending the array. Bounds-checked the save.
  `slides.spec.ts` 13/13. (v0.5.1)

## ✅ FIXED — stale tests (app intentionally evolved)

- `api.spec.ts`, `solid-block.spec.ts` — `../src/...` → `../frontend/src/...`
  (collection error that aborted the whole suite).
- `_mesh.spec.ts` — added `waitForSelector('canvas')`.
- `alignment.spec.ts`, `comprehensive-features.spec.ts` — stale button titles →
  public API; honour `YAPPY_URL`.
- `hotkeys.spec.ts` — laser is `Shift+P`. `bpmn.spec.ts` — pool default `600×300`.
  `flare.spec.ts` — rays render as `path`.
- `dsl.spec.ts` — 5 of 7: `nodeIdMap`/`edgeIdMap` are **Maps** (serialize to `{}`
  across `page.evaluate`) → compute `.size` inside the evaluate; and `end` is a
  **reserved word** in the YSL text parser (like Mermaid) → renamed test nodes.

## ✅ RESOLVED — DSL parser made stricter (product decision: stricter + clear errors)

- `parseDSL('[1,2,3]')` now routes `[…]` to the JSON parser → rejected with
  "DSL input must be a JSON object." (`:108`).
- `importDSL('garbage')` returns `null` when nothing meaningful parses (0 nodes)
  instead of an empty result (`:419`). `dsl.spec.ts` 39/39.

## ✅ RESOLVED — UI tests refreshed

- `productivity-features.spec.ts` — verify the selected tool via `Yappy.getSelectedTool()`
  instead of a toolbar button that lives in a collapsed shapes flyout.
- `layer-background.spec.ts` — open the panel via `Yappy.toggleLayerPanel(true)`; use the
  real `.layer-panel input[type="color"]`; honour `YAPPY_URL` (was hardcoded :5174).
- `export_shortcut.spec.ts` — Export menu item label is "Export" (disambiguated by its
  Ctrl+Shift+E shortcut from a separate Load/Export item).

**All 13 original failures are now resolved** (1 real bug fixed, 12 stale tests/contract
updates). Suite is green.

## Infra
`playwright.config.ts` self-hosts the suite. ~108 specs still hardcode a port vs
~83 honour `YAPPY_URL`; standardising on `YAPPY_URL` is the remaining cleanup.

## ⚠️ OPEN — `animation-timeline.spec.ts` is flaky (~1 run in 3)

**Status (2026-07-28, v0.8.153): unresolved, pre-existing, NOT caused by recent
composition work.** Documented here so it isn't re-investigated from scratch each
time it trips a full-suite run.

**Symptom.** Running the file serially (`--workers=1`) fails roughly one run in
three, and **the failing test differs every time**. Observed across eight runs:

| Line | Test |
| --- | --- |
| `:137` | onion skin: ghost pixels appear when enabled |
| `:172` | undo restores timeline structure; document round-trip |
| `:385` | audio row: sounds add/move/remove, save/load round trip |
| `:20`  | new animation doc: Stage page, default timeline, panel chrome |

Each passes in isolation and the file often passes 15/15. A real regression breaks
the *same* test; a wandering failure across unrelated features points at **state
leaking between tests** (or a timing race in setup) rather than four separate bugs.

**A/B evidence.** Suspicion fell on the `store.storyTime` / `store.compositionTracks`
deps added to the canvas render effect in v0.8.153 (bug-fixes #218), since they make
the canvas repaint more often. Four runs per arm, serial, otherwise-idle machine:

| Arm | Runs | Failures | Failing test |
| --- | --- | --- | --- |
| With the deps (HEAD) | 4 | 2 | `:172`, `:137` |
| Deps reverted | 4 | 1 | `:385` |

**The flake reproduces with the change reverted**, so it is not caused by it. Note
2/4 vs 1/4 is *not* a distinguishable rate at n=4 — the claim is only "exists
independently", not "unaffected". Mechanically it should be unaffected: animation-mode
documents leave `storyTime` at 0 and `compositionTracks` empty, so those two deps never
fire in this file.

**Where to start.** The suite shares one dev server and Playwright reuses browser
context state; `animation-timeline` specs each build a document via
`Yappy.anim.newDocument()`. Prime suspects are autosave restoring a previous test's
document, and the frame-timeline playhead/ticker not being reset between tests. A
`beforeEach` that hard-resets the document and stops playback would be the first thing
to try.
