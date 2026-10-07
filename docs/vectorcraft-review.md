# VectorCraft review: what Yappy can pick up

**Reviewed:** 2026-10-07 · **Subject:** [storytold/vectorcraft](https://github.com/storytold/vectorcraft) @ `a26aa5b` (v0.4.0)
**Method:** cloned into `temp/vectorcraft`, built the headless CLI, rendered and exported the bundled
examples, ran the perf budgets and the path-ops test suite, compiled the boolean engine to WASM, and read
the code subsystem by subsystem against Yappy's equivalents. Every claim about either codebase cites a
`file:line`. VectorCraft paths are relative to its repo root; Yappy paths are relative to `frontend/src/`
unless they say otherwise.

---

## 1. TL;DR

VectorCraft is an Illustrator clone in Rust (egui UI, WASM web build), MIT OR Apache-2.0, about 280k lines,
written almost entirely by AI agents in **eight days** (first commit 2026-09-30). The scale is impressive,
but its self-graded parity numbers are upper bounds, as the project itself says. The useful parts for
Yappy are a handful of **design decisions** and **one directly reusable library**, not the app.

| # | Pick | Why | Effort |
|---|---|---|---|
| 1 | **`vectorcraft-pathops` compiled to WASM** in place of `polygon-clipping` | Booleans run on the curves, so arcs come back as arcs. Yappy flattens everything to 0.25 px polylines and refits heuristically. Measured: 131 KB gzipped, about 0.08 ms per operation | ~1 week |
| 2 | **A typed command registry** (`id, label, menu, shortcut, params schema, enabled→reason, run`) with one `execute()` entry point | One source for the palette, hotkeys, help dialog, menus, MCP and tests. Shortcuts currently live in three places that drift apart | ~4 days core |
| 3 | **Begin / Preview / Commit interactions** plus **labelled history entries that restore the selection** | A drag becomes one undo step with a name, Escape cancels cleanly, a throw rolls back | ~1.5 days + porting |
| 4 | **A non-destructive effect stack** (`effects: {id, params, visible}[]` on the element and on each fill/stroke) | `docs/illustrator-effects-logo-gaps.md` already calls this the biggest parity gap. VectorCraft shows the data model and the evaluation order | ~2 weeks |
| 5 | **Command sweep + import fuzzing + model-based undo tests** | Cheap and catches whole classes of bugs. Yappy has none of the three | ~4 days |
| 6 | **A perf-budget harness** plus three render fixes (coalesced rAF, pan reprojection from the last bitmap, identity-keyed caches) | Nothing measures Yappy's render performance today | ~1 week |
| 7 | **The native document embedded in exported SVG/PDF**, verified by a body hash | Yappy SVG/PDF files would reopen losslessly (rough seeds, connectors, styles) | ~2 days |
| 8 | **A live MCP bridge** (`list_commands`, `run_command`, `screenshot`) | Yappy's MCP edits files on disk and never touches the running editor | ~4 days after #2 |

**Explicitly not worth taking:** the egui UI, the vello_cpu renderer, the whole-app WASM build (7.1 MB
gzipped), harfrust text shaping, its pen tool and smart guides (Yappy's go further), TSV i18n catalogs,
agent-hour estimates, and `Arc` structural sharing as a near-term goal. See §10.

---

## 2. What VectorCraft is

| | |
|---|---|
| Language / UI | Rust 2024 (1.95), egui 0.36 / eframe; web through Trunk + wasm (WebGPU, WebGL2 fallback) |
| Licence | MIT OR Apache-2.0 (`LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE`). The ArtCraft brand assets are **not** covered (`docs/brand/LICENSE-brand.txt`) |
| Size | 21 crates + 3 apps, about 280k lines of Rust, about 3,400 `#[test]`s, 717 commits |
| History | 2026-09-30 → 2026-10-07. Mostly agent-authored (see `AGENTS.md`, the `plan/` protocol, "agent-hour" estimates in `ROADMAP.md`) |
| Claimed parity | "~69–75% of Illustrator's features; 40–55% can't-tell-the-difference" (`README.md` Status). Self-graded, explicitly "treat as upper bounds" (`ROADMAP.md` Honest assessment) |
| Dependencies of note | `kurbo` (geometry), `linesweeper` (curve sweep-line booleans), `vello_cpu` (raster), `usvg` (SVG in), `krilla` (PDF out), `hayro` (PDF in), `harfrust` + `skrifa` (text), `wasmi` (sandboxed plug-ins) |

**Crate layering**, enforced by `cargo xtask layers` (`xtask/src/layers.rs:34-62`):

```
L0 geom, color ──► L1 doc ──► L2 pathops, effects, text, brush, trace
   ──► L3 render, svg, pdf, eps, cad, metafile, format ──► L4 tools ──► L5 engine ──► L6 ui-egui, mcp
```

Nothing below L6 may depend on egui/winit/rfd, so the whole engine runs headless. The CLI, the MCP server
and the tests all rely on that.

**How much to trust it.** The engineering hygiene is real: no-panic lints, property tests, fuzzing, and
honest "not implemented" sections in its docs. Breadth was bought with speed, though. The roadmap itself
puts interaction fidelity at 30–40%, and no performance budget has been run on an idle machine (§3.2
agrees: one budget fails). Read its code as a **reference for architecture and algorithms**, not as proof
that a behaviour matches Illustrator.

---

## 3. Hands-on results

All builds and outputs are under `temp/` (gitignored): the clone is `temp/vectorcraft`, the cargo target is
`temp/vc-target` (761 MB, CLI only), and exports are in `temp/vc-out/`.

### 3.1 Build and export

```sh
CARGO_TARGET_DIR=temp/vc-target CARGO_PROFILE_RELEASE_LTO=false \
  cargo build --release -p vectorcraft-cli -j 6        # 6 m 17 s, clean, no warnings surfaced
vectorcraft-cli run --in examples/neon-drive.vectorcraft --export out.png   # also .svg, .pdf
```

| Example | PNG export (wall / peak RSS) | Notes |
|---|---|---|
| `neon-drive` (91 nodes, glows, clipping, type) | 0.22 s / 63 MB | Rendered correctly: glow on type and grid, gradient sun cut by Pathfinder |
| `ribbons` (live blends, 55–70 steps) | 0.17 s / 51 MB | |
| `feature-sheet`, `dusk-poster` | 0.02 s / 28 MB | Pathfinder crescent and stars rendered cleanly |

SVG export of `neon-drive` was 25 KB and PDF 1.1 MB (fonts subset and embedded). Every export reported
`warnings: []`. **Every exporter returns a warnings list**, a pattern worth copying (§7.4).

### 3.2 Performance budgets (`vectorcraft-cli perf --paths 20000`)

Measured on a 12-core machine at load average 8.1 (our own build had just finished), so treat it as
pessimistic:

| Budget | Measured | Budget | |
|---|---:|---:|---|
| render: fit page, 2880×1800 | 73.7 ms | 100 ms | ok |
| render: refresh after a pan | 73.5 ms | 100 ms | ok |
| render: 400% zoom | 29.9 ms | 16 ms | **over** |
| hit test, per click | 0.67 ms | 2 ms | ok |
| save `.vectorcraft` | 26 ms | 300 ms | ok |
| open `.vectorcraft` | 130 ms | 300 ms | ok |
| export SVG | 118 ms | 500 ms | ok |
| Pathfinder Unite, 1,000 paths | 51 ms | 150 ms | ok |

`bench neon-drive`: 70 ms per frame with 4 threads, **62 ms single-threaded**. Glow-heavy art doesn't
benefit from the thread pool. The README's "20,000 shapes in 27 ms" is a native, 4-thread, idle-machine
figure. The web build renders on one thread (`crates/render/src/lib.rs:1447-1460`).

**Takeaway for Yappy:** the harness itself (a deterministic synthetic document, medians, named budgets, a
non-zero exit when over budget, a warning when load average makes timings noise; `apps/vectorcraft-cli/src/perf.rs`)
is the thing to copy, not the numbers.

### 3.3 Path-ops test suite and a WASM probe

`cargo test -p vectorcraft-pathops`: **88 passed, 0 failed, 1 ignored** across unit, property and
regression suites.

To check whether the boolean engine is practical in the browser, I wrapped it in a 25-line probe crate
(SVG path string in, SVG path string out) and built it for wasm32 with `opt-level=z`, LTO and
`panic=abort`:

| | |
|---|---|
| `.wasm` size | 323 KB raw, **131 KB gzipped**, including std on `wasm32-wasip1`; a `wasm32-unknown-unknown` + wasm-bindgen build should be similar or smaller |
| Speed (native) | circle − rect: **~0.08 ms per operation** (1000 runs in 79 ms) |

**Fidelity, case 1: general position** (circle r=50 at (100,100), rect from x=120):

```
difference: M50,100 C50,72.4 72.4,50 100,50
            C107.10,50 113.87,51.49 120,54.17      ← exact subsegment of the original arc
            L120,145.83
            C113.87,148.51 107.10,150 100,150
            C72.4,150 50,127.6 50,100 Z            ← untouched arcs come back bit-identical
```

The output contains original cubics and exact `subsegment(t0..t1)` splits, with no polyline and no refit.
That is the point: Yappy's `utils/path-boolean.ts:35-80` flattens to 0.25 px and `curve-refit.ts` guesses
the corners back.

**Fidelity, case 2: degenerate** (the rect edge at x=100 passes exactly through the circle's top and
bottom anchors):

```
difference: M100,50 C100.0024,50 100.0024,50.0000002 100.000001,50.0000005 L100,150 …
intersect:  M100,150 L100.000001,50.0000005 C127.5967,50.0039 149.996,72.402 150,100 …
```

It still works and keeps its shape, but it leaves a **1e-6-sized sliver segment** at the tangency, and one
arc comes back as a least-squares refit rather than an exact subsegment. "No cannot-perform-operation" is
true; "exact" is true except at coincident anchors. If we adopt it, run a `cleanup` pass that drops
segments under ~1e-4 px. VectorCraft already has `is_sliver` / Clean Up; wire it in after each operation.

---

## 4. Architecture and engine

### 4.1 Everything is a command

**VectorCraft** (`crates/engine/src/cmd/mod.rs:87-104`):

```rust
pub struct CommandSpec {
    id: &str, label: &str, menu: &[&str], shortcut: Option<&str>,
    params: &str,                               // human/agent-readable params doc
    enabled: fn(&Session) -> Result<(), String>, // Err = *why* it's disabled
    run: fn(&mut Session, &Value) -> Result<Value>,
    journal: bool,
}
```

- About 400 engine commands and about 50 UI commands (`crates/ui-egui/src/menus.rs` `UI_COMMANDS`) sit in
  one `OnceLock` registry.
- `Session::execute(id, params)` (`crates/engine/src/lib.rs:900`) does everything in order: checks
  `enabled`, runs under the panic guard, records history and appends `(id, params)` to a replayable journal
  (used by Actions and crash recovery).
- Menus, the ⌘K palette, the shortcut editor, the control channel, MCP and the tests all read the same
  registry. `ALIASES` keeps renamed IDs working (`mod.rs:416`).

**Yappy today:**
- `utils/command-registry.ts:39` has `{id, label, category, action: () => void, shortcut?}`, 152 entries.
  There are no params, no enablement, and no result.
- The real parameterised surface is `api.ts` (`YappyAPI`, about 650 positional-argument methods, 5,900
  lines).
- Keyboard handling is an 870-line `handleKeyDown` in `app.tsx:188` with about 120 `e.key ===` branches.
- The help dialog keeps its own shortcut table (`components/help-dialog.tsx`).
- So shortcuts are defined in three places, and nothing checks that they agree.

**Decision: adopt, in TS form.**

```ts
interface CommandSpec<P = void, R = unknown> {
  id: string;                    // namespaced: "path.unite", "view.zoomIn"
  label: string;                 // i18n key
  menu?: string[];
  shortcut?: string;             // single source for keymap + help dialog
  params?: ZodType<P>;           // validation + JSON Schema for MCP for free
  enabled?: () => true | string; // string = disabled reason, shown as a tooltip
  history?: string | false;      // undo label; false for view/selection-only
  run: (p: P) => R;
}
```

- `execute(id, params)` validates, checks enablement, opens a history entry, runs inside try/catch, and on
  a throw restores the snapshot and shows a toast.
- The palette, help dialog, keymap and MCP schema are all generated from the registry.
- Existing `YappyAPI` methods are wrapped, not rewritten; migrate high-traffic commands first.
- Tool-modal keys (pen Enter/Escape, etc.) stay with their tools.
- Do **not** copy Rust's untyped `&Value` parsing. Zod is strictly better here, and `backend/mcp` already
  depends on zod.

### 4.2 History: labelled entries, selection, rollback

**VectorCraft:**
- The document is a persistent tree of `Arc<Node>`. An edit path-copies only the root-to-node spine
  (`crates/doc/src/lib.rs:734-742`).
- So an undo entry is a pointer: `HistoryEntry { label, doc: Arc<Document>, selection }`
  (`crates/engine/src/lib.rs:61`).
- "Dirty" is a pointer comparison against the saved document, so undoing back to the saved state reads as
  clean (`lib.rs:100-102`).
- `run_guarded` snapshots (doc, selection, interaction) and restores them on a panic (`lib.rs:985-1007`).
- `edit()` also rolls back on `Err` and on failed sanity checks (`doc_sane`: finite, in-range coordinates;
  `lib.rs:1032-1056`).

**Yappy today:**
- `captureSnapshot` shallow-clones every element and collection (`store/app-store.ts:985-1004`).
- Entries carry no label and no selection, so the history panel can only show counts
  (`app-store.ts:1112-1116`).
- Undo doesn't restore the selection.
- A throw part-way through an edit leaves the store half-mutated (`withoutHistory` is only try/finally,
  `:1048`).
- There are 366 `pushToHistory(` call sites.

**Decision: adopt the entry shape `{label, snapshot, selection, activeLayerId}`, rollback-on-throw, and a
`savedSnapshotRef` identity check for dirty state.**
- Labels can default to the executing command's label, so most of the 366 sites need no edit once §4.1
  exists.
- **Defer** real structural sharing. Solid's `setStore` merges in place (the comment at
  `app-store.ts:955-976` explains the hazard), so it would mean changing every element update to
  replace-not-merge. That is 2–3 weeks; do it only if snapshot cost shows up in the perf harness (§7.1).

### 4.3 Tools emit Begin / Preview / Commit

**VectorCraft:**
- Tools never touch the document. `Tool::pointer(ctx, event) -> Vec<Action>` (`crates/tools/src/lib.rs:355`),
  where `Action` is one of `Begin(label)`, `Preview(cmd, params)`, `Commit`, `Cancel`, `Exec`, `Dialog`,
  `SwitchTool` or `Notify`.
- In the engine (`crates/engine/src/lib.rs:1077-1146`):
  - `begin` snapshots the document.
  - `preview` resets to the snapshot and re-runs the command with the latest params.
  - `commit` records **one** labelled undo step and journals the final params.
  - `cancel` restores the snapshot.
- Results:
  - A drag is replayable as a single command (an agent can do in one call what a user does in a drag).
  - Tools are unit-testable without a UI (`crates/tools/src/shape.rs:237` asserts the action list).
  - There's no accumulated floating-point drift, because each preview starts from the pristine snapshot.

**Yappy today:** handlers call `pushToHistory()` on pointer-down and then mutate the store on every move
(e.g. `utils/tool-handlers/selection-handler.ts:170,250,263,285`). Cancelling is ad hoc
(`discardLastSnapshot`, `app-store.ts:1098`).

**Decision: adopt the interaction API** (`beginInteraction / previewInteraction / commitInteraction /
cancelInteraction`, about 1 day), then port the move, resize and shape-draw handlers (2–3 days).
**Don't** rewrite every tool as a pure action-emitting state machine. Yappy's overlay-heavy tools (mesh,
puppet, reshape, width) would pay a lot for little gain; convert them only as they're touched.

### 4.4 Agent surface: control channel and MCP

**VectorCraft:**
- There's a JSON-lines control channel on loopback (`docs/control-protocol.md`). Methods include
  `engine.execute`, `engine.commands`, `document.inspect`, real pointer/keyboard injection, `ui.screenshot`
  and headless `ui.render`.
- It is hardened: 4 MiB line cap, 16-connection cap, HTTP request lines rejected, malformed messages close
  the connection.
- The MCP server (`crates/mcp`) sits on one `Backend` trait (`backend.rs:12-19`) with two implementations:
  `Remote` (the running app) and `Headless` (an in-process engine plus a CPU renderer).
- Its 25 tools centre on `list_commands` + `run_command`, which reach every command, plus `screenshot`
  (returned as MCP image content), `export`, `undo`, five prompts, completions, and resource templates
  (`vectorcraft://object/{id}`), so an agent reads one object instead of the whole document.
- `docs/mcp.md` honestly lists what's absent: progress, cancellation and subscriptions.

**Yappy today:**
- `backend/mcp` has 4 diagram tools (`diagram-tools.ts`) plus the rocket tools. They read and write files
  on disk (`utils/diagram-store.ts`) and never touch the live editor.
- The live surface is `window.Yappy` (`api.ts`) plus the `embed-bridge.ts` postMessage protocol
  (`{id, method, args}` → `{ok, result|error}`, origin allowlist).

**Decision: adopt the Backend split and the `list_commands` / `run_command` / `screenshot` core**, reusing
the embed-bridge wire format.
- Transport: the page connects **out** to a small localhost relay in `backend/mcp`, or a Tauri command on
  desktop. Connecting out avoids opening an inbound port in the browser story.
- Keep the file tools as the headless mode.
- Keep VectorCraft's hardening rules on the socket: loopback only, size cap, reject non-objects.
- **Don't** copy the 25 hand-written convenience tools. `run_command` with zod-generated JSON Schema covers
  them, and the registry (§4.1) is the prerequisite.

### 4.5 Native file format

**VectorCraft** (`crates/format/src/lib.rs:1-31, 357-384`):
- The file is `{format, version: 3, generator, preview?, document, images, profiles}`, gzip detected by
  magic bytes.
- **Newer versions are rejected** (`TooNew`), not guessed at.
- `Document.extra` (`#[serde(flatten)]`, `crates/doc/src/lib.rs:553`) keeps unknown top-level keys from a
  newer writer, so a round trip doesn't drop them.
- It also has named `migrate_*` steps, atomic temp-and-rename saves, a 512 MiB unpack cap, and
  default-valued fields omitted on write.

**Yappy today:**
- `utils/document-io.ts:14` writes `version: 4`.
- `utils/migration.ts:245` `isSlideDocument` accepts only 3 or 4. **A version-5 file would be routed into
  `migrateToSlideFormat` as if it were legacy v2**, which is a silent-corruption path the day we bump the
  version.
- `buildSlideDocument` lists fields explicitly, so unknown keys are dropped.

> **Status (2026-10-07): items 1 and 2 shipped**, together with a bigger bug found along the way:
> six hand-written save builders had drifted, so Save to disk lost animation timelines (bug #406).
> Item 3 (the migration chain) is deferred until a v5 exists. With one v2→v4 step, a chain would be
> structure without a second user.

**Decision: adopt all three cheap fixes (about 1 day):**
1. Reject `version > CURRENT` with a clear message.
2. Keep an `extra` bag of unknown keys and write it back on save.
3. Use an ordered `migrations: Record<number, (d) => d>` chain plus a `generator` field.

Skip writing older versions, which a web app doesn't need.

### 4.6 Layering check

`cargo xtask layers` makes the headless engine possible. Yappy's equivalent problem: `store/app-store.ts`
(11k lines) is reachable from everywhere, and `utils/command-registry.ts` imports from `components/*`.
**Adopt lightly:** use `dependency-cruiser` with zones `model → store → commands → components`, starting
in warn mode with a ratchet. It's a prerequisite for a headless MCP backend running the real store in
Node. About 0.5 day to set up; the cleanup is ongoing.

### 4.7 Plug-ins

VectorCraft runs plug-ins in **wasmi** (a pure-Rust interpreter) with **no host imports**
(`docs/plugins.md`):
- Limits: fuel 50M instructions plus 4,000 per input byte, 512 MiB memory, a timeout, and a fresh instance
  per run.
- ABI: JSON in, JSON out (`vc_manifest`, `vc_alloc`, `vc_run`).
- A filter's output is fully validated and then applied as one edit. A live effect is cached by
  (plug-in, params, input geometry).
- The manifest's `params` schema generates the dialog.
- If a plug-in is missing, its effect record stays in the document and the object draws untransformed.

**Decision: adopt the *contract*, not wasmi.** In the browser the sandbox is a Web Worker (or QuickJS-wasm
if we need real fuel limits). Output goes through one command, so it's one undo step. Keep the dialog
generated from the schema and the "missing plug-in keeps the record" rule. About 1 week for filters.
**Later**, after §4.1 and §5.2.

---

## 5. Geometry and live effects

### 5.1 Booleans, Shape Builder, Offset, Outline Stroke: the main pick

**VectorCraft** (`crates/pathops/src/boolean.rs`, 3.7k lines total):
- **No flattening.** `linesweeper` 0.4 sweeps cubics directly. Winding is a per-input vector
  (`Multi(Vec<i32>)`, l.53-102), so one sweep serves N inputs, and any boolean is a predicate over
  "inside input i" (`boolean_n(paths, pred)`, l.554).
- **Robustness:**
  - The tolerance scales with the coordinates (`eps = max|coord|·ε·64`, l.123-136).
  - `snap_horizontals` (l.149-220) fixes a real dropped-corner bug (regression tests in
    `tests/regressions.rs`).
  - The sweep is wrapped so a failure becomes `PathOpsError::Degenerate` and the art is left unchanged
    (l.273-278).
- **Curve recovery:** every input anchor is kept, and `exact_merge` (l.488-517) re-joins split pieces into
  the exact `subsegment` of the original cubic. Only if that fails does it fall back to a Schneider
  least-squares fit (`fit.rs`). Confirmed in §3.3.
- **Shape Builder / Divide:** one sweep, then faces are grouped by coverage mask (`pathfinder.rs:156`
  `regions_of`), with `region_at(point)` for hover. All 10 Pathfinder operations are included.
- **Offset Path** (`offset.rs:77`): a kurbo stroke at 2d, then a 3-input arrangement plus a distance check
  that drops the faces winding gets wrong. Outline Stroke honours miter, round and bevel joins.
- **Tests:** property tests for area identities (A = (A−B) + (A∩B)), point membership against the set
  operation, Divide partitioning the union, offset monotonicity, and Steiner's formula.

**Yappy today:**
- `utils/path-boolean.ts:35-80` flattens adaptively at 0.25 px and then calls `polygon-clipping`.
  **On any exception it silently returns `[]`** (l.402-404), so the user sees their shapes vanish or
  nothing happen.
- The result is refit heuristically by corner detection at 32° (`curve-refit.ts`).
- `computeShapeFaces` (l.458) does 2^N intersect/difference passes, capped at N ≤ 8.
- `utils/path-offset.ts`: Outline Stroke is a union of per-segment rects and 16-gons, so every join is
  round. Offset doesn't remove the inverted loops a negative offset leaves on concave shapes.
- Every repeated operation compounds the flattening error.

> **Status (2026-10-07):** the "fails silently" half is fixed without WASM (bug #408). Fuzzing showed
> polygon-clipping's crashes come from near-coincident edges and a snapped retry fixes them; a
> remaining failure is now reported as a failure. The curve-fidelity half (flattening and refit)
> is still open, and it is what the WASM swap below is for.

**Decision: compile `vectorcraft-pathops` + `vectorcraft-geom` to WASM as a separate Rust module** and route
`runBooleanOp`, `computeShapeFaces`, compound shapes, offset and outline stroke through it.

| Question | Answer |
|---|---|
| Why not AssemblyScript (our existing WASM toolchain)? | It's a port of a sweep-line plus curve-fitting stack, which is weeks of work and a new correctness risk. The Rust crate already builds for wasm32 unchanged (§3.3) |
| Size / load | 131 KB gzipped. Lazy-load on first boolean, like `jspdf` |
| Interface | A `Float64Array` of cubics in absolute coordinates per subpath + fill rule + op → the same shape out. Convert Yappy's anchors (absolute points, relative `inX/outX` handles) at the boundary |
| Panics | `catch_unwind` doesn't exist under wasm `panic=abort`. A sweep panic traps the instance, so JS catches the trap, re-instantiates, and **falls back to `polygon-clipping` with a toast**, never `[]` |
| Slivers | Run a cleanup pass after each operation (§3.3, degenerate case) |
| WASM-parity rule | `CLAUDE.md` requires JS↔WASM parity for `geometry/hit-testing/routing/object-snapping`. `path-boolean.ts` isn't on that list, but treat the kept `polygon-clipping` path as the fallback and add a parity test on area and point membership, not on vertex lists |
| Desktop | The Tauri shell could link the same crate natively later; the web needs the WASM build anyway |
| Tests | Port the property tests to `fast-check` (not installed yet; add it as a devDependency) |

Effort: about 4–6 days for the binding, adapter and call sites, plus 1–2 days of property tests. **This is
the single highest-quality-per-hour item in this review.**

### 5.2 A non-destructive effect stack

**VectorCraft** (`crates/doc/src/appearance.rs:306, 332, 608`):

```rust
Appearance { items: Vec<Fill | Stroke>, effects: Vec<Effect>, contents_index }
FillLayer / StrokeLayer { …, effects: Vec<Effect> }   // effects per fill or stroke, too
Effect { id: "distort.roughen", params: serde_json::Value, visible: bool }
```

- Missing params fall back to a catalog of defaults (`effect_catalog`, `merged_params`). `lengths_of` says
  which params are distances, so *Scale Strokes & Effects* knows what to scale.
- **Evaluation** (`crates/effects/src/lib.rs:488` `apply_geometry_with`): geometry effects fold in stack
  order, and bounds are recomputed after each one.
- Raster effects (glow, shadow, feather) are only *described*. The renderer paints them, and `outset()`
  reports how far they reach, for culling and bounds.
- The cache is keyed by node identity, with eviction after 3 unused frames once it passes 256 entries
  (`crates/render/src/live.rs:28-43`).
- **Bézier-preserving distortion:** `map_nonlinear` (`crates/doc/src/live.rs:401`, about 45 lines) splits
  each cubic into at most 64 pieces of ≤ diagonal/16 and maps the control points, so the output stays
  curves. Roughen and Tweak use deterministic hash noise keyed by (seed, subpath, point)
  (`crates/effects/src/distort.rs:70`).

**Yappy today:**
- Fixed fields per element: `appearance?: {fills, strokes}` with colour, width and dash only
  (`types.ts:293-295, 699`), plus one bespoke field per effect (`transformEffect`, `extrude`, `inflate`,
  `warp`, `glow*`).
- Distort & Transform is destructive and runs on flattened polygons (`utils/path-distort.ts:202`,
  `store/app-store.ts:9385`).
- `docs/illustrator-effects-logo-gaps.md:13-24` names the live effect stack as the biggest parity item.

**Decision: port the model and evaluation order to TS.** Add `effects: EffectRef[]` on the element and on
each `PaintFill`/`PaintStroke`, an effect catalog with defaults and `lengths`, and a pure
`applyGeometry(effects, anchors, bounds)` memoised on element identity.
- Reimplement Roughen, Pucker/Bloat, Zig-Zag, Twist, Tweak and Free Distort on Bézier anchors through a
  `mapNonlinear` port.
- Offset and Outline Stroke effects call the WASM pathops from §5.1.
- Migrate the existing bespoke fields (`warp`, `glow*`…) into the stack in the file-format migration chain
  (§4.5).
- **Render-style parity:** effects produce geometry, so rough.js (sketch) and the clean path
  (architectural) both consume the same output. Verify both styles, per `CLAUDE.md`.
- Effort: about 1.5–2 weeks (model, renderer, SVG/PDF export, Appearance panel). The math is about 400
  lines.

### 5.3 Blends, Repeat, Envelope, Mesh

| Feature | VectorCraft | Yappy today | Decision |
|---|---|---|---|
| **Repeat** | Live. `RepeatKind::{Radial, Grid, Mirror}` → `repeat_transforms()` returns a list of affines; the source is stored once (`crates/doc/src/pattern.rs:364-426`) | Destructive clones (`radialRepeat`/`gridRepeat`, `app-store.ts:8407/8442`) | **Adopt**: a live repeat group, ~2–3 days. Small, visible win |
| **Blends** | Live, editable spine. Subpaths paired, resampled to equal anchor counts, winding and start point aligned so steps don't twist, gradients interpolated through a common stop set (`crates/doc/src/blend.rs`, `blend_step_count` l.730) | Destructive. The morph flattens both shapes to 120 points of the **outer ring only**, so holes, curves and spine edits are lost (`app-store.ts:6684, 6738, 6839`) | **Adopt** the anchor-matching algorithm, ~4 days; make it live after §5.2 |
| **Envelope** | Content mapped onto a warp style, a Catmull-Rom grid (`grid_eval` l.1038) or a **Coons patch from a top object** (`Coons::from_path` l.502). Curves stay curves via `map_nonlinear` | Bilinear or Catmull-Rom per cell, maps **polylines** (`utils/envelope-warp.ts:338`) | **Adopt** `mapNonlinear` for curve output plus Coons "make with top object", ~2 days |
| **Gradient mesh** | Points with 4 tangent handles, Coons patches, tessellated with a half-pixel overlap so no seams show | Even-grid nodes, bilinear (C0) colour (`utils/mesh-gradient.ts`) | Later. A data-model change, ~1 week, low priority |

### 5.4 Width profiles and brushes

- **Width** (`crates/effects/src/stroke/width.rs`, 367 lines):
  - Points are `(t, left, right)`, so the two sides can differ.
  - The path is densified at each width point, so the profile is exact.
  - Corners take the stroke's join on the outer side, ends take caps, closed paths become two loops of
    opposite orientation, and dashes read the profile at their position along the path.
  - Yappy's `utils/variable-width.ts:62` takes 80 fixed samples, is symmetric only and works on open paths
    only, with no joins (the ribbon self-intersects on tight curves) and no caps.
  - **Adopt: port it, ~3 days.**
- **Brushes:**
  - Calligraphic uses the closed-form elliptical-nib width `2√(a²(u·n)² + b²(v·n)²)`
    (`crates/brush/src/calli.rs:1-6`).
  - Art, scatter and pattern brushes map art onto an arc-length frame (`track.rs`, `warp.rs`).
  - Yappy has none of these.
  - **Later:** calligraphic plus art, about 1 week, after width profiles.

### 5.5 Image Trace

VectorCraft (`crates/trace`, clean-room from the potrace paper) runs this pipeline:
1. Quantise: median cut, then weighted k-means.
2. Despeckle by merging small components into their neighbours.
3. Follow pixel-crack contours, turning right at saddles.
4. De-jag, then Douglas–Peucker.
5. Fit Béziers by least squares with corner detection.

Yappy's `utils/image-trace.ts` produces marching-squares polylines with no curve fit and no denoise, and
the input is capped at 256 px (`app-store.ts:4830`).

**Adopt:** compile `vectorcraft-trace` into the same WASM module as pathops (it already depends on it) and
feed it RGBA from `getImageData`. About 2 days once §5.1 exists.

---

## 6. Rendering and text

### 6.1 Rendering techniques that carry over to Canvas2D

VectorCraft doesn't use dirty rectangles or tiles. It re-renders the whole viewport and is fast because of
four plain techniques (`crates/render/src/lib.rs`):

1. **Cull plus a quarter-pixel LOD.** Skip a node if its cached bounds (padded 2 px) miss the view, and
   skip any leaf smaller than ¼ px (`skipped()`, l.674-690). Group bounds are built from cached child
   bounds.
2. **Caches keyed by object identity.** Geometry, bounds, expanded strokes, clips and glyphs are keyed by
   `Arc::as_ptr`, so an unchanged node is an exact hit and **nothing needs invalidating** (l.259-272).
   Entries unused for 3 frames are evicted.
3. **Opacity folded into paint alpha** for single-paint paths instead of opening a compositing layer
   (l.733-760).
4. **Reprojection.** If the last frame took more than 8 ms, the next render goes to a worker while the UI
   stretches the previous frame's texture to the new pan/zoom, and the worker keeps only the newest job
   (`crates/ui-egui/src/render_worker.rs`, `canvas.rs:240-298`).

**Yappy today:**
- `components/canvas.tsx` redraws through one large effect plus about 20 direct
  `requestAnimationFrame(draw)` calls (l.834, 1596, 1708, …). **`draw()` (l.456) has no pending-frame
  guard**, so several draws can run in one frame.
- The only geometry cache is `utils/rough-cache.ts`, keyed by a content hash (`digestElement`). It is wiped
  wholesale at 2,000 entries.
- Architectural mode rebuilds `Path2D`s every frame.
- The WASM batch cull sits behind a default-off flag (`wasm/feature-flags.ts`).

**Decisions, in order:**

| # | Change | Effort |
|---|---|---|
| a | **Coalesce redraws.** *(Done 2026-10-07, bug #409: 10 paints → 1 per frame.)* Use `scheduleDraw = () => raf ||= requestAnimationFrame(() => { raf = 0; draw(); })` and replace every direct call | S |
| b | **Perf-budget harness** *(Done 2026-10-07: `tests/perf-budget.spec.ts`. First result at 2k elements: fit render ~190–350 ms, hit test ~11 ms/click, both worth chasing.)* (`tests/perf-budget.spec.ts`): a seeded synthetic document of 5k mixed elements in *both* styles, medians for fit render, pan, 400% zoom, hit test, SVG export, save/load. Skip when the machine is loaded | S–M |
| c | **Identity-keyed caches.** Use `WeakMap<DrawingElement, {bounds, path2d, drawables}>` instead of hash digests. Solid keeps object identity for unchanged elements, which is the same property VectorCraft gets from `Arc`. Cache `Path2D` too | M |
| d | **Pan/zoom reprojection.** Keep the last scene in an `OffscreenCanvas`, `drawImage` it at the new transform during a gesture, and re-render on idle or gesture end. Overlays stay live on top | M |
| e | Cached group bounds plus the ¼ px LOD for groups and frames | S |

**Doesn't translate:** vello_cpu's SIMD sparse strips and the 4-thread rasteriser. Canvas2D is already
GPU-backed, and moving the scene into a Worker would put the store across `postMessage`.

**Hit testing:** VectorCraft has **no spatial index**. It walks the tree top-down with a `reach_bounds()`
reject (`crates/doc/src/hit.rs:60-135`) and stays under 2 ms at 50k paths (0.67 ms measured). Yappy also
scans linearly, but rebuilds its element map for every call (`canvas.tsx:423-424`). **Build the map once
per store revision. Don't build an R-tree** unless the harness says so.

### 6.2 Text

VectorCraft's text stack (`crates/text`):
- harfrust shaping with per-character font fallback.
- Greedy line breaking with kinsoku and hyphenation, or a Knuth–Plass composer for justified text
  (`composer.rs`).
- **Area type in any closed shape** through scanline intervals of the shape minus wrap shapes
  (`layout.rs` `poly_intervals` l.303, `Region::cells` l.366).
- **Threaded frames:** each frame owns a slice of the text, re-split after an edit by laying out each frame
  and cutting at the last line that fits (`thread.rs`).

| Take | Effort |
|---|---|
| Text on a path: measure pairs (`measureText(prev+ch) − measureText(prev)`) so kerning survives. Today each character is measured on its own (`text-on-path.ts:143`) | S |
| Area text inside any closed shape, via the scanline-interval idea. Pure geometry, so it works in both render styles | M |
| Threaded text boxes using the "each frame owns a slice" model, which keeps the renderer and exporters unaware of threading | M |
| Knuth–Plass justification (~130 lines). Only if justified text matters | S–M |

**Skip harfrust.** The browser already shapes text (complex scripts, ligatures, fallback).

---

## 7. File I/O

### 7.1 Embed the native document in SVG and PDF exports (high value, cheap)

**VectorCraft:**
- SVG export writes the native document as base64 inside
  `<metadata><vectorcraft:document hash="…">` (`crates/svg/src/export.rs:140-143, 593-622`).
- The hash is FNV-1a over all markup *outside* the metadata, with whitespace normalised (`body_hash`,
  `crates/svg/src/lib.rs:380`).
- On open (`editing()`, l.347-369), if the hash still matches, the exact native document is used. If
  another app edited the SVG, the SVG itself is parsed instead.
- PDF does the same with an embedded file plus a page hash (`crates/pdf/src/editing.rs`).

**Yappy:** exported SVGs reopen through `utils/svg-import.ts`, which (per its own header, l.1-10) skips
`<use>`, `<text>`, gradients and filters, and flattens everything to paths. Rough seeds, connectors, text,
styles and semantics are all lost.

**Decision: adopt.** Embed gzip+base64 Yappy JSON plus a body hash in `<metadata>`, and have
`svgToElements` check it first. Do the same for PDF through jsPDF file attachment or XMP. About 2 days. An
SVG export becomes a lossless Yappy file that any browser can still display.

### 7.2 Vector PDF

Yappy's `exportToPdf` **rasterises each page** (`utils/export.ts:1746, 1797` → `pdf.addImage`).
VectorCraft's PDF is fully vector, with real subset text (krilla). **Adopt the idea:** write a
`PdfRenderer implements IRenderer` on jsPDF's path API, the same way `SvgRenderer` already exists. Rough.js
output is plain paths, so sketch mode exports as vectors too. Medium effort. **Skip PDF import**: JS has no
equivalent of hayro, and pdf.js renders pages rather than producing a scene graph.

### 7.3 SVG import depth

Add gradients and `<text>` to `utils/svg-import.ts` (M), and an export→import round-trip spec modelled on
`crates/svg/tests/roundtrip.rs` (S).

### 7.4 Exporters return warnings

Every VectorCraft exporter returns `{…, warnings: [String]}`, so every fidelity loss is named
(`crates/eps/src/lib.rs:12-15`, `crates/cad/src/lib.rs:9-10`). Yappy silently drops filters and blend modes
in SVG/PDF. **Adopt:** exporters return `{blob, warnings[]}` and the UI toasts them. S.

EPS, DXF and EMF/WMF writers: **skip** unless architectural-style users ask for CAD hand-off (DXF would be
the one).

---

## 8. Interaction UX

| Behaviour | VectorCraft | Yappy today | Decision |
|---|---|---|---|
| **Cmd/Ctrl with any tool drags with the selection tool used last** (#270) | `UiState.last_selection_tool` (`crates/ui-egui/src/state.rs:243`), commit 47104f5 | Pen only (`utils/tool-handlers/pen-path-handler.ts:363`) | **Adopt**, ~½ day: `lastSelectionTool` in the store, keydown/keyup in `app.tsx` |
| **Space pans, Space+Ctrl zooms, +Alt zooms out** (#277) | `canvas.rs` `zoom_mode` (commit 3c096da) | Space always pans (`app.tsx:953-962`) | **Adopt** with a caveat: Cmd+Space is Spotlight on macOS and Ctrl+Space switches input methods on some Linux/Windows setups. Bind it, but don't make it the documented zoom shortcut |
| **Double-clicking type with a selection tool places the caret** (#283) | Re-dispatches the double-click to the Type tool (commit 11799fa). Without it, keystrokes fell through to tool shortcuts | Check `components/canvas.tsx:2823` `handleDoubleClick` | **Adopt** as a regression spec: double-click text, press `x`, assert the text changed and fill/stroke didn't swap |
| Shift+punctuation shortcuts (#280) | Matches as typed | Already handled via `e.code` (`app.tsx:670-679`) | Nothing to port. Add a test that asserts each `Ctrl+Shift+[ ] /` binding fires |
| **Contextual task bar** under the selection | 2–3 actions chosen by what's selected (several → Group/Unite; group → Ungroup/Isolate; text → Outlines; path → Offset/Simplify) plus Duplicate and a fill chip; can be switched off (`canvas.rs:1403-1470`) | None | **Adopt**, ~1 day. It only calls registry commands |
| **Per-tool hint bar** from one table | `hint_for(tool)` (`crates/ui-egui/src/chrome.rs:435-600`), with every string enumerated for i18n coverage tests | Hard-coded for selection and mindmap only (`components/status-bar.tsx:37-49`) | **Adopt**, ~½ day; fits the existing i18n-lint |
| **Shortcut conflict detection** + editor | `conflicts_with` / `all_conflicts` / presets; tests that every default survives a format→parse round trip; `every_bound_menu_command_exists` | None | **Adopt** the test now (a bun test: no duplicate chords per context across registry + help dialog). The editor comes free with §4.1 |
| Smart guides, pen tool | `crates/tools/src/guides.rs` (212 lines), `pen.rs` (239 lines) | `object-snapping.ts`, `guide-snapping.ts`, `point-snapping.ts`, `perspective-snap.ts`; `pen-path-handler.ts` (617 lines with parity tests) | **Nothing to take.** Yappy is ahead |

---

## 9. Testing and process

### 9.1 Test techniques worth copying

1. **Command sweep** (`crates/engine/tests/command_sweep.rs:53-160`):
   - Every registered command runs against three fixture documents (empty, single, multi) with `{}`, with
     no document, and with junk values (`crates/testkit/src/strategies.rs:424-449`: null, 1e308, u64::MAX,
     `""`, `"#zzzzzz"`, nested arrays).
   - After each call it asserts no crash, no open interaction and document invariants intact.
   - Known bugs sit in a `KNOWN_BUGS` list with an ignored repro test each (`known_bugs.rs`), so the sweep
     stays green while the bugs stay visible.
   - **Yappy:** `tests/command-sweep.spec.ts` over `getCommands()`. Fail on any `pageerror`, then assert
     store invariants: unique ids, no orphan `groupIds`, the active layer exists, Escape leaves no tool
     mode, undo returns to the fixture. Junk arguments over `api.ts` come second. **~1–2 days, start here.**
2. **Import fuzzing** (`crates/engine/tests/import_fuzz.rs`):
   - `survive()` requires that import doesn't crash and that whatever comes back also renders and exports.
   - It feeds NaN, inf, `"1e"`, `"--1"`, ±1e308 and −0 into about 60 SVG attributes. 64 cases by default,
     and `PROPTEST_CASES=20000` for a deep run.
   - **Yappy:** add `fast-check` and run it against `svgToElements`, `parseSvgPathData`, DSL import and
     drawing load. ~1 day.
3. **Model-based undo** (`crates/engine/tests/model_based.rs:12-36`):
   - It runs 40–80 random commands with invariant checks every step and a save/load round trip every 10.
   - Then undo-all must equal the start, redo-all must equal the end, and a failing batch must roll back
     entirely.
   - **Yappy:** fast-check `commands()` over the store. ~2 days, after the sweep.
4. **Pixel-property render tests, not screenshot baselines** (`crates/render/tests/golden.rs:39-60`;
   helpers in `crates/testkit/src/raster.rs`):
   - Assertions read like "red decreases along x" or "midpoint ≈128 ±20".
   - They don't break when fonts or antialiasing change.
   - **Yappy:** a `tests/helpers/pixels.ts` that reads `getImageData` in the page. Use it for both render
     styles.

### 9.2 Process and governance

- **A weighted parity score, graded honestly** (`ROADMAP.md` Parity estimate; rules in `AGENTS.md`):
  - Illustrator is split into 22 weighted areas, each scored by *depth of behaviour*, not by whether a menu
    item exists.
  - Interaction fidelity is a separate column, there's a "how much to trust these numbers" note, and the
    table is updated in the same PR as the feature.
  - Yappy's `docs/illustrator-tool-parity.md` uses binary FULL/PARTIAL/MISSING labels and contradicts
    itself: Puppet Warp, Perspective Grid, Slice and Graphs are marked shipped *and* listed under Deferred.
  - **Adopt** the rubric (½ day) and a LOOP.md line to update it with each feature. **Drop** the
    agent-hour estimates; VectorCraft's own note admits they're noisy.
- **Asset attribution check** (`xtask/src/assets.rs:9-60`): CI fails on any asset without a row in
  `ASSETS.md`. Yappy ships about 1,586 SVGs and 15 TTFs; `frontend/public/fonts/outline/*.ttf` has **no
  licence file**. Since we publish an OSS mirror, **adopt**: `scripts/assets-check.mjs` plus `ASSETS.md`
  with directory-level rows, wired into ship-it step 8 (`--verify`). ~2 h.
- **No hard-coded colours** (`crates/ui-egui/src/theme.rs:41`): Yappy has 926 raw hex values in
  `components/*.css` against 135 tokens in `index.css`. Optional: a stylelint `color-no-hex` rule with a
  ratchet.
- **Clean-room discipline** (`AGENTS.md` Non-negotiables): never read GPL code, never copy Adobe assets or
  wording, behaviour only from docs and black-box observation. This is a useful reminder for Yappy's
  Illustrator-parity work. Note that CLAUDE.md points at Inkscape as a reference. Yappy is AGPL, so
  *reading* GPL code is legally fine for us, but **code that we want to keep re-licensable (the CDN SDK,
  npm package) should not be derived from it**.

---

## 10. What NOT to take, and why

| Item | Reason |
|---|---|
| The egui UI / the whole app as WASM | 7.1 MB gzipped, single-threaded on the web, and a different UI paradigm. Yappy's Solid UI is the product |
| `vello_cpu` renderer, render worker threads | Canvas2D is GPU-backed; the transferable parts are the techniques in §6.1 |
| `harfrust` / `skrifa` text shaping | The browser shapes text already |
| `Arc` structural sharing (now) | Fights Solid's merge-in-place store; 2–3 weeks; only if the perf harness shows snapshot cost |
| The 25 bespoke MCP tools, the TCP control port | `run_command` plus schemas covers them; TCP is a native-app concern |
| wasmi plug-ins | Use a Worker sandbox with the same JSON contract |
| Writing older file versions, u64 counter IDs | A web app doesn't need them; string IDs are fine |
| TSV i18n catalogs, egui headless frame tests | Yappy's typed locales, `i18n-lint` and Playwright already cover these better |
| Smart guides, pen tool | Yappy's are more complete |
| No-panic lint regime, external corpus repo | Too heavy; error boundaries plus the command sweep cover the same risk in JS |
| Agent-hour roadmap estimates | Self-admittedly noisy; keep the scoring rubric, drop the hours |
| `effects` crate compiled whole | It's tied to their document model and pulls in `plugins`/wasmi. Port the pieces |

---

## 11. Suggested sequencing

**Phase A, foundations (about 1.5 weeks).** These unblock everything else.
1. Command sweep spec over the current registry (§9.1-1). It finds bugs immediately, and later it guards
   the refactor.
2. File-format hardening: reject newer versions, keep `extra`, migration chain (§4.5).
3. rAF coalescing and the perf-budget harness (§6.1 a, b).
4. Typed command registry + `execute()` + labelled, selection-restoring history with rollback (§4.1, §4.2).
5. Shortcut-conflict test; generate the help dialog from the registry (§8).

**Phase B, geometry quality (about 2 weeks).**

6. WASM pathops with fallback, cleanup pass and property tests (§5.1).
7. Width-profile port (§5.4), live Repeat (§5.3).
8. Begin/Preview/Commit, porting move, resize and draw (§4.3).

**Phase C, live effects and I/O (about 3 weeks).**

9. Effect stack model + `mapNonlinear` + migration of bespoke effect fields (§5.2).
10. Curve-matching blends, Coons envelope (§5.3).
11. Native document embedded in SVG/PDF; exporter warnings (§7.1, §7.4).
12. Vector PDF renderer (§7.2).

**Phase D, reach (as needed).**

13. Live MCP bridge (§4.4), contextual task bar and hint bar (§8), image trace via WASM (§5.5), area and
    threaded text (§6.2), pan reprojection and identity caches (§6.1 c, d), the plug-in contract (§4.7),
    the parity rubric and assets check (§9.2, which can go at any time, ½ day total).

Yappy's memory notes hardening is planned for Nov 2026. Phase A, the sweep, fuzzing and model-based tests
fit that month naturally.

---

## 12. Licensing and attribution

- VectorCraft code is **MIT OR Apache-2.0**, compatible with Yappy's **AGPL-3.0-only**. Porting or bundling
  is allowed if we keep the copyright notice and licence text. Choosing MIT is the simpler obligation; if
  we take it under Apache-2.0, carry its `NOTICE`.
- Dependencies pulled in by the WASM module (`linesweeper`, `polycool`, `kurbo`, `arrayvec`,
  `smallvec`…) are MIT OR Apache-2.0. **Before shipping, run `cargo about` (or `cargo license`) on the
  probe crate** and record the result. The `svg` debug dependency of linesweeper wasn't checked.
- Ported TS (e.g. `mapNonlinear`, `width.rs`, blend matching) gets a header comment naming the source file
  and licence, plus a row in a new `THIRD_PARTY_NOTICES.md` (or `ASSETS.md`, §9.2).
- **Never** copy anything from `docs/brand/` (ArtCraft trademarks, not open source).
- The WASM binary ships in the OSS mirror (`algorisys-oss/yappydraw`) and possibly the CDN SDK, so the
  notice must travel with it: check `.ossignore` doesn't strip it.

---

## 13. Reproducing this review

```sh
cd temp
git clone https://github.com/storytold/vectorcraft
export CARGO_TARGET_DIR=$PWD/vc-target CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_CODEGEN_UNITS=16
(cd vectorcraft && cargo build --release -p vectorcraft-cli -j 6)       # ~6 min, ~760 MB target
vc-target/release/vectorcraft-cli run --in vectorcraft/examples/neon-drive.vectorcraft --export out.png
vc-target/release/vectorcraft-cli perf --paths 20000                    # run on an idle machine
(cd vectorcraft && cargo test --release -p vectorcraft-pathops)
```

Warning from VectorCraft's own `AGENTS.md`: a **full** workspace build target grows to about 30 GB. Build
only the CLI (as above) on this machine, which had 36 GB free at review time.

The WASM probe (a wrapper crate exposing `op_svg(a, b, op)` over `vectorcraft_pathops::boolean`, built with
`opt-level="z"`, `lto`, `panic="abort"` for `wasm32-wasip1`) was a throwaway in the session scratchpad. The
recipe is in §3.3 and takes about 25 lines to rebuild.
