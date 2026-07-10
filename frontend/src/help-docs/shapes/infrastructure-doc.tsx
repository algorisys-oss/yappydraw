/**
 * Infrastructure Shapes Documentation
 * Cloud, networking, and architecture diagram elements
 */

import type { Component } from 'solid-js';

export const InfrastructureDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Infrastructure Shapes</h1>
                <p class="doc-intro">
                    Create cloud architecture diagrams, network topologies, and system
                    infrastructure visualizations with specialized shapes.
                </p>
            </header>

            {/* Shape Categories */}
            <section class="doc-section">
                <h2>Available Shapes</h2>

                <h3>Compute & Servers</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Server</strong></td>
                            <td>Physical or virtual server instance</td>
                        </tr>
                        <tr>
                            <td><strong>Container</strong></td>
                            <td>Docker container or containerized workload</td>
                        </tr>
                        <tr>
                            <td><strong>Kubernetes</strong></td>
                            <td>Kubernetes cluster or pod</td>
                        </tr>
                        <tr>
                            <td><strong>Lambda</strong></td>
                            <td>Serverless function</td>
                        </tr>
                        <tr>
                            <td><strong>Microservice</strong></td>
                            <td>Individual microservice component</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Networking</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Load Balancer</strong></td>
                            <td>Traffic distribution component</td>
                        </tr>
                        <tr>
                            <td><strong>Router</strong></td>
                            <td>Network router</td>
                        </tr>
                        <tr>
                            <td><strong>Firewall</strong></td>
                            <td>Security firewall</td>
                        </tr>
                        <tr>
                            <td><strong>API Gateway</strong></td>
                            <td>API management and routing</td>
                        </tr>
                        <tr>
                            <td><strong>CDN</strong></td>
                            <td>Content Delivery Network</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Storage & Data</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Database</strong></td>
                            <td>Relational or NoSQL database</td>
                        </tr>
                        <tr>
                            <td><strong>Storage Blob</strong></td>
                            <td>Object/blob storage (S3, Azure Blob)</td>
                        </tr>
                        <tr>
                            <td><strong>Message Queue</strong></td>
                            <td>Message broker (RabbitMQ, SQS)</td>
                        </tr>
                        <tr>
                            <td><strong>Event Bus</strong></td>
                            <td>Event streaming (Kafka, EventBridge)</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Users & Clients</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>User</strong></td>
                            <td>End user or client</td>
                        </tr>
                        <tr>
                            <td><strong>Browser</strong></td>
                            <td>Web browser client</td>
                        </tr>
                        <tr>
                            <td><strong>Mobile</strong></td>
                            <td>Mobile app client</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Security</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Shield</strong></td>
                            <td>Security component or protection</td>
                        </tr>
                        <tr>
                            <td><strong>Key</strong></td>
                            <td>Authentication or encryption key</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Placing Shapes (UI) */}
            <section class="doc-section">
                <h2>Placing Infrastructure Shapes</h2>
                <p>
                    Infrastructure and cloud shapes live in the <strong>Architecture</strong> group on the
                    toolbar (the unified Infrastructure + Cloud-Native picker). Add them to the canvas like any
                    other shape:
                </p>
                <ol>
                    <li>Open the <strong>Architecture</strong> shape group in the toolbar (or press
                        <span class="kbd">/</span> to open the command palette and search for a shape by name,
                        e.g. "Load Balancer").</li>
                    <li>Pick a shape such as <strong>Server</strong>, <strong>Database</strong>, or
                        <strong>Kubernetes</strong>.</li>
                    <li>Click once on the canvas to drop it at a default size, or click-drag to size it as you place it.</li>
                    <li>Double-click the shape to add a label, and use the <strong>Properties</strong> panel to set
                        stroke, fill, and drawing style.</li>
                    <li>Connect shapes with the <strong>Arrow</strong> or <strong>Line</strong> tool — connectors
                        bind to a shape's edge and follow it when you move it.</li>
                </ol>

                <div class="tip-box">
                    <h5>Tip: Search instead of hunting</h5>
                    <p>
                        There are dozens of infrastructure and cloud shapes. The fastest way to place one is the
                        command palette (<span class="kbd">/</span>) — type "firewall", "cdn", "api gateway", etc.
                        and press <span class="kbd">Enter</span>.
                    </p>
                </div>
            </section>

            {/* Architecture Patterns */}
            <section class="doc-section">
                <h2>Common Architecture Patterns</h2>

                <h3>Three-Tier Architecture</h3>
                <div class="code-block">
{`┌─────────────────┐
│   Presentation  │  ← Browser, Mobile App
├─────────────────┤
│    Application  │  ← API Server, Business Logic
├─────────────────┤
│      Data       │  ← Database, Storage
└─────────────────┘`}
                </div>

                <h3>Microservices</h3>
                <p>
                    Use hexagon shapes for individual services, connected through
                    an API Gateway and message queues.
                </p>

                <h3>Event-Driven</h3>
                <p>
                    Show event producers → Event Bus → event consumers
                    using message queue and event bus shapes.
                </p>
            </section>

            {/* Cloud Providers */}
            <section class="doc-section">
                <h2>Cloud Provider Diagrams</h2>
                <p>
                    Yappy's infrastructure shapes work well for diagramming
                    across major cloud providers:
                </p>

                <h3>AWS Style</h3>
                <ul>
                    <li>Lambda → AWS Lambda functions</li>
                    <li>Storage Blob → S3 buckets</li>
                    <li>Message Queue → SQS</li>
                    <li>Database → RDS, DynamoDB</li>
                </ul>

                <h3>Azure Style</h3>
                <ul>
                    <li>Lambda → Azure Functions</li>
                    <li>Storage Blob → Blob Storage</li>
                    <li>Kubernetes → AKS</li>
                    <li>Event Bus → Event Grid</li>
                </ul>

                <h3>GCP Style</h3>
                <ul>
                    <li>Lambda → Cloud Functions</li>
                    <li>Storage Blob → Cloud Storage</li>
                    <li>Kubernetes → GKE</li>
                    <li>Message Queue → Pub/Sub</li>
                </ul>
            </section>

            {/* Network Diagrams */}
            <section class="doc-section">
                <h2>Network Diagrams</h2>
                <p>
                    Create network topology diagrams showing how components connect.
                </p>

                <h3>Connection Types</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Line Style</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Solid line</td>
                            <td>Direct connection</td>
                        </tr>
                        <tr>
                            <td>Dashed line</td>
                            <td>Virtual/logical connection</td>
                        </tr>
                        <tr>
                            <td>Bidirectional arrow</td>
                            <td>Two-way communication</td>
                        </tr>
                        <tr>
                            <td>Single arrow</td>
                            <td>One-way data flow</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Security Boundaries</h5>
                    <p>
                        Use rectangles with dashed borders to show VPCs, subnets,
                        or security groups. Group related components inside.
                    </p>
                </div>
            </section>

            {/* Styling */}
            <section class="doc-section">
                <h2>Styling Recommendations</h2>
                <ul>
                    <li><strong>Color coding</strong> - Use consistent colors for component types</li>
                    <li><strong>Blue</strong> - Compute resources (servers, functions)</li>
                    <li><strong>Green</strong> - Databases and storage</li>
                    <li><strong>Orange</strong> - Networking components</li>
                    <li><strong>Red</strong> - Security components</li>
                    <li><strong>Gray</strong> - External systems or users</li>
                </ul>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Every infrastructure shape can be created and updated from code through the global
                    <code class="code-inline">window.Yappy</code> object. Use the generic
                    <code class="code-inline">Yappy.createElement(type, x, y, width, height, options)</code> with
                    one of the infrastructure element <strong>type</strong> strings, then tweak it with
                    <code class="code-inline">Yappy.updateElement(id, &#123; ... &#125;)</code>.
                </p>

                <h3>Element Types</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Type strings</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Infrastructure</td>
                            <td>
                                <code class="code-inline">'server'</code>, <code class="code-inline">'loadBalancer'</code>,
                                <code class="code-inline">'firewall'</code>, <code class="code-inline">'router'</code>,
                                <code class="code-inline">'messageQueue'</code>, <code class="code-inline">'lambda'</code>,
                                <code class="code-inline">'user'</code>, <code class="code-inline">'browser'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Cloud-Native</td>
                            <td>
                                <code class="code-inline">'kubernetes'</code>, <code class="code-inline">'container'</code>,
                                <code class="code-inline">'apiGateway'</code>, <code class="code-inline">'cdn'</code>,
                                <code class="code-inline">'storageBlob'</code>, <code class="code-inline">'eventBus'</code>,
                                <code class="code-inline">'microservice'</code>, <code class="code-inline">'shield'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Data</td>
                            <td>
                                <code class="code-inline">'database'</code>, <code class="code-inline">'document'</code>,
                                <code class="code-inline">'internalStorage'</code>, <code class="code-inline">'mobilePhone'</code>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h3>Build a Mini Architecture</h3>
                <div class="code-block">
{`// window.Yappy is the global scripting entry point.

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
Yappy.connect(app2, db);`}
                </div>

                <h3>Update a Shape Later</h3>
                <div class="code-block">
{`// Recolour, relabel or move any element by id
Yappy.updateElement(app1, {
    backgroundColor: '#dbeafe',
    fillStyle: 'solid',
    containerText: 'app-1 (primary)'
});`}
                </div>

                <div class="tip-box">
                    <h5>Tip: Colour by role</h5>
                    <p>
                        Pass <code class="code-inline">strokeColor</code> in the options to follow the
                        colour-coding convention below (blue = compute, green = data, orange = networking,
                        red = security). Set <code class="code-inline">fillStyle: 'solid'</code> together with
                        <code class="code-inline">backgroundColor</code> for a filled look.
                    </p>
                </div>
            </section>

            {/* Best Practices */}
            <section class="doc-section">
                <h2>Best Practices</h2>
                <ul>
                    <li><strong>Flow direction</strong> - Left-to-right or top-to-bottom</li>
                    <li><strong>Group by function</strong> - Cluster related components</li>
                    <li><strong>Show boundaries</strong> - Indicate network/security zones</li>
                    <li><strong>Label connections</strong> - Add protocols (HTTPS, gRPC, etc.)</li>
                    <li><strong>Include legends</strong> - Explain color/shape meanings</li>
                </ul>
            </section>
        </div>
    );
};

export default InfrastructureDoc;
