/**
 * Animation Documentation
 * Comprehensive guide to the Yappy animation system
 */

import type { Component } from 'solid-js';

export const AnimationDoc: Component = () => {
    return (
        <div class="doc-container">
            {/* Header */}
            <header class="doc-header">
                <h1>Animations</h1>
                <p class="doc-intro">
                    Add life to your diagrams with powerful animation capabilities.
                    Yappy supports 40+ animation presets, keyframe animations, path animations,
                    shape morphing, and spring physics for natural motion.
                </p>
            </header>

            {/* Key Features */}
            <section class="doc-section">
                <h2>Key Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h4>40+ Presets</h4>
                        <p>Entrance, exit, and emphasis animations inspired by Animate.css</p>
                    </div>
                    <div class="feature-card">
                        <h4>Keyframes</h4>
                        <p>Create custom animations with precise control over timing and values</p>
                    </div>
                    <div class="feature-card">
                        <h4>Path Animation</h4>
                        <p>Animate elements along any SVG path with auto-rotation</p>
                    </div>
                    <div class="feature-card">
                        <h4>Shape Morphing</h4>
                        <p>Smoothly transform one shape into another</p>
                    </div>
                    <div class="feature-card">
                        <h4>Spring Physics</h4>
                        <p>Natural, physics-based motion with bounce and settle</p>
                    </div>
                    <div class="feature-card">
                        <h4>Recording</h4>
                        <p>Export animations to WebM video or GIF format</p>
                    </div>
                </div>
            </section>

            {/* Animation Presets */}
            <section class="doc-section">
                <h2>Animation Presets</h2>
                <p>Yappy includes a rich library of animation presets organized by category:</p>

                <h3>Entrance Animations</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Animations</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Fade</strong></td>
                            <td>fadeIn, fadeInDown, fadeInUp, fadeInLeft, fadeInRight, fadeInTopLeft, fadeInTopRight, fadeInBottomLeft, fadeInBottomRight</td>
                        </tr>
                        <tr>
                            <td><strong>Slide</strong></td>
                            <td>slideInDown, slideInUp, slideInLeft, slideInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Bounce</strong></td>
                            <td>bounceIn, bounceInDown, bounceInUp, bounceInLeft, bounceInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Zoom</strong></td>
                            <td>zoomIn, zoomInDown, zoomInUp, zoomInLeft, zoomInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Back</strong></td>
                            <td>backInDown, backInUp, backInLeft, backInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Rotate</strong></td>
                            <td>rotateIn, rotateInDownLeft, rotateInDownRight, rotateInUpLeft, rotateInUpRight</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Exit Animations</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Animations</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Fade</strong></td>
                            <td>fadeOut, fadeOutDown, fadeOutUp, fadeOutLeft, fadeOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Slide</strong></td>
                            <td>slideOutDown, slideOutUp, slideOutLeft, slideOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Bounce</strong></td>
                            <td>bounceOut, bounceOutDown, bounceOutUp, bounceOutLeft, bounceOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Zoom</strong></td>
                            <td>zoomOut, zoomOutDown, zoomOutUp, zoomOutLeft, zoomOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Back</strong></td>
                            <td>backOutDown, backOutUp, backOutLeft, backOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Rotate</strong></td>
                            <td>rotateOut, rotateOutDownLeft, rotateOutDownRight, rotateOutUpLeft, rotateOutUpRight</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Emphasis Animations (Attention Seekers)</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Animation</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>bounce</strong></td>
                            <td>Element bounces up and down</td>
                        </tr>
                        <tr>
                            <td><strong>flash</strong></td>
                            <td>Element flashes (opacity pulses)</td>
                        </tr>
                        <tr>
                            <td><strong>pulse</strong></td>
                            <td>Element scales up and back</td>
                        </tr>
                        <tr>
                            <td><strong>rubberBand</strong></td>
                            <td>Element stretches and snaps back</td>
                        </tr>
                        <tr>
                            <td><strong>shakeX / shakeY</strong></td>
                            <td>Element shakes horizontally/vertically</td>
                        </tr>
                        <tr>
                            <td><strong>headShake</strong></td>
                            <td>Element shakes side to side (like saying "no")</td>
                        </tr>
                        <tr>
                            <td><strong>swing</strong></td>
                            <td>Element swings like a pendulum</td>
                        </tr>
                        <tr>
                            <td><strong>tada</strong></td>
                            <td>Element does a "ta-da!" reveal</td>
                        </tr>
                        <tr>
                            <td><strong>wobble</strong></td>
                            <td>Element wobbles back and forth</td>
                        </tr>
                        <tr>
                            <td><strong>jello</strong></td>
                            <td>Element jiggles like jello</td>
                        </tr>
                        <tr>
                            <td><strong>heartBeat</strong></td>
                            <td>Element pulses like a heartbeat</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Easing Functions */}
            <section class="doc-section">
                <h2>Easing Functions</h2>
                <p>Control the timing and feel of animations with easing functions:</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Functions</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Linear</strong></td>
                            <td>linear</td>
                            <td>Constant speed, no acceleration</td>
                        </tr>
                        <tr>
                            <td><strong>Quadratic</strong></td>
                            <td>easeInQuad, easeOutQuad, easeInOutQuad</td>
                            <td>Gentle acceleration/deceleration</td>
                        </tr>
                        <tr>
                            <td><strong>Cubic</strong></td>
                            <td>easeInCubic, easeOutCubic, easeInOutCubic</td>
                            <td>More pronounced curve</td>
                        </tr>
                        <tr>
                            <td><strong>Exponential</strong></td>
                            <td>easeInExpo, easeOutExpo, easeInOutExpo</td>
                            <td>Dramatic start/end</td>
                        </tr>
                        <tr>
                            <td><strong>Bounce</strong></td>
                            <td>easeInBounce, easeOutBounce, easeInOutBounce</td>
                            <td>Bouncing ball effect</td>
                        </tr>
                        <tr>
                            <td><strong>Elastic</strong></td>
                            <td>easeInElastic, easeOutElastic</td>
                            <td>Spring-like overshoot</td>
                        </tr>
                        <tr>
                            <td><strong>Back</strong></td>
                            <td>easeInBack, easeOutBack</td>
                            <td>Overshoots then settles</td>
                        </tr>
                        <tr>
                            <td><strong>Spring</strong></td>
                            <td>easeSpring</td>
                            <td>Physics-based spring motion</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Choosing the Right Easing</h5>
                    <p>
                        <strong>easeOut</strong> - Best for entrances (fast start, gentle end)<br />
                        <strong>easeIn</strong> - Best for exits (gentle start, fast end)<br />
                        <strong>easeInOut</strong> - Best for emphasis or continuous motion<br />
                        <strong>spring</strong> - Best for natural, organic feel
                    </p>
                </div>
            </section>

            {/* Spring Physics */}
            <section class="doc-section">
                <h2>Spring Physics</h2>
                <p>Create natural, physics-based motion using spring dynamics:</p>

                <h3>Spring Parameters</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Default</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>stiffness</strong></td>
                            <td>170</td>
                            <td>Spring tension (100-300). Higher = snappier motion</td>
                        </tr>
                        <tr>
                            <td><strong>damping</strong></td>
                            <td>26</td>
                            <td>Friction/resistance (10-40). Higher = less bounce</td>
                        </tr>
                        <tr>
                            <td><strong>mass</strong></td>
                            <td>1</td>
                            <td>Object weight (0.5-2). Higher = slower, heavier feel</td>
                        </tr>
                        <tr>
                            <td><strong>velocity</strong></td>
                            <td>0</td>
                            <td>Initial velocity. Add momentum to the start</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Create a custom spring
Yappy.animateElement(id, { x: 500 }, {
    easing: Yappy.createSpring(200, 20, 1, 0)
});

// Use default spring
Yappy.animateElement(id, { y: 300 }, {
    easing: 'easeSpring'
});`}
                </div>
            </section>

            {/* Path Animation */}
            <section class="doc-section">
                <h2>Path Animation</h2>
                <p>Animate elements along any SVG path:</p>

                <h3>Basic Usage</h3>
                <div class="code-block">
{`// Animate along a curved path
const pathData = "M 0 0 C 100 0 100 100 200 100";
Yappy.animateAlongPath(elementId, pathData, {
    duration: 2000,
    orientToPath: true,  // Auto-rotate to follow path
    isRelative: true     // Path is relative to element position
});`}
                </div>

                <h3>Options</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Option</th>
                            <th>Default</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>orientToPath</strong></td>
                            <td>false</td>
                            <td>Rotate element to follow path direction</td>
                        </tr>
                        <tr>
                            <td><strong>isRelative</strong></td>
                            <td>false</td>
                            <td>Treat path coordinates as relative to element</td>
                        </tr>
                        <tr>
                            <td><strong>startOffset</strong></td>
                            <td>0</td>
                            <td>Start position on path (0-1)</td>
                        </tr>
                        <tr>
                            <td><strong>endOffset</strong></td>
                            <td>1</td>
                            <td>End position on path (0-1)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Shape Morphing */}
            <section class="doc-section">
                <h2>Shape Morphing</h2>
                <p>Smoothly transform one shape into another:</p>

                <div class="code-block">
{`// Morph a rectangle into an ellipse
Yappy.animateMorph(rectId, 'ellipse', {
    duration: 800,
    easing: 'easeInOutCubic'
});

// Supported shape targets:
// rectangle, ellipse, diamond, triangle, star, hexagon, etc.`}
                </div>

                <div class="tip-box">
                    <h5>Tip</h5>
                    <p>
                        For best results, morph between shapes with similar complexity.
                        Morphing a simple rectangle to a complex star will work, but
                        the intermediate frames may look unusual.
                    </p>
                </div>
            </section>

            {/* Keyframe Animation */}
            <section class="doc-section">
                <h2>Keyframe Animation</h2>
                <p>Create precise, multi-step animations with keyframes:</p>

                <div class="code-block">
{`// Animate X position through keyframes
Yappy.animateElementKeyframes(elementId, 'x', [
    { offset: 0, value: 100 },
    { offset: 0.5, value: 300, easing: 'easeOutBounce' },
    { offset: 1, value: 200, easing: 'easeInOutCubic' }
], { duration: 2000 });

// Animate multiple properties
Yappy.animateElementKeyframes(elementId, 'opacity', [
    { offset: 0, value: 100 },
    { offset: 0.3, value: 50 },
    { offset: 1, value: 100 }
], { duration: 1000, loop: true });`}
                </div>

                <h3>Keyframe Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>offset</strong></td>
                            <td>Position in timeline (0-1)</td>
                        </tr>
                        <tr>
                            <td><strong>value</strong></td>
                            <td>Target value at this keyframe</td>
                        </tr>
                        <tr>
                            <td><strong>easing</strong></td>
                            <td>Easing function to use when transitioning TO this keyframe</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Animatable Properties */}
            <section class="doc-section">
                <h2>Animatable Properties</h2>
                <p>The following element properties can be animated:</p>

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
                            <td><strong>x, y</strong></td>
                            <td>number</td>
                            <td>Position coordinates</td>
                        </tr>
                        <tr>
                            <td><strong>width, height</strong></td>
                            <td>number</td>
                            <td>Element dimensions</td>
                        </tr>
                        <tr>
                            <td><strong>opacity</strong></td>
                            <td>number</td>
                            <td>Transparency (0-100)</td>
                        </tr>
                        <tr>
                            <td><strong>angle</strong></td>
                            <td>number</td>
                            <td>Rotation in degrees</td>
                        </tr>
                        <tr>
                            <td><strong>strokeWidth</strong></td>
                            <td>number</td>
                            <td>Border thickness</td>
                        </tr>
                        <tr>
                            <td><strong>roughness</strong></td>
                            <td>number</td>
                            <td>Hand-drawn effect intensity</td>
                        </tr>
                        <tr>
                            <td><strong>drawProgress</strong></td>
                            <td>number</td>
                            <td>Progressive draw (0-1)</td>
                        </tr>
                        <tr>
                            <td><strong>strokeColor</strong></td>
                            <td>hex color</td>
                            <td>Border color</td>
                        </tr>
                        <tr>
                            <td><strong>backgroundColor</strong></td>
                            <td>hex color</td>
                            <td>Fill color</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Recording & Export */}
            <section class="doc-section">
                <h2>Recording & Export</h2>
                <p>Export your animations as video files:</p>

                <h3>Supported Formats</h3>
                <ul>
                    <li><strong>WebM</strong> - High quality video with transparency support</li>
                    <li><strong>GIF</strong> - Universal compatibility, larger file size</li>
                </ul>

                <h3>Recording Options</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Option</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Resolution</strong></td>
                            <td>Choose output dimensions (720p, 1080p, etc.)</td>
                        </tr>
                        <tr>
                            <td><strong>Frame Rate</strong></td>
                            <td>Frames per second (24, 30, 60)</td>
                        </tr>
                        <tr>
                            <td><strong>Background</strong></td>
                            <td>Transparent or solid color</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* API Reference */}
            <section class="doc-section">
                <h2>API Reference</h2>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>animateElement(id, target, config)</code></td>
                            <td>Animate element properties</td>
                        </tr>
                        <tr>
                            <td><code>animateElements(ids, target, config, stagger)</code></td>
                            <td>Animate multiple elements with stagger</td>
                        </tr>
                        <tr>
                            <td><code>animateElementKeyframes(id, prop, keyframes, config)</code></td>
                            <td>Keyframe animation</td>
                        </tr>
                        <tr>
                            <td><code>animateAlongPath(id, pathData, config)</code></td>
                            <td>Path animation</td>
                        </tr>
                        <tr>
                            <td><code>animateMorph(id, targetShape, config)</code></td>
                            <td>Shape morphing</td>
                        </tr>
                        <tr>
                            <td><code>playAnimation(id, name, config)</code></td>
                            <td>Play a preset animation</td>
                        </tr>
                        <tr>
                            <td><code>stopAllElementAnimations(id)</code></td>
                            <td>Stop all animations on element</td>
                        </tr>
                        <tr>
                            <td><code>createSpring(stiffness, damping, mass, velocity)</code></td>
                            <td>Create custom spring easing</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Space</span>
                        </div>
                        <span class="shortcut-desc">Play/Pause animation</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Esc</span>
                        </div>
                        <span class="shortcut-desc">Stop animation</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AnimationDoc;
