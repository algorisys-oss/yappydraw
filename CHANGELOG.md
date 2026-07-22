# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.145] - 2026-07-22 — Animation Studio finale: frame actions, HTML player, camera

### Added — Camera layer (P8) [2026-07-22]
- **Keyframed camera** — `AnimTimeline.camera: AnimCameraKey[]` (stage-local center + zoom, eased per key): the 📷 button captures the current editor view as a key at the playhead; playback and video export glide the stage content between shots (paused editing keeps the free view). Pure `evaluateCameraAt` + unit tests; applied as an outer world transform in canvas playback, the frame-exact export renderer, and (via the shared canvas) the HTML player. API: `Yappy.anim.setCameraKey/setCameraKeyFromView/clearCameraKey/camera`.
- e2e: keys tween, zoomed playback paints measurably more of the subject than the free view, keys round-trip.

### Added — Frame actions + HTML5 player (P7) [2026-07-22]
- **Frame actions** — `AnimKeyframe.action`: Stop / Go to Frame (loop sections) / Next Scene, set from the keyframe context menu (small "a" glyph above the dot, Animate-style). Fired by the playback loop when the playhead crosses the keyframe (loop-wrap aware; scan covers skipped frames); scrubbing never fires them. `goto` rebases the playback clock and reschedules audio from the target; `nextScene` chains scenes into an act-by-act film. API: `Yappy.anim.setFrameAction`.
- **HTML5 player for animations** — Menu → Export HTML now ships the frame timeline (`animTimeline`/`animScenes` added to `exportSceneAsHtml`), and the standalone player auto-plays animation documents with looping + a minimal restart/pause transport (real renderer, frame actions and the audio row all work — it's the animation itself, not a video). Player bundle regenerated.
- e2e: stop parks the playhead, goto loops a section (sampled over multiple passes), action round-trips through the doc format.

## [0.8.144] - 2026-07-22 — Animation Studio: morphs, curves, guides, poses, sound, scenes

### Added — Scenes (P6) [2026-07-22]
- **Multiple scenes per animation** — each slide is a scene with its own stage + timeline. Scene picker (+/switch/delete) in the timeline header; only the active scene's artwork is visible/editable; add copies fps/length; delete removes the stage's contents. Persisted as `SlideDocument.animScenes` (all scenes keyed by slide id; active also in `animTimeline` for back-compat), in undo snapshots and autosave. API: `Yappy.anim.addScene/setScene/deleteScene/sceneCount`.
- Two Solid-store bugs found by the e2e (same family as the clip-edit stash): scene stashes must hold **clones** (a stashed proxy aliases later merges into the active node) and `animScenes` writes need **`reconcile()`** (plain setStore merge never deletes record keys). Also: identity-keyed caches don't work on reconciled proxies (identity never changes) — the reconciler's cross-scene exclusion set is computed fresh; scene ops flush pending element adoption before stashing so a just-drawn shape can't migrate into the new scene.

### Added — Audio row (P5) [2026-07-22]
- **Sound on the timeline** — `AnimTimeline.audio: AnimAudioClip[]`: an ♪ Audio row between ruler and layers. Add the nine built-in synth SFX or import an audio file (≤4 MB, stored as dataURL in the document, decoded duration drives the block width). Drag blocks to move; right-click to add/remove; persists/undoes with the timeline.
- **Playback**: `anim-playback` schedules the row on Play (SFX via setTimeout→synth, files via WebAudio buffer sources), cancels on pause/stop, reschedules on loop wrap. Scrubbing stays silent.
- **Export muxing**: `buildExportAudioStream` renders every clip at its frame offset into a `MediaStreamDestination`; `VideoRecorder.start` gains an optional audio stream (mimeTypes widen to `vp9,opus` / `avc1+mp4a` when audio present). GIFs remain silent.
- Refactor: sound-engine's `tone/sweep/noise` take an optional routing target (ctx/out/when), and `sfxInto` renders any SFX recipe into an arbitrary graph — game behavior unchanged (defaults preserved).
- Fix (found by e2e): audio clip ids now use `crypto.randomUUID` — `generateId` derives uniqueness from scanning elements, so two non-element clips collided on one id.
- Tests: 3 pure ops unit tests (sorted add, remove, clamped move) + an e2e (add/move/remove, doc round-trip, playback smoke). API: `Yappy.anim.addSound/sounds/moveSound/removeSound`.

### Added — Pose keyframes for stick figures (P4, bones/IK) [2026-07-22]
- **Pose tweens** — a stick-figure element's pose (motion clip + cycle phase + facing) is captured per cel and interpolated across tween spans by the pure evaluator: same clip → the phase glides through the cycle (limbs + foot IK animate); different clips → cross-clip skeleton blend via a transient `stickRig.blendTo` override resolved by `lerpRigPose` (moved from the renderer into pure `anim/rig.ts` and exported). Overrides always pin `playing: false`, so scrub/playback/export agree frame-exactly.
- **Pose UI** — with a figure selected, the timeline header shows clip picker + cycle-phase slider + flip; setting a pose pins the figure on that cel.
- Tests: 3 unit (phase glide, cross-clip blendTo, lerpRigPose joint math) + a Playwright e2e (data + drawn-pose pixel difference between frames). Spec boots got 90s cold-dev-server headroom (fixes the recurring first-run flake).

### Added — Ease curve editor + motion guides (P3) [2026-07-22]
- **Ease curve editor** — the timeline header's `curve` button opens a bezier popover for the selected tween span: presets (In/Out/In-Out/Overshoot/Anticipate) + two draggable handles (y beyond [0,1] for overshoot/wind-up), mirroring the keyframe-panel's editor. A custom curve overrides the named easing; drags stream through `setFrameEase(..., recordHistory=false)` with one history entry per gesture. API: `Yappy.anim.setFrameEaseCurve`.
- **Motion guides** — `AnimKeyframe.guideId`/`guideOrient`: a tween's elements ride a line/polyline/pen/freehand path (center follows arc-length from start to end, easing applies along the path; `orient` rotates into the direction of travel). Pure `guidePolyline` + `samplePolyline` in the evaluator (WeakMap-cached), correctly handling top-left-relative point types AND point-less plain lines (endpoints implied by the frame). UI: `guide: use selection` / `orient` / `guide ✕` in the frame properties; hidden-layer guides steer without rendering. API: `Yappy.anim.setFrameGuide`.
- Tests: 5 evaluator unit tests (path centering, orient tangent, missing-guide fallback, polyline sampling/degenerates) + a Playwright e2e (guide midpoint + custom-curve lag).

### Added — Shape tweens (P2) [2026-07-22]
- **`tween: 'shape'`** — a shape tween does everything a motion tween does AND morphs the outline between the two cels: endpoints are converted to outlines (`MorphUtils.getPointsFromElement`), resampled to 64 points, twist-aligned, and interpolated per frame in the pure evaluator; the intermediate renders through `ShapeRenderer.renderCustomPoints` (fill + stroke, both render styles). Point-native types (draw/line/arrow/text/clip instances) gracefully degrade to plain motion tweens. Endpoint outlines are cached per element pair (WeakMap; store edits invalidate by reference).
- UI: right-click → **Create Shape Tween**, green span arrows (indigo = motion), and the frame-properties control is now a none/motion/shape select. API: `Yappy.anim.setTween('shape', …)`.
- Removed per-frame `console.log`s from `renderCustomPoints` (now on a hot path).
- Tests: 3 evaluator unit tests (morph output, pose+morph combo, degrade rule) + a Playwright e2e (square→circle morph renders pixels mid-span).

### Added — Animation Studio (Animate-class frame timeline) [2026-07-22]
- **New `animation` document type** (Menu → New → New Animation…): fixed Stage + bottom frame-timeline panel. Frame-based model (`AnimTimeline`/`AnimLayer`/`AnimKeyframe` in `types/anim-types.ts`): keyframes own element ids (the "cel" model — drawing lands on the current frame's keyframe via a reconciler), spans hold, blank keyframes, frame labels.
- **Timeline panel** (`components/animation-timeline.tsx`): DOM layer rows (rename/visibility/lock/delete) + a canvas-rendered frame grid (ruler, keyframe dots, span bars, tween arrows, playhead), scrubbing, drag-to-move keyframes, right-click frame menu, transport header (play/stop, fps, length, loop, onion controls, frame + movieclip-instance properties). Floating transport bar (`animation-mode-bar.tsx`) when the panel is closed.
- **Hotkeys** (animation docs): F5/F6/F7 insert frame/keyframe/blank, Shift+F5/F6 remove/clear, F8/Shift+F8 convert to movie clip/graphic, Enter play/pause, `,`/`.` step, Home/End jump.
- **Motion tweens**: F6 duplicates the previous cel with a shared `contentId`; matched elements lerp x/y/size/angle/opacity/colors through the pure `frame-timeline-evaluator` (reuses `easeProgress`/bezier + named easings). Per-span easing picker.
- **Onion skinning** (`utils/onion-skin.ts`): red/green ghosts of neighboring frames, rendered through the real scene renderer into a tinted offscreen — identical in sketch and architectural styles.
- **Movie-clip symbols**: `SymbolDef.kind`/`timeline`; instances play their own nested timeline as a pure function of the document playhead (`clipLocalFrame` — loop / play-once / single-frame + first-frame offset), authored via the existing edit-in-place session (the doc timeline is stashed and swapped for the clip's).
- **Export**: GIF/MP4/WebM are frame-exact (`makePageFrameRenderer` quantizes to the timeline fps); export dialog defaults to one full timeline pass for animation docs.
- **API**: `Yappy.anim.*` (newDocument, gotoFrame, play/pause/stop, insert/clear/remove frames & keyframes, setTween/easing/label, setFps/frameCount, evaluate, visibleIds) + `createSymbol(name, ids, kind)`.
- Persistence: `SlideDocument.animTimeline` (additive on v4), autosave, undo/redo (timeline + symbol-timeline aware snapshots).
- Tests: `frame-timeline-evaluator.test.ts` + `frame-timeline-ops.test.ts` + `anim-types.test.ts` (73 unit tests), `tests/animation-timeline.spec.ts` (8 e2e: cel model, tween, playback, grid UI/hotkeys, onion pixels, undo/round-trip, movie-clip edit-in-place, both render styles).
- UX: the floating Settings/Properties/Help cluster lifts itself above the timeline panel (`--anim-timeline-h` CSS var published via ResizeObserver) instead of overlapping the layer column.
- **Animation templates** (Templates → Animations): three ready-made frame-timeline documents that double as social-media showcases — *Bouncing Ball* (squash & stretch tweens), *Rocket Launch* (looping movie-clip flame + cel-swap star twinkle), *YappyDraw Intro* (1080×1080 branded card with staggered bounce-in shapes). Built in `templates/data/animations.ts` as full doc-carrying templates with first-frame previews; also loadable via `Yappy.anim.loadExample(name)`. e2e: `tests/animation-templates.spec.ts` (5).
- Timeline panel polish: sits ABOVE the status bar (28px) so the bottom layer row is never hidden, and the top edge is a **drag-to-resize** handle (height cap persisted in localStorage) for documents with many layers.
- Fix (latent): `normalizeElement` now passes through `symbolId`/`loopMode`/`firstFrame`/`contentId` — legacy-doc migration used to strip symbol instances' definition link. `utils/migration.ts` no longer imports the store (pure module, bun-testable).
- Test infra: `tests/api.spec.ts` now uses the Playwright baseURL instead of a hardcoded `localhost:5173` (a different app on that port made all 6 tests time out at boot).
- Files: `frontend/src/types/anim-types.ts`, `utils/animation/frame-timeline-{evaluator,ops}.ts`, `utils/animation/anim-playback.ts`, `utils/onion-skin.ts`, `store/anim-ops.ts`, `components/animation-{timeline,mode-bar}.{tsx,css}`, `components/new-animation-{dialog.tsx,signal.ts}`, `help-docs/features/animate-doc.tsx`; touched `types.ts`, `types/slide-types.ts`, `store/app-store.ts`, `components/canvas.tsx`, `app.tsx`, `menu.tsx`, `symbols-panel.tsx`, `shapes/renderers/symbol-instance-renderer.ts`, `utils/{document-io,recording-manager}.ts`, `storage/auto-save.ts`, `components/{export-dialog,help-dialog}.tsx`, `api.ts`.

## [0.6.0] - 2026-07-05 — Arcade: build games on the canvas

### Added
- **Two more block examples + a "jump to" action.** The Game Builder's empty state offers **Load example: Pong** and **Catch the Star** (both built from blocks). New **jump to** action (moveTo random-top / random / center) enables looping games without spawn-copies.
- **Idempotent code templates.** The Pong/Catch code starters now *find-or-spawn* and tag their sprites, so running one on a canvas that already has named sprites reuses them instead of doubling (fixes a reported two-balls/two-paddles case).
- **Game Builder — visual, no-code game creation (the headline).** Menu → Game Builder (or right-click a sprite → Edit Behaviors) opens a floating, tablet-friendly Behaviors panel. Select a sprite, name it, and give it **WHEN→DO rules** from big pickers — triggers (on start, every moment, key pressed/held, when tapped, when it hits a sprite/wall, when it leaves the screen) and actions (move, glide, bounce, rotate, color, grow/shrink, show/hide, set text, spawn, destroy, change score, go to state, play effect, go to page, win, game over). A **Scene** tab holds whole-game rules; a **Code** tab shows the read-only `game.*` script the blocks generate (a learn-to-code bridge). **▶ Play** runs it. A one-tap **Load example: Pong** onboards beginners. Blocks are the source of truth (`element.behaviors` + `SlideDocument.sceneBehaviors`, persisted automatically); `behaviors-to-script.ts` compiles them to the same `game.*` script the runtime and exported player already run — so builder-games and hand-written games play identically and both export, with no second engine and no player changes (the generated script is written into the doc's `gameScript` on save/export). API: `Y.getBehaviors/setBehaviors/getSceneBehaviors/setSceneBehaviors/nameSprite/compileGame/playBehaviorGame/toggleGameBuilder`. Runtime gained `game.goToState/playAnim/goToPage/score/getScore`. e2e: behaviors-builder.spec.ts (4) + behaviors-panel.spec.ts (UI). The old code editor is now **Menu → Game Script (advanced)**.
- **Arcade — Flash-style games on the canvas.** Menu → Game Script… opens a script editor (starter templates: Pong, Catch the Stars, Blank); Play snapshots the document and runs the script against the live canvas at 60fps; Stop/Esc restores everything. The `game.*` API covers ticks, per-press and held-key input, pointer, spawn/find sprites (`Sprite` handles with move/color/text/destroy), AABB `hit()`, `hud()`, `end()`. Input: arrows/WASD + Space/Z/X/Shift, plus an **on-screen touch D-pad + A/B gamepad** (auto on coarse-pointer devices; `game.pad()` overrides) — games are tablet-playable.
- **Clean play stage:** Play hides all editor chrome and the page frame (enters presentation mode + fits the page); the **Stop pill sits top-center** above everything (no more hiding behind corner toolbars); after `game.end()` a **Play again / Exit** panel appears. Stop restores the editor exactly.
- **Games persist and share:** the script rides the document (`SlideDocument.gameScript` — autosave, `.yappy`/JSON saves, **and My Templates**, so saved templates are a game library) and **HTML export ships a playable game** — the standalone player shows a ▶ Play Game button.
- API: `Y.setGameScript/getGameScript/startGame/stopGame/isGameRunning`. e2e: tests/arcade.spec.ts (10) + arcade-visual.spec.ts (clean-stage screenshots). Help: searchable Arcade doc.
- Fixed a stale path in `scripts/embed-player.js` (wrote the regenerated player bundle to a dead `src/assets/` at repo root instead of `frontend/src/assets/`), so HTML exports had never picked up player changes; corrected and the arcade runtime is now bundled.
- New: `frontend/src/game/{behavior-types,behaviors-to-script,behavior-examples,game-runtime,game-templates}.ts`, `frontend/src/components/{behaviors-panel,game-overlay,game-script-dialog}.{tsx,css}`, `frontend/src/help-docs/features/arcade-doc.tsx`, tests `arcade`/`arcade-visual`/`behaviors-builder`/`behaviors-panel`.
- e2e: 20+ specs across the arcade + builder suites; the embedded HTML player bundle is regenerated so exported games play.

## [0.5.33] - 2026-07-05

### Added
- **Design template pack** — 21 new built-in templates (33 total): Instagram posts (product, tips carousel, testimonial, hiring, podcast, minimal sale), stories (countdown, quote), tutorial YouTube thumbnail, deck title/section slides, webinar banner, typographic & workshop posters, café menu, open-house flyer, thank-you card, light business card, price list, gift voucher, and birthday invite. Builders extracted to `templates/data/designs/helpers.ts`.
- **PWA lifecycle toasts** — first install shows "ready to work offline / installable"; a background update shows "reload to finish applying" (hooked on `controllerchange`, so it fires exactly when the new service worker takes over).
- **Version-history previews** — each snapshot now carries a small page thumbnail, shown in the Version History list.

### Changed
- **Magic Resize edge anchoring** — elements within 8% of a page edge stay pinned to that edge with their margin scaled, instead of drifting with the normalized center (logos and footer badges keep their margins).

### Fixed
- **Open Drawing dialog in dark mode** — its stylesheet used hard-coded light colors; now themed via CSS variables (panel, text, borders, hover) in every theme.

- Files: `frontend/src/templates/data/designs/{helpers,index,pack}.ts`, `frontend/src/app.tsx`, `frontend/src/components/{file-open-dialog.css,version-history-dialog.tsx,version-history-dialog.css}`, `frontend/src/storage/version-history.ts`, `frontend/src/utils/magic-resize.ts`, `frontend/src/help-docs/features/design-studio-doc.tsx`, tests `canva-next.spec.ts`

## [0.5.32] - 2026-07-05

### Added
- **Magic Resize** — Menu → Magic Resize… (or `Y.magicResize('instagram-story')`) repurposes the whole design to another format in one step: page backgrounds stretch to fill, everything else scales uniformly (fonts included) and keeps its relative page position. Single undo step, all pages together.
- **Installable PWA with full offline support** — service worker (vite-plugin-pwa/workbox) precaches the app shell (~9 MB, 152 entries), so Yappy cold-loads and works with no network after the first visit; Google Fonts are runtime-cached for offline reuse. Verified with an automated offline cold-load check against the production build.
- **Version history** — automatic local snapshots every ~3 minutes while editing (newest 15, IndexedDB), plus manual "Snapshot now"; Menu → Version History… lists and restores them (`Y.snapshotVersion/listVersions/restoreVersion/deleteVersion`).
- **Recents grid** — the Open Drawing dialog is now a thumbnail grid sorted by most recently saved (thumbnails cached client-side at save time).
- **Magic Edit (AI)** — right-click an image → describe a change ("remove the person on the left") and the image is repainted via OpenAI image edits (`Y.magicEditImage(instruction)`).
- **Magic Expand (AI)** — outpaint an image beyond its borders (+25% all sides, wider, taller, or custom guidance); the element grows by the same margins so the subject stays in place (`Y.expandImage({left, right, top, bottom, prompt})`).
- **AI Design generation** — Menu → AI Design… turns a text brief into a ready-to-edit design document (headline, subhead, bullets, CTA pill, harmonious palette) laid out proportionally for any page size; works with any configured LLM provider (`Y.generateDesign(brief, sizeOrPreset)`).

### Changed
- Design-studio help doc covers Magic Resize, version history/recents, Magic Edit/Expand, AI Design, rich-text bullet/numbered lists, and PWA install/offline; Help search keywords updated for all of it.

### Fixed
- **Google Fonts picker: hover contrast + keyboard navigation (user-reported)** — the Done button now keeps AA contrast on hover in light and dark themes (fixed indigo instead of a brightness filter over the theme accent), and the list supports ↑/↓ arrow navigation from the search box with Enter applying the focused font (panel stays open, rows scroll into view, hover syncs the focus).

- Files: `frontend/src/utils/magic-resize.ts`, `frontend/src/storage/{version-history,doc-thumbnails,auto-save}.ts`, `frontend/src/components/{version-history-dialog.tsx,version-history-dialog.css,file-open-dialog.tsx,file-open-dialog.css,menu.tsx,design-size-dialog.tsx}`, `frontend/src/ai/{canva-ai.ts,design-generator.ts}`, `frontend/src/utils/context-menu-builder.ts`, `frontend/src/api.ts`, `vite.config.ts`, `frontend/public/pwa-{192,512}.png`, tests `canva-next.spec.ts`

## [0.5.31] - 2026-07-05

### Added
- **JPG in the Export dialog** — JPG joins PNG/SVG/PDF/PPTX/video, with scale (1–3x) and Current Page Only support (always exports on a white background; `exportPageToPng(i, scale, download, 'jpeg')` on the API).
- **Set as Page Background / Detach Image from Background** — right-click a selected image → *Set as Page Background*; right-click empty canvas → *Detach Image from Background* to turn a page's image background back into a movable, croppable image element (`Y.detachBackgroundImage()`).
- **Six frame shapes** — the Elements panel now offers rectangle, circle, triangle, star, heart, and hexagon photo frames (was rect/circle).
- **Glitch text effect** — cyan/magenta chromatic-aberration preset alongside Shadow/Lift/Hollow/Splice/Outline/Echo/Neon/Background.
- **Aspect-ratio crop presets** — while cropping an image: Free, 1:1, 4:5, 3:4, 16:9, 9:16. Presets snap to the largest centered rect and lock the ratio during handle drags.
- **Template search + size suggestions** — the template browser has a free-text search (name/tag/description, all categories); in a design document, templates matching the page size or aspect ratio sort first with a "✓ fits" badge, and picking a size in New Design… opens the browser automatically (`Y.searchTemplates(q)`).
- **Stock photo orientation filters + drag-to-canvas** — All/Landscape/Portrait/Square chips on the Photos tab; results can be dragged onto a frame/shape (fills it), an image (replaces it), or empty canvas (inserts at the drop point).

### Changed
- **Google Fonts picker stays open for previewing** — it now docks to the right without a backdrop; each click applies the font to the selection live (marked "✓ applied") so fonts can be compared back-to-back. Close with Done, Esc, or ✕. (User-reported UX issue.)

- Files: `frontend/src/components/{export-dialog,template-browser,elements-panel,google-fonts-dialog,property-panel,canvas,menu}.tsx`, `frontend/src/utils/{export,image-crop-utils,stock-photos,context-menu-builder,tool-handlers/canvas-event-handlers}.ts`, `frontend/src/store/app-store.ts`, `frontend/src/config/text-effect-presets.ts`, `frontend/src/shapes/renderers/text-renderer.ts`, `frontend/src/api.ts`

## [0.27.25] - 2026-06-12

### Added
- **Partial erase for any shape** — the eraser now removes just the part you drag over on *any* shape (rectangle, circle, polygon, image, text, table…), not only freehand strokes. It's **non-destructive**: the shape keeps its type and stays fully editable (resizable, recolorable) — erased regions are stored as a mask and punched out at render time via `destination-out` compositing, so both fill and stroke disappear under the brush. Undo reverses each drag. Connectors (line/arrow/bezier) are still erased whole, and freehand strokes keep their existing split behavior. Raster exports (PNG/JPEG/PDF) include the erased holes automatically (SVG export does not yet). Exposed on the `window.Yappy` API via `eraseStrokes`.
- **Adjustable eraser width** — a new **Eraser Width** slider appears in the properties panel while the eraser tool is active. It defaults to the current stroke width and is remembered across sessions. A larger brush also reaches shapes it overlaps, not just the one directly under the cursor.

### Fixed
- **Erased regions now track the shape on resize** — previously, resizing a partially-erased shape left the holes at their original size/position so the shape looked wrong; the erase mask now scales with the shape (and through flips). Clicking/selecting *through* an erased hole is also treated as a miss (hole-aware hit-testing).

## [0.27.24] - 2026-06-11

### Added
- **Fill any shape with an image, clipped to its outline** — `fillStyle: 'image'` now works for shapes (circle, rectangle, polygon, star, etc.), not just slide backgrounds. Select a shape → **Fill → Image** → upload a file or paste an image URL; the image is clipped to the shape's silhouette (a circle shows a circular crop, a star a star-shaped crop). New **Image Fit** options — Cover (default), Contain, Stretch, Tile — plus an **Image Opacity** slider. Dragging an image file directly onto a shape now fills it (instead of replacing it with a standalone image element); dropping onto an existing image element still swaps its source. Image fills are captured in PNG/JPEG/PDF/SVG exports since they share the same render pipeline. Implemented via a new `applyImageFill` in `RenderPipeline` (clips to `getShapeGeometry`, draws with cover/contain math) and a `clipPath` primitive on the renderer for path-based shapes; exposed through the `window.Yappy` API (`backgroundImage`, `backgroundImageFit`, `backgroundOpacity`). The Image fill option and its controls are hidden for 3D shapes (`solidBlock`, `cylinder`, `isometricCube`, `perspectiveBlock`, `openBox`), where image fill has no visible effect (they paint gradients per-face and have no per-face image path).

## [0.27.23] - 2026-05-27

### Added
- **Pin the color palette to keep it open** — added a pin/unpin toggle inside the palette popover (next to the PALETTE dropdown). When pinned, the popover stays open on outside clicks and auto-reopens on app load. State is persisted in `localStorage('palettePinned')`. `Esc` closes the popover even when pinned (without unpinning), so a quick "get it out of the way" gesture still works.

## [0.27.22] - 2026-05-27

### Added
- **Global palette: click swatch to set current stroke color** — the top-right palette popover now interprets clicks via a Shift modifier: **plain click = stroke**, **Shift+click = fill**. Each click arms the corresponding default (`defaultElementStyles.strokeColor` / `backgroundColor`, persisted to localStorage) so future drawings inherit it, and also applies the color to any current selection (or slide background, for fill on slide docs). Drag-and-drop is unchanged. The palette button now shows a small color dot reflecting the currently armed stroke color. Image swatches always behave as fill (no stroke equivalent).

## [0.27.21] - 2026-05-22

### Fixed
- **Mermaid `sequenceDiagram` import failed with "YSL lexer error" on Unicode arrows** — `parseDSL` routed input to the YSL parser before the Mermaid adapter. `isYSLScript`'s heuristic flagged any line starting with `end`/`for`/etc., and Mermaid sequence diagrams legitimately contain `end` (closing `loop`/`alt`/`opt`). The YSL lexer then crashed on the first non-ASCII char it didn't recognise (e.g. `→` in an edge label). Reordered so the Mermaid adapter — whose `canParse` requires a strict diagram header — runs before the YSL heuristic.
- **Mermaid `sequenceDiagram` rendered all messages overlapping on one horizontal line** — the sequence layout only positioned the lifeline nodes; edges fell through to the default `connect()` routing, which computes each connector by intersecting source-center → target-center against the source/target bounding boxes. With every lifeline at the same Y, every message resolved to the same horizontal line. Added a sequence-specific edge renderer `renderSequenceEdge` that places each message as a standalone arrow at `y = sourceLifelineTop + headerHeight + topPadding + i * vSpacing`, with self-messages (`A->>A`) drawn as a 3-segment elbow U-loop. Lifelines also now share a uniform tall height so their dashed bodies align.
- **Lifeline header-box absurdly tall on long sequence diagrams** — `umlLifeline` sized its head-box as `max(30, h * 0.2)`, so making a lifeline tall enough for many messages (e.g. `h = 1400`) gave it a ~280 px header. Capped at 60 px (`min(60, max(30, h * 0.2))`). Backward-compatible: for `h ≤ 300` (all existing usage), the cap is a no-op.
- **Participant labels overflowed above/below the lifeline head-box** — two layered bugs: (a) the generic `fitShapeToText` targeted a square-ish aspect ratio and produced narrow lifelines that forced labels to wrap into 3–4 lines that overflowed the 60 px head-box upward; (b) the autosize measured text at 16 px while `getFontString` defaulted to 28 px when `fontSize` was undefined, so a 2-line wrap at render time was ~67 px and overflowed the head-box downward. Fixed by giving `umlLifeline` a custom autosize path that measures with the renderer's actual font string and picks a width that wraps into ≤ 2 lines, plus setting `fontSize: 16` on lifeline nodes in the Mermaid sequence parser so 2 lines come in at ~38 px and fit cleanly inside the 60 px head-box.

## [0.27.19] - 2026-05-20

### Fixed
- **Two-finger gesture preempted by pen-tool stroke** — when a pen-drawing tool (fineliner/marker/ink/inkbrush) was selected and the user started a 2-finger gesture, the first finger's touchstart immediately created a stroke via the TouchEvent path. The gesture handler then bailed out because `touchDrivingPenStroke` was true, so the second finger's contact did nothing and the user saw a stray short stroke instead of a pan/pinch.
  - Removed the `touchDrivingPenStroke` early-return in `handleTouchStartGesture`. Now any 2-finger landing engages the gesture regardless of whether finger 1 already kicked off a stroke.
  - `cancelInflightForGesture` now captures `pState.currentId` BEFORE calling `finalizeTouchStroke`, then deletes the resulting element from the store. Result: the brief stray stroke is wiped, the canvas just pans/pinches as intended.
  - Apple Pencil drawing remains protected: stylus contacts are filtered out by `pickFingerTouches`, so a Pencil + palm-rest still has finger-count of 1 and the gesture doesn't engage.

## [0.27.18] - 2026-05-20

### Added
- **Two-finger pan + pinch-zoom on iPad / touch devices** — the canvas now responds to two-finger drag (pans by centroid delta) and pinch (zooms around the centroid, clamped 0.1×–10×), matching Figma/FigJam/Freeform conventions on iPad. Single-finger interactions (Apple Pencil drawing, stylus + palm rejection, tap-to-select) are unaffected: contacts are filtered by `touchType` so a stylus + palm-rest never registers as 2 fingers, and the pen-drawing TouchEvent path still wins for single-stylus strokes.
  - Gesture handlers register before the pen-drawing touch handlers so they observe 2-finger touchstarts first and can `preventDefault()` before a stroke begins.
  - When the second finger lands ~50ms after the first (the typical case), any draft element the first finger's synthetic `pointerdown` already created is removed directly via `setStore` — no `pushToHistory`, since the user never intended to draw. Drags of pre-existing elements aren't undone; the element stays at the current cursor position.
  - A cooldown flag blocks new single-touch interactions until all fingers lift, preventing the leftover finger from immediately starting a stroke when the user releases one finger of two.
  - Pinch math anchors the previous centroid (not the current one) so the world point under the centroid stays under it through each zoom step — no drift during combined pan+pinch.

## [0.27.16] - 2026-05-07

### Fixed
- **Ink Brush — earlier strokes appeared lightened/erased where a new stroke crossed them (iPad-visible)** — `renderInkbrush` built one closed polygon per stroke (left edge forward → end-cap arc → right edge reversed → start-cap arc) and filled it once. With smoothed edges and `quadraticCurveTo` on both sides, that polygon could self-intersect on curvy strokes. Under the canvas default `nonzero` fill rule, regions with even winding count don't fill — leaving small holes inside the new stroke. Where a hole landed over an earlier stroke, the canvas behind bled through and the earlier stroke read as "lightened/erased" at the overlap. Fineliner uses `stroke()` and was unaffected.
- Replaced the single-polygon-and-fill with per-segment trapezoids + per-point joint circles, each rendered with its own `beginPath() + fill()`. Independent opaque fills compose cleanly via `source-over` — overlap regions stay opaque regardless of how often the stroke crosses itself or earlier strokes, no winding-direction interactions to worry about. Variable width and velocity-based taper preserved. Joint circles also serve as round start/end caps.

## [0.27.14] - 2026-05-06

### Fixed
- **iPad alternate-empty-stroke pattern (1, _, 3, _, 5, ...) — touchend self-heal** — user reported the symptom is strict alternation: "I write 1, 2, 3, 4, 5 and only 1, 3, 5 appear". Strict alternation means stroke 2's `touchstart` IS reaching the handler — but my handler was bailing on `pState.isDrawing === true`, which means stroke 1's `touchend` had not finalized properly, leaving the flag stuck.
  - On iPad, `touchend` events sometimes don't carry our tracked touch identifier in `changedTouches` (the gate I added in v0.27.11 to ignore palm lifts). When that gate dropped a legitimate touchend, `pState.isDrawing` and `touchDrivingPenStroke` stayed true, blocking the next stroke entirely.
  - Removed the gate: `handleTouchEnd` now finalizes the stroke unconditionally when `touchDrivingPenStroke` is true. iPadOS's system-level palm rejection means non-pen touches don't reach us when an Apple Pencil is paired, so the gate was unneeded.
  - Added a self-heal in `handleTouchStart`: if a previous stroke is somehow still in flight when a new `touchstart` arrives, force-finalize before starting the new one. A stuck flag from any cause now resolves itself instead of dropping every subsequent stroke.

## [0.27.13] - 2026-05-06

### Fixed
- **iPad Apple Pencil stroke latency — sync flush+draw in touchmove** — the RAF chain (`requestAnimationFrame(flushPenPoints)` then `requestAnimationFrame(draw)`) was adding 1-2 frames of latency between Pencil tip and visible stroke. The reference demo at https://github.com/shuding/apple-pencil-safari-api-test runs `drawOnCanvas(...)` synchronously inside `touchmove` — that's where its low-latency feel comes from. Switched our touchmove to do the same: push to buffer → `flushPenPoints()` (sync) → `draw()` (sync). With v0.27.12's O(1) reactive cascade, this fits inside a frame at typical doc sizes; the display compositor picks up the new canvas state at next vsync.

## [0.27.12] - 2026-05-06

### Fixed
- **iPad Apple Pencil stroke latency on both Safari and Chrome** — the canvas's main redraw effect was iterating every element and reading 80+ properties on each (`store.elements.forEach(e => { e.x; e.y; ...; e.bpmnEventType; ... })`) to subscribe to all possible property changes for redraw triggering. At Apple Pencil's ~120 Hz event rate that proxy-property iteration dominated per-frame cost on iPad and produced the visible stroke lag the user reported (consistent across Safari and Chrome on iPad — both use WebKit on iOS, so the bottleneck is engine-wide). The reference demo at https://github.com/shuding/apple-pencil-safari-api-test runs smoothly because it has no reactive system at all.
- Replaced the per-element property iteration with a single dependency on `store.dirtyRevision`, bumped by `updateElement` / `addElement` / `deleteElements`. The redraw effect now sees one dep change per mutation instead of N elements × ~80 property accesses. Cost drops from O(elements × properties) to O(1) per mutation. The redraw still fires on every change — the mechanism is just a coarse counter instead of granular property reads.

## [0.27.11] - 2026-05-06

### Fixed
- **iPad Apple Pencil multi-touch handling — palm + pen no longer drops strokes** — v0.27.9's TouchEvent handler bailed when `e.touches.length !== 1`, which blocked stroke-start whenever the palm was on the screen alongside the Pencil. Now picks the `touchType: 'stylus'` Touch from the changedTouches list (Apple Pencil reports `'stylus'`, finger reports `'direct'`), tracks it by `identifier` across the whole stroke, and ignores moves/ends for any other touch (palm shifting, palm lift). This is the working pattern from https://github.com/shuding/apple-pencil-safari-api-test made multi-touch-safe.
- **Stroke draw cadence on TouchEvent path** — match the pointer-path RAF schedule: call `requestAnimationFrame(draw)` on every `touchmove` so the visible stroke keeps pace with the pen tip. Multiple RAFs in the same frame coalesce to a single draw.

## [0.27.10] - 2026-05-06

### Fixed
- **Apple Pencil hover triggered drawing** — Apple Pencil 2 / Pro report hover-near-screen as `pointermove` events with `pointerType: 'pen'` and `pressure: 0`. The v0.27.8 pointermove recovery branch synthesized a `drawOnDown` from any pen pointermove without an active stroke, which made strokes appear from the pen's hover before it actually touched. Removed that recovery — v0.27.9's TouchEvent path is the load-bearing fix for missed pointerdowns; the pointermove synthesizer was a redundant safety net that turned out to be hover-active.

## [0.27.9] - 2026-05-06

### Fixed
- **iPad Apple Pencil pen-tool drawing now uses TouchEvents instead of PointerEvents** — root-cause traced via the user's reference to https://github.com/shuding/apple-pencil-safari-api-test, which works perfectly on iPad+Pencil and uses TouchEvents (not PointerEvents). iPad Safari's PointerEvent delivery for Apple Pencil is unreliable on rapid lift+recontact — the OS swallows alternate `pointerdown` events for gesture-detection windows. TouchEvents are unaffected.
  - Added native `touchstart` / `touchmove` / `touchend` / `touchcancel` listeners on the canvas (registered with `passive: false` so `preventDefault()` works).
  - For pen-drawing tools (fineliner, inkbrush, marker, ink), TouchEvents drive the entire stroke: `touchstart` → `drawOnDown`, `touchmove` → buffer points + RAF flush, `touchend` → `drawOnUp`.
  - A `touchDrivingPenStroke` flag tells the existing pointer handlers to skip cleanly when TouchEvents are in flight, preventing double-handling on iOS where both event families fire for the same physical contact.
  - For non-drawing tools (selection, pan, eraser, shapes, etc.) and for desktop mouse, PointerEvents continue to handle everything as before.

## [0.27.8] - 2026-05-06

### Fixed
- **iPad Apple Pencil double-tap gesture swallowing alternate `pointerdown` events** — diagnosed via the user's report that finger and mouse work fine, only Apple Pencil fails on rapid lift+recontact. When iPadOS detects a possible Apple Pencil side-tap gesture (the system shortcut that toggles tools), it can suppress the alternate `pointerdown` event from reaching JavaScript. The `pointermove` and `pointerup` events for that stroke still fire — but `isDrawing` is false (because `drawOnDown` never ran), so `handlePointerMove` early-returns and the whole stroke disappears.

  Added a recovery path: when a pen `pointermove` fires with `pressure > 0` while a pen-drawing tool is active and no stroke is in flight, synthesize the missed `drawOnDown` from the move's coordinates. The stroke starts ~1 pointermove later than ideal but the first sample lands within the same animation frame, so the visible offset is invisible. This is a workaround for an iPadOS-level event suppression we can't otherwise prevent from web code.

## [0.27.7] - 2026-05-06

### Fixed
- **iPad alternate-stroke loss with Apple Pencil — defensive layer** — even after v0.27.6's history-snapshot fix, the user reported every-other-stroke still going empty when writing fast with the pen lifting between letters. Several plausible failure modes that all trigger only on rapid pen lift+contact:
  - **`setPointerCapture` throwing `InvalidStateError`** when the previous stroke's pointer hasn't been fully released by the time the next `pointerdown` fires. A throw here aborts `handlePointerDown` before `drawOnDown` runs and the stroke is silently lost. Wrapped `setPointerCapture` and `releasePointerCapture` in try/catch.
  - **Palm-rejection 700 ms grace window** rejecting legitimate Apple Pencil pointerdowns that iPad Safari occasionally ships as `pointerType: 'touch'`. Even with the v0.27.4 width heuristic, edge cases (no width reported, pressure 0) slipped through. Removed the time window — we now only filter touch events when a pen is **currently** in contact, not "was recent". iPadOS does its own system-level palm rejection for paired Apple Pencils, so this is a safety net rather than the primary defense.
  - **`penUpdatePending` RAF flag stuck `true`** between strokes if the previous stroke's RAF hadn't fired yet by the time the next stroke started. Doesn't lose data (the stale RAF eventually flushes), but it can delay visual updates. Reset to `false` on every `pointerdown` to start each stroke clean.

## [0.27.6] - 2026-05-06

### Fixed
- **iPad alternate-stroke loss with Apple Pencil — real root cause** — turned out the palm-rejection heuristic in v0.27.4 wasn't the actual fix needed. Every `addElement` (i.e. every stroke start) calls `pushToHistory()`, which deep-cloned the entire document via `JSON.parse(JSON.stringify(...))`. On iPad with many existing strokes that's 50-100 ms per call — long enough to block the main thread and cause Safari to drop the next stroke's `pointerdown` while writing fast. Replaced with a structural-share shallow snapshot: since every mutation goes through Solid's `setStore` (which replaces references on the modified path), a shallow array copy is enough to preserve immutable history. Snapshot cost goes from O(n × depth) to O(n) — well under a millisecond — and the main thread stays free for incoming pointer events. Slow writing worked before because the thread had time to recover between strokes.

## [0.27.5] - 2026-05-06

### Added
- **Touch-friendly access to per-tool defaults** — every toolbar button (simple tools and tool groups) now responds to **long-press** *and* **double-tap** by opening the property panel for that tool. Combined with desktop right-click, every device has a one-gesture path to a tool's defaults: right-click on mouse, long-press or double-tap on touch. Setting properties there persists per tool, so future strokes/shapes drawn with that tool use those defaults.

### Changed
- Toolbar `handleRightClick` no longer filters on `e.button === 2`. The filter was only added to suppress canvas palm-rest contextmenu, but toolbar buttons aren't a palm-rest target, and the filter was incidentally blocking iPad's native long-press gesture for opening the property panel. Canvas `onContextMenu` keeps its filter — palm-rest there still suppresses the menu.

## [0.27.4] - 2026-05-06

### Fixed
- **iPad alternate-stroke loss with Apple Pencil** — writing fast produced "alternate characters draw, alternate empty". Cause: iPad Safari occasionally misclassifies the first `pointerdown` of a rapid consecutive Pencil tap as `pointerType: 'touch'` instead of 'pen', so v0.27.1's palm rejection blocked it (within the 700 ms post-pen window) and `drawOnDown` never ran for that stroke. Added a contact-area heuristic: a touch event with `width ≤ 5 && height ≤ 5` is treated as a misclassified pen contact (Apple Pencil tip is ~1-2 px; finger is ~25-40 px; palm is 50+ px). Real palm contacts are still rejected.
- **Pointer cancel cleanup** — added an `onPointerCancel` handler that mirrors `pointerup` so iPad system-cancel events (e.g. when iOS interrupts a stroke for a gesture) don't leave the pointer-state machine in `isDrawing: true`.

### Added
- **Canvas Settings menu item** — accessible from the main hamburger menu under "Properties Panel". Previously the only entry point was the canvas right-click context menu, which after the v0.27.1 contextmenu filter requires `e.button === 2` (real mouse right-click) — leaving iPad users with no way to open canvas settings.

## [0.27.3] - 2026-05-06

### Fixed
- **iPad fast-write triggers iOS "Copy / Look Up / Translate" callout** — when writing quickly with Apple Pencil, iOS occasionally misinterpreted the rapid contact as a text-selection gesture and popped its native selection menu. The previous fix only set `-webkit-touch-callout: none` and `-webkit-user-select: none` inline on the `<canvas>`, but the callout could still trigger from rapid contact landing momentarily on the surrounding wrapper or page chrome. Moved the suppression to `html, body` so it inherits everywhere, with an explicit override on `input`, `textarea`, and `[contenteditable]` so editable surfaces keep normal text selection.
- Added `-webkit-tap-highlight-color: transparent` and `overscroll-behavior: none` on `html, body` to suppress iOS's tap flash and bounce respectively. `touch-action` is intentionally left default so scrollable panels (property panel, layer panel, slide navigator, etc.) keep scrolling on touch — only the canvas surface sets `touch-action: none` inline.

## [0.27.2] - 2026-05-06

### Fixed
- **iPad/Apple Pencil dropped strokes and inkbrush flicker** — 0.27.1 removed the 16 ms wall-clock throttle in `pen-handler` and started flushing the points buffer to the store on *every* `pointermove`. At Apple Pencil's ~120 Hz sample rate this saturated the JS main thread on iPad with 120 `setStore`/reactive-cascade cycles per second, which (a) caused intermittent `pointerdown` events to be missed between letters/strokes ("write a letter, next one doesn't appear, third one works"), and (b) made inkbrush render incomplete frames that looked like the stroke was being erased to white. Mouse on desktop was unaffected because mouse fires at ~60 Hz.
- Replaced with RAF-driven flush: coalesced events still capture every Pencil sample (no resolution lost), but the store updates at most once per animation frame. This caps store mutations at the display refresh rate, frees the main thread for incoming pointer events, and matches the existing `requestAnimationFrame(draw)` cadence in `handlePointerMove`.

### Notes
- The drawing latency improvement from 0.27.1 is preserved — points still flow into the buffer immediately, only the store write is deferred to the next animation frame, so the visible stroke is always at most one frame behind the Pencil tip.

## [0.27.1] - 2026-05-06

### Fixed
- **iPad palm rejection** — resting a palm on the screen while drawing with Apple Pencil no longer pops the canvas context menu or a tool's property panel; touch events are filtered while a pen is in flight (or used within the last 700 ms)
- **iPad context menus on long-press** — every `contextmenu` handler (canvas + 17 toolbar/tool-group buttons) now requires `e.button === 2`, so iOS Safari's synthesized long-press contextmenu is silently dropped instead of opening UI
- **Apple Pencil stroke smoothness** — removed the 16 ms wall-clock throttle in `pen-handler`; coalesced events still capture the full ~120 Hz Pencil sample rate but the store now flushes every move and batches naturally with the existing RAF draw, eliminating the extra-frame lag

### Changed
- Canvas surface gains `-webkit-user-select: none` and `-webkit-touch-callout: none` to suppress iOS's own copy/look-up callout during long strokes
- `PointerState` tracks `lastPenInputAt`, `activePenPointerId`, and `lastPointerType` for input-type discrimination

## [0.27.0] - 2026-05-03

### Added
- **System theme** — new `system` choice in the theme cycle (Light → Dark → Focus → System) follows the OS `prefers-color-scheme` and updates live when the OS theme flips, via a `matchMedia` listener at app boot
- **Excalidraw-style dark mode** — `dark` mode now darkens the canvas surface (not just UI chrome) via a `filter: invert(93%) hue-rotate(180deg)` on the host `<canvas>` element; legacy black-on-white drawings render legibly without any stored colors being mutated
- `setTheme(theme)`, `getTheme()`, `getResolvedTheme()` exposed on the public Yappy API

### Changed
- Theme model split into the user's *choice* (`store.theme`: `light | dark | focus | system`) and the displayed *resolved* theme (`store.resolvedTheme`: `light | dark | focus`)
- Stored colors are now treated as **theme-canonical** (light-mode); dark/focus presentation is a pure render-time transform — round-tripping a scene through a theme switch is byte-identical
- Default stroke colors are always canonical `#000000` regardless of theme; dropped the focus-mode white-stroke flip from `setTheme`, `defaultElementStyles` init, `resetDefaultStyles`, and BPMN Pool defaults
- `[data-theme="dark"]` workspace background is now dark for consistency with the inverted canvas (was `#e2e8f0`, now `#1a1a2e`)
- Theme dropdown gains a "System (Follow OS)" option; toggle button shows a `Monitor` icon when system is active
- HTML export resolves `system` to the current OS preference at export time so the exported file ships with a concrete theme

### Migration
- One-time localStorage migration (gated by the `theme-canonical-v1` flag) flips any saved `#ffffff` default stroke/text from older focus-mode users back to `#000000` so they don't draw invisible strokes on the newly inverted canvas

### Known limitation
- The canvas filter also inverts embedded raster images; in dark/focus mode PNGs/JPGs appear color-inverted. Per-image counter-inversion (offscreen pre-invert before `drawImage`) is the planned follow-up — TODO marker is in `frontend/src/components/canvas.tsx`

## [0.26.2] - 2026-03-25

### Added
- **Quick Tool Finder** — press `/` to instantly search and select any of 160+ shapes and tools; fuzzy search by name (e.g. "api gateway", "uml class", "database"); `Ctrl+K` command palette now also includes all shapes
- Help dialog updated with `/` shortcut

## [0.26.1] - 2026-03-25

### Added
- **containerText Vertical Align** — `verticalAlign` property (top/middle/bottom) now works for text inside shapes; previously ignored, always centered
- **Arrow Anchor Align** — new `arrowAnchorAlign` property (top/middle/bottom) on shapes; controls where the API Gateway inner arrow renders and where bound connectors attach on left/right edges
- **Property panel entries** — both Vertical Align and Arrow Align are now exposed in the property panel (text and dimensions groups respectively)
- **Learn-to-Draw tutorial** — article covering HLD, sequence, flowchart, DFD, component, ER diagrams with 7 companion Yappy diagram files

### Fixed
- **containerText overlapping arrows** — shapes with bound arrows had text rendering at vertical center, overlapping connector paths; verticalAlign now lets users position text away from arrows
- **arrowAnchorAlign real-time update** — added property to canvas reactive tracking so changes reflect immediately without requiring shape move
- **API Gateway inner arrow alignment** — the decorative arrow inside `apiGateway` shape now respects `arrowAnchorAlign` in both architectural and sketch render paths

## [0.25.9] - 2026-03-18

### Fixed
- **Backend path traversal guard** — `startsWith(DATA_DIR)` was bypassable for sibling paths sharing the `data` prefix (e.g. `../data2/secrets`); now compares against `DATA_DIR + path.sep`
- **Slide deletion orphans elements** — deleting a slide now removes elements whose centers lie within the slide's spatial bounds, matching the ownership model used by `duplicateSlide`
- **Undo/redo snapshots incomplete** — history snapshots now capture `slides`, `states`, `gridSettings`, `canvasBackgroundColor`, and `docType` so undo truly restores full document state
- **Autosave misses silent edits** — slide transition/background changes and display state mutations now trigger autosave via a `dirtyRevision` counter; `states.length` also tracked
- **Layer duplication stale bindings** — duplicated elements now get remapped `startBinding`, `endBinding`, `boundElements`, and `parentId` references (same pattern as `duplicateSlide`)

## [0.25.8] - 2026-03-17

### Added
- **Image Deep Mode** — 2-stage agentic vision pipeline for converting complex diagram images/screenshots into accurate YappyDraw diagrams; Stage 1 (Vision Analyst) deeply analyzes the image to extract every node, text label, color, hierarchy level, and connection into structured research JSON; Stage 2 (Diagram Composer) converts the research into a properly laid-out diagram — reuses the existing text Deep Mode composer
- Deep Mode checkbox now available for sketch/image uploads (not just text prompts)
- Progress feedback for image deep mode ("Analyzing image deeply..." → "Composing detailed diagram...")

### Improved
- **Auto-sizing nodes to fit text** — DSL-rendered nodes now automatically compute text-fitted dimensions using offscreen canvas measurement before layout; shapes expand to contain their labels instead of using fixed defaults, producing cleaner diagrams across all modes (quick, deep, sketch)
- **Brainstorm Mode** — toggle on the toolbar to switch between full toolbar (16 tool groups) and a compact 10-tool flat bar (Selection, Pen, Line, Arrow, Rectangle, Diamond, Ellipse, Text, Image, Eraser); defaults to brainstorm mode; preference persisted in localStorage; all hotkeys work in both modes

## [0.25.7] - 2026-03-06

### Added
- **AI Drawing Deep Mode** — 2-stage agentic pipeline for generating richer, more detailed technical diagrams; Stage 1 (Research Agent) deeply analyzes the topic's architecture, components, data flows, and internals; Stage 2 (Diagram Composer) converts the research into a color-coded, multi-layered diagram with 20-50 nodes; ideal for complex topics like Node.js event loop, Elixir BEAM VM, Kubernetes architecture, etc.
- Deep Mode checkbox with BrainCircuit icon in AI Drawing dialog
- Real-time progress feedback during deep generation ("Researching topic deeply..." → "Composing detailed diagram...")

## [0.25.6] - 2026-03-05

### Fixed
- **AI Drawing / DSL import adds to existing slides** — when using AI Drawing or DSL import with "Clear canvas" on a slide document, elements were added into the existing slide deck instead of starting fresh; now resets to a clean infinite canvas before rendering

## [0.25.5] - 2026-03-05

### Fixed
- **Slide panel drag-to-rearrange not working** — global drag-and-drop handlers (for image file drops) registered on window capture phase were intercepting all drop events with `stopPropagation()`, preventing the slide navigator's drop handler from firing; added early-return guards so the slide navigator and layer panel handle their own drag-to-rearrange events

## [0.25.4] - 2026-03-05

### Added
- **Elixir BYOF slide deck** — 42-slide presentation covering "Build Your Own Elixir Phoenix + LiveView Framework" tutorial (40 steps from TCP socket to production deployment)

### Fixed
- **Presentation mode: clicking locked elements now advances slide** — in slide view (F5), clicking on locked elements was selecting them instead of advancing to the next slide; locked elements now pass through to slide navigation while unlocked elements (annotations, ink) remain interactive

## [0.25.3] - 2026-03-02

### Added
- **Toolbar hotkey badges** — small numeric indicators on toolbar buttons showing keyboard shortcut at a glance
- **Reordered toolbar hotkeys** — numeric shortcuts (1-0) now match the toolbar's left-to-right visual order: Selection(1), Rectangle(2), Diamond(3), Ellipse(4), Arrow(5), Line(6), Pen(7), Text(8), Image(9), Eraser(0)

### Fixed
- **High CPU usage on idle canvas** — animation engine rAF loop kept running for paused/idle animations; SolidJS time signals updated every frame triggering continuous 60fps redraws; ink cleanup interval ran every 500ms forever; cursor position store writes unthrottled at 60+/sec; recording manager thumbnail effect tracked entire elements proxy
- **Flow animation reverse shows solid dark line** — JavaScript negative modulo caused all pulse positions to render when direction was reversed, producing a solid line instead of animated dashes
- **Auto-grow text element height while typing** — text elements now expand vertically as content grows
- **Line/connector text editing and auto-highlight** — improved text editing UX on lines and connectors
- **Lasso and Crop tools moved to end of toolbar** — better toolbar organization

## [0.23.6] - 2026-02-26

### Fixed
- **Animation state not restored on presentation exit** — exiting slideshow left elements in mid-animation positions (moved, rotated, faded) because only startHidden opacity was restored, not animated properties; now captures full element state before entering presentation and restores after stopping all animations on exit
- **Slide drag-to-reorder loses active slide data** — `reorderSlides()` was missing `saveActiveSlide()` call, causing active slide background/dimensions/thumbnail to be lost during reorder
- **Slide operations lack undo support** — added `pushToHistory()` to `addSlide`, `insertNewSlide`, `deleteSlide`, and `reorderSlides` so all slide operations can be undone with Ctrl+Z
- **Deleting active slide leaves stale canvas state** — `deleteSlide()` called `setActiveSlide(nextIndex)` but when the index didn't change, it returned early leaving stale background/dimensions; fixed by invalidating the active index before re-setting it

## [0.23.5] - 2026-02-24

### Added
- **Sketch-to-Diagram (AI Vision)** — upload, paste (Ctrl+V), or drag-drop a hand-drawn sketch or photo into the AI Drawing dialog; the LLM's vision capabilities analyze the image and generate a matching YappyDraw diagram using the correct domain shapes (flowchart, architecture, UML, BPMN)
- **Vision support for all three AI providers** — OpenAI, Gemini, and Anthropic all support image input with provider-specific multi-part content formatting
- **Image preprocessing** — uploaded images are automatically resized (max 2048px) and compressed (JPEG 0.85) to stay within API limits; retries at 1024px if result exceeds 4MB
- **Sketch + text prompt** — optionally add a text description alongside the sketch to guide the AI conversion
- **Relative shape sizing preserved** — vision prompt instructs the AI to set explicit width/height on nodes when shapes in the sketch differ noticeably in size
- **Center-aligned text by default** — AI-generated shapes now have `textAlign: "center"` in their style so labels are centered

### Fixed
- **Sketch upload immediately cleared** — `clearSketch()` read `sketchPreview()` inside a `createEffect`, causing SolidJS to track it as a dependency; uploading an image triggered the effect which immediately cleared it; fixed with `untrack()`

## [0.23.4] - 2026-02-24

### Fixed
- **zoomIn/zoomOut animations not working on text elements** — zoom animations modified width/height which doesn't visually scale text (text renders at fixed fontSize); added `renderScale` property with canvas-level `ctx.scale()` transform so text elements zoom correctly via renderScale+opacity instead of width/height
- **Slide panel not visible after localStorage restore** — auto-save skip guard `elementCount === 0` prevented restoring slide documents with no drawn elements; added `docType` and `slideCount` to auto-save metadata so the skip check distinguishes slides-mode documents from truly empty canvases
- **Presentation numbering absent after restore** — same root cause as above; the `<Show when={docType === 'slides'}>` wrapper hid both SlideNavigator and PresentationControls when docType stayed as 'infinite'
- **Slide order drift on load** — normalized slide `order` property to match array index in `loadDocument()` to prevent ordering inconsistencies
- **activeSlideIndex out-of-bounds on restore** — added bounds validation against `store.slides.length` when restoring saved slide index from auto-save metadata

## [0.23.3] - 2026-02-23

### Fixed
- **Text animations not rendering** — text animations (typewriter, wordByWord, textScramble, lineByLine) were invisible because the renderer prioritized `richText` spans over plain `text`; animations now temporarily clear richText during playback and restore on completion
- **Duplicated slide not visible** — duplicated slides inherited the source's `lastViewState` viewport pointing at the wrong spatial position; cleared `lastViewState` on duplicate to force recalculation
- **Canvas not redrawn when switching slides** — added `store.activeSlideIndex` to the canvas `createEffect` reactive dependency list
- **Environment variables not loaded** — added `envDir: '..'` to vite.config.ts to load `.env.local` from project root
- **Active slide styling improved** — enhanced the active slide highlight in the slide panel

## [0.23.2] - 2026-02-23

### Fixed
- **Dialogs still close when selecting text on Windows/Chrome** — on Windows/Chrome, drag-selecting text inside dialogs where the mouse drifts slightly onto the overlay backdrop still triggered dialog close despite the v1.23.1 fix; added `!window.getSelection()?.toString()` check to all 15 overlay `onClick` handlers to prevent closing when text is selected; also fixed 4 missed dialogs (text-editor-modal, rocket-settings-dialog, command-palette, menu backdrop) that had no `e.target === e.currentTarget` guard at all

## [0.23.1] - 2026-02-23

### Fixed
- **Dialogs close when selecting text** — all 11 modal dialogs (AI Drawing, Import from Text, Templates, Settings, Help, Export, Save, Load, Cloud Storage, AI Settings, File Open) closed unexpectedly when clicking inside textareas to select or edit text; added `e.target === e.currentTarget` guard to overlay click handlers so dialogs only close on direct backdrop clicks

## [0.23.0] - 2026-02-22

### Added
- **AI Rocket Mode** — "Generate for Rocket Backend" checkbox in the AI Drawing dialog teaches the LLM entity field syntax, state diagram shapes, BPMN containerText conventions, and relation cardinality for Rocket-exportable diagrams
- **One-Click Deploy to Rocket** — "Deploy to Rocket" option in the export dialog that authenticates, creates the app if missing, and imports the full schema (entities + state machines + workflows) in one step
- **Rocket Settings Dialog** — persistent connection settings (URL, email, password, app name) stored in localStorage with base64 obfuscation; includes "Test Connection" button
- **BPMN Workflow Exporter** — converts BPMN diagrams (start events, service tasks, user tasks, gateways, end events) to Rocket workflow schema with trigger config, field assignments, webhooks, and approval flows
- **UML State Machine Exporter** — converts UML state diagrams (stateStart → state → stateEnd with transition labels) to Rocket state machine schema with events, guards, and effects
- **UML Compartmented Renderers** — `umlEnum` and `umlInterface` shapes with scrollable sections and draggable dividers; `umlState` scroll support; default text for all UML shapes
- **UML Class Enhancements** — scrollable sections, draggable section dividers, MCP server integration, Rocket entity export from class attributes
- **Shape Aliases** — `state-start`, `state-end`, `state-sync` aliases for AI-friendly kebab-case naming
- **Rocket Feature Flag** — `VITE_ENABLE_ROCKET_EXPORT` env variable to toggle all Rocket UI (export, deploy, AI checkbox, settings)

### Changed
- **Monorepo Reorganization** — project restructured into `frontend/` + `backend/` directories

### Fixed
- **Toast messages hidden behind slide toolbar** — raised toast `z-index` from 2000 to 10010, above all toolbars (10002) and presentation controls (10000)
- **Rocket UI not gated behind feature flag** — wrapped AI dialog checkbox, Rocket Settings link, and RocketSettingsDialog behind `features.enableRocketExport`
- **Leading whitespace lost in text rendering** — preserved leading whitespace in text element rendering

## [0.22.0] - 2026-02-17

### Added
- **Line/Arrow/Bezier Refactor** — lines and arrows now get default cubic bezier control points at creation (1/3 and 2/3 along the line), enabling smooth curves without manual conversion
- **Double-Click Text Editing on Lines/Arrows** — lines and arrows now support double-click to edit containerText, with connector-aware sizing in the text overlay

### Fixed
- **Control point real-time preview** — dragging control points on bezier curves now updates the canvas in real-time; added `controlPoints`/`curveType` to SolidJS reactive tracking and `requestAnimationFrame` call to drag handler
- **Elbow line too many bends** — replaced multi-bend algorithm (BEND_THRESHOLD=15) with clean L-shaped path producing exactly 1 bend; eliminates mouse wobble artifacts during interactive drawing
- **Text jumping when editing standalone text** — switched from `translate(-50%, -50%)` to top-left anchoring with computed vertical padding matching canvas renderer formula
- **Text jumping when editing containerText on shapes** — extended top-left anchoring to container shapes with `measureContainerText()` metrics and shape-specific Y offsets (doubleBanner, starPerson, lightbulb, signpost, UI shapes)
- **Double border during text editing** — canvas renderer now skips text drawing when `isEditing` flag is set on element
- **Consistent fontSize default** — unified all text element creation paths to use `store.defaults?.fontSize ?? 20`
- **Text drag preview** — replaced distracting dashed outline with subtle semi-transparent fill
- **Rich text bullet lists** — fixed bullet list rendering, indentation, text color, and drag visibility
- **Invisible text elements** — added `textColor: '#000000'` default to prevent transparent text on newly created elements
- **Puzzle piece architectural renderer** — normalized negative dimensions in connection-rel renderer to fix shapes becoming invisible when dragged left/upward

## [0.21.0] - 2026-02-17

### Added
- **AI Drawing Engine** — generate entire diagrams from natural language prompts via LLM (OpenAI, Google Gemini, Anthropic); accessible via menu or `Ctrl+Shift+A`

### Fixed
- **Arrow connections for BPMN/UML shapes** — added BPMN events to ellipse intersection, gateways to diamond intersection, and default bounding-box fallback for all unrecognized types
- **Stable anchor bindings** — `connect()` API now computes `anchorFractionX`/`anchorFractionY` for precise, stable bindings
- **Puzzle piece invisible on drag-left** — normalized negative dimensions in architectural renderer

## [0.20.0] - 2026-02-16

### Added
- **RichText Font Selection** — font family picker available in property panel, quick toolbar, and inline editing mini toolbar for RichText elements
  - Per-span font switching via **F** button in the rich text mini toolbar (8 fonts: Virgil, Caveat, Marker, Inter, Poppins, Merriweather, Source Code Pro, JetBrains Mono)
  - Property panel now shows fontSize, fontFamily, fontWeight, fontStyle, and textAlign for RichText
  - Font family round-trip: `htmlToSpans` now parses `font-family` styles and `<font face>` tags back to internal keys

## [0.19.1] - 2026-02-16

### Fixed
- **Canvas background bleed between documents** — `loadDocument` now resets `canvasBackgroundColor` to default before applying theme and slide backgrounds, preventing previous document's background from persisting into newly loaded/created documents

## [0.19.0] - 2026-02-16

### Added
- **Layer Lock Toggle** — inline lock/unlock button in each layer row for quick access (previously context-menu only)

### Fixed
- **HTML export missing fonts** — standalone player now includes Google Fonts `<link>` tags for all 8 font families (Caveat, Handlee, Inter, JetBrains Mono, Merriweather, Permanent Marker, Poppins, Source Code Pro)
- **First slide animation not playing on export open** — exported HTML player now initializes `slideBuildManager` for on-load animations with proper timing after Canvas mount
- **Manual arrow start point drift** — start binding fractions are now always computed regardless of end binding, preventing start point from shifting when connected shapes move

## [0.18.0] - 2026-02-16

### Added
- **Stable Connector Anchoring** — fraction-based positioning system for precise connector endpoints:
  - `anchorFractionX`/`anchorFractionY` (0-1) stored per binding for sub-anchor precision
  - Connectors maintain exact relative positions when shapes are moved
  - Resolution priority: fractions > named anchor > edge intersection fallback
  - Raw mouse position tracking for unique per-connector fractions
- **Auto-Spread Overlapping Connectors** — perpendicular offset for sibling connectors sharing identical anchor positions
- **Connector Handle Arrow Default** — drag-to-connect icon now creates arrows (with arrowhead) instead of plain lines
- **Smart Partial Eraser** — freehand stroke eraser that splits strokes at the eraser path
- **Flow Animation Reverse Direction** — option to reverse flow animation direction
- **Larger Default Arrowhead** — increased default arrowhead size from 12 to 28
- **Auto-Show Property Panel** — property panel automatically shows when a drawing tool is selected

### Fixed
- **Connector convergence/overlap when moving shapes** — removed dynamic anchor switching that caused all connectors to converge to the same point; replaced with stable fraction-based positioning
- **Edge-type binding drift** — edge bindings no longer recalculate dynamically, preventing cumulative position drift
- **Connector handle missing refreshBoundLine** — connector handle path now properly finalizes binding geometry
- **Kubernetes shape fill color leak** — fixed fill state management in kubernetes shape renderer
- **Zen mode exit button** — added visible exit button for zen mode
- **Cross-platform checkbox styling** — consistent checkbox appearance on Windows
- **Ink brush sharp corner gaps** — filled gaps at sharp corners in ink brush strokes
- **HTML export theme preservation** — exported HTML now preserves current theme setting
- **Mobile .yappy.txt save extension** — save-to-disk on mobile uses correct file extension
- **Mobile status bar visibility** — status bar now shows on mobile devices

### Changed
- **Default stroke width** — changed to 4 across all contexts: store defaults, api.ts, migration.ts, settings dialog, data structure renderer fallbacks

## [0.17.0] - 2026-02-15

### Added
- **Image Pixel Effects** — pixel-by-pixel image reveal animations with 14 presets:
  - Effects: left-to-right, top-to-bottom, center-out, random-pixels, spiral-in, diagonal, wave, checker, scanline, dissolve, radial, blinds, mosaic, glitch
  - Pixel Rain effect (Matrix-style digital rain animation)
  - API: `Yappy.animatePixelEffect()`, `Yappy.stopPixelEffect()`, `Yappy.pixelEffectPresets`
  - Integration with animation panel for interactive previews
- **Text Vertical Alignment** — `verticalAlign` property for text elements:
  - Three modes: top, middle, bottom
  - UI controls in quick toolbar and property panel
  - Real-time preview during editing
  - Supported in both plain text and rich text rendering
- **Rich Text Enhancements**:
  - Separate Text and Rich Text tools in toolbar with dedicated TextToolGroup dropdown
  - `backgroundColor` property support for rich text elements
  - Double-click-to-lock for text tool group (consistent with other tool groups)
- **Raylib Rust Renderer — Rich Text Support**:
  - `RichTextSpan` struct with full formatting fields (bold, italic, underline, strikethrough, color, fontSize)
  - Rich text layout engine with word wrapping and per-span rendering
  - Text highlight background rendering
  - Container text with rich formatting for rectangles and sticky notes
  - `"richtext"` element type dispatching

### Fixed
- **Rich text formatting lost on blur** — `updateElement()` guard was clearing `richText` when both `text` and `richText` were in the same commit update. Added `!('richText' in updates)` check to preserve formatting from `commitRichText()`.
- **Text tool resets despite double-click lock** — four blur/Escape handlers unconditionally called `setSelectedTool('selection')` without checking `store.toolLocked`. Added guard to all reset points. Added `'richtext'` to `CONTINUOUS_TOOLS` and `CLICK_EXEMPT` arrays.
- **Text element placeholder dashed border** — removed unnecessary dashed border rendering for empty text elements
- **Text auto-resize overrides manual resize** — disabled auto-resize for standalone text elements; users can freely resize text bounding boxes
- **Vertical text alignment accuracy** — fixed calculation to use `fontSize` instead of `lineHeight` for proper centering
- **Underline/strikethrough dash artifacts** — added `setLineDash([])` before drawing text decoration lines

### Changed
- **Toolbar layout** — moved Lasso and Crop tools after the Connector toolgroup for better logical grouping

## [0.16.0] - 2026-02-14

### Added
- **6 New Mermaid Diagram Types** — extending the Mermaid adapter to 13 total diagram types:
  - Gantt chart — tasks, sections, milestones with timeline layout
  - User Journey — actions, tasks, and participant scores
  - Quadrant chart — 2×2 matrix with labeled axes and positioned points
  - XY chart — bar and line series with axis labels
  - Block diagram — nested blocks with columns and directional arrows
  - Git Graph — commits, branches, merges, and cherry-picks
- **IRenderer Abstraction Layer** — rendering backend portability:
  - `IRenderer` interface decoupling shape renderers from `CanvasRenderingContext2D`
  - `CanvasRenderer` adapter implementing `IRenderer` for browser canvas
  - All shape renderers updated to use `IRenderer` instead of direct canvas context
- **Raylib Rust Renderer (Phase 3)** — native `.yappy` file viewer:
  - Rust-based renderer using Raylib 5.x for native desktop rendering
  - JSON deserialization of `.yappy` files with `DrawingElement` struct
  - Shape renderers for rectangles, circles, diamonds, triangles, text, images, sticky notes, lines/arrows, and 40+ other shapes
  - `RaylibRenderer` implementing the same drawing API as the TypeScript `IRenderer`
  - Pan, zoom, and dark mode support

### Changed
- **Diagram templates modernized** — all 7 built-in diagram templates updated with architectural style and semantic shapes

### Fixed
- **Mermaid pie chart** — now renders actual data slices instead of decorative placeholder

## [0.15.0] - 2026-02-13

### Added
- **YSL Scripting Language (Phase 1)** — full compiler pipeline extending the declarative text DSL with programming constructs:
  - Lexer/tokenizer with ~40 token types (keywords, operators, literals, edge operators)
  - Recursive descent parser producing a typed AST (~25 node types)
  - Tree-walking interpreter that evaluates scripts into DSLDiagram IR
  - Lexical scoping with `let`/`const` variable declarations
  - String interpolation (`"Server ${i}"`) and dynamic node IDs (`server_{i}`)
  - `for` loops with range (`1..n`) and collection (`["a", "b"]`) iteration
  - `if`/`else` conditionals with comparison and logical operators
  - `fn` declarations and calls with parameter passing
  - `group` blocks for element grouping
  - Pool/lane declarations for swimlane diagrams
  - Frontmatter support (`---` blocks) for title and layout configuration
  - Full expression system: arithmetic, comparison, logical, arrays, member access
  - Auto-detection in `parseDSL()` — scripts with `let`, `for`, `fn`, etc. route to YSL parser
  - Produces same DSLDiagram IR as existing text parser — reuses all 11 layout strategies, 88+ shape aliases

### Fixed
- **Rich text first newline lost on save** — `htmlToSpans()` now handles `<div>`/`<p>` elements preceded by non-block siblings (Chrome wraps lines in `text<div>next</div>` DOM structure)
- **TypeScript strict mode errors** — resolved `erasableSyntaxOnly` violations (enum, parameter properties), unused variables/imports across YSL and existing codebase

## [0.14.0] - 2026-02-13

### Added
- **YappyDraw DSL Engine** — full text-to-diagram pipeline with JSON IR, compact text syntax, and auto-layout:
  - DSL Intermediate Representation (IR) with nodes, edges, pools, groups, and layout config
  - JSON parser + schema validation for programmatic diagram definitions
  - Compact text parser (YAML frontmatter + node/edge declarations + indentation hierarchy)
  - Shape alias map (170+ aliases to ElementType) with automatic defaults
  - Tree layout (4 directions + radial), grid layout, sequence layout, swimlane layout
  - Pool/lane rendering with node containment for BPMN diagrams
  - Style support: gradients, shadows, text highlight, inner borders, effects, custom colors
  - Console API: `Yappy.importDSL()`, `Yappy.importMermaid()`, `Yappy.parseDSL()`
- **Mermaid Adapter** — parse 7 Mermaid diagram types into YappyDraw canvas elements:
  - Flowchart (`graph TD/LR`) — nodes, edges, subgraphs, classDef/class/style
  - Sequence diagram — participants, messages, notes, loops/alt
  - Class diagram — classes with attributes/methods, relationships
  - State diagram — states, transitions, start/end markers
  - Pie chart — slices with values, title extraction
  - Mindmap — indentation hierarchy with expand/collapse support, shape brackets
  - ER diagram — entities with typed attributes (PK/FK/UK), relationships with cardinality
- **Import Dialog** — "Import from Text" modal (menu + command palette):
  - Auto-detect format (JSON, YSL text, Mermaid)
  - Live validation with parse error display and line numbers
  - Layout override dropdown
  - Format badge indicator
  - `initialText` prop for pre-loading content from templates
- **DSL Template Browser** — 23 text-based diagram examples as templates:
  - "Text Diagrams" category tab with segmented control UI
  - 15 YSL templates: flowcharts, mindmaps, infrastructure, sequence, BPMN, UML, data structures, radial, edge types, shapes showcase
  - 8 Mermaid templates: flowchart, sequence, class, state, pie, mindmap, ER, styled flowchart
  - Clicking a DSL template opens Import Dialog with code pre-loaded
  - Document icon + YSL/Mermaid format badge in template thumbnails
- **YSL Tutorial** — interactive tutorial in live help documentation
- **Rich Text Support** — per-span formatting (bold, italic, underline, color) for text elements
- **Expanded Text Editor** — modal editor for multi-line text editing

### Fixed
- **Negative radius crash** in data structure renderer — `ctx.roundRect()` throws on negative radius when cells have tiny dimensions. Clamped w/h/r to non-negative, added try-catch in render loop, try-finally for canvas state restoration.
- **ER parser attributes** — regex required leading whitespace but input was pre-trimmed. Changed `^\s+` to `^\s*`.
- **Mermaid pie chart title** — `pie title Browser Market Share` single-line header lost the title. Now extracts inline title via `\btitle\s+(.+)` match.
- **Mermaid mindmap connections** — `organicBranch` connector requires `controlPoints` that `connect()` doesn't compute. Changed to `type: 'line'` with `curveType: 'bezier'`.
- **Mermaid mindmap expand/collapse** — flat nodes+edges didn't support `setParentChildRelationships`. Rewrote parser to build nested `children` hierarchy.
- **Template browser** — lone category tab looked awkward. Hidden when only one category exists.
- **BPMN pool rendering** — proper sizing, stacking, and node placement in lanes.
- **Text bounding box** not updating on font size change.
- **Accidental click-to-create** shapes for all shape tools (discard tiny elements).
- **Rich text formatting** not persisted on commit.

## [0.13.0] - 2026-02-12

### Added
- **Image Filters** — Instagram-style filter system for image elements:
  - 15 filter presets in 5 categories: Basic, Warm, Cool, Vintage, Dramatic
  - Individual sliders for brightness, contrast, saturation, sepia, hue-rotate, blur, invert
  - Filter preset dropdown in property panel (FILTER group) with auto-switch to "Custom" on manual adjustment
  - Quick toolbar shows brightness, contrast, and saturation sliders for images
  - SVG export preserves filter values via CSS `filter` attribute on `<image>` elements
- **Image Crop Tool** — interactive crop with overlay, handles, and rule-of-thirds grid:
  - Crop tool in toolbar (selection/lasso group) with **Shift+C** shortcut
  - Click on image with crop tool to enter crop mode
  - 8 drag handles (4 corners + 4 edges) to resize crop area, drag inside to move
  - Rule-of-thirds grid overlay for composition guidance
  - Dimmed area outside crop region with full-opacity cropped preview
  - Enter to apply crop, Escape to cancel, click outside to apply
  - "Crop Image" and "Reset Crop" buttons in property panel FILTER group
  - Non-image elements show info toast when crop tool is used
- **Desktop Image Drag & Drop** — drag image files from desktop/file manager directly onto the canvas:
  - Single or multiple images supported (staggered placement)
  - Images placed at drop position with automatic compression (WebP 0.8) and resizing
- **YappyDraw Logo** — logo added to menu bar (24px) and welcome screen (96px desktop, 64px mobile)
- **Favicon & Terms of Service** — custom favicon and terms of service page

## [0.12.0] - 2026-02-12

### Added
- **Google Drive Cloud Storage** — save and load drawings from your Google Drive:
  - PKCE OAuth 2.0 sign-in (fully client-side, no backend needed)
  - Save drawings as compressed `.yappy` files in a dedicated "YappyDraw" folder
  - Browse, search, and load saved drawings from Drive
  - Overwrite detection — saves to same-name files update in place instead of creating duplicates
  - Delete files with confirmation dialog
  - User avatar and account info display
  - Shared Drive support (Google Workspace)
  - Pluggable provider architecture for future storage backends (Dropbox, GitHub, etc.)
  - Feature-flagged via `VITE_ENABLE_CLOUD_STORAGE` and `VITE_ENABLE_GOOGLE_DRIVE` env vars
- **Cloud Storage API** — programmatic access via `Yappy.cloudStorage`:
  - `getActiveProvider()`, `isAuthenticated()`, `signIn()`, `signOut()`
  - `save()`, `load()`, `list()` for cloud file operations
- **Privacy Policy** page (`/privacy-policy.html`) with link in status bar
- **SEO improvements** — Open Graph meta tags, `robots.txt`, and `sitemap.xml`

### Fixed
- **Double-click to lock tool not working on Safari/Mac** — replaced native `dblclick` events with manual timestamp-based detection across all 14 tool group components for cross-browser reliability
- Build errors in cloud storage API (replaced CommonJS `require()` with ES module imports)
- Unused imports in cloud storage dialog, settings dialog, and menu

## [0.11.1] - 2026-02-12

### Fixed
- **Group toolbar/submenus broken on mobile and Safari** — all 15 tool group dropdowns now work reliably:
  - Dropdowns open above the toolbar on mobile (were positioned off-screen below the bottom toolbar)
  - Changed toggle buttons from SolidJS delegated `onClick` to native `on:click` for Safari/WebKit compatibility
  - Increased dropdown z-index from 1001 to 10003 (above toolbar's 10002) to prevent dropdowns rendering behind toolbar
  - Added `touch-action: manipulation` on toolbar buttons and dropdown items to eliminate 300ms tap delay

### Added
- **Line start arrowhead control** in quick toolbar — connectors now show both "Line Start" and "Line End" style selectors with mirrored arrow icons (None, Arrow, Triangle, Diamond)
- **Elbow connector** added to quick toolbar connector types — elbow connectors now show the floating property toolbar

## [0.11.0] - 2026-02-11

### Added
- **BPMN Swimlane Pools** — full dynamic swimlane system for process diagrams:
  - Dynamic lane add/remove via context menu (up to 6 lanes per pool)
  - Horizontal and vertical orientation toggle
  - Editable per-lane labels with rotated text rendering
  - Per-lane background and text colors via context menu color swatches
  - Drag-to-resize lane dividers with proportional sizing
  - Draggable pool header and lane-label width dividers
  - Collapsible lanes — collapse to thin strip, hiding contained elements
  - Both Sketch (RoughJS) and Architectural rendering modes
- **Pool Element Containment** — logical parent-child relationship between pools and elements:
  - Elements dropped inside a lane auto-associate (`poolContainerId` + `poolLaneIndex`)
  - Contained elements move with the pool when dragged
  - Deleting a pool uncontains its children; removing a lane shifts indices
  - Pool lane drop highlight (blue overlay) during drag
- **Elbow Connector Tool** with advanced multi-bend routing:
  - Multi-bend drawing — direction changes during draw automatically create bend points
  - Smart arrow direction — auto-detects best anchor position (top/bottom/left/right) based on shape positions
  - Draggable bend points — click and drag individual vertices on selected elbow connectors
  - Draggable edge segments — drag horizontal/vertical segments to adjust routing
  - A* smart pathfinding for bound elbow connectors (routes around shapes)
- **BPMN demo diagram** — "Ordering a drink from a Vending machine" example (`public/examples/bpmn-demo.json`)
- **120+ new E2E tests** — BPMN shapes, code blocks, data structures, layers, elements, z-order, alignment, slides, UI panels, and table features
- Pool containment API: `assignToPoolLane()`, `removeFromPool()`, `getPoolContainedElements()`, `setPoolLaneCollapsed()`, `isPoolLaneCollapsed()`

### Fixed
- Build errors in `text-editing-overlay.tsx`, `status-tool-group.tsx`, `bpmn-renderer.ts`, `app-store.ts`, and `context-menu-builder.ts`
- Unreachable code paths in BPMN pool renderer removed
- Unused imports and parameters cleaned up across multiple files

## [0.10.0] - 2026-02-11

### Added
- **BPMN 2.0 shape library** with 15 dedicated shapes for business process modeling:
  - **Events**: Start Event, End Event, Intermediate Event (thin/thick/double circle)
  - **Gateways**: Exclusive (XOR), Parallel (AND), Inclusive (OR), Event-based (4 diamond variants)
  - **Activities**: Task, Sub-Process (with [+] marker), Call Activity (bold border)
  - **Artifacts**: Data Object (folded page), Data Store (cylinder), Text Annotation (bracket), Group (dashed rect)
  - **Swimlanes**: Pool / Lane with up to 6 horizontal lane dividers
- **11 event type icons** — message (envelope), timer (clock), error (zigzag), signal (triangle), conditional (page), escalation (chevron), compensation (rewind), link (pentagon), terminate (filled circle), cancel (X mark)
- **8 task type markers** — user, service, script, manual, send, receive, business rule (table/grid)
- **5 loop/multi-instance markers** — standard loop, parallel multi-instance, sequential multi-instance, compensation
- **Non-interrupting events** — dashed border toggle for Start and Intermediate events (boundary events)
- **BPMN icon customization** — Icon Scale (0.5–2.0), Icon Color override, Fill Icon toggle (catching vs throwing)
- **BPMN toolbar dropdown** with 15 custom SVG icons grouped by category
- **`data/bpmn.json`** — comprehensive BPMN 2.0 shape reference file for review
- **BPMN help documentation** covering all shapes, markers, patterns, and best practices
- Welcome screen BPMN 2.0 category pill
- `createBpmnShape()` API method with smart defaults per shape type

### Fixed
- **RoughJS cache invalidation for BPMN** — `computeElementHash` now includes all BPMN properties, preventing stale cached renders when event type, task type, or other BPMN properties change
- **Shape geometry for Event Gateway and Data Store** — fixed undefined `cx`/`cy` variables (should be `0` in local coordinates)
- **Property type mismatch** — `bpmnIconFilled` and `bpmnNonInterrupting` now use `'toggle'` type instead of invalid `'boolean'`
- **Draw handler defaults** — BPMN shapes now correctly default to solid strokes and normalize negative dimensions

## [0.9.0] - 2026-02-10

### Added
- **14 new UI/UX wireframe shapes** for rapid prototyping:
  - **Form**: Solid Button, Dropdown, Checkbox, Radio Button, Toggle Switch, Search Bar, Slider
  - **Container**: Card (rounded rect with header divider)
  - **Navigation**: Navbar (hamburger + title + action icons), Tab Bar (Material Design text tabs with underline indicator)
  - **Feedback**: Avatar (person silhouette), Progress Bar, Badge (pill label), Tooltip (rect with pointer)
- **Data-driven shape architecture** — new `ui-shape-defs.tsx` config array replaces hard-coded renderers; adding a new UI shape now requires only one config entry instead of touching 8+ files
- **Categorized wireframe toolbar** — dropdown grouped by Container, Form, Navigation, Feedback with category headers
- **Custom text rendering** for Navbar, Tab Bar, and Input Field — comma-separated labels parsed and rendered with active tab indicators
- **API methods**: `createUIComponent()`, `createSolidButton()`, `createDropdown()`, `createCard()` for programmatic shape creation
- Click-to-create support for all UI shapes using config-defined default dimensions

### Changed
- Unified `UIComponentRenderer` dispatches to config-defined render functions (architectural + sketch modes)
- Shape registration, toolbar, icon maps, and property configs now auto-derived from config array
- Wireframe tool group refactored from hard-coded tool list to config-driven categorized layout

## [0.8.6] - 2026-02-10

### Fixed
- Diamond shape fill color in architectural mode with borderRadius > 0 — was inheriting fill from previously rendered shape due to missing `ctx.fillStyle` and Path2D rendering quirk (Bug #22)
- Multi-select property panel now only shows properties applicable to selected shape types — table-only properties (Row Color, Alt Row Color, Header Text, etc.) no longer appear when no table is selected (Bug #23)

## [0.8.5] - 2026-02-09

### Added
- Contextual modifier hints in status bar — reactive keyboard shortcut hints based on active tool and selection (shape, connector, drawing, mindmap, etc.)
- Mindmap-specific hints: Alt+Drag (move tree), Tab (add child), Enter (add sibling)
- Global settings button in bottom-left floating buttons (gear icon before property toggle)
- Quick Toolbar toggle in global settings dialog (on/off switch)
- Drawing Style (Sketch/Architectural) selector in global settings dialog
- Line Width mini-slider (1–20px) in connector floating quick toolbar

### Fixed
- Sketch-mode arrowheads on dashed/dotted connectors now render solid (no longer incomplete)
- Presentation mode for infinite canvas documents now starts at 100% zoom centered on content (slides still fit-to-screen)

### Changed
- Standardized mindmap drag behavior: Drag moves only the selected node, Alt+Drag moves the entire subtree (uniform for root and child nodes)
- Settings dialog reorganized: new "General" section with Quick Toolbar toggle and Drawing Style; removed duplicate Render Style from defaults

## [0.8.4] - 2026-02-09

### Added
- localStorage auto-save with silent restore on startup (like Excalidraw/tldraw)
- Real-time debounced saves (1s after last change), immediate save on slide navigation and tab close
- Dirty state indicator (red dot) in status bar next to document name
- Multi-tab awareness with toast warning when another tab edits the same document
- `Yappy.forceAutoSave()` and `Yappy.clearAutoSave()` on public API

### Fixed
- Arrow connector handle endpoints now include `position` in endBinding for proper anchor tracking (Bug #19)
- Moving shape+arrow selections no longer corrupts arrow geometry — uses `batch()` and two-pass update (Bug #20)
- SVG export now renders standalone text and container text with proper font, alignment, and word wrapping (Bug #21)

## [0.8.3] - 2026-02-09

### Fixed
- Pasted organic branches no longer change curve orientation — `controlPoints` (absolute coordinates) are now offset by the paste displacement
- Pasted connectors no longer anchor to original shapes — bindings referencing elements outside the pasted selection are cleared instead of preserved

## [0.8.2] - 2026-02-09

### Fixed
- Copy-paste now maintains relative positions of shapes instead of stacking them at a single point
- Copy serialization properly unwraps SolidJS store proxies before clipboard write
- Paste handler uses already-parsed clipboard data directly instead of unreliable async re-read
- Duplicate (Ctrl+D) now generates human-readable sequential IDs (e.g. `rect-3`) instead of GUIDs
- `generateId()` batch uniqueness — multiple elements of the same type no longer get duplicate IDs

### Changed
- Migrated all element, layer, slide, and state ID generation from `crypto.randomUUID()` to `generateId()` with human-readable sequential naming pattern (`{type}-{n}`)
- `generateId()` now accepts optional `batchIds` parameter for multi-element operations
- `generateId()` now scans all store collections (elements, layers, slides, states) for prefix uniqueness

## [0.8.1] - 2026-02-09

### Fixed
- Text tool not switching to selection on first click outside (pointerdown/blur race condition)
- Bold/Italic toggles now disabled for fonts without those variants (Handlee, Permanent Marker, Caveat italic)

## [0.7.0] - 2026-02-06

### Added
- **Organic branch connectors**: Mindmap connectors rendered as smooth bezier curves with curved text labels
- **Semantic branch styling**: Auto-coloring, depth-based strokeWidth tapering, and opacity fading for mindmap branches
- **Focus mode (Shift+F)**: Dim all elements outside the selected mindmap branch for focused editing
- **Arrow key navigation**: Navigate between mindmap nodes using arrow keys
- **Drag-to-reparent**: Drag mindmap nodes onto new parents with SweetAlert2 confirmation and auto-alignment
- **Kinetic typography animations**: Typewriter, word-by-word, text scramble, and wave text animation presets
- **Glitch effect animation preset**: RGB channel splitting, scan lines, and noise overlay
- **Canvas right-click export**: Export as PNG, JPG, SVG or copy as PNG from the context menu
- **Collapsed toolbar icon-selects**: Quick toolbar uses single-button popovers for cleaner UI
- **Drawing Style for openBox**: Sketch and Architectural render styles for openBox 3D shapes
- **Examples/Showcase page**: Modern diagram templates for quick starts

### Fixed
- Infinite recursion in mindmap buildTree (connectors inheriting parentId from SolidJS proxy)
- Child node overlap when pressing Tab on parent repeatedly
- Kinetic typography multiline text positioning and replay state restore
- Text element bounding box not recalculating on fontSize change
- getBranchInfo counting connectors as children (wrong PALETTE color assignment)
- Bezier midpoint text editing overlay position for organicBranch

## [0.6.0] - 2026-02-05

### Added
- **Open Box click-to-open animation**: Click openBox in presentation mode to animate lid opening with element reveal
- **Reveal animations**: fadeIn, slideUp, scaleUp, and pop effects for revealed elements
- **Restore after reveal**: Auto-close box and hide reveal element after animation completes
- **Lid style options**: Single, split, double, quad, and flaps configurations for openBox
- **45 gradient presets**: Predefined gradients in 8 categories (warm, cool, nature, metallic, pastel, vibrant, dark, light)
- **13 openBox style presets**: Quick styling presets in 4 categories (presentation, product, fantasy, playful)
- **Per-face gradient shading**: 3D shapes now render gradients with proper lighting simulation per face
- **Tool locking**: Double-click any tool to keep it active after drawing
- **Open box lid customization**: Separate fill/stroke colors for lid and backface edges
- **Text editing for openBox**: Double-click to edit text directly on the shape

### Fixed
- Gradient fills now render correctly on all 3D shapes (solidBlock, cylinder, isometricCube, perspectiveBlock, openBox)
- Sketch mode no longer shows hachure artifacts when using gradient fills
- Reveal elements properly hide when entering presentation mode or switching slides
- OpenBox elements reset to closed state when exiting presentation mode (ESC)
- Perspective block rotation handle position corrected
- 3D shape depth now scales proportionally with shape size

## [0.5.0] - 2026-02-04

### Added
- **Excalidraw-like text element behavior**: Text elements now support drag-to-create with customizable width and height
- **Text word wrapping**: Text automatically wraps within the element width instead of stretching
- **Background color support for text elements**: Text elements can now have a background fill color
- **Visual feedback during text creation**: Dashed border shows the text box bounds while dragging

### Changed
- **Text resize behavior**: Font size stays constant during resize (no more scaling)
  - Horizontal resize (side handles): Text re-wraps, height auto-adjusts to fit content
  - Vertical resize (top/bottom handles): Adds padding, text centers vertically
  - Corner resize: Free resize with minimum height to fit wrapped text
- **Text editing overlay**: Input is now centered both vertically and horizontally within the element bounds
- **Text commit behavior**: Preserves user-defined width, only recalculates height based on content

### Fixed
- Resize handlers now correctly oriented when shape is rotated

## [0.4.0] - 2026-01-XX

### Added
- Ink highlighter and eraser tools in infinite canvas presentation mode
- GSAP-like stagger animations with UI support
- Text animations (typewriter, wordByWord, textScramble, etc.)
- GoatCounter analytics for privacy-friendly visitor tracking
- Mobile layout reorganization with bottom toolbar and collapsible utility menu

### Fixed
- Eraser in presentation mode now only affects items drawn during presentation

---

For detailed release notes, see the [release-notes](./release-notes/) folder.
