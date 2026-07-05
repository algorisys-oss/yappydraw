/**
 * Arcade sound — a tiny WebAudio synthesizer for game SFX + a simple looping
 * background music. No asset files: every sound is generated from oscillators,
 * so it weighs nothing, works offline, and rides into the exported player
 * bundle unchanged. All calls no-op gracefully if WebAudio is unavailable
 * (headless, blocked, or pre-gesture).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let musicTimer: ReturnType<typeof setInterval> | null = null;

function ac(): AudioContext | null {
    if (typeof window === 'undefined' || muted) return null;
    if (!ctx) {
        const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
        if (!AC) return null;
        try {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0.28;
            master.connect(ctx.destination);
        } catch { return null; }
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
}

/** A single enveloped oscillator note. */
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 1): void {
    const c = ac(); if (!c || !master) return;
    try {
        const o = c.createOscillator(); const g = c.createGain();
        o.type = type; o.frequency.value = freq;
        o.connect(g); g.connect(master);
        const t = c.currentTime + start;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        o.start(t); o.stop(t + dur + 0.03);
    } catch { /* ignore */ }
}

/** A pitch sweep (f0 → f1). */
function sweep(f0: number, f1: number, dur: number, type: OscillatorType = 'square', vol = 1): void {
    const c = ac(); if (!c || !master) return;
    try {
        const o = c.createOscillator(); const g = c.createGain();
        o.type = type;
        const t = c.currentTime;
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
        o.connect(g); g.connect(master);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        o.start(t); o.stop(t + dur + 0.03);
    } catch { /* ignore */ }
}

/** A short filtered noise burst (hits / explosions). */
function noise(dur: number, vol = 1, cutoff = 1200): void {
    const c = ac(); if (!c || !master) return;
    try {
        const n = Math.floor(c.sampleRate * dur);
        const buf = c.createBuffer(1, n, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
        const g = c.createGain(); g.gain.value = vol;
        src.connect(f); f.connect(g); g.connect(master);
        src.start();
    } catch { /* ignore */ }
}

export const SFX = ['coin', 'jump', 'hit', 'powerup', 'explosion', 'blip', 'win', 'lose', 'click'] as const;
export type Sfx = typeof SFX[number];

export function playSfx(name: string): void {
    switch (name) {
        case 'coin': tone(988, 0, 0.07, 'square', 0.5); tone(1319, 0.07, 0.12, 'square', 0.5); break;
        case 'jump': sweep(240, 680, 0.14, 'square', 0.4); break;
        case 'hit': sweep(320, 70, 0.14, 'square', 0.5); noise(0.08, 0.25, 900); break;
        case 'powerup': tone(523, 0, 0.07, 'square', 0.4); tone(659, 0.07, 0.07, 'square', 0.4); tone(784, 0.14, 0.07, 'square', 0.4); tone(1047, 0.21, 0.14, 'square', 0.4); break;
        case 'explosion': noise(0.45, 0.6, 700); sweep(180, 40, 0.4, 'sawtooth', 0.3); break;
        case 'blip': tone(820, 0, 0.05, 'square', 0.4); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.16, 'square', 0.4)); break;
        case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.13, 0.2, 'triangle', 0.45)); break;
        case 'click': tone(1000, 0, 0.03, 'triangle', 0.35); break;
        default: tone(660, 0, 0.06, 'square', 0.4);
    }
}

// A gentle looping arpeggio for background music.
const MUSIC_PATTERN = [262, 330, 392, 523, 392, 330, 294, 349]; // C major-ish
let musicStep = 0;

export function startMusic(): void {
    stopMusic();
    if (!ac()) return;
    musicStep = 0;
    musicTimer = setInterval(() => {
        const f = MUSIC_PATTERN[musicStep % MUSIC_PATTERN.length];
        tone(f, 0, 0.22, 'triangle', 0.12);
        if (musicStep % 4 === 0) tone(f / 2, 0, 0.4, 'sine', 0.1); // soft bass
        musicStep++;
    }, 260);
}

export function stopMusic(): void {
    if (musicTimer !== null) { clearInterval(musicTimer); musicTimer = null; }
}

export function setMuted(m: boolean): void {
    muted = m;
    if (m) stopMusic();
    if (master) master.gain.value = m ? 0 : 0.28;
}
export const isMuted = () => muted;
