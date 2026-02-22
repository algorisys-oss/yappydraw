/**
 * YSL Lexer — Tokenizes YSL source text into a flat token stream.
 *
 * Handles keywords, identifiers, strings (with interpolation markers),
 * numbers, operators, edge operators, brackets, and newlines.
 * Preserves leading indentation as an INDENT token for hierarchy support.
 */

import { LexerError, type SourceLocation } from './errors';

// ─── Token Types ─────────────────────────────────────────────────────

export const TokenType = {
    // Keywords
    LET: 'LET',
    CONST: 'CONST',
    FN: 'FN',
    END: 'END',
    FOR: 'FOR',
    IN: 'IN',
    IF: 'IF',
    ELSE: 'ELSE',
    RETURN: 'RETURN',
    TEMPLATE: 'TEMPLATE',
    USE: 'USE',
    GROUP: 'GROUP',
    POOL: 'POOL',
    LANE: 'LANE',
    ANIMATE: 'ANIMATE',
    PARALLEL: 'PARALLEL',
    AWAIT: 'AWAIT',
    STAGGER: 'STAGGER',
    ON: 'ON',
    TRUE: 'TRUE',
    FALSE: 'FALSE',

    // Literals
    IDENT: 'IDENT',
    STRING: 'STRING',
    NUMBER: 'NUMBER',

    // Edge operators
    ARROW: 'ARROW',         // ->
    LINE_OP: 'LINE_OP',     // --
    BEZIER: 'BEZIER',       // ~>
    ELBOW: 'ELBOW',         // =>

    // Delimiters
    LBRACKET: 'LBRACKET',   // [
    RBRACKET: 'RBRACKET',   // ]
    LBRACE: 'LBRACE',       // {
    RBRACE: 'RBRACE',       // }
    LPAREN: 'LPAREN',       // (
    RPAREN: 'RPAREN',       // )

    // Punctuation
    COMMA: 'COMMA',
    DOT: 'DOT',
    COLON: 'COLON',
    AT: 'AT',               // @
    HASH: 'HASH',           // # (comment start)
    RANGE: 'RANGE',         // ..

    // Operators
    PLUS: 'PLUS',
    MINUS: 'MINUS',
    STAR: 'STAR',
    SLASH: 'SLASH',
    PERCENT: 'PERCENT',
    ASSIGN: 'ASSIGN',       // =
    EQ: 'EQ',               // ==
    NEQ: 'NEQ',             // !=
    LT: 'LT',
    GT: 'GT',
    LTE: 'LTE',             // <=
    GTE: 'GTE',             // >=
    AND: 'AND',             // &&
    OR: 'OR',               // ||
    NOT: 'NOT',             // !

    // Structure
    NEWLINE: 'NEWLINE',
    INDENT: 'INDENT',       // leading whitespace (value = indent level)
    FRONTMATTER: 'FRONTMATTER', // --- delimiter

    // Interpolation
    INTERP_START: 'INTERP_START',  // ${
    INTERP_END: 'INTERP_END',     // }  (inside interpolation)
    VAR_REF: 'VAR_REF',           // {varName} in node IDs

    EOF: 'EOF',
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

const KEYWORDS: Record<string, TokenType> = {
    'let': TokenType.LET,
    'const': TokenType.CONST,
    'fn': TokenType.FN,
    'end': TokenType.END,
    'for': TokenType.FOR,
    'in': TokenType.IN,
    'if': TokenType.IF,
    'else': TokenType.ELSE,
    'return': TokenType.RETURN,
    'template': TokenType.TEMPLATE,
    'use': TokenType.USE,
    'group': TokenType.GROUP,
    'pool': TokenType.POOL,
    'lane': TokenType.LANE,
    'animate': TokenType.ANIMATE,
    'parallel': TokenType.PARALLEL,
    'await': TokenType.AWAIT,
    'stagger': TokenType.STAGGER,
    'on': TokenType.ON,
    'true': TokenType.TRUE,
    'false': TokenType.FALSE,
};

export interface Token {
    type: TokenType;
    value: string;
    loc: SourceLocation;
}

// ─── Lexer ───────────────────────────────────────────────────────────

export function tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    const lines = source.split('\n');
    let inFrontmatter = false;
    let frontmatterSeen = false;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineNum = lineIdx + 1;
        const rawLine = lines[lineIdx];
        const line = rawLine.replace(/\r$/, ''); // strip trailing CR

        // Frontmatter delimiter ---
        if (/^---\s*$/.test(line)) {
            tokens.push({ type: TokenType.FRONTMATTER, value: '---', loc: { line: lineNum, column: 1 } });
            if (!frontmatterSeen) {
                inFrontmatter = true;
                frontmatterSeen = true;
            } else if (inFrontmatter) {
                inFrontmatter = false;
            }
            tokens.push({ type: TokenType.NEWLINE, value: '\n', loc: { line: lineNum, column: line.length + 1 } });
            continue;
        }

        // Inside frontmatter — emit the whole line as a STRING token
        if (inFrontmatter) {
            if (line.trim()) {
                tokens.push({ type: TokenType.STRING, value: line.trim(), loc: { line: lineNum, column: 1 } });
            }
            tokens.push({ type: TokenType.NEWLINE, value: '\n', loc: { line: lineNum, column: line.length + 1 } });
            continue;
        }

        // Comment line
        const stripped = line.replace(/^\s*/, '');
        if (stripped.startsWith('#')) {
            // Skip comment lines entirely
            tokens.push({ type: TokenType.NEWLINE, value: '\n', loc: { line: lineNum, column: line.length + 1 } });
            continue;
        }

        // Empty line
        if (!stripped) {
            tokens.push({ type: TokenType.NEWLINE, value: '\n', loc: { line: lineNum, column: 1 } });
            continue;
        }

        // Leading indentation
        const indentMatch = rawLine.match(/^(\s+)/);
        let col = 1;
        if (indentMatch) {
            const spaces = indentMatch[1].length;
            tokens.push({ type: TokenType.INDENT, value: String(spaces), loc: { line: lineNum, column: 1 } });
            col = spaces + 1;
        }

        // Tokenize the rest of the line
        tokenizeLine(stripped, lineNum, col, tokens);

        // End of line
        tokens.push({ type: TokenType.NEWLINE, value: '\n', loc: { line: lineNum, column: line.length + 1 } });
    }

    tokens.push({ type: TokenType.EOF, value: '', loc: { line: lines.length + 1, column: 1 } });
    return tokens;
}

