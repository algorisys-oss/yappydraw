/**
 * Rows & Columns dialog — layout guides (Affinity's Margins & Guides, Illustrator's
 * Split into Grid → Add Guides).
 *
 * Divides the selection, the active artboard or the current page into columns and rows with
 * gutters and margins, and turns the edges into ordinary ruler guides. Docked to the right
 * with no backdrop, like the Mandala dialog, so the preview on the page stays visible while
 * you tune it. The preview is an SVG overlay: nothing is written to the store until Apply.
 *
 * Lengths are entered in the grid's unit (Properties ▸ Grid ▸ Unit) and converted to world px.
 */
import { createSignal, createMemo, Show, For, batch } from 'solid-js';
import { store, addLayoutGuides, resolveLayoutGuideTarget, type LayoutGuideTarget } from '../store/app-store';
import { layoutCells, DEFAULT_LAYOUT_GRID, type LayoutGridSpec } from '../utils/layout-guides';
import { gridUnitToPx, pxToGridUnit } from '../utils/grid-lattice';
import { worldToWindow, windowToWorld, canvasOrigin, canvasSize } from '../utils/overlay-transform';
import { onEscapeKey } from '../utils/use-escape';
import { showToast } from './toast';
import { t } from '../i18n';

const [isOpen, setIsOpen] = createSignal(false);
const [target, setTarget] = createSignal<LayoutGuideTarget | null>(null);

/** The visible drawing area in world coordinates — the fallback on a bare infinite canvas. */
const visibleArea = (): LayoutGuideTarget => {
    const o = canvasOrigin(), s = canvasSize();
    const a = windowToWorld(o.x, o.y), b = windowToWorld(o.x + s.w, o.y + s.h);
    return {
        kind: 'page', label: t('gridPanel.dlgVisible'),
        rect: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) },
    };
};

export const openLayoutGuidesDialog = () => {
    // Resolve the target once, on open: clicking about on the canvas while the dialog is up
    // shouldn't silently retarget it.
    setTarget(resolveLayoutGuideTarget() ?? visibleArea());
    setIsOpen(true);
};
export const layoutGuidesDialogOpen = isOpen;

