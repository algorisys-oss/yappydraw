import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedDsType, setStore, setToolLocked } from "../store/app-store";
import type { ElementType } from "../types";
import {
    LayoutList, Layers, ArrowRightLeft, Link, GitFork, Hash, ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

const dsTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'dsArray', icon: LayoutList, label: 'Array' },
    { type: 'dsStack', icon: Layers, label: 'Stack' },
    { type: 'dsQueue', icon: ArrowRightLeft, label: 'Queue' },
    { type: 'dsLinkedList', icon: Link, label: 'Linked List' },
    { type: 'dsBinaryTree', icon: GitFork, label: 'Binary Tree' },
    { type: 'dsHashTable', icon: Hash, label: 'Hash Table' },
];

const DsToolGroup: Component = () => {
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
        const found = dsTools.find(t => t.type === store.selectedDsType);
        return found || dsTools[0];
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleToolClick = (type: ElementType) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            setSelectedDsType(type as any);
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
        setSelectedDsType(type as any);
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
            setSelectedTool(store.selectedDsType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => dsTools.some(t => t.type === store.selectedTool);

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
                        {dsTools.map((tool) => (
                            <button
                                class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                on:click={() => handleToolClick(tool.type)}
                                on:dblclick={() => handleToolDoubleClick(tool.type)}
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

export default DsToolGroup;
