import { defineConfig } from '@playwright/test';

/**
 * Playwright config. Most specs read `process.env.YAPPY_URL` (falling back to a
 * hardcoded localhost port); we default that to the dev server below so the suite
 * is self-hosting: `npx playwright test` just works, no manual server juggling.
 *
 * Override the target with `YAPPY_URL=http://localhost:5174 npx playwright test`
 * to point at an already-running instance (the webServer then reuses it).
 */
process.env.YAPPY_URL ||= 'http://localhost:5173';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    /**
     * Cap the workers. `fullyParallel: false` only serialises tests WITHIN a file —
     * Playwright still runs spec *files* across CPU/2 workers, and they all hammer the
     * single dev server below. That contention produced failures that passed every time
     * on a re-run in isolation, which costs a diagnostic cycle each time to rule out.
     * Two workers keeps most of the speed-up without the false signal.
     */
    workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 2,
    timeout: 30_000,
    use: {
        baseURL: process.env.YAPPY_URL,
        trace: 'off',
        // Pre-seed the "tour seen" flag: the first-visit onboarding tour
        // (components/onboarding-tour.tsx) is a modal overlay that would
        // otherwise intercept pointer events in every click-driven spec.
        storageState: {
            cookies: [],
            origins: [{
                origin: new URL(process.env.YAPPY_URL).origin,
                localStorage: [{ name: 'yappy:tour:seen', value: '1' }],
            }],
        },
    },
    // Start a Vite dev server on 5173 unless one is already listening there
    // (reuseExistingServer). Frontend-only — backend `/api` calls aren't needed
    // for the window.Yappy specs.
    webServer: {
        command: 'npx vite --port 5173 --strictPort',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
