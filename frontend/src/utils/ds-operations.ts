/**
 * DS Operations Engine
 * Real algorithm implementations for CRUD operations on Data Structure shapes.
 * Each operation mutates el.text (comma-separated values) and animates the transition.
 */

import { store, updateElement } from '../store/app-store';
import { animateElement } from './animation/element-animator';

// ─── Types ──────────────────────────────────────────────────────────

export interface DsOperation {
    action: string;
    label: string;
    needsValue: boolean;
    needsKey: boolean;
    needsIndex: boolean;
    destructive?: boolean;
    isAlgorithm?: boolean;
    category?: 'crud' | 'sort' | 'search' | 'traverse';
}

export interface DsOperationParams {
    value?: string;
    key?: string;
    index?: number;
}

// ─── Operations Registry ────────────────────────────────────────────

const DS_OPERATIONS: Record<string, DsOperation[]> = {
    dsArray: [
        { action: 'push', label: 'Push', needsValue: true, needsKey: false, needsIndex: false },
        { action: 'pop', label: 'Pop', needsValue: false, needsKey: false, needsIndex: false, destructive: true },
        { action: 'insertAt', label: 'Insert At', needsValue: true, needsKey: false, needsIndex: true },
        { action: 'removeAt', label: 'Remove At', needsValue: false, needsKey: false, needsIndex: true, destructive: true },
        { action: 'update', label: 'Update', needsValue: true, needsKey: false, needsIndex: true },
        { action: 'shuffle', label: 'Shuffle', needsValue: false, needsKey: false, needsIndex: false },
    ],
    dsStack: [
        { action: 'push', label: 'Push', needsValue: true, needsKey: false, needsIndex: false },
        { action: 'pop', label: 'Pop', needsValue: false, needsKey: false, needsIndex: false, destructive: true },
    ],
    dsQueue: [
        { action: 'enqueue', label: 'Enqueue', needsValue: true, needsKey: false, needsIndex: false },
        { action: 'dequeue', label: 'Dequeue', needsValue: false, needsKey: false, needsIndex: false, destructive: true },
    ],
    dsLinkedList: [
        { action: 'append', label: 'Append', needsValue: true, needsKey: false, needsIndex: false },
        { action: 'prepend', label: 'Prepend', needsValue: true, needsKey: false, needsIndex: false },
        { action: 'removeFirst', label: 'Remove First', needsValue: false, needsKey: false, needsIndex: false, destructive: true },
        { action: 'removeLast', label: 'Remove Last', needsValue: false, needsKey: false, needsIndex: false, destructive: true },
    ],
    dsBinaryTree: [
        { action: 'insert', label: 'Insert', needsValue: true, needsKey: false, needsIndex: false },
        { action: 'remove', label: 'Remove', needsValue: true, needsKey: false, needsIndex: false, destructive: true },
    ],
    dsHashTable: [
        { action: 'put', label: 'Put', needsValue: true, needsKey: true, needsIndex: false },
        { action: 'remove', label: 'Remove', needsValue: false, needsKey: true, needsIndex: false, destructive: true },
    ],
};

const DS_ALGO_OPERATIONS: Record<string, DsOperation[]> = {
    dsArray: [
        { action: 'bubbleSort', label: 'Bubble Sort', needsValue: false, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'sort' },
        { action: 'selectionSort', label: 'Selection Sort', needsValue: false, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'sort' },
        { action: 'insertionSort', label: 'Insertion Sort', needsValue: false, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'sort' },
        { action: 'linearSearch', label: 'Linear Search', needsValue: true, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'search' },
        { action: 'binarySearch', label: 'Binary Search', needsValue: true, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'search' },
    ],
    dsBinaryTree: [
        { action: 'bfs', label: 'BFS', needsValue: false, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'traverse' },
        { action: 'dfsInorder', label: 'DFS In-order', needsValue: false, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'traverse' },
        { action: 'dfsPreorder', label: 'DFS Pre-order', needsValue: false, needsKey: false, needsIndex: false, isAlgorithm: true, category: 'traverse' },
    ],
};

export function getOperationsForType(type: string): DsOperation[] {
    const crud = DS_OPERATIONS[type] || [];
    const algos = DS_ALGO_OPERATIONS[type] || [];
    return [...crud, ...algos];
}

