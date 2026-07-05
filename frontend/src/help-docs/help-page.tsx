/**
 * Help Documentation Page
 * Displays documentation for all shapes with interactive navigation.
 */

import { type Component, createSignal, For, Show, onMount, onCleanup, lazy, Suspense } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import './help-page.css';

// Shape documentation data
interface ShapeDoc {
    id: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    content: Component;
    keywords?: string; // extra search terms (e.g. tool names inside a doc page)
}

// Lazy load documentation components for better performance
const BasicShapesDoc = lazy(() => import('./shapes/basic-shapes-doc'));
const GeometricShapesDoc = lazy(() => import('./shapes/geometric-shapes-doc'));
const DrawingToolsDoc = lazy(() => import('./shapes/drawing-tools-doc'));
const ConnectorsDoc = lazy(() => import('./shapes/connectors-doc'));
const VectorPathsDoc = lazy(() => import('./shapes/vector-paths-doc'));
const FlowchartDoc = lazy(() => import('./shapes/flowchart-doc'));
const UmlDoc = lazy(() => import('./shapes/uml-doc'));
const InfrastructureDoc = lazy(() => import('./shapes/infrastructure-doc'));
const WireframingDoc = lazy(() => import('./shapes/wireframing-doc'));
const SketchnoteDoc = lazy(() => import('./shapes/sketchnote-doc'));
const MindmapDoc = lazy(() => import('./shapes/mindmap-doc'));
const TableDoc = lazy(() => import('./shapes/table-doc'));
const AnimationDoc = lazy(() => import('./features/animation-doc'));
const EmbeddingDoc = lazy(() => import('./features/embedding-doc'));
const YslTutorialDoc = lazy(() => import('./features/ysl-tutorial-doc'));
const BulkEditingDoc = lazy(() => import('./features/bulk-editing-doc'));
const LogoToolkitDoc = lazy(() => import('./features/logo-toolkit-doc'));
const IllustratorToolsDoc = lazy(() => import('./features/illustrator-tools-doc'));
const EffectsDoc = lazy(() => import('./features/effects-doc'));
const MasksAppearanceTraceDoc = lazy(() => import('./features/masks-appearance-trace-doc'));
const SymbolsDoc = lazy(() => import('./features/symbols-doc'));
const ArtboardsDoc = lazy(() => import('./features/artboards-doc'));
const DesignStudioDoc = lazy(() => import('./features/design-studio-doc'));
const WorkspaceDoc = lazy(() => import('./features/workspace-doc'));

