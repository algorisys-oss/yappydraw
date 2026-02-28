/**
 * Technical Architecture — 8-slide technical presentation template
 */
import type { PresentationTemplate, SlidePalette } from '../../../types/template-types';
import {
    createTitleSlideElements, createContentSlideElements,
    createTwoColumnElements, createSectionBreakElements,
    createClosingElements,
} from '../../../utils/slide-element-factory';

const palette: SlidePalette = {
    primary: '#4f46e5', secondary: '#1e1b4b', accent: '#06b6d4',
    background: '#eef2ff', text: '#1e293b',
};
const darkBgPalette: SlidePalette = { ...palette, text: '#f1f5f9' };

export const techArchitecture: PresentationTemplate = {
    metadata: {
        id: 'tech-architecture',
        name: 'Technical Architecture',
        category: 'presentations',
        description: 'System design, architecture reviews, and technical deep-dives',
        tags: ['tech', 'architecture', 'engineering', 'system-design'],
        order: 9,
    },
    palette,
    slides: [
        {
            name: 'Title',
            backgroundColor: palette.secondary,
            elements: createTitleSlideElements('System Architecture', 'Technical Design Review — v2.0', darkBgPalette),
        },
        {
            name: 'Overview',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Architecture Overview', [
                'Microservices-based distributed system',
                'Event-driven communication via message queue',
                'Polyglot persistence (SQL + NoSQL + Search)',
                'Container orchestration with Kubernetes',
                'Multi-region deployment with active-active failover',
            ], undefined, palette),
        },
        {
            name: 'Tech Stack',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Technology Stack',
                ['Go — API services', 'Rust — Data pipeline', 'TypeScript — Frontend', 'Python — ML services'],
                ['PostgreSQL — Primary DB', 'Redis — Cache + pub/sub', 'Kafka — Event streaming', 'S3 — Object storage'],
                palette),
        },
        {
            name: 'Data Flow',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Data Flow', [
                '1. Client request → API Gateway (rate limiting, auth)',
                '2. Gateway → Service mesh (Envoy sidecar proxy)',
                '3. Service → Event bus (Kafka) for async processing',
                '4. Consumer services process events in parallel',
                '5. Results aggregated and cached in Redis',
                '6. Response returned via reverse path',
            ], undefined, palette),
        },
        {
            name: 'Scalability',
            backgroundColor: palette.secondary,
            elements: createSectionBreakElements('Scalability Strategy', 'Horizontal scaling · Auto-provisioning · Edge computing', palette),
        },
        {
            name: 'Infrastructure',
            backgroundColor: palette.background,
            elements: createTwoColumnElements('Infrastructure',
                ['AWS multi-region', 'Kubernetes (EKS)', 'Terraform IaC', 'GitOps with ArgoCD'],
                ['Prometheus + Grafana', 'Distributed tracing (Jaeger)', 'Log aggregation (ELK)', 'PagerDuty alerting'],
                palette),
        },
        {
            name: 'Security',
            backgroundColor: palette.background,
            elements: createContentSlideElements('Security Architecture', [
                'Zero-trust network model',
                'mTLS between all services',
                'Secrets management via HashiCorp Vault',
                'RBAC with fine-grained permissions',
                'Automated vulnerability scanning in CI/CD',
                'SOC 2 Type II + ISO 27001 certified',
            ], undefined, palette),
        },
        {
            name: 'Q&A',
            backgroundColor: palette.background,
            elements: createClosingElements('Questions?', 'Architecture docs: docs.internal/architecture', palette),
        },
    ],
    data: { elements: [], layers: [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }] },
};
