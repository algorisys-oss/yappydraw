/**
 * Shape Alias Map
 * Maps human-friendly DSL shape names to YappyDraw ElementType values.
 */

import type { ElementType } from '../types';

export const SHAPE_ALIASES: Record<string, ElementType> = {
    // Flowchart
    'rect': 'rectangle',
    'box': 'rectangle',
    'process': 'rectangle',
    'oval': 'circle',
    'ellipse': 'circle',
    'decision': 'diamond',
    'condition': 'diamond',
    'io': 'parallelogram',
    'subroutine': 'predefinedProcess',
    'terminal': 'capsule',

    // BPMN
    'start-event': 'bpmnStartEvent',
    'end-event': 'bpmnEndEvent',
    'intermediate-event': 'bpmnIntermediateEvent',
    'task': 'bpmnTask',
    'subprocess': 'bpmnSubProcess',
    'call-activity': 'bpmnCallActivity',
    'gateway': 'bpmnExclusiveGateway',
    'xor-gateway': 'bpmnExclusiveGateway',
    'and-gateway': 'bpmnParallelGateway',
    'or-gateway': 'bpmnInclusiveGateway',
    'event-gateway': 'bpmnEventGateway',
    'pool': 'bpmnPool',
    'data-object': 'bpmnDataObject',
    'data-store': 'bpmnDataStore',
    'annotation': 'bpmnAnnotation',

    // UML
    'entity': 'umlClass',
    'class': 'umlClass',
    'interface': 'umlInterface',
    'actor': 'umlActor',
    'use-case': 'umlUseCase',
    'component': 'umlComponent',
    'state': 'umlState',
    'state-start': 'stateStart',
    'state-end': 'stateEnd',
    'state-sync': 'stateSync',
    'lifeline': 'umlLifeline',
    'package': 'umlPackage',
    'fragment': 'umlFragment',
    'enum': 'umlEnum',

    // Infrastructure
    'db': 'database',
    'server': 'server',
    'lb': 'loadBalancer',
    'firewall': 'firewall',
    'queue': 'messageQueue',
    'browser': 'browser',
    'user': 'user',
    'lambda': 'lambda',
    'router': 'router',
    'k8s': 'kubernetes',
    'api-gateway': 'apiGateway',
    'cdn': 'cdn',
    'event-bus': 'eventBus',
    'microservice': 'microservice',

    // Data Structures
    'array': 'dsArray',
    'stack': 'dsStack',
    'ds-queue': 'dsQueue',
    'linked-list': 'dsLinkedList',
    'binary-tree': 'dsBinaryTree',
    'hash-table': 'dsHashTable',

    // Common
    'note': 'stickyNote',
    'sticky': 'stickyNote',
    'text': 'text',
    'table': 'table',
    'code': 'codeBlock',
    'image': 'image',

    // Data Visualizations
    'gantt': 'ganttChart',
    'journey': 'journeyDiagram',
    'quadrant': 'quadrantChart',
    'xy-chart': 'xyChart',

    // Shapes
    'cloud': 'cloud',
    'hexagon': 'hexagon',
    'star': 'star',
    'triangle': 'triangle',
    'heart': 'heart',
    'cylinder': 'cylinder',
};

/**
 * Resolve a shape name from DSL text to an ElementType.
 * Checks aliases first, then treats the input as a literal ElementType.
 */
export function resolveShapeType(shape: string): ElementType {
    const lower = shape.toLowerCase().trim();
    if (SHAPE_ALIASES[lower]) return SHAPE_ALIASES[lower];
    return shape as ElementType;
}
