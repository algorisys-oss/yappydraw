/**
 * Canva-style AI assists:
 * - Magic Write: generate / rewrite text on selected text elements (any provider)
 * - Text-to-image: generate an image from a prompt and insert it (OpenAI Images)
 * - Background removal: re-render the selected image with transparent bg (OpenAI edits)
 *
 * Uses the shared provider config from ai-settings (API keys in AI Settings dialog).
 */
import { callLLM } from './ai-providers';
import { getActiveProviderConfig, getApiKey } from './ai-settings';
import { store, setStore, pushToHistory, updateElement, bumpDirtyRevision } from '../store/app-store';
import { showToast } from '../components/toast';
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

    showToast('Magic Write…', 'info');
    let updated = 0;
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
            break;
        }
    }
    if (updated > 0) showToast(`Magic Write updated ${updated} text element${updated === 1 ? '' : 's'}`, 'success');
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
    showToast('Generating image…', 'info');
    let result = await openaiGenerateImage(prompt, size, 'gpt-image-1');
    if (!result.dataURL) {
        // gpt-image-1 may be unavailable on the account — fall back to dall-e-3
        const dalleSize = size === '1536x1024' ? '1792x1024' : size === '1024x1536' ? '1024x1792' : '1024x1024';
        const fallback = await openaiGenerateImage(prompt, dalleSize, 'dall-e-3');
        if (!fallback.dataURL) {
            showToast(result.error || fallback.error || 'Image generation failed', 'error');
            return null;
        }
        result = fallback;
    }
    const [w, h] = size.split('x').map(Number);
    return insertImageElement(result.dataURL!, w || 1024, h || 1024, 'AI image');
}

/**
 * Remove the background of the selected image element (OpenAI gpt-image-1
 * edits with transparent background). Replaces the element's image in place.
 */
export async function removeBackground(id?: string): Promise<boolean> {
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

    showToast('Removing background…', 'info');
    try {
        const blob = await (await fetch(el.dataURL)).blob();
        const form = new FormData();
        form.append('model', 'gpt-image-1');
        form.append('image', new File([blob], 'image.png', { type: blob.type || 'image/png' }));
        form.append('prompt', 'Isolate the main subject and remove the background completely. Keep the subject unchanged.');
        form.append('background', 'transparent');
        form.append('size', 'auto');

        const res = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: form,
        });
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
        pushToHistory();
        updateElement(el.id, { dataURL: `data:image/png;base64,${b64}` });
        showToast('Background removed', 'success');
        return true;
    } catch (err: any) {
        showToast(`Background removal failed: ${err?.message || err}`, 'error');
        return false;
    }
}
