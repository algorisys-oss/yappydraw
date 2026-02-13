/**
 * YSL Parser — Recursive descent parser producing an AST from a token stream.
 *
 * Phase 1: Frontmatter, let/const, node declarations, edge declarations, pool/lane, expressions.
 * Phase 2: for, if/else, fn declarations and calls.
 * Phase 3+: template, use, group, animate, on (event handlers), API calls.
 */

import { TokenType, type Token } from './lexer';
import { ParseError, type SourceLocation } from './errors';
import type {
    Program, Statement, Expression, FrontmatterDecl,
    LetDecl, ConstDecl, NodeDecl, EdgeDecl, PoolDecl, LaneDecl,
    ForLoop, IfStatement, FnDecl, FnCall, GroupBlock,
    TemplateDecl, UseTemplate, AnimateBlock, EventHandler, ApiCall,
    Identifier,
} from './ast';

// Edge operators that the parser recognizes
const EDGE_OPS = new Set<TokenType>([TokenType.ARROW, TokenType.LINE_OP, TokenType.BEZIER, TokenType.ELBOW]);

// ─── Parser Class ────────────────────────────────────────────────────

export class Parser {
    private tokens: Token[];
    private pos = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Program {
        const loc = this.loc();
        const frontmatter = this.parseFrontmatter();
        const body = this.parseBody();
        return { type: 'Program', loc, frontmatter, body };
    }

    // ─── Token Navigation ────────────────────────────────────────

    private peek(): Token {
        return this.tokens[this.pos] || { type: TokenType.EOF, value: '', loc: { line: 0, column: 0 } };
    }

    private peekType(): TokenType {
        return this.peek().type;
    }

    private advance(): Token {
        const token = this.tokens[this.pos];
        this.pos++;
        return token;
    }

    private expect(type: TokenType, message?: string): Token {
        const token = this.peek();
        if (token.type !== type) {
            throw new ParseError(
                message || `Expected ${type} but got ${token.type} ("${token.value}").`,
                token.loc
            );
        }
        return this.advance();
    }

    private match(type: TokenType): boolean {
        if (this.peekType() === type) {
            this.advance();
            return true;
        }
        return false;
    }

    private loc(): SourceLocation {
        return this.peek().loc;
    }

    private isAtEnd(): boolean {
        return this.peekType() === TokenType.EOF;
    }

    private skipNewlines(): void {
        while (this.peekType() === TokenType.NEWLINE) {
            this.advance();
        }
    }

    private expectNewline(): void {
        if (this.peekType() !== TokenType.NEWLINE && this.peekType() !== TokenType.EOF) {
            throw new ParseError(
                `Expected end of line but got ${this.peek().type} ("${this.peek().value}").`,
                this.peek().loc
            );
        }
        if (this.peekType() === TokenType.NEWLINE) this.advance();
    }

    // ─── Frontmatter ─────────────────────────────────────────────

    private parseFrontmatter(): FrontmatterDecl | null {
        if (this.peekType() !== TokenType.FRONTMATTER) return null;

        const loc = this.loc();
        this.advance(); // opening ---
        this.skipNewlines();

        const entries: { key: string; value: string }[] = [];

        while (this.peekType() !== TokenType.FRONTMATTER && !this.isAtEnd()) {
            if (this.peekType() === TokenType.NEWLINE) {
                this.advance();
                continue;
            }
            // Frontmatter lines are emitted as STRING tokens
            if (this.peekType() === TokenType.STRING) {
                const line = this.advance().value;
                const colonIdx = line.indexOf(':');
                if (colonIdx !== -1) {
                    entries.push({
                        key: line.substring(0, colonIdx).trim(),
                        value: line.substring(colonIdx + 1).trim(),
                    });
                }
            } else {
                this.advance(); // skip unexpected tokens in frontmatter
            }
        }

        if (this.peekType() === TokenType.FRONTMATTER) {
            this.advance(); // closing ---
            this.skipNewlines();
        }

        return { type: 'FrontmatterDecl', loc, entries };
    }

