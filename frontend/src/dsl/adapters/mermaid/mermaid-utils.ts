/**
 * Mermaid Utilities
 * Shared regex patterns, shape mapping, and helpers for Mermaid parsers.
 */

/**
 * Map Mermaid node shapes to YappyDSL shape names.
 * Mermaid uses bracket syntax to denote shapes:
 *   [text]   → rectangle
 *   (text)   → circle (rounded)
 *   {text}   → diamond
 *   [(text)] → database (cylinder)
 *   ((text)) → double circle
 *   [/text/] → parallelogram
 *   [\text\] → parallelogram (reversed)
 *   [[text]] → subroutine / predefined process
 *   >text]   → asymmetric / signal
 *   {{text}} → hexagon
 */
export function mapMermaidShape(raw: string): { shape: string; label: string } {
    const text = raw.trim();

    // {{text}} → hexagon
    if (text.startsWith('{{') && text.endsWith('}}')) {
        return { shape: 'hexagon', label: text.slice(2, -2).trim() };
    }

    // ((text)) → double circle
    if (text.startsWith('((') && text.endsWith('))')) {
        return { shape: 'circle', label: text.slice(2, -2).trim() };
    }

    // [(text)] → database / cylinder
    if (text.startsWith('[(') && text.endsWith(')]')) {
        return { shape: 'db', label: text.slice(2, -2).trim() };
    }

    // [[text]] → subroutine
    if (text.startsWith('[[') && text.endsWith(']]')) {
        return { shape: 'subroutine', label: text.slice(2, -2).trim() };
    }

    // [/text/] → parallelogram
    if (text.startsWith('[/') && text.endsWith('/]')) {
        return { shape: 'io', label: text.slice(2, -2).trim() };
    }

    // [\text\] → parallelogram (reverse)
    if (text.startsWith('[\\') && text.endsWith('\\]')) {
        return { shape: 'io', label: text.slice(2, -2).trim() };
    }

    // >text] → asymmetric (signal/flag)
    if (text.startsWith('>') && text.endsWith(']')) {
        return { shape: 'rect', label: text.slice(1, -1).trim() };
    }

    // {text} → diamond / decision
    if (text.startsWith('{') && text.endsWith('}')) {
        return { shape: 'decision', label: text.slice(1, -1).trim() };
    }

    // (text) → rounded / circle
    if (text.startsWith('(') && text.endsWith(')')) {
        return { shape: 'capsule', label: text.slice(1, -1).trim() };
    }

    // [text] → rectangle (default)
    if (text.startsWith('[') && text.endsWith(']')) {
        return { shape: 'rect', label: text.slice(1, -1).trim() };
    }

    // No shape brackets — treat as rectangle with the text as label
    return { shape: 'rect', label: text.trim() };
}

/**
 * Map Mermaid edge operators to DSL edge properties.
 */
export interface MermaidEdgeInfo {
    type: 'arrow' | 'line';
    strokeStyle?: 'dashed' | 'dotted';
    isBidirectional?: boolean;
    isThick?: boolean;
}

export function mapMermaidEdge(op: string): MermaidEdgeInfo {
    // Thick arrows
    if (op === '==>' || op === '===') {
        return { type: op === '==>' ? 'arrow' : 'line', isThick: true };
    }
    // Dashed arrows
    if (op === '-.->' || op === '-.->') {
        return { type: 'arrow', strokeStyle: 'dashed' };
    }
    if (op === '-.-' || op === '-..-') {
        return { type: 'line', strokeStyle: 'dashed' };
    }
    // Standard arrows
    if (op === '-->' || op === '-->|') {
        return { type: 'arrow' };
    }
    // Lines (no arrowhead)
    if (op === '---' || op === '---') {
        return { type: 'line' };
    }
    // Bidirectional
    if (op === '<-->') {
        return { type: 'arrow', isBidirectional: true };
    }
    // Default: arrow
    return { type: 'arrow' };
}

/**
 * Strip surrounding quotes from a string if present.
 */
export function stripQuotes(s: string): string {
    const trimmed = s.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

/**
 * Clean a Mermaid node ID — remove invalid characters.
 */
export function cleanNodeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, '');
}
