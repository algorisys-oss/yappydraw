/**
 * Turntable AI reconstruction (Phase 3a) — the "Adobe Project Turntable" magic tier.
 *
 * Rasterizes the selected vector art, sends it to the active vision provider (browser-direct,
 * BYO-key — same plumbing as every other Yappy AI feature) asking it to REDRAW the subject as
 * seen rotated to a target 3D viewpoint, then parses the returned SVG into editable `type:'path'`
 * elements and inserts them as a NEW element beside the original. Degrades to the deterministic
 * turntable (Phases 1/2) when there's no key / offline / on failure — the caller just falls back
 * to `bakeTurntable`. See `docs/turntable-plan.md` §Phase 3.
 */
import { batch } from 'solid-js';
import { callLLM, type LLMResponse } from './ai-providers';
import { loadAIConfig, getApiKey } from './ai-settings';
import { parseDataURL } from './image-utils';
import { store, setStore, pushToHistory, bumpDirtyRevision, traceRasterAsPaths } from '../store/app-store';
import { showToast } from '../components/toast';
import { exportRegion } from '../utils/export';
import { svgToElements } from '../utils/svg-import';
import type { DrawingElement } from '../types';

export interface ReconstructResult { success: boolean; ids?: string[]; error?: string }

/** System prompt: return ONE clean SVG of the subject redrawn at the new viewpoint. */
function buildTurntableSvgPrompt(): string {
    return [
        'You are a vector-art "turntable" assistant for YappyDraw.',
        'You receive a raster snapshot of a flat 2D vector illustration plus a target 3D viewpoint.',
        'Redraw the SAME subject as it would look rotated to that viewpoint, as clean 2D vector art,',
        'and return it as a single self-contained SVG document.',
        '',
        'Rules:',
        '- Output ONLY the SVG markup. No prose, no markdown code fences, no explanation.',
        '- Use <path d="…"> elements with an explicit fill (and a stroke where the original has an outline).',
        '  Keep the original colour palette.',
        '- Keep it recognizably the SAME object — same style and colours — just seen from the new angle.',
        '- Invent parts that become newly visible from the rotation (a limb, a side, the far face) so the',
        '  result reads as a coherent solid object, not a flat card.',
        '- Prefer a modest number of smooth paths over thousands of tiny segments.',
        '- Give the <svg> a viewBox that tightly frames the art.',
    ].join('\n');
}

/** Pull the first `<svg>…</svg>` out of a model response (tolerates code fences / stray prose). */
function extractSvg(content: string): string | null {
    if (!content) return null;
    const fence = content.match(/```(?:svg|xml|html)?\s*([\s\S]*?)```/i);
    const body = fence ? fence[1] : content;
    const m = body.match(/<svg[\s\S]*<\/svg>/i);
    return m ? m[0] : null;
}

/**
 * Reconstruct `id`'s art at a target 3D viewpoint with a vision model and insert the result as a
 * new path element beside the original. `target` defaults to the element's live turntable angle.
 */
export async function reconstructTurntableAI(
    id: string,
    target?: { yaw?: number; pitch?: number },
): Promise<ReconstructResult> {
    const el = store.elements.find(e => e.id === id);
    if (!el) return { success: false, error: 'Element not found' };

    const config = loadAIConfig();
    const provider = config.activeProvider;
    const providerConfig = config.providers[provider];
    const apiKey = getApiKey(provider);
    if (!apiKey) {
        showToast('Add an API key in AI Settings first', 'error');
        return { success: false, error: 'No API key' };
    }

    const yaw = Math.round(target?.yaw ?? el.turntable?.yaw ?? 0);
    const pitch = Math.round(target?.pitch ?? el.turntable?.pitch ?? 0);

    // 1. Rasterize the element's region (padded) to a PNG dataURL.
    const pad = Math.max(8, Math.round(Math.max(el.width, el.height) * 0.1));
    const dataURL = exportRegion(el.x - pad, el.y - pad, el.width + pad * 2, el.height + pad * 2, 'tt-src', 2, false);
    if (!dataURL) {
        showToast('Could not rasterize the selection', 'error');
        return { success: false, error: 'rasterize failed' };
    }
    const { base64, mediaType } = parseDataURL(dataURL);

    // 2. Ask the vision model for SVG at the target viewpoint.
    const userPrompt = `The attached image is a 2D vector drawing. Redraw it as it would appear rotated ${yaw}° about the vertical axis${pitch ? ` and tilted ${pitch}° about the horizontal axis` : ''}, turning the object in 3D toward that viewpoint. Invent any parts that become newly visible so it reads as a coherent solid. Return ONLY a single <svg>…</svg> of clean vector paths, preserving the original colours.`;

    showToast(`Reconstructing at ${yaw}°…`, 'info');
    let res: LLMResponse;
    try {
        res = await callLLM({
            provider, model: providerConfig.model, apiKey,
            systemPrompt: buildTurntableSvgPrompt(), userPrompt,
            images: [{ base64, mediaType }],
            temperature: 0.2, maxTokens: 8192,
        });
    } catch (err: any) {
        showToast(`AI request failed: ${err.message}`, 'error');
        return { success: false, error: err.message };
    }
    if (!res.success || !res.content) {
        showToast(res.error ?? 'AI request failed', 'error');
        return { success: false, error: res.error ?? 'no content' };
    }

    // 3. Extract SVG → editable path elements, placed beside the original.
    const svg = extractSvg(res.content);
    if (!svg) {
        showToast('AI did not return usable SVG', 'error');
        return { success: false, error: 'no svg' };
    }
    let els: DrawingElement[];
    try {
        els = svgToElements(svg, { x: el.x + el.width + 40, y: el.y, targetWidth: el.width });
    } catch (err: any) {
        showToast(`Could not parse AI SVG: ${err.message}`, 'error');
        return { success: false, error: err.message };
    }
    if (!els.length) {
        showToast('AI SVG had no drawable paths', 'error');
        return { success: false, error: 'empty svg' };
    }

    // 4. Insert beside the original (single undo); the source stays untouched.
    pushToHistory();
    const ids = els.map(e => e.id);
    batch(() => {
        setStore('elements', (prev: DrawingElement[]) => [...prev, ...els]);
        setStore('selection', ids);
    });
    bumpDirtyRevision();
    showToast(`AI reconstruction inserted (${els.length} path${els.length > 1 ? 's' : ''})`, 'success');
    return { success: true, ids };
}

