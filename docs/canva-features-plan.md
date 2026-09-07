# Canva-like Features for Yappy Draw — Plan

Status: **complete 2026-07-04** — all 7 phases built and tested;
AI features in scope (OpenAI key available). (Drafted 2026-07-04, branch `dev`, v0.5.27.)
Process: development follows `LOOP.md`.

## Goal

Add a Canva.com-style "design document" experience on top of Yappy's existing
infinite-canvas and presentation modes: fixed-size multi-page documents with
size presets, a pages panel, design templates, a brand kit, an elements/icon
library, image frames, and text-effect presets — all exportable per page.

## Why now / what we build on

The codebase already has the substrate (see exploration notes below):

- `Slide` is already a fixed-size frame on the infinite canvas
  (`frontend/src/types/slide-types.ts:52`) with order, background, thumbnail —
  effectively a Canva "page" hardcoded to 1920×1080. `roadmap.md:102` already
  proposes re-skinning slides as design artboards.
- Template registry + browser exist (`frontend/src/templates/registry.ts`,
  `components/template-browser.tsx`), with 10 multi-slide presentation decks
  and `SlidePalette` (a proto-brand-kit).
- Swatches, graphic styles, recolor panel, gradients/mesh, clip/opacity masks,
  rich text + curved text + Google Fonts, image fills on any shape
  (`backgroundImage`/`backgroundImageFit`), CSS image filters + presets.
- Export: PNG/JPG/SVG/PDF (multi-page)/PPTX/HTML (`utils/export.ts`).

Key gaps: no size presets, slides vs artboards are two parallel frame systems,
no brand-kit entity, no SVG import or icon library, templates skew to
diagrams/presentations, no "save as template".

## Phases

Each phase is independently shippable (patch version + release note via the
"ship it" workflow), with tests, help docs, and `api.ts` updates included.

### Phase 1 — Design Document mode (pages + size presets)  [foundation]

1. Generalize slides into **pages**: `docType: 'design'` reuses the slide
   substrate (`slides[]`) — no third frame concept. Artboards stay as-is for
   now; document that design mode is slide-based.
2. **Size presets** on new-document/page: Presentation 16:9, Instagram post
   (1080²) & story (1080×1920), YouTube thumbnail (1280×720), Facebook cover,
   A4 & US Letter (print @300dpi-equivalent px), business card, poster,
   custom W×H. Per-document default page size; per-page override + resize.
3. **Pages panel**: adapt `slide-navigator.tsx` for design mode (vertical
   thumbnail rail, add/duplicate/delete/reorder, page names, per-page
   background) and page-focused view (fit-to-page zoom, dim outside page).
4. **Export wiring**: export current page / all pages to PNG/JPG/PDF using the
   existing exporters; page bounds = export bounds.

### Phase 2 — Design templates + "save as template"

1. New template categories: social, poster/flyer, card/invitation, resume,
   certificate — size-aware (template declares page size; browser filters by
   current doc size or offers to switch).
2. Ship a starter set (~12–15) of design templates built with existing shapes,
   gradients, and Google Fonts.
3. **Save current document/page as template** — persist to backend
   (`/api/drawings` pattern) with localStorage fallback; user templates appear
   in the browser under "My templates".

### Phase 3 — Brand Kit

1. `BrandKit` entity: name, logo image(s), color palette (maps onto swatches),
   font pair (heading/body, incl. Google Fonts), default text styles.
2. Brand panel UI (sits beside swatches/graphic-styles panels); CRUD +
   persistence (document-level + app-level kits).
3. **Apply brand**: recolor a page/template to the kit palette (reuse
   recolor-panel machinery + `SlidePalette` mapping) and swap font pairs.

### Phase 4 — Elements library (icons, SVG import, frames)

1. **SVG import**: drop/paste `.svg` → parse to path elements (import path is
   the missing half of the existing SVG export). Scope: paths, basic shapes,
   groups, fills/strokes, transforms; rasterize-fallback for unsupported
   features.
