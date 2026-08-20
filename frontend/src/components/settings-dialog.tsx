import { type Component, Show, For, createEffect, onCleanup, createSignal } from "solid-js";
import { X, Search, SlidersHorizontal, PenLine, Palette, Network, Clapperboard, Cloud } from "lucide-solid";
import { store, updateDefaultStyles, resetDefaultStyles, updateGlobalSettings, setDefaultTool, DEFAULT_TOOL_FALLBACK } from "../store/app-store";
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
                                <button class="settings-search-clear" onClick={() => setQuery('')} title="Clear">
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
                        <p class="settings-section-title">General</p>

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
                            <label>Quick Toolbar</label>
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
                            <label>Drawing Style</label>
                            <select
                                value={store.globalSettings.renderStyle ?? 'sketch'}
                                onChange={(e) => updateGlobalSettings({ renderStyle: e.currentTarget.value as any })}
                            >
                                <option value="sketch">Sketch</option>
                                <option value="architectural">Architectural</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title="Unit shown by the transform badge, Measure tool, and dimension annotations">Measurement Units</label>
                            <select
                                value={store.globalSettings.measurementUnit ?? 'px'}
                                onChange={(e) => {
                                    const u = e.currentTarget.value as 'px' | 'mm' | 'in';
                                    updateGlobalSettings({ measurementUnit: u });
                                    try { localStorage.setItem('measurementUnit', u); } catch { /* ignore */ }
                                }}
                            >
                                <option value="px">Pixels (px)</option>
                                <option value="mm">Millimetres (mm)</option>
                                <option value="in">Inches (in)</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title="Bake dimension annotations into exported PNG / JPG / SVG / PDF files">Include Dimensions in Exports</label>
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
                        <p class="settings-section-title">Pen &amp; Input</p>

                        <div class="settings-row">
                            <label title="Which tool is active when Yappy opens. Switches to it now, too.">Default Tool</label>
                            <select
                                value={store.globalSettings.defaultTool ?? DEFAULT_TOOL_FALLBACK}
                                onChange={(e) => setDefaultTool(e.currentTarget.value as 'inkbrush' | 'fineliner' | 'selection')}
                            >
                                <option value="selection">Select</option>
                                <option value="inkbrush">Ink Brush</option>
                                <option value="fineliner">Fineliner</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title="Cursor shown over the canvas while a drawing tool is active. Select and Pan keep their own cursors.">Canvas Pointer</label>
                            <select
                                value={store.globalSettings.pointerStyle ?? 'crosshair'}
                                onChange={(e) => updateGlobalSettings({ pointerStyle: e.currentTarget.value as 'crosshair' | 'circle' | 'arrow' })}
                            >
                                <option value="crosshair">Crosshair (+)</option>
                                <option value="circle">Concentric circle</option>
                                <option value="arrow">Arrow</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <label title="Hold a pen stroke still for a moment to snap it to a clean shape">Smart Shapes (hold to correct)</label>
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
                            <label title="Use Apple Pencil / stylus pressure for variable stroke width on the brush pen">Pressure Sensitivity</label>
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
                            <label title="Pulled-string 'lazy brush' for cleaner freehand inking. Higher = smoother and heavier, with more lag. 0% = off.">
                                Stroke Stabilization
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
                            <label title="Maximum number of undo steps kept in history. Higher = more peace of mind, more memory. Default 50.">
                                Undo History Depth
                            </label>
                            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    min="10"
                                    max="500"
                                    step="10"
                                    style={{ width: '80px' }}
                                    value={store.globalSettings.historyDepth ?? 50}
                                    onChange={(e) => updateGlobalSettings({ historyDepth: Math.max(1, Math.round(e.currentTarget.valueAsNumber || 50)) })}
                                />
                                <span style={{ color: 'var(--text-secondary, #888)', 'font-size': '12px' }}>steps</span>
                            </div>
                        </div>

                        <div class="settings-row">
                            <label title="Print bleed margin (px) drawn around each artboard. Set >0 to also show crop / registration marks. 0 = off.">
                                Print Bleed
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
                        <p class="settings-section-title">Mindmap</p>

                        <div class="settings-row">
                            <label title="Automatically arrange mindmap nodes into a tidy layout as you add, collapse, delete, or reparent. Turn off to position nodes manually.">
                                Auto Layout (reflow &amp; animate)
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
                            <label title="Default arrangement for new mindmaps (trees you haven't given an explicit layout).">Default Layout</label>
                            <select
                                value={store.globalSettings.mindmapLayoutDirection ?? 'balanced'}
                                onChange={(e) => updateGlobalSettings({ mindmapLayoutDirection: e.currentTarget.value as any })}
                            >
                                <option value="balanced">Balanced</option>
                                <option value="horizontal-right">Horizontal (Right)</option>
                                <option value="horizontal-left">Horizontal (Left)</option>
                                <option value="vertical-down">Vertical (Down)</option>
                                <option value="vertical-up">Vertical (Up)</option>
                                <option value="radial">Radial</option>
                            </select>
                        </div>
                    </div>

                    <div class="settings-section" data-cat="timelapse">
                        <p class="settings-section-title">Time-lapse</p>

                        <div class="settings-row">
                            <label title="Automatically capture a Procreate-style process recording for every session. Toggle a recording any time with Ctrl+Shift+T.">
                                Auto-record sessions
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
                            <label title="Longest-edge resolution for captured frames. Lower = smaller storage and faster capture.">Capture Resolution</label>
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
                            <label title="Target length of the exported time-lapse video. Frames are time-compressed to fit.">Export Duration</label>
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
                        <p class="settings-section-title">Text Defaults</p>

                        <div class="settings-row">
                            <label>Font Family</label>
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
                            <label>Font Size</label>
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
                        <p class="settings-section-title">Shape Defaults</p>

                        <div class="settings-row">
                            <label>Stroke Color</label>
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
                            <label>Background</label>
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
                            <label>Stroke Width</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={defaults().strokeWidth ?? 4}
                                onChange={(e) => updateDefaultStyles({ strokeWidth: parseInt(e.currentTarget.value) || 4 })}
                            />
                        </div>

                        <div class="settings-row">
                            <label>Opacity</label>
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
                            <p class="settings-section-title">Cloud Storage</p>
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
                <label>Provider</label>
                <span style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>Google Drive</span>
            </div>
            <div class="settings-row">
                <label>Account</label>
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
