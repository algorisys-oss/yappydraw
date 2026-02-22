import { describe, it, expect } from "bun:test";
import {
    parseContainerText,
    parseActionConfig,
    isBpmnWorkflowNode,
    parseWorkflowDiagram,
    convertToRocketWorkflow,
} from "./workflow-parser";
import type { DSLNode, DSLEdge } from '../../types';
import type { RocketExportMessage } from './types';

// ─── Helper: create a DSLNode for testing ────────────────────────

function makeNode(id: string, shape: string, label?: string, properties?: Record<string, any>): DSLNode {
    return { id, shape, label, properties };
}

function makeEdge(from: string, to: string, label?: string, id?: string): DSLEdge {
    return { id: id || `${from}-${to}`, from, to, label };
}

// ─── parseContainerText ──────────────────────────────────────────

describe("parseContainerText", () => {
    it("should return empty name and config for empty text", () => {
        const result = parseContainerText("");
        expect(result.name).toBe("");
        expect(result.config).toEqual({});
        expect(result.rawExpression).toBeUndefined();
    });

    it("should parse single-line text as just a name", () => {
        const result = parseContainerText("Order Created");
        expect(result.name).toBe("Order Created");
        expect(result.config).toEqual({});
    });

    it("should parse multi-line key:value config", () => {
        const result = parseContainerText("Order Created\nentity: order\nfield: status\nto: pending");
        expect(result.name).toBe("Order Created");
        expect(result.config).toEqual({
            entity: "order",
            field: "status",
            to: "pending",
        });
    });

    it("should treat non key:value lines as rawExpression", () => {
        const result = parseContainerText("Check Amount\namount > 1000");
        expect(result.name).toBe("Check Amount");
        expect(result.rawExpression).toBe("amount > 1000");
    });

    it("should handle keys with dots (context mappings)", () => {
        const result = parseContainerText("Start\ncontext.record_id: record.id\nentity: order");
        expect(result.name).toBe("Start");
        expect(result.config["context.record_id"]).toBe("record.id");
        expect(result.config["entity"]).toBe("order");
    });

    it("should skip blank lines", () => {
        const result = parseContainerText("Name\n\nkey: value\n\n");
        expect(result.name).toBe("Name");
        expect(result.config).toEqual({ key: "value" });
    });

    it("should handle values with colons (URLs)", () => {
        const result = parseContainerText("Send Notification\nwebhook: https://api.example.com/notify");
        expect(result.name).toBe("Send Notification");
        expect(result.config["webhook"]).toBe("https://api.example.com/notify");
    });
});

// ─── parseActionConfig ──────────────────────────────────────────

describe("parseActionConfig", () => {
    it("should return empty array for empty config", () => {
        expect(parseActionConfig({})).toEqual([]);
    });

    it("should skip non-action keys (role, user, timeout, entity, field, to)", () => {
        const actions = parseActionConfig({
            role: "admin",
            user: "john",
            timeout: "72h",
            entity: "order",
            field: "status",
            to: "pending",
        });
        expect(actions).toEqual([]);
    });

    it("should parse set_field with entity.field = value", () => {
        const actions = parseActionConfig({ set_field: "order.status = approved" });
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: "set_field",
            entity: "order",
            field: "status",
            value: "approved",
        });
    });

    it("should parse set_field without entity.field format", () => {
        const actions = parseActionConfig({ set_field: "some_value" });
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({ type: "set_field", value: "some_value" });
    });

    it("should parse webhook action", () => {
        const actions = parseActionConfig({ webhook: "https://api.example.com/hook" });
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: "webhook",
            url: "https://api.example.com/hook",
            method: "POST",
        });
    });

    it("should parse webhook with custom method", () => {
        const actions = parseActionConfig({
            webhook: "https://api.example.com",
            method: "PUT",
        });
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({
            type: "webhook",
            url: "https://api.example.com",
            method: "PUT",
        });
    });

    it("should parse create_record action", () => {
        const actions = parseActionConfig({ create_record: "audit_log" });
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({ type: "create_record", entity: "audit_log" });
    });

    it("should parse send_event action", () => {
        const actions = parseActionConfig({ send_event: "order_approved" });
        expect(actions).toHaveLength(1);
        expect(actions[0]).toEqual({ type: "send_event", event: "order_approved" });
    });

    it("should parse multiple actions from a single config", () => {
        const actions = parseActionConfig({
            set_field: "order.status = shipped",
            webhook: "https://notify.example.com",
            send_event: "order_shipped",
        });
        expect(actions).toHaveLength(3);
        expect(actions.map(a => a.type)).toEqual(["set_field", "webhook", "send_event"]);
    });

    it("should skip context.* keys", () => {
        const actions = parseActionConfig({
            "context.record_id": "record.id",
            set_field: "order.status = done",
        });
        expect(actions).toHaveLength(1);
        expect(actions[0].type).toBe("set_field");
    });
});

