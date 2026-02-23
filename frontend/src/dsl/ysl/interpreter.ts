/**
 * YSL Interpreter — Tree-walking interpreter that evaluates an AST and produces a DSLDiagram IR.
 *
 * The interpreter's primary job is to evaluate scripting constructs (variables, loops,
 * conditionals, functions) and collect node/edge/pool declarations into a DSLDiagram.
 * The existing DSL engine (dsl-engine.ts) then handles layout and canvas rendering.
 *
 * Phase 1: Variables, string interpolation, nodes, edges, pools/lanes, frontmatter.
 * Phase 2: for, if/else, fn.
 * Phase 3+: template, group, animate, events, API bridge.
 */

import type {
    Program, Statement, Expression, FrontmatterDecl,
    LetDecl, ConstDecl, NodeDecl, EdgeDecl, PoolDecl, LaneDecl,
    ForLoop, IfStatement, FnDecl, FnCall, GroupBlock,
    InterpolatedString, ApiCall,
} from './ast';
import type {
    DSLDiagram, DSLNode, DSLEdge, DSLPool, DSLLane, DSLGroup,
    DSLLayoutConfig, DSLNodeStyle, DSLEdgeStyle,
} from '../types';
import { Environment, type YSLValue } from './environment';
import { RuntimeError, type SourceLocation } from './errors';

// Edge operator → DSL edge type/curveType mapping
const EDGE_OPERATORS: Record<string, { type: 'arrow' | 'line'; curveType?: 'straight' | 'bezier' | 'elbow' }> = {
    '->': { type: 'arrow' },
    '--': { type: 'line' },
    '~>': { type: 'arrow', curveType: 'bezier' },
    '=>': { type: 'arrow', curveType: 'elbow' },
};

/** Properties routed to node.properties instead of node.style. */
const PROPERTY_PREFIXES = ['ds', 'bpmn', 'code', 'starPoints', 'polygonSides', 'shapeRatio', 'sideRatio', 'depth', 'viewAngle'];

export interface InterpretResult {
    diagram: DSLDiagram;
    errors: { line: number; column?: number; message: string }[];
    warnings: { line: number; column?: number; message: string }[];
}

export class Interpreter {
    private env: Environment;
    private nodes: DSLNode[] = [];
    private edges: DSLEdge[] = [];
    private pools: DSLPool[] = [];
    private groups: DSLGroup[] = [];
    private meta: { title?: string; description?: string } = {};
    private layoutConfig: Partial<DSLLayoutConfig> = {};
    private functions = new Map<string, FnDecl>();
    // templateCounter reserved for Phase 3: template auto-namespacing
    private currentPool: DSLPool | null = null;
    private errors: { line: number; column?: number; message: string }[] = [];
    private warnings: { line: number; column?: number; message: string }[] = [];

    // Track node declarations by indent for hierarchy
    private indentStack: { indent: number; node: DSLNode }[] = [];

    constructor(env?: Environment) {
        this.env = env || new Environment();
    }

    interpret(program: Program): InterpretResult {
        // Process frontmatter
        if (program.frontmatter) {
            this.evalFrontmatter(program.frontmatter);
        }

        // Execute body
        this.execStatements(program.body);

        // Auto-generate edges from children hierarchy
        this.generateEdgesFromChildren(this.nodes);

        // Build diagram
        const layout: DSLLayoutConfig = {
            strategy: (this.layoutConfig as any).strategy || 'tree-down',
            ...this.layoutConfig,
        };

        const diagram: DSLDiagram = {
            version: 1,
            meta: Object.keys(this.meta).length > 0
                ? { ...this.meta, sourceFormat: 'yappy-dsl' }
                : undefined,
            layout,
            nodes: this.nodes,
            edges: this.edges,
            pools: this.pools.length > 0 ? this.pools : undefined,
            groups: this.groups.length > 0 ? this.groups : undefined,
        };

        return { diagram, errors: this.errors, warnings: this.warnings };
    }

    // ─── Frontmatter ─────────────────────────────────────────────

    private evalFrontmatter(fm: FrontmatterDecl): void {
        for (const entry of fm.entries) {
            const key = entry.key.toLowerCase();
            const value = entry.value;
            switch (key) {
                case 'title': this.meta.title = value; break;
                case 'description': this.meta.description = value; break;
                case 'layout': (this.layoutConfig as any).strategy = value; break;
                case 'hspacing': this.layoutConfig.hSpacing = parseInt(value, 10); break;
                case 'vspacing': this.layoutConfig.vSpacing = parseInt(value, 10); break;
                case 'columns': this.layoutConfig.columns = parseInt(value, 10); break;
                default:
                    this.warnings.push({ line: fm.loc.line, message: `Unknown frontmatter key: "${entry.key}"` });
            }
        }
    }

