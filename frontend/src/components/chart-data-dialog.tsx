import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Plus, Trash2 } from "lucide-solid";
import { store, pushToHistory, replaceChart } from "../store/app-store";
import { normalizeChart, CHART_KINDS, isRound, type ChartSpec, type ChartKind, type LegendPos } from "../utils/chart/chart-layout";
import { t } from "../i18n";
import "./chart-data-dialog.css";

/**
 * The chart's data and options: a grid of categories (rows) by series (columns), editable cell by
 * cell, that takes a block pasted from a spreadsheet; plus the chart type, title, legend, stacking,
 * data labels and gridlines. Every edit shows on the canvas at once; the whole session is one undo
 * step.
 */
const [chartId, setChartId] = createSignal<string | null>(null);

export const openChartData = (id: string) => {
    const el = store.elements.find(e => e.id === id);
    if (!el || el.type !== 'chart') return;
    pushToHistory();
    setChartId(id);
};
export const closeChartData = () => setChartId(null);
export const chartDataOpen = () => chartId();

/** A cell's text as a value: "1,234", "12%", " 3 " → numbers; blank or not a number → null. */
export function parseCell(text: string): number | null {
    const s = text.trim().replace(/[,\s]/g, '').replace(/%$/, '');
    if (!s) return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
}

/** A pasted block (tabs between cells, newlines between rows, as spreadsheets copy). */
export const parseBlock = (text: string): string[][] =>
    text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n').map(r => r.split('\t'));

