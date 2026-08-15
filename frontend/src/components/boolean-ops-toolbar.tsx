/**
 * Contextual boolean-ops toolbar — the fast path for logo / illustration work.
 *
 * Union, subtract, intersect and exclude were only reachable through the context menu:
 * right-click → find "Pathfinder" → open a submenu → aim at one of nine entries. That is
 * the same round trip Illustrator's floating Pathfinder panel costs, without the muscle
 * memory that lets people escape it. Combining shapes is the *inner loop* of drawing a
 * logo, so it needs to be a single click where the eye already is.
 *
 * **Opt-in.** It first shipped appearing on any 2+ selection (Figma's model — zero travel),
 * which turned out to be wrong for this particular strip: selecting two objects is the most
 * routine state in the app (move, align, group, recolour, or a rubber-band that grabbed one
 * too many), while combining them is rare and destructive. So the app was covering your
 * artwork to offer to weld it together nearly every time you selected anything. It now
 * requires `globalSettings.showPathfinderBar`, toggled from the top-bar Pathfinder button,
 * the Command Palette or the canvas context menu, and remembered across sessions.
 *
 * Still hides itself whenever another tool owns the canvas. The keyboard route
 * (Ctrl+Alt+U/D/I/X, wired in app.tsx) is unaffected by the toggle — those four operations
 * stay available with no panel at all, which is the point of having them.
 *
 * "Keep editable" switches from a destructive `applyPathfinder` to a non-destructive
 * `makeCompoundShape`: the sources survive and the operation can be changed or released
 * later. Illustrator hides that behind Alt+clicking a Pathfinder button, which nobody
 * discovers; here it is a visible toggle that remembers your choice.
 */
import { type Component, Show, For, createMemo, createSignal } from 'solid-js';
import { store, applyPathfinder, applyPathfinderRegion, makeCompoundShape, currentViewport } from '../store/app-store';
import { worldToScreen } from '../utils/viewport-transforms';
import { elementToMultiPolygon } from '../utils/path-boolean';
import './boolean-ops-toolbar.css';

type BoolOp = 'union' | 'subtract' | 'intersect' | 'exclude';
type RegionOp = 'divide' | 'trim' | 'merge' | 'crop' | 'outline';

/**
 * Can a boolean op consume this element? Asked of the geometry, not of a type list.
 *
 * This started as a hardcoded allowlist of ~19 type names, which was quietly wrong:
 * there are 70+ element types with area (pentagon, septagon, rightTriangle, cylinder,
 * speechBubble, solidBlock…), and anything missing from the list silently disabled the
 * whole toolbar — the shapes looked ordinary and nothing explained the absence.
 *
 * Flattening to polygons is the exact precondition the boolean engine itself uses, so
 * this can't drift out of step with it: every shape with area qualifies, and lines,
 * arrows and other zero-area marks are excluded for the same reason the engine rejects
 * them.
 */
function hasCombinableArea(el: { id: string }): boolean {
    try {
        return elementToMultiPolygon(el as never).length > 0;
    } catch {
        return false;
    }
}

/** Above this many selected elements, skip the geometry probe and go by count —
 *  flattening hundreds of paths on every selection change isn't worth it, and the
 *  operation reports its own error if the selection turns out to be unusable. */
const PROBE_LIMIT = 60;

const OPS: { op: BoolOp; label: string; hint: string; keys: string }[] = [
    { op: 'union', label: 'Unite', hint: 'Merge into one shape', keys: 'Ctrl+Alt+U' },
    { op: 'subtract', label: 'Subtract', hint: 'Minus front — cut the top shape out of the one below', keys: 'Ctrl+Alt+D' },
    { op: 'intersect', label: 'Intersect', hint: 'Keep only the overlap', keys: 'Ctrl+Alt+I' },
    { op: 'exclude', label: 'Exclude', hint: 'Keep everything except the overlap', keys: 'Ctrl+Alt+X' },
];

/**
 * The region operations — Illustrator's second Pathfinder row. These cut a selection into
 * pieces rather than producing one combined shape, and they're deliberate, occasional
 * choices, so they get a compact second row with no keyboard shortcuts. Text labels
 * rather than glyphs: their icons are near-indistinguishable at this size even in
 * Illustrator, where everyone hovers for the tooltip anyway.
 */
