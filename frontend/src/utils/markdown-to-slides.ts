/**
 * Markdown → Slides Parser
 * Converts markdown text into a SlideDocument with positioned elements.
 *
 * Slide break rules:
 *  - `---` (horizontal rule) = explicit slide break
 *  - `# H1` = new slide (title slide if first)
 *  - `## H2` = new slide break if current slide has content
 *
 * Content mapping:
 *  - `# H1` → title text
 *  - `## H2` → slide title
 *  - `### H3` → section heading
 *  - `- bullet` / `* bullet` → bullet list
 *  - `1. item` → numbered list (treated same as bullets)
 *  - `> quote` → quote slide
 *  - Paragraphs → body text
 */

import type { DrawingElement } from '../types';
import type { SlidePalette } from '../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createQuoteElements, createClosingElements,
    offsetElements, PALETTES,
} from './slide-element-factory';
import { generateId } from './id-generator';

interface ParsedSlide {
    title: string;
    type: 'title' | 'content' | 'quote' | 'closing';
    bullets?: string[];
    body?: string;
    quoteText?: string;
    quoteAttribution?: string;
}

/**
 * Detect if text content looks like markdown for slides.
 */
export function isMarkdownSlideContent(text: string): boolean {
    const trimmed = text.trim();
    // Has heading
    if (/^#{1,3}\s+/m.test(trimmed)) return true;
    // Has horizontal rule (slide break)
    if (/^---+\s*$/m.test(trimmed)) return true;
    return false;
}

/**
 * Parse markdown text into a SlideDocument.
 */
export function parseMarkdownToSlides(markdown: string, paletteName?: string) {
    const palette: SlidePalette = PALETTES[paletteName || 'minimalist'] || PALETTES.minimalist;
    const lines = markdown.split('\n');
    const slides: ParsedSlide[] = [];
    let current: ParsedSlide | null = null;
    let bodyLines: string[] = [];

    const flushCurrent = () => {
        if (!current) return;
        // Flush accumulated body lines
        if (bodyLines.length > 0 && !current.bullets?.length && !current.body && !current.quoteText) {
            current.body = bodyLines.join('\n').trim();
        }
        bodyLines = [];
        slides.push(current);
        current = null;
    };

    const startSlide = (title: string, type: ParsedSlide['type'] = 'content') => {
        flushCurrent();
        current = { title, type };
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Horizontal rule → slide break
        if (/^---+\s*$/.test(trimmed)) {
            flushCurrent();
            continue;
        }

        // H1 → title slide or new slide
        const h1Match = trimmed.match(/^#\s+(.+)$/);
        if (h1Match) {
            if (slides.length === 0 && !current) {
                startSlide(h1Match[1], 'title');
            } else {
                startSlide(h1Match[1]);
            }
            continue;
        }

        // H2 → new slide
        const h2Match = trimmed.match(/^##\s+(.+)$/);
        if (h2Match) {
            startSlide(h2Match[1]);
            continue;
        }

        // H3 → treated as sub-heading within current slide body
        const h3Match = trimmed.match(/^###\s+(.+)$/);
        if (h3Match) {
            if (!current) startSlide(h3Match[1]);
            else bodyLines.push(h3Match[1]);
            continue;
        }

        // Blockquote → quote slide
        const quoteMatch = trimmed.match(/^>\s*(.+)$/);
        if (quoteMatch) {
            // Collect all consecutive quote lines
            const quoteLines = [quoteMatch[1]];
            while (i + 1 < lines.length && /^>\s*/.test(lines[i + 1].trim())) {
                i++;
                quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
            }
            const fullQuote = quoteLines.join(' ').trim();
            // Check for attribution pattern: — Name or -- Name
            const attrMatch = fullQuote.match(/^(.+?)\s*[—–-]{1,2}\s*(.+)$/);
            if (current && current.type !== 'title') {
                flushCurrent();
            }
            if (!current) {
                current = { title: '', type: 'quote' };
            }
            if (attrMatch) {
                current.type = 'quote';
                current.quoteText = attrMatch[1].trim();
                current.quoteAttribution = attrMatch[2].trim();
            } else {
                current.type = 'quote';
                current.quoteText = fullQuote;
            }
            continue;
        }

        // Bullet list (- or *)
        const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (bulletMatch) {
            if (!current) startSlide('');
            if (!current!.bullets) current!.bullets = [];
            // Strip bold/italic markdown
            current!.bullets.push(stripInlineMarkdown(bulletMatch[1]));
            continue;
        }

        // Numbered list
        const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (numberedMatch) {
            if (!current) startSlide('');
            if (!current!.bullets) current!.bullets = [];
            current!.bullets.push(stripInlineMarkdown(numberedMatch[1]));
            continue;
        }

        // Empty line
        if (trimmed === '') {
            continue;
        }

        // Regular text → body
        if (!current) startSlide('');
        bodyLines.push(stripInlineMarkdown(trimmed));
    }

    flushCurrent();

    // If no slides were parsed, create a single content slide
    if (slides.length === 0) {
        slides.push({ title: 'Untitled', type: 'content', body: markdown.trim() });
    }

    // Build elements and slide frames
    const SLIDE_GAP = 2000;
    const allElements: DrawingElement[] = [];
    const slideFrames: any[] = [];

    slides.forEach((parsed, index) => {
        const spatialX = index * SLIDE_GAP;

        let relativeElements: Partial<DrawingElement>[];

        switch (parsed.type) {
            case 'title':
                relativeElements = createTitleSlideElements(parsed.title, parsed.body || parsed.bullets?.[0], palette);
                break;
            case 'quote':
                relativeElements = createQuoteElements(parsed.quoteText || '', parsed.quoteAttribution, palette);
                break;
            case 'closing':
                relativeElements = createClosingElements(parsed.title, parsed.body, palette);
                break;
            default:
                relativeElements = createContentSlideElements(parsed.title, parsed.bullets, parsed.body, palette);
                break;
        }

        const positioned = offsetElements(relativeElements, spatialX, 0);
        allElements.push(...positioned);

        slideFrames.push({
            id: generateId('slide'),
            name: parsed.title || `Slide ${index + 1}`,
            spatialPosition: { x: spatialX, y: 0 },
            dimensions: { width: 1920, height: 1080 },
            order: index,
            backgroundColor: palette.background,
        });
    });

    return {
        version: 4,
        metadata: { name: 'Markdown Import', docType: 'slides' as const },
        elements: allElements,
        layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0, backgroundColor: 'transparent' }],
        slides: slideFrames,
        globalSettings: {},
    };
}

/**
 * Strip common inline markdown formatting.
 */
function stripInlineMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
        .replace(/__(.+?)__/g, '$1')        // bold alt
        .replace(/\*(.+?)\*/g, '$1')        // italic
        .replace(/_(.+?)_/g, '$1')          // italic alt
        .replace(/`(.+?)`/g, '$1')          // code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links → text only
        .trim();
}
