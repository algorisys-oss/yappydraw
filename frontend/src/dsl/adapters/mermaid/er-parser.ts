/**
 * Mermaid ER Diagram Parser
 * Parses `erDiagram` syntax into DSL IR.
 *
 * Supported:
 *   erDiagram
 *     CUSTOMER ||--o{ ORDER : places
 *     ORDER ||--|{ LINE-ITEM : contains
 *     CUSTOMER {
 *       string name PK
 *       string email
 *       int age
 *     }
 *
 * Cardinality markers:
 *   ||  exactly one
 *   o|  zero or one
 *   }|  one or more
 *   o{  zero or more
 *   |{  one or more
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';

// Relationship line: ENTITY1 cardinality--cardinality ENTITY2 : label
const RELATIONSHIP_RE = /^(\S+)\s+([|o}{]+)--([|o}{]+)\s+(\S+)\s*:\s*(.+)$/;

// Entity block start: ENTITY {
const ENTITY_BLOCK_RE = /^(\S+)\s*\{$/;

// Entity attribute: type name [PK|FK|UK]
const ATTR_RE = /^\s*(\S+)\s+(\S+)(?:\s+(PK|FK|UK))?\s*$/;

/** Map cardinality symbols to human-readable labels */
function cardinalityLabel(c: string): string {
    switch (c) {
        case '||': return '1';
        case 'o|': return '0..1';
        case '}|': case '|{': return '1..*';
        case 'o{': case '{o': return '0..*';
        case '}o': return '0..*';
        default: return c;
    }
}

export function parseMermaidER(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    const entitySet = new Set<string>();
    const entityAttrs = new Map<string, { type: string; name: string; constraint?: string }[]>();
    const edges: DSLEdge[] = [];

    let headerParsed = false;
    let currentEntity: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        // Header
        if (!headerParsed && /^erDiagram\b/i.test(line)) {
            headerParsed = true;
            continue;
        }

        if (!headerParsed) continue;

        // Close entity block
        if (line === '}' && currentEntity) {
            currentEntity = null;
            continue;
        }

        // Inside entity block — parse attribute
        if (currentEntity) {
            const attrMatch = line.match(ATTR_RE);
            if (attrMatch) {
                const attrs = entityAttrs.get(currentEntity) || [];
                attrs.push({
                    type: attrMatch[1],
                    name: attrMatch[2],
                    constraint: attrMatch[3],
                });
                entityAttrs.set(currentEntity, attrs);
            } else if (line !== '{') {
                warnings.push({ line: lineNum, message: `Unrecognized attribute: "${line}"` });
            }
            continue;
        }

        // Entity block start: ENTITY {
        const blockMatch = line.match(ENTITY_BLOCK_RE);
        if (blockMatch) {
            const entityName = blockMatch[1];
            entitySet.add(entityName);
            currentEntity = entityName;
            if (!entityAttrs.has(entityName)) {
                entityAttrs.set(entityName, []);
            }
            continue;
        }

        // Relationship: ENTITY1 ||--o{ ENTITY2 : label
        const relMatch = line.match(RELATIONSHIP_RE);
        if (relMatch) {
            const [, entity1, card1, card2, entity2, label] = relMatch;
            entitySet.add(entity1);
            entitySet.add(entity2);

            const leftCard = cardinalityLabel(card1);
            const rightCard = cardinalityLabel(card2);
            const edgeLabel = `${label.trim()} (${leftCard}:${rightCard})`;

            edges.push({
                from: entity1,
                to: entity2,
                label: edgeLabel,
                type: 'line',
            });
            continue;
        }

        if (line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized ER syntax: "${line}"` });
        }
    }

    if (entitySet.size === 0) {
        errors.push({ line: 0, message: 'No entities found in ER diagram.' });
        return { success: false, errors, warnings };
    }

    // Build nodes — entities with attributes become tables, plain ones become rectangles
    const nodes: DSLNode[] = [];
    for (const entityName of entitySet) {
        const attrs = entityAttrs.get(entityName);
        if (attrs && attrs.length > 0) {
            // Build attribute text as sections for the label
            const attrLines = attrs.map(a => {
                const constraint = a.constraint ? ` ${a.constraint}` : '';
                return `${a.type} ${a.name}${constraint}`;
            });

            nodes.push({
                id: entityName,
                shape: 'rect',
                label: entityName,
                width: 200,
                height: 40 + attrs.length * 24,
                style: {
                    backgroundColor: '#dbeafe',
                    strokeColor: '#2563eb',
                    fontSize: 14,
                },
                properties: {
                    containerText: `${entityName}\n─────────\n${attrLines.join('\n')}`,
                },
            });
        } else {
            nodes.push({
                id: entityName,
                shape: 'rect',
                label: entityName,
                width: 160,
                height: 50,
                style: {
                    backgroundColor: '#dbeafe',
                    strokeColor: '#2563eb',
                },
            });
        }
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'ER Diagram', sourceFormat: 'mermaid' },
        layout: { strategy: 'tree-right', hSpacing: 160, vSpacing: 80 },
        nodes,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}
