/**
 * A dock-native Align & Distribute panel. Body-only (chrome comes from PanelChrome). Operates on
 * the current selection via the same store actions the context menu / properties use. Part of the
 * dockable-panel system (Phase C — a second registered panel so the dock is genuinely multi-panel).
 */
import { type Component, Show, For } from "solid-js";
import { store, alignSelectedElements, distributeSelectedElements } from "../../store/app-store";
import {
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
    AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
} from "lucide-solid";

const DockAlignPanel: Component = () => {
    const count = () => store.selection.length;
    const enough = () => count() >= 2;
    const cell = {
        display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
        width: '100%', height: '30px', cursor: 'pointer', background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', 'border-radius': '5px', color: 'var(--text-color, inherit)',
    } as any;
    const aligns: { type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'; icon: any; title: string }[] = [
        { type: 'left', icon: AlignStartVertical, title: 'Align left' },
        { type: 'center', icon: AlignCenterVertical, title: 'Align center (horizontal)' },
        { type: 'right', icon: AlignEndVertical, title: 'Align right' },
        { type: 'top', icon: AlignStartHorizontal, title: 'Align top' },
        { type: 'middle', icon: AlignCenterHorizontal, title: 'Align middle (vertical)' },
        { type: 'bottom', icon: AlignEndHorizontal, title: 'Align bottom' },
    ];
    return (
        <div style={{ padding: '8px' }}>
            <Show when={enough()} fallback={<div style={{ opacity: '0.6', 'font-size': '12px', padding: '4px' }}>Select 2+ objects to align or distribute.</div>}>
                <div style={{ display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: '4px' }}>
                    <For each={aligns}>{(a) => (
                        <button style={cell} title={a.title} onClick={() => alignSelectedElements(a.type)}><a.icon size={15} /></button>
                    )}</For>
                </div>
                <div style={{ 'margin-top': '8px', display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '4px' }}>
                    <button style={cell} title="Distribute horizontally" onClick={() => distributeSelectedElements('horizontal')}><AlignHorizontalDistributeCenter size={15} /></button>
                    <button style={cell} title="Distribute vertically" onClick={() => distributeSelectedElements('vertical')}><AlignVerticalDistributeCenter size={15} /></button>
                </div>
            </Show>
        </div>
    );
};

export default DockAlignPanel;
