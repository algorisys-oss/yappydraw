import {
    store, setStore, setSelectedTool, toggleGrid, toggleSnapToGrid, toggleZenMode,
    togglePropertyPanel, toggleLayerPanel, toggleMinimap, zoomToFit, zoomToSelection,
    groupSelected, ungroupSelected, bringToFront, sendToBack,
    moveElementZIndex, undo, redo, deleteElements, toggleTheme,
    setActiveLayer, clearHistory, addLayer, setViewState, togglePresentationMode
} from "../store/app-store";
import { flipSelected, lockSelected } from "./object-context-actions";
import { setIsDSLImportOpen } from "../components/menu";

export interface Command {
    id: string;
    label: string;
    category: 'Tools' | 'Actions' | 'View' | 'Layers' | 'File';
    action: () => void;
    shortcut?: string;
}

export const getCommands = (): Command[] => {
    const commands: Command[] = [
        // Tools
        { id: 'tool-selection', label: 'Selection Tool', category: 'Tools', action: () => setSelectedTool('selection'), shortcut: 'V' },
        { id: 'tool-rectangle', label: 'Rectangle Tool', category: 'Tools', action: () => setSelectedTool('rectangle'), shortcut: 'R' },
        { id: 'tool-circle', label: 'Circle Tool', category: 'Tools', action: () => setSelectedTool('circle'), shortcut: 'O' },
        { id: 'tool-line', label: 'Line Tool', category: 'Tools', action: () => setSelectedTool('line'), shortcut: 'L' },
        { id: 'tool-arrow', label: 'Arrow Tool', category: 'Tools', action: () => setSelectedTool('arrow'), shortcut: 'A' },
        { id: 'tool-text', label: 'Text Tool', category: 'Tools', action: () => setSelectedTool('text'), shortcut: 'T' },
        { id: 'tool-eraser', label: 'Eraser Tool', category: 'Tools', action: () => setSelectedTool('eraser'), shortcut: 'E' },
        { id: 'tool-bezier', label: 'Bezier Tool', category: 'Tools', action: () => setSelectedTool('bezier'), shortcut: 'B' },
        { id: 'tool-diamond', label: 'Diamond Tool', category: 'Tools', action: () => setSelectedTool('diamond'), shortcut: 'D' },
        { id: 'tool-pan', label: 'Pan Tool', category: 'Tools', action: () => setSelectedTool('pan'), shortcut: 'H' },
        { id: 'tool-lasso', label: 'Lasso Selection Tool', category: 'Tools', action: () => setSelectedTool('lasso'), shortcut: 'Shift+L' },

        // Actions
        { id: 'action-undo', label: 'Undo', category: 'Actions', action: () => undo(), shortcut: 'Ctrl+Z' },
        { id: 'action-redo', label: 'Redo', category: 'Actions', action: () => redo(), shortcut: 'Ctrl+Y' },
        { id: 'action-group', label: 'Group Selection', category: 'Actions', action: () => groupSelected(), shortcut: 'Ctrl+G' },
        { id: 'action-ungroup', label: 'Ungroup Selection', category: 'Actions', action: () => ungroupSelected(), shortcut: 'Ctrl+Shift+G' },
        { id: 'action-front', label: 'Bring to Front', category: 'Actions', action: () => bringToFront(store.selection), shortcut: 'Ctrl+]' },
        { id: 'action-back', label: 'Send to Back', category: 'Actions', action: () => sendToBack(store.selection), shortcut: 'Ctrl+[' },
        { id: 'action-forward', label: 'Bring Forward', category: 'Actions', action: () => moveElementZIndex(store.selection[0], 'forward') },
        { id: 'action-backward', label: 'Send Backward', category: 'Actions', action: () => moveElementZIndex(store.selection[0], 'backward') },
        { id: 'action-delete', label: 'Delete Selected', category: 'Actions', action: () => deleteElements(store.selection), shortcut: 'Del' },
        { id: 'action-flip-h', label: 'Flip Horizontal', category: 'Actions', action: () => flipSelected('horizontal'), shortcut: 'Shift+H' },
        { id: 'action-flip-v', label: 'Flip Vertical', category: 'Actions', action: () => flipSelected('vertical'), shortcut: 'Shift+V' },
        { id: 'action-lock', label: 'Lock / Unlock', category: 'Actions', action: () => {
            const isLocked = store.selection.some(id => store.elements.find(e => e.id === id)?.locked);
            lockSelected(!isLocked);
        }, shortcut: 'Ctrl+Shift+L' },

        // View
        { id: 'view-grid', label: 'Toggle Grid', category: 'View', action: () => toggleGrid(), shortcut: 'Shift+\'' },
        { id: 'view-snap', label: 'Toggle Snap to Grid', category: 'View', action: () => toggleSnapToGrid(), shortcut: 'Shift+;' },
        { id: 'view-zen', label: 'Toggle Zen Mode', category: 'View', action: () => toggleZenMode(), shortcut: 'Alt+Z' },
        { id: 'view-properties', label: 'Toggle Properties Panel', category: 'View', action: () => togglePropertyPanel(), shortcut: 'Alt+Enter' },
        { id: 'view-layers', label: 'Toggle Layers Panel', category: 'View', action: () => toggleLayerPanel(), shortcut: 'Alt+L' },
        { id: 'view-minimap', label: 'Toggle Minimap', category: 'View', action: () => toggleMinimap(), shortcut: 'Alt+M' },
        { id: 'view-zoom-in', label: 'Zoom In', category: 'View', action: () => {
            const s = store.viewState;
            const newScale = Math.min(s.scale * 1.1, 10);
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
            setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
        }, shortcut: 'Ctrl+=' },
        { id: 'view-zoom-out', label: 'Zoom Out', category: 'View', action: () => {
            const s = store.viewState;
            const newScale = Math.max(s.scale * 0.9, 0.1);
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
            setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
        }, shortcut: 'Ctrl+-' },
        { id: 'view-zoom-reset', label: 'Reset Zoom (100%)', category: 'View', action: () => setViewState({ scale: 1 }), shortcut: 'Ctrl+0' },
        { id: 'view-zoom-fit', label: 'Zoom to Fit', category: 'View', action: () => zoomToFit(), shortcut: 'Ctrl+1' },
        { id: 'view-zoom-selection', label: 'Zoom to Selection', category: 'View', action: () => zoomToSelection(), shortcut: 'Ctrl+2' },
        { id: 'view-theme', label: 'Toggle Theme', category: 'View', action: () => toggleTheme() },
        { id: 'view-present-start', label: 'Present from Beginning', category: 'View', action: () => togglePresentationMode(true, 0), shortcut: 'F5' },
        { id: 'view-present-current', label: 'Present from Current Slide', category: 'View', action: () => togglePresentationMode(true), shortcut: 'Shift+F5' },

        // File
        {
            id: 'file-new', label: 'New Sketch', category: 'File', action: () => {
                if (confirm('Start new sketch? Unsaved changes will be lost.')) {
                    setStore("elements", []);
                    setStore("viewState", { scale: 1, panX: 0, panY: 0 });
                    setStore("selection", []);
                    setStore("layers", [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }]);
                    setStore("activeLayerId", 'default-layer');
                    setStore("welcomeDismissed", true);
                    clearHistory();
                }
            },
            shortcut: 'Alt+N'
        },
        { id: 'action-add-layer', label: 'Add Layer', category: 'Layers', action: () => addLayer(), shortcut: 'Ctrl+Shift+N' },

        // DSL Import
        { id: 'file-import-dsl', label: 'Import Diagram from Text', category: 'File', action: () => setIsDSLImportOpen(true), shortcut: 'Ctrl+Shift+I' },
    ];

    // Dynamic Layer Commands
    store.layers.forEach(layer => {
        commands.push({
            id: `layer-${layer.id}`,
            label: `Activate Layer: ${layer.name}`,
            category: 'Layers',
            action: () => setActiveLayer(layer.id)
        });
    });

    return commands;
};

// Helper for fuzzy search or prefix search
export const searchCommands = (query: string): Command[] => {
    const all = getCommands();
    if (!query) return all.slice(0, 10); // Default items

    const q = query.toLowerCase();
    return all.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    ).sort((a, b) => {
        // Boost exact matches or prefix matches
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        if (aLabel.startsWith(q) && !bLabel.startsWith(q)) return -1;
        if (!aLabel.startsWith(q) && bLabel.startsWith(q)) return 1;
        return aLabel.localeCompare(bLabel);
    });
};
