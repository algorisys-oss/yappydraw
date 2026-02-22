/**
 * Drawing Tools Documentation
 * Fineliner, Marker, Ink Brush, Pencil
 */

import type { Component } from 'solid-js';

export const DrawingToolsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Drawing Tools</h1>
                <p class="doc-intro">
                    Freehand drawing tools for sketching, annotating, and adding personal touches
                    to your diagrams. Each tool has unique characteristics for different drawing styles.
                </p>
            </header>

            {/* Tool Overview */}
            <section class="doc-section">
                <h2>Available Tools</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Tool</th>
                            <th>Shortcut</th>
                            <th>Characteristics</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Pencil</strong></td>
                            <td><span class="kbd">P</span> or <span class="kbd">8</span></td>
                            <td>Basic freehand drawing with consistent width</td>
                        </tr>
                        <tr>
                            <td><strong>Fineliner</strong></td>
                            <td>Toolbar</td>
                            <td>Precise, thin strokes for detailed work</td>
                        </tr>
                        <tr>
                            <td><strong>Marker</strong></td>
                            <td>Toolbar</td>
                            <td>Wide, bold strokes for highlighting</td>
                        </tr>
                        <tr>
                            <td><strong>Ink Brush</strong></td>
                            <td>Toolbar</td>
                            <td>Pressure-sensitive, calligraphic strokes</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Pencil */}
            <section class="doc-section">
                <h2>Pencil</h2>
                <p>
                    The default freehand drawing tool. Creates smooth, consistent-width strokes
                    perfect for quick sketches and annotations.
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
                            <td><strong>Stroke Width</strong></td>
                            <td>Line thickness (1-20px)</td>
                        </tr>
                        <tr>
                            <td><strong>Color</strong></td>
                            <td>Stroke color</td>
                        </tr>
                        <tr>
                            <td><strong>Opacity</strong></td>
                            <td>Transparency level</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Smooth Lines</h5>
                    <p>
                        Draw slowly for smoother lines. The pencil tool applies automatic
                        smoothing to reduce jagged edges.
                    </p>
                </div>
            </section>

            {/* Fineliner */}
            <section class="doc-section">
                <h2>Fineliner</h2>
                <p>
                    A precision drawing tool that produces thin, consistent strokes.
                    Ideal for detailed illustrations, signatures, and fine annotations.
                </p>

                <h3>Best For</h3>
                <ul>
                    <li>Technical sketches</li>
                    <li>Handwritten labels</li>
                    <li>Fine detail work</li>
                    <li>Signatures</li>
                </ul>
            </section>

            {/* Marker */}
            <section class="doc-section">
                <h2>Marker</h2>
                <p>
                    A bold, wide-stroke tool perfect for highlighting, emphasis,
                    and creating impactful visual elements.
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
                            <td><strong>Stroke Width</strong></td>
                            <td>Marker thickness (typically 10-30px)</td>
                        </tr>
                        <tr>
                            <td><strong>Opacity</strong></td>
                            <td>Semi-transparent for highlighter effect</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Highlighter Effect</h5>
                    <p>
                        Set opacity to 40-60% and use bright yellow or green for
                        a realistic highlighter effect over text and shapes.
                    </p>
                </div>
            </section>

            {/* Ink Brush */}
            <section class="doc-section">
                <h2>Ink Brush</h2>
                <p>
                    A calligraphic brush that varies stroke width based on drawing speed.
                    Creates elegant, expressive strokes with an organic feel.
                </p>

                <h3>Characteristics</h3>
                <ul>
                    <li><strong>Speed Sensitivity</strong> - Fast strokes are thinner, slow strokes are thicker</li>
                    <li><strong>Tapered Ends</strong> - Natural stroke start/end tapering</li>
                    <li><strong>Smooth Curves</strong> - Optimized for flowing, continuous lines</li>
                </ul>

                <h3>Best For</h3>
                <ul>
                    <li>Calligraphy and lettering</li>
                    <li>Artistic flourishes</li>
                    <li>Expressive illustrations</li>
                    <li>Asian-style brush strokes</li>
                </ul>
            </section>

            {/* Eraser */}
            <section class="doc-section">
                <h2>Eraser</h2>
                <p>
                    Remove parts of freehand drawings or delete entire elements.
                </p>

                <h3>Modes</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Mode</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Element Eraser</strong></td>
                            <td>Click to delete entire shapes/elements</td>
                        </tr>
                        <tr>
                            <td><strong>Stroke Eraser</strong></td>
                            <td>Erase portions of freehand strokes</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Quick Access</h5>
                    <p>
                        Press <span class="kbd">E</span> or <span class="kbd">7</span> to quickly switch to the eraser tool.
                    </p>
                </div>
            </section>

            {/* Laser Pointer */}
            <section class="doc-section">
                <h2>Laser Pointer</h2>
                <p>
                    A temporary drawing tool for presentations. Strokes fade away after a few seconds,
                    perfect for pointing out elements during screen sharing or presentations.
                </p>

                <h3>Usage</h3>
                <ul>
                    <li>Activate with <span class="kbd">Shift</span>+<span class="kbd">P</span></li>
                    <li>Draw attention to specific areas</li>
                    <li>Strokes automatically fade after ~2 seconds</li>
                    <li>Great for presentations and demos</li>
                </ul>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">P</span> or <span class="kbd">8</span>
                        </div>
                        <span class="shortcut-desc">Pencil tool</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">E</span> or <span class="kbd">7</span>
                        </div>
                        <span class="shortcut-desc">Eraser tool</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span>+<span class="kbd">P</span>
                        </div>
                        <span class="shortcut-desc">Laser pointer</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">[</span> / <span class="kbd">]</span>
                        </div>
                        <span class="shortcut-desc">Decrease/increase brush size</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DrawingToolsDoc;
