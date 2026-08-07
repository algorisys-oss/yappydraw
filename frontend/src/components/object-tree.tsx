/**
 * Object tree — the objects inside a layer, Illustrator-style.
 *
 * The layer panel managed *layers* and never showed what was on them, so in a
 * document of any size the only way to reach a specific object was to find it
 * on the canvas and click it. This lists every object on a layer, nested by
 * group, and gives each one the four things you actually need: select it, hide
 * it, lock it, name it.
 *
 * Order matches the canvas: topmost object first, like the stacking order it
 * represents (the elements array is bottom-to-top, so it is reversed here).
 */
import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { Eye, EyeOff, Lock, Unlock, ChevronRight } from 'lucide-solid';
import {
    store, setStore, updateElement, setElementsVisible, toggleElementVisible, setElementName,
    moveElementsNextTo,
} from '../store/app-store';
import { elementLabel, groupLabel, allHidden, allLocked } from '../utils/object-label';
import type { DrawingElement } from '../types';
import './object-tree.css';

type TreeNode =
    | { kind: 'element'; el: DrawingElement }
    | { kind: 'group'; id: string; members: DrawingElement[]; children: TreeNode[] };

/**
 * Bucket a layer's elements into a tree by group nesting.
 *
 * `groupIds` runs innermost → outermost, so at tree depth `d` the grouping key
 * is the `d`-th id counted from the END. Elements with no group at that depth
 * are leaves. Buckets keep first-appearance order, so the tree follows document
 * order and the display reversal below turns it into stacking order.
 */
export function buildObjectTree(els: DrawingElement[], depth = 0): TreeNode[] {
    const buckets = new Map<string, DrawingElement[]>();
    const order: (string | DrawingElement)[] = [];

    for (const el of els) {
        const gids = el.groupIds ?? [];
        const key = gids.length > depth ? gids[gids.length - 1 - depth] : null;
        if (!key) { order.push(el); continue; }
        let bucket = buckets.get(key);
        if (!bucket) { bucket = []; buckets.set(key, bucket); order.push(key); }
        bucket.push(el);
    }

    return order.map(item => {
        if (typeof item !== 'string') return { kind: 'element', el: item } as TreeNode;
        const members = buckets.get(item)!;
        return { kind: 'group', id: item, members, children: buildObjectTree(members, depth + 1) } as TreeNode;
    });
}

