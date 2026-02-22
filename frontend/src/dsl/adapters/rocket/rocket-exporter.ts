/**
 * Rocket Backend Exporter
 *
 * Converts a DSLDiagram IR into a Rocket Backend import JSON schema.
 * Entities are extracted from nodes with shape 'entity', 'class', 'umlClass', or 'table'.
 * Relations are extracted from edges between entity nodes.
 *
 * Usage:
 *   const result = exportToRocket(diagram, { softDelete: true });
 *   // result.schema → Rocket import JSON
 */

import type { DSLDiagram, DSLNode, DSLEdge } from '../../types';
import type {
    RocketExportResult,
    RocketExportMessage,
    RocketImportSchema,
    RocketEntity,
    RocketField,
    RocketRelation,
    RocketStateMachine,
    RocketWorkflow,
    ParsedField,
} from './types';
import { parseAttributes } from './field-parser';
import { parseRelation, isReversedCardinality } from './relation-parser';
import {
    isStateNode,
    isPseudoStateNode,
    parseStateDiagram,
    associateWithEntity,
    convertToRocketStateMachine,
} from './state-parser';
import {
    isBpmnWorkflowNode,
    parseWorkflowDiagram,
    convertToRocketWorkflow,
} from './workflow-parser';

// ─── Options ────────────────────────────────────────────────────

export interface RocketExportOptions {
    appName?: string;
    softDelete?: boolean;
    autoTimestamps?: boolean;   // default true: auto-add created_at/updated_at
    autoPrimaryKey?: boolean;   // default true: auto-add id:uuid if no [PK]
}

// ─── Shape Detection ────────────────────────────────────────────

const ENTITY_SHAPES = new Set(['entity', 'class', 'umlclass', 'table']);

function isEntityNode(node: DSLNode): boolean {
    return ENTITY_SHAPES.has(node.shape.toLowerCase());
}

// ─── Name Utilities ─────────────────────────────────────────────

function toSnakeCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
}

function pluralize(str: string): string {
    if (str.endsWith('s')) return str;
    if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
        return str.slice(0, -1) + 'ies';
    }
    if (str.endsWith('ch') || str.endsWith('sh') || str.endsWith('x') || str.endsWith('z')) {
        return str + 'es';
    }
    return str + 's';
}

// ─── Entity Extraction ─────────────────────────────────────────

function extractEntityFromNode(
    node: DSLNode,
    options: RocketExportOptions,
    _errors: RocketExportMessage[],
    warnings: RocketExportMessage[]
): RocketEntity | null {
    const entityName = toSnakeCase(node.label || node.id);

    // Parse fields from sections.attributes or table data
    let parsedFields: ParsedField[] = [];
    const attrText = node.sections?.attributes || '';

    if (attrText) {
        const { fields } = parseAttributes(attrText);
        parsedFields = fields;
    } else if (node.properties?.tableData) {
        // Table shape: parse from tableData rows
        parsedFields = parseTableData(node.properties.tableData, node.properties.tableHeaders);
    }

    if (parsedFields.length === 0) {
        warnings.push({ message: `Entity "${entityName}" has no fields defined`, nodeId: node.id });
    }

    // Determine primary key
    let pkField = parsedFields.find(f => f.primaryKey);
    const hasPK = !!pkField;

    // Auto-add primary key if not present
    if (!hasPK && options.autoPrimaryKey !== false) {
        const idField: ParsedField = {
            name: 'id',
            type: 'uuid',
            required: true,
            unique: false,
            primaryKey: true,
        };
        parsedFields.unshift(idField);
        pkField = idField;
    }

    // Auto-add timestamps if not present
    if (options.autoTimestamps !== false) {
        const hasCreatedAt = parsedFields.some(f => f.name === 'created_at');
        const hasUpdatedAt = parsedFields.some(f => f.name === 'updated_at');

        if (!hasCreatedAt) {
            parsedFields.push({
                name: 'created_at',
                type: 'timestamp',
                required: false,
                unique: false,
                primaryKey: false,
                auto: 'create',
            });
        }

        if (!hasUpdatedAt) {
            parsedFields.push({
                name: 'updated_at',
                type: 'timestamp',
                required: false,
                unique: false,
                primaryKey: false,
                auto: 'update',
            });
        }
    }

    // Add soft delete field if enabled
    const softDelete = options.softDelete ?? false;
    if (softDelete) {
        const hasDeletedAt = parsedFields.some(f => f.name === 'deleted_at');
        if (!hasDeletedAt) {
            parsedFields.push({
                name: 'deleted_at',
                type: 'timestamp',
                required: false,
                unique: false,
                primaryKey: false,
                nullable: true,
            } as any);
        }
    }

    // Convert ParsedFields to RocketFields
    const rocketFields: RocketField[] = parsedFields.map(f => {
        const field: RocketField = { name: f.name, type: f.type };
        if (f.required) field.required = true;
        if (f.unique) field.unique = true;
        if (f.default !== undefined) field.default = f.default;
        if (f.enum && f.enum.length > 0) field.enum = f.enum;
        if (f.precision !== undefined) field.precision = f.precision;
        if (f.auto) field.auto = f.auto;
        return field;
    });

    return {
        name: entityName,
        table: pluralize(entityName),
        primary_key: {
            field: pkField?.name || 'id',
            type: pkField?.type || 'uuid',
            generated: true,
        },
        soft_delete: softDelete,
        fields: rocketFields,
    };
}

