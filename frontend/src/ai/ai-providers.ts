/**
 * AI Providers — Unified LLM call interface.
 * Adapters for OpenAI, Google Gemini, and Anthropic APIs.
 * All calls use fetch() directly — no library dependencies.
 */

import type { AIProvider } from './ai-settings';

export interface LLMRequest {
    provider: AIProvider;
    model: string;
    apiKey: string;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

export interface LLMResponse {
    success: boolean;
    content: string;
    error?: string;
    usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Call an LLM provider with a system + user prompt.
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    switch (request.provider) {
        case 'openai':    return callOpenAI(request);
        case 'gemini':    return callGemini(request);
        case 'anthropic': return callAnthropic(request);
        default:
            return { success: false, content: '', error: `Unknown provider: ${request.provider}` };
    }
}

// ─── OpenAI ─────────────────────────────────────────────

async function callOpenAI(req: LLMRequest): Promise<LLMResponse> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
        model: req.model,
        messages: [
            { role: 'system', content: req.systemPrompt },
            { role: 'user', content: req.userPrompt },
        ],
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 4096,
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            return { success: false, content: '', error: formatHttpError('OpenAI', res.status, errText) };
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        return {
            success: true,
            content,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
            } : undefined,
        };
    } catch (err: any) {
        return { success: false, content: '', error: formatNetworkError('OpenAI', err) };
    }
}

// ─── Google Gemini ──────────────────────────────────────

async function callGemini(req: LLMRequest): Promise<LLMResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${req.apiKey}`;
    const body = {
        systemInstruction: { parts: [{ text: req.systemPrompt }] },
        contents: [{ parts: [{ text: req.userPrompt }] }],
        generationConfig: {
            temperature: req.temperature ?? 0.3,
            maxOutputTokens: req.maxTokens ?? 4096,
        },
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            return { success: false, content: '', error: formatHttpError('Gemini', res.status, errText) };
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
            success: true,
            content,
            usage: data.usageMetadata ? {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            } : undefined,
        };
    } catch (err: any) {
        return { success: false, content: '', error: formatNetworkError('Gemini', err) };
    }
}

// ─── Anthropic ──────────────────────────────────────────

async function callAnthropic(req: LLMRequest): Promise<LLMResponse> {
    const url = 'https://api.anthropic.com/v1/messages';
    const body = {
        model: req.model,
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.userPrompt }],
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.3,
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': req.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            return { success: false, content: '', error: formatHttpError('Anthropic', res.status, errText) };
        }

        const data = await res.json();
        const content = data.content?.[0]?.text || '';
        return {
            success: true,
            content,
            usage: data.usage ? {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
            } : undefined,
        };
    } catch (err: any) {
        return { success: false, content: '', error: formatNetworkError('Anthropic', err) };
    }
}

// ─── Error Formatting ───────────────────────────────────

function formatHttpError(provider: string, status: number, body: string): string {
    // Try to extract error message from JSON response body
    let detail = '';
    try {
        const parsed = JSON.parse(body);
        detail = parsed.error?.message || parsed.error?.status || parsed.message || '';
    } catch {
        detail = body.slice(0, 200);
    }

    switch (status) {
        case 401: return `Invalid API key for ${provider}. Check your key in AI Settings.`;
        case 403: return `Access denied by ${provider}. ${detail || 'Check API key permissions.'}`;
        case 429: return `Rate limited by ${provider}. Please wait a moment and try again.`;
        case 500:
        case 502:
        case 503: return `${provider} server error (${status}). Please try again later.`;
        default:  return `${provider} error ${status}: ${detail || 'Unknown error'}`;
    }
}

function formatNetworkError(provider: string, err: any): string {
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        return `Network error: unable to reach ${provider} API. Check your internet connection.`;
    }
    if (err.message?.includes('CORS') || err.message?.includes('cors')) {
        return `CORS error calling ${provider}. This provider may not support direct browser calls.`;
    }
    return `Network error calling ${provider}: ${err.message || 'Unknown error'}`;
}
