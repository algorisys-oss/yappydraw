/**
 * Canvas Renderer
 * Pure rendering functions extracted from the draw() method in canvas.tsx.
 * Each function handles one phase of the render pipeline.
 */

import type { DrawingElement } from '../types';
import type { SnappingGuide } from './object-snapping';
import type { SpacingGuide } from './spacing';
import { isLayerVisible, store } from '../store/app-store';
import { isElementHiddenByHierarchy } from './hierarchy';
import { renderElement } from './render-element';
import { buildClipPath2D, maskFillRule } from './clip-mask';
import { beginElement, endElement, computeElementHash, createCachedRc } from './rough-cache';
import { renderElementOverlays, renderMultiSelectionBox, renderSelectionBox, renderLassoPath, renderBindingHighlight, renderMindmapToggles, renderDropTargetHighlight } from './selection-renderer';
import { renderSnappingGuides, renderSpacingGuides } from './snap-renderer';
import rough from 'roughjs';

// ── Opacity masks: the mask shape's luminance becomes the content's alpha ──────────────
// Content and mask are rendered to off-screen canvases (same viewport transform), then the
// mask's luminance is folded into the content's alpha via a `luminanceToAlpha` SVG filter
// + destination-in compositing. Scratch canvases (+ their rough canvases) are reused.

let _omScratch: { a: HTMLCanvasElement; actx: CanvasRenderingContext2D; arc: any; b: HTMLCanvasElement; bctx: CanvasRenderingContext2D; brc: any; w: number; h: number } | null = null;
function omScratch(w: number, h: number) {
    if (!_omScratch || _omScratch.w !== w || _omScratch.h !== h) {
        const a = document.createElement('canvas'); a.width = w; a.height = h;
        const b = document.createElement('canvas'); b.width = w; b.height = h;
        _omScratch = { a, actx: a.getContext('2d')!, arc: rough.canvas(a), b, bctx: b.getContext('2d')!, brc: rough.canvas(b), w, h };
    }
    return _omScratch;
}

let _lumFilterReady = false;
function ensureLumFilter() {
    if (_lumFilterReady || typeof document === 'undefined') return;
    if (!document.getElementById('yappy-lum-filter-svg')) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'yappy-lum-filter-svg');
        svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
        svg.style.position = 'absolute'; svg.style.width = '0'; svg.style.height = '0';
        svg.innerHTML = '<filter id="yappy-lum" color-interpolation-filters="sRGB"><feColorMatrix type="luminanceToAlpha"/></filter>';
        document.body.appendChild(svg);
    }
    _lumFilterReady = true;
}

function renderOpacityMasked(ctx: CanvasRenderingContext2D, el: DrawingElement, mask: DrawingElement, isDarkMode: boolean, layerOpacity: number) {
    ensureLumFilter();
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const s = omScratch(W, H);
    const ctm = ctx.getTransform();
    // 1. content → scratch A (same viewport transform).
    s.actx.setTransform(1, 0, 0, 1, 0, 0); s.actx.clearRect(0, 0, W, H); s.actx.filter = 'none';
    s.actx.setTransform(ctm);
    renderElement(s.arc, s.actx, el, isDarkMode, layerOpacity);
    // 2. mask shape (rendered visible, with its own colours) → scratch B.
    s.bctx.setTransform(1, 0, 0, 1, 0, 0); s.bctx.clearRect(0, 0, W, H); s.bctx.filter = 'none';
    s.bctx.setTransform(ctm);
    renderElement(s.brc, s.bctx, { ...mask, isClipMask: false, clipMaskId: null } as DrawingElement, isDarkMode, 1);
    // 3. fold mask luminance into content alpha (content α *= mask luminance).
    s.actx.setTransform(1, 0, 0, 1, 0, 0);
    s.actx.globalCompositeOperation = 'destination-in';
    s.actx.filter = 'url(#yappy-lum)';
    s.actx.drawImage(s.b, 0, 0);
    s.actx.filter = 'none';
    s.actx.globalCompositeOperation = 'source-over';
    // 4. blit the masked content onto the main canvas (device space).
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(s.a, 0, 0);
    ctx.restore();
}
import { getSelectionBoundingBox } from './handle-detection';
import { getAnchorPoints } from './anchor-points';
import { projectMasterPosition } from './slide-utils';
import { getImage } from './image-cache';
import { computeCellRects, defaultColWidths, defaultRowHeights, normalizeCellSelection } from './table-utils';
import { getPoolLaneRect } from './pool-containment';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { isWasmEnabled } from '../wasm/feature-flags';
import { syncElementBounds, wasmBatchViewportCull } from '../wasm/bridge/batch-renderer-bridge';

