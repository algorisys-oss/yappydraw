# Command registry and labelled undo: design for review

**Status:** proposal, not started · **Date:** 2026-10-07 · **Branch:** `dev`
**Origin:** `docs/vectorcraft-review.md` §4.1–4.3 (VectorCraft's "everything is a command")
**Decisions needed from Rajesh:** §9. Nothing in this doc is built until those are answered.

---

## 1. The problem, with evidence

Yappy has four parallel descriptions of "what the user can do", and nothing keeps them in step.

| Where | What it holds | Size |
|---|---|---|
| `utils/command-registry.ts` | `Command { id, label, category, action: () => void, shortcut? }`, used only by the ⌘K palette | 149 commands, 49 with a `shortcut` string |
| `app.tsx` `handleKeyDown` (l.188–~1060) | the real keyboard behaviour: an `if/else` chain on `key` / `code` | ~140 key comparisons in ~870 lines |
| `components/help-dialog.tsx` `SHORTCUT_DATA` | the hotkey list users read | 205 rows |
| `api.ts` `YappyAPI` | the scriptable surface: positional-argument methods | ~650 methods, 5,900 lines |

What that costs today:

- **Shortcuts drift.** A `shortcut` string in the registry is only a label: it binds nothing.
  The binding is wherever `app.tsx` happens to handle the key, and the help dialog copies it
  by hand. A diff of the three, made while writing this doc, found **Shift+L (Lasso)**: it is
  handled in `app.tsx` and labelled in the registry, but it's missing from the help dialog. No
  test can catch this class of drift, because nothing relates the three.
- **The palette can't explain itself.** `action: () => void` has no "is this available now?".
  The palette offers *Group* with nothing selected, and picking it silently does nothing (`groupSelected` returns early when fewer than two objects are selected).
- **Undo is anonymous.** A history entry is a bare snapshot (`store/app-store.ts:985`). The
  History panel can only print "State 12 · 40 obj" (`components/history-panel.tsx`). Undo
  also restores the document but **clears the selection** (`restoreSnapshot` ends with
  `setStore("selection", [])`), so undoing a move leaves nothing selected.
- **One action can be many undo steps.** Each store function calls `pushToHistory()` itself
  (366 call sites in 45 files; 188 in `app-store.ts` alone). A command that calls three of
  them makes three entries. `withoutHistory` exists because a 122-path mandala once needed 123
  undos and overflowed the stack, so every caller opts out by hand.
- **A throw leaves a half-edit.** If a store function throws after `pushToHistory()`, the
  document is left half-mutated with an orphan snapshot on the stack. Nothing rolls back.
- **Agents can't discover anything.** `window.Yappy` is 650 methods with no list, no
  parameter schema and no "why is this disabled". The MCP server (`backend/mcp`) edits files
  on disk instead of the live editor (review §4.4).

## 2. Goals and non-goals

**Goals**
1. One registry is the source of truth for every user-visible action: its id, label, menu
   placement, shortcut, parameters, availability, undo label and implementation.
2. One entry point, `execute(id, params?)`, which validates, checks availability, makes
   **exactly one labelled undo step**, and **rolls back on a throw**.
3. The palette, keymap, help dialog and (later) MCP are generated from the registry, and tests
   check that they agree.
4. Undo restores the selection, and the History panel shows what each step was.
5. Incremental migration: every phase ships on its own, and old and new paths coexist.

**Non-goals (this proposal)**
- Rewriting `api.ts`. Its methods keep working; registry commands *call* them or the store
  functions underneath.
- Pure "tools return actions" tool handlers (review §4.3). The Begin/Preview/Commit
  interaction API is a separate, later proposal. This one only gives it something to commit
  into.
- Structural sharing / persistent data structures for history (review §4.2: deferred until the
  perf harness shows snapshot cost).
- Moving tool-modal keys out of their tools (the pen's Enter/Esc, animation F-keys, text
  editing). Those stay where they are (§5.3).

## 3. Design

### 3.1 The command spec

New module `frontend/src/commands/registry.ts`. It contains no UI imports (§3.6):

```ts
export interface CommandSpec<P = void> {
    /** Stable, namespaced. Existing palette ids are kept as aliases (§3.7). */
    id: string;                         // 'object.group', 'view.zoomToFit', 'tool.lasso'
    /** i18n key for the label; resolved at read time so locale switches just work. */
    labelKey: string;                   // 'commands.action-group'
    category: CommandCategory;          // today's six palette categories, unchanged
    /** Keyboard binding(s), parsed once. The ONLY place a global shortcut is declared. */
    shortcut?: string | string[];       // 'Mod+G'   (Mod = Ctrl on Win/Linux, ⌘ on macOS)
    /** Where the binding applies; see §3.4. Default 'canvas'. */
    when?: KeyContext;
    /** Parameter schema; absent = takes no params. Validated by execute(). */
    params?: ParamSchema<P>;            // see decision D1
    /** true = available; a string = why not, shown in the palette and returned to agents. */
    enabled?: (p: P) => true | string;
    /** Undo label (i18n key), or false for view/selection/UI-only commands (no history). */
    history?: string | false;
    run: (p: P) => unknown;             // may return a result (new ids, etc.)
}
```

Commands are plain objects in per-area files (`commands/object.ts`, `commands/view.ts`,
`commands/tool.ts`…), each exporting an array and registered once at startup. The palette's
current `getCommands()` becomes a projection of the registry.

### 3.2 `execute()`: the one way in

```ts
execute(id, params?) → { ok: true, result } | { ok: false, reason }
```

In order:
1. Resolve `id` (aliases included). Unknown → `{ ok: false, reason: 'unknown command' }`.
2. Validate `params` against the schema. Invalid → `ok: false` with the validation message.
   Nothing runs.
3. `enabled(params)`. A string → `ok: false` with that reason. Nothing runs.
4. Open a **history transaction** labelled `history` (§3.3), unless `history === false`.
5. `run(params)` inside `try`.
6. On success: close the transaction (it holds at most one undo entry) and return the result.
7. On throw: **roll back** to the transaction's snapshot (if one was taken), drop that entry,
   `console.error` the error, toast "*{label}* failed: nothing was changed", and return
   `ok: false`.

Every caller goes through `execute`: keyboard, palette, menus (as they migrate), the
`Yappy.run()` API, MCP. That is how one action becomes one undo step everywhere at once.

### 3.3 History transactions: one command, one undo step, with no edits at the 366 call sites

The key to migrating cheaply: **don't touch the existing `pushToHistory()` calls.** Make them
transaction-aware instead.

```ts
// store/app-store.ts (sketch)
let txn: { label: string; pushed: boolean } | null = null;

export const pushToHistory = () => {
    if (historySuspended > 0) return;
    if (txn) {
        if (txn.pushed) return;              // later pushes in the same command: no-op
        txn.pushed = true;                   // first push: capture, with the command's label
    }
    undoStack.push({ ...captureSnapshot(), label: txn?.label ?? null, selection: [...store.selection] });
    …
};
```

- **Lazy.** The snapshot is taken on the command's *first* real edit, exactly where today's
  code already calls `pushToHistory()`, so no-op commands (nothing selected, early return)
  leave no entry. That is today's behaviour, kept.
- **Collapsing.** The second and later pushes inside one command are ignored. That gives one
  undo step per command without touching the store functions, and for commands it makes
  `withoutHistory` unnecessary.
- **Outside a command** (old call paths not yet migrated, tool drags), `pushToHistory()` behaves
  exactly as today, with `label: null`. Nothing breaks during migration.
- **Rollback.** On a throw, if `txn.pushed`, restore that snapshot and pop it.

**Entry shape** (`HistorySnapshot` gains two fields):

```ts
interface HistoryEntry extends HistorySnapshot {
    label: string | null;      // i18n key, or null for legacy/unlabelled pushes
    selection: string[];       // ids selected BEFORE the edit
}
```

**Undo restores the selection**, filtered to ids that still exist, instead of clearing it.
Redo restores the selection that was current when undo ran (captured into the redo entry the
same way). The History panel shows `t(label)` when present and keeps "State n" as the fallback.
Unmigrated actions read exactly as they do today.

The memory cost is one string array per entry, negligible next to the element clones.

### 3.4 Keymap

New `commands/keymap.ts`. `app.tsx` calls it **first** in `handleKeyDown`, after the existing
"a modal dialog is open" guard:

```ts
const cmd = matchShortcut(e, currentKeyContext());   // registry lookup, parsed chords
if (cmd) { e.preventDefault(); void execute(cmd.id); return; }
// …the existing if/else chain continues unchanged for everything not yet migrated
```

- **Chords** are parsed once from `shortcut`: `Mod`, `Ctrl`, `Alt`, `Shift`, plus a key
  matched on **`e.code`** for punctuation and letters, as `app.tsx` already learned to do
  (Shift+punctuation and Alt-rewritten keys; VectorCraft fix #280 is the same lesson).
- **`when` contexts** decide precedence: `'canvas'` (no text input focused, no tool mode
  claiming the key), `'global'` (even in inputs, e.g. Mod+S), `'animation'` (docType is
  animation). Tool modes that own keys (pen building, text editing, effect dialog) make
  `currentKeyContext()` return their own context, so global commands step aside. That
  replaces today's ordering-by-position-in-the-if-chain with an explicit rule.
- **Migration:** each key moves from the `if/else` chain into a `shortcut` on its command,
  one category per PR. The chain shrinks. Keys that are genuinely modal stay in their tools.

### 3.5 Generated help dialog and conflict checks

- Help-dialog rows that correspond to a command become `{ command: 'object.group' }`. Label
  and keys are read from the registry, so they can't disagree. Gesture rows ("Shift+Drag",
  "Three-finger tap") stay hand-written, because they aren't commands.
- **Test `commands/registry.test.ts`** (bun, no browser):
  - ids are unique and namespaced; every `labelKey` and `history` key exists in `en.ts`;
  - **no two commands share a chord in overlapping `when` contexts**;
  - every `shortcut` parses;
  - every help-dialog `{ command }` row names a registered command;
  - **every chord the help dialog lists is either a registry shortcut or explicitly marked
    gesture/modal**, which turns the Shift+L class of drift into a test failure.
- **Command sweep** (review §9.1, Playwright): every command is executed against three fixture
  documents (empty, one shape, a mixed selection) with no params and with junk params. Assert:
  no `pageerror`, the store invariants hold, and a disabled command returns its reason
  instead of throwing. This is the regression net for the whole migration.

### 3.6 Layering

`commands/*` may import the store and pure utils. It must **not** import components. Commands
that need UI (open a dialog, toast) take it from a small `commands/ui-port.ts` that the app
fills at startup. Today `command-registry.ts` imports `toast`, `menu`, five dialogs and the
gallery signal, which is why `i18n/fr-search.test.ts:44` notes it "cannot be imported here".
The port is what lets the registry, `execute` and the sweep run under `bun test` without a
DOM, and later under a headless MCP backend.

### 3.7 Public surface

```ts
Yappy.commands.list()            → [{ id, label, category, shortcut, params: JSONSchema, enabled: true | reason }]
Yappy.commands.run(id, params?)  → { ok, result } | { ok: false, reason }
```

- Existing palette ids (`action-group`, `tool-lasso`…) keep working as aliases of the new
  namespaced ids. The alias table lives next to the registry and is tested, like VectorCraft's
  `ALIASES`.
- `api.ts` methods are untouched. Where one maps 1:1 to a command, its JSDoc gains "also
  available as command `object.group`". Folding `api.ts` into commands can be decided later.
- The MCP `list_commands` / `run_command` tools (review §4.4) are a thin layer over these
  two calls. They're a separate step, not part of this proposal.

## 4. Migration plan

Each phase is one PR that ships on its own. "Done" includes tests, docs, the help doc and `api.ts`.

| Phase | Scope | Est. | Done when |
|---|---|---|---|
| **P1** History transactions | `HistoryEntry {label, selection}`; transaction-aware `pushToHistory`; undo/redo restore selection; History panel shows labels; rollback helper. No registry yet: `withCommandHistory(label, fn)` wraps existing palette actions | 1–1.5 d | Unit tests: N pushes in a txn → 1 entry; throw → rolled back, stack unchanged; undo restores selection; unlabelled pushes unchanged |
| **P2** Registry core | `CommandSpec`, `execute`, params validation (D1), `enabled` reasons, `ui-port`, aliases. Port the 149 palette commands as-is (same behaviour, now with `enabled` where obvious) | 2 d | Palette works identically; disabled commands show their reason; `registry.test.ts` green |
| **P3** Command sweep | Playwright sweep over every command × 3 fixtures × {no params, junk} | 1 d | Green, with any bugs found fixed or listed as known (each with a repro) |
| **P4** Keymap | `matchShortcut` + contexts; move the global shortcuts (file, edit, arrange, view, tool letters) from `app.tsx` into the registry, one category per commit | 2–3 d | `app.tsx` chain holds only modal/contextual keys; conflict test green; every existing hotkey spec green |
| **P5** Generated help | Help-dialog rows reference commands; drift test | 0.5 d | Shift+L appears in help; drift test fails if a shortcut is removed from the registry without the help row |
| **P6** Public API | `Yappy.commands.list/run`, JSON Schema export, help doc for scripting | 0.5–1 d | API help doc lists them; one e2e spec drives a command by id |

**Total: about 7–9 days**, every phase independently useful. **P1 alone fixes the anonymous
undo and lost selection** for the whole app, because legacy pushes get the selection too, and it
needs no registry.

## 5. Behaviour changes users will notice

1. **Undo keeps your selection.** Today undo deselects everything.
2. **The History panel names the steps** ("Group", "Delete", "Align left"…) for migrated
   commands.
3. **Some actions that took several undos take one** (any command whose implementation called
   several store functions).
4. **Disabled palette entries say why** ("Select two or more objects").
5. **A failing command changes nothing and says so**, instead of leaving a half-edit.

None of these change saved files. `HistoryEntry` is in-memory only.

## 6. Risks and how each is handled

| Risk | Mitigation |
|---|---|
| A command relied on *several* undo steps (e.g. "undo just the second half") | No known case. P1's unit tests plus the sweep (P3) would show it; such a command can set `history: false` and push explicitly |
| Collapsing pushes hides a snapshot a tool drag needed | Transactions open only inside `execute()`. Tool drags aren't commands until the later interaction proposal, so they're untouched |
| Keymap precedence changes which handler wins a key | P4 moves one category at a time, with every hotkey e2e spec run per commit; the conflict test runs on every commit |
| Restoring the selection after undo selects something odd (an element in a hidden layer or a closed group) | Filter to ids that exist and are selectable now; fall back to empty, which is today's behaviour |
| Two sources during migration (registry + `if/else` chain) | Keymap runs first and the chain shrinks monotonically. The conflict test also scans the chain's remaining keys (D3) |
| Bundle size (zod, if chosen) | See D1; measured in P2 against `docs/bundle-optimization.md` |

## 7. Testing summary

- `store/history-txn.test.ts`: transactions, collapsing, rollback, selection restore, legacy
  pushes unchanged.
- `commands/registry.test.ts`: structure, i18n keys, chord parsing, **conflicts**, aliases,
  help-dialog drift.
- `tests/command-sweep.spec.ts`: every command, three fixtures, junk params.
- Existing hotkey/undo/palette specs run on every phase. `perf-budget.spec.ts` checks P1 adds
  no measurable cost to save/open and edits (the snapshot gains one array).

## 8. Out of scope (later proposals)

- Begin/Preview/Commit interactions for tool drags (review §4.3), built on P1's transactions.
- MCP live bridge (review §4.4), built on P6.
- Folding `api.ts` methods into commands.
- A user-editable shortcut map (falls out of P4 cheaply, but it's a UI decision).
- Menus generated from `CommandSpec.menu` paths.

## 9. Decisions needed

| # | Question | Options | Recommendation |
|---|---|---|---|
| **D1** | Parameter schemas | (a) **zod** in the frontend: validation, types and JSON Schema in one; zod 4's `zod/mini` is built to be a few KB gzipped and full zod is roughly 10–15 KB (to be measured in P2, not taken from the docs), and `backend/mcp` already uses zod 3. (b) a ~100-line hand-rolled schema (number/string/enum/array of ids) that emits JSON Schema. (c) TS types only, no runtime validation | **(a) `zod/mini`**: agents and junk-param sweeps need runtime validation, and hand-rolled validators are where bugs live. Lazy-load cost is negligible |
| **D2** | Command ids | (a) **new namespaced ids** (`object.group`) with the current ids as tested aliases. (b) keep the current flat ids (`action-group`) | **(a)**: namespaces group naturally in `list()`, and aliases keep anything that stored an old id working |
| **D3** | Does the conflict test also parse the remaining `app.tsx` `if/else` keys? | (a) yes, with a small regex extractor, until P4 empties the chain. (b) no: registry-only conflicts | **(a)** during migration; delete it once P4 is done |
| **D4** | Undo restores selection: also for unlabelled legacy pushes? | (a) **yes**, all entries capture selection from P1. (b) only command-made entries | **(a)**: it's the most visible user win, and it costs one array per entry |
| **D5** | Where a disabled command's reason shows | (a) palette row greyed with the reason as subtitle. (b) palette hides disabled commands | **(a)**: discoverability; it's how users learn what a command needs |
| **D6** | Order | (a) **P1 first** (labelled undo + selection, no registry). (b) P2 first | **(a)**: P1 delivers user-visible wins in about a day and de-risks the transaction model before anything depends on it |

---

*References:* VectorCraft `crates/engine/src/cmd/mod.rs:87-104` (CommandSpec),
`crates/engine/src/lib.rs:900` (execute), `:985-1007` (guarded rollback), `:61`
(HistoryEntry with label and selection), `tests/command_sweep.rs`. Yappy:
`utils/command-registry.ts:39,263`, `app.tsx:188`, `components/help-dialog.tsx:28`,
`store/app-store.ts:985-1092`, `components/history-panel.tsx`.
