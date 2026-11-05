/**
 * Video URL utilities — provider detection, embed URL generation, poster/thumbnail fetching.
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'direct' | 'unknown';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /(?:vimeo\.com\/)(\d+)/;
const DIRECT_VIDEO_REGEX = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

/** Detect video provider from URL */
export function detectVideoProvider(url: string): VideoProvider {
    if (YOUTUBE_REGEX.test(url)) return 'youtube';
    if (VIMEO_REGEX.test(url)) return 'vimeo';
    if (DIRECT_VIDEO_REGEX.test(url)) return 'direct';
    return 'unknown';
}

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
}

/** Extract Vimeo video ID */
export function extractVimeoId(url: string): string | null {
    const match = url.match(VIMEO_REGEX);
    return match ? match[1] : null;
}

/** Generate embed URL for iframe playback */
export function getEmbedURL(url: string, provider: VideoProvider): string | null {
    if (provider === 'youtube') {
        const id = extractYouTubeId(url);
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    if (provider === 'vimeo') {
        const id = extractVimeoId(url);
        return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
    // Direct videos don't use iframes
    return null;
}

/** Get poster/thumbnail URL (synchronous — returns a URL that may need loading) */
export function getPosterURL(url: string, provider: VideoProvider): string | null {
    if (provider === 'youtube') {
        const id = extractYouTubeId(url);
        return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    // Vimeo and direct require async fetching — handled separately
    return null;
}

/** Fetch Vimeo thumbnail via oEmbed (async, no API key needed) */
export async function fetchVimeoPoster(url: string): Promise<string | null> {
    const id = extractVimeoId(url);
    if (!id) return null;
    try {
        const resp = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
        if (!resp.ok) return null;
        const data = await resp.json();
        return data.thumbnail_url || null;
    } catch {
        return null;
    }
}

/** Capture a frame from a direct video URL as a data URL */
export function captureVideoFrame(videoURL: string): Promise<string | null> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.preload = 'metadata';

        const cleanup = () => {
            video.removeAttribute('src');
            video.load();
        };

        video.onloadeddata = () => {
            // Seek to 1 second (or 0 if shorter)
            video.currentTime = Math.min(1, video.duration || 0);
        };

        video.onseeked = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 480;
                canvas.height = video.videoHeight || 270;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    cleanup();
                    resolve(dataURL);
                } else {
                    cleanup();
                    resolve(null);
                }
            } catch {
                // CORS or other error
                cleanup();
                resolve(null);
            }
        };

        video.onerror = () => {
            cleanup();
            resolve(null);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
            cleanup();
            resolve(null);
        }, 10000);

        video.src = videoURL;
    });
}

/** Validate that a URL looks like a video source */
export function isValidVideoURL(url: string): boolean {
    if (!url || url.trim().length === 0) return false;
    try {
        new URL(url);
    } catch {
        return false;
    }
    const provider = detectVideoProvider(url);
    return provider !== 'unknown';
}

/** Fetch the poster for any provider (async) */
export async function fetchPoster(url: string, provider: VideoProvider): Promise<string | null> {
    if (provider === 'youtube') {
        return getPosterURL(url, provider);
    }
    if (provider === 'vimeo') {
        return fetchVimeoPoster(url);
    }
    if (provider === 'direct') {
        return captureVideoFrame(url);
    }
    return null;
}

/**
 * Clip files a browser can play, by extension → MIME type for a data URL. MOV is labelled MP4:
 * PowerPoint's MOV clips are H.264, which browsers play once they are called that. WMV, AVI,
 * WMA, MPEG-1/2 and MIDI are missing on purpose — no browser plays them.
 */
const VIDEO_MIME: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', ogg: 'video/ogg' };
const AUDIO_MIME: Record<string, string> = {
    mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', oga: 'audio/ogg', ogg: 'audio/ogg',
    opus: 'audio/ogg', flac: 'audio/flac', weba: 'audio/webm', webm: 'audio/webm',
};

/** The MIME type to play a clip file with, or null when browsers can't play that format. */
export function clipMime(ext: string, audio: boolean): string | null {
    const e = ext.toLowerCase();
    return (audio ? AUDIO_MIME[e] : VIDEO_MIME[e]) ?? null;
}

/** File extension for a clip's MIME type (the reverse of {@link clipMime}), for writing it out. */
export function clipExt(mime: string): string | null {
    const m = mime.toLowerCase().split(';')[0];
    const map: Record<string, string> = {
        'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv', 'video/quicktime': 'mov',
        'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
        'audio/ogg': 'ogg', 'audio/flac': 'flac', 'audio/webm': 'weba',
    };
    return map[m] ?? null;
}

/** True when a video element's source is sound only (an embedded audio file or a link to one). */
export function isAudioSource(url: string | undefined): boolean {
    if (!url) return false;
    if (/^data:audio\//i.test(url)) return true;
    return !/^data:/i.test(url) && /\.(mp3|m4a|aac|wav|oga|opus|flac|weba)(\?.*)?$/i.test(url);
}
