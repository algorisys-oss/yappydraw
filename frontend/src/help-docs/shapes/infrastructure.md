---
id: infrastructure
name: Infrastructure
icon: "☁️"
category: Diagrams
description: Cloud architecture and network diagram shapes
seoTitle: "How to draw a cloud architecture diagram — servers, CDN, Kubernetes"
seoDescription: "Draw network and cloud architecture diagrams with servers, load balancers, firewalls, routers, CDNs, containers and Kubernetes shapes."
---

# Infrastructure Shapes

Create cloud architecture diagrams, network topologies, and system infrastructure visualizations with specialized shapes.

## Available Shapes

### Compute & Servers

| Shape | Description |
| --- | --- |
| **Server** | Physical or virtual server instance |
| **Container** | Docker container or containerized workload |
| **Kubernetes** | Kubernetes cluster or pod |
| **Lambda** | Serverless function |
| **Microservice** | Individual microservice component |

### Networking

| Shape | Description |
| --- | --- |
| **Load Balancer** | Traffic distribution component |
| **Router** | Network router |
| **Firewall** | Security firewall |
| **API Gateway** | API management and routing |
| **CDN** | Content Delivery Network |

### Storage & Data

| Shape | Description |
| --- | --- |
| **Database** | Relational or NoSQL database |
| **Storage Blob** | Object/blob storage (S3, Azure Blob) |
| **Message Queue** | Message broker (RabbitMQ, SQS) |
| **Event Bus** | Event streaming (Kafka, EventBridge) |

### Users & Clients

| Shape | Description |
| --- | --- |
| **User** | End user or client |
| **Browser** | Web browser client |
| **Mobile** | Mobile app client |

### Security

| Shape | Description |
| --- | --- |
| **Shield** | Security component or protection |
| **Key** | Authentication or encryption key |

## Placing Infrastructure Shapes

Infrastructure and cloud shapes live in the **Architecture** group on the toolbar (the unified Infrastructure + Cloud-Native picker). Add them to the canvas like any other shape:

1. Open the **Architecture** shape group in the toolbar (or press <kbd>/</kbd> to open the command palette and search for a shape by name, e.g. "Load Balancer").
2. Pick a shape such as **Server**, **Database**, or **Kubernetes**.
3. Click once on the canvas to drop it at a default size, or click-drag to size it as you place it.
4. Double-click the shape to add a label, and use the **Properties** panel to set stroke, fill, and drawing style.
5. Connect shapes with the **Arrow** or **Line** tool — connectors bind to a shape's edge and follow it when you move it.

:::tip Tip: Search instead of hunting
There are dozens of infrastructure and cloud shapes. The fastest way to place one is the command palette (<kbd>/</kbd>) — type "firewall", "cdn", "api gateway", etc. and press <kbd>Enter</kbd>.
:::

## Common Architecture Patterns

### Three-Tier Architecture

```
┌─────────────────┐
│   Presentation  │  ← Browser, Mobile App
├─────────────────┤
│    Application  │  ← API Server, Business Logic
├─────────────────┤
│      Data       │  ← Database, Storage
└─────────────────┘
```

### Microservices

Use hexagon shapes for individual services, connected through an API Gateway and message queues.

### Event-Driven

Show event producers → Event Bus → event consumers using message queue and event bus shapes.

## Cloud Provider Diagrams

Yappy's infrastructure shapes work well for diagramming across major cloud providers:

### AWS Style

- Lambda → AWS Lambda functions
- Storage Blob → S3 buckets
- Message Queue → SQS
- Database → RDS, DynamoDB

### Azure Style

- Lambda → Azure Functions
- Storage Blob → Blob Storage
- Kubernetes → AKS
- Event Bus → Event Grid

### GCP Style

- Lambda → Cloud Functions
- Storage Blob → Cloud Storage
- Kubernetes → GKE
- Message Queue → Pub/Sub

## Network Diagrams

Create network topology diagrams showing how components connect.

### Connection Types

| Line Style | Meaning |
| --- | --- |
| Solid line | Direct connection |
| Dashed line | Virtual/logical connection |
| Bidirectional arrow | Two-way communication |
| Single arrow | One-way data flow |

:::tip Tip: Security Boundaries
Use rectangles with dashed borders to show VPCs, subnets, or security groups. Group related components inside.
:::

## Styling Recommendations

- **Color coding** - Use consistent colors for component types
- **Blue** - Compute resources (servers, functions)
- **Green** - Databases and storage
- **Orange** - Networking components
- **Red** - Security components
- **Gray** - External systems or users

## Scripting (API)

Every infrastructure shape can be created and updated from code through the global `window.Yappy` object. Use the generic `Yappy.createElement(type, x, y, width, height, options)` with one of the infrastructure element **type** strings, then tweak it with `Yappy.updateElement(id, { ... })`.

### Element Types

| Category | Type strings |
| --- | --- |
| Infrastructure | `'server'`, `'loadBalancer'`, `'firewall'`, `'router'`, `'messageQueue'`, `'lambda'`, `'user'`, `'browser'` |
| Cloud-Native | `'kubernetes'`, `'container'`, `'apiGateway'`, `'cdn'`, `'storageBlob'`, `'eventBus'`, `'microservice'`, `'shield'` |
| Data | `'database'`, `'document'`, `'internalStorage'`, `'mobilePhone'` |

### Build a Mini Architecture

```
// window.Yappy is the global scripting entry point.

// A web client talking to a load balancer, two app servers and a DB
const browser = Yappy.createElement('browser', 60, 200, 90, 90, {
    containerText: 'Client'
});

const lb = Yappy.createElement('loadBalancer', 220, 210, 120, 70, {
    containerText: 'ALB',
    strokeColor: '#ea580c'        // orange = networking
});

const app1 = Yappy.createElement('server', 420, 120, 110, 80, {
    containerText: 'app-1',
    strokeColor: '#2563eb'        // blue = compute
});
const app2 = Yappy.createElement('server', 420, 260, 110, 80, {
    containerText: 'app-2',
    strokeColor: '#2563eb'
});

const db = Yappy.createElement('database', 620, 190, 110, 90, {
    containerText: 'Postgres',
    strokeColor: '#16a34a'        // green = data
});

// Wire them together with bound connectors
Yappy.connect(browser, lb);
Yappy.connect(lb, app1);
Yappy.connect(lb, app2);
Yappy.connect(app1, db);
Yappy.connect(app2, db);
```

### Update a Shape Later

```
// Recolour, relabel or move any element by id
Yappy.updateElement(app1, {
    backgroundColor: '#dbeafe',
    fillStyle: 'solid',
    containerText: 'app-1 (primary)'
});
```

:::tip Tip: Colour by role
Pass `strokeColor` in the options to follow the colour-coding convention below (blue = compute, green = data, orange = networking, red = security). Set `fillStyle: 'solid'` together with `backgroundColor` for a filled look.
:::

## Best Practices

- **Flow direction** - Left-to-right or top-to-bottom
- **Group by function** - Cluster related components
- **Show boundaries** - Indicate network/security zones
- **Label connections** - Add protocols (HTTPS, gRPC, etc.)
- **Include legends** - Explain color/shape meanings
