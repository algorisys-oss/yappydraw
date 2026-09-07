# Routing-channel layer — coordinated connector & label routing

> Bring Microsoft Comic Chat's **routing-channel** idea (reserve disjoint intervals
> so competing elements never overlap) to Yappy's connector routing, so multiple
> edges and labels sharing a node side / corridor get non-overlapping lanes instead
> of piling onto identical coordinates.
>
> Background & algorithm study: [docs/microsoft-comic-chat-algorithm.md](microsoft-comic-chat-algorithm.md) (§5.2 routing channels).

## 1. Problem statement (verified against current code)

Routing today runs **once per connector**, blind to sibling connectors and labels:

- Single call site: `refreshLinePoints` → `calculateSmartElbowRoute`
  ([binding-logic.ts:132](../frontend/src/utils/binding-logic.ts#L132)).
- Inside [routing.ts](../frontend/src/utils/routing.ts) obstacles are **shapes only** —
  `line`/`arrow`/`text` are filtered out ([routing.ts:138](../frontend/src/utils/routing.ts#L138)),
  so connectors never see each other.
- Endpoints resolve via `resolveBindingPoint`
  ([binding-logic.ts:180](../frontend/src/utils/binding-logic.ts#L180)): a named
  anchor or `anchorFractionX/Y` on the target shape. With no per-group logic, many
  edges into one side all resolve to the **same** anchor point.

### Prior art already in the tree (must reconcile, not duplicate)

`refreshBoundLine` already applies a **sibling spread**
([binding-logic.ts:243-361](../frontend/src/utils/binding-logic.ts#L243-L361)):

- `getOverlappingSiblingIndex` finds connectors sharing the **exact same element
  pair AND the same start/end positions**, then `computeSpreadOffset` shifts the
  **whole line** perpendicular by `index · 16px`.
- Limitations this plan addresses:
  1. **Only identical-pair siblings.** Edges from *different* source nodes into one
     shared target side each get `{index:0,total:1}` → **no spread → they overlap**.
     This is the dominant real-world case (a hub node with many incoming edges).
  2. **Rigid whole-line translation**, not per-endpoint port distribution — correct
     for parallel duplicates, wrong for fan-in.
  3. Ordering is `id.localeCompare` — arbitrary, so edges **cross** as they fan in.
  4. Labels are not considered at all.

So the existing spread is effectively a **narrow special case of Phase 2** (parallel
edges between one pair). Phases 1–2 generalise it and it should be folded in, with a
guard so a connector is never offset by both mechanisms.

## 2. Comic Chat → Yappy mapping

| Comic Chat (§5.2) | Yappy |
|---|---|
| Routing channel = reserved interval above a speaker for a balloon tail | **Node side = ordered set of ports** (disjoint fractions along that edge) and **corridor between clusters = parallel lanes** |
| Greedy balloon *bodies*, then **deferred** tail placement | Greedy coarse A* per edge, then **deferred** port/lane assignment once share-counts are known |
| `MaxAllowable` / `ReduceChannel` trim earlier channels to keep each a min width | Trim/space ports & lanes so every edge (and label) keeps a **disjoint** interval |
| Facing/Neighbors penalty ordering (40 ≫ 4 ≫ 1) | Order ports so the edge heading left takes the leftmost port → **minimise crossings** |
| Randomised width/position to hide machine regularity | Not wanted here — routing must be **deterministic/idempotent** (see §5) |

## 3. Phased plan

### Phase 0 — Coordinated entry point (no algorithm change)
New module `utils/connector-routing.ts` exposing
`routeConnectorGroup(connectors, elements)`. Group affected connectors by the
node(s) they touch and route the group with shared context. Callers that currently
refresh connectors one-at-a-time (shape move, group drag, auto-layout) route the
**affected set together**. A single connector is a group of one → no regression.

### Phase 1 — Port allocation (side channels) ← first PR
For each **node side**, gather *all* connector endpoints landing on it (regardless
of the other endpoint), order them to avoid crossings, and distribute them into
evenly spaced **disjoint ports** by writing `anchorFractionX/Y`. Pure function, no
WASM change, immediately visible. Full spec in §4.

### Phase 2 — Corridor lanes for parallel/overlapping runs
After coarse routes exist, detect edges sharing a collinear run; assign each a lane
offset within a reserved perpendicular channel (disjoint intervals). Deferred
allocation (like tails): route all coarse paths first, then allocate lanes once the
per-corridor share-count is known. **Subsumes the existing sibling-spread** for
same-pair parallels/self-edges.

### Phase 3 — Connectors as soft obstacles
Feed already-routed segments into A* as a **penalty** (not a hard block) — reuse the
`turnPenalty` machinery ([routing.ts:287](../frontend/src/utils/routing.ts#L287)),
add an overlap penalty. Route in a **deterministic order** (longer/anchored first,
id tiebreak) so results are stable frame-to-frame. **WASM parity required** — mirror
in `wasm/assemblyscript/assembly/routing.ts` + `wasm/bridge/routing-bridge.ts`.

### Phase 4 — Label lanes
Reserve an interval on the chosen segment per label; colliding labels push to
disjoint sub-intervals (the `MaxAllowable` trim analog). Uses `labelPosition`
([types.ts:425](../frontend/src/types.ts#L425)) + a computed perpendicular offset.

## 4. Phase 1 detailed spec

### Data
- Input: the current elements array; the set of connectors to (re)route.
- A connector endpoint "lands on side S of node N" when its binding's resolved
  point sits on N's edge S (`top|right|bottom|left`), derivable from
  `binding.position` or from which edge `resolveBindingPoint` returned.

### Algorithm `allocatePorts(node, side, endpoints)`
1. Collect every connector endpoint bound to `(node, side)`.
2. **Order** them by the position of the **opposite** endpoint projected onto the
   side's axis (x for top/bottom, y for left/right). Total order; tiebreak by
   connector `id`. This is the crossing-minimising sort (Facing/Neighbors analog):
   the neighbor to the far left gets the leftmost port.
3. **Distribute** `k` endpoints into `k` disjoint fractions along the usable span of
   the side (leave an end margin, e.g. usable `[0.15, 0.85]`), fraction
   `f_i = margin + (i + 0.5)/k · (1 − 2·margin)`.
4. Write `anchorFractionX/Y` on that binding: for top/bottom vary X = `f_i`, Y =
   0/1; for left/right vary Y = `f_i`, X = 1/0.

### Integration
- Runs as a pre-pass **before** `resolveBindingPoint`, since resolve already prefers
  `anchorFractionX/Y` when present ([binding-logic.ts:188](../frontend/src/utils/binding-logic.ts#L188)) —
  so Phase 1 just *computes* those fractions; the resolve path is unchanged.
- **Reconcile with sibling-spread:** when a connector's endpoint is port-allocated
  here, skip `computeSpreadOffset` for that endpoint (guard flag) to avoid
  double-offset. Same-pair parallels with identical ports still fall to Phase 2.
- Only recompute for sides whose endpoint set changed (keep it cheap).

### Determinism
Pure function of (elements). No `Date.now`/`Math.random`. Sort keys are total orders
with id tiebreak ⇒ **idempotent**: re-running on the same input yields identical
fractions.

### Tests (`utils/__tests__/connector-routing.test.ts`)
- `k` edges into one side ⇒ `k` distinct, sorted, in-range fractions.
- Order preserves no-crossing for a fan-in fixture (leftmost neighbor → leftmost port).
- Idempotency: run twice ⇒ identical output.
- Single edge ⇒ centered (`0.5`) — no regression vs. today.
- Guard: an edge port-allocated here is not also sibling-spread-translated.

### Out of scope for Phase 1
Corridor lanes (Phase 2), edge-vs-edge avoidance (Phase 3), labels (Phase 4),
curved/bezier ports (start with orthogonal `elbow` + straight; beziers inherit the
endpoint fraction but keep their own handles).

## 5. Cross-cutting constraints (from CLAUDE.md)

- **WASM parity:** Phases 1–2 are pure-JS pre/post passes (no WASM twin needed);
  Phase 3's penalty **must** be mirrored in the AssemblyScript module + bridge.
- **Determinism / idempotency:** routing recomputes every frame on drag — no random,
  total-order sorts, stable across runs.
- **Render-style parity:** routing is pre-render geometry, so both `sketch` and
  `architectural` styles are unaffected — but verify visually in both.
- **Docs/API:** if connector auto-routing becomes a user-visible toggle or an `api.ts`
  option, update the connectors help doc
  (`frontend/src/help-docs/shapes/connectors-doc.tsx`) and `api.ts`.

## 6. Sequencing / PR breakdown

1. **✅ Phase 1 — DONE** port allocation for hub fan-in (`utils/connector-routing.ts`
   + tests). Move-aware side via `sideFacing`; ports snapped to the true shape outline.
2. **✅ Phase 2 — DONE** generalised port allocation to any side with ≥2 endpoints,
   which covers same-pair bundles and bidirectional A↔B — and **retired the ad-hoc
   sibling-spread** (`getOverlappingSiblingIndex`/`computeSpreadOffset` removed). The
   guard is now `members.length < 2` (a lone endpoint keeps its plain anchor). Phase 0
   (coordinated entry point) proved unnecessary: each per-connector refresh sees the
   full element set and derives the same deterministic allocation.
3. **Phase 3 — TODO** soft edge obstacles: route mid-path segments to avoid running
   over *other* connectors (JS A* penalty + WASM parity). This is where cross-pair
   corridor sharing is solved.
4. **Phase 4 — TODO** label lanes.

Phases 1–2 shipped the most-visible wins (fan-in + bundle de-overlap) as pure,
deterministic functions with no engine/WASM risk. Remaining phases touch the A*
router and need WASM parity, so they carry more risk and get their own plan.
