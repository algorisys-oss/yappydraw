/**
 * Properties ▸ Canvas ▸ GRID & GUIDES.
 *
 * Its own section rather than rows in the generic `canvas` config group, because it needs
 * things the config rows can't express: spacing shown in a chosen unit but stored in px,
 * a reset button, and launchers for the Rows & Columns dialog and the Perspective Grid
 * (which was reachable only from the command palette until Anshika's Sep 2026 review).
 *
 * Grid settings aren't undoable (they never were — they're view furniture, like the
 * rulers), so nothing here pushes history.
 */
import { For, Show } from 'solid-js';
import {
    store, updateGridSettings, setGridStyle, toggleGuidesVisible, toggleGuidesLocked,
    clearGuides, togglePerspectiveGrid,
} from '../store/app-store';
import { GRID_STYLES, GRID_UNITS, gridUnitToPx, pxToGridUnit, type GridUnit } from '../utils/grid-lattice';
import MathNumberInput from './math-number-input';
import { t } from '../i18n';
import { openLayoutGuidesDialog } from './layout-guides-dialog';

const btn = {
    flex: '1', 'font-size': '11px', padding: '4px 2px', cursor: 'pointer',
    border: '1px solid var(--border-color, #ccc)', 'border-radius': '4px',
    background: 'transparent', color: 'inherit',
} as const;
const on = { background: 'var(--accent, #3b82f6)', color: '#fff' } as const;
const sub = { 'font-size': '10px', 'font-weight': 600, opacity: 0.6, 'margin-top': '10px', 'letter-spacing': '0.04em' } as const;

