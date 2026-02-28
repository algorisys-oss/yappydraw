/**
 * Quarterly Review — 8-slide quarterly business review template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createSectionBreakElements,
    createClosingElements, createMetricsSlideElements,
    createComparisonSlideElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#475569', secondary: '#1e293b', accent: '#0ea5e9',
    background: '#f8fafc', text: '#1e293b',
    primaryLight: '#47556915', accentLight: '#0ea5e920',
    gradientFrom: '#475569', gradientTo: '#1e293b',
};
const darkBgPalette: SlidePalette = { ...palette, text: '#f1f5f9' };

export const quarterlyReview: PresentationTemplate = {
    metadata: {
        id: 'quarterly-review',
        name: 'Quarterly Review',
        category: 'presentations',
        description: 'Structured quarterly business review with KPIs and goals',
        tags: ['quarterly', 'review', 'KPI', 'business'],
        order: 10,
    },
    palette,
    slides: [
        {
            name: 'Cover',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('Q4 2025 Review', 'Department Name — Quarterly Business Review', darkBgPalette),
        },
        {
            name: 'Key Metrics',
            backgroundColor: palette.background,
            elements: createMetricsSlideElements('Quarter at a Glance', [
                { value: '$12.4M', label: 'Revenue (+18% QoQ)' },
                { value: '340', label: 'New Customers (+22%)' },
                { value: '3.1%', label: 'Churn Rate (-0.8%)' },
                { value: '74', label: 'Net Promoter Score' },
            ], palette),
        },
        {
            name: 'Highlights',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Quarter Highlights', [
                'Revenue target exceeded by 12%',
                'Launched 2 major product features',
                'Customer satisfaction at all-time high',
                'Team expanded by 8 new hires',
                'Zero P0 incidents this quarter',
            ], undefined, palette),
        },
        {
            name: 'Wins',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Key Wins', [
                'Closed largest enterprise deal ($1.2M ACV)',
                'Product featured at industry conference keynote',
                'Reduced infrastructure costs by 25%',
                'Achieved ISO 27001 certification ahead of schedule',
            ], undefined, palette),
        },
        {
            name: 'Q3 vs Q4',
            backgroundColor: palette.background,
            elements: createComparisonSlideElements('Quarter Comparison',
                'Q3 2025', 'Q4 2025',
                ['Revenue: $10.5M', 'New Customers: 280', 'Churn: 3.9%', 'DAU: 35K', 'NPS: 68'],
                ['Revenue: $12.4M (+18%)', 'New Customers: 340 (+22%)', 'Churn: 3.1% (-0.8%)', 'DAU: 45K (+30%)', 'NPS: 74 (+6)'],
                palette),
        },
        {
            name: 'Challenges',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Challenges & Learnings', [
                'Hiring velocity below target — adjusted strategy',
                'Feature X delayed 3 weeks — improved scoping',
                'APAC expansion slower — pivoting GTM approach',
                'Technical debt in legacy module — sprint planned',
            ], undefined, palette),
        },
        {
            name: 'Next Quarter',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Q1 2026 Goals', 'Growth · Product · Team', palette),
        },
        {
            name: 'Closing',
            backgroundColor: palette.background,
            elements: createClosingElements('Discussion', 'Questions, feedback, and alignment', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