// ─── Types ──────────────────────────────────────────────────────────

export interface ViewportBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    bufferX: number;
    bufferY: number;
}

export interface RenderElementsParams {
    elements: DrawingElement[];
    layers: any[];
    slides: any[];
    docType: string;
    activeSlideIndex: number;
    selection: string[];
    selectedTool: string;
    activeLayerId: string;
    animatedStates: Map<string, any>;
    viewportBounds: ViewportBounds;
    scale: number;
    isDarkMode: boolean;
    currentDrawingId: string | null;
    hoveredConnector: { elementId: string; handle: string } | null;
    editingId: string | null;
    canInteractWithElement: (el: DrawingElement) => boolean;
    appMode?: string;
    focusBranchIds?: Set<string> | null;
}

export interface SelectionOverlayParams {
    elements: DrawingElement[];
    selection: string[];
    scale: number;
    selectionBox: { x: number; y: number; w: number; h: number } | null;
    lassoPoints: { x: number; y: number }[] | null;
    suggestedBinding: { elementId: string; px: number; py: number; position?: string } | null;
    snappingGuides: SnappingGuide[];
    spacingGuides: SpacingGuide[];
    tableCellSelection?: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
    isDarkMode?: boolean;
    appMode?: string;
    reparentDropTarget?: string | null;
    poolLaneDropTarget?: { poolId: string; laneIndex: number } | null;
}

export interface ConnectionAnchorParams {
    elements: DrawingElement[];
    selectedTool: string;
    currentDrawingId: string | null;
    isDrawing: boolean;
    activeLayerId: string;
    scale: number;
    canInteractWithElement: (el: DrawingElement) => boolean;
}

// ─── Viewport & Culling ─────────────────────────────────────────────

export function computeViewportBounds(
    canvas: HTMLCanvasElement,
    scale: number,
    panX: number,
    panY: number
): ViewportBounds {
    const minX = (-panX) / scale;
    const maxX = (canvas.width - panX) / scale;
    const minY = (-panY) / scale;
    const maxY = (canvas.height - panY) / scale;
    const bufferX = (maxX - minX) * 0.1;
    const bufferY = (maxY - minY) * 0.1;
    return { minX, maxX, minY, maxY, bufferX, bufferY };
}

export function cullElementsForAnimation(
    elements: DrawingElement[],
    slides: any[],
    layers: any[],
    docType: string,
    activeSlideIndex: number,
    vp: ViewportBounds
): DrawingElement[] {
    if (docType === 'slides' && slides.length > 0) {
        const activeSlide = slides[activeSlideIndex];
        if (activeSlide) {
            const { x: sX, y: sY } = activeSlide.spatialPosition;
            const { width: sW, height: sH } = activeSlide.dimensions;
            const BUFFER = 200;

            const masterLayerIds = new Set(layers.filter(l => l.isMaster).map(l => l.id));
            const primaryElements = elements.filter(el => {
                if (masterLayerIds.has(el.layerId)) return true;
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                return cx >= sX - BUFFER && cx <= sX + sW + BUFFER &&
                    cy >= sY - BUFFER && cy <= sY + sH + BUFFER;
            });

            const centerIds = new Set(primaryElements.map(el => el.orbitCenterId).filter(Boolean));
            const centerElements = elements.filter(el => centerIds.has(el.id));

            return primaryElements.length === elements.length
                ? elements
                : [...new Set([...primaryElements, ...centerElements])];
        }
    }

    // Infinite canvas: cull elements outside the viewport
    const primaryElements = elements.filter(el => {
        const margin = Math.max(Math.abs(el.width), Math.abs(el.height)) * 0.5;
        return !(el.x + el.width + margin < vp.minX - vp.bufferX ||
            el.x - margin > vp.maxX + vp.bufferX ||
            el.y + el.height + margin < vp.minY - vp.bufferY ||
            el.y - margin > vp.maxY + vp.bufferY);
    });

    const centerIds = new Set(primaryElements.map(el => el.orbitCenterId).filter(Boolean));
    const centerElements = elements.filter(el => centerIds.has(el.id));

    return primaryElements.length === elements.length
        ? elements
        : [...new Set([...primaryElements, ...centerElements])];
}

// ─── Laser Trail Decay ──────────────────────────────────────────────

export function decayLaserTrail(
    laserTrailData: Array<{ x: number; y: number; timestamp: number }>,
    decayMs: number
): void {
    if (laserTrailData.length === 0) return;
    const now = Date.now();
    let writeIdx = 0;
    for (let i = 0; i < laserTrailData.length; i++) {
        if (now - laserTrailData[i].timestamp < decayMs) {
            laserTrailData[writeIdx++] = laserTrailData[i];
        }
    }
    laserTrailData.length = writeIdx;
}

