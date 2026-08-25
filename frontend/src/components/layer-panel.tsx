import { type Component, For, createSignal, Show } from 'solid-js';
import { store, addLayer, setActiveLayer, updateLayer, deleteLayer, duplicateLayer, reorderLayers, toggleLayerGroupingMode, createLayerGroup, toggleLayerGroupExpansion } from '../store/app-store';
import { X, Eye, EyeOff, Plus, Folder, FolderOpen, ChevronRight, Layers, Crown, Lock, Unlock, Copy, Trash2, Box } from 'lucide-solid';
import ObjectTree from './object-tree';
import LayerContextMenu from './layer-context-menu';
import './layer-panel.css';

const LayerPanel: Component = () => {
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editingName, setEditingName] = createSignal('');
    const [draggedId, setDraggedId] = createSignal<string | null>(null);
    // Which layers have their object list open. Layer-panel state, not document
    // state: which rows you expanded isn't worth saving into the drawing.
    const [openObjects, setOpenObjects] = createSignal<Set<string>>(new Set());
    const objectsOpen = (id: string) => openObjects().has(id);
    const toggleObjects = (id: string, e: Event) => {
        e.stopPropagation();
        setOpenObjects(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const layerObjectCount = (id: string) => store.elements.filter(el => el.layerId === id && !el.isClipMask).length;

    const [dragOverId, setDragOverId] = createSignal<string | null>(null);
    const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; layerId: string } | null>(null);
    let longPressTimer: number | null = null;

    // ─── Procreate-style iPad swipe gestures on layer rows ──────────────
    //   swipe LEFT  → reveal an action tray (Lock / Duplicate / Delete)
    //   swipe RIGHT → toggle the row into a multi-select set (Group / Delete bar)
    // Touch/pen only — mouse keeps drag-reorder + the always-visible action
    // buttons. Mirrors happypaint/layer-panel.tsx.
    const SWIPE_THRESHOLD = 48; // px to commit a swipe
    const AXIS_SLOP = 10;       // px before locking horizontal vs vertical
    const TRAY_W = 132;         // revealed action-tray width (px)
    const [revealedId, setRevealedId] = createSignal<string | null>(null);
    const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());
    const [swipe, setSwipe] = createSignal<{ id: string; dx: number } | null>(null);
    let swipeStart: { id: string; x: number; y: number; axis: 'h' | 'v' | null } | null = null;
    let lastSwipeEndAt = 0; // suppress a click for a short window after a swipe

    const toggleSelected = (id: string) => setSelectedIds(prev => {
        const next = new Set<string>(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const clearSelection = () => setSelectedIds(new Set<string>());

    const onSwipeMove = (e: PointerEvent) => {
        if (!swipeStart) return;
        const dx = e.clientX - swipeStart.x;
        const dy = e.clientY - swipeStart.y;
        if (swipeStart.axis === null) {
            if (Math.abs(dx) > AXIS_SLOP && Math.abs(dx) > Math.abs(dy)) {
                swipeStart.axis = 'h';
                handlePointerUp(); // a horizontal swipe isn't a long-press rename
            } else if (Math.abs(dy) > AXIS_SLOP) {
                endSwipeTracking(); // vertical — let the list scroll
                return;
            } else return;
        }
        if (swipeStart.axis === 'h') {
            e.preventDefault();
            const clamped = Math.max(-(TRAY_W + 24), Math.min(TRAY_W + 24, dx));
            setSwipe({ id: swipeStart.id, dx: clamped });
        }
    };

    const onSwipeUp = () => {
        if (swipeStart?.axis === 'h') {
            const dx = swipe()?.dx ?? 0;
            const id = swipeStart.id;
            lastSwipeEndAt = Date.now(); // the trailing click must not re-activate the layer
            if (dx <= -SWIPE_THRESHOLD) setRevealedId(id);
            else if (dx >= SWIPE_THRESHOLD) { toggleSelected(id); setRevealedId(r => (r === id ? null : r)); }
            else if (revealedId() === id && dx > 8) setRevealedId(null);
        }
        endSwipeTracking();
    };

    const endSwipeTracking = () => {
        swipeStart = null;
        setSwipe(null);
        window.removeEventListener('pointermove', onSwipeMove);
        window.removeEventListener('pointerup', onSwipeUp);
        window.removeEventListener('pointercancel', onSwipeUp);
    };

    const startSwipe = (id: string, e: PointerEvent) => {
        // Works for mouse too. Reorder is confined to the grip handle, whose own
        // pointerdown stops propagation, so a horizontal drag on the row body reaches this
        // swipe handler and a vertical drag on the grip never becomes a swipe.
        if ((e.target as HTMLElement).closest('button, input, .drag-handle, .expander')) return;
        swipeStart = { id, x: e.clientX, y: e.clientY, axis: null };
        window.addEventListener('pointermove', onSwipeMove, { passive: false });
        window.addEventListener('pointerup', onSwipeUp);
        window.addEventListener('pointercancel', onSwipeUp);
    };

    // Live horizontal offset for a row: the in-flight swipe, else the parked
    // revealed-tray position, else 0.
    const swipeOffset = (id: string): number => {
        const s = swipe();
        if (s && s.id === id) return s.dx;
        if (revealedId() === id) return -TRAY_W;
        return 0;
    };

    const groupSelectedLayers = () => {
        const ids = [...selectedIds()];
        if (ids.length === 0) return;
        if (!store.layerGroupingModeEnabled) toggleLayerGroupingMode();
        const gid = createLayerGroup();
        ids.forEach(id => updateLayer(id, { parentId: gid }));
        clearSelection();
    };

    const deleteSelectedLayers = () => {
        for (const id of [...selectedIds()]) {
            if (store.layers.length <= 1) break; // always keep one layer
            deleteLayer(id);
        }
        clearSelection();
    };


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

    const handleToggleLock = (id: string, e: MouseEvent) => {
        e.stopPropagation();
        const layer = store.layers.find(l => l.id === id);
        if (layer) {
            updateLayer(id, { locked: !layer.locked });
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

    // ─── Drag-to-reorder ────────────────────────────────────────────────
    // Pointer events, not HTML5 drag-and-drop. That is a deliberate choice and it fixed a
    // real bug (#323): with `DataTransfer`, ANY other listener on the way up can change the
    // drag out from under the panel, and app.tsx's global image-drop handler did exactly
    // that — forcing `dropEffect = 'copy'` onto a drag that had declared `effectAllowed =
    // 'move'`, an illegal pair the browser answers by refusing the drop outright, with no
    // `drop` event and a no-entry cursor. A pointer drag carries no shared state, so nothing
    // can invalidate it from a distance. (happypaint's panel has always worked this way.)
    //
    // Rows register themselves here so a drop target can be resolved from the pointer's Y,
    // which is also what lets the drag work over the panel's padding and header rather than
    // only over a row's own box.
    const rowEls = new Map<string, HTMLElement>();
    const registerRow = (id: string, el: HTMLElement | undefined) => {
        if (el) rowEls.set(id, el); else rowEls.delete(id);
    };

    /** The row under `clientY`, or null when the pointer is past the ends of the list. */
    const rowAt = (clientY: number): string | null => {
        for (const [id, el] of rowEls) {
            const r = el.getBoundingClientRect();
            if (r.height > 0 && clientY >= r.top && clientY <= r.bottom) return id;
        }
        return null;
    };

    const onDragMove = (e: PointerEvent) => {
        const over = rowAt(e.clientY);
        setDragOverId(over && over !== draggedId() ? over : null);
    };

    const onDragUp = () => {
        const sourceId = draggedId();
        const targetId = dragOverId();
        endDrag();
        if (sourceId && targetId) applyDrop(sourceId, targetId);
    };

    const endDrag = () => {
        const id = draggedId();
        if (id) rowEls.get(id)?.closest('.layer-row')?.setAttribute('style', '');
        setDraggedId(null);
        setDragOverId(null);
        window.removeEventListener('pointermove', onDragMove);
        window.removeEventListener('pointerup', onDragUp);
        window.removeEventListener('pointercancel', endDrag);
    };

    const startDrag = (id: string, e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggedId(id);
        setDragOverId(null);
        const row = rowEls.get(id)?.closest('.layer-row') as HTMLElement | null;
        if (row) row.style.opacity = '0.5';
        window.addEventListener('pointermove', onDragMove);
        window.addEventListener('pointerup', onDragUp);
        window.addEventListener('pointercancel', endDrag);
    };

    /** Move `sourceId` to `targetId`'s place. Unchanged from the drag-and-drop version —
     *  only how the two ids are gathered has changed. */
    const applyDrop = (sourceId: string | null, targetId: string | null) => {
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
        <>
                <div class="layer-toolbar">
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
                </div>

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
                    <Show when={selectedIds().size > 0}>
                        <div class="layer-multiselect-bar">
                            <span class="ms-count">{selectedIds().size} selected</span>
                            <div class="ms-actions">
                                <button class="ms-btn ms-group" onClick={groupSelectedLayers} title="Group selected layers">
                                    <Folder size={14} /> Group
                                </button>
                                <button class="ms-btn ms-delete" onClick={deleteSelectedLayers} title="Delete selected layers" disabled={store.layers.length <= 1}>
                                    <Trash2 size={14} /> Delete
                                </button>
                                <button class="ms-btn ms-cancel" onClick={clearSelection} title="Clear selection">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </Show>
                    {/* No `data-internal-drag` here any more: reordering is a POINTER drag,
                        which carries no DataTransfer for app.tsx's global drop handlers to
                        interfere with. The exemption was the fix for #323; this removes the
                        thing that needed exempting. `.slide-navigator` still needs its own. */}
                    <div class="layer-list">
                        <For each={displayLayers().items}>
                            {(layer) => {
                                const depth = () => displayLayers().depths.get(layer.id) || 0;
                                return (
                                    <>
                                    <div class="layer-row" classList={{ selected: selectedIds().has(layer.id) }}>
                                        {/* Swipe-left action tray (revealed behind the row on touch) */}
                                        <div class="layer-swipe-tray">
                                            <button class="tray-btn tray-lock" title={layer.locked ? 'Unlock' : 'Lock'}
                                                onClick={(e) => { handleToggleLock(layer.id, e as unknown as MouseEvent); setRevealedId(null); }}>
                                                {layer.locked ? <Unlock size={20} /> : <Lock size={20} />}
                                            </button>
                                            <button class="tray-btn tray-dup" title="Duplicate"
                                                onClick={(e) => { handleDuplicateLayer(layer.id, e as unknown as MouseEvent); setRevealedId(null); }}>
                                                <Copy size={20} />
                                            </button>
                                            <button class="tray-btn tray-del" title="Delete" disabled={store.layers.length <= 1}
                                                onClick={(e) => { handleDeleteLayer(layer.id, e as unknown as MouseEvent); setRevealedId(null); }}>
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    <div
                                        class={`layer-item ${layer.id === store.activeLayerId ? 'active' : ''} ${dragOverId() === layer.id ? 'drag-over' : ''} ${layer.visible === false ? 'hidden' : ''} ${layer.locked ? 'locked' : ''} ${layer.isGroup ? 'group' : ''} ${depth() > 0 ? 'nested' : ''}`}
                                        classList={{ swiping: !!swipe() && swipe()!.id === layer.id }}
                                        style={{ 'padding-left': store.layerGroupingModeEnabled ? `${depth() * 24}px` : '0', transform: `translateX(${swipeOffset(layer.id)}px)` }}
                                        onPointerDown={(e) => startSwipe(layer.id, e)}
                                        onClick={() => { if (Date.now() - lastSwipeEndAt < 400) return; if (revealedId()) { setRevealedId(null); return; } handleLayerClick(layer.id); }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setContextMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
                                        }}
                                        ref={(el) => registerRow(layer.id, el)}
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
                                        <span
                                            class="drag-handle"
                                            title="Drag to reorder"
                                            onPointerDown={(e) => startDrag(layer.id, e)}
                                        >⋮⋮</span>
                                        <div class="layer-visibility" onClick={(e) => handleToggleVisibility(layer.id, e)}>
                                            {layer.visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </div>
                                        <div class={`layer-lock ${layer.locked ? 'is-locked' : ''}`} onClick={(e) => handleToggleLock(layer.id, e)} title={layer.locked ? 'Unlock layer' : 'Lock layer'}>
                                            {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
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
                                            <button
                                                class="layer-action-btn"
                                                classList={{ active: objectsOpen(layer.id) }}
                                                onClick={(e) => toggleObjects(layer.id, e)}
                                                title={objectsOpen(layer.id) ? 'Hide objects on this layer' : `Show objects on this layer (${layerObjectCount(layer.id)})`}
                                            >
                                                <Box size={13} />
                                            </button>
                                            <button class="layer-action-btn" onClick={(e) => handleDuplicateLayer(layer.id, e)} title="Duplicate">
                                                <Copy size={13} />
                                            </button>
                                            <button class="layer-action-btn layer-action-delete" onClick={(e) => handleDeleteLayer(layer.id, e)} title="Delete" disabled={store.layers.length <= 1}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                    <Show when={objectsOpen(layer.id)}>
                                        <ObjectTree layerId={layer.id} />
                                    </Show>
                                    </>
                                );
                            }}
                        </For>
                        <Show when={store.layerGroupingModeEnabled && draggedId()}>
                            <div
                                class={`root-drop-zone ${dragOverId() === 'root' ? 'drag-over' : ''}`}
                                onPointerEnter={() => { if (draggedId()) setDragOverId('root'); }}
                                onPointerLeave={() => { if (dragOverId() === 'root') setDragOverId(null); }}
                                onPointerUp={() => { const id = draggedId(); endDrag(); if (id) applyDrop(id, null); }}
                            >
                                Move to Top Level
                            </div>
                        </Show>
                    </div>

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
        </>
    );
};

export default LayerPanel;
