export class PerformanceMonitor {
    private frameCount = 0;
    private lastReportTime = 0;
    private slowFrames = 0;
    private totalDrawTime = 0;
    private enabled: boolean;

    constructor(enabled = true) {
        this.enabled = enabled;
        this.lastReportTime = performance.now();
    }

    measureFrame(drawTime: number, elementCount: number, visibleCount?: number) {
        if (!this.enabled) return;

        this.frameCount++;
        this.totalDrawTime += drawTime;

        if (drawTime > 16.67) { // Slower than 60 FPS
            this.slowFrames++;
        }

        // Report every 60 frames (~1 second at 60fps)
        const now = performance.now();
        if (now - this.lastReportTime >= 1000) {
            const duration = now - this.lastReportTime;
            const avgFPS = (this.frameCount / duration) * 1000;
            const avgDrawTime = this.totalDrawTime / this.frameCount;

            const visibleInfo = visibleCount !== undefined ? ` | ${visibleCount} visible` : '';
            console.log(
                `[Perf] ${avgFPS.toFixed(1)} FPS | ${avgDrawTime.toFixed(2)}ms avg | ` +
                `${elementCount} elements${visibleInfo} | ${this.slowFrames} slow frames`
            );

            this.frameCount = 0;
            this.slowFrames = 0;
            this.totalDrawTime = 0;
            this.lastReportTime = now;
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor(false); // Enable by default to track performance