    // ─── Body (list of statements) ───────────────────────────────

    private parseBody(terminators?: Set<TokenType>): Statement[] {
        const stmts: Statement[] = [];

        while (!this.isAtEnd()) {
            this.skipNewlines();
            if (this.isAtEnd()) break;

            // Check for block terminators (end, else, etc.)
            if (terminators && terminators.has(this.peekType())) break;

            const stmt = this.parseStatement();
            if (stmt) stmts.push(stmt);
        }

        return stmts;
    }

    // ─── Statement Dispatch ──────────────────────────────────────

    private parseStatement(): Statement | null {
        // Skip indent tokens — just consume them but note their value for node hierarchy
        let indent = 0;
        if (this.peekType() === TokenType.INDENT) {
            indent = parseInt(this.advance().value, 10);
        }

        this.skipNewlines();
        if (this.isAtEnd()) return null;

        const tt = this.peekType();

        switch (tt) {
            case TokenType.LET: return this.parseLetDecl();
            case TokenType.CONST: return this.parseConstDecl();
            case TokenType.POOL: return this.parsePoolDecl();
            case TokenType.LANE: return this.parseLaneDecl();
            case TokenType.FOR: return this.parseForLoop();
            case TokenType.IF: return this.parseIfStatement();
            case TokenType.FN: return this.parseFnDecl();
            case TokenType.TEMPLATE: return this.parseTemplateDecl();
            case TokenType.USE: return this.parseUseTemplate();
            case TokenType.GROUP: return this.parseGroupBlock();
            case TokenType.ANIMATE: return this.parseAnimateBlock();
            case TokenType.ON: return this.parseEventHandler();
            case TokenType.NEWLINE: this.advance(); return null;
            default:
                // Could be: node declaration, edge declaration, function call, or API call
                return this.parseNodeOrEdgeOrCall(indent);
        }
    }

    // ─── Variable Declarations ───────────────────────────────────

    private parseLetDecl(): LetDecl {
        const loc = this.loc();
        this.expect(TokenType.LET);
        const name = this.expect(TokenType.IDENT, 'Expected variable name after "let".').value;
        this.expect(TokenType.ASSIGN, 'Expected "=" after variable name.');
        const value = this.parseExpression();
        this.expectNewline();
        return { type: 'LetDecl', loc, name, value };
    }

    private parseConstDecl(): ConstDecl {
        const loc = this.loc();
        this.expect(TokenType.CONST);
        const name = this.expect(TokenType.IDENT, 'Expected variable name after "const".').value;
        this.expect(TokenType.ASSIGN, 'Expected "=" after variable name.');
        const value = this.parseExpression();
        this.expectNewline();
        return { type: 'ConstDecl', loc, name, value };
    }

    // ─── Pool / Lane Declarations ────────────────────────────────

    private parsePoolDecl(): PoolDecl {
        const loc = this.loc();
        this.expect(TokenType.POOL);
        const id = this.expect(TokenType.IDENT, 'Expected pool ID.').value;
        const label = this.peekType() === TokenType.STRING
            ? this.parseStringExpr()
            : null;
        this.expectNewline();
        return { type: 'PoolDecl', loc, id, label };
    }

    private parseLaneDecl(): LaneDecl {
        const loc = this.loc();
        this.expect(TokenType.LANE);
        const id = this.expect(TokenType.IDENT, 'Expected lane ID.').value;
        const label = this.peekType() === TokenType.STRING
            ? this.parseStringExpr()
            : null;
        const style = this.peekType() === TokenType.LBRACE ? this.parseInlineStyle() : null;
        this.expectNewline();
        return { type: 'LaneDecl', loc, id, label, style };
    }

    // ─── Control Flow (Phase 2) ──────────────────────────────────

