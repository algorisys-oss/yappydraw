/**
 * Safe arithmetic evaluator for numeric inputs — the Illustrator "math in fields"
 * trick (type `200-50%`, `+10`, `*2`, `/3`, `(4+1)*8` and press Return).
 *
 * Implemented as a tiny recursive-descent parser (NOT `eval`/`new Function`), so a
 * field value can never execute arbitrary JS. Grammar:
 *
 *   expr   := term (('+' | '-') term)*
 *   term   := factor (('*' | '/') factor)*
 *   factor := ('+' | '-') factor | '(' expr ')' '%'? | number '%'?
 *
 * `%` means "percent of base" (the field's current value), so with base 200,
 * `200-50%` → 200 − (50% of 200) → 100 ("50% smaller"), matching Illustrator.
 * A leading `*` or `/` is treated as relative to base (`*2` → base×2).
 *
 * Returns the evaluated number, or null when the text isn't a valid expression
 * (caller should then keep the previous value).
 */
export function evaluateNumericExpression(text: string | number | null | undefined, base = 0): number | null {
    if (text === null || text === undefined) return null;
    let src = String(text).trim();
    if (src === '') return null;
    // Leading * or / means "operate on the current value" (e.g. "*2" → base*2).
    if (/^[*/]/.test(src)) src = String(base) + src;

    let pos = 0;
    const peek = () => src[pos];
    const eof = () => pos >= src.length;
    const skipWs = () => { while (!eof() && /\s/.test(src[pos])) pos++; };

    const applyPercent = (v: number): number => {
        skipWs();
        if (peek() === '%') { pos++; return v * 0.01 * base; }
        return v;
    };

    const parseFactor = (): number => {
        skipWs();
        const c = peek();
        if (c === '+') { pos++; return parseFactor(); }
        if (c === '-') { pos++; return -parseFactor(); }
        if (c === '(') {
            pos++;
            const v = parseExpr();
            skipWs();
            if (peek() !== ')') throw new Error('unbalanced parens');
            pos++;
            return applyPercent(v);
        }
        const start = pos;
        while (!eof() && /[0-9.]/.test(src[pos])) pos++;
        if (pos === start) throw new Error('expected number');
        const num = parseFloat(src.slice(start, pos));
        if (!isFinite(num)) throw new Error('bad number');
        return applyPercent(num);
    };

    const parseTerm = (): number => {
        let value = parseFactor();
        for (;;) {
            skipWs();
            const op = peek();
            if (op === '*' || op === '/') {
                pos++;
                const rhs = parseFactor();
                value = op === '*' ? value * rhs : value / rhs;
            } else break;
        }
        return value;
    };

    function parseExpr(): number {
        let value = parseTerm();
        for (;;) {
            skipWs();
            const op = peek();
            if (op === '+' || op === '-') {
                pos++;
                const rhs = parseTerm();
                value = op === '+' ? value + rhs : value - rhs;
            } else break;
        }
        return value;
    }

    try {
        const result = parseExpr();
        skipWs();
        if (!eof()) return null;            // trailing junk → invalid
        return isFinite(result) ? result : null;
    } catch {
        return null;
    }
}
