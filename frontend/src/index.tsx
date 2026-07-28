/* @refresh reload */
import { render } from 'solid-js/web'
import { createSignal, createEffect, onMount, lazy, Suspense, Switch, Match, ErrorBoundary } from 'solid-js'
import './index.css'
import App from './app.tsx'
import { loadDocument, setStore } from './store/app-store'
import { isSlideDocument, migrateToSlideFormat } from './utils/migration'
import { storage } from './storage/file-system-storage'

// Lazy load pages to reduce initial bundle
const HelpPage = lazy(() => import('./help-docs/help-page'))
const ExamplesPage = lazy(() => import('./examples/examples-page'))
const EmbedViewer = lazy(() => import('./components/embed-viewer'))

const root = document.getElementById('root')

// Track if we're currently loading an example to prevent double-loading
let isLoadingExample = false

// Simple hash-based router
const Router = () => {
    const [route, setRoute] = createSignal(window.location.hash)

    onMount(() => {
        const handleHashChange = () => setRoute(window.location.hash)
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    })

    // Watch for route changes and load examples from hash parameter
    createEffect(() => {
        const currentRoute = route()
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

    const isEmbedRoute = () => route().startsWith('#/embed/')
    const isHelpRoute = () => route().startsWith('#/help') || route() === '#help'
    const isExamplesRoute = () => route().startsWith('#/examples') || route() === '#examples'

    const LoadingFallback = () => (
        <div style={{ padding: '2rem', 'text-align': 'center' }}>Loading...</div>
    )

    /**
     * Route-level failure UI. A `lazy()` chunk that fails to fetch — the usual cause
     * being a cached index.html pointing at a hash that no longer exists after a
     * deploy — would otherwise leave `LoadingFallback` on screen forever, because
     * Suspense has no concept of "this will never resolve". Reload picks up the new
     * index.html and its current chunk names.
     */
    const RouteError = (err: any, reset: () => void) => (
        <div style={{ padding: '2rem', 'text-align': 'center', font: '14px/1.6 system-ui, sans-serif' }}>
            <p><strong>Something went wrong.</strong></p>
            <p style={{ color: '#64748b' }}>
                If this happened right after an update it’s a stale cached version, and reloading
                fixes it. Your saved drawings are not affected.
            </p>
            <p style={{ 'margin-top': '12px' }}>
                <button type="button" onClick={() => location.reload()}
                    style={{ padding: '7px 16px', font: 'inherit', 'font-weight': '600', color: '#fff', background: '#4c8dff', border: '0', 'border-radius': '6px', cursor: 'pointer' }}>
                    Reload
                </button>
                <button type="button" onClick={reset}
                    style={{ 'margin-left': '8px', padding: '7px 16px', font: 'inherit', cursor: 'pointer' }}>
                    Try again
                </button>
            </p>
            <pre style={{ 'margin-top': '16px', 'font-size': '11px', color: '#94a3b8', 'white-space': 'pre-wrap' }}>
                {String(err?.message ?? err)}
            </pre>
        </div>
    )

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
            '<p style="margin-top:12px"><button type="button" onclick="location.reload()" ' +
            'style="padding:7px 16px;font:inherit;font-weight:600;color:#fff;background:#4c8dff;border:0;border-radius:6px;cursor:pointer">' +
            'Reload</button></p></div>'
    }
} finally {
    dismissSplash()
}
