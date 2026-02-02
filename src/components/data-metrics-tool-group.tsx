import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedDataMetricsType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

// Custom SVG Icons for Data & Metrics shapes

const BarChartIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="12" width="4" height="9" />
        <rect x="10" y="6" width="4" height="15" />
        <rect x="17" y="9" width="4" height="12" />
        <line x1="2" y1="22" x2="22" y2="22" />
    </svg>
);

const PieChartIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="12" x2="12" y2="2" />
        <line x1="12" y1="12" x2="20.5" y2="7.5" />
        <line x1="12" y1="12" x2="5" y2="19" />
    </svg>
);

const TrendUpIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3,17 9,11 13,14 21,6" />
        <polyline points="16,6 21,6 21,11" />
    </svg>
);

const TrendDownIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3,7 9,13 13,10 21,18" />
        <polyline points="16,18 21,18 21,13" />
    </svg>
);

const FunnelIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="2,3 22,3 15,21 9,21" />
        <line x1="4.5" y1="9" x2="19.5" y2="9" />
        <line x1="7" y1="15" x2="17" y2="15" />
    </svg>
);

const GaugeIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 2,18 A 10,10 0 0,1 22,18" />
        <line x1="12" y1="18" x2="8" y2="8" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
);

const TableIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);

const dataMetricsTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'barChart', icon: BarChartIcon, label: 'Bar Chart' },
    { type: 'pieChart', icon: PieChartIcon, label: 'Pie Chart' },
    { type: 'trendUp', icon: TrendUpIcon, label: 'Trend Up' },
    { type: 'trendDown', icon: TrendDownIcon, label: 'Trend Down' },
    { type: 'funnel', icon: FunnelIcon, label: 'Funnel' },
    { type: 'gauge', icon: GaugeIcon, label: 'Gauge' },
    { type: 'table', icon: TableIcon, label: 'Table' },
];

const DataMetricsToolGroup: Component = () => {
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
        const found = dataMetricsTools.find(t => t.type === store.selectedDataMetricsType);
        return found || dataMetricsTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedDataMetricsType(type as any);
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
            setSelectedTool(store.selectedDataMetricsType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => dataMetricsTools.some(t => t.type === store.selectedTool);

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
                        {dataMetricsTools.map((tool) => (
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

export default DataMetricsToolGroup;
