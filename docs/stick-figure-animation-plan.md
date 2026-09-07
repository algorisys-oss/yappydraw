# Stick-Figure Animation for Storytelling — Plan

Status: **planning / awaiting go-ahead** · Date: 2026-07-08 · Builds on the shipped
stick-figure library (v0.8.16–0.8.20, `frontend/src/library/stick-figures/`).

## TL;DR
Give stick figures **believable, skeletal motion** (walk cycles, waving, talking,
jumping…) and a **storytelling director** to sequence them into a little animated
scene, then play/record it. "Realistic" here = the *animation principles* (timing,
easing, weight, anticipation, follow-through, foot-planting), applied to stick
figures — not photoreal. The engine work is small **because the library already gives
us a skeleton** (per-limb bezier paths + known joints); the one genuinely new piece is
a **joint hierarchy + forward-kinematics evaluator** — Yappy has none today.

## Why this, and what "realistic" means
A stick figure is a skeleton already. What separates "sliding cut-outs" from "a figure
that *walks*" is entirely animation craft:
- **Two-segment limbs** so elbows and knees bend (upper-arm+forearm, thigh+shin).
- **Easing** on every joint (no linear motion) + **anticipation/follow-through**.
- **Weight**: hip drop/rise and torso counter-rotation through a stride.
- **Foot planting (IK)**: the contact foot stays fixed on the ground — no skating.
- **Secondary motion**: slight overshoot on hands/head; head bob; breathing on idle.

Three tiers of how to drive it (we recommend Tier 2):
1. **Pose-morph** — tween between existing library poses. Reuses all art, but
   single-segment limbs can't bend, so it reads floaty. Good only as a fallback/quick-win.
2. **Skeletal rig + keyframed joint angles + FK (recommended).** A real joint hierarchy;
   motion authored as per-joint angle tracks; foot IK for planting. This is what makes a
   walk cycle read as walking.
3. **Physics/ragdoll** — out of scope for storytelling.

