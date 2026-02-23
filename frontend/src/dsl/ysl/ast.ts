/**
 * YSL Abstract Syntax Tree Node Types
 *
 * Every AST node carries a `loc` for error reporting.
 * Phase 1: Frontmatter, Let/Const, Node, Edge, Pool/Lane, expressions.
 * Phase 2+: For, If, Fn, Template, Group, Animate, Event (stubs here for token reservation).
 */

import type { SourceLocation } from './errors';

// ─── Base ────────────────────────────────────────────────────────────

export interface BaseNode {
    type: string;
    loc: SourceLocation;
}

// ─── Program (root) ──────────────────────────────────────────────────

export interface Program extends BaseNode {
    type: 'Program';
    frontmatter: FrontmatterDecl | null;
    body: Statement[];
}

// ─── Frontmatter ─────────────────────────────────────────────────────

export interface FrontmatterDecl extends BaseNode {
    type: 'FrontmatterDecl';
    entries: { key: string; value: string }[];
}

// ─── Statements ──────────────────────────────────────────────────────

export type Statement =
    | LetDecl
    | ConstDecl
    | NodeDecl
    | EdgeDecl
    | PoolDecl
    | LaneDecl
    | PoolAssign
    | FnDecl
    | FnCall
    | ForLoop
    | IfStatement
    | GroupBlock
    | TemplateDecl
    | UseTemplate
    | AnimateBlock
    | EventHandler
    | ApiCall;

// ─── Variables ───────────────────────────────────────────────────────

export interface LetDecl extends BaseNode {
    type: 'LetDecl';
    name: string;
    value: Expression;
}

export interface ConstDecl extends BaseNode {
    type: 'ConstDecl';
    name: string;
    value: Expression;
}

// ─── Diagram Primitives ──────────────────────────────────────────────

export interface NodeDecl extends BaseNode {
    type: 'NodeDecl';
    id: Expression;          // string or interpolated
    shape: string | null;
    label: Expression | null; // string literal or interpolated
    style: Record<string, Expression> | null;
    poolRef: string | null;  // @poolId/laneId
    indent: number;          // for hierarchy
}

export interface EdgeDecl extends BaseNode {
    type: 'EdgeDecl';
    from: Expression;
    operator: '->' | '--' | '~>' | '=>';
    to: Expression;
    label: Expression | null;
    style: Record<string, Expression> | null;
}

export interface PoolDecl extends BaseNode {
    type: 'PoolDecl';
    id: string;
    label: Expression | null;
}

export interface LaneDecl extends BaseNode {
    type: 'LaneDecl';
    id: string;
    label: Expression | null;
    style: Record<string, Expression> | null;
}

export interface PoolAssign extends BaseNode {
    type: 'PoolAssign';
    nodeId: string;
    poolId: string;
    laneId: string;
}

// ─── Control Flow (Phase 2) ─────────────────────────────────────────

export interface ForLoop extends BaseNode {
    type: 'ForLoop';
    variable: string;
    iterable: Expression;    // range or array
    body: Statement[];
}

export interface IfStatement extends BaseNode {
    type: 'IfStatement';
    condition: Expression;
    body: Statement[];
    elseIfs: { condition: Expression; body: Statement[] }[];
    elseBody: Statement[] | null;
}

// ─── Functions (Phase 2) ────────────────────────────────────────────

export interface FnDecl extends BaseNode {
    type: 'FnDecl';
    name: string;
    params: string[];
    body: Statement[];
}

export interface FnCall extends BaseNode {
    type: 'FnCall';
    name: string;
    args: Expression[];
}

// ─── Templates & Groups (Phase 3) ───────────────────────────────────

export interface TemplateDecl extends BaseNode {
    type: 'TemplateDecl';
    name: string;
    params: string[];
    body: Statement[];
}

export interface UseTemplate extends BaseNode {
    type: 'UseTemplate';
    name: string;
    args: Expression[];
}

export interface GroupBlock extends BaseNode {
    type: 'GroupBlock';
    id: string;
    label: Expression | null;
    body: Statement[];
}

// ─── Animations (Phase 4) ───────────────────────────────────────────

export interface AnimateBlock extends BaseNode {
    type: 'AnimateBlock';
    body: AnimateStatement[];
}

export type AnimateStatement = {
    type: 'AnimateCall';
    preset: string;
    target: Expression;
    options: Record<string, Expression> | null;
    loc: SourceLocation;
} | {
    type: 'AwaitDelay';
    duration: Expression;
    loc: SourceLocation;
} | {
    type: 'ParallelBlock';
    body: AnimateStatement[];
    loc: SourceLocation;
} | {
    type: 'StaggerExpr';
    targets: Expression[];
    options: Record<string, Expression>;
    loc: SourceLocation;
};

// ─── Events (Phase 5) ──────────────────────────────────────────────

export interface EventHandler extends BaseNode {
    type: 'EventHandler';
    event: 'click' | 'dblclick' | 'hover' | 'leave';
    target: Expression;
    body: Statement[];
}

// ─── API Bridge (Phase 3) ──────────────────────────────────────────

export interface ApiCall extends BaseNode {
    type: 'ApiCall';
    method: string;
    args: Expression[];
}

// ─── Expressions ─────────────────────────────────────────────────────

export type Expression =
    | StringLiteral
    | NumberLiteral
    | BoolLiteral
    | Identifier
    | InterpolatedString
    | BinaryExpr
    | UnaryExpr
    | ArrayLiteral
    | MemberExpr
    | RangeExpr
    | CallExpr;

export interface StringLiteral extends BaseNode {
    type: 'StringLiteral';
    value: string;
}

export interface NumberLiteral extends BaseNode {
    type: 'NumberLiteral';
    value: number;
}

export interface BoolLiteral extends BaseNode {
    type: 'BoolLiteral';
    value: boolean;
}

export interface Identifier extends BaseNode {
    type: 'Identifier';
    name: string;
}

export interface InterpolatedString extends BaseNode {
    type: 'InterpolatedString';
    parts: (string | Expression)[];
}

export interface BinaryExpr extends BaseNode {
    type: 'BinaryExpr';
    op: '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '&&' | '||';
    left: Expression;
    right: Expression;
}

export interface UnaryExpr extends BaseNode {
    type: 'UnaryExpr';
    op: '-' | '!';
    operand: Expression;
}

export interface ArrayLiteral extends BaseNode {
    type: 'ArrayLiteral';
    elements: Expression[];
}

export interface MemberExpr extends BaseNode {
    type: 'MemberExpr';
    object: Expression;
    property: string;
}

export interface RangeExpr extends BaseNode {
    type: 'RangeExpr';
    start: Expression;
    end: Expression;
}

export interface CallExpr extends BaseNode {
    type: 'CallExpr';
    callee: string;
    args: Expression[];
}
