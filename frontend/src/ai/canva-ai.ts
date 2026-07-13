/**
 * Canva-style AI assists:
 * - Magic Write: generate / rewrite text on selected text elements (any provider)
 * - Text-to-image: generate an image from a prompt and insert it (OpenAI Images)
 * - Background removal: re-render the selected image with transparent bg (OpenAI edits)
 *
 * Uses the shared provider config from ai-settings (API keys in AI Settings dialog).
 */
import { callLLM } from './ai-providers';
import { getActiveProviderConfig, getApiKey, getImageModel } from './ai-settings';
import { store, setStore, pushToHistory, updateElement, bumpDirtyRevision } from '../store/app-store';
import { showToast, hideToast } from '../components/toast';
import type { DrawingElement } from '../types';

export type MagicWriteMode = 'rewrite' | 'shorten' | 'expand' | 'fix' | 'custom';

const MODE_INSTRUCTIONS: Record<Exclude<MagicWriteMode, 'custom'>, string> = {
    rewrite: 'Rewrite this text to be clearer and more engaging while keeping its meaning and rough length.',
    shorten: 'Shorten this text to roughly half its length while keeping the key message.',
    expand: 'Expand this text with one or two extra sentences of relevant detail.',
    fix: 'Fix any spelling and grammar mistakes. Change nothing else.',
};

/**
 * Magic Write — transform the text of the given text elements with the active
 * LLM provider. Returns the number of elements updated.
 */
export async function magicWrite(
    ids: string[],
    mode: MagicWriteMode = 'rewrite',
    customInstruction?: string,
): Promise<number> {
    const { provider, model, apiKey } = getActiveProviderConfig();
    if (!apiKey) {
        showToast('Add an API key in AI Settings first', 'error');
        return 0;
    }
    const targets = ids
        .map(id => store.elements.find(e => e.id === id))
        .filter((e): e is DrawingElement => !!e && e.type === 'text' && !!(e.text || '').trim());
    if (targets.length === 0) {
        showToast('Select a text element first', 'info');
        return 0;
    }

    const instruction = mode === 'custom'
        ? (customInstruction || 'Improve this text.')
        : MODE_INSTRUCTIONS[mode];

    showToast('Magic Write…', 'loading');
    let updated = 0;
    let errored = false;
    for (const el of targets) {
        const res = await callLLM({
            provider, model, apiKey,
            systemPrompt: 'You are a copywriter working inside a graphic design tool. ' +
                'Reply with ONLY the final text — no quotes, no markdown, no explanations. ' +
                'Preserve intentional line breaks.',
            userPrompt: `${instruction}\n\nText:\n${el.text}`,
            temperature: 0.7,
            maxTokens: 1024,
        });
        if (res.success && res.content.trim()) {
            if (updated === 0) pushToHistory();
            updateElement(el.id, { text: res.content.trim() });
            updated++;
        } else if (!res.success) {
            showToast(res.error || 'Magic Write failed', 'error');
            errored = true;
            break;
        }
    }
    if (updated > 0) showToast(`Magic Write updated ${updated} text element${updated === 1 ? '' : 's'}`, 'success');
    else if (!errored) hideToast(); // nothing changed and no error — clear the in-progress toast
    return updated;
}

// ─── OpenAI image endpoints ─────────────────────────────────

interface ImageGenResult { dataURL: string | null; error?: string }

async function openaiGenerateImage(prompt: string, size: string, model: string): Promise<ImageGenResult> {
    const apiKey = getApiKey('openai');
    if (!apiKey) return { dataURL: null, error: 'Add an OpenAI API key in AI Settings first' };
    try {
        const body: any = { model, prompt, n: 1, size };
        if (model.startsWith('dall-e')) body.response_format = 'b64_json';
        const res = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            let detail = '';
            try { detail = JSON.parse(errText).error?.message || ''; } catch { detail = errText.slice(0, 200); }
            return { dataURL: null, error: `OpenAI image error ${res.status}: ${detail}` };
        }
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) return { dataURL: `data:image/png;base64,${b64}` };
        const url = data.data?.[0]?.url;
        if (url) {
            // dall-e URL response — fetch and inline so the document stays self-contained
            const imgRes = await fetch(url);
            const blob = await imgRes.blob();
            const dataURL = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result));
                r.onerror = reject;
                r.readAsDataURL(blob);
            });
            return { dataURL };
        }
        return { dataURL: null, error: 'OpenAI returned no image data' };
    } catch (err: any) {
        return { dataURL: null, error: `Network error calling OpenAI Images: ${err?.message || err}` };
    }
}

