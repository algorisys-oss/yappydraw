import { shapeRegistry } from "./shape-registry";
import { RectangleRenderer } from "./renderers/rectangle-renderer";
import { CircleRenderer } from "./renderers/circle-renderer";
import { DiamondRenderer } from "./renderers/diamond-renderer";
import { TextRenderer } from "./renderers/text-renderer";
import { ImageRenderer } from "./renderers/image-renderer";
import { StickyNoteRenderer } from "./renderers/sticky-note-renderer";
import { PolygonRenderer } from "./renderers/polygon-renderer";
import { FlowchartRenderer } from "./renderers/flowchart-renderer";
import { SketchnoteRenderer } from "./renderers/sketchnote-renderer";
import { InfraRenderer } from "./renderers/infra-renderer";
import { PathRenderer } from "./renderers/path-renderer";
import { UIComponentRenderer } from "./renderers/ui-component-renderer";
import { UI_SHAPE_DEFS } from "../config/ui-shape-defs";
import { ConnectorRenderer } from "./renderers/connector-renderer";
import { FreehandRenderer } from "./renderers/freehand-renderer";
import { SpecialtyShapeRenderer } from "./renderers/specialty-shape-renderer";
import { UmlClassRenderer } from "./renderers/uml-class-renderer";
import { UmlGeneralRenderer } from "./renderers/uml-general-renderer";
import { UmlStateRenderer } from "./renderers/uml-state-renderer";
import { PeopleRenderer } from "./renderers/people-renderer";
import { StatusRenderer } from "./renderers/status-renderer";
import { CloudInfraRenderer } from "./renderers/cloud-infra-renderer";
import { DataMetricsRenderer } from "./renderers/data-metrics-renderer";
import { TableRenderer } from "./renderers/table-renderer";
import { CodeBlockRenderer } from "./renderers/code-block-renderer";
import { DataStructureRenderer } from "./renderers/data-structure-renderer";
import { ConnectionRelRenderer } from "./renderers/connection-rel-renderer";
import { BpmnRenderer } from "./renderers/bpmn-renderer";

export function registerShapes() {
    console.log('Registering all shapes including specialty...');
    shapeRegistry.register('rectangle', new RectangleRenderer());
    shapeRegistry.register('circle', new CircleRenderer());
    shapeRegistry.register('diamond', new DiamondRenderer());
    shapeRegistry.register('text', new TextRenderer());
    shapeRegistry.register('richtext', new TextRenderer());
    shapeRegistry.register('image', new ImageRenderer());
    shapeRegistry.register('stickyNote', new StickyNoteRenderer());

    const polygonRenderer = new PolygonRenderer();
    const polygonTypes = [
        'triangle', 'hexagon', 'octagon', 'parallelogram',
        'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'polygon'
    ] as const;
    polygonTypes.forEach(type => shapeRegistry.register(type, polygonRenderer));

    const flowchartRenderer = new FlowchartRenderer();
    const flowchartTypes = ['database', 'document', 'predefinedProcess', 'internalStorage'] as const;
    flowchartTypes.forEach(type => shapeRegistry.register(type, flowchartRenderer));

    const sketchnoteRenderer = new SketchnoteRenderer();
    const sketchnoteTypes = ['starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble'] as const;
    sketchnoteTypes.forEach(type => shapeRegistry.register(type, sketchnoteRenderer));

    const infraRenderer = new InfraRenderer();
    const infraTypes = ['server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router'] as const;
    infraTypes.forEach(type => shapeRegistry.register(type, infraRenderer));

    const pathRenderer = new PathRenderer();
    const pathTypes = ['organicBranch'] as const;
    pathTypes.forEach(type => shapeRegistry.register(type, pathRenderer));

    // UI/UX wireframe shapes — data-driven from config
    const uiRenderer = new UIComponentRenderer();
    UI_SHAPE_DEFS.forEach(def => shapeRegistry.register(def.type as any, uiRenderer));

    const connectorRenderer = new ConnectorRenderer();
    shapeRegistry.register('line', connectorRenderer);
    shapeRegistry.register('arrow', connectorRenderer);
    shapeRegistry.register('bezier', connectorRenderer);

    const freehandRenderer = new FreehandRenderer();
    const freehandTypes = ['fineliner', 'inkbrush', 'marker', 'ink'] as const;
    freehandTypes.forEach(type => shapeRegistry.register(type, freehandRenderer));

    const specialtyRenderer = new SpecialtyShapeRenderer();
    const specialtyTypes = [
        'cloud', 'heart', 'star', 'burst', 'callout', 'speechBubble',
        'ribbon', 'bracketLeft', 'bracketRight',
        'cross', 'checkmark', 'capsule',
        'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown',
        'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'cylinder',
        'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'perspectiveBlock', 'openBox',
        'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface'
    ] as const;
    specialtyTypes.forEach(type => shapeRegistry.register(type, specialtyRenderer));

    const umlClassRenderer = new UmlClassRenderer();
    shapeRegistry.register('umlClass', umlClassRenderer);

    const umlStateRenderer = new UmlStateRenderer();
    shapeRegistry.register('umlState', umlStateRenderer);

    const umlGeneralRenderer = new UmlGeneralRenderer();
    const umlTypes = ['umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlLifeline', 'umlFragment'] as const;
    umlTypes.forEach(type => shapeRegistry.register(type, umlGeneralRenderer));

    const peopleRenderer = new PeopleRenderer();
    const peopleTypes = ['stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused'] as const;
    peopleTypes.forEach(type => shapeRegistry.register(type, peopleRenderer));

    const statusRenderer = new StatusRenderer();
    const statusTypes = ['checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp'] as const;
    statusTypes.forEach(type => shapeRegistry.register(type, statusRenderer));

    const cloudInfraRenderer = new CloudInfraRenderer();
    const cloudInfraTypes = ['kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield'] as const;
    cloudInfraTypes.forEach(type => shapeRegistry.register(type, cloudInfraRenderer));

    const dataMetricsRenderer = new DataMetricsRenderer();
    const dataMetricsTypes = ['barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'ganttChart', 'journeyDiagram', 'quadrantChart', 'xyChart'] as const;
    dataMetricsTypes.forEach(type => shapeRegistry.register(type, dataMetricsRenderer));

    shapeRegistry.register('table', new TableRenderer());
    shapeRegistry.register('codeBlock', new CodeBlockRenderer());

    const dsRenderer = new DataStructureRenderer();
    const dsTypes = ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] as const;
    dsTypes.forEach(type => shapeRegistry.register(type, dsRenderer));

    const connectionRelRenderer = new ConnectionRelRenderer();
    const connectionRelTypes = ['puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain'] as const;
    connectionRelTypes.forEach(type => shapeRegistry.register(type, connectionRelRenderer));

    const bpmnRenderer = new BpmnRenderer();
    const bpmnTypes = [
        'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent',
        'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway',
        'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity',
        'bpmnDataObject', 'bpmnAnnotation', 'bpmnPool',
        'bpmnEventGateway', 'bpmnDataStore', 'bpmnGroup'
    ] as const;
    bpmnTypes.forEach(type => shapeRegistry.register(type, bpmnRenderer));
}
