/**
 * The seam between commands and the UI.
 *
 * `utils/command-registry.ts` imports toast, the menu, five dialogs and a gallery signal
 * directly, which is why `i18n/fr-search.test.ts:44` records that it "cannot be imported here":
 * pulling in one command drags in the component tree, and nothing that touches it can run
 * without a DOM. The registry must stay importable from a test, a script, and eventually a
 * headless agent backend, so commands that need UI ask for it through this port and the app
 * fills it at startup.
 *
 * Unfilled, every method is a no-op that logs once. That is deliberate: a command invoked under
 * `bun test` should do its store work and skip its toast, not crash.
 */

export interface CommandUiPort {
    /** User-facing message. `kind` matches the toast component's levels. */
    notify(message: string, kind?: 'success' | 'error' | 'info'): void;
    /**
     * Run `fn` as one named, atomic undo step (`withCommandHistory`, shipped in P1).
     *
     * History comes through the port for the same reason the toast does, and it is not an
     * accident of taste: `store/app-store.ts` imports the toast component, which imports
     * lucide-solid, which throws "Client-only API called on the server side" the moment it is
     * loaded outside a browser. Importing the store from `execute.ts` therefore makes the
     * registry un-testable and un-runnable headless — the exact thing §3.6 exists to prevent.
     *
     * The default below just calls `fn`, which is the correct behaviour with no document to
     * record history for.
     */
    withHistory<T>(label: string, fn: () => T): T;
}

const warned = new Set<string>();

const noop: CommandUiPort = {
    notify(message) {
        if (warned.has('notify')) return;
        warned.add('notify');
        // Once, not per call: a sweep running hundreds of commands headless would otherwise
        // bury its own output.
        console.info(`[commands] no UI port installed; notifications are dropped (first: ${message})`);
    },
    // No store, no history — running the command is the whole job.
    withHistory: (_label, fn) => fn(),
};

let port: CommandUiPort = noop;

/** Install the real UI. Called once from app startup. */
export const setCommandUiPort = (impl: CommandUiPort): void => { port = impl; };

/** Reset to the no-op port. For tests. */
export const clearCommandUiPort = (): void => { port = noop; warned.clear(); };

export const commandUi = (): CommandUiPort => port;
