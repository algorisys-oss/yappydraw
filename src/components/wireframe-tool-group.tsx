import { type Component, createSignal, Show, createEffect, onCleanup, For } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedWireframeType, setStore, setToolLocked } from "../store/app-store";
import type { ElementType } from "../types";
import { UI_SHAPE_DEFS, type UIShapeCategory } from "../config/ui-shape-defs";
import {
    ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

// Derive tool list from config
const allUITypes = UI_SHAPE_DEFS.map(d => d.type as ElementType);

const categoryOrder: UIShapeCategory[] = ['container', 'form', 'navigation', 'feedback'];
const categoryLabels: Record<UIShapeCategory, string> = {
    container: 'Containers',
    form: 'Form',
    navigation: 'Navigation',
    feedback: 'Feedback',
};
const groupedTools = categoryOrder
    .map(cat => ({
        category: cat,
        label: categoryLabels[cat],
        tools: UI_SHAPE_DEFS.filter(d => d.category === cat),
    }))
    .filter(g => g.tools.length > 0);

const WireframeToolGroup: Component = () => {
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

    const getActiveTool = () => {
        const found = UI_SHAPE_DEFS.find(t => t.type === store.selectedWireframeType);
        return found || UI_SHAPE_DEFS[0];
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleToolClick = (type: ElementType) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            setSelectedWireframeType(type);
            setSelectedTool(type);
            setIsOpen(false);
            clickTimeout = null;
        }, 200);
    };

    const handleToolDoubleClick = (type: ElementType) => {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }
        setSelectedWireframeType(type);
        setSelectedTool(type);
        setToolLocked(true);
        setIsOpen(false);
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isActive()) {
            setSelectedTool(store.selectedWireframeType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => allUITypes.includes(store.selectedTool as any);

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
                class={`toolbar-btn ${isActive() ? 'active' : ''} ${isActive() && store.toolLocked ? 'tool-locked' : ''}`}
                onClick={toggleMenu}
                onContextMenu={handleRightClick}
                title={activeTool().label}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = activeTool().toolbarIcon;
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
                    <div ref={dropdownRef} class="pen-tool-dropdown" style={{
                        ...getDropdownPosition(),
                        display: 'flex',
                        'flex-direction': 'column',
                        'grid-template-columns': 'none',
                        'max-height': '400px',
                        'overflow-y': 'auto',
                        width: '280px',
                        gap: '2px',
                    }}>
                        <For each={groupedTools}>
                            {(group) => (
                                <>
                                    <div style={{
                                        'font-size': '9px',
                                        'text-transform': 'uppercase',
                                        'letter-spacing': '0.05em',
                                        'opacity': 0.5,
                                        'padding': '6px 8px 2px',
                                        'pointer-events': 'none',
                                    }}>
                                        {group.label}
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        'grid-template-columns': 'repeat(6, 1fr)',
                                        gap: '2px',
                                        padding: '0 4px 4px',
                                    }}>
                                        <For each={group.tools}>
                                            {(tool) => (
                                                <button
                                                    class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                                    on:click={() => handleToolClick(tool.type as ElementType)}
                                                    on:dblclick={() => handleToolDoubleClick(tool.type as ElementType)}
                                                    title={`${tool.label} (double-click to lock)`}
                                                    style={{ width: '100%' }}
                                                >
                                                    <tool.toolbarIcon size={18} />
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </>
                            )}
                        </For>
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default WireframeToolGroup;
