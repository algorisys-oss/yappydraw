import { Show, For, createMemo } from 'solid-js';
import { store, setMeshNodeColor, toggleMeshEdit } from '../store/app-store';
import { worldToScreen } from '../utils/viewport-transforms';
import { meshIndex } from '../utils/mesh-gradient';
import './mesh-overlay.css';

/**
 * Gradient-mesh on-canvas editor. While `store.meshEditActive` and a single
 * element with a `meshGradient` is selected, this overlays the node grid on the
 * shape: grid lines plus one colour-swatch dot per node. Clicking a dot opens
 * the colour picker and recolours that node live. Node positions are derived
 * from the element's box (even grid), transformed by the element's own
 * angle/flip/shear/scale so the dots sit exactly on the rendered shape.
 */
export const MeshOverlay = () => {
    const target = () => {
        if (!store.meshEditActive) return null;
        if (store.selection.length !== 1) return null;
        const el = store.elements.find(e => e.id === store.selection[0]);
        return el?.meshGradient ? el : null;
    };

    // Screen positions of every node, row-major. Recomputes on viewState / element change.
    const nodes = createMemo(() => {
        const el = target();
        if (!el) return null;
        const mesh = el.meshGradient!;
        const { x, y, width, height } = el;
        const angle = el.angle || 0;
        const cx = x + width / 2, cy = y + height / 2;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const fx = el.flipX ? -1 : 1, fy = el.flipY ? -1 : 1;
        const sx = el.shearX || 0, sy = el.shearY || 0;
        const rs = (el.renderScale !== undefined && el.renderScale !== 1) ? el.renderScale : 1;
        const vp = store.viewState as any;

        const out: { r: number; c: number; x: number; y: number; color: string }[] = [];
        for (let r = 0; r < mesh.rows; r++) {
            for (let c = 0; c < mesh.cols; c++) {
                // local offset from the element centre
                let lx = (mesh.cols > 1 ? c / (mesh.cols - 1) : 0.5) * width - width / 2;
                let ly = (mesh.rows > 1 ? r / (mesh.rows - 1) : 0.5) * height - height / 2;
                // Match the render transform order (applied to the point): scale → shear → flip → rotate.
                lx *= rs; ly *= rs;
                const shx = lx + sx * ly, shy = sy * lx + ly;
                const fxv = shx * fx, fyv = shy * fy;
                const wx = cx + (fxv * cos - fyv * sin);
                const wy = cy + (fxv * sin + fyv * cos);
                const p = worldToScreen(wx, wy, vp);
                out.push({ r, c, x: p.x, y: p.y, color: mesh.colors[meshIndex(mesh, r, c)] || '#000000' });
            }
        }
        return { rows: mesh.rows, cols: mesh.cols, pts: out };
    });

    // Polyline strings for the grid (rows + columns) connecting node centres.
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

    return (
        <Show when={nodes()}>
            <div class="mesh-overlay" onDblClick={() => toggleMeshEdit(false)} title="Gradient mesh — click a node to recolour. Double-click background to exit.">
                <svg class="mesh-overlay-svg">
                    <For each={gridLines()}>
                        {(pts) => <polyline points={pts} fill="none" stroke="rgba(99,102,241,0.9)" stroke-width="1" stroke-dasharray="4 3" />}
                    </For>
                </svg>
                <For each={nodes()!.pts}>
                    {(node) => (
                        <input
                            type="color"
                            class="mesh-node"
                            style={{ left: `${node.x}px`, top: `${node.y}px` }}
                            value={node.color}
                            title={`Node (${node.r}, ${node.c}) — click to recolour`}
                            onInput={(e) => setMeshNodeColor([store.selection[0]], node.r, node.c, e.currentTarget.value)}
                        />
                    )}
                </For>
            </div>
        </Show>
    );
};
