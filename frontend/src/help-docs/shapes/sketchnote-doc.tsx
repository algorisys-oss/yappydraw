/**
 * Sketchnote Shapes Documentation
 * Visual vocabulary for sketchnoting and visual thinking
 */

import type { Component } from 'solid-js';

export const SketchnoteDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Sketchnote Shapes</h1>
                <p class="doc-intro">
                    A visual vocabulary for sketchnoting, visual thinking, and creating
                    engaging illustrated notes. Transform ideas into memorable visuals.
                </p>
            </header>

            {/* Placing Shapes (UI) */}
            <section class="doc-section">
                <h2>Adding Sketchnote Shapes</h2>
                <p>
                    The sketchnote vocabulary lives in the <strong>Sketchnote & People</strong> group on the
                    toolbar (icons, faces, people, containers, dividers and markers). Drop them onto the canvas
                    like any other shape:
                </p>
                <ol>
                    <li>Open the <strong>Sketchnote & People</strong> group in the toolbar, or press
                        <span class="kbd">/</span> to open the command palette and search by name
                        (e.g. "lightbulb", "thumbs up", "wavy divider").</li>
                    <li>Pick a shape, then click once on the canvas to drop it at a default size, or click-drag
                        to size it while placing.</li>
                    <li>Double-click a container shape (sticky note, scroll, banner, speech bubble) to type a label
                        inside it.</li>
                    <li>Use the <strong>Properties</strong> panel to set stroke and fill colour, and increase
                        <strong>Roughness</strong> for a loose, hand-drawn look.</li>
                    <li>Switch the drawing style to <strong>Sketch</strong> for the classic sketchnote feel, or
                        <strong>Architectural</strong> for clean lines — every shape renders in both.</li>
                </ol>

                <div class="tip-box">
                    <h5>Tip: Search beats scrolling</h5>
                    <p>
                        There are dozens of sketchnote icons. The quickest way to place one is the command
                        palette (<span class="kbd">/</span>) — type the name and press <span class="kbd">Enter</span>.
                    </p>
                </div>
            </section>

            {/* Icons & Symbols */}
            <section class="doc-section">
                <h2>Icons & Symbols</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Meaning</th>
                            <th>Use For</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Lightbulb</strong></td>
                            <td>Idea, insight</td>
                            <td>Key insights, "aha" moments</td>
                        </tr>
                        <tr>
                            <td><strong>Target</strong></td>
                            <td>Goal, focus</td>
                            <td>Objectives, main points</td>
                        </tr>
                        <tr>
                            <td><strong>Rocket</strong></td>
                            <td>Launch, growth</td>
                            <td>Startups, new initiatives</td>
                        </tr>
                        <tr>
                            <td><strong>Flag</strong></td>
                            <td>Milestone, marker</td>
                            <td>Achievements, checkpoints</td>
                        </tr>
                        <tr>
                            <td><strong>Trophy</strong></td>
                            <td>Success, win</td>
                            <td>Accomplishments, goals met</td>
                        </tr>
                        <tr>
                            <td><strong>Key</strong></td>
                            <td>Important, unlock</td>
                            <td>Key takeaways, solutions</td>
                        </tr>
                        <tr>
                            <td><strong>Gear</strong></td>
                            <td>Process, work</td>
                            <td>Systems, mechanics</td>
                        </tr>
                        <tr>
                            <td><strong>Clock</strong></td>
                            <td>Time, schedule</td>
                            <td>Deadlines, timing</td>
                        </tr>
                        <tr>
                            <td><strong>Magnifying Glass</strong></td>
                            <td>Search, analyze</td>
                            <td>Research, deep dives</td>
                        </tr>
                        <tr>
                            <td><strong>Book</strong></td>
                            <td>Knowledge, learning</td>
                            <td>Education, resources</td>
                        </tr>
                        <tr>
                            <td><strong>Megaphone</strong></td>
                            <td>Announce, communicate</td>
                            <td>Important messages, marketing</td>
                        </tr>
                        <tr>
                            <td><strong>Eye</strong></td>
                            <td>Vision, observe</td>
                            <td>Perspective, watchfulness</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* People & Expressions */}
            <section class="doc-section">
                <h2>People & Expressions</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Star Person</strong></td>
                            <td>Simple character for representing people</td>
                        </tr>
                        <tr>
                            <td><strong>Stick Figure</strong></td>
                            <td>Basic human figure</td>
                        </tr>
                        <tr>
                            <td><strong>Sitting Person</strong></td>
                            <td>Person in seated position</td>
                        </tr>
                        <tr>
                            <td><strong>Presenting Person</strong></td>
                            <td>Person gesturing/presenting</td>
                        </tr>
                        <tr>
                            <td><strong>Hand Pointing</strong></td>
                            <td>Directional indicator</td>
                        </tr>
                        <tr>
                            <td><strong>Thumbs Up</strong></td>
                            <td>Approval, agreement</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Emotion Faces</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Face</th>
                            <th>Use For</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Happy Face</strong></td>
                            <td>Positive outcomes, success</td>
                        </tr>
                        <tr>
                            <td><strong>Sad Face</strong></td>
                            <td>Problems, pain points</td>
                        </tr>
                        <tr>
                            <td><strong>Confused Face</strong></td>
                            <td>Questions, complexity</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Containers */}
            <section class="doc-section">
                <h2>Containers & Frames</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Best For</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Sticky Note</strong></td>
                            <td>Quick ideas, reminders</td>
                        </tr>
                        <tr>
                            <td><strong>Scroll</strong></td>
                            <td>Lists, step-by-step content</td>
                        </tr>
                        <tr>
                            <td><strong>Ribbon</strong></td>
                            <td>Titles, headers, banners</td>
                        </tr>
                        <tr>
                            <td><strong>Double Banner</strong></td>
                            <td>Important titles, emphasis</td>
                        </tr>
                        <tr>
                            <td><strong>Speech Bubble</strong></td>
                            <td>Quotes, dialogue</td>
                        </tr>
                        <tr>
                            <td><strong>Thought Bubble</strong></td>
                            <td>Internal thoughts, ideas</td>
                        </tr>
                        <tr>
                            <td><strong>Callout</strong></td>
                            <td>Annotations, callouts</td>
                        </tr>
                        <tr>
                            <td><strong>Cloud</strong></td>
                            <td>Dreamy ideas, cloud topics</td>
                        </tr>
                        <tr>
                            <td><strong>Burst</strong></td>
                            <td>Emphasis, "POW!" moments</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Status & Markers */}
            <section class="doc-section">
                <h2>Status & Markers</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Use For</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Checkbox (empty)</strong></td>
                            <td>To-do items, action items</td>
                        </tr>
                        <tr>
                            <td><strong>Checkbox (checked)</strong></td>
                            <td>Completed items</td>
                        </tr>
                        <tr>
                            <td><strong>Numbered Badge</strong></td>
                            <td>Step numbers, priorities</td>
                        </tr>
                        <tr>
                            <td><strong>Question Mark</strong></td>
                            <td>Questions, unknowns</td>
                        </tr>
                        <tr>
                            <td><strong>Exclamation Mark</strong></td>
                            <td>Important, warnings</td>
                        </tr>
                        <tr>
                            <td><strong>Pin</strong></td>
                            <td>Location, pinned items</td>
                        </tr>
                        <tr>
                            <td><strong>Tag</strong></td>
                            <td>Labels, categories</td>
                        </tr>
                        <tr>
                            <td><strong>Checkmark</strong></td>
                            <td>Done, correct, approved</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Growth & Connection */}
            <section class="doc-section">
                <h2>Growth & Connection</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Shape</th>
                            <th>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Seedling</strong></td>
                            <td>Growth, beginning, potential</td>
                        </tr>
                        <tr>
                            <td><strong>Tree</strong></td>
                            <td>Hierarchy, branching, organic growth</td>
                        </tr>
                        <tr>
                            <td><strong>Mountain</strong></td>
                            <td>Challenge, peak, achievement</td>
                        </tr>
                        <tr>
                            <td><strong>Bridge</strong></td>
                            <td>Connection, transition</td>
                        </tr>
                        <tr>
                            <td><strong>Puzzle Piece</strong></td>
                            <td>Part of whole, fitting together</td>
                        </tr>
                        <tr>
                            <td><strong>Chain Link</strong></td>
                            <td>Connection, dependency</td>
                        </tr>
                        <tr>
                            <td><strong>Scale</strong></td>
                            <td>Balance, comparison</td>
                        </tr>
                        <tr>
                            <td><strong>Funnel</strong></td>
                            <td>Process, filtering, conversion</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Dividers */}
            <section class="doc-section">
                <h2>Dividers & Separators</h2>
                <ul>
                    <li><strong>Wavy Divider</strong> - Organic section separator</li>
                    <li><strong>Dashed Line</strong> - Subtle separation</li>
                    <li><strong>Arrow Trail</strong> - Directional flow between sections</li>
                </ul>

                <div class="tip-box">
                    <h5>Visual Hierarchy</h5>
                    <p>
                        Use dividers to create visual breathing room between
                        different topics or sections of your sketchnotes.
                    </p>
                </div>
            </section>

            {/* Sketchnoting Tips */}
            <section class="doc-section">
                <h2>Sketchnoting Tips</h2>

                <h3>Start Simple</h3>
                <ul>
                    <li>Begin with basic shapes (circles, squares, triangles)</li>
                    <li>Add simple icons to convey meaning</li>
                    <li>Use containers to group related ideas</li>
                </ul>

                <h3>Create Visual Hierarchy</h3>
                <ul>
                    <li><strong>Size</strong> - Bigger = more important</li>
                    <li><strong>Color</strong> - Use accent colors for key points</li>
                    <li><strong>Position</strong> - Top/center for main ideas</li>
                    <li><strong>Containers</strong> - Frame important content</li>
                </ul>

                <h3>Connect Ideas</h3>
                <ul>
                    <li>Use arrows to show relationships</li>
                    <li>Group related items visually</li>
                    <li>Create flow with directional elements</li>
                </ul>

                <h3>Add Personality</h3>
                <ul>
                    <li>Include people and faces</li>
                    <li>Use hand-drawn style (increase roughness)</li>
                    <li>Add small decorative elements</li>
                </ul>
            </section>

            {/* Layout Patterns */}
            <section class="doc-section">
                <h2>Layout Patterns</h2>
                <ul>
                    <li><strong>Linear</strong> - Top to bottom, like a list</li>
                    <li><strong>Radial</strong> - Central topic with branches</li>
                    <li><strong>Path</strong> - Follow a journey or timeline</li>
                    <li><strong>Modular</strong> - Grid of related sections</li>
                    <li><strong>Popcorn</strong> - Scattered, organic placement</li>
                </ul>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Sketchnote shapes are ordinary Yappy elements, so you can generate a whole visual note from
                    code. The API is exposed on the global <code class="code-inline">window.Yappy</code> object.
                    Use <code class="code-inline">Yappy.createElement(type, x, y, width, height, options)</code> with
                    a sketchnote <strong>type</strong> string, then adjust it with
                    <code class="code-inline">Yappy.updateElement(id, &#123; ... &#125;)</code>.
                </p>

                <h3>Element Types</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Type strings</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Icons</td>
                            <td>
                                <code class="code-inline">'lightbulb'</code>, <code class="code-inline">'target'</code>,
                                <code class="code-inline">'rocket'</code>, <code class="code-inline">'flag'</code>,
                                <code class="code-inline">'trophy'</code>, <code class="code-inline">'key'</code>,
                                <code class="code-inline">'gear'</code>, <code class="code-inline">'clock'</code>,
                                <code class="code-inline">'magnifyingGlass'</code>, <code class="code-inline">'book'</code>,
                                <code class="code-inline">'megaphone'</code>, <code class="code-inline">'eye'</code>,
                                <code class="code-inline">'signpost'</code>, <code class="code-inline">'burstBlob'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>People &amp; faces</td>
                            <td>
                                <code class="code-inline">'starPerson'</code>, <code class="code-inline">'stickFigure'</code>,
                                <code class="code-inline">'sittingPerson'</code>, <code class="code-inline">'presentingPerson'</code>,
                                <code class="code-inline">'handPointRight'</code>, <code class="code-inline">'thumbsUp'</code>,
                                <code class="code-inline">'faceHappy'</code>, <code class="code-inline">'faceSad'</code>,
                                <code class="code-inline">'faceConfused'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Containers</td>
                            <td>
                                <code class="code-inline">'scroll'</code>, <code class="code-inline">'ribbon'</code>,
                                <code class="code-inline">'doubleBanner'</code>, <code class="code-inline">'speechBubble'</code>,
                                <code class="code-inline">'thoughtBubble'</code>, <code class="code-inline">'callout'</code>,
                                <code class="code-inline">'cloud'</code>, <code class="code-inline">'burst'</code>,
                                <code class="code-inline">'stickyNote'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Markers &amp; status</td>
                            <td>
                                <code class="code-inline">'checkbox'</code>, <code class="code-inline">'checkboxChecked'</code>,
                                <code class="code-inline">'numberedBadge'</code>, <code class="code-inline">'questionMark'</code>,
                                <code class="code-inline">'exclamationMark'</code>, <code class="code-inline">'pin'</code>,
                                <code class="code-inline">'tag'</code>, <code class="code-inline">'stamp'</code>,
                                <code class="code-inline">'wavyDivider'</code>
                            </td>
                        </tr>
                        <tr>
                            <td>Growth &amp; connection</td>
                            <td>
                                <code class="code-inline">'seedling'</code>, <code class="code-inline">'tree'</code>,
                                <code class="code-inline">'mountain'</code>, <code class="code-inline">'bridge'</code>,
                                <code class="code-inline">'puzzlePiece'</code>, <code class="code-inline">'chainLink'</code>,
                                <code class="code-inline">'scale'</code>, <code class="code-inline">'funnel'</code>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <h3>Compose a Sketchnote</h3>
                <div class="code-block">
{`// window.Yappy is the global scripting entry point.

// A key insight, called out with a lightbulb and a banner label
const idea = Yappy.createElement('lightbulb', 120, 120, 80, 100, {
    strokeColor: '#f59e0b',
    roughness: 2               // loose, hand-drawn line
});

const banner = Yappy.createElement('doubleBanner', 240, 130, 220, 60, {
    containerText: 'Big Idea', // label rendered inside the container
    strokeColor: '#1e293b'
});

// A to-do marker and a happy face for a positive outcome
Yappy.createElement('checkbox', 120, 280, 40, 40);
Yappy.createElement('faceHappy', 200, 275, 50, 50, {
    strokeColor: '#16a34a'
});

// Show a relationship between two ideas
Yappy.connect(idea, banner, { type: 'arrow' });`}
                </div>

                <h3>Restyle a Shape Later</h3>
                <div class="code-block">
{`// Give the banner a solid fill and a new label
Yappy.updateElement(banner, {
    backgroundColor: '#fef3c7',
    fillStyle: 'solid',
    containerText: 'Key Takeaway'
});`}
                </div>

                <div class="tip-box">
                    <h5>Tip: Turn up the roughness</h5>
                    <p>
                        Pass <code class="code-inline">roughness: 2</code> (or higher) in the options to get the
                        loose, sketchy line quality that makes sketchnotes feel hand-drawn. Container shapes accept
                        <code class="code-inline">containerText</code> to place a label inside them.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default SketchnoteDoc;
