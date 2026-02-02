import { type Component, For, Show, createSignal, onMount, onCleanup } from 'solid-js';
import './context-menu.css';

export interface MenuItem {
    label?: string;
    shortcut?: string;
    onClick?: () => void;
    checked?: boolean;
    separator?: boolean;
    disabled?: boolean;
    submenu?: MenuItem[];
    gridColumns?: number; // Number of columns for grid layout in submenu
    icon?: string; // Icon to display (emoji or Unicode symbol)
    tooltip?: string; // Tooltip text for hover
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
    parent?: boolean; // Internal use for styling
    gridColumns?: number; // Number of columns for grid layout
}

const ContextMenu: Component<ContextMenuProps> = (props) => {
    let menuRef: HTMLDivElement | undefined;
    const [position, setPosition] = createSignal({ x: props.x, y: props.y });
    const [activeSubmenu, setActiveSubmenu] = createSignal<number | null>(null);

    onMount(() => {
        if (!props.parent) { // Only adjust position for root menu
            // Adjust position if menu would go off-screen
            if (menuRef) {
                const rect = menuRef.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let adjustedX = props.x;
                let adjustedY = props.y;

                // Adjust horizontal position
                if (props.x + rect.width > viewportWidth) {
                    adjustedX = viewportWidth - rect.width - 10;
                }

                // Adjust vertical position
                if (props.y + rect.height > viewportHeight) {
                    adjustedY = viewportHeight - rect.height - 10;
                }

                setPosition({ x: adjustedX, y: adjustedY });
            }

            // Close on click outside
            const handleClickOutside = (e: MouseEvent) => {
                // Check if click is inside any context menu (including submenus)
                if ((e.target as Element).closest('.context-menu')) return;
                props.onClose();
            };

            // Close on ESC key
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    props.onClose();
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);

            onCleanup(() => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            });
        }
    });

    const handleItemClick = (item: MenuItem, index: number) => {
        if (item.disabled || item.separator) return;

        if (item.submenu) {
            // Toggle submenu? Or open on hover?
            // For click, toggle.
            setActiveSubmenu(activeSubmenu() === index ? null : index);
        } else {
            item.onClick?.();
            props.onClose(); // Close the menu chain on leaf click
        }
    };

    const handleMouseEnter = (index: number) => {
        const item = props.items[index];
        if (item.submenu) {
            setActiveSubmenu(index);
        } else {
            setActiveSubmenu(null);
        }
    };

    return (
        <div
            ref={menuRef}
            class="context-menu"
            style={{
                left: props.parent ? '100%' : `${position().x}px`,
                top: props.parent ? '0' : `${position().y}px`,
                position: props.parent ? 'absolute' : 'fixed',
                "margin-left": props.parent ? '-4px' : '0',
                display: props.gridColumns ? 'grid' : 'block',
                "grid-template-columns": props.gridColumns ? `repeat(${props.gridColumns}, 1fr)` : undefined,
                gap: props.gridColumns ? '4px' : undefined,
                padding: props.gridColumns ? '8px' : undefined
            }}
        >
            <For each={props.items}>
                {(item, index) => (
                    <div
                        class="menu-item-wrapper"
                        style={{ position: 'relative' }}
                        onMouseEnter={() => handleMouseEnter(index())}
                    >
                        <Show
                            when={!item.separator}
                            fallback={<div class="context-menu-separator"></div>}
                        >
                            <button
                                class={`context-menu-item ${item.disabled ? 'disabled' : ''} ${activeSubmenu() === index() ? 'active' : ''}`}
                                onClick={() => handleItemClick(item, index())}
                                disabled={item.disabled}
                                title={item.tooltip || item.label}
                            >
                                <span class="menu-item-check">
                                    {item.checked ? '✓' : ''}
                                </span>
                                <Show when={item.icon} fallback={
                                    <span class="menu-item-label">{item.label}</span>
                                }>
                                    <span class="menu-item-icon" style={{ "font-size": "20px", "line-height": "1" }}>{item.icon}</span>
                                </Show>
                                <Show when={item.shortcut}>
                                    <span class="menu-item-shortcut">{item.shortcut}</span>
                                </Show>
                                <Show when={item.submenu}>
                                    <span class="menu-item-arrow">▶</span>
                                </Show>
                            </button>

                            {/* Submenu rendering */}
                            <Show when={item.submenu && activeSubmenu() === index()}>
                                <ContextMenu
                                    x={(() => {
                                        const buttonRect = menuRef?.querySelector(`.menu-item-wrapper:nth-child(${index() + 1}) button`)?.getBoundingClientRect();
                                        return buttonRect ? buttonRect.right : 0;
                                    })()}
                                    y={(() => {
                                        const buttonRect = menuRef?.querySelector(`.menu-item-wrapper:nth-child(${index() + 1}) button`)?.getBoundingClientRect();
                                        return buttonRect ? buttonRect.top : 0;
                                    })()}
                                    items={item.submenu!}
                                    onClose={props.onClose}
                                    parent={false}
                                    gridColumns={item.gridColumns}
                                />
                            </Show>
                        </Show>
                    </div>
                )}
            </For>
        </div>
    );
};

export default ContextMenu;
