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
