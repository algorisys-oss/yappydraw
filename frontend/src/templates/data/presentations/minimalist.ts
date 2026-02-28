/**
 * Minimalist — 6-slide clean, simple template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createQuoteElements,
    createClosingElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#334155', secondary: '#0f172a', accent: '#3b82f6',
    background: '#ffffff', text: '#1e293b',
};

export const minimalist: PresentationTemplate = {
    metadata: {
        id: 'minimalist',
        name: 'Minimalist',
        category: 'presentations',
        description: 'Clean, distraction-free slides for any topic',
        tags: ['minimal', 'clean', 'simple', 'modern'],
        order: 5,
    },
    palette,
    slides: [
        {
            name: 'Title',
            backgroundColor: palette.background,
            elements: createTitleSlideElements('Presentation Title', 'A clean and minimal approach', palette),
        },
        {
            name: 'Overview',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Overview', [
                'First key point with supporting detail',
                'Second key point with supporting detail',
                'Third key point with supporting detail',
            ], undefined, palette),
        },
        {
            name: 'Comparison',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Before & After',
                ['Complex processes', 'Manual workflows', 'Scattered information'],
                ['Streamlined operations', 'Automated systems', 'Centralized platform'],
                palette),
        },
        {
            name: 'Details',
            backgroundColor: palette.background,
            elements: createContentSlideElements('The Details', undefined,
                'Sometimes the best approach is simplicity itself. By focusing on what matters most and removing unnecessary complexity, we can achieve better outcomes with less effort. This principle applies across domains — from product design to organizational strategy.',
                palette),
        },
        {
            name: 'Quote',
            backgroundColor: palette.background,
            elements: createQuoteElements(
                'Simplicity is the ultimate sophistication.',
                'Leonardo da Vinci',
                palette),
        },
        {
            name: 'End',
            backgroundColor: palette.background,
            elements: createClosingElements('Thank You', 'Questions & Discussion', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
