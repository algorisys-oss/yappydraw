/**
 * Rocket Field Parser
 *
 * Parses UML attribute strings into Rocket field definitions.
 *
 * Supported formats:
 *   id: uuid [PK]                           → primary key
 *   name: string *                           → required
 *   email: string * unique                   → required + unique
 *   status: string = active [draft,active]   → default + enum
 *   total: decimal(2)                        → precision
 *   created_at: timestamp auto:create        → auto timestamp
 *   + getName(): string                      → method (returned separately)
 *   - password: string                       → private field (visibility stripped)
 *   # internal: json                         → protected field
 */

import type { ParsedField, ParsedMethod } from './types';

// ─── Type Mapping ───────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
    'string': 'string',
    'str': 'string',
    'text': 'text',
    'int': 'int',
    'integer': 'int',
    'bigint': 'bigint',
    'float': 'float',
    'double': 'float',
    'decimal': 'decimal',
    'number': 'float',
    'bool': 'boolean',
    'boolean': 'boolean',
    'uuid': 'uuid',
    'date': 'date',
    'datetime': 'timestamp',
    'timestamp': 'timestamp',
    'json': 'json',
    'jsonb': 'json',
    'file': 'file',
};

function mapFieldType(raw: string): { type: string; precision?: number } {
    // Handle decimal(N) or numeric(N)
    const precisionMatch = raw.match(/^(decimal|numeric)\((\d+)\)$/i);
    if (precisionMatch) {
        return { type: 'decimal', precision: parseInt(precisionMatch[2], 10) };
    }

    const lower = raw.toLowerCase();
    return { type: TYPE_MAP[lower] || lower };
}

// ─── Field Line Parser ─────────────────────────────────────────

/**
 * Parse a single attribute line into a ParsedField.
 * Returns null if the line is a method (contains parentheses) or is empty.
 */
export function parseFieldLine(line: string): ParsedField | null {
    let trimmed = line.trim();
    if (!trimmed) return null;

    // Skip method lines (contain parentheses like "getName()")
    if (/\w+\s*\(/.test(trimmed) && trimmed.includes(')')) {
        return null;
    }

    // Extract visibility prefix: + - #
    let visibility: '+' | '-' | '#' | undefined;
    if (/^[+\-#]\s/.test(trimmed)) {
        visibility = trimmed[0] as '+' | '-' | '#';
        trimmed = trimmed.slice(1).trim();
    }

    // Split on first colon → name : rest
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) return null;

    const name = trimmed.slice(0, colonIdx).trim();
    let rest = trimmed.slice(colonIdx + 1).trim();

    if (!name || !rest) return null;

    // Parse flags from rest
    let required = false;
    let unique = false;
    let primaryKey = false;
    let defaultValue: any = undefined;
    let enumValues: string[] | undefined;
    let auto: string | undefined;

    // Extract [PK]
    if (/\[PK\]/i.test(rest)) {
        primaryKey = true;
        required = true;
        rest = rest.replace(/\[PK\]/i, '').trim();
    }

    // Extract auto:create or auto:update
    const autoMatch = rest.match(/\bauto:(create|update)\b/i);
    if (autoMatch) {
        auto = autoMatch[1].toLowerCase();
        rest = rest.replace(/\bauto:(create|update)\b/i, '').trim();
    }

    // Extract unique keyword
    if (/\bunique\b/i.test(rest)) {
        unique = true;
        rest = rest.replace(/\bunique\b/i, '').trim();
    }

    // Extract required marker (*)
    if (rest.includes('*')) {
        required = true;
        rest = rest.replace(/\*/g, '').trim();
    }

    // Extract default value: = value (before enum)
    const defaultMatch = rest.match(/=\s*(\S+)/);
    if (defaultMatch) {
        defaultValue = defaultMatch[1];
        rest = rest.replace(/=\s*\S+/, '').trim();

        // Try to coerce numeric defaults
        if (/^\d+$/.test(defaultValue)) defaultValue = parseInt(defaultValue, 10);
        else if (/^\d+\.\d+$/.test(defaultValue)) defaultValue = parseFloat(defaultValue);
        else if (defaultValue === 'true') defaultValue = true;
        else if (defaultValue === 'false') defaultValue = false;
    }

    // Extract enum: [val1,val2,val3]
    const enumMatch = rest.match(/\[([^\]]+)\]/);
    if (enumMatch) {
        enumValues = enumMatch[1].split(',').map(v => v.trim()).filter(Boolean);
        rest = rest.replace(/\[[^\]]+\]/, '').trim();
    }

    // What's left should be the type
    const rawType = rest.trim().split(/\s+/)[0];
    if (!rawType) return null;

    const { type, precision } = mapFieldType(rawType);

    const field: ParsedField = {
        name,
        type,
        required,
        unique,
        primaryKey,
    };

    if (visibility) field.visibility = visibility;
    if (defaultValue !== undefined) field.default = defaultValue;
    if (enumValues && enumValues.length > 0) field.enum = enumValues;
    if (precision !== undefined) field.precision = precision;
    if (auto) field.auto = auto;

    return field;
}

// ─── Method Line Parser ─────────────────────────────────────────

/**
 * Parse a single method line from methodsText.
 * Format: [+-#] methodName(params): returnType
 */
export function parseMethodLine(line: string): ParsedMethod | null {
    let trimmed = line.trim();
    if (!trimmed) return null;

    // Extract visibility prefix
    let visibility: '+' | '-' | '#' = '+';
    if (/^[+\-#]\s/.test(trimmed)) {
        visibility = trimmed[0] as '+' | '-' | '#';
        trimmed = trimmed.slice(1).trim();
    }

    // Match: name(params): returnType  or  name(params)
    const methodMatch = trimmed.match(/^(\w+)\s*\(([^)]*)\)\s*(?::\s*(.+))?$/);
    if (!methodMatch) return null;

    return {
        name: methodMatch[1],
        visibility,
        params: methodMatch[2].trim(),
        returnType: methodMatch[3]?.trim(),
    };
}

// ─── Bulk Parser ────────────────────────────────────────────────

/**
 * Parse a multi-line attributes string (newline or comma-separated)
 * into fields and methods.
 */
export function parseAttributes(text: string): { fields: ParsedField[]; methods: ParsedMethod[] } {
    if (!text) return { fields: [], methods: [] };

    // Split by newline; if single line, try comma-separated
    let lines: string[];
    if (text.includes('\n')) {
        lines = text.split('\n');
    } else if (text.includes(',')) {
        lines = text.split(',');
    } else {
        lines = [text];
    }

    const fields: ParsedField[] = [];
    const methods: ParsedMethod[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Try as method first (has parentheses)
        if (/\w+\s*\(/.test(trimmed)) {
            const method = parseMethodLine(trimmed);
            if (method) {
                methods.push(method);
                continue;
            }
        }

        // Try as field
        const field = parseFieldLine(trimmed);
        if (field) {
            fields.push(field);
        }
    }

    return { fields, methods };
}
