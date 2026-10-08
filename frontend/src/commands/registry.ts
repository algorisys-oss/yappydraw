import type { Command } from "../utils/command-registry";

/**
 * The command registry — P2 of `docs/command-registry-plan.md`.
 *
 * One place that knows what every action is called, what it needs, whether it can run right
 * now, and what it does. Today that knowledge is scattered: the palette has a `Command[]` with
 * an opaque `action()`, `app.tsx` has a ~900-line `if/else` chain of shortcuts, the help dialog
 * has a hand-maintained table of key combinations, and nothing can answer "what can I do?"
 * — not the user, not a script, not an agent.
 *
 * This module deliberately imports **no components** (§3.6). `utils/command-registry.ts` pulls
 * in toast, the menu, five dialogs and a gallery signal, which is why `i18n/fr-search.test.ts`
 * records that it "cannot be imported here". Keeping the registry clean is what lets it, and
 * `execute`, run under `bun test` with no DOM — and later under a headless agent backend.
 * Commands that need UI take it from `./ui-port`.
 */

/** The six palette categories, unchanged — the registry is not a re-taxonomy. */
export type CommandCategory = Command['category'];

/**
 * A parameter schema.
 *
 * An interface rather than a concrete library: **nothing registered today takes parameters**
 * (all 142 palette commands are `() => void`), so installing a validator now would add a
 * dependency with no callers. D1 picked `zod/mini` for when one is needed — the sweep (P3) and
 * the public API (P6) are what need it — and it implements this shape in a few lines. The seam
 * exists now so `execute` validates from day one and the later change is additive.
 */
export interface ParamSchema<P> {
    /** Validate and (optionally) coerce. A string `error` is shown to the caller verbatim. */
    parse(value: unknown): { ok: true; value: P } | { ok: false; error: string };
    /** JSON Schema for the public listing. Optional until P6 needs it. */
    jsonSchema?(): Record<string, unknown>;
}

export interface CommandSpec<P = void> {
    /** Stable and namespaced: `tool.lasso`, `action.group`. Legacy ids live on as aliases. */
    id: string;
    /**
     * The label as the user reads it, already translated.
     *
     * Resolved rather than a key, because the palette's labels do not come from one key
     * family: most are `commands.<id>`, the shape commands are `shapes.<type>`, and the
     * per-layer ones are interpolated with a layer name that is not in any dictionary.
     * Reconstructing a key from an id got 186 of them wrong. `registerCommands` is cheap and
     * idempotent, so the app re-registers on a locale change instead — which it must do
     * anyway, since the list itself depends on store state.
     */
    label: string;
    /** The i18n key, where there is one. Kept for hand-written specs and for drift tests. */
    labelKey?: string;
    category: CommandCategory;
    /** Declared here and nowhere else, once the keymap (P4) lands. */
    shortcut?: string | string[];
    /** Absent = takes no parameters. */
    params?: ParamSchema<P>;
    /**
     * `true` when the command can run; a **string** saying why not otherwise. The string is
     * user-facing: the palette greys the row and shows it (D5), and `execute` returns it. That
     * is how someone learns a command needs a selection without having to try it and see
     * nothing happen.
     */
    enabled?: (params: P) => true | string;
    /**
     * Undo-step label (i18n key or plain text), or `false` for commands that change no document
     * state — view toggles, tool switches, panel visibility. `false` means `execute` opens no
     * history transaction at all, so they stay out of undo exactly as they are today.
     */
    history?: string | false;
    run: (params: P) => unknown;
    /** Older ids that should keep working. Resolved by `resolve()`; tested for collisions. */
    aliases?: string[];
}

// ── Storage ─────────────────────────────────────────────────────────────────

const specs = new Map<string, CommandSpec<any>>();
const aliasToId = new Map<string, string>();

/**
 * Register a command. Throws on a duplicate id or a colliding alias — a silent overwrite would
 * mean two features quietly fighting over one id, and the loser is whichever registered first.
 */
export const register = <P>(spec: CommandSpec<P>): void => {
    if (specs.has(spec.id)) throw new Error(`command "${spec.id}" is already registered`);
    if (aliasToId.has(spec.id)) {
        throw new Error(`command "${spec.id}" collides with an alias of "${aliasToId.get(spec.id)}"`);
    }
    for (const alias of spec.aliases ?? []) {
        if (specs.has(alias)) throw new Error(`alias "${alias}" of "${spec.id}" is already a command id`);
        const owner = aliasToId.get(alias);
        if (owner && owner !== spec.id) {
            throw new Error(`alias "${alias}" is claimed by both "${owner}" and "${spec.id}"`);
        }
    }
    specs.set(spec.id, spec);
    for (const alias of spec.aliases ?? []) aliasToId.set(alias, spec.id);
};

export const registerAll = (list: CommandSpec<any>[]): void => { for (const s of list) register(s); };

/** Resolve an id or a legacy alias to its spec. */
export const resolve = (idOrAlias: string): CommandSpec<any> | undefined =>
    specs.get(idOrAlias) ?? specs.get(aliasToId.get(idOrAlias) ?? '');

export const has = (idOrAlias: string): boolean => resolve(idOrAlias) !== undefined;

/** Every registered command, in registration order. */
export const all = (): CommandSpec<any>[] => [...specs.values()];

/** alias → canonical id, for tests and for reporting. */
export const aliases = (): Map<string, string> => new Map(aliasToId);

/** Drop everything. For tests — the app registers once at startup. */
export const clearRegistry = (): void => { specs.clear(); aliasToId.clear(); };

// ── Id derivation ───────────────────────────────────────────────────────────

/**
 * Legacy palette id → namespaced id: `action-new-artboard` → `action.newArtboard`.
 *
 * Derived rather than hand-mapped. A 142-row table would be 142 chances to typo an id that
 * then silently fails to resolve, and the existing ids already carry their namespace as a
 * prefix — the information is there, it just needs re-punctuating. The legacy id is always
 * kept as an alias, so nothing that stored one breaks.
 */
export const namespacedId = (legacyId: string): string => {
    const dash = legacyId.indexOf('-');
    if (dash < 0) return legacyId;
    const ns = legacyId.slice(0, dash);
    const rest = legacyId.slice(dash + 1);
    const camel = rest.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
    return `${ns}.${camel}`;
};
