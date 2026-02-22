/**
 * Rocket Workflow Parser
 *
 * Parses BPMN diagram nodes and edges into Rocket workflow definitions.
 *
 * BPMN shape data model:
 *   containerText line 1 = step name/ID
 *   containerText lines 2+ = config in "key: value" format
 *   Arrow labels = condition expressions for gateway branches
 *
 * Examples:
 *   bpmnTask (service): "Update Status\nset_field: order.status = approved"
 *   bpmnTask (user): "Review Purchase\nrole: finance_manager\ntimeout: 72h"
 *   bpmnExclusiveGateway: "Check Amount\namount > 1000"
 */

import type { DSLNode, DSLEdge } from '../../types';
import type {
    ParsedWorkflowNode,
    ParsedWorkflowNodeType,
    ParsedWorkflowEdge,
    ParsedWorkflow,
    RocketWorkflow,
    RocketWorkflowStep,
    RocketWorkflowAction,
    RocketWorkflowTrigger,
    RocketWorkflowAssignee,
    RocketExportMessage,
    StepGoto,
} from './types';

// ─── Shape Classification ─────────────────────────────────────────

const BPMN_EVENT_SHAPES = new Set([
    'bpmnstartevent', 'bpmnendevent', 'bpmnintermediateevent',
]);
const BPMN_GATEWAY_SHAPES = new Set([
    'bpmnexclusivegateway', 'bpmnparallelgateway',
    'bpmninclusivegateway', 'bpmneventgateway',
]);
const BPMN_ACTIVITY_SHAPES = new Set([
    'bpmntask', 'bpmnsubprocess', 'bpmncallactivity',
]);
const BPMN_ARTIFACT_SHAPES = new Set([
    'bpmndataobject', 'bpmndatastore', 'bpmnannotation', 'bpmngroup',
]);
const BPMN_POOL_SHAPES = new Set(['bpmnpool']);

const ALL_BPMN_SHAPES = new Set([
    ...BPMN_EVENT_SHAPES, ...BPMN_GATEWAY_SHAPES, ...BPMN_ACTIVITY_SHAPES,
    ...BPMN_ARTIFACT_SHAPES, ...BPMN_POOL_SHAPES,
]);

export function isBpmnWorkflowNode(node: DSLNode): boolean {
    return ALL_BPMN_SHAPES.has(node.shape.toLowerCase());
}

// ─── Name Utilities ───────────────────────────────────────────────

function toSnakeCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
}

// ─── ContainerText Parsing ────────────────────────────────────────

/**
 * Parse multi-line containerText into structured config.
 * Line 1 = name, lines 2+ = "key: value" pairs or raw expression.
 */
export function parseContainerText(text: string): {
    name: string;
    config: Record<string, string>;
    rawExpression?: string;
} {
    if (!text || !text.trim()) {
        return { name: '', config: {} };
    }

    const lines = text.split('\n');
    const name = lines[0].trim();
    const config: Record<string, string> = {};
    let rawExpression: string | undefined;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Match "key: value" — key can contain dots (context.record_id)
        const kvMatch = line.match(/^([\w][\w.\s]*?)\s*:\s*(.+)$/);
        if (kvMatch) {
            config[kvMatch[1].trim()] = kvMatch[2].trim();
        } else if (!rawExpression) {
            // First non-key:value line is a raw expression (e.g., gateway condition)
            rawExpression = line;
        }
    }

    return { name, config, rawExpression };
}

// ─── Action Config Parsing ────────────────────────────────────────

const NON_ACTION_KEYS = new Set([
    'role', 'user', 'timeout', 'entity', 'field', 'to', 'cron', 'event',
    'expression', 'method',
]);

/**
 * Parse action config entries into RocketWorkflowAction[].
 */
export function parseActionConfig(config: Record<string, string>): RocketWorkflowAction[] {
    const actions: RocketWorkflowAction[] = [];

    for (const [key, value] of Object.entries(config)) {
        const lk = key.toLowerCase().trim();

        // Skip non-action keys and context mappings
        if (NON_ACTION_KEYS.has(lk) || lk.startsWith('context.')) continue;

        if (lk === 'method') {
            // Method is consumed by webhook action via config['method']
            continue;
        }

        if (lk === 'set_field') {
            // Parse "entity.field = value"
            const match = value.match(/^(\w+)\.(\w+)\s*=\s*(.+)$/);
            if (match) {
                actions.push({
                    type: 'set_field',
                    entity: match[1],
                    field: match[2],
                    value: match[3].trim(),
                });
            } else {
                actions.push({ type: 'set_field', value });
            }
        } else if (lk === 'webhook') {
            actions.push({
                type: 'webhook',
                url: value,
                method: config['method'] || 'POST',
            });
        } else if (lk === 'create_record') {
            actions.push({ type: 'create_record', entity: value });
        } else if (lk === 'send_event') {
            actions.push({ type: 'send_event', event: value });
        }
    }

    return actions;
}

