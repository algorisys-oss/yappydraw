/**
 * Basic Shapes Documentation
 * Rectangle, Circle, Diamond, Triangle
 */

import type { Component } from 'solid-js';

export const BasicShapesDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Basic Shapes</h1>
                <p class="doc-intro">
                    The fundamental building blocks for any diagram. These shapes form the foundation
                    for flowcharts, wireframes, architecture diagrams, and general-purpose illustrations.
                </p>
            </header>

            {/* Quick Reference */}
            <section class="doc-section">
                <h2>Quick Reference</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Shortcut</th>
                            <th>Common Uses</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Rectangle</strong></td>
                            <td><span class="kbd">R</span> or <span class="kbd">2</span></td>
                            <td>Process steps, containers, buttons, cards</td>
                        </tr>
                        <tr>
                            <td><strong>Circle</strong></td>
                            <td><span class="kbd">O</span> or <span class="kbd">3</span></td>
                            <td>Start/end points, nodes, avatars, bullets</td>
                        </tr>
                        <tr>
                            <td><strong>Diamond</strong></td>
                            <td><span class="kbd">D</span></td>
                            <td>Decision points, conditions, data flow</td>
                        </tr>
                        <tr>
                            <td><strong>Triangle</strong></td>
                            <td>Toolbar</td>
                            <td>Warnings, hierarchy, directional indicators</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Rectangle */}
            <section class="doc-section">
                <h2>Rectangle</h2>
                <p>
                    The most versatile shape in any diagramming tool. Use rectangles as containers,
                    process steps, UI components, or any bounded element.
                </p>

                <h3>Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Roundness</strong></td>
                            <td>Round all four corners at once (0 = sharp, higher = more rounded)</td>
                        </tr>
                        <tr>
                            <td><strong>Corner ↖ ↗ ↘ ↙</strong></td>
                            <td>Round each corner <em>independently</em> — one corner at 40 and the rest
                                sharp, or any mix. See below.</td>
                        </tr>
                        <tr>
                            <td><strong>Fill Style</strong></td>
                            <td>Solid, hachure, cross-hatch, or none</td>
                        </tr>
                        <tr>
                            <td><strong>Stroke Style</strong></td>
                            <td>Solid, dashed, or dotted border</td>
                        </tr>
                        <tr>
                            <td><strong>Roughness</strong></td>
                            <td>Hand-drawn appearance (0 = clean, higher = sketchy)</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Independent corners</h3>
                <p>
                    Below <strong>Roundness</strong> sit four per-corner sliders —
                    <strong>Corner ↖</strong>, <strong>↗</strong>, <strong>↘</strong>, <strong>↙</strong> — for
                    the shapes packaging, UI cards and logo work actually need: one rounded corner and three
                    sharp, a rounded diagonal pair, a tab with only its top edge softened.
                </p>
                <ul>
                    <li>A corner you never touch <strong>follows Roundness</strong>, so setting one corner does
                        not square the other three. Set a corner to <strong>0</strong> to make it explicitly
                        sharp while the rest stay round.</li>
                    <li>Values are a <strong>percent of the shorter side</strong>, the same unit Roundness uses —
                        so the corners keep their proportions when you resize the rectangle, and 50 is a
                        half-round end.</li>
                    <li>Each corner is capped at half the shorter side, which is the point where the arcs would
                        start crossing each other.</li>
                </ul>
                <p>
                    It is the real outline, not a decoration: the fill, gradient and image clipping follow it,
                    both <strong>Sketch</strong> and <strong>Architectural</strong> styles draw it, SVG export
                    writes one arc per rounded corner, and <em>Convert to Path</em> / Knife / Warp keep the
                    corners you set.
                </p>
                <pre class="code-block"><code>{`Yappy.createRectangle(40, 40, 240, 140, { radiusTL: 40 });               // one rounded corner
Yappy.createRectangle(40, 40, 240, 140, { radiusTL: 40, radiusBR: 40 }); // rounded diagonal
Yappy.createRectangle(40, 40, 240, 140, { borderRadius: 25, radiusTR: 0 });  // all but one`}</code></pre>

                <div class="tip-box">
                    <h5>Tip: Quick Squares</h5>
                    <p>
                        Hold <span class="kbd">Shift</span> while drawing to constrain to a perfect square.
                    </p>
                </div>
            </section>

            {/* Circle/Ellipse */}
            <section class="doc-section">
                <h2>Circle / Ellipse</h2>
                <p>
                    Draw circles for nodes, avatars, and state indicators. By default, circles maintain
                    their aspect ratio, but you can create ellipses by adjusting width and height independently.
                </p>

                <h3>Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Fill Style</strong></td>
                            <td>Solid, hachure, cross-hatch, or none</td>
                        </tr>
                        <tr>
                            <td><strong>Stroke Width</strong></td>
                            <td>Border thickness</td>
                        </tr>
                        <tr>
                            <td><strong>Opacity</strong></td>
                            <td>Transparency level (0-100%)</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Perfect Circles</h5>
                    <p>
                        Hold <span class="kbd">Shift</span> while drawing to maintain a 1:1 aspect ratio.
                    </p>
                </div>
            </section>

            {/* Diamond */}
            <section class="doc-section">
                <h2>Diamond</h2>
                <p>
                    The classic decision shape in flowcharts. Diamonds typically represent yes/no questions
                    or conditional branching points in process flows.
                </p>

                <h3>Common Uses</h3>
                <ul>
                    <li><strong>Flowcharts</strong> - Decision points with yes/no branches</li>
                    <li><strong>Data Flow Diagrams</strong> - Data transformation nodes</li>
                    <li><strong>State Machines</strong> - Conditional transitions</li>
                </ul>

                <div class="tip-box">
                    <h5>Best Practice</h5>
                    <p>
                        Label diamond shapes with questions that have clear yes/no answers.
                        Connect "Yes" and "No" branches to different paths.
                    </p>
                </div>
            </section>

            {/* Triangle */}
            <section class="doc-section">
                <h2>Triangle</h2>
                <p>
                    Triangles serve multiple purposes: warning indicators, hierarchy visualization,
                    directional markers, and decorative elements.
                </p>

                <h3>Variants</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Equilateral Triangle</strong></td>
                            <td>All sides equal - balanced, symmetrical look</td>
                        </tr>
                        <tr>
                            <td><strong>Right Triangle</strong></td>
                            <td>Has a 90° angle - useful for corners and technical diagrams</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Common Styling */}
            <section class="doc-section">
                <h2>Common Styling Options</h2>
                <p>All basic shapes share these styling options:</p>

                <h3>Fill Styles</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Style</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Solid</strong></td>
                            <td>Completely filled with background color</td>
                        </tr>
                        <tr>
                            <td><strong>Hachure</strong></td>
                            <td>Diagonal line pattern (hand-drawn feel)</td>
                        </tr>
                        <tr>
                            <td><strong>Cross-Hatch</strong></td>
                            <td>Crossed diagonal lines</td>
                        </tr>
                        <tr>
                            <td><strong>None</strong></td>
                            <td>Transparent fill, outline only</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Stroke Styles</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Style</th>
                            <th>Shortcut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Solid</strong></td>
                            <td>Press <span class="kbd">S</span> to cycle</td>
                        </tr>
                        <tr>
                            <td><strong>Dashed</strong></td>
                            <td>Press <span class="kbd">S</span> to cycle</td>
                        </tr>
                        <tr>
                            <td><strong>Dotted</strong></td>
                            <td>Press <span class="kbd">S</span> to cycle</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Text labels</h3>
                <p>
                    Double-click a shape (or select it and start typing) to give it a label. Text is
                    <strong> centred by default</strong> — both horizontally and vertically — which is what you want for
                    almost every diagram box. Change it per shape with the alignment buttons in the Properties panel or
                    the smart toolbar, or set <code>textAlign</code> to <code>'left'</code> / <code>'right'</code> from
                    the API. Code blocks and UML attribute/method sections stay left-aligned, and table cells keep their
                    own per-cell alignment.
                </p>
                <p>
                    While you type, the editor sits exactly where the label is drawn — same position, same line breaks,
                    same vertical alignment — so nothing shifts when you start or finish editing. Shapes that can't use
                    their full width for text (a circle, a diamond, a banner) wrap inside their inscribed area, and the
                    editor wraps there too. Press <span class="kbd">Esc</span> or <span class="kbd">Ctrl</span> +
                    <span class="kbd">Enter</span> to commit, <span class="kbd">Enter</span> for a new line.
                </p>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span> + <span class="kbd">Drag</span>
                        </div>
                        <span class="shortcut-desc">Constrain proportions</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Alt</span> + <span class="kbd">Drag</span>
                        </div>
                        <span class="shortcut-desc">Draw from center</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">S</span>
                        </div>
                        <span class="shortcut-desc">Cycle stroke style</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">F</span>
                        </div>
                        <span class="shortcut-desc">Cycle fill style</span>
                    </div>
                </div>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Create basic shapes from the console or a script via the global
                    <code> window.Yappy</code> (usable as <code>Yappy</code>). Each returns the new
                    element's <code>id</code>. Positions are canvas coordinates:
                    <code> (x, y)</code> is the top-left corner, then <code>width</code>, <code>height</code>.
                </p>
                <pre class="code-block"><code>{`// Dedicated helpers
Yappy.createRectangle(80, 80, 160, 90, { borderRadius: 12, backgroundColor: '#a5d8ff' });
Yappy.createCircle(300, 80, 100, 100, { fillStyle: 'hachure' });
Yappy.createDiamond(80, 240, 140, 100);
Yappy.createTriangle(300, 240, 120, 120, { strokeColor: '#e03131' });

// Generic form (type strings: 'rectangle' | 'circle' | 'diamond' | 'triangle')
const id = Yappy.createElement('rectangle', 0, 0, 200, 120, { roughness: 1.5 });

// Restyle afterwards
Yappy.updateElement(id, { backgroundColor: '#ffd43b', strokeWidth: 3 });`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Method</th><th>Type string</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>createRectangle(x, y, w, h, opts?)</code></td><td><code>'rectangle'</code></td></tr>
                        <tr><td><code>createCircle(x, y, w, h, opts?)</code></td><td><code>'circle'</code></td></tr>
                        <tr><td><code>createDiamond(x, y, w, h, opts?)</code></td><td><code>'diamond'</code></td></tr>
                        <tr><td><code>createTriangle(x, y, w, h, opts?)</code></td><td><code>'triangle'</code></td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Common <code>opts</code>: <code>backgroundColor</code>, <code>strokeColor</code>,
                    <code> strokeWidth</code>, <code>fillStyle</code> (<code>'solid' | 'hachure' | 'cross-hatch'</code>),
                    <code> strokeStyle</code> (<code>'solid' | 'dashed' | 'dotted'</code>),
                    <code> roughness</code>, <code>opacity</code>, <code>borderRadius</code>.
                </p>
            </section>
        </div>
    );
};

export default BasicShapesDoc;
