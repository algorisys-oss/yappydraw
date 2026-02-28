/**
 * Startup Launch — 9-slide energetic launch template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createQuoteElements,
    createSectionBreakElements, createClosingElements,
    createImageTextElements, createCardGridSlideElements,
    createTimelineSlideElements, createMetricsSlideElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#f97316', secondary: '#7c2d12', accent: '#3b82f6',
    background: '#fffbeb', text: '#1e293b',
    primaryLight: '#f9731615', accentLight: '#3b82f620',
    gradientFrom: '#f97316', gradientTo: '#7c2d12',
};
const darkBgPalette: SlidePalette = { ...palette, text: '#f1f5f9' };

export const startup: PresentationTemplate = {
    metadata: {
        id: 'startup',
        name: 'Startup Launch',
        category: 'presentations',
        description: 'Energetic template for product launches and announcements',
        tags: ['startup', 'launch', 'product', 'announcement'],
        order: 7,
    },
    palette,
    slides: [
        {
            name: 'Launch',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('Product Launch', 'Introducing the next big thing', darkBgPalette),
        },
        {
            name: 'The Vision',
            backgroundColor: palette.background,
            elements: createQuoteElements(
                'We\'re building the future of how people work together.',
                'Our Founding Vision',
                palette),
        },
        {
            name: 'Problem',
            backgroundColor: palette.background,
            elements: createContentSlideElements('The Problem We Solve', [
                'Teams waste 30% of their time on coordination',
                'Information silos prevent collaboration',
                'Existing tools are complex and fragmented',
                'Remote work amplifies these challenges',
            ], undefined, palette),
        },
        {
            name: 'Solution',
            backgroundColor: palette.background,
            elements: createImageTextElements('Meet Our Product',
                'An intelligent workspace that brings your team, tools, and data together in one place. Powered by AI, designed for humans. Setup in 5 minutes, productivity gains from day one.',
                palette),
        },
        {
            name: 'Key Features',
            backgroundColor: palette.background,
            elements: createCardGridSlideElements('Key Features', [
                { title: 'Smart Connect', body: 'Link all your existing tools and data sources seamlessly', icon: 'gear' },
                { title: 'AI Workflows', body: 'Automatically structures and optimizes your team processes', icon: 'lightbulb' },
                { title: 'Real-time Collab', body: 'Shared workspaces with live editing and commenting', icon: 'target' },
                { title: 'Deep Analytics', body: 'Actionable insights from your team activity data', icon: 'chart' },
            ], palette),
        },
        {
            name: 'Early Results',
            backgroundColor: palette.background,
            elements: createMetricsSlideElements('Early Results', [
                { value: '500', label: 'Beta Users' },
                { value: '92%', label: 'Daily Active Rate' },
                { value: '4.9★', label: 'User Satisfaction' },
                { value: '45min', label: 'Saved per Day' },
            ], palette),
        },
        {
            name: 'Roadmap',
            backgroundColor: palette.background,
            elements: createTimelineSlideElements('Product Roadmap', [
                { year: 'Q1 2025', text: 'Public beta launch' },
                { year: 'Q2 2025', text: 'Mobile app release' },
                { year: 'Q3 2025', text: 'Enterprise features' },
                { year: 'Q4 2025', text: 'API platform & marketplace' },
                { year: '2026', text: 'International expansion' },
            ], palette),
        },
        {
            name: 'CTA',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Ready to Transform?', 'Join 500+ teams already using our product', palette),
        },
        {
            name: 'Get Started',
            backgroundColor: palette.background,
            elements: createClosingElements('Try It Free Today', 'product.com/start  |  hello@product.com', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