/** Insert a data-URL image centered on the active page. Returns the element id. */
function insertImageElement(dataURL: string, width: number, height: number, name: string): string {
    const page = store.slides[store.activeSlideIndex];
    const maxW = page ? page.dimensions.width * 0.6 : 512;
    const scale = Math.min(1, maxW / width);
    const w = Math.round(width * scale), h = Math.round(height * scale);
    const x = page ? page.spatialPosition.x + (page.dimensions.width - w) / 2 : 120;
    const y = page ? page.spatialPosition.y + (page.dimensions.height - h) / 2 : 120;

    const el: DrawingElement = {
        id: `image-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        type: 'image', x, y, width: w, height: h,
        dataURL, status: 'loaded',
        backgroundColor: 'transparent', fillStyle: 'solid',
        strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid',
        opacity: 100, angle: 0, roughness: 0, renderStyle: 'architectural',
        locked: false, link: null, layerId: store.activeLayerId || 'default-layer',
        seed: Math.floor(Math.random() * 2 ** 31), roundness: null,
    } as DrawingElement;

    pushToHistory();
    setStore('elements', prev => [...prev, el]);
    setStore('selection', [el.id]);
    bumpDirtyRevision();
    showToast(`${name} added`, 'success');
    return el.id;
}

/**
 * Generate an image from a text prompt (OpenAI) and insert it on the active
 * page. Tries gpt-image-1 first, falls back to dall-e-3. Returns element id.
 */
export async function generateImage(prompt: string, opts: { size?: '1024x1024' | '1536x1024' | '1024x1536' } = {}): Promise<string | null> {
    const size = opts.size || '1024x1024';
    const model = getImageModel('openai') || 'gpt-image-1';
    const dalleSize = size === '1536x1024' ? '1792x1024' : size === '1024x1536' ? '1024x1792' : '1024x1024';
    showToast('Generating image…', 'loading');
    let result = await openaiGenerateImage(prompt, model.startsWith('dall-e') ? dalleSize : size, model);
    if (!result.dataURL && model !== 'dall-e-3') {
        // Configured model unavailable on this account — fall back to dall-e-3
        const fallback = await openaiGenerateImage(prompt, dalleSize, 'dall-e-3');
        if (fallback.dataURL) result = fallback;
    }
    if (!result.dataURL) {
        showToast(result.error || 'Image generation failed', 'error');
        return null;
    }
    const [w, h] = size.split('x').map(Number);
    return insertImageElement(result.dataURL!, w || 1024, h || 1024, 'AI image');
}

const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

/**
 * Keep the ORIGINAL pixels and take only the transparency from the AI result:
 * draw the original, then `destination-in` the AI output scaled to the same
 * size — the AI's alpha becomes a mask, so any restyling in its RGB channels
 * is discarded. Returns null if the mask looks unusable (fully opaque or
 * fully transparent), in which case the caller falls back to the AI output.
 */
async function applyAlphaMask(originalURL: string, aiURL: string): Promise<string | null> {
    try {
        const [orig, ai] = await Promise.all([loadImg(originalURL), loadImg(aiURL)]);
        const canvas = document.createElement('canvas');
        canvas.width = orig.naturalWidth;
        canvas.height = orig.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(orig, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(ai, 0, 0, canvas.width, canvas.height);

        // Sanity check the mask: some pixels transparent AND some kept.
        // Sample ~1000 pixels regardless of image size.
        const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const totalPixels = sample.length / 4;
        const step = 4 * Math.max(1, Math.floor(totalPixels / 1000));
        let transparent = 0, opaque = 0;
        for (let i = 3; i < sample.length; i += step) {
            if (sample[i] < 16) transparent++; else opaque++;
        }
        if (transparent === 0 || opaque === 0) return null;
        return canvas.toDataURL('image/png');
    } catch {
        return null;
    }
}

/** POST to OpenAI images/edits; returns the b64 result or an error string. */
async function postImageEdit(form: FormData, apiKey: string): Promise<{ b64: string | null; error?: string }> {
    try {
        const res = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: form,
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            let detail = '';
            try { detail = JSON.parse(errText).error?.message || ''; } catch { detail = errText.slice(0, 200); }
            return { b64: null, error: `OpenAI image edit error ${res.status}: ${detail}` };
        }
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        return b64 ? { b64 } : { b64: null, error: 'OpenAI returned no image data' };
    } catch (err: any) {
        return { b64: null, error: `Network error calling OpenAI Images: ${err?.message || err}` };
    }
}

/**
 * Magic Edit — repaint the selected image per a natural-language instruction
 * (e.g. "remove the person on the left", "make the sky sunset orange").
 * Replaces the element's image in place. Returns true on success.
 */
export async function magicEditImage(id?: string, instruction?: string): Promise<boolean> {
    const targetId = id || store.selection[0];
    const el = store.elements.find(e => e.id === targetId);
    if (!el || el.type !== 'image' || !el.dataURL) {
        showToast('Select an image element first', 'info');
        return false;
    }
    if (!instruction?.trim()) {
        showToast('Describe the change first', 'info');
        return false;
    }
    const apiKey = getApiKey('openai');
    if (!apiKey) {
        showToast('Add an OpenAI API key in AI Settings first', 'error');
        return false;
    }

    showToast('Magic Edit…', 'loading');
    const blob = await (await fetch(el.dataURL)).blob();
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('image', new File([blob], 'image.png', { type: blob.type || 'image/png' }));
    form.append('prompt',
        `${instruction.trim()}. Apply ONLY this change — keep everything else in the image ` +
        'pixel-identical to the input: same composition, colors, style, and framing.');
    form.append('size', 'auto');

    const { b64, error } = await postImageEdit(form, apiKey);
    if (!b64) {
        showToast(error || 'Magic Edit failed', 'error');
        return false;
    }
    pushToHistory();
    updateElement(el.id, { dataURL: `data:image/png;base64,${b64}` });
    showToast('Magic Edit applied', 'success');
    return true;
}

/**
 * Replace Background — swap the background behind the main subject for a new
 * scene described in natural language (e.g. "a sunny beach", "a solid teal
 * studio backdrop"), keeping the foreground subject untouched. Replaces the
 * element's image in place. Returns true on success.
 */
export async function replaceBackground(id?: string, description?: string): Promise<boolean> {
    const targetId = id || store.selection[0];
    const el = store.elements.find(e => e.id === targetId);
    if (!el || el.type !== 'image' || !el.dataURL) {
        showToast('Select an image element first', 'info');
        return false;
    }
    if (!description?.trim()) {
        showToast('Describe the new background first', 'info');
        return false;
    }
    const apiKey = getApiKey('openai');
    if (!apiKey) {
        showToast('Add an OpenAI API key in AI Settings first', 'error');
        return false;
    }

    showToast('Replacing background…', 'loading');
    const blob = await (await fetch(el.dataURL)).blob();
    const form = new FormData();
    form.append('model', 'gpt-image-1');
    form.append('image', new File([blob], 'image.png', { type: blob.type || 'image/png' }));
    form.append('prompt',
        `Replace the background behind the main foreground subject with: ${description.trim()}. ` +
        'Keep the foreground subject pixel-identical to the input — do not restyle, repaint, ' +
        'recolor, move, crop, or resize it. Change ONLY the background, blending the new ' +
        'background naturally with realistic lighting and edges around the subject.');
    form.append('size', 'auto');
    form.append('input_fidelity', 'high');

    let { b64, error } = await postImageEdit(form, apiKey);
    // Some accounts/models reject input_fidelity — retry once without it.
    if (!b64 && error?.includes('input_fidelity')) {
        form.delete('input_fidelity');
        ({ b64, error } = await postImageEdit(form, apiKey));
    }
    if (!b64) {
        showToast(error || 'Replace Background failed', 'error');
        return false;
    }
    pushToHistory();
    updateElement(el.id, { dataURL: `data:image/png;base64,${b64}` });
    showToast('Background replaced', 'success');
    return true;
}

export interface ExpandImageOptions {
    /** Margins to add, as fractions of the source image size (default 0.25 each). */
    left?: number; right?: number; top?: number; bottom?: number;
    /** Optional guidance for what the extended areas should contain. */
    prompt?: string;
}

/**
 * Magic Expand — outpaint the selected image: the source is placed on a larger
 * transparent canvas and the AI fills the new margins seamlessly. The element
 * grows by the same margins so the original subject stays put on the page.
 */
export async function expandImage(id?: string, opts: ExpandImageOptions = {}): Promise<boolean> {
    const targetId = id || store.selection[0];
    const el = store.elements.find(e => e.id === targetId);
    if (!el || el.type !== 'image' || !el.dataURL) {
        showToast('Select an image element first', 'info');
        return false;
    }
    const apiKey = getApiKey('openai');
    if (!apiKey) {
        showToast('Add an OpenAI API key in AI Settings first', 'error');
        return false;
    }

    const left = Math.max(0, opts.left ?? 0.25);
    const right = Math.max(0, opts.right ?? 0.25);
    const top = Math.max(0, opts.top ?? 0.25);
    const bottom = Math.max(0, opts.bottom ?? 0.25);
    if (left + right + top + bottom === 0) return false;

    showToast('Magic Expand…', 'loading');
    try {
        const orig = await loadImg(el.dataURL);
        const ow = orig.naturalWidth, oh = orig.naturalHeight;
        const nw = Math.round(ow * (1 + left + right));
        const nh = Math.round(oh * (1 + top + bottom));
        const canvas = document.createElement('canvas');
        canvas.width = nw; canvas.height = nh;
        const ctx = canvas.getContext('2d');
        if (!ctx) { showToast('Magic Expand failed: no canvas context', 'error'); return false; }
        ctx.drawImage(orig, Math.round(ow * left), Math.round(oh * top));
        const paddedBlob: Blob = await new Promise((resolve, reject) =>
            canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas.toBlob failed')), 'image/png'));

        const form = new FormData();
        form.append('model', 'gpt-image-1');
        form.append('image', new File([paddedBlob], 'image.png', { type: 'image/png' }));
        // The padded canvas doubles as the mask: its transparent margins are
        // exactly the regions to generate.
        form.append('mask', new File([paddedBlob], 'mask.png', { type: 'image/png' }));
        form.append('prompt',
            (opts.prompt?.trim() ? `${opts.prompt.trim()}. ` : '') +
            'Extend the existing image seamlessly into the transparent areas, continuing its ' +
            'scene, lighting, style, and perspective. Keep the original (non-transparent) pixels unchanged.');
        form.append('size', 'auto');

        const { b64, error } = await postImageEdit(form, apiKey);
        if (!b64) {
            showToast(error || 'Magic Expand failed', 'error');
            return false;
        }

        pushToHistory();
        updateElement(el.id, {
            dataURL: `data:image/png;base64,${b64}`,
            x: el.x - el.width * left,
            y: el.y - el.height * top,
            width: el.width * (1 + left + right),
            height: el.height * (1 + top + bottom),
        });
        showToast('Magic Expand applied', 'success');
        return true;
    } catch (err: any) {
        showToast(`Magic Expand failed: ${err?.message || err}`, 'error');
        return false;
    }
}

export interface RemoveBackgroundOptions {
    /**
     * Keep the original pixels and use the AI result only as an alpha mask
     * (default true — prevents gpt-image-1 from restyling the subject).
     * Set false to take the AI's regenerated image as-is.
     */
    preserveOriginal?: boolean;
}

/**
 * Remove the background of the selected image element (OpenAI gpt-image-1
 * edits with transparent background). Replaces the element's image in place.
 * By default the original pixels are preserved via alpha-mask compositing.
 */
export async function removeBackground(id?: string, opts: RemoveBackgroundOptions = {}): Promise<boolean> {
    const targetId = id || store.selection[0];
    const el = store.elements.find(e => e.id === targetId);
    if (!el || el.type !== 'image' || !el.dataURL) {
        showToast('Select an image element first', 'info');
        return false;
    }
    const apiKey = getApiKey('openai');
    if (!apiKey) {
        showToast('Add an OpenAI API key in AI Settings first', 'error');
        return false;
    }

    showToast('Removing background…', 'loading');
    try {
        const blob = await (await fetch(el.dataURL)).blob();
        const buildForm = (withFidelity: boolean) => {
            const form = new FormData();
            form.append('model', 'gpt-image-1');
            form.append('image', new File([blob], 'image.png', { type: blob.type || 'image/png' }));
            form.append('prompt',
                'Remove the background completely so it is fully transparent. ' +
                'Keep the foreground subject pixel-identical to the input — do not restyle, repaint, ' +
                'recolor, sharpen, or add any effects, glow, outlines, or shadows. ' +
                'Do not move, crop, or resize the subject.');
            form.append('background', 'transparent');
            form.append('size', 'auto');
            // Preserve input details (faces, textures) instead of re-imagining them
            if (withFidelity) form.append('input_fidelity', 'high');
            return form;
        };

        let res = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: buildForm(true),
        });
        if (res.status === 400) {
            // Some accounts/models reject input_fidelity — retry without it
            const errText = await res.clone().text().catch(() => '');
            if (errText.includes('input_fidelity')) {
                res = await fetch('https://api.openai.com/v1/images/edits', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                    body: buildForm(false),
                });
            }
        }
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            let detail = '';
            try { detail = JSON.parse(errText).error?.message || ''; } catch { detail = errText.slice(0, 200); }
            showToast(`Background removal failed (${res.status}): ${detail}`, 'error');
            return false;
        }
        const data = await res.json();
        const b64 = data.data?.[0]?.b64_json;
        if (!b64) {
            showToast('Background removal returned no image', 'error');
            return false;
        }

        let resultURL = `data:image/png;base64,${b64}`;
        if (opts.preserveOriginal !== false) {
            const masked = await applyAlphaMask(el.dataURL, resultURL);
            if (masked) resultURL = masked;
        }

        pushToHistory();
        updateElement(el.id, { dataURL: resultURL });
        showToast('Background removed', 'success');
        return true;
    } catch (err: any) {
        showToast(`Background removal failed: ${err?.message || err}`, 'error');
        return false;
    }
}
