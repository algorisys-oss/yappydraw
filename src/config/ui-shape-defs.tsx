/**
 * UI Shape Definitions — Single source of truth for all UI/UX wireframe shapes.
 * Adding a new shape = adding one entry to UI_SHAPE_DEFS.
 */
import type { Component } from 'solid-js';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import type { DrawingElement } from '../types';

export type UIShapeCategory = 'container' | 'form' | 'feedback' | 'navigation';

export interface UIShapeBounds {
    x: number; y: number; w: number; h: number;
    cx: number; cy: number;
}

export interface UIRenderHelpers {
    strokeColor: string;
    backgroundColor: string | undefined;
    applyStroke: (ctx: CanvasRenderingContext2D) => void;
    buildRoughOptions: () => Options;
    getRoundedRectPath: (x: number, y: number, w: number, h: number, r: number) => string;
    shadeColor: (color: string, percent: number) => string;
}

export interface UIShapeDef {
    type: string;
    label: string;
    category: UIShapeCategory;
    icon: string;
    toolbarIcon: Component<{ size?: number; color?: string }>;
    defaultWidth: number;
    defaultHeight: number;
    customTextRendering?: boolean;
    textYOffset?: (el: DrawingElement) => number;
    renderArchitectural: (ctx: CanvasRenderingContext2D, el: DrawingElement, b: UIShapeBounds, h: UIRenderHelpers) => void;
    renderSketch: (rc: RoughCanvas, el: DrawingElement, b: UIShapeBounds, h: UIRenderHelpers, ctx?: CanvasRenderingContext2D) => void;
    definePath: (ctx: CanvasRenderingContext2D, el: DrawingElement) => void;
}

// ─── Toolbar Icons (SolidJS SVG Components) ────────────────────────────

const BrowserWindowIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
        <line x1="2" y1="8" x2="22" y2="8" />
        <circle cx="5" cy="5.5" r="0.5" fill="currentColor" />
        <circle cx="7" cy="5.5" r="0.5" fill="currentColor" />
        <circle cx="9" cy="5.5" r="0.5" fill="currentColor" />
    </svg>
);

const MobilePhoneIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <path d="M10 4h4" /><path d="M11 19h2" />
    </svg>
);

const GhostButtonIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2">
        <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
    </svg>
);

const InputFieldIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="7" width="18" height="10" rx="1" /><line x1="7" y1="10" x2="7" y2="14" />
    </svg>
);

const BrowserIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="18" rx="1" />
        <line x1="2" y1="7" x2="22" y2="7" />
        <circle cx="5" cy="5" r="0.8" fill="currentColor" />
        <circle cx="8" cy="5" r="0.8" fill="currentColor" />
        <circle cx="11" cy="5" r="0.8" fill="currentColor" />
    </svg>
);

const SolidButtonIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="6" width="18" height="12" rx="4" fill="currentColor" opacity="0.2" />
        <rect x="3" y="6" width="18" height="12" rx="4" />
    </svg>
);

const DropdownIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="7" width="18" height="10" rx="1" />
        <polyline points="17,10 19,13 21,10" />
    </svg>
);

const UICheckboxIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <polyline points="8,12 11,15 16,9" />
    </svg>
);

const RadioButtonIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
);

const ToggleSwitchIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="10" rx="5" />
        <circle cx="16" cy="12" r="3" fill="currentColor" />
    </svg>
);

const SearchBarIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="10" rx="1" />
        <circle cx="7" cy="12" r="2" /><line x1="8.5" y1="13.5" x2="10" y2="15" />
    </svg>
);

const SliderIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12" /><circle cx="14" cy="12" r="3" />
    </svg>
);

const CardIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="3" y1="9" x2="21" y2="9" />
    </svg>
);

const NavbarIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="8" width="20" height="8" rx="1" />
        <line x1="8" y1="8" x2="8" y2="16" /><line x1="16" y1="8" x2="16" y2="16" />
    </svg>
);

const TabBarIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="6" width="20" height="12" rx="1" />
        <line x1="9" y1="6" x2="9" y2="11" /><line x1="16" y1="6" x2="16" y2="11" />
        <line x1="2" y1="11" x2="22" y2="11" />
    </svg>
);

const AvatarIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="9" r="3" /><path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
);

const ProgressBarIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="9" width="20" height="6" rx="3" />
        <rect x="2" y="9" width="12" height="6" rx="3" fill="currentColor" opacity="0.3" />
    </svg>
);

const BadgeIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="5" y="8" width="14" height="8" rx="4" fill="currentColor" opacity="0.2" />
        <rect x="5" y="8" width="14" height="8" rx="4" />
    </svg>
);

const TooltipIcon: Component<{ size?: number }> = (props) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="12" rx="2" />
        <polygon points="10,15 12,19 14,15" />
    </svg>
);

// ─── Shape Definitions ─────────────────────────────────────────────────

export const UI_SHAPE_DEFS: UIShapeDef[] = [
    // ════════ CONTAINERS ════════
    {
        type: 'browserWindow', label: 'Browser Window', category: 'container',
        icon: '🖼', toolbarIcon: BrowserWindowIcon,
        defaultWidth: 400, defaultHeight: 300,
        textYOffset: (el) => Math.min(el.height * 0.15, 30) / 2,
        renderArchitectural(ctx, _el, b, h) {
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.fillRect(b.x, b.y, b.w, b.h); }
            h.applyStroke(ctx);
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            const headerH = Math.min(b.h * 0.15, 30);
            ctx.strokeRect(b.x, b.y, b.w, headerH);
            const btnR = 4;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath(); ctx.arc(b.x + 10 + i * 15, b.y + headerH / 2, btnR, 0, Math.PI * 2); ctx.stroke();
            }
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            rc.rectangle(b.x, b.y, b.w, b.h, opts);
            const headerH = Math.min(b.h * 0.15, 30);
            rc.rectangle(b.x, b.y, b.w, headerH, opts);
            for (let i = 0; i < 3; i++) rc.circle(b.x + 10 + i * 15, b.y + headerH / 2, 8, opts);
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
    {
        type: 'mobilePhone', label: 'Mobile Phone', category: 'container',
        icon: '📱', toolbarIcon: MobilePhoneIcon,
        defaultWidth: 200, defaultHeight: 400,
        textYOffset: (el) => -(el.height * 0.05),
        renderArchitectural(ctx, _el, b, h) {
            const radius = 20;
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, radius); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, radius); ctx.stroke();
            const sp = 10;
            ctx.strokeRect(b.x + sp, b.y + sp + 20, b.w - 2 * sp, b.h - 2 * sp - 40);
            ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h - 20, 10, 0, Math.PI * 2); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const path = h.getRoundedRectPath(b.x, b.y, b.w, b.h, 20);
            rc.path(path, opts);
            const sp = 10;
            rc.rectangle(b.x + sp, b.y + sp + 20, b.w - 2 * sp, b.h - 2 * sp - 40, opts);
            rc.circle(b.x + b.w / 2, b.y + b.h - 20, 20, opts);
        },
        definePath(ctx, el) { ctx.roundRect(el.x, el.y, el.width, el.height, 20); },
    },
    {
        type: 'card', label: 'Card', category: 'container',
        icon: '▭', toolbarIcon: CardIcon,
        defaultWidth: 300, defaultHeight: 200,
        textYOffset: (el) => Math.min(el.height * 0.15, 30) / 2,
        renderArchitectural(ctx, _el, b, h) {
            const r = Math.min(b.w, b.h) * 0.05;
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
            const divY = b.y + Math.min(b.h * 0.2, 40);
            ctx.beginPath(); ctx.moveTo(b.x, divY); ctx.lineTo(b.x + b.w, divY); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = Math.min(b.w, b.h) * 0.05;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), opts);
            const divY = b.y + Math.min(b.h * 0.2, 40);
            rc.line(b.x, divY, b.x + b.w, divY, opts);
        },
        definePath(ctx, el) { const r = Math.min(el.width, el.height) * 0.05; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },

    // ════════ FORM ELEMENTS ════════
    {
        type: 'browser', label: 'Browser (Simple)', category: 'container',
        icon: '🌐', toolbarIcon: BrowserIcon,
        defaultWidth: 400, defaultHeight: 300,
        renderArchitectural(ctx, _el, b, h) {
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.fillRect(b.x, b.y, b.w, b.h); }
            h.applyStroke(ctx);
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            const headerH = b.h * 0.15;
            ctx.beginPath(); ctx.moveTo(b.x, b.y + headerH); ctx.lineTo(b.x + b.w, b.y + headerH); ctx.stroke();
            ctx.fillStyle = h.strokeColor;
            const dotR = headerH * 0.2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath(); ctx.arc(b.x + headerH * (0.5 + i * 0.6), b.y + headerH / 2, dotR, 0, Math.PI * 2); ctx.fill();
            }
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            rc.rectangle(b.x, b.y, b.w, b.h, opts);
            const headerH = b.h * 0.15;
            rc.line(b.x, b.y + headerH, b.x + b.w, b.y + headerH, opts);
            const dotR = headerH * 0.3;
            for (let i = 0; i < 3; i++) {
                rc.circle(b.x + headerH * (0.5 + i * 0.6), b.y + headerH / 2, dotR, { ...opts, fillStyle: 'solid', fill: h.strokeColor });
            }
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
    {
        type: 'ghostButton', label: 'Ghost Button', category: 'form',
        icon: '▢', toolbarIcon: GhostButtonIcon,
        defaultWidth: 160, defaultHeight: 48,
        renderArchitectural(ctx, _el, b, h) {
            const r = Math.min(b.w, b.h) * 0.2;
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const r = Math.min(b.w, b.h) * 0.2;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), { ...h.buildRoughOptions(), strokeLineDash: [4, 4] });
        },
        definePath(ctx, el) { const r = Math.min(el.width, el.height) * 0.2; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },
    {
        type: 'inputField', label: 'Input Field', category: 'form',
        icon: '▭', toolbarIcon: InputFieldIcon,
        defaultWidth: 240, defaultHeight: 40,
        customTextRendering: true,
        renderArchitectural(ctx, el, b, h) {
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.fillRect(b.x, b.y, b.w, b.h); }
            h.applyStroke(ctx);
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            // Cursor line
            ctx.beginPath(); ctx.moveTo(b.x + 10, b.y + 8); ctx.lineTo(b.x + 10, b.y + b.h - 8); ctx.stroke();
            // Left-aligned text
            if (el.containerText && !el.isEditing) {
                ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                const fontSize = el.fontSize || Math.max(12, b.h * 0.4);
                ctx.font = `${fontSize}px ${el.fontFamily || 'sans-serif'}`;
                ctx.fillStyle = h.strokeColor;
                ctx.fillText(el.containerText, b.x + 25, b.cy, b.w - 30);
                ctx.restore();
            }
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            rc.rectangle(b.x, b.y, b.w, b.h, opts);
            rc.line(b.x + 10, b.y + 8, b.x + 10, b.y + b.h - 8, opts);
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
    {
        type: 'solidButton', label: 'Solid Button', category: 'form',
        icon: '▣', toolbarIcon: SolidButtonIcon,
        defaultWidth: 160, defaultHeight: 48,
        renderArchitectural(ctx, _el, b, h) {
            const r = Math.min(b.w, b.h) * 0.15;
            ctx.fillStyle = h.backgroundColor || h.strokeColor;
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill();
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const r = Math.min(b.w, b.h) * 0.15;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), { ...h.buildRoughOptions(), fillStyle: 'solid' });
        },
        definePath(ctx, el) { const r = Math.min(el.width, el.height) * 0.15; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },
    {
        type: 'dropdown', label: 'Dropdown', category: 'form',
        icon: '▾', toolbarIcon: DropdownIcon,
        defaultWidth: 200, defaultHeight: 40,
        renderArchitectural(ctx, _el, b, h) {
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.fillRect(b.x, b.y, b.w, b.h); }
            h.applyStroke(ctx);
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            // Chevron
            const cx = b.x + b.w - 20, cy = b.cy;
            ctx.beginPath(); ctx.moveTo(cx - 5, cy - 4); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx + 5, cy - 4); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            rc.rectangle(b.x, b.y, b.w, b.h, opts);
            const cx = b.x + b.w - 20, cy = b.cy;
            rc.line(cx - 5, cy - 4, cx, cy + 4, opts);
            rc.line(cx, cy + 4, cx + 5, cy - 4, opts);
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
    {
        type: 'uiCheckbox', label: 'Checkbox', category: 'form',
        icon: '☑', toolbarIcon: UICheckboxIcon,
        defaultWidth: 24, defaultHeight: 24,
        renderArchitectural(ctx, _el, b, h) {
            const r = Math.min(b.w, b.h) * 0.12;
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
            // Checkmark
            ctx.beginPath();
            ctx.moveTo(b.x + b.w * 0.2, b.cy);
            ctx.lineTo(b.x + b.w * 0.42, b.y + b.h * 0.72);
            ctx.lineTo(b.x + b.w * 0.78, b.y + b.h * 0.28);
            ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            rc.rectangle(b.x, b.y, b.w, b.h, opts);
            rc.line(b.x + b.w * 0.2, b.cy, b.x + b.w * 0.42, b.y + b.h * 0.72, opts);
            rc.line(b.x + b.w * 0.42, b.y + b.h * 0.72, b.x + b.w * 0.78, b.y + b.h * 0.28, opts);
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
    {
        type: 'radioButton', label: 'Radio Button', category: 'form',
        icon: '◉', toolbarIcon: RadioButtonIcon,
        defaultWidth: 24, defaultHeight: 24,
        renderArchitectural(ctx, _el, b, h) {
            const r = Math.min(b.w, b.h) / 2;
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.arc(b.cx, b.cy, r, 0, Math.PI * 2); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.arc(b.cx, b.cy, r, 0, Math.PI * 2); ctx.stroke();
            // Inner dot
            ctx.fillStyle = h.strokeColor;
            ctx.beginPath(); ctx.arc(b.cx, b.cy, r * 0.45, 0, Math.PI * 2); ctx.fill();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = Math.min(b.w, b.h) / 2;
            rc.circle(b.cx, b.cy, r * 2, opts);
            rc.circle(b.cx, b.cy, r * 0.9, { ...opts, fillStyle: 'solid', fill: h.strokeColor });
        },
        definePath(ctx, el) { const r = Math.min(el.width, el.height) / 2; ctx.arc(el.x + el.width / 2, el.y + el.height / 2, r, 0, Math.PI * 2); },
    },
    {
        type: 'toggleSwitch', label: 'Toggle Switch', category: 'form',
        icon: '⊝', toolbarIcon: ToggleSwitchIcon,
        defaultWidth: 56, defaultHeight: 28,
        renderArchitectural(ctx, _el, b, h) {
            const r = b.h / 2;
            // Track
            ctx.fillStyle = h.backgroundColor || '#d1d5db';
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill();
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
            // Knob (positioned at ON side = right)
            const knobR = r * 0.8;
            const knobX = b.x + b.w - r;
            ctx.fillStyle = h.strokeColor;
            ctx.beginPath(); ctx.arc(knobX, b.cy, knobR, 0, Math.PI * 2); ctx.fill();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = b.h / 2;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), opts);
            const knobR = r * 0.8;
            rc.circle(b.x + b.w - r, b.cy, knobR * 2, { ...opts, fillStyle: 'solid', fill: h.strokeColor });
        },
        definePath(ctx, el) { const r = el.height / 2; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },
    {
        type: 'searchBar', label: 'Search Bar', category: 'form',
        icon: '🔍', toolbarIcon: SearchBarIcon,
        defaultWidth: 280, defaultHeight: 40,
        renderArchitectural(ctx, _el, b, h) {
            const r = b.h * 0.2;
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
            // Magnifying glass icon
            const iconX = b.x + 16, iconY = b.cy;
            const gr = Math.min(b.h * 0.22, 7);
            ctx.beginPath(); ctx.arc(iconX, iconY - 1, gr, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(iconX + gr * 0.7, iconY + gr * 0.7 - 1); ctx.lineTo(iconX + gr * 1.4, iconY + gr * 1.4 - 1); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = b.h * 0.2;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), opts);
            const iconX = b.x + 16, iconY = b.cy;
            const gr = Math.min(b.h * 0.22, 7);
            rc.circle(iconX, iconY - 1, gr * 2, opts);
            rc.line(iconX + gr * 0.7, iconY + gr * 0.7 - 1, iconX + gr * 1.4, iconY + gr * 1.4 - 1, opts);
        },
        definePath(ctx, el) { const r = el.height * 0.2; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },
    {
        type: 'slider', label: 'Slider', category: 'form',
        icon: '⊖', toolbarIcon: SliderIcon,
        defaultWidth: 200, defaultHeight: 24,
        renderArchitectural(ctx, _el, b, h) {
            // Track
            const trackH = Math.max(4, b.h * 0.2);
            const trackY = b.cy - trackH / 2;
            ctx.fillStyle = h.backgroundColor || '#e5e7eb';
            ctx.beginPath(); ctx.roundRect(b.x, trackY, b.w, trackH, trackH / 2); ctx.fill();
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, trackY, b.w, trackH, trackH / 2); ctx.stroke();
            // Filled portion (60%)
            const fillW = b.w * 0.6;
            ctx.fillStyle = h.strokeColor;
            ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.roundRect(b.x, trackY, fillW, trackH, trackH / 2); ctx.fill();
            ctx.globalAlpha = 1;
            // Thumb
            const thumbR = b.h * 0.35;
            const thumbX = b.x + fillW;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(thumbX, b.cy, thumbR, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(thumbX, b.cy, thumbR, 0, Math.PI * 2); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const trackH = Math.max(4, b.h * 0.2);
            const trackY = b.cy - trackH / 2;
            rc.rectangle(b.x, trackY, b.w, trackH, opts);
            const thumbR = b.h * 0.35;
            const thumbX = b.x + b.w * 0.6;
            rc.circle(thumbX, b.cy, thumbR * 2, { ...opts, fillStyle: 'solid', fill: '#ffffff' });
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },

    // ════════ NAVIGATION ════════
    {
        type: 'navbar', label: 'Navbar', category: 'navigation',
        icon: '═', toolbarIcon: NavbarIcon,
        defaultWidth: 500, defaultHeight: 48,
        customTextRendering: true,
        renderArchitectural(ctx, el, b, h) {
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.fillRect(b.x, b.y, b.w, b.h); }
            h.applyStroke(ctx);
            const pad = Math.min(16, b.h * 0.3);
            const iconS = Math.min(20, b.h * 0.4);
            // Hamburger menu (left)
            const hx = b.x + pad;
            const hGap = iconS * 0.3;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath(); ctx.moveTo(hx, b.cy + i * hGap); ctx.lineTo(hx + iconS, b.cy + i * hGap); ctx.stroke();
            }
            // Title text or placeholder
            const title = el.containerText || el.text || '';
            const titleX = hx + iconS + pad;
            const fontSize = Math.max(10, Math.min(16, b.h * 0.35));
            if (title) {
                ctx.fillStyle = h.strokeColor;
                ctx.font = `600 ${fontSize}px sans-serif`;
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(title, titleX, b.cy, b.w * 0.5);
            } else {
                ctx.fillStyle = h.strokeColor; ctx.globalAlpha = 0.35;
                ctx.beginPath(); ctx.roundRect(titleX, b.cy - 3, b.w * 0.2, 6, 3); ctx.fill();
                ctx.globalAlpha = 1;
            }
            // Right icons
            const rx = b.x + b.w - pad;
            ctx.beginPath(); ctx.arc(rx - iconS * 0.4, b.cy, iconS * 0.35, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(rx - iconS * 1.4, b.cy, iconS * 0.35, 0, Math.PI * 2); ctx.stroke();
            // Bottom border
            ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.stroke();
        },
        renderSketch(rc, el, b, h, ctx) {
            const opts = h.buildRoughOptions();
            const pad = Math.min(16, b.h * 0.3);
            const iconS = Math.min(20, b.h * 0.4);
            rc.line(b.x, b.y + b.h, b.x + b.w, b.y + b.h, opts);
            const hx = b.x + pad;
            const hGap = iconS * 0.3;
            for (let i = -1; i <= 1; i++) rc.line(hx, b.cy + i * hGap, hx + iconS, b.cy + i * hGap, opts);
            const title = el.containerText || el.text || '';
            if (title && ctx) {
                const fontSize = Math.max(10, Math.min(16, b.h * 0.35));
                ctx.fillStyle = h.strokeColor;
                ctx.font = `600 ${fontSize}px sans-serif`;
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(title, hx + iconS + pad, b.cy, b.w * 0.5);
            } else if (!title) {
                rc.rectangle(hx + iconS + pad, b.cy - 3, b.w * 0.2, 6, { ...opts, fill: opts.stroke, fillStyle: 'solid' });
            }
            const rx = b.x + b.w - pad;
            rc.circle(rx - iconS * 0.4, b.cy, iconS * 0.7, opts);
            rc.circle(rx - iconS * 1.4, b.cy, iconS * 0.7, opts);
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
    {
        type: 'tabBar', label: 'Tab Bar', category: 'navigation',
        icon: '⊟', toolbarIcon: TabBarIcon,
        defaultWidth: 360, defaultHeight: 40,
        customTextRendering: true,
        renderArchitectural(ctx, el, b, h) {
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.fillRect(b.x, b.y, b.w, b.h); }
            h.applyStroke(ctx);
            // Bottom border line
            ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.stroke();
            // Parse tab labels
            const defaultLabels = ['Tab 1', 'Tab 2', 'Tab 3'];
            const labels = (el.containerText || el.text)
                ? (el.containerText || el.text || '').split(',').map((s: string) => s.trim())
                : defaultLabels;
            const tabs = labels.length;
            const tabW = b.w / tabs;
            const fontSize = Math.max(10, Math.min(14, b.h * 0.35));
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let i = 0; i < tabs; i++) {
                const tx = b.x + tabW * i + tabW / 2;
                if (i === 0) {
                    // Active tab: full opacity text + bottom indicator
                    ctx.fillStyle = h.strokeColor;
                    ctx.font = `600 ${fontSize}px sans-serif`;
                    ctx.fillText(labels[i], tx, b.cy, tabW - 8);
                    ctx.fillRect(b.x + tabW * 0.05, b.y + b.h - 3, tabW * 0.9, 3);
                    ctx.font = `${fontSize}px sans-serif`;
                } else {
                    // Inactive: faded text
                    ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = h.strokeColor;
                    ctx.fillText(labels[i], tx, b.cy, tabW - 8);
                    ctx.restore();
                }
            }
        },
        renderSketch(rc, el, b, h, ctx) {
            const opts = h.buildRoughOptions();
            // Bottom border
            rc.line(b.x, b.y + b.h, b.x + b.w, b.y + b.h, opts);
            const defaultLabels = ['Tab 1', 'Tab 2', 'Tab 3'];
            const labels = (el.containerText || el.text)
                ? (el.containerText || el.text || '').split(',').map((s: string) => s.trim())
                : defaultLabels;
            const tabs = labels.length;
            const tabW = b.w / tabs;
            // Active indicator
            rc.line(b.x + tabW * 0.05, b.y + b.h - 1, b.x + tabW * 0.95, b.y + b.h - 1,
                { ...opts, strokeWidth: 3 });
            // Text labels via canvas
            if (ctx) {
                const fontSize = Math.max(10, Math.min(14, b.h * 0.35));
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                for (let i = 0; i < tabs; i++) {
                    const tx = b.x + tabW * i + tabW / 2;
                    ctx.fillStyle = h.strokeColor;
                    ctx.font = i === 0 ? `600 ${fontSize}px sans-serif` : `${fontSize}px sans-serif`;
                    if (i > 0) ctx.globalAlpha = 0.45;
                    ctx.fillText(labels[i], tx, b.cy, tabW - 8);
                    ctx.globalAlpha = 1;
                }
            }
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },

    // ════════ FEEDBACK ════════
    {
        type: 'avatar', label: 'Avatar', category: 'feedback',
        icon: '👤', toolbarIcon: AvatarIcon,
        defaultWidth: 64, defaultHeight: 64,
        renderArchitectural(ctx, _el, b, h) {
            const r = Math.min(b.w, b.h) / 2;
            // Circle background
            const bg = h.backgroundColor || '#e5e7eb';
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.arc(b.cx, b.cy, r, 0, Math.PI * 2); ctx.fill();
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.arc(b.cx, b.cy, r, 0, Math.PI * 2); ctx.stroke();
            // Clip to circle for person silhouette
            ctx.save();
            ctx.beginPath(); ctx.arc(b.cx, b.cy, r - 1, 0, Math.PI * 2); ctx.clip();
            // Use a darker shade of the background for the silhouette
            const silhouetteColor = h.shadeColor(bg === 'transparent' ? '#e5e7eb' : bg, 0.7);
            ctx.fillStyle = silhouetteColor;
            // Head
            ctx.beginPath(); ctx.arc(b.cx, b.cy - r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill();
            // Body — top overlaps head, bottom clipped by circle
            ctx.beginPath(); ctx.ellipse(b.cx, b.cy + r * 0.4, r * 0.4, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = Math.min(b.w, b.h) / 2;
            rc.circle(b.cx, b.cy, r * 2, opts);
            // Head
            rc.circle(b.cx, b.cy - r * 0.3, r * 0.44, { ...opts, fill: opts.stroke, fillStyle: 'solid' });
            // Body
            rc.ellipse(b.cx, b.cy + r * 0.4, r * 0.8, r * 1.0, { ...opts, fill: opts.stroke, fillStyle: 'solid' });
        },
        definePath(ctx, el) { const r = Math.min(el.width, el.height) / 2; ctx.arc(el.x + el.width / 2, el.y + el.height / 2, r, 0, Math.PI * 2); },
    },
    {
        type: 'progressBar', label: 'Progress Bar', category: 'feedback',
        icon: '▰', toolbarIcon: ProgressBarIcon,
        defaultWidth: 200, defaultHeight: 16,
        renderArchitectural(ctx, _el, b, h) {
            const r = b.h / 2;
            // Track
            ctx.fillStyle = h.backgroundColor || '#e5e7eb';
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill();
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
            // Fill (60%)
            const fillW = b.w * 0.6;
            if (fillW > 0) {
                ctx.fillStyle = h.strokeColor;
                ctx.globalAlpha = 0.6;
                ctx.beginPath(); ctx.roundRect(b.x, b.y, fillW, b.h, r); ctx.fill();
                ctx.globalAlpha = 1;
            }
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = b.h / 2;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), opts);
            const fillW = b.w * 0.6;
            rc.path(h.getRoundedRectPath(b.x, b.y, fillW, b.h, r), { ...opts, fillStyle: 'solid', fill: h.strokeColor });
        },
        definePath(ctx, el) { const r = el.height / 2; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },
    {
        type: 'badge', label: 'Badge', category: 'feedback',
        icon: '⊞', toolbarIcon: BadgeIcon,
        defaultWidth: 80, defaultHeight: 28,
        renderArchitectural(ctx, _el, b, h) {
            const r = b.h / 2;
            ctx.fillStyle = h.backgroundColor || h.strokeColor;
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.fill();
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, r); ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const r = b.h / 2;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, b.h, r), { ...h.buildRoughOptions(), fillStyle: 'solid' });
        },
        definePath(ctx, el) { const r = el.height / 2; ctx.roundRect(el.x, el.y, el.width, el.height, r); },
    },
    {
        type: 'tooltip', label: 'Tooltip', category: 'feedback',
        icon: '💬', toolbarIcon: TooltipIcon,
        defaultWidth: 160, defaultHeight: 48,
        renderArchitectural(ctx, _el, b, h) {
            const r = 6;
            const bodyH = b.h * 0.75;
            const arrowH = b.h - bodyH;
            // Body
            if (h.backgroundColor) { ctx.fillStyle = h.backgroundColor; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, bodyH, r); ctx.fill(); }
            h.applyStroke(ctx);
            ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, bodyH, r); ctx.stroke();
            // Arrow
            const arrowW = 12;
            ctx.beginPath();
            ctx.moveTo(b.cx - arrowW / 2, b.y + bodyH);
            ctx.lineTo(b.cx, b.y + bodyH + arrowH);
            ctx.lineTo(b.cx + arrowW / 2, b.y + bodyH);
            ctx.stroke();
        },
        renderSketch(rc, _el, b, h) {
            const opts = h.buildRoughOptions();
            const r = 6;
            const bodyH = b.h * 0.75;
            const arrowH = b.h - bodyH;
            rc.path(h.getRoundedRectPath(b.x, b.y, b.w, bodyH, r), opts);
            const arrowW = 12;
            rc.line(b.cx - arrowW / 2, b.y + bodyH, b.cx, b.y + bodyH + arrowH, opts);
            rc.line(b.cx, b.y + bodyH + arrowH, b.cx + arrowW / 2, b.y + bodyH, opts);
        },
        definePath(ctx, el) { ctx.rect(el.x, el.y, el.width, el.height); },
    },
];

// ─── Lookup Helpers ────────────────────────────────────────────────────

const _defMap = new Map<string, UIShapeDef>();
UI_SHAPE_DEFS.forEach(d => _defMap.set(d.type, d));

export function getUIShapeDef(type: string): UIShapeDef | undefined {
    return _defMap.get(type);
}

export const UI_SHAPE_TYPES = UI_SHAPE_DEFS.map(d => d.type);