// ─── Value Parsing ──────────────────────────────────────────────────

function parseValues(text: string | undefined): string[] {
    if (!text) return [];
    return text.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

// ─── BST Algorithms (Heap Array) ────────────────────────────────────

/**
 * BST Insert into heap array representation.
 * Traverses: compare at index i, go left (2i+1) if smaller, right (2i+2) if larger.
 * Extends array with '_' placeholders as needed.
 */
function bstInsert(values: string[], val: string): { newValues: string[]; insertIndex: number } {
    const result = [...values];

    if (result.length === 0 || (result.length === 1 && result[0] === '_')) {
        if (result.length === 0) result.push(val);
        else result[0] = val;
        return { newValues: result, insertIndex: 0 };
    }

    const numVal = parseFloat(val);
    let i = 0;

    while (i < result.length && result[i] !== '_') {
        const current = parseFloat(result[i]);
        const useNumeric = !isNaN(numVal) && !isNaN(current);

        if (useNumeric) {
            i = numVal < current ? 2 * i + 1 : 2 * i + 2;
        } else {
            i = val < result[i] ? 2 * i + 1 : 2 * i + 2;
        }
    }

    // Extend array with '_' placeholders up to index i
    while (result.length <= i) result.push('_');
    result[i] = val;

    return { newValues: result, insertIndex: i };
}

/**
 * BST Remove: proper deletion with in-order successor replacement.
 * Handles leaf, one-child, and two-child cases correctly to avoid orphan nodes.
 *
 * Algorithm:
 *   Leaf → set to '_'
 *   One child → move child subtree up to replace deleted node
 *   Two children → swap with in-order successor (smallest in right subtree), then delete successor
 */
function bstRemove(values: string[], val: string): { newValues: string[]; removeIndex: number } {
    const result = [...values];
    const idx = result.findIndex(v => v === val);
    if (idx === -1) return { newValues: result, removeIndex: -1 };

    bstDeleteAt(result, idx);

    // Trim trailing underscores
    while (result.length > 0 && result[result.length - 1] === '_') {
        result.pop();
    }

    return { newValues: result, removeIndex: idx };
}

/** Check if a node exists at index i in the heap array */
function nodeAt(values: string[], i: number): boolean {
    return i < values.length && values[i] !== undefined && values[i] !== '_';
}

/** Delete node at idx, handling all three BST cases */
function bstDeleteAt(values: string[], idx: number): void {
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;
    const hasLeft = nodeAt(values, left);
    const hasRight = nodeAt(values, right);

    if (!hasLeft && !hasRight) {
        // Case 1: Leaf — just remove
        values[idx] = '_';
        return;
    }

    if (hasLeft && hasRight) {
        // Case 3: Two children — find in-order successor (leftmost in right subtree)
        let succ = right;
        while (nodeAt(values, 2 * succ + 1)) {
            succ = 2 * succ + 1;
        }
        // Replace current value with successor, then delete successor
        values[idx] = values[succ];
        bstDeleteAt(values, succ);
        return;
    }

    // Case 2: One child — move child subtree up to replace this node
    const child = hasLeft ? left : right;
    moveSubtreeUp(values, child, idx);
}

/**
 * Move entire subtree rooted at `from` to position `to` in the heap array.
 * Collects all nodes with relative positions, clears source, places at target.
 */
function moveSubtreeUp(values: string[], from: number, to: number): void {
    // Collect all nodes in source subtree with their relative positions
    const subtree: Map<number, string> = new Map();
    collectRelative(values, from, 0, subtree);

    // Clear the source subtree
    clearSubtree(values, from);
    // Clear the target node being replaced
    values[to] = '_';

    // Place collected nodes at target root using relative positions
    for (const [relIdx, val] of subtree) {
        const absIdx = relToAbs(to, relIdx);
        while (values.length <= absIdx) values.push('_');
        values[absIdx] = val;
    }
}

/** Collect subtree nodes with relative indices (0=root, 1=left, 2=right, ...) */
function collectRelative(values: string[], absRoot: number, relIdx: number, result: Map<number, string>): void {
    if (!nodeAt(values, absRoot)) return;
    result.set(relIdx, values[absRoot]);
    collectRelative(values, 2 * absRoot + 1, 2 * relIdx + 1, result);
    collectRelative(values, 2 * absRoot + 2, 2 * relIdx + 2, result);
}

/** Clear all nodes in subtree rooted at root */
function clearSubtree(values: string[], root: number): void {
    if (root >= values.length || values[root] === '_' || values[root] === undefined) return;
    values[root] = '_';
    clearSubtree(values, 2 * root + 1);
    clearSubtree(values, 2 * root + 2);
}

/** Convert relative tree index (0=root of subtree) to absolute heap index when tree is rooted at absRoot */
function relToAbs(absRoot: number, relIdx: number): number {
    if (relIdx === 0) return absRoot;
    // Trace path from relIdx to root: build sequence of left/right turns
    const path: boolean[] = []; // true = right child, false = left child
    let r = relIdx;
    while (r > 0) {
        path.push(r % 2 === 0); // even index = right child
        r = Math.floor((r - 1) / 2);
    }
    // Replay path from absRoot
    let current = absRoot;
    for (let i = path.length - 1; i >= 0; i--) {
        current = path[i] ? 2 * current + 2 : 2 * current + 1;
    }
    return current;
}

// ─── Hash Table Algorithms ──────────────────────────────────────────

/** Same hash function as the renderer (must match for visual consistency) */
function simpleHash(key: string, capacity: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % capacity;
}

/**
 * Hash Table Put: adds or replaces a key:value entry.
 * Uses simpleHash to determine bucket — the renderer distributes visually.
 */
function hashTablePut(values: string[], key: string, value: string): string[] {
    // Remove existing entry with same key
    const filtered = values.filter(v => {
        const colonIdx = v.indexOf(':');
        const k = colonIdx > 0 ? v.substring(0, colonIdx).trim() : v.trim();
        return k !== key;
    });
    return [...filtered, value ? `${key}:${value}` : key];
}

/** Hash Table Remove: filters out entries matching the key */
function hashTableRemove(values: string[], key: string): string[] {
    return values.filter(v => {
        const colonIdx = v.indexOf(':');
        const k = colonIdx > 0 ? v.substring(0, colonIdx).trim() : v.trim();
        return k !== key;
    });
}

// ─── Animation Orchestration ────────────────────────────────────────

/**
 * Animate a CRUD operation: highlight target index, animate progress, commit new text.
 *
 * For insert: set new text immediately + dsOpInsert style → item fades in.
 * For remove: keep old text + dsOpRemove style → item fades out, then commit.
 * For update: set new text immediately + dsOpUpdate style → highlight pulse.
 */
function animateDsOperation(
    elementId: string,
    highlightIndex: number,
    animStyle: 'dsOpInsert' | 'dsOpRemove' | 'dsOpUpdate',
    _oldValues: string[],
    newValues: string[]
): Promise<void> {
    return new Promise((resolve) => {
        const el = store.elements.find(e => e.id === elementId);
        if (!el) { resolve(); return; }

        if (animStyle === 'dsOpRemove') {
            // For remove: keep old text during animation, commit after
            updateElement(elementId, {
                dsHighlightIndex: highlightIndex,
                dsAnimStyle: animStyle,
                dsAnimProgress: 0,
            } as any, false);

            animateElement(elementId, { dsAnimProgress: 100 } as any, {
                duration: 400,
                easing: 'easeOutCubic' as any,
                onComplete: () => {
                    updateElement(elementId, {
                        text: newValues.join(', '),
                        dsHighlightIndex: -1,
                        dsAnimProgress: undefined,
                        dsAnimStyle: undefined,
                    } as any, false);
                    resolve();
                },
            });
        } else {
            // For insert/update: set new text immediately, animate fade-in
            updateElement(elementId, {
                text: newValues.join(', '),
                dsHighlightIndex: highlightIndex,
                dsAnimStyle: animStyle,
                dsAnimProgress: 0,
            } as any, false);

            animateElement(elementId, { dsAnimProgress: 100 } as any, {
                duration: 400,
                easing: 'easeOutCubic' as any,
                onComplete: () => {
                    updateElement(elementId, {
                        dsHighlightIndex: -1,
                        dsAnimProgress: undefined,
                        dsAnimStyle: undefined,
                    } as any, false);
                    resolve();
                },
            });
        }
    });
}

// ─── Main Execute Function ──────────────────────────────────────────

/**
 * Execute a CRUD operation on a DS element with animation.
 * Implements real algorithms for each operation type.
 */
export async function executeDsOperation(
    elementId: string,
    action: string,
    params: DsOperationParams
): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;

    const values = parseValues(el.text);
    let newValues: string[];
    let highlightIndex = -1;
    let animStyle: 'dsOpInsert' | 'dsOpRemove' | 'dsOpUpdate' = 'dsOpInsert';

    switch (action) {
        // ── Array / Stack: push ──
        case 'push': {
            if (!params.value?.trim()) return;
            newValues = [...values, params.value.trim()];
            highlightIndex = newValues.length - 1;
            animStyle = 'dsOpInsert';
            break;
        }

        // ── Array / Stack: pop ──
        case 'pop': {
            if (values.length === 0) return;
            highlightIndex = values.length - 1;
            animStyle = 'dsOpRemove';
            newValues = values.slice(0, -1);
            break;
        }

        // ── Queue: enqueue (add to back) ──
        case 'enqueue': {
            if (!params.value?.trim()) return;
            newValues = [...values, params.value.trim()];
            highlightIndex = newValues.length - 1;
            animStyle = 'dsOpInsert';
            break;
        }

        // ── Queue: dequeue (remove from front) ──
        case 'dequeue': {
            if (values.length === 0) return;
            highlightIndex = 0;
            animStyle = 'dsOpRemove';
            newValues = values.slice(1);
            break;
        }

        // ── LinkedList: append (add to end) ──
        case 'append': {
            if (!params.value?.trim()) return;
            newValues = [...values, params.value.trim()];
            highlightIndex = newValues.length - 1;
            animStyle = 'dsOpInsert';
            break;
        }

        // ── LinkedList: prepend (add to start) ──
        case 'prepend': {
            if (!params.value?.trim()) return;
            newValues = [params.value.trim(), ...values];
            highlightIndex = 0;
            animStyle = 'dsOpInsert';
            break;
        }

        // ── LinkedList: removeFirst ──
        case 'removeFirst': {
            if (values.length === 0) return;
            highlightIndex = 0;
            animStyle = 'dsOpRemove';
            newValues = values.slice(1);
            break;
        }

        // ── LinkedList: removeLast ──
        case 'removeLast': {
            if (values.length === 0) return;
            highlightIndex = values.length - 1;
            animStyle = 'dsOpRemove';
            newValues = values.slice(0, -1);
            break;
        }

        // ── Array: insertAt ──
        case 'insertAt': {
            if (!params.value?.trim()) return;
            const idx = Math.max(0, Math.min(params.index ?? 0, values.length));
            newValues = [...values.slice(0, idx), params.value.trim(), ...values.slice(idx)];
            highlightIndex = idx;
            animStyle = 'dsOpInsert';
            break;
        }

        // ── Array: removeAt ──
        case 'removeAt': {
            const idx = params.index ?? 0;
            if (idx < 0 || idx >= values.length) return;
            highlightIndex = idx;
            animStyle = 'dsOpRemove';
            newValues = [...values.slice(0, idx), ...values.slice(idx + 1)];
            break;
        }

        // ── Array: shuffle (Fisher-Yates) ──
        case 'shuffle': {
            if (values.length <= 1) return;
            newValues = [...values];
            for (let i = newValues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newValues[i], newValues[j]] = [newValues[j], newValues[i]];
            }
            highlightIndex = -1;
            animStyle = 'dsOpUpdate';
            break;
        }

        // ── Array: update (replace value at index) ──
        case 'update': {
            if (!params.value?.trim()) return;
            const idx = params.index ?? 0;
            if (idx < 0 || idx >= values.length) return;
            newValues = [...values];
            newValues[idx] = params.value.trim();
            highlightIndex = idx;
            animStyle = 'dsOpUpdate';
            break;
        }

        // ── BinaryTree: BST insert ──
        case 'insert': {
            if (!params.value?.trim()) return;
            if (el.type === 'dsBinaryTree') {
                const result = bstInsert(values, params.value.trim());
                newValues = result.newValues;
                highlightIndex = result.insertIndex;
                animStyle = 'dsOpInsert';
            } else {
                return;
            }
            break;
        }

        // ── BinaryTree: BST remove / HashTable: remove by key ──
        case 'remove': {
            if (el.type === 'dsBinaryTree') {
                if (!params.value?.trim()) return;
                const result = bstRemove(values, params.value.trim());
                if (result.removeIndex === -1) return; // not found
                newValues = result.newValues;
                highlightIndex = result.removeIndex;
                animStyle = 'dsOpRemove';
            } else if (el.type === 'dsHashTable') {
                if (!params.key?.trim()) return;
                const key = params.key.trim();
                // Find the bucket index for visual highlight
                const capacity = el.dsCapacity || 5;
                highlightIndex = simpleHash(key, capacity);
                newValues = hashTableRemove(values, key);
                if (newValues.length === values.length) return; // key not found
                animStyle = 'dsOpRemove';
            } else {
                return;
            }
            break;
        }

        // ── HashTable: put (key:value) ──
        case 'put': {
            if (!params.key?.trim()) return;
            const key = params.key.trim();
            const val = params.value?.trim() || '';
            const capacity = el.dsCapacity || 5;
            highlightIndex = simpleHash(key, capacity);
            newValues = hashTablePut(values, key, val);
            animStyle = 'dsOpInsert';
            break;
        }

        default:
            return;
    }

    await animateDsOperation(elementId, highlightIndex, animStyle, values, newValues);
}

