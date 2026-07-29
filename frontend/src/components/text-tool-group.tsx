import { type Component, createSignal, Show, For, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, setSelectedTool, setStore, setToolLocked, showPropertiesPanel } from "../store/app-store";
import type { ElementType } from "../types";
import { Type, FileText, ChevronDown } from "lucide-solid";
import "./pen-tool-group.css";

export type TextType = 'text' | 'richtext';

const textTools: { type: TextType; icon: Component<{ size?: number; color?: string }>; label: string }[] = [
    { type: 'text', icon: Type, label: 'Text (T or 8)' },
    { type: 'richtext', icon: FileText, label: 'Rich Text (Shift+T)' },
];

const TextToolGroup: Component = () => {
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

    const getCurrentTextTool = () => {
        return textTools.find(t => t.type === store.selectedTextType) || textTools[0];
    };

    const isTextToolActive = () => {
        return ['text', 'richtext'].includes(store.selectedTool);
    };

    let clickTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastClickTime = 0;
    let lastClickType: string | null = null;

    const handleSelectText = (textType: TextType) => {
        const now = Date.now();
        const isDouble = textType === lastClickType && now - lastClickTime < 400;
        lastClickTime = now;
        lastClickType = textType;
        if (clickTimeout) clearTimeout(clickTimeout);
        if (isDouble) {
            clickTimeout = null;
            setStore('selectedTextType', textType);
            setSelectedTool(textType as ElementType);
            setToolLocked(true);
            setIsOpen(false);
        } else {
            clickTimeout = setTimeout(() => {
                setStore('selectedTextType', textType);
                setSelectedTool(textType as ElementType);
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
        if (!isTextToolActive()) {
            setSelectedTool(store.selectedTextType as ElementType);
        }
        setIsOpen(!isOpen());
    };

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
                class={`toolbar-btn ${isTextToolActive() ? 'active' : ''} ${isTextToolActive() && store.toolLocked ? 'tool-locked' : ''}`}
                on:click={toggleMenu}
                onContextMenu={handleRightClick}
                onDblClick={handleRightClick}
                title={`${getCurrentTextTool().label} (T or 8 - Click for more)`}
            >
                <div class="tool-icon-wrapper">
                    {(() => {
                        const Icon = getCurrentTextTool().icon;
                        return <Icon size={18} />;
                    })()}
                    <ChevronDown
                        size={9}
                        class="submenu-indicator"
                    />
                </div>
                <span class="hotkey-badge">8</span>
            </button>

            <Show when={isOpen()}>
                <Portal>
                    <div ref={dropdownRef} class="pen-tool-dropdown" style={getDropdownPosition()}>
                        <For each={textTools}>
                            {(tool) => (
                                <button
                                    class={`dropdown-item ${store.selectedTextType === tool.type ? 'active' : ''}`}
                                    on:click={() => handleSelectText(tool.type)}
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

export default TextToolGroup;