    // ─── Statement Execution ─────────────────────────────────────

    private execStatements(stmts: Statement[]): void {
        for (const stmt of stmts) {
            this.execStatement(stmt);
        }
    }

    private execStatement(stmt: Statement): void {
        try {
            switch (stmt.type) {
                case 'LetDecl': this.execLet(stmt); break;
                case 'ConstDecl': this.execConst(stmt); break;
                case 'NodeDecl': this.execNode(stmt); break;
                case 'EdgeDecl': this.execEdge(stmt); break;
                case 'PoolDecl': this.execPool(stmt); break;
                case 'LaneDecl': this.execLane(stmt); break;
                case 'ForLoop': this.execFor(stmt); break;
                case 'IfStatement': this.execIf(stmt); break;
                case 'FnDecl': this.execFnDecl(stmt); break;
                case 'FnCall': this.execFnCall(stmt); break;
                case 'GroupBlock': this.execGroup(stmt); break;
                case 'ApiCall': this.execApiCall(stmt); break;
                // Phase 3+: TemplateDecl, UseTemplate, AnimateBlock, EventHandler
                default:
                    this.warnings.push({
                        line: stmt.loc.line,
                        message: `Unsupported statement type: ${stmt.type} (coming in a future phase).`
                    });
            }
        } catch (e) {
            if (e instanceof RuntimeError) {
                this.errors.push({ line: e.loc.line, column: e.loc.column, message: e.message });
            } else {
                throw e;
            }
        }
    }

    // ─── Variables ───────────────────────────────────────────────

    private execLet(stmt: LetDecl): void {
        const value = this.evalExpr(stmt.value);
        this.env.define(stmt.name, value, false, stmt.loc);
    }

    private execConst(stmt: ConstDecl): void {
        const value = this.evalExpr(stmt.value);
        this.env.define(stmt.name, value, true, stmt.loc);
    }

    // ─── Node Declaration ────────────────────────────────────────

    private execNode(stmt: NodeDecl): void {
        const id = this.evalExprToString(stmt.id, stmt.loc);
        const label = stmt.label ? this.evalExprToString(stmt.label, stmt.loc) : undefined;

        const node: DSLNode = {
            id,
            shape: stmt.shape || 'rect',
        };
        if (label) node.label = label;

        // Process inline style
        if (stmt.style) {
            const { style, dimensions, properties } = this.evalInlineStyle(stmt.style, stmt.loc);
            if (Object.keys(style).length > 0) node.style = style as DSLNodeStyle;
            if (dimensions.width !== undefined) node.width = dimensions.width;
            if (dimensions.height !== undefined) node.height = dimensions.height;
            if (Object.keys(properties).length > 0) node.properties = properties;
        }

        // Pool reference
        if (stmt.poolRef) {
            const parts = stmt.poolRef.split('/');
            if (parts.length === 2) {
                node.pool = { poolId: parts[0], lane: parts[1] };
            }
        }

        // Handle indentation hierarchy
        const indent = stmt.indent;
        if (indent === 0) {
            this.nodes.push(node);
            this.indentStack.length = 0;
            this.indentStack.push({ indent: 0, node });
        } else {
            while (this.indentStack.length > 0 && this.indentStack[this.indentStack.length - 1].indent >= indent) {
                this.indentStack.pop();
            }
            if (this.indentStack.length > 0) {
                const parent = this.indentStack[this.indentStack.length - 1].node;
                if (!parent.children) parent.children = [];
                parent.children.push(node);
            } else {
                this.nodes.push(node);
            }
            this.indentStack.push({ indent, node });
        }
    }

    // ─── Edge Declaration ────────────────────────────────────────

    private execEdge(stmt: EdgeDecl): void {
        const from = this.evalExprToString(stmt.from, stmt.loc);
        const to = this.evalExprToString(stmt.to, stmt.loc);
        const edgeDef = EDGE_OPERATORS[stmt.operator];

        const edge: DSLEdge = {
            from,
            to,
            type: edgeDef.type,
        };
        if (edgeDef.curveType) edge.curveType = edgeDef.curveType;
        if (stmt.label) edge.label = this.evalExprToString(stmt.label, stmt.loc);

        if (stmt.style) {
            const { style } = this.evalInlineStyle(stmt.style, stmt.loc);
            if (Object.keys(style).length > 0) edge.style = style as DSLEdgeStyle;
        }

        this.edges.push(edge);
    }

    // ─── Pool / Lane ─────────────────────────────────────────────

    private execPool(stmt: PoolDecl): void {
        const pool: DSLPool = {
            id: stmt.id,
            label: stmt.label ? this.evalExprToString(stmt.label, stmt.loc) : stmt.id,
            lanes: [],
        };
        this.pools.push(pool);
        this.currentPool = pool;
    }