// ─── Algorithm Animation Engine ─────────────────────────────────────

let activeDsAlgorithmAbort: AbortController | null = null;
let dsAnimationSpeed: 'slow' | 'medium' | 'fast' = 'medium';
const SPEED_MS: Record<string, number> = { slow: 800, medium: 400, fast: 200 };

export function abortDsAlgorithm(): void {
    if (activeDsAlgorithmAbort) {
        activeDsAlgorithmAbort.abort();
        activeDsAlgorithmAbort = null;
    }
}

export function isDsAlgorithmRunning(): boolean {
    return activeDsAlgorithmAbort !== null;
}

export function setDsAnimationSpeed(speed: 'slow' | 'medium' | 'fast'): void {
    dsAnimationSpeed = speed;
}

export function getDsAnimationSpeed(): 'slow' | 'medium' | 'fast' {
    return dsAnimationSpeed;
}

function clearDsHighlights(elementId: string): void {
    updateElement(elementId, {
        dsHighlightIndex: -1,
        dsHighlightIndex2: undefined,
        dsHighlightColor: undefined,
        dsHighlightColor2: undefined,
        dsSortedBoundary: undefined,
        dsSortedBoundaryEnd: undefined,
        dsAnimProgress: undefined,
        dsAnimStyle: undefined,
    } as any, false);
}

