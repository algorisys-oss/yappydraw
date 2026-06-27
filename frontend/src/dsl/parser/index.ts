/**
 * DSL Parser Entry Point
 * Auto-detects JSON vs text vs Mermaid format and dispatches to the appropriate parser.
 */

import type { ParseResult } from '../types';
import { parseJsonDSL } from './json-parser';
import { parseTextDSL } from './text-parser';
import { parseYSL, isYSLScript } from '../ysl';
import { adapterRegistry } from '../adapters/adapter-registry';
import { MermaidAdapter } from '../adapters/mermaid/mermaid-adapter';

// Register built-in adapters
adapterRegistry.register(new MermaidAdapter());

/**
 * Parse DSL input (auto-detects format).
 * Checks: JSON → Mermaid → YSL script → Text DSL.
 *
 * Mermaid runs before YSL because Mermaid sequence diagrams legitimately
 * contain words like `end` / `for` (e.g. `loop ... end`) that would otherwise
 * trip isYSLScript's heuristic. The Mermaid adapter's canParse is strict —
 * it requires a recognised diagram header on the first non-comment line —
 * so it can't false-positive on a real YSL script.
 */
export function parseDSL(input: string): ParseResult {
    const trimmed = input.trim();

    if (!trimmed) {
        return {
            success: false,
            errors: [{ line: 0, message: 'Empty input.' }],
            warnings: [],
        };
    }

    // Auto-detect JSON: an object `{…}` or an array `[…]`. Arrays go to the JSON
    // parser too, so non-object JSON is rejected with a clear error instead of
    // silently falling through to the lenient text parser.
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return parseJsonDSL(trimmed);
    }

    // Try Mermaid adapter first (strict header-line detection: graph/flowchart/sequenceDiagram etc.)
    const adapterResult = adapterRegistry.autoParse(trimmed);
    if (adapterResult) {
        return {
            success: adapterResult.success,
            diagram: adapterResult.diagram,
            errors: adapterResult.errors,
            warnings: adapterResult.warnings,
        };
    }

    // YSL scripting language (has variables, loops, functions, etc.)
    if (isYSLScript(trimmed)) {
        return parseYSL(trimmed);
    }

    // Text DSL format (fallback)
    return parseTextDSL(trimmed);
}

export { parseJsonDSL } from './json-parser';
export { parseTextDSL } from './text-parser';
export { validateDiagram } from './schema-validator';
