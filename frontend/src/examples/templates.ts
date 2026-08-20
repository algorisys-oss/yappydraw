/**
 * The example drawings, as data.
 *
 * Lifted out of `examples-page.tsx` so the prerenderer can list them on the
 * static `/examples/` page without importing a Solid component (and its CSS).
 * One list, two renderers — the page a crawler sees and the page the app draws
 * cannot disagree about what exists.
 */

export interface ExampleTemplate {
    id: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    fileName: string;
    thumbnail?: string;
}

/** Registry of example templates, in display order. */
export const exampleTemplates: ExampleTemplate[] = [
    // Featured - New v1.6 Features
    {
        id: '3d-shapes-showcase',
        name: '3D Shapes & Open Box',
        icon: '📦',
        category: 'Featured',
        description: 'Interactive 3D shapes with click-to-reveal, gradients, and multiple lid styles',
        fileName: '3d-shapes-showcase.json'
    },
    {
        id: 'animation-showcase',
        name: 'Animation Showcase',
        icon: '✨',
        category: 'Featured',
        description: 'Stagger animations, fade effects, bounce, and gradient presets',
        fileName: 'animation-showcase.json'
    },
    {
        id: 'mind-map-demo',
        name: 'Mind Map',
        icon: '🧠',
        category: 'Featured',
        description: 'Hierarchical mind maps with Tab/Enter/Space shortcuts',
        fileName: 'mind-map-demo.json'
    },
    // Diagrams
    {
        id: 'flow-chart',
        name: 'Flow Chart',
        icon: '📋',
        category: 'Diagrams',
        description: 'Classic process flow with decision points and connectors',
        fileName: 'flow-chart.json'
    },
    {
        id: 'sequence-diagram',
        name: 'Sequence Diagram',
        icon: '🔄',
        category: 'Diagrams',
        description: 'UML sequence diagram showing message flows between actors',
        fileName: 'sequence-diagram.json'
    },
    {
        id: 'activity-diagram',
        name: 'Activity Diagram',
        icon: '⚡',
        category: 'Diagrams',
        description: 'UML activity diagram with swim lanes and parallel flows',
        fileName: 'activity-diagram.json'
    },
    // Architecture
    {
        id: 'cloud-architecture',
        name: 'Cloud Architecture',
        icon: '☁️',
        category: 'Architecture',
        description: 'Cloud infrastructure diagram with services and connections',
        fileName: 'cloud-architecture-demo.json'
    },
    {
        id: 'six-thinking-hats',
        name: 'Six Thinking Hats',
        icon: '🎩',
        category: 'Architecture',
        description: 'Decision-making framework visualization',
        fileName: 'six-thinking-hats.json'
    },
];

/** Categories, in the order they first appear. */
export const exampleCategories = [...new Set(exampleTemplates.map((t) => t.category))];
