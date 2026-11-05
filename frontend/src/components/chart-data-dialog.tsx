import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Plus, Trash2 } from "lucide-solid";
import { store, pushToHistory, replaceChart } from "../store/app-store";
import { normalizeChart, CHART_KINDS, isRound, isXY, isRadar, canStack, canCombine, seriesKind, type ChartSpec, type ChartKind, type LegendPos } from "../utils/chart/chart-layout";
import { t } from "../i18n";
import "./chart-data-dialog.css";

/**
 * The chart's data and options: a grid of categories (rows) by series (columns), editable cell by
 * cell, that takes a block pasted from a spreadsheet; plus the chart type, title, legend, stacking,
 * data labels and gridlines. Scatter and bubble charts read the first column as X values; a bubble
 * series has two columns, its Y values and its bubble sizes. Every edit shows on the canvas at once;
 * the whole session is one undo step.
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
    /** Combination charts: draw series j as another type (its chart's own type clears the override), or on the right-hand axis. */
    const setSeriesKind = (j: number, k: 'column' | 'line' | 'area') =>
        write({ series: spec().series.map((s, n) => (n === j ? { ...s, kind: k === spec().kind ? undefined : k } : s)) });
    const setSecondary = (j: number, on: boolean) =>
        write({ series: spec().series.map((s, n) => (n === j ? { ...s, secondary: on || undefined } : s)) });
    const setSize = (i: number, j: number, v: string) =>
        write({ series: spec().series.map((s, k) => (k === j ? { ...s, sizes: spec().categories.map((_, r) => (r === i ? parseCell(v) : s.sizes?.[r] ?? null)) } : s)) });
    /** A bubble series has a second column, its sizes. */
    const bubble = () => spec().kind === 'bubble';
    const newRowLabel = () => (isXY(spec().kind) ? String(spec().categories.length + 1) : t('chart.newCategory', { n: spec().categories.length + 1 }));
    const addRow = () => write({ categories: [...spec().categories, newRowLabel()], series: spec().series.map(s => ({ ...s, values: [...s.values, null], ...(s.sizes && { sizes: [...s.sizes, null] }) })) });
    const addSeries = () => write({ series: [...spec().series, { name: t('chart.newSeries', { n: spec().series.length + 1 }), values: spec().categories.map(() => null), ...(bubble() && { sizes: spec().categories.map(() => null) }) }] });
    const removeRow = (i: number) => {
        if (spec().categories.length <= 1) return;
        write({ categories: spec().categories.filter((_, k) => k !== i), series: spec().series.map(s => ({ ...s, values: s.values.filter((_, k) => k !== i), ...(s.sizes && { sizes: s.sizes.filter((_, k) => k !== i) }) })) });
    };
    const removeSeries = (j: number) => { if (spec().series.length > 1) write({ series: spec().series.filter((_, k) => k !== j) }); };

    /**
     * Paste a block from a spreadsheet at a cell: it fills right and down from there, adding rows
     * and series as needed. Row −1 is the header row (series names), column −1 the category column.
     * `col` counts grid columns: in a bubble chart each series takes two (values, then sizes).
     */
    const pasteAt = (row: number, col: number, e: ClipboardEvent) => {
        // Never let it reach the canvas's paste handler, which would paste shapes (and push history).
        e.stopPropagation();
        const text = e.clipboardData?.getData('text/plain') ?? '';
        if (!/[\t\n]/.test(text.replace(/\n$/, ''))) return;   // a single value: let the input take it
        e.preventDefault();
        const block = parseBlock(text);
        const s = normalizeChart(spec());
        const per = s.kind === 'bubble' ? 2 : 1;
        const widest = Math.max(...block.map(cells => cells.length));
        const needRows = row + block.length, needSeries = Math.ceil((col + widest) / per);
        while (needRows > s.categories.length) {
            s.categories.push(isXY(s.kind) ? String(s.categories.length + 1) : t('chart.newCategory', { n: s.categories.length + 1 }));
            s.series.forEach(x => { x.values.push(null); x.sizes?.push(null); });
        }
        while (needSeries > s.series.length) s.series.push({ name: t('chart.newSeries', { n: s.series.length + 1 }), values: s.categories.map(() => null) });
        if (per === 2) s.series.forEach(x => { x.sizes ??= s.categories.map(() => null); });
        block.forEach((cells, dr) => cells.forEach((cell, dc) => {
            const r = row + dr, c = col + dc;
            if (r === -1 && c === -1) return;
            if (c === -1) { if (r >= 0) s.categories[r] = cell.trim(); return; }
            const ser = s.series[Math.floor(c / per)], size = per === 2 && c % 2 === 1;
            if (r === -1) { if (!size) ser.name = cell.trim(); }
            else if (size) ser.sizes![r] = parseCell(cell);
            else ser.values[r] = parseCell(cell);
        }));
        write(s);
    };

    /** Change the type. A chart turned into bubbles gets equal bubbles where it has none, so it shows. */
    const setKind = (kind: ChartKind) => write({ kind, ...(kind === 'bubble' && {
        series: spec().series.map(s => (s.sizes?.some(v => v !== null) ? s : { ...s, sizes: s.values.map(v => (v === null ? null : 1)) })),
    }) });
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
                            <select value={spec().kind} onChange={(e) => setKind(e.currentTarget.value as ChartKind)}>
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
                        <label class="check"><input type="checkbox" checked={!!spec().stacked} disabled={!canStack(spec().kind)} onChange={(e) => write({ stacked: e.currentTarget.checked })} />{t('chart.stacked')}</label>
                        <label class="check"><input type="checkbox" checked={!!spec().percent} disabled={!spec().stacked} onChange={(e) => write({ percent: e.currentTarget.checked })} />{t('chart.percent')}</label>
                        <Show when={spec().kind === 'scatter'}>
                            <label class="check"><input type="checkbox" checked={!!spec().lines} onChange={(e) => write({ lines: e.currentTarget.checked })} />{t('chart.lines')}</label>
                            <label class="check"><input type="checkbox" checked={!!spec().smooth} disabled={!spec().lines} onChange={(e) => write({ smooth: e.currentTarget.checked })} />{t('chart.smooth')}</label>
                        </Show>
                        <label class="check"><input type="checkbox" checked={!!spec().dataLabels} onChange={(e) => write({ dataLabels: e.currentTarget.checked })} />{t('chart.dataLabels')}</label>
                        <label class="check"><input type="checkbox" checked={spec().gridlines !== false} disabled={isRound(spec().kind)} onChange={(e) => write({ gridlines: e.currentTarget.checked })} />{t('chart.gridlines')}</label>
                    </div>

                    <Show when={isRound(spec().kind) && spec().series.length > 1}>
                        <p class="chart-data-note">{t('chart.pieNote')}</p>
                    </Show>
                    <Show when={isXY(spec().kind)}>
                        <p class="chart-data-note">{bubble() ? t('chart.bubbleNote') : t('chart.scatterNote')}</p>
                    </Show>
                    <Show when={spec().kind === 'stock'}>
                        <p class="chart-data-note">{t('chart.stockNote')}</p>
                    </Show>
                    <Show when={isRadar(spec().kind) && spec().categories.length < 3}>
                        <p class="chart-data-note">{t('chart.radarNote')}</p>
                    </Show>

                    <div class="chart-data-grid-wrap">
                        <table class="chart-data-grid">
                            <thead>
                                <tr>
                                    <th class="corner">{isXY(spec().kind) ? 'X' : ''}</th>
                                    <For each={spec().series}>{(s, j) => (
                                        <th colSpan={bubble() ? 2 : 1}>
                                            <div class="cell-with-action">
                                                <input aria-label={t('chart.seriesName')} value={s.name} onInput={(e) => setSeriesName(j(), e.currentTarget.value)} onPaste={(e) => pasteAt(-1, j() * (bubble() ? 2 : 1), e)} />
                                                <button class="chart-data-icon" title={t('chart.removeSeries')} aria-label={t('chart.removeSeries')} disabled={spec().series.length <= 1} onClick={() => removeSeries(j())}><Trash2 size={13} /></button>
                                            </div>
                                            <Show when={canCombine(spec().kind)}>
                                                <div class="chart-data-series-opts">
                                                    <select aria-label={`${s.name} · ${t('chart.seriesType')}`} value={seriesKind(spec(), s)} onChange={(e) => setSeriesKind(j(), e.currentTarget.value as 'column' | 'line' | 'area')}>
                                                        <For each={['column', 'line', 'area'] as const}>{(k) => <option value={k}>{kindLabel(k)}</option>}</For>
                                                    </select>
                                                    <label class="check"><input type="checkbox" checked={!!s.secondary} onChange={(e) => setSecondary(j(), e.currentTarget.checked)} />{t('chart.secondaryAxis')}</label>
                                                </div>
                                            </Show>
                                        </th>
                                    )}</For>
                                    <th class="add"><button class="chart-data-add" onClick={addSeries}><Plus size={14} /> {t('chart.addSeries')}</button></th>
                                </tr>
                                <Show when={bubble()}>
                                    <tr class="chart-data-subhead">
                                        <th />
                                        <For each={spec().series}>{() => <><th>Y</th><th>{t('chart.size')}</th></>}</For>
                                        <th />
                                    </tr>
                                </Show>
                            </thead>
                            <tbody>
                                <For each={spec().categories}>{(c, i) => (
                                    <tr>
                                        <th>
                                            <div class="cell-with-action">
                                                <input aria-label={isXY(spec().kind) ? 'X' : t('chart.category')} inputmode={isXY(spec().kind) ? 'decimal' : undefined} value={c} onInput={(e) => setCategory(i(), e.currentTarget.value)} onPaste={(e) => pasteAt(i(), -1, e)} />
                                                <button class="chart-data-icon" title={t('chart.removeRow')} aria-label={t('chart.removeRow')} disabled={spec().categories.length <= 1} onClick={() => removeRow(i())}><Trash2 size={13} /></button>
                                            </div>
                                        </th>
                                        <For each={spec().series}>{(s, j) => (
                                            <>
                                                <td><input inputmode="decimal" aria-label={`${s.name} · ${c}`} value={s.values[i()] ?? ''} onChange={(e) => setValue(i(), j(), e.currentTarget.value)} onPaste={(e) => pasteAt(i(), j() * (bubble() ? 2 : 1), e)} /></td>
                                                <Show when={bubble()}>
                                                    <td><input inputmode="decimal" aria-label={`${s.name} · ${c} · ${t('chart.size')}`} value={s.sizes?.[i()] ?? ''} onChange={(e) => setSize(i(), j(), e.currentTarget.value)} onPaste={(e) => pasteAt(i(), j() * 2 + 1, e)} /></td>
                                                </Show>
                                            </>
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
