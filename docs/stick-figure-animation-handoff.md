# Stick-Figure Animation — Handoff

Last updated: 2026-07-08 · Status: **shipped through v0.8.27, feature-complete, no known gaps.**
Plan of record: `docs/stick-figure-animation-plan.md` · builds on the static library
(`docs/stick-figure-library-plan.md`, shipped v0.8.16–0.8.20).

## TL;DR
A drawify-style stick figure that **moves** — a real skeleton (FK + foot-IK) playing motion
clips — plus a storytelling **director**: walk a figure along a drawn path, chain timed actions,
blend transitions, orchestrate everyone on a scrubbable **Scene Timeline**, and export the result
as **video** or **self-contained animated HTML**. All on branch `feat/stick-figure-animation`,
merged to `main` + `dev`, published to the OSS mirror.

## Where things are (resume checklist)
- **Branch:** `feat/stick-figure-animation` (== `main` == `dev` == OSS at the latest release commit).
- **Version:** `package.json` 0.8.27. Bump per release; footer reads `pkg.version`.
- **Build:** `npm run build` (tsc + vite). **Repograph:** `npm run repograph` (or the pre-commit hook).
- **Run/verify:** start `npx vite --port 5199 --strictPort` **from the repo root** (a persisted
  `cd` into a subdir roots vite there → `/` 404, `window.Yappy` never set). Drive via Playwright +
  `window.Yappy`. Offline filmstrips: `tsx` importing `anim/rig.ts`+`anim/clips.ts` → Playwright
  `setContent` (fast, no app needed) for judging clip poses.
- **Ship flow (CLAUDE.md):** learnings + bug log + web help doc, bump version, `release-notes/<v>.md`,
  repograph, build, commit on branch, ff `main` **and** `dev`, push, `./scripts/publish-oss.sh --push`.
  **If the render/animation path changed, ALSO `node scripts/embed-player.js`** to refresh the
  exported-HTML player bundle (see Gotchas).

## Architecture map (file → purpose)
Animation engine (new, all under `frontend/src/library/stick-figures/anim/`):
- `rig.ts` — 11-joint skeleton (pelvis→spine→head; shoulder→elbow→hand ×2; hip→knee→foot ×2),
  `evaluateRig` (forward kinematics + 2-bone analytic foot IK), `rigPoseToSvg` (role-tagged bones +
  head, for bake/thumbnails), `StickRig`/`StickRigData`/`MotionClip`/`ClipPose`/`Bone`/`JointId`.
