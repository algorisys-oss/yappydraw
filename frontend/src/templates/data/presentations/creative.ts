/**
 * Creative Portfolio — 7-slide portfolio/showcase template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createImageTextElements,
    createSectionBreakElements, createClosingElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#8b5cf6', secondary: '#3b1f6e', accent: '#f59e0b',
    background: '#faf5ff', text: '#1e293b',
};
const darkBgPalette: SlidePalette = { ...palette, text: '#f1f5f9' };

export const creative: PresentationTemplate = {
    metadata: {
        id: 'creative',
        name: 'Creative Portfolio',
        category: 'presentations',
        description: 'Showcase creative work, design projects, and portfolios',
        tags: ['creative', 'portfolio', 'design', 'showcase'],
        order: 4,
    },
    palette,
    slides: [
        {
            name: 'Cover',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('Creative Portfolio', 'Design · Illustration · Photography', darkBgPalette),
        },
        {
            name: 'About',
            backgroundColor: palette.background,
            elements: createContentSlideElements('About Me', undefined,
                'I\'m a multidisciplinary designer with 8 years of experience crafting digital experiences. My work spans brand identity, UI/UX design, illustration, and creative direction. I believe in design that tells stories and creates emotional connections.',
                palette),
        },
        {
            name: 'Services',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('What I Do',
                ['Brand Identity', 'UI/UX Design', 'Illustration', 'Creative Direction'],
                ['Web Design', 'Motion Graphics', 'Typography', 'Art Direction'],
                palette),
        },
        {
            name: 'Project 1',
            backgroundColor: palette.background,
            elements: createImageTextElements('Project: Brand Redesign',
                'Complete brand overhaul for a fintech startup. Delivered new logo, color system, typography guidelines, and marketing collateral. The rebrand increased brand recognition by 60% within 6 months.',
                palette),
        },
        {
            name: 'Project 2',
            backgroundColor: palette.background,
            elements: createImageTextElements('Project: Mobile App',
                'Designed end-to-end mobile experience for a health & wellness app. User-centered approach with extensive prototyping. App Store featured, 4.8★ rating, 100K+ downloads in first quarter.',
                palette),
        },
        {
            name: 'Process',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('My Process', 'Research → Ideate → Design → Iterate → Deliver', palette),
        },
        {
            name: 'Contact',
            backgroundColor: palette.background,
            elements: createClosingElements('Let\'s Create Together', 'hello@designer.com  |  portfolio.design', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
