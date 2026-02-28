/**
 * Pitch Deck — 10-slide corporate presentation template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements,
    createSectionBreakElements, createClosingElements,
    createMetricsSlideElements, createTimelineSlideElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#3498db', secondary: '#1e3a5f', accent: '#e74c3c',
    background: '#ffffff', text: '#1e293b',
    primaryLight: '#3498db15', accentLight: '#e74c3c20',
    gradientFrom: '#3498db', gradientTo: '#1e3a5f',
};

export const pitchDeck: PresentationTemplate = {
    metadata: {
        id: 'pitch-deck',
        name: 'Pitch Deck',
        category: 'presentations',
        description: 'Classic startup pitch deck with 10 structured slides',
        tags: ['business', 'startup', 'pitch', 'investor'],
        order: 1,
    },
    palette,
    slides: [
        {
            name: 'Title',
            backgroundColor: palette.background,
            elements: createTitleSlideElements('Company Name', 'Tagline goes here — one sentence that captures your vision', palette),
        },
        {
            name: 'Problem',
            backgroundColor: palette.background,
            elements: createContentSlideElements('The Problem', [
                'Current solutions are slow and expensive',
                'Users struggle with fragmented workflows',
                'Market lacks an integrated approach',
                'Lost productivity costs $X billion annually',
            ], undefined, palette),
        },
        {
            name: 'Solution',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Our Solution', [
                'All-in-one platform that simplifies the workflow',
                'AI-powered automation saves 10× the time',
                'Seamless integration with existing tools',
                'Intuitive interface — no training needed',
            ], undefined, palette),
        },
        {
            name: 'Market Opportunity',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Market Opportunity',
                ['TAM: $50B global market', 'SAM: $12B addressable', 'SOM: $2B initial target', 'Growing 25% YoY'],
                ['Early adopters: Enterprise', 'Expansion: SMBs', 'Future: Consumer', 'Global reach by Year 3'],
                palette),
        },
        {
            name: 'Traction',
            backgroundColor: palette.background,
            elements: createMetricsSlideElements('Traction', [
                { value: '500+', label: 'Paying Customers' },
                { value: '$2M', label: 'Annual Recurring Revenue' },
                { value: '20%', label: 'Month-over-Month Growth' },
                { value: '72', label: 'Net Promoter Score' },
            ], palette),
        },
        {
            name: 'Business Model',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Business Model',
                ['SaaS subscription model', 'Free tier → Pro → Enterprise', 'Annual contracts preferred', 'Net revenue retention: 130%'],
                ['Avg deal size: $25K/yr', 'Sales cycle: 30 days', 'LTV:CAC ratio: 5:1', 'Gross margin: 85%'],
                palette),
        },
        {
            name: 'Milestones',
            backgroundColor: palette.background,
            elements: createTimelineSlideElements('Key Milestones', [
                { year: '2023', text: 'Company founded, seed round' },
                { year: 'Q2 2024', text: 'Beta launch, 100 users' },
                { year: 'Q4 2024', text: '$1M ARR milestone' },
                { year: 'Q2 2025', text: '500+ customers, Series A' },
                { year: '2026', text: 'International expansion' },
            ], palette),
        },
        {
            name: 'Team',
            backgroundColor: palette.background,
            elements: createContentSlideElements('The Team', [
                'CEO — 15 years in enterprise SaaS, ex-Google',
                'CTO — PhD in AI/ML, ex-Meta Research',
                'VP Sales — Built $100M ARR org at Salesforce',
                'VP Product — Former product lead at Stripe',
            ], undefined, palette),
        },
        {
            name: 'The Ask',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Raising $10M Series A', 'To accelerate growth and expand into new markets', palette),
        },
        {
            name: 'Thank You',
            backgroundColor: palette.background,
            elements: createClosingElements('Thank You', 'contact@company.com  |  company.com', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
