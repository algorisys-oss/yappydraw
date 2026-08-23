import { Show, For, onCleanup, createEffect, createSignal, createMemo } from "solid-js";
import { X, Search, ExternalLink, Github, Youtube, Bug, LayoutTemplate, Compass } from "lucide-solid";
import "./help-dialog.css";
import { startTour } from "./onboarding-tour";
import { t, type HotkeyKey, type HotkeyCategoryKey } from "../i18n";
import { pathFor } from "../routes";
import { navigate } from "../navigation";

interface ShortcutEntry {
    /** Dictionary key under `hotkeys.` — the description is translated, the combo is not. */
    key: HotkeyKey;
    keys: string; // e.g. "Ctrl+Z", "V or 1", "Shift+Drag"
}

interface ShortcutCategory {
    titleKey: HotkeyCategoryKey;
    shortcuts: ShortcutEntry[];
}

/** A category with its text resolved for the active locale. */
interface LocalizedCategory {
    title: string;
    shortcuts: { label: string; keys: string }[];
}

// NOTE: when adding a touch/pen affordance, also document it in the
// "Touch & Pen Gestures" category below so the help dialog stays in sync.
const SHORTCUT_DATA: ShortcutCategory[] = [
    {
        titleKey: 'file',
        shortcuts: [
            { key: 'file-saveToMyDrawings', keys: 'Ctrl+S' },
            { key: 'file-openDrawing', keys: 'Ctrl+Alt+O' },
            { key: 'file-saveDrawing', keys: 'Ctrl+Alt+S' },
            { key: 'file-exportShare', keys: 'Ctrl+Shift+E' },
            { key: 'file-recordTimeLapse', keys: 'Ctrl+Shift+T' },
            { key: 'file-commandPalette', keys: 'Ctrl+K' },
            { key: 'file-quickToolFinder', keys: '/' },
            { key: 'file-newSketch', keys: 'Alt+N' },
        ]
    },
    {
        titleKey: 'tools',
        shortcuts: [
            { key: 'tools-selection', keys: 'V or 1' },
            { key: 'tools-rectangle', keys: 'R or 2' },
            { key: 'tools-diamond', keys: 'D or 3' },
            { key: 'tools-ellipse', keys: 'O or 4' },
            { key: 'tools-arrow', keys: 'A or 5' },
            { key: 'tools-line', keys: 'L or 6' },
            { key: 'tools-pen', keys: 'P or 7' },
            { key: 'tools-text', keys: 'T or 8' },
            { key: 'tools-insertImage', keys: 'I or 9' },
            { key: 'tools-insertVideo', keys: 'Toolbar button' },
            { key: 'tools-eraser', keys: 'E or 0' },
            { key: 'tools-bezierCurve', keys: 'B' },
            { key: 'tools-panMode', keys: 'H' },
            { key: 'tools-laserPointer', keys: 'Shift+P' },
            { key: 'tools-inkOverlay', keys: 'Alt+I' },
            { key: 'tools-lockTool', keys: 'Double-click' },
        ]
    },
    {
        titleKey: 'editor',
        shortcuts: [
            { key: 'editor-undo', keys: 'Ctrl+Z' },
            { key: 'editor-redo', keys: 'Ctrl+Y' },
            { key: 'editor-nodeToolDirectSelection', keys: 'N' },
            { key: 'editor-nodeToolOpenItOnAPath', keys: 'Double-click a path' },
            { key: 'editor-nodeToolConvertANodeCornerSmooth', keys: 'Alt+Click a node' },
            { key: 'editor-nodeToolDeleteOneNode', keys: 'Ctrl+Click a node' },
            { key: 'editor-nodeToolSelectAllNodes', keys: 'Ctrl+A' },
            { key: 'editor-nodeToolDeleteSelectedNodes', keys: 'Del' },
            { key: 'editor-nodeToolAddANodeOnA', keys: 'Alt+Click' },
            { key: 'editor-nodeToolEditADifferentShape', keys: 'Click the shape' },
            { key: 'editor-nodeToolEditSeveralShapesAtOnce', keys: 'Shift+Click a shape' },
            { key: 'editor-nodeToolDropTheNodesThenThe', keys: 'Click empty space (twice)' },
            { key: 'editor-nodeToolPickShapesWhenNoneIs', keys: 'Drag on empty space' },
            { key: 'editor-nodeToolLeaveTheTool', keys: 'Esc or N' },
            { key: 'editor-drawASquarePerfectCircle', keys: 'Shift+Drag' },
            { key: 'editor-snapALineArrowTo15', keys: 'Shift+Drag' },
            { key: 'editor-editTextInShape', keys: 'Double-click' },
            { key: 'editor-commitTextKeepShapeSelected', keys: 'Ctrl+Enter' },
            { key: 'editor-commitTextExitEdit', keys: 'Esc' },
            { key: 'editor-delete', keys: 'Del' },
            { key: 'editor-duplicate', keys: 'Ctrl+D' },
            { key: 'editor-transformAgain', keys: 'Ctrl+Shift+D' },
            { key: 'editor-constrainMoveToAnAxis', keys: 'Shift+Drag element' },
            { key: 'editor-constrainAngleTo15', keys: 'Shift+Drag' },
            { key: 'editor-resizeProportionally', keys: 'Shift+Drag handle' },
            { key: 'editor-resizeProportionallyFromTheCentre', keys: 'Alt+Shift+Drag handle' },
            { key: 'editor-measureToNeighbour', keys: 'Alt+Hover' },
            { key: 'editor-selectAll', keys: 'Ctrl+A' },
            { key: 'editor-copyPaste', keys: 'Ctrl+C / Ctrl+V' },
            { key: 'editor-cut', keys: 'Ctrl+X' },
            { key: 'editor-bringForward', keys: 'Ctrl+]' },
            { key: 'editor-sendBackward', keys: 'Ctrl+[' },
            { key: 'editor-bringToFront', keys: 'Ctrl+Shift+]' },
            { key: 'editor-sendToBack', keys: 'Ctrl+Shift+[' },
            { key: 'editor-rasterizeSelection', keys: 'Right-click → Rasterize' },
            { key: 'editor-objectTree', keys: 'Layers panel → box icon on a layer' },
            { key: 'editor-hideLockRenameOneObject', keys: 'Object tree → eye / padlock / double-click' },
            { key: 'editor-groupUngroup', keys: 'Ctrl+G / Ctrl+Shift+G' },
            { key: 'editor-enterGroup', keys: 'Double-click a grouped object' },
            { key: 'editor-leaveGroup', keys: 'Esc' },
            { key: 'editor-copyPasteStyle', keys: 'Ctrl+Alt+C / V' },
            { key: 'editor-paletteSetStrokeColor', keys: 'Click swatch' },
            { key: 'editor-paletteSetFillColor', keys: 'Shift+Click swatch' },
            { key: 'editor-paletteClose', keys: 'Esc' },
            { key: 'editor-selectByType', keys: 'Right-click → Select by Type' },
            { key: 'editor-selectBySameProperty', keys: 'Right-click → Select by Same Property' },
            { key: 'editor-flipHorizontal', keys: 'Shift+H' },
            { key: 'editor-flipVertical', keys: 'Shift+V' },
            { key: 'editor-mirrorCopyRepeat', keys: 'Right-click → Repeat & Mirror' },
            { key: 'editor-createOutlines', keys: 'Ctrl+Shift+O' },
            { key: 'editor-simplifyPath', keys: 'Ctrl+L' },
            { key: 'editor-smoothPath', keys: 'Right-click → Path → Smooth' },
            { key: 'editor-lockUnlockSelected', keys: 'Ctrl+Shift+L' },
            { key: 'editor-unlockAllObjects', keys: 'Ctrl+Alt+2' },
            { key: 'editor-unlockAspectRatio', keys: 'Shift+Drag' },
            { key: 'editor-penVectorPathAddPointDragTo', keys: 'P or Toolbar (pen-nib)' },
            { key: 'editor-penStraightSegmentConstrainTo15Steps', keys: 'Shift+Click' },
            { key: 'editor-penConstrainHandles9045', keys: 'Shift+Drag handle' },
            { key: 'editor-penNodeBreakTheHandlePair', keys: 'Alt+Drag handle' },
            { key: 'editor-pathNodeConvertCornerSmooth', keys: 'Alt+Click anchor' },
            { key: 'editor-pathInsertAPointOnASegment', keys: 'Alt+Click segment' },
            { key: 'editor-pathNodeDelete', keys: 'Ctrl+Click anchor' },
            { key: 'editor-penFinishOpenPath', keys: 'Ctrl+Click canvas' },
            { key: 'editor-penUndoLastAnchor', keys: 'Backspace or Ctrl+Z' },
            { key: 'editor-mindmapTool', keys: 'M' },
            { key: 'editor-addChildNode', keys: 'Tab' },
            { key: 'editor-addSiblingNode', keys: 'Enter' },
            { key: 'editor-editNodeText', keys: 'F2' },
            { key: 'editor-toggleCollapseHoldToPan', keys: 'Space' },
            { key: 'editor-navigateMindmap', keys: 'Arrow Keys' },
            { key: 'editor-nudgeElement', keys: 'Arrow' },
            { key: 'editor-nudgeCoarseFine', keys: 'Shift+Arrow / Ctrl+Arrow' },
            { key: 'editor-starPolygonPointCount', keys: 'Up/Down (when selected)' },
            { key: 'editor-swapFillStroke', keys: 'Shift+X' },
            { key: 'editor-combineUniteSelectedShapes', keys: 'Ctrl+Alt+U' },
            { key: 'editor-combineSubtract', keys: 'Ctrl+Alt+D' },
            { key: 'editor-combineIntersect', keys: 'Ctrl+Alt+I' },
            { key: 'editor-combineExclude', keys: 'Ctrl+Alt+X' },
            { key: 'editor-shapeBuilder', keys: 'Shift+M' },
            { key: 'editor-eyedropperCopyAStyleOntoTheSelection', keys: 'Shift+I' },
            { key: 'editor-mathInNumberFields', keys: 'type + Enter' },
            { key: 'editor-focusBranch', keys: 'Shift+F' },
        ]
    },
    {
        titleKey: 'viewZoom',
        shortcuts: [
            { key: 'viewZoom-zoomIn', keys: 'Ctrl+=' },
            { key: 'viewZoom-zoomOut', keys: 'Ctrl+-' },
            { key: 'viewZoom-resetZoom', keys: 'Ctrl+0' },
            { key: 'viewZoom-zoomToFit', keys: 'Ctrl+1' },
            { key: 'viewZoom-zoomToSelection', keys: 'Ctrl+2' },
            { key: 'viewZoom-rotateCanvasLeftRight', keys: 'Shift+, / Shift+.' },
            { key: 'viewZoom-resetCanvasRotation', keys: 'Shift+0' },
            { key: 'viewZoom-toggleProperties', keys: 'Alt+Enter' },
            { key: 'viewZoom-toggleElements', keys: 'Alt+E' },
            { key: 'viewZoom-toggleLayers', keys: 'Alt+L' },
            { key: 'viewZoom-toggleSymbolsPanel', keys: 'Alt+B' },
            { key: 'viewZoom-toggleHistoryPanel', keys: 'Alt+H' },
            { key: 'viewZoom-toggleGraphicStyles', keys: 'Alt+G' },
            { key: 'viewZoom-toggleSwatches', keys: 'Alt+W' },
            { key: 'viewZoom-togglePatterns', keys: 'Alt+P' },
            { key: 'viewZoom-toggleMinimap', keys: 'Alt+M' },
            { key: 'viewZoom-toggleRulersGuides', keys: 'Alt+R' },
            { key: 'viewZoom-selectAGuideAddToSelection', keys: 'Shift+Click' },
            { key: 'viewZoom-selectAllGuides', keys: 'Ctrl+Shift+A' },
            { key: 'viewZoom-deleteSelectedGuides', keys: 'Delete' },
            { key: 'viewZoom-nudgeSelectedGuides', keys: 'Arrow Keys' },
            { key: 'viewZoom-clearGuideSelection', keys: 'Escape' },
            { key: 'viewZoom-toggleKeyframesTimeline', keys: 'Alt+K' },
            { key: 'viewZoom-toggleSymmetry', keys: 'Alt+Y' },
            { key: 'viewZoom-moveSymmetryAxis', keys: 'Alt+Shift+Y' },
            { key: 'viewZoom-togglePanels', keys: 'Alt+\\' },
            { key: 'viewZoom-zenMode', keys: 'Alt+Z' },
            { key: 'viewZoom-toggleGrid', keys: "Shift+'" },
            { key: 'viewZoom-snapToGrid', keys: 'Shift+;' },
            { key: 'viewZoom-smartShapes', keys: 'Shift+Q' },
            { key: 'viewZoom-strokeStabilization', keys: 'Shift+S' },
            { key: 'viewZoom-helpDialog', keys: 'Shift+?' },
            { key: 'viewZoom-presentFromStart', keys: 'F5' },
            { key: 'viewZoom-presentFromCurrent', keys: 'Shift+F5' },
            { key: 'viewZoom-exitPresentation', keys: 'Esc' },
        ]
    },
    {
        titleKey: 'animationTimeline',
        shortcuts: [
            { key: 'animationTimeline-insertFrame', keys: 'F5' },
            { key: 'animationTimeline-insertKeyframe', keys: 'F6' },
            { key: 'animationTimeline-insertBlankKeyframe', keys: 'F7' },
            { key: 'animationTimeline-removeFrame', keys: 'Shift+F5' },
            { key: 'animationTimeline-clearKeyframe', keys: 'Shift+F6' },
            { key: 'animationTimeline-convertToMovieClipGraphic', keys: 'F8 / Shift+F8' },
            { key: 'animationTimeline-playPause', keys: 'Enter' },
            { key: 'animationTimeline-stepFrameBackForward', keys: ', / .' },
            { key: 'animationTimeline-flipCelToCel', keys: 'Alt+, / Alt+.' },
            { key: 'animationTimeline-jumpMarkerToMarker', keys: 'Alt+Shift+, / Alt+Shift+.' },
            { key: 'animationTimeline-jumpToFirstLastFrame', keys: 'Home / End' },
            { key: 'animationTimeline-copyCutFrames', keys: 'Ctrl+Alt+C / Ctrl+Alt+X' },
            { key: 'animationTimeline-pasteDuplicateFrames', keys: 'Ctrl+Alt+V / Ctrl+Alt+D' },
            { key: 'animationTimeline-selectABlockOfCels', keys: 'Drag / Shift+Drag' },
            { key: 'animationTimeline-zoomTheTimeline', keys: 'Ctrl+Wheel' },
            { key: 'animationTimeline-addARulerMarker', keys: 'Double-click the ruler' },
            { key: 'animationTimeline-leaveOutOfPegsEditing', keys: 'Esc' },
        ]
    },
    {
        titleKey: 'layersSlides',
        shortcuts: [
            { key: 'layersSlides-switchLayer', keys: 'Alt+1-9' },
            { key: 'layersSlides-newLayer', keys: 'Ctrl+Shift+N' },
            { key: 'layersSlides-reorderLayer', keys: 'Alt+[ / Alt+]' },
            { key: 'layersSlides-newSlidePage', keys: 'Ctrl+M' },
            { key: 'layersSlides-nextStateSlide', keys: 'Alt+Right' },
            { key: 'layersSlides-prevStateSlide', keys: 'Alt+Left' },
            { key: 'layersSlides-cycleStrokeStyle', keys: 'S' },
            { key: 'layersSlides-cycleFillStyle', keys: 'F' },
        ]
    },
    {
        titleKey: 'touchPen',
        shortcuts: [
            { key: 'touchPen-panZoomCanvas', keys: 'Two-finger drag / pinch' },
            { key: 'touchPen-rotateCanvas', keys: 'Two-finger twist' },
            { key: 'touchPen-undo', keys: 'Two-finger tap' },
            { key: 'touchPen-keepUndoing', keys: 'Two-finger hold' },
            { key: 'touchPen-redo', keys: 'Three-finger tap' },
            { key: 'touchPen-copySelection', keys: 'Three-finger swipe down' },
            { key: 'touchPen-deleteSelection', keys: 'Three-finger scrub (back & forth)' },
            { key: 'touchPen-toggleZenMode', keys: 'Four-finger tap' },
            { key: 'touchPen-zoomToFit', keys: 'Quick pinch-in flick' },
            { key: 'touchPen-deleteSelection-2', keys: 'Tap the ✕ button by the selection' },
            { key: 'touchPen-contextMenu', keys: 'Touch & hold (long-press)' },
            { key: 'touchPen-selectAll', keys: 'Long-press empty canvas → Select all' },
            { key: 'touchPen-frameMenuInsertKeyframeTweensFrameActions', keys: 'Touch & hold a frame in the timeline' },
            { key: 'touchPen-layerActions', keys: 'Drag a layer row left (mouse or touch)' },
            { key: 'touchPen-multiSelectLayers', keys: 'Drag layer rows right → Group / Delete' },
            { key: 'touchPen-reorderLayers', keys: 'Drag the ⋮⋮ grip handle' },
            { key: 'touchPen-proportionalResize', keys: 'Add a finger while dragging a handle' },
            { key: 'touchPen-penNodeConvertSmoothCorner', keys: 'Tap an anchor' },
            { key: 'touchPen-penNodeDeleteConvert', keys: 'Long-press an anchor' },
            { key: 'touchPen-penInsertPointOnAPath', keys: 'Long-press the outline' },
            { key: 'touchPen-penConstrainHandles9045', keys: '90°/45° toggle / second finger' },
            { key: 'touchPen-penStraightSegment', keys: '90°/45° toggle / second finger' },
            { key: 'touchPen-setShapeFill', keys: 'Drag palette swatch onto shape' },
            { key: 'touchPen-smartShapes', keys: 'Draw + hold' },
        ]
    },
];

