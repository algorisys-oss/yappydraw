import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setSelectedStatusType, setStore } from "../store/app-store";
import type { ElementType } from "../types";
import {
    ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

// Custom SVG Icons for Status & Annotation shapes

const CheckboxIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
);

const CheckboxCheckedIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <polyline points="7,12 10,16 17,8" />
    </svg>
);

const NumberedBadgeIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor" stroke="none">1</text>
    </svg>
);

const QuestionMarkIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" text-anchor="middle" font-size="13" font-weight="bold" fill="currentColor" stroke="none">?</text>
    </svg>
);

const ExclamationMarkIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="16" text-anchor="middle" font-size="13" font-weight="bold" fill="currentColor" stroke="none">!</text>
    </svg>
);

const TagIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 4,12 L 7,4 L 21,4 Q 22,4 22,5 L 22,19 Q 22,20 21,20 L 7,20 Z" />
        <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    </svg>
);

const PinIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12,22 C 9,16 5,12 5,8 A 7,7 0 1 1 19,8 C 19,12 15,16 12,22 Z" />
        <circle cx="12" cy="8" r="2.5" fill="currentColor" />
    </svg>
);

const StampIcon: Component<{ size?: number; color?: string }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {/* Scalloped outer circle */}
        <path d={(() => {
            let p = '';
            const cx = 12, cy = 12, outerR = 10, innerR = 8.5, n = 12;
            for (let i = 0; i < n; i++) {
                const a1 = (Math.PI * 2 * i) / n;
                const a2 = (Math.PI * 2 * (i + 0.5)) / n;
                const a3 = (Math.PI * 2 * (i + 1)) / n;
                const x1 = cx + Math.cos(a1) * outerR;
                const y1 = cy + Math.sin(a1) * outerR;
                const cpx = cx + Math.cos(a2) * innerR;
                const cpy = cy + Math.sin(a2) * innerR;
                const x2 = cx + Math.cos(a3) * outerR;
                const y2 = cy + Math.sin(a3) * outerR;
                if (i === 0) p = `M ${x1} ${y1}`;
                p += ` Q ${cpx} ${cpy} ${x2} ${y2}`;
            }
            return p + ' Z';
        })()} />
        <circle cx="12" cy="12" r="6" />
    </svg>
);

const statusTools: { type: ElementType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'checkbox', icon: CheckboxIcon, label: 'Checkbox (Empty)' },
    { type: 'checkboxChecked', icon: CheckboxCheckedIcon, label: 'Checkbox (Checked)' },
    { type: 'numberedBadge', icon: NumberedBadgeIcon, label: 'Numbered Badge' },
    { type: 'questionMark', icon: QuestionMarkIcon, label: 'Question Mark' },
    { type: 'exclamationMark', icon: ExclamationMarkIcon, label: 'Exclamation Mark' },
    { type: 'tag', icon: TagIcon, label: 'Tag (Label)' },
    { type: 'pin', icon: PinIcon, label: 'Map Pin' },
    { type: 'stamp', icon: StampIcon, label: 'Stamp (Seal)' },
];

const StatusToolGroup: Component = () => {
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
        const found = statusTools.find(t => t.type === store.selectedStatusType);
        return found || statusTools[0];
    };

    const handleToolClick = (type: ElementType) => {
        setSelectedStatusType(type as any);
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
            setSelectedTool(store.selectedStatusType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => statusTools.some(t => t.type === store.selectedTool);

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
                        {statusTools.map((tool) => (
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

export default StatusToolGroup;
