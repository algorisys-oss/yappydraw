import { type Component, onMount, onCleanup, Show, lazy, Suspense, createSignal } from 'solid-js';
import { isMultiPageDocType } from './types/slide-types';
import { isPanelOpen } from './store/dock-layout';
import {
  undo, redo, store, deleteElements, togglePropertyPanel, toggleLayerPanel, toggleSymbolsPanel, toggleHistoryPanel, toggleGraphicStylesPanel, toggleSwatchesPanel, togglePatternsPanel, toggleElementsPanel,
  toggleMinimap, toggleRulers, toggleKeyframePanel, toggleZenMode, toggleCommandPalette, moveSelectedElements, toggleStatePanel,
  switchLayerByIndex, cycleStrokeStyle, cycleFillStyle,
  addChildNode, addSiblingNode, toggleCollapseSelection, pasteMindmapOutline, togglePresentationMode, cancelEyedropper, exitCompoundEdit,
  applyNextState, applyPreviousState, applyDisplayState, advancePresentation, retreatPresentation,
  setSelectedTool, setStore, groupSelected, ungroupSelected,
  bringToFront, sendToBack, reorderLayers, toggleGrid, toggleSnapToGrid, addLayer, toggleSlideNavigator,
  setIsExportOpen, setActiveSlide, setViewState, zoomToFit, zoomToSelection, pushToHistory,
  setActiveDsOpsElement, updateGlobalSettings, togglePenStabilization, rotateView, resetRotation,
  transformAgain, recordTransform, convertTextToOutlines, toggleSymmetry, setSymmetryCenter, toggleSymmetryEditing
} from './store/app-store';
import { showToast } from './components/toast';
import { initPWA } from './utils/pwa';
import { toggleTimelapse } from './utils/timelapse-manager';
import { ColorDropHud } from './components/color-drop-hud';
import Canvas from './components/canvas';
import { RulerOverlay } from './components/ruler-overlay';
import { RepeatDialog } from './components/repeat-dialog';
import { SymmetryOverlay } from './components/symmetry-overlay';
import { MeshOverlay } from './components/mesh-overlay';
import { ArtboardOverlay } from './components/artboard-overlay';
import { MeasureOverlay } from './components/measure-overlay';
import { BooleanOpsToolbar, runBooleanOp, canRunBooleanOp } from './components/boolean-ops-toolbar';
import { TransformHud } from './components/transform-hud';
import { ShapeBuilderOverlay } from './components/shape-builder-overlay';
import { CutOverlay } from './components/cut-overlay';
import { SymbolSprayerOverlay } from './components/symbol-sprayer-overlay';
import { LivePaintOverlay } from './components/live-paint-overlay';
import { WidthToolOverlay } from './components/width-tool-overlay';
import { CurveToolOverlay } from './components/curve-tool-overlay';
import { ReshapeToolOverlay } from './components/reshape-tool-overlay';
import { BlobBrushOverlay } from './components/blob-brush-overlay';
import { PathEraserOverlay } from './components/path-eraser-overlay';
import { PuppetWarpOverlay } from './components/puppet-warp-overlay';
import { PerspectiveGridOverlay } from './components/perspective-grid-overlay';
import { TouchTypeOverlay } from './components/touch-type-overlay';
import GameOverlay from './components/game-overlay';
import { SliceToolOverlay } from './components/slice-tool-overlay';
import { SymbolismOverlay } from './components/symbolism-overlay';
import { TypeOnPathOverlay } from './components/type-on-path-overlay';
import { SymbolEditBanner } from './components/symbol-edit-banner';
import Toolbar from './components/toolbar';
import {
  copyToClipboard, cutToClipboard,
  copyStyle, pasteStyle, lockSelected, flipSelected,
  pasteImageFromBlob, pasteAsTextElement, remapElementBindings,
  pasteYappyElements
} from './utils/object-context-actions';
import { parseClipboardTableData, defaultColWidths, defaultRowHeights, getNextCell, normalizeCellSelection } from './utils/table-utils';
import { generateId } from './utils/id-generator';
import { screenToWorld } from './utils/viewport-transforms';
import { parseOutline } from './utils/mindmap-layout';
import { updateElement, deleteArtboard, swapFillStroke, selectAll, toggleShapeBuilder } from './store/app-store';
const PropertyPanel = lazy(() => import('./components/property-panel'));
const CropBar = lazy(() => import('./components/crop-bar'));
const DockContainer = lazy(() => import('./components/dock/dock-container'));
const SceneTimeline = lazy(() => import('./components/scene-timeline'));
const KeyframePanel = lazy(() => import('./components/keyframe-panel'));
const GameGraph = lazy(() => import('./components/game-graph'));
const BlueprintGraph = lazy(() => import('./components/blueprint-graph'));
const GameModeBar = lazy(() => import('./components/game-mode-bar'));
const AnimationModeBar = lazy(() => import('./components/animation-mode-bar'));
const AnimationTimeline = lazy(() => import('./components/animation-timeline'));
const CommandPalette = lazy(() => import('./components/command-palette'));
const Toast = lazy(() => import('./components/toast'));
const QuickToolbar = lazy(() => import('./components/quick-toolbar').then(m => ({ default: m.QuickToolbar })));
const SlideNavigator = lazy(() => import('./components/slide-navigator').then(m => ({ default: m.SlideNavigator })));
const SlideControlToolbar = lazy(() => import('./components/slide-control-toolbar').then(m => ({ default: m.SlideControlToolbar })));
const PresentationControls = lazy(() => import('./components/presentation-controls').then(m => ({ default: m.PresentationControls })));
const CanvasToolbar = lazy(() => import('./components/canvas-toolbar').then(m => ({ default: m.CanvasToolbar })));
const DsOpsPanel = lazy(() => import('./components/ds-ops-panel'));
import { WelcomeScreen } from './components/welcome-screen';
import { OnboardingTour, maybeAutoStartTour } from './components/onboarding-tour';
import Menu, {
  handleNew, setShowHelp, setShowSettings,
  isDialogOpen, isSaveOpen, isLoadExportOpen, showHelp,
  setIsLoadExportOpen, setLoadExportInitialTab,
  isAIPromptOpen, setIsAIPromptOpen, quickSaveToGallery
} from './components/menu';
import StatusBar from './components/status-bar';
import { initAPI } from './api';
import { SlidersHorizontal, Settings } from 'lucide-solid';
import { registerShapes } from './shapes/register-shapes';
import { addSlide } from './store/app-store';
import { insertFrame, insertKeyframe, insertBlankKeyframe, clearKeyframe, removeFrames, stepFrame, gotoFrame } from './store/anim-ops';
import { createSymbol, simplifyPath } from './store/app-store';
import { toggleAnimPlayback } from './utils/animation/anim-playback';
import { initAutoSave, forceAutoSave, loadAutoSave } from './storage/auto-save';
import { initCloudStorage } from './storage/cloud';


