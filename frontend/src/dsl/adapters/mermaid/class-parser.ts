/**
 * Mermaid Class Diagram Parser
 * Parses `classDiagram` syntax into DSL IR.
 *
 * Supported:
 *   class Animal
 *   class Animal { +String name; +eat() void }
 *   Animal <|-- Dog                 (inheritance)
 *   Animal *-- Heart                (composition)
 *   Animal o-- Leg                  (aggregation)
 *   Animal --> Fish                 (association)
 *   Animal ..> ISwimmable           (dependency/realization)
 *   class Animal:::styleClass
 *   Animal : +String name
 *   Animal : +eat()
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';

// Relationship patterns
// A <|-- B, A *-- B, A o-- B, A --> B, A ..> B, A -- B, A <|.. B
const RELATION_RE = /^(\S+)\s+(<\|--|<\|\.\.|\*--|\*\.\.| o--|o\.\.| --|\.\.>|-->|--)\s+(\S+)\s*(?::\s*(.+))?$/;
// Also handle reversed: B --|> A
const RELATION_RE2 = /^(\S+)\s+(--\|>|\.\.?\|>|--\*|\.\.o|--o|-->|--)\s+(\S+)\s*(?::\s*(.+))?$/;

const CLASS_DEF_RE = /^class\s+(\S+?)(?:::(\S+))?\s*(?:\{([^}]*)\})?$/;
const CLASS_MEMBER_RE = /^(\S+)\s*:\s*(.+)$/;
const ANNOTATION_RE = /^<<(\w+)>>\s+(\S+)$/;

/** Map Mermaid relationship arrows to edge style */
function mapRelationship(arrow: string): { type: 'arrow' | 'line'; label?: string; style?: string } {
    switch (arrow) {
        case '<|--': return { type: 'arrow', label: 'extends' };
        case '<|..': return { type: 'arrow', label: 'implements', style: 'dashed' };
        case '*--': return { type: 'arrow', label: 'composition' };
        case 'o--': return { type: 'arrow', label: 'aggregation' };
        case '..>': return { type: 'arrow', style: 'dashed' };
        case '-->': return { type: 'arrow' };
        case '--': return { type: 'line' };
        // Reversed forms
        case '--|>': return { type: 'arrow', label: 'extends' };
        case '..|>': return { type: 'arrow', label: 'implements', style: 'dashed' };
        case '--*': return { type: 'arrow', label: 'composition' };
        case '--o': return { type: 'arrow', label: 'aggregation' };
        default: return { type: 'arrow' };
    }
}

export function parseMermaidClass(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    const classMap = new Map<string, { label: string; attributes: string[]; methods: string[]; shape: string }>();
    const edges: DSLEdge[] = [];

    let headerParsed = false;
    let inClassBlock = false;
    let currentClassId = '';

    function ensureClass(id: string) {
        if (!classMap.has(id)) {
            classMap.set(id, { label: id, attributes: [], methods: [], shape: 'class' });
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        // Header
        if (!headerParsed && /^classDiagram/i.test(line)) {
            headerParsed = true;
            continue;
        }

        // Skip direction and other directives
        if (/^(direction|namespace|note)\b/i.test(line)) continue;
        if (/^(click|callback|link|cssClass)\b/i.test(line)) continue;

        // Handle closing brace for multi-line class
        if (inClassBlock) {
            if (line === '}') {
                inClassBlock = false;
                continue;
            }
            // Parse member
            const member = line.trim();
            if (member) {
                const cls = classMap.get(currentClassId);
                if (cls) {
                    if (member.includes('(')) {
                        cls.methods.push(member);
                    } else {
                        cls.attributes.push(member);
                    }
                }
            }
            continue;
        }

        // Class definition: class ClassName { ... }
        const classMatch = line.match(CLASS_DEF_RE);
        if (classMatch) {
            const [, id, _styleClass, body] = classMatch;
            ensureClass(id);

            if (body !== undefined) {
                // Inline body: class Foo { +name; +run() }
                const members = body.split(';').map(m => m.trim()).filter(Boolean);
                const cls = classMap.get(id)!;
                for (const m of members) {
                    if (m.includes('(')) {
                        cls.methods.push(m);
                    } else {
                        cls.attributes.push(m);
                    }
                }
            } else if (lines[i + 1]?.trim() === '{' || line.endsWith('{')) {
                // Multi-line block detected — but our regex already handles inline { }
                // If body was undefined and next line is {, handle it
            }

            // Check if next line starts a block
            if (i + 1 < lines.length && lines[i + 1].trim() === '{') {
                inClassBlock = true;
                currentClassId = id;
                i++; // Skip the opening brace
            }
            continue;
        }

        // Annotation: <<interface>> ClassName
        const annotMatch = line.match(ANNOTATION_RE);
        if (annotMatch) {
            const [, annotation, id] = annotMatch;
            ensureClass(id);
            const cls = classMap.get(id)!;
            if (annotation.toLowerCase() === 'interface') {
                cls.shape = 'interface';
                cls.label = `<<interface>>\\n${id}`;
            } else {
                cls.label = `<<${annotation}>>\\n${id}`;
            }
            continue;
        }

        // Member addition: ClassName : +memberName
        const memberMatch = line.match(CLASS_MEMBER_RE);
        if (memberMatch && !line.includes('<') && !line.includes('>') && !line.includes('--')) {
            const [, id, member] = memberMatch;
            ensureClass(id);
            const cls = classMap.get(id)!;
            if (member.includes('(')) {
                cls.methods.push(member.trim());
            } else {
                cls.attributes.push(member.trim());
            }
            continue;
        }

        // Relationship: A <|-- B
        const relMatch = line.match(RELATION_RE) || line.match(RELATION_RE2);
        if (relMatch) {
            const [, left, arrow, right, label] = relMatch;
            const leftId = left.replace(/["`]/g, '').trim();
            const rightId = right.replace(/["`]/g, '').trim();

            ensureClass(leftId);
            ensureClass(rightId);

            const rel = mapRelationship(arrow);
            const edge: DSLEdge = {
                from: rightId,
                to: leftId,
                type: rel.type,
                label: label?.trim() || rel.label,
            };
            if (rel.style === 'dashed') {
                edge.style = { strokeStyle: 'dashed' };
            }
            edges.push(edge);
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized class diagram syntax: "${line}"` });
        }
    }

    // Build nodes
    const nodes: DSLNode[] = [];
    for (const [id, cls] of classMap) {
        const node: DSLNode = {
            id,
            shape: cls.shape,
            label: cls.label,
        };
        if (cls.attributes.length > 0 || cls.methods.length > 0) {
            node.sections = {
                attributes: cls.attributes.join('\n'),
                methods: cls.methods.join('\n'),
            };
        }
        nodes.push(node);
    }

    if (nodes.length === 0) {
        errors.push({ line: 0, message: 'No classes found in class diagram.' });
        return { success: false, errors, warnings };
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Mermaid Class Diagram', sourceFormat: 'mermaid' },
        layout: { strategy: 'tree-down', hSpacing: 160, vSpacing: 120 },
        nodes,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}
