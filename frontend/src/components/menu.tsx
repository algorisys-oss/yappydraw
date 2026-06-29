import { type Component, createSignal, onMount, onCleanup, Show, lazy, Suspense, createEffect } from "solid-js";
import { showToast } from "./toast";
import { storage } from "../storage/file-system-storage";
import {
    store, deleteElements, toggleTheme, zoomToFit, zoomToFitSlide,
    togglePropertyPanel, toggleLayerPanel, toggleSymbolsPanel, toggleHistoryPanel, toggleGraphicStylesPanel, toggleSwatchesPanel, togglePatternsPanel, toggleMeasure, toggleMinimap, toggleRulers, toggleStatePanel, toggleSlideToolbar,
    toggleUtilityToolbar, loadTemplate, loadDocument, loadPresentationTemplate, resetToNewDocument, saveActiveSlide, setIsExportOpen,
    toggleMainToolbar, toggleSlideNavigator, toggleCanvasToolbar, undo, redo, setShowCanvasProperties, setStore
} from "../store/app-store";
import { clearAutoSave } from "../storage/auto-save";
import {
    Menu as MenuIcon, FolderOpen, FilePlus, Trash2, Maximize,
    Moon, Sun, Focus, Monitor, Download, Layout, Settings,
    Layers, Check, Play, Pause, Square, Camera, Video, Palette, Undo2, Redo2, MoreVertical, FileText,
    Sparkles, Key, Ruler, Component as ComponentIcon, History, Film, CirclePlay, Grid2x2
} from "lucide-solid";
import { toggleTimelapse, setTimelapsePlayerOpen } from "../utils/timelapse-manager";
import { ColorPalettePicker, isPalettePinned } from "./p3-color-picker";
import { sequenceAnimator } from "../utils/animation/sequence-animator";
import { isGlobalPlaying, isGlobalPaused, animationEngine } from "../utils/animation/animation-engine";
import { clickOutside } from "../utils/click-outside";
const HelpDialog = lazy(() => import("./help-dialog"));
const LoadExportDialog = lazy(() => import("./load-export-dialog"));
const FileOpenDialog = lazy(() => import("./file-open-dialog"));
const ExportDialog = lazy(() => import("./export-dialog"));
const SaveDialog = lazy(() => import("./save-dialog"));
const TemplateBrowser = lazy(() => import("./template-browser"));
const CloudStorageDialogLazy = lazy(() => import("./cloud-storage-dialog").then(m => ({ default: m.CloudStorageDialog as any })));
const DSLImportDialog = lazy(() => import("./dsl-import-dialog"));
const UnsavedChangesDialog = lazy(() => import("./unsaved-changes-dialog"));
const AIPromptDialog = lazy(() => import("./ai-prompt-dialog"));
const AISlidesDialog = lazy(() => import("./ai-slides-dialog"));
const AISettingsDialog = lazy(() => import("./ai-settings-dialog"));
const RocketSettingsDialog = lazy(() => import("./rocket-settings-dialog"));
import SettingsDialog from "./settings-dialog";
import { showAISettings, setShowAISettings } from "./ai-settings-dialog";
import { showRocketSettings, setShowRocketSettings } from "./rocket-settings-dialog";
import { features } from "../config/features";
import { cloudStorageManager } from "../storage/cloud";
import type { CloudFileInfo } from "../storage/cloud/types";
import { migrateToSlideFormat, isSlideDocument } from "../utils/migration";
import type { SlideDocument } from "../types/slide-types";
import type { Template } from "../types/template-types";
import { exportToHtml } from "../utils/export-to-html";
import { YappyAPI } from "../api";
import { loadRocketConfig, hasRocketConfig, rocketLogin, rocketEnsureApp, rocketImportSchema } from "../ai/rocket-settings";
import "./menu.css";

// Exported signals for App.tsx integration
export const [drawingId, setDrawingId] = createSignal('Untitled');
export const [isDialogOpen, setIsDialogOpen] = createSignal(false);
export const [isSaveOpen, setIsSaveOpen] = createSignal(false);
export const [isLoadExportOpen, setIsLoadExportOpen] = createSignal(false);
export const [loadExportInitialTab, setLoadExportInitialTab] = createSignal<'load' | 'save'>('load');
export const [showHelp, setShowHelp] = createSignal(false);
export const [showSettings, setShowSettings] = createSignal(false);
export const [isCloudDialogOpen, setIsCloudDialogOpen] = createSignal(false);
export const [cloudDialogMode, setCloudDialogMode] = createSignal<'save' | 'load'>('load');
export const [isDSLImportOpen, setIsDSLImportOpen] = createSignal(false);
export const [dslImportInitialText, setDslImportInitialText] = createSignal('');
export const [isAIPromptOpen, setIsAIPromptOpen] = createSignal(false);
export const [isAISlidesOpen, setIsAISlidesOpen] = createSignal(false);
export const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = createSignal(false);

// Pending action to execute after save/discard in unsaved changes dialog
let pendingUnsavedAction: (() => void) | null = null;

// Exported handlers for App.tsx integration
let sharedSetSaveIntent: (intent: 'workspace' | 'disk' | 'disk-json') => void = () => { };
export const handleSaveRequest = (intent: 'workspace' | 'disk' | 'disk-json') => {
    if (typeof sharedSetSaveIntent === 'function') {
        sharedSetSaveIntent(intent);
        setIsSaveOpen(true);
    }
};

