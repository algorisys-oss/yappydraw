/**
 * Connectors Documentation
 * Lines, Arrows, Bezier Curves, Polylines
 */

import type { Component } from 'solid-js';

export const ConnectorsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Connectors</h1>
                <p class="doc-intro">
                    Connect shapes and create relationships with lines, arrows, and curves.
                    Connectors automatically maintain their connections when shapes are moved.
                </p>
            </header>

            {/* Connector Types */}
            <section class="doc-section">
                <h2>Connector Types</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Shortcut</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Line</strong></td>
                            <td><span class="kbd">L</span> or <span class="kbd">4</span></td>
                            <td>Simple straight line between two points</td>
                        </tr>
                        <tr>
                            <td><strong>Arrow</strong></td>
                            <td><span class="kbd">A</span> or <span class="kbd">5</span></td>
                            <td>Line with arrowhead(s) showing direction</td>
                        </tr>
                        <tr>
                            <td><strong>Bezier Curve</strong></td>
                            <td><span class="kbd">B</span> or <span class="kbd">0</span></td>
                            <td>Smooth curve with control points</td>
                        </tr>
                        <tr>
                            <td><strong>Polyline</strong></td>
                            <td>Toolbar</td>
                            <td>Multi-segment line with corners</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Smart Binding */}
            <section class="doc-section">
                <h2>Smart Binding</h2>
                <p>
                    Connectors can bind to shapes, automatically maintaining their connection
                    when shapes are moved, resized, or rotated.
                </p>

                <h3>How to Bind</h3>
                <ol>
                    <li>Select a connector tool (Line or Arrow)</li>
                    <li>Hover over a shape until you see binding points</li>
                    <li>Click and drag from the binding point</li>
                    <li>Drag to another shape's binding point</li>
                    <li>Release to complete the connection</li>
                </ol>

                <div class="tip-box">
                    <h5>Binding Points</h5>
                    <p>
                        Shapes have multiple binding points: center, top, bottom, left, and right edges.
                        The connector will snap to the nearest point when you hover.
                    </p>
                </div>
            </section>

            {/* Arrow Styles */}
            <section class="doc-section">
                <h2>Arrow Styles</h2>
                <p>Customize arrow appearance with different head and tail styles:</p>

                <h3>Arrowhead Types</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Arrow</strong></td>
                            <td>Standard triangular arrowhead</td>
                        </tr>
                        <tr>
                            <td><strong>Triangle</strong></td>
                            <td>Filled triangle head</td>
                        </tr>
                        <tr>
                            <td><strong>Circle</strong></td>
                            <td>Circular endpoint</td>
                        </tr>
                        <tr>
                            <td><strong>Diamond</strong></td>
                            <td>Diamond-shaped endpoint</td>
                        </tr>
                        <tr>
                            <td><strong>None</strong></td>
                            <td>No arrowhead (plain line end)</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Bidirectional Arrows</h3>
                <p>
                    Enable arrowheads on both ends for bidirectional relationships.
                    Set both start and end styles to create two-way arrows.
                </p>
            </section>

            {/* Bezier Curves */}
            <section class="doc-section">
                <h2>Bezier Curves</h2>
                <p>
                    Create smooth, flowing curves with precise control over the path shape.
                </p>

                <h3>Editing Bezier Curves</h3>
                <ol>
                    <li>Draw the initial curve by clicking start and end points</li>
                    <li>Select the curve to reveal control handles</li>
                    <li>Drag control points to adjust the curve shape</li>
                    <li>Control handles affect the curve's direction and steepness</li>
                </ol>

                <div class="tip-box">
                    <h5>Tip: Symmetric Curves</h5>
                    <p>
                        Hold <span class="kbd">Shift</span> while dragging a control point
                        to constrain movement to horizontal or vertical.
                    </p>
                </div>
            </section>

            {/* Line Routing */}
            <section class="doc-section">
                <h2>Line Routing</h2>
                <p>Choose how connectors navigate between shapes:</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Routing</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Straight</strong></td>
                            <td>Direct line between points</td>
                        </tr>
                        <tr>
                            <td><strong>Curved</strong></td>
                            <td>Smooth S-curve or C-curve</td>
                        </tr>
                        <tr>
                            <td><strong>Orthogonal</strong></td>
                            <td>Right-angle turns only (elbow connectors)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Styling Options */}
            <section class="doc-section">
                <h2>Styling Options</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Stroke Color</strong></td>
                            <td>Line color</td>
                        </tr>
                        <tr>
                            <td><strong>Stroke Width</strong></td>
                            <td>Line thickness (1-10px typically)</td>
                        </tr>
                        <tr>
                            <td><strong>Stroke Style</strong></td>
                            <td>Solid, dashed, or dotted</td>
                        </tr>
                        <tr>
                            <td><strong>Roughness</strong></td>
                            <td>Hand-drawn appearance</td>
                        </tr>
                        <tr>
                            <td><strong>Opacity</strong></td>
                            <td>Transparency level</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Use Cases */}
            <section class="doc-section">
                <h2>Common Use Cases</h2>

                <h3>Flowcharts</h3>
                <p>Use arrows to show process flow direction. Dashed lines indicate alternate paths.</p>

                <h3>Architecture Diagrams</h3>
                <p>
                    Use different arrowhead styles to indicate data flow direction.
                    Bidirectional arrows for two-way communication.
                </p>

                <h3>Mind Maps</h3>
                <p>
                    Curved lines create organic, flowing connections between nodes.
                    No arrowheads needed for hierarchical relationships.
                </p>

                <h3>Sequence Diagrams</h3>
                <p>
                    Solid arrows for synchronous calls, dashed arrows for responses.
                    Use orthogonal routing for clean, professional diagrams.
                </p>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">L</span> or <span class="kbd">4</span>
                        </div>
                        <span class="shortcut-desc">Line tool</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">A</span> or <span class="kbd">5</span>
                        </div>
                        <span class="shortcut-desc">Arrow tool</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">B</span> or <span class="kbd">0</span>
                        </div>
                        <span class="shortcut-desc">Bezier curve</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span>+<span class="kbd">Drag</span>
                        </div>
                        <span class="shortcut-desc">Constrain to 45° angles</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ConnectorsDoc;
