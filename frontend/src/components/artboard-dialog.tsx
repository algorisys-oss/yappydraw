import { type Component, Show, For, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { X, ArrowLeftRight } from "lucide-solid";
import { store, createArtboards, duplicateArtboard, closeArtboardDialog } from "../store/app-store";
import { PAGE_SIZE_PRESETS, PAGE_PRESET_CATEGORIES } from "../config/page-size-presets";
import { onEscapeKey } from "../utils/use-escape";
import { t } from "../i18n";
import "./design-size-dialog.css";
import "./artboard-dialog.css";

/** Sizes a logo/brand job reaches for first — ahead of the page presets, which are all
 *  documents and screens. */
const LOGO_PRESETS = [
    { id: 'logo-square', name: 'Logo (square)', width: 1000, height: 1000 },
    { id: 'logo-wide', name: 'Logo (horizontal)', width: 1600, height: 800 },
    { id: 'app-icon', name: 'App icon', width: 1024, height: 1024 },
    { id: 'favicon', name: 'Favicon', width: 512, height: 512 },
    { id: 'web-1280', name: 'Web 1280', width: 1280, height: 800 },
];
const ALL_PRESETS = [...LOGO_PRESETS, ...PAGE_SIZE_PRESETS];
type DialogMode = 'new' | 'duplicate';

/**
 * New Artboard dialog (Artboard tool click, Shift+O then click, or right-click → Artboards →
 * New Artboard… / an artboard's Duplicate as Variations…). Two modes:
 *  - **New** — blank frames of a preset or custom W × H, `count` of them side by side.
 *  - **Duplicate** (only when opened on an artboard) — N copies of it WITH its artwork, the
 *    "try this logo in four colourways" case.
 */
const ArtboardDialog: Component = () => {
    const open = () => store.artboardDialog.open;
    onEscapeKey(open, () => closeArtboardDialog());

    const [mode, setMode] = createSignal('new' as DialogMode);
    const [presetId, setPresetId] = createSignal('logo-square');
    const [w, setW] = createSignal(1000);
    const [h, setH] = createSignal(1000);
    const [name, setName] = createSignal('');
    const [count, setCount] = createSignal(1);
    const [gap, setGap] = createSignal(40);

    // The artboard this dialog was opened FOR (clicked with the tool, or its menu's "Duplicate
    // as Variations…") — not the live selection, which the click into this dialog clears.
    const activeAb = () => store.artboards.find(a => a.id === store.artboardDialog.sourceId);

    // Each opening starts from its intent: opened on an artboard, variations of it are the
    // ask; otherwise a new blank frame.
    createEffect(() => {
        if (!open()) return;
        setMode(activeAb() ? 'duplicate' : 'new');
        setCount(activeAb() ? 3 : 1);
    });

    const applyPreset = (id: string) => {
        setPresetId(id);
        const p = ALL_PRESETS.find(x => x.id === id);
        if (p) { setW(p.width); setH(p.height); }
    };
    const editSize = (which: 'w' | 'h', v: number) => {
        (which === 'w' ? setW : setH)(v);
        setPresetId('custom');
    };
    const swap = () => { const a = w(); setW(h()); setH(a); setPresetId('custom'); };

    const valid = () => {
        const n = count();
        if (!Number.isFinite(n) || n < 1 || n > 50) return false;
        if (mode() === 'duplicate') return !!activeAb();
        return Number.isFinite(w()) && Number.isFinite(h()) && w() >= 1 && h() >= 1 && w() <= 100000 && h() <= 100000;
    };

    const create = () => {
        if (!valid()) return;
        if (mode() === 'duplicate') {
            duplicateArtboard(activeAb()!.id, Math.max(0, gap() || 0), count());
        } else {
            const at = store.artboardDialog;
            createArtboards({ width: w(), height: h(), name: name(), count: count(), gap: Math.max(0, gap() || 0), x: at.x, y: at.y });
        }
        closeArtboardDialog();
    };

    return (
        <Show when={open()}>
            <Portal>
                <div class="dsd-overlay" data-testid="artboard-dialog" onClick={(e) => { if (e.target === e.currentTarget) closeArtboardDialog(); }}>
                    <div class="dsd-modal abd-modal" onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); create(); } }}>
                        <div class="dsd-header">
                            <h2>{t('artboardDialog.title')}</h2>
                            <button class="dsd-close" type="button" onClick={closeArtboardDialog} aria-label={t('artboardDialog.cancel')}><X size={18} /></button>
                        </div>
                        <div class="dsd-body abd-body">
                            <Show when={activeAb()}>
                                <div class="abd-tabs" role="tablist">
                                    <button type="button" role="tab" class={`abd-tab ${mode() === 'new' ? 'active' : ''}`} onClick={() => { setMode('new'); setCount(1); }}>{t('artboardDialog.modeNew')}</button>
                                    <button type="button" role="tab" class={`abd-tab ${mode() === 'duplicate' ? 'active' : ''}`} data-testid="artboard-dialog-duplicate" onClick={() => { setMode('duplicate'); setCount(3); }}>
                                        {t('artboardDialog.modeDuplicate', { name: activeAb()!.name })}
                                    </button>
                                </div>
                            </Show>

                            <Show when={mode() === 'new'} fallback={
                                <p class="abd-note">{t('artboardDialog.duplicateHint', { name: activeAb()?.name ?? '', width: Math.round(activeAb()?.width ?? 0), height: Math.round(activeAb()?.height ?? 0) })}</p>
                            }>
                                <label class="abd-row">
                                    <span>{t('artboardDialog.preset')}</span>
                                    <select value={presetId()} data-testid="artboard-dialog-preset" onChange={(e) => applyPreset(e.currentTarget.value)}>
                                        <option value="custom">{t('artboardDialog.custom')}</option>
                                        <optgroup label={t('artboardDialog.groupLogo')}>
                                            <For each={LOGO_PRESETS}>{(p) => <option value={p.id}>{`${p.name} — ${p.width} × ${p.height}`}</option>}</For>
                                        </optgroup>
                                        <For each={PAGE_PRESET_CATEGORIES}>{(cat) => (
                                            <optgroup label={cat.label}>
                                                <For each={PAGE_SIZE_PRESETS.filter(p => p.category === cat.id)}>{(p) => <option value={p.id}>{`${p.name} — ${p.width} × ${p.height}`}</option>}</For>
                                            </optgroup>
                                        )}</For>
                                    </select>
                                </label>
                                <div class="abd-row">
                                    <span>{t('artboardDialog.size')}</span>
                                    <div class="abd-size">
                                        <input type="number" min={1} max={100000} value={w()} data-testid="artboard-dialog-width"
                                            onInput={(e) => editSize('w', Number(e.currentTarget.value))} aria-label={t('artboardDialog.width')} />
                                        <button type="button" class="abd-swap" onClick={swap} title={t('artboardDialog.swap')} aria-label={t('artboardDialog.swap')}><ArrowLeftRight size={14} /></button>
                                        <input type="number" min={1} max={100000} value={h()} data-testid="artboard-dialog-height"
                                            onInput={(e) => editSize('h', Number(e.currentTarget.value))} aria-label={t('artboardDialog.height')} />
                                        <span class="dsd-unit">px</span>
                                    </div>
                                </div>
                                <label class="abd-row">
                                    <span>{t('artboardDialog.name')}</span>
                                    <input type="text" value={name()} placeholder={t('artboardDialog.namePlaceholder')} onInput={(e) => setName(e.currentTarget.value)} />
                                </label>
                            </Show>

                            <div class="abd-row">
                                <span>{t('artboardDialog.count')}</span>
                                <div class="abd-size">
                                    <input type="number" min={1} max={50} value={count()} data-testid="artboard-dialog-count"
                                        onInput={(e) => setCount(Math.floor(Number(e.currentTarget.value)))} aria-label={t('artboardDialog.count')} />
                                    <span class="abd-label-inline">{t('artboardDialog.gap')}</span>
                                    <input type="number" min={0} max={2000} value={gap()}
                                        onInput={(e) => setGap(Number(e.currentTarget.value))} aria-label={t('artboardDialog.gap')} />
                                    <span class="dsd-unit">px</span>
                                </div>
                            </div>
                            <p class="abd-note">{t('artboardDialog.sideBySide')}</p>

                            <div class="abd-actions">
                                <button type="button" class="abd-cancel" onClick={closeArtboardDialog}>{t('artboardDialog.cancel')}</button>
                                <button type="button" class="dsd-create" data-testid="artboard-dialog-create" disabled={!valid()} onClick={create}>
                                    {mode() === 'duplicate' ? t('artboardDialog.duplicate') : t('artboardDialog.create')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default ArtboardDialog;
