/**
 * UML Shapes Documentation
 * Unified Modeling Language diagram elements
 */

import type { Component } from 'solid-js';

export const UmlDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>UML Shapes</h1>
                <p class="doc-intro">
                    Create professional UML diagrams including class diagrams, use case diagrams,
                    sequence diagrams, state machines, and component diagrams.
                </p>
            </header>

            {/* UML Shape Overview */}
            <section class="doc-section">
                <h2>Available UML Shapes</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Diagram Type</th>
                            <th>Purpose</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Class Box</strong></td>
                            <td>Class Diagram</td>
                            <td>Represents a class with attributes and methods</td>
                        </tr>
                        <tr>
                            <td><strong>Interface</strong></td>
                            <td>Class Diagram</td>
                            <td>Interface definition</td>
                        </tr>
                        <tr>
                            <td><strong>Actor</strong></td>
                            <td>Use Case</td>
                            <td>External entity interacting with the system</td>
                        </tr>
                        <tr>
                            <td><strong>Use Case</strong></td>
                            <td>Use Case</td>
                            <td>A system function or feature</td>
                        </tr>
                        <tr>
                            <td><strong>Lifeline</strong></td>
                            <td>Sequence</td>
                            <td>Object's existence over time</td>
                        </tr>
                        <tr>
                            <td><strong>Activation Bar</strong></td>
                            <td>Sequence</td>
                            <td>Period of active processing</td>
                        </tr>
                        <tr>
                            <td><strong>State</strong></td>
                            <td>State Machine</td>
                            <td>A state in the state machine</td>
                        </tr>
                        <tr>
                            <td><strong>Component</strong></td>
                            <td>Component</td>
                            <td>A modular software component</td>
                        </tr>
                        <tr>
                            <td><strong>Package</strong></td>
                            <td>Package</td>
                            <td>Groups related elements</td>
                        </tr>
                        <tr>
                            <td><strong>Note</strong></td>
                            <td>All</td>
                            <td>Comments and annotations</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Class Diagrams */}
            <section class="doc-section">
                <h2>Class Diagrams</h2>
                <p>
                    Model the static structure of a system showing classes,
                    their attributes, methods, and relationships.
                </p>

                <h3>Class Box Structure</h3>
                <div class="code-block">
{`┌─────────────────────┐
│     ClassName       │  ← Class name (bold)
├─────────────────────┤
│ - privateAttr: Type │  ← Attributes
│ + publicAttr: Type  │
├─────────────────────┤
│ + method(): RetType │  ← Methods
│ - helper(): void    │
└─────────────────────┘`}
                </div>

                <h3>Visibility Modifiers</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Visibility</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>+</strong></td>
                            <td>Public</td>
                        </tr>
                        <tr>
                            <td><strong>-</strong></td>
                            <td>Private</td>
                        </tr>
                        <tr>
                            <td><strong>#</strong></td>
                            <td>Protected</td>
                        </tr>
                        <tr>
                            <td><strong>~</strong></td>
                            <td>Package</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Relationships</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Arrow Style</th>
                            <th>Relationship</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Solid line, open arrow</td>
                            <td>Association</td>
                        </tr>
                        <tr>
                            <td>Solid line, filled diamond</td>
                            <td>Composition</td>
                        </tr>
                        <tr>
                            <td>Solid line, hollow diamond</td>
                            <td>Aggregation</td>
                        </tr>
                        <tr>
                            <td>Dashed line, open arrow</td>
                            <td>Dependency</td>
                        </tr>
                        <tr>
                            <td>Solid line, hollow triangle</td>
                            <td>Inheritance</td>
                        </tr>
                        <tr>
                            <td>Dashed line, hollow triangle</td>
                            <td>Implementation</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Use Case Diagrams */}
            <section class="doc-section">
                <h2>Use Case Diagrams</h2>
                <p>
                    Show system functionality from a user's perspective.
                    Identify actors and the use cases they interact with.
                </p>

                <h3>Elements</h3>
                <ul>
                    <li><strong>Actor (stick figure)</strong> - External entity (user, system)</li>
                    <li><strong>Use Case (ellipse)</strong> - System function</li>
                    <li><strong>System boundary (rectangle)</strong> - Scope of the system</li>
                </ul>

                <h3>Relationships</h3>
                <ul>
                    <li><strong>Association</strong> - Actor participates in use case</li>
                    <li><strong>Include</strong> - Use case includes another (dashed arrow)</li>
                    <li><strong>Extend</strong> - Optional extension of a use case</li>
                    <li><strong>Generalization</strong> - Inheritance between actors/use cases</li>
                </ul>
            </section>

            {/* Sequence Diagrams */}
            <section class="doc-section">
                <h2>Sequence Diagrams</h2>
                <p>
                    Show how objects interact over time through message passing.
                </p>

                <h3>Elements</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Element</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Lifeline</strong></td>
                            <td>Vertical dashed line showing object's existence</td>
                        </tr>
                        <tr>
                            <td><strong>Activation Bar</strong></td>
                            <td>Rectangle on lifeline showing active processing</td>
                        </tr>
                        <tr>
                            <td><strong>Message (solid arrow)</strong></td>
                            <td>Synchronous method call</td>
                        </tr>
                        <tr>
                            <td><strong>Response (dashed arrow)</strong></td>
                            <td>Return value</td>
                        </tr>
                        <tr>
                            <td><strong>Fragment</strong></td>
                            <td>Groups messages (loop, alt, opt)</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Reading Sequence Diagrams</h5>
                    <p>
                        Time flows from top to bottom. Messages between lifelines show
                        the order of interactions between objects.
                    </p>
                </div>

                <h3>Generate from text (DSL)</h3>
                <p>
                    The fastest way to build a complete sequence diagram is to describe it
                    in the <strong>Import Diagram</strong> dialog (Mermaid <code>sequenceDiagram</code>
                    syntax or native YSL). Yappy lays out lifelines, cascades the messages,
                    and draws combined fragments, notes and activation bars automatically.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Feature</th><th>Mermaid</th><th>YSL</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Participant / actor</td><td><code>participant A as Alice</code> / <code>actor U as User</code></td><td><code>a [lifeline] "Alice"</code> / <code>u [actor] "User"</code></td></tr>
                        <tr><td>Sync call (solid, filled head)</td><td><code>A-&gt;&gt;B: msg</code></td><td><code>a -&gt;&gt; b "msg"</code></td></tr>
                        <tr><td>Reply (dashed)</td><td><code>B--&gt;&gt;A: ok</code></td><td><code>b --&gt;&gt; a "ok"</code></td></tr>
                        <tr><td>Async / lost</td><td><code>A-)B</code> / <code>A-xB</code></td><td><code>a -&gt; b</code></td></tr>
                        <tr><td>Self message</td><td><code>A-&gt;&gt;A: think</code></td><td><code>a -&gt;&gt; a "think"</code></td></tr>
                        <tr><td>Activation</td><td><code>A-&gt;&gt;+B</code> … <code>B--&gt;&gt;-A</code></td><td><code>activate b</code> … <code>deactivate b</code></td></tr>
                        <tr><td>Loop / opt / break</td><td><code>loop label</code> … <code>end</code></td><td><code>loop "label"</code> … <code>end</code></td></tr>
                        <tr><td>Alternatives</td><td><code>alt cond</code> … <code>else other</code> … <code>end</code></td><td><code>alt "cond"</code> … <code>else "other"</code> … <code>end</code></td></tr>
                        <tr><td>Parallel</td><td><code>par a</code> … <code>and b</code> … <code>end</code></td><td><code>par "a"</code> … <code>and "b"</code> … <code>end</code></td></tr>
                        <tr><td>Note</td><td><code>Note over A,B: text</code></td><td><code>note over a,b "text"</code></td></tr>
                        <tr><td>Auto-number messages</td><td><code>autonumber</code></td><td><code>autonumber</code></td></tr>
                    </tbody>
                </table>
                <div class="tip-box">
                    <h5>Known limitations</h5>
                    <p>
                        Lost-message (<code>-x</code>) arrows render with a normal arrowhead (no cross
                        glyph yet), and nested activation bars on the same lifeline are staggered
                        rather than precisely boxed. Generated diagrams are fully editable on the
                        canvas afterwards — drag participants, edit message text, or restyle any element.
                    </p>
                </div>
            </section>

            {/* State Diagrams */}
            <section class="doc-section">
                <h2>State Machine Diagrams</h2>
                <p>
                    Model the dynamic behavior of an object through its states
                    and transitions.
                </p>

                <h3>Elements</h3>
                <ul>
                    <li><strong>Initial State</strong> - Filled circle (start point)</li>
                    <li><strong>State</strong> - Rounded rectangle with state name</li>
                    <li><strong>Transition</strong> - Arrow with event/guard/action</li>
                    <li><strong>Final State</strong> - Circle with inner filled circle</li>
                </ul>

                <h3>Transition Syntax</h3>
                <div class="code-block">
{`event [guard] / action

Examples:
- click [isEnabled] / doAction()
- timeout / retry()
- submit [isValid]`}
                </div>
            </section>

            {/* Component Diagrams */}
            <section class="doc-section">
                <h2>Component Diagrams</h2>
                <p>
                    Show the organization and dependencies among software components.
                </p>

                <h3>Elements</h3>
                <ul>
                    <li><strong>Component</strong> - Rectangle with component icon</li>
                    <li><strong>Interface (provided)</strong> - Lollipop symbol</li>
                    <li><strong>Interface (required)</strong> - Socket symbol</li>
                    <li><strong>Port</strong> - Small square on component edge</li>
                </ul>
            </section>

            {/* Deployment Diagrams */}
            <section class="doc-section">
                <h2>Deployment Diagrams</h2>
                <p>
                    Show how software is deployed onto hardware/runtime nodes and which
                    artifacts run where. Find <strong>Deployment Node</strong> and
                    <strong>Artifact</strong> in the <strong>Architecture</strong> toolbar group
                    (UML Structure section), or via DSL with <code>[node]</code> / <code>[artifact]</code>.
                </p>
                <table class="api-table">
                    <thead><tr><th>Element</th><th>Description</th></tr></thead>
                    <tbody>
                        <tr><td><strong>Deployment Node</strong></td><td>3-D box for a device, server or execution environment (label on the front face).</td></tr>
                        <tr><td><strong>Artifact</strong></td><td>Rectangle with a folded-corner document icon — a deployable file (e.g. <code>app.jar</code>, a binary, a script).</td></tr>
                    </tbody>
                </table>
                <p>Both render in sketch and architectural styles and accept full fill / stroke / text styling.</p>
            </section>

            {/* Best Practices */}
            <section class="doc-section">
                <h2>UML Best Practices</h2>
                <ul>
                    <li><strong>Keep it simple</strong> - Don't try to model everything</li>
                    <li><strong>Use consistent notation</strong> - Follow UML conventions</li>
                    <li><strong>Label relationships</strong> - Add multiplicities and roles</li>
                    <li><strong>Group related elements</strong> - Use packages for organization</li>
                    <li><strong>Add notes</strong> - Clarify complex parts with annotations</li>
                </ul>
            </section>
        </div>
    );
};

export default UmlDoc;
