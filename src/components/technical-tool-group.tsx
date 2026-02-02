import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedTechnicalType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Box, Database, ChevronDown, Binary, HardDrive, Circle, CircleDot, Minus, GripVertical, Layers, Cuboid, Package
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

const technicalTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'dfdProcess', icon: Binary, label: 'DFD Process' },
    { type: 'dfdDataStore', icon: HardDrive, label: 'DFD Data Store' },
    { type: 'isometricCube', icon: Package, label: 'Isometric Cube' },
    { type: 'solidBlock', icon: Box, label: 'Solid Block' },
    { type: 'perspectiveBlock', icon: Cuboid, label: 'Perspective Block' },
    { type: 'cylinder', icon: Database, label: 'Cylinder' },
    { type: 'stateStart', icon: Circle, label: 'Initial State' },
    { type: 'stateEnd', icon: CircleDot, label: 'Final State' },
    { type: 'stateSync', icon: Minus, label: 'Sync Bar' },
    { type: 'activationBar', icon: GripVertical, label: 'Activation Bar' },
    { type: 'externalEntity', icon: Layers, label: 'External Entity' },
];

const TechnicalToolGroup: Component = () => {
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
        const found = technicalTools.find(t => t.type === store.selectedTechnicalType);
        return found || technicalTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedTechnicalType(type as any);
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
            setSelectedTool(store.selectedTechnicalType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => technicalTools.some(t => t.type === store.selectedTool);

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
                title={activeTool().label}
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
                        {technicalTools.map((tool) => (
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

export default TechnicalToolGroup;
