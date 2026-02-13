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

        // Check for YSL-specific keywords at line start
        if (/^(let|const|fn|for|if|else|end|template|use|group|animate|on|Yappy\.)\b/.test(trimmed)) {
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