// ─── Workspace Background ───────────────────────────────────────────

export function renderWorkspaceBackground(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    _theme: string,
    docType?: string,
    canvasBackgroundColor?: string
): void {
    // Stored colors are theme-canonical (light-mode); dark/focus presentation
    // is handled by a CSS invert filter on the host <canvas> element, so this
    // function paints in canonical (light-mode) colors regardless of theme.
    if (docType === 'infinite') {
        ctx.fillStyle = canvasBackgroundColor || '#ffffff';
    } else {
        ctx.fillStyle = '#e2e8f0';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ─── Slide Background (shared with thumbnail capture) ───────────────

export function renderSlideBackground(
    ctx: CanvasRenderingContext2D,
    rc: any,
    slide: any,
    x: number,
    y: number,
    w: number,
    h: number,
    _theme: string | boolean
): void {
    const type = slide.fillStyle || 'solid';

    // Slide backgrounds are WYSIWYG — always use white as the fallback
    // regardless of theme.  Theme only affects the workspace area around slides.
    const defaultBg = '#ffffff';

    if (type === 'solid') {
        let color = slide.backgroundColor || defaultBg;
        if (color === 'transparent') color = defaultBg;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    } else if (['linear', 'radial', 'conic'].includes(type)) {
        const stops = slide.gradientStops || [];
        const angle = slide.gradientDirection || 0;

        if (stops.length === 0) {
            let color = slide.backgroundColor || defaultBg;
            if (color === 'transparent') color = defaultBg;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
            return;
        }

        const centerX = x + w / 2;
        const centerY = y + h / 2;

        let grad;
        if (type === 'linear') {
            const angleRad = (angle * Math.PI) / 180;
            const length = Math.sqrt(w * w + h * h) / 2;
            const dx = Math.cos(angleRad) * length;
            const dy = Math.sin(angleRad) * length;
            grad = ctx.createLinearGradient(centerX - dx, centerY - dy, centerX + dx, centerY + dy);
        } else {
            const angleRad = (angle * Math.PI) / 180;
            const radius = Math.max(w, h) / 2;
            const focalOffset = radius * 0.4;
            const fx = centerX + Math.cos(angleRad) * focalOffset;
            const fy = centerY + Math.sin(angleRad) * focalOffset;
            grad = ctx.createRadialGradient(fx, fy, 0, centerX, centerY, radius);
        }

        stops.forEach((s: any) => {
            grad.addColorStop(s.offset, s.color);
        });
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);
    } else if (['hachure', 'cross-hatch', 'zigzag', 'dots', 'dashed', 'zigzag-line'].includes(type)) {
        const bgColor = slide.backgroundColor || defaultBg;
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);

        const strokeColor = slide.strokeColor || "#000000";

        rc.rectangle(x, y, w, h, {
            fill: strokeColor,
            fillStyle: type as any,
            fillWeight: 0.5,
            hachureGap: 8,
            stroke: 'transparent',
            roughness: 0
        });
    } else if (type === 'image' && slide.backgroundImage) {
        const img = getImage(slide.backgroundImage);
        if (img) {
            ctx.save();
            ctx.globalAlpha = slide.backgroundOpacity ?? 1;
            const imgAspect = img.width / img.height;
            const slideAspect = w / h;
            let dw, dh, dx, dy;
            if (imgAspect > slideAspect) {
                dh = h; dw = h * imgAspect;
                dx = x - (dw - w) / 2; dy = y;
            } else {
                dw = w; dh = w / imgAspect;
                dx = x; dy = y - (dh - h) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
        } else {
            ctx.fillStyle = "#f0f0f0";
            ctx.fillRect(x, y, w, h);
        }
    }
}

// ─── Slide Boundaries ───────────────────────────────────────────────

export function renderSlideBoundaries(
    ctx: CanvasRenderingContext2D,
    rc: any,
    slides: any[],
    docType: string,
    activeSlideIndex: number,
    scale: number,
    panX: number,
    panY: number,
    theme: string | boolean
): void {
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    if (docType === 'slides') {
        const activeSlide = slides[activeSlideIndex];
        if (activeSlide) {
            const { width: sW, height: sH } = activeSlide.dimensions;
            const { x: sX, y: sY } = activeSlide.spatialPosition;

            // Slide shadow
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.15)";
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 10;
            ctx.fillStyle = "black";
            ctx.fillRect(sX, sY, sW, sH);
            ctx.restore();

            // Slide surface
            renderSlideBackground(ctx, rc, activeSlide, sX, sY, sW, sH, theme);
        }
    } else if (docType === 'infinite') {
        // Background is handled by renderWorkspaceBackground for infinite mode
        // (fills entire viewport with the user's canvas background color)

        // Dashed frames and labels for multiple slides
        if (slides.length > 1) {
            slides.forEach((slide, index) => {
                const { width: sW, height: sH } = slide.dimensions;
                const { x: sX, y: sY } = slide.spatialPosition;

                // Dashed frame
                ctx.save();
                ctx.strokeStyle = "rgba(70,130,180,0.3)";
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.strokeRect(sX, sY, sW, sH);
                ctx.setLineDash([]);
                ctx.restore();

                // Slide number label
                ctx.save();
                const labelText = `Slide ${index + 1}`;
                const fontSize = Math.max(14, 16 / scale);
                ctx.font = `${fontSize}px Inter, sans-serif`;

                const padding = 8;
                const textMetrics = ctx.measureText(labelText);
                const labelHeight = fontSize + padding * 2;
                const labelWidth = textMetrics.width + padding * 2;

                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.fillRect(sX, sY, labelWidth, labelHeight);

                ctx.strokeStyle = "rgba(70,130,180,0.3)";
                ctx.lineWidth = 1;
                ctx.strokeRect(sX, sY, labelWidth, labelHeight);

                ctx.fillStyle = "rgba(70,130,180,0.7)";
                ctx.fillText(labelText, sX + padding, sY + fontSize + padding / 2);
                ctx.restore();
            });
        }
    }

    ctx.restore();
}

