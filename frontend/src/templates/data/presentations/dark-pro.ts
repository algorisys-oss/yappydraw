/**
 * Dark Professional — 8-slide dark-themed presentation
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createQuoteElements,
    createSectionBreakElements, createClosingElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#60a5fa', secondary: '#0f172a', accent: '#fbbf24',
    background: '#1e293b', text: '#f1f5f9',
};

export const darkPro: PresentationTemplate = {
    metadata: {
        id: 'dark-pro',
        name: 'Dark Professional',
        category: 'presentations',
        description: 'Sleek dark theme for tech and professional presentations',
        tags: ['dark', 'tech', 'professional', 'modern'],
        order: 6,
    },
    palette,
    slides: [
        {
            name: 'Title',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('Dark Mode Presentation', 'Bold, modern, and easy on the eyes', palette),
        },
        {
            name: 'Introduction',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Introduction', [
                'High-contrast design for maximum readability',
                'Perfect for tech talks and developer conferences',
                'Works great in dimly lit presentation rooms',
                'Modern aesthetic that commands attention',
            ], undefined, palette),
        },
        {
            name: 'Architecture',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('System Architecture',
                ['Frontend: React/SolidJS', 'API Layer: REST + GraphQL', 'Backend: Node.js/Go', 'Database: PostgreSQL'],
                ['Cache: Redis', 'Queue: RabbitMQ', 'Search: Elasticsearch', 'CDN: CloudFront'],
                palette),
        },
        {
            name: 'Key Features',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Key Features', [
                'Real-time data processing pipeline',
                'ML-powered recommendation engine',
                'Zero-downtime deployment strategy',
                'Auto-scaling infrastructure',
                'End-to-end encryption',
            ], undefined, palette),
        },
        {
            name: 'Performance',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Performance Metrics', 'Speed · Scale · Reliability', palette),
        },
        {
            name: 'Results',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Results',
                ['99.99% uptime', 'Sub-50ms latency', '10M requests/day', '3x faster deploys'],
                ['60% cost reduction', '45% less code', '2x developer velocity', 'Zero critical bugs'],
                palette),
        },
        {
            name: 'Quote',
            backgroundColor: palette.background,
            elements: createQuoteElements(
                'Any sufficiently advanced technology is indistinguishable from magic.',
                'Arthur C. Clarke',
                palette),
        },
        {
            name: 'End',
            backgroundColor: palette.secondary,
            elements: createClosingElements('Thank You', 'github.com/project  |  @handle', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