// ─── Table Data Parser ──────────────────────────────────────────

/**
 * Parse tableData (2D string array) into ParsedFields.
 * Expected column layout:
 *   [0] field name
 *   [1] field type
 *   [2] constraints (optional): "required", "unique", "PK", "required unique"
 *   [3] default value (optional)
 */
function parseTableData(data: string[][], hasHeaders: boolean): ParsedField[] {
    if (!data || data.length === 0) return [];

    const startRow = hasHeaders ? 1 : 0;
    const fields: ParsedField[] = [];

    for (let i = startRow; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 2) continue;

        const name = row[0]?.trim();
        const rawType = row[1]?.trim();
        if (!name || !rawType) continue;

        const constraints = (row[2] || '').toLowerCase().trim();
        const defaultVal = row[3]?.trim();

        // Map type
        const typeMatch = rawType.match(/^(\w+)(?:\((\d+)\))?$/);
        const typeName = typeMatch ? typeMatch[1].toLowerCase() : rawType.toLowerCase();

        const TYPE_MAP: Record<string, string> = {
            'string': 'string', 'str': 'string', 'text': 'text',
            'int': 'int', 'integer': 'int', 'bigint': 'bigint',
            'float': 'float', 'double': 'float', 'decimal': 'decimal',
            'bool': 'boolean', 'boolean': 'boolean', 'uuid': 'uuid',
            'date': 'date', 'datetime': 'timestamp', 'timestamp': 'timestamp',
            'json': 'json', 'file': 'file',
        };

        const field: ParsedField = {
            name,
            type: TYPE_MAP[typeName] || typeName,
            required: constraints.includes('required') || constraints.includes('*'),
            unique: constraints.includes('unique'),
            primaryKey: constraints.includes('pk'),
        };

        if (typeMatch?.[2]) {
            field.precision = parseInt(typeMatch[2], 10);
        }

        if (defaultVal) {
            if (/^\d+$/.test(defaultVal)) field.default = parseInt(defaultVal, 10);
            else if (/^\d+\.\d+$/.test(defaultVal)) field.default = parseFloat(defaultVal);
            else if (defaultVal === 'true') field.default = true;
            else if (defaultVal === 'false') field.default = false;
            else field.default = defaultVal;
        }

        if (field.primaryKey) field.required = true;

        fields.push(field);
    }

    return fields;
}

// ─── State Machine Detection ────────────────────────────────────

/**
 * Detect state machines from entity fields that have enums
 * and a name containing "status" or "state".
 */
function detectStateMachines(entities: RocketEntity[]): RocketStateMachine[] {
    const machines: RocketStateMachine[] = [];

    for (const entity of entities) {
        for (const field of entity.fields) {
            if (!field.enum || field.enum.length < 2) continue;
            if (!/(status|state)/i.test(field.name)) continue;

            const initial = field.default?.toString() || field.enum[0];
            const transitions = [];

            // Generate transitions: each state can go to any other state
            for (const from of field.enum) {
                for (const to of field.enum) {
                    if (from !== to) {
                        transitions.push({ from, to });
                    }
                }
            }

            machines.push({
                entity: entity.name,
                field: field.name,
                definition: { initial, transitions },
                active: true,
            });
        }
    }

    return machines;
}

// ─── Main Exporter ──────────────────────────────────────────────

