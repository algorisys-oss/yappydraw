import type { Template } from '../../../types/template-types';

export const orgChartTemplate: Template = {
    metadata: {
        id: 'orgchart-basic',
        name: 'Org Chart',
        category: 'diagrams',
        description: 'A basic organizational chart showing company hierarchy',
        tags: ['org', 'organization', 'hierarchy', 'chart'],
        order: 4
    },
    data: {
        version: 1,
        elements: [
            // CEO
            {
                id: 'ceo',
                type: 'rectangle',
                x: 325,
                y: 50,
                width: 150,
                height: 70,
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
                containerText: 'CEO',
                fontSize: 18,
                boundElements: [{ id: 'line-ceo-cto', type: 'arrow' }, { id: 'line-ceo-cfo', type: 'arrow' }, { id: 'line-ceo-coo', type: 'arrow' }]
            },
            // CTO
            {
                id: 'cto',
                type: 'rectangle',
                x: 100,
                y: 180,
                width: 150,
                height: 70,
                strokeColor: '#2563eb',
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
                containerText: 'CTO',
                boundElements: [{ id: 'line-ceo-cto', type: 'arrow' }, { id: 'line-cto-eng', type: 'arrow' }]
            },
            // CFO
            {
                id: 'cfo',
                type: 'rectangle',
                x: 325,
                y: 180,
                width: 150,
                height: 70,
                strokeColor: '#059669',
                backgroundColor: '#d1fae5',
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
                containerText: 'CFO',
                boundElements: [{ id: 'line-ceo-cfo', type: 'arrow' }]
            },
            // COO
            {
                id: 'coo',
                type: 'rectangle',
                x: 550,
                y: 180,
                width: 150,
                height: 70,
                strokeColor: '#ea580c',
                backgroundColor: '#fed7aa',
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
                containerText: 'COO',
                boundElements: [{ id: 'line-ceo-coo', type: 'arrow' }]
            },
            // Engineering Manager
            {
                id: 'eng-manager',
                type: 'rectangle',
                x: 100,
                y: 310,
                width: 150,
                height: 60,
                strokeColor: '#6366f1',
                backgroundColor: '#e0e7ff',
                fillStyle: 'hachure',
                strokeWidth: 1,
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
                containerText: 'Engineering',
                fontSize: 14,
                boundElements: [{ id: 'line-cto-eng', type: 'arrow' }]
            },
            // CEO to CTO
            {
                id: 'line-ceo-cto',
                type: 'line',
                x: 400,
                y: 120,
                width: -225,
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
                endArrowhead: null,
                startBinding: {
                    elementId: 'ceo',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'cto',
                    focus: 0,
                    gap: 5
                }
            },
            // CEO to CFO
            {
                id: 'line-ceo-cfo',
                type: 'line',
                x: 400,
                y: 120,
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
                endArrowhead: null,
                startBinding: {
                    elementId: 'ceo',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'cfo',
                    focus: 0,
                    gap: 5
                }
            },
            // CEO to COO
            {
                id: 'line-ceo-coo',
                type: 'line',
                x: 400,
                y: 120,
                width: 225,
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
                endArrowhead: null,
                startBinding: {
                    elementId: 'ceo',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'coo',
                    focus: 0,
                    gap: 5
                }
            },
            // CTO to Engineering
            {
                id: 'line-cto-eng',
                type: 'line',
                x: 175,
                y: 250,
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
                endArrowhead: null,
                startBinding: {
                    elementId: 'cto',
                    focus: 0,
                    gap: 5
                },
                endBinding: {
                    elementId: 'eng-manager',
                    focus: 0,
                    gap: 5
                }
            }
        ],
        layers: [
            {
                id: 'default-layer',
                name: 'Org Chart',
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
