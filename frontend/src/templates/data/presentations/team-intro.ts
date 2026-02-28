/**
 * Team Introduction — 7-slide team/culture showcase template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createQuoteElements,
    createSectionBreakElements, createClosingElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#0d9488', secondary: '#134e4a', accent: '#f43f5e',
    background: '#f0fdfa', text: '#1e293b',
};
const darkBgPalette: SlidePalette = { ...palette, text: '#f1f5f9' };

export const teamIntro: PresentationTemplate = {
    metadata: {
        id: 'team-intro',
        name: 'Team Introduction',
        category: 'presentations',
        description: 'Introduce your team, culture, and values',
        tags: ['team', 'culture', 'people', 'introduction'],
        order: 8,
    },
    palette,
    slides: [
        {
            name: 'Title',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('Meet Our Team', 'The people behind the product', darkBgPalette),
        },
        {
            name: 'Mission',
            backgroundColor: palette.background,
            elements: createQuoteElements(
                'We believe great products are built by great teams working on hard problems they care deeply about.',
                'Our Mission',
                palette),
        },
        {
            name: 'Team at a Glance',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Team at a Glance',
                ['45 team members', '12 countries', '8 time zones', '15 languages spoken'],
                ['Founded 2022', '60% engineers', '40% women in leadership', 'Avg tenure: 2.5 years'],
                palette),
        },
        {
            name: 'Leadership',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Leadership Team', [
                'Sarah Chen — CEO & Co-founder — ex-Stripe, Stanford MBA',
                'Marcus Rivera — CTO & Co-founder — ex-Google Brain, PhD ML',
                'Aisha Patel — VP Engineering — Built teams at Netflix, Uber',
                'Thomas Berg — VP Product — Product lead at Figma, Notion',
                'Lisa Nakamura — VP Design — Apple Design Award winner',
            ], undefined, palette),
        },
        {
            name: 'Culture',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Our Values',
                ['Ownership over task-taking', 'Ship fast, learn faster', 'Default to transparency', 'Challenge respectfully'],
                ['Celebrate small wins', 'Remote-first mindset', 'Work-life harmony', 'Continuous learning'],
                palette),
        },
        {
            name: 'Growth',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('We\'re Hiring!', 'Join us in building something meaningful', palette),
        },
        {
            name: 'Contact',
            backgroundColor: palette.background,
            elements: createClosingElements('Get In Touch', 'careers@company.com  |  company.com/careers', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
