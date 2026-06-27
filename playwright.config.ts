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
    timeout: 30_000,
    use: {
        baseURL: process.env.YAPPY_URL,
        trace: 'off',
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