/**
 * Single animation step: set highlights, wait for duration, check abort.
 * Returns true if successful, false if aborted.
 */
async function animateDsStep(
    elementId: string,
    updates: Record<string, any>,
    signal: AbortSignal
): Promise<boolean> {
    if (signal.aborted) return false;
    const duration = SPEED_MS[dsAnimationSpeed];

    updateElement(elementId, updates as any, false);

    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', abortHandler);
            resolve(!signal.aborted);
        }, duration);

        const abortHandler = () => {
            clearTimeout(timer);
            resolve(false);
        };
        signal.addEventListener('abort', abortHandler, { once: true });
    });
}

function compareValues(a: string, b: string): number {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
}

// ─── Sort Algorithms ────────────────────────────────────────────────

async function bubbleSort(elementId: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;
    if (n <= 1) return;

    for (let i = n - 1; i > 0; i--) {
        for (let j = 0; j < i; j++) {
            // Compare
            const ok = await animateDsStep(elementId, {
                dsHighlightIndex: j,
                dsHighlightIndex2: j + 1,
                dsHighlightColor: 'comparing',
                dsHighlightColor2: 'comparing',
                dsSortedBoundaryEnd: i < n - 1 ? i + 1 : undefined,
            }, signal);
            if (!ok) return;

            if (compareValues(values[j], values[j + 1]) > 0) {
                // Swap
                [values[j], values[j + 1]] = [values[j + 1], values[j]];
                const ok2 = await animateDsStep(elementId, {
                    text: values.join(', '),
                    dsHighlightIndex: j,
                    dsHighlightIndex2: j + 1,
                    dsHighlightColor: 'swapping',
                    dsHighlightColor2: 'swapping',
                    dsSortedBoundaryEnd: i < n - 1 ? i + 1 : undefined,
                }, signal);
                if (!ok2) return;
            }
        }
        // Mark i as sorted
        updateElement(elementId, {
            dsSortedBoundaryEnd: i,
        } as any, false);
    }

    // Final: all sorted
    await animateDsStep(elementId, {
        dsHighlightIndex: -1,
        dsHighlightIndex2: undefined,
        dsHighlightColor: 'sorted',
        dsSortedBoundary: n,
        dsSortedBoundaryEnd: undefined,
    }, signal);
}

