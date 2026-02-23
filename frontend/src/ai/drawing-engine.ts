/**
 * AI Drawing Engine — Core orchestration layer.
 * Takes a user prompt, calls an LLM, validates the output as DSL,
 * and renders the diagram to canvas.
 */

import { callLLM, type LLMResponse } from './ai-providers';
import { loadAIConfig, getApiKey, type AIProvider } from './ai-settings';
import { buildSystemPrompt, buildRocketSystemPrompt } from './system-prompt';
import { parseDSL, renderDiagram } from '../dsl';
import type { RenderResult, ParseResult } from '../dsl';

export interface GenerateOptions {
    clearCanvas?: boolean;
    provider?: AIProvider;
    model?: string;
    rocketMode?: boolean;
}

export interface GenerateResult {
    success: boolean;
    renderResult?: RenderResult;
    rawResponse?: string;
    parseResult?: ParseResult;
    error?: string;
    duration?: number;
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

    // 3. Extract JSON from response
    const jsonString = extractJSON(llmResponse.content);
    if (!jsonString) {
        return {
            success: false,
            error: 'Could not extract valid JSON from LLM response. The AI may have returned an explanation instead of a diagram.',
            rawResponse: llmResponse.content,
            duration: Date.now() - startTime,
        };
    }

    // 4. Validate with parseDSL()
    const parseResult = parseDSL(jsonString);
    if (!parseResult.success || !parseResult.diagram) {
        const errors = parseResult.errors?.map(e => e.message).join('; ') || 'Unknown parse error';
        return {
            success: false,
            error: `Invalid diagram DSL: ${errors}`,
            rawResponse: llmResponse.content,
            parseResult,
            duration: Date.now() - startTime,
        };
    }

    // 5. Render to canvas
    try {
        const renderResult = renderDiagram(parseResult.diagram, {
            clearCanvas: options?.clearCanvas ?? true,
            zoomToFit: true,
        });

        return {
            success: true,
            renderResult,
            rawResponse: llmResponse.content,
            parseResult,
            duration: Date.now() - startTime,
        };
    } catch (err: any) {
        return {
            success: false,
            error: `Render failed: ${err.message}`,
            rawResponse: llmResponse.content,
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