export function exportToRocket(
    diagram: DSLDiagram,
    options: RocketExportOptions = {}
): RocketExportResult {
    const errors: RocketExportMessage[] = [];
    const warnings: RocketExportMessage[] = [];

    // 1. Classify nodes: entities, state nodes, pseudo-state nodes, BPMN nodes
    const entityNodeMap = new Map<string, { node: DSLNode; entity: RocketEntity }>();
    const stateNodes: DSLNode[] = [];
    const pseudoNodes: DSLNode[] = [];
    const bpmnNodes: DSLNode[] = [];

    for (const node of diagram.nodes) {
        if (isEntityNode(node)) {
            const entity = extractEntityFromNode(node, options, errors, warnings);
            if (entity) {
                entityNodeMap.set(node.id, { node, entity });
            }
        } else if (isStateNode(node)) {
            stateNodes.push(node);
        } else if (isPseudoStateNode(node)) {
            pseudoNodes.push(node);
        } else if (isBpmnWorkflowNode(node)) {
            bpmnNodes.push(node);
        }
    }

    if (entityNodeMap.size === 0 && stateNodes.length === 0 && bpmnNodes.length === 0) {
        errors.push({ message: 'No entity, state, or BPMN nodes found in diagram.' });
        return { success: false, schema: null, errors, warnings };
    }

    // 2. Build node ID → entity name lookup
    const nodeIdToEntity = new Map<string, RocketEntity>();
    for (const [nodeId, { entity }] of entityNodeMap) {
        nodeIdToEntity.set(nodeId, entity);
    }

    // 3. Separate edges into three buckets: entity, state, BPMN
    const allStateNodeIds = new Set([
        ...stateNodes.map(n => n.id),
        ...pseudoNodes.map(n => n.id),
    ]);
    const allBpmnNodeIds = new Set(bpmnNodes.map(n => n.id));
    const entityEdges: DSLEdge[] = [];
    const stateEdges: DSLEdge[] = [];
    const bpmnEdges: DSLEdge[] = [];

    for (const edge of diagram.edges) {
        const fromIsState = allStateNodeIds.has(edge.from);
        const toIsState = allStateNodeIds.has(edge.to);
        const fromIsBpmn = allBpmnNodeIds.has(edge.from);
        const toIsBpmn = allBpmnNodeIds.has(edge.to);

        if (fromIsState || toIsState) {
            stateEdges.push(edge);
        } else if (fromIsBpmn || toIsBpmn) {
            bpmnEdges.push(edge);
        } else {
            entityEdges.push(edge);
        }
    }

    // 4. Extract relations from entity-to-entity edges
    const relations: RocketRelation[] = [];

    for (const edge of entityEdges) {
        const sourceEntity = nodeIdToEntity.get(edge.from);
        const targetEntity = nodeIdToEntity.get(edge.to);

        if (!sourceEntity || !targetEntity) {
            continue;
        }

        const parsed = parseRelation(edge, sourceEntity.name, targetEntity.name);

        // Handle reversed cardinality (N:1 → swap source/target)
        let source = sourceEntity;
        let target = targetEntity;
        const rawCard = edge.properties?.rel || edge.properties?.relationType || '';
        if (rawCard && isReversedCardinality(rawCard)) {
            source = targetEntity;
            target = sourceEntity;
        }

        const relation: RocketRelation = {
            name: parsed.name,
            type: parsed.cardinality,
            source: source.name,
            target: target.name,
            source_key: source.primary_key.field,
            ownership: 'source',
            on_delete: parsed.onDelete,
        };

        if (parsed.cardinality === 'one_to_one' || parsed.cardinality === 'one_to_many') {
            const fkName = parsed.foreignKey || `${source.name}_id`;
            relation.target_key = fkName;

            const hasFk = target.fields.some(f => f.name === fkName);
            if (!hasFk) {
                const timestampIdx = target.fields.findIndex(f => f.auto);
                const fkField: RocketField = {
                    name: fkName,
                    type: source.primary_key.type,
                };
                if (timestampIdx >= 0) {
                    target.fields.splice(timestampIdx, 0, fkField);
                } else {
                    target.fields.push(fkField);
                }
            }
        } else if (parsed.cardinality === 'many_to_many') {
            const joinTable = parsed.joinTable || `${source.name}_${target.name}`;
            relation.join_table = joinTable;
            relation.source_join_key = `${source.name}_id`;
            relation.target_join_key = `${target.name}_id`;
            relation.ownership = 'none';
            relation.on_delete = 'detach';
        }

        relations.push(relation);
    }

    // 5. Detect state machines
    const entities = Array.from(entityNodeMap.values()).map(e => e.entity);
    let stateMachines: RocketStateMachine[];

    if (stateNodes.length > 0) {
        // Diagram-aware: parse actual UML State diagram
        const parsedMachines = parseStateDiagram(stateNodes, pseudoNodes, stateEdges);
        stateMachines = parsedMachines.map(pm => {
            const assoc = associateWithEntity(pm, entities);
            const entityName = assoc?.entity || 'unknown';
            const fieldName = assoc?.field || 'status';

            // If associated, ensure the entity has the enum field with state values
            if (assoc) {
                const entity = entities.find(e => e.name === assoc.entity);
                if (entity) {
                    const existingField = entity.fields.find(f => f.name === assoc.field);
                    if (existingField && !existingField.enum) {
                        // Backfill enum values from state names
                        existingField.enum = pm.states
                            .filter(s => !s.isFinal)
                            .map(s => s.name);
                    }
                }
            }

            return convertToRocketStateMachine(pm, entityName, fieldName);
        });
    } else {
        // Fallback: detect from enum fields (primitive heuristic)
        stateMachines = detectStateMachines(entities);
    }

    // 6. Parse BPMN workflow diagrams
    let workflows: RocketWorkflow[] = [];
    if (bpmnNodes.length > 0) {
        const parsedWorkflows = parseWorkflowDiagram(bpmnNodes, bpmnEdges, warnings);
        workflows = parsedWorkflows.map(pw => convertToRocketWorkflow(pw, warnings));
    }

    // 7. Build final schema
    const schema: RocketImportSchema = {
        version: 1,
        exported_at: new Date().toISOString(),
        entities,
        relations,
        rules: [],
        state_machines: stateMachines,
        workflows,
        permissions: [],
        webhooks: [],
    };

    return {
        success: true,
        schema,
        errors,
        warnings,
    };
}

