/**
 * Rocket Relation Parser
 *
 * Parses edge labels and properties into Rocket relation definitions.
 *
 * Approach A — Label convention:
 *   "customer_invoices [1:N cascade]"
 *   → { name: "customer_invoices", cardinality: "one_to_many", onDelete: "cascade" }
 *
 * Approach B — Structured properties:
 *   edge.properties = { rel: "1:N", onDelete: "cascade", fk: "customer_id" }
 *
 * If edge.properties exists, it takes precedence over label parsing.
 */

import type { ParsedRelation } from './types';
import type { DSLEdge } from '../../types';

// ─── Cardinality Mapping ────────────────────────────────────────

const CARDINALITY_MAP: Record<string, 'one_to_one' | 'one_to_many' | 'many_to_many'> = {
    '1:1': 'one_to_one',
    '1:N': 'one_to_many',
    '1:M': 'one_to_many',
    'N:1': 'one_to_many',   // reversed — we'll swap source/target
    'M:1': 'one_to_many',   // reversed
    'N:M': 'many_to_many',
    'M:N': 'many_to_many',
    'N:N': 'many_to_many',
    'one_to_one': 'one_to_one',
    'one_to_many': 'one_to_many',
    'many_to_many': 'many_to_many',
};

const VALID_ON_DELETE = new Set(['cascade', 'set_null', 'restrict', 'detach']);

// ─── Label Parser ───────────────────────────────────────────────

/**
 * Parse an edge label into a relation definition.
 *
 * Format: "relation_name [cardinality on_delete]"
 *   e.g., "customer_orders [1:N cascade]"
 *         "task_tags [M:N]"
 *         "user_profile [1:1 set_null]"
 *
 * Also supports without brackets: "customer_orders 1:N cascade"
 */
function parseLabel(label: string): ParsedRelation | null {
    if (!label) return null;

    const trimmed = label.trim();

    // Try bracketed format: "name [cardinality on_delete]"
    const bracketMatch = trimmed.match(/^(\S+)\s*\[([^\]]+)\]$/);
    if (bracketMatch) {
        const name = bracketMatch[1];
        const parts = bracketMatch[2].trim().split(/\s+/);
        return parseRelationParts(name, parts);
    }

    // Try space-separated format: "name cardinality on_delete"
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
        const name = parts[0];
        return parseRelationParts(name, parts.slice(1));
    }

    // Just a name — default to one_to_many
    return {
        name: trimmed,
        cardinality: 'one_to_many',
        onDelete: 'cascade',
    };
}

function parseRelationParts(name: string, parts: string[]): ParsedRelation {
    let cardinality: 'one_to_one' | 'one_to_many' | 'many_to_many' = 'one_to_many';
    let onDelete = 'cascade';
    let foreignKey: string | undefined;
    let joinTable: string | undefined;

    for (const part of parts) {
        const upper = part.toUpperCase();
        // Check cardinality
        if (CARDINALITY_MAP[upper] || CARDINALITY_MAP[part]) {
            cardinality = CARDINALITY_MAP[upper] || CARDINALITY_MAP[part];
        }
        // Check on_delete
        else if (VALID_ON_DELETE.has(part.toLowerCase())) {
            onDelete = part.toLowerCase();
        }
        // Check fk: prefix
        else if (part.toLowerCase().startsWith('fk:')) {
            foreignKey = part.slice(3);
        }
        // Check join: prefix
        else if (part.toLowerCase().startsWith('join:')) {
            joinTable = part.slice(5);
        }
    }

    const result: ParsedRelation = { name, cardinality, onDelete };
    if (foreignKey) result.foreignKey = foreignKey;
    if (joinTable) result.joinTable = joinTable;

    return result;
}

// ─── Properties Parser ─────────────────────────────────────────

/**
 * Parse structured edge properties into a relation definition.
 */
function parseProperties(props: Record<string, any>, fallbackName: string): ParsedRelation {
    const rel = props.rel || props.relationType || props.type || '1:N';
    const upper = rel.toUpperCase();
    const cardinality = CARDINALITY_MAP[upper] || CARDINALITY_MAP[rel] || 'one_to_many';

    const onDelete = props.onDelete || props.on_delete || 'cascade';

    const result: ParsedRelation = {
        name: props.name || fallbackName,
        cardinality,
        onDelete: VALID_ON_DELETE.has(onDelete.toLowerCase()) ? onDelete.toLowerCase() : 'cascade',
    };

    if (props.fk || props.foreignKey) result.foreignKey = props.fk || props.foreignKey;
    if (props.joinTable || props.join_table) result.joinTable = props.joinTable || props.join_table;

    return result;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Parse a DSLEdge into a ParsedRelation.
 * Uses edge.properties if available, otherwise parses edge.label.
 */
export function parseRelation(
    edge: DSLEdge,
    sourceEntityName: string,
    targetEntityName: string
): ParsedRelation {
    const defaultName = `${sourceEntityName}_${targetEntityName}`;

    // Approach B: structured properties take precedence
    if (edge.properties && Object.keys(edge.properties).length > 0) {
        return parseProperties(edge.properties, defaultName);
    }

    // Approach A: parse label
    if (edge.label) {
        const parsed = parseLabel(edge.label);
        if (parsed) return parsed;
    }

    // Fallback: infer from edge type
    // line (--) without arrowhead suggests M:N
    // arrow (->) suggests 1:N
    if (edge.type === 'line') {
        return { name: defaultName, cardinality: 'many_to_many', onDelete: 'detach' };
    }

    return { name: defaultName, cardinality: 'one_to_many', onDelete: 'cascade' };
}

/**
 * Check if a cardinality string represents a reversed relation (N:1, M:1).
 * If reversed, the caller should swap source and target.
 */
export function isReversedCardinality(cardStr: string): boolean {
    const upper = cardStr.toUpperCase();
    return upper === 'N:1' || upper === 'M:1';
}
