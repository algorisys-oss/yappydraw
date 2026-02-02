import { type Component, createSignal, Show, For, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedPenType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import { Pen, Brush, ChevronDown } from "lucide-solid";
import "./pen-tool-group.css";

export type PenType = 'fineliner' | 'inkbrush' | 'marker';

// Custom Marker Icon
const CustomMarkerIcon: Component<{ size?: number }> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.size || 24}
        height={props.size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-marker"
    >
        <path d="M12 2l7 7-9 9-4-4L12 2z"></path>
        <path d="M7 13l-1.5 1.5"></path>
    </svg>
);

const penTools: { type: PenType; icon: Component<{ size?: number }>; label: string }[] = [
    { type: 'fineliner', icon: Pen, label: 'Fine Liner (P or 8)' },
    { type: 'inkbrush', icon: Brush, label: 'Ink Brush' },
    { type: 'marker', icon: CustomMarkerIcon, label: 'Marker' }, // Updated to use custom marker icon
];

const PenToolGroup: Component = () => {
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

    const getCurrentPenTool = () => {
        return penTools.find(t => t.type === store.selectedPenType) || penTools[0];
    };

    const isPenToolActive = () => {
        return ['fineliner', 'inkbrush', 'marker'].includes(store.selectedTool);
    };

    const handleSelectPen = (penType: PenType) => {
        setSelectedPenType(penType);
        setSelectedTool(penType as ElementType);
        setIsOpen(false);
    };

    const handleRightClick = (e: MouseEvent) => {
        e.preventDefault();
        store.showPropertyPanel ? () => { } : setSelectedTool(store.selectedTool); // Dummy for context, actual trigger:
        setStore("showPropertyPanel", true);
        setStore("isPropertyPanelMinimized", false);
    };

    const toggleMenu = () => {
        if (!isPenToolActive()) {
            setSelectedTool(store.selectedPenType as ElementType);
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
        <div class="pen-tool-group">
            <button
                ref={buttonRef}
                class={`toolbar-btn ${isPenToolActive() ? 'active' : ''}`}
                onClick={toggleMenu}
                onContextMenu={handleRightClick}
                title={`${getCurrentPenTool().label} (P or 8 - Click for more)`}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = getCurrentPenTool().icon;
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
                        <For each={penTools}>
                            {(tool) => (
                                <button
                                    class={`dropdown-item ${store.selectedPenType === tool.type ? 'active' : ''}`}
                                    on:click={() => handleSelectPen(tool.type)}
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

export default PenToolGroup;
