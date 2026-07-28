/**
 * First-visit onboarding tour — a spotlight walkthrough of the main UI.
 *
 * On a user's first visit the tour auto-starts (once, tracked in localStorage);
 * they can step through the highlights or Skip. It can be replayed anytime from
 * Help (?) or via `window.Yappy.startTour()`. Each step spotlights a UI landmark
 * by CSS selector (dims the rest) and shows a positioned tooltip. A step whose
 * target isn't on screen falls back to a centered card.
 *
 * Inspired by the tinyfly editor's onboarding overlay; restyled to be theme-aware
 * (light/dark) using Yappy's CSS variables instead of hardcoded colours.
 */
import { type Component, Show, For, createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { store } from '../store/app-store';
import './onboarding-tour.css';

const TOUR_KEY = 'yappy:tour:seen';

export interface TourStep {
    id: string;
    title: string;
    content: string;
    /** CSS selector for the element to spotlight. Omit → centered card, full dim. */
    target?: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const tourSteps: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to YappyDraw 👋',
        content: "A quick tour of the essentials — about a minute. Click Next to explore each area, or Skip anytime. You can replay this later from Help (?).",
        target: '.text-logo',
        position: 'bottom',
    },
    {
        id: 'toolbar',
        title: 'Your tools',
        content: 'Pick shapes, pen, text, connectors, images and more here. Click a tool — or press its number key — to switch. Drag the handle to move the toolbar.',
        target: '.toolbar-container',
        position: 'bottom',
    },
    {
        id: 'canvas',
        title: 'The canvas',
        content: 'This is your infinite canvas. Draw or drag to create, click to select, scroll to zoom, and hold Space + drag to pan around.',
        target: '.canvas-drop-zone',
        position: 'center',
    },
    {
        id: 'properties',
        title: 'Properties',
        content: "Select anything to fine-tune it here — fill, stroke, size, text, effects, animation and more. Toggle it with Alt+Enter.",
        target: '.property-panel-container',
        position: 'left',
    },
    {
        id: 'utilities',
        title: 'Settings & Help',
        content: 'Global settings, the Properties toggle, and Help live in this cluster. Open Help (?) for keyboard shortcuts and docs.',
        target: '.floating-tools-cluster',
        position: 'top',
    },
    {
        id: 'finish',
        title: "You're all set 🎨",
        content: "That's the tour! Reopen it anytime from Help (?) → “Take the tour”. Have fun creating.",
        target: '.help-btn',
        position: 'top',
    },
];

const [active, setActive] = createSignal(false);
const [stepIndex, setStepIndex] = createSignal(0);

/** Reactive flag other UI can read to know a tour is in progress. */
export const isTourActive = active;

export function startTour(): void {
    setStepIndex(0);
    setActive(true);
}

/**
 * Persist "this user has been offered the tour". Falls back to an in-memory flag
 * when localStorage is unavailable (private mode, blocked cookies) so the tour at
 * least can't re-fire within the session.
 */
let seenThisSession = false;
function markTourSeen(): void {
    seenThisSession = true;
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
}

export function endTour(markSeen = true): void {
    setActive(false);
    if (markSeen) markTourSeen();
}

export function hasSeenTour(): boolean {
    if (seenThisSession) return true;
    try { return localStorage.getItem(TOUR_KEY) === '1'; } catch { return false; }
}

/**
 * Auto-start the tour on the first ever visit (editor only). Call once from App.
 *
 * The seen-flag is written when the tour *opens*, not when it finishes: the auto-tour
 * is a one-shot offer, so any exit path — Skip, Esc, finishing, or simply reloading /
 * closing the tab mid-tour — must leave it dismissed for good. Writing it only in
 * `endTour` meant an abandoned tour came back on the next load. Replaying from
 * Help (?) → "Take the tour" calls `startTour()` directly and is unaffected.
 */
export function maybeAutoStartTour(): void {
    if (hasSeenTour()) return;
    if (store.appMode === 'presentation') return;
    // Let the landmark components mount + lay out before we measure them.
    setTimeout(() => {
        if (hasSeenTour() || store.appMode === 'presentation') return;
        markTourSeen();
        startTour();
    }, 900);
}

const TOOLTIP_W = 340;
const TOOLTIP_H = 200;
const PAD = 16;

