import type { DrawingElement } from "../types";
import { mindmapChildren } from "./mindmap-layout";
import { saveBlob } from "./save-file";

/**
 * Mind map → text. The way out of the app for a tree that was easy to get in.
 *
 * `parseOutline` has always turned an indented list into a subtree, so a map could be built
 * from notes in one paste — but there was no path back. A mind map that can only leave as a PNG
 * can't be diffed, searched, pasted into a doc, handed to an LLM, or opened in another outliner.
 *
 * `markdown` and `text` are chosen so `parseOutline` reads them back unchanged: two-space
 * indentation, and `-` bullets which it strips. `opml` is the interchange format FreeMind,
 * Xmind, Workflowy and friends all import.
 *
 * Two things are deliberately lossy, because an outline has nowhere to put them: styling
 * (colours, shapes, fonts) and geometry. Collapse state is ignored too — it's a view setting,
 * so a collapsed branch still exports in full, which is almost always what you want from
 * "export the map".
 */

export type OutlineFormat = 'markdown' | 'text' | 'opml';

const INDENT = '  ';

/**
 * A node's label as one line. Newlines and runs of whitespace are collapsed: in an indented
 * outline a literal newline would read as a new node at the wrong depth, silently corrupting
 * the structure on the way back in.
 */
export const outlineLabel = (el: DrawingElement): string => {
    const raw = el.containerText || el.text || '';
    return raw.replace(/\s+/g, ' ').trim();
};

/** An unlabelled node still has to occupy a line, or its children would re-parent on re-import. */
const labelOrPlaceholder = (el: DrawingElement): string => outlineLabel(el) || '(untitled)';

const escapeXml = (s: string): string => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** Depth-first walk in layout order, guarding against a `parentId` cycle. */
const walk = (
    id: string,
    elements: readonly DrawingElement[],
    depth: number,
    seen: Set<string>,
    emit: (el: DrawingElement, depth: number) => void,
): void => {
    if (seen.has(id)) return;
    seen.add(id);
    const el = elements.find(e => e.id === id);
    if (!el) return;
    emit(el, depth);
    for (const child of mindmapChildren(id, elements)) walk(child.id, elements, depth + 1, seen, emit);
};

/**
 * Serialise the tree rooted at `rootId`. Returns '' if the id doesn't resolve.
 * Children come out in `mindmapChildren` order — the same order the layout draws them in, so
 * the text matches the picture top-to-bottom.
 */
export const mindmapToOutline = (
    rootId: string,
    elements: readonly DrawingElement[],
    format: OutlineFormat = 'markdown',
): string => {
    if (!elements.some(e => e.id === rootId)) return '';

    if (format === 'opml') {
        const lines: string[] = [];
        const open: number[] = [];   // depths with an <outline> still to close
        walk(rootId, elements, 0, new Set(), (el, depth) => {
            while (open.length && open[open.length - 1] >= depth) {
                const d = open.pop()!;
                lines.push(`${INDENT.repeat(d + 2)}</outline>`);
            }
            const pad = INDENT.repeat(depth + 2);
            const text = escapeXml(labelOrPlaceholder(el));
            if (mindmapChildren(el.id, elements).length > 0) {
                lines.push(`${pad}<outline text="${text}">`);
                open.push(depth);
            } else {
                lines.push(`${pad}<outline text="${text}"/>`);
            }
        });
        while (open.length) {
            const d = open.pop()!;
            lines.push(`${INDENT.repeat(d + 2)}</outline>`);
        }
        const root = elements.find(e => e.id === rootId)!;
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<opml version="2.0">',
            `${INDENT}<head>`,
            `${INDENT}${INDENT}<title>${escapeXml(labelOrPlaceholder(root))}</title>`,
            `${INDENT}</head>`,
            `${INDENT}<body>`,
            ...lines,
            `${INDENT}</body>`,
            '</opml>',
            '',
        ].join('\n');
    }

    const bullet = format === 'markdown' ? '- ' : '';
    const lines: string[] = [];
    walk(rootId, elements, 0, new Set(), (el, depth) => {
        lines.push(`${INDENT.repeat(depth)}${bullet}${labelOrPlaceholder(el)}`);
    });
    return lines.join('\n') + '\n';
};

/** Default filename stem for an exported map — the root's label, filesystem-safe. */
export const outlineFileName = (rootId: string, elements: readonly DrawingElement[]): string => {
    const root = elements.find(e => e.id === rootId);
    const label = root ? outlineLabel(root) : '';
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'mindmap';
};

const FORMAT_FILE: Record<OutlineFormat, { ext: string; mime: string; description: string }> = {
    markdown: { ext: '.md', mime: 'text/markdown', description: 'Markdown outline' },
    text: { ext: '.txt', mime: 'text/plain', description: 'Indented text outline' },
    opml: { ext: '.opml', mime: 'text/x-opml', description: 'OPML outline' },
};

/**
 * Serialise the tree and offer it as a file. Returns the text either way, so a caller that only
 * wants the string can ignore the save. Resolves false if the user cancelled the save dialog.
 */
export const saveMindmapOutline = async (
    rootId: string,
    elements: readonly DrawingElement[],
    format: OutlineFormat = 'markdown',
): Promise<{ text: string; saved: boolean }> => {
    const text = mindmapToOutline(rootId, elements, format);
    if (!text) return { text, saved: false };
    const spec = FORMAT_FILE[format];
    const blob = new Blob([text], { type: `${spec.mime};charset=utf-8` });
    const saved = await saveBlob(blob, `${outlineFileName(rootId, elements)}${spec.ext}`, {
        description: spec.description,
        accept: { [spec.mime]: [spec.ext] },
    });
    return { text, saved };
};