    private execLane(stmt: LaneDecl): void {
        if (!this.currentPool) {
            this.errors.push({ line: stmt.loc.line, message: 'Lane declaration outside of a pool.' });
            return;
        }
        const lane: DSLLane = {
            id: stmt.id,
            label: stmt.label ? this.evalExprToString(stmt.label, stmt.loc) : stmt.id,
        };
        if (stmt.style) {
            const { style } = this.evalInlineStyle(stmt.style, stmt.loc);
            if (style.color) lane.color = style.color as string;
            if (style.textColor) lane.textColor = style.textColor as string;
        }
        this.currentPool.lanes.push(lane);
    }

    // ─── Control Flow (Phase 2) ──────────────────────────────────

    private execFor(stmt: ForLoop): void {
        const iterable = this.evalExpr(stmt.iterable);

        let items: YSLValue[];
        if (Array.isArray(iterable)) {
            items = iterable;
        } else {
            throw new RuntimeError(
                `"for" requires an array or range, got ${typeof iterable}.`,
                stmt.loc
            );
        }

        for (const item of items) {
            const loopEnv = this.env.child();
            loopEnv.define(stmt.variable, item, false, stmt.loc);
            const prevEnv = this.env;
            this.env = loopEnv;
            this.execStatements(stmt.body);
            this.env = prevEnv;
        }
    }

    private execIf(stmt: IfStatement): void {
        const condition = this.evalExpr(stmt.condition);
        if (this.isTruthy(condition)) {
            this.execStatements(stmt.body);
            return;
        }

        for (const elif of stmt.elseIfs) {
            if (this.isTruthy(this.evalExpr(elif.condition))) {
                this.execStatements(elif.body);
                return;
            }
        }

        if (stmt.elseBody) {
            this.execStatements(stmt.elseBody);
        }
    }

    // ─── Functions (Phase 2) ─────────────────────────────────────

    private execFnDecl(stmt: FnDecl): void {
        this.functions.set(stmt.name, stmt);
    }

    private execFnCall(stmt: FnCall): void {
        const fn = this.functions.get(stmt.name);
        if (!fn) {
            throw new RuntimeError(`Undefined function "${stmt.name}".`, stmt.loc);
        }

        const args = stmt.args.map(a => this.evalExpr(a));
        const fnEnv = this.env.child();
        for (let i = 0; i < fn.params.length; i++) {
            fnEnv.define(fn.params[i], args[i] ?? null, false, stmt.loc);
        }

        const prevEnv = this.env;
        this.env = fnEnv;
        this.execStatements(fn.body);
        this.env = prevEnv;
    }

    // ─── Groups (Phase 3) ────────────────────────────────────────

    private execGroup(stmt: GroupBlock): void {
        const nodesBefore = this.nodes.length;
        this.execStatements(stmt.body);

        // Collect IDs of nodes added inside the group
        const nodeIds: string[] = [];
        const collectIds = (nodes: DSLNode[], startIdx: number) => {
            for (let i = startIdx; i < nodes.length; i++) {
                nodeIds.push(nodes[i].id);
            }
        };
        collectIds(this.nodes, nodesBefore);

        this.groups.push({
            id: stmt.id,
            label: stmt.label ? this.evalExprToString(stmt.label, stmt.loc) : undefined,
            nodeIds,
        });
    }

    // ─── API Call (Phase 3) ──────────────────────────────────────

    private execApiCall(stmt: ApiCall): void {
        // Stub for Phase 3 — will bridge to YappyAPI
        this.warnings.push({
            line: stmt.loc.line,
            message: `API calls (Yappy.${stmt.method}) will be available in Phase 3.`
        });
    }

    // ─── Expression Evaluation ───────────────────────────────────

