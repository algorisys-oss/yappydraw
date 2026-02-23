/**
 * Image Pixel Effects - Animated pixel-by-pixel reveal effects
 * Creates ImageData-based transformations for animated image reveals
 */

export type PixelEffectType =
    | 'sequential-ltr'    // Left to Right
    | 'sequential-rtl'    // Right to Left
    | 'sequential-ttb'    // Top to Bottom
    | 'sequential-btt'    // Bottom to Top
    | 'random-pixels'     // Random scattered pixels
    | 'wave-center'       // Wave expanding from center
    | 'wave-corner'       // Wave from top-left corner
    | 'scan-lines'        // CRT-style horizontal scanning
    | 'block-reveal'      // Grid-based tile reveal
    | 'spiral'            // Spiral from center
    | 'glitch'            // Digital glitch assembly
    | 'curtain-vertical'  // Vertical curtain open from center
    | 'curtain-horizontal'// Horizontal curtain open from center
    | 'dissolve'          // Random dissolve in/out
    | 'pixel-rain';       // Matrix-style digital rain columns

export interface PixelEffectConfig {
    type: PixelEffectType;
    /** Duration in milliseconds */
    duration?: number;
    /** Easing function name */
    easing?: string;
    /** Reverse the effect (reveal → hide) */
    reverse?: boolean;
    /** Effect-specific parameters */
    params?: {
        /** For scan-lines: line height in pixels */
        lineHeight?: number;
        /** For block-reveal: block size in pixels */
        blockSize?: number;
        /** For glitch: intensity 0-1 */
        glitchIntensity?: number;
        /** For wave: wave count */
        waveCount?: number;
        /** For pixel-rain: number of rain columns */
        columnCount?: number;
        /** For pixel-rain: width of each column */
        columnWidth?: number;
        /** For pixel-rain: trail length (pixels revealed behind rain head) */
        trailLength?: number;
        /** For brightness-flow: number of particles */
        particleCount?: number;
        /** For brightness-flow: brightness grid detail (1-10, lower = more detail) */
        particleDetail?: number;
        /** For brightness-flow: particle state array (internal) */
        particles?: any[];
        /** For brightness-flow: cached brightness grid (internal) */
        brightnessGrid?: number[][];
    };
}

/**
 * Generate pixel visibility mask based on progress (0-1)
 * Returns ImageData where alpha channel determines pixel visibility
 */
export function generatePixelMask(
    width: number,
    height: number,
    progress: number,
    effectType: PixelEffectType,
    params: PixelEffectConfig['params'] = {}
): ImageData {
    const maskData = new ImageData(width, height);
    const data = maskData.data;

    // Helper to set pixel visibility (0 = hidden, 255 = visible)
    const setPixel = (x: number, y: number, alpha: number) => {
        const idx = (y * width + x) * 4;
        data[idx + 3] = alpha; // Only set alpha channel
    };

    switch (effectType) {
        case 'sequential-ltr':
            applySequentialLTR(width, height, progress, setPixel);
            break;
        case 'sequential-rtl':
            applySequentialRTL(width, height, progress, setPixel);
            break;
        case 'sequential-ttb':
            applySequentialTTB(width, height, progress, setPixel);
            break;
        case 'sequential-btt':
            applySequentialBTT(width, height, progress, setPixel);
            break;
        case 'random-pixels':
            applyRandomPixels(width, height, progress, setPixel);
            break;
        case 'wave-center':
            applyWaveCenter(width, height, progress, setPixel, params.waveCount);
            break;
        case 'wave-corner':
            applyWaveCorner(width, height, progress, setPixel);
            break;
        case 'scan-lines':
            applyScanLines(width, height, progress, setPixel, params.lineHeight || 2);
            break;
        case 'block-reveal':
            applyBlockReveal(width, height, progress, setPixel, params.blockSize || 16);
            break;
        case 'spiral':
            applySpiral(width, height, progress, setPixel);
            break;
        case 'glitch':
            applyGlitch(width, height, progress, setPixel, params.glitchIntensity || 0.5);
            break;
        case 'curtain-vertical':
            applyCurtainVertical(width, height, progress, setPixel);
            break;
        case 'curtain-horizontal':
            applyCurtainHorizontal(width, height, progress, setPixel);
            break;
        case 'dissolve':
            applyDissolve(width, height, progress, setPixel);
            break;
        case 'pixel-rain':
            applyPixelRain(width, height, progress, setPixel, params.columnCount, params.columnWidth, params.trailLength);
            break;
        default:
            // Fallback: instant full reveal
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    setPixel(x, y, progress >= 1 ? 255 : 0);
                }
            }
    }

    return maskData;
}

