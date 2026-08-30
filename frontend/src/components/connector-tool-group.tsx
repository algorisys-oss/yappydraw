import { type Component, createSignal, Show, For, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { createFlyoutPlacement } from "../utils/tool-flyout";
import { store, setSelectedTool, setSelectedConnectorType, setToolLocked, showPropertiesPanel } from "../store/app-store";
import type { ElementType } from "../types";
import { MoveUpRight, Minus, Spline, Waypoints, CornerDownRight, ChevronDown } from "lucide-solid";
import "./connector-tool-group.css";

export type ConnectorType = 'arrow' | 'line' | 'bezier' | 'elbow' | 'polyline';

const connectorTools: { type: ConnectorType; icon: Component<{ size?: number }>; label: string }[] = [
    { type: 'line', icon: Minus, label: 'Line (L or 6)' },
    { type: 'arrow', icon: MoveUpRight, label: 'Arrow (A or 5)' },
    { type: 'elbow', icon: CornerDownRight, label: 'Elbow Connector' },
    { type: 'bezier', icon: Spline, label: 'Bezier Curve (B)' },
    { type: 'polyline', icon: Waypoints, label: 'Polyline (click to place points)' },
];

const ConnectorToolGroup: Component = () => {
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

    const getCurrentTool = () => {
        return connectorTools.find(t => t.type === store.selectedConnectorType) || connectorTools[0];
    };

    const isConnectorToolActive = () => {
        return ['arrow', 'line', 'bezier', 'elbow', 'polyline'].includes(store.selectedTool);
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastClickTime = 0;
    let lastClickType: string | null = null;

    const handleSelectConnector = (connectorType: ConnectorType) => {
        const now = Date.now();
        const isDouble = connectorType === lastClickType && now - lastClickTime < 400;
        lastClickTime = now;
        lastClickType = connectorType;
        if (clickTimeout) clearTimeout(clickTimeout);
        if (isDouble) {
            clickTimeout = null;
            setSelectedConnectorType(connectorType);
            setSelectedTool(connectorType as ElementType);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setSelectedConnectorType(connectorType);
                setSelectedTool(connectorType as ElementType);
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
        if (!isConnectorToolActive()) {
            setSelectedTool(store.selectedConnectorType as ElementType);
        }
        setIsOpen(!isOpen());
    };


    return (
        <div class="connector-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isConnectorToolActive() ? 'active' : ''} ${isConnectorToolActive() && store.toolLocked ? 'tool-locked' : ''}`}
                on:click={toggleMenu}
                onContextMenu={handleRightClick}
                onDblClick={handleRightClick}
                title={`${getCurrentTool().label} (A or 5 - Click for more)`}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = getCurrentTool().icon;
                        return <Icon size={18} />;
                    })()}
                    <ChevronDown
                        size={9}
                        class="submenu-indicator"
                    />
                </div>
                <span class="hotkey-badge">5</span>
            </button>

            <Show when={isOpen()}>
                <Portal>
                    <div ref={el => { dropdownRef = el; flyout.attach(el); }} class="connector-tool-dropdown" style={flyout.style()}>
                        <For each={connectorTools}>
                            {(tool) => (
                                <button
                                    class={`dropdown-item ${store.selectedConnectorType === tool.type ? 'active' : ''}`}
                                    on:click={() => handleSelectConnector(tool.type)}
                                    title={`${tool.label} (double-click to lock)`}
                                >
                                    <tool.icon size={16} />
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
