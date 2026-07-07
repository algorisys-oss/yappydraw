import { type Component, Show, createEffect, onCleanup, createSignal, For } from 'solid-js';
import { store, setStore } from '../store/app-store';

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

    const features = [
        '100+ shapes, icons & connectors',
        'Sketch & architectural styles',
        'UML, BPMN & flowcharts',
        'Cloud infrastructure diagrams',
        'Data-structure visualizations',
        'Mindmaps & wireframes',
        'Freehand drawing & smart shapes',
        'P3 wide-gamut colors',
        'Gradient & pattern fills',
        '40+ animation presets',
        'Keyframe & morph animations',
        'Slides, transitions & builds',
        'Design studio & templates',
        'No-code game builder',
        'Export PNG · SVG · PDF · HTML',
        '100% local & private',
    ];

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

                <h1 style={{
                    margin: '0', 'font-weight': '800',
                    'font-size': width() < 640 ? '1.4rem' : '2rem',
                    color: 'var(--text-primary, #111827)',
                    'letter-spacing': '-0.01em',
                    opacity: '0', animation: 'wsFadeUp 0.5s ease-out 0.05s forwards',
                }}>
                    Click anywhere to sketch your first idea
                </h1>

                <p style={{
                    margin: '10px 0 0', 'font-size': '0.9rem',
                    color: 'var(--text-secondary, #6b7280)',
                    opacity: '0', animation: 'wsFadeIn 0.6s ease-out 0.25s forwards',
                }}>
                    Everything stays on your machine — nothing is sent to the cloud.
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
                        <For each={features}>
                            {(f) => (
                                <div style={{ display: 'flex', 'align-items': 'center', gap: '9px', 'font-size': '0.85rem', color: 'var(--text-secondary, #6b7280)' }}>
                                    <span style={{ width: '4px', height: '4px', 'border-radius': '50%', background: 'var(--text-secondary, #9ca3af)', opacity: '0.6', 'flex-shrink': '0' }} />
                                    <span>{f}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                <p style={{
                    'margin-top': '26px', 'font-size': '0.8rem',
                    color: 'var(--text-secondary, #9ca3af)', opacity: '0',
                    animation: 'wsFadeIn 0.6s ease-out 0.6s forwards',
                }}>
                    <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>Ctrl+K</strong> command palette
                    &nbsp;·&nbsp; <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>?</strong> help &amp; shortcuts
                </p>
            </div>
        </Show>
    );
};