async function selectionSort(elementId: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;
    if (n <= 1) return;

    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;

        for (let j = i + 1; j < n; j++) {
            const ok = await animateDsStep(elementId, {
                dsHighlightIndex: minIdx,
                dsHighlightIndex2: j,
                dsHighlightColor: 'sorted',
                dsHighlightColor2: 'comparing',
                dsSortedBoundary: i > 0 ? i : undefined,
            }, signal);
            if (!ok) return;

            if (compareValues(values[j], values[minIdx]) < 0) {
                minIdx = j;
            }
        }

        if (minIdx !== i) {
            [values[i], values[minIdx]] = [values[minIdx], values[i]];
            const ok = await animateDsStep(elementId, {
                text: values.join(', '),
                dsHighlightIndex: i,
                dsHighlightIndex2: minIdx,
                dsHighlightColor: 'swapping',
                dsHighlightColor2: 'swapping',
                dsSortedBoundary: i > 0 ? i : undefined,
            }, signal);
            if (!ok) return;
        }

        updateElement(elementId, {
            dsSortedBoundary: i + 1,
        } as any, false);
    }

    // Final: all sorted
    await animateDsStep(elementId, {
        dsHighlightIndex: -1,
        dsHighlightIndex2: undefined,
        dsHighlightColor: 'sorted',
        dsSortedBoundary: n,
    }, signal);
}

