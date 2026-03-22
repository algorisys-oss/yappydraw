import type { Component } from 'solid-js';

const BulkEditingDoc: Component = () => {
    return (
        <div class="doc-content">
            <h1>Bulk Editing & Selection</h1>
            <p>
                Yappy provides powerful tools for selecting multiple elements and editing their properties in bulk.
                This makes it easy to maintain visual consistency across diagrams with many shapes.
            </p>

            <h2>Multi-Select Property Editing</h2>
            <p>
                When you select multiple shapes (Shift+click or drag a selection box), the Property Panel
                shows all properties that are <strong>common to every selected element type</strong>.
            </p>
            <ul>
                <li>If all selected elements share the same value for a property, that value is displayed normally.</li>
                <li>If values differ, a <strong>"Mixed"</strong> indicator appears (badge, italic label, placeholder, or indeterminate checkbox).</li>
                <li>Changing any property applies the new value to <strong>all selected elements</strong> at once.</li>
            </ul>
            <p>
                The panel header shows <strong>Selection (N)</strong> with the count, and a summary of selected
                element types (e.g., "3 rectangle, 2 arrow"). Alignment and distribution controls are also
                available at the top of the panel.
            </p>

            <h2>Select by Type</h2>
            <p>
                Right-click the canvas or any element to access the <strong>Select by Type</strong> submenu.
                This lets you quickly select all elements of a certain category or shape type.
            </p>
            <table class="doc-table">
                <thead>
                    <tr>
                        <th>Option</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>All Lines & Arrows</strong></td>
                        <td>Select all line and arrow connectors</td>
                    </tr>
                    <tr>
                        <td><strong>All Text & Notes</strong></td>
                        <td>Select all text, rich text, and sticky note elements</td>
                    </tr>
                    <tr>
                        <td><strong>All Images / Videos</strong></td>
                        <td>Select all image or video elements</td>
                    </tr>
                    <tr>
                        <td><strong>All Shapes</strong></td>
                        <td>Select all non-linear, non-text, non-media shapes</td>
                    </tr>
                    <tr>
                        <td><strong>All Same Type</strong></td>
                        <td>Select all elements matching the type(s) of your current selection</td>
                    </tr>
                    <tr>
                        <td><strong>Per-type entries</strong></td>
                        <td>Individual type entries with counts (e.g., "rectangle (5)")</td>
                    </tr>
                </tbody>
            </table>

            <h2>Select by Same Property</h2>
            <p>
                When a single element is selected, right-click to access the <strong>Select by Same Property</strong>
                submenu. This finds all elements on the canvas that share a specific property value with the
                selected element.
            </p>
            <table class="doc-table">
                <thead>
                    <tr>
                        <th>Matchable Property</th>
                        <th>Example</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Fill Color</td><td>Same Fill Color: #e03131 (7)</td></tr>
                    <tr><td>Stroke Color</td><td>Same Stroke Color: #000000 (12)</td></tr>
                    <tr><td>Text Color</td><td>Same Text Color: #333333 (5)</td></tr>
                    <tr><td>Stroke Width</td><td>Same Stroke Width: 2px (9)</td></tr>
                    <tr><td>Font Size</td><td>Same Font Size: 16px (4)</td></tr>
                    <tr><td>Font Family</td><td>Same Font Family: sans-serif (6)</td></tr>
                    <tr><td>Opacity</td><td>Same Opacity: 100% (15)</td></tr>
                    <tr><td>Fill Style</td><td>Same Fill Style: solid (10)</td></tr>
                    <tr><td>Stroke Style</td><td>Same Stroke Style: dashed (3)</td></tr>
                    <tr><td>Drawing Style</td><td>Same Drawing Style: sketch (8)</td></tr>
                </tbody>
            </table>

            <h2>Typical Workflow</h2>
            <ol>
                <li><strong>Select by type or property</strong> — Right-click → "Select by Type" → "All Lines & Arrows", or "Select by Same Property" → "Same Fill Color"</li>
                <li><strong>Review selection</strong> — Property panel shows common properties with mixed value indicators</li>
                <li><strong>Bulk edit</strong> — Change any property (color, font, stroke, etc.) to apply it to all selected elements</li>
            </ol>

            <h2>Tips</h2>
            <ul>
                <li>Hold <strong>Shift</strong> and click to add/remove elements from the current selection.</li>
                <li>Use <strong>Ctrl+A</strong> to select all elements, then use the property panel to change shared properties.</li>
                <li>The "Mixed" indicator tells you at a glance which properties vary across your selection.</li>
                <li>You can combine Select by Type with manual Shift+click to refine your selection before bulk editing.</li>
            </ul>
        </div>
    );
};

export default BulkEditingDoc;
