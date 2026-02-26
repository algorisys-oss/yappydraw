// Phase 6: Sketch engine bridge — intercepts RoughJS generator calls,
// delegates to WASM for supported shapes, parses command buffer into
// RoughJS-compatible Drawable objects.

import type { Drawable, OpSet, Op, OpType, OpSetType, Options } from 'roughjs/bin/core';
import { getWasmExports } from './wasm-loader';
import { getPointBufferPtr, getPointBuffer } from './memory-pool';

// Methods the WASM sketch engine supports
const WASM_METHODS = new Set([
  'rectangle', 'ellipse', 'circle', 'polygon', 'line', 'linearPath',
]);

// Command buffer constants (must match assembly/sketch-engine.ts)
const OPSET_HEADER = -1.0;
const END_MARKER = -2.0;
const OP_MOVE = 0.0;
const OP_BCURVE = 1.0;
const OP_LINE_CMD = 2.0;

// OpSet type mapping
const OPSET_TYPE_MAP: OpSetType[] = ['path', 'fillPath', 'fillSketch'];

// Fill style enum mapping
function getFillStyleEnum(style: string | undefined): number {
  switch (style) {
    case 'solid': return 1;
    case 'hachure': return 2;
    case 'cross-hatch': return 3;
    case 'zigzag': return 4;
    default: return 2; // default hachure
  }
}

/**
 * Parse the WASM command buffer into RoughJS OpSet[].
 * Reads from WASM via getSketchCmd accessor.
 */
function parseCommandBuffer(w: any, cmdLen: number): OpSet[] {
  const sets: OpSet[] = [];
  let i = 0;
  let currentOps: Op[] | null = null;
  let currentType: OpSetType = 'path';

  while (i < cmdLen) {
    const v: number = (w as any).getSketchCmd(i);

    if (v === END_MARKER) {
      break;
    }

    if (v === OPSET_HEADER) {
      // Flush previous opset
      if (currentOps !== null) {
        sets.push({ type: currentType, ops: currentOps });
      }
      const typeIdx = (w as any).getSketchCmd(i + 1) as number;
      currentType = OPSET_TYPE_MAP[typeIdx] || 'path';
      currentOps = [];
      i += 2;
      continue;
    }

    if (currentOps === null) {
      // Skip data before first OPSET_HEADER (shouldn't happen)
      i++;
      continue;
    }

    if (v === OP_MOVE) {
      const x: number = (w as any).getSketchCmd(i + 1);
      const y: number = (w as any).getSketchCmd(i + 2);
      currentOps.push({ op: 'move' as OpType, data: [x, y] });
      i += 3;
    } else if (v === OP_BCURVE) {
      const cp1x: number = (w as any).getSketchCmd(i + 1);
      const cp1y: number = (w as any).getSketchCmd(i + 2);
      const cp2x: number = (w as any).getSketchCmd(i + 3);
      const cp2y: number = (w as any).getSketchCmd(i + 4);
      const x: number = (w as any).getSketchCmd(i + 5);
      const y: number = (w as any).getSketchCmd(i + 6);
      currentOps.push({ op: 'bcurveTo' as OpType, data: [cp1x, cp1y, cp2x, cp2y, x, y] });
      i += 7;
    } else if (v === OP_LINE_CMD) {
      const x: number = (w as any).getSketchCmd(i + 1);
      const y: number = (w as any).getSketchCmd(i + 2);
      currentOps.push({ op: 'lineTo' as OpType, data: [x, y] });
      i += 3;
    } else {
      // Unknown command — skip
      i++;
    }
  }

  // Flush last opset
  if (currentOps !== null && currentOps.length > 0) {
    sets.push({ type: currentType, ops: currentOps });
  }

  return sets;
}

/** Check if a method is supported by the WASM sketch engine */
export function isWasmSketchMethod(method: string): boolean {
  return WASM_METHODS.has(method);
}

/**
 * Generate a RoughJS-compatible Drawable using WASM.
 * Returns null if WASM is unavailable or generation fails.
 *
 * @param method - RoughJS generator method name
 * @param args - Arguments as passed to the generator method
 * @param resolvedOptions - The merged options (generator._o(options) result)
 */
export function wasmGenerateDrawable(
  method: string,
  args: any[],
  resolvedOptions: Options,
): Drawable | null {
  const w = getWasmExports();
  if (!w) return null;

  const o = resolvedOptions;
  const roughness = o.roughness ?? 1;
  const seed = o.seed ?? 1;
  const strokeWidth = o.strokeWidth ?? 1;
  const disableMultiStroke = o.disableMultiStroke ? 1 : 0;
  const hasFill = (o.fill && o.fill !== 'transparent' && o.fill !== 'none') ? 1 : 0;
  const fillStyle = getFillStyleEnum(o.fillStyle);
  const hachureAngle = o.hachureAngle ?? -41;
  const hachureGap = o.hachureGap ?? -1;

  let cmdLen = 0;

  try {
    if (method === 'rectangle') {
      const [x, y, width, height] = args;
      cmdLen = (w as any).sketchRectangle(
        x, y, width, height,
        roughness, seed, strokeWidth,
        fillStyle, hachureAngle, hachureGap,
        disableMultiStroke, hasFill,
      );
    } else if (method === 'line') {
      const [x1, y1, x2, y2] = args;
      cmdLen = (w as any).sketchLine(
        x1, y1, x2, y2,
        roughness, seed, strokeWidth,
        disableMultiStroke,
      );
    } else if (method === 'ellipse') {
      const [cx, cy, rw, rh] = args;
      cmdLen = (w as any).sketchEllipse(
        cx, cy, rw, rh,
        roughness, seed, strokeWidth,
        fillStyle, hachureAngle, hachureGap,
        disableMultiStroke, hasFill,
      );
    } else if (method === 'circle') {
      // Circle is ellipse with equal radii
      const [cx, cy, d] = args;
      cmdLen = (w as any).sketchEllipse(
        cx, cy, d, d,
        roughness, seed, strokeWidth,
        fillStyle, hachureAngle, hachureGap,
        disableMultiStroke, hasFill,
      );
    } else if (method === 'polygon') {
      const points: number[][] = args[0];
      if (!points || points.length < 2) return null;

      // Marshal points to WASM memory
      const buf = getPointBuffer();
      if (!buf || points.length > 4096) return null;
      for (let i = 0; i < points.length; i++) {
        buf[i * 2] = points[i][0];
        buf[i * 2 + 1] = points[i][1];
      }

      cmdLen = (w as any).sketchPolygon(
        getPointBufferPtr(), points.length,
        roughness, seed, strokeWidth,
        fillStyle, hachureAngle, hachureGap,
        disableMultiStroke, hasFill,
      );
    } else if (method === 'linearPath') {
      const points: number[][] = args[0];
      if (!points || points.length < 2) return null;

      const buf = getPointBuffer();
      if (!buf || points.length > 4096) return null;
      for (let i = 0; i < points.length; i++) {
        buf[i * 2] = points[i][0];
        buf[i * 2 + 1] = points[i][1];
      }

      cmdLen = (w as any).sketchLinearPath(
        getPointBufferPtr(), points.length,
        roughness, seed, strokeWidth,
        disableMultiStroke,
      );
    } else {
      return null;
    }

    if (cmdLen <= 0) return null;

    // Parse command buffer into OpSets
    const sets = parseCommandBuffer(w, cmdLen);
    if (sets.length === 0) return null;

    // Construct Drawable matching RoughJS format
    const shape = method === 'circle' ? 'circle' : method;
    return {
      shape,
      sets,
      options: o as any,
    };
  } catch {
    return null;
  }
}
