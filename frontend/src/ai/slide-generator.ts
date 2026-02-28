/**
 * AI Slide Generator
 * Converts a user prompt into a full slide deck via LLM + slide-element-factory.
 *
 * Supports two modes:
 * - "quick" (default): Single LLM call — fast but content may be generic
 * - "deep": 2-stage agentic pipeline — Content Agent → Visual Agent — richer output
 */

import { callLLM } from './ai-providers';
import { getActiveProviderConfig, hasAnyApiKey } from './ai-settings';
import { SLIDE_SYSTEM_PROMPT, buildSlideUserPrompt } from './slide-system-prompt';
import { CONTENT_AGENT_PROMPT, buildContentUserPrompt } from './slide-content-prompt';
import { VISUAL_AGENT_PROMPT } from './slide-visual-prompt';
import {
    createSlideElements, offsetElements, PALETTES,
    type AISlideContent,
} from '../utils/slide-element-factory';
import type { SlidePalette } from '../types/template-types';
import type { DrawingElement } from '../types';
import type { SlideTransition } from '../types/slide-types';
import type { PresetAnimation } from '../types/motion-types';
import { loadDocument } from '../store/app-store';
import { generateId } from '../utils/id-generator';

export interface GenerateOptions {
    style?: string;       // 'auto' | 'corporate' | 'forest' | 'royal' | 'sunset' | 'dark' | 'minimalist'
    slideCount?: number;  // 0 = auto, or specific count (6-50)
    clearCanvas?: boolean;
    mode?: 'quick' | 'deep';  // generation mode (default: 'quick')
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
}

export interface GeneratePresResult {
    success: boolean;
    slideCount?: number;
    title?: string;
    error?: string;
    duration?: number;
    usage?: TokenUsage;
}

/**
 * Main entry point: user prompt → slide deck on canvas.
 * Dispatches to quick (single-shot) or deep (2-stage agentic) mode.
 */
export async function generatePresentation(
    userPrompt: string,
    options: GenerateOptions = {},
    onProgress?: (stage: string) => void,
): Promise<GeneratePresResult> {
    if (options.mode === 'deep') {
        return generatePresentationDeep(userPrompt, options, onProgress);
    }
    return generatePresentationQuick(userPrompt, options, onProgress);
}

// ── Quick Mode (single LLM call) ─────────────────────────

async function generatePresentationQuick(
    userPrompt: string,
    options: GenerateOptions,
    onProgress?: (stage: string) => void,
): Promise<GeneratePresResult> {
    const startTime = performance.now();

    if (!hasAnyApiKey()) {
        return { success: false, error: 'No API key configured. Open AI Settings to add one.' };
    }

    const { provider, model, apiKey } = getActiveProviderConfig();
    const userMsg = buildSlideUserPrompt(userPrompt, {
        style: options.style,
        slideCount: options.slideCount || undefined,
    });

    // Scale maxTokens based on slide count (~250 tokens per slide)
    const requestedSlides = options.slideCount || 10;
    const maxTokens = Math.min(Math.max(requestedSlides * 250, 4096), 16384);

    onProgress?.('Generating slides...');

    // Call LLM
    const llmResponse = await callLLM({
        provider,
        model,
        apiKey,
        systemPrompt: SLIDE_SYSTEM_PROMPT,
        userPrompt: userMsg,
        temperature: 0.7,
        maxTokens,
    });

    if (!llmResponse.success) {
        return { success: false, error: llmResponse.error || 'LLM request failed' };
    }

    // Parse and build
    const spec = parseSlideSpec(llmResponse.content);
    if (!spec.success) return { success: false, error: spec.error };

    return buildSlideDocument(spec.data!, startTime, llmResponse.usage);
}

// ── Deep Mode (2-stage agentic pipeline) ──────────────────

