import { type Component, For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { store, setSelectedTool, addElement, setStore, togglePenStabilization, updateGlobalSettings, toggleCommandPalette, toggleVectorToolsPanel, toggleStickFigurePanel, toggleShapeBuilder } from "../store/app-store";
import { generateId } from "../utils/id-generator";
import { addImagePlaceholder } from "../utils/image-actions";
import type { ToolType } from "../types";
import { MousePointer2, Eraser, Hand, Image as ImageIcon, Video, Zap, Highlighter, Lasso, Crop, Pen, PenTool, Minus, MoveUpRight, Square, Diamond, Circle, Type, PanelLeftClose, PanelLeftOpen, Spline, RotateCw, Command, Shapes, PersonStanding, Brush, Combine } from "lucide-solid";
import { isPanelOpen } from "../store/dock-layout";

const BRUSH_TOOLS: ToolType[] = ['fineliner', 'inkbrush', 'marker'];
import PenToolGroup from "./pen-tool-group";
import TextToolGroup from "./text-tool-group";
import ShapeToolGroup from "./shape-tool-group";
import SketchnoteToolGroup from "./sketchnote-tool-group";
import ArchitectureToolGroup from "./architecture-tool-group";

import WireframeToolGroup from "./wireframe-tool-group";
import MindmapToolGroup from "./mindmap-tool-group";

import StatusToolGroup from "./status-tool-group";
import DataMetricsToolGroup from "./data-metrics-tool-group";
import ConnectionRelToolGroup from "./connection-rel-tool-group";
import ConnectorToolGroup from "./connector-tool-group";
import DsToolGroup from "./ds-tool-group";
import BpmnToolGroup from "./bpmn-tool-group";
import VideoUrlDialog from "./video-url-dialog";
import { getEmbedURL, fetchPoster, type VideoProvider } from "../utils/video-utils";
import { getImage } from "../utils/image-cache";
import "./toolbar.css";

// Navigation tools (rendered before grouped tools)
const navTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string; hotkey?: string }[] = [
    { type: 'pan', icon: Hand, label: 'Pan Tool (H)' },
    { type: 'selection', icon: MousePointer2, label: 'Selection (V or 1)', hotkey: '1' },
];

// Lasso & Crop tools (rendered after connector/line toolgroup)
const selectUtilTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string; hotkey?: string }[] = [
    { type: 'path', icon: PenTool, label: 'Pen / Vector Path (P) — click to add points, drag to curve', hotkey: 'P' },
    { type: 'lasso', icon: Lasso, label: 'Lasso Select (Shift+L)' },
    { type: 'crop', icon: Crop, label: 'Crop Image (Shift+C)' },
];

// Utility tools (rendered after grouped tools)
const utilityTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string; hotkey?: string }[] = [
    { type: 'image', icon: ImageIcon, label: 'Insert Image (I or 9)', hotkey: '9' },
    { type: 'video' as ToolType, icon: Video, label: 'Insert Video' },
    { type: 'eraser', icon: Eraser, label: 'Eraser (E or 0)', hotkey: '0' },
    { type: 'laser', icon: Zap, label: 'Laser Pointer (Shift+P)' },
    { type: 'ink', icon: Highlighter, label: 'Ink Overlay (Alt+I)' },
];

// Icon per pen so the brainstorm toolbar's single pen button shows which pen is
// actually in hand, the way the full toolbar's pen group does.
const PEN_ICONS: Record<string, Component<{ size?: number; color?: string }>> = {
    fineliner: Pen,
    inkbrush: Brush,
    marker: Highlighter,
};

