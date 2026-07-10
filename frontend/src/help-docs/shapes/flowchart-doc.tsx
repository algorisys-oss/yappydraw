/**
 * Flowchart Shapes Documentation
 * Standard flowchart symbols and diagram elements
 */

import type { Component } from 'solid-js';

export const FlowchartDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Flowchart Shapes</h1>
                <p class="doc-intro">
                    Standard flowchart symbols following ISO 5807 conventions.
                    Create professional process flows, algorithms, and workflow diagrams.
                </p>
            </header>

            {/* Standard Symbols */}
            <section class="doc-section">
                <h2>Standard Flowchart Symbols</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Shape</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Process</strong></td>
                            <td>Rectangle</td>
                            <td>A processing step or action</td>
                        </tr>
                        <tr>
                            <td><strong>Decision</strong></td>
                            <td>Diamond</td>
                            <td>A yes/no question or branch point</td>
                        </tr>
                        <tr>
                            <td><strong>Start/End</strong></td>
                            <td>Circle/Oval</td>
                            <td>Beginning or termination point</td>
                        </tr>
                        <tr>
                            <td><strong>Data</strong></td>
                            <td>Parallelogram</td>
                            <td>Input/output of data</td>
                        </tr>
                        <tr>
                            <td><strong>Document</strong></td>
                            <td>Document shape</td>
                            <td>A printed document or report</td>
                        </tr>
                        <tr>
                            <td><strong>Database</strong></td>
                            <td>Cylinder</td>
                            <td>Data storage or database</td>
                        </tr>
                        <tr>
                            <td><strong>Predefined Process</strong></td>
                            <td>Rectangle with bars</td>
                            <td>A subroutine or function call</td>
                        </tr>
                        <tr>
                            <td><strong>Manual Operation</strong></td>
                            <td>Trapezoid</td>
                            <td>A manual/human process step</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Process Shape */}
            <section class="doc-section">
                <h2>Process (Rectangle)</h2>
                <p>
                    The most common flowchart symbol. Represents any processing step,
                    action, or operation in a workflow.
                </p>

                <h3>Best Practices</h3>
                <ul>
                    <li>Use verb phrases: "Calculate total", "Send email"</li>
                    <li>Keep descriptions concise (2-5 words)</li>
                    <li>One action per box</li>
                    <li>Maintain consistent sizing</li>
                </ul>

                <div class="tip-box">
                    <h5>Tip</h5>
                    <p>
                        Use rounded rectangles for a softer, more modern appearance.
                        Adjust the border radius in the properties panel.
                    </p>
                </div>
            </section>

            {/* Decision Shape */}
            <section class="doc-section">
                <h2>Decision (Diamond)</h2>
                <p>
                    Represents a point where the flow branches based on a condition.
                    Always has at least two exit paths (Yes/No, True/False).
                </p>

                <h3>Guidelines</h3>
                <ul>
                    <li>Frame as a yes/no question</li>
                    <li>Label output paths clearly (Yes/No, True/False)</li>
                    <li>"Yes" typically exits right or down</li>
                    <li>"No" typically exits left or down</li>
                </ul>

                <div class="code-block">
{`Example Decision Labels:
- "Is order valid?"
- "User authenticated?"
- "Amount > $1000?"
- "All items processed?"`}
                </div>
            </section>

            {/* Database Shape */}
            <section class="doc-section">
                <h2>Database (Cylinder)</h2>
                <p>
                    Represents data storage, typically a database system.
                    The cylinder shape mimics traditional disk storage.
                </p>

                <h3>Use Cases</h3>
                <ul>
                    <li>Database read/write operations</li>
                    <li>Data warehouses</li>
                    <li>File systems</li>
                    <li>Cache storage</li>
                </ul>
            </section>

            {/* Document Shape */}
            <section class="doc-section">
                <h2>Document</h2>
                <p>
                    Represents a printed document, report, or form.
                    The wavy bottom edge symbolizes a piece of paper.
                </p>

                <h3>When to Use</h3>
                <ul>
                    <li>Reports being generated</li>
                    <li>Forms being created or processed</li>
                    <li>Printed output</li>
                    <li>Paper documents in a workflow</li>
                </ul>
            </section>

            {/* Predefined Process */}
            <section class="doc-section">
                <h2>Predefined Process</h2>
                <p>
                    A rectangle with vertical bars on the sides. Represents a
                    subroutine, function call, or process defined elsewhere.
                </p>

                <h3>Use For</h3>
                <ul>
                    <li>Function or method calls</li>
                    <li>References to other flowcharts</li>
                    <li>Reusable process blocks</li>
                    <li>Library or API calls</li>
                </ul>
            </section>

            {/* Flow Lines */}
            <section class="doc-section">
                <h2>Flow Lines (Arrows)</h2>
                <p>
                    Arrows connect shapes and show the direction of process flow.
                </p>

                <h3>Arrow Conventions</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Style</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Solid arrow</strong></td>
                            <td>Primary flow direction</td>
                        </tr>
                        <tr>
                            <td><strong>Dashed arrow</strong></td>
                            <td>Alternate or exception path</td>
                        </tr>
                        <tr>
                            <td><strong>Bidirectional</strong></td>
                            <td>Two-way data flow</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Best Practice</h5>
                    <p>
                        Maintain consistent flow direction: top-to-bottom for main flow,
                        left-to-right for secondary paths. Avoid crossing lines when possible.
                    </p>
                </div>
            </section>

            {/* Layout Tips */}
            <section class="doc-section">
                <h2>Layout Guidelines</h2>
                <ul>
                    <li><strong>Start at the top</strong> - Begin with start symbol at top center</li>
                    <li><strong>Flow downward</strong> - Main process flows top to bottom</li>
                    <li><strong>Align shapes</strong> - Use grid snapping for clean alignment</li>
                    <li><strong>Consistent sizing</strong> - Keep similar shapes the same size</li>
                    <li><strong>Minimize crossings</strong> - Rearrange to avoid line crossings</li>
                    <li><strong>Label decision branches</strong> - Always label Yes/No paths</li>
                </ul>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Quick Access</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">R</span>
                        </div>
                        <span class="shortcut-desc">Rectangle (Process)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">D</span>
                        </div>
                        <span class="shortcut-desc">Diamond (Decision)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">O</span>
                        </div>
                        <span class="shortcut-desc">Circle (Start/End)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">A</span>
                        </div>
                        <span class="shortcut-desc">Arrow (Flow line)</span>
                    </div>
                </div>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Flowchart symbols are plain shapes, so build them from the console via the
                    global <code>window.Yappy</code> object with the generic
                    <code>createElement(type, x, y, width, height, options)</code> and wire them
                    up with <code>createArrow</code>.
                </p>
                <pre class="code-block"><code>{`// Start -> Process -> Decision
const start = Yappy.createElement('ellipse', 120, 40, 120, 50, { containerText: 'Start' });
const proc  = Yappy.createElement('rectangle', 120, 130, 120, 60, { containerText: 'Validate input' });
const dec   = Yappy.createElement('diamond', 110, 230, 140, 90, { containerText: 'Valid?' });

Yappy.createArrow(180, 90, 180, 130);   // Start -> Process
Yappy.createArrow(180, 190, 180, 230);  // Process -> Decision`}</code></pre>
                <p>
                    Symbol → <code>type</code> string: <strong>Process</strong> =
                    <code>rectangle</code>, <strong>Decision</strong> = <code>diamond</code>,
                    <strong>Start/End</strong> = <code>ellipse</code> (or <code>circle</code>),
                    <strong>Data</strong> = <code>parallelogram</code>,
                    <strong>Document</strong> = <code>document</code>,
                    <strong>Database</strong> = <code>cylinder</code>,
                    <strong>Predefined Process</strong> = <code>predefinedProcess</code>,
                    <strong>Manual Operation</strong> = <code>trapezoid</code>.
                </p>
                <p class="tip-box">
                    Pass a label as <code>containerText</code>, and restyle any shape afterwards
                    with <code>Yappy.updateElement(id, {`{ backgroundColor: '#eef', strokeColor: '#334' }`})</code>.
                </p>
            </section>
        </div>
    );
};

export default FlowchartDoc;
