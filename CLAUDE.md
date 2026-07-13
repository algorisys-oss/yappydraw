## Development process

Our rigorous development process is defined in `LOOP.md` (repo root): 40 rules
across 7 tiers — read-before-write, scope lock, TDD/verification, plan-first,
deviation rules, self-review, safety/traceability, and agent-loop discipline.
Follow it for all development work; ignore any rule that is clearly not relevant
to the task at hand.

### Branch policy

**Never commit development work directly on `main`.** All development happens on
the `dev` branch or a dedicated feature branch (`feat/…`). `main` receives work
only via fast-forward/merge from `dev` (or a feature branch) as part of the
"ship it" release flow. Before starting new work, make sure you're on `dev` or a
feature branch — not `main`.

## Navigating this codebase (read this first)

Before grepping or reading broadly, use the repo map at `.repograph/index.txt`
(terse `path | lang | lines | symbol:line …`, ~91x smaller than the source). Scan
it to find the exact `path:line` for a symbol/file, then open only those files.
`.repograph/map.md` is the human-readable variant. Refresh after code changes with
`npm run repograph` (or `bash scripts/repograph-refresh.sh`). The map generator is an
**optional, on-demand** dev tool (NOT a devDependency — keeping it out of the dependency
tree so it can never break a production/static-deploy `npm install`, which it once did via
its git-clone `prepare` hook). Install it locally with `npm run repograph:install`
(`github:algorisys-oss/repograph`, installed with `--no-save`). The refresh no-ops if it
isn't installed, so committed `.repograph/*` maps are still readable without it. A
`.githooks/pre-commit` hook auto-refreshes the map when a commit touches in-scope source
dirs (enable per clone: `git config core.hooksPath .githooks`).

### Reference codebases (read-only, for design inspiration)

When a feature would benefit from a mature reference implementation (vector path
editing, boolean/pathfinder ops, brush engines, masks, SVG handling, etc.),
consult these local clones. They are **reference only — never edit them**; each
has its own `.repograph/` map, so navigate via `.repograph/index.txt` there the
same way you do here.

- **Inkscape** (C++/GTK vector editor) — `/home/rajesh/opensource/graphics/inkscape`
  (`.repograph/index.txt`). Strong reference for vector paths, pathfinder/boolean
  ops (`src/path/path-boolop.cpp`), live path effects (`src/live_effects/`), SVG,
  and 2geom. Refresh its map with `bash scripts/repograph-refresh.sh` in that repo
  (uses the `repograph` CLI from this project's `node_modules`, scope: `src/` minus
  3rdparty submodules + tracked `*.py`).
- **Krita** (C++/Qt raster painting app) — `/home/rajesh/opensource/graphics/krita`
  (`.repograph/index.txt`, already set up). Reference for brush engines, pressure/
  stylus input, layers/masks, and canvas compositing.

The main features are in todo.md.  Rest of the filed in docs/ folder are learnings, technical specs etc.

It has all details, to create new shapes, behaviors, minimap, resize, connectors, properties etc.

Additional Action items :
- Defensive coding: Ensure everything works
- Update docs/bugs/bug-fixes.md as when bugs are fixed
- Record all learnings with each commits in docs/learnings.md
- Update help docs (for hotkeys)
- **Always review the relevant web help doc for completeness.** The in-app Help (`frontend/src/help-docs/`, surfaced by `help-page.tsx`; plus the hotkeys list in `components/help-dialog.tsx`) is user-facing documentation. Whenever you add or change a feature, shape, attribute, panel, or shortcut, open the matching help doc and ensure it actually covers the new behaviour (steps, API snippet, hotkey, known limitations) — don't assume it's already complete. If no doc section fits, add one. Keep the help doc and `api.ts` in sync with what shipped.
- When a new shape is created or attributes or features are added, ensure api.ts is updated.
- **Render-style parity: BOTH `sketch` and `architectural` drawing styles must work for every shape/feature.** A shape must render correctly (fill **and** stroke) in both modes. Sketch goes through rough.js (`renderSketchGeometry` → `rc.path`/`rc.polygon`/…); architectural goes through the clean canvas path (`renderArchitectural` → `RenderPipeline.renderGeometry` + `fill()`/`stroke()`). Gotcha: SVG-`path` geometry is a self-contained `Path2D` — it must be filled via `renderer.fillPath(d)` and stroked via `renderer.strokePath(d)`, because the `beginPath()+renderGeometry()+fill()/stroke()` pattern only works for geometries that append to the current path (rect/ellipse/points). When adding or changing a shape, verify it visually in **both** styles (a path-geometry shape that only sets up fill will silently lose its stroke in architectural mode).
- WASM parity: When modifying JS code in `utils/geometry.ts`, `utils/hit-testing.ts`, `utils/routing.ts`, or `utils/object-snapping.ts`, ensure the corresponding WASM AssemblyScript module (`wasm/assemblyscript/assembly/`) and bridge (`wasm/bridge/`) stay in sync. The WASM path must produce identical results to the JS fallback.

## "Ship it" — release workflow

When I say **"ship it"** (or "ship"), run the full release sequence:
1. **Update docs** — record learnings in `docs/learnings.md`, log any fixes in `docs/bugs/bug-fixes.md`, review the relevant **web help doc** (`frontend/src/help-docs/`) for completeness and refresh help docs / hotkeys (`components/help-dialog.tsx`), and update `api.ts` if features/attributes changed.
2. **Bump the version** in `package.json` (patch unless I say otherwise).
3. **Write a release note** — ALWAYS create `release-notes/<version>.md` for the version being shipped (e.g. `release-notes/0.5.2.md`). Use the template in `release-notes/README.md`: date, highlights, features, fixes, internal/test changes, and any breaking changes / migration notes. One file per version; never skip this step. If older shipped versions are missing notes, backfill them as applicable.
4. **Refresh the repo map** (`npm run repograph`) and verify the build passes (`npm run build`).
5. **Commit and keep `main` in sync** — commit on the working branch, then make sure local `main` and the remote (`origin`) `main` are in sync and **push** (fast-forward/merge as appropriate).
6. **Publish to the OSS repo** with `./scripts/publish-oss.sh --push` (publishes a cleaned client-only copy to the `algorisys-oss/yappydraw` remote). Use a dry-run first if anything looks off.

