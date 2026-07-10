/**
 * Geometric Shapes Documentation
 * Hexagon, Octagon, Star, Polygon, Pentagon, and more
 */

import type { Component } from 'solid-js';

export const GeometricShapesDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Geometric Shapes</h1>
                <p class="doc-intro">
                    Extended geometric shapes for creating visually interesting diagrams,
                    technical illustrations, and decorative elements.
                </p>
            </header>

            {/* Shape Gallery */}
            <section class="doc-section">
                <h2>Available Shapes</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                            <th>Common Uses</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Pentagon</strong></td>
                            <td>5-sided polygon</td>
                            <td>Security badges, home icons</td>
                        </tr>
                        <tr>
                            <td><strong>Hexagon</strong></td>
                            <td>6-sided polygon</td>
                            <td>Honeycomb patterns, tech diagrams, microservices</td>
                        </tr>
                        <tr>
                            <td><strong>Septagon</strong></td>
                            <td>7-sided polygon (heptagon)</td>
                            <td>Decorative elements</td>
                        </tr>
                        <tr>
                            <td><strong>Octagon</strong></td>
                            <td>8-sided polygon</td>
                            <td>Stop signs, attention indicators</td>
                        </tr>
                        <tr>
                            <td><strong>Star</strong></td>
                            <td>Configurable star shape</td>
                            <td>Ratings, highlights, favorites</td>
                        </tr>
                        <tr>
                            <td><strong>Polygon</strong></td>
                            <td>N-sided regular polygon</td>
                            <td>Custom geometric patterns</td>
                        </tr>
                        <tr>
                            <td><strong>Parallelogram</strong></td>
                            <td>Slanted rectangle</td>
                            <td>Data input/output in flowcharts</td>
                        </tr>
                        <tr>
                            <td><strong>Trapezoid</strong></td>
                            <td>4-sided with parallel top/bottom</td>
                            <td>Manual operations, funnels</td>
                        </tr>
                        <tr>
                            <td><strong>Cross</strong></td>
                            <td>Plus or X shape</td>
                            <td>Add buttons, close icons, markers</td>
                        </tr>
                        <tr>
                            <td><strong>Heart</strong></td>
                            <td>Heart shape</td>
                            <td>Favorites, likes, love indicators</td>
                        </tr>
                        <tr>
                            <td><strong>Cloud</strong></td>
                            <td>Cloud shape</td>
                            <td>Cloud services, thoughts, storage</td>
                        </tr>
                        <tr>
                            <td><strong>Capsule</strong></td>
                            <td>Pill/rounded rectangle</td>
                            <td>Tags, buttons, node containers</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Star Configuration */}
            <section class="doc-section">
                <h2>Star Shape</h2>
                <p>
                    Stars are highly configurable - adjust the number of points and inner radius
                    to create different star styles.
                </p>

                <h3>Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Range</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Points</strong></td>
                            <td>3-12</td>
                            <td>Number of star points</td>
                        </tr>
                        <tr>
                            <td><strong>Inner Radius</strong></td>
                            <td>0.1-0.9</td>
                            <td>Depth of points (lower = sharper)</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Star Variations</h5>
                    <p>
                        <strong>5 points, 0.4 inner</strong> - Classic star<br/>
                        <strong>6 points, 0.5 inner</strong> - Star of David<br/>
                        <strong>4 points, 0.2 inner</strong> - Sparkle/twinkle
                    </p>
                </div>
            </section>

            {/* Polygon Configuration */}
            <section class="doc-section">
                <h2>Custom Polygon</h2>
                <p>
                    Create regular polygons with any number of sides. Great for creating
                    consistent geometric patterns.
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
                            <td><strong>Sides</strong></td>
                            <td>Number of polygon sides (3-20)</td>
                        </tr>
                        <tr>
                            <td><strong>Rotation</strong></td>
                            <td>Rotate the polygon orientation</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Hexagons */}
            <section class="doc-section">
                <h2>Hexagons</h2>
                <p>
                    Hexagons are popular in modern design, especially for representing
                    interconnected systems, microservices, and modular architectures.
                </p>

                <h3>Use Cases</h3>
                <ul>
                    <li><strong>Architecture diagrams</strong> - Microservices, modules</li>
                    <li><strong>Honeycomb patterns</strong> - Visual groupings</li>
                    <li><strong>Tech iconography</strong> - Modern tech stack representations</li>
                    <li><strong>Game design</strong> - Hex-based maps and grids</li>
                </ul>

                <div class="tip-box">
                    <h5>Tip: Hexagon Grids</h5>
                    <p>
                        Enable grid snapping to align hexagons perfectly when creating
                        honeycomb patterns or hex-based layouts.
                    </p>
                </div>
            </section>

            {/* 3D Shapes */}
            <section class="doc-section">
                <h2>3D Shapes</h2>
                <p>
                    Yappy includes several pseudo-3D shapes for creating depth in diagrams:
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Isometric Cube</strong></td>
                            <td>3D cube in isometric projection</td>
                        </tr>
                        <tr>
                            <td><strong>Solid Block</strong></td>
                            <td>3D rectangular block with depth</td>
                        </tr>
                        <tr>
                            <td><strong>Perspective Block</strong></td>
                            <td>Box with perspective vanishing point</td>
                        </tr>
                        <tr>
                            <td><strong>Cylinder</strong></td>
                            <td>3D cylinder (databases, storage)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Styling */}
            <section class="doc-section">
                <h2>Styling Options</h2>
                <p>All geometric shapes support these styling options:</p>

                <ul>
                    <li><strong>Fill Color</strong> - Background fill color</li>
                    <li><strong>Stroke Color</strong> - Border/outline color</li>
                    <li><strong>Fill Style</strong> - Solid, hachure, cross-hatch, or none</li>
                    <li><strong>Stroke Style</strong> - Solid, dashed, or dotted</li>
                    <li><strong>Stroke Width</strong> - Border thickness</li>
                    <li><strong>Roughness</strong> - Hand-drawn appearance intensity</li>
                    <li><strong>Opacity</strong> - Transparency level</li>
                </ul>
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
                    Geometric shapes are created through the global <code>window.Yappy</code> (usable as
                    <code> Yappy</code>). Most use the generic
                    <code> Yappy.createElement(type, x, y, w, h, opts)</code> with the shape's type string;
                    stars have a dedicated helper.
                </p>
                <pre class="code-block"><code>{`// Polygons & badges (type string = the shape name)
Yappy.createElement('hexagon', 80, 80, 120, 120);
Yappy.createElement('pentagon', 220, 80, 120, 120);
Yappy.createElement('octagon', 360, 80, 120, 120, { backgroundColor: '#ffc9c9' });
Yappy.createElement('cylinder', 80, 240, 120, 150);   // pseudo-3D
Yappy.createElement('isometricCube', 240, 240, 120, 120);

// Star: dedicated helper takes a point count
const star = Yappy.createStar(400, 240, 120, 120, 5, { starPoints: 5 });`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Shape</th><th>Type string</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Pentagon / Hexagon / Septagon / Octagon</td><td><code>'pentagon'</code>, <code>'hexagon'</code>, <code>'septagon'</code>, <code>'octagon'</code></td></tr>
                        <tr><td>Star</td><td><code>'star'</code> (or <code>createStar(...)</code>)</td></tr>
                        <tr><td>Polygon</td><td><code>'polygon'</code></td></tr>
                        <tr><td>Parallelogram / Trapezoid</td><td><code>'parallelogram'</code>, <code>'trapezoid'</code></td></tr>
                        <tr><td>Cross / Heart / Cloud / Capsule</td><td><code>'cross'</code>, <code>'heart'</code>, <code>'cloud'</code>, <code>'capsule'</code></td></tr>
                        <tr><td>3D blocks / Cylinder</td><td><code>'isometricCube'</code>, <code>'solidBlock'</code>, <code>'perspectiveBlock'</code>, <code>'cylinder'</code></td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Tune a star with <code>opts.starPoints</code>, and restyle any shape afterwards with
                    <code> Yappy.updateElement(id, {`{ backgroundColor, strokeColor, fillStyle, opacity }`})</code>.
                </p>
            </section>
        </div>
    );
};

export default GeometricShapesDoc;