// ─── Node Classification ──────────────────────────────────────────

function classifyBpmnNode(node: DSLNode): ParsedWorkflowNode {
    const shape = node.shape.toLowerCase();
    const { name, config, rawExpression } = parseContainerText(node.label || '');

    let nodeType: ParsedWorkflowNodeType;
    if (shape === 'bpmnstartevent') nodeType = 'start';
    else if (shape === 'bpmnendevent') nodeType = 'end';
    else if (shape === 'bpmnintermediateevent') nodeType = 'intermediate';
    else if (BPMN_GATEWAY_SHAPES.has(shape)) nodeType = 'gateway';
    else if (shape === 'bpmnsubprocess') nodeType = 'subprocess';
    else if (BPMN_ACTIVITY_SHAPES.has(shape)) nodeType = 'task';
    else if (BPMN_POOL_SHAPES.has(shape)) nodeType = 'pool';
    else if (BPMN_ARTIFACT_SHAPES.has(shape)) nodeType = 'artifact';
    else nodeType = 'task';

    return {
        id: node.id,
        name: toSnakeCase(name || node.id),
        displayName: name || node.id,
        bpmnShape: node.shape,
        nodeType,
        taskType: node.properties?.bpmnTaskType,
        eventType: node.properties?.bpmnEventType,
        loopType: node.properties?.bpmnLoopType,
        config,
        rawExpression,
        poolId: node.pool?.poolId,
    };
}

// ─── Workflow Diagram Parsing ─────────────────────────────────────

/**
 * Parse BPMN nodes and edges into ParsedWorkflow(s).
 * Each start event begins a separate workflow.
 */
export function parseWorkflowDiagram(
    bpmnNodes: DSLNode[],
    bpmnEdges: DSLEdge[],
    warnings: RocketExportMessage[]
): ParsedWorkflow[] {
    if (bpmnNodes.length === 0) return [];

    // Classify all nodes
    const allNodes = new Map<string, ParsedWorkflowNode>();
    const poolNodes = new Map<string, ParsedWorkflowNode>();

    for (const node of bpmnNodes) {
        const classified = classifyBpmnNode(node);
        if (classified.nodeType === 'artifact') continue; // skip non-executable
        if (classified.nodeType === 'pool') {
            poolNodes.set(classified.id, classified);
            continue;
        }
        allNodes.set(classified.id, classified);
    }

    // Build edges (filter to only those connecting known nodes)
    const allNodeIds = new Set(allNodes.keys());
    const edges: ParsedWorkflowEdge[] = bpmnEdges
        .filter(e => allNodeIds.has(e.from) && allNodeIds.has(e.to))
        .map(e => ({
            id: e.id || `${e.from}-${e.to}`,
            from: e.from,
            to: e.to,
            label: e.label,
        }));

    // Build adjacency (outgoing)
    const outgoing = new Map<string, ParsedWorkflowEdge[]>();
    for (const edge of edges) {
        if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
        outgoing.get(edge.from)!.push(edge);
    }

    // Find start nodes
    const startNodes = Array.from(allNodes.values()).filter(n => n.nodeType === 'start');

    if (startNodes.length === 0) {
        // Fallback: find nodes with no incoming edges
        const hasIncoming = new Set(edges.map(e => e.to));
        const roots = Array.from(allNodes.values()).filter(n => !hasIncoming.has(n.id));
        if (roots.length > 0) {
            warnings.push({ message: 'No BPMN start event found; using nodes with no incoming edges as workflow starts.' });
            startNodes.push(...roots);
        } else {
            warnings.push({ message: 'No BPMN start event found and no root nodes detected.' });
            return [];
        }
    }

    // BFS from each start node to collect a workflow
    const visited = new Set<string>();
    const workflows: ParsedWorkflow[] = [];

    for (const startNode of startNodes) {
        if (visited.has(startNode.id)) continue;

        const workflowNodes: ParsedWorkflowNode[] = [];
        const workflowEdges: ParsedWorkflowEdge[] = [];
        const endNodes: ParsedWorkflowNode[] = [];
        const queue = [startNode.id];

        // BFS to collect reachable nodes
        const localVisited = new Set<string>();
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (localVisited.has(nodeId)) continue;
            localVisited.add(nodeId);
            visited.add(nodeId);

            const node = allNodes.get(nodeId);
            if (!node) continue;
            workflowNodes.push(node);
            if (node.nodeType === 'end') endNodes.push(node);

            const outs = outgoing.get(nodeId) || [];
            for (const edge of outs) {
                workflowEdges.push(edge);
                if (!localVisited.has(edge.to)) {
                    queue.push(edge.to);
                }
            }
        }

        // Also collect incoming edges within the workflow (for back-edges / loops)
        const workflowNodeIds = new Set(workflowNodes.map(n => n.id));
        for (const edge of edges) {
            if (workflowNodeIds.has(edge.from) && workflowNodeIds.has(edge.to)) {
                if (!workflowEdges.some(e => e.id === edge.id)) {
                    workflowEdges.push(edge);
                }
            }
        }

        // Determine workflow name
        const pool = startNode.poolId ? poolNodes.get(startNode.poolId) : undefined;
        const wfName = pool?.displayName
            || (startNode.displayName !== startNode.id ? startNode.name : `workflow_${workflows.length + 1}`);

        workflows.push({
            name: toSnakeCase(wfName),
            startNode,
            endNodes,
            nodes: workflowNodes,
            edges: workflowEdges,
            poolName: pool?.displayName,
        });
    }

    return workflows;
}

