/**
 * Help Documentation Page
 * Displays documentation for all shapes with interactive navigation.
 */

import { type Component, createSignal, createEffect, For, Show, lazy, Suspense, ErrorBoundary } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { recoverFromStaleBuild, isStaleBuildError, forceReloadLatest } from '../utils/stale-build';
import { parsePath, pathFor } from '../routes';
import { currentPath, navigate } from '../navigation';
import { meta as basicShapesMeta } from './shapes/basic-shapes.md?meta';
import { meta as geometricShapesMeta } from './shapes/geometric-shapes.md?meta';
import { meta as drawingToolsMeta } from './shapes/drawing-tools.md?meta';
import { meta as connectorsMeta } from './shapes/connectors.md?meta';
import { meta as vectorPathsMeta } from './shapes/vector-paths.md?meta';
import { meta as flowchartMeta } from './shapes/flowchart.md?meta';
import { meta as umlMeta } from './shapes/uml.md?meta';
import { meta as bpmnMeta } from './shapes/bpmn.md?meta';
import { meta as infrastructureMeta } from './shapes/infrastructure.md?meta';
import { meta as logoToolkitMeta } from './features/logo-toolkit.md?meta';
import { meta as illustratorToolsMeta } from './features/illustrator-tools.md?meta';
import { meta as effectsMeta } from './features/effects.md?meta';
import { meta as masksAppearanceTraceMeta } from './features/masks-appearance-trace.md?meta';
import { meta as symbolsMeta } from './features/symbols.md?meta';
import { meta as elementsSearchMeta } from './features/elements-search.md?meta';
import { meta as stickLibraryMeta } from './features/stick-library.md?meta';
import { meta as stickAnimationMeta } from './features/stick-animation.md?meta';
import { meta as artboardsMeta } from './features/artboards.md?meta';
import { meta as designStudioMeta } from './features/design-studio.md?meta';
import { meta as workspaceMeta } from './features/workspace.md?meta';
import { meta as wireframingMeta } from './shapes/wireframing.md?meta';
import { meta as sketchnoteMeta } from './shapes/sketchnote.md?meta';
import { meta as mindmapMeta } from './shapes/mindmap.md?meta';
import { meta as tableMeta } from './shapes/table.md?meta';
import { meta as animationMeta } from './features/animation.md?meta';
import { meta as plottingMeta } from './features/plotting.md?meta';
import { meta as animateMeta } from './features/animate.md?meta';
import { meta as arcadeMeta } from './features/arcade.md?meta';
import { meta as embeddingMeta } from './features/embedding.md?meta';
import { meta as yslTutorialMeta } from './features/ysl-tutorial.md?meta';
import { meta as bulkEditingMeta } from './features/bulk-editing.md?meta';
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
/**
 * A help document authored in Markdown (plan §6/D3).
 *
 * `vite-plugin-help-md` renders the file to HTML at BUILD time, so what arrives
 * here is a finished string — no Markdown parser ships to the browser, and the
 * same module can be imported by the Phase 2 prerenderer to emit an indexable
 * static page from the identical source.
 *
 * The `.doc-container` element is supplied here rather than by the renderer, so
 * the DOM matches what the JSX documents produced exactly, with no extra
 * wrapper div for the stylesheet to fall through.
 */
const markdownDoc = (load: () => Promise<{ html: string }>): Component =>
    lazy(async () => {
        const { html } = await load();
        return { default: () => <div class="doc-container" innerHTML={html} /> };
    });

