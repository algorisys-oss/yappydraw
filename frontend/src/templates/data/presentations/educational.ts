/**
 * Educational — 8-slide teaching/lecture template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createQuoteElements,
    createSectionBreakElements, createClosingElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#27ae60', secondary: '#1a4d2e', accent: '#f39c12',
    background: '#f9fafb', text: '#1e293b',
};

export const educational: PresentationTemplate = {
    metadata: {
        id: 'educational',
        name: 'Educational',
        category: 'presentations',
        description: 'Clean layout for lectures, workshops, and training',
        tags: ['education', 'lecture', 'workshop', 'training'],
        order: 3,
    },
    palette,
    slides: [
        {
            name: 'Title',
            backgroundColor: palette.background,
            elements: createTitleSlideElements('Course Title', 'Instructor Name — Department — Date', palette),
        },
        {
            name: 'Learning Objectives',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Learning Objectives', [
                'Understand the fundamental concepts',
                'Apply theory to practical scenarios',
                'Analyze real-world case studies',
                'Evaluate and compare approaches',
            ], undefined, palette),
        },
        {
            name: 'Key Concepts',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Key Concepts',
                ['Definition & terminology', 'Historical context', 'Core principles', 'Theoretical framework'],
                ['Modern applications', 'Common misconceptions', 'Best practices', 'Research findings'],
                palette),
        },
        {
            name: 'Section Break',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Deep Dive', 'Exploring the details', palette),
        },
        {
            name: 'Detailed Explanation',
            backgroundColor: palette.background,
            elements: createContentSlideElements('How It Works', [
                'Step 1: Identify the problem space',
                'Step 2: Gather and organize data',
                'Step 3: Apply the framework',
                'Step 4: Validate results',
                'Step 5: Iterate and improve',
            ], undefined, palette),
        },
        {
            name: 'Case Study',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Case Study', undefined,
                'In 2024, a research team applied this methodology to a real-world problem involving urban planning. By following the framework outlined in this course, they reduced planning cycles by 40% while improving stakeholder satisfaction scores. This demonstrates how theoretical concepts translate directly into measurable outcomes.',
                palette),
        },
        {
            name: 'Key Takeaway',
            backgroundColor: palette.background,
            elements: createQuoteElements(
                'Education is not the filling of a pail, but the lighting of a fire.',
                'W.B. Yeats',
                palette),
        },
        {
            name: 'Summary',
            backgroundColor: palette.background,
            elements: createClosingElements('Key Takeaways', 'Review · Practice · Apply — Questions welcome!', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