export const ChartDataDialog: Component = () => {
    const el = createMemo(() => store.elements.find(e => e.id === chartId()));
    // Esc closes it wherever focus is (after a paste, focus can be on the page, not the dialog).
    createEffect(() => {
        if (!chartId()) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); closeChartData(); } };
        window.addEventListener('keydown', onKey, true);
        onCleanup(() => window.removeEventListener('keydown', onKey, true));
    });
    const spec = createMemo<ChartSpec>(() => normalizeChart((el() as any)?.chart));

    const write = (next: Partial<ChartSpec>) => {
        const id = chartId();
        if (!id) return;
        replaceChart(id, normalizeChart({ ...spec(), ...next }));
    };
    const setCategory = (i: number, v: string) => write({ categories: spec().categories.map((c, k) => (k === i ? v : c)) });
    const setSeriesName = (j: number, v: string) => write({ series: spec().series.map((s, k) => (k === j ? { ...s, name: v } : s)) });
    const setValue = (i: number, j: number, v: string) =>
        write({ series: spec().series.map((s, k) => (k === j ? { ...s, values: s.values.map((x, r) => (r === i ? parseCell(v) : x)) } : s)) });
    const addRow = () => write({ categories: [...spec().categories, t('chart.newCategory', { n: spec().categories.length + 1 })], series: spec().series.map(s => ({ ...s, values: [...s.values, null] })) });
    const addSeries = () => write({ series: [...spec().series, { name: t('chart.newSeries', { n: spec().series.length + 1 }), values: spec().categories.map(() => null) }] });
    const removeRow = (i: number) => {
        if (spec().categories.length <= 1) return;
        write({ categories: spec().categories.filter((_, k) => k !== i), series: spec().series.map(s => ({ ...s, values: s.values.filter((_, k) => k !== i) })) });
    };
    const removeSeries = (j: number) => { if (spec().series.length > 1) write({ series: spec().series.filter((_, k) => k !== j) }); };

    /**
     * Paste a block from a spreadsheet at a cell: it fills right and down from there, adding rows
     * and series as needed. Row −1 is the header row (series names), column −1 the category column.
     */
    const pasteAt = (row: number, col: number, e: ClipboardEvent) => {
        // Never let it reach the canvas's paste handler, which would paste shapes (and push history).
        e.stopPropagation();
        const text = e.clipboardData?.getData('text/plain') ?? '';
        if (!/[\t\n]/.test(text.replace(/\n$/, ''))) return;   // a single value: let the input take it
        e.preventDefault();
        const block = parseBlock(text);
        const s = normalizeChart(spec());
        const widest = Math.max(...block.map(cells => cells.length));
        const needRows = row + block.length, needCols = col + widest;
        while (needRows > s.categories.length) { s.categories.push(t('chart.newCategory', { n: s.categories.length + 1 })); s.series.forEach(x => x.values.push(null)); }
        while (needCols > s.series.length) s.series.push({ name: t('chart.newSeries', { n: s.series.length + 1 }), values: s.categories.map(() => null) });
        block.forEach((cells, dr) => cells.forEach((cell, dc) => {
            const r = row + dr, c = col + dc;
            if (r === -1 && c === -1) return;
            if (r === -1) s.series[c].name = cell.trim();
            else if (c === -1) s.categories[r] = cell.trim();
            else s.series[c].values[r] = parseCell(cell);
        }));
        write(s);
    };

    const kindLabel = (k: ChartKind) => t(`chart.kind.${k}` as any);
    const legendLabel = (l: LegendPos) => t(`chart.legend.${l}` as any);

    return (
        <Show when={el()}>
            <Portal>
                <div class="chart-data-backdrop" onClick={closeChartData} />
                <div class="chart-data-dialog" role="dialog" aria-label={t('chart.dialogTitle')}
                    onKeyDown={(e) => e.stopPropagation()}>
                    <header>
                        <h3>{t('chart.dialogTitle')}</h3>
                        <button class="chart-data-icon" onClick={closeChartData} title={t('chart.close')} aria-label={t('chart.close')}><X size={16} /></button>
                    </header>

                    <div class="chart-data-options">
                        <label>{t('chart.type')}
                            <select value={spec().kind} onChange={(e) => write({ kind: e.currentTarget.value as ChartKind })}>
                                <For each={CHART_KINDS}>{(k) => <option value={k}>{kindLabel(k)}</option>}</For>
                            </select>
                        </label>
                        <label class="grow">{t('chart.title')}
                            <input type="text" value={spec().title ?? ''} placeholder={t('chart.noTitle')} onInput={(e) => write({ title: e.currentTarget.value || undefined })} />
                        </label>
                        <label>{t('chart.legendLabel')}
                            <select value={spec().legend} onChange={(e) => write({ legend: e.currentTarget.value as LegendPos })}>
                                <For each={['bottom', 'right', 'top', 'none'] as LegendPos[]}>{(l) => <option value={l}>{legendLabel(l)}</option>}</For>
                            </select>
                        </label>
                        <label class="check"><input type="checkbox" checked={!!spec().stacked} disabled={isRound(spec().kind)} onChange={(e) => write({ stacked: e.currentTarget.checked })} />{t('chart.stacked')}</label>
                        <label class="check"><input type="checkbox" checked={!!spec().dataLabels} onChange={(e) => write({ dataLabels: e.currentTarget.checked })} />{t('chart.dataLabels')}</label>
                        <label class="check"><input type="checkbox" checked={spec().gridlines !== false} disabled={isRound(spec().kind)} onChange={(e) => write({ gridlines: e.currentTarget.checked })} />{t('chart.gridlines')}</label>
                    </div>

                    <Show when={isRound(spec().kind) && spec().series.length > 1}>
                        <p class="chart-data-note">{t('chart.pieNote')}</p>
                    </Show>

                    <div class="chart-data-grid-wrap">
                        <table class="chart-data-grid">
                            <thead>
                                <tr>
                                    <th class="corner" />
                                    <For each={spec().series}>{(s, j) => (
                                        <th>
                                            <div class="cell-with-action">
                                                <input aria-label={t('chart.seriesName')} value={s.name} onInput={(e) => setSeriesName(j(), e.currentTarget.value)} onPaste={(e) => pasteAt(-1, j(), e)} />
                                                <button class="chart-data-icon" title={t('chart.removeSeries')} aria-label={t('chart.removeSeries')} disabled={spec().series.length <= 1} onClick={() => removeSeries(j())}><Trash2 size={13} /></button>
                                            </div>
                                        </th>
                                    )}</For>
                                    <th class="add"><button class="chart-data-add" onClick={addSeries}><Plus size={14} /> {t('chart.addSeries')}</button></th>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={spec().categories}>{(c, i) => (
                                    <tr>
                                        <th>
                                            <div class="cell-with-action">
                                                <input aria-label={t('chart.category')} value={c} onInput={(e) => setCategory(i(), e.currentTarget.value)} onPaste={(e) => pasteAt(i(), -1, e)} />
                                                <button class="chart-data-icon" title={t('chart.removeRow')} aria-label={t('chart.removeRow')} disabled={spec().categories.length <= 1} onClick={() => removeRow(i())}><Trash2 size={13} /></button>
                                            </div>
                                        </th>
                                        <For each={spec().series}>{(s, j) => (
                                            <td><input inputmode="decimal" aria-label={`${s.name} · ${c}`} value={s.values[i()] ?? ''} onChange={(e) => setValue(i(), j(), e.currentTarget.value)} onPaste={(e) => pasteAt(i(), j(), e)} /></td>
                                        )}</For>
                                        <td />
                                    </tr>
                                )}</For>
                                <tr><th class="add"><button class="chart-data-add" onClick={addRow}><Plus size={14} /> {t('chart.addRow')}</button></th></tr>
                            </tbody>
                        </table>
                    </div>
                    <p class="chart-data-hint">{t('chart.pasteHint')}</p>
                </div>
            </Portal>
        </Show>
    );
};
