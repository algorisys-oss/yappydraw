import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedUmlType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Layout, Disc, User, Circle, FileText, Folder, ChevronDown,
    Component as ComponentIcon, RectangleHorizontal, ArrowDown, Frame,
    ChevronRight, ChevronLeft, CircleDot, CircleDashed
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse existing styles

const umlTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'umlClass', icon: Layout, label: 'Class' },
    { type: 'umlInterface', icon: Disc, label: 'Interface' },
    { type: 'umlActor', icon: User, label: 'Actor' },
    { type: 'umlUseCase', icon: Circle, label: 'Use Case' },
    { type: 'umlNote', icon: FileText, label: 'Note' },
    { type: 'umlPackage', icon: Folder, label: 'Package' },
    { type: 'umlComponent', icon: ComponentIcon, label: 'Component' },
    { type: 'umlState', icon: RectangleHorizontal, label: 'State' },
    { type: 'umlLifeline', icon: ArrowDown, label: 'Lifeline' },
    { type: 'umlFragment', icon: Frame, label: 'Fragment' },
    { type: 'umlSignalSend', icon: ChevronRight, label: 'Signal Send' },
    { type: 'umlSignalReceive', icon: ChevronLeft, label: 'Signal Receive' },
    { type: 'umlProvidedInterface', icon: CircleDot, label: 'Provided' },
    { type: 'umlRequiredInterface', icon: CircleDashed, label: 'Required' },
];

const UmlToolGroup: Component = () => {
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

    const getActiveUmlTool = () => {
        const found = umlTools.find(t => t.type === store.selectedUmlType);
        return found || umlTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedUmlType(type as any);
        setSelectedTool(type);
        setIsOpen(false);
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isActive()) {
            setSelectedTool(store.selectedUmlType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveUmlTool();
    const isActive = () => umlTools.some(t => t.type === store.selectedTool);

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
                title={`UML: ${activeTool().label}`}
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
                        {umlTools.map((tool) => (
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

export default UmlToolGroup;