    private parseForLoop(): ForLoop {
        const loc = this.loc();
        this.expect(TokenType.FOR);
        const variable = this.expect(TokenType.IDENT, 'Expected loop variable name.').value;
        this.expect(TokenType.IN, 'Expected "in" after loop variable.');
        const iterable = this.parseExpression();
        this.expectNewline();
        const body = this.parseBody(new Set([TokenType.END]));
        this.expect(TokenType.END, 'Expected "end" to close "for" block.');
        this.expectNewline();
        return { type: 'ForLoop', loc, variable, iterable, body };
    }

    private parseIfStatement(): IfStatement {
        const loc = this.loc();
        this.expect(TokenType.IF);
        const condition = this.parseExpression();
        this.expectNewline();
        const body = this.parseBody(new Set([TokenType.ELSE, TokenType.END]));

        const elseIfs: { condition: Expression; body: Statement[] }[] = [];
        let elseBody: Statement[] | null = null;

        while (this.peekType() === TokenType.ELSE) {
            this.advance(); // consume 'else'
            if (this.peekType() === TokenType.IF) {
                this.advance(); // consume 'if'
                const elifCondition = this.parseExpression();
                this.expectNewline();
                const elifBody = this.parseBody(new Set([TokenType.ELSE, TokenType.END]));
                elseIfs.push({ condition: elifCondition, body: elifBody });
            } else {
                this.expectNewline();
                elseBody = this.parseBody(new Set([TokenType.END]));
                break;
            }
        }

        this.expect(TokenType.END, 'Expected "end" to close "if" block.');
        this.expectNewline();
        return { type: 'IfStatement', loc, condition, body, elseIfs, elseBody };
    }

    // ─── Functions (Phase 2) ─────────────────────────────────────

    private parseFnDecl(): FnDecl {
        const loc = this.loc();
        this.expect(TokenType.FN);
        const name = this.expect(TokenType.IDENT, 'Expected function name.').value;
        this.expect(TokenType.LPAREN, 'Expected "(" after function name.');
        const params: string[] = [];
        if (this.peekType() !== TokenType.RPAREN) {
            params.push(this.expect(TokenType.IDENT, 'Expected parameter name.').value);
            while (this.match(TokenType.COMMA)) {
                params.push(this.expect(TokenType.IDENT, 'Expected parameter name.').value);
            }
        }
        this.expect(TokenType.RPAREN, 'Expected ")" after parameter list.');
        this.expectNewline();
        const body = this.parseBody(new Set([TokenType.END]));
        this.expect(TokenType.END, 'Expected "end" to close "fn" block.');
        this.expectNewline();
        return { type: 'FnDecl', loc, name, params, body };
    }

    // ─── Template / Use (Phase 3) ────────────────────────────────

    private parseTemplateDecl(): TemplateDecl {
        const loc = this.loc();
        this.expect(TokenType.TEMPLATE);
        const name = this.expect(TokenType.IDENT, 'Expected template name.').value;
        this.expect(TokenType.LPAREN, 'Expected "(" after template name.');
        const params: string[] = [];
        if (this.peekType() !== TokenType.RPAREN) {
            params.push(this.expect(TokenType.IDENT).value);
            while (this.match(TokenType.COMMA)) {
                params.push(this.expect(TokenType.IDENT).value);
            }
        }
        this.expect(TokenType.RPAREN);
        this.expectNewline();
        const body = this.parseBody(new Set([TokenType.END]));
        this.expect(TokenType.END, 'Expected "end" to close "template" block.');
        this.expectNewline();
        return { type: 'TemplateDecl', loc, name, params, body };
    }

    private parseUseTemplate(): UseTemplate {
        const loc = this.loc();
        this.expect(TokenType.USE);
        const name = this.expect(TokenType.IDENT, 'Expected template name after "use".').value;
        this.expect(TokenType.LPAREN, 'Expected "(" after template name.');
        const args: Expression[] = [];
        if (this.peekType() !== TokenType.RPAREN) {
            args.push(this.parseExpression());
            while (this.match(TokenType.COMMA)) {
                args.push(this.parseExpression());
            }
        }
        this.expect(TokenType.RPAREN);
        this.expectNewline();
        return { type: 'UseTemplate', loc, name, args };
    }

