/**
 * Dev-server support for the pages that only exist as prerendered HTML.
 *
 * `/founders/` and `/learn/…` are written to `dist/` by `npm run prerender` and
 * served by Apache as real files. The editor has no client route for either, so
 * under `vite dev` they fell through the SPA fallback and rendered the EDITOR —
 * a page that looked like the home page at a URL that is not the home page, with
 * nothing to say it was a dev-only artefact. Every edit to those pages had to be
 * checked with a full `npm run build`.
 *
 * This middleware renders them on demand, into a cache directory, so dev serves
 * the same HTML the deploy does. It is `apply: 'serve'` — the production build
 * still goes through `scripts/prerender.ts` and nothing here runs.
 *
 * `/help/` and `/examples/` are deliberately NOT handled: those DO have client
 * routes, and the interactive versions are what a developer wants to see.
 */

import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv, type Plugin } from 'vite';
import { renderAll } from './render';

/** Paths this plugin owns. Anything else is left to Vite and the SPA. */
const HANDLED = /^\/(founders|learn)(\/|$)|^\/assets\/helpdoc-[0-9a-f]+\.css$/;

export const prerenderDevPlugin = (): Plugin => {
    let outDir: string | null = null;
    let pending: Promise<string> | null = null;

    /**
     * Render every page once per request burst.
     *
     * Re-rendering on each request keeps the output honest while editing the
     * Markdown or the renderer; the promise is shared so a page and its
     * stylesheet do not race two renders against the same directory.
     */
    const render = (): Promise<string> => {
        if (!outDir) outDir = mkdtempSync(path.join(os.tmpdir(), 'yappy-prerender-'));
        const dir = outDir;
        if (!pending) {
            // `lastmodFor` reads git in the real build; dev only needs the pages,
            // and the sitemap dates it produces here are never published.
            pending = renderAll(dir, () => new Date().toISOString().slice(0, 10))
                .then(() => dir)
                .finally(() => {
                    pending = null;
                });
        }
        return pending;
    };

    return {
        name: 'yappy:prerender-dev',
        apply: 'serve',

        /**
         * The renderer reads `process.env`, not `import.meta.env`, so it needs the
         * same `.env` Vite has already loaded for the bundle. Without this the dev
         * page says the Founding Supporter programme "is not open yet" while the
         * built one offers checkout — the same disagreement that once shipped to
         * production (see scripts/prerender.ts). Existing values win.
         */
        configResolved(config) {
            for (const [key, value] of Object.entries(loadEnv(config.mode, config.envDir || config.root, 'VITE_'))) {
                process.env[key] ??= value;
            }
        },

        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = (req.url ?? '').split('?')[0];
                if (!HANDLED.test(url)) return next();

                try {
                    const dir = await render();
                    const isCss = url.endsWith('.css');
                    const file = isCss
                        ? path.join(dir, url.replace(/^\//, ''))
                        : path.join(dir, url.replace(/^\/+|\/+$/g, ''), 'index.html');
                    const body = readFileSync(file);
                    res.setHeader('Content-Type', isCss ? 'text/css' : 'text/html; charset=utf-8');
                    // Never cached in dev: the point is to see the edit you just made.
                    res.setHeader('Cache-Control', 'no-store');
                    res.end(body);
                } catch {
                    // A missing page is a 404 here too, not the editor at the wrong URL.
                    next();
                }
            });
        },
    };
};
