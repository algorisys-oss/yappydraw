import { type Component, Show, createEffect, onCleanup, onMount, createSignal, For } from 'solid-js';
import { store, setStore } from '../store/app-store';
import { YappyMascot } from './mascot';
import { listDrawings, openDrawing, type DrawingMeta } from '../storage/drawings-store';
import { setShowDrawingsGallery } from './drawings-gallery-signal';
import { t, type WelcomeFeatureKey } from '../i18n';

/**
 * Welcome screen — shown on an empty canvas. A single bold call to action over a
 * quiet, muted list of what Yappy can do. No pointer arrows / UI callouts: the
 * canvas itself is the invitation.
 */
export const WelcomeScreen: Component = () => {
    const isVisible = () =>
        store.elements.length === 0 &&
        store.selectedTool === 'selection' &&
        store.appMode !== 'presentation' &&
        !store.zenMode &&
        !store.welcomeDismissed;

    // Once anything is drawn, permanently dismiss so it doesn't reappear on delete-all.
    createEffect(() => {
        if (store.elements.length > 0 && !store.welcomeDismissed) setStore('welcomeDismissed', true);
    });

    const [width, setWidth] = createSignal(window.innerWidth);
    createEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        onCleanup(() => window.removeEventListener('resize', handler));
    });

    // "Jump back in" — recent saved drawings (returning users land on their library).
    const [recents, setRecents] = createSignal<DrawingMeta[]>([]);
    onMount(async () => {
        try { setRecents((await listDrawings()).slice(0, 6)); } catch { /* gallery is best-effort */ }
    });
    const openRecent = async (d: DrawingMeta) => { await openDrawing(d.id); };

    /**
     * Display order for the capability list; the text itself lives in the
     * dictionary. A FUNCTION, not a const array: a const would be evaluated once
     * when the component is created and would still be showing English after a
     * language switch. Reading `t` inside the accessor is what makes it update.
     */
    const FEATURE_ORDER: WelcomeFeatureKey[] = [
        'shapes', 'styles', 'diagrams', 'cloud', 'dataStructures', 'mindmaps',
        'freehand', 'color', 'fills', 'animationPresets', 'keyframes', 'slides',
        'designStudio', 'games', 'export', 'privacy',
    ];
    const features = () => FEATURE_ORDER.map((key) => t(`welcomeFeatures.${key}`));

    return (
        <Show when={isVisible()}>
            <div style={{
                position: 'absolute', inset: '0', 'pointer-events': 'none', 'z-index': '10',
                display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
                padding: '24px', 'text-align': 'center', 'font-family': 'Inter, sans-serif', overflow: 'hidden',
            }}>
                <style>{`
                    @keyframes wsFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes wsFadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>

                <div style={{ opacity: '0', animation: 'wsFadeUp 0.5s ease-out 0s forwards' }}>
                    <YappyMascot size={width() < 640 ? 168 : 210} />
                </div>

                <h1 style={{
                    margin: '0', 'font-weight': '800',
                    'font-size': width() < 640 ? '1.4rem' : '2rem',
                    color: 'var(--text-primary, #111827)',
                    'letter-spacing': '-0.01em',
                    opacity: '0', animation: 'wsFadeUp 0.5s ease-out 0.05s forwards',
                }}>
                    {t('welcome.headline')}
                </h1>

                <p style={{
                    margin: '10px 0 0', 'font-size': '0.9rem',
                    color: 'var(--text-secondary, #6b7280)',
                    opacity: '0', animation: 'wsFadeIn 0.6s ease-out 0.25s forwards',
                }}>
                    {t('welcome.privacyNote')}
                </p>

                {/* Muted, organized feature list */}
                <Show when={width() > 560}>
                    <div style={{
                        'margin-top': '26px', 'max-width': '640px',
                        display: 'grid',
                        'grid-template-columns': width() > 900 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                        'gap': '7px 40px', 'text-align': 'left',
                        opacity: '0', animation: 'wsFadeUp 0.6s ease-out 0.4s forwards',
                    }}>
                        <For each={features()}>
                            {(f) => (
                                <div style={{ display: 'flex', 'align-items': 'center', gap: '9px', 'font-size': '0.85rem', color: 'var(--text-secondary, #6b7280)' }}>
                                    <span style={{ width: '4px', height: '4px', 'border-radius': '50%', background: 'var(--text-secondary, #9ca3af)', opacity: '0.6', 'flex-shrink': '0' }} />
                                    <span>{f}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Jump back in — recent saved drawings (interactive: re-enable pointer events) */}
                <Show when={recents().length > 0}>
                    <div style={{
                        'margin-top': '28px', 'pointer-events': 'auto', 'max-width': '680px', width: '100%',
                        opacity: '0', animation: 'wsFadeUp 0.6s ease-out 0.5s forwards',
                    }}>
                        <div style={{
                            display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: '10px',
                            'margin-bottom': '12px', 'font-size': '0.8rem', color: 'var(--text-secondary, #6b7280)',
                        }}>
                            <span style={{ 'font-weight': '600' }}>{t('welcome.jumpBackIn')}</span>
                            <button onClick={() => setShowDrawingsGallery(true)} style={{
                                'font-size': '0.78rem', color: 'var(--accent-color, #6366f1)', background: 'transparent',
                                border: 'none', cursor: 'pointer', 'font-weight': '600',
                            }}>{t('welcome.myDrawings')}</button>
                        </div>
                        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '12px', 'justify-content': 'center' }}>
                            <For each={recents()}>
                                {(d) => (
                                    <button onClick={() => openRecent(d)} title={t('welcome.openDrawing', { name: d.name })} style={{
                                        width: '120px', padding: '0', border: '1px solid var(--border-color, #e5e7eb)',
                                        'border-radius': '10px', overflow: 'hidden', background: 'var(--bg-secondary, #f9fafb)',
                                        cursor: 'pointer', 'text-align': 'left', 'font-family': 'inherit',
                                    }}>
                                        <div style={{
                                            'aspect-ratio': '4 / 3', background: 'var(--bg-surface, #fff)',
                                            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
                                            'border-bottom': '1px solid var(--border-color, #e5e7eb)',
                                        }}>
                                            <Show when={d.thumb} fallback={<span style={{ color: 'var(--text-secondary, #9ca3af)', 'font-size': '0.7rem' }}>{t('welcome.noPreview')}</span>}>
                                                <img src={d.thumb} alt="" loading="lazy" style={{ width: '100%', height: '100%', 'object-fit': 'contain' }} />
                                            </Show>
                                        </div>
                                        <div style={{
                                            padding: '6px 8px', 'font-size': '0.75rem', 'font-weight': '600',
                                            color: 'var(--text-primary, #111827)', 'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis',
                                        }}>{d.name}</div>
                                    </button>
                                )}
                            </For>
                        </div>
                    </div>
                </Show>

                <p style={{
                    'margin-top': '26px', 'font-size': '0.8rem',
                    color: 'var(--text-secondary, #9ca3af)', opacity: '0',
                    animation: 'wsFadeIn 0.6s ease-out 0.6s forwards',
                }}>
                    {/* Ctrl+K and ? are key bindings, so they stay literal — only the
                        descriptions around them are translated (plan §3.3). */}
                    <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>Ctrl+K</strong> {t('welcome.commandPaletteHint')}
                    &nbsp;·&nbsp; <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>?</strong> {t('welcome.helpHint')}
                </p>
            </div>
        </Show>
    );
};
