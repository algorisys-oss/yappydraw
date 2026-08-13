/**
 * Render Helpers — Style merging and shape routing utilities for the DSL engine.
 */

import type { DSLNodeStyle, DSLEdgeStyle, DSLStyleDefaults } from '../types';

/**
 * Merge node style from DSL with defaults.
 * Priority: node-level style > shape-specific defaults > global node defaults.
 */
export function mergeNodeStyle(
    nodeStyle: DSLNodeStyle | undefined,
    shapeName: string,
    defaults: DSLStyleDefaults | undefined
): Record<string, any> {
    const globalDefaults = defaults?.node ?? {};
    const shapeDefaults = defaults?.shapes?.[shapeName] ?? {};
    const merged: Record<string, any> = {};

    // Apply in order: global → shape-specific → node-level
    for (const key of Object.keys(globalDefaults) as (keyof DSLNodeStyle)[]) {
        if (globalDefaults[key] !== undefined) merged[key] = globalDefaults[key];
    }
    for (const key of Object.keys(shapeDefaults) as (keyof DSLNodeStyle)[]) {
        if (shapeDefaults[key] !== undefined) merged[key] = shapeDefaults[key];
    }
    if (nodeStyle) {
        for (const key of Object.keys(nodeStyle) as (keyof DSLNodeStyle)[]) {
            if (nodeStyle[key] !== undefined) merged[key] = nodeStyle[key];
        }
    }

    return merged;
}

/**
 * Merge edge style from DSL with defaults.
 */
export function mergeEdgeStyle(
    edgeStyle: DSLEdgeStyle | undefined,
    defaults: DSLStyleDefaults | undefined
): Record<string, any> {
    const globalDefaults = defaults?.edge ?? {};
    const merged: Record<string, any> = {};

    for (const key of Object.keys(globalDefaults) as (keyof DSLEdgeStyle)[]) {
        if (globalDefaults[key] !== undefined) merged[key] = globalDefaults[key];
    }
    if (edgeStyle) {
        for (const key of Object.keys(edgeStyle) as (keyof DSLEdgeStyle)[]) {
            if (edgeStyle[key] !== undefined) merged[key] = edgeStyle[key];
        }
    }

    return merged;
}

/**
 * Map DSL style property names to YappyAPI ElementOptions property names.
 * Passes through all recognized style properties to DrawingElement options.
 */
export function mapStyleToOptions(style: Record<string, any>): Record<string, any> {
    const opts: Record<string, any> = {};

    // All supported style keys that map 1:1 to DrawingElement properties
    const PASSTHROUGH_KEYS = [
        // Core fill & stroke
        'strokeColor', 'backgroundColor', 'fillStyle', 'strokeWidth',
        'strokeStyle', 'opacity', 'roughness', 'borderRadius', 'renderStyle', 'seed',
        // Text
        'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
        'textAlign', 'verticalAlign', 'textColor',
        // Text highlight
        'textHighlightEnabled', 'textHighlightColor',
        'textHighlightPadding', 'textHighlightRadius',
        // Gradient
        'gradientStops', 'gradientDirection', 'gradientType', 'gradientPreset',
        // Shadow
        'shadowEnabled', 'shadowColor', 'shadowBlur',
        'shadowOffsetX', 'shadowOffsetY',
        // Inner border
        'drawInnerBorder', 'innerBorderColor', 'innerBorderDistance',
        // Stroke & fill options
        'strokeLineJoin', 'strokeLineCap', 'strokeAlign', 'fillDensity',
        // Effects
        'blendMode', 'flipX', 'flipY', 'angle',
    ];

    for (const key of PASSTHROUGH_KEYS) {
        if (style[key] !== undefined) opts[key] = style[key];
    }

    return opts;
}