export const handleNew = (docType: 'infinite' | 'slides' = 'slides') => {
    const proceed = () => {
        resetToNewDocument(docType);
        setDrawingId('Untitled');
    };

    if (!store.isDirty) {
        proceed();
        return;
    }

    pendingUnsavedAction = proceed;
    setIsUnsavedDialogOpen(true);
};

const Menu: Component = () => {
    const [isMenuOpen, setIsMenuOpen] = createSignal(false);
    const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);
    const [isUtilityMenuOpen, setIsUtilityMenuOpen] = createSignal(false);
    let fileInputRef: HTMLInputElement | undefined;

    const [saveIntent, setSaveIntent] = createSignal<'workspace' | 'disk' | 'disk-json'>('workspace');
    sharedSetSaveIntent = setSaveIntent;
    const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = createSignal(false);

    const handleUnsavedCancel = () => {
        pendingUnsavedAction = null;
        setIsUnsavedDialogOpen(false);
    };

    const handleUnsavedDiscard = () => {
        const action = pendingUnsavedAction;
        pendingUnsavedAction = null;
        setIsUnsavedDialogOpen(false);
        if (action) action();
    };

    const handleUnsavedSave = () => {
        // Close unsaved dialog, open the standard export/save dialog.
        // The pending action will execute after the user completes the save.
        setIsUnsavedDialogOpen(false);
        setLoadExportInitialTab('save');
        setIsLoadExportOpen(true);
    };
    const [isPalettePickerOpen, setIsPalettePickerOpen] = createSignal(isPalettePinned());
    let palettePickerRef: HTMLDivElement | undefined;

    createEffect(() => {
        // Pinned palettes ignore outside clicks; Esc still closes (see keydown handler below).
        if (isPalettePickerOpen() && palettePickerRef && !isPalettePinned()) {
            clickOutside(palettePickerRef, () => () => setIsPalettePickerOpen(false));
        }
    });

    const onPaletteEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isPalettePickerOpen()) {
            setIsPalettePickerOpen(false);
        }
    };
    onMount(() => document.addEventListener('keydown', onPaletteEscape));
    onCleanup(() => document.removeEventListener('keydown', onPaletteEscape));

    (window as any).triggerImageUpload = () => fileInputRef?.click();


    const performSave = async (filename: string) => {
        try {
            showToast('Saving...', 'loading', 0);
            setDrawingId(filename);

            // 1. Ensure current slide data is synced to slides array
            saveActiveSlide();

            // 2. Prepare SlideDocument v4
            const slideDoc: SlideDocument = {
                version: 4,
                metadata: {
                    name: filename,
                    updatedAt: new Date().toISOString(),
                    docType: store.docType
                },
                elements: JSON.parse(JSON.stringify(store.elements)),
                layers: JSON.parse(JSON.stringify(store.layers)),
                slides: JSON.parse(JSON.stringify(store.slides)),
                globalSettings: JSON.parse(JSON.stringify(store.globalSettings)),
                gridSettings: JSON.parse(JSON.stringify(store.gridSettings)),
                states: JSON.parse(JSON.stringify(store.states)),
                symbols: JSON.parse(JSON.stringify(store.symbols)),
                graphicStyles: JSON.parse(JSON.stringify(store.graphicStyles)),
                swatches: JSON.parse(JSON.stringify(store.swatches)),
                artboards: JSON.parse(JSON.stringify(store.artboards))
            };
            const baseFilename = filename.replace(/\.(json|yappy)$/i, '');

            if (saveIntent() === 'workspace') {
                if (!features.enableWorkspacePersistence) {
                    showToast('Workspace saving is disabled', 'error');
                    return;
                }
                await storage.saveDrawing(filename, slideDoc);
                clearAutoSave();
                showToast(`Drawing saved successfully!`, 'success');
            } else {
                const jsonString = JSON.stringify(slideDoc, null, 2);

                let blob: Blob;
                let fileNameWithExt: string;
                let mimeType: string;

                if (saveIntent() === 'disk-json') {
                    // Save as uncompressed JSON
                    blob = new Blob([jsonString], { type: 'application/json' });
                    fileNameWithExt = `${baseFilename}.json`;
                    mimeType = 'application/json';
                } else {
                    // Compress using GZIP (.yappy)
                    const stream = new Blob([jsonString]).stream().pipeThrough(new CompressionStream('gzip'));
                    const compressedResponse = new Response(stream);
                    blob = await compressedResponse.blob();
                    fileNameWithExt = `${baseFilename}.yappy`;
                    mimeType = 'application/octet-stream';
                }

                // For sharing, we might need a file object
                // Note: .yappy mime type is technically application/octet-stream or application/gzip
                // but let's stick to generic binary for now or custom
                const file = new File([blob], fileNameWithExt, { type: mimeType });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Yappy Drawing',
                            text: saveIntent() === 'disk-json' ? 'Save your drawing JSON' : 'Save your compressed drawing'
                        });
                        return;
                    } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                            console.error('Share failed:', err);
                        }
                    }
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileNameWithExt;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                clearAutoSave();
                showToast(`Saved as ${fileNameWithExt}`, 'success');
            }
        } catch (e) {
            console.error('Save failed:', e);
            showToast(`Failed to save: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
    };

    const handleLoad = async (id?: string) => {
        const targetId = id || drawingId();
        showToast('Loading...', 'loading', 0);
        try {
            const data = await storage.loadDrawing(targetId);
            if (data) {
                // Ensure data is in SlideDocument format (migrate if v2)
                const doc = isSlideDocument(data) ? data : migrateToSlideFormat(data);
                loadDocument(doc);
                setDrawingId(doc.metadata?.name || targetId);
                showToast('Drawing loaded successfully', 'success');
            } else {
                showToast('Drawing not found', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to load drawing', 'error');
        }
    };

    const handleResetView = () => {
        store.docType === 'slides' ? zoomToFitSlide() : zoomToFit();
    };


    const loadTemplateAction = (template: Template) => {
        // DSL-based template: open import dialog with code pre-loaded
        if (template.dslContent) {
            setIsTemplateBrowserOpen(false);
            setDslImportInitialText(template.dslContent);
            setIsDSLImportOpen(true);
            return;
        }

        // Presentation template: multi-slide deck
        if ((template as any).slides?.length > 0) {
            loadPresentationTemplate(template as any);
            setIsTemplateBrowserOpen(false);
            const slideCount = (template as any).slides.length;
            showToast(`"${template.metadata.name}" loaded — ${slideCount} slides`, 'success');
            return;
        }

        loadTemplate(template.data);
        setIsTemplateBrowserOpen(false);
        showToast(`Template "${template.metadata.name}" loaded`, 'success');
    };

    const handleTemplateSelect = (template: Template) => {
        if (store.isDirty) {
            pendingUnsavedAction = () => loadTemplateAction(template);
            setIsUnsavedDialogOpen(true);
            return;
        }
        loadTemplateAction(template);
    };

    const handleOpenJson = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
            showToast('Loading file...', 'loading', 0);
            let jsonString: string;

            // Try to decompress if extension is .yappy OR detection fails
            if (file.name.endsWith('.yappy') || file.type === 'application/gzip' || file.type === 'application/x-gzip') {
                try {
                    const ds = new DecompressionStream('gzip');
                    const decompressedStream = file.stream().pipeThrough(ds);
                    const decompressedResponse = new Response(decompressedStream);
                    jsonString = await decompressedResponse.text();
                } catch (decompressErr) {
                    console.warn('Decompression failed, trying as plain text...', decompressErr);
                    jsonString = await file.text();
                }
            } else {
                jsonString = await file.text();
            }

            const json = JSON.parse(jsonString);

            // Ensure data is in SlideDocument format (migrate if v2)
            const doc = isSlideDocument(json) ? json : migrateToSlideFormat(json);
            loadDocument(doc);

            const name = file.name.replace(/\.(json|yappy)$/i, '');
            setDrawingId(name);
            showToast('File loaded successfully', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to load file. It might be corrupted or invalid format.', 'error');
        }

        setIsMenuOpen(false);
        (e.target as HTMLInputElement).value = '';
        (e.target as HTMLInputElement).value = '';
    };

    const handleLoadJsonText = (jsonString: string) => {
        try {
            showToast('Loading JSON...', 'loading', 0);
            const json = JSON.parse(jsonString);
            const doc = isSlideDocument(json) ? json : migrateToSlideFormat(json);
            loadDocument(doc);
            setDrawingId(doc.metadata?.name || 'Pasted Sketch');
            showToast('JSON loaded successfully', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to load JSON. The data may be corrupted or in an invalid format.', 'error');
        }
        setIsLoadExportOpen(false);
        setIsMenuOpen(false);
    };

    const handleExportHtml = async () => {
        try {
            showToast('Generating HTML...', 'loading', 0);
            saveActiveSlide(); // Sync current inputs

            const slideDoc: SlideDocument = {
                version: 4,
                metadata: {
                    name: drawingId(),
                    updatedAt: new Date().toISOString(),
                    docType: store.docType
                },
                elements: JSON.parse(JSON.stringify(store.elements)),
                layers: JSON.parse(JSON.stringify(store.layers)),
                slides: JSON.parse(JSON.stringify(store.slides)),
                globalSettings: JSON.parse(JSON.stringify(store.globalSettings)),
                gridSettings: JSON.parse(JSON.stringify(store.gridSettings)),
                states: JSON.parse(JSON.stringify(store.states)),
                symbols: JSON.parse(JSON.stringify(store.symbols)),
                graphicStyles: JSON.parse(JSON.stringify(store.graphicStyles)),
                swatches: JSON.parse(JSON.stringify(store.swatches)),
                artboards: JSON.parse(JSON.stringify(store.artboards))
            };

            await exportToHtml(slideDoc, drawingId());
            showToast('HTML Exported successfully!', 'success');
            setIsLoadExportOpen(false);
        } catch (e) {
            console.error(e);
            showToast('Failed to export HTML', 'error');
        }
    };

    const handleExportRocket = () => {
        try {
            showToast('Generating Rocket schema...', 'loading', 0);
            saveActiveSlide();

            const result = YappyAPI.exportToRocket();

            if (!result.success) {
                const msg = result.errors?.map((e: any) => e.message).join(', ') || 'Export failed';
                showToast(msg, 'error');
                return;
            }

            const jsonString = JSON.stringify(result.schema, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${drawingId()}-rocket.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const warnings = result.warnings?.length ? ` (${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''})` : '';
            showToast(`Rocket schema exported!${warnings}`, 'success');
            setIsLoadExportOpen(false);
        } catch (e) {
            console.error(e);
            showToast(`Rocket export failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
    };

    const handleDeployToRocket = async () => {
        try {
            // Check config — open settings dialog if unconfigured
            if (!hasRocketConfig()) {
                setIsLoadExportOpen(false);
                setShowRocketSettings(true);
                return;
            }

            showToast('Deploying to Rocket...', 'loading', 0);
            saveActiveSlide();

            const result = YappyAPI.exportToRocket();
            if (!result.success) {
                const msg = result.errors?.map((e: any) => e.message).join(', ') || 'Export failed';
                showToast(msg, 'error');
                return;
            }

            const config = loadRocketConfig();
            const loginResult = await rocketLogin(config);
            if (!loginResult.success || !loginResult.accessToken) {
                showToast(`Rocket login failed: ${loginResult.error}`, 'error');
                return;
            }

            const token = loginResult.accessToken;
            await rocketEnsureApp(config, token);

            const importResult = await rocketImportSchema(config, token, result.schema!);
            if (!importResult.success) {
                showToast(`Import failed: ${importResult.error}`, 'error');
                return;
            }

            showToast(`Deployed to Rocket app "${config.appName}"!`, 'success');
            setIsLoadExportOpen(false);
        } catch (e) {
            console.error(e);
            showToast(`Deploy failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
        }
    };

    const [leftPos, setLeftPos] = createSignal({ x: 0, y: 0 });
    const [leftDragging, setLeftDragging] = createSignal(false);
    const [leftDragStart, setLeftDragStart] = createSignal({ x: 0, y: 0 });

    const [rightPos, setRightPos] = createSignal({ x: 0, y: 0 });
    const [rightDragging, setRightDragging] = createSignal(false);
    const [rightDragStart, setRightDragStart] = createSignal({ x: 0, y: 0 });

    const onLeftMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.menu-container') || target.classList.contains('app-title') || target.classList.contains('drag-handle')) {
            // Don't drag if clicking buttons inside
            if (target.tagName === 'BUTTON' || target.closest('button')) return;

            setLeftDragging(true);
            setLeftDragStart({
                x: e.clientX - leftPos().x,
                y: e.clientY - leftPos().y
            });
            e.preventDefault();
        }
    };

    const onRightMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.menu-container') || target.classList.contains('drag-handle')) {
            if (target.tagName === 'BUTTON' || target.closest('button')) return;

            setRightDragging(true);
            setRightDragStart({
                x: e.clientX - rightPos().x,
                y: e.clientY - rightPos().y
            });
            e.preventDefault();
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (leftDragging()) {
            setLeftPos({
                x: e.clientX - leftDragStart().x,
                y: e.clientY - leftDragStart().y
            });
        }
        if (rightDragging()) {
            setRightPos({
                x: e.clientX - rightDragStart().x,
                y: e.clientY - rightDragStart().y
            });
        }
    };

    const onMouseUp = () => {
        setLeftDragging(false);
        setRightDragging(false);
    };

    onMount(() => {
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        onCleanup(() => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('resize', handleResize);
        });

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setDrawingId(id);
            handleLoad(id);
        }
    });

    return (
        <>
            <Show when={isMenuOpen() || isUtilityMenuOpen()}>
                <div class="menu-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) { setIsMenuOpen(false); setIsUtilityMenuOpen(false); } }}></div>
            </Show>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json,.yappy"
                onChange={handleOpenJson}
            />

            <Suspense fallback={null}>
                <FileOpenDialog
                    isOpen={isDialogOpen()}
                    onClose={() => setIsDialogOpen(false)}
                    onSelect={(id) => {
                        handleLoad(id);
                        setIsDialogOpen(false);
                    }}
                />

                <ExportDialog
                    isOpen={store.showExportDialog}
                    onClose={() => setIsExportOpen(false)}
                />

                <SaveDialog
                    isOpen={isSaveOpen()}
                    onClose={() => setIsSaveOpen(false)}
                    onSave={performSave}
                    initialFilename={drawingId()}
                />

                <HelpDialog isOpen={showHelp()} onClose={() => setShowHelp(false)} />
                <SettingsDialog isOpen={showSettings()} onClose={() => setShowSettings(false)} />

                <LoadExportDialog
                    isOpen={isLoadExportOpen()}
                    initialTab={loadExportInitialTab()}
                    onClose={() => setIsLoadExportOpen(false)}
                    onLoadWorkspace={() => { setIsLoadExportOpen(false); setIsDialogOpen(true); }}
                    onLoadDisk={() => { setIsLoadExportOpen(false); fileInputRef?.click(); }}
                    onLoadJson={handleLoadJsonText}
                    onSaveWorkspace={() => { setIsLoadExportOpen(false); handleSaveRequest('workspace'); }}
                    onSaveDisk={() => { setIsLoadExportOpen(false); handleSaveRequest('disk'); }}
                    onSaveDiskJson={() => { setIsLoadExportOpen(false); handleSaveRequest('disk-json'); }}
                    onExportImage={() => { setIsLoadExportOpen(false); setIsExportOpen(true); }}
                    onExportHtml={handleExportHtml}
                    onExportRocket={handleExportRocket}
                    onDeployRocket={handleDeployToRocket}
                    onLoadCloud={() => { setIsLoadExportOpen(false); setCloudDialogMode('load'); setIsCloudDialogOpen(true); }}
                    onSaveCloud={() => { setIsLoadExportOpen(false); setCloudDialogMode('save'); setIsCloudDialogOpen(true); }}
                />

                <CloudStorageDialogLazy
                    isOpen={isCloudDialogOpen()}
                    mode={cloudDialogMode()}
                    onClose={() => setIsCloudDialogOpen(false)}
                    currentFileName={drawingId()}
                    onLoad={async (fileId: string) => {
                        setIsCloudDialogOpen(false);
                        showToast('Loading from Google Drive...', 'loading', 0);
                        try {
                            const doc = await cloudStorageManager.load(fileId);
                            loadDocument(doc);
                            setDrawingId(doc.metadata?.name || 'Untitled');
                            showToast('Loaded from Google Drive', 'success');
                        } catch (e: any) {
                            showToast(e.message || 'Failed to load from Google Drive', 'error');
                        }
                    }}
                    onSaveComplete={(fileInfo: CloudFileInfo) => {
                        setDrawingId(fileInfo.name);
                    }}
                />

                <TemplateBrowser
                    isOpen={isTemplateBrowserOpen()}
                    onClose={() => setIsTemplateBrowserOpen(false)}
                    onSelectTemplate={handleTemplateSelect}
                />

                <DSLImportDialog
                    isOpen={isDSLImportOpen()}
                    onClose={() => { setIsDSLImportOpen(false); setDslImportInitialText(''); }}
                    initialText={dslImportInitialText()}
                />

                <AIPromptDialog
                    isOpen={isAIPromptOpen()}
                    onClose={() => setIsAIPromptOpen(false)}
                />
                <AISlidesDialog
                    isOpen={isAISlidesOpen()}
                    onClose={() => setIsAISlidesOpen(false)}
                />
                <AISettingsDialog
                    isOpen={showAISettings()}
                    onClose={() => setShowAISettings(false)}
                />
                <Show when={features.enableRocketExport}>
                    <RocketSettingsDialog
                        isOpen={showRocketSettings()}
                        onClose={() => setShowRocketSettings(false)}
                    />
                </Show>

                <UnsavedChangesDialog
                    isOpen={isUnsavedDialogOpen()}
                    onCancel={handleUnsavedCancel}
                    onDiscard={handleUnsavedDiscard}
                    onSave={handleUnsavedSave}
                />
            </Suspense>

            <Show when={!store.zenMode}>
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: '12px',
                            left: '12px',
                            "z-index": 10060,
                            transform: `translate(${leftPos().x}px, ${leftPos().y}px)`
                        }}
                    >
                        <div
                            class="menu-container"
                            style={{ position: 'relative' }}
                            onMouseDown={onLeftMouseDown}
                        >
                            <div class="drag-handle sm">
                                <div class="drag-dots"></div>
                            </div>
                            <div class="text-logo" title="YappyDraw">
                                <span class="text-logo-yappy">Yappy</span><span class="text-logo-draw">Draw</span>
                            </div>
                            <button class={`menu-btn ${isMenuOpen() ? 'active' : ''}`} title="Menu" onClick={() => setIsMenuOpen(!isMenuOpen())}>
                                <MenuIcon size={18} />
                            </button>

                            <Show when={isMenuOpen()}>
                                <div class="menu-dropdown">
                                    <button class="menu-item" onClick={() => { handleNew('infinite'); setIsMenuOpen(false); }}>
                                        <Maximize size={16} />
                                        <span class="label">New Infinite Drawing</span>
                                    </button>
                                    <button class="menu-item" onClick={() => { handleNew('slides'); setIsMenuOpen(false); }}>
                                        <FilePlus size={16} />
                                        <span class="label">New Presentation</span>
                                    </button>
                                    <button class="menu-item" onClick={() => { setIsTemplateBrowserOpen(true); setIsMenuOpen(false); }}>
                                        <Layout size={16} />
                                        <span class="label">Templates</span>
                                    </button>
                                    <button class="menu-item" onClick={() => { setIsDSLImportOpen(true); setIsMenuOpen(false); }}>
                                        <FileText size={16} />
                                        <span class="label">Import from Text</span>
                                        <div class="menu-item-right">
                                            <span class="shortcut">Ctrl+Shift+I</span>
                                        </div>
                                    </button>
                                    <button class="menu-item" onClick={() => { setIsAIPromptOpen(true); setIsMenuOpen(false); }}>
                                        <Sparkles size={16} />
                                        <span class="label">AI Drawing</span>
                                        <div class="menu-item-right">
                                            <span class="shortcut">Ctrl+Shift+A</span>
                                        </div>
                                    </button>
                                    <button class="menu-item" onClick={() => { setIsAISlidesOpen(true); setIsMenuOpen(false); }}>
                                        <Sparkles size={16} />
                                        <span class="label">AI Presentation</span>
                                    </button>
                                    <div class="menu-separator"></div>
                                    <button class="menu-item" onClick={() => { setLoadExportInitialTab('load'); setIsLoadExportOpen(true); setIsMenuOpen(false); }}>
                                        <FolderOpen size={16} />
                                        <span class="label">Load Sketch...</span>
                                        <div class="menu-item-right">
                                            <span class="shortcut">Ctrl+Alt+O</span>
                                        </div>
                                    </button>
                                    <button class="menu-item" onClick={() => { setLoadExportInitialTab('save'); setIsLoadExportOpen(true); setIsMenuOpen(false); }}>
                                        <Download size={16} />
                                        <span class="label">Export / Save...</span>
                                        <div class="menu-item-right">
                                            <span class="shortcut">Ctrl+Alt+S</span>
                                        </div>
                                    </button>
                                    <button class="menu-item" onClick={() => { setIsExportOpen(true); setIsMenuOpen(false); }}>
                                        <Video size={16} />
                                        <span class="label">Export</span>
                                        <div class="menu-item-right">
                                            <span class="shortcut">Ctrl+Shift+E</span>
                                        </div>
                                    </button>
                                    <div class="menu-separator"></div>
                                    <div class="menu-item" onClick={() => { toggleTimelapse(); setIsMenuOpen(false); }}>
                                        <Film size={16} />
                                        <span class="label">{store.timelapseRecording ? 'Stop Time-lapse' : 'Record Time-lapse'}</span>
                                        <div class="menu-item-right">
                                            <Show when={store.timelapseRecording}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Ctrl+Shift+T</span>
                                        </div>
                                    </div>
                                    <button class="menu-item" disabled={!store.activeTimelapseId || store.timelapseRecording} onClick={() => { setTimelapsePlayerOpen(true); setIsMenuOpen(false); }}>
                                        <CirclePlay size={16} />
                                        <span class="label">Play Time-lapse</span>
                                    </button>
                                    <div class="menu-separator"></div>
                                    <div class="menu-header">Panels</div>
                                    <div class="menu-item" onClick={() => { togglePropertyPanel(); setIsMenuOpen(false); }}>
                                        <Layout size={16} />
                                        <span class="label">Properties Panel</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showPropertyPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+Enter</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleLayerPanel(); setIsMenuOpen(false); }}>
                                        <Layers size={16} />
                                        <span class="label">Layers Panel</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showLayerPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+L</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleSymbolsPanel(); setIsMenuOpen(false); }}>
                                        <ComponentIcon size={16} />
                                        <span class="label">Symbols Panel</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showSymbolsPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+B</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleHistoryPanel(); setIsMenuOpen(false); }}>
                                        <History size={16} />
                                        <span class="label">History Panel</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showHistoryPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+H</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleGraphicStylesPanel(); setIsMenuOpen(false); }}>
                                        <Palette size={16} />
                                        <span class="label">Graphic Styles</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showGraphicStylesPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+G</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleSwatchesPanel(); setIsMenuOpen(false); }}>
                                        <Palette size={16} />
                                        <span class="label">Swatches</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showSwatchesPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+W</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { togglePatternsPanel(); setIsMenuOpen(false); }}>
                                        <Grid2x2 size={16} />
                                        <span class="label">Patterns</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showPatternsPanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+P</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleMeasure(); setIsMenuOpen(false); }}>
                                        <Ruler size={16} />
                                        <span class="label">Measure Tool</span>
                                        <div class="menu-item-right">
                                            <Show when={store.measureActive}><Check size={14} class="check-icon" /></Show>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleStatePanel(); setIsMenuOpen(false); }}>
                                        <Camera size={16} />
                                        <span class="label">Display States</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showStatePanel}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+S</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleMinimap(); setIsMenuOpen(false); }}>
                                        <Maximize size={16} />
                                        <span class="label">Minimap</span>
                                        <div class="menu-item-right">
                                            <Show when={store.minimapVisible}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+M</span>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleRulers(); setIsMenuOpen(false); }}>
                                        <Ruler size={16} />
                                        <span class="label">Rulers & Guides</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showRulers}><Check size={14} class="check-icon" /></Show>
                                            <span class="shortcut">Alt+R</span>
                                        </div>
                                    </div>
                                    <Show when={store.docType === 'slides'}>
                                        <div class="menu-item" onClick={() => { toggleSlideNavigator(); setIsMenuOpen(false); }}>
                                            <Layout size={16} />
                                            <span class="label">Slide Panel</span>
                                            <div class="menu-item-right">
                                                <Show when={store.showSlideNavigator}><Check size={14} class="check-icon" /></Show>
                                            </div>
                                        </div>
                                    </Show>

                                    <div class="menu-separator"></div>
                                    <div class="menu-header">Toolbars</div>
                                    <div class="menu-item" onClick={() => { toggleMainToolbar(); setIsMenuOpen(false); }}>
                                        <Layout size={16} />
                                        <span class="label">Drawing Toolbar</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showMainToolbar}><Check size={14} class="check-icon" /></Show>
                                        </div>
                                    </div>
                                    <div class="menu-item" onClick={() => { toggleUtilityToolbar(); setIsMenuOpen(false); }}>
                                        <Layout size={16} />
                                        <span class="label">Action Toolbar</span>
                                        <div class="menu-item-right">
                                            <Show when={store.showUtilityToolbar}><Check size={14} class="check-icon" /></Show>
                                        </div>
                                    </div>
                                    <Show when={store.docType === 'slides'}>
                                        <div class="menu-item" onClick={() => { toggleSlideToolbar(); setIsMenuOpen(false); }}>
                                            <Play size={16} />
                                            <span class="label">Slide Toolbar</span>
                                            <div class="menu-item-right">
                                                <Show when={store.showSlideToolbar}><Check size={14} class="check-icon" /></Show>
                                            </div>
                                        </div>
                                    </Show>
                                    <Show when={store.docType === 'infinite'}>
                                        <div class="menu-item" onClick={() => { toggleCanvasToolbar(); setIsMenuOpen(false); }}>
                                            <Play size={16} />
                                            <span class="label">Canvas Toolbar</span>
                                            <div class="menu-item-right">
                                                <Show when={store.showCanvasToolbar}><Check size={14} class="check-icon" /></Show>
                                            </div>
                                        </div>
                                    </Show>

                                    <div class="menu-separator"></div>
                                    <div class="menu-header">Settings</div>
                                    <div class="menu-item" onClick={() => {
                                        setStore("selection", []);
                                        setShowCanvasProperties(true);
                                        togglePropertyPanel(true);
                                        setIsMenuOpen(false);
                                    }}>
                                        <Settings size={16} />
                                        <span class="label">Canvas Settings</span>
                                    </div>
                                    <div class="menu-item" onClick={() => { setShowSettings(true); setIsMenuOpen(false); }}>
                                        <Settings size={16} />
                                        <span class="label">Settings</span>
                                    </div>
                                    <div class="menu-item" onClick={() => { setShowAISettings(true); setIsMenuOpen(false); }}>
                                        <Key size={16} />
                                        <span class="label">AI Settings</span>
                                    </div>
                                    <div class="menu-separator"></div>
                                    <div style={{ padding: '4px 12px', "font-size": '12px', color: 'var(--text-secondary)' }}>
                                        Found a bug? <a href="https://github.com/algorisys-oss/" target="_blank" rel="noopener noreferrer">Report</a>
                                    </div>
                                </div>
                            </Show>

                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                            <button class="menu-btn" onClick={() => deleteElements(store.selection)} title="Delete (Del)" disabled={store.selection.length === 0}>
                                <Trash2 size={16} />
                            </button>
                            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                            <button class="menu-btn" onClick={handleResetView} title="Zoom to Fit (Ctrl+1)">
                                <Maximize size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Desktop: full utility toolbar */}
                    <Show when={store.showUtilityToolbar && !isMobile()}>
                        <div
                            style={{
                                position: 'fixed',
                                top: '12px',
                                right: '108px',
                                "z-index": 10000,
                                transform: `translate(${rightPos().x}px, ${rightPos().y}px)`
                            }}
                        >
                            <div class="menu-container" onMouseDown={onRightMouseDown}>
                                <div class="drag-handle sm">
                                    <div class="drag-dots"></div>
                                </div>
                                <button
                                    class="menu-btn"
                                    onClick={() => sequenceAnimator.playAll('programmatic')}
                                    title="Play All Animations"
                                    disabled={isGlobalPlaying() && !isGlobalPaused()}
                                >
                                    <Play size={16} color={isGlobalPlaying() && !isGlobalPaused() ? "#9ca3af" : "#10b981"} fill={isGlobalPlaying() && !isGlobalPaused() ? "#9ca3af" : "#10b981"} />
                                </button>
                                <button
                                    class="menu-btn"
                                    onClick={() => isGlobalPaused() ? animationEngine.resumeAll() : animationEngine.pauseAll()}
                                    title={isGlobalPaused() ? "Resume Animations" : "Pause Animations"}
                                    disabled={!isGlobalPlaying() && !isGlobalPaused()}
                                >
                                    <Pause size={16} color={!isGlobalPlaying() && !isGlobalPaused() ? "#9ca3af" : "#f59e0b"} fill={!isGlobalPlaying() && !isGlobalPaused() ? "#9ca3af" : "#f59e0b"} />
                                </button>
                                <button
                                    class="menu-btn"
                                    onClick={() => sequenceAnimator.stopAll()}
                                    title="Stop All Animations"
                                    disabled={!isGlobalPlaying() && !isGlobalPaused()}
                                >
                                    <Square size={16} color="#ef4444" fill="#ef4444" />
                                </button>
                            </div>
                        </div>
                    </Show>

                    {/* Desktop: standalone palette picker, always visible at top-right */}
                    <Show when={!isMobile()}>
                        <div
                            ref={palettePickerRef}
                            style={{ position: 'fixed', top: '12px', right: '60px', "z-index": 10000 }}
                        >
                            <div class="menu-container" style={{ position: 'relative' }}>
                                <button
                                    class={`menu-btn ${isPalettePickerOpen() ? 'active' : ''}`}
                                    onClick={() => setIsPalettePickerOpen(!isPalettePickerOpen())}
                                    title={`Color Palettes — current stroke: ${store.defaultElementStyles.strokeColor ?? '#000000'}`}
                                    style={{ position: 'relative' }}
                                >
                                    <Palette size={16} color="#f43f5e" />
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '2px',
                                            width: '8px',
                                            height: '8px',
                                            'border-radius': '50%',
                                            background: (store.defaultElementStyles.strokeColor as string) ?? '#000000',
                                            border: '1px solid var(--bg-primary, white)',
                                            'box-shadow': '0 0 0 1px rgba(0,0,0,0.2)',
                                            'pointer-events': 'none'
                                        }}
                                    />
                                </button>
                                <Show when={isPalettePickerOpen()}>
                                    <div
                                        class="menu-dropdown"
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 'auto',
                                            right: 0,
                                            margin: '8px 0 0 0',
                                            padding: '4px',
                                            width: 'auto',
                                            'min-width': '220px'
                                        }}
                                    >
                                        <ColorPalettePicker />
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </Show>

                    {/* Desktop: standalone theme toggle, always visible at top-right */}
                    <Show when={!isMobile()}>
                        <div style={{ position: 'fixed', top: '12px', right: '12px', "z-index": 10000 }}>
                            <div class="menu-container">
                                <button
                                    class="menu-btn"
                                    onClick={toggleTheme}
                                    title={`Toggle Theme — currently ${store.theme} (Light → Dark → Focus → System)`}
                                >
                                    {store.theme === 'light' ? <Moon size={16} />
                                        : store.theme === 'dark' ? <Focus size={16} />
                                            : store.theme === 'focus' ? <Monitor size={16} />
                                                : <Sun size={16} />}
                                </button>
                            </div>
                        </div>
                    </Show>

                    {/* Mobile: collapsed utility menu button at top-right */}
                    <Show when={isMobile()}>
                        <div
                            style={{
                                position: 'fixed',
                                top: '12px',
                                right: '12px',
                                "z-index": 10000
                            }}
                        >
                            <div class="menu-container" style={{ position: 'relative' }}>
                                <button
                                    class={`menu-btn ${isUtilityMenuOpen() ? 'active' : ''}`}
                                    onClick={() => setIsUtilityMenuOpen(!isUtilityMenuOpen())}
                                    title="More Actions"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                <Show when={isUtilityMenuOpen()}>
                                    <div class="menu-dropdown" style={{ right: 0, left: 'auto', width: '200px', top: '48px' }}>
                                        <button class="menu-item" onClick={() => { sequenceAnimator.playAll('programmatic'); setIsUtilityMenuOpen(false); }} disabled={isGlobalPlaying() && !isGlobalPaused()}>
                                            <Play size={16} color="#10b981" />
                                            <span class="label">Play Animations</span>
                                        </button>
                                        <button class="menu-item" onClick={() => { isGlobalPaused() ? animationEngine.resumeAll() : animationEngine.pauseAll(); setIsUtilityMenuOpen(false); }} disabled={!isGlobalPlaying() && !isGlobalPaused()}>
                                            <Pause size={16} color="#f59e0b" />
                                            <span class="label">{isGlobalPaused() ? "Resume" : "Pause"}</span>
                                        </button>
                                        <button class="menu-item" onClick={() => { sequenceAnimator.stopAll(); setIsUtilityMenuOpen(false); }} disabled={!isGlobalPlaying() && !isGlobalPaused()}>
                                            <Square size={16} color="#ef4444" />
                                            <span class="label">Stop</span>
                                        </button>
                                        <div class="menu-separator"></div>
                                        <button class="menu-item" onClick={() => { toggleTheme(); setIsUtilityMenuOpen(false); }}>
                                            {store.theme === 'light' ? <Moon size={16} />
                                                : store.theme === 'dark' ? <Focus size={16} />
                                                    : store.theme === 'focus' ? <Monitor size={16} />
                                                        : <Sun size={16} />}
                                            <span class="label">Toggle Theme ({store.theme})</span>
                                        </button>
                                    </div>
                                </Show>
                            </div>
                        </div>

                        {/* Mobile: floating undo/redo above bottom toolbar */}
                        <div
                            style={{
                                position: 'fixed',
                                bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
                                right: '12px',
                                "z-index": 10060,
                                display: 'flex',
                                gap: '4px'
                            }}
                        >
                            <button
                                class="menu-btn"
                                style={{
                                    background: 'var(--bg-panel)',
                                    "box-shadow": 'var(--shadow-sm)',
                                    border: '1px solid var(--border-color)',
                                    width: '40px',
                                    height: '40px',
                                    "border-radius": '8px'
                                }}
                                onClick={undo}
                                disabled={store.undoStackLength === 0}
                                title="Undo"
                            >
                                <Undo2 size={18} />
                            </button>
                            <button
                                class="menu-btn"
                                style={{
                                    background: 'var(--bg-panel)',
                                    "box-shadow": 'var(--shadow-sm)',
                                    border: '1px solid var(--border-color)',
                                    width: '40px',
                                    height: '40px',
                                    "border-radius": '8px'
                                }}
                                onClick={redo}
                                disabled={store.redoStackLength === 0}
                                title="Redo"
                            >
                                <Redo2 size={18} />
                            </button>
                        </div>
                    </Show>
                </>
            </Show>
        </>
    );
};

export default Menu;
