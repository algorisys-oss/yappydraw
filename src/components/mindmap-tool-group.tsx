import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Brain, Leaf, Share2, ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse styling

// Mindmap-specific tools
const mindmapTools: { type: ElementType | 'organicBranch' | 'mindmapNode'; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'organicBranch', icon: Leaf, label: 'Organic Branch' },
    // We can alias existing shapes for semantic meaning in this group
    { type: 'cloud', icon: Brain, label: 'Central Topic (Cloud)' },
    { type: 'circle', icon: Share2, label: 'Topic (Circle)' },
];

const MindmapToolGroup: Component = () => {
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

    // Determines which icon to show on the main button
    const getActiveMindmapTool = () => {
        // If the current tool is in our list, show it
        const current = mindmapTools.find(t => t.type === store.selectedTool);
        if (current) return current;

        // Otherwise show the last selected one from this group, or default
        const lastSelected = mindmapTools.find(t => t.type === store.selectedShapeType);
        return lastSelected || mindmapTools[0];
    };

    const handleToolClick = (type: string) => {
        setSelectedTool(type as ElementType);
        setIsOpen(false);
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isActive()) {
            setSelectedTool(getActiveMindmapTool().type as ElementType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveMindmapTool();
    const isActive = () => mindmapTools.some(t => t.type === store.selectedTool);

    const getDropdownPosition = () => {
        if (!buttonRef) return {};
        const rect = buttonRef.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            return { top: `${rect.bottom + 8}px`, left: '50%', transform: 'translateX(-50%)' };
        }
        return { top: `${rect.bottom + 4}px`, left: `${rect.left}px` };
    };

    return (
        <div class="pen-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isActive() ? 'active' : ''}`}
                onClick={toggleMenu}
                onContextMenu={handleRightClick}
                title="Mindmap Tools"
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = activeTool().icon;
                        return <Icon size={20} />;
                    })()}
                    <ChevronDown
                        size={10}
                        class="submenu-indicator"
                    />
                </div>
            </button>

            <Show when={isOpen()}>
                <Portal>
                    <div ref={dropdownRef} class="pen-tool-dropdown" style={getDropdownPosition()}>
                        {mindmapTools.map((tool) => (
                            <button
                                class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                on:click={() => handleToolClick(tool.type)}
                                title={tool.label}
                            >
                                <tool.icon size={18} />
                            </button>
                        ))}
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default MindmapToolGroup;