// ============================================
// Effect Implementations
// ============================================

function applySequentialLTR(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const threshold = progress * width;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixel(x, y, x < threshold ? 255 : 0);
        }
    }
}

function applySequentialRTL(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const threshold = progress * width;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixel(x, y, (width - x) < threshold ? 255 : 0);
        }
    }
}

function applySequentialTTB(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const threshold = progress * height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixel(x, y, y < threshold ? 255 : 0);
        }
    }
}

function applySequentialBTT(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const threshold = progress * height;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            setPixel(x, y, (height - y) < threshold ? 255 : 0);
        }
    }
}

// Use seeded random for consistent animation
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function applyRandomPixels(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const seed = x * 12345 + y * 67890;
            const randomValue = seededRandom(seed);
            setPixel(x, y, randomValue < progress ? 255 : 0);
        }
    }
}

function applyWaveCenter(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void,
    waveCount: number = 1
) {
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    const waveRadius = progress * maxDist * (1 + waveCount * 0.5);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Create wave pattern
            const normalizedDist = dist / maxDist;
            const wave = Math.sin(normalizedDist * Math.PI * waveCount * 2);
            const threshold = waveRadius + wave * 20;

            setPixel(x, y, dist < threshold ? 255 : 0);
        }
    }
}

function applyWaveCorner(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const maxDist = Math.sqrt(width * width + height * height);
    const threshold = progress * maxDist;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dist = Math.sqrt(x * x + y * y);
            setPixel(x, y, dist < threshold ? 255 : 0);
        }
    }
}

function applyScanLines(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void,
    lineHeight: number
) {
    const currentLine = Math.floor(progress * (height / lineHeight));

    for (let y = 0; y < height; y++) {
        const lineIndex = Math.floor(y / lineHeight);
        const visible = lineIndex <= currentLine;

        // Add scan effect - current line is partially visible with glow
        const alpha = visible
            ? (lineIndex === currentLine ? Math.floor(progress * 255) : 255)
            : 0;

        for (let x = 0; x < width; x++) {
            setPixel(x, y, alpha);
        }
    }
}

function applyBlockReveal(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void,
    blockSize: number
) {
    const blocksX = Math.ceil(width / blockSize);
    const blocksY = Math.ceil(height / blockSize);
    const totalBlocks = blocksX * blocksY;
    const revealedBlocks = Math.floor(progress * totalBlocks);

    let blockIndex = 0;
    for (let by = 0; by < blocksY; by++) {
        for (let bx = 0; bx < blocksX; bx++) {
            const visible = blockIndex < revealedBlocks;

            // Fill entire block
            for (let dy = 0; dy < blockSize; dy++) {
                for (let dx = 0; dx < blockSize; dx++) {
                    const x = bx * blockSize + dx;
                    const y = by * blockSize + dy;
                    if (x < width && y < height) {
                        setPixel(x, y, visible ? 255 : 0);
                    }
                }
            }
            blockIndex++;
        }
    }
}

function applySpiral(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) + Math.PI; // 0 to 2π

            // Spiral calculation: combine distance and angle
            const spiralValue = (dist / maxDist + angle / (2 * Math.PI)) / 2;
            setPixel(x, y, spiralValue < progress ? 255 : 0);
        }
    }
}

function applyGlitch(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void,
    intensity: number
) {
    // Glitch effect: horizontal slices appear at random times
    const sliceHeight = Math.max(2, Math.floor(height / 20));

    for (let y = 0; y < height; y++) {
        const sliceIndex = Math.floor(y / sliceHeight);
        const seed = sliceIndex * 9999;
        const sliceRandom = seededRandom(seed);

        // Each slice appears at different time based on random value
        const sliceProgress = (sliceRandom * intensity + (1 - intensity)) * progress;
        const visible = sliceProgress > 0.5;

        // Add horizontal offset glitch
        const offset = visible ? Math.floor((seededRandom(seed + 1) - 0.5) * 20 * intensity) : 0;

        for (let x = 0; x < width; x++) {
            const sourceX = x - offset;
            if (sourceX >= 0 && sourceX < width) {
                setPixel(x, y, visible ? 255 : 0);
            }
        }
    }
}

