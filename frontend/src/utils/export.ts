import { store } from "../store/app-store";
import { renderElement } from "./render-element";
import rough from 'roughjs/bin/rough';
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import { resolveFontFamily, wrapText, getMeasurementRenderer } from "./text-utils";
import { buildFilterString } from "./image-filter-utils";
import { layoutRichText } from "./rich-text-utils";


export const exportToPng = async (scale: number, background: boolean, onlySelected: boolean) => {
    let elements = store.elements;
    if (onlySelected) {
        if (store.selection.length === 0) return; // Nothing to export
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    // Calculate Bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    // Padding
    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (background) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    // Render
    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElement(rc, ctx, el);
    });

    // Download
    const link = document.createElement('a');
    link.download = 'yappy_drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

export const exportToJpg = async (scale: number, onlySelected: boolean) => {
    let elements = store.elements;
    if (onlySelected) {
        if (store.selection.length === 0) return;
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // JPEG has no transparency — always white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElement(rc, ctx, el);
    });

    const link = document.createElement('a');
    link.download = 'yappy_drawing.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
};

export const copyCanvasAsPng = async (scale: number) => {
    const elements = store.elements;
    if (elements.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElement(rc, ctx, el);
    });

    canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
        } catch (_) {
            // Clipboard API may not be available in all contexts
        }
    }, 'image/png');
};

