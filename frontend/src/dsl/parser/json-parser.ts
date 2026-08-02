/**
 * JSON Parser — Parses JSON DSL input into a DSLDiagram IR.
 * Handles JSON.parse, applies defaults, and validates via schema-validator.
 */

import type { DSLDiagram, ParseResult } from '../types';
import { validateDiagram } from './schema-validator';

/**
 * Parse a JSON string into a DSLDiagram IR.
 */
export function parseJsonDSL(input: string): ParseResult {
    const errors: ParseResult['errors'] = [];
    const warnings: ParseResult['warnings'] = [];

    // Parse JSON
    let raw: any;
    try {
        raw = JSON.parse(input);
    } catch (e: any) {
        const match = e.message?.match(/position\s+(\d+)/i);
        const pos = match ? parseInt(match[1], 10) : 0;
        const line = input.substring(0, pos).split('\n').length;
        errors.push({
            line,
            message: `Invalid JSON: ${e.message}`,
        });
        return { success: false, errors, warnings };
    }

    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        errors.push({ line: 0, message: 'DSL input must be a JSON object.' });
        return { success: false, errors, warnings };
    }

    // Apply defaults
    const diagram: DSLDiagram = {
        version: raw.version ?? 1,
        meta: raw.meta,
        layout: raw.layout ?? { strategy: 'manual' },
        nodes: raw.nodes ?? [],
        edges: raw.edges ?? [],
        groups: raw.groups,
        pools: raw.pools,
        defaults: raw.defaults,
        palette: raw.palette,
    };

    // Set default strategy if missing
    if (diagram.layout && !diagram.layout.strategy) {
        diagram.layout.strategy = 'manual';
        warnings.push({ line: 0, message: 'No layout strategy specified; defaulting to "manual".' });
    }

    // Validate
    const validationErrors = validateDiagram(diagram);
    if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        return { success: false, errors, warnings };
    }

    return { success: true, diagram, errors: [], warnings };
}
