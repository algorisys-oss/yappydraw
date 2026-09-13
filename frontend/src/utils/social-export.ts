/**
 * Social-ready export — the rules for "download this page for Instagram / a story / a YouTube
 * thumbnail" at the platform's exact size and format. Pure (no store, no DOM rendering) so it
 * can be unit tested; the rendering lives in export.ts (renderPageAtSize / exportPageForPlatform).
 */
import { PAGE_SIZE_PRESETS } from "../config/page-size-presets";

export interface SocialTarget {
    presetId: string;
    name: string;
    width: number;
    height: number;
    mime: 'image/jpeg' | 'image/png';
    /** Hard upload limit, if the platform has one. The encoder lowers quality to fit. */
    maxBytes?: number;
}

const MB = 1024 * 1024;

/**
 * Upload limits we are sure of. YouTube rejects custom thumbnails over 2 MB; X rejects images over
 * 5 MB. The rest recompress whatever they receive, so there is nothing to fit.
 *
 * At these pixel counts Chromium's JPEG encoder stays well under both — full-page random noise at
 * 1280×720 and quality 0.92 is ~0.8 MB — so the step-down below is a guard for encoders that skip
 * chroma subsampling, not something a typical export reaches.
 */
const MAX_BYTES: Record<string, number> = {
    'youtube-thumbnail': 2 * MB,
    'x-post': 5 * MB,
};

/**
 * One target per social/video page preset, so adding a preset adds an export. All JPEG: every one
 * of these platforms re-encodes uploads as JPEG anyway, and a PNG of a photo-heavy design is
 * several times larger for no visible gain once it has been recompressed.
 */
export const SOCIAL_TARGETS: SocialTarget[] = PAGE_SIZE_PRESETS
    .filter(p => p.category === 'social' || p.category === 'video')
    .map(p => ({
        presetId: p.id, name: p.name, width: p.width, height: p.height,
        mime: 'image/jpeg' as const, maxBytes: MAX_BYTES[p.id],
    }));

export const getSocialTarget = (presetId: string): SocialTarget | undefined =>
    SOCIAL_TARGETS.find(t => t.presetId === presetId);

/** Aspect ratios closer than this are the same shape; the export is stretched by at most this much. */
const SHAPE_TOLERANCE = 0.005;

/** True when a page can be scaled to the target without cropping or visible distortion. */
export function shapeMatches(pageW: number, pageH: number, targetW: number, targetH: number): boolean {
    if (!(pageW > 0 && pageH > 0 && targetW > 0 && targetH > 0)) return false;
    const page = pageW / pageH;
    const target = targetW / targetH;
    return Math.abs(page - target) / target <= SHAPE_TOLERANCE;
}

/** Targets a page can be exported to as-is: an exact size match first, then the same shape. */
export function socialTargetsForPage(pageW: number, pageH: number): SocialTarget[] {
    const fits = SOCIAL_TARGETS.filter(t => shapeMatches(pageW, pageH, t.width, t.height));
    const exact = fits.filter(t => t.width === Math.round(pageW) && t.height === Math.round(pageH));
    return [...exact, ...fits.filter(t => !exact.includes(t))];
}

/** Qualities tried in order until the file fits the cap. Below 0.6 JPEG artefacts show on text. */
export const JPEG_QUALITY_STEPS = [0.92, 0.85, 0.78, 0.7, 0.6];

export type Encoder = (mime: string, quality?: number) => Promise<Blob | null>;

/**
 * Encode at the best quality that fits `maxBytes`. When nothing fits, return the smallest attempt
 * with `overBudget` set, so the caller can still save it and say why the upload may be refused.
 */
export async function encodeWithinBudget(
    encode: Encoder, mime: string, maxBytes?: number,
): Promise<{ blob: Blob; quality: number; overBudget: boolean } | null> {
    const steps = mime === 'image/jpeg' ? JPEG_QUALITY_STEPS : [1];
    let last: { blob: Blob; quality: number } | null = null;
    for (const quality of steps) {
        const blob = await encode(mime, mime === 'image/jpeg' ? quality : undefined);
        if (!blob) return null;
        last = { blob, quality };
        if (!maxBytes || blob.size <= maxBytes) return { ...last, overBudget: false };
    }
    return last && { ...last, overBudget: true };
}

/** `autumn-sale-instagram-story.jpg` — document name slugged, falling back to `yappy`. */
export function socialFileName(docName: string | undefined, target: SocialTarget): string {
    const slug = (docName && docName !== 'Untitled' ? docName : '')
        .toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return `${slug || 'yappy'}-${target.presetId}.${target.mime === 'image/png' ? 'png' : 'jpg'}`;
}