// ─── Reverse: Rocket Schema → DSLDiagram ────────────────────────

/**
 * Convert a Rocket Backend import/export JSON into a DSLDiagram
 * that can be rendered in YappyDraw.
 */
export function rocketSchemaToDSL(schema: RocketImportSchema): DSLDiagram {
    const nodes: DSLNode[] = [];
    const edges: DSLEdge[] = [];

    // Convert entities to nodes
    for (const entity of schema.entities) {
        // Build attribute lines
        const attrLines = entity.fields.map(f => {
            let line = `${f.name}: ${f.type}`;
            if (entity.primary_key.field === f.name) line += ' [PK]';
            if (f.required) line += ' *';
            if (f.unique) line += ' unique';
            if (f.default !== undefined) line += ` = ${f.default}`;
            if (f.enum && f.enum.length > 0) line += ` [${f.enum.join(',')}]`;
            if (f.precision !== undefined) line = line.replace(f.type, `${f.type}(${f.precision})`);
            if (f.auto) line += ` auto:${f.auto}`;
            return line;
        });

        // Filter out auto-generated fields for cleaner display
        const displayAttrs = attrLines.filter(l => !l.includes('auto:'));
        const autoAttrs = attrLines.filter(l => l.includes('auto:'));

        nodes.push({
            id: entity.name,
            shape: 'entity',
            label: entity.name.charAt(0).toUpperCase() + entity.name.slice(1).replace(/_./g, m => m[1].toUpperCase()),
            sections: {
                attributes: [...displayAttrs, ...autoAttrs].join('\n'),
            },
            width: 250,
            height: Math.max(120, 50 + entity.fields.length * 22),
            style: {
                backgroundColor: '#dbeafe',
                strokeColor: '#2563eb',
                fontSize: 14,
            },
        });
    }

    // Convert relations to edges
    for (const rel of schema.relations) {
        let cardStr = '1:N';
        if (rel.type === 'one_to_one') cardStr = '1:1';
        else if (rel.type === 'many_to_many') cardStr = 'M:N';

        edges.push({
            from: rel.source,
            to: rel.target,
            label: `${rel.name} [${cardStr} ${rel.on_delete}]`,
            type: 'arrow',
            curveType: 'elbow',
        });
    }

    return {
        version: 1,
        meta: {
            title: 'Rocket Backend Schema',
            sourceFormat: 'rocket',
        },
        layout: {
            strategy: 'tree-right',
            hSpacing: 200,
            vSpacing: 100,
        },
        nodes,
        edges,
    };
}