    // ─── Group (Phase 3) ─────────────────────────────────────────

    private parseGroupBlock(): GroupBlock {
        const loc = this.loc();
        this.expect(TokenType.GROUP);
        const id = this.expect(TokenType.IDENT, 'Expected group ID.').value;
        const label = this.peekType() === TokenType.STRING ? this.parseStringExpr() : null;
        this.expectNewline();
        const body = this.parseBody(new Set([TokenType.END]));
        this.expect(TokenType.END, 'Expected "end" to close "group" block.');
        this.expectNewline();
        return { type: 'GroupBlock', loc, id, label, body };
    }

    // ─── Animate (Phase 4) ───────────────────────────────────────

    private parseAnimateBlock(): AnimateBlock {
        const loc = this.loc();
        this.expect(TokenType.ANIMATE);
        this.expectNewline();
        // Stub — Phase 4 will parse animation statements
        const body: [] = [];
        // For now, skip until 'end'
        this.parseBody(new Set([TokenType.END]));
        this.expect(TokenType.END, 'Expected "end" to close "animate" block.');
        this.expectNewline();
        return { type: 'AnimateBlock', loc, body };
    }

    // ─── Events (Phase 5) ────────────────────────────────────────

    private parseEventHandler(): EventHandler {
        const loc = this.loc();
        this.expect(TokenType.ON);
        const eventToken = this.expect(TokenType.IDENT, 'Expected event name (click, hover, leave).');
        const event = eventToken.value as EventHandler['event'];
        const target = this.parseAtom();
        this.expectNewline();
        const body = this.parseBody(new Set([TokenType.END]));
        this.expect(TokenType.END, 'Expected "end" to close "on" block.');
        this.expectNewline();
        return { type: 'EventHandler', loc, event, target, body };
    }

    // ─── Node / Edge / FnCall / ApiCall Detection ────────────────

    private parseNodeOrEdgeOrCall(indent: number): Statement | null {
        const loc = this.loc();

        // Check for Yappy.method() API call
        if (this.peekType() === TokenType.IDENT && this.peek().value === 'Yappy') {
            return this.parseApiCall();
        }

        // Look ahead to determine: node declaration, edge, or function call
        // Try to parse as identifier
        if (this.peekType() !== TokenType.IDENT) {
            throw new ParseError(
                `Unexpected token ${this.peek().type} ("${this.peek().value}").`,
                this.peek().loc
            );
        }

        const firstIdent = this.advance(); // consume first identifier

        // Check if this is an edge: ident EDGE_OP ident
        if (EDGE_OPS.has(this.peekType())) {
            return this.parseEdgeDecl(firstIdent, loc);
        }

        // Check if this is a function call: ident(args)
        if (this.peekType() === TokenType.LPAREN) {
            return this.parseFnCallStmt(firstIdent.value, loc);
        }

        // Otherwise it's a node declaration: ident [shape] "label" { style } @pool/lane
        return this.parseNodeDecl(firstIdent, indent, loc);
    }

    // ─── Edge Declaration ────────────────────────────────────────

    private parseEdgeDecl(fromToken: Token, loc: SourceLocation): EdgeDecl {
        const from = this.makeIdentOrInterpolated(fromToken);
        const opToken = this.advance(); // consume edge operator
        const operator = opToken.value as EdgeDecl['operator'];
        const toToken = this.expect(TokenType.IDENT, 'Expected target node ID after edge operator.');
        const to = this.makeIdentOrInterpolated(toToken);

        const label = this.peekType() === TokenType.STRING ? this.parseStringExpr() : null;
        const style = this.peekType() === TokenType.LBRACE ? this.parseInlineStyle() : null;

        this.expectNewline();
        return { type: 'EdgeDecl', loc, from, operator, to, label, style };
    }

