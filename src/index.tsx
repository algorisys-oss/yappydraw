/* @refresh reload */
import { render } from 'solid-js/web'
import { createSignal, onMount, Show, lazy, Suspense } from 'solid-js'
import './index.css'
import App from './app.tsx'

// Lazy load HelpPage to reduce initial bundle
const HelpPage = lazy(() => import('./help-docs/help-page'))

const root = document.getElementById('root')

// Simple hash-based router
const Router = () => {
    const [route, setRoute] = createSignal(window.location.hash)

    onMount(() => {
        const handleHashChange = () => setRoute(window.location.hash)
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    })

    const isHelpRoute = () => route().startsWith('#/help') || route() === '#help'

    return (
        <Show when={isHelpRoute()} fallback={<App />}>
            <Suspense fallback={<div style={{ padding: '2rem', 'text-align': 'center' }}>Loading...</div>}>
                <HelpPage />
            </Suspense>
        </Show>
    )
}

render(() => <Router />, root!)