async function generatePresentationDeep(
    userPrompt: string,
    options: GenerateOptions,
    onProgress?: (stage: string) => void,
): Promise<GeneratePresResult> {
    const startTime = performance.now();

    if (!hasAnyApiKey()) {
        return { success: false, error: 'No API key configured. Open AI Settings to add one.' };
    }

    const { provider, model, apiKey } = getActiveProviderConfig();

    // ── Stage 1: Content Agent ──
    onProgress?.('Researching and writing content...');

    const contentUserPrompt = buildContentUserPrompt(userPrompt, {
        style: options.style,
        slideCount: options.slideCount || undefined,
    });

    const requestedSlides = options.slideCount || 10;
    const contentMaxTokens = Math.min(Math.max(requestedSlides * 300, 4096), 16384);

    const contentResponse = await callLLM({
        provider,
        model,
        apiKey,
        systemPrompt: CONTENT_AGENT_PROMPT,
        userPrompt: contentUserPrompt,
        temperature: 0.7,
        maxTokens: contentMaxTokens,
    });

    if (!contentResponse.success) {
        return { success: false, error: `Content agent failed: ${contentResponse.error || 'Unknown error'}` };
    }

    // Accumulate usage from both stages
    const totalUsage: TokenUsage = {
        promptTokens: contentResponse.usage?.promptTokens || 0,
        completionTokens: contentResponse.usage?.completionTokens || 0,
    };

    // Parse content agent output
    let contentSpec: any;
    try {
        contentSpec = parseJsonResponse(contentResponse.content);
    } catch (e) {
        return { success: false, error: 'Content agent returned invalid JSON. Please try again.' };
    }

    if (!contentSpec.sections || !Array.isArray(contentSpec.sections)) {
        return { success: false, error: 'Content agent returned no sections. Please try again.' };
    }

    // ── Stage 2: Visual Designer Agent ──
    onProgress?.('Designing visual layout...');

    // Count total slides from content for token budget
    const totalContentSlides = contentSpec.sections.reduce(
        (sum: number, s: any) => sum + (s.slides?.length || 0), 0
    );
    // Visual agent adds section-break slides, so budget slightly higher
    const visualMaxTokens = Math.min(Math.max((totalContentSlides + 5) * 250, 4096), 16384);

    const visualResponse = await callLLM({
        provider,
        model,
        apiKey,
        systemPrompt: VISUAL_AGENT_PROMPT,
        userPrompt: JSON.stringify(contentSpec),
        temperature: 0.3,
        maxTokens: visualMaxTokens,
    });

    if (!visualResponse.success) {
        // Fallback: try heuristic mapping instead of failing
        onProgress?.('Visual agent failed, applying heuristic layout...');
        const fallbackSpec = heuristicVisualMapping(contentSpec, options.style);
        return buildSlideDocument(fallbackSpec, startTime, totalUsage);
    }

    // Add visual agent usage
    totalUsage.promptTokens += visualResponse.usage?.promptTokens || 0;
    totalUsage.completionTokens += visualResponse.usage?.completionTokens || 0;

    // Parse visual agent output
    const spec = parseSlideSpec(visualResponse.content);
    if (!spec.success) {
        // Fallback on parse failure too
        onProgress?.('Applying heuristic layout...');
        const fallbackSpec = heuristicVisualMapping(contentSpec, options.style);
        return buildSlideDocument(fallbackSpec, startTime, totalUsage);
    }

    return buildSlideDocument(spec.data!, startTime, totalUsage);
}

// ── Shared Utilities ──────────────────────────────────────

/** Parse JSON from an LLM response, stripping markdown fences. */
function parseJsonResponse(content: string): any {
    let raw = content.trim();
    if (raw.startsWith('```')) {
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    // Try direct parse
    try { return JSON.parse(raw); } catch { /* fall through */ }
    // Try extracting from first { to last }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
        return JSON.parse(raw.substring(start, end + 1));
    }
    throw new Error('No valid JSON found');
}

