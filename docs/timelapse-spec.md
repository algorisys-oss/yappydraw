# Time-Lapse Recording — Technical Spec

> **Status (implemented):** Phases 1–7 shipped. Capture→IndexedDB persistence
> (`storage/timelapse-store.ts`, `utils/timelapse-manager.ts`), start/stop UI
> (Ctrl+Shift+T hotkey, menu items, `timelapse-overlay.tsx` indicator), replay
> player (`timelapse-player.tsx`), settings section (auto-record / capture
> resolution / export duration), and WebM export (export path A). API methods on
> `window.Yappy` (`startTimelapse`/`stopTimelapse`/`toggleTimelapse`/
> `exportTimelapse`/…). Remaining/optional: §8 per-stroke fidelity variant,
> WebCodecs export (path B), doc-linkage GC wiring on load.


Procreate-style **automatic process recording**: capture the drawing as it is built,
stroke by stroke, and replay/export it as a sped-up time-lapse video — regardless of
how long the real session took.

This is distinct from the existing **video recorder** (`utils/video-recorder.ts`),
which is a *manual, real-time* canvas capture (`captureStream(60)` → `MediaRecorder`),
meant for recording animations/presentation playback. Time-lapse is automatic,
event-driven (one frame per committed edit), and time-compressed.

---

## 1. Goals & non-goals

**Goals**
- Automatically record every committed change (stroke, move, resize, delete, style edit)
  while a "Record time-lapse" toggle is on.
- Persist frames so the recording survives reload (auto-save already round-trips the doc).
- Replay in-app with playback controls (play/pause/scrub/speed).
- Export to WebM/MP4 at a chosen target duration (e.g. "30s time-lapse") or fixed FPS.
- Negligible cost while drawing (capture must not stutter the pen).

**Non-goals (v1)**
- Audio / voiceover (already a separate todo item).
- Per-stroke editing of the recording.
- Branch/graph history capture — we follow the linear undo model.
- Recording camera pan/zoom moves as frames (v1 records *document* changes only; see §8).

---

## 2. Where it hooks in (grounded in current code)

The history system is the natural capture trigger — it already fires exactly once per
committed edit.

