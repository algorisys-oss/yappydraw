import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedUmlType, setToolLocked, showPropertiesPanel } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Layout, Disc, User, Circle, FileText, Folder, ChevronDown, List,
    Component as ComponentIcon, RectangleHorizontal, ArrowDown, Frame,
    ChevronRight, ChevronLeft, CircleDot, CircleDashed
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse existing styles

const umlTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'umlClass', icon: Layout, label: 'Class' },
    { type: 'umlInterface', icon: Disc, label: 'Interface' },
    { type: 'umlEnum', icon: List, label: 'Enum' },
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
            setSelectedUmlType(type as any);
            setSelectedTool(type);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setSelectedUmlType(type as any);
                setSelectedTool(type);
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
                onDblClick={handleRightClick}
                title={`UML: ${activeTool().label}`}
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
                        {umlTools.map((tool) => (
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

export default UmlToolGroup;
