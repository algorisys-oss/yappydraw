import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedShapeType, setStore, setToolLocked } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Square, Circle, Diamond,
    Triangle, Hexagon, Octagon, Star, Cloud, Heart, X, Check,
    ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ChevronDown,
    Pill, StickyNote, MessageSquare, MessageCircle, Zap, Bookmark, ChevronLeft, ChevronRight,
    Database, FileText, Columns, Layers, Pentagon
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

// Custom SVG icons for geometric shapes (from former MathToolGroup)
const TrapezoidIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg
        width={props.size || 20}
        height={props.size || 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M 4,18 L 8,6 L 16,6 L 20,18 Z" />
    </svg>
);

const RightTriangleIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg
        width={props.size || 20}
        height={props.size || 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M 6,6 L 6,18 L 18,18 Z" />
    </svg>
);

const SeptagonIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg
        width={props.size || 20}
        height={props.size || 20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M 12,2 L 19,5 L 22,12 L 19,19 L 12,22 L 5,19 L 2,12 L 5,5 Z" />
    </svg>
);

// Unified shape tools: basic shapes, geometric, specialized
const shapeTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    // Basic shapes (formerly standalone toolbar buttons)
    { type: 'rectangle', icon: Square, label: 'Rectangle (R or 2)' },
    { type: 'circle', icon: Circle, label: 'Circle (O or 3)' },
    { type: 'diamond', icon: Diamond, label: 'Diamond (D)' },
    // Geometric shapes
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
    { type: 'hexagon', icon: Hexagon, label: 'Hexagon' },
    { type: 'octagon', icon: Octagon, label: 'Octagon' },
    { type: 'parallelogram', icon: Square, label: 'Parallelogram' },
    { type: 'star', icon: Star, label: 'Star' },
    { type: 'polygon', icon: Pentagon, label: 'Polygon (Parametric)' },
    { type: 'cloud', icon: Cloud, label: 'Cloud' },
    { type: 'heart', icon: Heart, label: 'Heart' },
    { type: 'cross', icon: X, label: 'Cross (X)' },
    { type: 'checkmark', icon: Check, label: 'Checkmark' },
    { type: 'arrowLeft', icon: ArrowLeft, label: 'Arrow Left' },
    { type: 'arrowRight', icon: ArrowRight, label: 'Arrow Right' },
    { type: 'arrowUp', icon: ArrowUp, label: 'Arrow Up' },
    { type: 'arrowDown', icon: ArrowDown, label: 'Arrow Down' },
    // Math/geometry shapes (formerly MathToolGroup)
    { type: 'trapezoid', icon: TrapezoidIcon, label: 'Trapezoid' },
    { type: 'rightTriangle', icon: RightTriangleIcon, label: 'Right-Angle Triangle' },
    { type: 'pentagon', icon: Pentagon, label: 'Pentagon' },
    { type: 'septagon', icon: SeptagonIcon, label: 'Septagon (Heptagon)' },
    // Specialized shapes
    { type: 'database', icon: Database, label: 'Database' },
    { type: 'document', icon: FileText, label: 'Document' },
    { type: 'predefinedProcess', icon: Columns, label: 'Predefined Process' },
    { type: 'internalStorage', icon: Layers, label: 'Internal Storage' },
    { type: 'capsule', icon: Pill, label: 'Capsule (Node)' },
    { type: 'stickyNote', icon: StickyNote, label: 'Sticky Note' },
    { type: 'callout', icon: MessageSquare, label: 'Callout (Thought)' },
    { type: 'speechBubble', icon: MessageCircle, label: 'Speech Bubble' },
    { type: 'burst', icon: Zap, label: 'Burst (Impact)' },
    { type: 'ribbon', icon: Bookmark, label: 'Ribbon (Title)' },
    { type: 'bracketLeft', icon: ChevronLeft, label: 'Left Bracket' },
    { type: 'bracketRight', icon: ChevronRight, label: 'Right Bracket' },
];

const ShapeToolGroup: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    let buttonRef: HTMLButtonElement | undefined;
    let dropdownRef: HTMLDivElement | undefined;

    createEffect(() => {
        if (isOpen()) {
            const handler = (e: MouseEvent) => {
                const target = e.target as Node;
                if (buttonRef?.contains(target) || dropdownRef?.contains(target)) return;
                setIsOpen(false);
            };
            document.addEventListener('pointerdown', handler);
            onCleanup(() => document.removeEventListener('pointerdown', handler));
        }
    });

    const getActiveShapeTool = () => {
        // Prefer the currently active tool's icon when it's a shape in this group
        const fromActiveTool = shapeTools.find(t => t.type === store.selectedTool);
        if (fromActiveTool) return fromActiveTool;
        // Otherwise show the last remembered shape type
        const found = shapeTools.find(t => t.type === store.selectedShapeType);
        return found || shapeTools[0];
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastClickTime = 0;
    let lastClickType: string | null = null;

    const handleToolClick = (type: ElementType) => {
        const now = Date.now();
        const isDouble = type === lastClickType && now - lastClickTime < 400;
        lastClickTime = now;
        lastClickType = type;
        if (clickTimeout) clearTimeout(clickTimeout);
        if (isDouble) {
            clickTimeout = null;
            setSelectedShapeType(type as any);
            setSelectedTool(type);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setSelectedShapeType(type as any);
                setSelectedTool(type);
                setIsOpen(false);
                clickTimeout = null;
            }, 300);
        }
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isActive()) {
            setSelectedTool(store.selectedShapeType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveShapeTool();
    const isActive = () => shapeTools.some(t => t.type === store.selectedTool);

    const getDropdownPosition = () => {
        if (!buttonRef) return {};
        const rect = buttonRef.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            return { bottom: `${window.innerHeight - rect.top + 8}px`, left: '50%', transform: 'translateX(-50%)' };
        }
        return { top: `${rect.bottom + 4}px`, left: `${rect.left}px` };
    };

    return (
        <div class="pen-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isActive() ? 'active' : ''} ${isActive() && store.toolLocked ? 'tool-locked' : ''}`}
                on:click={toggleMenu}
                onContextMenu={handleRightClick}
                title={`${activeTool().label} (Click for more)`}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = activeTool().icon;
                        return <Icon size={18} />;
                    })()}
                    <ChevronDown
                        size={9}
                        class="submenu-indicator"
                    />
                </div>
            </button>

            <Show when={isOpen()}>
                <Portal>
                    <div ref={dropdownRef} class="pen-tool-dropdown" style={getDropdownPosition()}>
                        {shapeTools.map((tool) => (
                            <button
                                class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                on:click={() => handleToolClick(tool.type)}
                                title={`${tool.label} (double-click to lock)`}
                            >
                                <tool.icon size={16} />
                            </button>
                        ))}
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default ShapeToolGroup;