export const GridSettingsSection = () => {
    const g = () => store.gridSettings;
    const unit = (): GridUnit => g().unit ?? 'px';
    const inUnit = (px: number | undefined) => pxToGridUnit(px ?? 0, unit());
    // Spacing below 1 px isn't a grid anyone can see or hit; above 5000 it's off-screen.
    const setSpacing = (v: number) => {
        const px = gridUnitToPx(v, unit());
        if (Number.isFinite(px) && px > 0) updateGridSettings({ gridSize: Math.min(5000, Math.max(1, px)) });
    };
    const setAngle = (v: number) => {
        if (!Number.isFinite(v)) return;
        // Keep it in (−180, 180]; the grid is symmetric under 90° turns anyway, but the
        // number shown should be the one typed where possible.
        const a = ((v + 180) % 360 + 360) % 360 - 180;
        updateGridSettings({ angle: a === -180 ? 180 : a });
    };

    return (
        <div class="property-group" data-testid="grid-settings">
            <div class="group-title">{t('gridPanel.title')}</div>

            <div class="control-row">
                <label title="Ctrl+' (or Shift+')">{t('gridPanel.showGrid')}</label>
                <input type="checkbox" checked={g().enabled} onChange={(e) => updateGridSettings({ enabled: e.currentTarget.checked })} />
            </div>
            <div class="control-row">
                <label title="Shift+;">{t('gridPanel.snapToGrid')}</label>
                <input type="checkbox" checked={g().snapToGrid} onChange={(e) => updateGridSettings({ snapToGrid: e.currentTarget.checked })} />
            </div>
            <div class="control-row">
                <label title={t('gridPanel.smartSnappingTip')}>{t('gridPanel.smartSnapping')}</label>
                <input type="checkbox" checked={g().objectSnapping} onChange={(e) => updateGridSettings({ objectSnapping: e.currentTarget.checked })} />
            </div>

            <div style={{ display: 'flex', gap: '4px', margin: '6px 0' }}>
                <For each={GRID_STYLES}>{(s) => (
                    <button style={{ ...btn, ...(g().style === s.id ? on : {}) }} title={s.hint}
                        aria-pressed={g().style === s.id} onClick={() => setGridStyle(s.id)}>{s.label}</button>
                )}</For>
            </div>

            <div class="control-row">
                <label>{t('gridPanel.spacing')}</label>
                <div style={{ display: 'flex', gap: '4px', 'align-items': 'center' }}>
                    <MathNumberInput value={inUnit(g().gridSize)} min={0} step={unit() === 'px' ? 1 : 0.5} onCommit={setSpacing} title={t('gridPanel.spacingTitle')} />
                    <select value={unit()} aria-label={t('gridPanel.unitLabel')} style={{ width: "64px" }} onChange={(e) => updateGridSettings({ unit: e.currentTarget.value as GridUnit })}>
                        <For each={GRID_UNITS}>{(u) => <option value={u.id}>{u.label}</option>}</For>
                    </select>
                </div>
            </div>
            <div class="control-row">
                <label title={t('gridPanel.majorEveryTip')}>{t('gridPanel.majorEvery')}</label>
                <MathNumberInput value={g().majorEvery ?? 0} min={0} max={100} step={1}
                    onCommit={(n) => updateGridSettings({ majorEvery: Math.max(0, Math.min(100, Math.round(n))) })} />
            </div>
            <div class="control-row">
                <label title={t('gridPanel.rotationTip')}>{t('gridPanel.rotation')}</label>
                <div class="slider-group">
                    <div class="slider-wrapper">
                        <input type="range" min={-90} max={90} step={1} value={g().angle ?? 0} aria-label={t('gridPanel.rotationLabel')}
                            onInput={(e) => setAngle(Number(e.currentTarget.value))} />
                    </div>
                    <MathNumberInput value={g().angle ?? 0} step={1} onCommit={setAngle} class="precise-number-input" />
                </div>
            </div>
            <div class="control-row">
                <label>{t('gridPanel.colour')}</label>
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(g().gridColor) ? g().gridColor : '#e0e0e0'}
                    onInput={(e) => updateGridSettings({ gridColor: e.currentTarget.value })} />
            </div>
            <div class="control-row">
                <label>{t('gridPanel.opacity')}</label>
                <div class="slider-group">
                    <div class="slider-wrapper">
                        <input type="range" min={0.1} max={1} step={0.05} value={g().gridOpacity} aria-label={t('gridPanel.opacityLabel')}
                            onInput={(e) => updateGridSettings({ gridOpacity: Number(e.currentTarget.value) })} />
                    </div>
                </div>
            </div>
            <div class="control-row">
                <label title={t('gridPanel.onTopTip')}>{t('gridPanel.onTop')}</label>
                <input type="checkbox" checked={!!g().onTop} onChange={(e) => updateGridSettings({ onTop: e.currentTarget.checked })} />
            </div>

            <div style={sub}>{t('gridPanel.axesHeading')}</div>
            <div class="control-row">
                <label title={t('gridPanel.showAxesTip')}>{t('gridPanel.showAxes')}</label>
                <input type="checkbox" checked={!!g().showAxes} onChange={(e) => updateGridSettings({ showAxes: e.currentTarget.checked })} />
            </div>
            <Show when={g().showAxes}>
                <div class="control-row">
                    <label>{t('gridPanel.axisColour')}</label>
                    <input type="color" value={g().axisColor || '#b14cff'} onInput={(e) => updateGridSettings({ axisColor: e.currentTarget.value })} />
                </div>
            </Show>
            <div class="control-row">
                <label title={t('gridPanel.originXTip')}>{t('gridPanel.originX')}</label>
                <MathNumberInput value={inUnit(g().originX)} step={1} onCommit={(n) => updateGridSettings({ originX: gridUnitToPx(n, unit()) })} />
            </div>
            <div class="control-row">
                <label>{t('gridPanel.originY')}</label>
                <MathNumberInput value={inUnit(g().originY)} step={1} onCommit={(n) => updateGridSettings({ originY: gridUnitToPx(n, unit()) })} />
            </div>
            <div style={{ display: 'flex', gap: '4px', 'margin-top': '4px' }}>
                <button style={btn} title={t('gridPanel.resetOriginTip')}
                    onClick={() => updateGridSettings({ originX: 0, originY: 0, angle: 0 })}>{t('gridPanel.resetOrigin')}</button>
            </div>

            <div style={sub}>{t('gridPanel.guidesHeading')}</div>
            <div class="control-row">
                <label title="Ctrl+;">{t('gridPanel.showGuides')}</label>
                <input type="checkbox" checked={store.guidesVisible && store.showRulers} onChange={(e) => toggleGuidesVisible(e.currentTarget.checked)} />
            </div>
            <div class="control-row">
                <label title="Ctrl+Alt+;">{t('gridPanel.lockGuides')}</label>
                <input type="checkbox" checked={store.guidesLocked} onChange={(e) => toggleGuidesLocked(e.currentTarget.checked)} />
            </div>
            <div style={{ display: 'flex', gap: '4px', 'margin-top': '4px' }}>
                <button style={btn} data-testid="open-rows-columns" title={t('gridPanel.rowsColumnsTip')}
                    onClick={() => openLayoutGuidesDialog()}>{t('gridPanel.rowsColumns')}</button>
                <button style={btn} disabled={!store.guides.length} onClick={() => clearGuides()}>{t('gridPanel.clearGuides')}</button>
            </div>
            <div style={{ display: 'flex', gap: '4px', 'margin-top': '4px' }}>
                <button style={btn} title={t('gridPanel.perspectiveTip')}
                    onClick={() => togglePerspectiveGrid(true)}>{t('gridPanel.perspective')}</button>
            </div>
        </div>
    );
};
