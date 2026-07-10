/**
 * BPMN Shapes Documentation
 * Business Process Model and Notation diagram elements
 */

import type { Component } from 'solid-js';

export const BpmnDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>BPMN 2.0 Shapes</h1>
                <p class="doc-intro">
                    Create standardized business process diagrams using BPMN 2.0 notation.
                    Model workflows, orchestrations, and process flows with 15 dedicated shapes
                    covering events, gateways, activities, artifacts, and swimlanes.
                </p>
            </header>

            {/* Available BPMN Shapes */}
            <section class="doc-section">
                <h2>Available BPMN Shapes (15)</h2>

                <h3>Events</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Symbol</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Start Event</strong></td>
                            <td>Thin circle</td>
                            <td>Entry point that triggers a process</td>
                        </tr>
                        <tr>
                            <td><strong>End Event</strong></td>
                            <td>Thick circle (3x stroke)</td>
                            <td>Termination point where a process ends</td>
                        </tr>
                        <tr>
                            <td><strong>Intermediate Event</strong></td>
                            <td>Double concentric circles</td>
                            <td>Event occurring between start and end (catching or throwing)</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Gateways</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Symbol</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Exclusive (XOR)</strong></td>
                            <td>Diamond with X</td>
                            <td>Routes flow to exactly one outgoing path based on conditions</td>
                        </tr>
                        <tr>
                            <td><strong>Parallel (AND)</strong></td>
                            <td>Diamond with +</td>
                            <td>Splits flow into all outgoing paths simultaneously</td>
                        </tr>
                        <tr>
                            <td><strong>Inclusive (OR)</strong></td>
                            <td>Diamond with O</td>
                            <td>Routes flow to one or more outgoing paths based on conditions</td>
                        </tr>
                        <tr>
                            <td><strong>Event-based</strong></td>
                            <td>Diamond with double circle + pentagon</td>
                            <td>Routes based on which event occurs first (not data conditions)</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Activities</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Symbol</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Task</strong></td>
                            <td>Rounded rectangle</td>
                            <td>An atomic unit of work within a process</td>
                        </tr>
                        <tr>
                            <td><strong>Sub-Process</strong></td>
                            <td>Rounded rectangle with [+] marker</td>
                            <td>A compound activity containing a nested process</td>
                        </tr>
                        <tr>
                            <td><strong>Call Activity</strong></td>
                            <td>Rounded rectangle (bold border 2.5x)</td>
                            <td>Invokes a globally defined process or task</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Artifacts &amp; Swimlanes</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Symbol</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Data Object</strong></td>
                            <td>Document with folded corner</td>
                            <td>Represents data required or produced by an activity</td>
                        </tr>
                        <tr>
                            <td><strong>Data Store</strong></td>
                            <td>Cylinder</td>
                            <td>Persistent data repository (database)</td>
                        </tr>
                        <tr>
                            <td><strong>Annotation</strong></td>
                            <td>Open bracket with text</td>
                            <td>Adds explanatory notes or comments to the diagram</td>
                        </tr>
                        <tr>
                            <td><strong>Group</strong></td>
                            <td>Dashed rounded rectangle</td>
                            <td>Visual grouping of elements for documentation purposes</td>
                        </tr>
                        <tr>
                            <td><strong>Pool / Lane</strong></td>
                            <td>Horizontal banded container</td>
                            <td>Organizes activities by participant or role (supports up to 6 lanes)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Event Type Icons */}
            <section class="doc-section">
                <h2>Event Type Icons (11 types)</h2>
                <p>
                    Events can be further classified by the icon displayed inside the circle.
                    Select an event shape and use the <strong>Event Type</strong> dropdown in the property panel.
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Icon</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>None</strong></td>
                            <td>Empty</td>
                            <td>Generic event with no specific trigger</td>
                        </tr>
                        <tr>
                            <td><strong>Message</strong></td>
                            <td>Envelope</td>
                            <td>Triggered by or sends a message</td>
                        </tr>
                        <tr>
                            <td><strong>Timer</strong></td>
                            <td>Clock</td>
                            <td>Triggered by a time condition or cycle</td>
                        </tr>
                        <tr>
                            <td><strong>Error</strong></td>
                            <td>Zigzag (lightning bolt)</td>
                            <td>Catches or throws an error</td>
                        </tr>
                        <tr>
                            <td><strong>Signal</strong></td>
                            <td>Triangle</td>
                            <td>Broadcasts or receives a signal across processes</td>
                        </tr>
                        <tr>
                            <td><strong>Conditional</strong></td>
                            <td>Page with lines</td>
                            <td>Triggered when a business condition becomes true</td>
                        </tr>
                        <tr>
                            <td><strong>Escalation</strong></td>
                            <td>Upward chevron</td>
                            <td>Escalation raised or caught within a process</td>
                        </tr>
                        <tr>
                            <td><strong>Compensation</strong></td>
                            <td>Double rewind triangles</td>
                            <td>Compensation triggered for rollback</td>
                        </tr>
                        <tr>
                            <td><strong>Link</strong></td>
                            <td>Right-pointing pentagon</td>
                            <td>Off-page connector (catch/throw pair)</td>
                        </tr>
                        <tr>
                            <td><strong>Terminate</strong></td>
                            <td>Filled circle</td>
                            <td>Immediately terminates the entire process</td>
                        </tr>
                        <tr>
                            <td><strong>Cancel</strong></td>
                            <td>X mark</td>
                            <td>Transaction cancellation</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Catching vs Throwing</h5>
                    <p>
                        Catching events have unfilled icons (waiting for a trigger).
                        Throwing events have filled icons (producing a trigger).
                        Use the <strong>Fill Icon</strong> toggle to switch between catching and throwing.
                        Start events are always catching; end events are always throwing.
                    </p>
                </div>
            </section>

            {/* Non-Interrupting Events */}
            <section class="doc-section">
                <h2>Non-Interrupting Events</h2>
                <p>
                    Start and Intermediate events support a <strong>Non-Interrupting</strong> mode
                    (toggle in property panel). When enabled, the event border becomes dashed,
                    indicating the event doesn't stop the enclosing activity.
                </p>
                <p>
                    Common use: boundary events on sub-processes that trigger parallel paths
                    without interrupting the main flow.
                </p>
            </section>

            {/* Task Type Markers */}
            <section class="doc-section">
                <h2>Task Type Markers (8 types)</h2>
                <p>
                    Tasks display a small icon in the upper-left corner to indicate
                    how the work is performed. Select a task and use the <strong>Task Type</strong> dropdown.
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Marker</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>None</strong></td>
                            <td>No marker</td>
                            <td>Abstract task with no specific type</td>
                        </tr>
                        <tr>
                            <td><strong>User</strong></td>
                            <td>Person</td>
                            <td>Performed by a human with system assistance</td>
                        </tr>
                        <tr>
                            <td><strong>Service</strong></td>
                            <td>Gears</td>
                            <td>Automated task executed by a service or application</td>
                        </tr>
                        <tr>
                            <td><strong>Script</strong></td>
                            <td>Scroll</td>
                            <td>Executed by a business process engine script</td>
                        </tr>
                        <tr>
                            <td><strong>Manual</strong></td>
                            <td>Hand</td>
                            <td>Performed by a human without system assistance</td>
                        </tr>
                        <tr>
                            <td><strong>Send</strong></td>
                            <td>Filled arrow</td>
                            <td>Sends a message to an external participant</td>
                        </tr>
                        <tr>
                            <td><strong>Receive</strong></td>
                            <td>Envelope</td>
                            <td>Waits for a message from an external participant</td>
                        </tr>
                        <tr>
                            <td><strong>Business Rule</strong></td>
                            <td>Table/grid</td>
                            <td>Evaluates a business rule (DMN decision table)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Loop/Multi-Instance Markers */}
            <section class="doc-section">
                <h2>Loop/Multi-Instance Markers (5 types)</h2>
                <p>
                    Activities can display a bottom-center marker to indicate
                    repetition or parallel execution. Select an activity and use the <strong>Loop / Multi-Instance</strong> dropdown.
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Marker</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>None</strong></td>
                            <td>No marker</td>
                            <td>Activity executes once</td>
                        </tr>
                        <tr>
                            <td><strong>Standard Loop</strong></td>
                            <td>Circular arrow</td>
                            <td>Repeats until a condition is met (like a while loop)</td>
                        </tr>
                        <tr>
                            <td><strong>Parallel Multi-Instance</strong></td>
                            <td>Three vertical bars</td>
                            <td>Multiple instances execute simultaneously</td>
                        </tr>
                        <tr>
                            <td><strong>Sequential Multi-Instance</strong></td>
                            <td>Three horizontal bars</td>
                            <td>Multiple instances execute one after another</td>
                        </tr>
                        <tr>
                            <td><strong>Compensation</strong></td>
                            <td>Double rewind triangles</td>
                            <td>Compensation handler activity for rollback</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Icon Customization */}
            <section class="doc-section">
                <h2>Icon Customization</h2>
                <p>
                    All BPMN markers and icons can be fine-tuned via the property panel:
                </p>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Icon Scale</strong></td>
                            <td>Slider (0.5 - 2.0)</td>
                            <td>Scale factor for all markers and icons within the shape</td>
                        </tr>
                        <tr>
                            <td><strong>Icon Color</strong></td>
                            <td>Color picker</td>
                            <td>Override icon color independently of shape stroke color</td>
                        </tr>
                        <tr>
                            <td><strong>Fill Icon</strong></td>
                            <td>Toggle</td>
                            <td>Fill event/gateway icons instead of outline only (catching vs throwing)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Pool Lanes */}
            <section class="doc-section">
                <h2>Pool Lanes</h2>
                <p>
                    Pools support up to <strong>6 horizontal lanes</strong> via the <strong>Lane Count</strong> slider
                    in the property panel. Each lane represents a role or department within a participant.
                    The left panel displays the pool label (rotated text).
                </p>
            </section>

            {/* Sequence Flows */}
            <section class="doc-section">
                <h2>Sequence Flows</h2>
                <p>
                    BPMN uses different connection types to represent various
                    relationships between elements. Use arrows and connectors with different styles:
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Flow Type</th>
                            <th>Style</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Sequence Flow</strong></td>
                            <td>Solid arrow</td>
                            <td>Order of activities within a process</td>
                        </tr>
                        <tr>
                            <td><strong>Message Flow</strong></td>
                            <td>Dashed arrow (open circle to open arrowhead)</td>
                            <td>Communication between participants (across pools)</td>
                        </tr>
                        <tr>
                            <td><strong>Association</strong></td>
                            <td>Dotted line</td>
                            <td>Links artifacts (data objects, annotations) to elements</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Common Patterns */}
            <section class="doc-section">
                <h2>Common BPMN Patterns</h2>

                <h3>Simple Sequential Process</h3>
                <div class="code-block">
{`(Start) --> [Task A] --> [Task B] --> [Task C] --> (End)`}
                </div>

                <h3>Exclusive Decision</h3>
                <div class="code-block">
{`                      --> [Approve] -->
(Start) --> <XOR> --+                    +--> (End)
                      --> [Reject]  -->`}
                </div>

                <h3>Parallel Split and Join</h3>
                <div class="code-block">
{`                      --> [Task A] -->
(Start) --> <AND> --+                    +-- <AND> --> (End)
                      --> [Task B] -->`}
                </div>

                <h3>Error Boundary Event</h3>
                <div class="code-block">
{`(Start) --> [ Service Task ] --> (End)
                  |
            (Error Event) --> [Handle Error] --> (Error End)`}
                </div>

                <h3>Timer-based Escalation</h3>
                <div class="code-block">
{`(Start) --> [ Review Task ] --> (End)
                  |
            (Timer, non-interrupting) --> [Send Reminder]`}
                </div>
            </section>

            {/* Best Practices */}
            <section class="doc-section">
                <h2>Best Practices</h2>
                <ul>
                    <li><strong>Name activities with verb-noun</strong> - "Review Order", "Send Invoice"</li>
                    <li><strong>Label all gateway branches</strong> - Indicate the condition for each path</li>
                    <li><strong>Use pools and lanes</strong> - Clearly separate responsibilities by role</li>
                    <li><strong>Match gateway pairs</strong> - Every split gateway should have a corresponding join</li>
                    <li><strong>Keep processes on one level</strong> - Use sub-processes to hide complexity</li>
                    <li><strong>Flow left to right</strong> - Maintain consistent direction for readability</li>
                    <li><strong>Use event-based gateways</strong> - When routing depends on external events, not data</li>
                    <li><strong>Group related elements</strong> - Use the Group shape to visually organize related tasks</li>
                </ul>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Quick Access</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">O</span>
                        </div>
                        <span class="shortcut-desc">Circle (Event)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">D</span>
                        </div>
                        <span class="shortcut-desc">Diamond (Gateway)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">R</span>
                        </div>
                        <span class="shortcut-desc">Rectangle (Task/Activity)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">A</span>
                        </div>
                        <span class="shortcut-desc">Arrow (Sequence Flow)</span>
                    </div>
                </div>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Every BPMN shape can be created from the browser console (or a script)
                    via the global <code>window.Yappy</code> object. Use the dedicated
                    <code>createBpmnShape</code> helper (it applies a sensible default size
                    per shape) or the generic <code>createElement</code>.
                </p>
                <pre class="code-block"><code>{`// Build a tiny process: Start -> Task -> End
const start = Yappy.createBpmnShape('bpmnStartEvent', 100, 200);
const task  = Yappy.createBpmnShape('bpmnTask', 200, 190, 120, 80, { containerText: 'Review Order' });
const end   = Yappy.createBpmnShape('bpmnEndEvent', 380, 200);

// Connect them with sequence-flow arrows
Yappy.createArrow(150, 225, 200, 230);
Yappy.createArrow(320, 230, 380, 225);`}</code></pre>
                <p>
                    Shape <code>type</code> strings: <code>bpmnStartEvent</code>,
                    <code>bpmnEndEvent</code>, <code>bpmnIntermediateEvent</code>,
                    <code>bpmnExclusiveGateway</code>, <code>bpmnParallelGateway</code>,
                    <code>bpmnInclusiveGateway</code>, <code>bpmnEventGateway</code>,
                    <code>bpmnTask</code>, <code>bpmnSubProcess</code>,
                    <code>bpmnCallActivity</code>, <code>bpmnDataObject</code>,
                    <code>bpmnDataStore</code>, <code>bpmnAnnotation</code>,
                    <code>bpmnGroup</code>, <code>bpmnPool</code>.
                </p>

                <h3>Setting event / task / loop markers</h3>
                <p>
                    The property-panel dropdowns map to element attributes you can set with
                    <code>updateElement</code>:
                </p>
                <pre class="code-block"><code>{`// A timer intermediate event + a user task with a parallel multi-instance marker
const timer = Yappy.createBpmnShape('bpmnIntermediateEvent', 200, 300);
Yappy.updateElement(timer, { bpmnEventType: 'timer' });

const t = Yappy.createBpmnShape('bpmnTask', 300, 290, 120, 80);
Yappy.updateElement(t, { bpmnTaskType: 'user', bpmnLoopType: 'parallel' });`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Attribute</th><th>Accepted values</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>bpmnEventType</code></td><td>none, message, timer, error, signal, conditional, escalation, compensation, link, terminate, cancel</td></tr>
                        <tr><td><code>bpmnTaskType</code></td><td>none, user, service, script, manual, send, receive, businessRule</td></tr>
                        <tr><td><code>bpmnLoopType</code></td><td>none, standard, parallel, sequential, compensation</td></tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default BpmnDoc;