- `clips.ts` — 10 motion clips (idle, walk, run, wave, talk, point, clap, jump, dance, cheer) +
  `poseAt(clipId, phase, facing)`, `CLIP_LIST`, `WALK_STRIDE`. Walk/run are procedural (foot targets
  + IK, treadmill so the planted foot doesn't skate); the rest are angle-offset clips.
- `path-follow.ts` — sample any path-like element (`pathSubpaths`/`pathAnchors`/`points`) into a
  world arc-length polyline; `sampleAt(frac) → point+tangent`; `isPathLike`.

Element + render:
- `types.ts` — `ElementType` has `'stickRig'`; `DrawingElement.stickRig?` = `{clip, speed, facing,
  playing, previewPhase, path?{pathId,dur,loop,autoFace}, sequence?{clip,dur}[]}`.
- `shapes/renderers/stick-rig-renderer.ts` — procedural renderer (both architectural & sketch).
  Computes pose from the clock, path-follow, sequence (+ cross-fade blend), maps the canonical
  140×260 rig into the element bbox. Reuses `el.strokeColor/strokeWidth` (recolour for free).
- `shapes/register-shapes.ts` — `shapeRegistry.register('stickRig', …)`.
- `utils/migration.ts` — `stickRig` passthrough (else stripped on load).
- `utils/hit-testing.ts` — `stickRig` in the bbox-fallback list (selection).
- `components/canvas.tsx` (~L156) — force-ticker predicate includes playing stickRigs (the
  load-bearing repaint mechanism).

Library API glue: `library/stick-figures/index.ts` — `insertAnimatedFigure`, `set/flip/bake/…`,
`attachFigureToPath`/`detachFigurePath`/`pathFollowCandidate`, `setFigureSequence`. Public methods on
`window.Yappy` in `api.ts` (search "Animated stick figures", "Scene Timeline", "record").

UI: `components/stick-figure-panel.tsx` (Animated tab, controls: clip chips, Play/Pause, Flip, Bake,
Walk-this-path, sequence editor, Record video, Scene-timeline toggle). `components/scene-timeline.tsx`
(+ `.css`) — transport, per-figure tracks, playhead + scrub, block **resize** & **reorder**,
slide-sync toggle. Store playhead state in `app-store.ts`: `showSceneTimeline`, `storyTime`,
`storyPlaying`, `storyLoop`, `storyDuration`, `storySyncSlides`.

## How the load-bearing bits work
- **Animate from the clock, no new loop:** the canvas draw effect subscribes to `effectiveTime()` and
  self-reschedules RAF; it only advances while the ticker is forced. Force it when a playing stickRig
  exists → renderer reads `effectiveTime()` each repaint and re-poses. `effectiveTime()` is
  pause-aware, so global pause freezes figures.
- **Scene clock:** one signal, `store.storyTime`. Renderer uses `t = showSceneTimeline ? storyTime :
  effectiveTime()/1000`. A controller effect in the timeline advances `storyTime` while playing;
  scrubbing sets it directly. Path-follow/sequences all become scrubbable for free.
- **Foot planting:** clips emit a pelvis-relative foot TARGET per phase; IK solves the knee. Path-
  follow syncs the walk phase to arc length (`prog·pathLen/strideWorld`) so ground speed matches stride.
- **Blending:** pose-level `lerpRigPose` between the outgoing and incoming clip poses over 0.18s at each
  sequence step start (clip-agnostic — works across foot-IK and angle clips).
- **Bake:** current pose → `rigPoseToSvg` → the existing SVG importer → editable grouped paths, swapping
  the rig element in one history step.

## Shipped (version → what)
0.8.21 rig + FK/IK + 6 clips + stickRig element + Animated panel + walk-along-path + bake (also a
Convert-to-Path line/freehand fix) · 0.8.22 sequences + blending · 0.8.23 **video** record ·
0.8.24 **Scene Timeline** (play/scrub) · 0.8.25 **animated HTML export** (rebuilt player bundle) ·
0.8.26 +4 clips (run/clap/dance/cheer) + timeline block **resize** · 0.8.27 timeline block **reorder**
+ **slide-sync**.

## Gotchas (read before editing)
- **Rebuild the player bundle on render/animation changes:** `assets/player-assets.ts` is a committed
  2.2 MB prebuilt bundle (`scripts/embed-player.js` → `vite.player.config.ts`). The offline player
  (`player-app.tsx`) mounts the same `Canvas` + `registerShapes`, so exports animate with no
  player-specific code — but only after the bundle is regenerated. Stale bundle = static/missing figures
  in exported HTML.
- **New `DrawingElement` field?** add it to the `utils/migration.ts` `normalizeElement` passthrough or
  it's dropped on load/paste/template.
- **lucide icon in a flex button collapses to width 0** — add `svg { flex: 0 0 auto; width/height }`.
- **Paged doc types** = `slides`/`design`/`game` (NOT the string "presentation").
- **Don't set `points` on a stickRig** — the base renderer short-circuits to `renderCustomPoints`.

## Possible future work (all NEW scope — nothing is a known gap)
- Timeline: free time-positioning (gaps/overlap) rather than contiguous steps; multi-select; undo of
  drag edits as discrete history entries.
- More motion clips; per-figure speed/scale on the timeline; a props/held-item attach-to-hand.
- Slide-sync depth: per-figure on-click / after-prev triggers (reuse `AnimationTrigger`), not just
  restart-on-slide-change.
- Two-segment authoring polish, secondary motion (spring overshoot via `createSpring`), ground shadow.
