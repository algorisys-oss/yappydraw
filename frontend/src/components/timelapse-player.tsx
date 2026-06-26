import { type Component, createSignal, createEffect, onCleanup, untrack, Show } from "solid-js";
import { Film, X, Play, Pause, Download } from "lucide-solid";
import { store } from "../store/app-store";
import { timelapsePlayerOpen, setTimelapsePlayerOpen, exportTimelapse } from "../utils/timelapse-manager";
import { getManifest, getFrame } from "../storage/timelapse-store";
import { showToast } from "./toast";
import "./timelapse-player.css";

// Per-frame hold at 1× speed (ms). ~11fps — feels like a brisk time-lapse.
const BASE_MS = 90;
const SPEEDS = [0.5, 1, 2, 4, 8];

/**
 * Time-lapse replay overlay (phase 4). Loads the active recording's frames from
 * IndexedDB into object URLs and plays them back with play/pause/scrub/speed.
 * Video export of the replay is a later phase.
 */
const TimelapsePlayer: Component = () => {
    const [urls, setUrls] = createSignal<string[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [index, setIndex] = createSignal(0);
    const [playing, setPlaying] = createSignal(false);
    const [speed, setSpeed] = createSignal(1);
    const [exporting, setExporting] = createSignal(false);
    const [exportPct, setExportPct] = createSignal(0);

    const reset = () => {
        // untrack so reading urls() here never makes a caller effect depend on it
        untrack(() => urls()).forEach(u => URL.revokeObjectURL(u));
        setUrls([]);
        setIndex(0);
        setPlaying(false);
        setError(null);
    };

    const load = async () => {
        reset();
        const id = store.activeTimelapseId;
        if (!id) { setError('No time-lapse recorded yet.'); return; }
        setLoading(true);
        try {
            const manifest = await getManifest(id);
            if (!manifest || manifest.frames.length === 0) {
                setError('This recording has no frames.');
                return;
            }
            const blobs = await Promise.all(manifest.frames.map(f => getFrame(f.blobKey)));
            const objUrls = blobs.filter((b): b is Blob => !!b).map(b => URL.createObjectURL(b));
            if (objUrls.length === 0) { setError('Frames could not be loaded.'); return; }
            setUrls(objUrls);
            setIndex(0);
            setPlaying(true);
        } catch (e) {
            console.error('[timelapse] player load failed', e);
            setError('Failed to load time-lapse.');
        } finally {
            setLoading(false);
        }
    };

    // Load when opened, tear down when closed. Only timelapsePlayerOpen() is a
    // dependency — load()/reset() touch other signals and must run untracked.
    createEffect(() => {
        const open = timelapsePlayerOpen();
        untrack(() => { if (open) void load(); else reset(); });
    });

    // Playback ticker — re-created whenever play state / speed / frame set changes.
    createEffect(() => {
        const isPlaying = playing();
        const s = speed();
        const n = urls().length;
        if (!isPlaying || n === 0) return;
        const interval = Math.max(16, BASE_MS / s);
        const t = setInterval(() => {
            setIndex(i => {
                if (i >= n - 1) { setPlaying(false); return i; }
                return i + 1;
            });
        }, interval);
        onCleanup(() => clearInterval(t));
    });

    onCleanup(reset);

    const close = () => setTimelapsePlayerOpen(false);

    const togglePlay = () => {
        if (urls().length === 0) return;
        if (index() >= urls().length - 1) setIndex(0); // replay from start
        setPlaying(p => !p);
    };

    const doExport = async () => {
        if (exporting()) return;
        setPlaying(false);
        setExporting(true);
        setExportPct(0);
        showToast(`Rendering time-lapse video (~${store.globalSettings.timelapseTargetDuration ?? 30}s)…`, "info");
        try {
            const ok = await exportTimelapse('webm', (done, total) => setExportPct(Math.round((done / total) * 100)));
            showToast(ok ? "Time-lapse video saved!" : "Nothing to export", ok ? "success" : "error");
        } catch (e) {
            console.error('[timelapse] export failed', e);
            showToast("Time-lapse export failed", "error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <Show when={timelapsePlayerOpen()}>
            <div class="tl-player-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
                <div class="tl-player">
                    <div class="tl-player-header">
                        <span class="tl-player-title"><Film size={16} /> Time-lapse</span>
                        <button class="tl-player-close" onClick={close} title="Close"><X size={18} /></button>
                    </div>

                    <div class="tl-player-stage">
                        <Show when={loading()}>
                            <div class="tl-player-msg">Loading frames…</div>
                        </Show>
                        <Show when={error()}>
                            <div class="tl-player-msg">{error()}</div>
                        </Show>
                        <Show when={!loading() && !error() && urls().length > 0}>
                            <img class="tl-player-frame" src={urls()[index()]} alt="time-lapse frame" />
                        </Show>
                    </div>

                    <Show when={urls().length > 0}>
                        <div class="tl-player-controls">
                            <button class="tl-player-btn" onClick={togglePlay} title={playing() ? 'Pause' : 'Play'}>
                                {playing() ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <input
                                class="tl-player-scrub"
                                type="range"
                                min="0"
                                max={urls().length - 1}
                                value={index()}
                                onInput={(e) => { setPlaying(false); setIndex(+e.currentTarget.value); }}
                            />
                            <span class="tl-player-counter">{index() + 1} / {urls().length}</span>
                            <select
                                class="tl-player-speed"
                                value={speed()}
                                onChange={(e) => setSpeed(+e.currentTarget.value)}
                                title="Playback speed"
                                disabled={exporting()}
                            >
                                {SPEEDS.map(s => <option value={s}>{s}×</option>)}
                            </select>
                            <button
                                class="tl-player-export"
                                onClick={doExport}
                                disabled={exporting()}
                                title="Export as video (WebM)"
                            >
                                <Download size={16} />
                                <span>{exporting() ? `Exporting ${exportPct()}%` : 'Export'}</span>
                            </button>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default TimelapsePlayer;