// Registry of all shape documentation - organized by category in logical sequence
const shapeDocuments: ShapeDoc[] = [
    // Basic Shapes
    {
        id: 'basic-shapes',
        name: 'Basic Shapes',
        icon: '⬜',
        category: 'Shapes',
        description: 'Rectangle, circle, diamond, triangle - the fundamental building blocks',
        content: BasicShapesDoc
    },
    {
        id: 'geometric-shapes',
        name: 'Geometric Shapes',
        icon: '⬡',
        category: 'Shapes',
        description: 'Hexagon, star, polygon, and other geometric shapes',
        content: GeometricShapesDoc
    },
    // Drawing
    {
        id: 'drawing-tools',
        name: 'Drawing Tools',
        icon: '✏️',
        category: 'Drawing',
        description: 'Pencil, fineliner, marker, and ink brush for freehand drawing',
        content: DrawingToolsDoc
    },
    {
        id: 'connectors',
        name: 'Connectors',
        icon: '↗️',
        category: 'Drawing',
        description: 'Lines, arrows, bezier curves, and smart connectors',
        content: ConnectorsDoc
    },
    {
        id: 'vector-paths',
        name: 'Vector Paths',
        icon: '✒️',
        category: 'Drawing',
        description: 'Pen tool, node editing, Convert to Path, Pathfinder booleans, Outline Stroke, Offset Path, and holes',
        content: VectorPathsDoc
    },
    // Diagrams
    {
        id: 'flowchart',
        name: 'Flowchart',
        icon: '📋',
        category: 'Diagrams',
        description: 'Standard flowchart symbols for process flows',
        content: FlowchartDoc
    },
    {
        id: 'uml',
        name: 'UML',
        icon: '📐',
        category: 'Diagrams',
        description: 'UML shapes for class, sequence, and state diagrams',
        content: UmlDoc
    },
    {
        id: 'infrastructure',
        name: 'Infrastructure',
        icon: '☁️',
        category: 'Diagrams',
        description: 'Cloud architecture and network diagram shapes',
        content: InfrastructureDoc
    },
    // Design
    {
        id: 'logo-toolkit',
        name: 'Logo & Design Toolkit',
        icon: '✦',
        category: 'Design',
        description: 'Repeat & symmetry (radial / grid / mirror / transform-again) and Text → Outlines for logo construction',
        content: LogoToolkitDoc
    },
    {
        id: 'illustrator-tools',
        name: 'Illustrator-class Tools',
        icon: '🪄',
        category: 'Design',
        description: 'Magic Wand, Distort & Transform (Liquify), Knife & Scissors, generative shapes (spiral/arc/grids), Vertical Type, and the Symbol Sprayer — with API examples',
        keywords: 'lens flare spiral arc rectangular grid polar grid magic wand select similar distort transform pucker bloat twirl zigzag crystallize roughen liquify knife scissors curvature reshape blob brush path eraser puppet warp perspective grid touch type vertical type slice graph chart symbolism sprayer width tool live paint shape builder pathfinder offset stroke outline type on path vector tools palette google fonts font picker add font custom font ttf otf woff letter spacing preview applied',
        content: IllustratorToolsDoc
    },
    {
        id: 'effects',
        name: 'Effects & Colour Tools',
        icon: '✨',
        category: 'Design',
        description: 'Convert to Shape, Split Into Grid, Convert to Guides, Feather, Outer Glow, Scribble, Smooth, crop marks & bleed, plus the Colour Guide (tints / harmonies / palette-from-image), swatch groups and the swatch info sheet — with API examples',
        keywords: 'effects convert to shape split into grid convert to guides feather outer glow inner glow scribble smooth path crop marks bleed registration colour guide color guide tints shades harmony complementary analogous triadic split complementary tetradic monochromatic palette from image colour theme picker recolor shuffle swatch groups swatch info sheet print',
        content: EffectsDoc
    },
    {
        id: 'masks-appearance-trace',
        name: 'Masks, Appearance & Trace',
        icon: '✂',
        category: 'Design',
        description: 'Clipping/opacity masks, appearance stack, gradient mesh, graphic styles, eyedropper, and image trace',
        content: MasksAppearanceTraceDoc
    },
    {
        id: 'symbols',
        name: 'Symbols & Instances',
        icon: '◈',
        category: 'Design',
        description: 'Reusable masters + linked instances: the Symbols panel, edit-in-place, redefine and detach',
        content: SymbolsDoc
    },
    {
        id: 'artboards',
        name: 'Artboards',
        icon: '▭',
        category: 'Design',
        description: 'Named export-region frames: presets, on-canvas move/resize/delete, and per-region PNG export',
        content: ArtboardsDoc
    },
    {
        id: 'design-studio',
        name: 'Design Studio',
        icon: '🎨',
        category: 'Design',
        description: 'Canva-style design documents: pages & size presets, templates, brand kit, elements library, SVG import, text effects, AI assists',
        keywords: 'canva design document page size preset instagram post story poster flyer business card template search fits badge my templates brand kit font pairing elements panel frames photo frame heart star hexagon stock photos wikimedia orientation landscape portrait square drag drop crop aspect ratio 1:1 4:5 16:9 9:16 lock text effect shadow lift hollow splice outline echo neon glitch background highlight curved set as page background detach image background jpg jpeg png export current page only magic write ai image generate remove background thumbnail indexeddb',
        content: DesignStudioDoc
    },
    {
        id: 'workspace',
        name: 'Workspace & Productivity',
        icon: '🛠',
        category: 'Features',
        description: 'Smart toolbar, align & distribute, blend, measure tool, history panel, and vector SVG export',
        content: WorkspaceDoc
    },
    {
        id: 'wireframing',
        name: 'Wireframing',
        icon: '📱',
        category: 'Design',
        description: 'UI mockup elements for web and mobile design',
        content: WireframingDoc
    },
    {
        id: 'sketchnote',
        name: 'Sketchnote',
        icon: '🎨',
        category: 'Design',
        description: 'Visual vocabulary for sketchnoting and visual thinking',
        content: SketchnoteDoc
    },
    // Data & Structure
    {
        id: 'mindmap',
        name: 'Mind Maps',
        icon: '🧠',
        category: 'Structure',
        description: 'Create hierarchical mind maps for brainstorming',
        content: MindmapDoc
    },
    {
        id: 'table',
        name: 'Tables',
        icon: '📊',
        category: 'Structure',
        description: 'Create and edit tables with rows, columns, and data',
        content: TableDoc
    },
    // Features
    {
        id: 'animation',
        name: 'Animation',
        icon: '🎬',
        category: 'Features',
        description: 'Animate elements with presets, keyframes, and spring physics',
        content: AnimationDoc
    },
    {
        id: 'embedding',
        name: 'Embedding',
        icon: '🔗',
        category: 'Features',
        description: 'Embed drawings in Confluence, Notion, wikis, and other platforms',
        content: EmbeddingDoc
    },
    {
        id: 'ysl-tutorial',
        name: 'YSL Tutorial',
        icon: '{}',
        category: 'Features',
        description: 'Create diagrams from text using the Yappy Scripting Language',
        content: YslTutorialDoc
    },
    {
        id: 'bulk-editing',
        name: 'Bulk Editing',
        icon: '✏️',
        category: 'Features',
        description: 'Select and edit multiple shapes at once with common property editing',
        content: BulkEditingDoc
    },
];