/** Parse the final slide spec from LLM response. */
function parseSlideSpec(content: string): {
    success: boolean;
    data?: { title?: string; colorPalette?: string; slides: AISlideContent[] };
    error?: string;
} {
    let spec: any;
    try {
        spec = parseJsonResponse(content);
    } catch (e) {
        return { success: false, error: 'Failed to parse AI response as JSON. Please try again.' };
    }

    if (!spec.slides || !Array.isArray(spec.slides) || spec.slides.length === 0) {
        return { success: false, error: 'AI returned no slides. Please try a different prompt.' };
    }

    return { success: true, data: spec };
}

/** Build the slide document from a parsed spec and load it onto canvas. */
function buildSlideDocument(
    spec: { title?: string; colorPalette?: string; slides: AISlideContent[] },
    startTime: number,
    usage?: TokenUsage,
): GeneratePresResult {
    const paletteName = spec.colorPalette || 'corporate';
    const palette: SlidePalette = PALETTES[paletteName] || PALETTES.corporate;

    const SLIDE_GAP = 2000;
    const allElements: DrawingElement[] = [];
    const slides: any[] = [];

    spec.slides.forEach((slideSpec, index) => {
        const spatialX = index * SLIDE_GAP;
        const relativeElements = createSlideElements(slideSpec, palette);
        const positioned = offsetElements(relativeElements, spatialX, 0);

        // Apply entrance animations to elements
        const animated = applySlideAnimations(positioned as DrawingElement[], slideSpec.slideType);
        allElements.push(...animated);

        slides.push({
            id: generateId('slide'),
            name: slideSpec.title || `Slide ${index + 1}`,
            spatialPosition: { x: spatialX, y: 0 },
            dimensions: { width: 1920, height: 1080 },
            order: index,
            backgroundColor: slideSpec.backgroundColor || palette.background,
            transition: getSlideTransition(slideSpec.slideType, index),
        });
    });

    const doc = {
        version: 4,
        metadata: { name: spec.title || 'AI Presentation', docType: 'slides' as const },
        elements: allElements,
        layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0, backgroundColor: 'transparent' }],
        slides,
        globalSettings: {},
    };
    loadDocument(doc);

    const duration = performance.now() - startTime;
    return {
        success: true,
        slideCount: spec.slides.length,
        title: spec.title,
        duration,
        usage,
    };
}

// ── Slide Transitions ─────────────────────────────────────

/** Assign a slide transition based on slide type and position. */
function getSlideTransition(slideType: string, index: number): SlideTransition {
    // First slide: fade in from black
    if (index === 0) {
        return { type: 'fade', duration: 600, easing: 'easeInOutCubic' };
    }

    switch (slideType) {
        case 'title':
        case 'closing':
            return { type: 'fade', duration: 600, easing: 'easeInOutCubic' };
        case 'section-break':
            return { type: 'zoom-in', duration: 500, easing: 'easeOutCubic' };
        case 'quote':
            return { type: 'fade', duration: 700, easing: 'easeInOutQuad' };
        default:
            // Alternate between slide-left and fade for content variety
            return index % 3 === 0
                ? { type: 'fade', duration: 500, easing: 'easeInOutQuad' }
                : { type: 'slide-left', duration: 450, easing: 'easeOutCubic' };
    }
}

// ── Element Animations ────────────────────────────────────

/** Create a preset animation config. */
function presetAnim(
    name: string,
    opts: { trigger?: 'on-load' | 'on-click' | 'after-prev' | 'with-prev'; delay?: number; duration?: number; easing?: string; startHidden?: boolean } = {}
): PresetAnimation {
    return {
        id: generateId('anim'),
        type: 'preset',
        name,
        trigger: opts.trigger || 'on-load',
        delay: opts.delay || 0,
        duration: opts.duration || 600,
        easing: (opts.easing || 'easeOutCubic') as any,
        startHidden: opts.startHidden ?? true,
    };
}

/**
 * Apply entrance animations to slide elements based on slide type.
 * Classifies elements by their id prefix and properties, then assigns
 * appropriate animations with staggered delays.
 */