export const OnboardingTour: Component = () => {
    const [rect, setRect] = createSignal<DOMRect | null>(null);
    const [pos, setPos] = createSignal({ top: 0, left: 0 });

    const step = () => tourSteps[stepIndex()];
    const total = () => tourSteps.length;
    const isLast = () => stepIndex() === total() - 1;
    const isFirst = () => stepIndex() === 0;

    const next = () => { if (isLast()) endTour(true); else setStepIndex(i => i + 1); };
    const prev = () => { if (!isFirst()) setStepIndex(i => i - 1); };
    const skip = () => endTour(true);

    const clampToViewport = (top: number, left: number) => ({
        top: Math.max(PAD, Math.min(top, window.innerHeight - TOOLTIP_H - PAD)),
        left: Math.max(PAD, Math.min(left, window.innerWidth - TOOLTIP_W - PAD)),
    });

    const updatePosition = () => {
        const s = step();
        if (!s) return;
        const el = s.target ? document.querySelector(s.target) : null;
        if (!el || s.position === 'center') {
            setRect(el ? el.getBoundingClientRect() : null);
            setPos(clampToViewport(
                window.innerHeight / 2 - TOOLTIP_H / 2,
                window.innerWidth / 2 - TOOLTIP_W / 2,
            ));
            return;
        }
        const r = el.getBoundingClientRect();
        setRect(r);
        let top = 0, left = 0;
        switch (s.position ?? 'bottom') {
            case 'top': top = r.top - TOOLTIP_H - PAD; left = r.left + r.width / 2 - TOOLTIP_W / 2; break;
            case 'bottom': top = r.bottom + PAD; left = r.left + r.width / 2 - TOOLTIP_W / 2; break;
            case 'left': top = r.top + r.height / 2 - TOOLTIP_H / 2; left = r.left - TOOLTIP_W - PAD; break;
            case 'right': top = r.top + r.height / 2 - TOOLTIP_H / 2; left = r.right + PAD; break;
        }
        setPos(clampToViewport(top, left));
    };

    // Recompute whenever the active step changes (and on activation).
    createEffect(() => {
        if (!active()) return;
        stepIndex();
        // Two rafs so freshly-shown landmarks have laid out.
        requestAnimationFrame(() => requestAnimationFrame(updatePosition));
    });

    const onResize = () => { if (active()) updatePosition(); };
    const onKey = (e: KeyboardEvent) => {
        if (!active()) return;
        if (e.key === 'Escape') { e.preventDefault(); skip(); }
        else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };

    onMount(() => {
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onResize, true);
        document.addEventListener('keydown', onKey);
    });
    onCleanup(() => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onResize, true);
        document.removeEventListener('keydown', onKey);
    });

    return (
        <Show when={active()}>
            <div class="tour-overlay" role="dialog" aria-modal="true" aria-label="Product tour">
                {/* Dim + spotlight hole */}
                <svg class="tour-mask" width="100%" height="100%">
                    <defs>
                        <mask id="tour-spotlight">
                            <rect width="100%" height="100%" fill="white" />
                            <Show when={rect()}>
                                <rect
                                    x={rect()!.left - 6} y={rect()!.top - 6}
                                    width={rect()!.width + 12} height={rect()!.height + 12}
                                    rx="10" fill="black"
                                />
                            </Show>
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-spotlight)" />
                </svg>

                <Show when={rect()}>
                    <div class="tour-spotlight-ring" style={{
                        top: `${rect()!.top - 6}px`, left: `${rect()!.left - 6}px`,
                        width: `${rect()!.width + 12}px`, height: `${rect()!.height + 12}px`,
                    }} />
                </Show>

                <div class="tour-tooltip" style={{ top: `${pos().top}px`, left: `${pos().left}px` }}>
                    <div class="tour-tooltip-head">
                        <span class="tour-step-count">{stepIndex() + 1} of {total()}</span>
                        <button class="tour-skip" onClick={skip}>Skip tour</button>
                    </div>
                    <h3 class="tour-title">{step()?.title}</h3>
                    <p class="tour-content">{step()?.content}</p>
                    <div class="tour-nav">
                        <button class="tour-btn tour-btn-secondary" disabled={isFirst()} onClick={prev}>Back</button>
                        <button class="tour-btn tour-btn-primary" onClick={next}>{isLast() ? 'Get started' : 'Next'}</button>
                    </div>
                    <div class="tour-dots">
                        <For each={tourSteps}>
                            {(_, i) => (
                                <button
                                    class="tour-dot"
                                    classList={{ active: i() === stepIndex() }}
                                    aria-label={`Go to step ${i() + 1}`}
                                    onClick={() => setStepIndex(i())}
                                />
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default OnboardingTour;