// ─── Conversion to RocketWorkflow ─────────────────────────────────

/**
 * Convert a ParsedWorkflow into a RocketWorkflow.
 */
export function convertToRocketWorkflow(
    parsed: ParsedWorkflow,
    warnings: RocketExportMessage[]
): RocketWorkflow {
    // Build trigger from start node
    const trigger = buildTrigger(parsed.startNode);

    // Build context from start node's context.* config entries
    const context: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.startNode.config)) {
        if (key.startsWith('context.')) {
            context[key.slice(8)] = value;
        }
    }

    // Build step ID mapping (node ID → step ID), ensuring uniqueness
    const endNodeIds = new Set(parsed.endNodes.map(n => n.id));
    const stepNodes = parsed.nodes.filter(
        n => n.nodeType !== 'start' && n.nodeType !== 'end'
    );
    const nodeIdToStepId = new Map<string, string>();
    const usedStepIds = new Set<string>();

    for (const node of stepNodes) {
        let stepId = node.name;
        if (usedStepIds.has(stepId)) {
            let suffix = 2;
            while (usedStepIds.has(`${stepId}_${suffix}`)) suffix++;
            stepId = `${stepId}_${suffix}`;
        }
        usedStepIds.add(stepId);
        nodeIdToStepId.set(node.id, stepId);
    }

    // Build outgoing edge map
    const outgoing = new Map<string, ParsedWorkflowEdge[]>();
    for (const edge of parsed.edges) {
        if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
        outgoing.get(edge.from)!.push(edge);
    }

    // Resolve goto for a target node ID
    const resolveGoto = (targetId: string): StepGoto => {
        if (endNodeIds.has(targetId)) return 'end';
        const stepId = nodeIdToStepId.get(targetId);
        return stepId ? { goto: stepId } : 'end';
    };

    // Build steps by traversing in BFS order from start node
    const steps: RocketWorkflowStep[] = [];
    const visited = new Set<string>();
    const queue = [parsed.startNode.id];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = parsed.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        const outs = outgoing.get(nodeId) || [];

        // Queue next nodes
        for (const edge of outs) {
            if (!visited.has(edge.to)) queue.push(edge.to);
        }

        // Skip start and end nodes (they become trigger / termination, not steps)
        if (node.nodeType === 'start' || node.nodeType === 'end') continue;

        const stepId = nodeIdToStepId.get(node.id);
        if (!stepId) continue;

        const step = buildStep(node, stepId, outs, resolveGoto, warnings);
        if (step) steps.push(step);
    }

    return {
        name: parsed.name,
        trigger,
        context,
        steps,
        active: true,
    };
}

// ─── Trigger Builder ──────────────────────────────────────────────

function buildTrigger(startNode: ParsedWorkflowNode): RocketWorkflowTrigger {
    const { config, eventType } = startNode;

    if (eventType === 'timer') {
        return {
            type: 'timer',
            entity: config['entity'],
            cron: config['cron'],
        };
    }

    if (eventType === 'message') {
        return {
            type: 'message',
            entity: config['entity'],
            event: config['event'] || startNode.name,
        };
    }

    // Default: state_change trigger
    return {
        type: 'state_change',
        entity: config['entity'],
        field: config['field'] || 'status',
        to: config['to'],
    };
}

