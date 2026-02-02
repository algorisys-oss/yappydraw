import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedCloudInfraType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

// Custom SVG Icons for Cloud & Container Infrastructure shapes

const KubernetesIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3.5" />
        {/* 7 spokes */}
        <line x1="12" y1="8.5" x2="12" y2="3.5" />
        <line x1="15" y1="9.5" x2="18.5" y2="6" />
        <line x1="15.5" y1="12" x2="20" y2="12" />
        <line x1="15" y1="14.5" x2="18.5" y2="18" />
        <line x1="12" y1="15.5" x2="12" y2="20.5" />
        <line x1="9" y1="14.5" x2="5.5" y2="18" />
        <line x1="8.5" y1="12" x2="4" y2="12" />
    </svg>
);

const ContainerIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="5" y1="8.5" x2="19" y2="8.5" />
        <line x1="5" y1="13.5" x2="19" y2="13.5" />
        <line x1="5" y1="18.5" x2="19" y2="18.5" />
    </svg>
);

const ApiGatewayIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="7" y1="12" x2="14" y2="12" />
        <polyline points="15,9 18,12 15,15" />
    </svg>
);

const CdnIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <ellipse cx="12" cy="12" rx="4" ry="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
);

const StorageBlobIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M 4,5 L 4,19" />
        <path d="M 20,5 L 20,19" />
        <ellipse cx="12" cy="19" rx="8" ry="3" />
    </svg>
);

const EventBusIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="10" width="20" height="4" rx="2" />
        <line x1="7" y1="4" x2="7" y2="10" />
        <line x1="7" y1="14" x2="7" y2="20" />
        <line x1="12" y1="4" x2="12" y2="10" />
        <line x1="12" y1="14" x2="12" y2="20" />
        <line x1="17" y1="4" x2="17" y2="10" />
        <line x1="17" y1="14" x2="17" y2="20" />
    </svg>
);

const MicroserviceIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {/* Hexagon */}
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
        {/* Small gear */}
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="9" x2="12" y2="7.5" />
        <line x1="14.6" y1="10.5" x2="15.9" y2="9.7" />
        <line x1="14.6" y1="13.5" x2="15.9" y2="14.3" />
        <line x1="12" y1="15" x2="12" y2="16.5" />
        <line x1="9.4" y1="13.5" x2="8.1" y2="14.3" />
        <line x1="9.4" y1="10.5" x2="8.1" y2="9.7" />
    </svg>
);

const ShieldIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12,2 L 21,2 L 21,13 Q 21,20 12,22 Q 3,20 3,13 L 3,2 Z" />
        <polyline points="8,12 11,15 16,9" />
    </svg>
);

const cloudInfraTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'kubernetes', icon: KubernetesIcon, label: 'Kubernetes' },
    { type: 'container', icon: ContainerIcon, label: 'Container' },
    { type: 'apiGateway', icon: ApiGatewayIcon, label: 'API Gateway' },
    { type: 'cdn', icon: CdnIcon, label: 'CDN (Globe)' },
    { type: 'storageBlob', icon: StorageBlobIcon, label: 'Storage Blob' },
    { type: 'eventBus', icon: EventBusIcon, label: 'Event Bus' },
    { type: 'microservice', icon: MicroserviceIcon, label: 'Microservice' },
    { type: 'shield', icon: ShieldIcon, label: 'Shield (Security)' },
];

const CloudInfraToolGroup: Component = () => {
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
        const found = cloudInfraTools.find(t => t.type === store.selectedCloudInfraType);
        return found || cloudInfraTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedCloudInfraType(type as any);
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
            setSelectedTool(store.selectedCloudInfraType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => cloudInfraTools.some(t => t.type === store.selectedTool);

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
                        {cloudInfraTools.map((tool) => (
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

export default CloudInfraToolGroup;
