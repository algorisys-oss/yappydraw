/**
 * Mindmap Documentation
 * Mind mapping and brainstorming features
 */

import type { Component } from 'solid-js';

export const MindmapDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Mind Maps</h1>
                <p class="doc-intro">
                    Create hierarchical mind maps for brainstorming, note-taking, and
                    organizing ideas. Yappy's mind map mode provides automatic layout
                    and intuitive keyboard navigation.
                </p>
            </header>

            {/* Getting Started */}
            <section class="doc-section">
                <h2>Getting Started</h2>
                <ol>
                    <li>Select the <strong>Mind Map</strong> tool from the toolbar</li>
                    <li>Click on the canvas to create a central topic</li>
                    <li>Use keyboard shortcuts to add child and sibling nodes</li>
                    <li>The layout automatically arranges as you build</li>
                </ol>

                <div class="tip-box">
                    <h5>Quick Start</h5>
                    <p>
                        Double-click on the canvas with the mind map tool to create
                        a new root node and start building immediately.
                    </p>
                </div>
            </section>

            {/* Keyboard Navigation */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Tab</span>
                        </div>
                        <span class="shortcut-desc">Add child node (opens text editing)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Enter</span>
                        </div>
                        <span class="shortcut-desc">Add sibling node (opens text editing)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Space</span>
                        </div>
                        <span class="shortcut-desc">Toggle collapse/expand</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Delete</span>
                        </div>
                        <span class="shortcut-desc">Delete node and children</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Arrow Keys</span>
                        </div>
                        <span class="shortcut-desc">Navigate between nodes</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">F2</span>
                        </div>
                        <span class="shortcut-desc">Edit node text</span>
                    </div>
                </div>

                <div class="tip-box">
                    <h5>Keyboard-only flow</h5>
                    <p>
                        After a root exists, build the whole map without the mouse:
                        press <span class="kbd">Tab</span>/<span class="kbd">Enter</span> to
                        add a node — it drops straight into text editing so you can type
                        its label. Press <span class="kbd">Esc</span> to commit, then
                        <span class="kbd">Tab</span>/<span class="kbd">Enter</span> again
                        for the next. <span class="kbd">F2</span> re-edits the selected node.
                    </p>
                </div>
            </section>

            {/* Node Types */}
            <section class="doc-section">
                <h2>Node Styles</h2>
                <p>
                    Mind map nodes can use different container styles:
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Style</th>
                            <th>Description</th>
                            <th>Best For</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Rectangle</strong></td>
                            <td>Standard box container</td>
                            <td>General topics, formal maps</td>
                        </tr>
                        <tr>
                            <td><strong>Rounded</strong></td>
                            <td>Soft, rounded corners</td>
                            <td>Friendly, creative maps</td>
                        </tr>
                        <tr>
                            <td><strong>Cloud</strong></td>
                            <td>Organic cloud shape</td>
                            <td>Brainstorming, ideas</td>
                        </tr>
                        <tr>
                            <td><strong>Circle</strong></td>
                            <td>Circular node</td>
                            <td>Central topics, emphasis</td>
                        </tr>
                        <tr>
                            <td><strong>Capsule</strong></td>
                            <td>Pill-shaped container</td>
                            <td>Modern, clean look</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Branch Styles */}
            <section class="doc-section">
                <h2>Branch Styles</h2>
                <p>
                    The lines connecting nodes can have different appearances:
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Style</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Organic</strong></td>
                            <td>Curved, hand-drawn looking branches</td>
                        </tr>
                        <tr>
                            <td><strong>Straight</strong></td>
                            <td>Direct lines between nodes</td>
                        </tr>
                        <tr>
                            <td><strong>Curved</strong></td>
                            <td>Smooth bezier curves</td>
                        </tr>
                        <tr>
                            <td><strong>Orthogonal</strong></td>
                            <td>Right-angle connections</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Layout Options */}
            <section class="doc-section">
                <h2>Layout Options</h2>

                <h3>Auto Layout</h3>
                <p>
                    Mind maps automatically arrange nodes to prevent overlap and maintain
                    readable spacing. The layout updates as you add or remove nodes.
                </p>

                <h3>Manual Adjustment</h3>
                <ul>
                    <li>Drag nodes to reposition within their branch</li>
                    <li>The layout will adapt to your changes</li>
                    <li>Child nodes follow their parent when moved</li>
                </ul>

                <h3>Layout Directions</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Direction</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Radial</strong></td>
                            <td>Branches spread in all directions from center</td>
                        </tr>
                        <tr>
                            <td><strong>Right</strong></td>
                            <td>All branches extend to the right</td>
                        </tr>
                        <tr>
                            <td><strong>Left</strong></td>
                            <td>All branches extend to the left</td>
                        </tr>
                        <tr>
                            <td><strong>Down</strong></td>
                            <td>Branches flow downward (org chart style)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Collapsing */}
            <section class="doc-section">
                <h2>Collapsing Branches</h2>
                <p>
                    Hide child nodes to focus on high-level structure or reduce visual clutter.
                </p>

                <h3>How to Collapse</h3>
                <ul>
                    <li>Select a node and press <span class="kbd">Space</span></li>
                    <li>Click the collapse indicator on the node</li>
                    <li>Collapsed nodes show a badge indicating hidden children</li>
                </ul>

                <div class="tip-box">
                    <h5>Presentation Mode</h5>
                    <p>
                        Collapse branches before presenting, then progressively
                        reveal content by expanding branches during your talk.
                    </p>
                </div>
            </section>

            {/* Styling */}
            <section class="doc-section">
                <h2>Styling Mind Maps</h2>

                <h3>Color Coding</h3>
                <p>
                    Use different colors to categorize branches or indicate importance:
                </p>
                <ul>
                    <li>Each main branch can have its own color theme</li>
                    <li>Child nodes inherit parent colors by default</li>
                    <li>Override individual node colors as needed</li>
                </ul>

                <h3>Visual Hierarchy</h3>
                <ul>
                    <li><strong>Central topic</strong> - Largest, most prominent</li>
                    <li><strong>Main branches</strong> - Medium size, bold colors</li>
                    <li><strong>Sub-topics</strong> - Smaller, lighter colors</li>
                    <li><strong>Details</strong> - Smallest nodes</li>
                </ul>
            </section>

            {/* Use Cases */}
            <section class="doc-section">
                <h2>Common Use Cases</h2>

                <h3>Brainstorming</h3>
                <p>
                    Rapidly capture ideas without worrying about organization.
                    Add nodes quickly, reorganize later.
                </p>

                <h3>Note Taking</h3>
                <p>
                    Structure information hierarchically during meetings or lectures.
                    Main points branch into details.
                </p>

                <h3>Project Planning</h3>
                <p>
                    Break down projects into phases, tasks, and sub-tasks.
                    Visualize the scope at a glance.
                </p>

                <h3>Knowledge Mapping</h3>
                <p>
                    Organize and connect concepts for learning and retention.
                    Show relationships between ideas.
                </p>

                <h3>Decision Making</h3>
                <p>
                    Map out options, pros/cons, and consequences for
                    complex decisions.
                </p>
            </section>

            {/* Tips */}
            <section class="doc-section">
                <h2>Mind Mapping Tips</h2>
                <ul>
                    <li><strong>Start with the main idea</strong> - Place your central concept in the middle</li>
                    <li><strong>Use keywords</strong> - Keep node text brief (1-3 words)</li>
                    <li><strong>Add images</strong> - Visual elements aid memory</li>
                    <li><strong>Use colors meaningfully</strong> - Create a consistent color scheme</li>
                    <li><strong>Don't overthink</strong> - Capture ideas first, organize later</li>
                    <li><strong>Review and refine</strong> - Reorganize branches as the map grows</li>
                </ul>
            </section>
        </div>
    );
};

export default MindmapDoc;
