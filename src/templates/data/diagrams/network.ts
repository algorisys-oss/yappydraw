import type { Template } from '../../../types/template-types';

export const networkDiagramTemplate: Template = {
    metadata: {
        id: 'network-basic',
        name: 'Network Diagram',
        category: 'diagrams',
        description: 'A basic network topology diagram showing servers and connections',
        tags: ['network', 'topology', 'infrastructure', 'servers'],
        order: 5
    },
    data: {
        version: 1,
        elements: [
            // Internet Cloud
            {
                id: 'internet',
                type: 'circle',
                x: 350,
                y: 40,
                width: 100,
                height: 100,
                strokeColor: '#3b82f6',
                backgroundColor: '#dbeafe',
                fillStyle: 'solid',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'Internet',
                fontSize: 16,
                boundElements: [{ id: 'line-internet-firewall', type: 'arrow' }]
            },
            // Firewall
            {
                id: 'firewall',
                type: 'rectangle',
                x: 325,
                y: 200,
                width: 150,
                height: 80,
                strokeColor: '#dc2626',
                backgroundColor: '#fecaca',
                fillStyle: 'solid',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'Firewall',
                fontSize: 16,
                boundElements: [
                    { id: 'line-internet-firewall', type: 'arrow' },
                    { id: 'line-firewall-server1', type: 'arrow' },
                    { id: 'line-firewall-server2', type: 'arrow' }
                ]
            },
            // Server 1
            {
                id: 'server1',
                type: 'rectangle',
                x: 150,
                y: 360,
                width: 120,
                height: 100,
                strokeColor: '#059669',
                backgroundColor: '#d1fae5',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'Web Server',
                fontSize: 14,
                boundElements: [{ id: 'line-firewall-server1', type: 'arrow' }, { id: 'line-server1-db', type: 'arrow' }]
            },
            // Server 2
            {
                id: 'server2',
                type: 'rectangle',
                x: 530,
                y: 360,
                width: 120,
                height: 100,
                strokeColor: '#059669',
                backgroundColor: '#d1fae5',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'API Server',
                fontSize: 14,
                boundElements: [{ id: 'line-firewall-server2', type: 'arrow' }, { id: 'line-server2-db', type: 'arrow' }]
            },
            // Database
            {
                id: 'database',
                type: 'diamond',
                x: 325,
                y: 520,
                width: 150,
                height: 100,
                strokeColor: '#7c3aed',
                backgroundColor: '#ede9fe',
                fillStyle: 'solid',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                containerText: 'Database',
                fontSize: 14,
                boundElements: [{ id: 'line-server1-db', type: 'arrow' }, { id: 'line-server2-db', type: 'arrow' }]
            },
            // Internet to Firewall
            {
                id: 'line-internet-firewall',
                type: 'arrow',
                x: 400,
                y: 140,
                width: 0,
                height: 60,
                strokeColor: '#6b7280',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                curveType: 'straight',
                startArrowhead: null,
                endArrowhead: 'arrow',
                startBinding: {
                    elementId: 'internet',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'firewall',
                    focus: 0,
                    gap: 5
                }
            },
            // Firewall to Server 1
            {
                id: 'line-firewall-server1',
                type: 'arrow',
                x: 400,
                y: 280,
                width: -190,
                height: 80,
                strokeColor: '#6b7280',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                curveType: 'straight',
                startArrowhead: null,
                endArrowhead: 'arrow',
                startBinding: {
                    elementId: 'firewall',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'server1',
                    focus: 0,
                    gap: 5
                }
            },
            // Firewall to Server 2
            {
                id: 'line-firewall-server2',
                type: 'arrow',
                x: 400,
                y: 280,
                width: 190,
                height: 80,
                strokeColor: '#6b7280',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                curveType: 'straight',
                startArrowhead: null,
                endArrowhead: 'arrow',
                startBinding: {
                    elementId: 'firewall',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'server2',
                    focus: 0,
                    gap: 5
                }
            },
            // Server 1 to Database
            {
                id: 'line-server1-db',
                type: 'arrow',
                x: 210,
                y: 460,
                width: 190,
                height: 60,
                strokeColor: '#6b7280',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                curveType: 'straight',
                startArrowhead: null,
                endArrowhead: 'arrow',
                startBinding: {
                    elementId: 'server1',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'database',
                    focus: 0,
                    gap: 5
                }
            },
            // Server 2 to Database
            {
                id: 'line-server2-db',
                type: 'arrow',
                x: 590,
                y: 460,
                width: -190,
                height: 60,
                strokeColor: '#6b7280',
                backgroundColor: 'transparent',
                fillStyle: 'hachure',
                strokeWidth: 2,
                strokeStyle: 'solid',
                opacity: 100,
                roughness: 1,
                angle: 0,
                renderStyle: 'sketch',
                seed: Math.floor(Math.random() * 2147483647),
                roundness: null,
                locked: false,
                link: null,
                layerId: 'default-layer',
                curveType: 'straight',
                startArrowhead: null,
                endArrowhead: 'arrow',
                startBinding: {
                    elementId: 'server2',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'database',
                    focus: 0,
                    gap: 5
                }
            }
        ],
        layers: [
            {
                id: 'default-layer',
                name: 'Network Diagram',
                visible: true,
                locked: false,
                opacity: 1,
                order: 0
            }
        ],
        viewState: {
            scale: 1,
            panX: 0,
            panY: 0
        },
        gridSettings: {
            enabled: false,
            snapToGrid: false,
            objectSnapping: true,
            gridSize: 20,
            gridColor: '#e0e0e0',
            gridOpacity: 0.5,
            style: 'dots'
        }
    }
};
