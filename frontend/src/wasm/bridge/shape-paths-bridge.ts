// Phase 5: Shape paths bridge — maps DrawingElement to WASM shape enum,
// calls computeShapePath, reads Point[] from output buffer.
// Returns null for unsupported shapes (JS fallback).

import type { DrawingElement } from '../../types';
import type { ShapeGeometry } from '../../utils/shape-geometry';
import { getWasmExports } from './wasm-loader';

// Shape type enums matching assembly/shape-paths.ts
const SHAPE_TRIANGLE       = 1;
const SHAPE_DIAMOND        = 2;
const SHAPE_RIGHT_TRIANGLE = 3;
const SHAPE_PARALLELOGRAM  = 4;
const SHAPE_TRAPEZOID      = 5;
const SHAPE_STICKY_NOTE    = 6;
const SHAPE_HEXAGON        = 7;
const SHAPE_PENTAGON       = 8;
const SHAPE_SEPTAGON       = 9;
const SHAPE_OCTAGON        = 10;
const SHAPE_POLYGON        = 11;
const SHAPE_STAR           = 12;
const SHAPE_BURST          = 13;
const SHAPE_BURST_BLOB     = 14;
const SHAPE_ARROW_LEFT     = 15;
const SHAPE_ARROW_RIGHT    = 16;
const SHAPE_ARROW_UP       = 17;
const SHAPE_ARROW_DOWN     = 18;
const SHAPE_UML_SIGNAL_SEND    = 19;
const SHAPE_UML_SIGNAL_RECEIVE = 20;
const SHAPE_CHECKMARK      = 21;
const SHAPE_BRACKET_LEFT   = 22;
const SHAPE_BRACKET_RIGHT  = 23;

// Shapes that produce open (unclosed) paths
const OPEN_SHAPES = new Set([SHAPE_CHECKMARK, SHAPE_BRACKET_LEFT, SHAPE_BRACKET_RIGHT]);

/** Map element type string to WASM shape enum. Returns 0 for unsupported. */
function getShapeEnum(type: string): number {
  switch (type) {
    case 'triangle':          return SHAPE_TRIANGLE;
    case 'diamond':           return SHAPE_DIAMOND;
    case 'rightTriangle':     return SHAPE_RIGHT_TRIANGLE;
    case 'parallelogram':     return SHAPE_PARALLELOGRAM;
    case 'trapezoid':         return SHAPE_TRAPEZOID;
    case 'stickyNote':        return SHAPE_STICKY_NOTE;
    case 'hexagon':           return SHAPE_HEXAGON;
    case 'pentagon':          return SHAPE_PENTAGON;
    case 'septagon':          return SHAPE_SEPTAGON;
    case 'octagon':           return SHAPE_OCTAGON;
    case 'polygon':           return SHAPE_POLYGON;
    case 'star':              return SHAPE_STAR;
    case 'burst':             return SHAPE_BURST;
    case 'burstBlob':         return SHAPE_BURST_BLOB;
    case 'arrowLeft':         return SHAPE_ARROW_LEFT;
    case 'arrowRight':        return SHAPE_ARROW_RIGHT;
    case 'arrowUp':           return SHAPE_ARROW_UP;
    case 'arrowDown':         return SHAPE_ARROW_DOWN;
    case 'umlSignalSend':     return SHAPE_UML_SIGNAL_SEND;
    case 'umlSignalReceive':  return SHAPE_UML_SIGNAL_RECEIVE;
    case 'checkmark':         return SHAPE_CHECKMARK;
    case 'bracketLeft':       return SHAPE_BRACKET_LEFT;
    case 'bracketRight':      return SHAPE_BRACKET_RIGHT;
    default:                  return 0;
  }
}

/**
 * WASM-accelerated shape geometry for supported polygon types.
 * Returns null for unsupported shapes (caller falls back to JS).
 */
export function wasmGetShapeGeometry(el: DrawingElement): ShapeGeometry | null {
  const w = getWasmExports();
  if (!w) return null;

  const shapeType = getShapeEnum(el.type);
  if (shapeType === 0) return null;

  // Extract shape-specific params
  let param1 = 0;
  let param2 = 0;
  let param3 = 0;

  if (shapeType === SHAPE_POLYGON) {
    param1 = (el as any).polygonSides || 6;
  } else if (shapeType === SHAPE_STAR) {
    param1 = (el as any).starPoints || 5;
    param2 = (el as any).shapeRatio !== undefined ? (el as any).shapeRatio : 38;
  } else if (shapeType === SHAPE_BURST) {
    param1 = (el as any).burstPoints || 16;
    param2 = (el as any).shapeRatio !== undefined ? (el as any).shapeRatio : 70;
  } else if (shapeType === SHAPE_BURST_BLOB) {
    param3 = (el as any).seed || 1;
  }

  const pointCount: number = (w as any).computeShapePath(
    shapeType,
    el.width, el.height,
    param1, param2, param3,
  );

  if (pointCount <= 0) return null;

  // Read points from WASM output buffer
  const points: { x: number; y: number }[] = new Array(pointCount);
  for (let i = 0; i < pointCount; i++) {
    points[i] = {
      x: (w as any).getShapePointX(i) as number,
      y: (w as any).getShapePointY(i) as number,
    };
  }

  const result: ShapeGeometry = { type: 'points', points };

  // Mark open shapes as not closed
  if (OPEN_SHAPES.has(shapeType)) {
    (result as any).isClosed = false;
  }

  return result;
}
