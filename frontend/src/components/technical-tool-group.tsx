import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { createFlyoutPlacement } from "../utils/tool-flyout";
import { store, setSelectedTool, setSelectedTechnicalType, setToolLocked, showPropertiesPanel } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Box, Database, ChevronDown, Binary, HardDrive, Circle, CircleDot, Minus, GripVertical, Layers, Cuboid, Package, PackageOpen, Code
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

const technicalTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'dfdProcess', icon: Binary, label: 'DFD Process' },
    { type: 'dfdDataStore', icon: HardDrive, label: 'DFD Data Store' },
    { type: 'isometricCube', icon: Package, label: 'Isometric Cube' },
    { type: 'solidBlock', icon: Box, label: 'Solid Block' },
    { type: 'perspectiveBlock', icon: Cuboid, label: 'Perspective Block' },
    { type: 'openBox', icon: PackageOpen, label: 'Open Box' },
    { type: 'cylinder', icon: Database, label: 'Cylinder' },
    { type: 'stateStart', icon: Circle, label: 'Initial State' },
    { type: 'stateEnd', icon: CircleDot, label: 'Final State' },
    { type: 'stateSync', icon: Minus, label: 'Sync Bar' },
    { type: 'activationBar', icon: GripVertical, label: 'Activation Bar' },
    { type: 'externalEntity', icon: Layers, label: 'External Entity' },
    { type: 'codeBlock', icon: Code, label: 'Code Block' },
];

const TechnicalToolGroup: Component = () => {
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

    const getActiveTool = () => {
        const found = technicalTools.find(t => t.type === store.selectedTechnicalType);
        return found || technicalTools[0];
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
            setSelectedTechnicalType(type as any);
            setSelectedTool(type);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setSelectedTechnicalType(type as any);
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
            setSelectedTool(store.selectedTechnicalType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => technicalTools.some(t => t.type === store.selectedTool);


    return (
        <div class="pen-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isActive() ? 'active' : ''} ${isActive() && store.toolLocked ? 'tool-locked' : ''}`}
                on:click={toggleMenu}
                onContextMenu={handleRightClick}
                onDblClick={handleRightClick}
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
                    <div ref={el => { dropdownRef = el; flyout.attach(el); }} class="pen-tool-dropdown" style={flyout.style()}>
                        {technicalTools.map((tool) => (
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

export default TechnicalToolGroup;
