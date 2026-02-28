/**
 * Business Report — 8-slide professional report template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createSectionBreakElements,
    createClosingElements, createMetricsSlideElements,
    createComparisonSlideElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#1e3a5f', secondary: '#0f1d30', accent: '#2ecc71',
    background: '#f8fafc', text: '#1e293b',
    primaryLight: '#1e3a5f15', accentLight: '#2ecc7120',
    gradientFrom: '#1e3a5f', gradientTo: '#0f1d30',
};
const darkBgPalette: SlidePalette = { ...palette, text: '#f1f5f9' };

export const businessReport: PresentationTemplate = {
    metadata: {
        id: 'business-report',
        name: 'Business Report',
        category: 'presentations',
        description: 'Professional quarterly or annual business report',
        tags: ['business', 'report', 'corporate', 'quarterly'],
        order: 2,
    },
    palette,
    slides: [
        {
            name: 'Cover',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('Annual Business Report', 'FY 2025 — Performance & Strategy', darkBgPalette),
        },
        {
            name: 'Agenda',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Agenda', [
                'Executive Summary',
                'Financial Performance',
                'Key Achievements',
                'Market Analysis',
                'Strategic Priorities',
                'Outlook & Next Steps',
            ], undefined, palette),
        },
        {
            name: 'Key Metrics',
            backgroundColor: palette.background,
            elements: createMetricsSlideElements('Financial Highlights', [
                { value: '$48M', label: 'Total Revenue (+35% YoY)' },
                { value: '78%', label: 'Gross Margin' },
                { value: '2,400', label: 'Total Customers (+45%)' },
                { value: '125%', label: 'Net Revenue Retention' },
            ], palette),
        },
        {
            name: 'Key Achievements',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Key Achievements', [
                'Launched 3 new product lines generating $8M revenue',
                'Expanded to European and APAC markets',
                'Achieved SOC 2 Type II certification',
                'Grew engineering team from 45 to 80',
                'Won "Best Innovation" at industry awards',
            ], undefined, palette),
        },
        {
            name: 'Market Analysis',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Market Analysis',
                ['Market size: $25B (2025)', 'Growth rate: 18% CAGR', 'Our market share: 3.2%', 'Top 3 competitor threat: Moderate'],
                ['Emerging opportunity: AI/ML', 'Regulatory tailwind: Favorable', 'Customer demand: Strong', 'Pricing power: Increasing'],
                palette),
        },
        {
            name: 'YoY Comparison',
            backgroundColor: palette.background,
            elements: createComparisonSlideElements('Year-over-Year',
                'FY 2024', 'FY 2025',
                ['Revenue: $35.5M', 'Customers: 1,650', 'Gross Margin: 74%', 'Churn: 6.2%', 'Team Size: 78'],
                ['Revenue: $48M (+35%)', 'Customers: 2,400 (+45%)', 'Gross Margin: 78%', 'Churn: 4.8% (-1.4%)', 'Team Size: 120'],
                palette),
        },
        {
            name: 'Strategic Priorities',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Strategic Priorities for FY 2026', 'Growth · Innovation · Efficiency', palette),
        },
        {
            name: 'Closing',
            backgroundColor: palette.background,
            elements: createClosingElements('Questions?', 'Thank you for your time and support', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