function applyCurtainVertical(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const revealWidth = progress * width / 2;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const distFromCenter = Math.abs(x - width / 2);
            setPixel(x, y, distFromCenter < revealWidth ? 255 : 0);
        }
    }
}

function applyCurtainHorizontal(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    const revealHeight = progress * height / 2;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const distFromCenter = Math.abs(y - height / 2);
            setPixel(x, y, distFromCenter < revealHeight ? 255 : 0);
        }
    }
}

function applyDissolve(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void
) {
    // Threshold-based dissolve with noise
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const seed = x * 7919 + y * 6547;
            const noise = seededRandom(seed);

            // Smooth transition around the threshold
            const threshold = progress;
            const delta = 0.1; // Transition width

            let alpha: number;
            if (noise < threshold - delta) {
                alpha = 255;
            } else if (noise > threshold + delta) {
                alpha = 0;
            } else {
                // Smooth gradient in transition zone
                const t = (threshold + delta - noise) / (2 * delta);
                alpha = Math.floor(t * 255);
            }

            setPixel(x, y, alpha);
        }
    }
}

function applyPixelRain(
    width: number,
    height: number,
    progress: number,
    setPixel: (x: number, y: number, alpha: number) => void,
    columnCount?: number,
    columnWidth?: number,
    trailLength?: number
) {
    // Matrix-style digital rain effect
    const numColumns = columnCount || Math.max(8, Math.floor(width / 20));
    const colWidth = columnWidth || Math.max(1, Math.floor(width / numColumns));
    const trail = trailLength || Math.floor(height * 0.3);

    // Generate deterministic column positions and speeds
    const columns: Array<{ x: number; speed: number; offset: number }> = [];
    for (let i = 0; i < numColumns; i++) {
        const seed = i * 12345;
        const x = Math.floor((seededRandom(seed) * (width - colWidth)));
        const speed = 0.5 + seededRandom(seed + 1) * 1.5; // Vary speed
        const offset = seededRandom(seed + 2); // Start offset for stagger
        columns.push({ x, speed, offset });
    }

    // Current progress determines how far rain has fallen
    const maxFall = height + trail;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let alpha = 0;

            // Check each rain column
            for (const col of columns) {
                // Check if x is within this column
                if (x >= col.x && x < col.x + colWidth) {
                    // Calculate rain head position for this column
                    const adjustedProgress = Math.max(0, (progress - col.offset * 0.3) / (1 - col.offset * 0.3));
                    const rainHead = adjustedProgress * maxFall * col.speed;

                    // Distance from current pixel to rain head
                    const distanceFromHead = rainHead - y;

                    if (distanceFromHead >= 0) {
                        // Pixel has been passed by the rain
                        if (distanceFromHead <= trail) {
                            // Within trail - fade in effect
                            const trailProgress = distanceFromHead / trail;
                            alpha = Math.floor((1 - trailProgress) * 255);
                        } else {
                            // Beyond trail - fully visible
                            alpha = 255;
                        }
                        break; // Column found, no need to check others
                    }
                }
            }

            setPixel(x, y, alpha);
        }
    }
}

/**
 * Apply pixel mask to image data
 * Combines original image with mask to create partially revealed image
 */
export function applyPixelMaskToImage(
    imageData: ImageData,
    maskData: ImageData
): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    const imgData = imageData.data;
    const mskData = maskData.data;
    const resData = result.data;

    for (let i = 0; i < imgData.length; i += 4) {
        resData[i] = imgData[i];         // R
        resData[i + 1] = imgData[i + 1]; // G
        resData[i + 2] = imgData[i + 2]; // B
        resData[i + 3] = Math.min(imgData[i + 3], mskData[i + 3]); // Alpha from mask
    }

    return result;
}