    // ─── Node Declaration ────────────────────────────────────────

    private parseNodeDecl(idToken: Token, indent: number, loc: SourceLocation): NodeDecl {
        const id = this.makeIdentOrInterpolated(idToken);

        // Optional [shape]
        let shape: string | null = null;
        if (this.peekType() === TokenType.LBRACKET) {
            this.advance(); // [
            shape = this.expect(TokenType.IDENT, 'Expected shape name inside brackets.').value;
            this.expect(TokenType.RBRACKET, 'Expected closing "]" after shape name.');
        }

        // Optional "label"
        const label = this.peekType() === TokenType.STRING ? this.parseStringExpr() : null;

        // Optional { style }
        const style = this.peekType() === TokenType.LBRACE ? this.parseInlineStyle() : null;

        // Optional @pool/lane
        let poolRef: string | null = null;
        if (this.peekType() === TokenType.AT) {
            this.advance(); // @
            const ref = this.expect(TokenType.IDENT, 'Expected pool reference after @.').value;
            if (this.peekType() === TokenType.SLASH) {
                this.advance();
                const lane = this.expect(TokenType.IDENT, 'Expected lane ID after /.').value;
                poolRef = `${ref}/${lane}`;
            } else {
                poolRef = ref;
            }
        }

        this.expectNewline();
        return { type: 'NodeDecl', loc, id, shape, label, style, poolRef, indent };
    }

    // ─── Function Call (statement) ───────────────────────────────

    private parseFnCallStmt(name: string, loc: SourceLocation): FnCall {
        this.expect(TokenType.LPAREN);
        const args: Expression[] = [];
        if (this.peekType() !== TokenType.RPAREN) {
            args.push(this.parseExpression());
            while (this.match(TokenType.COMMA)) {
                args.push(this.parseExpression());
            }
        }
        this.expect(TokenType.RPAREN, 'Expected ")" after function arguments.');
        this.expectNewline();
        return { type: 'FnCall', loc, name, args };
    }

    // ─── API Call: Yappy.method(args) ────────────────────────────

    private parseApiCall(): ApiCall {
        const loc = this.loc();
        this.expect(TokenType.IDENT); // 'Yappy'
        this.expect(TokenType.DOT, 'Expected "." after "Yappy".');
        const method = this.expect(TokenType.IDENT, 'Expected method name after "Yappy.".').value;
        this.expect(TokenType.LPAREN, 'Expected "(" after method name.');
        const args: Expression[] = [];
        if (this.peekType() !== TokenType.RPAREN) {
            args.push(this.parseExpression());
            while (this.match(TokenType.COMMA)) {
                args.push(this.parseExpression());
            }
        }
        this.expect(TokenType.RPAREN, 'Expected ")" after API arguments.');
        this.expectNewline();
        return { type: 'ApiCall', loc, method, args };
    }

    // ─── Inline Style { key: value, ... } ────────────────────────

    private parseInlineStyle(): Record<string, Expression> {
        this.expect(TokenType.LBRACE);
        const style: Record<string, Expression> = {};

        while (this.peekType() !== TokenType.RBRACE && !this.isAtEnd()) {
            const key = this.expect(TokenType.IDENT, 'Expected style property name.').value;
            this.expect(TokenType.COLON, `Expected ":" after style key "${key}".`);
            const value = this.parseExpression();
            style[key] = value;
            this.match(TokenType.COMMA); // optional trailing comma
        }

        this.expect(TokenType.RBRACE, 'Expected "}" to close inline style.');
        return style;
    }

    // ─── Expressions ─────────────────────────────────────────────

    private parseExpression(): Expression {
        return this.parseOr();
    }

    private parseOr(): Expression {
        let left = this.parseAnd();
        while (this.peekType() === TokenType.OR) {
            const loc = this.loc();
            this.advance();
            const right = this.parseAnd();
            left = { type: 'BinaryExpr', op: '||', left, right, loc };
        }
        return left;
    }

