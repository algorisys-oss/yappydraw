import { type Component, createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Ban, Pipette, ArrowLeftRight, RotateCcw } from 'lucide-solid';
import {
    store, pushToHistory,
    setActivePaint, currentPaintColor, paintColorIsMixed, setPaintColor,
    swapFillStroke, resetPaintToDefaults, startColorEyedropper, isNoPaint,
    type PaintChannel,
} from '../store/app-store';
import { COLOR_PALETTES, getColorPalette } from '../config/color-palettes';
import { ColorPickerPro } from './color-picker-pro';
import { placeBesideAnchor } from '../utils/popover-placement';
import { t } from '../i18n';
import './fill-stroke-control.css';

/**
 * Fill & Stroke — the Illustrator swatch pair, in the tool column.
 *
 * Two overlapping squares showing what the selection (or, with nothing selected, the next
 * shape you draw) is painted with. Clicking one opens a panel that can set that channel's
 * colour, sample it off the canvas with the eyedropper, or take it away entirely.
 *
 * It exists because both of those last two were effectively unreachable: removing a stroke
 * meant scrolling the Properties panel, and the eyedropper was buried inside the Properties
 * colour picker — so sampling a colour from a reference image pasted on the canvas, the most
 * ordinary thing in the world, was a hunt (user feedback, Aug 2026).
 */

/** A CSS background that reads as "nothing here": the standard checkerboard. */
const CHECKER = 'repeating-conic-gradient(#c7ccd1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px';