export const exportToSvg = (onlySelected: boolean) => {
    let elements = store.elements;
    if (onlySelected) {
        if (store.selection.length === 0) return;
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    // Calculate Bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.backgroundColor = '#ffffff'; // Optional: white bg

    // Embed Google Fonts for accurate text rendering in standalone SVG
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const fontStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    fontStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=Handlee&family=Inter:wght@400;700&family=Source+Code+Pro:wght@400;700&family=Caveat:wght@400;700&family=Poppins:wght@400;700&family=Merriweather:wght@400;700&family=Permanent+Marker&family=JetBrains+Mono:wght@400;700&display=swap');`;
    defs.appendChild(fontStyle);
    svg.appendChild(defs);

    const rc = rough.svg(svg);

    // Group for Translation
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${-minX + padding}, ${-minY + padding})`);
    svg.appendChild(g);

    elements.forEach(el => {
        let node: SVGElement | null = null;
        let isCanvasFallback = false;

        // Options
        const options: any = {
            seed: el.seed,
            roughness: el.roughness,
            stroke: el.strokeColor,
            strokeWidth: el.strokeWidth,
            fill: el.backgroundColor === 'transparent' ? undefined : el.backgroundColor,
            fillStyle: el.fillStyle,
            strokeLineDash: el.strokeStyle === 'dashed' ? [10, 10] : (el.strokeStyle === 'dotted' ? [5, 10] : undefined),
        };

        if (el.type === 'rectangle') {
            node = rc.rectangle(el.x, el.y, el.width, el.height, options);
        } else if (el.type === 'circle') {
            node = rc.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.abs(el.width), Math.abs(el.height), options);
        } else if (el.type === 'diamond') {
            const dcx = el.x + el.width / 2;
            const dcy = el.y + el.height / 2;
            node = rc.polygon([
                [dcx, el.y],
                [el.x + el.width, dcy],
                [dcx, el.y + el.height],
                [el.x, dcy]
            ], options);
        } else if (el.type === 'line' || el.type === 'arrow') {
            const endX = el.x + el.width;
            const endY = el.y + el.height;

            if (el.type === 'arrow') {
                const arrowG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                arrowG.appendChild(rc.line(el.x, el.y, endX, endY, options));

                const angle = Math.atan2(el.height, el.width);
                const startHeadLen = el.startArrowheadSize || 28;
                const endHeadLen = el.endArrowheadSize || 28;

                if (el.startArrowhead) {
                    const p1 = { x: el.x - startHeadLen * Math.cos(angle + Math.PI - Math.PI / 6), y: el.y - startHeadLen * Math.sin(angle + Math.PI - Math.PI / 6) };
                    const p2 = { x: el.x - startHeadLen * Math.cos(angle + Math.PI + Math.PI / 6), y: el.y - startHeadLen * Math.sin(angle + Math.PI + Math.PI / 6) };
                    arrowG.appendChild(rc.line(el.x, el.y, p1.x, p1.y, options));
                    arrowG.appendChild(rc.line(el.x, el.y, p2.x, p2.y, options));
                }

                if (el.endArrowhead || (!el.startArrowhead && !el.endArrowhead)) { // Default to end arrow if none specified for legacy
                    const p1 = { x: endX - endHeadLen * Math.cos(angle - Math.PI / 6), y: endY - endHeadLen * Math.sin(angle - Math.PI / 6) };
                    const p2 = { x: endX - endHeadLen * Math.cos(angle + Math.PI / 6), y: endY - endHeadLen * Math.sin(angle + Math.PI / 6) };
                    arrowG.appendChild(rc.line(endX, endY, p1.x, p1.y, options));
                    arrowG.appendChild(rc.line(endX, endY, p2.x, p2.y, options));
                }
                node = arrowG;
            } else {
                node = rc.line(el.x, el.y, endX, endY, options);
            }
        } else if ((el.type === 'text' || el.type === 'richtext') && (el.text || (el.richText && el.richText.length > 0))) {
            const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const fontSize = el.fontSize || 20;
            const fontFamily = resolveFontFamily(el.fontFamily);
            const textColor = el.textColor || el.strokeColor;
            const textAlign = el.textAlign || 'left';
            const padding = 4;

            // Rich text path
            if (el.richText && el.richText.length > 0) {
                const measureRenderer = getMeasurementRenderer();
                const availableWidth = Math.max(el.width - padding * 2, 20);
                const defaults = { fontSize, fontFamily: el.fontFamily || 'sans-serif' };
                const layout = layoutRichText(measureRenderer, el.richText, availableWidth, defaults);
                const verticalPadding = Math.max(0, (el.height - layout.totalHeight) / 2);

                let lineY = el.y + verticalPadding;
                for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
                    const lineHeight = layout.lineHeights[lineIdx];
                    const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);
                    let lineWidth = 0;
                    if (lineSegments.length > 0) {
                        const last = lineSegments[lineSegments.length - 1];
                        lineWidth = last.x + last.width;
                    }

                    let xOffset: number;
                    if (textAlign === 'center') xOffset = el.x + (el.width - lineWidth) / 2;
                    else if (textAlign === 'right') xOffset = el.x + el.width - padding - lineWidth;
                    else xOffset = el.x + padding;

                    const baselineY = lineY + lineHeight * 0.75;

                    // Create a <text> per line with <tspan> per segment
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.setAttribute('y', `${baselineY}`);

                    for (const seg of lineSegments) {
                        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        tspan.textContent = seg.text;
                        tspan.setAttribute('x', `${xOffset + seg.x}`);
                        tspan.setAttribute('fill', seg.span.color || textColor);
                        tspan.setAttribute('font-family', resolveFontFamily(seg.span.fontFamily || el.fontFamily));
                        tspan.setAttribute('font-size', `${seg.span.fontSize || fontSize}px`);
                        if (seg.span.bold) tspan.setAttribute('font-weight', 'bold');
                        if (seg.span.italic) tspan.setAttribute('font-style', 'italic');
                        const deco: string[] = [];
                        if (seg.span.underline) deco.push('underline');
                        if (seg.span.strikethrough) deco.push('line-through');
                        if (deco.length) tspan.setAttribute('text-decoration', deco.join(' '));
                        textEl.appendChild(tspan);
                    }
                    textGroup.appendChild(textEl);
                    lineY += lineHeight;
                }
            } else {
                // Plain text path (original)
                const fontWeight = (el.fontWeight === true || el.fontWeight === 'bold') ? 'bold' : 'normal';
                const fontStyleStr = (el.fontStyle === true || el.fontStyle === 'italic') ? 'italic' : 'normal';
                const lineHeight = fontSize * 1.2;
                const measureRenderer = getMeasurementRenderer();
                measureRenderer.font = `${fontStyleStr === 'italic' ? 'italic ' : ''}${fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
                const availableWidth = Math.max(el.width - padding * 2, 20);
                const paragraphs = el.text!.split('\n');
                const lines: string[] = [];
                paragraphs.forEach(para => {
                    if (para === '') lines.push('');
                    else lines.push(...wrapText(measureRenderer, para, availableWidth));
                });

                let textAnchor = 'start';
                let xPos = el.x + padding;
                if (textAlign === 'center') { textAnchor = 'middle'; xPos = el.x + el.width / 2; }
                else if (textAlign === 'right') { textAnchor = 'end'; xPos = el.x + el.width - padding; }

                const totalTextHeight = lines.length * lineHeight;
                const verticalPadding = Math.max(0, (el.height - totalTextHeight) / 2);

                lines.forEach((line, index) => {
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.textContent = line || '\u00A0';
                    textEl.setAttribute('x', `${xPos}`);
                    textEl.setAttribute('y', `${el.y + verticalPadding + index * lineHeight + fontSize}`);
                    textEl.setAttribute('fill', textColor);
                    textEl.setAttribute('font-family', fontFamily);
                    textEl.setAttribute('font-size', `${fontSize}px`);
                    textEl.setAttribute('font-weight', fontWeight);
                    textEl.setAttribute('font-style', fontStyleStr);
                    textEl.setAttribute('text-anchor', textAnchor);
                    textGroup.appendChild(textEl);
                });
            }
            node = textGroup;
        } else if ((el.type === 'fineliner' || el.type === 'inkbrush' || el.type === 'marker' || el.type === 'ink') && el.points) {
            // Helper to normalize
            let points: { x: number, y: number }[] = [];
            if (el.pointsEncoding === 'flat') {
                const flat = el.points as number[];
                for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] });
            } else {
                points = el.points as { x: number, y: number }[];
            }
            if (points.length > 1) {
                // Simplified SVG Path for these tools
                // Ideally we duplicate the exact bezier logic from renderElement.ts, 
                // but for now a simple polyline or standard curve is better than nothing.
                // Or better: use roughjs linearPath or curve
                const absPoints = points.map(p => [el.x + p.x, el.y + p.y] as [number, number]);
                node = rc.curve(absPoints, options);
            }
        } else if (el.type === 'image' && el.dataURL && !el.crop) {
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', el.dataURL);
            image.setAttribute('x', `${el.x}`);
            image.setAttribute('y', `${el.y}`);
            image.setAttribute('width', `${el.width}`);
            image.setAttribute('height', `${el.height}`);
            // Apply CSS filter if any image filter properties are set
            const filterStr = buildFilterString(el);
            if (filterStr !== 'none') {
                image.setAttribute('style', `filter: ${filterStr}`);
            }
            node = image;
        } else if (el.type === 'video' && (el.videoPosterDataURL || el.videoPosterURL)) {
            // Export video as poster frame image
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', el.videoPosterDataURL || el.videoPosterURL!);
            image.setAttribute('x', `${el.x}`);
            image.setAttribute('y', `${el.y}`);
            image.setAttribute('width', `${el.width}`);
            image.setAttribute('height', `${el.height}`);
            node = image;
        }

        // Canvas fallback for shape types without native SVG rendering
        // Renders the element via the canvas pipeline and embeds as a raster image
        if (!node && el.type !== 'text') {
            const absW = Math.abs(el.width);
            const absH = Math.abs(el.height);
            if (absW > 0 && absH > 0) {
                isCanvasFallback = true;
                const fbScale = 2; // 2x for crisp rendering
                let pad = Math.max(30, (el.strokeWidth || 2) * 3);
                // Extra padding for rotation (rotated shapes extend beyond original bounds)
                if (el.angle) {
                    pad += Math.ceil((Math.sqrt(absW * absW + absH * absH) - Math.min(absW, absH)) / 2);
                }
                // Extra padding for drop shadows
                if (el.shadowEnabled) {
                    pad += (el.shadowBlur || 10) + Math.max(Math.abs(el.shadowOffsetX || 0), Math.abs(el.shadowOffsetY || 0));
                }

                const minElX = Math.min(el.x, el.x + el.width);
                const minElY = Math.min(el.y, el.y + el.height);

                const fbCanvas = document.createElement('canvas');
                fbCanvas.width = (absW + pad * 2) * fbScale;
                fbCanvas.height = (absH + pad * 2) * fbScale;
                const tmpCtx = fbCanvas.getContext('2d');
                if (tmpCtx) {
                    tmpCtx.scale(fbScale, fbScale);
                    tmpCtx.translate(-minElX + pad, -minElY + pad);
                    const tmpRc = rough.canvas(fbCanvas);
                    renderElement(tmpRc, tmpCtx, el);

                    const fbImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                    fbImage.setAttribute('href', fbCanvas.toDataURL('image/png'));
                    fbImage.setAttribute('x', `${minElX - pad}`);
                    fbImage.setAttribute('y', `${minElY - pad}`);
                    fbImage.setAttribute('width', `${absW + pad * 2}`);
                    fbImage.setAttribute('height', `${absH + pad * 2}`);
                    node = fbImage;
                }
            }
        }

        // Render containerText inside shapes (rectangles, circles, etc.)
        // Skip for canvas fallback shapes — container text is already rendered by the canvas pipeline
        if (node && !isCanvasFallback && (el.containerText || (el.richContainerText && el.richContainerText.length > 0)) && el.type !== 'text') {
            const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            wrapper.appendChild(node);

            const fontSize = el.fontSize || 16;
            const fontFamily = resolveFontFamily(el.fontFamily);
            const textColor = el.textColor || el.strokeColor;
            const textAlign = el.textAlign || 'center';
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const maxWidth = el.width - 20;

            if (el.richContainerText && el.richContainerText.length > 0) {
                // Rich text path
                const measureRenderer = getMeasurementRenderer();
                const defaults = { fontSize, fontFamily: el.fontFamily || 'hand-drawn' };
                const layout = layoutRichText(measureRenderer, el.richContainerText, maxWidth, defaults);
                const startY = cy - layout.totalHeight / 2;

                let lineY = startY;
                for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
                    const lineHeight = layout.lineHeights[lineIdx];
                    const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);
                    let lineWidth = 0;
                    if (lineSegments.length > 0) {
                        const last = lineSegments[lineSegments.length - 1];
                        lineWidth = last.x + last.width;
                    }

                    let xOffset: number;
                    if (textAlign === 'left') xOffset = cx - maxWidth / 2;
                    else if (textAlign === 'right') xOffset = cx + maxWidth / 2 - lineWidth;
                    else xOffset = cx - lineWidth / 2;

                    const baselineY = lineY + lineHeight * 0.75;
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.setAttribute('y', `${baselineY}`);

                    for (const seg of lineSegments) {
                        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        tspan.textContent = seg.text;
                        tspan.setAttribute('x', `${xOffset + seg.x}`);
                        tspan.setAttribute('fill', seg.span.color || textColor);
                        tspan.setAttribute('font-family', resolveFontFamily(seg.span.fontFamily || el.fontFamily));
                        tspan.setAttribute('font-size', `${seg.span.fontSize || fontSize}px`);
                        if (seg.span.bold) tspan.setAttribute('font-weight', 'bold');
                        if (seg.span.italic) tspan.setAttribute('font-style', 'italic');
                        const deco: string[] = [];
                        if (seg.span.underline) deco.push('underline');
                        if (seg.span.strikethrough) deco.push('line-through');
                        if (deco.length) tspan.setAttribute('text-decoration', deco.join(' '));
                        textEl.appendChild(tspan);
                    }
                    wrapper.appendChild(textEl);
                    lineY += lineHeight;
                }
            } else if (el.containerText) {
                // Plain text path (original)
                const lineHeight = fontSize * 1.2;
                const measureRenderer = getMeasurementRenderer();
                measureRenderer.font = `${fontSize}px ${fontFamily}`;
                const paragraphs = el.containerText.split('\n');
                const lines: string[] = [];
                paragraphs.forEach(para => {
                    if (para === '') lines.push('');
                    else lines.push(...wrapText(measureRenderer, para, maxWidth));
                });

                let textAnchor = 'middle';
                let xPos = cx;
                if (textAlign === 'left') { textAnchor = 'start'; xPos = el.x + 10; }
                else if (textAlign === 'right') { textAnchor = 'end'; xPos = el.x + el.width - 10; }

                const totalHeight = lines.length * lineHeight;
                const startY = cy - totalHeight / 2 + lineHeight / 2;

                lines.forEach((line, index) => {
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.textContent = line || '\u00A0';
                    textEl.setAttribute('x', `${xPos}`);
                    textEl.setAttribute('y', `${startY + index * lineHeight}`);
                    textEl.setAttribute('fill', textColor);
                    textEl.setAttribute('font-family', fontFamily);
                    textEl.setAttribute('font-size', `${fontSize}px`);
                    textEl.setAttribute('text-anchor', textAnchor);
                    textEl.setAttribute('dominant-baseline', 'central');
                    wrapper.appendChild(textEl);
                });
            }
            node = wrapper;
        }

        if (node) {
            if (!isCanvasFallback) {
                // Apply SVG-level properties for natively rendered shapes
                // Canvas fallback shapes already have opacity, rotation, flip baked in
                node.setAttribute('opacity', `${(el.opacity ?? 100) / 100}`);
                const transforms: string[] = [];
                if (el.angle) {
                    const tcx = el.x + el.width / 2;
                    const tcy = el.y + el.height / 2;
                    transforms.push(`rotate(${el.angle * (180 / Math.PI)}, ${tcx}, ${tcy})`);
                }
                if (el.flipX || el.flipY) {
                    const tcx = el.x + el.width / 2;
                    const tcy = el.y + el.height / 2;
                    transforms.push(`translate(${tcx}, ${tcy}) scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1}) translate(${-tcx}, ${-tcy})`);
                }
                if (transforms.length > 0) {
                    node.setAttribute('transform', transforms.join(' '));
                }
            }
            g.appendChild(node);
        }
    });

    const s = new XMLSerializer();
    const str = s.serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'yappy_drawing.svg';
    link.href = url;
    link.click();
};

