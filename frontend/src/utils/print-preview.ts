/**
 * Print preview (soft proof) — docs/cmyk-print-plan.md, P6.
 *
 * Shows the canvas as it will print: every pixel of the finished frame goes sRGB → CMYK → sRGB
 * through the press profile. Rather than proof each colour as it is drawn (which would miss
 * images, gradients, shadows and anything else drawn as pixels), the whole frame is mapped through
 * a 3D lookup table on the GPU (WebGL2, trilinear) and drawn on an overlay above the canvas. The
 * canvas underneath turns transparent but keeps every pointer event, so editing works as usual.
 *
 * `canvas.tsx` calls `printPreviewFrame(canvas)` at the end of every draw; it does nothing unless
 * the preview is on.
 */
import { createSignal } from 'solid-js';
import type { PrintProfileId } from './color-management';

/** Lattice size of the lookup table: 33³ points, the usual size for a soft-proof LUT. */
const LUT_SIZE = 33;

const [active, setActive] = createSignal(false);
const [profileId, setProfileId] = createSignal<PrintProfileId>('fogra39');
const [failure, setFailure] = createSignal('');
export { active as printPreviewActive, profileId as printPreviewProfile, failure as printPreviewError };

let overlay: HTMLCanvasElement | null = null;
let renderer: LutRenderer | null = null;
let lutFor: PrintProfileId | null = null;
let lastSource: HTMLCanvasElement | null = null;

/** The overlay canvas, registered by `PrintPreviewOverlay` when it mounts. */
export function registerPrintPreviewOverlay(el: HTMLCanvasElement | null): void {
    if (el === overlay) return;
    overlay = el;
    renderer?.dispose();
    renderer = null;
    lutFor = null;
}

/**
 * Turn the preview on or off. Turning it on loads the colour engine and builds the table for the
 * profile (once per profile). Resolves to whether the preview is on afterwards — it stays off,
 * with `printPreviewError()` set, when WebGL2 or the profile isn't available.
 */
export async function setPrintPreview(on: boolean, profile?: PrintProfileId): Promise<boolean> {
    setFailure('');
    if (profile) setProfileId(profile);
    if (!on) { setActive(false); return false; }
    try {
        await ensureLut();
        setActive(true);
        if (lastSource) printPreviewFrame(lastSource);
        return true;
    } catch (err) {
        setActive(false);
        setFailure(err instanceof Error ? err.message : String(err));
        return false;
    }
}

export const togglePrintPreview = () => setPrintPreview(!active());

async function ensureLut(): Promise<void> {
    if (!overlay) throw new Error('Print preview: the canvas is not ready');
    if (!renderer) renderer = new LutRenderer(overlay);
    if (lutFor === profileId()) return;
    const { loadColorEngine } = await import('./color-management');
    const engine = await loadColorEngine(profileId());
    renderer.setLut(engine.proofLut(LUT_SIZE), LUT_SIZE);
    lutFor = profileId();
}

/** Called after every canvas draw. */
export function printPreviewFrame(source: HTMLCanvasElement): void {
    lastSource = source;
    if (!active() || !renderer || !overlay) return;
    if (lutFor !== profileId()) { void ensureLut().then(() => printPreviewFrame(source)); return; }
    renderer.render(source);
}

// ── WebGL2 ─────────────────────────────────────────────────────────────────────────

const VERT = `#version 300 es
in vec2 p;
out vec2 uv;
void main() {
    uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); // canvas rows run top-down
    gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler3D;
uniform sampler2D src;
uniform sampler3D lut;
uniform float n;
in vec2 uv;
out vec4 color;
void main() {
    vec4 c = texture(src, uv);
    // Sample at texel centres so 0 and 1 land exactly on the first and last lattice points.
    vec3 coord = c.rgb * ((n - 1.0) / n) + 0.5 / n;
    color = vec4(texture(lut, coord).rgb, c.a);
}`;

class LutRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private srcTex: WebGLTexture;
    private lutTex: WebGLTexture;
    private nLoc: WebGLUniformLocation | null;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true, antialias: false });
        if (!gl) throw new Error('Print preview needs WebGL2, which this browser does not provide');
        this.gl = gl;
        const shader = (type: number, src: string) => {
            const s = gl.createShader(type)!;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`Print preview shader: ${gl.getShaderInfoLog(s)}`);
            return s;
        };
        const prog = gl.createProgram()!;
        gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`Print preview program: ${gl.getProgramInfoLog(prog)}`);
        this.program = prog;
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        this.srcTex = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
        for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
        gl.uniform1i(gl.getUniformLocation(prog, 'src'), 0);

        this.lutTex = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, this.lutTex);
        // LINEAR on a 3D texture is trilinear interpolation between lattice points, done by the GPU.
        for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_3D, k, v);
        gl.uniform1i(gl.getUniformLocation(prog, 'lut'), 1);
        this.nLoc = gl.getUniformLocation(prog, 'n');
    }

    setLut(data: Uint8Array, n: number): void {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, this.lutTex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB8, n, n, n, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
        gl.useProgram(this.program);
        gl.uniform1f(this.nLoc, n);
    }

    render(source: HTMLCanvasElement): void {
        const gl = this.gl;
        if (this.canvas.width !== source.width || this.canvas.height !== source.height) {
            this.canvas.width = source.width;
            this.canvas.height = source.height;
        }
        // Same on-screen box as the canvas it covers: its size (the backing store is DPR-scaled)
        // and its offset — the canvas does not sit at its container's origin.
        const st = this.canvas.style;
        const w = source.style.width || `${source.clientWidth}px`, h = source.style.height || `${source.clientHeight}px`;
        const left = `${source.offsetLeft}px`, top = `${source.offsetTop}px`;
        if (st.width !== w) st.width = w;
        if (st.height !== h) st.height = h;
        if (st.left !== left) st.left = left;
        if (st.top !== top) st.top = top;
        gl.viewport(0, 0, source.width, source.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
        // Straight (unpremultiplied) colour in, so the lookup sees real colours at soft edges.
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.useProgram(this.program);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    dispose(): void {
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
