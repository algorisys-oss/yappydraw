/**
 * Video Recorder Utility
 * Handles capturing the canvas stream and saving it as a video file
 */

export type VideoFormat = 'webm' | 'mp4';

export class VideoRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private canvas: HTMLCanvasElement;
    private onStopCallback: (() => void) | null = null;
    private baseName: string;

    constructor(canvas: HTMLCanvasElement, baseName = 'yappy-recording') {
        this.canvas = canvas;
        this.baseName = baseName;
    }

    public start(format: VideoFormat = 'webm', audioStream?: MediaStream): boolean {
        try {
            // 60 FPS capture (+ optional audio tracks muxed in — animation-mode sound row)
            const videoStream = this.canvas.captureStream(60);
            this.stream = audioStream?.getAudioTracks().length
                ? new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()])
                : videoStream;
            const hasAudio = this.stream.getAudioTracks().length > 0;

            let mimeType = hasAudio ? 'video/webm;codecs=vp9,opus' : 'video/webm;codecs=vp9';
            if (format === 'mp4') {
                // Codec must be pinned to H.264: bare 'video/mp4' lets Chrome pick
                // VP9, and a VP9-in-.mp4 file won't play in most consumers of mp4
                // (Windows Media Player, QuickTime/macOS preview, WhatsApp, video
                // editors) — it looks like a broken recording.
                const candidates = hasAudio ? [
                    'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 + AAC
                    'video/mp4;codecs=avc1.42E01E',
                    'video/mp4',
                    'video/webm;codecs=h264,opus',
                ] : [
                    'video/mp4;codecs=avc1.42E01E', // H.264 baseline — plays everywhere
                    'video/mp4;codecs=avc1',
                    'video/mp4',
                    'video/webm;codecs=h264',       // last resort: right codec, webm container
                ];
                mimeType = candidates.find(c => MediaRecorder.isTypeSupported(c)) ?? mimeType;
            }

            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn(`Mime type ${mimeType} not supported, falling back to default.`);
                mimeType = ''; // Let browser choose default
            }

            // Default bitrate (~1-2.5 Mbps) smears line art during motion; canvas
            // recordings are sharp-edged screen content and need more headroom.
            this.mediaRecorder = new MediaRecorder(this.stream, {
                ...(mimeType ? { mimeType } : {}),
                videoBitsPerSecond: 8_000_000,
            });
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    // console.log(`VideoRecorder: chunk ${e.data.size} bytes`);
                    this.chunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveFile();
                if (this.onStopCallback) this.onStopCallback();
                this.cleanup();
            };

            this.mediaRecorder.start();
            return true;
        } catch (err) {
            console.error("Failed to start recording:", err);
            return false;
        }
    }

    public stop(callback?: () => void) {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.onStopCallback = callback || null;
            this.mediaRecorder.stop();
        }
    }

    private saveFile() {
        if (this.chunks.length === 0) return;

        const blob = new Blob(this.chunks, {
            type: this.mediaRecorder?.mimeType || 'video/webm'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Determine extension
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `${this.baseName}-${timestamp}.${ext}`;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    private cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.mediaRecorder = null;
        this.chunks = [];
    }
}