/** POST an image-edit to OpenAI images/edits; returns the b64 result or an error string. */
async function postImageEdit(form: FormData, apiKey: string): Promise<{ b64: string | null; error?: string }> {
    try {
        const res = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form,
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            let detail = ''; try { detail = JSON.parse(txt).error?.message || ''; } catch { detail = txt.slice(0, 200); }
            return { b64: null, error: `OpenAI image error ${res.status}: ${detail}` };
        }
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        return b64 ? { b64 } : { b64: null, error: 'OpenAI returned no image data' };
    } catch (err: any) {
        return { b64: null, error: `Network error calling OpenAI Images: ${err?.message || err}` };
    }
}

/**
 * Phase 3b — higher-fidelity reconstruction: ask an OpenAI image model to REIMAGINE the art at
 * the target viewpoint (better at inventing occluded parts), then auto-trace the returned raster
 * into filled colour paths beside the original. OpenAI-only; messier vectors than 3a but more
 * pictorially faithful. Degrades to a toast when no OpenAI key.
 */
export async function reconstructTurntableAIImage(
    id: string,
    target?: { yaw?: number; pitch?: number },
): Promise<ReconstructResult> {
    const el = store.elements.find(e => e.id === id);
    if (!el) return { success: false, error: 'Element not found' };
    const apiKey = getApiKey('openai');
    if (!apiKey) {
        showToast('AI Reimagine needs an OpenAI API key (set it in AI Settings)', 'error');
        return { success: false, error: 'No OpenAI key' };
    }

    const yaw = Math.round(target?.yaw ?? el.turntable?.yaw ?? 0);
    const pitch = Math.round(target?.pitch ?? el.turntable?.pitch ?? 0);

    const pad = Math.max(8, Math.round(Math.max(el.width, el.height) * 0.1));
    const dataURL = exportRegion(el.x - pad, el.y - pad, el.width + pad * 2, el.height + pad * 2, 'tt-src', 2, false);
    if (!dataURL) {
        showToast('Could not rasterize the selection', 'error');
        return { success: false, error: 'rasterize failed' };
    }

    showToast(`Reimagining at ${yaw}°…`, 'info');
    const blob = await (await fetch(dataURL)).blob();
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('image', new File([blob], 'image.png', { type: 'image/png' }));
    form.append('prompt',
        `Redraw this subject as it would look rotated ${yaw}° about the vertical axis${pitch ? ` and tilted ${pitch}° about the horizontal axis` : ''}, turning the object in 3D toward that viewpoint. Invent any parts that become newly visible so it reads as a coherent solid object. Keep the same subject, flat illustration style, and colours, on a clean white or transparent background.`);
    form.append('size', 'auto');

    const { b64, error } = await postImageEdit(form, apiKey);
    if (!b64) {
        showToast(error || 'AI Reimagine failed', 'error');
        return { success: false, error: error || 'no image' };
    }

    const ids = await traceRasterAsPaths(id, `data:image/png;base64,${b64}`, { colors: 12 });
    return ids.length ? { success: true, ids } : { success: false, error: 'trace produced no paths' };
}
