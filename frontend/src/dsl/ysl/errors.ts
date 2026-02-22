/**
 * YSL Error Types
 * Provides structured errors with source location for clear diagnostics.
 */

export interface SourceLocation {
    line: number;
    column: number;
}

export class YSLError extends Error {
    loc: SourceLocation;
    kind: 'lexer' | 'parser' | 'runtime';

    constructor(
        message: string,
        loc: SourceLocation,
        kind: 'lexer' | 'parser' | 'runtime' = 'runtime'
    ) {
        super(`[YSL ${kind} error] Line ${loc.line}:${loc.column} — ${message}`);
        this.name = 'YSLError';
        this.loc = loc;
        this.kind = kind;
    }
}

export class LexerError extends YSLError {
    constructor(message: string, loc: SourceLocation) {
        super(message, loc, 'lexer');
        this.name = 'LexerError';
    }
}

export class ParseError extends YSLError {
    constructor(message: string, loc: SourceLocation) {
        super(message, loc, 'parser');
        this.name = 'ParseError';
    }
}

export class RuntimeError extends YSLError {
    constructor(message: string, loc: SourceLocation) {
        super(message, loc, 'runtime');
        this.name = 'RuntimeError';
    }
}
