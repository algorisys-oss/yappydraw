import { type Component, onMount, onCleanup, Show, lazy, Suspense } from 'solid-js';
import {
  undo, redo, store, deleteElements, togglePropertyPanel, toggleLayerPanel,
  toggleMinimap, toggleZenMode, toggleCommandPalette, moveSelectedElements,
  switchLayerByIndex, cycleStrokeStyle, cycleFillStyle,
  addChildNode, addSiblingNode, toggleCollapseSelection, togglePresentationMode,
  applyNextState, applyPreviousState, applyDisplayState, advancePresentation, retreatPresentation,
  setSelectedTool, setStore, groupSelected, ungroupSelected,
  bringToFront, sendToBack, reorderLayers, toggleGrid, toggleSnapToGrid, addLayer, toggleSlideNavigator,
  setIsExportOpen, setActiveSlide, setViewState, zoomToFit, zoomToSelection, pushToHistory
} from './store/app-store';
import Canvas from './components/canvas';
import Toolbar from './components/toolbar';
import {
  copyToClipboard, cutToClipboard, pasteFromClipboard,
  copyStyle, pasteStyle, lockSelected, flipSelected,
  pasteImageFromBlob, pasteAsTextElement, remapElementBindings
} from './utils/object-context-actions';
import { parseClipboardTableData, defaultColWidths, defaultRowHeights, getNextCell, normalizeCellSelection } from './utils/table-utils';
import { updateElement } from './store/app-store';
const PropertyPanel = lazy(() => import('./components/property-panel'));
const LayerPanel = lazy(() => import('./components/layer-panel'));
const CommandPalette = lazy(() => import('./components/command-palette'));
const StatePanel = lazy(() => import('./components/state-panel').then(m => ({ default: m.StatePanel })));
const Toast = lazy(() => import('./components/toast'));
const QuickToolbar = lazy(() => import('./components/quick-toolbar').then(m => ({ default: m.QuickToolbar })));
const SlideNavigator = lazy(() => import('./components/slide-navigator').then(m => ({ default: m.SlideNavigator })));
const SlideControlToolbar = lazy(() => import('./components/slide-control-toolbar').then(m => ({ default: m.SlideControlToolbar })));
const PresentationControls = lazy(() => import('./components/presentation-controls').then(m => ({ default: m.PresentationControls })));
const CanvasToolbar = lazy(() => import('./components/canvas-toolbar').then(m => ({ default: m.CanvasToolbar })));
import { WelcomeScreen } from './components/welcome-screen';
import Menu, {
  handleNew, setShowHelp,
  isDialogOpen, isSaveOpen, isLoadExportOpen, showHelp,
  setIsLoadExportOpen, setLoadExportInitialTab
} from './components/menu';
import StatusBar from './components/status-bar';
import { initAPI } from './api';
import { SlidersHorizontal } from 'lucide-solid';
import { registerShapes } from './shapes/register-shapes';
import { addSlide } from './store/app-store';