export const LayoutGuidesDialog = () => {
    onEscapeKey(isOpen, () => setIsOpen(false));
    // Stored in px so switching the grid unit never rounds the values away.
    const [spec, setSpec] = createSignal<LayoutGridSpec>({ ...DEFAULT_LAYOUT_GRID });
    const [linkMargins, setLinkMargins] = createSignal(true);
    const [replace, setReplace] = createSignal(false);

    const unit = () => store.gridSettings.unit ?? 'px';
    const shown = (px: number) => pxToGridUnit(px, unit());
    const patch = (p: Partial<LayoutGridSpec>) => setSpec(s => ({ ...s, ...p }));
    const setLen = (key: keyof LayoutGridSpec, raw: string) => {
        const v = parseFloat(raw);
        if (!Number.isFinite(v) || v < 0) return;
        const px = gridUnitToPx(v, unit());
        if (linkMargins() && key.startsWith('margin')) {
            patch({ marginTop: px, marginRight: px, marginBottom: px, marginLeft: px });
        } else {
            patch({ [key]: px } as Partial<LayoutGridSpec>);
        }
    };
    const setCount = (key: 'columns' | 'rows', raw: string) => {
        const v = parseInt(raw, 10);
        if (Number.isFinite(v) && v >= 1) patch({ [key]: Math.min(200, v) } as Partial<LayoutGridSpec>);
    };

    const cells = createMemo(() => {
        const tgt = target();
        return tgt ? layoutCells(tgt.rect, spec()) : { columns: [], rows: [] };
    });

    // Preview in window coordinates. Reads the view so it follows pan/zoom while open.
    const rectOnScreen = (x0: number, y0: number, x1: number, y1: number) => {
        store.viewState.scale; store.viewState.panX; store.viewState.panY;
        const a = worldToWindow(x0, y0), b = worldToWindow(x1, y1);
        return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
    };

    const close = () => setIsOpen(false);
    const apply = () => {
        const tgt = target();
        if (!tgt) { close(); return; }
        const ids = addLayoutGuides(spec(), { rect: tgt.rect, replace: replace() });
        if (ids.length) {
            showToast(t('gridPanel.dlgAdded', { count: ids.length }), 'success');
            close();
        }
    };

    const label = { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '8px', 'font-size': '12px' } as const;
    const num = { width: '64px', padding: '3px 5px', 'border-radius': '5px', border: '1px solid var(--border-color, #d1d5db)', background: 'var(--bg-secondary, #fff)', color: 'inherit', 'font-size': '12px' } as const;
    const section = { 'font-size': '11px', 'font-weight': 600, opacity: 0.7, 'margin-top': '4px', 'text-transform': 'uppercase', 'letter-spacing': '0.04em' } as const;

    return (
        <Show when={isOpen()}>
            {/* Preview — above the canvas, below the dialog, never interactive. */}
            <svg width="100%" height="100%" data-testid="layout-guides-preview"
                style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', 'z-index': 19990, overflow: 'visible' }}>
                <Show when={target()}>{(tgt) => {
                    const r = () => rectOnScreen(tgt().rect.x, tgt().rect.y, tgt().rect.x + tgt().rect.width, tgt().rect.y + tgt().rect.height);
                    return <rect x={r().x} y={r().y} width={r().w} height={r().h} fill="none" stroke="#16b9c9" stroke-dasharray="4 3" />;
                }}</Show>
                <For each={cells().columns}>{([x0, x1]) => (
                    <For each={cells().rows}>{([y0, y1]) => {
                        const r = () => rectOnScreen(x0, y0, x1, y1);
                        return <rect x={r().x} y={r().y} width={r().w} height={r().h} fill="rgba(236,72,153,0.16)" stroke="#16b9c9" stroke-width="1" />;
                    }}</For>
                )}</For>
            </svg>

            <div role="dialog" aria-label={t('gridPanel.dlgAria')} data-testid="layout-guides-dialog"
                style={{
                    position: 'fixed', top: '72px', right: '16px', width: '260px', 'z-index': 20000,
                    background: 'var(--bg-panel, #fff)', color: 'var(--text-primary, #1f2937)',
                    'border-radius': '12px', padding: '14px', 'box-shadow': '0 12px 40px rgba(0,0,0,0.25)',
                    display: 'flex', 'flex-direction': 'column', gap: '8px',
                }}>
                <div style={{ 'font-weight': 600, 'font-size': '14px' }}>{t('gridPanel.dlgTitle')}</div>
                <div style={{ 'font-size': '11px', opacity: 0.75 }}>
                    {t('gridPanel.dlgFor')} <b>{target()?.label}</b> · {t('gridPanel.dlgUnits', { unit: unit() })}
                </div>

                <div style={section}>{t('gridPanel.dlgColumns')}</div>
                <label style={label}>{t('gridPanel.dlgCount')}
                    <input style={num} type="number" min="1" max="200" value={spec().columns} onInput={(e) => setCount('columns', e.currentTarget.value)} />
                </label>
                <label style={label}>{t('gridPanel.dlgGutter')}
                    <input style={num} type="number" min="0" step="any" value={shown(spec().gutterX)} onInput={(e) => setLen('gutterX', e.currentTarget.value)} />
                </label>

                <div style={section}>{t('gridPanel.dlgRows')}</div>
                <label style={label}>{t('gridPanel.dlgCount')}
                    <input style={num} type="number" min="1" max="200" value={spec().rows} onInput={(e) => setCount('rows', e.currentTarget.value)} />
                </label>
                <label style={label}>{t('gridPanel.dlgGutter')}
                    <input style={num} type="number" min="0" step="any" value={shown(spec().gutterY)} onInput={(e) => setLen('gutterY', e.currentTarget.value)} />
                </label>

                <div style={{ ...section, display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                    <span>{t('gridPanel.dlgMargins')}</span>
                    <label style={{ 'font-weight': 400, 'text-transform': 'none', display: 'flex', gap: '4px', 'align-items': 'center' }}>
                        <input type="checkbox" checked={linkMargins()} onChange={(e) => {
                            const on = e.currentTarget.checked;
                            batch(() => {
                                setLinkMargins(on);
                                if (on) { const m = spec().marginTop; patch({ marginRight: m, marginBottom: m, marginLeft: m }); }
                            });
                        }} />
                        {t('gridPanel.dlgSameSides')}
                    </label>
                </div>
                <For each={(linkMargins() ? [['marginTop', t('gridPanel.dlgAllSides')]] : [['marginTop', t('gridPanel.dlgTop')], ['marginRight', t('gridPanel.dlgRight')], ['marginBottom', t('gridPanel.dlgBottom')], ['marginLeft', t('gridPanel.dlgLeft')]]) as [keyof LayoutGridSpec, string][]}>
                    {([key, text]) => (
                        <label style={label}>{text}
                            <input style={num} type="number" min="0" step="any" value={shown(spec()[key] as number)} onInput={(e) => setLen(key, e.currentTarget.value)} />
                        </label>
                    )}
                </For>

                <label style={{ display: 'flex', 'align-items': 'center', gap: '6px', 'font-size': '12px', 'margin-top': '4px' }}>
                    <input type="checkbox" style={{ width: '14px', height: '14px', margin: '0', flex: 'none' }} checked={replace()} onChange={(e) => setReplace(e.currentTarget.checked)} />
                    <span>{t('gridPanel.dlgReplace')}</span>
                </label>
                <Show when={!cells().columns.length || !cells().rows.length}>
                    <div role="status" style={{ 'font-size': '11px', color: '#dc2626' }}>{t('gridPanel.dlgNoRoom')}</div>
                </Show>

                <div style={{ display: 'flex', 'justify-content': 'flex-end', gap: '8px', 'margin-top': '4px' }}>
                    <button onClick={close} style={{ padding: '6px 14px', 'border-radius': '6px', border: '1px solid var(--border-color,#d1d5db)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>{t('gridPanel.dlgCancel')}</button>
                    <button onClick={apply} disabled={!cells().columns.length && !cells().rows.length}
                        style={{ padding: '6px 14px', 'border-radius': '6px', border: 'none', background: 'var(--accent,#3b82f6)', color: '#fff', cursor: 'pointer' }}>{t('gridPanel.dlgAdd')}</button>
                </div>
            </div>
        </Show>
    );
};