// ─── isBpmnWorkflowNode ────────────────────────────────────────

describe("isBpmnWorkflowNode", () => {
    it("should recognize BPMN event shapes", () => {
        expect(isBpmnWorkflowNode(makeNode("n1", "bpmnStartEvent"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n2", "bpmnEndEvent"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n3", "bpmnIntermediateEvent"))).toBe(true);
    });

    it("should recognize BPMN gateway shapes", () => {
        expect(isBpmnWorkflowNode(makeNode("n1", "bpmnExclusiveGateway"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n2", "bpmnParallelGateway"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n3", "bpmnInclusiveGateway"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n4", "bpmnEventGateway"))).toBe(true);
    });

    it("should recognize BPMN activity shapes", () => {
        expect(isBpmnWorkflowNode(makeNode("n1", "bpmnTask"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n2", "bpmnSubProcess"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n3", "bpmnCallActivity"))).toBe(true);
    });

    it("should recognize BPMN artifact and pool shapes", () => {
        expect(isBpmnWorkflowNode(makeNode("n1", "bpmnDataObject"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n2", "bpmnAnnotation"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n3", "bpmnPool"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n4", "bpmnDataStore"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n5", "bpmnGroup"))).toBe(true);
    });

    it("should be case-insensitive", () => {
        expect(isBpmnWorkflowNode(makeNode("n1", "BPMNSTARTEVENT"))).toBe(true);
        expect(isBpmnWorkflowNode(makeNode("n2", "BpmnTask"))).toBe(true);
    });

    it("should reject non-BPMN shapes", () => {
        expect(isBpmnWorkflowNode(makeNode("n1", "rectangle"))).toBe(false);
        expect(isBpmnWorkflowNode(makeNode("n2", "umlClass"))).toBe(false);
        expect(isBpmnWorkflowNode(makeNode("n3", "state"))).toBe(false);
    });
});

// ─── parseWorkflowDiagram ───────────────────────────────────────

describe("parseWorkflowDiagram", () => {
    it("should return empty for no nodes", () => {
        const warnings: RocketExportMessage[] = [];
        const result = parseWorkflowDiagram([], [], warnings);
        expect(result).toEqual([]);
    });

    it("should parse a simple linear workflow: start → task → end", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Order Created\nentity: order\nfield: status\nto: pending"),
            makeNode("t1", "bpmnTask", "Update Status\nset_field: order.status = approved", { bpmnTaskType: "service" }),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const result = parseWorkflowDiagram(nodes, edges, warnings);
        expect(result).toHaveLength(1);

        const wf = result[0];
        expect(wf.startNode.id).toBe("s1");
        expect(wf.endNodes).toHaveLength(1);
        expect(wf.endNodes[0].id).toBe("e1");
        expect(wf.nodes).toHaveLength(3);
        expect(wf.edges).toHaveLength(2);
    });

    it("should skip artifact nodes (annotations, data objects)", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("t1", "bpmnTask", "Do Work"),
            makeNode("e1", "bpmnEndEvent"),
            makeNode("a1", "bpmnAnnotation", "This is a note"),
            makeNode("d1", "bpmnDataObject", "Invoice"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const result = parseWorkflowDiagram(nodes, edges, warnings);
        expect(result).toHaveLength(1);
        // Artifact nodes excluded from workflow nodes
        const nodeIds = result[0].nodes.map(n => n.id);
        expect(nodeIds).not.toContain("a1");
        expect(nodeIds).not.toContain("d1");
    });

    it("should separate pool nodes from workflow nodes", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("pool1", "bpmnPool", "Order Department"),
            makeNode("s1", "bpmnStartEvent", "Order Created"),
            makeNode("t1", "bpmnTask", "Process"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        // Pool node with s1 inside it
        nodes[1].pool = { poolId: "pool1", lane: 0 };
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const result = parseWorkflowDiagram(nodes, edges, warnings);
        expect(result).toHaveLength(1);
        // Pool used as workflow name
        expect(result[0].poolName).toBe("Order Department");
    });

    it("should warn when no start event found", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("t1", "bpmnTask", "Do Work"),
            makeNode("t2", "bpmnTask", "Do More"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("t1", "t2"),
            makeEdge("t2", "e1"),
        ];

        const result = parseWorkflowDiagram(nodes, edges, warnings);
        expect(result).toHaveLength(1);
        expect(warnings.some(w => w.message.includes("No BPMN start event found"))).toBe(true);
    });

    it("should create separate workflows for multiple start events", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Workflow A"),
            makeNode("t1", "bpmnTask", "Task A"),
            makeNode("e1", "bpmnEndEvent"),
            makeNode("s2", "bpmnStartEvent", "Workflow B"),
            makeNode("t2", "bpmnTask", "Task B"),
            makeNode("e2", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
            makeEdge("s2", "t2"),
            makeEdge("t2", "e2"),
        ];

        const result = parseWorkflowDiagram(nodes, edges, warnings);
        expect(result).toHaveLength(2);
    });
});

