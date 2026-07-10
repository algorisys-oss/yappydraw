/**
 * Dock container + shared panel chrome (Phase A). Renders the left/right dock zones (resizable
 * stacks of docked panels) and any floating panels, driven by the `dock-layout` store. The chrome
 * (title bar) offers Dock-left / Dock-right / Float / Collapse / Close. Drag-to-dock with drop
 * indicators, and reserving canvas space, come in Phase B — for now the zones overlay the canvas
 * edge. See docs/dockable-panel-system-plan.md.
 */
import { type Component, For, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { X, ChevronDown, ChevronUp, PanelRight, PanelLeft, PictureInPicture2 } from "lucide-solid";
import {
    dockLayout, panelState, dockedPanels, hidePanel, dockPanel, floatPanel, setFloatPos, toggleCollapse, setZoneWidth,
} from "../../store/dock-layout";
import { panelDef } from "./panel-registry";
import "./dock.css";

const PanelChrome: Component<{ id: string; floating?: boolean }> = (props) => {
    const def = () => panelDef(props.id);
    const st = () => panelState(props.id);
    let s = { x: 0, y: 0, px: 0, py: 0 };
    const [drag, setDrag] = createSignal(false);

    const onTitleDown = (e: PointerEvent) => {
        if (!props.floating) return;
        if ((e.target as HTMLElement).closest('button')) return; // let action buttons work
        s = { x: e.clientX, y: e.clientY, px: st().floatX ?? 140, py: st().floatY ?? 120 };
        setDrag(true);
        const move = (ev: PointerEvent) => { if (drag()) setFloatPos(props.id, s.px + (ev.clientX - s.x), s.py + (ev.clientY - s.y)); };
        const up = () => { setDrag(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    return (
        <Show when={def()}>
            <div class="dock-panel">
                <div class="dock-panel-title" classList={{ draggable: !!props.floating }} onPointerDown={onTitleDown}>
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
                    <div class="dock-panel-body"><Dynamic component={def()!.component} /></div>
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
        const start = { x: e.clientX, w: width() };
        const move = (ev: PointerEvent) => {
            const dx = ev.clientX - start.x;
            setZoneWidth(props.zone, props.zone === 'left' ? start.w + dx : start.w - dx);
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
                    <div class="dock-floating" style={{ left: `${st().floatX ?? 140}px`, top: `${st().floatY ?? 120}px` }}>
                        <PanelChrome id={id} floating />
                    </div>
                );
            }}</For>
        </>
    );
};

export default DockContainer;
