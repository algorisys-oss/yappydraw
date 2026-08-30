import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { createFlyoutPlacement } from "../utils/tool-flyout";
import { store, setSelectedTool, setToolLocked, showPropertiesPanel } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Brain, Leaf, ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse styling

// Mindmap-specific tools
const mindmapTools: { type: ElementType | 'organicBranch' | 'mindmapNode'; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'organicBranch', icon: Leaf, label: 'Organic Branch' },
    { type: 'cloud', icon: Brain, label: 'Central Topic (Cloud)' },
];

const MindmapToolGroup: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    let buttonRef: HTMLButtonElement | undefined;
    let dropdownRef: HTMLDivElement | undefined;
    const flyout = createFlyoutPlacement(() => buttonRef);

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

    // Determines which icon to show on the main button
    const getActiveMindmapTool = () => {
        // If the current tool is in our list, show it
        const current = mindmapTools.find(t => t.type === store.selectedTool);
        if (current) return current;

        // Otherwise show the last selected one from this group, or default
        const lastSelected = mindmapTools.find(t => t.type === store.selectedShapeType);
        return lastSelected || mindmapTools[0];
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastClickTime = 0;
    let lastClickType: string | null = null;

    const handleToolClick = (type: string) => {
        const now = Date.now();
        const isDouble = type === lastClickType && now - lastClickTime < 400;
        lastClickTime = now;
        lastClickType = type;
        if (clickTimeout) clearTimeout(clickTimeout);
        if (isDouble) {
            clickTimeout = null;
            setSelectedTool(type as ElementType);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setSelectedTool(type as ElementType);
                setIsOpen(false);
                clickTimeout = null;
            }, 300);
        }
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        showPropertiesPanel();
    };

    const toggleMenu = () => {
        if (!isActive()) {
            setSelectedTool(getActiveMindmapTool().type as ElementType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveMindmapTool();
    const isActive = () => mindmapTools.some(t => t.type === store.selectedTool);


    return (
        <div class="pen-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isActive() ? 'active' : ''} ${isActive() && store.toolLocked ? 'tool-locked' : ''}`}
                on:click={toggleMenu}
                onContextMenu={handleRightClick}
                onDblClick={handleRightClick}
                title="Mindmap Tools"
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
                    <div ref={el => { dropdownRef = el; flyout.attach(el); }} class="pen-tool-dropdown" style={flyout.style()}>
                        {mindmapTools.map((tool) => (
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

export default MindmapToolGroup;
