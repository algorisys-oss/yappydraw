import { store, updateElement } from "../store/app-store";
import type { ElementType, DrawingElement } from "../types";

export const changeElementType = (elementId: string, newType: ElementType, pushHistory = true) => {
    const element = store.elements.find(e => e.id === elementId);
    if (!element) return;

    if (element.type === newType) return;

    // Define families — unbound polylines are shapes, not connectors
    const isConnectorType = (type: string) => ['line', 'arrow', 'bezier', 'organicBranch'].includes(type);
    const isPolylineShape = element.type === 'line' && element.curveType === 'elbow' && !element.startBinding && !element.endBinding;

    const oldIsConnector = isPolylineShape ? false : isConnectorType(element.type);
    const newIsConnector = isConnectorType(newType);

    // Only allow like-for-like (Connector <-> Connector, Shape <-> Shape)
    if (oldIsConnector !== newIsConnector) {
        console.warn(`Cannot transform ${element.type} to ${newType}: Incompatible families.`);
        return;
    }

    const updates: Partial<DrawingElement> = { type: newType };

    // Polyline shape → regular shape: compute AABB and clear polyline properties
    if (isPolylineShape && !newIsConnector) {
        if (element.points && Array.isArray(element.points) && (element.points as any[]).length >= 2) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of element.points as { x: number; y: number }[]) {
                minX = Math.min(minX, element.x + p.x);
                minY = Math.min(minY, element.y + p.y);
                maxX = Math.max(maxX, element.x + p.x);
                maxY = Math.max(maxY, element.y + p.y);
            }
            updates.x = minX;
            updates.y = minY;
            updates.width = maxX - minX;
            updates.height = maxY - minY;
        }
        updates.points = undefined;
        updates.curveType = undefined as any;
        updates.startArrowhead = null;
        updates.endArrowhead = null;
    }

    // Connector-specific logic
    if (newIsConnector) {
        // Set arrowheads based on target type
        if (newType === 'arrow') {
            if (!element.endArrowhead) updates.endArrowhead = 'arrow';
        } else if (newType === 'line') {
            updates.endArrowhead = null;
            updates.startArrowhead = null;
        }

        if (newType === 'bezier' || newType === 'organicBranch') {
            updates.curveType = 'bezier'; // Force curve rendering

            const startX = element.x;
            const startY = element.y;
            const endX = element.x + element.width;
            const endY = element.y + element.height;

            // OrganicBranch requires clean start/end points and fresh control points
            if (newType === 'organicBranch') {
                updates.points = [0, 0, element.width, element.height];
                const dx = endX - startX;
                updates.controlPoints = [
                    { x: startX + dx * 0.5, y: startY },
                    { x: endX - dx * 0.5, y: endY }
                ];
            } else if (!element.controlPoints || element.controlPoints.length !== 2) {
                // Bezier: generate control points only if missing
                const dx = endX - startX;
                const dy = endY - startY;
                updates.controlPoints = [
                    { x: startX + dx * 0.25, y: startY + dy * 0.1 },
                    { x: endX - dx * 0.25, y: endY - dy * 0.1 }
                ];
            }
        } else {
            // Straight line/arrow
            // We usually default to straight when converting FROM a curved type (Bezier/Organic) to a simple Line/Arrow
            // to avoid weird lingering curves unless the user explicitly set it.
            // However, if the user had an "Arrow with Elbow", and converts to "Line", they might expect "Line with Elbow".
            // But if they convert "Bezier" (Type) to "Line", they expect Straight Line?
            // Let's reset to straight if coming from Bezier/OrganicBranch types.
            if (element.type === 'bezier' || element.type === 'organicBranch') {
                updates.curveType = 'straight';
                updates.controlPoints = undefined;
            }
            // If they are just swapping Line <-> Arrow, we preserve curveType (Elbow/Straight/BezierStyle).
        }
    }

    updateElement(elementId, updates, pushHistory);
};

