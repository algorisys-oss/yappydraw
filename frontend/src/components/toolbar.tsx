import { type Component, For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { store, setSelectedTool, addElement, setStore, togglePenStabilization, updateGlobalSettings, toggleStickFigurePanel, showPropertiesPanel } from "../store/app-store";
import { generateId } from "../utils/id-generator";
import { addImagePlaceholder } from "../utils/image-actions";
import type { ToolType } from "../types";
import { MousePointer2, Eraser, Image as ImageIcon, Video, Zap, Highlighter, Lasso, Crop, Pen, PenTool, Minus, MoveUpRight, Square, Diamond, Circle, Type, PanelLeftClose, PanelLeftOpen, Spline, PersonStanding, Brush, PanelLeft, PanelTop, PanelRight, PanelBottom, Move } from "lucide-solid";
import { isPanelOpen } from "../store/dock-layout";
import { isPhoneWidth } from "../utils/dock-layout";
import { t, type ToolbarToolKey, type DockPositionKey, type DockActionKey } from "../i18n";

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

// Navigation tools (rendered before grouped tools).
// Pan lives in the top bar's view-control cluster (components/menu.tsx) — it moves the
// *view*, not the drawing, which is the same reason Commands / Vector Tools / Shape Builder
// went up there. Selection stays: it is what you come back to between drawing tools.
/**
 * A toolbar entry's tooltip, assembled at render time.
 *
 * `labelKey` is prose and comes from the dictionary; `hint` is the key binding
 * and stays here as a literal, so translation can never reach the letter that
 * is actually bound (plan §3.3). `helpKey` is the optional trailing
 * explanation after an em dash.
 */
interface ToolEntry {
    type: ToolType;
    icon: Component<{ size?: number; color?: string }>;
    labelKey: ToolbarToolKey;
    hint?: string;
    helpKey?: ToolbarToolKey;
    hotkey?: string;
    setSubType?: () => void;
    penGroup?: boolean;
}

/** `Rectangle` + `2` → `Rectangle (2)`; with a helpKey, `… — explanation`. */
const toolTitle = (tool: ToolEntry): string => {
    const base = tool.hint ? `${t(`toolbarTool.${tool.labelKey}`)} (${tool.hint})` : t(`toolbarTool.${tool.labelKey}`);
    return tool.helpKey ? `${base} — ${t(`toolbarTool.${tool.helpKey}`)}` : base;
};

const navTools: ToolEntry[] = [
    { type: 'selection', icon: MousePointer2, labelKey: 'selection', hint: 'V or 1', hotkey: '1' },
];

// Lasso & Crop tools (rendered after connector/line toolgroup)
const selectUtilTools: ToolEntry[] = [
    { type: 'path', icon: PenTool, labelKey: 'path', hint: 'P', helpKey: 'pathHelp', hotkey: 'P' },
    { type: 'lasso', icon: Lasso, labelKey: 'lasso', hint: 'Shift+L' },
    { type: 'crop', icon: Crop, labelKey: 'crop', hint: 'Shift+C' },
];

// Utility tools (rendered after grouped tools)
const utilityTools: ToolEntry[] = [
    { type: 'image', icon: ImageIcon, labelKey: 'insertImage', hint: 'I or 9', hotkey: '9' },
    { type: 'video' as ToolType, icon: Video, labelKey: 'insertVideo' },
    { type: 'eraser', icon: Eraser, labelKey: 'eraser', hint: 'E or 0', hotkey: '0' },
    { type: 'laser', icon: Zap, labelKey: 'laser', hint: 'Shift+P' },
    { type: 'ink', icon: Highlighter, labelKey: 'ink', hint: 'Alt+I' },
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
const brainstormTools: ToolEntry[] = [
    { type: 'selection', icon: MousePointer2, labelKey: 'selection', hint: 'V', hotkey: '1' },
    { type: 'fineliner', icon: Pen, labelKey: 'fineliner', hint: '7', hotkey: '7', penGroup: true },
    { type: 'line', icon: Minus, labelKey: 'line' },
    { type: 'arrow', icon: MoveUpRight, labelKey: 'arrow', hint: '5', hotkey: '5' },
    { type: 'rectangle', icon: Square, labelKey: 'rectangle', hint: '2', hotkey: '2' },
    { type: 'diamond', icon: Diamond, labelKey: 'diamond', hint: '3', hotkey: '3' },
    { type: 'circle', icon: Circle, labelKey: 'circle', hint: '4', hotkey: '4' },
    { type: 'path', icon: PenTool, labelKey: 'path', hint: 'P', helpKey: 'pathHelp', hotkey: 'P' },
    { type: 'text', icon: Type, labelKey: 'text', hint: '8', hotkey: '8' },
    { type: 'image', icon: ImageIcon, labelKey: 'image', hint: '9', hotkey: '9' },
    { type: 'eraser', icon: Eraser, labelKey: 'eraser', hint: '0', hotkey: '0' },
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
    // (> this) get the movable / orientable / resizable floating toolbar. Imported
    // rather than redeclared so this, the insets in utils/dock-layout, and the
    // @media breakpoint in toolbar.css all name the same number.
    const [isMobile, setIsMobile] = createSignal(isPhoneWidth());
    const [brainstormMode, setBrainstormMode] = createSignal(localStorage.getItem(BRAINSTORM_KEY) !== 'false');
    const [isResizing, setIsResizing] = createSignal(false);
    const [resizeStart, setResizeStart] = createSignal({ x: 0, y: 0, w: 0 });

    // Wrap width (px): when > 0 the toolbar flows its icons into a grid of that width,
    // so the user can drag it to e.g. 2-per-row. 0 = off (single line).
    const wrapWidth = () => store.globalSettings.toolbarWrap ?? 0;
    /** Docked edge, or 'float' for the legacy overlay bar. Mobile always floats — there
     *  isn't room to give an edge away. */
    const docked = () => (isMobile() ? 'float' : (store.globalSettings.toolbarDock ?? 'left'));

    /**
     * Where the toolbar sits, cycled by the single button below.
     *
     * This replaces a `toolbarVertical` flip that had quietly become a no-op: that flag is
     * only read when the bar is FLOATING, and since docking landed the bar defaults to the
     * left edge with nothing in the UI able to un-dock it — so the button changed a
     * localStorage value and nothing else. Cycling the dock edge is what the control now
     * looks like it should do, and it also gives `toolbarDock` the UI it never had.
     * 'float' stays in the cycle as the way back to the draggable overlay bar (whose own
     * orientation is still `toolbarVertical`).
     */
    const DOCK_CYCLE = ['left', 'top', 'right', 'bottom', 'float'] as const;
    // Position names and the phrasing of the action both live in the dictionary
    // (`dockPosition.*` / `dockAction.*`); word order inside the tooltip is the
    // translator's to change, which is why it is one interpolated sentence.
    const dockWhere = (d: string) => t(`dockPosition.${d as DockPositionKey}`);
    const dockAction = (d: string) => t(`dockAction.${d as DockActionKey}`);
    const nextDock = () => DOCK_CYCLE[(DOCK_CYCLE.indexOf(docked() as any) + 1) % DOCK_CYCLE.length];
    const cycleDock = () => updateGlobalSettings({ toolbarDock: nextDock() });
    /** Mirrors the current edge, so the button reads as state rather than as an action. */
    const DockIcon = () => {
        const d = docked();
        return d === 'top' ? <PanelTop size={16} />
            : d === 'right' ? <PanelRight size={16} />
            : d === 'bottom' ? <PanelBottom size={16} />
            : d === 'float' ? <Move size={16} />
            : <PanelLeft size={16} />;
    };

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

        const handleResize = () => { setIsMobile(isPhoneWidth()); clampIntoView(); };
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
        showPropertiesPanel();
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
            classList={{
                dragging: isDragging(), resizing: isResizing(),
                // A docked bar owns an edge; floating keeps the old drag/wrap behaviour.
                docked: docked() !== 'float',
                [`dock-${docked()}`]: docked() !== 'float',
                vertical: !isMobile() && docked() === 'float' && !!store.globalSettings.toolbarVertical,
                wrap: !isMobile() && docked() === 'float' && wrapWidth() > 0,
            }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={isMobile() || docked() !== 'float' ? undefined : onPointerDown}
            style={isMobile() || docked() !== 'float' ? {} : {
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
            <div class="drag-handle" title={t('toolbar.dragToMove')}>
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

            {/* Command palette, Vector Tools and Shape Builder moved to the top bar's
                view-control cluster (components/menu.tsx). None of them draws anything —
                they open an action list, a palette, and a mode — so they were the odd ones
                out in a column of drawing tools. On a phone the top cluster isn't rendered;
                the same three are reachable from the hamburger menu. */}

            {/* Stick-figure library — drawify-style editable people, drag onto the canvas */}
            <button
                class={`toolbar-btn ${isPanelOpen('stickFigure') ? 'active' : ''}`}
                onClick={() => toggleStickFigurePanel()}
                title={t('toolbar.stickFigures')}
                aria-label="Toggle stick figures panel"
            >
                <PersonStanding size={16} />
            </button>

            {/* Brainstorm / Full toggle */}
            <button
                class="toolbar-btn brainstorm-toggle"
                onClick={toggleBrainstormMode}
                title={brainstormMode() ? t('toolbar.fullToolbar') : t('toolbar.brainstormMode')}
            >
                {brainstormMode() ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {/* Toolbar position: cycles left → top → right → bottom → floating */}
            <Show when={!isMobile()}>
                <button
                    class="toolbar-btn"
                    onClick={cycleDock}
                    title={t('toolbar.dockTooltip', { where: dockWhere(docked()), action: dockAction(nextDock()) })}
                >
                    <DockIcon />
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
                                title={toolTitle(tool)}
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
                    {/* Selection (Pan is in the top bar) */}
                    <For each={navTools}>
                        {(tool) => (
                            <button
                                class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                                onClick={() => handleToolClick(tool.type)}
                                onContextMenu={handleRightClick}
                                onDblClick={handleRightClick}
                                title={toolTitle(tool)}
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
                                title={toolTitle(tool)}
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
                                title={toolTitle(tool)}
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
                            title={(store.globalSettings.penStabilization ?? 0) > 0
                        ? t('toolbar.stabilizationOn', { percent: Math.round((store.globalSettings.penStabilization ?? 0) * 100) })
                        : t('toolbar.stabilizationOff')}
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
                    title={t('toolbar.resizeHandle')}
                    onPointerDown={onResizeDown}
                    onDblClick={() => updateGlobalSettings({ toolbarWrap: 0 })}
                />
            </Show>
        </div>
    );
};

export default Toolbar;