// ─── convertToRocketWorkflow ────────────────────────────────────

describe("convertToRocketWorkflow", () => {
    it("should build a state_change trigger from start node config", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Order Created\nentity: order\nfield: status\nto: pending"),
            makeNode("t1", "bpmnTask", "Notify\nwebhook: https://example.com", { bpmnTaskType: "service" }),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        expect(wf.trigger.type).toBe("state_change");
        expect(wf.trigger.entity).toBe("order");
        expect(wf.trigger.field).toBe("status");
        expect(wf.trigger.to).toBe("pending");
        expect(wf.active).toBe(true);
    });

    it("should build a timer trigger for timer start events", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Daily Report\ncron: 0 9 * * *", { bpmnEventType: "timer" }),
            makeNode("t1", "bpmnTask", "Generate Report"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        expect(wf.trigger.type).toBe("timer");
        expect(wf.trigger.cron).toBe("0 9 * * *");
    });

    it("should build a message trigger for message start events", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Payment Received\nevent: payment_complete\nentity: order", { bpmnEventType: "message" }),
            makeNode("t1", "bpmnTask", "Process Payment"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        expect(wf.trigger.type).toBe("message");
        expect(wf.trigger.event).toBe("payment_complete");
        expect(wf.trigger.entity).toBe("order");
    });

    it("should extract context from start node's context.* config", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Order Created\nentity: order\ncontext.record_id: record.id\ncontext.user: current_user"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [makeEdge("s1", "e1")];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        expect(wf.context).toEqual({
            record_id: "record.id",
            user: "current_user",
        });
    });

    it("should build an action step from a service task", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("t1", "bpmnTask", "Update Status\nset_field: order.status = approved\nwebhook: https://notify.example.com", { bpmnTaskType: "service" }),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        expect(wf.steps).toHaveLength(1);
        const step = wf.steps[0];
        expect(step.type).toBe("action");
        expect(step.id).toBe("update_status");
        expect(step.actions).toHaveLength(2);
        expect(step.actions![0]).toEqual({
            type: "set_field",
            entity: "order",
            field: "status",
            value: "approved",
        });
        expect(step.actions![1].type).toBe("webhook");
        expect(step.then).toBe("end");
    });

    it("should build an approval step from a user task", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("t1", "bpmnTask", "Review Purchase\nrole: finance_manager\ntimeout: 72h", { bpmnTaskType: "user" }),
            makeNode("t2", "bpmnTask", "Fulfill Order"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "t2", "approve"),
            makeEdge("t1", "e1", "reject"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        const approvalStep = wf.steps.find(s => s.type === "approval");
        expect(approvalStep).toBeDefined();
        expect(approvalStep!.id).toBe("review_purchase");
        expect(approvalStep!.assignee).toEqual({ type: "role", role: "finance_manager" });
        expect(approvalStep!.timeout).toBe("72h");
        expect(approvalStep!.on_approve).toEqual({ goto: "fulfill_order" });
        expect(approvalStep!.on_reject).toBe("end");
    });

    it("should build a condition step from an exclusive gateway", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("g1", "bpmnExclusiveGateway", "Check Amount\namount > 1000"),
            makeNode("t1", "bpmnTask", "High Value"),
            makeNode("t2", "bpmnTask", "Low Value"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "g1"),
            makeEdge("g1", "t1", "yes"),
            makeEdge("g1", "t2", "no"),
            makeEdge("t1", "e1"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        const condStep = wf.steps.find(s => s.type === "condition");
        expect(condStep).toBeDefined();
        expect(condStep!.expression).toBe("amount > 1000");
        expect(condStep!.on_true).toEqual({ goto: "high_value" });
        expect(condStep!.on_false).toEqual({ goto: "low_value" });
    });

    it("should build a condition step from a businessRule task", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("t1", "bpmnTask", "Validate Order\norder.total > 0", { bpmnTaskType: "businessRule" }),
            makeNode("t2", "bpmnTask", "Process"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "t2", "yes"),
            makeEdge("t1", "e1", "no"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        const condStep = wf.steps.find(s => s.type === "condition");
        expect(condStep).toBeDefined();
        expect(condStep!.expression).toBe("order.total > 0");
        expect(condStep!.on_true).toEqual({ goto: "process" });
        expect(condStep!.on_false).toBe("end");
    });

    it("should handle parallel gateway with warning", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("g1", "bpmnParallelGateway", "Fork"),
            makeNode("t1", "bpmnTask", "Branch A"),
            makeNode("t2", "bpmnTask", "Branch B"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "g1"),
            makeEdge("g1", "t1"),
            makeEdge("g1", "t2"),
            makeEdge("t1", "e1"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        // Parallel gateway emitted as action step
        const forkStep = wf.steps.find(s => s.id === "fork");
        expect(forkStep).toBeDefined();
        expect(forkStep!.type).toBe("action");
        // Should warn about parallel not being natively supported
        expect(warnings.some(w => w.message.includes("Parallel gateway"))).toBe(true);
    });

    it("should produce unique step IDs for duplicate names", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("t1", "bpmnTask", "Process"),
            makeNode("t2", "bpmnTask", "Process"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "t2"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        const stepIds = wf.steps.map(s => s.id);
        expect(stepIds).toContain("process");
        expect(stepIds).toContain("process_2");
    });

    it("should handle a gateway with unlabeled edges (fallback to order)", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("g1", "bpmnExclusiveGateway", "Check"),
            makeNode("t1", "bpmnTask", "Path A"),
            makeNode("t2", "bpmnTask", "Path B"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "g1"),
            makeEdge("g1", "t1"),  // no label
            makeEdge("g1", "t2"),  // no label
            makeEdge("t1", "e1"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        const condStep = wf.steps.find(s => s.type === "condition");
        expect(condStep).toBeDefined();
        // First edge = on_true, second = on_false
        expect(condStep!.on_true).toEqual({ goto: "path_a" });
        expect(condStep!.on_false).toEqual({ goto: "path_b" });
    });

    it("should chain steps correctly: task → task → end", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Start"),
            makeNode("t1", "bpmnTask", "Step One\nset_field: order.status = processing"),
            makeNode("t2", "bpmnTask", "Step Two\nwebhook: https://api.example.com"),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "t2"),
            makeEdge("t2", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        const wf = convertToRocketWorkflow(parsed[0], warnings);

        expect(wf.steps).toHaveLength(2);
        expect(wf.steps[0].id).toBe("step_one");
        expect(wf.steps[0].then).toEqual({ goto: "step_two" });
        expect(wf.steps[1].id).toBe("step_two");
        expect(wf.steps[1].then).toBe("end");
    });
});

