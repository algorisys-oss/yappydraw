import { type Component, For, createSignal, Show } from 'solid-js';
import { store, addLayer, setActiveLayer, updateLayer, deleteLayer, duplicateLayer, reorderLayers, toggleLayerPanel, minimizeLayerPanel, toggleLayerGroupingMode, createLayerGroup, toggleLayerGroupExpansion } from '../store/app-store';
import { X, Minus, ChevronUp, Eye, EyeOff, Plus, Maximize2, Folder, FolderOpen, ChevronRight, Layers, Crown } from 'lucide-solid';
import LayerContextMenu from './layer-context-menu';
import './layer-panel.css';

const LayerPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');
    const [draggedId, setDraggedId] = createSignal<string | null>(null);
    const [dragOverId, setDragOverId] = createSignal<string | null>(null);
    const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; layerId: string } | null>(null);
    let longPressTimer: number | null = null;


    const handleLayerClick = (id: string) => {
        setActiveLayer(id);
    };

    const handleToggleVisibility = (id: string, e: MouseEvent) => {
        e.stopPropagation();
        const layer = store.layers.find(l => l.id === id);
        if (layer) {
            updateLayer(id, { visible: !layer.visible });
        }
    };


    const handleDeleteLayer = (id: string, e: MouseEvent) => {
        e.stopPropagation();
        if (store.layers.length > 1) {
            deleteLayer(id);
        }
    };

    const handleDuplicateLayer = (id: string, e: MouseEvent) => {
        e.stopPropagation();
        duplicateLayer(id);
    };

    const startEditing = (id: string, currentName: string, e: Event) => {
        e.stopPropagation();
        setEditingId(id);
        setEditingName(currentName);
    };

    const saveRename = (id: string) => {
        const newName = editingName().trim();
        if (newName && newName !== store.layers.find(l => l.id === id)?.name) {
            updateLayer(id, { name: newName });
        }
        setEditingId(null);
        setEditingName('');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleRenameKeyDown = (e: KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveRename(id);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
        }
    };

    const handlePointerDown = (id: string, name: string, e: PointerEvent) => {
        longPressTimer = window.setTimeout(() => {
            startEditing(id, name, e);
        }, 500);
    };

    const handlePointerUp = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    const handleDragStart = (id: string, e: DragEvent) => {
        setDraggedId(id);
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', id);
        setTimeout(() => {
            (e.target as HTMLElement).style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e: DragEvent) => {
        (e.target as HTMLElement).style.opacity = '1';
        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragOver = (id: string, e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        setDragOverId(id);
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (targetId: string | null, e: DragEvent) => {
        e.preventDefault();
        const sourceId = draggedId();
        if (!sourceId) return;

        if (targetId === null) {
            // Drop on empty area -> Move to top level
            updateLayer(sourceId, { parentId: undefined });
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const sourceLayer = store.layers.find(l => l.id === sourceId);
        const targetLayer = store.layers.find(l => l.id === targetId);

        if (sourceId && sourceId !== targetId && sourceLayer && targetLayer) {
            // Grouping Logic
            if (store.layerGroupingModeEnabled && targetLayer.isGroup && sourceId !== targetId) {
                // If dropping into a group
                updateLayer(sourceId, { parentId: targetId as string });
                setDraggedId(null);
                setDragOverId(null);
                return;
            }

            // Regular Reorder
            const reversedList = [...store.layers].reverse();
            const sourceIndex = reversedList.findIndex(l => l.id === sourceId);
            const targetIndex = reversedList.findIndex(l => l.id === targetId);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                const normalSourceIndex = store.layers.length - 1 - sourceIndex;
                const normalTargetIndex = store.layers.length - 1 - targetIndex;
                reorderLayers(normalSourceIndex, normalTargetIndex);

                // If reordering within groups, might need to inherit parent
                if (store.layerGroupingModeEnabled) {
                    updateLayer(sourceId, { parentId: targetLayer.parentId ?? undefined });
                }
            }
        }

        setDraggedId(null);
        setDragOverId(null);
    };

    const displayLayers = () => {
        if (!store.layerGroupingModeEnabled) {
            return { items: [...store.layers].reverse(), depths: new Map<string, number>() };
        }

        const items: any[] = [];
        const depths = new Map<string, number>();
        const sortedAll = [...store.layers].sort((a, b) => b.order - a.order);

        const visit = (layerId: string | undefined, depth: number) => {
            const children = sortedAll.filter(l => l.parentId === layerId);
            children.forEach(child => {
                items.push(child);
                depths.set(child.id, depth);
                if (child.isGroup && child.expanded) {
                    visit(child.id, depth + 1);
                }
            });
        };

        const topLevel = sortedAll.filter(l => !l.parentId);
        topLevel.forEach(item => {
            items.push(item);
            depths.set(item.id, 0);
            if (item.isGroup && item.expanded) {
                visit(item.id, 1);
            }
        });

        return { items, depths };
    };

    const colorTags = [
        { name: 'None', value: undefined, color: 'transparent' },
        { name: 'Red', value: '#ff4d4d', color: '#ff4d4d' },
        { name: 'Orange', value: '#ffab40', color: '#ffab40' },
        { name: 'Yellow', value: '#ffd740', color: '#ffd740' },
        { name: 'Green', value: '#69f0ae', color: '#69f0ae' },
        { name: 'Blue', value: '#40c4ff', color: '#40c4ff' },
        { name: 'Purple', value: '#e040fb', color: '#e040fb' },
    ];

    return (
        <Show when={store.showLayerPanel}>
            <div class={`layer-panel ${store.isLayerPanelMinimized ? 'minimized' : ''}`}>
                <div class="layer-panel-header" onDblClick={() => minimizeLayerPanel(!store.isLayerPanelMinimized)}>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                        <Show when={store.isLayerPanelMinimized}>
                            <button class="minimize-btn" onClick={() => minimizeLayerPanel(false)} title="Expand">
                                <ChevronUp size={16} />
                            </button>
                        </Show>
                        <h3>Layers</h3>
                    </div>

                    <div class="header-actions">
                        <Show when={!store.isLayerPanelMinimized}>
                            <div
                                class={`group-mode-toggle ${store.layerGroupingModeEnabled ? 'active' : ''}`}
                                onClick={toggleLayerGroupingMode}
                                title="Toggle Grouping Mode"
                            >
                                <Layers size={14} />
                                <span>Groups</span>
                            </div>
                            <button class="icon-button" onClick={() => createLayerGroup()} title="New Group" disabled={store.layers.length >= store.maxLayers}>
                                <Folder size={16} />
                            </button>
                            <button class="icon-button" onClick={() => addLayer()} title="Add new layer" disabled={store.layers.length >= store.maxLayers}>
                                <Plus size={16} />
                            </button>
                            <button class="icon-button" onClick={() => minimizeLayerPanel(true)} title="Minimize">
                                <Minus size={16} />
                            </button>
                        </Show>
                        <Show when={store.isLayerPanelMinimized}>
                            <button class="icon-button" onClick={() => minimizeLayerPanel(false)} title="Expand">
                                <Maximize2 size={16} />
                            </button>
                        </Show>
                        <button class="icon-button" onClick={() => toggleLayerPanel(false)} title="Close">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <Show when={!store.isLayerPanelMinimized}>
                    <div class="layer-properties">
                        <div class="opacity-control">
                            <span class="label">Opacity</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={store.layers.find(l => l.id === store.activeLayerId)?.opacity ?? 1}
                                onInput={(e) => {
                                    const val = parseFloat(e.currentTarget.value);
                                    updateLayer(store.activeLayerId, { opacity: val });
                                }}
                                title={`Opacity: ${Math.round((store.layers.find(l => l.id === store.activeLayerId)?.opacity ?? 1) * 100)}%`}
                            />
                        </div>
                        <div class="background-control">
                            <span class="label">Background</span>
                            <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                                <button
                                    class={`color-swatch-mini ${store.layers.find(l => l.id === store.activeLayerId)?.backgroundColor === 'transparent' ? 'transparent' : ''}`}
                                    style={{
                                        background: store.layers.find(l => l.id === store.activeLayerId)?.backgroundColor === 'transparent'
                                            ? 'white'
                                            : (store.layers.find(l => l.id === store.activeLayerId)?.backgroundColor || 'transparent')
                                    }}
                                    onClick={() => {
                                        const current = store.layers.find(l => l.id === store.activeLayerId)?.backgroundColor;
                                        if (current === 'transparent') {
                                            updateLayer(store.activeLayerId, { backgroundColor: '#ffffff' });
                                        } else {
                                            updateLayer(store.activeLayerId, { backgroundColor: 'transparent' });
                                        }
                                    }}
                                    title="Toggle transparent / color"
                                />
                                <Show when={store.layers.find(l => l.id === store.activeLayerId)?.backgroundColor !== 'transparent'}>
                                    <input
                                        type="color"
                                        style={{ width: '24px', height: '20px', padding: '0', border: 'none', cursor: 'pointer' }}
                                        value={store.layers.find(l => l.id === store.activeLayerId)?.backgroundColor || '#ffffff'}
                                        onInput={(e) => {
                                            updateLayer(store.activeLayerId, { backgroundColor: e.currentTarget.value });
                                        }}
                                    />
                                </Show>
                            </div>
                        </div>
                        <div class="color-tag-control">
                            <span class="label">Tag</span>
                            <div class="color-tag-options">
                                <For each={colorTags}>
                                    {(tag) => (
                                        <div
                                            class={`color-tag-option ${tag.value === undefined ? 'none' : ''} ${store.layers.find(l => l.id === store.activeLayerId)?.colorTag === tag.value ? 'active' : ''}`}
                                            style={{ 'background-color': tag.color }}
                                            onClick={() => updateLayer(store.activeLayerId, { colorTag: tag.value })}
                                            title={tag.name}
                                        />
                                    )}
                                </For>
                            </div>
                        </div>
                    </div>
                    <div class="layer-list">
                        <For each={displayLayers().items}>
                            {(layer) => {
                                const depth = () => displayLayers().depths.get(layer.id) || 0;
                                return (
                                    <div
                                        class={`layer-item ${layer.id === store.activeLayerId ? 'active' : ''} ${dragOverId() === layer.id ? 'drag-over' : ''} ${layer.visible === false ? 'hidden' : ''} ${layer.locked ? 'locked' : ''} ${layer.isGroup ? 'group' : ''} ${depth() > 0 ? 'nested' : ''}`}
                                        style={{ 'padding-left': store.layerGroupingModeEnabled ? `${depth() * 24}px` : '0' }}
                                        onClick={() => handleLayerClick(layer.id)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setContextMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
                                        }}
                                        draggable={true}
                                        onDragStart={(e) => handleDragStart(layer.id, e)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(layer.id, e)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(layer.id, e)}
                                    >
                                        <Show when={layer.isGroup && store.layerGroupingModeEnabled}>
                                            <div
                                                class={`expander ${layer.expanded ? 'expanded' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleLayerGroupExpansion(layer.id);
                                                }}
                                            >
                                                <ChevronRight size={14} />
                                            </div>
                                        </Show>
                                        <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                                        <div class="layer-visibility" onClick={(e) => handleToggleVisibility(layer.id, e)}>
                                            {layer.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </div>
                                        <div class="layer-name-container">
                                            <Show when={layer.isGroup && store.layerGroupingModeEnabled}>
                                                {layer.expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                                            </Show>
                                            <Show when={layer.colorTag}>
                                                <div class="layer-color-tag" style={{ 'background-color': layer.colorTag }} />
                                            </Show>
                                            <Show when={layer.isMaster}>
                                                <div class="master-badge" title="Slide Master (replays on every slide)">
                                                    <Crown size={12} color="#f59e0b" fill="#f59e0b" fill-opacity="0.2" />
                                                </div>
                                            </Show>
                                            <div
                                                class="layer-name"
                                                onDblClick={(e) => startEditing(layer.id, layer.name, e)}
                                                onPointerDown={(e) => handlePointerDown(layer.id, layer.name, e)}
                                                onPointerUp={handlePointerUp}
                                                onPointerCancel={handlePointerUp}
                                            >
                                                <Show when={editingId() === layer.id} fallback={layer.name}>
                                                    <input
                                                        type="text"
                                                        value={editingName()}
                                                        onInput={(e) => setEditingName(e.currentTarget.value)}
                                                        onKeyDown={(e) => handleRenameKeyDown(e, layer.id)}
                                                        onBlur={() => saveRename(layer.id)}
                                                        autofocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </Show>
                                            </div>
                                        </div>
                                        <div class="layer-actions">
                                            <button class="icon-button" onClick={(e) => handleDuplicateLayer(layer.id, e)} title="Duplicate">
                                                ⎘
                                            </button>
                                            <button class="icon-button" onClick={(e) => handleDeleteLayer(layer.id, e)} title="Delete" disabled={store.layers.length <= 1}>
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                );
                            }}
                        </For>
                        <Show when={store.layerGroupingModeEnabled && draggedId()}>
                            <div
                                class={`root-drop-zone ${dragOverId() === 'root' ? 'drag-over' : ''}`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverId('root');
                                }}
                                onDragLeave={() => setDragOverId(null)}
                                onDrop={(e) => handleDrop(null, e)}
                            >
                                Move to Top Level
                            </div>
                        </Show>
                    </div>
                </Show>

                <Show when={contextMenu()}>
                    <LayerContextMenu
                        x={contextMenu()!.x}
                        y={contextMenu()!.y}
                        layerId={contextMenu()!.layerId}
                        onClose={() => setContextMenu(null)}
                        onRename={(id) => {
                            const layer = store.layers.find(l => l.id === id);
                            if (layer) startEditing(id, layer.name, new MouseEvent('click'));
                            setContextMenu(null);
                        }}
                    />
                </Show>
            </div>
        </Show>
    );
};

export default LayerPanel;