export const exportToPdf = async (scale: number, background: boolean, onlySelected: boolean) => {
    const allElements = store.elements;
    if (allElements.length === 0) return;

    const isSlides = store.docType === 'slides' && store.slides.length > 0 && !onlySelected;

    if (isSlides) {
        // Multi-page: one page per slide
        const sortedSlides = [...store.slides].sort((a, b) => a.order - b.order);
        const firstSlide = sortedSlides[0];
        const { width: pw, height: ph } = firstSlide.dimensions;
        const orientation = pw >= ph ? 'landscape' : 'portrait';

        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [pw, ph],
            hotfixes: ['px_scaling'],
        });

        for (let i = 0; i < sortedSlides.length; i++) {
            const slide = sortedSlides[i];
            const { width: sW, height: sH } = slide.dimensions;
            const { x: sX, y: sY } = slide.spatialPosition;

            // Filter elements whose center falls on this slide
            const slideElements = allElements.filter(el => {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
            });

            // Create offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = sW * scale;
            canvas.height = sH * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // Background
            if (background) {
                ctx.fillStyle = slide.backgroundColor || (store.theme !== 'light' ? '#121212' : '#ffffff');
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.scale(scale, scale);
            ctx.translate(-sX, -sY);

            // Render elements
            const rc = rough.canvas(canvas);
            slideElements.forEach(el => {
                renderElement(rc, ctx, el);
            });

            // Add page (first page already exists)
            if (i > 0) {
                const slideOrientation = sW >= sH ? 'landscape' : 'portrait';
                pdf.addPage([sW, sH], slideOrientation);
            }

            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            pdf.addImage(imgData, 'JPEG', 0, 0, sW, sH);
        }

        pdf.save('yappy_drawing.pdf');
    } else {
        // Single page: selection or infinite canvas
        let elements = allElements;
        if (onlySelected) {
            if (store.selection.length === 0) return;
            elements = elements.filter(el => store.selection.includes(el.id));
        }
        if (elements.length === 0) return;

        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });

        const padding = 20;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        // Create offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (background) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        const rc = rough.canvas(canvas);
        elements.forEach(el => {
            renderElement(rc, ctx, el);
        });

        const orientation = width >= height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [width, height],
            hotfixes: ['px_scaling'],
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
        pdf.save('yappy_drawing.pdf');
    }
};