    private parseAnd(): Expression {
        let left = this.parseEquality();
        while (this.peekType() === TokenType.AND) {
            const loc = this.loc();
            this.advance();
            const right = this.parseEquality();
            left = { type: 'BinaryExpr', op: '&&', left, right, loc };
        }
        return left;
    }

    private parseEquality(): Expression {
        let left = this.parseComparison();
        while (this.peekType() === TokenType.EQ || this.peekType() === TokenType.NEQ) {
            const loc = this.loc();
            const op = this.advance().value as '==' | '!=';
            const right = this.parseComparison();
            left = { type: 'BinaryExpr', op, left, right, loc };
        }
        return left;
    }

    private parseComparison(): Expression {
        let left = this.parseAdditive();
        while (([TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE] as TokenType[]).includes(this.peekType())) {
            const loc = this.loc();
            const op = this.advance().value as '<' | '>' | '<=' | '>=';
            const right = this.parseAdditive();
            left = { type: 'BinaryExpr', op, left, right, loc };
        }
        return left;
    }

    private parseAdditive(): Expression {
        let left = this.parseMultiplicative();
        while (this.peekType() === TokenType.PLUS || this.peekType() === TokenType.MINUS) {
            const loc = this.loc();
            const op = this.advance().value as '+' | '-';
            const right = this.parseMultiplicative();
            left = { type: 'BinaryExpr', op, left, right, loc };
        }
        return left;
    }

    private parseMultiplicative(): Expression {
        let left = this.parseUnary();
        while (this.peekType() === TokenType.STAR || this.peekType() === TokenType.SLASH || this.peekType() === TokenType.PERCENT) {
            const loc = this.loc();
            const op = this.advance().value as '*' | '/' | '%';
            const right = this.parseUnary();
            left = { type: 'BinaryExpr', op, left, right, loc };
        }
        return left;
    }

    private parseUnary(): Expression {
        if (this.peekType() === TokenType.MINUS) {
            const loc = this.loc();
            this.advance();
            const operand = this.parseUnary();
            return { type: 'UnaryExpr', op: '-', operand, loc };
        }
        if (this.peekType() === TokenType.NOT) {
            const loc = this.loc();
            this.advance();
            const operand = this.parseUnary();
            return { type: 'UnaryExpr', op: '!', operand, loc };
        }
        return this.parseRange();
    }

    private parseRange(): Expression {
        const left = this.parseAtom();
        if (this.peekType() === TokenType.RANGE) {
            const loc = this.loc();
            this.advance();
            const end = this.parseAtom();
            return { type: 'RangeExpr', start: left, end, loc };
        }
        return left;
    }

    private parseAtom(): Expression {
        const loc = this.loc();

        // Number literal
        if (this.peekType() === TokenType.NUMBER) {
            const val = this.advance().value;
            return { type: 'NumberLiteral', value: parseFloat(val), loc };
        }

        // String literal (may contain ${...} interpolation)
        if (this.peekType() === TokenType.STRING) {
            return this.parseStringExpr();
        }

        // Boolean literals
        if (this.peekType() === TokenType.TRUE) {
            this.advance();
            return { type: 'BoolLiteral', value: true, loc };
        }
        if (this.peekType() === TokenType.FALSE) {
            this.advance();
            return { type: 'BoolLiteral', value: false, loc };
        }

        // Array literal [a, b, c]
        if (this.peekType() === TokenType.LBRACKET) {
            return this.parseArrayLiteral();
        }

        // Parenthesized expression
        if (this.peekType() === TokenType.LPAREN) {
            this.advance();
            const expr = this.parseExpression();
            this.expect(TokenType.RPAREN, 'Expected ")" after expression.');
            return expr;
        }

        // Identifier (may be function call: ident(...))
        if (this.peekType() === TokenType.IDENT) {
            const ident = this.advance();

            // Function/method call: ident(args)
            if (this.peekType() === TokenType.LPAREN) {
                this.advance(); // (
                const args: Expression[] = [];
                if (this.peekType() !== TokenType.RPAREN) {
                    args.push(this.parseExpression());
                    while (this.match(TokenType.COMMA)) {
                        args.push(this.parseExpression());
                    }
                }
                this.expect(TokenType.RPAREN);
                return { type: 'CallExpr', callee: ident.value, args, loc };
            }

            // Member access: ident.property
            if (this.peekType() === TokenType.DOT) {
                this.advance();
                const prop = this.expect(TokenType.IDENT, 'Expected property name after ".".').value;
                return { type: 'MemberExpr', object: { type: 'Identifier', name: ident.value, loc }, property: prop, loc };
            }

            return { type: 'Identifier', name: ident.value, loc };
        }

        throw new ParseError(
            `Unexpected token ${this.peek().type} ("${this.peek().value}").`,
            loc
        );
    }

