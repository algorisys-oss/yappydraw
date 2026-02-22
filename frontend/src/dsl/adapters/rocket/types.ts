/**
 * Rocket Backend Export Types
 *
 * Types for the Rocket Backend import JSON schema.
 * Matches the format expected by POST /api/:app/_admin/import
 */

// ─── Export Result ──────────────────────────────────────────────

export interface RocketExportResult {
    success: boolean;
    schema: RocketImportSchema | null;
    errors: RocketExportMessage[];
    warnings: RocketExportMessage[];
}

export interface RocketExportMessage {
    message: string;
    nodeId?: string;
    edgeId?: string;
}

// ─── Import Schema (matches Rocket Backend's expected format) ──

export interface RocketImportSchema {
    version: 1;
    exported_at: string;
    entities: RocketEntity[];
    relations: RocketRelation[];
    rules: RocketRule[];
    state_machines: RocketStateMachine[];
    workflows: RocketWorkflow[];
    permissions: any[];
    webhooks: any[];
}

// ─── Entity ─────────────────────────────────────────────────────

export interface RocketEntity {
    name: string;
    table: string;
    primary_key: RocketPrimaryKey;
    soft_delete: boolean;
    fields: RocketField[];
}

export interface RocketPrimaryKey {
    field: string;
    type: string;       // uuid, int, bigint, string
    generated: boolean;
}

export interface RocketField {
    name: string;
    type: string;       // uuid, string, text, int, bigint, float, decimal, boolean, timestamp, date, json, file
    required?: boolean;
    unique?: boolean;
    default?: any;
    nullable?: boolean;
    enum?: string[];
    precision?: number; // for decimal
    auto?: string;      // "create" or "update"
}

// ─── Relation ───────────────────────────────────────────────────

export interface RocketRelation {
    name: string;
    type: string;               // one_to_one, one_to_many, many_to_many
    source: string;
    target: string;
    source_key: string;
    target_key?: string;
    join_table?: string;        // for many_to_many
    source_join_key?: string;   // for many_to_many
    target_join_key?: string;   // for many_to_many
    ownership: string;          // source, target, none
    on_delete: string;          // cascade, set_null, restrict, detach
}

// ─── Rule ───────────────────────────────────────────────────────

export interface RocketRule {
    entity: string;
    hook: string;               // before_write, after_write, before_delete
    type: string;               // field, expression, computed
    definition: any;
    priority: number;
    active: boolean;
}

// ─── State Machine ──────────────────────────────────────────────

export interface RocketStateMachine {
    entity: string;
    field: string;
    definition: {
        initial: string;
        transitions: RocketTransition[];
    };
    active: boolean;
}

export interface RocketTransition {
    from: string | string[];
    to: string;
    event?: string;             // trigger name from UML state transition label
    guard?: string;             // condition from [guard] in UML label
    roles?: string[];
    actions?: RocketTransitionAction[];
}

export interface RocketTransitionAction {
    type: string;               // set_field, webhook, create_record
    field?: string;
    value?: any;
}

// ─── Parsed Field (intermediate, before converting to RocketField) ──

export interface ParsedField {
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    primaryKey: boolean;
    default?: any;
    enum?: string[];
    precision?: number;
    auto?: string;
    visibility?: '+' | '-' | '#';
}

// ─── Parsed Relation (intermediate) ────────────────────────────

export interface ParsedRelation {
    name: string;
    cardinality: 'one_to_one' | 'one_to_many' | 'many_to_many';
    onDelete: string;
    foreignKey?: string;        // custom FK name
    joinTable?: string;         // custom join table name
}

// ─── Parsed Method (from UML methodsText) ──────────────────────

export interface ParsedMethod {
    name: string;
    visibility: '+' | '-' | '#';
    params: string;
    returnType?: string;
}

// ─── Parsed State (intermediate, from UML state diagram) ────────

export interface ParsedState {
    id: string;
    name: string;
    actions?: { entry?: string; doActivity?: string; exit?: string };
    isInitial?: boolean;
    isFinal?: boolean;
}

export interface ParsedTransition {
    from: string;
    to: string;
    event?: string;
    guard?: string;
    effects?: string[];
}

export interface ParsedStateMachine {
    states: ParsedState[];
    transitions: ParsedTransition[];
    initial?: string;
}

// ─── Workflow (Rocket Backend target format) ─────────────────────

export interface RocketWorkflow {
    name: string;
    trigger: RocketWorkflowTrigger;
    context: Record<string, string>;
    steps: RocketWorkflowStep[];
    active: boolean;
}

export interface RocketWorkflowTrigger {
    type: string;               // state_change, timer, message, manual
    entity?: string;
    field?: string;
    to?: string;
    cron?: string;              // for timer triggers
    event?: string;             // for message triggers
}

export interface RocketWorkflowStep {
    id: string;
    type: string;               // action, condition, approval

    // Action step
    actions?: RocketWorkflowAction[];
    then?: StepGoto;

    // Condition step
    expression?: string;
    on_true?: StepGoto;
    on_false?: StepGoto;

    // Approval step
    assignee?: RocketWorkflowAssignee;
    timeout?: string;
    on_approve?: StepGoto;
    on_reject?: StepGoto;
    on_timeout?: StepGoto;
}

export interface RocketWorkflowAction {
    type: string;               // set_field, webhook, create_record, send_event
    entity?: string;
    record_id?: string;
    field?: string;
    value?: any;
    url?: string;
    method?: string;
    event?: string;
}

export interface RocketWorkflowAssignee {
    type: string;               // role, user, field
    path?: string;
    role?: string;
    user?: string;
}

export type StepGoto = { goto: string } | 'end';

// ─── Parsed Workflow (intermediate, from BPMN diagram) ───────────

export type ParsedWorkflowNodeType =
    | 'start' | 'end' | 'task' | 'gateway' | 'intermediate'
    | 'subprocess' | 'annotation' | 'pool' | 'artifact';

export interface ParsedWorkflowNode {
    id: string;
    name: string;               // snake_cased from containerText line 1
    displayName: string;        // original first line
    bpmnShape: string;          // original BPMN shape type
    nodeType: ParsedWorkflowNodeType;
    taskType?: string;          // bpmnTaskType
    eventType?: string;         // bpmnEventType
    loopType?: string;          // bpmnLoopType
    config: Record<string, string>;
    rawExpression?: string;     // non-key:value line (for gateway conditions)
    poolId?: string;            // containing pool node ID
}

export interface ParsedWorkflowEdge {
    id: string;
    from: string;
    to: string;
    label?: string;
}

export interface ParsedWorkflow {
    name: string;
    startNode: ParsedWorkflowNode;
    endNodes: ParsedWorkflowNode[];
    nodes: ParsedWorkflowNode[];
    edges: ParsedWorkflowEdge[];
    poolName?: string;
}
