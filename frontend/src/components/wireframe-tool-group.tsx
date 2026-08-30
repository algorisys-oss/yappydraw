import { type Component, createSignal, Show, createEffect, onCleanup, For } from "solid-js";
import { Portal } from "solid-js/web";
import { createFlyoutPlacement } from "../utils/tool-flyout";
import { store, setSelectedTool, setSelectedWireframeType, setToolLocked, showPropertiesPanel } from "../store/app-store";
import type { ElementType } from "../types";
import { UI_SHAPE_DEFS, type UIShapeCategory } from "../config/ui-shape-defs";
import {
    ChevronDown
} from "lucide-solid";
import "./pen-tool-group.css"; // Reuse the same CSS

// ── Extra status/annotation shapes grouped here with UI tools ──

const CheckboxIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
);

const CheckboxCheckedIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <polyline points="7,12 10,16 17,8" />
    </svg>
);

const PinIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 12,22 C 9,16 5,12 5,8 A 7,7 0 1 1 19,8 C 19,12 15,16 12,22 Z" />
        <circle cx="12" cy="8" r="2.5" fill="currentColor" />
    </svg>
);

const StampIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

const extraStatusTools: { type: ElementType; icon: Component<{ size?: number }>; label: string }[] = [
    { type: 'checkbox', icon: CheckboxIcon, label: 'Checkbox (Empty)' },
    { type: 'checkboxChecked', icon: CheckboxCheckedIcon, label: 'Checkbox (Checked)' },
    { type: 'pin', icon: PinIcon, label: 'Map Pin' },
    { type: 'stamp', icon: StampIcon, label: 'Stamp (Seal)' },
];

const extraStatusTypes = extraStatusTools.map(t => t.type);

// Derive tool list from config (including extra status tools)
const allUITypes = [...UI_SHAPE_DEFS.map(d => d.type as ElementType), ...extraStatusTypes];

const categoryOrder: UIShapeCategory[] = ['container', 'form', 'navigation', 'feedback'];
const categoryLabels: Record<UIShapeCategory, string> = {
    container: 'Containers',
    form: 'Form',
    navigation: 'Navigation',
    feedback: 'Feedback',
};
const groupedTools = categoryOrder
    .map(cat => ({
        category: cat,
        label: categoryLabels[cat],
        tools: UI_SHAPE_DEFS.filter(d => d.category === cat),
    }))
    .filter(g => g.tools.length > 0);

const WireframeToolGroup: Component = () => {
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
        // Check UI_SHAPE_DEFS first, then extra status tools
        const found = UI_SHAPE_DEFS.find(t => t.type === store.selectedWireframeType);
        if (found) return { label: found.label, icon: found.toolbarIcon };
        const extra = extraStatusTools.find(t => t.type === store.selectedTool);
        if (extra) return { label: extra.label, icon: extra.icon };
        return { label: UI_SHAPE_DEFS[0].label, icon: UI_SHAPE_DEFS[0].toolbarIcon };
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
            setSelectedWireframeType(type);
            setSelectedTool(type);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setSelectedWireframeType(type);
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
            setSelectedTool(store.selectedWireframeType);
        }
        setIsOpen(!isOpen());
    };

    const activeTool = () => getActiveTool();
    const isActive = () => allUITypes.includes(store.selectedTool as any);


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
                    <div ref={el => { dropdownRef = el; flyout.attach(el); }} class="pen-tool-dropdown" style={{
                        ...flyout.style(),
                        display: 'flex',
                        'flex-direction': 'column',
                        'grid-template-columns': 'none',
                        'max-height': '400px',
                        'overflow-y': 'auto',
                        width: '280px',
                        gap: '2px',
                    }}>
                        <For each={groupedTools}>
                            {(group) => (
                                <>
                                    <div style={{
                                        'font-size': '9px',
                                        'text-transform': 'uppercase',
                                        'letter-spacing': '0.05em',
                                        'opacity': 0.5,
                                        'padding': '6px 8px 2px',
                                        'pointer-events': 'none',
                                    }}>
                                        {group.label}
                                    </div>
                                    <div style={{
                                        display: 'grid',
                                        'grid-template-columns': 'repeat(6, 1fr)',
                                        gap: '2px',
                                        padding: '0 4px 4px',
                                    }}>
                                        <For each={group.tools}>
                                            {(tool) => (
                                                <button
                                                    class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                                    on:click={() => handleToolClick(tool.type as ElementType)}
                                                                        title={`${tool.label} (double-click to lock)`}
                                                    style={{ width: '100%' }}
                                                >
                                                    <tool.toolbarIcon size={16} />
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </>
                            )}
                        </For>
                        {/* Status / Annotation shapes */}
                        <div style={{
                            'font-size': '9px',
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            'opacity': 0.5,
                            'padding': '6px 8px 2px',
                            'pointer-events': 'none',
                        }}>
                            Status
                        </div>
                        <div style={{
                            display: 'grid',
                            'grid-template-columns': 'repeat(6, 1fr)',
                            gap: '2px',
                            padding: '0 4px 4px',
                        }}>
                            <For each={extraStatusTools}>
                                {(tool) => (
                                    <button
                                        class={`dropdown-item ${store.selectedTool === tool.type ? 'active' : ''}`}
                                        on:click={() => handleToolClick(tool.type)}
                                        title={`${tool.label} (double-click to lock)`}
                                        style={{ width: '100%' }}
                                    >
                                        <tool.icon size={16} />
                                    </button>
                                )}
                            </For>
                        </div>
                    </div>
                </Portal>
            </Show>
        </div>
    );
};

export default WireframeToolGroup;
