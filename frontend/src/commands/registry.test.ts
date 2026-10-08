/**
 * The command registry core (P2).
 *
 * These must run with **no DOM**. That is the point of the layering rule (§3.6):
 * `utils/command-registry.ts` imports toast, the menu and five dialogs, which is why
 * `i18n/fr-search.test.ts` records that it "cannot be imported here". If this file ever needs a
 * browser, the separation has been lost.
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
    register, registerAll, resolve, has, all, aliases, clearRegistry, namespacedId,
    type CommandSpec,
} from "./registry";
import { execute, disabledReason } from "./execute";
import { setCommandUiPort, clearCommandUiPort } from "./ui-port";

const spec = (over: Partial<CommandSpec<any>> = {}): CommandSpec<any> => ({
    id: 'test.noop', label: 'Test', labelKey: 'commands.test', category: 'Actions',
    history: false, run: () => 'ran', ...over,
});

beforeEach(() => clearRegistry());
afterEach(() => { clearRegistry(); clearCommandUiPort(); });

describe("namespacedId", () => {
    it("re-punctuates the namespace the legacy ids already carry", () => {
        expect(namespacedId('action-group')).toBe('action.group');
        expect(namespacedId('tool-lasso')).toBe('tool.lasso');
        expect(namespacedId('action-new-artboard')).toBe('action.newArtboard');
        expect(namespacedId('tool-type-on-path')).toBe('tool.typeOnPath');
    });

    it("leaves an id with no namespace alone", () => {
        expect(namespacedId('standalone')).toBe('standalone');
    });

    it("is injective across the real palette ids — no two collapse onto one", () => {
        // The whole alias scheme rests on this: if two legacy ids derived to the same
        // namespaced id, registering the second would throw and a command would vanish.
        const legacy = ['action-group', 'action-ungroup', 'tool-lasso', 'tool-type-on-path',
            'action-new-artboard', 'view-grid', 'layer-add', 'file-save'];
        const derived = legacy.map(namespacedId);
        expect(new Set(derived).size).toBe(legacy.length);
    });
});

describe("register / resolve", () => {
    it("finds a command by id and by alias", () => {
        register(spec({ id: 'action.group', aliases: ['action-group'] }));
        expect(resolve('action.group')?.id).toBe('action.group');
        expect(resolve('action-group')?.id).toBe('action.group');
        expect(has('action-group')).toBe(true);
        expect(resolve('nope')).toBeUndefined();
    });

    it("refuses a duplicate id rather than silently overwriting", () => {
        // A silent overwrite means two features fighting over one id, and the loser is
        // whichever registered first — invisible until someone clicks it.
        register(spec({ id: 'a.b' }));
        expect(() => register(spec({ id: 'a.b' }))).toThrow(/already registered/);
    });

    it("refuses an alias that another command already claims", () => {
        register(spec({ id: 'a.one', aliases: ['legacy'] }));
        expect(() => register(spec({ id: 'a.two', aliases: ['legacy'] }))).toThrow(/claimed by both/);
    });

    it("refuses an alias that is some command's real id, and vice versa", () => {
        register(spec({ id: 'a.one' }));
        expect(() => register(spec({ id: 'a.two', aliases: ['a.one'] }))).toThrow(/already a command id/);
        clearRegistry();
        register(spec({ id: 'a.two', aliases: ['taken'] }));
        expect(() => register(spec({ id: 'taken' }))).toThrow(/collides with an alias/);
    });

    it("lists everything in registration order, and maps the aliases", () => {
        registerAll([spec({ id: 'x.1', aliases: ['x1'] }), spec({ id: 'x.2' })]);
        expect(all().map(s => s.id)).toEqual(['x.1', 'x.2']);
        expect(aliases().get('x1')).toBe('x.1');
    });
});

describe("execute", () => {
    it("runs a command and returns its result", () => {
        register(spec({ id: 'a.b', run: () => 42 }));
        expect(execute('a.b')).toEqual({ ok: true, result: 42 });
    });

    it("resolves through an alias", () => {
        register(spec({ id: 'action.group', aliases: ['action-group'], run: () => 'grouped' }));
        expect(execute('action-group')).toEqual({ ok: true, result: 'grouped' });
    });

    it("reports an unknown id instead of throwing", () => {
        expect(execute('nope.nope')).toEqual({ ok: false, reason: 'unknown command: nope.nope' });
    });

    it("refuses on a failed precondition WITHOUT running", () => {
        let ran = false;
        register(spec({ id: 'a.b', enabled: () => 'Select two or more objects', run: () => { ran = true; } }));
        expect(execute('a.b')).toEqual({ ok: false, reason: 'Select two or more objects' });
        expect(ran).toBe(false);   // the order is the contract: nothing runs until checks pass
    });

    it("refuses on invalid parameters WITHOUT running", () => {
        let ran = false;
        register(spec({
            id: 'a.b',
            params: { parse: (v: unknown) => typeof v === 'number' ? { ok: true as const, value: v } : { ok: false as const, error: 'expected a number' } },
            run: () => { ran = true; },
        }));
        expect(execute('a.b', 'twelve')).toEqual({ ok: false, reason: 'expected a number' });
        expect(ran).toBe(false);
    });

    it("passes validated (and coerced) parameters to run", () => {
        register(spec({
            id: 'a.b',
            params: { parse: (v: unknown) => ({ ok: true as const, value: Number(v) }) },
            run: (n: number) => n * 2,
        }));
        expect(execute('a.b', '21')).toEqual({ ok: true, result: 42 });
    });

    it("ignores parameters a command does not declare, rather than rejecting", () => {
        // A caller sending extra context should not be turned away.
        register(spec({ id: 'a.b', run: () => 'fine' }));
        expect(execute('a.b', { stray: true })).toEqual({ ok: true, result: 'fine' });
    });

    it("catches a throw, reports it, and tells the UI nothing changed", () => {
        const said: string[] = [];
        setCommandUiPort({ notify: (m) => said.push(m) });
        register(spec({ id: 'a.b', run: () => { throw new Error('boom'); } }));
        const res = execute('a.b');
        expect(res.ok).toBe(false);
        expect((res as any).reason).toBe('boom');
        expect(said.join(' ')).toContain('nothing was changed');
    });

    it("runs with no UI port installed — the headless case", () => {
        // The reason the port exists: a sweep or a unit test must be able to run a command
        // that would normally toast, and get its store work without a DOM.
        register(spec({ id: 'a.b', run: () => { throw new Error('x'); } }));
        expect(() => execute('a.b')).not.toThrow();
        expect(execute('a.b').ok).toBe(false);
    });
});

describe("disabledReason", () => {
    it("explains why, without running anything", () => {
        let ran = false;
        register(spec({ id: 'a.b', enabled: () => 'Select something first', run: () => { ran = true; } }));
        expect(disabledReason('a.b')).toBe('Select something first');
        expect(ran).toBe(false);
    });

    it("is null for an available command and for one with no precondition", () => {
        registerAll([spec({ id: 'a.yes', enabled: () => true }), spec({ id: 'a.always' })]);
        expect(disabledReason('a.yes')).toBeNull();
        expect(disabledReason('a.always')).toBeNull();
    });

    it("reports an unknown id", () => {
        expect(disabledReason('a.ghost')).toContain('unknown command');
    });
});