2. **Icon library**: bundle Lucide (ISC-licensed, already suggested in
   `docs/competitor.md:111`), lazy-loaded, searchable elements panel;
   icons insert as vector path elements (recolorable).
3. **Frames**: designated placeholder shapes — dragging/dropping an image onto
   one sets `backgroundImage` with cover fit (machinery already exists).

### Phase 5 — Photo & text polish

1. Drag-drop photo onto any shape → image fill; double-click to adjust
   crop/fit.
2. **Text effect presets** (Canva-style): shadow, lift, hollow (stroke-only),
   splice, echo, neon/glow, background/highlight — compose from existing
   stroke/shadow/highlight/letter-spacing attributes as one-click presets in
   the property panel.
3. Font-pairing suggestions in the text tool (curated list, brand-kit aware).
4. Image filter preset polish (thumbnails preview on the actual image).

### Phase 6 — AI features (OpenAI)

Builds on the existing AI provider layer (`frontend/src/ai/ai-providers.ts`,
`ai-settings.ts`, `components/ai-settings-dialog.tsx`).

1. **Magic Write**: generate/rewrite text for a selected text element
   (headline, body copy, tone rewrite).
2. **Text-to-image**: generate an image from a prompt, insert as image element
   or shape fill.
3. **Background removal / image edit**: via OpenAI image editing on the
   selected image element.

### Phase 7 — IndexedDB storage (queued 2026-07-04)

