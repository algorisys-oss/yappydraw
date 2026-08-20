// Vite plugin: help documentation Markdown → a plain data module.
//
// Imports of `help-docs/**/*.md` become `{ meta, html, headings }`, rendered at
// BUILD time by ./markdown.ts. Nothing about Markdown reaches the browser —
// `marked` is a devDependency and the app ships finished HTML strings, which is
// less JavaScript than the JSX doc components this replaces.
//
// Rendering here rather than in the app is also what makes the Phase 2
// prerenderer possible: the same module can be imported by a Node-side SSR build
// to write static HTML for `/help/<doc>/`, so the in-app page and the indexable
// page cannot drift (docs/i18n-seo-plan.md §S2).
//
// A malformed document fails the BUILD with its filename, rather than rendering
// a broken page: front-matter and admonition errors are thrown by renderHelpDoc
// and surfaced through `this.error`.

import path from 'path';
import type { Plugin } from 'vite';
import { renderHelpDoc } from './markdown';

const HELP_DOCS = path.resolve(__dirname);

const isHelpDoc = (id: string): boolean => {
    const [file] = id.split('?');
    return file.endsWith('.md') && path.resolve(file).startsWith(HELP_DOCS);
};

export function helpMarkdownPlugin(): Plugin {
    return {
        name: 'yappy:help-markdown',
        // Ahead of Vite's own asset handling, which would otherwise treat .md as
        // a static file and hand back a URL string.
        enforce: 'pre',

        transform(code, id) {
            if (!isHelpDoc(id)) return null;

            const filename = path.relative(HELP_DOCS, id.split('?')[0]);
            let doc;
            try {
                doc = renderHelpDoc(code, filename);
            } catch (err) {
                this.error(`[help-markdown] ${(err as Error).message}`);
            }

            // `?meta` yields the front-matter ALONE. The help page's registry needs
            // every document's name, icon and category up front to draw the
            // sidebar, but must not drag 31 documents' HTML into the entry chunk
            // to get them. So the index imports `./doc.md?meta` statically
            // (a few hundred bytes) and `lazy()`-imports `./doc.md` for the body.
            // One source of truth — the front-matter — and no duplicated registry.
            if (id.includes('?meta')) {
                return { code: `export const meta = ${JSON.stringify(doc!.meta)};\nexport default meta;\n`, map: null };
            }

            // JSON.stringify handles the escaping; the module is data only, so
            // there is nothing to tree-shake or minify badly.
            return {
                code:
                    `export const meta = ${JSON.stringify(doc!.meta)};\n` +
                    `export const html = ${JSON.stringify(doc!.html)};\n` +
                    `export const headings = ${JSON.stringify(doc!.headings)};\n` +
                    `export default { meta, html, headings };\n`,
                map: null,
            };
        },

        // Editing a doc in dev should refresh the page rather than hot-swap a
        // data module into a `lazy()` boundary that has already resolved.
        handleHotUpdate(ctx) {
            if (!isHelpDoc(ctx.file)) return;
            ctx.server.ws.send({ type: 'full-reload' });
            return [];
        },
    };
}
