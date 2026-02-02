import { store } from "../store/app-store";
import { renderElement } from "./render-element";
import rough from 'roughjs/bin/rough';
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";


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

    const rc = rough.svg(svg);

    // Group for Translation
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${-minX + padding}, ${-minY + padding})`);
    svg.appendChild(g);

    elements.forEach(el => {
        // Rotation Group
        let node: SVGElement | null = null;

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
        } else if (el.type === 'line' || el.type === 'arrow') {
            const endX = el.x + el.width;
            const endY = el.y + el.height;

            if (el.type === 'arrow') {
                const arrowG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                arrowG.appendChild(rc.line(el.x, el.y, endX, endY, options));

                const angle = Math.atan2(el.height, el.width);
                const startHeadLen = el.startArrowheadSize || 15;
                const endHeadLen = el.endArrowheadSize || 15;

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
        } else if (el.type === 'text' && el.text) {
            const textText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textText.textContent = el.text;
            textText.setAttribute('x', `${el.x}`);
            textText.setAttribute('y', `${el.y + (el.fontSize || 28)}`); // Baseline
            textText.setAttribute('fill', el.strokeColor);
            textText.setAttribute('font-family', 'sans-serif');
            textText.setAttribute('font-size', `${el.fontSize || 28}px`);
            node = textText;
        } else if ((el.type === 'fineliner' || el.type === 'inkbrush' || el.type === 'marker') && el.points) {
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
        } else if (el.type === 'image' && el.dataURL) {
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', el.dataURL);
            image.setAttribute('x', `${el.x}`);
            image.setAttribute('y', `${el.y}`);
            image.setAttribute('width', `${el.width}`);
            image.setAttribute('height', `${el.height}`);
            node = image;
        }

        if (node) {
            node.setAttribute('opacity', `${(el.opacity ?? 100) / 100}`);
            if (el.angle) {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                node.setAttribute('transform', `rotate(${el.angle * (180 / Math.PI)}, ${cx}, ${cy})`);
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
                ctx.fillStyle = slide.backgroundColor || (store.theme === 'dark' ? '#121212' : '#ffffff');
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
                ctx.fillStyle = slide.backgroundColor || (store.theme === 'dark' ? '#121212' : '#ffffff');
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