// ─── Full integration: parseWorkflowDiagram → convertToRocketWorkflow ──

describe("Full BPMN → RocketWorkflow pipeline", () => {
    it("should export a complete order approval workflow", () => {
        const warnings: RocketExportMessage[] = [];
        const nodes: DSLNode[] = [
            makeNode("s1", "bpmnStartEvent", "Order Created\nentity: order\nfield: status\nto: pending\ncontext.order_id: record.id", { bpmnEventType: "none" }),
            makeNode("t1", "bpmnTask", "Validate Order\nset_field: order.status = validating", { bpmnTaskType: "service" }),
            makeNode("g1", "bpmnExclusiveGateway", "Amount Check\norder.total > 5000"),
            makeNode("t2", "bpmnTask", "Manager Review\nrole: sales_manager\ntimeout: 48h", { bpmnTaskType: "user" }),
            makeNode("t3", "bpmnTask", "Auto Approve\nset_field: order.status = approved", { bpmnTaskType: "service" }),
            makeNode("t4", "bpmnTask", "Send Confirmation\nwebhook: https://notify.example.com/confirm\nmethod: POST", { bpmnTaskType: "send" }),
            makeNode("e1", "bpmnEndEvent"),
        ];
        const edges: DSLEdge[] = [
            makeEdge("s1", "t1"),
            makeEdge("t1", "g1"),
            makeEdge("g1", "t2", "yes"),       // high value → manager review
            makeEdge("g1", "t3", "no"),         // low value → auto approve
            makeEdge("t2", "t4", "approve"),
            makeEdge("t2", "e1", "reject"),
            makeEdge("t3", "t4"),
            makeEdge("t4", "e1"),
        ];

        const parsed = parseWorkflowDiagram(nodes, edges, warnings);
        expect(parsed).toHaveLength(1);

        const wf = convertToRocketWorkflow(parsed[0], warnings);

        // Trigger
        expect(wf.trigger).toEqual({
            type: "state_change",
            entity: "order",
            field: "status",
            to: "pending",
        });

        // Context
        expect(wf.context).toEqual({ order_id: "record.id" });

        // Steps: validate → amount_check(condition) → manager_review(approval) + auto_approve(action) → send_confirmation(action)
        expect(wf.steps.length).toBeGreaterThanOrEqual(4);

        const validate = wf.steps.find(s => s.id === "validate_order");
        expect(validate?.type).toBe("action");
        expect(validate?.actions?.[0]).toEqual({
            type: "set_field",
            entity: "order",
            field: "status",
            value: "validating",
        });

        const amountCheck = wf.steps.find(s => s.id === "amount_check");
        expect(amountCheck?.type).toBe("condition");
        expect(amountCheck?.expression).toBe("order.total > 5000");
        expect(amountCheck?.on_true).toEqual({ goto: "manager_review" });
        expect(amountCheck?.on_false).toEqual({ goto: "auto_approve" });

        const managerReview = wf.steps.find(s => s.id === "manager_review");
        expect(managerReview?.type).toBe("approval");
        expect(managerReview?.assignee).toEqual({ type: "role", role: "sales_manager" });
        expect(managerReview?.timeout).toBe("48h");
        expect(managerReview?.on_approve).toEqual({ goto: "send_confirmation" });
        expect(managerReview?.on_reject).toBe("end");

        const sendConfirmation = wf.steps.find(s => s.id === "send_confirmation");
        expect(sendConfirmation?.type).toBe("action");
        expect(sendConfirmation?.actions?.[0]).toEqual({
            type: "webhook",
            url: "https://notify.example.com/confirm",
            method: "POST",
        });
        expect(sendConfirmation?.then).toBe("end");

        expect(wf.active).toBe(true);
    });
});