// Group shapes by category
const categories = [...new Set(shapeDocuments.map(s => s.category))];

// Parse shape ID from URL hash (e.g., #/help/animation -> animation)
const getShapeFromHash = (): string => {
    const hash = window.location.hash;
    const match = hash.match(/#\/?help\/([^/]+)/);
    return match ? match[1] : 'basic-shapes';
};

export const HelpPage: Component = () => {
    const [selectedShape, setSelectedShape] = createSignal<string>(getShapeFromHash());
    const [searchQuery, setSearchQuery] = createSignal('');

    // Listen for hash changes (browser back/forward)
    onMount(() => {
        const handleHashChange = () => {
            const newShape = getShapeFromHash();
            if (shapeDocuments.some(s => s.id === newShape)) {
                setSelectedShape(newShape);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        onCleanup(() => window.removeEventListener('hashchange', handleHashChange));
    });

    // Navigate to a shape doc via URL
    const navigateToShape = (shapeId: string) => {
        window.location.hash = `#/help/${shapeId}`;
        setSelectedShape(shapeId);
    };

    const filteredShapes = () => {
        const query = searchQuery().toLowerCase();
        if (!query) return shapeDocuments;
        return shapeDocuments.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            s.category.toLowerCase().includes(query) ||
            (s.keywords?.toLowerCase().includes(query) ?? false)
        );
    };

    const currentDoc = () => shapeDocuments.find(s => s.id === selectedShape());

    const handleBackToApp = () => {
        // Just clear the hash - the router will handle showing the app
        window.location.hash = '';
    };

    return (
        <div class="help-page">
            {/* Header */}
            <header class="help-header">
                <div class="help-header-left">
                    <button class="back-button" onClick={handleBackToApp}>
                        ← Back to Yappy
                    </button>
                    <h1 class="help-title">Yappy Documentation</h1>
                </div>
                <div class="help-header-right">
                    <input
                        type="text"
                        class="search-input"
                        placeholder="Search tools & shapes..."
                        value={searchQuery()}
                        onInput={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                </div>
            </header>

            <div class="help-content">
                {/* Sidebar */}
                <aside class="help-sidebar">
                    <nav class="shape-nav">
                        <For each={categories}>
                            {(category) => (
                                <div class="nav-category">
                                    <h3 class="category-title">{category}</h3>
                                    <ul class="shape-list">
                                        <For each={filteredShapes().filter(s => s.category === category)}>
                                            {(shape) => (
                                                <li
                                                    class={`shape-item ${selectedShape() === shape.id ? 'active' : ''}`}
                                                    onClick={() => navigateToShape(shape.id)}
                                                >
                                                    <span class="shape-icon">{shape.icon}</span>
                                                    <span class="shape-name">{shape.name}</span>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </div>
                            )}
                        </For>
                    </nav>
                </aside>

                {/* Main content */}
                <main class="help-main">
                    <Show when={currentDoc()} fallback={<p>Select a shape to view documentation</p>}>
                        <Suspense fallback={<div class="doc-loading">Loading...</div>}>
                            <Dynamic component={currentDoc()!.content} />
                        </Suspense>
                    </Show>
                </main>
            </div>
        </div>
    );
};

export default HelpPage;
