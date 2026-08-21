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

**Always end on `dev`.** Syncing `main` is the last step of a release, not a
place to stay: `git checkout main` for the merge/push, then switch straight back
to `dev`. Leaving the checkout on `main` is how the next change accidentally gets
committed there. `dev` should also be fast-forwarded to `main` as part of the
release, so it never falls behind (it silently drifted 21 commits behind once).

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
- **Temp artifacts go in `temp/`, never the repo root.** Verification screenshots, throwaway
  scripts, scratch output — all of it belongs in `temp/` (gitignored). The repo root is not a
  scratchpad; stray `*.png` from a debugging session ends up in `git status` for weeks.
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
3. **Write a release note** — ALWAYS create `release-notes/<version>.md` for the version being shipped (e.g. `release-notes/0.5.2.md`). Use the template in `release-notes/README.md`: date, highlights, features, fixes, internal/test changes, and any breaking changes / migration notes. One file per version; never skip this step. If older shipped versions are missing notes, backfill them as applicable. **Also add a matching entry (newest first) to `frontend/src/data/whats-new.ts`** — the in-app "What's new" popup (opened by clicking the version number). Keep that copy user-facing (what it does FOR them), skipping purely internal/test-only releases.
4. **Refresh the repo map** (`npm run repograph`) and verify the build passes (`npm run build`).
5. **Commit and tag** — commit on the working branch, then create an annotated tag for the version: `git tag -a v<version> -m "v<version> — <short headline>"` (e.g. `v0.8.124`). One tag per shipped version, `v`-prefixed, matching `package.json`.
6. **Keep `main` in sync and push** — make sure local `main` and the remote (`origin`) `main` are in sync and **push**, including the tag: `git push origin main --tags` (fast-forward/merge as appropriate). Push the working branch too.
7. **Fast-forward `dev` to `main` and push it** — `dev` is the branch the next change starts from, so it must not be left behind the release (`git checkout dev && git merge --ff-only main && git push origin dev`).
8. **Publish to the OSS repo** with `./scripts/publish-oss.sh --push` (publishes a cleaned client-only copy to the `algorisys-oss/yappydraw` remote). Use a dry-run first if anything looks off.
   **This is where shipping ends.** Hostinger picks the build up from here; there is no
   manual upload step any more. Do not hand back a `dist/` to copy somewhere.
   *(Superseded: releases up to v0.8.203 required uploading `dist/` by hand with
   `rsync -av --delete` — that is what the split-build incident #279 and the missing-dotfile
   `.htaccess` failures came from. If the automatic deploy is ever switched off, that is the
   procedure to restore, and `git log -S"rsync -av --delete" -- CLAUDE.md` finds it.)*
9. **Verify once it has propagated** — `npm run verify:deploy`. Not a gate on shipping, and
   not immediate: give the deploy time to land first. Worth running because it is the only
   thing that checks what a *browser* gets rather than what git holds. It samples `sw.js` and
   `index.html` several times, because the live host has served **two different builds from
   the same URL** (7 of 8 fetches returning a three-release-old `sw.js`, all with
   `cache-status: MISS` — the origin itself was inconsistent), and a single fetch cannot
   detect that. It also checks every chunk `index.html` references actually resolves, that the
   cache headers from `frontend/public/.htaccess` arrived, and that the prerendered pages
   (`/help/`, `/help/uml/`, `/learn/`) return 200 with self-referencing canonicals — those are
   separate directories in the deploy, and a partial one leaves the whole documentation site
   404ing while the editor looks perfectly fine.
   It defaults to the **apex** host (`https://yappydraw.com`), which is what the prerendered
   pages declare as their canonical. Pass a URL to check anything else.
   **There is no standing failure any more — every check must pass.** Do not wave any red
   line through as "known".
   *(Two were retired. Up to v0.8.206 it was `sw.js is cacheable: public, max-age=604800`
   (bug #280) — genuinely fixed on the host; sw.js now returns `no-cache, must-revalidate,
   max-age=0`. In v0.8.207–v0.8.208 the *Alternate hostname* check failed because every
   `www.` URL 301'd to a `Location` with no host (`/help/` → `https://help/`). That was
   briefly recorded here as an un-fixable control-panel setting; it was **ours** — a
   backreference bug in `frontend/public/.htaccess`, fixed in v0.8.209. The lesson worth
   keeping: "known failure" is a label that stops people looking, so it needs evidence and
   an expiry, not a habit.)*
10. **Return to `dev`** — finish the release with `dev` checked out, never `main`. Confirm with `git branch --show-current` before reporting the release done; the working tree should also be clean.