    private evalExpr(expr: Expression): YSLValue {
        switch (expr.type) {
            case 'StringLiteral': return expr.value;
            case 'NumberLiteral': return expr.value;
            case 'BoolLiteral': return expr.value;
            case 'Identifier': return this.env.get(expr.name, expr.loc);
            case 'InterpolatedString': return this.evalInterpolated(expr);

            case 'BinaryExpr': {
                const left = this.evalExpr(expr.left);
                const right = this.evalExpr(expr.right);
                return this.evalBinary(expr.op, left, right, expr.loc);
            }

            case 'UnaryExpr': {
                const operand = this.evalExpr(expr.operand);
                if (expr.op === '-') return -(operand as number);
                if (expr.op === '!') return !this.isTruthy(operand);
                return null;
            }

            case 'ArrayLiteral':
                return expr.elements.map(e => this.evalExpr(e));

            case 'RangeExpr': {
                const start = this.evalExpr(expr.start) as number;
                const end = this.evalExpr(expr.end) as number;
                const arr: number[] = [];
                for (let i = start; i <= end; i++) arr.push(i);
                return arr;
            }

            case 'CallExpr': {
                // Built-in functions
                if (expr.callee === 'range') {
                    const args = expr.args.map(a => this.evalExpr(a) as number);
                    const start = args.length > 1 ? args[0] : 1;
                    const end = args.length > 1 ? args[1] : args[0];
                    const arr: number[] = [];
                    for (let i = start; i <= end; i++) arr.push(i);
                    return arr;
                }
                if (expr.callee === 'len') {
                    const arg = this.evalExpr(expr.args[0]);
                    if (typeof arg === 'string') return arg.length;
                    if (Array.isArray(arg)) return arg.length;
                    return 0;
                }
                if (expr.callee === 'str') {
                    return String(this.evalExpr(expr.args[0]));
                }
                // User-defined function
                const fn = this.functions.get(expr.callee);
                if (fn) {
                    const args = expr.args.map(a => this.evalExpr(a));
                    const fnEnv = this.env.child();
                    for (let i = 0; i < fn.params.length; i++) {
                        fnEnv.define(fn.params[i], args[i] ?? null, false, expr.loc);
                    }
                    const prevEnv = this.env;
                    this.env = fnEnv;
                    this.execStatements(fn.body);
                    this.env = prevEnv;
                    return null; // functions don't return values yet
                }
                throw new RuntimeError(`Undefined function "${expr.callee}".`, expr.loc);
            }

            case 'MemberExpr': {
                const obj = this.evalExpr(expr.object);
                if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                    return (obj as Record<string, YSLValue>)[expr.property];
                }
                return null;
            }

            default:
                throw new RuntimeError(`Unknown expression type: ${(expr as any).type}.`, (expr as any).loc);
        }
    }

    private evalInterpolated(expr: InterpolatedString): string {
        return expr.parts.map(part => {
            if (typeof part === 'string') return part;
            const val = this.evalExpr(part);
            return val == null ? '' : String(val);
        }).join('');
    }

    private evalBinary(op: string, left: YSLValue, right: YSLValue, loc: SourceLocation): YSLValue {
        switch (op) {
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left ?? '') + String(right ?? '');
                }
                return (left as number) + (right as number);
            case '-': return (left as number) - (right as number);
            case '*': return (left as number) * (right as number);
            case '/':
                if ((right as number) === 0) throw new RuntimeError('Division by zero.', loc);
                return (left as number) / (right as number);
            case '%': return (left as number) % (right as number);
            case '==': return left === right;
            case '!=': return left !== right;
            case '<': return (left as number) < (right as number);
            case '>': return (left as number) > (right as number);
            case '<=': return (left as number) <= (right as number);
            case '>=': return (left as number) >= (right as number);
            case '&&': return this.isTruthy(left) && this.isTruthy(right);
            case '||': return this.isTruthy(left) || this.isTruthy(right);
            default: throw new RuntimeError(`Unknown operator "${op}".`, loc);
        }
    }

    private isTruthy(val: YSLValue): boolean {
        if (val === null || val === undefined || val === false || val === 0 || val === '') return false;
        return true;
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private evalExprToString(expr: Expression, _loc: SourceLocation): string {
        const val = this.evalExpr(expr);
        return val == null ? '' : String(val);
    }

    private evalInlineStyle(
        styleExprs: Record<string, Expression>,
        _loc: SourceLocation
    ): { style: Record<string, any>; dimensions: { width?: number; height?: number }; properties: Record<string, any> } {
        const style: Record<string, any> = {};
        const dimensions: { width?: number; height?: number } = {};
        const properties: Record<string, any> = {};

        for (const [key, expr] of Object.entries(styleExprs)) {
            const value = this.evalExpr(expr);
            if (key === 'width') {
                dimensions.width = typeof value === 'number' ? value : parseInt(String(value), 10);
            } else if (key === 'height') {
                dimensions.height = typeof value === 'number' ? value : parseInt(String(value), 10);
            } else if (PROPERTY_PREFIXES.some(p => key.startsWith(p))) {
                properties[key] = value;
            } else {
                style[key] = value;
            }
        }

        return { style, dimensions, properties };
    }

    /** Walk children hierarchy and generate edges for parent→child relationships. */
    private generateEdgesFromChildren(nodes: DSLNode[]): void {
        const existingEdges = new Set(this.edges.map(e => `${e.from}->${e.to}`));

        const walk = (parentNodes: DSLNode[]) => {
            for (const node of parentNodes) {
                if (node.children && node.children.length > 0) {
                    for (const child of node.children) {
                        const key = `${node.id}->${child.id}`;
                        if (!existingEdges.has(key)) {
                            this.edges.push({ from: node.id, to: child.id, type: 'arrow' });
                            existingEdges.add(key);
                        }
                    }
                    walk(node.children);
                }
            }
        };

        walk(nodes);
    }
}