function applySlideAnimations(elements: DrawingElement[], slideType: string): DrawingElement[] {
    // Classify elements into roles
    const classified = elements.map(el => ({
        el,
        role: classifyElement(el),
    }));

    // Track stagger counters per role
    let contentIndex = 0;

    for (const { el, role } of classified) {
        switch (role) {
            case 'decorative':
                // Background shapes, gradients — subtle fade, no startHidden
                el.animations = [presetAnim('fadeIn', { duration: 800, delay: 0, startHidden: false })];
                break;

            case 'title':
                // Main title text — slide down into view
                el.animations = [presetAnim('slideInDown', { duration: 500, delay: 100 })];
                break;

            case 'subtitle':
                // Subtitle — fade in after title
                el.animations = [presetAnim('fadeIn', { duration: 500, delay: 300 })];
                break;

            case 'content-card':
                // Card backgrounds — zoom in with stagger
                el.animations = [presetAnim('zoomIn', { duration: 400, delay: 200 + contentIndex * 120 })];
                contentIndex++;
                break;

            case 'content-text':
                // Bullet points, body text — slide in from left with stagger
                el.animations = [presetAnim('slideInLeft', { duration: 400, delay: 200 + contentIndex * 100 })];
                contentIndex++;
                break;

            case 'metric-value':
                // Large metric numbers — zoom in with punch
                el.animations = [presetAnim('zoomIn', { duration: 500, delay: 200 + contentIndex * 150, easing: 'easeOutBack' })];
                contentIndex++;
                break;

            case 'shape-icon':
                // Icon shapes in cards — zoom in with content
                el.animations = [presetAnim('zoomIn', { duration: 400, delay: 200 + contentIndex * 120 })];
                contentIndex++;
                break;

            case 'timeline-dot':
                // Timeline milestone dots — pop in sequentially
                el.animations = [presetAnim('zoomIn', { duration: 300, delay: 300 + contentIndex * 150, easing: 'easeOutBack' })];
                contentIndex++;
                break;

            case 'accent':
                // Accent bars, dividers — slide in
                el.animations = [presetAnim('slideInLeft', { duration: 400, delay: 150, startHidden: false })];
                break;

            default:
                // Fallback — simple fade
                el.animations = [presetAnim('fadeIn', { duration: 500, delay: 100 + contentIndex * 80 })];
                contentIndex++;
                break;
        }
    }

    // Override animations for specific slide types
    if (slideType === 'section-break') {
        // Section breaks: everything fades in together, no stagger
        for (const { el, role } of classified) {
            if (role === 'title') {
                el.animations = [presetAnim('zoomIn', { duration: 600, delay: 100, easing: 'easeOutBack' })];
            } else if (role === 'subtitle') {
                el.animations = [presetAnim('fadeIn', { duration: 500, delay: 400 })];
            } else {
                el.animations = [presetAnim('fadeIn', { duration: 600, delay: 0, startHidden: false })];
            }
        }
    }

    if (slideType === 'quote') {
        for (const { el, role } of classified) {
            if (role === 'title') {
                // Quote text — slow fade for impact
                el.animations = [presetAnim('fadeIn', { duration: 800, delay: 200 })];
            } else if (role === 'subtitle') {
                el.animations = [presetAnim('fadeIn', { duration: 500, delay: 600 })];
            }
        }
    }

    return elements;
}

type ElementRole = 'decorative' | 'title' | 'subtitle' | 'content-card' | 'content-text' | 'metric-value' | 'shape-icon' | 'timeline-dot' | 'accent' | 'unknown';

