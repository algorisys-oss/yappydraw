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

/** A `---` fence on its own line — YAML/DSL frontmatter, and also Markdown's slide break. */
const FRONTMATTER_FENCE = /^---+\s*$/;

/** Frontmatter keys the text DSL understands (see `parseFrontmatterLine`). */
const DSL_FRONTMATTER_KEYS = /^(title|description|layout|hspacing|vspacing|columns|targetwidth)\s*:/i;

/** `a -> b`, `a ->> b`, … — an edge line. Nothing in Markdown looks like this. */
const DSL_EDGE_LINE = /^\s*\S+\s*(?:-->>|->>|-->|->|--|~>|=>)\s*\S+/;

/** `id [shape] …` — a node declaration with an explicit shape. */
const DSL_NODE_LINE = /^\s*\S+\s*\[[^\]]+\]/;

/**
 * Does this text describe a diagram, rather than a Markdown deck?
 *
 * Both formats are offered by the same import box, and the two overlap: a DSL source
 * opens with `---` frontmatter, which Markdown reads as a slide break, and `#` starts a
 * comment in the DSL but a heading in Markdown. Detecting Markdown on those alone sent
 * every frontmatter-led DSL source to the slide importer, so pasting a flowchart built
 * a deck of empty slides instead of drawing it (all 15 YSL templates did this).
 *
 * So look for structure Markdown cannot produce: DSL frontmatter keys, an edge operator,
 * or a node's `[shape]` bracket. A prose document has none of the three.
 */
export function looksLikeDiagramDSL(input: string): boolean {
    const lines = input.split('\n');

    // A leading frontmatter block whose keys are DSL keys.
    if (FRONTMATTER_FENCE.test(lines[0]?.trim() ?? '')) {
        for (let i = 1; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (FRONTMATTER_FENCE.test(trimmed)) break;
            if (DSL_FRONTMATTER_KEYS.test(trimmed)) return true;
        }
    }

    // Or an edge / shaped-node line anywhere in the body.
    return lines.some(line => DSL_EDGE_LINE.test(line) || DSL_NODE_LINE.test(line));
}

/**
 * Which format `parseDSL` will actually use for this input.
 *
 * Exported so the import dialog can label the input and choose between the diagram and
 * Markdown-slides importers without re-implementing (and drifting from) the detection
 * here. It previously matched Mermaid with its own short list of diagram headers, which
 * is why `gantt`, `gitGraph`, `journey`, `quadrantChart`, `xychart-beta` and `block-beta`
 * were labelled "Text DSL" even though the Mermaid adapter parsed them.
 */
export function detectDSLFormat(input: string): 'json' | 'mermaid' | 'text' | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    if (adapterRegistry.get('mermaid')?.canParse(trimmed)) return 'mermaid';
    if (looksLikeDiagramDSL(trimmed)) return 'text';
    return null;
}

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
