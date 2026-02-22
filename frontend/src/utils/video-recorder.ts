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

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    public start(format: VideoFormat = 'webm'): boolean {
        try {
            // 60 FPS capture
            this.stream = this.canvas.captureStream(60);

            let mimeType = 'video/webm;codecs=vp9';
            if (format === 'mp4') {
                // Not all browsers support MP4 recording directly, fallback logic
                if (MediaRecorder.isTypeSupported('video/mp4')) {
                    mimeType = 'video/mp4';
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                    mimeType = 'video/webm;codecs=h264'; // Close enough for most
                }
            }

            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn(`Mime type ${mimeType} not supported, falling back to default.`);
                mimeType = ''; // Let browser choose default
            }

            this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
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
        a.download = `yappy-recording-${timestamp}.${ext}`;

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
