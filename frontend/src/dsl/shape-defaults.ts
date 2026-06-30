/**
 * Shape Default Dimensions
 * Default width/height for each ElementType when not explicitly specified in DSL.
 * Pulls from BPMN defaults in api.ts and UI shape defs in ui-shape-defs.tsx.
 */

import type { ElementType } from '../types';

export interface ShapeSize {
    width: number;
    height: number;
}

const SHAPE_DEFAULTS: Partial<Record<ElementType, ShapeSize>> = {
    // ─── Basic Shapes ────────────────────────────────────
    rectangle: { width: 150, height: 80 },
    circle: { width: 100, height: 100 },
    diamond: { width: 120, height: 120 },
    triangle: { width: 100, height: 100 },
    hexagon: { width: 120, height: 100 },
    octagon: { width: 100, height: 100 },
    star: { width: 100, height: 100 },
    cloud: { width: 160, height: 100 },
    heart: { width: 100, height: 100 },
    cylinder: { width: 100, height: 120 },
    capsule: { width: 160, height: 60 },
    parallelogram: { width: 150, height: 80 },
    predefinedProcess: { width: 150, height: 80 },
    trapezoid: { width: 150, height: 80 },
    burst: { width: 120, height: 120 },
    cross: { width: 100, height: 100 },
    arrowRight: { width: 140, height: 60 },
    arrowLeft: { width: 140, height: 60 },
    speechBubble: { width: 180, height: 100 },

    // ─── BPMN ────────────────────────────────────────────
    bpmnStartEvent: { width: 50, height: 50 },
    bpmnEndEvent: { width: 50, height: 50 },
    bpmnIntermediateEvent: { width: 50, height: 50 },
    bpmnExclusiveGateway: { width: 60, height: 60 },
    bpmnParallelGateway: { width: 60, height: 60 },
    bpmnInclusiveGateway: { width: 60, height: 60 },
    bpmnEventGateway: { width: 60, height: 60 },
    bpmnTask: { width: 120, height: 80 },
    bpmnCallActivity: { width: 120, height: 80 },
    bpmnSubProcess: { width: 140, height: 90 },
    bpmnDataObject: { width: 60, height: 80 },
    bpmnAnnotation: { width: 120, height: 60 },
    bpmnPool: { width: 600, height: 300 },
    bpmnDataStore: { width: 70, height: 70 },
    bpmnGroup: { width: 200, height: 150 },

    // ─── UML ─────────────────────────────────────────────
    umlClass: { width: 180, height: 120 },
    umlInterface: { width: 180, height: 120 },
    umlActor: { width: 60, height: 100 },
    umlUseCase: { width: 160, height: 80 },
    umlComponent: { width: 160, height: 80 },
    umlState: { width: 140, height: 70 },
    umlLifeline: { width: 120, height: 200 },
    umlPackage: { width: 200, height: 150 },
    umlFragment: { width: 200, height: 150 },
    umlNode: { width: 160, height: 100 },
    umlArtifact: { width: 140, height: 80 },

    // ─── Infrastructure ──────────────────────────────────
    database: { width: 100, height: 120 },
    server: { width: 100, height: 120 },
    loadBalancer: { width: 100, height: 100 },
    firewall: { width: 100, height: 100 },
    messageQueue: { width: 120, height: 80 },
    browser: { width: 400, height: 300 },
    user: { width: 80, height: 100 },
    lambda: { width: 80, height: 80 },
    router: { width: 100, height: 60 },
    kubernetes: { width: 100, height: 100 },
    apiGateway: { width: 100, height: 80 },
    cdn: { width: 100, height: 80 },
    eventBus: { width: 120, height: 60 },
    microservice: { width: 120, height: 80 },

    // ─── Data Structures ─────────────────────────────────
    dsArray: { width: 300, height: 60 },
    dsStack: { width: 100, height: 200 },
    dsLinkedList: { width: 300, height: 60 },
    dsBinaryTree: { width: 300, height: 200 },
    dsQueue: { width: 300, height: 80 },
    dsHashTable: { width: 200, height: 160 },

    // ─── Common ──────────────────────────────────────────
    stickyNote: { width: 200, height: 200 },
    text: { width: 200, height: 40 },
    table: { width: 400, height: 200 },
    codeBlock: { width: 400, height: 200 },
    image: { width: 200, height: 200 },
    video: { width: 480, height: 270 },

    // ─── UI/Wireframe ────────────────────────────────────
    browserWindow: { width: 400, height: 300 },
    mobilePhone: { width: 200, height: 400 },
    card: { width: 300, height: 200 },
    solidButton: { width: 160, height: 48 },
    ghostButton: { width: 160, height: 48 },
    dropdown: { width: 200, height: 40 },
    inputField: { width: 240, height: 40 },
    uiCheckbox: { width: 24, height: 24 },
    radioButton: { width: 24, height: 24 },
    toggleSwitch: { width: 56, height: 28 },
    searchBar: { width: 280, height: 40 },
    slider: { width: 200, height: 24 },
    navbar: { width: 500, height: 48 },
    tabBar: { width: 360, height: 40 },
    avatar: { width: 64, height: 64 },
    progressBar: { width: 200, height: 16 },
    badge: { width: 80, height: 28 },
    tooltip: { width: 160, height: 48 },

    // ─── Data Visualizations ──────────────────────────────
    ganttChart: { width: 600, height: 400 },
    journeyDiagram: { width: 600, height: 350 },
    quadrantChart: { width: 450, height: 450 },
    xyChart: { width: 500, height: 350 },

    // ─── Connectors (typically sized by endpoints) ───────
    arrow: { width: 200, height: 0 },
    line: { width: 200, height: 0 },
};

const FALLBACK: ShapeSize = { width: 150, height: 80 };

/**
 * Get default dimensions for a given ElementType.
 */
export function getShapeDefaults(type: ElementType): ShapeSize {
    return SHAPE_DEFAULTS[type] ?? FALLBACK;
}
