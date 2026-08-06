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
                shows every property that <strong>at least one selected element supports</strong>.
            </p>
            <ul>
                <li>Editing a property applies it to the selected elements that <strong>can</strong> take it, and leaves the rest alone. So <strong>Ctrl+A</strong> then picking a Font restyles every label and text box in one go — the freehand strokes, images and other objects in the selection are simply skipped.</li>
                <li>The value shown, and the "Mixed" check, also consider only those elements — a stroke with no font of its own won't make the Font row read as mixed.</li>
                <li>If all the relevant elements share the same value, that value is displayed normally.</li>
                <li>If values differ, a <strong>"Mixed"</strong> indicator appears (badge, italic label, placeholder, or indeterminate checkbox).</li>
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
                <li>Use <strong>Ctrl+A</strong> to select all elements, then use the property panel to change shared properties. If a drawing tool was active, Ctrl+A switches you to the Selection tool so the selection can be dragged, resized and edited straight away — press your tool's shortcut (<strong>7</strong> for the freehand brush) to go back to drawing.</li>
                <li>The "Mixed" indicator tells you at a glance which properties vary across your selection.</li>
                <li>You can combine Select by Type with manual Shift+click to refine your selection before bulk editing.</li>
            </ul>

            <h2>Scripting (API)</h2>
            <p>
                The same select-then-restyle workflow is scriptable from the global <code>window.Yappy</code>
                object. Use <strong>Magic Wand</strong> (<code>selectSimilar</code>) to grow a selection by a shared
                property, then loop over <code>getSelection()</code> and call <code>updateElement</code> to apply a
                bulk change.
            </p>
            <pre class="code-block"><code>{`const Y = window.Yappy;

// select every object that shares the first selected object's fill
Y.selectSimilar();

// match a different property (from a specific reference object)
Y.selectSimilar('rect-3', 'stroke');   // 'fill' | 'stroke' | 'both' |
                                       // 'fontFamily' | 'fontSize' | 'opacity' |
                                       // 'strokeWidth' | 'type'`}</code></pre>
            <p>Bulk-edit the current selection by updating each element:</p>
            <pre class="code-block"><code>{`const Y = window.Yappy;

// grab all blue shapes, then recolour + thicken them together
Y.selectSimilar(undefined, 'fill');
Y.getSelection().forEach(id =>
    Y.updateElement(id, { backgroundColor: '#e03131', strokeWidth: 3 })
);

// or set the selection explicitly by id
Y.setSelected(['rect-1', 'rect-2']);`}</code></pre>
            <table class="doc-table">
                <thead>
                    <tr><th>Method</th><th>What it does</th></tr>
                </thead>
                <tbody>
                    <tr><td><code>selectSimilar(refId?, match?)</code></td><td>Grow the selection to objects sharing a property (Magic Wand).</td></tr>
                    <tr><td><code>getSelection()</code></td><td>Return the ids of the currently selected elements.</td></tr>
                    <tr><td><code>setSelected(ids)</code></td><td>Replace the selection with the given ids.</td></tr>
                    <tr><td><code>updateElement(id, patch)</code></td><td>Apply a property patch to one element (loop for bulk).</td></tr>
                </tbody>
            </table>
        </div>
    );
};

export default BulkEditingDoc;
