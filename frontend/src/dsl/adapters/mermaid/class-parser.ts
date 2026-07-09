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
import type { ArrowHead } from '../../../types';
import type { AdapterResult } from '../adapter-interface';

// Relationship patterns
// A <|-- B, A *-- B, A o-- B, A --> B, A ..> B, A -- B, A <|.. B
// Optional quoted cardinality labels may sit either side of the arrow, e.g.
//   Subject "1" o-- "0..*" Observer : observers
// NOTE: arrow alternatives must NOT carry a leading space — the preceding \s+
// already consumes the separator, so ` o--` could never match (Gap 2). Order
// longer/arrowed forms before their prefixes (`-->` before `--`, `..>` before `..`).
const RELATION_RE = /^(\S+)\s+(?:"[^"]*"\s+)?(<\|--|<\|\.\.|\*-->|\*--|\*\.\.|o-->|o--|o\.\.|\.\.>|-->|\.\.|--)\s+(?:"[^"]*"\s+)?(\S+)\s*(?::\s*(.+))?$/;
// Also handle reversed: B --|> A
const RELATION_RE2 = /^(\S+)\s+(?:"[^"]*"\s+)?(--\|>|\.\.\|>|\.\|>|<--\*|<--o|--\*|\.\.o|--o|<--|-->|--)\s+(?:"[^"]*"\s+)?(\S+)\s*(?::\s*(.+))?$/;

// class Name { inline; members }  |  class Name {   (block opens on this line)  |  class Name
// Group 3 = inline `{ … }` body (both braces on this line); group 4 = a lone
// trailing `{` opening a multi-line block (Mermaid's canonical form). Without
// group 4 the same-line-brace form failed to match and the whole class body was
// mis-parsed line-by-line (members leaked into a bogus class).
const CLASS_DEF_RE = /^class\s+(\S+?)(?:::(\S+))?\s*(?:\{([^}]*)\})?\s*(\{)?\s*$/;
const CLASS_MEMBER_RE = /^(\S+)\s*:\s*(.+)$/;
const ANNOTATION_RE = /^<<(\w+)>>\s+(\S+)$/;

/**
 * UML relationship spec for a Mermaid class arrow.
 *
 * `decorated` says which written side carries the UML glyph:
 *   - 'left'  → generalization/composition/aggregation: the glyph sits on the
 *              base / whole (the left operand of `A <|-- B`, `A *-- B`, `A o-- B`).
 *   - 'right' → association/dependency and the reversed forms: the open arrow
 *              points at the right operand (the target/base).
 *   - null   → a plain undirected link (`--`) or dashed link (`..`), no glyph.
 * `glyph` is the UML arrowhead (hollow `triangle`, hollow `diamond`, filled
 * `diamondFilled`, open `arrow`). `nav` adds a small open arrow on the far end
 * for the navigable composite/aggregate forms (`*-->`, `o-->`).
 *
 * This replaces the old text-label workaround ("extends"/"composition"/…): the
 * relation kind is now drawn as the correct arrowhead (Gap 3) rather than typed
 * out as a label. Any user-supplied `: label` (role/cardinality) is preserved.
 */
type RelationSpec = {
    decorated: 'left' | 'right' | null;
    glyph: ArrowHead;
    dashed?: boolean;
    nav?: boolean;
};

function mapRelationship(arrow: string): RelationSpec {
    switch (arrow) {
        // Generalization / realization — hollow triangle on the base (left)
        case '<|--': return { decorated: 'left', glyph: 'triangle' };
        case '<|..': return { decorated: 'left', glyph: 'triangle', dashed: true };
        // Composition — filled diamond on the whole (left)
        case '*--': return { decorated: 'left', glyph: 'diamondFilled' };
        case '*-->': return { decorated: 'left', glyph: 'diamondFilled', nav: true };
        // Aggregation — hollow diamond on the aggregate (left)
        case 'o--': return { decorated: 'left', glyph: 'diamond' };
        case 'o-->': return { decorated: 'left', glyph: 'diamond', nav: true };
        // Dependency / association — open arrow on the target (right)
        case '..>': return { decorated: 'right', glyph: 'arrow', dashed: true };
        case '-->': return { decorated: 'right', glyph: 'arrow' };
        case '..': return { decorated: null, glyph: null, dashed: true };
        case '--': return { decorated: null, glyph: null };
        // Reversed forms — decoration moves to the right operand
        case '--|>': case '.|>': return { decorated: 'right', glyph: 'triangle' };
        case '..|>': return { decorated: 'right', glyph: 'triangle', dashed: true };
        case '--*': case '<--*': return { decorated: 'right', glyph: 'diamondFilled' };
        case '--o': case '<--o': return { decorated: 'right', glyph: 'diamond' };
        case '<--': return { decorated: 'left', glyph: 'arrow' };
        default: return { decorated: 'right', glyph: 'arrow' };
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

        // Handle members + closing brace for a multi-line class block. Accepts the
        // brace on its own line (`}`) or trailing a final member (`+run() }`).
        if (inClassBlock) {
            let member = line.trim();
            let closing = false;
            if (member.endsWith('}')) { closing = true; member = member.slice(0, -1).trim(); }
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
            if (closing) inClassBlock = false;
            continue;
        }

        // Class definition: class ClassName { ... }
        const classMatch = line.match(CLASS_DEF_RE);
        if (classMatch) {
            const [, id, _styleClass, body, openBrace] = classMatch;
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
            } else if (openBrace) {
                // Opening brace on THIS line — `class Foo {` — start a multi-line block.
                inClassBlock = true;
                currentClassId = id;
            } else if (i + 1 < lines.length && lines[i + 1].trim() === '{') {
                // Opening brace on the NEXT line — `class Foo\n{` — start the block,
                // skipping the lone brace.
                inClassBlock = true;
                currentClassId = id;
                i++;
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
            // Orient the connector so the UML glyph (endArrowhead, drawn at `to`)
            // lands on the decorated side, and null out the opposite end so the
            // default 'arrow' head doesn't leak onto plain/decorated relations.
            const decoratedIsLeft = rel.decorated === 'left';
            const edge: DSLEdge = {
                from: decoratedIsLeft ? rightId : leftId,
                to: decoratedIsLeft ? leftId : rightId,
                type: rel.glyph === null ? 'line' : 'arrow',
                label: label?.trim(),
                endArrowhead: rel.glyph,
                startArrowhead: rel.nav ? 'arrow' : null,
            };
            if (rel.dashed) {
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
