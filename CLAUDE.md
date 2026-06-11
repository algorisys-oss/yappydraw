## Navigating this codebase (read this first)

Before grepping or reading broadly, use the repo map at `.repograph/index.txt`
(terse `path | lang | lines | symbol:line …`, ~91x smaller than the source). Scan
it to find the exact `path:line` for a symbol/file, then open only those files.
`.repograph/map.md` is the human-readable variant. Refresh after code changes with
`npm run repograph` (or `bash scripts/repograph-refresh.sh`). The map generator is
the `repograph` devDependency, so it works after `npm install`; the refresh no-ops
if it isn't installed. A `.githooks/pre-commit` hook auto-refreshes the map when a
commit touches in-scope source dirs (enable per clone: `git config core.hooksPath .githooks`).

The main features are in todo.md.  Rest of the filed in docs/ folder are learnings, technical specs etc.

It has all details, to create new shapes, behaviors, minimap, resize, connectors, properties etc.

Additional Action items :
- Defensive coding: Ensure everything works
- Update docs/bugs/bug-fixes.md as when bugs are fixed
- Record all learnings with each commits in docs/learnings.md
- Update help docs (for hotkeys)
- When a new shape is created or attributes or features are added, ensure api.ts is updated.
- WASM parity: When modifying JS code in `utils/geometry.ts`, `utils/hit-testing.ts`, `utils/routing.ts`, or `utils/object-snapping.ts`, ensure the corresponding WASM AssemblyScript module (`wasm/assemblyscript/assembly/`) and bridge (`wasm/bridge/`) stay in sync. The WASM path must produce identical results to the JS fallback.