- **Commit signal** — `pushToHistory()` in
  [app-store.ts:500](../frontend/src/store/app-store.ts#L500) is called by every
  mutating op *before* it mutates: `addElement` (stroke begin), `deleteElements`,
  `updateElement(…, recordHistory=true)`, and move/resize via
  `initMoveState()` ([selection-handler.ts:126](../frontend/src/utils/tool-handlers/selection-handler.ts#L126)).
- **Problem:** `pushToHistory()` fires at the *start* of an op (it snapshots the
  *pre*-edit state). A pen stroke pushes history on pointer-down, before any points
  exist. So capturing a frame there would show the drawing *without* the new stroke.
- **Solution:** capture frames on **commit completion**, not on history push. The clean
  end-of-edit points are:
  - `drawOnUp()` ([draw-handler.ts:398](../frontend/src/utils/tool-handlers/draw-handler.ts#L398)) — pen/shape stroke finished.
  - `selectionOnUp()` ([selection-handler.ts:2299](../frontend/src/utils/tool-handlers/selection-handler.ts#L2299)) — move/resize finished.
  - `deleteElements()` / property-panel `updateElement(recordHistory=true)` — fire synchronously, capture right after.

Rather than sprinkle capture calls across handlers, prefer **one debounced reactive
watcher** (cleanest, lowest-touch):

```ts
// timelapse-manager.ts — runs inside Canvas reactive scope
createEffect(() => {
  store.undoStackLength;     // bumps once per committed edit (app-store.ts:506)
  store.elements.length;     // also covers add/delete
  if (!store.timelapseRecording) return;
  scheduleCapture();         // debounced ~250ms, trailing edge
});
```

`undoStackLength` is already a reactive store field bumped by `pushToHistory`/`undo`/`redo`
([app-store.ts:506](../frontend/src/store/app-store.ts#L506)), so this fires once per
commit without touching any handler. The trailing-edge debounce coalesces the
pointer-down history-push with the pointer-up final geometry into a single frame that
shows the *finished* stroke. This trades exact per-stroke fidelity for zero handler
changes — acceptable for a time-lapse (see §8 for the higher-fidelity variant).

---

## 3. Frame capture

Reuse the existing offscreen-render pattern from `captureThumbnail`
([recording-manager.ts:39](../frontend/src/utils/recording-manager.ts#L39)) — it already
renders the active slide to a temp canvas via `renderSlideBackground` +
`renderElement`. Factor that into a shared helper:

```ts
// renders current document to an offscreen canvas at a fixed capture resolution
function renderFrame(targetW: number): HTMLCanvasElement
```

Capture parameters:
- **Resolution:** downscaled, fixed (e.g. longest edge 960–1280px). Time-lapse never
  needs full-res; this bounds memory and encode time.
- **Format per frame:** encode to **WebP/JPEG blob** immediately
  (`canvas.toBlob(cb, 'image/webp', 0.7)`) — do *not* keep `ImageData`/canvases in an
  array (that is the memory killer; ~3.7MB/frame raw RGBA at 960×720 vs ~30–80KB WebP).
- **Dedup:** skip the frame if the document hash/element-revision is unchanged since the
  last capture (guards against effect double-fires).
- **Throughput guard:** capture is async (`toBlob` is off the main paint); the debounce
  keeps it off the hot pen path.

Frame record:

```ts
interface TimelapseFrame {
  seq: number;          // monotonically increasing
  t: number;            // ms since recording start (real wall-clock, for variable-speed replay)
  blobKey: string;      // IndexedDB key (see §4)
  w: number; h: number;
}
```

> `t` uses real elapsed time. Scripts can't call `Date.now()`, but app code can —
> capture timestamps in the manager. Store *relative* ms so a recording is portable.

---

## 4. Persistence — IndexedDB (new)

Frames are many and large-ish → **localStorage (the current auto-save backend) is wrong**
(5–10MB cap, synchronous, stringly). IndexedDB is currently unused but already
referenced by the `enableWorkspacePersistence` feature flag
([config/features.ts:14](../frontend/src/config/features.ts#L14)) — this feature should
introduce the first IndexedDB store.

New module `storage/timelapse-store.ts`:
- DB `yappy-timelapse`, object store `frames` keyed by `blobKey` (`${recordingId}:${seq}`),
  value = `Blob`.
- Object store `recordings` keyed by `recordingId`, value = manifest:
  ```ts
  interface TimelapseManifest {
    id: string;
    docId: string;        // ties to the drawing (menu.tsx drawingId())
    startedAt: number;
    frames: TimelapseFrame[];   // ordered metadata (NOT the blobs)
    captureW: number;
  }
  ```
- API: `putFrame`, `getFrame`, `listRecordings`, `deleteRecording`, `pruneToDoc(docId)`.

**Doc linkage:** store only the active `recordingId` (a string) inside the `SlideDocument`
/ `globalSettings` so the manifest+blobs are discoverable after reload. The heavy data
stays in IndexedDB, never in the localStorage auto-save JSON
([auto-save.ts](../frontend/src/storage/auto-save.ts)). This keeps `performAutoSave`
fast and under quota.

**Lifecycle / GC:** on doc load, prune IndexedDB recordings whose `docId` no longer
exists. Cap retained frames per recording (e.g. 5,000) with oldest-frame eviction +
a `log`-style toast when truncating (no silent caps).

---

## 5. Store & settings additions

`app-store.ts` AppState ([app-store.ts:63](../frontend/src/store/app-store.ts#L63)):
- `timelapseRecording: boolean` — capture on/off (transient, like `isRecording`).
- `timelapsePlaying: boolean`, `timelapsePlayhead: number` — replay UI state.
- `activeTimelapseId: string | null`.

`GlobalSettings` ([types/slide-types.ts:83](../frontend/src/types/slide-types.ts#L83)),
persisted via `updateGlobalSettings()`
([app-store.ts:1171](../frontend/src/store/app-store.ts#L1171)) → localStorage:
- `timelapseAutoRecord: boolean` — "always record time-lapses" preference.
- `timelapseCaptureWidth: number` (default 1024).
- `timelapseTargetDuration: number` (default 30s, used by export).

Settings UI: add a **Time-lapse** section to
[settings-dialog.tsx](../frontend/src/components/settings-dialog.tsx) (auto-record
toggle, capture resolution, default export duration).

---

## 6. Playback (in-app)

New `timelapse-player.tsx` overlay (model it on the existing animation playback
controls and `RecordingOverlay`):
- Loads the manifest, lazy-fetches frame blobs from IndexedDB, draws to a `<canvas>`
  / `<img>` via `createObjectURL`.
- Controls: play / pause / scrub / speed (1×/2×/4×/8×) / "fit duration to Ns".
- Two timing modes:
  - **Even** — each frame shown for equal time (classic time-lapse).
  - **Real-time-proportional** — use frame `t` deltas so pauses in the real session
    show as pauses (Procreate-like). Clamp max gap.
- Reuses `revokeObjectURL` discipline to avoid blob-URL leaks.

---

## 7. Export to video

Two viable paths; **A is the v1 recommendation**:

**A. Re-render to a real-time `MediaRecorder` stream (reuses existing recorder).**
Drive an offscreen canvas at the target FPS: blit frame N, wait one frame interval,
blit N+1, while `VideoRecorder` ([video-recorder.ts:8](../frontend/src/utils/video-recorder.ts#L8))
captures the offscreen canvas's `captureStream`. Pros: reuses the entire existing
WebM/MP4 + download pipeline (`start`/`stop`/`saveFile`). Cons: encode takes
~output-duration wall-clock (fine for a 30s time-lapse).

- Generalize `VideoRecorder` to accept any canvas (constructor already takes
  `HTMLCanvasElement` — pass the offscreen one).
- Compute per-frame hold = `targetDurationMs / frameCount`, or fixed FPS.

**B. `WebCodecs` `VideoEncoder` (frame-accurate, faster-than-real-time).**
Encode each blob → `VideoFrame` → muxed WebM. Faster and exact, but adds a muxer
dependency and a WebCodecs capability fallback to A. Defer to v2.

Export entry point: extend [export-dialog.tsx](../frontend/src/components/export-dialog.tsx)
with a "Time-lapse video" option alongside the existing webm/mp4 choices, wired through
a new `requestTimelapseExport` signal (parallel to `requestRecording`).

---

## 8. Fidelity variant (optional, v2)

The debounced-watcher capture (§2) coalesces rapid edits and won't catch *every*
intermediate point of a long single stroke (it captures the finished stroke). For
true per-stroke fidelity:
- Add explicit `captureTimelapseFrame()` calls at `drawOnUp` / `selectionOnUp` /
  `deleteElements`, gated on `store.timelapseRecording`.
- Optionally sample *during* a long stroke (every K points in `drawOnMove`) for the
  satisfying "watch the line grow" effect.
- Also capture camera-only changes (pan/zoom) as frames if "record viewport" is enabled.

---

## 9. Build order

1. `storage/timelapse-store.ts` — IndexedDB layer + manifest CRUD (unit-testable in isolation).
2. `utils/timelapse-manager.ts` — `renderFrame` helper (extracted from `captureThumbnail`),
   debounced reactive capture, start/stop, manifest writes. Wire into Canvas scope like
   `setupRecording`.
3. Store + `GlobalSettings` fields; settings-dialog section.
4. `timelapse-player.tsx` overlay + playback controls.
5. Export path A (generalize `VideoRecorder`, add export-dialog option + signal).
6. Persistence linkage: store `activeTimelapseId` in the doc; prune on load.
7. Docs: `docs/features.md` (§Export & Recording), `docs/learnings.md`, help/hotkeys,
   `api.ts` if a programmatic toggle is exposed. Refresh `.repograph`.

## 10. Risks / watch-outs

- **Pen stutter** — never capture synchronously on pointer events; debounce + async `toBlob`. Verify on the Huion tablet path.
- **Storage growth** — enforce per-recording frame cap + doc-GC; surface truncation.
- **Blob-URL leaks** — always `revokeObjectURL` in player and exporter.
- **Render parity** — `renderFrame` must honor layer visibility, master-layer projection,
  and theme exactly as `captureThumbnail` does, in **both** sketch and architectural styles.
- **Effect double-fire** — dedup by element-revision/hash so a single edit ≠ two frames.
- **Auto-save bloat** — keep frame blobs out of the localStorage JSON; only the id goes in the doc.