export const FillStrokeControl: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    const [paletteId, setPaletteId] = createSignal<string>(store.globalSettings.colorPalette ?? 'p3');
    let anchorRef: HTMLDivElement | undefined;
    let popRef: HTMLDivElement | undefined;

    const channel = () => store.activePaint;
    const fill = () => currentPaintColor('fill');
    const stroke = () => currentPaintColor('stroke');
    const active = () => currentPaintColor(channel());
    const palette = () => getColorPalette(paletteId());

    // Close on an outside press or Esc. `pointerdown` (not click) so it closes on the same
    // gesture that starts an action elsewhere, matching the tool-group flyouts.
    createEffect(() => {
        if (!isOpen()) return;
        const away = (e: PointerEvent) => {
            const target = e.target as Node;
            if (anchorRef?.contains(target) || popRef?.contains(target)) return;
            setIsOpen(false);
        };
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('pointerdown', away);
        document.addEventListener('keydown', esc);
        onCleanup(() => {
            document.removeEventListener('pointerdown', away);
            document.removeEventListener('keydown', esc);
        });
    });

    /** Anchor the panel beside the swatch, flipping and clamping to stay on screen — the
     *  toolbar can be docked to any of the four edges, so neither "below" nor "to the right"
     *  is always right. The geometry lives in utils/popover-placement.ts, with its tests. */
    const popPosition = () => {
        const rect = anchorRef?.getBoundingClientRect();
        if (!rect) return {};
        // Must track the widths in fill-stroke-control.css, which is border-box for exactly
        // this reason: these numbers are what the clamp is done against.
        const width = window.innerWidth <= 600 ? Math.min(320, window.innerWidth - 24) : 248;
        const { left, top } = placeBesideAnchor(
            rect, width, 420, { width: window.innerWidth, height: window.innerHeight },
        );
        return { left: `${left}px`, top: `${top}px` };
    };

    const openOn = (c: PaintChannel) => {
        // Clicking the channel already open closes the panel; clicking the other one
        // switches to it rather than closing, which is what a second swatch is for.
        if (isOpen() && channel() === c) { setIsOpen(false); return; }
        setActivePaint(c);
        setIsOpen(true);
    };

    const apply = (color: string, history = true) => setPaintColor(channel(), color, undefined, history);

    const pick = () => {
        setIsOpen(false);
        startColorEyedropper((hex) => setPaintColor(channel(), hex));
    };

    const label = (c: PaintChannel) => {
        const col = c === 'fill' ? fill() : stroke();
        const shown = isNoPaint(col) ? t('fillStroke.none') : col;
        return `${c === 'fill' ? t('fillStroke.fill') : t('fillStroke.stroke')}: ${shown}${paintColorIsMixed(c) ? ` (${t('fillStroke.mixed')})` : ''}`;
    };

    return (
        <div class="fs-control" ref={el => anchorRef = el} title={t('fillStroke.tooltip')}>
            {/* Stroke sits behind and to the bottom-right, so its ring stays clickable
                where the fill square doesn't cover it — the Illustrator arrangement. */}
            <div
                class="fs-square fs-stroke"
                classList={{ active: channel() === 'stroke', 'fs-empty': isNoPaint(stroke()) }}
                style={isNoPaint(stroke()) ? undefined : { 'border-color': stroke() }}
                onPointerDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); openOn('stroke'); }}
                title={label('stroke')}
                role="button"
                aria-label={t('fillStroke.stroke')}
            />
            <div
                class="fs-square fs-fill"
                classList={{ active: channel() === 'fill', 'fs-empty': isNoPaint(fill()) }}
                style={{ background: isNoPaint(fill()) ? CHECKER : fill() }}
                onPointerDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); openOn('fill'); }}
                title={label('fill')}
                role="button"
                aria-label={t('fillStroke.fill')}
            />

            <Show when={isOpen()}>
                <Portal>
                    <div
                        class="fs-popover"
                        ref={el => popRef = el}
                        style={popPosition()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div class="fs-tabs">
                            <button
                                class="fs-tab"
                                classList={{ active: channel() === 'fill' }}
                                onClick={() => setActivePaint('fill')}
                            >
                                <span class="fs-chip" style={{ background: isNoPaint(fill()) ? CHECKER : fill() }} />
                                {t('fillStroke.fill')}
                            </button>
                            <button
                                class="fs-tab"
                                classList={{ active: channel() === 'stroke' }}
                                onClick={() => setActivePaint('stroke')}
                            >
                                <span class="fs-chip" style={{ background: isNoPaint(stroke()) ? CHECKER : stroke() }} />
                                {t('fillStroke.stroke')}
                            </button>
                        </div>

                        <div class="fs-actions">
                            <button class="fs-action" onClick={() => apply('transparent')} title={t('fillStroke.noneTip')}>
                                <Ban size={14} /><span>{t('fillStroke.none')}</span>
                            </button>
                            <button class="fs-action" onClick={pick} title={t('fillStroke.pickTip')}>
                                <Pipette size={14} /><span>{t('fillStroke.pick')}</span>
                            </button>
                            <button class="fs-action" onClick={() => swapFillStroke()} title={t('fillStroke.swapTip')}>
                                <ArrowLeftRight size={14} /><span>{t('fillStroke.swap')}</span>
                            </button>
                            <button class="fs-action" onClick={() => resetPaintToDefaults()} title={t('fillStroke.resetTip')}>
                                <RotateCcw size={14} /><span>{t('fillStroke.reset')}</span>
                            </button>
                        </div>

                        <select
                            class="fs-palette-select"
                            value={paletteId()}
                            onChange={(e) => setPaletteId(e.currentTarget.value)}
                        >
                            <For each={COLOR_PALETTES}>{(p) => <option value={p.id}>{p.name}</option>}</For>
                        </select>

                        <div class="fs-swatches">
                            <For each={palette().swatches}>
                                {(sw) => (
                                    <button
                                        class="fs-swatch"
                                        classList={{ selected: sw.value === active() }}
                                        style={{ background: sw.value === 'transparent' ? CHECKER : sw.value }}
                                        title={sw.label}
                                        onClick={() => apply(sw.value)}
                                    />
                                )}
                            </For>
                        </div>

                        <Show when={store.swatches.length > 0}>
                            <div class="fs-section-label">{t('fillStroke.saved')}</div>
                            <div class="fs-swatches">
                                <For each={store.swatches}>
                                    {(sw) => (
                                        <button
                                            class="fs-swatch"
                                            classList={{ selected: sw.color === active() }}
                                            style={{ background: sw.color }}
                                            title={sw.name}
                                            onClick={() => apply(sw.color)}
                                        />
                                    )}
                                </For>
                            </div>
                        </Show>

                        <ColorPickerPro
                            value={isNoPaint(active()) ? '#000000' : active()}
                            onStart={() => { if (store.selection.length) pushToHistory(); }}
                            onChange={(hex) => apply(hex, false)}
                        />
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default FillStrokeControl;