// ─── Canvas Texture ─────────────────────────────────────────────────

export function renderCanvasTexture(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    texture: string,
    scale: number,
    panX: number,
    panY: number,
    _isDarkMode: boolean
): void {
    if (texture === 'none') return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (texture === 'notebook') {
        // Ruled horizontal lines, like a classroom notebook.
        // Screen-space repetition so it works in both infinite and slides mode —
        // no vertical margin line, since it would have no meaningful anchor on an infinite canvas.
        const spacing = 32;
        const lineColor = 'rgba(30, 90, 180, 0.18)'; // faint blue rule
        const gridStartY = (panY % (spacing * scale));

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = gridStartY; y < canvas.height; y += spacing * scale) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    } else if (texture === 'dots' || texture === 'grid' || texture === 'graph') {
        const spacing = texture === 'graph' ? 40 : 20;
        const subSpacing = spacing / 4;
        // Canvas textures use fixed subtle colors so content isn't affected by UI theme
        const dotColor = 'rgba(0,0,0,0.08)';
        const lineColor = 'rgba(0,0,0,0.05)';
        const majorLineColor = 'rgba(0,0,0,0.1)';

        const gridStartX = (panX % (spacing * scale));
        const gridStartY = (panY % (spacing * scale));

        if (texture === 'dots') {
            ctx.fillStyle = dotColor;
            for (let x = gridStartX; x < canvas.width; x += spacing * scale) {
                for (let y = gridStartY; y < canvas.height; y += spacing * scale) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (texture === 'grid') {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = gridStartX; x < canvas.width; x += spacing * scale) {
                ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
            }
            for (let y = gridStartY; y < canvas.height; y += spacing * scale) {
                ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();
        } else if (texture === 'graph') {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let x = (panX % (subSpacing * scale)); x < canvas.width; x += subSpacing * scale) {
                ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
            }
            for (let y = (panY % (subSpacing * scale)); y < canvas.height; y += subSpacing * scale) {
                ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();

            ctx.strokeStyle = majorLineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = gridStartX; x < canvas.width; x += spacing * scale) {
                ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
            }
            for (let y = gridStartY; y < canvas.height; y += spacing * scale) {
                ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();
        }
    }
    // 'paper' texture handled by CSS overlay

    ctx.restore();
}

// ─── Grid ───────────────────────────────────────────────────────────

export function renderGrid(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    gridSettings: any,
    scale: number,
    panX: number,
    panY: number,
    _isDarkMode: boolean
): void {
    if (!gridSettings.enabled) return;

    const gridSize = gridSettings.gridSize;
    const gridColor = gridSettings.gridColor;

    const gridOpacity = gridSettings.gridOpacity;
    const gridStyle = gridSettings.style || 'lines';

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = gridColor;
    ctx.globalAlpha = gridOpacity;
    ctx.lineWidth = 1;

    const gridStartX = Math.floor((-panX / scale) / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - panX) / scale / gridSize) * gridSize;
    const gridStartY = Math.floor((-panY / scale) / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - panY) / scale / gridSize) * gridSize;

    if (gridStyle === 'lines') {
        ctx.beginPath();
        for (let x = gridStartX; x <= endX; x += gridSize) {
            const screenX = x * scale + panX;
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, canvas.height);
        }
        for (let y = gridStartY; y <= endY; y += gridSize) {
            const screenY = y * scale + panY;
            ctx.moveTo(0, screenY);
            ctx.lineTo(canvas.width, screenY);
        }
        ctx.stroke();
    } else {
        const dotSize = 3;
        if (gridStyle === 'dots' && (gridColor === '#e0e0e0' || gridColor === '#fafafa')) {
            ctx.fillStyle = '#b0b0b0';
        }
        for (let x = gridStartX; x <= endX; x += gridSize) {
            for (let y = gridStartY; y <= endY; y += gridSize) {
                const screenX = x * scale + panX;
                const screenY = y * scale + panY;
                if (screenX >= -dotSize && screenX <= canvas.width + dotSize &&
                    screenY >= -dotSize && screenY <= canvas.height + dotSize) {
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, dotSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    ctx.restore();
}

// ─── Layers & Elements ──────────────────────────────────────────────

export function renderLayersAndElements(
    ctx: CanvasRenderingContext2D,
    rc: any,
    params: RenderElementsParams
): number {
    const {
        elements, layers, slides, docType, activeSlideIndex,
        selection, selectedTool, animatedStates, viewportBounds: vp,
        scale, isDarkMode, currentDrawingId, hoveredConnector, editingId, appMode,
        focusBranchIds
    } = params;

    const cachedRc = createCachedRc(rc);
    const sharedRenderer = new CanvasRenderer(ctx);
    const sortedLayers = [...layers].sort((a, b) => a.order - b.order);
    let totalRendered = 0;

    // Artboards: named export-region frames drawn behind all content.
    if (store.artboards && store.artboards.length && store.docType !== 'slides') {
        ctx.save();
        for (const ab of store.artboards) {
            if (ab.background && ab.background !== 'none' && ab.background !== 'transparent') {
                ctx.fillStyle = ab.background;
                ctx.fillRect(ab.x, ab.y, ab.width, ab.height);
            }
            ctx.strokeStyle = isDarkMode ? '#555' : '#bbb';
            ctx.lineWidth = 1 / scale;
            ctx.strokeRect(ab.x, ab.y, ab.width, ab.height);
            // The artboard name + size is shown by the interactive ArtboardOverlay
            // chip (drag-to-move / click-to-select); no static label drawn here.
        }
        ctx.restore();
    }

    const elementMap = new Map<string, DrawingElement>();
    const elementsByLayer = new Map<string, DrawingElement[]>();
    for (const el of elements) {
        elementMap.set(el.id, el);
        let bucket = elementsByLayer.get(el.layerId);
        if (!bucket) { bucket = []; elementsByLayer.set(el.layerId, bucket); }
        bucket.push(el);
    }

    sortedLayers.forEach(layer => {
        if (!isLayerVisible(layer.id)) return;

        // Layer background
        if (layer.backgroundColor && layer.backgroundColor !== 'transparent') {
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.fillStyle = layer.backgroundColor;
            const BIG_VALUE = 1000000;
            ctx.fillRect(-BIG_VALUE, -BIG_VALUE, BIG_VALUE * 2, BIG_VALUE * 2);
            ctx.restore();
        }

        // Filter elements for this layer with viewport culling
        const bucket = elementsByLayer.get(layer.id);
        if (!bucket) return;

        // WASM batch viewport cull: pre-filter by AABB in one call
        let wasmVisibleSet: Set<number> | null = null;
        if (isWasmEnabled('batchRenderer') && !layer.isMaster) {
            const syncCount = syncElementBounds(bucket);
            const visibleIndices = wasmBatchViewportCull(syncCount, vp, scale);
            if (visibleIndices) {
                wasmVisibleSet = new Set(visibleIndices);
            }
        }

        const layerElements = bucket.filter((el, idx) => {
            if (el.id === currentDrawingId) return true;
            // A clip/opacity mask shape is not drawn on its own — only used to clip its target.
            if (el.isClipMask) return false;
            if (layer.isMaster) return true;

            // Fast viewport check first (WASM batch or JS fallback)
            if (wasmVisibleSet) {
                if (!wasmVisibleSet.has(idx)) return false;
            } else {
                // JS fallback: sub-pixel skip + AABB viewport check
                const screenWidth = Math.abs(el.width) * scale;
                const screenHeight = Math.abs(el.height) * scale;
                if (screenWidth < 1 && screenHeight < 1) return false;

                const margin = Math.max(Math.abs(el.width), Math.abs(el.height)) * 0.5;
                if (el.x + el.width + margin < vp.minX - vp.bufferX ||
                    el.x - margin > vp.maxX + vp.bufferX ||
                    el.y + el.height + margin < vp.minY - vp.bufferY ||
                    el.y - margin > vp.maxY + vp.bufferY) return false;
            }

            // JS-only visibility checks on viewport-surviving elements
            if (isElementHiddenByHierarchy(el, elements, elementMap)) return false;

            // Hide elements contained in collapsed pool lanes
            if (el.poolContainerId && el.poolLaneIndex !== undefined) {
                const pool = elementMap.get(el.poolContainerId);
                if (pool && pool.bpmnLaneCollapsed?.[el.poolLaneIndex]) return false;
            }

            // Hide connectors if their bound elements are hidden (hierarchy or collapsed lane)
            if (el.type === 'line' || el.type === 'arrow' || el.type === 'bezier' || el.type === 'organicBranch') {
                const isInCollapsedLane = (e: DrawingElement) =>
                    e.poolContainerId && e.poolLaneIndex !== undefined &&
                    elementMap.get(e.poolContainerId)?.bpmnLaneCollapsed?.[e.poolLaneIndex];
                if (el.startBinding) {
                    const startEl = elementMap.get(el.startBinding.elementId);
                    if (startEl && (isElementHiddenByHierarchy(startEl, elements, elementMap) || isInCollapsedLane(startEl))) return false;
                }
                if (el.endBinding) {
                    const endEl = elementMap.get(el.endBinding.elementId);
                    if (endEl && (isElementHiddenByHierarchy(endEl, elements, elementMap) || isInCollapsedLane(endEl))) return false;
                }
            }

            return true;
        });

        totalRendered += layerElements.length;

        layerElements.forEach(el => {
            const animState = animatedStates.get(el.id);
            const isMasterLayer = layer.isMaster;
            const needsMasterProjection = isMasterLayer && docType === 'slides';
            const needsTextVar = el.type === 'text' && el.text && el.text.startsWith('=');

            // Only create a copy when we need to mutate (animation, master projection, or text variables)
            let renderedEl: DrawingElement;
            if (animState) {
                renderedEl = { ...el, x: animState.x, y: animState.y, angle: animState.angle };
            } else if (needsMasterProjection || needsTextVar) {
                renderedEl = { ...el };
            } else {
                renderedEl = el;
            }

            // Project Master elements relative to active slide
            if (needsMasterProjection) {
                const activeSlide = slides[activeSlideIndex];
                if (activeSlide) {
                    const projected = projectMasterPosition(renderedEl, activeSlide, slides);
                    renderedEl.x = projected.x;
                    renderedEl.y = projected.y;
                }
            }

            // Strict slide isolation
            if (docType === 'slides' && !isMasterLayer) {
                const activeSlide = slides[activeSlideIndex];
                if (activeSlide) {
                    const { x: sX, y: sY } = activeSlide.spatialPosition;
                    const { width: sW, height: sH } = activeSlide.dimensions;
                    const cx = renderedEl.x + renderedEl.width / 2;
                    const cy = renderedEl.y + renderedEl.height / 2;
                    if (!(cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH)) return;
                }
            }

            // Dynamic text variables
            if (needsTextVar && renderedEl.text) {
                if (renderedEl.text.startsWith('==')) {
                    renderedEl.text = renderedEl.text.substring(1);
                } else if (renderedEl.text.startsWith('=')) {
                    const slideNumber = (activeSlideIndex + 1).toString();
                    const totalSlides = slides.length.toString();
                    renderedEl.text = renderedEl.text.substring(1)
                        .replace(/\$\{slideNumber\}/g, slideNumber)
                        .replace(/\$\{totalSlides\}/g, totalSlides);
                }
            }

            if ((renderedEl.type !== 'text' && renderedEl.type !== 'richtext') || editingId !== renderedEl.id) {
                // For non-text elements being edited, set isEditing so the
                // render pipeline skips text drawing (the textarea overlay shows it instead)
                if (editingId === renderedEl.id) {
                    renderedEl.isEditing = true;
                }
                const isFocusDimmed = focusBranchIds && focusBranchIds.size > 0 && !focusBranchIds.has(el.id);
                const layerOpacity = (layer?.opacity ?? 1) * (isFocusDimmed ? 0.12 : 1);
                // Clipping / opacity mask: constrain or fade this element by the mask shape.
                const mask = renderedEl.clipMaskId ? elementMap.get(renderedEl.clipMaskId) : undefined;
                const opacityMask = mask && renderedEl.maskType === 'opacity';
                let clipped = false;
                if (mask && !opacityMask) {
                    const clipPath = buildClipPath2D(mask);
                    if (clipPath) { ctx.save(); ctx.clip(clipPath, maskFillRule(mask)); clipped = true; }
                }
                // Masked elements skip the element cache so the mask tracks live edits.
                const shouldCache = !animState && !isFocusDimmed && !mask;
                if (opacityMask) {
                    renderOpacityMasked(ctx, renderedEl, mask!, isDarkMode, layerOpacity);
                } else {
                    if (shouldCache) beginElement(renderedEl.id, computeElementHash(renderedEl));
                    renderElement(cachedRc, ctx, renderedEl, isDarkMode, layerOpacity, sharedRenderer);
                    if (shouldCache) endElement();
                }
                if (clipped) ctx.restore();
            }

            renderElementOverlays(ctx, el, renderedEl, {
                scale,
                isSelected: selection.includes(el.id),
                selectionLength: selection.length,
                selection,
                isDarkMode,
                elements,
                selectedTool,
                hoveredConnector,
                appMode
            });
        });
    });

    return totalRendered;
}

// ─── Selection Overlays ─────────────────────────────────────────────

export function renderSelectionOverlays(
    ctx: CanvasRenderingContext2D,
    params: SelectionOverlayParams
): void {
    const { elements, selection, scale, selectionBox, suggestedBinding, snappingGuides, spacingGuides, tableCellSelection } = params;

    // Multi-selection bounding box
    if (selection.length > 1) {
        const box = getSelectionBoundingBox(elements, selection);
        if (box) renderMultiSelectionBox(ctx, box, scale);
    }

    // Selection drag rectangle
    if (selectionBox) renderSelectionBox(ctx, selectionBox, scale);

    // Lasso selection path
    if (params.lassoPoints && params.lassoPoints.length >= 2) {
        renderLassoPath(ctx, params.lassoPoints, scale);
    }

    // Binding highlight
    if (suggestedBinding) {
        const target = elements.find(e => e.id === suggestedBinding.elementId);
        if (target) renderBindingHighlight(ctx, target, suggestedBinding, scale);
    }

    // Reparent drop target highlight
    if (params.reparentDropTarget) {
        const target = elements.find(e => e.id === params.reparentDropTarget);
        const dragged = selection.length === 1 ? elements.find(e => e.id === selection[0]) : null;
        if (target) renderDropTargetHighlight(ctx, target, scale, dragged);
    }

    // Pool lane drop target highlight
    if (params.poolLaneDropTarget) {
        const pool = elements.find(e => e.id === params.poolLaneDropTarget!.poolId);
        if (pool) {
            const laneRect = getPoolLaneRect(pool, params.poolLaneDropTarget!.laneIndex);
            if (laneRect) {
                ctx.save();
                ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([6 / scale, 3 / scale]);
                ctx.fillRect(laneRect.x, laneRect.y, laneRect.width, laneRect.height);
                ctx.strokeRect(laneRect.x, laneRect.y, laneRect.width, laneRect.height);
                ctx.restore();
            }
        }
    }

    // Snapping & spacing guides
    renderSnappingGuides(ctx, snappingGuides, scale);
    renderSpacingGuides(ctx, spacingGuides, scale);

    // Table cell selection highlight
    if (tableCellSelection && selection.length === 1) {
        const tableEl = elements.find(e => e.id === selection[0] && e.type === 'table');
        if (tableEl) {
            renderTableCellSelection(ctx, tableEl, tableCellSelection, scale);
        }
    }

    // Mindmap collapse/expand toggles — rendered last so they're always on top
    renderMindmapToggles(ctx, elements, selection, scale, params.isDarkMode ?? false, params.appMode);
}

function renderTableCellSelection(
    ctx: CanvasRenderingContext2D,
    tableEl: DrawingElement,
    cellSelection: { startRow: number; startCol: number; endRow: number; endCol: number },
    scale: number
): void {
    const cols = tableEl.tableCols ?? 3;
    const rows = tableEl.tableRows ?? 3;
    const hasHeader = tableEl.tableHeaders !== false;
    const totalVisualRows = hasHeader ? rows + 1 : rows;
    const colWidths = tableEl.tableColWidths ?? defaultColWidths(cols);
    const rowHeights = tableEl.tableRowHeights ?? defaultRowHeights(totalVisualRows);
    const cellRects = computeCellRects(tableEl.x, tableEl.y, tableEl.width, tableEl.height, colWidths, rowHeights, tableEl.tableColOrder, hasHeader);

    // Normalize the selection
    const norm = normalizeCellSelection(cellSelection);

    // Find the bounding rect for the selection
    const topLeftCell = cellRects.find(c => c.row === norm.startRow && c.col === norm.startCol);
    const bottomRightCell = cellRects.find(c => c.row === norm.endRow && c.col === norm.endCol);

    if (!topLeftCell || !bottomRightCell) return;

    const x = topLeftCell.x;
    const y = topLeftCell.y;
    const w = (bottomRightCell.x + bottomRightCell.w) - topLeftCell.x;
    const h = (bottomRightCell.y + bottomRightCell.h) - topLeftCell.y;

    ctx.save();

    // Draw semi-transparent blue fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fillRect(x, y, w, h);

    // Draw selection border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);

    ctx.restore();
}

// ─── Connection Anchors ─────────────────────────────────────────────

export function renderConnectionAnchors(
    ctx: CanvasRenderingContext2D,
    params: ConnectionAnchorParams
): void {
    const { elements, selectedTool, currentDrawingId, isDrawing, activeLayerId, scale, canInteractWithElement } = params;

    if (!(selectedTool === 'line' || selectedTool === 'arrow' || selectedTool === 'polyline' || selectedTool === 'bezier' || selectedTool === 'organicBranch') || !isDrawing || !currentDrawingId) return;

    const currentEl = elements.find(e => e.id === currentDrawingId);
    if (!currentEl || (currentEl.type !== 'line' && currentEl.type !== 'arrow' && currentEl.type !== 'organicBranch')) return;

    const endX = currentEl.x + currentEl.width;
    const endY = currentEl.y + currentEl.height;
    const threshold = 50 / scale;
    const anchorSnapThreshold = 15 / scale;

    ctx.save();
    for (const element of elements) {
        if (element.id === currentDrawingId) continue;
        if (!canInteractWithElement(element)) continue;
        // Skip connectors as targets, but allow unbound polylines (they act as shapes)
        const isPolylineShape = element.type === 'line' && element.curveType === 'elbow' && !element.startBinding && !element.endBinding;
        if ((element.type === 'line' || element.type === 'arrow' || element.type === 'bezier' || element.type === 'organicBranch') && !isPolylineShape) continue;
        if (element.layerId !== activeLayerId) continue;

        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const dist = Math.sqrt((cx - endX) ** 2 + (cy - endY) ** 2);

        if (dist < threshold) {
            const anchors = getAnchorPoints(element);
            for (const anchor of anchors) {
                const dx = anchor.x - endX;
                const dy = anchor.y - endY;
                const anchorDist = Math.sqrt(dx * dx + dy * dy);
                const isHovered = anchorDist < anchorSnapThreshold;
                const radius = isHovered ? (6 / scale) : (4 / scale);

                ctx.beginPath();
                ctx.arc(anchor.x, anchor.y, radius, 0, Math.PI * 2);

                if (isHovered) {
                    ctx.fillStyle = '#3b82f6';
                    ctx.fill();
                } else {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
                    ctx.fill();
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 1 / scale;
                    ctx.stroke();
                }
            }
        }
    }
    ctx.restore();
}

// ─── Laser Trail ────────────────────────────────────────────────────

export function renderLaserTrail(
    ctx: CanvasRenderingContext2D,
    laserTrailData: Array<{ x: number; y: number; timestamp: number }>,
    scale: number,
    decayMs: number
): void {
    if (laserTrailData.length <= 1) return;

    const now = Date.now();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 50, 50, 0.6)';

    const baseWidth = 4 / scale;
    let currentOpacityBand = -1;

    for (let i = 0; i < laserTrailData.length - 1; i++) {
        const p1 = laserTrailData[i];
        const p2 = laserTrailData[i + 1];
        const age = now - p1.timestamp;
        const opacity = Math.max(0, 1 - age / decayMs);

        if (opacity <= 0) continue;

        const band = Math.ceil(opacity * 5);
        if (band !== currentOpacityBand) {
            if (currentOpacityBand !== -1) ctx.stroke();
            currentOpacityBand = band;
            const bandOpacity = band / 5;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 30, 30, ${bandOpacity})`;
            ctx.lineWidth = baseWidth * bandOpacity;
            ctx.moveTo(p1.x, p1.y);
        }
        ctx.lineTo(p2.x, p2.y);
    }
    if (currentOpacityBand !== -1) ctx.stroke();

    ctx.restore();
}
