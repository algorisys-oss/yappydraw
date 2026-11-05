/**
 * Chart drawing operations (chart-layout.ts / chartex-layout.ts) as deck items: rectangles, paths,
 * ellipses and text boxes in a group. PowerPoint import uses it for Office 2016 charts, which come
 * in as a drawing of the chart rather than an editable data chart. Pure.
 */
import type { ChartOp } from '../chart/chart-layout';
import type { Item, ShapeItem, GroupItem, PathCmd, Paint, Line } from './deck';

const solid = (hex: string, alpha?: number): Paint => ({ kind: 'solid', color: { hex, ...(alpha !== undefined && alpha < 1 && { alpha }) } });
const stroke = (hex: string, width: number): Line => ({ width, color: { hex }, cap: 'rnd', join: 'round' });

/** Points of a ring or pie wedge, outer arc then inner arc back, about every 4°. */
function wedgePoints(o: Extract<ChartOp, { op: 'wedge' }>): [number, number][] {
    const steps = Math.max(2, Math.ceil(Math.abs(o.a1 - o.a0) / (Math.PI / 45)));
    const arc = (r: number, from: number, to: number) => Array.from({ length: steps + 1 }, (_, k) => {
        const a = from + ((to - from) * k) / steps;
        return [o.cx + Math.cos(a) * r, o.cy + Math.sin(a) * r] as [number, number];
    });
    return o.inner > 0 ? [...arc(o.r, o.a0, o.a1), ...arc(o.inner, o.a1, o.a0)] : [[o.cx, o.cy], ...arc(o.r, o.a0, o.a1)];
}

/** A path shape through `points`, in its own bounding box. */
function pathShape(id: number, name: string, points: [number, number][], closed: boolean, fill: Paint, line: Line | null): ShapeItem | null {
    if (points.length < 2) return null;
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    const w = Math.max(0.01, Math.max(...xs) - x), h = Math.max(0.01, Math.max(...ys) - y);
    const cmds: PathCmd[] = points.map(([px, py], i) => ({ op: i ? 'L' : 'M', x: px - x, y: py - y }));
    if (closed) cmds.push({ op: 'Z' });
    return { kind: 'shape', id, name, x, y, w, h, geom: { kind: 'custom', paths: [{ cmds, fill: closed && fill.kind !== 'none', stroke: !!line }] }, fill, line };
}

/** A text box placed as the operation anchors its text (left/centre/right, top/middle/bottom of the point). */
function textShape(id: number, o: Extract<ChartOp, { op: 'text' }>): ShapeItem {
    const w = o.text.length * o.size * 0.6 + o.size * 0.6, h = o.size * 1.35;
    const x = o.align === 'left' ? o.x : o.align === 'right' ? o.x - w : o.x - w / 2;
    const y = o.baseline === 'top' ? o.y : o.baseline === 'bottom' ? o.y - h : o.y - h / 2;
    return {
        kind: 'shape', id, name: 'Label', x, y, w, h, geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null, textBox: true,
        text: {
            paragraphs: [{ runs: [{ text: o.text, size: o.size, color: { hex: o.color }, ...(o.bold && { bold: true }) }], align: o.align === 'left' ? 'l' : o.align === 'right' ? 'r' : 'ctr' }],
            anchor: 'ctr', insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: false,
        },
    };
}

/** The operations as a group of shapes. `nextId` hands out shape ids unique on the slide. */
export function chartOpsGroup(ops: ChartOp[], id: number, name: string, box: { x: number; y: number; w: number; h: number }, nextId: () => number): GroupItem | null {
    const children: Item[] = [];
    for (const o of ops) {
        let it: Item | null = null;
        switch (o.op) {
            case 'rect':
                if (!(o.w > 0 && o.h > 0)) break;
                it = { kind: 'shape', id: nextId(), name: 'Bar', x: o.x, y: o.y, w: o.w, h: o.h, geom: { kind: 'preset', prst: 'rect' },
                    fill: o.fill ? solid(o.fill) : { kind: 'none' }, line: o.stroke ? stroke(o.stroke, 1) : null };
                break;
            case 'line':
                it = pathShape(nextId(), 'Line', o.points, !!o.closed, o.fill ? solid(o.fill, 0.55) : { kind: 'none' }, stroke(o.stroke, o.width));
                break;
            case 'wedge':
                it = pathShape(nextId(), 'Segment', wedgePoints(o), true, solid(o.fill), stroke('#ffffff', 1.5));
                break;
            case 'dot':
                it = { kind: 'shape', id: nextId(), name: 'Point', x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2, geom: { kind: 'preset', prst: 'ellipse' },
                    fill: solid(o.fill, o.opacity), line: o.stroke ? stroke(o.stroke, 1) : null };
                break;
            case 'text':
                if (o.text) it = textShape(nextId(), o);
                break;
        }
        if (it) children.push(it);
    }
    if (!children.length) return null;
    return { kind: 'group', id, name, ...box, children };
}
