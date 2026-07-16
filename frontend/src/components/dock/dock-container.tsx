/**
 * Dock container + shared panel chrome. Renders the left/right dock zones (resizable stacks of
 * docked panels) and any floating panels, driven by the `dock-layout` store. The chrome (title bar)
 * offers Dock-left / Dock-right / Float / Collapse / Close.
 *
 * Phase B — drag-to-dock: grab any panel's title bar and drag it; a docked panel tears out into a
 * floating one and follows the cursor, and live drop indicators light up the left/right edges when
 * the pointer nears them. Release over a lit edge docks the panel there; release anywhere else
 * leaves it floating. The opaque dock zones sit above the canvas, so the canvas never receives
 * pointer events under a dock (drawing-under is prevented). See docs/dockable-panel-system-plan.md.
 */
import { type Component, For, Show, Suspense, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { X, ChevronDown, ChevronUp, PanelRight, PanelLeft, PictureInPicture2 } from "lucide-solid";
import {
    dockLayout, panelState, dockedPanels, hidePanel, dockPanel, dockPanelAt, floatPanel, setFloatPos, toggleCollapse, setZoneWidth,
    type DockZone,
} from "../../store/dock-layout";
import { panelDef } from "./panel-registry";
import "./dock.css";

/** How close (px) to an edge the pointer must come for that edge to become a drop target. */
const EDGE_THRESHOLD = 96;

// Shared drag state (module singletons — one drag at a time). `dragId` is the panel being dragged;
// `dropZone` is the edge currently armed as a drop target (drives the indicator + the release).
const [dragId, setDragId] = createSignal<string | null>(null);
const [dropZone, setDropZone] = createSignal<DockZone | null>(null);

// Which zone a drop at `clientX` targets. A bare edge uses EDGE_THRESHOLD (dock a new panel);
// an already-populated zone uses its full width so dragging *within* it reorders (the title bar of
// a right-docked panel sits at the zone's inner edge, nowhere near the screen edge).
function edgeAt(clientX: number): DockZone | null {
    const leftReach = dockedPanels('left').length ? Math.max(EDGE_THRESHOLD, dockLayout.leftWidth) : EDGE_THRESHOLD;
    const rightReach = dockedPanels('right').length ? Math.max(EDGE_THRESHOLD, dockLayout.rightWidth) : EDGE_THRESHOLD;
    if (clientX <= leftReach) return 'left';
    if (clientX >= window.innerWidth - rightReach) return 'right';
    return null;
}

/** Insert index within a zone's stack for a drop at `clientY` (by each docked panel's midpoint). */
function insertIndexAt(zone: DockZone, clientY: number, draggedId: string): number {
    const col = document.querySelector(`.dock-zone-${zone} .dock-zone-scroll`);
    if (!col) return dockedPanels(zone).length;
    const panels = Array.from(col.querySelectorAll('.dock-panel[data-panel-id]'))
        .filter((n) => (n as HTMLElement).dataset.panelId !== draggedId) as HTMLElement[];
    let idx = 0;
    for (const el of panels) {
        const r = el.getBoundingClientRect();
        if (clientY > r.top + r.height / 2) idx++;
        else break;
    }
    return idx;
}

const PanelChrome: Component<{ id: string; floating?: boolean }> = (props) => {
    const def = () => panelDef(props.id);
    const st = () => panelState(props.id);

    const onTitleDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest('button')) return; // let action buttons work
        e.preventDefault();
        const startedDocked = !props.floating;
        // Offset of the pointer within the title bar, so the panel doesn't jump under the cursor.
        const grabDX = 30, grabDY = 12;
        let floated = props.floating === true;
        const start = { x: e.clientX, y: e.clientY };

        const move = (ev: PointerEvent) => {
            const movedFar = Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4;
            if (!floated && startedDocked && movedFar) {
                // Tear the docked panel out into a floating one that follows the cursor.
                floatPanel(props.id, ev.clientX - grabDX, ev.clientY - grabDY);
                floated = true;
                setDragId(props.id);
            }
            if (floated) {
                setFloatPos(props.id, ev.clientX - grabDX, ev.clientY - grabDY);
                setDropZone(edgeAt(ev.clientX));
            }
        };
        const up = (ev: PointerEvent) => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            const zone = floated ? edgeAt(ev.clientX) : null;
            // Dock at the slot under the cursor so dragging over a populated zone reorders it.
            if (zone) dockPanelAt(props.id, zone, insertIndexAt(zone, ev.clientY, props.id));
            setDragId(null);
            setDropZone(null);
        };

        // A floating panel is draggable immediately; a docked one only after it tears out (movedFar).
        if (props.floating) { setDragId(props.id); }
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    return (
        <Show when={def()}>
            <div class="dock-panel" classList={{ dragging: dragId() === props.id }} data-panel-id={props.id}>
                <div class="dock-panel-title draggable" onPointerDown={onTitleDown}>
                    <span class="dock-panel-name">{def()!.title}</span>
                    <div class="dock-panel-actions">
                        <button title="Dock left" onClick={() => dockPanel(props.id, 'left')}><PanelLeft size={13} /></button>
                        <button title="Dock right" onClick={() => dockPanel(props.id, 'right')}><PanelRight size={13} /></button>
                        <button title="Float" onClick={() => floatPanel(props.id)}><PictureInPicture2 size={13} /></button>
                        <button title={st().collapsed ? 'Expand' : 'Collapse'} onClick={() => toggleCollapse(props.id)}>
                            {st().collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        </button>
                        <button title="Close" onClick={() => hidePanel(props.id)}><X size={13} /></button>
                    </div>
                </div>
                <Show when={!st().collapsed}>
                    {/* Per-panel Suspense: panel bodies are lazy()-loaded. Without a boundary here,
                        a panel's first-open suspension bubbled up to app.tsx's single shared
                        <Suspense fallback={null}>, which blanked the ENTIRE chrome (toolbar, dock,
                        property panel, status bar) for a frame — the "screen refreshes on first
                        Alt+L" flash. Scoping it here keeps the rest of the UI mounted. */}
                    <div class="dock-panel-body">
                        <Suspense fallback={<div class="dock-panel-loading" />}>
                            <Dynamic component={def()!.component} />
                        </Suspense>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

const DockZoneColumn: Component<{ zone: 'left' | 'right' }> = (props) => {
    const ids = () => dockedPanels(props.zone);
    const width = () => (props.zone === 'left' ? dockLayout.leftWidth : dockLayout.rightWidth);
    const onResize = (e: PointerEvent) => {
        e.preventDefault();
        const startX = e.clientX, startW = width();
        const move = (ev: PointerEvent) => {
            const dx = ev.clientX - startX;
            setZoneWidth(props.zone, props.zone === 'left' ? startW + dx : startW - dx);
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };
    return (
        <Show when={ids().length}>
            <div class={`dock-zone dock-zone-${props.zone}`} style={{ width: `${width()}px` }}>
                <div class="dock-zone-scroll">
                    <For each={ids()}>{(id) => <PanelChrome id={id} />}</For>
                </div>
                <div class={`dock-zone-resize dock-zone-resize-${props.zone}`} onPointerDown={onResize} title="Drag to resize" />
            </div>
        </Show>
    );
};

export const DockContainer: Component = () => {
    const floating = () => Object.entries(dockLayout.panels).filter(([, s]) => s.mode === 'floating').map(([id]) => id);
    return (
        <>
            <DockZoneColumn zone="left" />
            <DockZoneColumn zone="right" />
            <For each={floating()}>{(id) => {
                const st = () => panelState(id);
                return (
                    <div class="dock-floating" style={{ left: `${st().floatX ?? 260}px`, top: `${st().floatY ?? 120}px` }}>
                        <PanelChrome id={id} floating />
                    </div>
                );
            }}</For>

            {/* Drag-to-dock drop indicators — shown while a panel is being dragged. */}
            <Show when={dragId()}>
                <div class="dock-drop-hint dock-drop-hint-left" classList={{ active: dropZone() === 'left' }}
                    style={{ width: `${dockLayout.leftWidth}px` }} aria-hidden="true" />
                <div class="dock-drop-hint dock-drop-hint-right" classList={{ active: dropZone() === 'right' }}
                    style={{ width: `${dockLayout.rightWidth}px` }} aria-hidden="true" />
            </Show>
        </>
    );
};

export default DockContainer;
