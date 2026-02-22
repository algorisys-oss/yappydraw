/**
 * YSL Environment — Lexical scope chain for variable storage.
 *
 * Each scope holds its own bindings and a reference to the parent scope.
 * Constants are tracked to prevent reassignment.
 */

import { RuntimeError, type SourceLocation } from './errors';

export type YSLValue = string | number | boolean | YSLValue[] | Record<string, unknown> | null | undefined;

export class Environment {
    private values = new Map<string, YSLValue>();
    private constants = new Set<string>();
    parent: Environment | null;

    constructor(parent: Environment | null = null) {
        this.parent = parent;
    }

    /** Define a new variable in the current scope. */
    define(name: string, value: YSLValue, isConst: boolean, loc: SourceLocation): void {
        if (this.values.has(name)) {
            throw new RuntimeError(`Variable "${name}" is already defined in this scope.`, loc);
        }
        this.values.set(name, value);
        if (isConst) this.constants.add(name);
    }

    /** Assign to an existing variable (walks up scope chain). */
    assign(name: string, value: YSLValue, loc: SourceLocation): void {
        if (this.values.has(name)) {
            if (this.constants.has(name)) {
                throw new RuntimeError(`Cannot reassign constant "${name}".`, loc);
            }
            this.values.set(name, value);
            return;
        }
        if (this.parent) {
            this.parent.assign(name, value, loc);
            return;
        }
        throw new RuntimeError(`Undefined variable "${name}".`, loc);
    }

    /** Look up a variable (walks up scope chain). */
    get(name: string, loc: SourceLocation): YSLValue {
        if (this.values.has(name)) {
            return this.values.get(name)!;
        }
        if (this.parent) {
            return this.parent.get(name, loc);
        }
        throw new RuntimeError(`Undefined variable "${name}".`, loc);
    }

    /** Check if a variable exists (without throwing). */
    has(name: string): boolean {
        if (this.values.has(name)) return true;
        if (this.parent) return this.parent.has(name);
        return false;
    }

    /** Create a child scope. */
    child(): Environment {
        return new Environment(this);
    }
}
