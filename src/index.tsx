/* @refresh reload */
import { render } from 'solid-js/web'
import { createSignal, createEffect, onMount, lazy, Suspense, Switch, Match } from 'solid-js'
import './index.css'
import App from './app.tsx'
import { loadDocument, setStore } from './store/app-store'
import { isSlideDocument, migrateToSlideFormat } from './utils/migration'
import { storage } from './storage/file-system-storage'

// Lazy load pages to reduce initial bundle
const HelpPage = lazy(() => import('./help-docs/help-page'))
const ExamplesPage = lazy(() => import('./examples/examples-page'))

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

    const isHelpRoute = () => route().startsWith('#/help') || route() === '#help'
    const isExamplesRoute = () => route().startsWith('#/examples') || route() === '#examples'

    const LoadingFallback = () => (
        <div style={{ padding: '2rem', 'text-align': 'center' }}>Loading...</div>
    )

    return (
        <Switch fallback={<App />}>
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
    )
}

render(() => <Router />, root!)