export const getTransformOptions = (currentType: ElementType, isPolylineShape = false): ElementType[] => {
    const connectors: ElementType[] = ['line', 'arrow', 'bezier', 'organicBranch'];
    const shapes: ElementType[] = [
        'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon',
        'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark',
        'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown',
        'capsule', 'stickyNote', 'callout', 'speechBubble', 'burst',
        'ribbon', 'bracketLeft', 'bracketRight',
        'database', 'document', 'predefinedProcess', 'internalStorage',
        'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser',
        'trapezoid', 'rightTriangle', 'pentagon', 'septagon',
        'browserWindow', 'mobilePhone', 'ghostButton', 'inputField',
        'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch',
        'card', 'searchBar', 'progressBar', 'avatar', 'navbar',
        'tabBar', 'badge', 'tooltip', 'slider',
        'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner',
        'trophy', 'clock', 'gear', 'target', 'rocket', 'flag',
        'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble',
        'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp',
        'faceHappy', 'faceSad', 'faceConfused',
        'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp',
        'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield',
        'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table',
        'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain',
        'dfdProcess', 'dfdDataStore', 'externalEntity',
        'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder',
        'stateStart', 'stateEnd', 'stateSync', 'activationBar'
    ];
    const umlShapes: ElementType[] = [
        'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote',
        'umlPackage', 'umlComponent', 'umlState', 'umlLifeline', 'umlFragment',
        'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface',
        'umlNode', 'umlArtifact', 'umlObject', 'umlPort', 'umlHistory', 'umlAction'
    ];

    // Unbound polylines are shapes, not connectors
    if (isPolylineShape) {
        return shapes;
    }

    if (connectors.includes(currentType)) {
        return connectors.filter(t => t !== currentType);
    }

    if (shapes.includes(currentType)) {
        return shapes.filter(t => t !== currentType);
    }

    if (umlShapes.includes(currentType)) {
        return umlShapes.filter(t => t !== currentType);
    }

    return [];
};

