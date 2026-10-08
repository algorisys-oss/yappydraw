import { resolve, type CommandSpec } from "./registry";
import { commandUi } from "./ui-port";

/**
 * `execute()` — the one way to run a command.
 *
 * Every caller goes through here: the palette, the keyboard (P4), menus as they migrate, the
 * public API, and later an agent. That is what makes one action become one labelled, atomic
 * undo step *everywhere at once*, rather than in each caller separately.
 *
 * The order is the contract (§3.2). Nothing runs until the first three checks pass, so a
 * command with bad parameters or unmet preconditions cannot leave a half-edit:
 *
 *   1. resolve the id (aliases included)
 *   2. validate parameters
 *   3. ask `enabled()`
 *   4. open a history transaction labelled `history` (unless `history === false`)
 *   5. run
 *   6. on success, close the transaction — at most one undo entry
 *   7. on throw, roll back to the snapshot, drop the entry, log, tell the user, return not-ok
 */

export type CommandResult =
    | { ok: true; result: unknown }
    | { ok: false; reason: string };

/** A failure that is the caller's fault (unknown id, bad params, not available right now). */
const fail = (reason: string): CommandResult => ({ ok: false, reason });

/**
 * Human label for a message, without importing i18n here — the caller's `t` is applied by the
 * UI layer. Falls back to the id, which is more useful in a log than an empty string.
 */
const describe = (spec: CommandSpec<any>): string => spec.labelKey || spec.id;

export const execute = (id: string, params?: unknown): CommandResult => {
    const spec = resolve(id);
    if (!spec) return fail(`unknown command: ${id}`);

    // 2. Parameters. A command with no schema takes none; passing some is not an error, it is
    // ignored, which keeps a caller that sends extra context from being rejected outright.
    let value: any = params;
    if (spec.params) {
        const parsed = spec.params.parse(params);
        if (!parsed.ok) return fail(parsed.error);
        value = parsed.value;
    }

    // 3. Preconditions. The string is user-facing — "Select two or more objects" — and is what
    // the palette shows on a greyed row instead of letting the user click and see nothing.
    if (spec.enabled) {
        const verdict = spec.enabled(value);
        if (verdict !== true) return fail(verdict);
    }

    const runIt = () => spec.run(value);

    try {
        // 4-6. View toggles and tool switches change no document state, so they open no
        // transaction at all and stay out of undo exactly as they are today.
        const result = spec.history === false
            ? runIt()
            : commandUi().withHistory(spec.history || describe(spec), runIt);
        return { ok: true, result };
    } catch (err) {
        // 7. `withCommandHistory` has already restored the snapshot and dropped the entry, so
        // the document is as it was. Say so rather than failing silently — an action that
        // appears to do nothing is indistinguishable from one that did something invisible.
        console.error(`[commands] ${spec.id} failed`, err);
        commandUi().notify(`${describe(spec)} failed — nothing was changed`, 'error');
        return fail(err instanceof Error ? err.message : String(err));
    }
};

/**
 * Why a command cannot run right now, or null when it can. Used by the palette to grey a row
 * (D5) without running anything.
 */
export const disabledReason = (id: string, params?: unknown): string | null => {
    const spec = resolve(id);
    if (!spec) return `unknown command: ${id}`;
    if (!spec.enabled) return null;
    const verdict = spec.enabled(params as any);
    return verdict === true ? null : verdict;
};
