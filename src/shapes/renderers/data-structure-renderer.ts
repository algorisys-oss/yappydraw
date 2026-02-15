import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { resolveFontFamily } from "../../utils/text-utils";
import type { IRenderer, ICanvasGradient } from "../../rendering/IRenderer";

/**
 * Data Structure Renderer
 * Renders visual data structure shapes: Array, Stack, Queue, LinkedList, BinaryTree, HashTable.
 * All share comma-separated el.text for data, el.containerText for optional title.
 */
export class DataStructureRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el, isDarkMode } = context;
        renderer.save();

        switch (el.type) {
            case 'dsArray': this.renderArray(renderer, el, isDarkMode); break;
            case 'dsStack': this.renderStack(renderer, el, isDarkMode); break;
            case 'dsQueue': this.renderQueue(renderer, el, isDarkMode); break;
            case 'dsLinkedList': this.renderLinkedList(renderer, el, isDarkMode); break;
            case 'dsBinaryTree': this.renderBinaryTree(renderer, el, isDarkMode); break;
            case 'dsHashTable': this.renderHashTable(renderer, el, isDarkMode); break;
        }

        renderer.restore();
    }

    // ─── Shared Helpers ──────────────────────────────────────────────

    private parseValues(text: string | undefined): string[] {
        if (!text) return [];
        return text.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }

    private getItemAlpha(index: number, totalItems: number, el: any): number {
        const progress = el.dsAnimProgress;
        const style = el.dsAnimStyle;
        if (progress === undefined || progress < 0 || progress >= 100 || !style) return 1;
        const p = progress / 100;
        if (style === 'itemReveal') {
            const itemProgress = p * totalItems;
            if (index < Math.floor(itemProgress)) return 1;
            if (index === Math.floor(itemProgress)) return Math.min(1, (itemProgress - index) * 2);
            return 0;
        }
        if (style === 'dsOpInsert') {
            return index === el.dsHighlightIndex ? p : 1;
        }
        if (style === 'dsOpRemove') {
            return index === el.dsHighlightIndex ? (1 - p) : 1;
        }
        // Algorithm animations don't change opacity
        if (style?.startsWith('dsAlgo')) return 1;
        return 1;
    }

    /** Returns highlight state: 'none', 'primary', 'secondary', or 'sorted' */
    private getHighlightState(index: number, el: any): 'none' | 'primary' | 'secondary' | 'sorted' {
        // Sorted boundary check (from left)
        if (el.dsSortedBoundary !== undefined && el.dsSortedBoundary > 0 && index < el.dsSortedBoundary) {
            // But if also explicitly highlighted, that takes precedence
            if (el.dsHighlightIndex === index) return 'primary';
            if (el.dsHighlightIndex2 === index) return 'secondary';
            return 'sorted';
        }
        // Sorted boundary check (from right, for bubble sort)
        if (el.dsSortedBoundaryEnd !== undefined && index >= el.dsSortedBoundaryEnd) {
            if (el.dsHighlightIndex === index) return 'primary';
            if (el.dsHighlightIndex2 === index) return 'secondary';
            return 'sorted';
        }
        // Explicit highlights
        if (el.dsHighlightIndex === index) return 'primary';
        if (el.dsHighlightIndex2 === index) return 'secondary';
        // Animation-driven highlight
        const progress = el.dsAnimProgress;
        const style = el.dsAnimStyle;
        if (progress === undefined || progress < 0 || progress >= 100 || !style) return 'none';
        const p = progress / 100;
        if (style === 'highlightSweep' || style === 'pointerWalk') {
            const totalItems = this.parseValues(el.text).length;
            const current = Math.floor(p * totalItems);
            return current === index ? 'primary' : 'none';
        }
        if (style === 'dsOpInsert' || style === 'dsOpRemove' || style === 'dsOpUpdate') {
            return index === el.dsHighlightIndex ? 'primary' : 'none';
        }
        return 'none';
    }

    /** Get cell rendering colors based on highlight state */
    private getCellStyle(hlState: 'none' | 'primary' | 'secondary' | 'sorted', colors: any) {
        if (hlState === 'primary') return { bg: colors.highlightBg, stroke: colors.highlight, text: colors.highlight, sw: 2 };
        if (hlState === 'secondary') return { bg: colors.highlightBg2, stroke: colors.highlight2, text: colors.highlight2, sw: 2 };
        if (hlState === 'sorted') return { bg: colors.sortedBg, stroke: colors.sorted, text: colors.sorted, sw: 1.5 };
        return { bg: colors.itemBg, stroke: colors.stroke, text: colors.text, sw: 0.5 };
    }

    private drawRoundedRect(renderer: IRenderer, x: number, y: number, w: number, h: number, r: number): void {
        w = Math.max(0, w);
        h = Math.max(0, h);
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        if (renderer.roundRect) {
            renderer.beginPath();
            renderer.roundRect(x, y, w, h, r);
        } else {
            renderer.beginPath();
            renderer.rect(x, y, w, h);
        }
    }

    private drawTitle(renderer: IRenderer, el: any, isDarkMode: boolean, titleY: number, titleH: number): void {
        if (!el.containerText) return;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const fontSize = el.fontSize || 14;
        renderer.font = `bold ${fontSize}px ${font}`;
        renderer.fillStyle = RenderPipeline.adjustColor(el.textColor || '#1e293b', isDarkMode);
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        renderer.fillText(el.containerText, el.x + el.width / 2, titleY + titleH / 2, el.width - 16);
    }

    private static DS_HIGHLIGHT_COLORS: Record<string, string> = {
        comparing: '#f59e0b', swapping: '#22c55e', sorted: '#16a34a',
        searching: '#3b82f6', found: '#10b981', notfound: '#ef4444',
    };

    private getColors(el: any, isDarkMode: boolean) {
        const isRemoveAnim = el.dsAnimStyle === 'dsOpRemove';
        const hlc1 = el.dsHighlightColor
            ? (DataStructureRenderer.DS_HIGHLIGHT_COLORS[el.dsHighlightColor] || '#3b82f6')
            : (isRemoveAnim ? '#ef4444' : '#3b82f6');
        const hlc2 = el.dsHighlightColor2
            ? (DataStructureRenderer.DS_HIGHLIGHT_COLORS[el.dsHighlightColor2] || hlc1)
            : hlc1;
        return {
            bg: RenderPipeline.adjustColor(el.backgroundColor || '#f8fafc', isDarkMode),
            stroke: RenderPipeline.adjustColor(el.strokeColor || '#334155', isDarkMode),
            text: RenderPipeline.adjustColor(el.textColor || '#1e293b', isDarkMode),
            itemBg: RenderPipeline.adjustColor(el.dsItemColor || '#e2e8f0', isDarkMode),
            highlight: RenderPipeline.adjustColor(hlc1, isDarkMode),
            highlightBg: this.hexToRgba(hlc1, 0.15),
            highlight2: RenderPipeline.adjustColor(hlc2, isDarkMode),
            highlightBg2: this.hexToRgba(hlc2, 0.15),
            sorted: RenderPipeline.adjustColor('#16a34a', isDarkMode),
            sortedBg: 'rgba(22, 163, 106, 0.12)',
            label: RenderPipeline.adjustColor('#64748b', isDarkMode),
        };
    }

    private hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /** Fill background rect with gradient or solid color based on fillStyle */
    private fillBackground(renderer: IRenderer, el: any, isDarkMode: boolean,
        x: number, y: number, w: number, h: number, cornerRadius: number): void {
        const fillStyle = el.fillStyle;
        const isGradient = ['linear', 'radial', 'conic'].includes(fillStyle as string);

        this.drawRoundedRect(renderer, x, y, w, h, cornerRadius);

        if (isGradient) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const mw = w / 2;
            const mh = h / 2;
            let grad: ICanvasGradient;

            if (fillStyle === 'linear') {
                const angleRad = (el.gradientDirection || 45) * (Math.PI / 180);
                const r = Math.sqrt(mw ** 2 + mh ** 2);
                grad = renderer.createLinearGradient(cx - Math.cos(angleRad) * r, cy - Math.sin(angleRad) * r,
                    cx + Math.cos(angleRad) * r, cy + Math.sin(angleRad) * r);
            } else if (fillStyle === 'radial') {
                const radius = Math.max(w, h) / 2;
                grad = renderer.createRadialGradient(cx, cy, 0, cx, cy, radius);
            } else {
                const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
                grad = renderer.createConicGradient(angleRad, cx, cy);
            }

            if (el.gradientStops && el.gradientStops.length > 0) {
                [...el.gradientStops].sort((a: any, b: any) => a.offset - b.offset)
                    .forEach((stop: any) => grad.addColorStop(stop.offset, stop.color));
            } else if (el.gradientStart && el.gradientEnd) {
                grad.addColorStop(0, el.gradientStart);
                grad.addColorStop(1, el.gradientEnd);
            } else {
                const bg = RenderPipeline.adjustColor(el.backgroundColor || '#f8fafc', isDarkMode);
                renderer.fillStyle = bg;
                renderer.fill();
                return;
            }

            renderer.fillStyle = grad;
            renderer.fill();
        } else {
            renderer.fillStyle = RenderPipeline.adjustColor(el.backgroundColor || '#f8fafc', isDarkMode);
            renderer.fill();
        }
    }

    // ─── Array ───────────────────────────────────────────────────────

    private renderArray(renderer: IRenderer, el: any, isDarkMode: boolean): void {
        const values = this.parseValues(el.text);
        const colors = this.getColors(el, isDarkMode);
        const fontSize = el.fontSize || 14;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const showIndices = el.dsShowIndices ?? true;
        const isVertical = el.dsDirection === 'vertical';
        const cornerRadius = Math.min((el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100, el.width / 2, el.height / 2);
        const strokeWidth = el.strokeWidth || 1;

        const padding = 8;
        const hasTitle = !!el.containerText;
        const titleH = hasTitle ? fontSize * 1.8 : 0;
        const indexH = showIndices ? fontSize * 1.4 : 0;

        // Background
        this.fillBackground(renderer, el, isDarkMode, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = strokeWidth;
        this.drawRoundedRect(renderer, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.stroke();

        // Title
        if (hasTitle) {
            this.drawTitle(renderer, el, isDarkMode, el.y, titleH);
            renderer.strokeStyle = colors.stroke;
            renderer.lineWidth = 0.5;
            renderer.beginPath();
            renderer.moveTo(el.x + padding, el.y + titleH);
            renderer.lineTo(el.x + el.width - padding, el.y + titleH);
            renderer.stroke();
        }

        if (values.length === 0) {
            renderer.font = `${fontSize}px ${font}`;
            renderer.fillStyle = colors.label;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('Double-click to add values', el.x + el.width / 2, el.y + el.height / 2);
            return;
        }

        const contentX = el.x + padding;
        const contentY = el.y + titleH + padding;
        const contentW = el.width - padding * 2;
        const contentH = el.height - titleH - padding * 2 - indexH;

        const n = values.length;
        renderer.font = `${fontSize}px ${font}`;

        if (isVertical) {
            const cellH = contentH / n;
            const cellW = contentW;
            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cy = contentY + i * cellH;
                const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, contentX, cy, cellW, cellH - 2, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], contentX + cellW / 2, cy + (cellH - 2) / 2, cellW - 8);

                if (showIndices) {
                    renderer.fillStyle = colors.label;
                    renderer.font = `${fontSize * 0.75}px ${font}`;
                    renderer.textAlign = 'left';
                    renderer.fillText(`[${i}]`, contentX + cellW + 4, cy + (cellH - 2) / 2);
                    renderer.font = `${fontSize}px ${font}`;
                }

                renderer.globalAlpha = 1;
            }
        } else {
            // Horizontal
            const cellW = contentW / n;
            const cellH = contentH;
            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cx = contentX + i * cellW;
                const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, cx + 1, contentY, cellW - 2, cellH, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], cx + cellW / 2, contentY + cellH / 2, cellW - 8);

                if (showIndices) {
                    renderer.fillStyle = colors.label;
                    renderer.font = `${fontSize * 0.75}px ${font}`;
                    renderer.textAlign = 'center';
                    renderer.fillText(`[${i}]`, cx + cellW / 2, contentY + cellH + indexH / 2);
                    renderer.font = `${fontSize}px ${font}`;
                }

                renderer.globalAlpha = 1;
            }
        }
    }

    // ─── Stack ───────────────────────────────────────────────────────

    private renderStack(renderer: IRenderer, el: any, isDarkMode: boolean): void {
        const values = this.parseValues(el.text);
        const colors = this.getColors(el, isDarkMode);
        const fontSize = el.fontSize || 14;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const isHorizontal = el.dsDirection === 'horizontal';
        const cornerRadius = Math.min((el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100, el.width / 2, el.height / 2);
        const strokeWidth = el.strokeWidth || 1;

        const padding = 8;
        const hasTitle = !!el.containerText;
        const titleH = hasTitle ? fontSize * 1.8 : 0;
        const markerW = fontSize * 3; // Space for "top →" marker

        // Background
        this.fillBackground(renderer, el, isDarkMode, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = strokeWidth;
        this.drawRoundedRect(renderer, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.stroke();

        // Title
        if (hasTitle) {
            this.drawTitle(renderer, el, isDarkMode, el.y, titleH);
            renderer.strokeStyle = colors.stroke;
            renderer.lineWidth = 0.5;
            renderer.beginPath();
            renderer.moveTo(el.x + padding, el.y + titleH);
            renderer.lineTo(el.x + el.width - padding, el.y + titleH);
            renderer.stroke();
        }

        if (values.length === 0) {
            renderer.font = `${fontSize}px ${font}`;
            renderer.fillStyle = colors.label;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('Double-click to add values', el.x + el.width / 2, el.y + el.height / 2);
            return;
        }

        const n = values.length;
        renderer.font = `${fontSize}px ${font}`;

        if (isHorizontal) {
            // Horizontal stack: last item = top (rightmost)
            const contentX = el.x + padding;
            const contentY = el.y + titleH + padding + fontSize * 1.2; // room for "top" label
            const contentW = el.width - padding * 2;
            const contentH = el.height - titleH - padding * 2 - fontSize * 1.2;
            const cellW = contentW / n;

            // "top →" marker above last cell
            renderer.fillStyle = colors.highlight;
            renderer.font = `bold ${fontSize * 0.8}px ${font}`;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'bottom';
            renderer.fillText('top ↓', contentX + (n - 1) * cellW + cellW / 2, contentY - 2);
            renderer.font = `${fontSize}px ${font}`;

            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cx = contentX + i * cellW;
                const isTopH = i === n - 1;
                const hlState = this.getHighlightState(i, el);
                const cs = this.getCellStyle(hlState !== 'none' ? hlState : (isTopH ? 'primary' : 'none'), colors);

                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, cx + 1, contentY, cellW - 2, contentH, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], cx + cellW / 2, contentY + contentH / 2, cellW - 8);
                renderer.globalAlpha = 1;
            }
        } else {
            // Vertical stack (default): last item in array = top (visually at top)
            const contentX = el.x + markerW + padding;
            const contentY = el.y + titleH + padding;
            const contentW = el.width - markerW - padding * 2;
            const contentH = el.height - titleH - padding * 2;
            const cellH = contentH / n;

            for (let i = 0; i < n; i++) {
                // Render in reverse: last value at top
                const vi = n - 1 - i; // visual index (0 = top)
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cy = contentY + vi * cellH;
                const isTop = i === n - 1;
                const hlState = this.getHighlightState(i, el);
                const cs = this.getCellStyle(hlState !== 'none' ? hlState : (isTop ? 'primary' : 'none'), colors);

                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, contentX, cy + 1, contentW, cellH - 2, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], contentX + contentW / 2, cy + cellH / 2, contentW - 8);

                // "top →" marker
                if (isTop) {
                    renderer.fillStyle = colors.highlight;
                    renderer.font = `bold ${fontSize * 0.8}px ${font}`;
                    renderer.textAlign = 'right';
                    renderer.textBaseline = 'middle';
                    renderer.fillText('top →', contentX - 4, cy + cellH / 2);
                    renderer.font = `${fontSize}px ${font}`;
                }

                renderer.globalAlpha = 1;
            }
        }
    }

    // ─── Queue ───────────────────────────────────────────────────────

    private renderQueue(renderer: IRenderer, el: any, isDarkMode: boolean): void {
        const values = this.parseValues(el.text);
        const colors = this.getColors(el, isDarkMode);
        const fontSize = el.fontSize || 14;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const isVertical = el.dsDirection === 'vertical';
        const cornerRadius = Math.min((el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100, el.width / 2, el.height / 2);
        const strokeWidth = el.strokeWidth || 1;

        const padding = 8;
        const hasTitle = !!el.containerText;
        const titleH = hasTitle ? fontSize * 1.8 : 0;
        const markerH = fontSize * 1.4; // Space for front/back markers

        // Background
        this.fillBackground(renderer, el, isDarkMode, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = strokeWidth;
        this.drawRoundedRect(renderer, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.stroke();

        // Title
        if (hasTitle) {
            this.drawTitle(renderer, el, isDarkMode, el.y, titleH);
            renderer.strokeStyle = colors.stroke;
            renderer.lineWidth = 0.5;
            renderer.beginPath();
            renderer.moveTo(el.x + padding, el.y + titleH);
            renderer.lineTo(el.x + el.width - padding, el.y + titleH);
            renderer.stroke();
        }

        if (values.length === 0) {
            renderer.font = `${fontSize}px ${font}`;
            renderer.fillStyle = colors.label;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('Double-click to add values', el.x + el.width / 2, el.y + el.height / 2);
            return;
        }

        const n = values.length;
        renderer.font = `${fontSize}px ${font}`;

        if (isVertical) {
            const contentX = el.x + padding;
            const markerW = fontSize * 3.5;
            const contentW = el.width - padding * 2 - markerW;
            const contentY = el.y + titleH + padding;
            const contentH = el.height - titleH - padding * 2;
            const cellH = contentH / n;

            // "front" marker at top
            renderer.fillStyle = colors.highlight;
            renderer.font = `bold ${fontSize * 0.75}px ${font}`;
            renderer.textAlign = 'left';
            renderer.textBaseline = 'middle';
            renderer.fillText('front →', contentX + contentW + 4, contentY + cellH / 2);
            // "back" marker at bottom
            renderer.fillText('back →', contentX + contentW + 4, contentY + (n - 1) * cellH + cellH / 2);
            renderer.font = `${fontSize}px ${font}`;

            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cy = contentY + i * cellH;
                const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, contentX, cy + 1, contentW, cellH - 2, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], contentX + contentW / 2, cy + cellH / 2, contentW - 8);
                renderer.globalAlpha = 1;
            }
        } else {
            // Horizontal (default)
            const contentX = el.x + padding;
            const contentY = el.y + titleH + markerH + padding;
            const contentW = el.width - padding * 2;
            const contentH = el.height - titleH - markerH - padding * 2;
            const cellW = contentW / n;

            // "front" marker above first cell
            renderer.fillStyle = colors.highlight;
            renderer.font = `bold ${fontSize * 0.75}px ${font}`;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'bottom';
            renderer.fillText('front ↓', contentX + cellW / 2, contentY - 2);
            // "back" marker above last cell
            renderer.fillText('back ↓', contentX + (n - 1) * cellW + cellW / 2, contentY - 2);
            renderer.font = `${fontSize}px ${font}`;

            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cx = contentX + i * cellW;
                const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, cx + 1, contentY, cellW - 2, contentH, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], cx + cellW / 2, contentY + contentH / 2, cellW - 8);
                renderer.globalAlpha = 1;
            }
        }
    }

    // ─── Linked List ─────────────────────────────────────────────────

    private renderLinkedList(renderer: IRenderer, el: any, isDarkMode: boolean): void {
        const values = this.parseValues(el.text);
        const colors = this.getColors(el, isDarkMode);
        const fontSize = el.fontSize || 14;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const isVertical = el.dsDirection === 'vertical';
        const cornerRadius = Math.min((el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100, el.width / 2, el.height / 2);
        const strokeWidth = el.strokeWidth || 1;

        const padding = 8;
        const hasTitle = !!el.containerText;
        const titleH = hasTitle ? fontSize * 1.8 : 0;

        // Background
        this.fillBackground(renderer, el, isDarkMode, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = strokeWidth;
        this.drawRoundedRect(renderer, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.stroke();

        // Title
        if (hasTitle) {
            this.drawTitle(renderer, el, isDarkMode, el.y, titleH);
            renderer.strokeStyle = colors.stroke;
            renderer.lineWidth = 0.5;
            renderer.beginPath();
            renderer.moveTo(el.x + padding, el.y + titleH);
            renderer.lineTo(el.x + el.width - padding, el.y + titleH);
            renderer.stroke();
        }

        if (values.length === 0) {
            renderer.font = `${fontSize}px ${font}`;
            renderer.fillStyle = colors.label;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('Double-click to add values', el.x + el.width / 2, el.y + el.height / 2);
            return;
        }

        const n = values.length;
        renderer.font = `${fontSize}px ${font}`;

        if (isVertical) {
            const contentX = el.x + padding;
            const contentY = el.y + titleH + padding;
            const contentW = el.width - padding * 2;
            const arrowH = fontSize * 0.8;
            const totalH = el.height - titleH - padding * 2;
            const cellH = (totalH - arrowH * (n - 1)) / n;
            const nodeW = contentW * 0.7;
            const ptrW = contentW * 0.3;
            const nodeX = contentX + (contentW - nodeW - ptrW) / 2;

            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cy = contentY + i * (cellH + arrowH);
                const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

                // Value box
                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, nodeX, cy, nodeW, cellH, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                // Pointer box
                renderer.fillStyle = cs.bg !== colors.itemBg ? cs.bg : RenderPipeline.adjustColor('#cbd5e1', isDarkMode);
                renderer.fillRect(nodeX + nodeW, cy, ptrW, cellH);
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = 0.5;
                renderer.strokeRect(nodeX + nodeW, cy, ptrW, cellH);

                // Value text
                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], nodeX + nodeW / 2, cy + cellH / 2, nodeW - 8);

                // Pointer symbol or null
                if (i < n - 1) {
                    // Dot
                    renderer.fillStyle = colors.stroke;
                    renderer.beginPath();
                    renderer.arc(nodeX + nodeW + ptrW / 2, cy + cellH / 2, 3, 0, Math.PI * 2);
                    renderer.fill();

                    // Arrow down to next node
                    const arrowStartY = cy + cellH;
                    const arrowEndY = cy + cellH + arrowH;
                    const arrowX = nodeX + nodeW + ptrW / 2;
                    renderer.strokeStyle = colors.stroke;
                    renderer.lineWidth = 1.5;
                    renderer.beginPath();
                    renderer.moveTo(arrowX, arrowStartY);
                    renderer.lineTo(arrowX, arrowEndY);
                    renderer.stroke();
                    // Arrowhead
                    renderer.beginPath();
                    renderer.moveTo(arrowX - 4, arrowEndY - 6);
                    renderer.lineTo(arrowX, arrowEndY);
                    renderer.lineTo(arrowX + 4, arrowEndY - 6);
                    renderer.stroke();
                } else {
                    // Null symbol (X)
                    renderer.strokeStyle = colors.label;
                    renderer.lineWidth = 1.5;
                    const nx = nodeX + nodeW + ptrW * 0.25;
                    const ny = cy + cellH * 0.25;
                    const nw = ptrW * 0.5;
                    const nh = cellH * 0.5;
                    renderer.beginPath();
                    renderer.moveTo(nx, ny);
                    renderer.lineTo(nx + nw, ny + nh);
                    renderer.moveTo(nx + nw, ny);
                    renderer.lineTo(nx, ny + nh);
                    renderer.stroke();
                }

                renderer.globalAlpha = 1;
            }
        } else {
            // Horizontal (default)
            const contentX = el.x + padding;
            const contentY = el.y + titleH + padding;
            const contentH = el.height - titleH - padding * 2;
            const arrowW = fontSize * 1.2;
            const totalW = el.width - padding * 2;
            const cellW = (totalW - arrowW * (n - 1)) / n;
            const nodeH = contentH * 0.6;
            const ptrW = cellW * 0.25;
            const nodeW = cellW - ptrW;
            const nodeY = contentY + (contentH - nodeH) / 2;

            for (let i = 0; i < n; i++) {
                const alpha = this.getItemAlpha(i, n, el);
                if (alpha <= 0) continue;
                renderer.globalAlpha = alpha;

                const cx = contentX + i * (cellW + arrowW);
                const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

                // Value box
                renderer.fillStyle = cs.bg;
                this.drawRoundedRect(renderer, cx, nodeY, nodeW, nodeH, 3);
                renderer.fill();
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = cs.sw;
                renderer.stroke();

                // Pointer box
                renderer.fillStyle = cs.bg !== colors.itemBg ? cs.bg : RenderPipeline.adjustColor('#cbd5e1', isDarkMode);
                renderer.fillRect(cx + nodeW, nodeY, ptrW, nodeH);
                renderer.strokeStyle = cs.stroke;
                renderer.lineWidth = 0.5;
                renderer.strokeRect(cx + nodeW, nodeY, ptrW, nodeH);

                // Value text
                renderer.fillStyle = cs.text;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(values[i], cx + nodeW / 2, nodeY + nodeH / 2, nodeW - 6);

                // Pointer or null
                if (i < n - 1) {
                    // Dot in pointer box
                    renderer.fillStyle = colors.stroke;
                    renderer.beginPath();
                    renderer.arc(cx + nodeW + ptrW / 2, nodeY + nodeH / 2, 3, 0, Math.PI * 2);
                    renderer.fill();

                    // Arrow to next node
                    const arrowStartX = cx + cellW;
                    const arrowEndX = cx + cellW + arrowW;
                    const arrowY = nodeY + nodeH / 2;
                    renderer.strokeStyle = colors.stroke;
                    renderer.lineWidth = 1.5;
                    renderer.beginPath();
                    renderer.moveTo(arrowStartX, arrowY);
                    renderer.lineTo(arrowEndX, arrowY);
                    renderer.stroke();
                    // Arrowhead
                    renderer.beginPath();
                    renderer.moveTo(arrowEndX - 6, arrowY - 4);
                    renderer.lineTo(arrowEndX, arrowY);
                    renderer.lineTo(arrowEndX - 6, arrowY + 4);
                    renderer.stroke();
                } else {
                    // Null symbol (X)
                    renderer.strokeStyle = colors.label;
                    renderer.lineWidth = 1.5;
                    const nx = cx + nodeW + ptrW * 0.2;
                    const ny = nodeY + nodeH * 0.2;
                    const nw = ptrW * 0.6;
                    const nh = nodeH * 0.6;
                    renderer.beginPath();
                    renderer.moveTo(nx, ny);
                    renderer.lineTo(nx + nw, ny + nh);
                    renderer.moveTo(nx + nw, ny);
                    renderer.lineTo(nx, ny + nh);
                    renderer.stroke();
                }

                renderer.globalAlpha = 1;
            }
        }
    }

    // ─── Binary Tree ─────────────────────────────────────────────────

    private renderBinaryTree(renderer: IRenderer, el: any, isDarkMode: boolean): void {
        const values = this.parseValues(el.text);
        const colors = this.getColors(el, isDarkMode);
        const fontSize = el.fontSize || 14;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const cornerRadius = Math.min((el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100, el.width / 2, el.height / 2);
        const strokeWidth = el.strokeWidth || 1;

        const padding = 8;
        const hasTitle = !!el.containerText;
        const titleH = hasTitle ? fontSize * 1.8 : 0;

        // Background
        this.fillBackground(renderer, el, isDarkMode, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = strokeWidth;
        this.drawRoundedRect(renderer, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.stroke();

        // Title
        if (hasTitle) {
            this.drawTitle(renderer, el, isDarkMode, el.y, titleH);
            renderer.strokeStyle = colors.stroke;
            renderer.lineWidth = 0.5;
            renderer.beginPath();
            renderer.moveTo(el.x + padding, el.y + titleH);
            renderer.lineTo(el.x + el.width - padding, el.y + titleH);
            renderer.stroke();
        }

        if (values.length === 0) {
            renderer.font = `${fontSize}px ${font}`;
            renderer.fillStyle = colors.label;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('Double-click to add values', el.x + el.width / 2, el.y + el.height / 2);
            return;
        }

        // Compute tree layout: heap array representation
        const n = values.length;
        const depth = Math.floor(Math.log2(n)) + 1;
        const contentX = el.x + padding;
        const contentY = el.y + titleH + padding;
        const contentW = el.width - padding * 2;
        const contentH = el.height - titleH - padding * 2;

        const nodeRadius = Math.min(fontSize * 1.5, contentW / (Math.pow(2, depth) * 1.5), contentH / (depth * 2.2));
        const levelH = contentH / depth;

        renderer.font = `${fontSize * 0.9}px ${font}`;

        // Compute node positions
        const positions: { x: number; y: number }[] = [];
        for (let i = 0; i < n; i++) {
            const level = Math.floor(Math.log2(i + 1));
            const indexInLevel = i - (Math.pow(2, level) - 1);
            const nodesInLevel = Math.pow(2, level);
            const xSpacing = contentW / (nodesInLevel + 1);
            const nx = contentX + xSpacing * (indexInLevel + 1);
            const ny = contentY + level * levelH + levelH / 2;
            positions.push({ x: nx, y: ny });
        }

        // Draw edges first (so nodes draw on top)
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = 1.5;
        for (let i = 0; i < n; i++) {
            if (values[i] === '_') continue;
            const leftChild = 2 * i + 1;
            const rightChild = 2 * i + 2;

            if (leftChild < n && values[leftChild] !== '_') {
                const parentAlpha = this.getItemAlpha(i, n, el);
                const childAlpha = this.getItemAlpha(leftChild, n, el);
                const alpha = Math.min(parentAlpha, childAlpha);
                if (alpha > 0) {
                    renderer.globalAlpha = alpha;
                    renderer.beginPath();
                    renderer.moveTo(positions[i].x, positions[i].y + nodeRadius);
                    renderer.lineTo(positions[leftChild].x, positions[leftChild].y - nodeRadius);
                    renderer.stroke();
                    renderer.globalAlpha = 1;
                }
            }

            if (rightChild < n && values[rightChild] !== '_') {
                const parentAlpha = this.getItemAlpha(i, n, el);
                const childAlpha = this.getItemAlpha(rightChild, n, el);
                const alpha = Math.min(parentAlpha, childAlpha);
                if (alpha > 0) {
                    renderer.globalAlpha = alpha;
                    renderer.beginPath();
                    renderer.moveTo(positions[i].x, positions[i].y + nodeRadius);
                    renderer.lineTo(positions[rightChild].x, positions[rightChild].y - nodeRadius);
                    renderer.stroke();
                    renderer.globalAlpha = 1;
                }
            }
        }

        // Draw nodes
        for (let i = 0; i < n; i++) {
            if (values[i] === '_') continue;
            const alpha = this.getItemAlpha(i, n, el);
            if (alpha <= 0) continue;
            renderer.globalAlpha = alpha;

            const { x: nx, y: ny } = positions[i];
            const cs = this.getCellStyle(this.getHighlightState(i, el), colors);

            // Node circle
            renderer.fillStyle = cs.bg;
            renderer.beginPath();
            renderer.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
            renderer.fill();
            renderer.strokeStyle = cs.stroke;
            renderer.lineWidth = cs.sw;
            renderer.stroke();

            // Value text
            renderer.fillStyle = cs.text;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText(values[i], nx, ny, nodeRadius * 1.8);

            renderer.globalAlpha = 1;
        }
    }

    // ─── Hash Table ──────────────────────────────────────────────────

    private simpleHash(key: string, capacity: number): number {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash * 31 + key.charCodeAt(i)) | 0;
        }
        return Math.abs(hash) % capacity;
    }

    private renderHashTable(renderer: IRenderer, el: any, isDarkMode: boolean): void {
        const colors = this.getColors(el, isDarkMode);
        const fontSize = el.fontSize || 14;
        const font = resolveFontFamily(el.fontFamily || 'code');
        const cornerRadius = Math.min((el.borderRadius ?? 4) * Math.min(el.width, el.height) / 100, el.width / 2, el.height / 2);
        const strokeWidth = el.strokeWidth || 1;
        const capacity = el.dsCapacity || 5;
        const showIndices = el.dsShowIndices ?? true;

        const padding = 8;
        const hasTitle = !!el.containerText;
        const titleH = hasTitle ? fontSize * 1.8 : 0;

        // Background
        this.fillBackground(renderer, el, isDarkMode, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.strokeStyle = colors.stroke;
        renderer.lineWidth = strokeWidth;
        this.drawRoundedRect(renderer, el.x, el.y, el.width, el.height, cornerRadius);
        renderer.stroke();

        // Title
        if (hasTitle) {
            this.drawTitle(renderer, el, isDarkMode, el.y, titleH);
            renderer.strokeStyle = colors.stroke;
            renderer.lineWidth = 0.5;
            renderer.beginPath();
            renderer.moveTo(el.x + padding, el.y + titleH);
            renderer.lineTo(el.x + el.width - padding, el.y + titleH);
            renderer.stroke();
        }

        // Parse key:value pairs and hash them into buckets
        const rawValues = this.parseValues(el.text);
        const buckets: { key: string; value: string }[][] = Array.from({ length: capacity }, () => []);

        for (const item of rawValues) {
            const colonIdx = item.indexOf(':');
            if (colonIdx > 0) {
                const key = item.substring(0, colonIdx).trim();
                const value = item.substring(colonIdx + 1).trim();
                const bucket = this.simpleHash(key, capacity);
                buckets[bucket].push({ key, value });
            } else {
                // No colon — treat entire value as key
                const bucket = this.simpleHash(item, capacity);
                buckets[bucket].push({ key: item, value: '' });
            }
        }

        const contentX = el.x + padding;
        const contentY = el.y + titleH + padding;
        const contentW = el.width - padding * 2;
        const contentH = el.height - titleH - padding * 2;
        const rowH = contentH / capacity;
        const gutterW = showIndices ? fontSize * 2 : 0;
        const valueX = contentX + gutterW;
        const valueW = contentW - gutterW;

        renderer.font = `${fontSize}px ${font}`;

        for (let b = 0; b < capacity; b++) {
            const alpha = this.getItemAlpha(b, capacity, el);
            if (alpha <= 0) continue;
            renderer.globalAlpha = alpha;

            const ry = contentY + b * rowH;
            const cs = this.getCellStyle(this.getHighlightState(b, el), colors);

            // Bucket index
            if (showIndices) {
                renderer.fillStyle = RenderPipeline.adjustColor('#1a2332', isDarkMode);
                renderer.fillRect(contentX, ry + 1, gutterW - 2, rowH - 2);
                renderer.strokeStyle = colors.stroke;
                renderer.lineWidth = 0.5;
                renderer.strokeRect(contentX, ry + 1, gutterW - 2, rowH - 2);

                renderer.fillStyle = colors.label;
                renderer.textAlign = 'center';
                renderer.textBaseline = 'middle';
                renderer.fillText(String(b), contentX + gutterW / 2, ry + rowH / 2);
            }

            // Value area
            renderer.fillStyle = cs.bg;
            this.drawRoundedRect(renderer, valueX, ry + 1, valueW, rowH - 2, 2);
            renderer.fill();
            renderer.strokeStyle = cs.stroke;
            renderer.lineWidth = cs.sw;
            renderer.stroke();

            // Bucket contents
            if (buckets[b].length === 0) {
                renderer.fillStyle = colors.label;
                renderer.textAlign = 'left';
                renderer.textBaseline = 'middle';
                renderer.font = `italic ${fontSize * 0.85}px ${font}`;
                renderer.fillText('empty', valueX + 8, ry + rowH / 2);
                renderer.font = `${fontSize}px ${font}`;
            } else {
                const text = buckets[b].map(e => e.value ? `${e.key}:${e.value}` : e.key).join(' → ');
                renderer.fillStyle = cs.text;
                renderer.textAlign = 'left';
                renderer.textBaseline = 'middle';
                renderer.fillText(text, valueX + 8, ry + rowH / 2, valueW - 16);
            }

            renderer.globalAlpha = 1;
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
