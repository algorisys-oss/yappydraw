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
const PlottingDoc = lazy(() => import('./features/plotting-doc'));
const AnimateDoc = lazy(() => import('./features/animate-doc'));
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
const ElementsSearchDoc = lazy(() => import('./features/elements-search-doc'));
const StickLibraryDoc = lazy(() => import('./features/stick-library-doc'));
const StickAnimationDoc = lazy(() => import('./features/stick-animation-doc'));
const WorkspaceDoc = lazy(() => import('./features/workspace-doc'));
const ArcadeDoc = lazy(() => import('./features/arcade-doc'));

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
        id: 'elements-search',
        name: 'Element Search',
        icon: '🔍',
        category: 'Design',
        description: 'Unified Canva-style search across icons, illustrations, shapes and photos — one blended grid, semantic keyword aliases, type chips, Alt+E, and the searchElements / insertElement API',
        keywords: 'element elements search unified panel icon icons lucide illustration illustrations openmoji emoji shape shapes photo photos wikimedia template templates design designs card cards greeting birthday thank you congratulations congrats party invitation invite anniversary baby poster resume social blended grid chip chips all icons illustrations shapes photos templates alias aliases keyword semantic love heart money dollar coin wallet idea lightbulb bulb brain chat speech bubble secure lock shield goal target trophy find insert load apply editable vector recolour recolor cc by-sa attribution openmoji.org orientation landscape portrait square browse frames font pairing Alt+E hotkey shortcut command palette searchElements insertElement applyTemplate toggleElementsPanel api scriptable window Yappy',
        content: ElementsSearchDoc
    },
    {
        id: 'stick-library',
        name: 'Stick-Figure Library',
        icon: '🚶',
        category: 'Design',
        description: 'Drawify-style editable stick figures: the panel, search & categories, drag/click to add, drop-as-editable-group, recolour & ungroup, and the API',
        keywords: 'stick figure people person drawify illustration character pose variant man woman boy girl male female child kid hair skirt wave walk run jump sit dance think point sad office laptop desk present chart briefcase coffee idea lightbulb handshake meeting podium mic speaker raise hand clipboard applaud notes travel bike bicycle bag phone luggage suitcase umbrella celebrate love heart selfie gift toast delivery box support headset doctor guide waiter chef cleaner broom props laptop phone microphone bar chart briefcase package coffee cup speech bubble arrow trophy scenes handshake team family celebration category search drag drop editable group recolour recolor part role outline accent body head prop semantic stroke width 4px ungroup bezier limb symbol add to symbols colour mono monochrome favourites favorites star recent recents keyboard arrow keys vector svg insertStickFigure recolorStickFigure listStickFigures',
        content: StickLibraryDoc
    },
    {
        id: 'stick-animation',
        name: 'Animated Stick Figures',
        icon: '🎞',
        category: 'Design',
        description: 'Skeletal animated stick figures for storytelling: walk/wave/talk/point/jump/idle motions, play/pause, flip, switch clip, bake to editable paths — with a step-by-step tutorial',
        keywords: 'animate animation animated stick figure motion clip walk walking cycle run running wave waving talk talking gesture point pointing clap clapping jump jumping dance dancing cheer cheering idle breathe skeleton rig joints forward kinematics foot planting ik bend knee elbow storytelling story sequence action timeline scene playhead scrub track record video webm export html loop play pause flip facing left right bake freeze frame convert to paths procedural insertAnimatedFigure setAnimatedFigureClip setFigureSequence flipAnimatedFigure bakeAnimatedFigure recordAnimation exportHtml toggleSceneTimeline seekScene tutorial step by step',
        content: StickAnimationDoc
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
        description: 'Canva-style design documents: pages & size presets, templates, Magic Resize, brand kit, unified elements search (icons/shapes/photos), text effects, AI assists, version history, offline PWA',
        keywords: 'canva design document page size preset instagram post story poster flyer business card template search fits badge my templates brand kit font pairing elements panel unified element search blended search icons shapes photos one box type a word alias love heart chat speech box rectangle frames photo frame heart star hexagon stock photos wikimedia orientation landscape portrait square drag drop crop aspect ratio 1:1 4:5 16:9 9:16 lock text effect shadow lift hollow splice outline echo neon glitch background highlight curved set as page background detach image background jpg jpeg png export current page only magic write ai image generate remove background replace background swap backdrop thumbnail indexeddb magic resize repurpose format magic edit inpaint magic expand outpaint extend photo ai design generate brief version history snapshot restore recents grid open drawing bullet numbered list rich text pwa install offline service worker app',
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
        id: 'plotting',
        name: 'Maths & Plotting',
        icon: '📈',
        category: 'Features',
        description: 'LaTeX equations as vectors, plus axes, function graphs, vector fields and polar grids',
        keywords: 'latex tex mathjax equation equations formula math maths mathematics typeset fraction integral matrix matrices sqrt radical subscript superscript greek pi sigma partial derivative symbol per-symbol texpart plot plotting graph function curve axes axis coordinate system number line parametric lissajous cardioid polar grid vector field arrows gradient descent phase portrait sine cosine sin cos tan exponential parabola manim c2p sample samples domain pole asymptote tick label explainer scene script play wait animate expression valuetracker updater',
        content: PlottingDoc
    },
    {
        id: 'animate',
        name: 'Animation Studio',
        icon: '🎬',
        category: 'Features',
        description: 'Animate-class frame timeline: Stage + layers, keyframes/cels (F5/F6/F7), motion tweens with easing, onion skinning, movie-clip symbols with nested timelines, GIF/MP4 export',
        keywords: 'animation animate flash frame frames timeline keyframe keyframes cel cels blank keyframe span insert frame F5 F6 F7 F8 shift tween motion tween easing ease onion skin skinning ghost playhead scrub fps frame rate loop play pause stop stage movie clip movieclip symbol nested timeline instance loop once single frame first frame frame-by-frame stop motion export gif mp4 webm video convert to symbol label frame label tutorial step by step how to bouncing ball rocket launch intro template templates sample samples squash stretch edit animated object change properties resize timeline panel',
        content: AnimateDoc
    },
    {
        id: 'arcade',
        name: 'Arcade (Games)',
        icon: '🎮',
        category: 'Features',
        description: 'Flash-style game mode: a visual no-code Game Builder (WHEN→DO behaviors) OR a JavaScript game script drives the live canvas — Play/Stop, sprites, collisions, touch gamepad, HTML export',
        keywords: 'game games arcade flash actionscript scratch blueprint no-code visual builder behaviors behavior WHEN DO rule trigger action script play stop tick loop sprite spawn hit collision bounce glide velocity gravity physics jump land platform platformer variable lives health score condition only if branch if else broadcast receive message event wiring node graph nodes wires blueprint flow visual node editor pan zoom sound sfx music audio hud pong catch maze gamepad dpad joystick touch controls keyboard onkey pointer tap game.find game.spawn game.onTick goToState playAnim goToPage end game over win export html player interactive kid learn to code',
        content: ArcadeDoc
    },
    {
        id: 'embedding',
        name: 'Embedding',
        icon: '🔗',
        category: 'Features',
        description: 'Embed drawings in Confluence, Notion, wikis — and drive the full editor from a host page via the API / cross-origin postMessage bridge',
        keywords: 'embed iframe embedding read-only viewer interactive control programmatic api window.Yappy cross-origin same-origin postMessage bridge createYappyEmbed yappy-embed-client allowlist VITE_EMBED_ALLOWED_ORIGINS importDSL exportSVG confluence notion wiki sharepoint wordpress integrate another project host page frame-ancestors X-Frame-Options CSP content-security-policy restrict framing clickjacking',
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
