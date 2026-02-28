
import { type Component, Show, createEffect, onCleanup, createSignal, For } from 'solid-js';
import { store } from '../store/app-store';
import rough from 'roughjs';
import { renderElement } from '../utils/render-element';
import type { DrawingElement, Point } from '../types';

export const WelcomeScreen: Component = () => {
    const [canvasEl, setCanvasEl] = createSignal<HTMLCanvasElement | undefined>();

    const isVisible = () =>
        store.elements.length === 0 &&
        store.selectedTool === 'selection' &&
        store.appMode !== 'presentation' &&
        !store.zenMode &&
        !store.welcomeDismissed;

    // Reactive window dimensions
    const [windowSize, setWindowSize] = createSignal({ width: window.innerWidth, height: window.innerHeight });

    createEffect(() => {
        const handler = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handler);
        onCleanup(() => window.removeEventListener('resize', handler));
    });

    createEffect(() => {
        const canvas = canvasEl();
        if (!canvas || !isVisible()) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = windowSize();
        const isMobile = width < 768; // Mobile breakpoint

        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const rc = rough.canvas(canvas);
        const cx = width / 2;
        const cy = height / 2;

        // Common styles for the hint arrows
        const baseStyle: Partial<DrawingElement> = {
            id: 'mock',
            type: 'arrow',
            strokeColor: '#9ca3af', // Mid muted gray (Tailwind gray-400)
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 2,
            strokeStyle: 'dashed',
            roughness: 1.5,
            opacity: 100,
            angle: 0,
            renderStyle: 'sketch', // Hand-drawn style
            seed: 1,
            locked: false,
            link: null,
            layerId: 'layer1',
            roundness: null,
            curveType: 'bezier', // Important for the curved look
            startArrowhead: null,
            endArrowhead: 'arrow',
            strokeLineJoin: 'round',
            width: 0, height: 0, x: 0, y: 0 // Will be ignored or recalculated by renderer usually
        };

        // Helper to create a complete mock element
        const createArrow = (points: Point[], controlPoints?: { x: number, y: number }[]): DrawingElement => {
            return {
                ...baseStyle,
                id: crypto.randomUUID(),
                x: 0, y: 0, width: width, height: height, // Full screen canvas coordinates
                points: points,
                controlPoints: controlPoints
            } as DrawingElement;
        };

        const renderArrow = (element: DrawingElement) => {
            // Use the central rendering engine entry point
            renderElement(
                rc,
                ctx,
                element,
                store.globalSettings.theme !== 'light',
                1 // opacity
            );
        };

        // Don't render complex arrows on very small screens to avoid clutter
        if (!isMobile) {
            // 1. Menu Arrow (Top Left)
            // From center-left to top-left
            const menuArrow = createArrow(
                [{ x: cx - 200, y: cy - 100 }, { x: 100, y: 60 }], // Start, End
                [{ x: cx - 250, y: cy - 200 }, { x: 200, y: 150 }] // CP1, CP2
            );
            renderArrow(menuArrow);

            // 2. Toolbar Arrow (Top Center)
            // From center-top to top-center
            const toolbarArrow = createArrow(
                [{ x: cx + 50, y: cy - 150 }, { x: cx, y: 80 }],
                [{ x: cx + 20, y: 150 }, { x: cx + 10, y: 100 }]
            );
            renderArrow(toolbarArrow);

            // 4. P3 Color Picker Arrow (Top Right)
            const p3Arrow = createArrow(
                [{ x: cx + 250, y: cy - 100 }, { x: width - 100, y: 60 }],
                [{ x: width - 180, y: 120 }, { x: width - 140, y: 90 }]
            );
            renderArrow(p3Arrow);
        }

        // 3. Help Arrow (Bottom Left) - Keep on mobile if space allows, but simplified
        // From center-left-down to bottom-left (290px, height-65px)
        const helpTargetX = isMobile ? 60 : 310; // Connect to bottom-left on mobile too? Or hidden?
        const helpTargetY = height - 65;

        // On mobile, the help button might be hidden or moved?
        // Assuming sticky UI logic holds, let's keep it but adjust source point.
        // Actually, let's keep it simple: Show Help arrow only if width > 400
        if (width > 400) {
            const helpArrow = createArrow(
                [{ x: cx - 150, y: cy + (isMobile ? 50 : 100) }, { x: helpTargetX, y: helpTargetY }],
                [{ x: cx - (isMobile ? 50 : 200), y: cy + (isMobile ? 100 : 150) }, { x: helpTargetX + 20, y: helpTargetY - 30 }]
            );
            renderArrow(helpArrow);
        }
    });

    const leftFeatures = [
        "100+ shapes & icons",
        "Sketch & Architectural modes",
        "UML, BPMN & Flowcharts",
        "Cloud infrastructure shapes",
        "Data Structure visualizations",
        "Freehand drawing tools",
        "Smart connectors & arrows",
        "40+ animation presets",
        "Keyframe & morph animations",
    ];

    const rightFeatures = [
        "P3 wide-gamut colors",
        "Gradient & pattern fills",
        "Floating quick toolbar",
        "100% local & private",
        "Slide transitions & builds",
        "Live DS operations in presentations",
        "Dark mode support",
        "Presentation mode",
        "Export PNG, SVG, HTML",
    ];

    const shapeCategories = [
        { label: "Flowcharts", icon: "diamond", color: "color(display-p3 0.3 0.6 1)" },
        { label: "UML", icon: "class", color: "color(display-p3 0.6 0.3 0.9)" },
        { label: "Cloud Infra", icon: "cloud", color: "color(display-p3 0.2 0.7 0.9)" },
        { label: "Wireframes", icon: "browser", color: "color(display-p3 0.5 0.5 0.6)" },
        { label: "Mindmaps", icon: "mindmap", color: "color(display-p3 0.2 0.8 0.6)" },
        { label: "People", icon: "people", color: "color(display-p3 0.8 0.4 0.5)" },
        { label: "Annotations", icon: "status", color: "color(display-p3 0.2 0.75 0.5)" },
        { label: "Animations", icon: "motion", color: "color(display-p3 1 0.4 0.3)" },
        { label: "Connectors", icon: "arrow", color: "color(display-p3 0.6 0.6 0.7)" },
        { label: "Tables", icon: "table", color: "color(display-p3 0.4 0.6 0.8)" },
        { label: "Data Structures", icon: "ds", color: "color(display-p3 0.3 0.7 0.6)" },
        { label: "BPMN 2.0", icon: "bpmn", color: "color(display-p3 0.9 0.5 0.2)" },
    ];

    // Small SVG icons for each category
    const getCategoryIcon = (icon: string) => {
        switch (icon) {
            case 'diamond': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M7 1 L13 7 L7 13 L1 7 Z" />
                </svg>
            );
            case 'class': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="1" y="1" width="12" height="12" rx="1" />
                    <line x1="1" y1="5" x2="13" y2="5" />
                    <line x1="1" y1="9" x2="13" y2="9" />
                </svg>
            );
            case 'cloud': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="7" r="5.5" />
                    <line x1="1.5" y1="7" x2="12.5" y2="7" />
                    <ellipse cx="7" cy="7" rx="3" ry="5.5" />
                </svg>
            );
            case 'browser': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="1" y="2" width="12" height="10" rx="1.5" />
                    <line x1="1" y1="5" x2="13" y2="5" />
                    <circle cx="3" cy="3.5" r="0.5" fill="currentColor" />
                    <circle cx="5" cy="3.5" r="0.5" fill="currentColor" />
                </svg>
            );
            case 'mindmap': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none" />
                    <line x1="9" y1="7" x2="13" y2="4" />
                    <line x1="9" y1="7" x2="13" y2="10" />
                    <line x1="5" y1="7" x2="1" y2="5" />
                    <line x1="5" y1="7" x2="1" y2="9" />
                </svg>
            );
            case 'sketch': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 11 L7 2 L11 11" />
                    <line x1="4.5" y1="8" x2="9.5" y2="8" />
                    <circle cx="7" cy="2" r="1" fill="currentColor" />
                </svg>
            ); /* kept for future use */
            case 'people': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="7" cy="4" r="2.5" />
                    <path d="M3 13 Q3 9 7 9 Q11 9 11 13" />
                </svg>
            );
            case 'status': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="1" y="1" width="12" height="12" rx="2" />
                    <path d="M4 7 L6 9.5 L10 4.5" />
                </svg>
            );
            case 'motion': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M2 7 Q5 2 8 7 Q11 12 13 7" />
                    <circle cx="13" cy="7" r="1.5" fill="currentColor" stroke="none" />
                    <line x1="1" y1="4" x2="3.5" y2="4" opacity="0.5" />
                    <line x1="0.5" y1="7" x2="2" y2="7" opacity="0.3" />
                    <line x1="1" y1="10" x2="3.5" y2="10" opacity="0.5" />
                </svg>
            );
            case 'arrow': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M2 12 Q4 4 12 2" />
                    <path d="M8 2 L12 2 L12 6" />
                </svg>
            );
            case 'table': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="1" y="1" width="12" height="12" rx="1" />
                    <line x1="1" y1="5" x2="13" y2="5" />
                    <line x1="5" y1="1" x2="5" y2="13" />
                    <line x1="9" y1="1" x2="9" y2="13" />
                    <line x1="1" y1="9" x2="13" y2="9" />
                </svg>
            );
            case 'ds': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="1" y="5" width="3" height="3" rx="0.5" />
                    <rect x="5.5" y="5" width="3" height="3" rx="0.5" />
                    <rect x="10" y="5" width="3" height="3" rx="0.5" />
                    <line x1="4" y1="6.5" x2="5.5" y2="6.5" />
                    <line x1="8.5" y1="6.5" x2="10" y2="6.5" />
                </svg>
            );
            case 'bpmn': return (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="3" cy="7" r="2" />
                    <path d="M7 4 L10 7 L7 10 L4 7 Z" stroke-width="1" />
                    <circle cx="11" cy="7" r="2" stroke-width="2.5" />
                </svg>
            );
            default: return null;
        }
    };

    return (
        <Show when={isVisible()}>
            <div
                style={{
                    "position": "absolute",
                    "inset": "0",
                    "pointer-events": "none",
                    "z-index": "10",
                    "color": "var(--text-secondary, #6b7280)",
                    "font-family": "Virgil, Segoe UI Emoji, sans-serif",
                    "overflow": "hidden"
                }}
            >
                {/* Inject keyframe animations */}
                <style>{`
                    @keyframes welcomeFadeInUp {
                        from { opacity: 0; transform: translateY(16px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes welcomeFadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes welcomeSlideInLeft {
                        from { opacity: 0; transform: translate(-20px, -50%); }
                        to { opacity: 0.7; transform: translate(0, -50%); }
                    }
                    @keyframes welcomeSlideInRight {
                        from { opacity: 0; transform: translate(20px, -50%); }
                        to { opacity: 0.7; transform: translate(0, -50%); }
                    }
                    @keyframes welcomeScaleIn {
                        from { opacity: 0; transform: scale(0.85); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes welcomePillIn {
                        from { opacity: 0; transform: translateY(8px) scale(0.9); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>
                {/* Canvas Layer for Arrows */}
                <canvas
                    ref={setCanvasEl}
                    style={{ position: "absolute", top: 0, left: 0, width: '100%', height: '100%' }}
                />

                {/* Text Labels - HTML Overlays */}
                <Show when={windowSize().width > 768}>
                    {/* Menu Label */}
                    <div style={{
                        "position": "absolute",
                        "top": "150px",
                        "left": "120px",
                        "transform": "rotate(-5deg)",
                        "opacity": "0",
                        "animation": "welcomeFadeIn 0.6s ease-out 0.8s forwards"
                    }}>
                        Export, preferences, languages...
                    </div>

                    {/* P3 Picker Label */}
                    <div style={{
                        "position": "absolute",
                        "top": "100px",
                        "right": "150px",
                        "transform": "rotate(-5deg)",
                        "opacity": "0",
                        "animation": "welcomeFadeIn 0.6s ease-out 1s forwards",
                        "text-align": "right",
                        "max-width": "150px"
                    }}>
                        P3 Wide-Gamut Colors
                    </div>

                    {/* Toolbar Label */}
                    <div style={{
                        "position": "absolute",
                        "top": "20%",
                        "left": "60%",
                        "transform": "rotate(5deg)",
                        "opacity": "0",
                        "animation": "welcomeFadeIn 0.6s ease-out 0.9s forwards",
                        "max-width": "200px"
                    }}>
                        Pick a tool & start drawing!
                    </div>

                    {/* Help Label */}
                    <div style={{
                        "position": "absolute",
                        "bottom": "120px",
                        "left": "300px",
                        "text-align": "left",
                        "opacity": "0",
                        "animation": "welcomeFadeIn 0.6s ease-out 1.1s forwards"
                    }}>
                        Shortcuts & help
                    </div>
                </Show>

                {/* Feature Lists - Left Side */}
                <Show when={windowSize().width > 1100}>
                    <div style={{
                        "position": "absolute",
                        "top": "50%",
                        "left": "60px",
                        "transform": "translateY(-50%)",
                        "display": "flex",
                        "flex-direction": "column",
                        "gap": "0.6rem",
                        "font-family": "Inter, sans-serif",
                        "font-size": "0.85rem",
                        "max-width": "220px",
                        "opacity": "0",
                        "animation": "welcomeSlideInLeft 0.6s ease-out 0.3s forwards"
                    }}>
                        <For each={leftFeatures}>
                            {(f, i) => (
                                <div style={{
                                    "display": "flex",
                                    "align-items": "center",
                                    "gap": "0.5rem",
                                    "opacity": "0",
                                    "animation": `welcomeFadeInUp 0.4s ease-out ${0.4 + i() * 0.08}s forwards`
                                }}>
                                    <span style={{ "color": "color(display-p3 0.2 0.7 0.4)", "font-size": "1rem", "flex-shrink": "0" }}>✓</span>
                                    <span>{f}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Feature Lists - Right Side */}
                <Show when={windowSize().width > 1100}>
                    <div style={{
                        "position": "absolute",
                        "top": "50%",
                        "right": "60px",
                        "transform": "translateY(-50%)",
                        "display": "flex",
                        "flex-direction": "column",
                        "gap": "0.6rem",
                        "font-family": "Inter, sans-serif",
                        "font-size": "0.85rem",
                        "max-width": "220px",
                        "opacity": "0",
                        "animation": "welcomeSlideInRight 0.6s ease-out 0.3s forwards"
                    }}>
                        <For each={rightFeatures}>
                            {(f, i) => (
                                <div style={{
                                    "display": "flex",
                                    "align-items": "center",
                                    "gap": "0.5rem",
                                    "opacity": "0",
                                    "animation": `welcomeFadeInUp 0.4s ease-out ${0.4 + i() * 0.08}s forwards`
                                }}>
                                    <span style={{ "color": "color(display-p3 0.2 0.7 0.4)", "font-size": "1rem", "flex-shrink": "0" }}>✓</span>
                                    <span>{f}</span>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Logo and Tagline Center */}
                <div style={{
                    "position": "absolute",
                    "top": "45%",
                    "left": "50%",
                    "transform": "translate(-50%, -50%)",
                    "text-align": "center",
                    "display": "flex",
                    "flex-direction": "column",
                    "align-items": "center",
                    "gap": "1rem"
                }}>
                    
                    <p style={{
                        "font-size": windowSize().width < 768 ? "0.9rem" : "1.2rem",
                        "opacity": "0",
                        "animation": "welcomeFadeIn 0.5s ease-out 0.3s forwards",
                        "padding": windowSize().width < 768 ? "0 1rem" : "0"
                    }}>
                        All your data stays on your machine. Nothing is sent to the cloud.
                    </p>

                    <Show when={windowSize().width >= 768}>
                        <div style={{
                            "margin-top": "2rem",
                            "display": "grid",
                            "grid-template-columns": "auto auto",
                            "gap": "1rem 3rem",
                            "text-align": "left",
                            "font-family": "Inter, sans-serif",
                            "font-size": "0.9rem",
                            "opacity": "0",
                            "animation": "welcomeFadeInUp 0.5s ease-out 0.5s forwards"
                        }}>
                            <span>Open</span>
                            <strong>Ctrl+Alt+O</strong>

                            <span>Smart Palette</span>
                            <strong>Ctrl+K</strong>

                            <span>Help</span>
                            <strong>?</strong>
                        </div>
                    </Show>

                    {/* Shape Categories */}
                    <div style={{
                        "margin-top": "2rem",
                        "display": "flex",
                        "flex-wrap": "wrap",
                        "justify-content": "center",
                        "gap": "0.5rem",
                        "max-width": "480px"
                    }}>
                        <For each={shapeCategories}>
                            {(cat, i) => (
                                <div style={{
                                    "display": "inline-flex",
                                    "align-items": "center",
                                    "gap": "0.35rem",
                                    "padding": "0.3rem 0.7rem",
                                    "border-radius": "999px",
                                    "border": `1.5px solid ${cat.color}`,
                                    "font-family": "Inter, sans-serif",
                                    "font-size": "0.75rem",
                                    "color": cat.color,
                                    "white-space": "nowrap",
                                    "opacity": "0",
                                    "animation": `welcomePillIn 0.4s ease-out ${0.7 + i() * 0.06}s forwards`
                                }}>
                                    {getCategoryIcon(cat.icon)}
                                    {cat.label}
                                </div>
                            )}
                        </For>
                    </div>
                </div>

            </div>
        </Show>
    );
};