const REGION_OPS: { op: RegionOp; label: string; hint: string }[] = [
    { op: 'divide', label: 'Divide', hint: 'Cut into a separate shape for every overlapping region' },
    { op: 'trim', label: 'Trim', hint: 'Remove the hidden parts of shapes behind others; colours kept' },
    { op: 'merge', label: 'Merge', hint: 'Trim, then fuse neighbouring shapes that share a fill' },
    { op: 'crop', label: 'Crop', hint: 'Keep only what falls inside the topmost shape' },
    { op: 'outline', label: 'Outline', hint: 'Reduce everything to its outlines as stroked segments' },
];

/**
 * The ids in the selection that a boolean op can actually consume.
 *
 * Lines, arrows and connectors flatten to zero polygons, and the boolean engine bails
 * out when fewer than two inputs survive — so a selection of two shapes *plus a stray
 * line* reported "Pathfinder: empty result" and did nothing, which reads as the feature
 * being broken. Combining the shapes and leaving the line alone is what you meant.
 */
function combinableIds(): string[] {
    const sel = store.elements.filter(e => store.selection.includes(e.id));
    if (sel.length > PROBE_LIMIT) return sel.map(e => e.id);
    return sel.filter(hasCombinableArea).map(e => e.id);
}

/** Run a region op on the combinable part of the selection. */
export function runRegionOp(op: RegionOp): void {
    const ids = combinableIds();
    if (ids.length < 2) return;
    applyPathfinderRegion(ids, op);
}

/**
 * Pathfinder glyphs as inline SVG — two overlapping circles, differing only in which
 * regions are filled, the same visual language as Illustrator's Pathfinder panel.
 *
 * Knock-outs use `fill-rule="evenodd"` and SVG masks rather than painting the removed
 * area in the panel's background colour. That matters: the background-colour trick looks
 * right in one theme and silently fails in the other, which is exactly how the first
 * version of these icons broke in dark mode.
 */
const CIRCLE_A = 'M 1.5 8 a 6.5 6.5 0 1 0 13 0 a 6.5 6.5 0 1 0 -13 0';
const CIRCLE_B = 'M 11.5 8 a 6.5 6.5 0 1 0 13 0 a 6.5 6.5 0 1 0 -13 0';

const OpIcon: Component<{ op: BoolOp }> = (props) => {
    const uid = `bool-${props.op}`;
    return (
        <svg class="bool-op-icon" viewBox="0 0 26 16" width="26" height="16" aria-hidden="true">
            <defs>
                {/* Subtract: everything of A except where B covers it. */}
                <mask id={`${uid}-minus`}>
                    <path d={CIRCLE_A} fill="white" />
                    <path d={CIRCLE_B} fill="black" />
                </mask>
                {/* Intersect: only where B covers A. */}
                <mask id={`${uid}-and`}>
                    <path d={CIRCLE_B} fill="white" />
                </mask>
            </defs>

            <Show when={props.op === 'union'}>
                <path d={`${CIRCLE_A} ${CIRCLE_B}`} fill="currentColor" />
            </Show>

            <Show when={props.op === 'exclude'}>
                {/* One path, even-odd: the shared lens becomes a genuine hole. */}
                <path d={`${CIRCLE_A} ${CIRCLE_B}`} fill="currentColor" fill-rule="evenodd" />
            </Show>

            <Show when={props.op === 'subtract'}>
                <path d={CIRCLE_A} fill="currentColor" mask={`url(#${uid}-minus)`} />
                <path d={CIRCLE_B} fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45" />
            </Show>

            <Show when={props.op === 'intersect'}>
                <path d={CIRCLE_A} fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45" />
                <path d={CIRCLE_B} fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.45" />
                <path d={CIRCLE_A} fill="currentColor" mask={`url(#${uid}-and)`} />
            </Show>
        </svg>
    );
};

/** Persisted across appearances so the choice doesn't reset on every selection. */
const [keepEditable, setKeepEditable] = createSignal(false);
export const booleanKeepEditable = keepEditable;

/** Run a boolean op on the current selection — shared with the keyboard shortcuts. */
export function runBooleanOp(op: BoolOp): void {
    const ids = combinableIds();
    if (ids.length < 2) return;
    if (keepEditable()) makeCompoundShape(ids, op);
    else applyPathfinder(ids, op);
}

/**
 * Would a boolean op do anything with what's selected right now?
 *
 * Grouped artwork needs no special case: a group is a `groupIds` tag on ordinary
 * elements, not a container type, so selecting one already puts its members in
 * `store.selection`.
 */
export function canRunBooleanOp(): boolean {
    if (store.selection.length < 2) return false;
    return combinableIds().length >= 2;
}

const TOOLBAR_W = 268;
const TOOLBAR_H = 74;      // two rows
const TOP_LIMIT = 84;      // keep clear of the main toolbar
const GAP = 12;