async function insertionSort(elementId: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;
    if (n <= 1) return;

    for (let i = 1; i < n; i++) {
        const key = values[i];

        // Highlight current element being inserted
        let ok = await animateDsStep(elementId, {
            dsHighlightIndex: i,
            dsHighlightIndex2: undefined,
            dsHighlightColor: 'comparing',
            dsSortedBoundary: i,
        }, signal);
        if (!ok) return;

        let j = i - 1;
        while (j >= 0 && compareValues(values[j], key) > 0) {
            values[j + 1] = values[j];
            ok = await animateDsStep(elementId, {
                text: values.join(', '),
                dsHighlightIndex: j,
                dsHighlightIndex2: j + 1,
                dsHighlightColor: 'swapping',
                dsHighlightColor2: 'swapping',
                dsSortedBoundary: i,
            }, signal);
            if (!ok) return;
            j--;
        }
        values[j + 1] = key;
        updateElement(elementId, {
            text: values.join(', '),
            dsSortedBoundary: i + 1,
        } as any, false);
    }

    // Final: all sorted
    await animateDsStep(elementId, {
        dsHighlightIndex: -1,
        dsHighlightIndex2: undefined,
        dsHighlightColor: 'sorted',
        dsSortedBoundary: n,
    }, signal);
}

// ─── Search Algorithms ──────────────────────────────────────────────

async function linearSearch(elementId: string, target: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;

    for (let i = 0; i < n; i++) {
        const ok = await animateDsStep(elementId, {
            dsHighlightIndex: i,
            dsHighlightIndex2: undefined,
            dsHighlightColor: 'searching',
        }, signal);
        if (!ok) return;

        if (values[i] === target || (parseFloat(values[i]) === parseFloat(target) && !isNaN(parseFloat(target)))) {
            // Found
            await animateDsStep(elementId, {
                dsHighlightIndex: i,
                dsHighlightColor: 'found',
            }, signal);
            return;
        }
    }

    // Not found — flash red briefly
    await animateDsStep(elementId, {
        dsHighlightIndex: -1,
        dsHighlightColor: 'notfound',
    }, signal);
}

