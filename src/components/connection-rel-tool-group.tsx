import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedConnectionRelType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

const PuzzlePieceIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3h7v3a2 2 0 1 0 4 0V3h7v7h-3a2 2 0 1 0 0 4h3v7H3V3z" />
    </svg>
);

const ChainLinkIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="5" width="12" height="6" rx="3" />
        <rect x="10" y="13" width="12" height="6" rx="3" />
    </svg>
);

const BridgeIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 14 Q12 4 22 14" />
        <line x1="2" y1="16" x2="22" y2="16" />
        <line x1="7" y1="16" x2="7" y2="21" />
        <line x1="12" y1="16" x2="12" y2="21" />
        <line x1="17" y1="16" x2="17" y2="21" />
    </svg>
);

const MagnetIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 3v10a8 8 0 0 0 16 0V3" />
        <path d="M9 3v10a3 3 0 0 0 6 0V3" />
        <line x1="4" y1="7" x2="9" y2="7" />
        <line x1="15" y1="7" x2="20" y2="7" />
    </svg>
);

const ScaleIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="3" x2="12" y2="20" />
        <line x1="4" y1="6" x2="20" y2="6" />
        <path d="M4 6 L2 14" />
        <path d="M4 6 L6 14" />
        <path d="M2 14 A4 2 0 0 0 6 14" />
        <path d="M20 6 L18 14" />
        <path d="M20 6 L22 14" />
        <path d="M18 14 A4 2 0 0 0 22 14" />
        <rect x="8" y="20" width="8" height="2" rx="1" />
    </svg>
);

const SeedlingIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20 Q11 14 12 10" />
        <path d="M12 12 Q6 8 8 4 Q10 6 12 10" />
        <path d="M12 10 Q18 4 16 2 Q14 5 12 8" />
        <path d="M7 20 A5 3 0 0 1 17 20" />
    </svg>
);

const TreeIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="9" r="7" />
        <rect x="10" y="14" width="4" height="8" />
    </svg>
);

const MountainIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11,3 22,21 2,21" />
        <polyline points="11,3 13,7 9,7 11,3" />
    </svg>
);

const connectionRelTools: { type: ElementType; icon: Component<{ size?: number }>; label: string }[] = [
    { type: 'puzzlePiece', icon: PuzzlePieceIcon, label: 'Puzzle Piece' },
    { type: 'chainLink', icon: ChainLinkIcon, label: 'Chain Link' },
    { type: 'bridge', icon: BridgeIcon, label: 'Bridge' },
    { type: 'magnet', icon: MagnetIcon, label: 'Magnet' },
    { type: 'scale', icon: ScaleIcon, label: 'Scale (Balance)' },
    { type: 'seedling', icon: SeedlingIcon, label: 'Seedling (Growth)' },
    { type: 'tree', icon: TreeIcon, label: 'Tree (Hierarchy)' },
    { type: 'mountain', icon: MountainIcon, label: 'Mountain (Peak)' },
];

const ConnectionRelToolGroup: Component = () => {
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
        const found = connectionRelTools.find(t => t.type === store.selectedConnectionRelType);
        return found || connectionRelTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedConnectionRelType(type as any);
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
            setSelectedTool(store.selectedConnectionRelType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => connectionRelTools.some(t => t.type === store.selectedTool);

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
                        {connectionRelTools.map((tool) => (
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

export default ConnectionRelToolGroup;
