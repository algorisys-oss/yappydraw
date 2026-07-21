/**
 * A dock-native Effects panel — the pilot panel for the dockable-panel system. It renders only
 * its BODY (the chrome comes from PanelChrome), so it can live in a dock zone or float. Applies
 * the live effects to the current selection; fine-tuning happens in the property panel's
 * per-effect sections.
 */
import { type Component, Show } from "solid-js";
import { store, setTransformEffect, setExtrude, toggleRevolve, applyGlow, applyFeather, applyScribble } from "../../store/app-store";

const DockEffectsPanel: Component = () => {
    const sel = () => [...store.selection];
    const has = () => sel().length > 0;
    const btn = {
        display: 'block', width: '100%', 'text-align': 'left', padding: '6px 8px', margin: '3px 0',
        cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        'border-radius': '5px', 'font-size': '12px', color: 'var(--text-primary, inherit)',
    } as any;
    return (
        <div style={{ padding: '8px' }}>
            <Show when={has()} fallback={<div style={{ opacity: '0.6', 'font-size': '12px', padding: '4px' }}>Select an object to apply an effect.</div>}>
                <button style={btn} onClick={() => setTransformEffect(sel(), { copies: 12, rotate: 24, scaleX: 0.9, scaleY: 0.9 })}>❋ Transform effect (spiral)</button>
                <button style={btn} onClick={() => setExtrude(sel(), { depth: 32, angle: 135 })}>⬗ 3D Extrude</button>
                <button style={btn} onClick={() => setExtrude(sel(), { depth: 40, angle: 135, bevel: 10 })}>◇ 3D Bevel</button>
                <button style={btn} onClick={() => toggleRevolve(sel(), true)}>◉ 3D Revolve (lathe)</button>
                <button style={btn} onClick={() => applyGlow(sel(), { blur: 14 })}>☀ Outer Glow</button>
                <button style={btn} onClick={() => applyFeather(sel(), 12)}>☁ Feather (soft edge)</button>
                <button style={btn} onClick={() => applyScribble(sel(), {})}>✎ Scribble fill</button>
                <div style={{ opacity: '0.6', 'font-size': '10px', 'margin-top': '6px' }}>Fine-tune in the Properties panel (each effect has its own sliders).</div>
            </Show>
        </div>
    );
};

export default DockEffectsPanel;
