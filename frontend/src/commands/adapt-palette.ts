import { store } from "../store/app-store";
import { getCommands, type Command } from "../utils/command-registry";
import { register, namespacedId, clearRegistry, all, type CommandSpec } from "./registry";

/**
 * Bring the existing palette commands into the registry.
 *
 * The plan calls for porting the ~142 palette commands "as-is". Written out by hand that is 142
 * new object literals duplicating definitions that already exist and are already translated —
 * and 142 chances to mistype an id, a label key or a store call, with the mistakes only
 * showing up when a user clicks the one command nobody tested. Adapting the existing list
 * instead gives the same registry, derives the namespaced ids mechanically (D2), keeps the
 * legacy ids as aliases, and leaves exactly one definition of each command.
 *
 * What a later, per-area hand-port buys that this does not: `params`, and `history: false` /
 * `enabled` tuned per command rather than inferred. Those are added here where they can be
 * known from the id, and the rest arrive as areas move to their own `commands/*.ts` files.
 */

/**
 * Commands that change no document state, so they must open no history transaction: tool
 * switches, view toggles, panel visibility, and undo/redo themselves — wrapping undo in a
 * history transaction would be a fine way to make undo unusable.
 *
 * Matched on the legacy id's namespace, which is exactly what those prefixes already encode.
 */
const NO_HISTORY_PREFIXES = ['tool-', 'view-', 'panel-', 'shape-'];
const NO_HISTORY_IDS = new Set([
    'action-undo', 'action-redo', 'action-clear-history',
    'action-select-all', 'action-deselect', 'action-select-similar',
    'action-zoom-fit', 'action-zoom-selection', 'action-present',
]);

const takesNoHistory = (legacyId: string): boolean =>
    NO_HISTORY_IDS.has(legacyId) || NO_HISTORY_PREFIXES.some(p => legacyId.startsWith(p));

/**
 * Preconditions worth stating, keyed by legacy id.
 *
 * Only where the reason is genuinely knowable from the id — a wrong "not available" is worse
 * than none, because it blocks a command that would have worked. Everything else stays
 * unconditioned and behaves exactly as today. The strings are user-facing: they appear on the
 * greyed palette row (D5) and are returned to scripts and agents.
 */
const needsSelection = (): true | string =>
    store.selection.length > 0 ? true : 'Select something first';

const needsTwo = (): true | string =>
    store.selection.length >= 2 ? true : 'Select two or more objects';

const ENABLED: Record<string, () => true | string> = {
    'action-group': needsTwo,
    'action-ungroup': () => {
        if (store.selection.length === 0) return 'Select a group first';
        const anyGrouped = store.elements.some(
            e => store.selection.includes(e.id) && (e.groupIds?.length ?? 0) > 0);
        return anyGrouped ? true : 'That selection has no group in it';
    },
    'action-delete': needsSelection,
    'action-duplicate': needsSelection,
    'action-front': needsSelection,
    'action-back': needsSelection,
    'action-forward': needsSelection,
    'action-backward': needsSelection,
    'action-lock': needsSelection,
    'action-flip-h': needsSelection,
    'action-flip-v': needsSelection,
    'action-rasterize': needsSelection,
    'action-outline-text': needsSelection,
    'action-undo': () => (store.undoStackLength > 0 ? true : 'Nothing to undo'),
    'action-redo': () => (store.redoStackLength > 0 ? true : 'Nothing to redo'),
};

/**
 * Per-layer commands (`layer-<uuid>`) are excluded.
 *
 * They are data, not capability: one entry per layer, labelled with the layer's name, with an
 * id that changes as layers come and go. A registry is the stable, addressable surface a
 * script or an agent works against, and `layer-3f2a…` is neither stable nor meaningful to one.
 * The palette still lists them — it reads `searchCommands()`, which is a live projection — so
 * nothing is lost from the UI.
 */
const isDynamic = (legacyId: string): boolean => /^layer-[0-9a-z]{6,}/i.test(legacyId);

/** Turn one legacy palette command into a spec. Exported for the test. */
export const specFor = (cmd: Command): CommandSpec<void> => ({
    id: namespacedId(cmd.id),
    label: cmd.label,
    // Most labels are `commands.<id>`, but the shape commands come from `shapes.<type>`.
    // Recorded where it is actually known, and left out where it is not, rather than guessed.
    labelKey: cmd.category === 'Shapes' && cmd.id.startsWith('shape-')
        ? `shapes.${cmd.id.slice('shape-'.length)}`
        : `commands.${cmd.id}`,
    category: cmd.category,
    shortcut: cmd.shortcut,
    history: takesNoHistory(cmd.id) ? false : `commands.${cmd.id}`,
    enabled: ENABLED[cmd.id],
    run: () => cmd.action(),
    aliases: [cmd.id],
});

/**
 * Register every palette command. Idempotent: clears first, so a locale switch or a hot reload
 * can rebuild the registry without tripping the duplicate-id guard.
 */
export const registerPaletteCommands = (): number => {
    clearRegistry();
    for (const cmd of getCommands()) {
        if (isDynamic(cmd.id)) continue;
        register(specFor(cmd));
    }
    return all().length;
};