function tokenizeLine(line: string, lineNum: number, startCol: number, tokens: Token[]): void {
    let pos = 0;
    const col = () => startCol + pos;

    while (pos < line.length) {
        const ch = line[pos];

        // Whitespace (not leading — already handled)
        if (ch === ' ' || ch === '\t') {
            pos++;
            continue;
        }

        // Inline comment
        if (ch === '#') {
            break; // skip rest of line
        }

        // String literal "..."
        if (ch === '"') {
            const start = col();
            pos++; // skip opening quote
            let str = '';
            while (pos < line.length && line[pos] !== '"') {
                if (line[pos] === '\\' && pos + 1 < line.length) {
                    pos++;
                    const esc = line[pos];
                    if (esc === 'n') str += '\n';
                    else if (esc === 't') str += '\t';
                    else if (esc === '\\') str += '\\';
                    else if (esc === '"') str += '"';
                    else str += '\\' + esc;
                } else {
                    str += line[pos];
                }
                pos++;
            }
            if (pos >= line.length) {
                throw new LexerError('Unterminated string literal.', { line: lineNum, column: start });
            }
            pos++; // skip closing quote
            tokens.push({ type: TokenType.STRING, value: str, loc: { line: lineNum, column: start } });
            continue;
        }

        // Single-quoted string '...'
        if (ch === "'") {
            const start = col();
            pos++;
            let str = '';
            while (pos < line.length && line[pos] !== "'") {
                str += line[pos];
                pos++;
            }
            if (pos >= line.length) {
                throw new LexerError('Unterminated string literal.', { line: lineNum, column: start });
            }
            pos++;
            tokens.push({ type: TokenType.STRING, value: str, loc: { line: lineNum, column: start } });
            continue;
        }

        // Number
        if (isDigit(ch) || (ch === '-' && pos + 1 < line.length && isDigit(line[pos + 1]) && shouldBeNegativeNumber(tokens))) {
            const start = col();
            let num = '';
            if (ch === '-') { num = '-'; pos++; }
            while (pos < line.length && (isDigit(line[pos]) || line[pos] === '.')) {
                num += line[pos];
                pos++;
            }
            tokens.push({ type: TokenType.NUMBER, value: num, loc: { line: lineNum, column: start } });
            continue;
        }

        // Two-character operators
        if (pos + 1 < line.length) {
            const two = ch + line[pos + 1];
            const twoCharToken = matchTwoChar(two);
            if (twoCharToken) {
                tokens.push({ type: twoCharToken, value: two, loc: { line: lineNum, column: col() } });
                pos += 2;
                continue;
            }
        }

        // Single-character tokens
        const singleToken = matchSingleChar(ch);
        if (singleToken) {
            tokens.push({ type: singleToken, value: ch, loc: { line: lineNum, column: col() } });
            pos++;
            continue;
        }

        // Identifier or keyword
        if (isIdentStart(ch)) {
            const start = col();
            let ident = '';
            while (pos < line.length && isIdentPart(line[pos])) {
                ident += line[pos];
                pos++;
            }
            // Check for keyword
            const keyword = KEYWORDS[ident];
            if (keyword) {
                tokens.push({ type: keyword, value: ident, loc: { line: lineNum, column: start } });
            } else {
                tokens.push({ type: TokenType.IDENT, value: ident, loc: { line: lineNum, column: start } });
            }
            continue;
        }

        // Tilde (for ~> which should already be handled, but standalone ~)
        if (ch === '~') {
            throw new LexerError(`Unexpected character '~'. Did you mean '~>' for bezier edge?`, { line: lineNum, column: col() });
        }

        throw new LexerError(`Unexpected character '${ch}'.`, { line: lineNum, column: col() });
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function matchTwoChar(s: string): TokenType | null {
    switch (s) {
        case '->': return TokenType.ARROW;
        case '--': return TokenType.LINE_OP;
        case '~>': return TokenType.BEZIER;
        case '=>': return TokenType.ELBOW;
        case '..': return TokenType.RANGE;
        case '==': return TokenType.EQ;
        case '!=': return TokenType.NEQ;
        case '<=': return TokenType.LTE;
        case '>=': return TokenType.GTE;
        case '&&': return TokenType.AND;
        case '||': return TokenType.OR;
        default: return null;
    }
}

function matchSingleChar(ch: string): TokenType | null {
    switch (ch) {
        case '[': return TokenType.LBRACKET;
        case ']': return TokenType.RBRACKET;
        case '{': return TokenType.LBRACE;
        case '}': return TokenType.RBRACE;
        case '(': return TokenType.LPAREN;
        case ')': return TokenType.RPAREN;
        case ',': return TokenType.COMMA;
        case '.': return TokenType.DOT;
        case ':': return TokenType.COLON;
        case '@': return TokenType.AT;
        case '+': return TokenType.PLUS;
        case '-': return TokenType.MINUS;
        case '*': return TokenType.STAR;
        case '/': return TokenType.SLASH;
        case '%': return TokenType.PERCENT;
        case '=': return TokenType.ASSIGN;
        case '<': return TokenType.LT;
        case '>': return TokenType.GT;
        case '!': return TokenType.NOT;
        default: return null;
    }
}

function isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentPart(ch: string): boolean {
    return isIdentStart(ch) || isDigit(ch) || ch === '-';
}

/** Determine if a minus sign should be treated as negative number (not subtraction). */
function shouldBeNegativeNumber(tokens: Token[]): boolean {
    if (tokens.length === 0) return true;
    const last = tokens[tokens.length - 1];
    // After operators, opening brackets, assignment, or line start → negative number
    return (
        [
            TokenType.ASSIGN, TokenType.PLUS, TokenType.MINUS, TokenType.STAR,
            TokenType.SLASH, TokenType.PERCENT, TokenType.LPAREN, TokenType.COMMA,
            TokenType.COLON, TokenType.NEWLINE, TokenType.INDENT,
            TokenType.EQ, TokenType.NEQ, TokenType.LT, TokenType.GT,
            TokenType.LTE, TokenType.GTE, TokenType.AND, TokenType.OR,
        ] as TokenType[]
    ).includes(last.type);
}
