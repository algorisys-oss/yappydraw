/**
 * YSL — Yappy Scripting Language
 *
 * Public API for parsing and executing YSL scripts.
 * Produces DSLDiagram IR compatible with the existing DSL engine.
 */

import { tokenize } from './lexer';
import { Parser } from './parser';
import { Interpreter } from './interpreter';
import type { ParseResult } from '../types';
import { YSLError } from './errors';

/**
 * Parse a YSL script into a DSLDiagram IR.
 * Returns a ParseResult compatible with the existing DSL system.
 */
export function parseYSL(source: string): ParseResult {
    try {
        const tokens = tokenize(source);
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const interpreter = new Interpreter();
        const result = interpreter.interpret(ast);

        if (result.errors.length > 0) {
            return {
                success: false,
                diagram: result.diagram,
                errors: result.errors,
                warnings: result.warnings,
            };
        }

        return {
            success: true,
            diagram: result.diagram,
            errors: [],
            warnings: result.warnings,
        };
    } catch (e) {
        if (e instanceof YSLError) {
            return {
                success: false,
                errors: [{ line: e.loc.line, column: e.loc.column, message: e.message }],
                warnings: [],
            };
        }
        return {
            success: false,
            errors: [{ line: 0, message: `Unexpected error: ${(e as Error).message}` }],
            warnings: [],
        };
    }
}

/**
 * Statement openers that mean "this is a script", matched in their full YSL form.
 *
 * The full form matters. An earlier version tested a bare keyword prefix
 * (`/^(let|const|fn|for|if|else|end|…)\b/`), which sent any plain text-DSL source
 * containing a line starting with one of those words to the YSL parser — where it is
 * a syntax error. Two ordinary things trip that: a node whose id is `end`
 * (`end [circle] "End"`, the last box of a flowchart) and a sequence diagram's
 * `loop … end` / `alt … else … end` fragments, which are text-DSL syntax the text
 * parser handles itself. So `end` and `else` are deliberately absent here: neither can
 * *open* a YSL script — they only ever close or continue a block that one of the
 * openers below already introduced.
 */
const YSL_STATEMENT_OPENERS: readonly RegExp[] = [
    /^(?:let|const)\s+[A-Za-z_$][\w$]*\s*=/,      // let x = 3
    /^fn\s+[A-Za-z_$][\w$]*\s*\(/,                // fn name(a, b)
    /^for\s+[A-Za-z_$][\w$]*\s+in\b/,             // for i in 1..5
    /^if\s+(?!\[|")/,                             // if count > 3   (not: if [rect] "…")
    /^template\s+[A-Za-z_$][\w$]*\s*\(/,          // template box(id)
    /^use\s+[A-Za-z_$][\w$]*\s*\(/,               // use box("a")
    /^group\s+[A-Za-z_$][\w$]*(?:\s+"|\s*$)/,     // group g1 "Label"
    /^animate\s*$/,                               // animate
    /^on\s+(?:click|hover|leave)\b/,               // on click node1
    /^Yappy\./,                                    // Yappy.setBackground(…)
];

/**
 * Detect if the input looks like a YSL script (vs plain text DSL).
 * YSL scripts contain scripting constructs: let, const, fn, for, if, etc.
 */
export function isYSLScript(input: string): boolean {
    const lines = input.split('\n');
    let inFrontmatter = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip frontmatter
        if (/^---\s*$/.test(trimmed)) {
            inFrontmatter = !inFrontmatter;
            continue;
        }
        if (inFrontmatter) continue;

        // Skip comments and empty lines
        if (trimmed.startsWith('#') || !trimmed) continue;

        // Check for YSL-specific statement openers at line start
        if (YSL_STATEMENT_OPENERS.some(re => re.test(trimmed))) {
            return true;
        }

        // Check for string interpolation ${...} or variable references {var} in node IDs
        if (/\$\{/.test(trimmed)) return true;
        if (/^\w+\{/.test(trimmed)) return true;  // node_{var} pattern
    }

    return false;
}

// Re-export types for consumers
export { tokenize } from './lexer';
export { Parser } from './parser';
export { Interpreter } from './interpreter';
export { Environment } from './environment';
export type { InterpretResult } from './interpreter';
export type { Token, TokenType } from './lexer';
export type { YSLError } from './errors';