    // ─── String Expression (handles interpolation) ───────────────

    private parseStringExpr(): Expression {
        const loc = this.loc();
        const raw = this.expect(TokenType.STRING).value;

        // Check for ${...} interpolation
        if (!raw.includes('${')) {
            return { type: 'StringLiteral', value: raw, loc };
        }

        // Parse interpolation: split on ${...} boundaries
        const parts: (string | Expression)[] = [];
        let remaining = raw;
        while (remaining.length > 0) {
            const interpIdx = remaining.indexOf('${');
            if (interpIdx === -1) {
                parts.push(remaining);
                break;
            }
            if (interpIdx > 0) {
                parts.push(remaining.substring(0, interpIdx));
            }
            // Find matching }
            const closeIdx = remaining.indexOf('}', interpIdx + 2);
            if (closeIdx === -1) {
                throw new ParseError('Unterminated string interpolation ${...}.', loc);
            }
            const varName = remaining.substring(interpIdx + 2, closeIdx).trim();
            parts.push({ type: 'Identifier', name: varName, loc } as Identifier);
            remaining = remaining.substring(closeIdx + 1);
        }

        if (parts.length === 1 && typeof parts[0] === 'string') {
            return { type: 'StringLiteral', value: parts[0], loc };
        }

        return { type: 'InterpolatedString', parts, loc };
    }

    // ─── Array Literal ───────────────────────────────────────────

    private parseArrayLiteral(): Expression {
        const loc = this.loc();
        this.expect(TokenType.LBRACKET);
        const elements: Expression[] = [];
        if (this.peekType() !== TokenType.RBRACKET) {
            elements.push(this.parseExpression());
            while (this.match(TokenType.COMMA)) {
                elements.push(this.parseExpression());
            }
        }
        this.expect(TokenType.RBRACKET, 'Expected "]" to close array literal.');
        return { type: 'ArrayLiteral', elements, loc };
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /** Convert a token to an Identifier or InterpolatedString (for node IDs with {var}). */
    private makeIdentOrInterpolated(token: Token): Expression {
        const val = token.value;
        // Check for {var} pattern in identifiers (e.g., server_{i})
        if (val.includes('{') && val.includes('}')) {
            const parts: (string | Expression)[] = [];
            let remaining = val;
            while (remaining.length > 0) {
                const openIdx = remaining.indexOf('{');
                if (openIdx === -1) {
                    parts.push(remaining);
                    break;
                }
                if (openIdx > 0) {
                    parts.push(remaining.substring(0, openIdx));
                }
                const closeIdx = remaining.indexOf('}', openIdx + 1);
                if (closeIdx === -1) {
                    parts.push(remaining);
                    break;
                }
                const varName = remaining.substring(openIdx + 1, closeIdx);
                parts.push({ type: 'Identifier', name: varName, loc: token.loc } as Identifier);
                remaining = remaining.substring(closeIdx + 1);
            }
            return { type: 'InterpolatedString', parts, loc: token.loc };
        }
        return { type: 'Identifier', name: val, loc: token.loc };
    }
}
