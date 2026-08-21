import { type Component, Show, For, createEffect, onCleanup, createSignal } from "solid-js";
import { X, Search, SlidersHorizontal, PenLine, Palette, Network, Clapperboard, Cloud } from "lucide-solid";
import { store, updateDefaultStyles, resetDefaultStyles, updateGlobalSettings, setDefaultTool, DEFAULT_TOOL_FALLBACK, HISTORY_DEPTH_MIN, HISTORY_DEPTH_MAX, HISTORY_DEPTH_DEFAULT } from "../store/app-store";
import { features } from "../config/features";
import { cloudStorageManager } from "../storage/cloud";
import type { AuthState } from "../storage/cloud/types";
import { showToast } from "./toast";
import {
    t, currentLocale, setLocale, readyLocales, pseudoLocaleAvailable, PSEUDO_LOCALE,
} from "../i18n";
import "./settings-dialog.css";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const fontOptions = [
    { label: 'Virgil (Hand)', value: 'hand-drawn' },
    { label: 'Caveat (Hand)', value: 'caveat' },
    { label: 'Marker', value: 'marker' },
    { label: 'Inter (Sans)', value: 'sans-serif' },
    { label: 'Poppins (Sans)', value: 'poppins' },
    { label: 'Merriweather (Serif)', value: 'serif' },
    { label: 'Source Code Pro', value: 'monospace' },
    { label: 'JetBrains Mono', value: 'code' },
];

/**
 * Settings used to be one 400px column that you scrolled through — seven unrelated sections
 * (from stroke stabilization to cloud auth) stacked in a single run, with no way to see what
 * the dialog contained without reading all of it. It is a two-pane dialog now: pick a category
 * on the left, see only that category on the right.
 *
 * Text and Shape defaults share the 'defaults' category deliberately — from the user's side
 * they are one question ("what do new things look like?"), and splitting them made the rail
 * longer without making anything easier to find.
 */
const CATEGORIES = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'input', label: 'Pen & Input', icon: PenLine },
    { id: 'defaults', label: 'Defaults', icon: Palette },
    { id: 'mindmap', label: 'Mindmap', icon: Network },
    { id: 'timelapse', label: 'Time-lapse', icon: Clapperboard },
    { id: 'cloud', label: 'Cloud Storage', icon: Cloud, flag: 'enableCloudStorage' as const },
];