// Brainstorm mode: minimal flat toolbar for quick ideation.
// `penGroup` marks the one button that stands in for the whole pen group — it
// tracks whichever pen is selected rather than naming a fixed tool type.
const brainstormTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string; hotkey?: string; setSubType?: () => void; penGroup?: boolean }[] = [
    { type: 'selection', icon: MousePointer2, label: 'Selection (V)', hotkey: '1' },
    { type: 'fineliner', icon: Pen, label: 'Brush / Fine Liner (7)', hotkey: '7', penGroup: true },
    { type: 'line', icon: Minus, label: 'Line' },
    { type: 'arrow', icon: MoveUpRight, label: 'Arrow (5)', hotkey: '5' },
    { type: 'rectangle', icon: Square, label: 'Rectangle (2)', hotkey: '2' },
    { type: 'diamond', icon: Diamond, label: 'Diamond (3)', hotkey: '3' },
    { type: 'circle', icon: Circle, label: 'Ellipse (4)', hotkey: '4' },
    { type: 'path', icon: PenTool, label: 'Pen / Vector Path (P) — click to add points, drag to curve', hotkey: 'P' },
    { type: 'text', icon: Type, label: 'Text (8)', hotkey: '8' },
    { type: 'image', icon: ImageIcon, label: 'Image (9)', hotkey: '9' },
    { type: 'eraser', icon: Eraser, label: 'Eraser (0)', hotkey: '0' },
];

const BRAINSTORM_KEY = 'yappy-brainstorm-mode';