/** Parse a key string like "Ctrl+Shift+E" into individual key caps */
function parseKeys(keys: string): { segments: { type: 'key' | 'separator'; value: string }[] } {
    const segments: { type: 'key' | 'separator'; value: string }[] = [];
    // Split on " or " and " / " separators
    const parts = keys.split(/( or | \/ )/);
    for (const part of parts) {
        if (part === ' or ' || part === ' / ') {
            segments.push({ type: 'separator', value: part.trim() });
        } else {
            // Split on + for modifier combos
            const combo = part.split('+');
            for (let i = 0; i < combo.length; i++) {
                if (i > 0) segments.push({ type: 'separator', value: '+' });
                segments.push({ type: 'key', value: combo[i] });
            }
        }
    }
    return { segments };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpDialog(props: Props) {
    const [query, setQuery] = createSignal('');

    /**
     * People come to this dialog with one question — "what's the shortcut for X" — and used to
     * answer it by reading seven columns. Match on the LABEL and on the KEYS, so it works in
     * both directions: "duplicate" finds Ctrl+D, and "ctrl+d" finds Duplicate. Categories that
     * match nothing drop out entirely rather than leaving empty headings behind.
     */
    /**
     * Resolve every label once per locale change. SHORTCUT_DATA is a module-level
     * const, so it cannot hold translated text — it would be captured at import
     * and never updated. Reading `t` inside a memo is what makes the dialog
     * re-render when the language changes.
     */
    const localized = createMemo<LocalizedCategory[]>(() =>
        SHORTCUT_DATA.map(cat => ({
            title: t(`hotkeyCategory.${cat.titleKey}`),
            shortcuts: cat.shortcuts.map(sc => ({ label: t(`hotkeys.${sc.key}`), keys: sc.keys })),
        })));

    const filtered = createMemo(() => {
        const q = query().trim().toLowerCase();
        if (!q) return localized();
        // Matches the TRANSLATED label, which is the text actually on screen and
        // therefore the text the user will type. Filtering the English source
        // would make search silently useless in every other locale.
        return localized()
            .map(cat => ({
                ...cat,
                shortcuts: cat.shortcuts.filter(sc =>
                    sc.label.toLowerCase().includes(q) || sc.keys.toLowerCase().includes(q)),
            }))
            .filter(cat => cat.shortcuts.length > 0);
    });

    // Reopening should not resume someone else's half-typed search.
    createEffect(() => { if (!props.isOpen) setQuery(''); });

    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    props.onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    return (
        <Show when={props.isOpen}>
            <div class="help-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="help-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div class="help-modal-header">
                        <h2>{t("helpDialog.title")}</h2>
                        <div class="help-search">
                            <Search size={15} />
                            <input
                                type="text"
                                placeholder={t("helpDialog.searchPlaceholder")}
                                value={query()}
                                onInput={(e) => setQuery(e.currentTarget.value)}
                            />
                            <Show when={query()}>
                                <button class="help-search-clear" onClick={() => setQuery('')} title={t("helpDialog.clearSearch")}>
                                    <X size={14} />
                                </button>
                            </Show>
                        </div>
                        <button class="help-close-btn" onClick={props.onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div class="help-modal-body">
                        <Show when={!query().trim()}>
                        <div class="social-links">
                            <button
                                type="button"
                                class="social-btn"
                                onClick={() => { props.onClose(); startTour(); }}
                            >
                                <Compass size={16} />
                                {t("helpDialog.takeTheTour")}
                            </button>
                            {/* A real link, so Ctrl/⌘-click, middle-click and "Open link in new
                                tab" all work. The handler used to preventDefault() on EVERY
                                click, which swallowed those gestures and forced the docs to
                                replace the drawing you had open. Only a plain left-click is
                                handled in-app now; a modified click falls through to the
                                browser and opens a second tab. */}
                            <a
                                href={pathFor('help')}
                                class="social-btn"
                                title={t("helpDialog.documentationTitle")}
                                onClick={(e) => {
                                    if (e.defaultPrevented) return;
                                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                                    e.preventDefault();
                                    props.onClose();
                                    navigate(pathFor('help'));
                                }}
                            >
                                <ExternalLink size={16} />
                                {t("helpDialog.documentation")}
                            </a>
                            <a
                                href={pathFor('help')}
                                class="social-btn"
                                target="_blank"
                                rel="noopener"
                                title={t("helpDialog.docsNewTabTitle")}
                            >
                                <ExternalLink size={16} />
                                {t("helpDialog.docsNewTab")}
                            </a>
                            <a
                                href={pathFor('examples')}
                                class="social-btn"
                                onClick={(e) => {
                                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                                    e.preventDefault();
                                    props.onClose();
                                    navigate(pathFor('examples'));
                                }}
                            >
                                <LayoutTemplate size={16} />
                                {t("helpDialog.examples")}
                            </a>
                            <a href="https://github.com/algorisys-oss/" target="_blank" rel="noopener noreferrer" class="social-btn">
                                <Github size={16} />
                                GitHub
                            </a>
                            <a href="#" class="social-btn">
                                <Bug size={16} />
                                {t("helpDialog.foundAnIssue")}
                            </a>
                            <a href="#" class="social-btn">
                                <Youtube size={16} />
                                YouTube
                            </a>
                        </div>
                        </Show>

                        <div class="shortcuts-section">
                            <h3>{t("helpDialog.shortcutsHeading")}</h3>
                            <Show when={filtered().length === 0}>
                                <p class="help-empty">{t("helpDialog.noMatch", { query: query().trim() })}</p>
                            </Show>
                            <div class="shortcuts-grid">
                                <For each={filtered()}>
                                    {(category) => (
                                        <div class="shortcut-column">
                                            <h4>{category.title}</h4>
                                            <div class="shortcut-list">
                                                <For each={category.shortcuts}>
                                                    {(sc) => {
                                                        const parsed = parseKeys(sc.keys);
                                                        return (
                                                            <div class="shortcut-item">
                                                                <span class="shortcut-label">{sc.label}</span>
                                                                <div class="shortcut-keys">
                                                                    <For each={parsed.segments}>
                                                                        {(seg) =>
                                                                            seg.type === 'key'
                                                                                ? <span class="keycap">{seg.value}</span>
                                                                                : <span class="key-or">{seg.value}</span>
                                                                        }
                                                                    </For>
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                </For>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
}