## The core design decision (recommendation)
**Introduce a dedicated rigged element `type: 'stickRig'`** that stores a skeleton +
current clip, renders procedurally via FK each frame, and can **bake to editable vector
paths** (today's stick figure) on demand.

Why a new element rather than animating the existing grouped vector limbs:
- FK is **hierarchical** (a forearm inherits the upper-arm's rotation). Yappy's only
  rotation is *whole-element `angle` about a pivot* (`utils/transform-pivot.ts`), which
  is independent per element — it cannot express a chain. (Confirmed: no sub-part /
  subpath rotation API, no bone hierarchy.)
- Animation data stays **compact** (joint angles over time), not per-frame geometry.
- It plugs into the **scrubbable** time-evaluator (see Rendering) alongside orbit/spin.
- **Bake-out** gives the user editable vectors any time, reusing the library's
  `curveLimb()` styling so a baked frame looks identical to a dropped figure.

Cost: a new element type + renderer + evaluator + a small exported-runtime. That is the
price of realism; everything else is reuse.

## Reuse map (what we do NOT rebuild)
- **RAF loop + clock**: `utils/animation/animation-engine.ts` — singleton `animationEngine`,
  reactive `globalTime`/`effectiveTime`, `setForceTicker(true)` to keep ticking. Respects
  `globalSettings.animationEnabled`.
- **Easing + interpolation**: `animation-types.ts` `easings` table, `lerp`, `lerpColor`,
  `createSpring` (damped spring — perfect for secondary motion). Keyframe lerp:
  `element-animator.ts:826 interpolateKeyframes`.
- **Walk-along-a-path**: `element-animator.ts:969 animateAlongPath` + `getPointOnPath` /
  tangent (`orientToPath`) — root motion for "walk from A to B along a drawn path".
- **Timeline sequencing**: `utils/animation/timeline.ts` `createTimeline` (fluent
  add/parallel/delay/call) for the director's action ordering.
- **Pose-to-pose morphs (Tier-1 fallback / coarse states)**: `DisplayState` +
  `morph-animator.ts` (`applyDisplayState` interpolates). Note limitation below.
- **Scrubbable per-frame evaluation hook**: `utils/animation-utils.ts:107
  calculateAllAnimatedStates` (today only orbit+spin, driven from `window.yappyGlobalTime`
  in `canvas-event-handlers.ts:130`). **We extend this**, so figures animate from the same
  global clock and stay scrubbable — rather than the imperative `SequenceAnimator` path.
- **Export**: HTML player `utils/export-to-html.ts` / `export-game.ts:exportSceneAsHtml`
  (bakes runtime + animations); video `utils/video-recorder.ts` (`MediaRecorder` webm/mp4)
  via `timelapse-manager.ts:exportTimelapse`.
- **Skeleton substrate**: `library/stick-figures/poses.ts` `Pose.bones` + `builder.ts`
  `bones()`/`curveLimb()` — the rig's rest pose and the bake-out renderer come straight
  from here. (`PeopleRenderer` is fixed geometry — not used.)

**Two gotchas to design around:** (1) `DisplayState` overrides only carry 9 scalar props
(x,y,w,h,opacity,angle,bg,stroke,text) — no per-limb geometry, so full poses can't be
keyframed that way unless every limb is its own element. (2) There is **no GIF/APNG
encoder** — animated export = HTML player or webm/mp4 screen-capture only.

## Data model
```ts
// A compact skeleton: joints in a parent hierarchy, bone lengths, rest angles.
interface Joint { id: JointId; parent: JointId | null; length: number; restAngle: number }
interface StickRig {
  skeleton: Joint[];          // pelvis(root)→spine→neck; shoulders→elbows→hands; hips→knees→feet
  scale: number; facing: 1|-1;// left/right flip
  clip: string;               // active motion clip id
  clipTime: number;           // phase (or driven by the director timeline)
  loop: boolean; speed: number;
  props?: { hand: JointId; assetId: string }[]; // held items attached to a joint
  style: { stroke: string; strokeWidth: number; renderStyle: 'architectural'|'sketch' };
}
// A motion clip = per-joint angle tracks (radians) over normalized time, with easing.
interface MotionClip {
  id: string; name: string; duration: number; loopable: boolean;
  tracks: Record<JointId, { t: number; angle: number; ease?: EasingName }[]>;
  rootMotion?: { dx: number; dy: number };     // e.g. walk advances the pelvis
  footPlant?: ('leftFoot'|'rightFoot')[];      // which foot is grounded per phase (IK)
}
```
Stored on the element (`DrawingElement.stickRig?`) so it serializes with the doc and
survives the `migration.ts` passthrough (add a field there — a known gotcha).

## The rig
- **Skeleton (13 joints):** pelvis(root), spine, neck+head; L/R shoulder→elbow→hand;
  L/R hip→knee→foot. Bone lengths tuned to the library's proportions (head r≈22 in a
  140×260 frame).
- **FK evaluator:** walk the joint tree from the root, accumulating parent world angle +
  length → each joint's world point. Pure function `evaluateRig(rig, clip, t) → Joint
  world points`. Deterministic and cheap.
- **Foot IK (realism keystone):** for a grounded foot, pin its world position and solve
  the knee (2-bone analytic IK) so the leg reaches the pinned foot — eliminates skating
  when the root moves (walk/run, walk-along-path).
- **Render:** draw bones as bezier strokes (reuse `curveLimb()` smoothing) + head circle;
  `data-sf-role` on segments so **recolour still works**; both `sketch` and
  `architectural` styles (render-parity obligation).
- **Bake:** `bakeRig(rig,t) → path elements` (identical to `insertStickFigure` output) for
  users who want to hand-edit a frame.

## Motion-clip library (MVP set, hand-tuned)
`idle-breathe`, `walk`, `run`, `wave`, `talk-gesture`, `point`, `jump`, `sit-down`,
`fall`, `celebrate`. Each authored as joint-angle keyframes with per-segment easing and
foot-plant flags. (Later: `think`, `type`, `carry`, `dance`, `climb`, transitions.)
Optional **lip-flap** ("talking") = a small mouth open/close on the head while a
`talk-gesture` plays.

## Storytelling director
A lightweight **scene timeline** (its own panel, modeled on the existing slide/timeline
UI) where each figure is a track and you drop **action blocks** on a time ruler:
- **Actions**: pick a clip (walk/wave/talk…), set start/duration, loop.
- **Movement**: keyframe the figure's position, or **assign a drawn path** — the figure
  walks it with the `walk` clip **phase-synced to arc length** (stride matches speed → no
  sliding), auto-facing the tangent.
- **Transitions/blend**: cross-fade joint angles between consecutive clips (idle→walk).
- **Sync**: actions can align to slide advance / other elements' animations (reuse
  `AnimationTrigger`: on-load/after-prev/with-prev) so the story drives with a deck.
- **Dialogue (nice-to-have)**: attach a speech bubble (we already ship one as a prop)
  that appears over an action block.
- **Playback**: the global clock drives everything; **scrubbable** because rigs evaluate
  from time (not imperative mutation). Play/pause/loop reuse `animationEngine`.

## Rendering & scrubbability
Extend `calculateAnimatedState` (`animation-utils.ts`) so that for a `stickRig` element it
returns the evaluated pose for the current global time (the director maps global time →
each figure's clip+phase+root position). This keeps figures on the **same scrubbable
timeline** as orbit/spin and needs **no second animation paradigm**.

## Export
- **HTML player**: bundle a tiny `evaluateRig` runtime into the exported file (like the
  game runtime is baked in) so exported stories play natively. Reuse `exportSceneAsHtml`.
- **Video**: record live playback to **webm/mp4** via the existing `VideoRecorder` /
  timelapse path.
- **GIF**: no encoder today — either add one (extra scope) or document webm/mp4 as the
  animated formats. Recommend deferring GIF.

## Phases
- **Phase A — Spike (S; risk HIGH):** one rig + one `walk` clip; FK evaluator; render on
  canvas driven by the global clock; prove foot-planting and bake-to-vectors. Lock the
  `StickRig`/`MotionClip` schema.
- **Phase B — Rig MVP (L; risk MED):** `stickRig` element + renderer + time-evaluator +
  migration field; 6 core clips (idle, walk, wave, talk, point, jump); library panel gets
  an **"Animated"** tab: drop a rigged figure, pick an action, loop-play. Recolour + both
  render styles + bake.
- **Phase C — Director (L; risk MED):** scene-timeline panel; per-figure action tracks;
  position keyframes + **walk-along-path** with stride sync + auto-facing; clip blending;
  play/pause/scrub; sync to slides.
- **Phase D — Realism polish (M; risk LOW):** foot IK everywhere, weight shift + torso
  counter-rotation, secondary motion via `createSpring`, head look-at, lip-flap talking,
  ground shadow.
- **Phase E — Export & share (M; risk LOW):** bake rig runtime into the HTML player;
  webm/mp4 recording of a story; (optional) GIF encoder.

**Recommended first slice:** Phase A + B (a rigged figure you can drop and watch walk/
wave), then decide on C.

## Risks & open questions
- **Realism is in the clips, not the tech** — budget real time to hand-tune the walk/run
  cycles; a mediocre walk cycle sinks the feature. Mitigate: author against reference,
  review each clip in-app, iterate.
- **New element type surface**: renderer, hit-testing, selection, export, undo — a
  `stickRig` touches several systems. Mitigate: keep it a thin procedural renderer + a
  bake-to-path escape hatch; lean on the path renderer for the baked form.
- **Scrubbable vs imperative**: commit to the time-evaluator path (extend
  `calculateAnimatedState`); do **not** route figures through `SequenceAnimator`.
- **Two-segment limbs** change the art slightly vs the current single-segment poses —
  the rig is its own rest pose, so the static library is unaffected.
- **Open**: rigged element vs bake-everything-to-vectors-per-frame (rejected: heavy,
  unscrubbable); GIF export yes/no; how deep director sync with slides should go for v1.

## Repo-convention obligations (CLAUDE.md)
- **api.ts**: `insertAnimatedFigure(clip?, opts?)`, `setFigureClip(id, clip)`,
  `playStory()/pauseStory()/seekStory(t)`, `bakeFigure(id)`.
- **types.ts / migration.ts**: `DrawingElement.stickRig?` + migration passthrough.
- **Render-style parity**: rig renders fill+stroke in **both** sketch and architectural.
- **Help doc**: new `help-docs/features/stick-animation-doc.tsx` + register; hotkeys if any.
- **WASM parity**: not triggered (no geometry.ts/hit-testing.ts/routing/object-snapping
  changes expected).
- **Ship flow**: learnings, release note, repograph, build, main+dev sync, OSS publish.

## Independence
Its own branch off `main` (e.g. `feat/stick-figure-animation`). Depends on the shipped
stick-figure library; unrelated to the game-engine work (though it reuses the animation
engine and export paths).
