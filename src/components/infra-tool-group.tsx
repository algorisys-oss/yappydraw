import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedInfraType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    Server, Shield, User, Zap, Router, Globe, Shuffle, Rows, ChevronDown, Database
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

const infraTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'database', icon: Database, label: 'Database' },
    { type: 'server', icon: Server, label: 'Server' },
    { type: 'loadBalancer', icon: Shuffle, label: 'Load Balancer' },
    { type: 'firewall', icon: Shield, label: 'Firewall' },
    { type: 'user', icon: User, label: 'User / Client' },
    { type: 'messageQueue', icon: Rows, label: 'Message Queue' },
    { type: 'lambda', icon: Zap, label: 'Lambda / Function' },
    { type: 'router', icon: Router, label: 'Router' },
    { type: 'browser', icon: Globe, label: 'Browser / Web' },
];

const InfraToolGroup: Component = () => {
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
        const found = infraTools.find(t => t.type === store.selectedInfraType);
        return found || infraTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedInfraType(type as any);
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
            setSelectedTool(store.selectedInfraType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => infraTools.some(t => t.type === store.selectedTool);

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
                        {infraTools.map((tool) => (
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

export default InfraToolGroup;
