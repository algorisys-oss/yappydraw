/**
 * Wireframing Documentation
 * UI mockup and prototype elements
 */

import type { Component } from 'solid-js';

export const WireframingDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Wireframing</h1>
                <p class="doc-intro">
                    Create UI mockups, wireframes, and prototype layouts with specialized
                    elements for web and mobile interfaces.
                </p>
            </header>

            {/* How to (in the app) */}
            <section class="doc-section">
                <h2>How to (in the app)</h2>
                <ol>
                    <li>Open the <strong>Wireframe / UI</strong> group in the shape toolbar
                        (device frames, buttons, inputs, cards, nav bars, and more).</li>
                    <li>Click a component, then click or drag on the canvas to place and size
                        it. Start with a <strong>Browser Window</strong> or
                        <strong>Mobile Phone</strong> frame, then drop UI elements inside it.</li>
                    <li>Double-click a button, input or card to edit its label text.</li>
                    <li>Use the <strong>Properties</strong> panel to adjust fill, stroke,
                        corner radius and roughness — bump roughness up for a low-fidelity
                        "sketch" feel, or switch to the architectural style for crisp mockups.</li>
                    <li>Hold <span class="kbd">Alt</span> and drag to duplicate a component, and
                        use grid snapping to keep rows and columns aligned.</li>
                    <li>Connect screens with the <strong>Arrow</strong> tool
                        (<span class="kbd">A</span>) to sketch a user flow, labelling each arrow
                        with the triggering action.</li>
                </ol>
                <div class="tip-box">
                    <h5>Tip</h5>
                    <p>
                        Group a completed screen (<span class="kbd">Ctrl</span>+<span class="kbd">G</span>)
                        so you can move and duplicate the whole layout as one unit.
                    </p>
                </div>
            </section>

            {/* Container Elements */}
            <section class="doc-section">
                <h2>Device Containers</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Element</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Browser Window</strong></td>
                            <td>Desktop browser frame with address bar</td>
                        </tr>
                        <tr>
                            <td><strong>Mobile Phone</strong></td>
                            <td>Smartphone frame with notch and home indicator</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Responsive Design</h5>
                    <p>
                        Create multiple wireframes at different breakpoints using
                        browser windows of varying widths (mobile, tablet, desktop).
                    </p>
                </div>
            </section>

            {/* UI Elements */}
            <section class="doc-section">
                <h2>UI Components</h2>

                <h3>Buttons</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Solid Button</strong></td>
                            <td>Filled button for primary actions</td>
                        </tr>
                        <tr>
                            <td><strong>Ghost Button</strong></td>
                            <td>Outline-only button for secondary actions</td>
                        </tr>
                        <tr>
                            <td><strong>Capsule</strong></td>
                            <td>Pill-shaped button or tag</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Form Elements</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Element</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Input Field</strong></td>
                            <td>Text input box with placeholder line</td>
                        </tr>
                        <tr>
                            <td><strong>Checkbox</strong></td>
                            <td>Checkable option (empty or checked)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Building Wireframes */}
            <section class="doc-section">
                <h2>Building Wireframes</h2>

                <h3>Basic Layout</h3>
                <div class="code-block">
{`┌────────────────────────────────────┐
│  Logo    Nav    Nav    Nav   [CTA] │  ← Header
├────────────────────────────────────┤
│                                    │
│         Hero Section               │  ← Main content
│    [Primary Button]                │
│                                    │
├────────────────────────────────────┤
│  Card  │  Card  │  Card            │  ← Grid layout
├────────────────────────────────────┤
│  Footer links                      │  ← Footer
└────────────────────────────────────┘`}
                </div>

                <h3>Common Patterns</h3>
                <ul>
                    <li><strong>Card layout</strong> - Grid of rounded rectangles</li>
                    <li><strong>Navigation</strong> - Horizontal row of text elements</li>
                    <li><strong>Sidebar</strong> - Vertical list with icons and labels</li>
                    <li><strong>Modal</strong> - Centered rectangle with backdrop</li>
                    <li><strong>Form</strong> - Stacked input fields with labels</li>
                </ul>
            </section>

            {/* Placeholder Content */}
            <section class="doc-section">
                <h2>Placeholder Content</h2>
                <p>
                    Use these techniques to indicate content without designing it:
                </p>

                <h3>Images</h3>
                <ul>
                    <li>Rectangle with diagonal cross lines</li>
                    <li>Gray rectangle with image icon</li>
                    <li>Placeholder text: "[Image]" or "[Hero Image]"</li>
                </ul>

                <h3>Text</h3>
                <ul>
                    <li>Gray horizontal lines for paragraph text</li>
                    <li>Actual lorem ipsum for realistic feel</li>
                    <li>Wavy lines (~~~~~) for abstract text blocks</li>
                </ul>

                <h3>Icons</h3>
                <ul>
                    <li>Small circles or squares as icon placeholders</li>
                    <li>Simple geometric shapes</li>
                </ul>
            </section>

            {/* Annotations */}
            <section class="doc-section">
                <h2>Annotating Wireframes</h2>
                <p>
                    Add context and specifications to your wireframes:
                </p>

                <h3>Annotation Styles</h3>
                <ul>
                    <li><strong>Callouts</strong> - Speech bubbles pointing to elements</li>
                    <li><strong>Numbered badges</strong> - Reference numbers for spec documents</li>
                    <li><strong>Sticky notes</strong> - Design notes and questions</li>
                    <li><strong>Arrows</strong> - Show user flow between screens</li>
                </ul>

                <div class="tip-box">
                    <h5>Annotation Best Practices</h5>
                    <p>
                        Use a consistent color (blue or red) for all annotations
                        to distinguish them from the actual UI design.
                    </p>
                </div>
            </section>

            {/* User Flows */}
            <section class="doc-section">
                <h2>User Flows</h2>
                <p>
                    Connect wireframe screens to show user journeys:
                </p>

                <ol>
                    <li>Create wireframes for each screen state</li>
                    <li>Arrange screens in logical flow order</li>
                    <li>Connect with arrows showing navigation paths</li>
                    <li>Label arrows with actions ("Click CTA", "Submit form")</li>
                    <li>Use different arrow styles for success/error paths</li>
                </ol>
            </section>

            {/* Mobile Wireframing */}
            <section class="doc-section">
                <h2>Mobile Wireframing</h2>

                <h3>Mobile-Specific Patterns</h3>
                <ul>
                    <li><strong>Bottom navigation</strong> - Tab bar with icons</li>
                    <li><strong>Pull to refresh</strong> - Indicator at top</li>
                    <li><strong>Swipe gestures</strong> - Show with arrows</li>
                    <li><strong>Bottom sheets</strong> - Partial overlays from bottom</li>
                    <li><strong>Floating action button</strong> - Circle in corner</li>
                </ul>

                <h3>Touch Targets</h3>
                <p>
                    Remember to size interactive elements appropriately:
                </p>
                <ul>
                    <li>Minimum 44×44 points for iOS</li>
                    <li>Minimum 48×48 dp for Android</li>
                    <li>Adequate spacing between tap targets</li>
                </ul>
            </section>

            {/* Tips */}
            <section class="doc-section">
                <h2>Wireframing Tips</h2>
                <ul>
                    <li><strong>Start low-fidelity</strong> - Focus on layout, not details</li>
                    <li><strong>Use grayscale</strong> - Avoid color decisions early</li>
                    <li><strong>Keep it rough</strong> - Higher roughness = more "sketch" feel</li>
                    <li><strong>Iterate quickly</strong> - Wireframes should be fast to change</li>
                    <li><strong>Test with users</strong> - Validate layouts before high-fidelity</li>
                </ul>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Wireframe elements can be scripted from the console via the global
                    <code>window.Yappy</code> object. There are convenience helpers plus the
                    generic <code>createUIComponent(type, x, y, width?, height?, options?)</code>,
                    which applies each component's default size.
                </p>
                <pre class="code-block"><code>{`// A browser frame with a primary button and an input inside it
Yappy.createBrowserWindow(80, 80, 480, 320);
Yappy.createSolidButton(120, 260, 'Sign up');
Yappy.createUIComponent('inputField', 120, 180, 300, 40, { containerText: 'Email' });
Yappy.createUIComponent('checkbox', 120, 230);`}</code></pre>
                <p>
                    Component <code>type</code> strings include: <code>browserWindow</code>,
                    <code>mobilePhone</code>, <code>solidButton</code>,
                    <code>ghostButton</code>, <code>capsule</code>, <code>inputField</code>,
                    <code>checkbox</code>, <code>checkboxChecked</code>,
                    <code>radioButton</code>, <code>toggleSwitch</code>, <code>slider</code>,
                    <code>dropdown</code>, <code>avatar</code>, <code>card</code>, and
                    <code>navbar</code>.
                </p>
                <p class="tip-box">
                    Convenience helpers: <code>createBrowserWindow(x, y, w, h)</code>,
                    <code>createSolidButton(x, y, label)</code>,
                    <code>createDropdown(x, y, label)</code>, and
                    <code>createCard(x, y, w, h)</code>. Set labels with
                    <code>containerText</code> and restyle later via
                    <code>Yappy.updateElement(id, {`{...}`})</code>.
                </p>
            </section>
        </div>
    );
};

export default WireframingDoc;