// ─── Step Builder ─────────────────────────────────────────────────

function buildStep(
    node: ParsedWorkflowNode,
    stepId: string,
    outEdges: ParsedWorkflowEdge[],
    resolveGoto: (targetId: string) => StepGoto,
    warnings: RocketExportMessage[]
): RocketWorkflowStep | null {
    const shape = node.bpmnShape.toLowerCase();

    // Gateway → condition step
    if (node.nodeType === 'gateway') {
        return buildGatewayStep(node, stepId, outEdges, resolveGoto, shape, warnings);
    }

    // Task / subprocess / intermediate → action or approval step
    const taskType = node.taskType?.toLowerCase();

    if (taskType === 'user' || taskType === 'manual') {
        return buildApprovalStep(node, stepId, outEdges, resolveGoto);
    }

    if (taskType === 'businessrule') {
        return buildBusinessRuleStep(node, stepId, outEdges, resolveGoto);
    }

    // Default: action step
    return buildActionStep(node, stepId, outEdges, resolveGoto, warnings);
}

// ─── Action Step ──────────────────────────────────────────────────

function buildActionStep(
    node: ParsedWorkflowNode,
    stepId: string,
    outEdges: ParsedWorkflowEdge[],
    resolveGoto: (targetId: string) => StepGoto,
    warnings: RocketExportMessage[]
): RocketWorkflowStep {
    const actions = parseActionConfig(node.config);

    if (actions.length === 0 && Object.keys(node.config).length > 0) {
        warnings.push({
            message: `Step "${node.displayName}" has config but no recognized actions`,
            nodeId: node.id,
        });
    }

    const step: RocketWorkflowStep = {
        id: stepId,
        type: 'action',
    };

    if (actions.length > 0) step.actions = actions;

    // Follow single outgoing edge
    if (outEdges.length > 0) {
        step.then = resolveGoto(outEdges[0].to);
    } else {
        step.then = 'end';
    }

    return step;
}

// ─── Approval Step ────────────────────────────────────────────────

function buildApprovalStep(
    node: ParsedWorkflowNode,
    stepId: string,
    outEdges: ParsedWorkflowEdge[],
    resolveGoto: (targetId: string) => StepGoto
): RocketWorkflowStep {
    const step: RocketWorkflowStep = {
        id: stepId,
        type: 'approval',
    };

    // Parse assignee from config
    const assignee = buildAssignee(node.config);
    if (assignee) step.assignee = assignee;
    if (node.config['timeout']) step.timeout = node.config['timeout'];

    // Route outgoing edges by label
    const approveEdge = outEdges.find(e =>
        e.label && /^(yes|approve|approved|accept)$/i.test(e.label.trim())
    );
    const rejectEdge = outEdges.find(e =>
        e.label && /^(no|reject|rejected|deny|denied)$/i.test(e.label.trim())
    );
    const timeoutEdge = outEdges.find(e =>
        e.label && /^(timeout|timed?\s*out|expired?)$/i.test(e.label.trim())
    );

    if (approveEdge) {
        step.on_approve = resolveGoto(approveEdge.to);
    } else if (outEdges.length > 0) {
        // Default: first edge is the approve path
        step.on_approve = resolveGoto(outEdges[0].to);
    }

    if (rejectEdge) {
        step.on_reject = resolveGoto(rejectEdge.to);
    } else {
        step.on_reject = 'end';
    }

    if (timeoutEdge) {
        step.on_timeout = resolveGoto(timeoutEdge.to);
    } else if (step.on_approve && step.on_approve !== 'end') {
        // Default timeout follows approve path
        step.on_timeout = step.on_approve;
    }

    return step;
}

function buildAssignee(config: Record<string, string>): RocketWorkflowAssignee | undefined {
    if (config['role']) return { type: 'role', role: config['role'] };
    if (config['user']) return { type: 'user', user: config['user'] };
    if (config['field']) return { type: 'field', path: config['field'] };
    return undefined;
}

// ─── Gateway (Condition) Step ─────────────────────────────────────

const TRUTHY_LABELS = /^(yes|true|ok|approve|pass)$/i;
const FALSY_LABELS = /^(no|false|else|default|reject|fail)$/i;

