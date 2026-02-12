import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedBpmnType, setStore, setToolLocked } from "../store/app-store";
import type { ElementType } from "../types";
import { ChevronDown } from "lucide-solid";
import "./pen-tool-group.css";

// ── BPMN SVG Icons ──

const BpmnStartEventIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
    </svg>
);

const BpmnEndEventIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="8" />
    </svg>
);

const BpmnIntermediateEventIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6.5" />
    </svg>
);

const BpmnExclusiveGatewayIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12 2 L 22 12 L 12 22 L 2 12 Z" />
        <line x1="8" y1="8" x2="16" y2="16" />
        <line x1="16" y1="8" x2="8" y2="16" />
    </svg>
);

const BpmnParallelGatewayIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12 2 L 22 12 L 12 22 L 2 12 Z" />
        <line x1="12" y1="7" x2="12" y2="17" />
        <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
);

const BpmnInclusiveGatewayIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12 2 L 22 12 L 12 22 L 2 12 Z" />
        <circle cx="12" cy="12" r="4" stroke-width="2" />
    </svg>
);

const BpmnTaskIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
);

const BpmnSubProcessIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <rect x="10" y="16" width="4" height="3" rx="0.5" />
        <line x1="12" y1="16.8" x2="12" y2="18.2" />
        <line x1="10.8" y1="17.5" x2="13.2" y2="17.5" />
    </svg>
);

const BpmnCallActivityIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="6" width="16" height="12" rx="2" />
    </svg>
);

const BpmnDataObjectIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 6 2 L 16 2 L 20 6 L 20 22 L 6 22 Z" />
        <path d="M 16 2 L 16 6 L 20 6" />
    </svg>
);

const BpmnAnnotationIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 10 4 L 4 4 L 4 20 L 10 20" />
        <line x1="8" y1="9" x2="18" y2="9" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="15" x2="14" y2="15" />
    </svg>
);

const BpmnPoolIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="5" width="20" height="14" />
        <line x1="6" y1="5" x2="6" y2="19" />
    </svg>
);

const BpmnEventGatewayIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12 2 L 22 12 L 12 22 L 2 12 Z" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="3.5" />
    </svg>
);

const BpmnDataStoreIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M 4 6 L 4 18" />
        <path d="M 20 6 L 20 18" />
        <path d="M 4 18 Q 4 21 12 21 Q 20 21 20 18" />
    </svg>
);

const BpmnGroupIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 2">
        <rect x="3" y="4" width="18" height="16" rx="3" />
    </svg>
);

const bpmnTools: { type: ElementType; icon: Component<{ size?: number }>; label: string }[] = [
    { type: 'bpmnStartEvent', icon: BpmnStartEventIcon, label: 'Start Event' },
    { type: 'bpmnEndEvent', icon: BpmnEndEventIcon, label: 'End Event' },
    { type: 'bpmnIntermediateEvent', icon: BpmnIntermediateEventIcon, label: 'Intermediate Event' },
    { type: 'bpmnExclusiveGateway', icon: BpmnExclusiveGatewayIcon, label: 'Exclusive Gateway (XOR)' },
    { type: 'bpmnParallelGateway', icon: BpmnParallelGatewayIcon, label: 'Parallel Gateway (AND)' },
    { type: 'bpmnInclusiveGateway', icon: BpmnInclusiveGatewayIcon, label: 'Inclusive Gateway (OR)' },
    { type: 'bpmnTask', icon: BpmnTaskIcon, label: 'Task' },
    { type: 'bpmnSubProcess', icon: BpmnSubProcessIcon, label: 'Sub-Process' },
    { type: 'bpmnCallActivity', icon: BpmnCallActivityIcon, label: 'Call Activity' },
    { type: 'bpmnDataObject', icon: BpmnDataObjectIcon, label: 'Data Object' },
    { type: 'bpmnAnnotation', icon: BpmnAnnotationIcon, label: 'Annotation' },
    { type: 'bpmnPool', icon: BpmnPoolIcon, label: 'Pool / Lane' },
    { type: 'bpmnEventGateway', icon: BpmnEventGatewayIcon, label: 'Event-based Gateway' },
    { type: 'bpmnDataStore', icon: BpmnDataStoreIcon, label: 'Data Store' },
    { type: 'bpmnGroup', icon: BpmnGroupIcon, label: 'Group' },
];

const BpmnToolGroup: Component = () => {
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
        const found = bpmnTools.find(t => t.type === store.selectedBpmnType);
        return found || bpmnTools[0];
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleToolClick = (type: ElementType) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            setSelectedBpmnType(type as any);
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
        setSelectedBpmnType(type as any);
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
            setSelectedTool(store.selectedBpmnType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => bpmnTools.some(t => t.type === store.selectedTool);

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
                title={activeTool().label}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = activeTool().icon;
                        return <Icon size={18} />;
                    })()}
                    <ChevronDown size={9} class="submenu-indicator" />
                </div>
            </button>

            <Show when={isOpen()}>
                <Portal>
                    <div ref={dropdownRef} class="pen-tool-dropdown" style={getDropdownPosition()}>
                        {bpmnTools.map((tool) => (
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

export default BpmnToolGroup;
