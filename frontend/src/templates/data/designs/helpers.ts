/**
 * Shared builders for built-in design templates (page-relative elements).
 */
import type { DesignTemplate, DesignPageTemplate } from '../../../types/template-types';
import type { DrawingElement, GradientStop } from '../../../types';

let _counter = 0;
export const genId = (prefix: string) => `${prefix}-${Date.now()}-${++_counter}`;

const BASE_PROPS = {
    roughness: 0,
    angle: 0,
    renderStyle: 'architectural' as const,
    locked: false,
    link: null,
    layerId: 'default-layer',
    strokeStyle: 'solid' as const,
    roundness: null,
};

const seed = () => Math.floor(Math.random() * 2 ** 31);

export function t(
    text: string, x: number, y: number, w: number, h: number, fontSize: number,
    opts: {
        color?: string; align?: 'left' | 'center' | 'right'; font?: string;
        bold?: boolean; italic?: boolean; letterSpacing?: number; opacity?: number;
    } = {}
): Partial<DrawingElement> {
    return {
        id: genId('text'), type: 'text', x, y, width: w, height: h, text,
        fontSize, fontFamily: (opts.font ?? 'poppins') as any,
        textAlign: opts.align ?? 'center', verticalAlign: 'middle',
        textColor: opts.color ?? '#1e293b',
        fontWeight: opts.bold ? 'bold' : undefined,
        fontStyle: opts.italic ? 'italic' : undefined,
        letterSpacing: opts.letterSpacing,
        strokeColor: 'transparent', backgroundColor: 'transparent',
        fillStyle: 'solid', strokeWidth: 0, opacity: opts.opacity ?? 100,
        seed: seed(), ...BASE_PROPS,
    };
}

export function r(
    x: number, y: number, w: number, h: number,
    opts: { bg?: string; stroke?: string; strokeWidth?: number; radius?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    const stroke = opts.stroke ?? 'transparent';
    return {
        id: genId('rect'), type: 'rectangle', x, y, width: w, height: h,
        strokeColor: stroke, backgroundColor: opts.bg ?? '#3b82f6',
        fillStyle: 'solid', strokeWidth: opts.strokeWidth ?? (stroke !== 'transparent' ? 2 : 0),
        opacity: opts.opacity ?? 100, borderRadius: opts.radius,
        seed: seed(), ...BASE_PROPS,
    };
}

export function grad(
    x: number, y: number, w: number, h: number,
    stops: GradientStop[], direction = 135,
    opts: { radius?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    return {
        id: genId('grad'), type: 'rectangle', x, y, width: w, height: h,
        strokeColor: 'transparent', backgroundColor: stops[0]?.color ?? '#3b82f6',
        fillStyle: 'linear' as any, gradientStops: stops, gradientDirection: direction,
        strokeWidth: 0, opacity: opts.opacity ?? 100, borderRadius: opts.radius,
        seed: seed(), ...BASE_PROPS,
    };
}

export function circle(
    x: number, y: number, d: number,
    opts: { bg?: string; stroke?: string; strokeWidth?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    const stroke = opts.stroke ?? 'transparent';
    return {
        id: genId('circle'), type: 'circle', x, y, width: d, height: d,
        strokeColor: stroke, backgroundColor: opts.bg ?? '#f59e0b',
        fillStyle: 'solid', strokeWidth: opts.strokeWidth ?? (stroke !== 'transparent' ? 2 : 0),
        opacity: opts.opacity ?? 100,
        seed: seed(), ...BASE_PROPS,
    };
}

export const stops = (from: string, to: string): GradientStop[] => [
    { offset: 0, color: from },
    { offset: 1, color: to },
];

const dummyData = { elements: [], layers: [] as any[] };

export function makeDesign(
    id: string, name: string, description: string, tags: string[], order: number,
    pageSize: { width: number; height: number }, pages: DesignPageTemplate[]
): DesignTemplate {
    return {
        metadata: { id, name, category: 'designs', description, tags, order, pageSize },
        pageSize, pages, data: dummyData,
    };
}
