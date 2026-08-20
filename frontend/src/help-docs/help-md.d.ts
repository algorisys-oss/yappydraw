/**
 * Module shapes for the help documents' Markdown imports.
 *
 * `vite-plugin-help-md` turns each `.md` file under `help-docs/` into a plain
 * data module at build time. Two forms:
 *
 *   import doc from './x.md'          → { meta, html, headings }
 *   import { meta } from './x.md?meta' → the front matter alone
 *
 * The `?meta` form exists so the help page's registry can list every document
 * without pulling 31 documents' HTML into the entry chunk.
 */

declare module '*.md?meta' {
    import type { DocMeta } from './markdown';
    export const meta: DocMeta;
    const _default: DocMeta;
    export default _default;
}

declare module '*.md' {
    import type { DocMeta, RenderedDoc } from './markdown';
    export const meta: DocMeta;
    export const html: string;
    export const headings: { id: string; text: string }[];
    const _default: RenderedDoc;
    export default _default;
}
