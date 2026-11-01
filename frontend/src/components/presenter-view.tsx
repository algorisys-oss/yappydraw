/**
 * Presenter view: a second window with the current slide, the next one, the speaker notes, a
 * timer and a clock, while the main window shows the slides to the audience.
 *
 * The window is a same-origin popup that this window renders into with Solid's `render`, so it
 * reads the same store as the editor — there is no message channel to keep in step, and a
 * slide change, a notes edit or the end of the show reaches it the way it reaches any other
 * component. Two consequences of rendering across documents:
 *  - Event handlers use `on:` (native listeners). Solid's ordinary `onClick` is delegated to
 *    the document the component module was loaded in — the editor's — so it never fires here.
 *  - Styles are injected as a <style> text; the app's CSS files only load into the editor.
 *
 * Opening a popup uses up the click's user activation, so the audience window can't also go
 * full screen on the same click (browsers reject the second call). The presentation controls
 * offer a Full screen button for that second click.
 */
import { createSignal, createEffect, on, onCleanup, Show } from "solid-js";
import { render } from "solid-js/web";
import { store, togglePresentationMode, advancePresentation, retreatPresentation } from "../store/app-store";
import { renderPageAtSize } from "../utils/export";
import { nextShowIndex } from "../utils/show-order";
import { showToast } from "./toast";
import { t } from "../i18n";

let presenterWin: Window | null = null;

export const isPresenterViewOpen = (): boolean => !!presenterWin && !presenterWin.closed;

export function closePresenterView(): void {
    const w = presenterWin;
    presenterWin = null;
    if (w && !w.closed) w.close();
}

const NOTES_SIZE_KEY = 'yappy:presenterNotesSize';

/** Picture of one slide as a data URL, `width` px wide. '' when it can't be drawn. */
function slidePicture(index: number, width: number): string {
    const s = store.slides[index];
    if (!s) return '';
    const h = Math.round(width * s.dimensions.height / Math.max(1, s.dimensions.width));
    try {
        return renderPageAtSize(index, width, h, true)?.toDataURL('image/jpeg', 0.85) ?? '';
    } catch {
        return '';
    }
}

const pad = (n: number) => String(n).padStart(2, '0');
const hms = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};

const PresenterView = (props: { win: Window }) => {
    const [current, setCurrent] = createSignal('');
    const [next, setNext] = createSignal('');
    const [now, setNow] = createSignal(Date.now());
    const [elapsed, setElapsed] = createSignal(0);
    const [running, setRunning] = createSignal(true);
    const stored = Number(props.win.localStorage?.getItem(NOTES_SIZE_KEY));
    const [notesSize, setNotesSize] = createSignal(stored >= 12 && stored <= 64 ? stored : 22);

    // Pictures follow the slide. Redrawn once more shortly after, because images on the slide
    // may still be decoding the first time round.
    let redraw = 0;
    // What the show will actually go to next: hidden slides skipped, a looping deck wrapping.
    const nextIndex = () => nextShowIndex(store.slides, store.activeSlideIndex, !!store.globalSettings.slideShowLoop);
    const drawPictures = () => {
        const i = store.activeSlideIndex;
        const n = nextIndex();
        setCurrent(slidePicture(i, 1280));
        setNext(n !== null ? slidePicture(n, 800) : '');
    };
    createEffect(on(() => [store.activeSlideIndex, store.slides.length, store.slides.map(s => !!s.hidden).join(), !!store.globalSettings.slideShowLoop], () => {
        drawPictures();
        props.win.clearTimeout(redraw);
        redraw = props.win.setTimeout(drawPictures, 600);
    }));

    let last = Date.now();
    const tick = props.win.setInterval(() => {
        const n = Date.now();
        if (running()) setElapsed(e => e + (n - last));
        last = n;
        setNow(n);
    }, 250);
    onCleanup(() => { props.win.clearInterval(tick); props.win.clearTimeout(redraw); });

    // The show ending (Esc in either window, the HUD's Exit) closes this window too. Only the
    // transition counts: the window is drawn a moment before the show starts.
    createEffect(on(() => store.appMode, (mode, prev) => {
        if (prev === 'presentation' && mode !== 'presentation') closePresenterView();
    }));

    const sizeNotes = (d: number) => {
        const v = Math.max(12, Math.min(64, notesSize() + d));
        setNotesSize(v);
        try { props.win.localStorage?.setItem(NOTES_SIZE_KEY, String(v)); } catch { /* private mode */ }
    };

    const notes = () => store.slides[store.activeSlideIndex]?.notes ?? '';
    const isLast = () => nextIndex() === null;
    const clock = () => new Date(now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div class="pv">
            <header class="pv-bar">
                <span class="pv-count">{t('presenter.slideOf', { n: store.activeSlideIndex + 1, total: store.slides.length })}</span>
                <span class="pv-timer" data-testid="presenter-timer">{hms(elapsed())}</span>
                <button on:click={() => setRunning(r => !r)}>{running() ? t('presenter.pause') : t('presenter.resume')}</button>
                <button on:click={() => setElapsed(0)}>{t('presenter.reset')}</button>
                <span class="pv-spacer" />
                <span class="pv-clock">{clock()}</span>
            </header>
            <main class="pv-main">
                <section class="pv-current">
                    <Show when={current()} fallback={<div class="pv-blank" />}>
                        <img src={current()} alt={t('presenter.current')} data-testid="presenter-current" />
                    </Show>
                </section>
                <aside class="pv-side">
                    <div class="pv-label">{t('presenter.next')}</div>
                    <div class="pv-next">
                        <Show when={!isLast()} fallback={<div class="pv-end">{t('presenter.end')}</div>}>
                            <Show when={next()} fallback={<div class="pv-blank" />}>
                                <img src={next()} alt={t('presenter.next')} data-testid="presenter-next" />
                            </Show>
                        </Show>
                    </div>
                    <div class="pv-notes-head">
                        <span class="pv-label">{t('presenter.notes')}</span>
                        <button on:click={() => sizeNotes(-2)} title={t('presenter.smaller')} aria-label={t('presenter.smaller')}>A−</button>
                        <button on:click={() => sizeNotes(2)} title={t('presenter.larger')} aria-label={t('presenter.larger')}>A+</button>
                    </div>
                    <div class="pv-notes" data-testid="presenter-notes" style={{ 'font-size': `${notesSize()}px` }}>
                        <Show when={notes().trim()} fallback={<span class="pv-none">{t('presenter.noNotes')}</span>}>
                            {notes()}
                        </Show>
                    </div>
                </aside>
            </main>
            <footer class="pv-bar">
                <button on:click={() => void retreatPresentation()} disabled={store.activeSlideIndex === 0}>‹ {t('presenter.previous')}</button>
                <button class="pv-primary" on:click={() => void advancePresentation()}>{t('presenter.advance')} ›</button>
                <span class="pv-spacer" />
                <button on:click={() => togglePresentationMode(false)}>{t('presenter.endShow')}</button>
            </footer>
        </div>
    );
};

