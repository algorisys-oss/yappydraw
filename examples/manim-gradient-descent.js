/**
 * Sample manim-style scene for YappyDraw — "gradient descent on a parabola".
 *
 * Paste this whole file into the DevTools console of a running YappyDraw tab.
 * It builds the scene, then plays it. To re-run: `GD.build(); GD.play()`.
 *
 * Uses only the public API. Compare with manim:
 *
 *   manim                                    YappyDraw
 *   ------------------------------------     ------------------------------------
 *   axes = Axes(x_range=[-3,3], ...)         const ax = Yappy.plot.axes({...})
 *   axes.get_graph(lambda x: x**2)           Yappy.plot.graph(ax, x => x*x)
 *   axes.c2p(x, y)                           Yappy.plot.point(ax, x, y)
 *   self.play(dot.animate.move_to(p))        Yappy.scene.play(dot, {x, y})
 *   self.play(FadeIn(a), FadeIn(b))          Yappy.scene.playAll([...])
 *   self.wait(0.4)                           Yappy.scene.wait(0.4)
 */
window.GD = (() => {
    const Y = window.Yappy;

    const f = x => x * x;          // loss surface
    const grad = x => 2 * x;       // dL/dx
    const R = 13;                  // ball radius

    function build() {
        Y.clear();
        Y.scene.reset();

        const ax = Y.plot.axes({
            ox: 480, oy: 520, sx: 110, sy: 46,
            xMin: -3, xMax: 3, yMin: 0, yMax: 9,
            step: 1,
        });

        // the parabola — one call, poles/domain handled for us
        Y.plot.graph(ax, f, { strokeColor: '#2563eb', strokeWidth: 3 });

        const title = Y.createText(300, 90, 'Gradient descent:  x ← x − η·∇L', { fontSize: 26, strokeColor: '#0f172a', opacity: 0 });
        const loss = Y.createText(760, 150, 'L = x²', { fontSize: 20, strokeColor: '#2563eb', opacity: 0 });

        // the ball starts high on the left slope
        let x = -2.6;
        const p0 = Y.plot.point(ax, x, f(x));
        const ball = Y.createCircle(p0.x - R, p0.y - R, R * 2, R * 2, { backgroundColor: '#ef4444', strokeColor: '#991b1b' });

        // captions fade in together, then sit
        Y.scene.playAll([
            { id: title, to: { opacity: 100 } },
            { id: loss, to: { opacity: 100 } },
        ], { duration: 0.8 });
        Y.scene.wait(0.4);

        // 12 descent steps — each is one play() call, sequenced by statement order
        const eta = 0.18;
        for (let i = 0; i < 12; i++) {
            x = x - eta * grad(x);
            const p = Y.plot.point(ax, x, f(x));
            Y.scene.play(ball, { x: p.x - R, y: p.y - R }, { duration: 0.35 });
        }

        Y.scene.wait(0.5);
        const done = Y.createText(700, 470, 'converged → x ≈ 0', { fontSize: 20, strokeColor: '#16a34a', opacity: 0 });
        Y.scene.play(done, { opacity: 100 }, { duration: 0.6 });

        console.log(`[GD] scene built — ${Y.getCompositionTracks().length} tracks, ${Y.scene.at().toFixed(2)}s`);
        return Y.scene.at();
    }

    function play() {
        Y.toggleSceneTimeline(true);   // the seconds-based timeline drives composition tracks
        Y.seekScene(0);
        Y.playScene(true);
    }

    return { build, play, seek: t => Y.seekScene(t), duration: () => Y.scene.at() };
})();

// Build + play immediately on paste.
GD.build();
GD.play();