const App: Component = () => {
  // Removed showHelp state as it is now in Menu.tsx

  // ── App-drawn pen cursor ──
  // On Linux, Chromium often stops painting the system cursor for a tablet pen
  // (e.g. Huion) while it hovers our own surfaces — the page is treated as a
  // drawing target — so the pointer "disappears" over the canvas and panels even
  // though hover still works. We draw our own dot that follows the pen across the
  // whole editor. Mouse/touch keep the normal system cursor (dot hidden).
  const [penPos, setPenPos] = createSignal<{ x: number; y: number } | null>(null);
  onMount(() => {
    // Desktop (Tauri) shell: wire native menu + file Open/Save. No-op on web.
    void import('./desktop/desktop-bridge').then(m => m.initDesktop());
  });

  onMount(() => {
    // First-visit product tour (once; replayable from Help). No-op if already seen.
    maybeAutoStartTour();
  });

  onMount(() => {
    // Show the dot for the pen; null it for mouse/touch (they keep the system
    // cursor). We DON'T hide on `pointerout` — its `relatedTarget` goes null when
    // the canvas grabs pointer capture on contact, which would blink the dot off
    // the instant you start drawing. The dot simply tracks the last pen position;
    // it's hidden only when the window loses focus or another pointer type moves.
    const onPenMove = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') { setPenPos(null); return; }
      setPenPos({ x: e.clientX, y: e.clientY });
    };
    const hidePen = () => setPenPos(null);
    window.addEventListener('pointermove', onPenMove, { passive: true, capture: true });
    window.addEventListener('pointerdown', onPenMove, { passive: true, capture: true });
    window.addEventListener('pointerup', onPenMove, { passive: true, capture: true });
    window.addEventListener('blur', hidePen);
    onCleanup(() => {
      window.removeEventListener('pointermove', onPenMove, { capture: true });
      window.removeEventListener('pointerdown', onPenMove, { capture: true });
      window.removeEventListener('pointerup', onPenMove, { capture: true });
      window.removeEventListener('blur', hidePen);
    });
  });

  // PWA lifecycle. The service worker uses the `prompt` strategy (no
  // skipWaiting/clientsClaim), so a new build installs and waits rather than
  // activating mid-load and stranding a blank page. initPWA() surfaces the
  // offline-ready and update-available toasts; applying an update is an
  // explicit user action (version-tap hard refresh / applyPwaUpdate).
  onMount(() => {
    initPWA();
  });

  onMount(() => {
    console.log('App: Registering shapes...');
    registerShapes();
    initAPI();

    // Auto-save: silently restore last session (async — large docs come from
    // IndexedDB), then start the watchers
    loadAutoSave().finally(() => initAutoSave());

    // Cloud storage: register providers and restore config
    initCloudStorage();

    // Spacebar-hold pan state (see the ' ' branch in handleKeyDown / handleKeyUp).
    let spacePanning = false;
    let spacePanPrevTool = '';
    let spacePanDownAt = 0;

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && spacePanning) {
        spacePanning = false;
        if (store.selectedTool === 'pan') setSelectedTool(spacePanPrevTool as any);
        // A quick tap (no real hold) with a selection keeps the old mindmap-collapse.
        const held = performance.now() - spacePanDownAt;
        if (held < 220 && store.selection.length > 0) toggleCollapseSelection();
      }
    };

    const handleKeyDown = async (e: KeyboardEvent) => {
      // 0. Ignore shortcuts if any Modal Dialog is open
      if (
        isDialogOpen() ||
        isSaveOpen() ||
        isLoadExportOpen() ||
        showHelp() ||
        store.showExportDialog ||
        isAIPromptOpen()
      ) {
        return;
      }

      // Animation mode: the F-keys belong to the frame timeline (Animate muscle
      // memory — F5 span, F6 keyframe, F7 blank; Shift removes/clears). Guarded
      // BEFORE the Present handler so F5 never leaves the timeline (or reloads
      // the browser).
      if (store.docType === 'animation' && store.animTimeline && (e.key === 'F5' || e.key === 'F6' || e.key === 'F7' || e.key === 'F8')) {
        e.preventDefault();
        const layerId = store.animFrameSelection?.layerId ?? store.activeLayerId;
        const frame = store.animFrameSelection?.frames[0] ?? store.animCurrentFrame;
        if (e.key === 'F5') { if (e.shiftKey) removeFrames(layerId, frame); else insertFrame(layerId, frame); }
        else if (e.key === 'F6') { if (e.shiftKey) clearKeyframe(layerId, frame); else insertKeyframe(layerId, frame); }
        else if (e.key === 'F7') insertBlankKeyframe(layerId, frame);
        // F8 = Convert to Symbol (movie clip; Shift+F8 = static graphic)
        else if (store.selection.length > 0) createSymbol([...store.selection], undefined, e.shiftKey ? 'graphic' : 'movieclip');
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
      if (e.key === 'Escape' && store.eyedropper.active) {
        e.preventDefault();
        cancelEyedropper();
        return;
      }
      if (e.key === 'Escape' && store.compoundEdit) {
        e.preventDefault();
        exitCompoundEdit(true); // finish, rebuilding the compound from the edited sources
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
        // Boolean ops on the selection (Ctrl+Alt+U/D/I/X). Checked FIRST because the
        // plain Ctrl+D (duplicate) and Ctrl+X (cut) handlers further down don't test
        // altKey — same ordering reason Ctrl+Alt+S is tested before Ctrl+S below.
        // Inkscape's canonical Ctrl +/-/*/^ can't be used: the browser owns them for
        // page zoom, and Ctrl+K is already the command palette.
        if (e.altKey && (key === 'u' || key === 'd' || key === 'i' || key === 'x')) {
          const op = key === 'u' ? 'union' : key === 'd' ? 'subtract' : key === 'i' ? 'intersect' : 'exclude';
          if (canRunBooleanOp()) {
            e.preventDefault();
            runBooleanOp(op as 'union' | 'subtract' | 'intersect' | 'exclude');
            return;
          }
          // Nothing combinable selected: fall through so Ctrl+Alt+X etc. keep whatever
          // meaning they already had rather than silently swallowing the key.
        }
        if (key === 's' && e.altKey) {
          e.preventDefault();
          setLoadExportInitialTab('save');
          setIsLoadExportOpen(true);
          return;
        } else if (key === 's') {
          // Ctrl/Cmd+S → quick-save to the local "My Drawings" gallery
          // (Ctrl+Alt+S remains the full Export/Save dialog above).
          e.preventDefault();
          void quickSaveToGallery();
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
          // The Export dialog lives inside <Menu>, which isn't mounted during a
          // presentation — so opening it here used to set the flag with nothing
          // on screen, and the dialog then ambushed the user when they pressed
          // Esc and the menu remounted. Say what to do instead of silently
          // arming a dialog for later.
          if (store.appMode === 'presentation') {
            showToast('Exit the presentation (Esc) to export — or use the Record button to capture it as MP4', 'info');
            return;
          }
          setIsExportOpen(true);
          return;
        } else if (key === 'a' && e.shiftKey) {
          e.preventDefault();
          setIsAIPromptOpen(true);
          return;
        } else if (key === 't' && e.shiftKey) {
          e.preventDefault();
          toggleTimelapse();
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
      // NOTE: this listener is registered with capture:true, so component-level
      // stopPropagation() cannot shield widgets from it — anything that owns its
      // own keyboard interaction must be exempted HERE. Focus inside the font
      // picker (trigger or popup), the Google Fonts panel, or any dialog means
      // arrows/keys belong to that widget, not to canvas hotkeys like the
      // arrow-nudge (clicking a font row focuses a BUTTON, which the tag check
      // alone would miss).
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        !!target.closest?.('.fp-trigger, .fp-popup, .gf-modal, [role="dialog"]');

      if (isInputFocused) {
        // Let the browser handle standard text editing shortcuts (Ctrl+A, C, V, Z, etc.)
        return;
      }

      // 2 animation. Frame-timeline transport (Animate muscle memory):
      // Enter = play/pause, , / . = step a frame, Home/End = jump to start/end.
      if (store.docType === 'animation' && store.animTimeline && !isCtrlOrMeta && !e.altKey && !e.shiftKey) {
        if (e.key === 'Enter') { e.preventDefault(); toggleAnimPlayback(); return; }
        if (code === 'Comma') { e.preventDefault(); stepFrame(-1); return; }
        if (code === 'Period') { e.preventDefault(); stepFrame(1); return; }
        if (e.key === 'Home') { e.preventDefault(); gotoFrame(0); return; }
        if (e.key === 'End') { e.preventDefault(); gotoFrame(store.animTimeline.frameCount - 1); return; }
      }

      // 2a. CANVAS (VIEW) ROTATION — Shift+, / Shift+. spin the canvas about its
      // centre in 15° steps; Shift+0 snaps back to upright. For comfortable
      // freehand sketching on large illustrations (mirrors the two-finger twist).
      if (e.shiftKey && !isCtrlOrMeta && !e.altKey) {
        const ROTATE_STEP = Math.PI / 12; // 15°
        if (key === '<' || code === 'Comma') {
          e.preventDefault();
          rotateView(-ROTATE_STEP);
          return;
        } else if (key === '>' || code === 'Period') {
          e.preventDefault();
          rotateView(ROTATE_STEP);
          return;
        } else if (code === 'Digit0') {
          e.preventDefault();
          resetRotation();
          return;
        }
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
          selectAll();
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
        } else if (code === 'KeyR' || key === 'r') {
          e.preventDefault();
          toggleRulers();
        } else if (code === 'KeyK' || key === 'k') {
          e.preventDefault();
          toggleKeyframePanel();
        } else if (code === 'KeyY' || key === 'y') {
          e.preventDefault();
          // Alt+Shift+Y toggles "move the axis"; plain Alt+Y toggles symmetry and,
          // when turning on, drops the centre where the user is looking.
          if (e.shiftKey) {
            toggleSymmetryEditing();
          } else {
            const s = store.viewState;
            const cx = (window.innerWidth / 2 - s.panX) / s.scale;
            const cy = (window.innerHeight / 2 - s.panY) / s.scale;
            if (store.symmetry.mode === 'off') setSymmetryCenter(cx, cy);
            toggleSymmetry();
          }
        } else if (code === 'KeyZ' || key === 'z') {
          e.preventDefault();
          const nextZen = !store.zenMode;
          toggleZenMode(nextZen);
          toggleSlideNavigator(!nextZen);
        } else if (code === 'KeyS' || key === 's') {
          e.preventDefault();
          toggleStatePanel();
        } else if (code === 'KeyI' || key === 'i') {
          e.preventDefault();
          setSelectedTool('ink');
        } else if (code === 'KeyB' || key === 'b') {
          e.preventDefault();
          toggleSymbolsPanel();
        } else if (code === 'KeyH' || key === 'h') {
          e.preventDefault();
          toggleHistoryPanel();
        } else if (code === 'KeyG' || key === 'g') {
          e.preventDefault();
          toggleGraphicStylesPanel();
        } else if (code === 'KeyW' || key === 'w') {
          e.preventDefault();
          toggleSwatchesPanel();
        } else if (code === 'KeyP' || key === 'p') {
          e.preventDefault();
          togglePatternsPanel();
        } else if (code === 'KeyE' || key === 'e') {
          e.preventDefault();
          toggleElementsPanel();
        } else if (key === '\\' || code === 'Backslash') {
          e.preventDefault();
          const anyVisible = store.showPropertyPanel || isPanelOpen('layers');
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
        } else if (key === 'l' && !e.shiftKey && store.selection.length > 0) {
          // Ctrl+L = Simplify (Inkscape parity). Guarded on !shiftKey so the
          // existing Ctrl+Shift+L lock/unlock below still wins.
          e.preventDefault();
          simplifyPath([...store.selection]);
        } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && store.selection.length > 0) {
          // Ctrl/Cmd + Arrow = fine nudge (0.1px), Illustrator's small-increment.
          e.preventDefault();
          const amt = 0.1;
          let dx = 0, dy = 0;
          if (key === 'arrowup') dy = -amt;
          else if (key === 'arrowdown') dy = amt;
          else if (key === 'arrowleft') dx = -amt;
          else dx = amt;
          moveSelectedElements(dx, dy, true);
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
        } else if (key === 'd' && e.shiftKey) {
          // Transform Again — replay the last move/duplicate transform on a fresh copy.
          e.preventDefault();
          if (store.selection.length > 0) transformAgain();
        } else if (key === 'd') {
          e.preventDefault();
          const selectedElements = store.elements.filter(el => store.selection.includes(el.id));
          if (selectedElements.length > 0) {
            pushToHistory();

            // Build ID mapping for elements and groups
            const idMap = new Map<string, string>();
            const groupMapping = new Map<string, string>();
            const batchIds = new Set<string>();

            selectedElements.forEach(el => {
              idMap.set(el.id, generateId(el.type, batchIds));
              el.groupIds?.forEach((gid: string) => {
                if (!groupMapping.has(gid)) groupMapping.set(gid, generateId('group', batchIds));
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
            recordTransform({ dx: offset, dy: offset });
          }
        } else if (key === 'l' && e.shiftKey) {
          e.preventDefault();
          if (store.selection.length > 0) {
            const isLocked = store.selection.some(id => store.elements.find(e => e.id === id)?.locked);
            lockSelected(!isLocked);
          }
        } else if (key === 'o' && e.shiftKey) {
          // Create Outlines — convert selected text into editable vector paths.
          e.preventDefault();
          if (store.selection.length > 0) void convertTextToOutlines([...store.selection]);
        }
        return;
      }

      // 5. Shared Global Shortcuts (No Alt/Ctrl)
      if (!e.altKey && !e.ctrlKey && !e.metaKey) {
        // Presentation Navigation
        if (store.appMode === 'presentation') {
          // When DS ops panel is active, reserve Space/Enter for input
          if (store.activeDsOpsElementId) {
            if (code === 'Escape') {
              e.preventDefault();
              setActiveDsOpsElement(null);
              return;
            }
            if (code === 'PageDown' || code === 'ArrowRight') {
              e.preventDefault();
              setActiveDsOpsElement(null);
              advancePresentation();
              return;
            }
            // Let other keys through to the ops panel inputs
            return;
          }
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
          if (store.activeArtboardId) deleteArtboard(store.activeArtboardId);
          else if (store.selection.length > 0) deleteElements(store.selection);
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
              // Up/Down on a single star / polygon / burst tweaks its point/side
              // count (Illustrator's "arrow keys change the number of points");
              // Left/Right still nudge. Other elements: arrows nudge as usual.
              const only = store.selection.length === 1
                ? store.elements.find(el => el.id === store.selection[0]) : null;
              const pointSpec = only && (key === 'arrowup' || key === 'arrowdown')
                ? ({ star: { f: 'starPoints', def: 5, min: 3, max: 12 },
                     polygon: { f: 'polygonSides', def: 6, min: 3, max: 20 },
                     burst: { f: 'burstPoints', def: 16, min: 8, max: 32 } } as const)[only.type as 'star' | 'polygon' | 'burst']
                : undefined;
              if (only && pointSpec) {
                e.preventDefault();
                const cur = (only as any)[pointSpec.f] ?? pointSpec.def;
                const next = Math.max(pointSpec.min, Math.min(pointSpec.max, cur + (key === 'arrowup' ? 1 : -1)));
                if (next !== cur) { pushToHistory(); updateElement(only.id, { [pointSpec.f]: next }); }
              } else {
                // Default nudge behavior. Shift = coarse (10px); otherwise 1px.
                // (Ctrl/Cmd fine-nudge is handled in the Ctrl/Meta block.)
                const nudgeAmount = e.shiftKey ? 10 : 1;
                let dx = 0, dy = 0;
                if (key === 'arrowup') dy = -nudgeAmount;
                else if (key === 'arrowdown') dy = nudgeAmount;
                else if (key === 'arrowleft') dx = -nudgeAmount;
                else if (key === 'arrowright') dx = nudgeAmount;
                moveSelectedElements(dx, dy, true);
              }
            }
          }
        } else if (key === 'f2') {
          // Edit selected node's text (documented mindmap shortcut; works for any
          // single text-bearing element). Backed by the __nodeTextEdit bridge so a
          // node can be labelled without the mouse. select-all so typing replaces.
          if (store.selection.length === 1) {
            e.preventDefault();
            (window as any).__nodeTextEdit?.startEditing(store.selection[0], { selectAll: true });
          }
        } else if (key === 'tab') {
          if (store.selection.length === 1) {
            e.preventDefault();
            // Reflow instantly (not animated): editing opens immediately, so the node
            // must already be at its final slot or the text overlay would be misplaced.
            const newId = addChildNode(store.selection[0], { animate: false });
            // Drop straight into editing so the new node can be labelled (keyboard-only flow)
            if (newId) (window as any).__nodeTextEdit?.startEditing(newId);
          }
        } else if (key === 'enter') {
          if (store.selection.length === 1) {
            // Only intercept Enter for mindmap nodes (elements with parentId)
            const selEl = store.elements.find(el => el.id === store.selection[0]);
            if (selEl?.parentId) {
              e.preventDefault();
              const newId = addSiblingNode(store.selection[0], { animate: false });
              if (newId) (window as any).__nodeTextEdit?.startEditing(newId);
            }
          }
        } else if (key === ' ') {
          // Space-hold = temporary Hand/pan tool (Illustrator convention), reusing
          // the existing 'pan' tool so all pan/cursor logic is shared. A quick tap
          // with a selection still toggles mindmap collapse (handled on keyup).
          if (!e.repeat) {
            e.preventDefault();
            spacePanPrevTool = store.selectedTool;
            spacePanDownAt = performance.now();
            spacePanning = true;
            if (store.selectedTool !== 'pan') setSelectedTool('pan');
          }
        } else if (e.shiftKey && key === 'm') {
          // Shape Builder (Illustrator Shift+M). The fastest way to combine shapes by
          // hand — drag across regions to merge, Alt+drag to delete one — and until now
          // it was buried first in a 25-item Vector Tools list.
          e.preventDefault();
          toggleShapeBuilder();
        } else if (e.shiftKey && key === 'x') {
          // Swap fill ⇄ stroke on the selection (Illustrator Shift+X).
          if (store.selection.length > 0) { e.preventDefault(); swapFillStroke(); }
        } else if (e.shiftKey && key === 'n') {
          e.preventDefault();
          addLayer();
        } else if (e.shiftKey && key === 'p') {
          e.preventDefault();
          setSelectedTool('laser');
        } else if (e.shiftKey && key === 'l') {
          e.preventDefault();
          setSelectedTool('lasso');
        } else if (e.shiftKey && key === 'c') {
          e.preventDefault();
          setSelectedTool('crop');
        } else if (e.shiftKey && key === 't') {
          e.preventDefault();
          setSelectedTool('richtext');
        } else if (e.shiftKey && key === 'h') {
          e.preventDefault();
          if (store.selection.length > 0) flipSelected('horizontal');
        } else if (e.shiftKey && key === 'v') {
          e.preventDefault();
          if (store.selection.length > 0) flipSelected('vertical');
        } else if (e.shiftKey && key === 'q') {
          e.preventDefault();
          const next = store.globalSettings.smartShape === false;
          updateGlobalSettings({ smartShape: next });
          showToast(`Smart shapes ${next ? 'on' : 'off'}`, 'info');
        } else if (e.shiftKey && key === 's') {
          e.preventDefault();
          togglePenStabilization();
          const on = (store.globalSettings.penStabilization ?? 0) > 0;
          showToast(`Stabilization ${on ? `on (${Math.round((store.globalSettings.penStabilization ?? 0) * 100)}%)` : 'off'}`, 'info');
        }
        else {
          if (key === 'v' || key === '1') setSelectedTool('selection');
          else if (key === 'r' || key === '2') setSelectedTool('rectangle');
          else if (key === 'd' || key === '3') setSelectedTool('diamond');
          else if (key === 'o' || key === '4') setSelectedTool('circle');
          else if (key === 'a' || key === '5') setSelectedTool('arrow');
          else if (key === 'l' || key === '6') setSelectedTool('line');
          else if (key === 'p') setSelectedTool('path');       // Illustrator: P = vector Pen
          else if (key === '7') setSelectedTool('fineliner');  // freehand brush keeps its number
          else if (key === 't' || key === '8') setSelectedTool(store.selectedTextType);
          else if (key === '9' || key === 'i') {
            (window as any).triggerImageUpload?.();
          }
          else if (key === 'e' || key === '0') setSelectedTool('eraser');
          else if (key === 'b') setSelectedTool('bezier');
          else if (key === 'h') setSelectedTool('pan');
          else if (key === 'm') setSelectedTool('cloud'); // Mindmap: central topic / drop a root
          else if (key === '/') { e.preventDefault(); toggleCommandPalette(true, 'Shapes'); }
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && store.appMode === 'presentation') {
        togglePresentationMode(false);
      }
    };

    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      forceAutoSave();
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
            pasteYappyElements(data);
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

        // Smart paste: a single selected node + an indented/bulleted outline →
        // build a mindmap subtree under that node (instead of one text blob).
        if (store.selection.length === 1) {
          const selectedEl = store.elements.find(el => el.id === store.selection[0]);
          const CONNECTOR_TYPES = ['line', 'arrow', 'bezier', 'organicBranch', 'polyline'];
          if (selectedEl && !CONNECTOR_TYPES.includes(selectedEl.type)) {
            const outline = parseOutline(text);
            // Only treat the paste as a subtree when intent is clear: the text has
            // real indentation hierarchy, OR the target is already a mindmap node.
            // (A flat multi-line paste onto a random shape stays a text element.)
            const hasHierarchy = outline.some(n => n.children.length > 0);
            const isMindmapNode = !!selectedEl.parentId || store.elements.some(el => el.parentId === selectedEl.id);
            if (outline.length > 0 && (hasHierarchy || isMindmapNode)) {
              const created = pasteMindmapOutline(selectedEl.id, outline);
              if (created.length > 0) {
                showToast(`Added ${created.length} node${created.length === 1 ? '' : 's'} from outline`, 'success');
                return;
              }
            }
          }
        }

        // Plain text → create text element
        pasteAsTextElement(text);
      }
    };

    // Global drag/drop for image files — primary handler for reliable drops
    // HTML5 D&D requires preventDefault on BOTH dragenter AND dragover for drops to work
    let _dragOverCount = 0;
    let _dragHasFiles = false; // Track whether current drag contains files (from dragover types)
    // _lastDragCoords removed — was unused (reserved for future fallback file picker positioning)
    const handleGlobalDragEnter = (e: DragEvent) => {
      // Let slide navigator / layer panel handle their own drag-to-rearrange
      if ((e.target as HTMLElement)?.closest?.('.slide-navigator, .layer-panel')) return;
      e.preventDefault();
      ++_dragOverCount;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
        const types = e.dataTransfer.types ? Array.from(e.dataTransfer.types) : [];
        if (types.includes('Files')) _dragHasFiles = true;
        // Log first dragenter to see what types are available from the OS
        if (_dragOverCount === 1) {
          console.log('[DND dragenter] types:', types, 'hasFiles:', _dragHasFiles);
        }
      }
    };
    const handleGlobalDragOver = (e: DragEvent) => {
      // Let slide navigator / layer panel handle their own drag-to-rearrange
      if ((e.target as HTMLElement)?.closest?.('.slide-navigator, .layer-panel')) return;
      e.preventDefault();
      ++_dragOverCount;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
        if (!_dragHasFiles && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
          _dragHasFiles = true;
        }
      }
      // _lastDragCoords tracking removed — reserved for future fallback file picker positioning
    };

    /**
     * Fallback for Chromium/Linux empty DataTransfer bug:
     * Show a visible "Click to select image" prompt at the drop location.
     * A real user click on the prompt is a guaranteed user gesture for file input.
     */
    const showDropFallbackPrompt = (clientX: number, clientY: number) => {
      // Remove any existing prompt
      document.getElementById('dnd-fallback-prompt')?.remove();

      const prompt = document.createElement('div');
      prompt.id = 'dnd-fallback-prompt';
      prompt.style.cssText = `
        position: fixed; top: ${clientY - 20}px; left: ${clientX - 80}px;
        z-index: 100000; background: #1e40af; color: white;
        padding: 8px 16px; border-radius: 8px; cursor: pointer;
        font: 13px/1.4 system-ui, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        display: flex; align-items: center; gap: 6px; user-select: none;
        animation: dnd-fade-in 0.15s ease-out;
      `;
      prompt.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Click to select image`;

      // Add animation keyframe if not present
      if (!document.getElementById('dnd-fallback-style')) {
        const style = document.createElement('style');
        style.id = 'dnd-fallback-style';
        style.textContent = `@keyframes dnd-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(style);
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.style.display = 'none';

      const cleanup = () => {
        prompt.remove();
        input.remove();
      };

      input.addEventListener('change', async () => {
        const files = input.files;
        if (!files || files.length === 0) { cleanup(); return; }
        if (!store.welcomeDismissed) setStore('welcomeDismissed', true);
        const { x: worldX, y: worldY } = screenToWorld(clientX, clientY, store.viewState);
        const STAGGER = 30;
        const ids: string[] = [];
        for (let i = 0; i < files.length; i++) {
          try {
            const id = await pasteImageFromBlob(files[i], { dx: i * STAGGER, dy: i * STAGGER }, { x: worldX, y: worldY });
            if (id) ids.push(id);
          } catch (err) { console.error('[DND fallback] FAILED:', err); }
        }
        if (ids.length > 0) setStore('selection', ids);
        cleanup();
      });

      prompt.addEventListener('click', () => input.click());

      // Auto-dismiss after 5s if not clicked
      setTimeout(() => { if (document.getElementById('dnd-fallback-prompt')) cleanup(); }, 5000);

      // Dismiss on click outside
      const outsideClick = (e: MouseEvent) => {
        if (!prompt.contains(e.target as Node)) {
          cleanup();
          document.removeEventListener('mousedown', outsideClick);
        }
      };
      setTimeout(() => document.addEventListener('mousedown', outsideClick), 100);

      document.body.appendChild(prompt);
      document.body.appendChild(input);
    };

    const isImageFile = (f: File) => {
      // Check MIME type first, fall back to extension for files with empty type
      if (f.type.startsWith('image/')) return true;
      if (!f.type && f.name) {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif', 'heic', 'heif', 'tiff', 'tif'].includes(ext || '');
      }
      return false;
    };

    /**
     * Extract ALL data from DataTransfer SYNCHRONOUSLY.
     * Some browsers (especially on Linux) aggressively clear DataTransfer
     * after the synchronous event handler returns, even within async functions.
     * This function must be called from a non-async handler to guarantee data access.
     */
    const extractDropData = (e: DragEvent, source: string) => {
      const t = e.target as HTMLElement;
      const dt = e.dataTransfer;
      const types = dt?.types ? Array.from(dt.types) : [];

      // Extract files from dt.files
      const filesFromList: File[] = [];
      if (dt?.files) {
        for (let i = 0; i < dt.files.length; i++) {
          filesFromList.push(dt.files[i]);
        }
      }

      // Extract files from dt.items (fallback — more reliable on some platforms)
      const filesFromItems: File[] = [];
      if (dt?.items) {
        for (let i = 0; i < dt.items.length; i++) {
          const item = dt.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) filesFromItems.push(file);
          }
        }
      }

      // Read string data synchronously (before browser clears DataTransfer)
      const uriList = dt ? dt.getData('text/uri-list') : '';
      const textPlain = dt ? dt.getData('text/plain') : '';

      console.log(`[DND drop:${source}]`, {
        target: t.tagName,
        clientX: e.clientX, clientY: e.clientY,
        defaultPrevented: e.defaultPrevented,
        types,
        filesFromList: filesFromList.length,
        filesFromItems: filesFromItems.length,
        uriList: uriList ? uriList.substring(0, 200) : '',
        textPlain: textPlain ? textPlain.substring(0, 200) : '',
      });

      return {
        clientX: e.clientX,
        clientY: e.clientY,
        filesFromList,
        filesFromItems,
        uriList,
        textPlain,
        types,
      };
    };

    /**
     * Process extracted drop data asynchronously (file conversion, image creation).
     * Called AFTER extractDropData has synchronously captured all DataTransfer content.
     */
    const processExtractedDrop = async (data: ReturnType<typeof extractDropData>) => {
      let imageFiles: File[] = [];

      // SVG files import as editable vector paths (not raster images)
      const allDroppedFiles = [...data.filesFromList, ...data.filesFromItems];
      const svgFiles = allDroppedFiles.filter(f => f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg'));
      if (svgFiles.length > 0) {
        if (!store.welcomeDismissed) setStore('welcomeDismissed', true);
        const { x: worldX, y: worldY } = screenToWorld(data.clientX, data.clientY, store.viewState);
        const { importSvgToCanvas } = await import('./utils/svg-import');
        let placed = 0;
        for (const f of svgFiles) {
          try {
            const text = await f.text();
            const ids = importSvgToCanvas(text, { x: worldX + placed * 30, y: worldY + placed * 30 });
            if (ids.length > 0) placed++;
          } catch (err) {
            console.error('[DND drop] SVG import failed:', err);
          }
        }
        if (placed > 0) return true;
        // Fall through to raster handling if vector import found nothing
      }

      // 1. Try files from dt.files
      const allListFiles = data.filesFromList;
      if (allListFiles.length > 0) {
        console.log('[DND drop] files:', allListFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
        imageFiles = allListFiles.filter(isImageFile);
      }

      // 2. Fallback: files from dt.items
      if (imageFiles.length === 0 && data.filesFromItems.length > 0) {
        console.log('[DND drop] using items API files:', data.filesFromItems.map(f => ({ name: f.name, type: f.type, size: f.size })));
        imageFiles = data.filesFromItems.filter(isImageFile);
      }

      // 3. Fallback: text/uri-list for image URLs
      if (imageFiles.length === 0 && data.uriList) {
        const urls = data.uriList.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
        console.log('[DND drop] uri-list URLs:', urls);
        for (const url of urls) {
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
            const lowerUrl = url.toLowerCase();
            const isImgUrl = url.startsWith('data:image') ||
              ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif'].some(ext => lowerUrl.includes(ext));
            if (isImgUrl) {
              try {
                const resp = await fetch(url);
                const blob = await resp.blob();
                if (blob.type.startsWith('image/')) {
                  const fileName = url.split('/').pop()?.split('?')[0] || 'image.png';
                  imageFiles.push(new File([blob], fileName, { type: blob.type }));
                }
              } catch (err) {
                console.warn('[DND drop] failed to fetch URL:', url, err);
              }
            }
          }
        }
      }

      // 4. Fallback: text/plain for image URLs
      if (imageFiles.length === 0 && data.textPlain && !data.types.includes('Files')) {
        const text = data.textPlain;
        if (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image')) {
          const lowerText = text.toLowerCase();
          const isImgUrl = text.startsWith('data:image') ||
            ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif'].some(ext => lowerText.includes(ext));
          if (isImgUrl) {
            try {
              const resp = await fetch(text);
              const blob = await resp.blob();
              if (blob.type.startsWith('image/')) {
                const fileName = text.split('/').pop()?.split('?')[0] || 'image.png';
                imageFiles.push(new File([blob], fileName, { type: blob.type }));
              }
            } catch (err) {
              console.warn('[DND drop] failed to fetch text URL:', text, err);
            }
          }
        }
      }

      if (imageFiles.length === 0) {
        console.log('[DND drop] NO image files from any source');
        return false;
      }

      // Dismiss welcome screen
      if (!store.welcomeDismissed) {
        setStore('welcomeDismissed', true);
      }

      const { x: worldX, y: worldY } = screenToWorld(data.clientX, data.clientY, store.viewState);

      const STAGGER = 30;
      const ids: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        try {
          const id = await pasteImageFromBlob(imageFiles[i], { dx: i * STAGGER, dy: i * STAGGER }, { x: worldX, y: worldY });
          if (id) ids.push(id);
        } catch (err) {
          console.error('[DND drop] pasteImageFromBlob FAILED:', err);
        }
      }
      if (ids.length > 0) {
        setStore('selection', ids);
        console.log('[DND drop] SUCCESS — added', ids.length, 'image(s)');
      } else {
        console.warn('[DND drop] FAILED — no images were created');
      }
      return ids.length > 0;
    };

    // NON-ASYNC drop handlers — extract DataTransfer synchronously, then process async.
    // Critical: the browser clears DataTransfer after the synchronous handler returns.
    const handleGlobalDrop = (e: DragEvent) => {
      // Let slide navigator / layer panel handle their own drag-to-rearrange drops
      if ((e.target as HTMLElement)?.closest?.('.slide-navigator, .layer-panel')) return;

      const dragCount = _dragOverCount;
      const hadDragActivity = dragCount > 0;

      const data = extractDropData(e, 'window-capture');
      console.log('[DND drop] dragOverCount was:', dragCount, 'hadDragActivity:', hadDragActivity);

      const hasFiles = data.filesFromList.length > 0 || data.filesFromItems.length > 0;
      const text = data.textPlain || '';
      const isColorText = !hasFiles && (
        text.startsWith('#') ||
        text.startsWith('color(') ||
        text.startsWith('rgb(') ||
        text.startsWith('rgba(') ||
        text.startsWith('oklch(') ||
        text.startsWith('hsl(') ||
        text.includes('display-p3') ||
        text === 'transparent'
      );

      // Color-swatch drops are handled by the canvas drop listener (sets backgroundColor
      // on the dropped-on element / active slide). Let the event continue to bubble.
      if (isColorText) return;

      _dragOverCount = 0;
      _dragHasFiles = false;

      // Always prevent default on drop to stop browser from navigating to the file
      e.preventDefault();
      e.stopPropagation();

      const hasImageUrls = data.uriList || data.textPlain;
      if (hasFiles || hasImageUrls) {
        processExtractedDrop(data);
      } else if (hadDragActivity) {
        // DataTransfer is completely empty despite drag activity (Chromium/Linux bug).
        // Show a visible prompt for the user to select the image file.
        console.log('[DND drop] DataTransfer empty — showing fallback prompt');
        showDropFallbackPrompt(data.clientX, data.clientY);
      }
    };

    // Bubble phase fallback — only fires if capture didn't handle it
    const handleDocumentDrop = (e: DragEvent) => {
      if (e.defaultPrevented) return;
      const data = extractDropData(e, 'doc-bubble');
      const hasFiles = data.filesFromList.length > 0 || data.filesFromItems.length > 0;
      const hasImageUrls = data.uriList || data.textPlain;
      if (hasFiles || hasImageUrls) {
        e.preventDefault();
        e.stopPropagation();
        processExtractedDrop(data);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('paste', handlePaste);
    // D&D: prevent default on dragenter + dragover (both required by spec) at window capture + document bubble
    window.addEventListener('dragenter', handleGlobalDragEnter, true);
    document.addEventListener('dragenter', handleGlobalDragEnter);
    window.addEventListener('dragover', handleGlobalDragOver, true);
    document.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop, true);
    document.addEventListener('drop', handleDocumentDrop);
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('dragenter', handleGlobalDragEnter, true);
      document.removeEventListener('dragenter', handleGlobalDragEnter);
      window.removeEventListener('dragover', handleGlobalDragOver, true);
      document.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop, true);
      document.removeEventListener('drop', handleDocumentDrop);
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
            <DockContainer />
            <PropertyPanel />
            {/* Frame timeline (Animation mode) replaces the seconds-based playheads —
                mounting both would mean two competing time drivers. */}
            <Show when={store.docType !== 'animation'}>
              <SceneTimeline />
              <KeyframePanel />
            </Show>
            <GameGraph />
            <BlueprintGraph />
            <GameModeBar />
            <AnimationModeBar />
            <AnimationTimeline />
            <StatusBar />
          </Show>
          <Show when={store.zenMode}>
            <button
              class="zen-exit-btn"
              onClick={() => toggleZenMode()}
              title="Exit Zen Mode (Alt+Z)"
            >
              Exit Zen
            </button>
          </Show>
          <Menu />
        </Show>
        <Canvas />
        <Show when={store.showRulers && store.appMode !== 'presentation' && !store.zenMode}>
          <RulerOverlay />
        </Show>
        <CropBar />
        <RepeatDialog />
        <SymmetryOverlay />
        <MeshOverlay />
        <ArtboardOverlay />
        <MeasureOverlay />
        <BooleanOpsToolbar />
        <TransformHud />
        <ShapeBuilderOverlay />
        <CutOverlay />
        <SymbolSprayerOverlay />
        <LivePaintOverlay />
        <WidthToolOverlay />
        <CurveToolOverlay />
        <ReshapeToolOverlay />
        <BlobBrushOverlay />
        <PathEraserOverlay />
        <PuppetWarpOverlay />
        <PerspectiveGridOverlay />
        <TouchTypeOverlay />
        <GameOverlay />
        <SliceToolOverlay />
        <SymbolismOverlay />
        <TypeOnPathOverlay />
        <SymbolEditBanner />
        <Show when={isMultiPageDocType(store.docType)}>
          <Show when={store.appMode !== 'presentation' && !store.zenMode && store.showSlideNavigator} fallback={
            <Show when={store.appMode === 'presentation' && !store.gameActive}>
              <PresentationControls />
            </Show>
          }>
            <SlideNavigator />
          </Show>
        </Show>
        <CanvasToolbar />
        <DsOpsPanel />

        {/* Panels hidden in Presentation Mode */}
        <Show when={store.appMode !== 'presentation'}>
          <CommandPalette />
          <WelcomeScreen />
        </Show>

        {/* Floating utility cluster — bottom-left on desktop/tablet; on phones it
            relocates to a top-right rail (see .floating-tools-cluster in index.css)
            so the bottom-docked toolbar can't swallow its taps. */}
        <Show when={store.appMode !== 'presentation'}>
          <div class="floating-tools-cluster">
            <button
              class="floating-settings-btn"
              onClick={() => setShowSettings(true)}
              title="Global Settings"
            >
              <Settings size={20} />
            </button>
            <button
              class="floating-settings-btn"
              classList={{ 'active': store.showPropertyPanel }}
              onClick={() => togglePropertyPanel()}
              title="Toggle Properties (Alt+Enter)"
            >
              <SlidersHorizontal size={20} />
            </button>
            <button
              class="floating-settings-btn help-btn"
              onClick={() => setShowHelp(true)}
              title="Shortcuts & Help (?)"
            >
              ?
            </button>
          </div>
          <SlideControlToolbar />
          <QuickToolbar />
        </Show>
        <Toast />
        <OnboardingTour />
        <ColorDropHud />
        <Show when={penPos()}>
          {(p) => (
            <div class="pen-cursor" style={{ left: `${p().x}px`, top: `${p().y}px` }} aria-hidden="true" />
          )}
        </Show>
      </Suspense>
    </div >
  );
};

export default App;
