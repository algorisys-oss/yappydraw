/**
 * AI design generation — prompt → a ready-to-edit design document.
 *
 * The LLM (any configured provider) supplies copy + a palette as strict JSON;
 * the layout itself is deterministic and proportional to the page size, so it
 * works for every preset (post, story, poster, banner…). Combine with Magic
 * Resize to repurpose the result to other formats.
 */

import { callLLM } from './ai-providers';
import { getActiveProviderConfig } from './ai-settings';
import { store, setStore, resetToNewDocument, bumpDirtyRevision, zoomToFitSlide } from '../store/app-store';
import { showToast } from '../components/toast';
import type { DrawingElement } from '../types';

export interface DesignContent {
    headline: string;
    subhead?: string;
    bullets?: string[];
    cta?: string;
    palette: { background: string; primary: string; accent: string; text: string };
}

const SYSTEM_PROMPT =
    'You are a senior graphic designer. Reply with ONLY a JSON object, no markdown fences, ' +
    'matching exactly: {"headline": string (max 6 words), "subhead": string (max 12 words), ' +
    '"bullets": string[] (0-4 short items), "cta": string (max 5 words, optional), ' +
    '"palette": {"background": hex, "primary": hex, "accent": hex, "text": hex}}. ' +
    'The palette must be harmonious with strong text/background contrast.';

function parseContent(raw: string): DesignContent | null {
    try {
        const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const obj = JSON.parse(cleaned);
        if (!obj?.headline || !obj?.palette?.background) return null;
        return obj as DesignContent;
    } catch {
        return null;
    }
}

let _counter = 0;
const genId = (p: string) => `${p}-${Date.now()}-${++_counter}`;

const BASE = {
    roughness: 0, angle: 0, renderStyle: 'architectural' as const,
    locked: false, link: null, layerId: 'default-layer',
    strokeStyle: 'solid' as const, opacity: 100, roundness: null,
    seed: () => Math.floor(Math.random() * 2 ** 31),
};

const text = (t: string, x: number, y: number, w: number, h: number, fontSize: number, color: string, opts: Partial<DrawingElement> = {}): DrawingElement => ({
    id: genId('text'), type: 'text', x, y, width: w, height: h, text: t,
    fontSize, fontFamily: 'poppins' as any, textAlign: 'center', verticalAlign: 'top',
    textColor: color, strokeColor: 'transparent', backgroundColor: 'transparent',
    fillStyle: 'solid', strokeWidth: 0,
    ...BASE, seed: BASE.seed(), ...opts,
} as DrawingElement);

const rect = (x: number, y: number, w: number, h: number, opts: Partial<DrawingElement> = {}): DrawingElement => ({
    id: genId('rect'), type: 'rectangle', x, y, width: w, height: h,
    strokeColor: 'transparent', backgroundColor: '#ffffff', fillStyle: 'solid', strokeWidth: 0,
    ...BASE, seed: BASE.seed(), ...opts,
} as DrawingElement);

/** Build the page's elements from generated content (page-relative origin). */
export function buildDesignElements(content: DesignContent, px: number, py: number, w: number, h: number): DrawingElement[] {
    const pal = content.palette;
    const unit = Math.min(w, h);
    const els: DrawingElement[] = [];

    // Background gradient wash
    els.push(rect(px, py, w, h, {
        backgroundColor: pal.background,
        fillStyle: 'linear' as any,
        gradientStops: [
            { color: pal.background, offset: 0 },
            { color: pal.primary, offset: 1 },
        ] as any,
        gradientDirection: 135,
    }));

    // Accent bar above the headline
    const barW = w * 0.14;
    els.push(rect(px + (w - barW) / 2, py + h * 0.14, barW, unit * 0.012, { backgroundColor: pal.accent }));

    // Headline
    els.push(text(content.headline, px + w * 0.08, py + h * 0.18, w * 0.84, h * 0.2,
        Math.round(unit * 0.085), pal.text, { fontWeight: 'bold' as any }));

    // Subhead
    let cursorY = py + h * 0.4;
    if (content.subhead) {
        els.push(text(content.subhead, px + w * 0.1, cursorY, w * 0.8, h * 0.1,
            Math.round(unit * 0.04), pal.text, { opacity: 88 }));
        cursorY += h * 0.13;
    }

    // Bullets
    const bullets = (content.bullets || []).slice(0, 4);
    if (bullets.length > 0) {
        els.push(text(bullets.map(b => `•  ${b}`).join('\n'), px + w * 0.12, cursorY, w * 0.76, h * 0.28,
            Math.round(unit * 0.032), pal.text, { textAlign: 'left' as any, opacity: 92 }));
    }

    // CTA pill
    if (content.cta) {
        const ctaW = w * 0.44, ctaH = unit * 0.085;
        const ctaY = py + h * 0.86 - ctaH / 2;
        els.push(rect(px + (w - ctaW) / 2, ctaY, ctaW, ctaH, {
            backgroundColor: pal.accent, borderRadius: ctaH / 2,
        } as any));
        els.push(text(content.cta, px + (w - ctaW) / 2, ctaY + ctaH * 0.22, ctaW, ctaH * 0.6,
            Math.round(unit * 0.032), pal.background, { fontWeight: 'bold' as any, verticalAlign: 'middle' as any }));
    }

    return els;
}

/**
 * Generate a design document from a prompt. Creates a fresh design doc at
 * `size` (default 1080×1080) and fills the first page. Returns true on success.
 */
export async function generateDesign(promptText: string, size: { width: number; height: number } = { width: 1080, height: 1080 }): Promise<boolean> {
    const { provider, model, apiKey } = getActiveProviderConfig();
    if (!apiKey) {
        showToast('Add an API key in AI Settings first', 'error');
        return false;
    }
    if (!promptText.trim()) return false;

    showToast('Generating design…', 'info');
    const res = await callLLM({
        provider, model, apiKey,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Design brief: ${promptText.trim()}\nFormat: ${size.width}×${size.height}px.`,
        temperature: 0.8,
        maxTokens: 800,
    });
    if (!res.success) {
        showToast(res.error || 'Design generation failed', 'error');
        return false;
    }
    const content = parseContent(res.content);
    if (!content) {
        showToast('The AI returned an unusable design — try again', 'error');
        return false;
    }

    resetToNewDocument('design', size);
    const page = store.slides[0];
    const px = page?.spatialPosition.x ?? 0;
    const py = page?.spatialPosition.y ?? 0;
    const els = buildDesignElements(content, px, py, size.width, size.height);
    setStore('elements', els);
    setStore('selection', []);
    zoomToFitSlide();
    bumpDirtyRevision();
    showToast('Design generated — edit away', 'success');
    return true;
}
