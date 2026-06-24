import { type Component, For, Show, createSignal, onMount, onCleanup } from "solid-js";
import { store, setSelectedTool, addElement, setStore, togglePenStabilization, updateGlobalSettings } from "../store/app-store";
import { generateId } from "../utils/id-generator";
import type { ToolType } from "../types";
import { MousePointer2, Eraser, Hand, Image as ImageIcon, Video, Zap, Highlighter, Lasso, Crop, Pen, PenTool, Minus, MoveUpRight, Square, Diamond, Circle, Type, PanelLeftClose, PanelLeftOpen, Spline, RotateCw } from "lucide-solid";

const BRUSH_TOOLS: ToolType[] = ['fineliner', 'inkbrush', 'marker'];
import PenToolGroup from "./pen-tool-group";
import TextToolGroup from "./text-tool-group";
import ShapeToolGroup from "./shape-tool-group";
import SketchnoteToolGroup from "./sketchnote-tool-group";
import InfraToolGroup from "./infra-tool-group";

import WireframeToolGroup from "./wireframe-tool-group";
import MindmapToolGroup from "./mindmap-tool-group";
import TechnicalToolGroup from "./technical-tool-group";
import UmlToolGroup from "./uml-tool-group";

import StatusToolGroup from "./status-tool-group";
import CloudInfraToolGroup from "./cloud-infra-tool-group";
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
    { type: 'path', icon: PenTool, label: 'Pen / Vector Path — click to add points, drag to curve' },
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

// Brainstorm mode: minimal flat toolbar for quick ideation
const brainstormTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string; hotkey?: string; setSubType?: () => void }[] = [
    { type: 'selection', icon: MousePointer2, label: 'Selection (V)', hotkey: '1' },
    { type: 'fineliner', icon: Pen, label: 'Pen (P)', hotkey: '7' },
    { type: 'line', icon: Minus, label: 'Line' },
    { type: 'arrow', icon: MoveUpRight, label: 'Arrow (5)', hotkey: '5' },
    { type: 'rectangle', icon: Square, label: 'Rectangle (2)', hotkey: '2' },
    { type: 'diamond', icon: Diamond, label: 'Diamond (3)', hotkey: '3' },
    { type: 'circle', icon: Circle, label: 'Ellipse (4)', hotkey: '4' },
    { type: 'path', icon: PenTool, label: 'Pen / Vector Path — click to add points, drag to curve' },
    { type: 'text', icon: Type, label: 'Text (8)', hotkey: '8' },
    { type: 'image', icon: ImageIcon, label: 'Image (9)', hotkey: '9' },
    { type: 'eraser', icon: Eraser, label: 'Eraser (0)', hotkey: '0' },
];

const BRAINSTORM_KEY = 'yappy-brainstorm-mode';

const Toolbar: Component = () => {
    let fileInputRef: HTMLInputElement | null = null;
    const [showVideoDialog, setShowVideoDialog] = createSignal(false);
    const [position, setPosition] = createSignal({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);
    const [brainstormMode, setBrainstormMode] = createSignal(localStorage.getItem(BRAINSTORM_KEY) !== 'false');

    const toggleBrainstormMode = () => {
        const next = !brainstormMode();
        setBrainstormMode(next);
        localStorage.setItem(BRAINSTORM_KEY, String(next));
    };

    const onMouseDown = (e: MouseEvent) => {
        // Drag if clicked on the container's padding or gaps, or the handle itself
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

    const onMouseMove = (e: MouseEvent) => {
        if (!isDragging()) return;
        setPosition({
            x: e.clientX - dragStart().x,
            y: e.clientY - dragStart().y
        });
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    onMount(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        // Expose global trigger for keyboard shortcut
        (window as any).triggerVideoDialog = () => setShowVideoDialog(true);

        onCleanup(() => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
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

                        addElement({
                            id: generateId('image'),
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
                    }
                };
            }
        };
        reader.readAsDataURL(file);
        (e.target as HTMLInputElement).value = '';
    };

    return (
        <div
            class="toolbar-container"
            classList={{ dragging: isDragging(), vertical: !isMobile() && !!store.globalSettings.toolbarVertical }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={isMobile() ? undefined : onMouseDown}
            style={isMobile() ? {} : {
                // Centre on the anchored axis: X for the top (horizontal) bar, Y for the left (vertical) bar.
                transform: `${store.globalSettings.toolbarVertical ? 'translateY(-50%)' : 'translateX(-50%)'} translate(${position().x}px, ${position().y}px)`
            }}
        >
            <div class="drag-handle" title="Drag to move toolbar">
                <div class="drag-dots"></div>
            </div>
            <input
                type="file"
                ref={el => fileInputRef = el}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
            />

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

                    {/* Cloud & Container Infrastructure (Kubernetes, Container, API Gateway, etc.) */}
                    <CloudInfraToolGroup />

                    {/* Data & Metrics (Bar Chart, Pie Chart, Trend, Funnel, Gauge, Table) */}
                    <DataMetricsToolGroup />

                    {/* Connection & Relationship (Puzzle, Chain, Bridge, Magnet, Scale, etc.) */}
                    <ConnectionRelToolGroup />

                    {/* Infrastructure Tool Group (Server, LB, Cloud, User, etc.) */}
                    <InfraToolGroup />

                    {/* Wireframing Essentials (Browser Window, Mobile, Input, Button) */}
                    <WireframeToolGroup />

                    {/* Data Structures (Array, Stack, Queue, LinkedList, BinaryTree, HashTable) */}
                    <DsToolGroup />

                    {/* Technical Diagramming Group (DFD, Isometric Cube, Cylinder) */}
                    <TechnicalToolGroup />

                    {/* UML Tool Group (Class, Actor, UseCase) */}
                    <UmlToolGroup />

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
        </div>
    );
};

export default Toolbar;
