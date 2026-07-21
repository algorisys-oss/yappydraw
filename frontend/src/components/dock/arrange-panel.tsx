/**
 * A dock-native Arrange panel — z-order (front/back) + flip. Body-only (chrome comes from
 * PanelChrome); operates on the current selection via the existing store actions. Part of the
 * dockable-panel system (Phase C).
 */
import { type Component, Show } from "solid-js";
import { store, bringToFront, sendToBack } from "../../store/app-store";
import { flipSelected } from "../../utils/object-context-actions";
import { BringToFront, SendToBack, FlipHorizontal2, FlipVertical2 } from "lucide-solid";

const DockArrangePanel: Component = () => {
    const sel = () => [...store.selection];
    const has = () => sel().length > 0;
    const row = {
        display: 'flex', 'align-items': 'center', gap: '8px', width: '100%', 'text-align': 'left',
        padding: '6px 8px', margin: '3px 0', cursor: 'pointer', background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)', 'border-radius': '5px', 'font-size': '12px',
        color: 'var(--text-primary, inherit)',
    } as any;
    return (
        <div style={{ padding: '8px' }}>
            <Show when={has()} fallback={<div style={{ opacity: '0.6', 'font-size': '12px', padding: '4px' }}>Select an object to arrange.</div>}>
                <button style={row} title="Bring to front" onClick={() => bringToFront(sel())}><BringToFront size={15} /> Bring to front</button>
                <button style={row} title="Send to back" onClick={() => sendToBack(sel())}><SendToBack size={15} /> Send to back</button>
                <button style={row} title="Flip horizontal" onClick={() => flipSelected('horizontal')}><FlipHorizontal2 size={15} /> Flip horizontal</button>
                <button style={row} title="Flip vertical" onClick={() => flipSelected('vertical')}><FlipVertical2 size={15} /> Flip vertical</button>
            </Show>
        </div>
    );
};

export default DockArrangePanel;