const ObjectTree: Component<{ layerId: string }> = (props) => {
    const [expanded, setExpanded] = createSignal<Set<string>>(new Set());
    const [editId, setEditId] = createSignal<string | null>(null);
    const [editText, setEditText] = createSignal('');
    // Drag-to-restack. `dragIds` is the block being moved (a group drags all its
    // members); `dropHint` marks the row being hovered and which edge.
    const [dragIds, setDragIds] = createSignal<string[] | null>(null);
    const [dropHint, setDropHint] = createSignal<{ id: string; edge: 'above' | 'below' } | null>(null);

    const onRowDragOver = (rowId: string, e: DragEvent) => {
        if (!dragIds() || dragIds()!.includes(rowId)) return;
        e.preventDefault();
        // Top half of the row means "in front of it" — the tree reads top-of-stack
        // first, so the visual up is the higher z.
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDropHint({ id: rowId, edge: e.clientY < r.top + r.height / 2 ? 'above' : 'below' });
    };

    const onRowDrop = (rowId: string, e: DragEvent) => {
        e.preventDefault();
        const ids = dragIds();
        const hint = dropHint();
        if (ids && hint && !ids.includes(rowId)) moveElementsNextTo(ids, rowId, hint.edge);
        setDragIds(null); setDropHint(null);
    };

    const nodes = createMemo(() =>
        // Reversed: the tree reads top-of-stack first, matching what you see.
        buildObjectTree(store.elements.filter(el => el.layerId === props.layerId && !el.isClipMask)).reverse());

    const isExpanded = (id: string) => expanded().has(id);
    const toggleExpanded = (id: string) => setExpanded(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const selectIds = (ids: string[], additive: boolean) => {
        setStore('selection', s => additive ? [...new Set([...s, ...ids])] : ids);
    };

    const commitRename = (id: string) => {
        setElementName(id, editText());
        setEditId(null);
    };

    /** One row — used for both element and group nodes so they stay in step. */
    const Row: Component<{
        id: string; label: string; depth: number; icon?: any;
        selected: boolean; hidden: boolean; locked: boolean;
        expandable?: boolean; onToggleExpand?: () => void;
        onSelect: (e: MouseEvent) => void;
        onToggleHidden: () => void; onToggleLocked: () => void;
        renamable?: boolean;
        dragIds: string[];
    }> = (r) => (
        <div
            class="ot-row"
            classList={{
                selected: r.selected, hidden: r.hidden, locked: r.locked,
                'drop-above': dropHint()?.id === r.id && dropHint()?.edge === 'above',
                'drop-below': dropHint()?.id === r.id && dropHint()?.edge === 'below',
                dragging: !!dragIds()?.includes(r.id),
            }}
            style={{ 'padding-left': `${8 + r.depth * 14}px` }}
            onClick={(e) => r.onSelect(e)}
            title={r.label}
            draggable={true}
            onDragStart={(e) => { setDragIds(r.dragIds); e.dataTransfer?.setData('text/plain', r.id); }}
            onDragEnd={() => { setDragIds(null); setDropHint(null); }}
            onDragOver={(e) => onRowDragOver(r.id, e)}
            onDrop={(e) => onRowDrop(r.id, e)}
        >
            <span class="ot-expander" onClick={(e) => { e.stopPropagation(); r.onToggleExpand?.(); }}>
                <Show when={r.expandable}>
                    <ChevronRight size={12} classList={{ 'ot-open': isExpanded(r.id) }} />
                </Show>
            </span>

            <span
                class="ot-eye"
                title={r.hidden ? 'Show' : 'Hide'}
                onClick={(e) => { e.stopPropagation(); r.onToggleHidden(); }}
            >{r.hidden ? <EyeOff size={13} /> : <Eye size={13} />}</span>

            <span
                class="ot-lock"
                classList={{ 'is-locked': r.locked }}
                title={r.locked ? 'Unlock' : 'Lock'}
                onClick={(e) => { e.stopPropagation(); r.onToggleLocked(); }}
            >{r.locked ? <Lock size={13} /> : <Unlock size={13} />}</span>

            <span
                class="ot-label"
                onDblClick={(e) => {
                    if (!r.renamable) return;
                    e.stopPropagation();
                    setEditId(r.id); setEditText(r.label);
                }}
            >
                <Show when={editId() === r.id} fallback={r.label}>
                    <input
                        class="ot-rename"
                        type="text"
                        value={editText()}
                        autofocus
                        onClick={(e) => e.stopPropagation()}
                        onInput={(e) => setEditText(e.currentTarget.value)}
                        onBlur={() => commitRename(r.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(r.id); }
                            if (e.key === 'Escape') { e.preventDefault(); setEditId(null); }
                        }}
                    />
                </Show>
            </span>
        </div>
    );

    /** Recursive node renderer. */
    const Node: Component<{ node: TreeNode; depth: number }> = (p) => (
        <Show
            when={p.node.kind === 'group' ? p.node : null}
            fallback={(() => {
                const el = (p.node as { kind: 'element'; el: DrawingElement }).el;
                return (
                    <Row
                        id={el.id}
                        label={elementLabel(el)}
                        depth={p.depth}
                        dragIds={[el.id]}
                        selected={store.selection.includes(el.id)}
                        hidden={el.visible === false}
                        locked={!!el.locked}
                        renamable
                        onSelect={(e) => selectIds([el.id], e.shiftKey || e.ctrlKey || e.metaKey)}
                        onToggleHidden={() => toggleElementVisible(el.id)}
                        onToggleLocked={() => updateElement(el.id, { locked: !el.locked })}
                    />
                );
            })()}
        >
            {(g) => {
                const ids = () => g().members.map(m => m.id);
                return (
                    <>
                        <Row
                            id={g().id}
                            label={groupLabel(g().members.length)}
                            depth={p.depth}
                            expandable
                            dragIds={ids()}
                            onToggleExpand={() => toggleExpanded(g().id)}
                            selected={g().members.every(m => store.selection.includes(m.id))}
                            hidden={allHidden(g().members)}
                            locked={allLocked(g().members)}
                            onSelect={(e) => selectIds(ids(), e.shiftKey || e.ctrlKey || e.metaKey)}
                            onToggleHidden={() => setElementsVisible(ids(), allHidden(g().members))}
                            onToggleLocked={() => {
                                const lock = !allLocked(g().members);
                                g().members.forEach(m => updateElement(m.id, { locked: lock }));
                            }}
                        />
                        <Show when={isExpanded(g().id)}>
                            <For each={[...g().children].reverse()}>
                                {(child) => <Node node={child} depth={p.depth + 1} />}
                            </For>
                        </Show>
                    </>
                );
            }}
        </Show>
    );

    return (
        <div class="object-tree">
            <Show
                when={nodes().length > 0}
                fallback={<div class="ot-empty">No objects on this layer</div>}
            >
                <For each={nodes()}>{(node) => <Node node={node} depth={0} />}</For>
            </Show>
        </div>
    );
};

export default ObjectTree;