const SettingsDialog: Component<SettingsDialogProps> = (props) => {
    const [activeCat, setActiveCat] = createSignal('general');
    const [query, setQuery] = createSignal('');
    const [hasMatches, setHasMatches] = createSignal(true);
    let bodyRef: HTMLDivElement | undefined;

    const categories = () => CATEGORIES.filter(c => !c.flag || features[c.flag]);

    /**
     * Locales offered in the picker: those past the coverage gate, plus the
     * pseudo-locale in dev builds. Native names, not English ones — someone
     * looking for their own language is scanning for "Deutsch", not "German".
     */
    const languageOptions = () => {
        const opts = readyLocales().map(l => ({ value: l.code, label: l.nativeName }));
        if (pseudoLocaleAvailable()) opts.push({ value: PSEUDO_LOCALE, label: t("settings.pseudoLocale") });
        return opts;
    };

    /**
     * Show/hide sections and rows from the DOM rather than by gating each of the ~35 rows on a
     * signal. Search has to reach every control's LABEL, and those labels only exist as markup;
     * duplicating them into a searchable table would be a second copy to keep in sync, and the
     * one that goes stale is always the copy. Walking the rendered rows means a control is
     * findable by the exact text the user is looking at.
     */
    createEffect(() => {
        const q = query().trim().toLowerCase();
        const cat = activeCat();
        // Track isOpen: the body only exists while the dialog is mounted, so without this the
        // effect settles on the closed state (bodyRef undefined) and never runs again — every
        // section would render at once, which is exactly the scroll this replaced.
        if (!props.isOpen || !bodyRef) return;
        let anyHit = 0;
        for (const sec of Array.from(bodyRef.querySelectorAll<HTMLElement>('.settings-section'))) {
            let visibleRows = 0;
            const rows = Array.from(sec.querySelectorAll<HTMLElement>('.settings-row'));
            for (const row of rows) {
                const hit = !q || (row.textContent ?? '').toLowerCase().includes(q);
                row.style.display = hit ? '' : 'none';
                if (hit) visibleRows++;
            }
            // Searching looks across ALL categories — restricting it to the open one would make
            // the box feel broken for exactly the setting the user could not find.
            const inCat = q ? visibleRows > 0 : sec.dataset.cat === cat;
            // A section with no rows of its own (Cloud renders a sign-in block, not rows) still
            // belongs to its category, so fall back to the category match.
            sec.style.display = (rows.length === 0 ? sec.dataset.cat === cat && !q : inCat) ? '' : 'none';
            anyHit += visibleRows;
        }
        setHasMatches(anyHit > 0);
    });

    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    props.onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    const defaults = () => store.defaultElementStyles;

    return (
        <Show when={props.isOpen}>
            <div class="settings-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="settings-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="settings-header">
                        <h3>Settings</h3>
                        <div class="settings-search">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search settings…"
                                value={query()}
                                onInput={(e) => setQuery(e.currentTarget.value)}
                            />
                            <Show when={query()}>
                                <button class="settings-search-clear" onClick={() => setQuery('')} title={t("settings.clear")}>
                                    <X size={13} />
                                </button>
                            </Show>
                        </div>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="settings-panes">
                        {/* Category rail. Hidden while searching — search spans every category,
                            so highlighting one of them would be a lie about what is on screen. */}
                        <Show when={!query().trim()}>
                            <nav class="settings-rail">
                                <For each={categories()}>{(c) => (
                                    <button
                                        class="settings-rail-item"
                                        classList={{ active: activeCat() === c.id }}
                                        onClick={() => setActiveCat(c.id)}
                                    >
                                        <c.icon size={15} />
                                        <span>{c.label}</span>
                                    </button>
                                )}</For>
                            </nav>
                        </Show>

                        <div class="settings-body" ref={bodyRef}>
                    <div class="settings-section" data-cat="general">
                        <p class="settings-section-title">{t("settings.sectionGeneral")}</p>

                        {/* Hidden until there is a real choice to make. `readyLocales()`
                            only lists locales past the 95% coverage gate, so today this
                            is English alone in a production build (and English + the
                            pseudo-locale in dev). The row appears on its own as
                            translations land — see docs/i18n-seo-plan.md §7 phase 4. */}
                        <Show when={languageOptions().length > 1}>
                            <div class="settings-row">
                                <label title={t("settings.languageTitle")}>{t("settings.language")}</label>
                                <select
                                    value={currentLocale()}
                                    onChange={(e) => { void setLocale(e.currentTarget.value); }}
                                >
                                    <For each={languageOptions()}>
                                        {(opt) => <option value={opt.value}>{opt.label}</option>}
                                    </For>
                                </select>
                            </div>
                        </Show>

                        <div class="settings-row">
                            <label>{t("settings.quickToolbar")}</label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.showQuickToolbar ?? true}
                                    onChange={(e) => updateGlobalSettings({ showQuickToolbar: e.currentTarget.checked })}
                                />
                                <span class="settings-toggle-slider" />
                            </label>
                        </div>

                        <div class="settings-row">
                            <label>{t("settings.drawingStyle")}</label>
                            <select
                                value={store.globalSettings.renderStyle ?? 'sketch'}
                                onChange={(e) => updateGlobalSettings({ renderStyle: e.currentTarget.value as any })}
                            >
                                <option value="sketch">{t("settings.styleSketch")}</option>
                                <option value="architectural">{t("settings.styleArchitectural")}</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.measurementUnitsTitle")}>{t("settings.measurementUnits")}</label>
                            <select
                                value={store.globalSettings.measurementUnit ?? 'px'}
                                onChange={(e) => {
                                    const u = e.currentTarget.value as 'px' | 'mm' | 'in';
                                    updateGlobalSettings({ measurementUnit: u });
                                    try { localStorage.setItem('measurementUnit', u); } catch { /* ignore */ }
                                }}
                            >
                                <option value="px">{t("settings.unitPx")}</option>
                                <option value="mm">{t("settings.unitMm")}</option>
                                <option value="in">{t("settings.unitIn")}</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.includeDimensionsTitle")}>{t("settings.includeDimensions")}</label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.exportIncludeDimensions === true}
                                    onChange={(e) => {
                                        updateGlobalSettings({ exportIncludeDimensions: e.currentTarget.checked });
                                        try { localStorage.setItem('exportIncludeDimensions', e.currentTarget.checked ? '1' : '0'); } catch { /* ignore */ }
                                    }}
                                />
                                <span class="settings-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-section" data-cat="input">
                        <p class="settings-section-title">{t("settings.sectionInput")}</p>

                        <div class="settings-row">
                            <label title={t("settings.defaultToolTitle")}>{t("settings.defaultTool")}</label>
                            <select
                                value={store.globalSettings.defaultTool ?? DEFAULT_TOOL_FALLBACK}
                                onChange={(e) => setDefaultTool(e.currentTarget.value as 'inkbrush' | 'fineliner' | 'selection')}
                            >
                                <option value="selection">{t("settings.toolSelect")}</option>
                                <option value="inkbrush">{t("settings.toolInkBrush")}</option>
                                <option value="fineliner">{t("settings.toolFineliner")}</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.canvasPointerTitle")}>{t("settings.canvasPointer")}</label>
                            <select
                                value={store.globalSettings.pointerStyle ?? 'crosshair'}
                                onChange={(e) => updateGlobalSettings({ pointerStyle: e.currentTarget.value as 'crosshair' | 'circle' | 'arrow' })}
                            >
                                <option value="crosshair">{t("settings.pointerCrosshair")}</option>
                                <option value="circle">{t("settings.pointerCircle")}</option>
                                <option value="arrow">{t("settings.pointerArrow")}</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.smartShapesTitle")}>{t("settings.smartShapes")}</label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.smartShape !== false}
                                    onChange={(e) => updateGlobalSettings({ smartShape: e.currentTarget.checked })}
                                />
                                <span class="settings-toggle-slider" />
                            </label>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.pressureTitle")}>{t("settings.pressure")}</label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.penPressure !== false}
                                    onChange={(e) => updateGlobalSettings({ penPressure: e.currentTarget.checked })}
                                />
                                <span class="settings-toggle-slider" />
                            </label>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.stabilizationTitle")}>
                                {t("settings.stabilization")}
                            </label>
                            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={Math.round((store.globalSettings.penStabilization ?? 0) * 100)}
                                    onInput={(e) => updateGlobalSettings({ penStabilization: e.currentTarget.valueAsNumber / 100 })}
                                />
                                <span style={{ 'min-width': '34px', 'text-align': 'right', 'font-variant-numeric': 'tabular-nums' }}>
                                    {Math.round((store.globalSettings.penStabilization ?? 0) * 100)}%
                                </span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.historyDepthTitle", { min: HISTORY_DEPTH_MIN, max: HISTORY_DEPTH_MAX, def: HISTORY_DEPTH_DEFAULT })}>
                                {t("settings.historyDepth")}
                            </label>
                            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                                {/* min/max come from the same constants the store clamps with. Typed
                                    input bypasses the spinner's bounds entirely, so the value is
                                    clamped in `updateGlobalSettings` and read back here — that is why
                                    this is `value` off the store rather than a local signal. */}
                                <input
                                    type="number"
                                    min={HISTORY_DEPTH_MIN}
                                    max={HISTORY_DEPTH_MAX}
                                    step="10"
                                    style={{ width: '80px' }}
                                    value={store.globalSettings.historyDepth ?? HISTORY_DEPTH_DEFAULT}
                                    onChange={(e) => {
                                        updateGlobalSettings({ historyDepth: e.currentTarget.valueAsNumber });
                                        // Snap the field back to what was actually stored, so a typed
                                        // out-of-range number does not sit in the box looking accepted.
                                        e.currentTarget.value = String(store.globalSettings.historyDepth ?? HISTORY_DEPTH_DEFAULT);
                                    }}
                                />
                                <span style={{ color: 'var(--text-secondary, #888)', 'font-size': '12px' }}>{t("settings.historyDepthSteps")}</span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.printBleedTitle")}>
                                {t("settings.printBleed")}
                            </label>
                            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    step="1"
                                    style={{ width: '80px' }}
                                    value={store.globalSettings.bleed ?? 0}
                                    onChange={(e) => updateGlobalSettings({ bleed: Math.max(0, e.currentTarget.valueAsNumber || 0) })}
                                />
                                <span style={{ color: 'var(--text-secondary, #888)', 'font-size': '12px' }}>px (+ crop marks)</span>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section" data-cat="mindmap">
                        <p class="settings-section-title">{t("settings.sectionMindmap")}</p>

                        <div class="settings-row">
                            <label title={t("settings.autoLayoutTitle")}>
                                {t("settings.autoLayout")}
                            </label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.mindmapAutoLayout !== false}
                                    onChange={(e) => updateGlobalSettings({ mindmapAutoLayout: e.currentTarget.checked })}
                                />
                                <span class="settings-toggle-slider" />
                            </label>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.defaultLayoutTitle")}>{t("settings.defaultLayout")}</label>
                            <select
                                value={store.globalSettings.mindmapLayoutDirection ?? 'balanced'}
                                onChange={(e) => updateGlobalSettings({ mindmapLayoutDirection: e.currentTarget.value as any })}
                            >
                                <option value="balanced">{t("settings.layoutBalanced")}</option>
                                <option value="horizontal-right">{t("settings.layoutHorizontalRight")}</option>
                                <option value="horizontal-left">{t("settings.layoutHorizontalLeft")}</option>
                                <option value="vertical-down">{t("settings.layoutVerticalDown")}</option>
                                <option value="vertical-up">{t("settings.layoutVerticalUp")}</option>
                                <option value="radial">{t("settings.layoutRadial")}</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section" data-cat="timelapse">
                        <p class="settings-section-title">{t("settings.sectionTimelapse")}</p>

                        <div class="settings-row">
                            <label title={t("settings.autoRecordTitle")}>
                                {t("settings.autoRecord")}
                            </label>
                            <label class="settings-toggle">
                                <input
                                    type="checkbox"
                                    checked={store.globalSettings.timelapseAutoRecord === true}
                                    onChange={(e) => updateGlobalSettings({ timelapseAutoRecord: e.currentTarget.checked })}
                                />
                                <span class="settings-toggle-slider" />
                            </label>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.captureResolutionTitle")}>{t("settings.captureResolution")}</label>
                            <select
                                value={String(store.globalSettings.timelapseCaptureWidth ?? 1024)}
                                onChange={(e) => updateGlobalSettings({ timelapseCaptureWidth: parseInt(e.currentTarget.value, 10) })}
                            >
                                <option value="640">640 px</option>
                                <option value="1024">1024 px</option>
                                <option value="1440">1440 px</option>
                                <option value="1920">1920 px</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title={t("settings.exportDurationTitle")}>{t("settings.exportDuration")}</label>
                            <select
                                value={String(store.globalSettings.timelapseTargetDuration ?? 30)}
                                onChange={(e) => updateGlobalSettings({ timelapseTargetDuration: parseInt(e.currentTarget.value, 10) })}
                            >
                                <option value="10">10 s</option>
                                <option value="15">15 s</option>
                                <option value="30">30 s</option>
                                <option value="60">60 s</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section" data-cat="defaults">
                        <p class="settings-section-title">{t("settings.sectionTextDefaults")}</p>

                        <div class="settings-row">
                            <label>{t("settings.fontFamily")}</label>
                            <select
                                value={defaults().fontFamily ?? 'hand-drawn'}
                                onChange={(e) => updateDefaultStyles({ fontFamily: e.currentTarget.value as any })}
                            >
                                {fontOptions.map(opt => (
                                    <option value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div class="settings-row">
                            <label>{t("settings.fontSize")}</label>
                            <input
                                type="number"
                                min={8}
                                max={200}
                                value={defaults().fontSize ?? 28}
                                onChange={(e) => updateDefaultStyles({ fontSize: parseInt(e.currentTarget.value) || 28 })}
                            />
                        </div>
                    </div>

                    <div class="settings-section" data-cat="defaults">
                        <p class="settings-section-title">{t("settings.sectionShapeDefaults")}</p>

                        <div class="settings-row">
                            <label>{t("settings.strokeColor")}</label>
                            <div class="settings-color-group">
                                <input
                                    type="color"
                                    value={defaults().strokeColor ?? '#000000'}
                                    onInput={(e) => updateDefaultStyles({ strokeColor: e.currentTarget.value })}
                                />
                                <span>{defaults().strokeColor ?? '#000000'}</span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label>{t("settings.background")}</label>
                            <div class="settings-color-group">
                                <input
                                    type="color"
                                    value={defaults().backgroundColor === 'transparent' ? '#ffffff' : (defaults().backgroundColor ?? '#ffffff')}
                                    onInput={(e) => updateDefaultStyles({ backgroundColor: e.currentTarget.value })}
                                />
                                <span>{defaults().backgroundColor ?? 'transparent'}</span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label>{t("settings.strokeWidth")}</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={defaults().strokeWidth ?? 4}
                                onChange={(e) => updateDefaultStyles({ strokeWidth: parseInt(e.currentTarget.value) || 4 })}
                            />
                        </div>

                        <div class="settings-row">
                            <label>{t("settings.opacity")}</label>
                            <div class="settings-range-group">
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={defaults().opacity ?? 100}
                                    onInput={(e) => updateDefaultStyles({ opacity: parseInt(e.currentTarget.value) })}
                                />
                                <span>{defaults().opacity ?? 100}%</span>
                            </div>
                        </div>
                    </div>

                    <Show when={features.enableCloudStorage}>
                        <div class="settings-section" data-cat="cloud">
                            <p class="settings-section-title">{t("settings.sectionCloud")}</p>
                            <CloudSettingsContent />
                        </div>
                    </Show>

                            <Show when={query().trim() && !hasMatches()}>
                                <p class="settings-empty">No setting matches “{query().trim()}”.</p>
                            </Show>
                        </div>
                    </div>

                    <div class="settings-footer">
                        <button class="settings-reset-btn" onClick={() => resetDefaultStyles()}>
                            Reset to Defaults
                        </button>
                        <button class="settings-close-btn" onClick={props.onClose}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

/** Inline cloud storage settings section. */
function CloudSettingsContent() {
    const [authState, setAuthState] = createSignal<AuthState>(
        cloudStorageManager.getAuthState()
    );

    createEffect(() => {
        const provider = cloudStorageManager.getActiveProvider();
        if (provider) {
            const unsub = provider.onAuthStateChange(setAuthState);
            onCleanup(unsub);
        }
    });

    async function handleSignIn() {
        try {
            if (!cloudStorageManager.getActiveProvider()) {
                await cloudStorageManager.setActiveProvider('google-drive');
            }
            await cloudStorageManager.signIn();
            setAuthState(cloudStorageManager.getAuthState());
        } catch (e: any) {
            showToast(e.message || 'Sign-in failed', 'error');
        }
    }

    async function handleSignOut() {
        try {
            await cloudStorageManager.signOut();
            setAuthState({ isAuthenticated: false });
        } catch (e: any) {
            showToast(e.message || 'Sign-out failed', 'error');
        }
    }

    return (
        <>
            <div class="settings-row">
                <label>{t("settings.provider")}</label>
                <span style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>Google Drive</span>
            </div>
            <div class="settings-row">
                <label>{t("settings.account")}</label>
                <Show
                    when={authState().isAuthenticated}
                    fallback={
                        <button
                            class="settings-close-btn"
                            style={{ "font-size": "0.8rem", padding: "4px 12px" }}
                            onClick={handleSignIn}
                        >
                            Sign in
                        </button>
                    }
                >
                    <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                        <span style={{ "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                            {authState().userEmail || 'Connected'}
                        </span>
                        <button
                            class="settings-reset-btn"
                            style={{ "font-size": "0.75rem", padding: "2px 8px" }}
                            onClick={handleSignOut}
                        >
                            Sign out
                        </button>
                    </div>
                </Show>
            </div>
        </>
    );
}

export default SettingsDialog;