Move browser-side persistence from localStorage to IndexedDB (supported in
all modern browsers including iOS Safari; no practical size limit vs
localStorage's ~5 MB):

1. Small promise-based IDB wrapper (no dependency) with localStorage
   fallback + one-time migration of existing keys.
2. Migrate: autosave document (`yappy:autosave`), user templates
   (`yappy:user-templates`), brand kits (`yappy:brand-kits`) — these hold
   images/thumbnails and are the first to blow the localStorage quota.
3. Keep tiny prefs (theme, panel positions, AI config) in localStorage.

### Out of scope (later)

- Full slides/artboards unification refactor — Phase 1 deliberately reuses
  slides and leaves artboards untouched; unify later if it earns its keep.
- Collaboration/comments, stock-photo integration, magic-resize content
  reflow.

## Cross-cutting requirements (every phase)

- Both `sketch` and `architectural` render styles for anything visual.
- WASM parity if geometry/hit-testing/routing/snapping code changes.
- Tests (Playwright e2e per feature + unit where logic is pure), help docs
  (`frontend/src/help-docs/`), hotkeys dialog, `api.ts`, `docs/learnings.md`,
  release notes per shipped version.

## Progress

- [x] Phase 1 — Design Document mode (2026-07-04, commit 4e1b410)
- [x] Phase 2 — Templates (2026-07-04, commit 597d123)
- [x] Phase 3 — Brand Kit (2026-07-04, commit 6cbc1fa)
- [x] Phase 4 — Elements library (2026-07-04, commit ecaa268)
- [x] Phase 5 — Text effects (2026-07-04, commit b3aa946; photo-drop already existed)
- [x] Phase 6 — AI features (2026-07-04, commit e799f63)
- [x] Phase 7 — IndexedDB storage (2026-07-04, commit 9e90b8f)

All phases e2e-tested: 34 specs across tests/design-mode, design-templates,
brand-kit, svg-import-elements, text-effects, canva-ai, idb-storage.

### Gap round 3 (2026-07-05) — from the Canva-course gap analysis

- [x] Template browser: free-text search, "✓ fits" size/ratio sorting for
      design docs, auto-open after New Design size pick (`Y.searchTemplates`)
- [x] Stock photos: orientation filter chips + drag-to-canvas (fill frame /
      replace image / insert at drop point via `application/x-yappy-stock-photo`)
- [x] Aspect-ratio crop presets (Free/1:1/4:5/3:4/16:9/9:16) with drag lock
- [x] Frames: triangle/star/heart/hexagon added
- [x] JPG in the export dialog (+ page-exact JPG via `exportPageToPng(..., 'jpeg')`)
- [x] Set as Page Background / Detach Image from Background commands
- [x] Glitch text effect
- [x] Google Fonts picker docks + stays open for live previewing (user-reported)

Still open (deliberate): magic-resize content reflow, collaboration/comments,
slides/artboards unification, bullet-list toolbar control (rich-text spans
already render list markers).

### Round 4 (2026-07-05, v0.5.32) — "as good as Canva" roadmap

- [x] Magic Resize v1 (`utils/magic-resize.ts`: backgrounds stretch, rest
      scales uniformly + keeps normalized center; Menu → Magic Resize…)
- [x] Installable PWA, full offline cold load (vite-plugin-pwa; verified
      against `vite preview` with the network disabled)
- [x] Version history (3-min throttled snapshots via autosave, ring of 15 in
      IDB; Menu → Version History…)
- [x] Recents thumbnail grid in Open Drawing (client-side IDB thumb cache)
- [x] Magic Edit (prompt-based inpaint) + Magic Expand (outpaint; padded
      canvas doubles as mask) — `ai/canva-ai.ts`
- [x] AI Design generation (brief → design doc; deterministic layout, LLM
      copy + palette) — `ai/design-generator.ts`
- [x] Bullet/numbered lists: already first-class in the rich-text toolbar —
      documented instead of rebuilt

e2e: tests/canva-next.spec.ts (6 specs); regression pass 39 specs / 7 suites.
Still open (deliberate): collaboration/comments, video timeline/audio, true
content-reflow resize, slides/artboards unification, hand-authored template
volume (AI Design generation is the interim answer).

## Arcade backlog (feat/arcade, 2026-07-05)

Shipped: game runtime (snapshot+rAF+game.* API), clean play stage, touch
gamepad, script editor + Pong/Catch/Blank templates, persistence (doc +
templates), HTML-export play, Replay/Exit. e2e green.

Status update (2026-07-05):
- [x] **Visual game builder SHIPPED as v0.6.0** — WHEN→DO behaviors panel
  (Sprite/Scene/Code tabs), compiles to the same game.* runtime; Pong/Catch
  block examples; idempotent code templates.
- [x] **Variables & conditions** (feat/game-engine, not shipped) — set/change/
  show variable actions + "when variable reaches" and "every N seconds"
  triggers (lives/health/timers/win-lose).

Engine roadmap (Flash/Animate now → Unreal-Blueprint no-code later):
- **Phase A — Flash/Animate parity:** variables/conditions [done], **sound**
  (SFX + music actions; the audio subsystem gap), **physics** (gravity + solid
  collision so platformers feel real), sprite groups, more examples (platformer/
  shooter/maze), builder polish (reorder/duplicate rules).
- **Phase B — beyond Flash:** IF/branches inside a rule, a variables panel,
  Scratch-style broadcast/receive messages, level/scene flow.
- **Phase C — Unreal-tier no-code:** a visual node/wire graph as an alternate
  view over the same behavior+logic model (event → branch/loop → action nodes),
  compiling to the runtime; behaviors panel stays as the simple mode.

Requested, not yet built:
- **Distribute / publish games** (user request 2026-07-05) — beyond the current
  single-file HTML export: a real distribution path. Options to scope: a
  shareable link / hosted game page, a "publish to a games gallery" flow,
  embeddable iframe snippet, and/or a downloadable bundle (itch.io-style zip).
  The runtime already produces a self-contained playable file; this is the
  packaging + hosting/sharing layer on top. Own sprint; decide hosting model
  first.
- Multiple games per document / a project shelf UI (today = one game per doc;
  My Templates is the interim library).

### Phase C (feat/game-engine, 2026-07-05) — visual node graph

- [x] **Graph-as-view v1 SHIPPED to branch** (`components/game-graph.tsx`): full-screen
  node editor over the SAME behaviors. Each rule = a node (owner + WHEN + DO + only-if);
  broadcast→receive draws message wires (bezier lifted from connector-renderer). Pan/zoom,
  drag-to-layout (persisted as `Behavior.graphPos`), add/delete rules, edit-in-panel, Play.
  Compiles through the existing pipeline; one model with the Behaviors panel.
  Shared `game/behavior-ui.ts` (option lists/factories/labels) feeds both views.
  e2e: tests/game-graph.spec.ts (4).

- [x] **Phase C.2 — drag-port-to-create wires** (commit d17fb45): drag a node's
  output port onto another node to connect the message (or add a listener).
- [x] **Inline full node editing** (v0.7.0): graph nodes now edit rules in place —
  editable WHEN trigger + DO action rows (add/remove) + only-if guard, via a shared
  prop-driven `game/behavior-editors.tsx` used by BOTH the panel and the graph. No
  more bounce-to-panel. `<For>` keys by raw behavior refs so one edit recrates only
  that card. e2e: tests/game-graph.spec.ts (6).

- [x] **Phase C.3 — scene-flow wires (goToState / goToPage)**: rules that jump to a
  state or page now draw a dashed **flow wire** to an auto-placed **target pill**
  (violet = state, sky = page), so level/scene flow is visible alongside message
  wires. Derived (not persisted) in `graph-layout.ts` (`flowTargetsOf`,
  `deriveFlowTargets`, `deriveFlowWires`); target column tracks the graph as nodes
  move. e2e: tests/game-graph.spec.ts (now 7 specs).

- [x] **Phase C.4 — true Blueprint exec-flow model (Phase 1)**: a NEW free-form
  execution-flow graph (Unreal-style) alongside behaviors. Event / Action / Branch
  nodes wired by **execution** edges; an event fires and flow runs along the wires,
  a branch routes true/false. Scene-level for Phase 1 (scene-safe actions, no per-
  sprite `this`) which lets it reuse `emitAction` + the behaviors preamble. New:
  `game/blueprint-types.ts` (model), `game/blueprint-to-script.ts` (compiler
  fragments merged into `generateGameScript`), `components/blueprint-graph.tsx`
  (editor, adapted from game-graph pan/zoom/drag). Persisted in
  `SlideDocument.blueprint` + `store.blueprint`; API `Y.getBlueprint/setBlueprint/
  toggleBlueprint`; Menu → Blueprint (exec-flow). e2e: tests/blueprint-graph.spec.ts (5).

- [x] **Phase C.5 — per-sprite Blueprints (owner binding + full set)**: a Blueprint
  now belongs to an OWNER — Scene or a sprite, picked from a header dropdown. Sprite
  owners bind `me = S("tag")` and unlock the full trigger (hit / touching / leaveScreen)
  + action set; Scene keeps the safe subset. Storage moved from a single
  `blueprint` to an owner-keyed `blueprints` map (`'' = scene`, `tag = sprite`) —
  document-level, so no per-element/migration churn — with legacy-`blueprint`
  migration on load. Compiler is owner-aware (`compileBlueprintFragments(g, els,
  ownerTag)`, `compileAllBlueprints`) and reuses the behaviors sprite-event patterns.
  API `Y.getBlueprint(owner)` / `setBlueprintFor(owner, g)`. e2e: blueprint-graph.spec.ts (8).

- [x] **Phase C.6 — flow-control nodes (Sequence + Delay)**: two new Blueprint node
  kinds. **Sequence** has N ordered outputs (seq0…, adjustable via ＋/−) run in order;
  **Delay** waits `seconds` then continues via a one-shot scheduler (`_after` / `_pending`
  drained at the top of `onTick`). Pins generalized to a dynamic list (`pinsOf(node)`),
  so outputs stack and wire from per-pin y. e2e: blueprint-graph.spec.ts now 11; arcade
  regression green (preamble additions are inert for behavior-only games).

- [x] **Phase C.7 — data pins (get / value / compare → wired branch)**: a real
  second wire type. Data (pure) nodes — **getVar** (read a variable), **literal**
  (constant), **compare** (`a ⟨op⟩ b → bool`) — carry a VALUE along dashed cyan data
  wires. A Branch's condition can be *wired* from a Compare (fed by Get/Value) instead
  of typed inline; the wired expression overrides the inline fallback. Edge gained
  `toPin` (data input port); compiler evaluates data nodes to JS expressions
  (`evalDataNode`/`evalInput`). Wiring drops on the target node and auto-picks the first
  free data input (no per-pin hit-testing). e2e: blueprint-graph.spec.ts now 13.

- [x] **Phase C.8 — Math node + data-driven action params (computed values)**: a
  **math** data node (`a ⟨+ − × ÷ %⟩ b → number`) plus data inputs on numeric ACTION
  params (score/changeVar `delta`, setVar `value`) via `actionDataPorts`. So a value can
  be COMPUTED at runtime — e.g. wire `getVar(level) × literal(10)` into a change-score
  node → `game.score(((_vars["level"] || 0) * 10))`. `emitAction` gained an optional
  `ov` param-override map (behaviors pass none); the Blueprint action emitter fills it
  from wired data inputs. e2e: blueprint-graph.spec.ts now 15; arcade/behaviors 21 green.

- [x] **Phase C.9 — data getters (Random + Sprite property)**: two more pure data
  nodes. **random** → `(min + Math.random() * (max − min))`; **spriteProp** → a sprite's
  `x/y/width/height` (`(S("tag") ? S("tag").x : 0)`). Both are sources (no data inputs) —
  the C.7 substrate meant they were near-free. Also fixed a real UX bug the e2e caught:
  the growing palette overflowed the fixed-width header and clipped Play → `.bp-head-actions`
  now `flex-wrap`s. e2e: blueprint-graph.spec.ts now 17.

- [x] **Phase C.10 — palette dropdowns + ForLoop / Gate flow nodes**: the growing
  palette collapsed into **Flow ▾** (Branch/Sequence/Delay/ForLoop/Gate) and **Data ▾**
  (Get/Value/Compare/Math/Random/Sprite) menus, with Event/Action as direct buttons.
  **ForLoop** repeats its `loop` output N times (count inline or wired), then continues
  `done` (node-scoped loop var to survive nesting). **Gate** is stateful: `once` (first
  pass only) or `toggle` (every other), via a `_gate` map in the preamble. Both fit the
  single-exec-in/out model — no core refactor. e2e: blueprint-graph.spec.ts now 20.

- [x] **Phase C.11 — full Unreal Gate + ForLoop index + Game-Graph rewire**:
  - **Gate** upgraded to the real Unreal shape: exec INPUTS enter / open / close /
    toggle → one `out`, with a start-open/closed state. Needed multi-exec-input ports:
    exec edges now carry a target port (`toPin`), the data/exec discriminator switched to
    `pin === 'val'`, and `emitChain` entry is `{ to, port }` — a gate branches on the entry
    port (cycle guard keyed by node+port so the Enter→…→Close "do once" idiom compiles).
  - **ForLoop index**: the loop node exposes its counter as a data output (`val`); the loop
    var is declared in the enclosing scope so the index is readable in the `done` chain too.
  - **Game Graph drag-to-rewire**: a rule's flow-out port is now draggable onto a state/page
    target pill to re-target its goToState/goToPage jump.
  e2e: blueprint-graph.spec.ts (21) + game-graph.spec.ts (rewire); arcade 9 green.

- [x] **Arcade Hub — Phase 1 (menu grouping + view switcher)**: the five scattered
  game menu items collapse into one **Game** group (Build / Node Graph / Blueprint /
  Play / Advanced Script). A shared **GameViewSwitcher** (Simple · Graph · Blueprint)
  now sits in all three editor headers so they read as one tool (three views of the
  same behaviors+blueprints model). Phase 2 = the "My Games" library (a card-grid
  launcher over the existing IndexedDB documents, filtered to games).

- [x] **Arcade Hub — Phase 2a/2b (Code-as-a-view + New Game chooser)**:
  - The game script is no longer standalone. A **gameAuthoringMode** ('visual' |
    'code') lives on the document; `effectiveGameScript` is mode-aware (code games
    use the hand-written script as the source, never regenerated). The **Code** view
    joins the switcher (Simple · Graph · Blueprint · Code): read-only generated code
    for visual games, with a one-way **Eject to code**; editable for code games.
    "Advanced Script…" retired.
  - **New Game chooser** (`new-game-dialog.tsx`): Blank / Pong / Catch / Platformer /
    Code — each resets to a fresh game doc and opens the right editor, so the
    authoring mode is chosen up front.

- [x] **Arcade Hub — Phase 2c (My Games library)**: a launcher gallery of every saved
  game. A game IS a document, so it reuses the saved-drawings store + `doc-thumbnails`;
  saves are tagged `isGame` (+ `mode`) so the gallery filters cheaply. Cards show a cover
  thumbnail with a hover **Play** (load + run, no editor chrome), click-to-**Open** (into
  the right editor by mode), **Delete**, and a **＋ New Game** tile. Fixed a real
  persistence bug found along the way: the manual Save paths dropped `blueprints` and
  `gameAuthoringMode` and weren't mode-aware. `components/my-games-dialog.tsx` (+ signal).

Arcade Hub — done (Phases 1, 2a, 2b, 2c). Later polish: hover-to-Play latency, Export-HTML
per card, Duplicate, search/sort, and legacy games (saved before the `isGame` tag) surface
only after a re-save.

- [x] **Game Stage**: a game is a single-stage **paged document — its page is the fixed
  play window** (`game.width/height/x/y` bind to it, Play fits it letterboxed, export &
  launcher deterministic). New Game creates it with a chosen stage size (Landscape 800×600 /
  Wide 1280×720 / Portrait 540×960 / Square 720×720). The runtime already staged on
  `pageRect()`; the gap was New Game making *infinite* docs.
- [x] **Slingshot — an advanced Angry-Birds sample**: a shapes-only, code-authored
  game with custom projectile physics (gravity, ground bounce with restitution/friction,
  AABB circle-vs-box collisions), a drag-to-aim slingshot with a live trajectory preview,
  destructible wooden blocks, poppable pigs, multiple levels, and score/HUD. Ported in
  spirit from the raylib reference at `~/lab/csharp/csharp-raylib-angrybirds`. Lives as a
  `GAME_TEMPLATES` entry + a one-click **New Game → Slingshot** starter (forces a 1280×720
  stage, opens as a code game). Demonstrates the full `game.*` API doing real gameplay.
- [x] **`game` docType (single-stage, no slide chrome)**: making games `design` docs
  wrongly gave them the multi-page Design chrome (slide navigator, Add Page, page-control
  toolbar, Present, "Slide 1/1"). Split the concepts: `isPagedDocType` (renders as a page /
  stage — slides + design + **game**) vs `isMultiPageDocType` (the navigator / Add Page /
  present chrome — slides + design only). New Game now creates docType **`game`**: it renders
  and plays as a stage but has no paging/present UI. Existing infinite games still run.
- [x] **Landing page redesign**: dropped the hand-drawn pointer arrows + UI callouts;
  replaced with a bold "Click anywhere to sketch your first idea" over a muted, organized
  two-column feature list (`welcome-screen.tsx`).
- [x] **Fix**: the Blueprint empty-state hint box collapsed to ~80px (one word per line) —
  it lived in the zero-width absolute `.bp-surface`, so `max-width` fell to min-content;
  changed to an explicit `width`.

Phase C.11+ (deferred): time/elapsed data getter (context-aware); node collapse/group;
minimap; multi-output exec on more nodes. Known limitation: a sprite Blueprint is keyed by
tag, so renaming a sprite orphans its graph (same tag-identity assumption the behaviors
compiler already makes).