const CSS = `
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#16181d;color:#e8eaed;font-family:Inter,system-ui,sans-serif}
.pv{display:flex;flex-direction:column;height:100vh}
.pv-bar{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#1f2229;border-bottom:1px solid #2c3039}
footer.pv-bar{border-bottom:0;border-top:1px solid #2c3039}
.pv-count{font-weight:600}
.pv-timer{font-variant-numeric:tabular-nums;font-size:22px;font-weight:600;margin-left:12px}
.pv-clock{font-variant-numeric:tabular-nums;font-size:18px;color:#aab0bb}
.pv-spacer{flex:1}
button{background:#2c3039;color:#e8eaed;border:1px solid #3a3f4b;border-radius:6px;padding:6px 12px;font:inherit;cursor:pointer}
button:hover:not(:disabled){background:#373c47}
button:disabled{opacity:.4;cursor:default}
.pv-primary{background:#3b5bdb;border-color:#3b5bdb}
.pv-primary:hover{background:#4c6ef5!important}
.pv-main{flex:1;display:flex;gap:16px;padding:16px;min-height:0}
.pv-current{flex:3;display:flex;align-items:center;justify-content:center;min-width:0}
.pv-current img,.pv-next img{max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 4px 24px rgba(0,0,0,.5);background:#fff}
.pv-side{flex:2;display:flex;flex-direction:column;gap:8px;min-width:0}
.pv-label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#aab0bb}
.pv-next{height:30%;display:flex;align-items:center;justify-content:center}
.pv-end{color:#aab0bb}
.pv-blank{width:100%;height:100%;background:#2c3039}
.pv-notes-head{display:flex;align-items:center;gap:6px;margin-top:8px}
.pv-notes-head .pv-label{flex:1}
.pv-notes-head button{padding:2px 8px}
.pv-notes{flex:1;overflow:auto;white-space:pre-wrap;line-height:1.45;padding:12px;background:#1f2229;border-radius:8px}
.pv-none{color:#6b7280;font-style:italic}
`;

/**
 * Open the presenter view and start the show from the current slide. Must run inside a click
 * or key handler: the popup needs the user's gesture. Returns false when the browser blocked it.
 */
export function openPresenterView(): boolean {
    if (isPresenterViewOpen()) {
        presenterWin!.focus();
        if (store.appMode !== 'presentation') void togglePresentationMode(true);
        return true;
    }
    const w = window.open('', 'yappy-presenter', 'popup,width=1200,height=760');
    if (!w) {
        showToast(t('presenter.blocked'), 'error', 6000);
        return false;
    }
    presenterWin = w;
    const doc = w.document;
    doc.title = t('presenter.title');
    // A window left over under the same name (a show presented earlier) is reused by the
    // browser: start from an empty document either way.
    doc.head.querySelectorAll('style').forEach(s => s.remove());
    doc.body.innerHTML = '';
    const style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.appendChild(style);
    const root = doc.createElement('div');
    doc.body.appendChild(root);
    const dispose = render(() => <PresenterView win={w} />, root);

    // The show's keys work from this window too, so the presenter never has to click back.
    w.addEventListener('keydown', (e: KeyboardEvent) => {
        if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); void advancePresentation(); }
        else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); void retreatPresentation(); }
        else if (e.key === 'Escape') { e.preventDefault(); void togglePresentationMode(false); }
    });
    let disposed = false;
    const cleanup = () => {
        if (disposed) return;
        disposed = true;
        dispose();
        if (presenterWin === w) presenterWin = null;
    };
    w.addEventListener('pagehide', cleanup);
    // Not every way of closing a popup fires its pagehide where we can hear it; the editor
    // checks for itself so a closed window never keeps its reactive tree alive.
    const watch = window.setInterval(() => { if (w.closed) { window.clearInterval(watch); cleanup(); } }, 1000);
    window.addEventListener('pagehide', () => closePresenterView(), { once: true });

    if (store.appMode !== 'presentation') void togglePresentationMode(true);
    return true;
}
