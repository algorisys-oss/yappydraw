import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import { store, togglePuppetWarp, addPuppetPin, movePuppetPin, removePuppetPin } from '../store/app-store';
import { screenToWorld, worldToScreen } from '../utils/viewport-transforms';
import type { DrawingElement } from '../types';
import './puppet-warp-overlay.css';

/**
 * Puppet Warp. With one element selected, click on it to drop pins; drag a pin to bend the
 * mesh around it while the other pins anchor their regions (RBF-driven warp grid). Alt/right-
 * click a pin to remove it. Esc exits. Built on the envelope/mesh-warp render path.
 */
export const PuppetWarpOverlay = () => {
    const [drag, setDrag] = createSignal<number | null>(null);
    let dragging = false;

    // Puppet Warp deforms a vector outline (shapes/paths) or warps image pixels.
    // Text glyphs and connectors have nothing the mesh can bend, so gate them out.
    const NON_WARPABLE = new Set(['text', 'richtext', 'line', 'arrow', 'organicBranch']);
    const target = (): DrawingElement | undefined => store.elements.find(e => e.id === store.selection[0]);
    const warpable = (): boolean => { const el = target(); return !!el && !NON_WARPABLE.has(el.type); };
    const active = () => store.puppetWarpActive && warpable();
    // The tool is on but the selected element can't be warped — show a hint instead.
    const notice = () => store.puppetWarpActive && !!target() && !warpable();
    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    // Pin world position = element centre + pin (centred-local) rotated by el.angle.
    const pinWorld = (el: DrawingElement, p: { x: number; y: number }) => {
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        const a = el.angle || 0, cos = Math.cos(a), sin = Math.sin(a);
        return { x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos };
    };

    const hitPin = (el: DrawingElement, e: PointerEvent): number => {
        for (let i = (el.puppetPins?.length || 0) - 1; i >= 0; i--) {
            const w = pinWorld(el, el.puppetPins![i]);
            const s = worldToScreen(w.x, w.y, store.viewState as any);
            if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 12) return i;
        }
        return -1;
    };

    const onDown = (e: PointerEvent) => {
        if (!active()) return;
        e.preventDefault();
        const el = target()!;
        const idx = hitPin(el, e);
        if (idx >= 0) {
            if (e.altKey || e.button === 2) { removePuppetPin(el.id, idx); return; }
            movePuppetPin(el.id, idx, 0, 0, true); // snapshot history at grab (no-op move re-applies same pos)
            const cur = el.puppetPins![idx];
            const w = pinWorld(el, cur);
            movePuppetPin(el.id, idx, w.x, w.y); // keep position
            setDrag(idx); dragging = true;
            return;
        }
        // empty click on the element → add a pin
        const w = toWorld(e);
        if (w.x >= el.x - 4 && w.x <= el.x + el.width + 4 && w.y >= el.y - 4 && w.y <= el.y + el.height + 4) {
            const ni = addPuppetPin(el.id, w.x, w.y);
            setDrag(ni); dragging = true;
        }
    };
    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const el = target(); const idx = drag();
        if (!el || idx === null) return;
        const w = toWorld(e);
        movePuppetPin(el.id, idx, w.x, w.y);
    };
    const onUp = () => { dragging = false; setDrag(null); };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && store.puppetWarpActive) { e.preventDefault(); togglePuppetWarp(false); } };
        window.addEventListener('keydown', onKey);
        onCleanup(() => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); window.removeEventListener('keydown', onKey); });
    });

    const pinDots = () => {
        const el = target(); if (!el?.puppetPins) return [];
        return el.puppetPins.map((p, i) => { const w = pinWorld(el, p); const s = worldToScreen(w.x, w.y, store.viewState as any); return { ...s, i }; });
    };

    return (
        <>
        <Show when={notice()}>
            <div class="pw-notice">
                Puppet Warp works on shapes, paths &amp; images — not text or connectors.
                <button class="pw-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); togglePuppetWarp(false); }}>Done ✕</button>
            </div>
        </Show>
        <Show when={active()}>
            <div class="pw-overlay" onPointerDown={onDown} onContextMenu={(e) => e.preventDefault()}>
                <svg class="pw-svg">
                    <For each={pinDots()}>{(d) => <>
                        <circle cx={d.x} cy={d.y} r={7} class={drag() === d.i ? 'pw-pin pw-pin-active' : 'pw-pin'} />
                        <circle cx={d.x} cy={d.y} r={2} class="pw-pin-core" />
                    </>}</For>
                </svg>
                <div class="pw-hint">
                    Puppet Warp — click the shape to add pins · drag a pin to bend · Alt-click a pin to remove
                    <button class="pw-done" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); togglePuppetWarp(false); }}>Done ✕</button>
                </div>
            </div>
        </Show>
        </>
    );
};
