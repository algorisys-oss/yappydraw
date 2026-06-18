/**
 * color-drop — touch/pen "ColorDrop" controller (Procreate-inspired).
 *
 * Drag a palette swatch onto the canvas to apply its colour to the shape under
 * your finger (or the slide background). The palette swatch owns the drag via
 * pointer capture (reliable on iOS/iPadOS, unlike HTML5 drag-and-drop which
 * never fires on touch); the canvas registers a commit handler that knows how
 * to map client coords → world and fill the hit element.
 *
 * Pure UI state + a single registered callback — no store or canvas imports, so
 * it can be driven from anywhere.
 */
import { createSignal } from 'solid-js';

export interface ColorDropState {
    active: boolean;
    color: string;
    /** Current pointer position in client coords (for the floating HUD chip). */
    x: number;
    y: number;
}

const [state, setState] = createSignal<ColorDropState>({ active: false, color: '', x: 0, y: 0 });

/** Reactive accessor for the floating HUD. */
export const colorDropState = state;

type CommitFn = (clientX: number, clientY: number, color: string) => void;
let commitFn: CommitFn | null = null;

/** The canvas registers how a dropped colour is applied (hit-test + fill). */
export const registerColorDropCommit = (fn: CommitFn | null) => { commitFn = fn; };

export const startColorDrop = (color: string, x: number, y: number) =>
    setState({ active: true, color, x, y });

export const moveColorDrop = (x: number, y: number) =>
    setState(s => (s.active ? { ...s, x, y } : s));

/** Commit the drop at the final pointer position, then clear. */
export const commitColorDrop = (x: number, y: number) => {
    const s = state();
    if (s.active && commitFn) commitFn(x, y, s.color);
    setState({ active: false, color: '', x: 0, y: 0 });
};

export const cancelColorDrop = () =>
    setState({ active: false, color: '', x: 0, y: 0 });
