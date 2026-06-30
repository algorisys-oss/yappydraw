import { type Component, createSignal, createEffect } from "solid-js";
import { evaluateNumericExpression } from "../utils/eval-expr";

/**
 * Numeric field that accepts arithmetic expressions (Illustrator "math in fields"):
 * type `200-50%`, `+10`, `*2`, `/3`, `(4+1)*8` and press Enter/Tab/blur to evaluate.
 * `%` is relative to the field's current value. Arrow Up/Down still step the value
 * (±step, ×10 with Shift, ×0.1 with Alt/Ctrl) so the spinner UX survives the switch
 * from <input type=number> to text.
 *
 * Live preview: while the typed text is a *complete plain number* (e.g. `42`,
 * `3.5`, `-8`) we commit on every keystroke so the canvas updates in real time.
 * Only genuine expressions (`200-50%`, `*2`, `(4+1)*8`) defer to Enter/Tab/blur —
 * a half-typed expression never fires a bogus update. History is checkpointed once
 * on focus (`onEditStart`), so the live commits don't flood undo. Invalid input
 * reverts to the last good value.
 */
const MathNumberInput: Component<{
    value: number | undefined;          // undefined ⇒ "mixed"
    onCommit: (n: number) => void;
    onEditStart?: () => void;           // e.g. pushToHistory()
    min?: number;
    max?: number;
    step?: number;
    class?: string;
    title?: string;
}> = (props) => {
    const [text, setText] = createSignal('');
    const [editing, setEditing] = createSignal(false);

    const display = () => props.value === undefined ? '' : String(round(props.value));
    // Keep the field in sync with the model while not actively editing.
    createEffect(() => { if (!editing()) setText(display()); });

    const round = (n: number) => Math.round(n * 1e4) / 1e4;
    const clamp = (n: number) => {
        if (props.min !== undefined) n = Math.max(props.min, n);
        if (props.max !== undefined) n = Math.min(props.max, n);
        return n;
    };

    const commit = () => {
        const base = props.value ?? 0;
        const result = evaluateNumericExpression(text(), base);
        if (result !== null) props.onCommit(clamp(result));
        setEditing(false);
        setText(display());
    };

    // A "complete" plain number (optional sign, decimals) — NOT a partial expression
    // like `200-`, `*2`, `2+`. For these we can safely preview on every keystroke.
    const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/;
    const liveCommit = (raw: string) => {
        const t = raw.trim();
        if (!PLAIN_NUMBER.test(t)) return;   // expressions wait for Enter/Tab/blur
        const n = Number(t);
        if (Number.isFinite(n)) props.onCommit(clamp(n));
    };

    const step = (dir: 1 | -1, e: KeyboardEvent) => {
        const base = props.value ?? 0;
        const amt = (props.step ?? 1) * (e.shiftKey ? 10 : (e.altKey || e.ctrlKey || e.metaKey) ? 0.1 : 1);
        props.onEditStart?.();
        const next = clamp(round(base + dir * amt));
        props.onCommit(next);
        setText(String(next));
    };

    return (
        <input
            type="text"
            inputmode="text"
            autocomplete="off"
            spellcheck={false}
            class={props.class}
            title={props.title}
            value={text()}
            placeholder={props.value === undefined ? '—' : undefined}
            onFocus={() => { setEditing(true); props.onEditStart?.(); }}
            onInput={(e) => { const v = e.currentTarget.value; setText(v); liveCommit(v); }}
            onBlur={commit}
            onKeyDown={(e) => {
                e.stopPropagation();           // don't let canvas hotkeys steal keys
                if (e.key === 'Enter' || e.key === 'Tab') { commit(); if (e.key === 'Enter') e.currentTarget.blur(); }
                else if (e.key === 'Escape') { setEditing(false); setText(display()); e.currentTarget.blur(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); step(1, e); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); step(-1, e); }
            }}
        />
    );
};

export default MathNumberInput;
