export interface ClockConfig {
    /** Playback speed multiplier (1 = normal) */
    speed?: number;
}
export type TickCallback = (delta: number, currentTime: number) => void;
/**
 * Manual clock for testing and non-RAF environments.
 * Time only advances when tick() is called explicitly.
 */
export declare class ManualClock {
    private _currentTime;
    private _isRunning;
    onTick: TickCallback | null;
    get currentTime(): number;
    get isRunning(): boolean;
    start(): void;
    stop(): void;
    tick(delta: number): void;
    reset(): void;
    seek(time: number): void;
}
/**
 * RAF-based clock for browser environments.
 * Automatically advances time based on requestAnimationFrame.
 */
export declare class Clock {
    private _currentTime;
    private _isRunning;
    private _lastFrameTime;
    private _rafId;
    private _speed;
    onTick: TickCallback | null;
    constructor(config?: ClockConfig);
    get currentTime(): number;
    get isRunning(): boolean;
    get speed(): number;
    set speed(value: number);
    start(): void;
    stop(): void;
    reset(): void;
    seek(time: number): void;
    private _scheduleFrame;
    private _onFrame;
}