async function binarySearch(elementId: string, target: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;
    const targetNum = parseFloat(target);

    let low = 0;
    let high = n - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        // Highlight search range + mid
        const ok = await animateDsStep(elementId, {
            dsHighlightIndex: mid,
            dsHighlightIndex2: undefined,
            dsHighlightColor: 'searching',
            dsSortedBoundary: low,
            dsSortedBoundaryEnd: n - high,
        }, signal);
        if (!ok) return;

        const midVal = values[mid];
        const cmp = !isNaN(targetNum) && !isNaN(parseFloat(midVal))
            ? parseFloat(midVal) - targetNum
            : midVal.localeCompare(target);

        if (cmp === 0) {
            // Found
            await animateDsStep(elementId, {
                dsHighlightIndex: mid,
                dsHighlightColor: 'found',
                dsSortedBoundary: undefined,
                dsSortedBoundaryEnd: undefined,
            }, signal);
            return;
        }

        if (cmp < 0) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    // Not found
    await animateDsStep(elementId, {
        dsHighlightIndex: -1,
        dsHighlightColor: 'notfound',
        dsSortedBoundary: undefined,
        dsSortedBoundaryEnd: undefined,
    }, signal);
}

// ─── Tree Traversals ────────────────────────────────────────────────

async function bfsTraversal(elementId: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;
    if (n === 0) return;

    const queue: number[] = [0];

    while (queue.length > 0) {
        const idx = queue.shift()!;
        if (idx >= n || values[idx] === '_') continue;

        // Visit node
        const ok = await animateDsStep(elementId, {
            dsHighlightIndex: idx,
            dsHighlightIndex2: undefined,
            dsHighlightColor: 'found',
        }, signal);
        if (!ok) return;

        // Enqueue children
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        if (left < n && values[left] !== '_') queue.push(left);
        if (right < n && values[right] !== '_') queue.push(right);
    }
}

async function dfsInorderTraversal(elementId: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;

    async function visit(idx: number): Promise<boolean> {
        if (idx >= n || values[idx] === '_') return true;
        if (signal.aborted) return false;

        // Left
        if (!await visit(2 * idx + 1)) return false;

        // Root (visit)
        const ok = await animateDsStep(elementId, {
            dsHighlightIndex: idx,
            dsHighlightIndex2: undefined,
            dsHighlightColor: 'found',
        }, signal);
        if (!ok) return false;

        // Right
        if (!await visit(2 * idx + 2)) return false;

        return true;
    }

    await visit(0);
}

async function dfsPreorderTraversal(elementId: string, signal: AbortSignal): Promise<void> {
    const el = store.elements.find(e => e.id === elementId);
    if (!el) return;
    const values = parseValues(el.text);
    const n = values.length;

    async function visit(idx: number): Promise<boolean> {
        if (idx >= n || values[idx] === '_') return true;
        if (signal.aborted) return false;

        // Root (visit)
        const ok = await animateDsStep(elementId, {
            dsHighlightIndex: idx,
            dsHighlightIndex2: undefined,
            dsHighlightColor: 'found',
        }, signal);
        if (!ok) return false;

        // Left
        if (!await visit(2 * idx + 1)) return false;

        // Right
        if (!await visit(2 * idx + 2)) return false;

        return true;
    }

    await visit(0);
}

// ─── Algorithm Dispatcher ───────────────────────────────────────────

export async function executeDsSortSearch(
    elementId: string,
    action: string,
    params: DsOperationParams
): Promise<void> {
    // Abort any running algorithm
    abortDsAlgorithm();

    const controller = new AbortController();
    activeDsAlgorithmAbort = controller;

    try {
        switch (action) {
            case 'bubbleSort': await bubbleSort(elementId, controller.signal); break;
            case 'selectionSort': await selectionSort(elementId, controller.signal); break;
            case 'insertionSort': await insertionSort(elementId, controller.signal); break;
            case 'linearSearch': await linearSearch(elementId, params.value || '', controller.signal); break;
            case 'binarySearch': await binarySearch(elementId, params.value || '', controller.signal); break;
            case 'bfs': await bfsTraversal(elementId, controller.signal); break;
            case 'dfsInorder': await dfsInorderTraversal(elementId, controller.signal); break;
            case 'dfsPreorder': await dfsPreorderTraversal(elementId, controller.signal); break;
        }
    } finally {
        // Clean up highlights if not aborted mid-way (abort handler already cleans)
        if (!controller.signal.aborted) {
            clearDsHighlights(elementId);
        }
        if (activeDsAlgorithmAbort === controller) {
            activeDsAlgorithmAbort = null;
        }
    }
}
