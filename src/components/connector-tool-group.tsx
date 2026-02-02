import { type Component, createSignal, Show, For, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedConnectorType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import { MoveUpRight, Minus, Spline, Waypoints, ChevronDown } from "lucide-solid";
import "./connector-tool-group.css";

export type ConnectorType = 'arrow' | 'line' | 'bezier' | 'polyline';

const connectorTools: { type: ConnectorType; icon: Component<{ size?: number }>; label: string }[] = [
    { type: 'line', icon: Minus, label: 'Line (L or 4)' },
    { type: 'arrow', icon: MoveUpRight, label: 'Arrow (A or 5)' },
    { type: 'bezier', icon: Spline, label: 'Bezier Curve (B or 0)' },
    { type: 'polyline', icon: Waypoints, label: 'Polyline (click to place points)' },
];

const ConnectorToolGroup: Component = () => {
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

    const getCurrentTool = () => {
        return connectorTools.find(t => t.type === store.selectedConnectorType) || connectorTools[0];
    };

    const isConnectorToolActive = () => {
        return ['arrow', 'line', 'bezier', 'polyline'].includes(store.selectedTool);
    };

    const handleSelectConnector = (connectorType: ConnectorType) => {
        setSelectedConnectorType(connectorType);
        setSelectedTool(connectorType as ElementType);
        setIsOpen(false);
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isConnectorToolActive()) {
            setSelectedTool(store.selectedConnectorType as ElementType);
        }
        setIsOpen(!isOpen());
    };

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
        <div class="connector-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isConnectorToolActive() ? 'active' : ''}`}
                onClick={toggleMenu}
                onContextMenu={handleRightClick}
                title={`${getCurrentTool().label} (Click for more)`}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = getCurrentTool().icon;
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
                    <div ref={dropdownRef} class="connector-tool-dropdown" style={getDropdownPosition()}>
                        <For each={connectorTools}>
                            {(tool) => (
                                <button
                                    class={`dropdown-item ${store.selectedConnectorType === tool.type ? 'active' : ''}`}
                                    on:click={() => handleSelectConnector(tool.type)}
                                    title={tool.label}
                                >
                                    <tool.icon size={18} />
                                </button>
                            )}
                        </For>
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default ConnectorToolGroup;
