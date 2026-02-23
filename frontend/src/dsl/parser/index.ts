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
 * Checks: JSON → YSL script → Mermaid → Text DSL.
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

    // Auto-detect: JSON starts with {
    if (trimmed.startsWith('{')) {
        return parseJsonDSL(trimmed);
    }

    // YSL scripting language (has variables, loops, functions, etc.)
    if (isYSLScript(trimmed)) {
        return parseYSL(trimmed);
    }

    // Try Mermaid adapter (checks for graph/flowchart/sequenceDiagram etc.)
    const adapterResult = adapterRegistry.autoParse(trimmed);
    if (adapterResult) {
        return {
            success: adapterResult.success,
            diagram: adapterResult.diagram,
            errors: adapterResult.errors,
            warnings: adapterResult.warnings,
        };
    }

    // Text DSL format (fallback)
    return parseTextDSL(trimmed);
}

export { parseJsonDSL } from './json-parser';
export { parseTextDSL } from './text-parser';
export { validateDiagram } from './schema-validator';