/** Classify an element's role based on its id prefix, type, and properties. */
function classifyElement(el: DrawingElement): ElementRole {
    const id = el.id || '';
    const type = el.type;

    // Decorative background shapes (low opacity, large, shapes)
    if (id.startsWith('shape-') && (el.opacity ?? 100) <= 20) return 'decorative';
    if (id.startsWith('grad-')) return 'decorative';

    // Gradient rects used as backgrounds (full-width or very large)
    if (id.startsWith('rect-') && el.width >= 1800 && el.height >= 900) return 'decorative';

    // Card backgrounds
    if (id.startsWith('card-')) return 'content-card';

    // Shape icons (small shapes inside cards, not decorative)
    if (id.startsWith('shape-') && (el.opacity ?? 100) > 20) {
        if (el.width <= 60 && el.height <= 60) return 'shape-icon';
        // Timeline dots (circles on timeline bar)
        if (type === 'circle' && el.width <= 30) return 'timeline-dot';
        return 'shape-icon';
    }

    // Text classification by fontSize
    if (type === 'text') {
        const fontSize = el.fontSize || 28;

        // Large title text (≥36px)
        if (fontSize >= 36) return 'title';
        // Subtitle / attribution (14-20px, centered or specific patterns)
        if (fontSize <= 20) return 'subtitle';
        // Metric values (large bold text, 48+)
        if (fontSize >= 48) return 'metric-value';
        // Default text = content
        return 'content-text';
    }

    // Thin accent rectangles (accent bars, dividers)
    if (id.startsWith('rect-') && (el.height <= 6 || el.width <= 6)) return 'accent';

    // Remaining rectangles — likely backgrounds or containers
    if (id.startsWith('rect-')) return 'decorative';

    return 'unknown';
}

// ── Heuristic Fallback ────────────────────────────────────

/** Map content agent output to slide spec using heuristic rules (no LLM). */
function heuristicVisualMapping(
    contentSpec: any,
    stylePref?: string,
): { title?: string; colorPalette?: string; slides: AISlideContent[] } {
    const intentToSlideType: Record<string, string> = {
        title: 'title',
        stats: 'metrics',
        points: 'content',
        story: 'content',
        comparison: 'comparison',
        features: 'card-grid',
        roadmap: 'timeline',
        quote: 'quote',
        overview: 'two-column',
        closing: 'closing',
    };

    // Choose palette from tone suggestion or style preference
    const toneTopalette: Record<string, string> = {
        professional: 'corporate',
        energetic: 'sunset',
        technical: 'dark',
        creative: 'royal',
        minimal: 'minimalist',
    };
    const colorPalette = (stylePref && stylePref !== 'auto')
        ? stylePref
        : toneTopalette[contentSpec.toneSuggestion] || 'corporate';

    const slides: AISlideContent[] = [];

    for (const section of (contentSpec.sections || [])) {
        // Add section-break before each non-first section
        if (slides.length > 0) {
            slides.push({
                slideType: 'section-break',
                title: section.sectionTitle || 'Section',
            } as AISlideContent);
        }

        for (const slide of (section.slides || [])) {
            const slideType = intentToSlideType[slide.intent] || 'content';
            const mapped: any = {
                slideType,
                title: slide.title,
            };

            const c = slide.content || {};

            switch (slide.intent) {
                case 'title':
                case 'closing':
                    mapped.subtitle = c.subtitle;
                    break;
                case 'stats':
                    mapped.metrics = c.metrics;
                    break;
                case 'points':
                    mapped.bullets = c.bullets;
                    mapped.body = c.body;
                    break;
                case 'story':
                    mapped.body = c.body;
                    break;
                case 'comparison':
                    mapped.comparisonLeft = { title: c.leftTitle || 'Option A', items: c.leftItems || [] };
                    mapped.comparisonRight = { title: c.rightTitle || 'Option B', items: c.rightItems || [] };
                    break;
                case 'features':
                    mapped.cards = c.cards;
                    break;
                case 'roadmap':
                    mapped.timelineItems = c.timelineItems;
                    break;
                case 'quote':
                    mapped.quote = { text: c.text, attribution: c.attribution };
                    break;
                case 'overview':
                    mapped.leftColumn = c.leftColumn;
                    mapped.rightColumn = c.rightColumn;
                    break;
            }

            slides.push(mapped as AISlideContent);
        }
    }

    return {
        title: contentSpec.title,
        colorPalette,
        slides,
    };
}