function buildGatewayStep(
    node: ParsedWorkflowNode,
    stepId: string,
    outEdges: ParsedWorkflowEdge[],
    resolveGoto: (targetId: string) => StepGoto,
    shape: string,
    warnings: RocketExportMessage[]
): RocketWorkflowStep {
    // Parallel gateway: not a condition — generate pass-through
    if (shape === 'bpmnparallelgateway') {
        return buildParallelGatewayStep(node, stepId, outEdges, resolveGoto, warnings);
    }

    // Exclusive / Inclusive / Event gateway → condition step
    const step: RocketWorkflowStep = {
        id: stepId,
        type: 'condition',
    };

    // Expression from rawExpression or config
    step.expression = node.rawExpression
        || node.config['expression']
        || node.displayName;

    if (outEdges.length === 0) {
        step.on_true = 'end';
        step.on_false = 'end';
        return step;
    }

    if (outEdges.length === 1) {
        step.on_true = resolveGoto(outEdges[0].to);
        step.on_false = 'end';
        return step;
    }

    // Find true/false edges by label
    const trueEdge = outEdges.find(e => e.label && TRUTHY_LABELS.test(e.label.trim()));
    const falseEdge = outEdges.find(e => e.label && FALSY_LABELS.test(e.label.trim()));

    if (trueEdge && falseEdge) {
        step.on_true = resolveGoto(trueEdge.to);
        step.on_false = resolveGoto(falseEdge.to);
    } else if (trueEdge) {
        step.on_true = resolveGoto(trueEdge.to);
        const otherEdge = outEdges.find(e => e !== trueEdge);
        step.on_false = otherEdge ? resolveGoto(otherEdge.to) : 'end';
    } else if (falseEdge) {
        step.on_false = resolveGoto(falseEdge.to);
        const otherEdge = outEdges.find(e => e !== falseEdge);
        step.on_true = otherEdge ? resolveGoto(otherEdge.to) : 'end';
    } else {
        // No labeled edges — use order: first = true, second = false
        step.on_true = resolveGoto(outEdges[0].to);
        step.on_false = resolveGoto(outEdges[1].to);
        if (outEdges.length > 2) {
            warnings.push({
                message: `Gateway "${node.displayName}" has ${outEdges.length} outgoing edges but no labels; using first two as true/false`,
                nodeId: node.id,
            });
        }
    }

    if (shape === 'bpmninclusivegateway') {
        warnings.push({
            message: `Inclusive gateway "${node.displayName}" treated as exclusive condition`,
            nodeId: node.id,
        });
    }

    return step;
}

// ─── Parallel Gateway Step ────────────────────────────────────────

function buildParallelGatewayStep(
    node: ParsedWorkflowNode,
    stepId: string,
    outEdges: ParsedWorkflowEdge[],
    resolveGoto: (targetId: string) => StepGoto,
    warnings: RocketExportMessage[]
): RocketWorkflowStep {
    // Parallel gateway as an action step that fans out
    // Rocket doesn't natively support parallel execution in a single step,
    // so we emit it as an action step with the first branch and warn
    if (outEdges.length <= 1) {
        return {
            id: stepId,
            type: 'action',
            then: outEdges.length > 0 ? resolveGoto(outEdges[0].to) : 'end',
        };
    }

    warnings.push({
        message: `Parallel gateway "${node.displayName}" has ${outEdges.length} branches; Rocket workflows are sequential — using first branch, remaining branches noted as warnings`,
        nodeId: node.id,
    });

    return {
        id: stepId,
        type: 'action',
        then: resolveGoto(outEdges[0].to),
    };
}

// ─── Business Rule Step ───────────────────────────────────────────

function buildBusinessRuleStep(
    node: ParsedWorkflowNode,
    stepId: string,
    outEdges: ParsedWorkflowEdge[],
    resolveGoto: (targetId: string) => StepGoto
): RocketWorkflowStep {
    const step: RocketWorkflowStep = {
        id: stepId,
        type: 'condition',
        expression: node.rawExpression || node.config['expression'] || node.displayName,
    };

    // Same branching logic as gateway
    const trueEdge = outEdges.find(e => e.label && TRUTHY_LABELS.test(e.label.trim()));
    const falseEdge = outEdges.find(e => e.label && FALSY_LABELS.test(e.label.trim()));

    if (trueEdge) {
        step.on_true = resolveGoto(trueEdge.to);
    } else if (outEdges.length > 0) {
        step.on_true = resolveGoto(outEdges[0].to);
    } else {
        step.on_true = 'end';
    }

    if (falseEdge) {
        step.on_false = resolveGoto(falseEdge.to);
    } else if (outEdges.length > 1) {
        step.on_false = resolveGoto(outEdges[1].to);
    } else {
        step.on_false = 'end';
    }

    return step;
}
