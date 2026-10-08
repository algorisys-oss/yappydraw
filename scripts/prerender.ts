#!/usr/bin/env tsx
/**
 * Build step: write the static HTML for every public page (plan §S2).
 *
 * Runs AFTER `vite build`, over the same `dist/` — Vite writes the editor's
 * `index.html` and its chunks, this writes the pages that must be readable
 * without any of them.
 *
 * Run through `tsx` (already a devDependency for the backend server) rather
 * than a second Vite SSR build: the renderer is plain TypeScript over the
 * Markdown pipeline, so there is nothing to bundle, and the build stays one
 * dependency lighter.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';
import { renderAll } from '../frontend/src/prerender/render';

const DIST = path.resolve(import.meta.dirname, '../dist');
const ROOT = path.resolve(import.meta.dirname, '..');

/**
 * Load the same `.env` Vite reads, into `process.env`.
 *
 * This step runs as a separate `tsx` process, so it does NOT inherit Vite's automatic
 * `.env` loading. Without this, one `npm run build` produced a site that disagreed with
 * itself: the bundle had `VITE_SUPPORT_FOUNDERS_URL` baked in and offered the Founding
 * Supporter option, while the prerendered `/founders/` page — built by this process,
 * which never saw the variable — said the programme was not open yet.
 *
 * Existing `process.env` values win, so a variable set by a CI or host build environment
 * still overrides the file, which is how the production deploy is configured.
 */
for (const [key, value] of Object.entries(loadEnv('production', ROOT, 'VITE_'))) {
    process.env[key] ??= value;
}

/**
 * A pre-computed path → date map, written by `scripts/build-lastmod.mjs` into the published
 * tree. Absent in a normal local build, where git below answers correctly.
 */
const lastmodMap: Record<string, string> = (() => {
    const mapPath = path.resolve(import.meta.dirname, '../frontend/src/prerender/lastmod.json');
    try {
        if (!existsSync(mapPath)) return {};
        const parsed = JSON.parse(readFileSync(mapPath, 'utf8'));
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};   // a corrupt map must not fail the build; git and today still answer
    }
})();

/**
 * The date a page's source last changed.
 *
 * Stamping every page with today's date on every deploy is worse than omitting `lastmod` — a
 * crawler that sees 33 pages "change" daily and finds them identical learns to ignore the
 * field. Three sources, in order of how much they can be trusted:
 *
 *   1. **The generated map**, computed in the source repo where history is real.
 *   2. **git**, which is right when this repo is what's being built.
 *   3. **Today**, for a file not committed yet.
 *
 * The map exists because git is NOT right in the place that matters. Hostinger builds the OSS
 * mirror, whose history is one squashed `chore: sync from upstream` commit per release touching
 * every file, so `git log -1` returns the release date for everything — the live sitemap carried
 * one identical date across all 42 URLs until this was fixed. `publish-oss.sh` writes the map
 * into the published tree so the mirror's build does not depend on its own history at all.
 */
const lastmodFor = (source: string): string => {
    const mapped = lastmodMap[source];
    if (mapped) return mapped;
    try {
        const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', source], {
            cwd: path.resolve(import.meta.dirname, '..'),
            encoding: 'utf8',
            // git writes "fatal: not a git repository" to stderr when the tree has no .git —
            // true during `publish-oss.sh --verify`, which builds a `git archive` extraction.
            // The fallback below handles it; don't let the noise look like a build error.
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (out) return out;
    } catch {
        // git missing, or a shallow clone with no history for this path.
    }
    return new Date().toISOString().slice(0, 10);
};

const main = async () => {
    if (!existsSync(DIST)) {
        throw new Error(`No dist/ — run "vite build" before prerendering`);
    }

    const report = await renderAll(DIST, lastmodFor);
    const bytes = report.pages.reduce((n, p) => n + p.bytes, 0);
    const largest = report.pages.reduce((a, b) => (b.bytes > a.bytes ? b : a));

    console.log(
        `\n  prerendered ${report.pages.length} pages · ` +
            `${Math.round(bytes / 1024)} KiB total, largest ${largest.path} at ${Math.round(largest.bytes / 1024)} KiB\n` +
            `  sitemap.xml written with ${report.sitemapUrls} URLs\n`,
    );
};

main().catch((err) => {
    console.error('\nPrerender failed:\n', err);
    process.exit(1);
});