const App: Component = () => {
  // Removed showHelp state as it is now in Menu.tsx

  onMount(() => {
    console.log('App: Registering shapes...');
    registerShapes();
    initAPI();

    const handleKeyDown = async (e: KeyboardEvent) => {
      // 0. Ignore shortcuts if any Modal Dialog is open
      if (
        isDialogOpen() ||
        isSaveOpen() ||
        isLoadExportOpen() ||
        showHelp() ||
        store.showExportDialog
      ) {
        return;
      }

      // Presentation Mode shortcuts (highest priority)
      if (e.key === 'F5') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+F5: Present from current slide
          togglePresentationMode(true);
        } else {
          // F5: Present from beginning
          togglePresentationMode(true, 0);
        }
        return;
      }
      if (e.key === 'Escape' && store.appMode === 'presentation') {
        e.preventDefault();
        togglePresentationMode(false);
        return;
      }
      if (e.key === 'Escape' && store.focusBranchId) {
        e.preventDefault();
        setStore('focusBranchId', null);
        return;
      }

      const code = e.code;
      const key = e.key.toLowerCase();
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // 1. Critical Global Shortcuts (Work even if focused on inputs)
      if (isCtrlOrMeta) {
        if (key === 's' && e.altKey) {
          e.preventDefault();
          setLoadExportInitialTab('save');
          setIsLoadExportOpen(true);
          return;
        } else if (key === 'k') {
          e.preventDefault();
          toggleCommandPalette(true);
          return;
        } else if (key === 'o' && e.altKey) {
          e.preventDefault();
          setLoadExportInitialTab('load');
          setIsLoadExportOpen(true);
          return;
        } else if (key === 'e' && e.shiftKey) {
          e.preventDefault();
          setIsExportOpen(true);
          return;
        } else if (key === '=' || key === '+') {
          e.preventDefault();
          const s = store.viewState;
          const newScale = Math.min(s.scale * 1.1, 10);
          const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
          const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
          setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
          return;
        } else if (key === '-') {
          e.preventDefault();
          const s = store.viewState;
          const newScale = Math.max(s.scale * 0.9, 0.1);
          const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
          const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
          setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
          return;
        } else if (key === '0') {
          e.preventDefault();
          setViewState({ scale: 1 });
          return;
        } else if (key === '1' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          zoomToFit();
          return;
        } else if (key === '2' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          zoomToSelection();
          return;
        }
      }

      // 2. Ignore other hotkeys when typing in input fields, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputFocused) {
        // Let the browser handle standard text editing shortcuts (Ctrl+A, C, V, Z, etc.)
        return;
      }

      // 2b. TABLE CELL NAVIGATION — when table is selected with cell highlight, not editing
      const tableCellNav = (window as any).__tableCellNav;
      if (tableCellNav && !tableCellNav.isEditingTableCell()) {
        const cellSel = tableCellNav.getCellSelection();
        if (cellSel && store.selection.length === 1) {
          const selEl = store.elements.find(el => el.id === store.selection[0]);
          if (selEl?.type === 'table') {
            const cols = selEl.tableCols ?? 3;
            const rows = selEl.tableRows ?? 3;
            const hasHeader = selEl.tableHeaders !== false;
            const totalVisualRows = hasHeader ? rows + 1 : rows;

            // Arrow keys: move cell selection
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && !isCtrlOrMeta && !e.altKey) {
              e.preventDefault();
              const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
                arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right'
              };
              const nextCell = getNextCell(
                cellSel.startRow, cellSel.startCol, dirMap[key],
                totalVisualRows, cols, selEl.tableMergedCells, false
              );
              if (nextCell) {
                tableCellNav.setCellSelection({
                  startRow: nextCell.row, startCol: nextCell.col,
                  endRow: nextCell.row, endCol: nextCell.col
                });
              }
              return;
            }

            // F2: start editing highlighted cell
            if (key === 'f2') {
              e.preventDefault();
              tableCellNav.startEditingCell(selEl.id, cellSel.startRow, cellSel.startCol);
              return;
            }

            // Delete/Backspace: clear highlighted cell(s) content (not delete table)
            if (key === 'delete' || key === 'backspace') {
              e.preventDefault();
              if (selEl.tableData) {
                pushToHistory();
                const norm = normalizeCellSelection(cellSel);
                const colOrder = selEl.tableColOrder;
                const newData = selEl.tableData.map(row => [...row]);
                for (let r = norm.startRow; r <= norm.endRow; r++) {
                  for (let c = norm.startCol; c <= norm.endCol; c++) {
                    const dataCol = colOrder ? colOrder[c] : c;
                    if (newData[r]) {
                      newData[r][dataCol] = '';
                    }
                  }
                }
                updateElement(selEl.id, { tableData: newData }, true);
              }
              return;
            }

            // Tab, Enter, and printable chars: NOT intercepted here
            // Tab → falls through to addChildNode (mindmap)
            // Enter → falls through to addSiblingNode (mindmap)
            // Printable chars → fall through to tool shortcuts
            // These keys only do cell navigation during active editing (text-editing-overlay.tsx)
          }
        }
      }

      // 3. Regular Application Shortcuts (Blocked by inputs)
      if (isCtrlOrMeta) {
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
          return;
        } else if (key === 'y') {
          e.preventDefault();
          redo();
          return;
        } else if (key === 'a') {
          e.preventDefault();
          setStore('selection', store.elements.map(el => el.id));
          return;
        }
      }

      // 3. Alt + Key shortcuts
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (code === 'Enter' || key === 'enter') {
          e.preventDefault();
          togglePropertyPanel();
        } else if (code === 'KeyL' || key === 'l') {
          e.preventDefault();
          toggleLayerPanel();
        } else if (code === 'KeyM' || key === 'm') {
          e.preventDefault();
          toggleMinimap();
        } else if (code === 'KeyZ' || key === 'z') {
          e.preventDefault();
          const nextZen = !store.zenMode;
          toggleZenMode(nextZen);
          toggleSlideNavigator(!nextZen);
        } else if (code === 'KeyI' || key === 'i') {
          e.preventDefault();
          setSelectedTool('ink');
        } else if (key === '\\' || code === 'Backslash') {
          e.preventDefault();
          const anyVisible = store.showPropertyPanel || store.showLayerPanel;
          togglePropertyPanel(!anyVisible);
          toggleLayerPanel(!anyVisible);
        } else if (key === '[' || code === 'BracketLeft') {
          e.preventDefault();
          const layers = store.layers;
          const idx = layers.findIndex(l => l.id === store.activeLayerId);
          if (idx > 0) reorderLayers(idx, idx - 1);
        } else if (key === ']' || code === 'BracketRight') {
          e.preventDefault();
          const layers = store.layers;
          const idx = layers.findIndex(l => l.id === store.activeLayerId);
          if (idx !== -1 && idx < layers.length - 1) reorderLayers(idx, idx + 1);
        } else if (key === 'n' || code === 'KeyN') {
          e.preventDefault();
          handleNew();
        } else if (key >= '1' && key <= '9') {
          e.preventDefault();
          const index = parseInt(key) - 1;
          switchLayerByIndex(index);
        } else if (code === 'ArrowRight') {
          e.preventDefault();
          applyNextState();
        } else if (code === 'ArrowLeft') {
          e.preventDefault();
          applyPreviousState();
        }
      }

      // 4. Ctrl/Meta but lower priority than inputs (Grouping/Duplicate)
      if (e.ctrlKey || e.metaKey) {
        if (key === 'g') {
          e.preventDefault();
          if (e.shiftKey) ungroupSelected(); else groupSelected();
        } else if (key === 'm') {
          e.preventDefault();
          addSlide();
        } else if (key === 'c' || code === 'KeyC') {
          e.preventDefault();
          if (e.altKey) copyStyle(); else await copyToClipboard();
        } else if ((key === 'v' || code === 'KeyV') && e.altKey) {
          e.preventDefault();
          pasteStyle();
        } else if (key === 'x' || code === 'KeyX') {
          e.preventDefault();
          await cutToClipboard();
        } else if (key === ']') {
          e.preventDefault();
          if (store.selection.length > 0) bringToFront(store.selection);
        } else if (key === '[') {
          e.preventDefault();
          if (store.selection.length > 0) sendToBack(store.selection);
        } else if (key === 'd') {
          e.preventDefault();
          const selectedElements = store.elements.filter(el => store.selection.includes(el.id));
          if (selectedElements.length > 0) {
            pushToHistory();

            // Build ID mapping for elements and groups
            const idMap = new Map<string, string>();
            const groupMapping = new Map<string, string>();

            selectedElements.forEach(el => {
              idMap.set(el.id, crypto.randomUUID());
              el.groupIds?.forEach((gid: string) => {
                if (!groupMapping.has(gid)) groupMapping.set(gid, crypto.randomUUID());
              });
            });

            // Merge group mappings into idMap for unified remapping
            groupMapping.forEach((newId, oldId) => idMap.set(oldId, newId));

            const offset = 20 / store.viewState.scale;
            let newElements = selectedElements.map(el => ({
              ...el,
              id: idMap.get(el.id)!,
              x: el.x + offset,
              y: el.y + offset,
              groupIds: el.groupIds?.map((gid: string) => groupMapping.get(gid)!) ?? [],
              boundElements: el.boundElements ?? null,
              seed: Math.floor(Math.random() * 2147483647)
            }));

            // Remap bindings (connectors) and parent relationships (mindmap)
            newElements = remapElementBindings(newElements as any, idMap) as typeof newElements;

            setStore('elements', [...store.elements, ...newElements]);
            setStore('selection', newElements.map(el => el.id));
          }
        } else if (key === 'l' && e.shiftKey) {
          e.preventDefault();
          if (store.selection.length > 0) {
            const isLocked = store.selection.some(id => store.elements.find(e => e.id === id)?.locked);
            lockSelected(!isLocked);
          }
        }
        return;
      }

      // 5. Shared Global Shortcuts (No Alt/Ctrl)
      if (!e.altKey && !e.ctrlKey && !e.metaKey) {
        // Presentation Navigation
        if (store.appMode === 'presentation') {
          if (code === 'PageDown' || code === 'Enter' || code === 'NumpadEnter' || code === 'Space' || code === 'ArrowRight') {
            e.preventDefault();
            advancePresentation();
            return;
          } else if (code === 'ArrowLeft' || code === 'PageUp' || code === 'Backspace') {
            e.preventDefault();
            retreatPresentation();
            return;
          }
        }

        if (code === 'Home') {
          e.preventDefault();
          if (store.states.length > 0) {
            applyDisplayState(store.states[0].id);
          } else {
            setActiveSlide(0);
          }
          return;
        }

        // Tool Cycling and Single Key Shortcuts
        if (key === 's') {
          e.preventDefault();
          cycleStrokeStyle();
        } else if (key === 'f' && e.shiftKey) {
          // Focus Mode: toggle branch isolation for mindmap nodes
          e.preventDefault();
          if (store.focusBranchId) {
            setStore('focusBranchId', null);
          } else if (store.selection.length === 1) {
            const el = store.elements.find(el => el.id === store.selection[0]);
            if (el && (el.parentId || store.elements.some(c => c.parentId === el.id))) {
              setStore('focusBranchId', el.id);
            }
          }
        } else if (key === 'f') {
          e.preventDefault();
          cycleFillStyle();
        } else if (key === '?' && e.shiftKey) {
          e.preventDefault();
          setShowHelp(true);
        } else if (key === '"' || (key === "'" && e.shiftKey)) {
          e.preventDefault();
          toggleGrid();
        } else if (key === ':' || (key === ';' && e.shiftKey)) {
          e.preventDefault();
          toggleSnapToGrid();
        } else if (key === 'delete' || key === 'backspace') {
          e.preventDefault();
          if (store.selection.length > 0) deleteElements(store.selection);
        } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
          if (store.selection.length > 0) {
            e.preventDefault();
            // Mindmap navigation: single node with hierarchy, no Alt key
            const CONNECTOR_TYPES = ['line', 'arrow', 'bezier', 'organicBranch', 'polyline'];
            const selEl = store.selection.length === 1
              ? store.elements.find(el => el.id === store.selection[0])
              : null;
            const isMindmapNode = selEl && !CONNECTOR_TYPES.includes(selEl.type) &&
              (selEl.parentId || store.elements.some(el => el.parentId === selEl.id));
            if (isMindmapNode && !e.shiftKey) {
              // Arrow key hierarchy navigation
              if (key === 'arrowleft' && selEl.parentId) {
                // Navigate to parent
                setStore("selection", [selEl.parentId]);
              } else if (key === 'arrowright') {
                // Navigate to first child
                const children = store.elements.filter(
                  el => el.parentId === selEl.id && !CONNECTOR_TYPES.includes(el.type)
                ).sort((a, b) => a.y - b.y);
                if (children.length > 0) setStore("selection", [children[0].id]);
              } else if (key === 'arrowup' || key === 'arrowdown') {
                // Navigate between siblings
                const parentId = selEl.parentId;
                if (parentId) {
                  const siblings = store.elements.filter(
                    el => el.parentId === parentId && !CONNECTOR_TYPES.includes(el.type)
                  ).sort((a, b) => a.y - b.y);
                  const idx = siblings.findIndex(s => s.id === selEl.id);
                  if (idx >= 0) {
                    const nextIdx = key === 'arrowup' ? idx - 1 : idx + 1;
                    if (nextIdx >= 0 && nextIdx < siblings.length) {
                      setStore("selection", [siblings[nextIdx].id]);
                    }
                  }
                }
              }
            } else {
              // Default nudge behavior (non-mindmap or Alt+Arrow)
              const nudgeAmount = e.shiftKey ? 10 : 1;
              let dx = 0, dy = 0;
              if (key === 'arrowup') dy = -nudgeAmount;
              else if (key === 'arrowdown') dy = nudgeAmount;
              else if (key === 'arrowleft') dx = -nudgeAmount;
              else if (key === 'arrowright') dx = nudgeAmount;
              moveSelectedElements(dx, dy, true);
            }
          }
        } else if (key === 'tab') {
          if (store.selection.length === 1) {
            e.preventDefault();
            addChildNode(store.selection[0]);
          }
        } else if (key === 'enter') {
          if (store.selection.length === 1) {
            e.preventDefault();
            addSiblingNode(store.selection[0]);
          }
        } else if (key === ' ') {
          if (store.selection.length > 0) {
            e.preventDefault();
            toggleCollapseSelection();
          }
        } else if (e.shiftKey && key === 'n') {
          e.preventDefault();
          addLayer();
        } else if (e.shiftKey && key === 'p') {
          e.preventDefault();
          setSelectedTool('laser');
        } else if (e.shiftKey && key === 'l') {
          e.preventDefault();
          setSelectedTool('lasso');
        } else if (e.shiftKey && key === 'h') {
          e.preventDefault();
          if (store.selection.length > 0) flipSelected('horizontal');
        } else if (e.shiftKey && key === 'v') {
          e.preventDefault();
          if (store.selection.length > 0) flipSelected('vertical');
        }
        else {
          if (key === 'v' || key === '1') setSelectedTool('selection');
          else if (key === 'r' || key === '2') setSelectedTool('rectangle');
          else if (key === 'o' || key === '3') setSelectedTool('circle');
          else if (key === 'l' || key === '4') setSelectedTool('line');
          else if (key === 'a' || key === '5') setSelectedTool('arrow');
          else if (key === 't' || key === '6') setSelectedTool('text');
          else if (key === 'e' || key === '7') setSelectedTool('eraser');
          else if (key === 'p' || key === '8') setSelectedTool('fineliner');
          else if (key === '9' || key === 'i') {
            (window as any).triggerImageUpload?.();
          }
          else if (key === 'b' || key === '0') setSelectedTool('bezier');
          else if (key === 'd') setSelectedTool('diamond');
          else if (key === 'h') setSelectedTool('pan');
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && store.appMode === 'presentation') {
        togglePresentationMode(false);
      }
    };

    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      // Prevent accidental feedback navigation?
      // For now, no-op or simple confirmation if needed.
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept paste in text inputs or contenteditable
      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (active as HTMLElement)?.isContentEditable) return;
      // Skip if command palette or dialogs are open
      if (store.showCommandPalette || isDialogOpen() || isSaveOpen() || isLoadExportOpen()) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // Check for images first — collect all image blobs
      const imageBlobs: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) imageBlobs.push(blob);
        }
      }
      if (imageBlobs.length > 0) {
        e.preventDefault();
        const STAGGER = 30;
        (async () => {
          const ids: string[] = [];
          for (let i = 0; i < imageBlobs.length; i++) {
            const id = await pasteImageFromBlob(imageBlobs[i], { dx: i * STAGGER, dy: i * STAGGER });
            if (id) ids.push(id);
          }
          if (ids.length > 0) setStore('selection', ids);
        })();
        return;
      }

      // Check for text
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        e.preventDefault();
        // Try internal Yappy JSON first
        try {
          const data = JSON.parse(text);
          if (data.type === 'yappy-elements' && Array.isArray(data.elements)) {
            pasteFromClipboard();
            return;
          }
        } catch { /* not JSON */ }

        // Check if a table is selected - try to paste as table data
        if (store.selection.length === 1) {
          const selectedEl = store.elements.find(el => el.id === store.selection[0]);
          if (selectedEl?.type === 'table') {
            const parsedData = parseClipboardTableData(text);
            if (parsedData && parsedData.length > 0 && parsedData[0].length > 1) {
              // Multi-column data detected - paste as table data
              pushToHistory();
              const hasHeader = selectedEl.tableHeaders !== false;
              const newRows = hasHeader ? parsedData.length - 1 : parsedData.length;
              const newCols = parsedData[0].length;

              updateElement(selectedEl.id, {
                tableData: parsedData,
                tableRows: newRows,
                tableCols: newCols,
                tableColWidths: defaultColWidths(newCols),
                tableRowHeights: defaultRowHeights(parsedData.length),
              }, false);
              return;
            }
          }
        }

        // Plain text → create text element
        pasteAsTextElement(text);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('paste', handlePaste);
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('paste', handlePaste);
    });
  });

  return (
    <div>
      <Suspense fallback={null}>
        <Show when={store.appMode !== 'presentation'}>
          <Show when={store.showMainToolbar}>
            <Toolbar />
          </Show>
          <Show when={!store.zenMode}>
            <PropertyPanel />
            <LayerPanel />
            <StatusBar />
          </Show>
          <Menu />
        </Show>
        <Canvas />
        <Show when={store.docType === 'slides'}>
          <Show when={store.appMode !== 'presentation' && !store.zenMode && store.showSlideNavigator} fallback={
            <Show when={store.appMode === 'presentation'}>
              <PresentationControls />
            </Show>
          }>
            <SlideNavigator />
          </Show>
        </Show>
        <CanvasToolbar />

        {/* Panels hidden in Presentation Mode */}
        <Show when={store.appMode !== 'presentation'}>
          <CommandPalette />
          <StatePanel />
          <WelcomeScreen />
        </Show>

        {/* Floating buttons (above status bar) */}
        <Show when={store.appMode !== 'presentation'}>
          <button
            class="floating-settings-btn"
            classList={{ 'active': store.showPropertyPanel }}
            onClick={() => togglePropertyPanel()}
            title="Toggle Properties (Alt+Enter)"
            style={{
              position: 'fixed',
              bottom: '34px',
              left: '12px',
              width: '36px',
              height: '36px',
              padding: '0',
              'box-sizing': 'border-box',
              'border-radius': '50%',
              border: 'none',
              background: 'var(--bg-panel, #ffffff)',
              color: 'var(--text-primary, #111827)',
              'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': '1000',
              transition: 'all 0.2s ease',
              overflow: 'visible'
            }}
          >
            <SlidersHorizontal size={20} />
          </button>
          <button
            class="floating-settings-btn"
            onClick={() => setShowHelp(true)}
            title="Shortcuts & Help (?)"
            style={{
              position: 'fixed',
              bottom: '34px',
              left: '56px',
              width: '36px',
              height: '36px',
              'border-radius': '50%',
              border: 'none',
              background: 'var(--bg-panel, #ffffff)',
              color: 'var(--text-secondary, #4b5563)',
              'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': '1000',
              transition: 'all 0.2s ease',
              'font-weight': 'bold',
              'font-size': '16px'
            }}
          >
            ?
          </button>
          <SlideControlToolbar />
          <QuickToolbar />
        </Show>
        <Toast />
      </Suspense>
    </div >
  );
};

export default App;
