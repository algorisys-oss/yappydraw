# Video Export Feature

**Date:** Jan 2026

## Overview
Yappy now supports exporting animations directly to video files (**WebM** and **MP4**). This allows users to share "Flow" and "Motion" animations on social media (LinkedIn, Twitter/X) or use them in presentations.

## Technical Implementation

### Core Technology
The feature relies entirely on client-side browser APIs, ensuring no server cost and maximum privacy.

1.  **Canvas Capture**:
    Using `HTMLCanvasElement.captureStream(fps)`, we generate a `MediaStream` from the main drawing canvas. We default to **60 FPS** for smooth playback.

2.  **MediaRecorder API**:
    The `MediaRecorder` API ingests the canvas stream.
    *   **WebM**: Uses `video/webm; codecs=vp9` (or `vp8` fallback) which is native to Chrome/Firefox.
    *   **MP4**: Uses `video/mp4` (if supported by browser) or falls back to `video/webm; codecs=h264` container-less streams if strict MP4 isn't available. Note: Safari supports native MP4 recording; Chrome is adding support.

### Architecture

#### `VideoRecorder` Utility (`src/utils/video-recorder.ts`)
A standalone class that manages the `MediaRecorder` lifecycle.
*   **Methods**: `start(format)`, `stop(callback)`.
*   **Chunk Handling**: Accumulates `Blob` chunks on `dataavailable`.
*   **Download**: On stop, creates a logical download link for the user.

#### `RecordingOverlay` Component
A floating UI element that appears top-center during active recording.
*   **Visuals**: "REC" indicator with pulsing red dot and a duration timer.
*   **Controls**: Stop button to finalize the recording.
*   **State**: Controlled by `store.isRecording`.

#### State Management
*   `store.isRecording`: Boolean in global `AppState` to toggle the overlay.
*   `Canvas.tsx`: Listens for `requestRecording` signals (from the Menu/Dialog) and initializes the recorder.

## Usage
Triggered via the **Export Dialog** (`Ctrl+Shift+E`):
*   Select **WebM Monitor** or **MP4 Video**.
*   Click **Export**.
*   Perform animations interaction.
*   Click **Stop** on the overlay.
