/* @refresh reload */
import { render } from 'solid-js/web'
import { createSignal, createEffect, onMount, lazy, Suspense, Switch, Match, ErrorBoundary } from 'solid-js'
import './index.css'
import App from './app.tsx'
import { loadDocument, setStore, store, undo } from './store/app-store'
import { isSlideDocument, migrateToSlideFormat } from './utils/migration'
import { storage } from './storage/file-system-storage'
import { preloadAppFonts } from './utils/font-loading'
import { recoverFromStaleBuild, installStaleBuildHandler, forceReloadLatest } from './utils/stale-build'
import { initI18n } from './i18n'
import { parsePath } from './routes'
import { currentPath, migrateLegacyHash } from './navigation'

// Old `#/help/uml` links become `/help/uml/` BEFORE the first render, so a
// bookmark from before the migration never flashes the wrong page on its way to
// the right one (plan §S1). Embeds and the editor's own `#load=` / `#doc=`
// parameters are deliberately left alone.
migrateLegacyHash()

// Pick the user's language. Deliberately NOT awaited, and that is not a
// shortcut: English is compiled into the entry chunk and is already the active
// dictionary, so there is nothing to wait for. `initI18n` sets <html lang>/<dir>
// synchronously and, if a translated locale is selected, swaps the dictionary
// when it arrives — `t` is a signal, so the UI re-renders itself. Awaiting here
// would block first paint on a fetch to show text we already have.
void initI18n()

// Kick the webfonts off before anything can measure text with them. Auto-sized elements
// write the measured width into the SAVED document, so a measurement taken against the
// fallback font is a permanent error, not a transient one. Fire-and-forget: it must never
// delay or break boot (see utils/font-loading.ts).
preloadAppFonts()

// Catch chunk failures from imports that happen after boot (Help, export, …),
// which reject outside any ErrorBoundary.
installStaleBuildHandler()

// Lazy load pages to reduce initial bundle
const HelpPage = lazy(() => import('./help-docs/help-page'))
const ExamplesPage = lazy(() => import('./examples/examples-page'))
const EmbedViewer = lazy(() => import('./components/embed-viewer'))

const root = document.getElementById('root')

// Track if we're currently loading an example to prevent double-loading
let isLoadingExample = false

/**
 * Path router, with the editor's hash parameters riding along.
 *
 * Public pages are real URLs (`/help/uml/`) so they can be prerendered and
 * indexed — see routes.ts. The hash is still read, but only for things that are
 * NOT pages: `#/embed/…` (other people's iframes), `#load=` and `#doc=` (which
 * drawing the editor has open).
 */
