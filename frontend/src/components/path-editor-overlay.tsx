/**
 * Path Editor Overlay
 * Standalone SolidJS component for editing animation paths.
 * Provides drag-to-move control points, SVG path trace, and click-to-add points.
 * Extracted from canvas.tsx PathEditorOverlay.
 */

import { type Component, createMemo, Show, For } from 'solid-js';
import { store, updateAnimation, pushToHistory, setPathEditing } from '../store/app-store';
import { PathUtils } from '../utils/math/path-utils';

const PathEditorOverlay: Component<{
    elementId: string | null;
    animationId: string | null;
    scale: number;
    panX: number;
    panY: number;
}> = (props) => {
    const element = createMemo(() => store.elements.find(e => e.id === props.elementId));

    // We parse the points from the store LIVE
    const points = createMemo<{ x: number, y: number, type: string }[]>(() => {
        const el = element();
        if (!el || !props.animationId) return [];

        const anim = el.animations?.find(a => a.id === props.animationId);
        if (!anim || anim.type !== 'path') return [];

        return PathUtils.svgToPoints((anim as any).pathData);
    });

    const isSmooth = createMemo(() => {
        const el = element();
        if (!el || !props.animationId) return false;
        const anim = el.animations?.find(a => a.id === props.animationId);
        return (anim as any)?.smoothPath || false;
    });

    // Memoize the transform string to avoid messy JSX
    const transformString = createMemo(() => {
        const el = element();
        if (!el) return `translate(${props.panX}, ${props.panY}) scale(${props.scale})`;
        const anim = el.animations?.find(a => a.id === props.animationId);
        const isRelative = (anim as any)?.isRelative ?? true;

        const offsetX = isRelative ? (el.x + el.width / 2) : 0;
        const offsetY = isRelative ? (el.y + el.height / 2) : 0;

        // Final transform: Canvas Pan/Zoom -> Element Relative Offset
        return `translate(${props.panX}, ${props.panY}) scale(${props.scale}) translate(${offsetX}, ${offsetY})`;
    });

    return (
        <Show when={element() && points().length > 0}>
            <div
                class="path-editor-overlay"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    'pointer-events': 'none',
                }}
            >
                {/* 1. Render Control Points (Handles) */}
                <For each={points()}>
                    {(point, i) => {
                        // Calculate screen position for the handle
                        const el = element()!;
                        const anim = el.animations?.find(a => a.id === props.animationId);
                        const isRelative = (anim as any).isRelative ?? true;

                        let worldX = point.x;
                        let worldY = point.y;

                        if (isRelative) {
                            const cx = el.x + el.width / 2;
                            const cy = el.y + el.height / 2;
                            worldX = cx + point.x;
                            worldY = cy + point.y;
                        }

                        const screenX = worldX * props.scale + props.panX;
                        const screenY = worldY * props.scale + props.panY;

                        const isControlInSmooth = isSmooth() && point.type !== 'anchor';

                        return (
                            <div
                                class="path-control-point"
                                style={{
                                    position: 'absolute',
                                    left: `${screenX}px`,
                                    top: `${screenY}px`,
                                    transform: 'translate(-50%, -50%)',
                                    width: '10px',
                                    height: '10px',
                                    background: point.type === 'anchor' ? '#3b82f6' : '#ffffff',
                                    border: '2px solid #3b82f6',
                                    'border-radius': '50%',
                                    // Handles must be interactive
                                    'pointer-events': 'all',
                                    cursor: isControlInSmooth ? 'default' : 'move',
                                    'z-index': 1000,
                                    opacity: isControlInSmooth ? 0.4 : 1
                                }}
                                title={`Point ${i()}: ${point.type}${isControlInSmooth ? ' (auto-computed)' : ''}`}
                                onPointerDown={(e) => {
                                    // In smooth mode, control points are auto-computed — skip drag
                                    if (isSmooth() && point.type !== 'anchor') return;

                                    e.stopPropagation(); // Stop canvas pan
                                    e.currentTarget.setPointerCapture(e.pointerId);

                                    const dragStartX = e.clientX;
                                    const dragStartY = e.clientY;
                                    const initialPoint = { ...point };

                                    const onMove = (ev: PointerEvent) => {
                                        const dx = (ev.clientX - dragStartX) / props.scale;
                                        const dy = (ev.clientY - dragStartY) / props.scale;

                                        if (isSmooth()) {
                                            // Work with anchors only, then re-smooth
                                            const anim = element()?.animations?.find(a => a.id === props.animationId);
                                            const anchors = PathUtils.extractAnchors((anim as any)?.pathData || '');
                                            // Find which anchor this point maps to
                                            const anchorIndex = points().slice(0, i() + 1).filter(p => p.type === 'anchor').length - 1;
                                            if (anchorIndex >= 0 && anchorIndex < anchors.length) {
                                                anchors[anchorIndex] = {
                                                    x: initialPoint.x + dx,
                                                    y: initialPoint.y + dy
                                                };
                                            }
                                            // Rebuild straight then smooth
                                            let newD = `M ${Math.round(anchors[0].x)} ${Math.round(anchors[0].y)}`;
                                            for (let j = 1; j < anchors.length; j++) {
                                                newD += ` L ${Math.round(anchors[j].x)} ${Math.round(anchors[j].y)}`;
                                            }
                                            newD = PathUtils.smoothPathData(newD);
                                            updateAnimation(props.elementId!, props.animationId!, { pathData: newD } as any);
                                        } else {
                                            // Original behavior
                                            const currentPoints = [...points()];
                                            currentPoints[i()] = {
                                                ...currentPoints[i()],
                                                x: initialPoint.x + dx,
                                                y: initialPoint.y + dy
                                            };
                                            const newD = PathUtils.pointsToSvg(currentPoints);
                                            updateAnimation(props.elementId!, props.animationId!, { pathData: newD } as any);
                                        }
                                    };

                                    const onUp = (ev: PointerEvent) => {
                                        e.currentTarget.releasePointerCapture(ev.pointerId);
                                        window.removeEventListener('pointermove', onMove);
                                        window.removeEventListener('pointerup', onUp);
                                        pushToHistory(); // Commit change
                                    };

                                    window.addEventListener('pointermove', onMove);
                                    window.addEventListener('pointerup', onUp);
                                }}
                            />
                        );
                    }}
                </For>

                {/* 2. Render Path Trace (SVG Overlay) */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        'pointer-events': 'none',
                        'z-index': 999
                    }}
                >
                    <path
                        d={(element()?.animations?.find(a => a.id === props.animationId) as any)?.pathData || ''}
                        fill="none"
                        stroke="#3b82f6"
                        stroke-width="2"
                        stroke-dasharray="5 5"
                        transform={transformString()}
                    />
                </svg>

                {/* 3. Invisible Hit Area for Adding New Points */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        'z-index': 998, // Below points, above canvas
                        'pointer-events': 'all', // CLICKABLE
                        'cursor': 'crosshair'
                    }}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        // Add new point at click location
                        const el = element()!;
                        const anim = el.animations?.find(a => a.id === props.animationId);
                        const isRelative = (anim as any).isRelative ?? true;

                        // Calculate World Coordinates
                        const clickX = (e.clientX - props.panX) / props.scale;
                        const clickY = (e.clientY - props.panY) / props.scale;

                        let newPointX = clickX;
                        let newPointY = clickY;

                        if (isRelative) {
                            const cx = el.x + el.width / 2;
                            const cy = el.y + el.height / 2;
                            newPointX = clickX - cx;
                            newPointY = clickY - cy;
                        }

                        // Extract anchors and append the new point
                        const anchors = PathUtils.extractAnchors((anim as any)?.pathData || '');
                        anchors.push({ x: newPointX, y: newPointY });

                        // Rebuild path — smooth or straight
                        let newD = `M ${Math.round(anchors[0].x)} ${Math.round(anchors[0].y)}`;
                        for (let j = 1; j < anchors.length; j++) {
                            newD += ` L ${Math.round(anchors[j].x)} ${Math.round(anchors[j].y)}`;
                        }
                        if ((anim as any)?.smoothPath) {
                            newD = PathUtils.smoothPathData(newD);
                        }

                        updateAnimation(props.elementId!, props.animationId!, { pathData: newD } as any);
                    }}
                />

                {/* 4. Top Bar Buttons */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    'z-index': 2000,
                    display: 'flex',
                    gap: '8px',
                    'pointer-events': 'all'
                }}>
                    <button
                        onClick={() => setPathEditing(false)}
                        style={{
                            'background': '#3b82f6',
                            'color': 'white',
                            'padding': '8px 16px',
                            'border-radius': '20px',
                            'border': 'none',
                            'font-weight': 600,
                            'box-shadow': '0 4px 6px rgba(0,0,0,0.1)',
                            'cursor': 'pointer',
                        }}
                    >
                        Done Editing Path
                    </button>
                    <button
                        onClick={() => {
                            const el = element()!;
                            const anim = el.animations?.find(a => a.id === props.animationId) as any;
                            if (!anim) return;
                            const newSmooth = !anim.smoothPath;
                            const currentPath = anim.pathData || '';
                            const newPath = newSmooth
                                ? PathUtils.smoothPathData(currentPath)
                                : PathUtils.unsmoothPathData(currentPath);
                            updateAnimation(props.elementId!, props.animationId!, {
                                smoothPath: newSmooth,
                                pathData: newPath
                            } as any);
                            pushToHistory();
                        }}
                        style={{
                            'background': isSmooth() ? '#10b981' : '#6b7280',
                            'color': 'white',
                            'padding': '8px 16px',
                            'border-radius': '20px',
                            'border': 'none',
                            'font-weight': 600,
                            'box-shadow': '0 4px 6px rgba(0,0,0,0.1)',
                            'cursor': 'pointer',
                        }}
                    >
                        {isSmooth() ? 'Smooth: ON' : 'Smooth: OFF'}
                    </button>
                </div>
            </div>
        </Show>
    );
};

export default PathEditorOverlay;