const BasicShapesDoc = markdownDoc(() => import('./shapes/basic-shapes.md'));
const GeometricShapesDoc = markdownDoc(() => import('./shapes/geometric-shapes.md'));
const DrawingToolsDoc = markdownDoc(() => import('./shapes/drawing-tools.md'));
const ConnectorsDoc = markdownDoc(() => import('./shapes/connectors.md'));
const VectorPathsDoc = markdownDoc(() => import('./shapes/vector-paths.md'));
const FlowchartDoc = markdownDoc(() => import('./shapes/flowchart.md'));
const UmlDoc = markdownDoc(() => import('./shapes/uml.md'));
const BpmnDoc = markdownDoc(() => import('./shapes/bpmn.md'));
const InfrastructureDoc = markdownDoc(() => import('./shapes/infrastructure.md'));
const LogoToolkitDoc = markdownDoc(() => import('./features/logo-toolkit.md'));
const IllustratorToolsDoc = markdownDoc(() => import('./features/illustrator-tools.md'));
const EffectsDoc = markdownDoc(() => import('./features/effects.md'));
const MasksAppearanceTraceDoc = markdownDoc(() => import('./features/masks-appearance-trace.md'));
const SymbolsDoc = markdownDoc(() => import('./features/symbols.md'));
const ElementsSearchDoc = markdownDoc(() => import('./features/elements-search.md'));
const StickLibraryDoc = markdownDoc(() => import('./features/stick-library.md'));
const StickAnimationDoc = markdownDoc(() => import('./features/stick-animation.md'));
const ArtboardsDoc = markdownDoc(() => import('./features/artboards.md'));
const DesignStudioDoc = markdownDoc(() => import('./features/design-studio.md'));
const WorkspaceDoc = markdownDoc(() => import('./features/workspace.md'));
const WireframingDoc = markdownDoc(() => import('./shapes/wireframing.md'));
const SketchnoteDoc = markdownDoc(() => import('./shapes/sketchnote.md'));
const MindmapDoc = markdownDoc(() => import('./shapes/mindmap.md'));
const TableDoc = markdownDoc(() => import('./shapes/table.md'));
const AnimationDoc = markdownDoc(() => import('./features/animation.md'));
const PlottingDoc = markdownDoc(() => import('./features/plotting.md'));
const AnimateDoc = markdownDoc(() => import('./features/animate.md'));
const ArcadeDoc = markdownDoc(() => import('./features/arcade.md'));
const EmbeddingDoc = markdownDoc(() => import('./features/embedding.md'));
const YslTutorialDoc = markdownDoc(() => import('./features/ysl-tutorial.md'));
const BulkEditingDoc = markdownDoc(() => import('./features/bulk-editing.md'));

// Registry of all shape documentation - organized by category in logical sequence
const shapeDocuments: ShapeDoc[] = [
    // Every document is Markdown (plan §6/D3). Metadata comes from each
    // file's front matter via '?meta', so the sidebar entry and the document
    // itself cannot disagree, and the body stays behind lazy().
    { ...basicShapesMeta, content: BasicShapesDoc },
    { ...geometricShapesMeta, content: GeometricShapesDoc },
    { ...drawingToolsMeta, content: DrawingToolsDoc },
    { ...connectorsMeta, content: ConnectorsDoc },
    { ...vectorPathsMeta, content: VectorPathsDoc },
    { ...flowchartMeta, content: FlowchartDoc },
    { ...umlMeta, content: UmlDoc },
    { ...bpmnMeta, content: BpmnDoc },
    { ...infrastructureMeta, content: InfrastructureDoc },
    { ...logoToolkitMeta, content: LogoToolkitDoc },
    { ...illustratorToolsMeta, content: IllustratorToolsDoc },
    { ...effectsMeta, content: EffectsDoc },
    { ...masksAppearanceTraceMeta, content: MasksAppearanceTraceDoc },
    { ...symbolsMeta, content: SymbolsDoc },
    { ...elementsSearchMeta, content: ElementsSearchDoc },
    { ...stickLibraryMeta, content: StickLibraryDoc },
    { ...stickAnimationMeta, content: StickAnimationDoc },
    { ...artboardsMeta, content: ArtboardsDoc },
    { ...designStudioMeta, content: DesignStudioDoc },
    { ...workspaceMeta, content: WorkspaceDoc },
    { ...wireframingMeta, content: WireframingDoc },
    { ...sketchnoteMeta, content: SketchnoteDoc },
    { ...mindmapMeta, content: MindmapDoc },
    { ...tableMeta, content: TableDoc },
    { ...animationMeta, content: AnimationDoc },
    { ...plottingMeta, content: PlottingDoc },
    { ...animateMeta, content: AnimateDoc },
    { ...arcadeMeta, content: ArcadeDoc },
    { ...embeddingMeta, content: EmbeddingDoc },
    { ...yslTutorialMeta, content: YslTutorialDoc },
    { ...bulkEditingMeta, content: BulkEditingDoc },
];

// Group shapes by category
const categories = [...new Set(shapeDocuments.map(s => s.category))];

/**
 * Failure UI for a single doc page.
 *
 * Every doc is a `lazy()` chunk, and those chunks are deliberately kept OUT of the
 * service-worker precache (vite.config.ts drops anything matching `-doc-`), so they
 * are fetched on first open. If the build on the server has moved on since this tab
 * loaded, that fetch 404s and the import rejects.
 *
 * Two things used to go wrong then, both reported as "it errors and the reload does
 * nothing, I have to go right back out and reopen it":
 *
 *  1. The error escaped to the route-level boundary, so the whole Help page — nav and
 *     all — was replaced by "Something went wrong". Now it is caught here and only the
 *     content pane is affected; the sidebar keeps working.
 *  2. The reload was a plain `location.reload()`, which keeps the page's service
 *     worker. Ours uses the `prompt` strategy, so a waiting new build only activates
 *     once every client is closed — a reload is not a close. The old worker served the
 *     old build again and nothing changed, which is exactly why leaving the page
 *     entirely and coming back was the only thing that worked. `forceReloadLatest`
 *     unregisters the worker and clears its caches first, so the button does what it
 *     says.
 */