export const getShapeIcon = (type: ElementType): string => {
    const iconMap: Record<string, string> = {
        // Connectors
        'line': '─',
        'arrow': '→',
        'bezier': '∿',
        'organicBranch': '🌿',

        // Curve types (for submenu)
        'straight': '─',
        'elbow': '└─',

        // Basic shapes
        'rectangle': '□',
        'circle': '○',
        'diamond': '◇',
        'triangle': '△',
        'hexagon': '⬡',
        'octagon': '⬢',
        'parallelogram': '▱',
        'polygon': '⬠',
        'star': '★',
        'cloud': '☁',
        'heart': '♥',
        'cross': '✕',
        'checkmark': '✓',
        'arrowLeft': '⬅',
        'arrowRight': '➡',
        'arrowUp': '⬆',
        'arrowDown': '⬇',

        // Flowchart
        'database': '🗄',
        'document': '📄',
        'predefinedProcess': '⊞',
        'internalStorage': '⊡',

        // Infrastructure
        'server': '🖥',
        'loadBalancer': '⚖',
        'firewall': '🛡',
        'user': '👤',
        'messageQueue': '📬',
        'lambda': 'λ',
        'router': '🔀',
        'browser': '🌐',

        // Mindmap
        'capsule': '⬭',
        'stickyNote': '📝',
        'callout': '💬',
        'speechBubble': '💭',
        'burst': '💥',
        'ribbon': '🎀',
        'bracketLeft': '【',
        'bracketRight': '】',

        // Geometric
        'trapezoid': '⏢',
        'rightTriangle': '◿',
        'pentagon': '⬠',
        'septagon': '⬡',

        // Wireframe / UI Components
        'browserWindow': '🖼',
        'mobilePhone': '📱',
        'ghostButton': '▢',
        'inputField': '▭',
        'solidButton': '▣',
        'dropdown': '▾',
        'uiCheckbox': '☑',
        'radioButton': '◉',
        'toggleSwitch': '⊝',
        'searchBar': '🔍',
        'slider': '⊖',
        'card': '▭',
        'navbar': '═',
        'tabBar': '⊟',
        'avatar': '👤',
        'progressBar': '▰',
        'badge': '⊞',
        'tooltip': '💬',

        // Sketchnote
        'starPerson': '⭐',
        'lightbulb': '💡',
        'signpost': '🪧',
        'burstBlob': '✦',
        'scroll': '📜',
        'wavyDivider': '〰',
        'doubleBanner': '🏷',
        'trophy': '🏆',
        'clock': '🕐',
        'gear': '⚙',
        'target': '🎯',
        'rocket': '🚀',
        'flag': '🚩',
        'key': '🔑',
        'magnifyingGlass': '🔍',
        'book': '📖',
        'megaphone': '📣',
        'eye': '👁',
        'thoughtBubble': '💭',

        // People & Expressions
        'stickFigure': '🧍',
        'sittingPerson': '🪑',
        'presentingPerson': '🧑‍🏫',
        'handPointRight': '👉',
        'thumbsUp': '👍',
        'faceHappy': '😊',
        'faceSad': '😢',
        'faceConfused': '😕',

        // Status & Annotation
        'checkbox': '☐',
        'checkboxChecked': '☑',
        'numberedBadge': '①',
        'questionMark': '❓',
        'exclamationMark': '❗',
        'tag': '🏷',
        'pin': '📌',
        'stamp': '🔖',

        // Cloud & Container Infrastructure
        'kubernetes': '☸',
        'container': '📦',
        'apiGateway': '🚪',
        'cdn': '🌐',
        'storageBlob': '🗄',
        'eventBus': '🔀',
        'microservice': '⬡',
        'shield': '🛡',

        // Data & Metrics
        'barChart': '📊',
        'pieChart': '🥧',
        'trendUp': '📈',
        'trendDown': '📉',
        'funnel': '⏏',
        'gauge': '🎛',
        'table': '▦',

        // Connection & Relationship
        'puzzlePiece': '🧩',
        'chainLink': '🔗',
        'bridge': '🌉',
        'magnet': '🧲',
        'scale': '⚖',
        'seedling': '🌱',
        'tree': '🌳',
        'mountain': '⛰',

        // DFD / Diagram
        'dfdProcess': '⊙',
        'dfdDataStore': '▤',
        'externalEntity': '▧',

        // 3D shapes
        'isometricCube': '⬙',
        'solidBlock': '▣',
        'perspectiveBlock': '⧈',
        'cylinder': '⌭',

        // State diagram
        'stateStart': '●',
        'stateEnd': '◉',
        'stateSync': '▬',
        'activationBar': '▮',

        // UML
        'umlClass': '⊟',
        'umlInterface': '◎',
        'umlActor': '🧑',
        'umlUseCase': '⬯',
        'umlNote': '🗒',
        'umlPackage': '📦',
        'umlComponent': '⧉',
        'umlNode': '🧊',
        'umlArtifact': '📄',
        'umlObject': '▭',
        'umlPort': '▪',
        'umlHistory': 'Ⓗ',
        'umlAction': '▢',
        'umlState': '▢',
        'umlLifeline': '⫶',
        'umlFragment': '⬒',
        'umlSignalSend': '▷',
        'umlSignalReceive': '◁',
        'umlProvidedInterface': '◯',
        'umlRequiredInterface': '◠'
    };

    return iconMap[type] || '◻';
};

export const getShapeTooltip = (type: ElementType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1');
};

export const getCurveTypeOptions = (currentType: string): string[] => {
    return ['straight', 'bezier', 'elbow'].filter(t => t !== currentType);
};

export const getCurveTypeIcon = (curveType: string): string => {
    const iconMap: Record<string, string> = {
        'straight': '─',
        'bezier': '∿',
        'elbow': '└─'
    };
    return iconMap[curveType] || '─';
};

export const getCurveTypeTooltip = (curveType: string): string => {
    return curveType.charAt(0).toUpperCase() + curveType.slice(1);
};