const Toolbar: Component = () => {
    let fileInputRef: HTMLInputElement | null = null;
    let containerRef: HTMLDivElement | undefined;

    // Keep the toolbar on-screen: `position` is a delta from the CSS-anchored spot, so a
    // toolbar parked near an edge (or a window since shrunk) can render fully off-screen
    // with no way to grab it back. Nudge the delta so at least a sliver stays visible.
    const clampIntoView = () => {
        const el = containerRef;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return; // not laid out yet
        // Keep the WHOLE toolbar on-screen so the drag-handle is always reachable.
        // Pull in any right/bottom overflow first, then guarantee the top-left edge
        // is visible (which wins if the bar is larger than the viewport).
        let dx = 0, dy = 0;
        if (r.right > window.innerWidth) dx = window.innerWidth - r.right;
        if (r.bottom > window.innerHeight) dy = window.innerHeight - r.bottom;
        if (r.left + dx < 0) dx = -r.left;
        if (r.top + dy < 0) dy = -r.top;
        if (dx || dy) {
            const p = position();
            const next = { x: p.x + dx, y: p.y + dy };
            setPosition(next);
            try { localStorage.setItem('toolbarPos', JSON.stringify(next)); } catch { /* ignore */ }
        }
    };
    const [showVideoDialog, setShowVideoDialog] = createSignal(false);
    const [position, setPosition] = createSignal({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
    // Below this width the toolbar force-docks to the bottom (phones). Tablets
    // (>= this) get the movable / orientable / resizable floating toolbar. Must
    // match the @media breakpoint in toolbar.css.
    const PHONE_MAX_WIDTH = 600;
    const [isMobile, setIsMobile] = createSignal(window.innerWidth <= PHONE_MAX_WIDTH);
    const [brainstormMode, setBrainstormMode] = createSignal(localStorage.getItem(BRAINSTORM_KEY) !== 'false');
    const [isResizing, setIsResizing] = createSignal(false);
    const [resizeStart, setResizeStart] = createSignal({ x: 0, y: 0, w: 0 });

    // Wrap width (px): when > 0 the toolbar flows its icons into a grid of that width,
    // so the user can drag it to e.g. 2-per-row. 0 = off (single line).
    const wrapWidth = () => store.globalSettings.toolbarWrap ?? 0;

    // Pointer events (not mouse) so the toolbar can be dragged/resized with a
    // finger or stylus on a tablet — synthesized mouse events are unreliable for
    // touch drags.
    const onResizeDown = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const el = (e.currentTarget as HTMLElement).closest('.toolbar-container') as HTMLElement | null;
        // Anchor to the actual rendered width (the bar hugs its content), so the drag
        // tracks the visible right edge.
        const curW = el?.offsetWidth ?? wrapWidth() ?? 220;
        setIsResizing(true);
        setResizeStart({ x: e.clientX, y: e.clientY, w: curW });
    };

    const toggleBrainstormMode = () => {
        const next = !brainstormMode();
        setBrainstormMode(next);
        localStorage.setItem(BRAINSTORM_KEY, String(next));
    };

    const onPointerDown = (e: PointerEvent) => {
        // Drag if pressed on the container's padding or gaps, or the handle itself
        const target = e.target as HTMLElement;
        if (target.classList.contains('toolbar-container') || target.closest('.drag-handle')) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position().x,
                y: e.clientY - position().y
            });
            e.preventDefault();
        }
    };

    const onPointerMove = (e: PointerEvent) => {
        if (isResizing()) {
            const s = resizeStart();
            const next = Math.round(Math.max(96, Math.min(900, s.w + (e.clientX - s.x))));
            updateGlobalSettings({ toolbarWrap: next });
            return;
        }
        if (!isDragging()) return;
        setPosition({
            x: e.clientX - dragStart().x,
            y: e.clientY - dragStart().y
        });
    };

    const onPointerUp = () => {
        if (isDragging()) {
            // Snap back if the user parked it off-screen, then persist the on-screen
            // position so it never gets lost beyond the viewport.
            requestAnimationFrame(() => { clampIntoView(); try { localStorage.setItem('toolbarPos', JSON.stringify(position())); } catch { /* ignore */ } });
        }
        setIsDragging(false);
        setIsResizing(false);
    };

    onMount(() => {
        // Restore the dragged toolbar position (persists where the user parked it).
        try { const saved = localStorage.getItem('toolbarPos'); if (saved) { const p = JSON.parse(saved); if (typeof p?.x === 'number' && typeof p?.y === 'number') setPosition(p); } } catch { /* ignore */ }
        // After layout, pull the toolbar back on-screen if the restored position is off-view.
        requestAnimationFrame(clampIntoView);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        const handleResize = () => { setIsMobile(window.innerWidth <= PHONE_MAX_WIDTH); clampIntoView(); };
        window.addEventListener('resize', handleResize);

        // Expose global trigger for keyboard shortcut
        (window as any).triggerVideoDialog = () => setShowVideoDialog(true);

        onCleanup(() => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('resize', handleResize);
            delete (window as any).triggerVideoDialog;
        });
    });

    const handleToolClick = (type: ToolType) => {
        if (type === 'image') {
            fileInputRef?.click();
        } else if (type === 'video') {
            setShowVideoDialog(true);
        } else {
            setSelectedTool(type);
        }
    };

    const handleVideoInsert = (url: string, provider: VideoProvider, posterURL: string | null) => {
        setShowVideoDialog(false);
        const embedURL = getEmbedURL(url, provider);

        // Create the video element
        addElement({
            id: generateId('video'),
            type: 'video',
            x: 100,
            y: 100,
            width: 480,
            height: 270,
            strokeColor: "transparent",
            backgroundColor: "#1a1a2e",
            fillStyle: "solid",
            strokeWidth: 0,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100,
            angle: 0,
            renderStyle: "architectural",
            seed: Math.floor(Math.random() * 2 ** 31),
            roundness: null,
            locked: false,
            link: null,
            videoURL: url,
            videoEmbedURL: embedURL || undefined,
            videoPosterURL: posterURL || undefined,
            videoProvider: provider,
            videoAutoplay: false,
            videoLoop: false,
            videoMuted: true,
            layerId: store.activeLayerId
        });

        // Pre-load poster into the image cache for canvas rendering
        if (posterURL) {
            getImage(posterURL);
        }

        // Also try to fetch a higher-quality poster asynchronously and cache it as dataURL
        fetchPoster(url, provider).then(poster => {
            if (poster) {
                getImage(poster);
            }
        });
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const handleImageUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataURL = event.target?.result as string;
            if (dataURL) {
                const img = new Image();
                img.src = dataURL;
                img.onload = () => {
                    // Compression Logic
                    const MAX_DIMENSION = 1500;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        const ratio = width / height;
                        if (width > height) {
                            width = MAX_DIMENSION;
                            height = width / ratio;
                        } else {
                            height = MAX_DIMENSION;
                            width = height * ratio;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedDataURL = canvas.toDataURL('image/webp', 0.8);

                        const VISUAL_MAX = 500;
                        let visualW = width;
                        let visualH = height;

                        if (visualW > VISUAL_MAX || visualH > VISUAL_MAX) {
                            const ratio = visualW / visualH;
                            if (visualW > visualH) {
                                visualW = VISUAL_MAX;
                                visualH = visualW / ratio;
                            } else {
                                visualH = VISUAL_MAX;
                                visualW = visualH * ratio;
                            }
                        }

                        const newImageId = generateId('image');
                        addElement({
                            id: newImageId,
                            type: 'image',
                            x: 100,
                            y: 100,
                            width: visualW,
                            height: visualH,
                            strokeColor: "transparent",
                            backgroundColor: "transparent",
                            fillStyle: "solid",
                            strokeWidth: 0,
                            strokeStyle: "solid",
                            roughness: 0,
                            opacity: 100,
                            angle: 0,
                            renderStyle: "sketch",
                            seed: Math.floor(Math.random() * 2 ** 31),
                            roundness: null,
                            locked: false,
                            link: null,
                            dataURL: compressedDataURL,
                            mimeType: 'image/webp',
                            layerId: store.activeLayerId
                        });
                        // Hand the user a placed, selected image rather than
                        // leaving the Image tool armed — the next click would
                        // otherwise reopen the file picker instead of letting
                        // them move or resize what they just inserted.
                        setStore('selection', [newImageId]);
                        setSelectedTool('selection');
                    }
                };
            }
        };
        reader.readAsDataURL(file);
        (e.target as HTMLInputElement).value = '';
    };

    return (
        <div
            ref={el => containerRef = el}
            class="toolbar-container"
            classList={{ dragging: isDragging(), resizing: isResizing(), vertical: !isMobile() && !!store.globalSettings.toolbarVertical, wrap: !isMobile() && wrapWidth() > 0 }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={isMobile() ? undefined : onPointerDown}
            style={isMobile() ? {} : {
                // Centre on the anchored axis: X for the top (horizontal) bar, Y for the left
                // (vertical) bar. In wrap mode the bar grows downward, so drop the vertical
                // centering (it would clip a tall grid off the top) — CSS pins it to the top.
                transform: (() => {
                    const wrapped = wrapWidth() > 0;
                    const vertical = !!store.globalSettings.toolbarVertical;
                    const center = wrapped
                        ? (vertical ? '' : 'translateX(-50%)')
                        : (vertical ? 'translateY(-50%)' : 'translateX(-50%)');
                    return `${center} translate(${position().x}px, ${position().y}px)`.trim();
                })(),
                // Use max-width (not width) so the bar hugs its icons and only wraps when
                // dragged NARROWER than the content — no empty space on a single row.
                ...(wrapWidth() > 0 ? { 'max-width': `${wrapWidth()}px` } : {})
            }}
        >
            <div class="drag-handle" title="Drag to move toolbar">
                <div class="drag-dots"></div>
            </div>
            <input
                type="file"
                ref={el => fileInputRef = el}
                onChange={handleImageUpload}
                on:cancel={() => addImagePlaceholder()}
                accept="image/*"
                style={{ display: 'none' }}
            />

            {/* Command palette — the touch-friendly gateway to every tool & action
                (Magic Wand, Distort, Shape Builder, Live Paint, Knife, Width…). Essential
                on tablets, where the right-click menu and Ctrl+K aren't available. */}
            <button
                class="toolbar-btn command-palette-btn"
                onClick={() => toggleCommandPalette(true)}
                title="Commands & Tools (Ctrl/Cmd+K)"
                aria-label="Open command palette"
            >
                <Command size={16} />
            </button>

            {/* Vector Tools palette — one-tap access to Shape Builder, Live Paint, Puppet Warp,
                Perspective Grid, Blob Brush, Curvature, Reshape, Symbolism, etc. */}
            <button
                class={`toolbar-btn ${isPanelOpen('vectorTools') ? 'active' : ''}`}
                onClick={() => toggleVectorToolsPanel()}
                title="Vector Tools palette"
                aria-label="Toggle vector tools palette"
            >
                <Shapes size={16} />
            </button>

            {/* Shape Builder — promoted out of the Vector Tools list. For logo and
                illustration work this is the tool you reach for most: drag across
                overlapping regions to merge them, Alt+drag to delete one. */}
            <button
                class={`toolbar-btn ${store.shapeBuilderActive ? 'active' : ''}`}
                onClick={() => toggleShapeBuilder()}
                title="Shape Builder (Shift+M) — drag across regions to merge, Alt+drag to delete"
                aria-label="Toggle Shape Builder"
                aria-pressed={store.shapeBuilderActive}
            >
                <Combine size={16} />
            </button>

            {/* Stick-figure library — drawify-style editable people, drag onto the canvas */}
            <button
                class={`toolbar-btn ${isPanelOpen('stickFigure') ? 'active' : ''}`}
                onClick={() => toggleStickFigurePanel()}
                title="Stick Figures library"
                aria-label="Toggle stick figures panel"
            >
                <PersonStanding size={16} />
            </button>

            {/* Brainstorm / Full toggle */}
            <button
                class="toolbar-btn brainstorm-toggle"
                onClick={toggleBrainstormMode}
                title={brainstormMode() ? 'Full Toolbar' : 'Brainstorm Mode'}
            >
                {brainstormMode() ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {/* Orientation toggle: horizontal (top) ↔ vertical (left) */}
            <Show when={!isMobile()}>
                <button
                    class="toolbar-btn"
                    onClick={() => updateGlobalSettings({ toolbarVertical: !store.globalSettings.toolbarVertical })}
                    title={store.globalSettings.toolbarVertical ? 'Horizontal toolbar' : 'Vertical toolbar'}
                >
                    <RotateCw size={16} />
                </button>
            </Show>

            {brainstormMode() ? (
                /* ── Brainstorm Mode: flat minimal toolbar ── */
                <For each={brainstormTools}>
                    {(tool) => {
                        // The pen button represents whichever pen is selected, not a
                        // fixed tool. Pinned to 'fineliner' it never lit up while the
                        // Ink Brush was active — including at startup, where Ink Brush
                        // is the default tool — and clicking it silently demoted the
                        // user's chosen pen back to the Fineliner.
                        const type = () => (tool.penGroup ? (store.selectedPenType as ToolType) : tool.type);
                        const Icon = () => (tool.penGroup ? PEN_ICONS[store.selectedPenType] ?? tool.icon : tool.icon);
                        return (
                            <button
                                class={`toolbar-btn ${store.selectedTool === type() ? 'active' : ''}`}
                                onClick={() => handleToolClick(type())}
                                onContextMenu={handleRightClick}
                                onDblClick={handleRightClick}
                                title={tool.label}
                            >
                                {(() => { const I = Icon(); return <I size={16} />; })()}
                                {tool.hotkey && <span class="hotkey-badge">{tool.hotkey}</span>}
                            </button>
                        );
                    }}
                </For>
            ) : (
                /* ── Full Mode: all tool groups ── */
                <>
                    {/* Pan, Selection */}
                    <For each={navTools}>
                        {(tool) => (
                            <button
                                class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                                onClick={() => handleToolClick(tool.type)}
                                onContextMenu={handleRightClick}
                                onDblClick={handleRightClick}
                                title={tool.label}
                            >
                                <tool.icon size={16} />
                                {tool.hotkey && <span class="hotkey-badge">{tool.hotkey}</span>}
                            </button>
                        )}
                    </For>

                    {/* Pen Tool Group (Fine Liner, Ink Brush, Marker) */}
                    <PenToolGroup />

                    {/* Connector Tool Group (Arrow, Line, Bezier, Polyline) */}
                    <ConnectorToolGroup />

                    {/* Shape Tool Group (Rectangle, Circle, Diamond, Triangle, Hexagon, etc.) */}
                    <ShapeToolGroup />

                    {/* Mindmap Tool Group (Organic Branch, Central Topic) */}
                    <MindmapToolGroup />

                    {/* Sketchnote & People Group (Stick Figure, Star Person, Lightbulb, etc.) */}
                    <SketchnoteToolGroup />

                    {/* Status & Annotation Group (Checkbox, Badge, Tag, Pin, etc.) */}
                    <StatusToolGroup />

                    {/* Architecture Group — unified Infrastructure + Cloud-Native + Blocks/DFD/State */}
                    <ArchitectureToolGroup />

                    {/* Data & Metrics (Bar Chart, Pie Chart, Trend, Funnel, Gauge, Table) */}
                    <DataMetricsToolGroup />

                    {/* Connection & Relationship (Puzzle, Chain, Bridge, Magnet, Scale, etc.) */}
                    <ConnectionRelToolGroup />

                    {/* Wireframing Essentials (Browser Window, Mobile, Input, Button) */}
                    <WireframeToolGroup />

                    {/* Data Structures (Array, Stack, Queue, LinkedList, BinaryTree, HashTable) */}
                    <DsToolGroup />

                    {/* BPMN Tool Group (Events, Gateways, Activities, Artifacts) */}
                    <BpmnToolGroup />

                    {/* Text Tool Group (Text, Rich Text) */}
                    <TextToolGroup />

                    {/* Lasso & Crop */}
                    <For each={selectUtilTools}>
                        {(tool) => (
                            <button
                                class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                                onClick={() => handleToolClick(tool.type)}
                                onContextMenu={handleRightClick}
                                onDblClick={handleRightClick}
                                title={tool.label}
                            >
                                <tool.icon size={16} />
                                {tool.hotkey && <span class="hotkey-badge">{tool.hotkey}</span>}
                            </button>
                        )}
                    </For>

                    {/* Image, Eraser, Laser, Ink */}
                    <For each={utilityTools}>
                        {(tool) => (
                            <button
                                class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                                onClick={() => handleToolClick(tool.type)}
                                onContextMenu={handleRightClick}
                                onDblClick={handleRightClick}
                                title={tool.label}
                            >
                                <tool.icon size={16} />
                                {tool.hotkey && <span class="hotkey-badge">{tool.hotkey}</span>}
                            </button>
                        )}
                    </For>

                    {/* Stroke stabilization toggle — only while a brush tool is active */}
                    <Show when={BRUSH_TOOLS.includes(store.selectedTool)}>
                        <button
                            class={`toolbar-btn ${(store.globalSettings.penStabilization ?? 0) > 0 ? 'active' : ''}`}
                            onClick={() => togglePenStabilization()}
                            onContextMenu={handleRightClick}
                            title={`Stroke Stabilization ${(store.globalSettings.penStabilization ?? 0) > 0 ? `(on, ${Math.round((store.globalSettings.penStabilization ?? 0) * 100)}%)` : '(off)'} — Shift+S`}
                        >
                            <Spline size={16} />
                        </button>
                    </Show>
                </>
            )}

            <VideoUrlDialog
                isOpen={showVideoDialog()}
                onCancel={() => setShowVideoDialog(false)}
                onSubmit={handleVideoInsert}
            />

            {/* Resize grip — drag to wrap icons into a grid (e.g. 2 per row);
                double-click to reset to a single line. */}
            <Show when={!isMobile()}>
                <div
                    class="toolbar-resize-handle"
                    title="Drag to resize (icons per row) · double-click to reset"
                    onPointerDown={onResizeDown}
                    onDblClick={() => updateGlobalSettings({ toolbarWrap: 0 })}
                />
            </Show>
        </div>
    );
};

export default Toolbar;
