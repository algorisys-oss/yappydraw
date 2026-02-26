// YappyDraw WASM module — AssemblyScript entry point
// Each phase adds exports here.

// Phase 0: trivial verification function
export function add(a: f64, b: f64): f64 {
  return a + b;
}

// Phase 1: Geometry
export {
  isPointInPolygon,
  distanceToSegment,
  cubicBezier,
  cubicBezierAngle,
  rotatePoint,
  isPointInEllipse,
  isPointNearEllipseStroke,
  isPointOnPolyline,
  getBezierPoints,
  isPointOnBezier,
  getOrganicBranchPolygon,
} from './geometry';

// Phase 2: Hit Testing
export {
  hitTestSingle,
  batchBroadPhase,
  getCandidateAt,
} from './hit-testing';

// Phase 3: Routing
export {
  calculateSmartElbowRoute,
  getRoutePointX,
  getRoutePointY,
} from './routing';

// Phase 4: Snapping
export {
  computeSnappingGuides,
  getSnappingDeltaX,
  getSnappingDeltaY,
  getGuideElementIndex,
  getGuideCoordinate,
  getGuideType,
} from './snapping';

// Phase 5: Shape Paths
export {
  computeShapePath,
  getShapePointX,
  getShapePointY,
} from './shape-paths';

// Phase 6: Sketch Engine
export {
  sketchRectangle,
  sketchPolygon,
  sketchLine,
  sketchEllipse,
  sketchLinearPath,
  getSketchCmd,
} from './sketch-engine';

// Phase 7: Batch Renderer
export {
  batchViewportCull,
  getVisibleIndex,
  batchComputeShapePaths,
  getBatchShapePointX,
  getBatchShapePointY,
  getBatchShapeOffset,
  getBatchShapeCount,
} from './batch-renderer';