const Router = () => {
    const [hash, setHash] = createSignal(window.location.hash)
    const route = () => parsePath(currentPath())

    onMount(() => {
        const handleHashChange = () => setHash(window.location.hash)
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    })

    // Watch for route changes and load examples from hash parameter
    createEffect(() => {
        const currentRoute = hash()
        // Check for #load=filename pattern (from Examples page)
        if (currentRoute.startsWith('#load=') && !isLoadingExample) {
            const fileName = decodeURIComponent(currentRoute.substring(6))
            if (fileName) {
                isLoadingExample = true
                // Defer loading to ensure App is mounted and store is initialized
                setTimeout(async () => {
                    try {
                        let data = null

                        // Try static file first (works without backend server)
                        const jsonFileName = fileName.replace(/\.yappy$/, '.json')
                        const basePath = import.meta.env.BASE_URL || '/'
                        const exampleUrl = `${basePath}examples/${jsonFileName}`.replace('//', '/')
                        try {
                            const response = await fetch(exampleUrl)
                            if (response.ok) {
                                data = await response.json()
                            }
                        } catch {
                            // Static file not found, will try API fallback
                        }

                        // Fall back to API (requires backend server)
                        if (!data) {
                            const drawingId = fileName.replace(/\.(json|yappy)$/i, '')
                            data = await storage.loadDrawing(drawingId)
                        }

                        if (data) {
                            const doc = isSlideDocument(data) ? data : migrateToSlideFormat(data)
                            loadDocument(doc)
                            setStore('welcomeDismissed', true)
                        }
                        // Update URL to show the loaded document (change #load= to #doc= to prevent re-loading)
                        const docName = fileName.replace(/\.(json|yappy)$/i, '')
                        window.history.replaceState(null, '', `${window.location.pathname}#doc=${encodeURIComponent(docName)}`)
                    } catch (err) {
                        console.error('Failed to load example:', err)
                    } finally {
                        isLoadingExample = false
                    }
                }, 300)
            }
        }
    })

    const isEmbedRoute = () => hash().startsWith('#/embed/')
    const isHelpRoute = () => route()?.key === 'help' || route()?.key === 'helpDoc'
    const isExamplesRoute = () => route()?.key === 'examples' || route()?.key === 'example'

    const LoadingFallback = () => (
        <div style={{ padding: '2rem', 'text-align': 'center' }}>Loading...</div>
    )

    /**
     * Route-level failure UI. A `lazy()` chunk that fails to fetch — the usual cause
     * being a cached index.html pointing at a hash that no longer exists after a
     * deploy — would otherwise leave `LoadingFallback` on screen forever, because
     * Suspense has no concept of "this will never resolve". Reload picks up the new
     * index.html and its current chunk names.
     *
     * That case now heals itself: `recoverFromStaleBuild` reloads once (guarded
     * against loops) so the user never sees this screen for a cache problem. What
     * reaches the UI below is therefore a *real* error, and it's logged with its
     * stack — the old screen printed only `err.message`, which was rarely enough
     * to act on.
     *
     * The button is a HARD reload (`forceReloadLatest`), not `location.reload()`.
     * A plain reload keeps the page's service worker, and with our `prompt`
     * strategy that worker keeps serving the very build that just failed — which
     * is why "Reload" looked broken and only closing the tab helped.
     *
     * "Undo last change" exists because this screen used to be a trap. When the error
     * comes from an *edit* — a Pathfinder op, a delete — the document and the whole undo
     * stack are still intact in the module-level store; it is only the UI that is gone,
     * and with it every route to Ctrl+Z. A user reported exactly that: "things cannot be
     * undone using undo after this happens". Undoing the offending edit and then remounting
     * removes the state that threw, so the editor comes back with the work restored.
     * Ordering matters — `undo()` must run before `reset()`, or the remounted UI reads the
     * bad state again and throws straight back to this screen.
     */
    const RouteError = (err: any, reset: () => void) => {
        if (recoverFromStaleBuild(err)) {
            return <div style={{ padding: '2rem', 'text-align': 'center' }}>Updating to the latest version…</div>
        }
        console.error('[yappy] Route error:', err)
        const btn = { padding: '7px 16px', font: 'inherit', cursor: 'pointer', 'margin-left': '8px' }
        return (
        <div style={{ padding: '2rem', 'text-align': 'center', font: '14px/1.6 system-ui, sans-serif' }}>
            <p><strong>Something went wrong.</strong></p>
            <p style={{ color: '#64748b' }}>
                Your saved drawings are not affected. Reloading fixes most cases; if it keeps
                happening, the details below are worth reporting.
            </p>
            <p style={{ 'margin-top': '12px' }}>
                <button type="button" onClick={() => forceReloadLatest()}
                    style={{ padding: '7px 16px', font: 'inherit', 'font-weight': '600', color: '#fff', background: '#4c8dff', border: '0', 'border-radius': '6px', cursor: 'pointer' }}>
                    Reload
                </button>
                {store.undoStackLength > 0 && (
                    <button type="button"
                        title="Undo the change that caused this, then reopen the editor"
                        onClick={() => { try { undo() } catch (e) { console.error('[yappy] Undo-and-recover failed:', e) } reset() }}
                        style={btn}>
                        Undo last change
                    </button>
                )}
                <button type="button" onClick={reset} style={btn}>
                    Try again
                </button>
            </p>
            <pre style={{ 'margin-top': '16px', 'font-size': '11px', color: '#94a3b8', 'white-space': 'pre-wrap', 'text-align': 'left', 'max-width': '640px', margin: '16px auto 0', 'overflow-x': 'auto' }}>
                {String(err?.stack ?? err?.message ?? err)}
            </pre>
        </div>
        )
    }

    return (
        <ErrorBoundary fallback={RouteError}>
            <Switch fallback={<App />}>
                <Match when={isEmbedRoute()}>
                    <Suspense fallback={<LoadingFallback />}>
                        <EmbedViewer />
                    </Suspense>
                </Match>
                <Match when={isHelpRoute()}>
                    <Suspense fallback={<LoadingFallback />}>
                        <HelpPage />
                    </Suspense>
                </Match>
                <Match when={isExamplesRoute()}>
                    <Suspense fallback={<LoadingFallback />}>
                        <ExamplesPage />
                    </Suspense>
                </Match>
            </Switch>
        </ErrorBoundary>
    )
}

/**
 * Fade out the boot splash (defined in index.html) and cancel the HTML failsafe.
 * Idempotent — safe to call from more than one place.
 */
function dismissSplash() {
    clearTimeout((window as any).__yappyBootFailsafe)
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('splash--done')
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
    setTimeout(() => splash.remove(), 900)
}

// The splash teardown MUST run even when the first render throws. Previously it sat
// after `render()` with no guard, so any boot-time exception (a corrupt value in
// localStorage read during component init was the real-world case) stranded the
// mascot on screen permanently — the app looked like it was still loading.
try {
    render(() => <Router />, root!)
} catch (err) {
    console.error('[boot] initial render failed:', err)
    if (root) {
        root.innerHTML =
            '<div style="padding:2rem;text-align:center;font:14px/1.6 system-ui,sans-serif">' +
            '<p><strong>YappyDraw failed to start.</strong></p>' +
            '<p style="color:#64748b">Reloading usually fixes it. Your saved drawings are not affected.</p>' +
            '<p style="margin-top:12px"><button type="button" id="boot-reload" ' +
            'style="padding:7px 16px;font:inherit;font-weight:600;color:#fff;background:#4c8dff;border:0;border-radius:6px;cursor:pointer">' +
            'Reload</button></p></div>'
        // Wired here rather than as an inline `onclick="location.reload()"`: a plain
        // reload keeps the current service worker, so it can hand back the same broken
        // build. forceReloadLatest drops the worker and its caches first.
        root.querySelector('#boot-reload')?.addEventListener('click', () => forceReloadLatest())
    }
} finally {
    dismissSplash()
}
