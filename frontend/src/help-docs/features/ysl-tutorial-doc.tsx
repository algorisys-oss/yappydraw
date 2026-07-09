/**
 * YSL Tutorial Documentation
 * Guide to the YappyDraw Scripting Language (YSL) text format.
 */

import type { Component } from 'solid-js';

const YslTutorialDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>YSL — Yappy Scripting Language</h1>
                <p class="doc-intro">
                    YSL is a compact text format for creating diagrams. Write plain text and
                    Yappy renders it as a fully interactive diagram with automatic layout,
                    connectors, and styling. Open the import dialog with{' '}
                    <span class="kbd">Ctrl+Shift+I</span> or <strong>File &gt; Import from Text</strong>.
                </p>
            </header>

            {/* Quick Start */}
            <section class="doc-section">
                <h2>Quick Start</h2>
                <p>A minimal flowchart in 6 lines:</p>
                <pre><code>{`---
title: My First Diagram
layout: tree-down
---

start [circle] "Start"
login [rect] "Login"
check [decision] "Valid?"
ok [rect] "Dashboard"

start -> login
login -> check
check -> ok "Yes"`}</code></pre>
                <p>
                    Paste this into the import dialog and click <strong>Import</strong>.
                    Yappy creates the shapes, connects them with arrows, and auto-arranges everything
                    using a top-down tree layout.
                </p>
            </section>

            {/* Frontmatter */}
            <section class="doc-section">
                <h2>Frontmatter</h2>
                <p>
                    The <code>---</code> delimited header sets diagram-level options:
                </p>
                <pre><code>{`---
title: My Diagram
layout: tree-down
hSpacing: 120
vSpacing: 80
columns: 3
---`}</code></pre>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Values</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>title</code></td>
                            <td>Any text</td>
                            <td>Diagram title (metadata)</td>
                        </tr>
                        <tr>
                            <td><code>layout</code></td>
                            <td><code>tree-down</code>, <code>tree-right</code>, <code>tree-up</code>, <code>tree-left</code>, <code>grid</code>, <code>radial</code>, <code>mindmap-right</code>, <code>sequence</code>, <code>manual</code></td>
                            <td>Auto-layout strategy</td>
                        </tr>
                        <tr>
                            <td><code>hSpacing</code></td>
                            <td>Number (default: 100)</td>
                            <td>Horizontal gap between nodes</td>
                        </tr>
                        <tr>
                            <td><code>vSpacing</code></td>
                            <td>Number (default: 80)</td>
                            <td>Vertical gap between nodes</td>
                        </tr>
                        <tr>
                            <td><code>columns</code></td>
                            <td>Number</td>
                            <td>Column count for grid layout</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Node Syntax */}
            <section class="doc-section">
                <h2>Nodes</h2>
                <p>The basic node syntax:</p>
                <pre><code>{`nodeId [shape] "Label" { style }`}</code></pre>
                <p>
                    Only <code>nodeId</code> is required. Shape defaults to <code>rect</code>, label and style are optional.
                </p>

                <h3>Examples</h3>
                <pre><code>{`# Minimal node
a [rect] "Hello"

# Shape + label
db [database] "Users DB"

# With inline style
warn [rect] "Warning" { backgroundColor: "#fef9c3", strokeColor: "#ca8a04" }

# Custom size
big [rect] "Large Box" { width: 300, height: 200 }`}</code></pre>

                <div class="tip-box">
                    <h5>Comments</h5>
                    <p>Lines starting with <code>#</code> are comments and are ignored.</p>
                </div>
            </section>

            {/* Shape Reference */}
            <section class="doc-section">
                <h2>Shape Reference</h2>
                <p>Use any of these shape names in brackets. Aliases map to Yappy's built-in shapes.</p>

                <h3>Flowchart</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Alias</th><th>Shape</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>rect</code>, <code>box</code>, <code>process</code></td><td>Rectangle</td></tr>
                        <tr><td><code>oval</code>, <code>ellipse</code></td><td>Circle / Ellipse</td></tr>
                        <tr><td><code>decision</code>, <code>condition</code></td><td>Diamond</td></tr>
                        <tr><td><code>io</code></td><td>Parallelogram (I/O)</td></tr>
                        <tr><td><code>terminal</code></td><td>Capsule (start/end)</td></tr>
                        <tr><td><code>subroutine</code></td><td>Predefined Process</td></tr>
                    </tbody>
                </table>

                <h3>BPMN</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Alias</th><th>Shape</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>start-event</code></td><td>BPMN Start Event</td></tr>
                        <tr><td><code>end-event</code></td><td>BPMN End Event</td></tr>
                        <tr><td><code>task</code></td><td>BPMN Task</td></tr>
                        <tr><td><code>gateway</code>, <code>xor-gateway</code></td><td>Exclusive Gateway</td></tr>
                        <tr><td><code>and-gateway</code></td><td>Parallel Gateway</td></tr>
                        <tr><td><code>pool</code></td><td>BPMN Swimlane Pool</td></tr>
                    </tbody>
                </table>

                <h3>UML</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Alias</th><th>Shape</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>class</code></td><td>UML Class</td></tr>
                        <tr><td><code>interface</code></td><td>UML Interface</td></tr>
                        <tr><td><code>actor</code></td><td>UML Actor (stick figure)</td></tr>
                        <tr><td><code>state</code></td><td>UML State</td></tr>
                        <tr><td><code>lifeline</code></td><td>UML Lifeline</td></tr>
                    </tbody>
                </table>

                <h3>Infrastructure</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Alias</th><th>Shape</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>db</code></td><td>Database</td></tr>
                        <tr><td><code>server</code></td><td>Server</td></tr>
                        <tr><td><code>lb</code></td><td>Load Balancer</td></tr>
                        <tr><td><code>queue</code></td><td>Message Queue</td></tr>
                        <tr><td><code>firewall</code></td><td>Firewall</td></tr>
                        <tr><td><code>browser</code></td><td>Browser</td></tr>
                        <tr><td><code>k8s</code></td><td>Kubernetes</td></tr>
                    </tbody>
                </table>

                <h3>Data Structures</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Alias</th><th>Shape</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>array</code></td><td>Array</td></tr>
                        <tr><td><code>stack</code></td><td>Stack</td></tr>
                        <tr><td><code>ds-queue</code></td><td>Queue</td></tr>
                        <tr><td><code>linked-list</code></td><td>Linked List</td></tr>
                        <tr><td><code>binary-tree</code></td><td>Binary Tree</td></tr>
                        <tr><td><code>hash-table</code></td><td>Hash Table</td></tr>
                    </tbody>
                </table>

                <h3>Common</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Alias</th><th>Shape</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>note</code>, <code>sticky</code></td><td>Sticky Note</td></tr>
                        <tr><td><code>text</code></td><td>Text label</td></tr>
                        <tr><td><code>table</code></td><td>Table</td></tr>
                        <tr><td><code>code</code></td><td>Code Block</td></tr>
                        <tr><td><code>cloud</code>, <code>hexagon</code>, <code>star</code>, <code>triangle</code>, <code>heart</code>, <code>cylinder</code></td><td>Basic shapes</td></tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Direct Type Names</h5>
                    <p>
                        You can also use any Yappy <code>ElementType</code> name directly, e.g.{' '}
                        <code>[bpmnStartEvent]</code>, <code>[umlClass]</code>, <code>[dsArray]</code>.
                    </p>
                </div>
            </section>

            {/* Edges */}
            <section class="doc-section">
                <h2>Edges (Connectors)</h2>
                <p>Connect nodes using edge operators:</p>
                <pre><code>{`fromId -> toId "label" { style }`}</code></pre>

                <table class="api-table">
                    <thead>
                        <tr><th>Operator</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>{`->`}</code></td><td>Arrow</td><td>Straight arrow (default)</td></tr>
                        <tr><td><code>--</code></td><td>Line</td><td>Plain line, no arrowhead</td></tr>
                        <tr><td><code>~&gt;</code></td><td>Bezier arrow</td><td>Smooth curved arrow</td></tr>
                        <tr><td><code>=&gt;</code></td><td>Elbow arrow</td><td>Right-angle connector</td></tr>
                    </tbody>
                </table>

                <h3>Edge Labels and Styling</h3>
                <pre><code>{`a -> b "Yes" { strokeColor: "#16a34a", strokeWidth: 3 }
a -> c "No" { strokeColor: "#dc2626" }
x -- y
p ~> q "Curved"
r => s "Elbow"`}</code></pre>
            </section>

            {/* Inline Styling */}
            <section class="doc-section">
                <h2>Inline Styling</h2>
                <p>
                    Add <code>{`{ key: value, key: value }`}</code> after a node or edge to style it.
                    String values with commas or special characters must be quoted.
                </p>

                <h3>Supported Style Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Category</th><th>Properties</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Fill &amp; Stroke</td>
                            <td><code>backgroundColor</code>, <code>strokeColor</code>, <code>strokeWidth</code>, <code>strokeStyle</code> (solid/dashed/dotted), <code>opacity</code>, <code>borderRadius</code></td>
                        </tr>
                        <tr>
                            <td>Text</td>
                            <td><code>fontFamily</code>, <code>fontSize</code>, <code>fontWeight</code>, <code>textColor</code>, <code>textAlign</code></td>
                        </tr>
                        <tr>
                            <td>Text Highlight</td>
                            <td><code>textHighlightEnabled</code>: true, <code>textHighlightColor</code></td>
                        </tr>
                        <tr>
                            <td>Gradient</td>
                            <td><code>gradientPreset</code> (e.g. "ocean"), <code>gradientDirection</code></td>
                        </tr>
                        <tr>
                            <td>Shadow</td>
                            <td><code>shadowEnabled</code>: true, <code>shadowColor</code>, <code>shadowBlur</code></td>
                        </tr>
                        <tr>
                            <td>Size</td>
                            <td><code>width</code>, <code>height</code></td>
                        </tr>
                    </tbody>
                </table>

                <h3>Styling Example</h3>
                <pre><code>{`start [circle] "Go" {
  backgroundColor: "#dcfce7",
  strokeColor: "#16a34a",
  shadowEnabled: true,
  shadowColor: "#16a34a",
  shadowBlur: 12
}`}</code></pre>
            </section>

            {/* Layout Strategies */}
            <section class="doc-section">
                <h2>Layout Strategies</h2>
                <p>Set <code>layout</code> in the frontmatter to control automatic positioning:</p>

                <table class="api-table">
                    <thead>
                        <tr><th>Layout</th><th>Best For</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>tree-down</code></td><td>Flowcharts</td><td>Root at top, branches flow down</td></tr>
                        <tr><td><code>tree-right</code></td><td>Mind maps, org charts</td><td>Root at left, branches flow right</td></tr>
                        <tr><td><code>tree-up</code></td><td>Bottom-up trees</td><td>Root at bottom, branches flow up</td></tr>
                        <tr><td><code>tree-left</code></td><td>Right-to-left flows</td><td>Root at right, branches flow left</td></tr>
                        <tr><td><code>radial</code></td><td>Topic maps</td><td>Root at center, branches radiate outward</td></tr>
                        <tr><td><code>grid</code></td><td>Showcases, catalogs</td><td>Row-major grid with configurable columns</td></tr>
                        <tr><td><code>sequence</code></td><td>Sequence diagrams</td><td>Lifelines left-to-right, messages vertical</td></tr>
                        <tr><td><code>manual</code></td><td>Free placement</td><td>Uses explicit x/y positions or auto-grid fallback</td></tr>
                    </tbody>
                </table>
            </section>

            {/* Sequence Diagrams */}
            <section class="doc-section">
                <h2>Sequence Diagrams</h2>
                <p>
                    With <code>layout: sequence</code>, participants become lifelines (or actors)
                    laid out left-to-right, and edges become time-ordered messages flowing top to
                    bottom. Beyond plain messages you can add activation bars, combined fragments
                    (loop / alt / opt / par), notes and auto-numbering.
                </p>

                <h3>Message arrows</h3>
                <table class="api-table">
                    <thead><tr><th>Operator</th><th>Meaning</th></tr></thead>
                    <tbody>
                        <tr><td><code>-&gt;&gt;</code></td><td>Synchronous call — solid line, filled arrowhead</td></tr>
                        <tr><td><code>--&gt;&gt;</code></td><td>Reply / return — dashed line, filled arrowhead</td></tr>
                        <tr><td><code>-&gt;</code> / <code>--&gt;</code></td><td>Open arrow — solid / dashed</td></tr>
                        <tr><td><code>a -&gt;&gt; a "label"</code></td><td>Self message (loops back on the same lifeline)</td></tr>
                    </tbody>
                </table>

                <h3>Structure keywords</h3>
                <table class="api-table">
                    <thead><tr><th>Keyword</th><th>Effect</th></tr></thead>
                    <tbody>
                        <tr><td><code>autonumber</code></td><td>Prefix every message with an incrementing number</td></tr>
                        <tr><td><code>activate id</code> / <code>deactivate id</code></td><td>Start / end an activation bar on a lifeline</td></tr>
                        <tr><td><code>loop "label"</code> … <code>end</code></td><td>Repeat fragment</td></tr>
                        <tr><td><code>alt "cond"</code> … <code>else "other"</code> … <code>end</code></td><td>Alternatives with a divider</td></tr>
                        <tr><td><code>opt "cond"</code> / <code>break "cond"</code> … <code>end</code></td><td>Optional / break fragment</td></tr>
                        <tr><td><code>par "a"</code> … <code>and "b"</code> … <code>end</code></td><td>Parallel branches</td></tr>
                        <tr><td><code>note over a,b "text"</code></td><td>Note spanning one or more lifelines (also <code>left</code>/<code>right</code>)</td></tr>
                    </tbody>
                </table>

                <pre><code>{`---
title: Login Flow
layout: sequence
hSpacing: 200
vSpacing: 60
---

autonumber
user    [actor]    "User"
gateway [lifeline] "API Gateway"
auth    [lifeline] "Auth Service"

user ->> gateway "POST /login"
activate gateway
loop "retry up to 3x"
  gateway ->> auth "Validate"
  auth -->> gateway "200 OK"
end
alt "valid"
  gateway -->> user "Welcome"
else "invalid"
  gateway -->> user "401"
end
note over gateway,auth "token cached 15m"
deactivate gateway`}</code></pre>
            </section>

            {/* Mindmap / Hierarchy */}
            <section class="doc-section">
                <h2>Indentation Hierarchy (Mind Maps)</h2>
                <p>
                    Use indentation to create parent-child relationships. Edges are auto-generated.
                    Combine with <code>tree-right</code> or <code>radial</code> layout.
                </p>
                <pre><code>{`---
title: Project Plan
layout: tree-right
---

root [rect] "Project"
  design [rect] "Design"
    ui [rect] "UI/UX"
    arch [rect] "Architecture"
  develop [rect] "Development"
    frontend [rect] "Frontend"
    backend [rect] "Backend"
  testing [rect] "Testing"
    unit [rect] "Unit Tests"
    e2e [rect] "E2E"`}</code></pre>
                <p>
                    Indented nodes become children of the nearest less-indented node above them.
                    Connectors and toggle (expand/collapse) icons are added automatically.
                </p>
            </section>

            {/* Pools & Swimlanes */}
            <section class="doc-section">
                <h2>BPMN Pools &amp; Swimlanes</h2>
                <p>
                    Declare pools and lanes, then assign nodes with the <code>@poolId/laneId</code> syntax:
                </p>
                <pre><code>{`---
title: Order Process
layout: tree-right
---

pool sales "Sales Department"
  lane rep "Sales Rep"
  lane mgr "Manager"

pool warehouse "Warehouse"
  lane picker "Picker"
  lane shipper "Shipper"

start [start-event] "Order" @sales/rep
review [task] "Review" @sales/rep
approve [gateway] "OK?" @sales/mgr
pick [task] "Pick Items" @warehouse/picker
ship [task] "Ship" @warehouse/shipper

start -> review
review -> approve
approve -> pick "Yes"
pick -> ship`}</code></pre>
            </section>

            {/* Data Structures */}
            <section class="doc-section">
                <h2>Data Structure Shapes</h2>
                <p>
                    Data structure shapes accept a <code>dsValues</code> property with comma-separated values.
                    Quote the value string if it contains commas.
                </p>
                <pre><code>{`---
layout: grid
columns: 3
---

arr [array] "My Array" {
  width: 300, height: 80,
  dsValues: "10, 20, 30, 40, 50",
  dsShowIndices: true
}
stk [stack] "Call Stack" {
  width: 120, height: 200,
  dsValues: "main, foo, bar"
}
ht [hash-table] "Config" {
  width: 200, height: 180,
  dsValues: "host:localhost, port:3000, env:dev",
  dsCapacity: 5
}`}</code></pre>
            </section>

            {/* Mermaid Import */}
            <section class="doc-section">
                <h2>Mermaid Import</h2>
                <p>
                    The import dialog auto-detects Mermaid syntax. Paste any Mermaid diagram
                    and Yappy converts it to interactive shapes:
                </p>
                <pre><code>{`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]`}</code></pre>
                <p>Supported Mermaid diagram types:</p>
                <ul>
                    <li><strong>Flowchart</strong> — <code>graph TD</code>, <code>graph LR</code></li>
                    <li><strong>Sequence</strong> — <code>sequenceDiagram</code></li>
                    <li><strong>Class</strong> — <code>classDiagram</code></li>
                    <li><strong>State</strong> — <code>stateDiagram-v2</code></li>
                </ul>
            </section>

            {/* Console API */}
            <section class="doc-section">
                <h2>Console API</h2>
                <p>
                    Import YSL and Mermaid diagrams programmatically from the browser console:
                </p>
                <pre><code>{`// Import YSL text
Yappy.importDSL(\`
---
layout: tree-down
---
a [rect] "Hello"
b [circle] "World"
a -> b
\`);

// Import with options
Yappy.importDSL(yslText, {
    clearCanvas: true,   // Clear existing elements first
    offsetX: 200,        // Shift diagram right
    offsetY: 100,        // Shift diagram down
    zoomToFit: true      // Auto-zoom (default: true)
});

// Import Mermaid
Yappy.importMermaid(\`graph TD
    A --> B --> C
\`);`}</code></pre>
            </section>

            {/* UML class members */}
            <section class="doc-section">
                <h2>UML Class Members</h2>
                <p>
                    Give a <code>[class]</code> (or <code>[interface]</code>) node attribute and
                    method compartments with <code>attributes:</code> and <code>methods:</code>
                    keys inside its <code>{'{ … }'}</code> block. Separate members with a
                    semicolon (<code>;</code>):
                </p>
                <pre><code>{`Subject [class] "Subject" {
  attributes: "-observers: List",
  methods: "subscribe(o); notify(data)"
}`}</code></pre>
                <p>
                    The equivalent Mermaid <code>classDiagram</code> block works too — both the
                    same-line brace (<code>class Subject {'{'}</code>) and the brace on the next
                    line are accepted, and each relationship arrow renders its proper UML
                    arrowhead (see the UML shapes help).
                </p>
            </section>

            {/* Headless / CLI export */}
            <section class="doc-section">
                <h2>Headless SVG Export (CLI)</h2>
                <p>
                    Render a <code>.ysl</code> / <code>.mmd</code> file to SVG from the terminal —
                    handy for batch or CI diagram generation. It boots a headless browser,
                    imports the DSL, and writes the exported SVG:
                </p>
                <pre><code>{`npm run render:dsl -- diagram.ysl -o diagram.svg

# against an already-running instance, or to stdout:
npm run render:dsl -- diagram.mmd --url http://localhost:5173 -o -`}</code></pre>
            </section>

            {/* Full Example */}
            <section class="doc-section">
                <h2>Complete Example</h2>
                <p>A styled flowchart demonstrating multiple features:</p>
                <pre><code>{`---
title: Styled Flowchart
layout: tree-down
---

# Rich formatting: gradients, shadows, rounded corners
start [circle] "Start" {
  backgroundColor: "#dcfce7",
  strokeColor: "#16a34a",
  shadowEnabled: true,
  shadowBlur: 12
}
input [parallelogram] "User Input" {
  backgroundColor: "#dbeafe",
  strokeColor: "#2563eb",
  fontSize: 16
}
validate [decision] "Valid?" {
  backgroundColor: "#fef9c3",
  strokeColor: "#ca8a04",
  strokeWidth: 3
}
process [rect] "Process Data" {
  gradientPreset: "ocean",
  borderRadius: 15
}
error [rect] "Error" {
  backgroundColor: "#fecaca",
  strokeColor: "#dc2626"
}
end [circle] "Done"

start -> input
input -> validate
validate -> process "Yes" { strokeColor: "#16a34a" }
validate -> error "No" { strokeColor: "#dc2626" }
error -> input "Retry"
process -> end`}</code></pre>
            </section>

            {/* Tips */}
            <section class="doc-section">
                <h2>Tips</h2>
                <ul>
                    <li>Use <span class="kbd">Ctrl+Shift+I</span> to open the import dialog quickly</li>
                    <li>The dialog auto-detects YSL vs Mermaid vs JSON format</li>
                    <li>Toggle <strong>Clear canvas</strong> to replace or append to existing elements</li>
                    <li>Node IDs must be unique within a diagram — use short, descriptive IDs</li>
                    <li>Edge labels are optional: <code>a -&gt; b</code> works without a label</li>
                    <li>Blank lines and <code>#</code> comments help organize large diagrams</li>
                    <li>For complex inline values with commas, wrap the value in quotes: <code>dsValues: "a, b, c"</code></li>
                </ul>
            </section>
        </div>
    );
};

export default YslTutorialDoc;
