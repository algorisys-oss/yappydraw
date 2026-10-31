/**
 * Open a .pptx as a new Yappy slides document. The entry point for File ▸ Open, drag-and-drop
 * and `Yappy.importPPTX`; loaded on demand so the reader, converter and the ECMA preset table
 * never sit on the cold-load path.
 */
import { readPptx } from './read';
import { deckToDocument, type ToYappyResult } from './to-yappy';
import { loadDocument } from '../../store/app-store';
import { generateId } from '../id-generator';
import { showToast } from '../../components/toast';
import { t } from '../../i18n';

export interface PptxImportResult { stats: ToYappyResult['stats']; warnings: string[] }

const MAX_FILE_BYTES = 512 * 1024 * 1024;

export async function importPptx(input: Blob | ArrayBuffer | Uint8Array, name?: string): Promise<PptxImportResult> {
    const bytes = input instanceof Uint8Array ? input
        : input instanceof ArrayBuffer ? new Uint8Array(input)
        : new Uint8Array(await input.arrayBuffer());
    if (bytes.length > MAX_FILE_BYTES) throw new Error('This presentation is too large to open (over 512 MB).');
    const { deck, warnings } = readPptx(bytes);
    const batch = new Set<string>();
    const res = await deckToDocument(deck, (type) => generateId(type, batch), name);
    loadDocument(res.doc);
    const all = [...warnings, ...res.warnings];
    if (all.length) console.warn('[pptx import]', all);
    return { stats: res.stats, warnings: all };
}

/** File ▸ Open / drop: import with progress and outcome toasts. Resolves true when a document was opened. */
export async function openPptxFile(file: File): Promise<boolean> {
    showToast(t('pptxImport.loading'), 'loading', 0);
    try {
        const { stats, warnings } = await importPptx(file, file.name.replace(/\.(pptx|potx|ppsx)$/i, ''));
        if (warnings.length) showToast(t('pptxImport.partial', { slides: stats.slides, count: warnings.length }), 'info', 8000);
        else showToast(t('pptxImport.done', { slides: stats.slides, elements: stats.elements }), 'success');
        return true;
    } catch (err) {
        console.error('[pptx import]', err);
        showToast(t('pptxImport.failed', { message: err instanceof Error ? err.message : String(err) }), 'error', 8000);
        return false;
    }
}
