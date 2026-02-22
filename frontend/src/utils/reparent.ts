/**
 * Reparent utility — drag-to-reparent with SweetAlert2 confirmation.
 */
import Swal from 'sweetalert2';
import { store, updateElement, pushToHistory, setStore, setParent } from '../store/app-store';
import { generateId } from './id-generator';
import { getBranchInfo } from './mindmap-layout';
import { refreshBoundLine } from './binding-logic';
import { getDescendants } from './hierarchy';
import type { DrawingElement } from '../types';

/**
 * Show a SweetAlert2 confirmation and, if accepted, reparent childId under newParentId.
 * Removes the old connector, updates parentId, creates a new organicBranch,
 * and auto-aligns the child (with its subtree) next to existing siblings.
 */
export async function confirmAndReparent(childId: string, newParentId: string) {
    const child = store.elements.find(e => e.id === childId);
    const newParent = store.elements.find(e => e.id === newParentId);
    if (!child || !newParent) return;

    const childLabel = child.containerText || child.text || child.type;
    const parentLabel = newParent.containerText || newParent.text || newParent.type;

    const result = await Swal.fire({
        title: 'Reparent Node?',
        html: `Move <b>${childLabel}</b> under <b>${parentLabel}</b>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, move it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
    });

    if (!result.isConfirmed) return;

    pushToHistory();

    // 1. Remove old connector(s) from old parent to child
    const oldParentId = child.parentId;
    if (oldParentId) {
        const oldConnectors = store.elements.filter(e =>
            (e.type === 'organicBranch' || e.type === 'arrow' || e.type === 'line' || e.type === 'bezier') &&
            e.startBinding?.elementId === oldParentId &&
            e.endBinding?.elementId === childId
        );

        for (const conn of oldConnectors) {
            // Remove from old parent's boundElements
            const oldParent = store.elements.find(e => e.id === oldParentId);
            if (oldParent?.boundElements) {
                updateElement(oldParentId, {
                    boundElements: oldParent.boundElements.filter(b => b.id !== conn.id)
                }, false);
            }
            // Remove from child's boundElements
            if (child.boundElements) {
                updateElement(childId, {
                    boundElements: child.boundElements.filter(b => b.id !== conn.id)
                }, false);
            }
            // Delete the connector element
            setStore("elements", els => els.filter(e => e.id !== conn.id));
        }
    }

    // 2. Update parentId
    setParent(childId, newParentId);

    // 3. Auto-align: position child next to existing siblings under new parent
    const hOffset = 100;
    const vGap = 40;
    const existingSiblings = store.elements.filter(
        e => e.parentId === newParentId && e.id !== childId &&
        e.type !== 'organicBranch' && e.type !== 'arrow' && e.type !== 'line' && e.type !== 'bezier'
    );

    let targetX: number;
    let targetY: number;

    if (existingSiblings.length > 0) {
        // Place below the last sibling (like addSiblingNode)
        const lastSibling = existingSiblings.reduce((a, b) => (a.y + a.height > b.y + b.height) ? a : b);
        targetX = lastSibling.x;
        targetY = lastSibling.y + lastSibling.height + vGap;
    } else {
        // First child — place 100px to the right of parent (like addChildNode)
        targetX = newParent.x + newParent.width + hOffset;
        targetY = newParent.y;
    }

    // Move child and its entire subtree by the delta
    const dx = targetX - child.x;
    const dy = targetY - child.y;

    if (dx !== 0 || dy !== 0) {
        updateElement(childId, { x: child.x + dx, y: child.y + dy }, false);

        // Move all descendants (subtree) along with the child
        const descendants = getDescendants(childId, store.elements);
        for (const desc of descendants) {
            updateElement(desc.id, { x: desc.x + dx, y: desc.y + dy }, false);
        }

        // Also move any connectors bound within the subtree
        const subtreeIds = new Set([childId, ...descendants.map(d => d.id)]);
        for (const el of store.elements) {
            if ((el.type === 'organicBranch' || el.type === 'arrow' || el.type === 'line' || el.type === 'bezier') &&
                el.startBinding && el.endBinding &&
                subtreeIds.has(el.startBinding.elementId) && subtreeIds.has(el.endBinding.elementId)) {
                updateElement(el.id, {
                    x: el.x + dx,
                    y: el.y + dy,
                    controlPoints: el.controlPoints?.map((cp: any) => ({ x: cp.x + dx, y: cp.y + dy }))
                }, false);
            }
        }
    }

    // 4. Create new organicBranch connector
    const branch = getBranchInfo(newParentId, store.elements);
    const freshChild = store.elements.find(e => e.id === childId)!;
    const cStartX = newParent.x + newParent.width;
    const cStartY = newParent.y + newParent.height / 2;
    const cEndX = freshChild.x;
    const cEndY = freshChild.y + freshChild.height / 2;
    const cNX = Math.min(cStartX, cEndX), cNY = Math.min(cStartY, cEndY);
    const cNW = Math.abs(cEndX - cStartX) || 1;
    const cNH = Math.abs(cEndY - cStartY) || 1;
    const cRSX = cStartX - cNX, cRSY = cStartY - cNY, cREX = cEndX - cNX, cREY = cEndY - cNY;
    const cDX = cREX - cRSX;

    const connector: DrawingElement = {
        ...store.defaultElementStyles,
        id: generateId('organicBranch'),
        type: 'organicBranch',
        x: cNX,
        y: cNY,
        width: cNW,
        height: cNH,
        layerId: freshChild.layerId || store.activeLayerId,
        startBinding: { elementId: newParentId, gap: 0, position: 'right', focus: 0 },
        endBinding: { elementId: childId, gap: 0, position: 'left', focus: 0 },
        curveType: 'bezier',
        angle: 0,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        opacity: 100,
        renderStyle: newParent.renderStyle,
        strokeColor: branch.color,
        backgroundColor: 'transparent',
        fillStyle: newParent.fillStyle,
        strokeStyle: newParent.strokeStyle,
        strokeWidth: branch.strokeWidth,
        roughness: newParent.roughness,
        points: [cRSX, cRSY, cREX, cREY],
        controlPoints: [
            { x: cNX + cRSX + cDX * 0.5, y: cNY + cRSY },
            { x: cNX + cREX - cDX * 0.5, y: cNY + cREY }
        ]
    };

    const connectorId = connector.id;
    setStore("elements", els => [...els, connector]);

    // 5. Register connector in boundElements of both nodes
    setStore("elements", e => e.id === newParentId, "boundElements", b => [...(b || []), { id: connectorId, type: 'organicBranch' as const }]);
    setStore("elements", e => e.id === childId, "boundElements", b => [...(b || []), { id: connectorId, type: 'organicBranch' as const }]);

    // 6. Snap connector to actual shape boundaries
    refreshBoundLine(connectorId, () => store.elements, (id, upd) => updateElement(id, upd, false));

    // 7. Refresh all connectors within the subtree (they moved)
    if (dx !== 0 || dy !== 0) {
        const subtreeIds = new Set([childId, ...getDescendants(childId, store.elements).map(d => d.id)]);
        for (const el of store.elements) {
            if ((el.type === 'organicBranch' || el.type === 'arrow' || el.type === 'line' || el.type === 'bezier') &&
                el.startBinding && el.endBinding &&
                subtreeIds.has(el.startBinding.elementId) && subtreeIds.has(el.endBinding.elementId)) {
                refreshBoundLine(el.id, () => store.elements, (id, upd) => updateElement(id, upd, false));
            }
        }
    }
}