export const BooleanOpsToolbar: Component = () => {
    /** Selection bounds in world space; null when the toolbar shouldn't show. */
    const bounds = createMemo(() => {
        // Opt-in: no strip unless it has been pinned open.
        if (!store.globalSettings.showPathfinderBar) return null;
        if (!canRunBooleanOp()) return null;
        // Any tool that owns the canvas (Shape Builder, Live Paint, knife, warp…) gets
        // the space to itself — a floating strip over the artwork would be in the way
        // exactly when you're working closely with it.
        if (store.shapeBuilderActive || store.livePaintActive || store.cutToolActive
            || store.puppetWarpActive || store.widthToolActive || store.curveToolActive
            || store.blobBrushActive || store.pathEraserActive || store.reshapeToolActive
            || store.appMode === 'presentation' || store.cropModeElementId) return null;

        const sel = store.elements.filter(e => store.selection.includes(e.id));
        if (sel.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const e of sel) {
            minX = Math.min(minX, e.x, e.x + e.width);
            maxX = Math.max(maxX, e.x, e.x + e.width);
            minY = Math.min(minY, e.y, e.y + e.height);
            maxY = Math.max(maxY, e.y, e.y + e.height);
        }
        return { minX, minY, maxX, maxY };
    });

    const pos = createMemo(() => {
        const b = bounds();
        if (!b) return null;
        const topMid = worldToScreen((b.minX + b.maxX) / 2, b.minY, currentViewport());
        const bottomMid = worldToScreen((b.minX + b.maxX) / 2, b.maxY, currentViewport());
        // Prefer above the selection; flip below when there isn't room, so the strip
        // never sits under the main toolbar at the top of the window.
        let top = topMid.y - GAP - TOOLBAR_H;
        if (top < TOP_LIMIT) top = bottomMid.y + GAP;
        // Then clamp into the viewport on BOTH axes. Clamping only the upper bound put the
        // toolbar off-screen whenever the selection sat near or past an edge — at negative
        // world coordinates it rendered at top:-507, and zoomed out at top:720 — which
        // looks exactly like "the tools don't appear" even though everything else is fine.
        // A malformed viewport yields NaN screen coords, and NaN slips through Math.max/min
        // untouched — the strip would then render at the browser's default position with no
        // clue why. Bail rather than draw something wrong.
        if (!Number.isFinite(top) || !Number.isFinite(topMid.x)) return null;
        const clampedTop = Math.max(TOP_LIMIT, Math.min(top, window.innerHeight - TOOLBAR_H - GAP));
        const left = Math.max(10, Math.min(topMid.x - TOOLBAR_W / 2, window.innerWidth - TOOLBAR_W - 10));
        return { top: clampedTop, left };
    });

    return (
        <Show when={pos()}>
            <div
                class="bool-ops-toolbar"
                style={{ top: `${pos()!.top}px`, left: `${pos()!.left}px`, width: `${TOOLBAR_W}px` }}
                role="toolbar"
                aria-label="Combine shapes"
                // The canvas clears the selection on pointer-down; without this, pressing a
                // button would deselect everything before the click ever resolved.
                onPointerDown={e => e.stopPropagation()}
            >
                <div class="bool-ops-row">
                <For each={OPS}>
                    {({ op, label, hint, keys }) => (
                        <button
                            class="bool-op-btn"
                            title={`${label} — ${hint}  (${keys})`}
                            aria-label={label}
                            onClick={() => runBooleanOp(op)}
                        >
                            <OpIcon op={op} />
                            <span class="bool-op-label">{label}</span>
                        </button>
                    )}
                </For>
                <button
                    class={`bool-op-keep ${keepEditable() ? 'on' : ''}`}
                    title={keepEditable()
                        ? 'Keep editable: makes a compound shape — the originals survive and the operation can be changed or released later'
                        : 'Destructive: replaces the selection with one merged path. Click to keep the originals editable instead.'}
                    aria-pressed={keepEditable()}
                    onClick={() => setKeepEditable(v => !v)}
                >
                    ❖
                </button>
                </div>

                {/* Region operations — Illustrator's second Pathfinder row. These split
                    the selection into pieces instead of combining it into one shape. */}
                <div class="bool-ops-row bool-ops-row-region">
                    <For each={REGION_OPS}>
                        {({ op, label, hint }) => (
                            <button
                                class="bool-region-btn"
                                title={`${label} — ${hint}`}
                                aria-label={label}
                                onClick={() => runRegionOp(op)}
                            >
                                {label}
                            </button>
                        )}
                    </For>
                </div>
            </div>
        </Show>
    );
};

export default BooleanOpsToolbar;