const DocError: Component<{ err: any; reset: () => void; name: string }> = (props) => {
    // A stale chunk heals itself (guarded against loops); this screen is for when the
    // guard has already spent its one automatic recovery, or the error is a real one.
    if (recoverFromStaleBuild(props.err)) {
        return <div class="doc-loading">Updating to the latest version…</div>;
    }
    const stale = isStaleBuildError(props.err);
    if (!stale) console.error('[yappy] Help doc failed:', props.err);
    return (
        <div class="doc-error">
            <h2>Couldn’t open “{props.name}”</h2>
            <p>
                {stale
                    ? 'This page belongs to a newer version of Yappy than the one your browser is running. Updating loads it.'
                    : 'Something went wrong rendering this page. Your drawings are not affected.'}
            </p>
            <p class="doc-error-actions">
                <button type="button" class="doc-error-primary" onClick={() => forceReloadLatest()}>
                    Update &amp; reload
                </button>
                <button type="button" onClick={() => props.reset()}>Try again</button>
            </p>
            <pre>{String(props.err?.stack ?? props.err?.message ?? props.err)}</pre>
        </div>
    );
};

/**
 * Which document the URL asks for — `/help/animation/` → `animation`.
 *
 * `/help/` with no document opens the first one, which is what the sidebar's
 * own "Help" entry point has always done.
 */
const shapeFromPath = (): string => {
    const route = parsePath(currentPath());
    return route?.key === 'helpDoc' && route.param ? route.param : 'basic-shapes';
};

export const HelpPage: Component = () => {
    const [selectedShape, setSelectedShape] = createSignal<string>(shapeFromPath());

    // Back/forward moves the path, and the path decides the document.
    createEffect(() => {
        const next = shapeFromPath();
        if (shapeDocuments.some(s => s.id === next)) setSelectedShape(next);
    });

    const [searchQuery, setSearchQuery] = createSignal('');

    // Navigate to a shape doc via URL
    const navigateToShape = (shapeId: string) => {
        navigate(pathFor('helpDoc', shapeId));
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
        navigate(pathFor('home'));
    };

    return (
        <div class="help-page">
            {/* Header */}
            <header class="help-header">
                <div class="help-header-left">
                    <button class="back-button" onClick={handleBackToApp}>
                        ← Back to Yappy
                    </button>
                    {/* Not an <h1>: the DOCUMENT supplies the page's one h1.
                        These pages are indexed now, and two h1s is a heading
                        hierarchy a crawler has to guess at. */}
                    <div class="help-title">Yappy Documentation</div>
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
                                            {/* A real <a href> per doc, so every page in this list can be
                                                Ctrl/⌘-clicked, middle-clicked, bookmarked or copied as a
                                                link. It was a bare <li onClick>, which the browser has no
                                                way to open in a second tab. Plain left-clicks still route
                                                in-page; modified clicks fall through to the browser. */}
                                            {(shape) => (
                                                <li>
                                                    <a
                                                        class={`shape-item ${selectedShape() === shape.id ? 'active' : ''}`}
                                                        href={pathFor('helpDoc', shape.id)}
                                                        title={`${shape.name} — Ctrl/⌘-click to open in a new tab`}
                                                        onClick={(e) => {
                                                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                                                            e.preventDefault();
                                                            navigateToShape(shape.id);
                                                        }}
                                                    >
                                                        <span class="shape-icon">{shape.icon}</span>
                                                        <span class="shape-name">{shape.name}</span>
                                                    </a>
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
                    {/* `keyed` rebuilds the subtree — and with it a FRESH ErrorBoundary — every
                        time the selected doc changes. A Solid ErrorBoundary latches its error,
                        so without the key one broken doc would keep showing its error screen
                        for every doc clicked afterwards. */}
                    <Show when={currentDoc()} keyed fallback={<p>Select a shape to view documentation</p>}>
                        {(doc) => (
                            <ErrorBoundary fallback={(err, reset) => <DocError err={err} reset={reset} name={doc.name} />}>
                                <Suspense fallback={<div class="doc-loading">Loading...</div>}>
                                    <Dynamic component={doc.content} />
                                </Suspense>
                            </ErrorBoundary>
                        )}
                    </Show>
                </main>
            </div>
        </div>
    );
};

export default HelpPage;
