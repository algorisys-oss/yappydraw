/**
 * AI Drawing Engine — Core orchestration layer.
 * Takes a user prompt, calls an LLM, validates the output as DSL,
 * and renders the diagram to canvas.
 */

import { callLLM, type LLMResponse } from './ai-providers';
import { loadAIConfig, getApiKey, type AIProvider } from './ai-settings';
import { buildSystemPrompt, buildRocketSystemPrompt, buildVisionSystemPrompt } from './system-prompt';
import { processImageForVision } from './image-utils';
import { parseDSL, renderDiagram } from '../dsl';
import type { RenderResult, ParseResult } from '../dsl';

export interface GenerateOptions {
    clearCanvas?: boolean;
    provider?: AIProvider;
    model?: string;
    rocketMode?: boolean;
}

export interface SketchOptions extends GenerateOptions {
    /** Optional text to guide the AI conversion */
    additionalPrompt?: string;
}

export interface GenerateResult {
    success: boolean;
    renderResult?: RenderResult;
    rawResponse?: string;
    parseResult?: ParseResult;
    error?: string;
    duration?: number;
    usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Generate a diagram from a natural language prompt.
 */
export async function generateDiagram(
    userPrompt: string,
    options?: GenerateOptions,
): Promise<GenerateResult> {
    const startTime = Date.now();

    // 1. Load config and validate
    const config = loadAIConfig();
    const provider = options?.provider ?? config.activeProvider;
    const providerConfig = config.providers[provider];
    const apiKey = getApiKey(provider);

    if (!apiKey) {
        return {
            success: false,
            error: `No API key configured for ${provider}. Open AI Settings to add one.`,
        };
    }

    const model = options?.model ?? providerConfig.model;
    const systemPrompt = options?.rocketMode ? buildRocketSystemPrompt() : buildSystemPrompt();
    const maxTokens = options?.rocketMode ? 8192 : 4096;

    // 2. Call LLM
    let llmResponse: LLMResponse;
    try {
        llmResponse = await callLLM({
            provider,
            model,
            apiKey,
            systemPrompt,
            userPrompt,
            temperature: 0.3,
            maxTokens,
        });
    } catch (err: any) {
        return {
            success: false,
            error: `LLM call failed: ${err.message}`,
            duration: Date.now() - startTime,
        };
    }

    if (!llmResponse.success) {
        return {
            success: false,
            error: llmResponse.error ?? 'Unknown LLM error',
            rawResponse: llmResponse.content,
            duration: Date.now() - startTime,
        };
    }

    // 3–5. Extract JSON, parse DSL, render to canvas
    return processLLMResponse(llmResponse.content, startTime, options, llmResponse.usage);
}

/**
 * Generate a diagram from an uploaded sketch image using vision AI.
 */
export async function generateDiagramFromSketch(
    imageFile: File | Blob,
    options?: SketchOptions,
): Promise<GenerateResult> {
    const startTime = Date.now();

    // 1. Load config and validate
    const config = loadAIConfig();
    const provider = options?.provider ?? config.activeProvider;
    const providerConfig = config.providers[provider];
    const apiKey = getApiKey(provider);

    if (!apiKey) {
        return {
            success: false,
            error: `No API key configured for ${provider}. Open AI Settings to add one.`,
        };
    }

    // 2. Process image for vision API
    let image: { base64: string; mediaType: string };
    try {
        image = await processImageForVision(imageFile);
    } catch (err: any) {
        return {
            success: false,
            error: `Image processing failed: ${err.message}`,
            duration: Date.now() - startTime,
        };
    }

    // 3. Call LLM with vision
    const model = options?.model ?? providerConfig.model;
    const systemPrompt = buildVisionSystemPrompt();
    const userPrompt = options?.additionalPrompt
        ? `Convert this sketch into a YappyDraw diagram. Additional context: ${options.additionalPrompt}`
        : 'Convert this hand-drawn sketch into a YappyDraw diagram. Identify all shapes, text labels, and connections. Output only the JSON.';

    let llmResponse: LLMResponse;
    try {
        llmResponse = await callLLM({
            provider,
            model,
            apiKey,
            systemPrompt,
            userPrompt,
            images: [{ base64: image.base64, mediaType: image.mediaType }],
            temperature: 0.3,
            maxTokens: 8192,
        });
    } catch (err: any) {
        return {
            success: false,
            error: `LLM call failed: ${err.message}`,
            duration: Date.now() - startTime,
        };
    }

    if (!llmResponse.success) {
        return {
            success: false,
            error: llmResponse.error ?? 'Unknown LLM error',
            rawResponse: llmResponse.content,
            duration: Date.now() - startTime,
        };
    }

    // 4–6. Extract JSON, parse DSL, render to canvas
    return processLLMResponse(llmResponse.content, startTime, options, llmResponse.usage);
}

// ── Shared Pipeline ─────────────────────────────────────────

/**
 * Shared post-LLM pipeline: extract JSON → parse DSL → render diagram.
 */
function processLLMResponse(
    content: string,
    startTime: number,
    options?: GenerateOptions,
    usage?: { promptTokens: number; completionTokens: number },
): GenerateResult {
    const jsonString = extractJSON(content);
    if (!jsonString) {
        return {
            success: false,
            error: 'Could not extract valid JSON from LLM response. The AI could not recognize shapes in this image — try a clearer sketch or add a description.',
            rawResponse: content,
            duration: Date.now() - startTime,
        };
    }

    const parseResult = parseDSL(jsonString);
    if (!parseResult.success || !parseResult.diagram) {
        const errors = parseResult.errors?.map(e => e.message).join('; ') || 'Unknown parse error';
        return {
            success: false,
            error: `Invalid diagram DSL: ${errors}`,
            rawResponse: content,
            parseResult,
            duration: Date.now() - startTime,
        };
    }

    try {
        const renderResult = renderDiagram(parseResult.diagram, {
            clearCanvas: options?.clearCanvas ?? true,
            zoomToFit: true,
        });

        return {
            success: true,
            renderResult,
            rawResponse: content,
            parseResult,
            duration: Date.now() - startTime,
            usage,
        };
    } catch (err: any) {
        return {
            success: false,
            error: `Render failed: ${err.message}`,
            rawResponse: content,
            parseResult,
            duration: Date.now() - startTime,
        };
    }
}

/**
 * Extract JSON from LLM response text.
 * Handles: raw JSON, markdown-fenced JSON, leading/trailing text.
 */
function extractJSON(text: string): string | null {
    const trimmed = text.trim();

    // 1. Try direct parse (ideal case — LLM returned clean JSON)
    if (trimmed.startsWith('{')) {
        try { JSON.parse(trimmed); return trimmed; } catch { /* fall through */ }
    }

    // 2. Try markdown fence extraction: ```json ... ``` or ``` ... ```
    const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
        const inner = fenceMatch[1].trim();
        try { JSON.parse(inner); return inner; } catch { /* fall through */ }
    }

    // 3. Try to find first { to last matching }
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end > start) {
        const candidate = trimmed.substring(start, end + 1);
        try { JSON.parse(candidate); return candidate; } catch { /* fall through */ }
    }

    return null;
}
