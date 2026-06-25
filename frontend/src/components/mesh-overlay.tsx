import { Show, For, createMemo, createSignal, onMount, onCleanup } from 'solid-js';
import { store, setMeshNodeColor, setMeshNodePosition, toggleMeshEdit, pushToHistory } from '../store/app-store';
import { worldToScreen, screenToWorld } from '../utils/viewport-transforms';
import { meshIndex, meshNodePos } from '../utils/mesh-gradient';
import './mesh-overlay.css';

/**
 * Gradient-mesh on-canvas editor. While `store.meshEditActive` and a single
 * element with a `meshGradient` is selected, this overlays the node grid on the
 * shape: dashed grid lines plus one dot per node. Drag a dot to reposition it
 * (warps the mesh); click a dot (no drag) to recolour it. Node positions map
 * through the element's own angle/flip/shear/scale so the dots sit exactly on
 * the rendered shape; the inverse map turns a drag back into a normalized
 * position.
 */
export const MeshOverlay = () => {
    let colorInput: HTMLInputElement | undefined;
    const [pendingColorNode, setPendingColorNode] = createSignal<{ r: number; c: number } | null>(null);

    const target = () => {
        if (!store.meshEditActive) return null;
        if (store.selection.length !== 1) return null;
        const el = store.elements.find(e => e.id === store.selection[0]);
        return el?.meshGradient ? el : null;
    };

    // Transform context: element centre + the 2×2 matrix M (and its inverse) that
    // maps an element-local offset to world space, matching the render pipeline.
    const ctx = createMemo(() => {
        const el = target();
        if (!el) return null;
        const angle = el.angle || 0;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const fx = el.flipX ? -1 : 1, fy = el.flipY ? -1 : 1;
        const sx = el.shearX || 0, sy = el.shearY || 0;
        const rs = (el.renderScale !== undefined && el.renderScale !== 1) ? el.renderScale : 1;
        // Apply the render transform order (scale → shear → flip → rotate) to a vector.
        const apply = (vx: number, vy: number) => {
            const ax = vx * rs, ay = vy * rs;
            const shx = ax + sx * ay, shy = sy * ax + ay;
            const flx = shx * fx, fly = shy * fy;
            return { x: flx * cos - fly * sin, y: flx * sin + fly * cos };
        };
        const e1 = apply(1, 0), e2 = apply(0, 1);
        const M = { a: e1.x, b: e1.y, c: e2.x, d: e2.y }; // columns are M·(1,0), M·(0,1)
        const det = M.a * M.d - M.c * M.b;
        const Minv = Math.abs(det) > 1e-9 ? { a: M.d / det, b: -M.b / det, c: -M.c / det, d: M.a / det } : null;
        return { el, mesh: el.meshGradient!, cx: el.x + el.width / 2, cy: el.y + el.height / 2, width: el.width, height: el.height, M, Minv };
    });

    const normToScreen = (nx: number, ny: number) => {
        const t = ctx()!;
        const lx = (nx - 0.5) * t.width, ly = (ny - 0.5) * t.height;
        const wx = t.cx + (t.M.a * lx + t.M.c * ly);
        const wy = t.cy + (t.M.b * lx + t.M.d * ly);
        return worldToScreen(wx, wy, store.viewState as any);
    };

    const screenToNorm = (sx: number, sy: number) => {
        const t = ctx();
        if (!t || !t.Minv) return null;
        const w = screenToWorld(sx, sy, store.viewState as any);
        const dx = w.x - t.cx, dy = w.y - t.cy;
        const lx = t.Minv.a * dx + t.Minv.c * dy;
        const ly = t.Minv.b * dx + t.Minv.d * dy;
        return { x: lx / t.width + 0.5, y: ly / t.height + 0.5 };
    };

    const nodes = createMemo(() => {
        const t = ctx();
        if (!t) return null;
        const mesh = t.mesh;
        const out: { r: number; c: number; x: number; y: number; color: string }[] = [];
        for (let r = 0; r < mesh.rows; r++) {
            for (let c = 0; c < mesh.cols; c++) {
                const p = meshNodePos(mesh, r, c);
                const sp = normToScreen(p.x, p.y);
                out.push({ r, c, x: sp.x, y: sp.y, color: mesh.colors[meshIndex(mesh, r, c)] || '#000000' });
            }
        }
        return { rows: mesh.rows, cols: mesh.cols, pts: out };
    });

    const gridLines = createMemo(() => {
        const n = nodes();
        if (!n) return [];
        const at = (r: number, c: number) => n.pts[r * n.cols + c];
        const lines: string[] = [];
        for (let r = 0; r < n.rows; r++) {
            const pts: string[] = [];
            for (let c = 0; c < n.cols; c++) { const p = at(r, c); pts.push(`${p.x},${p.y}`); }
            lines.push(pts.join(' '));
        }
        for (let c = 0; c < n.cols; c++) {
            const pts: string[] = [];
            for (let r = 0; r < n.rows; r++) { const p = at(r, c); pts.push(`${p.x},${p.y}`); }
            lines.push(pts.join(' '));
        }
        return lines;
    });

    // ── Drag / click-to-recolour ───────────────────────────────────────────────
    let drag: { r: number; c: number; sx: number; sy: number; moved: boolean } | null = null;

    const onNodeDown = (node: { r: number; c: number }, e: PointerEvent) => {
        e.preventDefault(); e.stopPropagation();
        drag = { r: node.r, c: node.c, sx: e.clientX, sy: e.clientY, moved: false };
    };

    const onMove = (e: PointerEvent) => {
        if (!drag) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 3) return;
        if (!drag.moved) { pushToHistory(); drag.moved = true; }
        const n = screenToNorm(e.clientX, e.clientY);
        if (n) setMeshNodePosition([store.selection[0]], drag.r, drag.c, n.x, n.y, false);
    };

    const openColorPicker = (node: { r: number; c: number }, color: string) => {
        if (!colorInput) return;
        setPendingColorNode({ r: node.r, c: node.c });
        colorInput.value = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#000000';
        colorInput.click();
    };

    const onUp = (e: PointerEvent) => {
        if (!drag) return;
        const d = drag; drag = null;
        if (!d.moved) {
            // A click (no drag) → recolour this node.
            const n = nodes();
            const node = n?.pts.find(p => p.r === d.r && p.c === d.c);
            openColorPicker(d, node?.color || '#000000');
            e.stopPropagation();
        }
    };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', () => { drag = null; });
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        });
    });

    return (
        <Show when={nodes()}>
            <div class="mesh-overlay" onDblClick={() => toggleMeshEdit(false)} title="Gradient mesh — drag a node to reshape, click to recolour. Double-click background to exit.">
                <svg class="mesh-overlay-svg">
                    <For each={gridLines()}>
                        {(pts) => <polyline points={pts} fill="none" stroke="rgba(99,102,241,0.9)" stroke-width="1" stroke-dasharray="4 3" />}
                    </For>
                </svg>
                <For each={nodes()!.pts}>
                    {(node) => (
                        <div
                            class="mesh-node"
                            style={{ left: `${node.x}px`, top: `${node.y}px`, background: node.color }}
                            title={`Node (${node.r}, ${node.c}) — drag to move · click to recolour`}
                            onPointerDown={(e) => onNodeDown(node, e)}
                        />
                    )}
                </For>
                {/* Hidden colour input opened on a node click (no drag). */}
                <input
                    ref={colorInput}
                    type="color"
                    class="mesh-color-input"
                    onInput={(e) => {
                        const p = pendingColorNode();
                        if (p) setMeshNodeColor([store.selection[0]], p.r, p.c, e.currentTarget.value);
                    }}
                />
            </div>
        </Show>
    );
};