export const exportToPptx = async (scale: number, background: boolean, onlySelected: boolean) => {
    const allElements = store.elements;
    if (allElements.length === 0) return;

    const pptx = new PptxGenJS();

    const isSlides = store.docType === 'slides' && store.slides.length > 0 && !onlySelected;

    if (isSlides) {
        const sortedSlides = [...store.slides].sort((a, b) => a.order - b.order);

        // Set presentation size from first slide's aspect ratio (inches, 10" base width)
        const firstSlide = sortedSlides[0];
        const slideW = 10;
        const slideH = 10 * (firstSlide.dimensions.height / firstSlide.dimensions.width);
        pptx.defineLayout({ name: 'CUSTOM', width: slideW, height: slideH });
        pptx.layout = 'CUSTOM';

        for (const slide of sortedSlides) {
            const { width: sW, height: sH } = slide.dimensions;
            const { x: sX, y: sY } = slide.spatialPosition;

            // Filter elements whose center falls on this slide
            const slideElements = allElements.filter(el => {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
            });

            // Render to offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = sW * scale;
            canvas.height = sH * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            if (background) {
                ctx.fillStyle = slide.backgroundColor || (store.theme !== 'light' ? '#121212' : '#ffffff');
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.scale(scale, scale);
            ctx.translate(-sX, -sY);

            const rc = rough.canvas(canvas);
            slideElements.forEach(el => {
                renderElement(rc, ctx, el);
            });

            // Per-slide dimensions in inches (in case slides differ in size)
            const thisSlideW = 10;
            const thisSlideH = 10 * (sH / sW);

            const pptSlide = pptx.addSlide();
            pptSlide.addImage({
                data: canvas.toDataURL('image/png'),
                x: 0,
                y: 0,
                w: thisSlideW,
                h: thisSlideH,
            });
        }
    } else {
        // Single slide: selection or infinite canvas
        let elements = allElements;
        if (onlySelected) {
            if (store.selection.length === 0) return;
            elements = elements.filter(el => store.selection.includes(el.id));
        }
        if (elements.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });

        const padding = 20;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (background) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        const rc = rough.canvas(canvas);
        elements.forEach(el => {
            renderElement(rc, ctx, el);
        });

        const slideW = 10;
        const slideH = 10 * (height / width);
        pptx.defineLayout({ name: 'CUSTOM', width: slideW, height: slideH });
        pptx.layout = 'CUSTOM';

        const pptSlide = pptx.addSlide();
        pptSlide.addImage({
            data: canvas.toDataURL('image/png'),
            x: 0,
            y: 0,
            w: slideW,
            h: slideH,
        });
    }

    await pptx.writeFile({ fileName: 'yappy_drawing.pptx' });
};
