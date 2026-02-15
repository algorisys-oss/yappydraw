import { type Component, For, createSignal, onMount, onCleanup } from "solid-js";
import { store, setSelectedTool, addElement, setStore } from "../store/app-store";
import { generateId } from "../utils/id-generator";
import type { ToolType } from "../types";
import { MousePointer2, Eraser, Hand, Image as ImageIcon, Zap, Highlighter, Lasso, Crop } from "lucide-solid";
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
import "./toolbar.css";

// Navigation tools (rendered before grouped tools)
const navTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'pan', icon: Hand, label: 'Pan Tool (H)' },
    { type: 'selection', icon: MousePointer2, label: 'Selection (V or 1)' },
];

// Lasso & Crop tools (rendered after connector/line toolgroup)
const selectUtilTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'lasso', icon: Lasso, label: 'Lasso Select (Shift+L)' },
    { type: 'crop', icon: Crop, label: 'Crop Image (Shift+C)' },
];

// Utility tools (rendered after grouped tools)
const utilityTools: { type: ToolType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'image', icon: ImageIcon, label: 'Insert Image (I or 9)' },
    { type: 'eraser', icon: Eraser, label: 'Eraser (E or 7)' },
    { type: 'laser', icon: Zap, label: 'Laser Pointer (Shift+P)' },
    { type: 'ink', icon: Highlighter, label: 'Ink Overlay (Alt+I)' },
];

const Toolbar: Component = () => {
    let fileInputRef: HTMLInputElement | null = null;
    const [position, setPosition] = createSignal({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);

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

        onCleanup(() => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('resize', handleResize);
        });
    });

    const handleToolClick = (type: ToolType) => {
        if (type === 'image') {
            fileInputRef?.click();
        } else {
            setSelectedTool(type);
        }
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
            classList={{ dragging: isDragging() }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={isMobile() ? undefined : onMouseDown}
            style={isMobile() ? {} : {
                transform: `translateX(-50%) translate(${position().x}px, ${position().y}px)`
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
            {/* Pan, Selection */}
            <For each={navTools}>
                {(tool) => (
                    <button
                        class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                        onClick={() => handleToolClick(tool.type)}
                        onContextMenu={handleRightClick}
                        title={tool.label}
                    >
                        <tool.icon size={18} />
                    </button>
                )}
            </For>

            {/* Pen Tool Group (Fine Liner, Ink Brush, Marker) */}
            <PenToolGroup />

            {/* Connector Tool Group (Arrow, Line, Bezier, Polyline) */}
            <ConnectorToolGroup />

            {/* Lasso & Crop (after lines) */}
            <For each={selectUtilTools}>
                {(tool) => (
                    <button
                        class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                        onClick={() => handleToolClick(tool.type)}
                        onContextMenu={handleRightClick}
                        title={tool.label}
                    >
                        <tool.icon size={18} />
                    </button>
                )}
            </For>

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

            {/* Image, Eraser, Laser, Ink */}
            <For each={utilityTools}>
                {(tool) => (
                    <button
                        class={`toolbar-btn ${store.selectedTool === tool.type ? 'active' : ''}`}
                        onClick={() => handleToolClick(tool.type)}
                        onContextMenu={handleRightClick}
                        title={tool.label}
                    >
                        <tool.icon size={18} />
                    </button>
                )}
            </For>
        </div>
    );
};

export default Toolbar;
