/**
 * Which slide the show goes to next. Hidden slides are skipped by next/previous and by
 * presenting from the start; a deck set to loop goes from the last shown slide back to the
 * first. Links can still reach a hidden slide (utils/slide-links.ts), as PowerPoint's can.
 * Pure, so it unit-tests under bun.
 */

export interface ShowSlide { hidden?: boolean }

/** The first slide the show starts on: the first one that isn't hidden (0 if all are). */
export function firstShowIndex(slides: readonly ShowSlide[]): number {
    const i = slides.findIndex(s => !s.hidden);
    return i >= 0 ? i : 0;
}

/** The slide after `from`, skipping hidden ones; with `loop`, wraps to the first. null at the end. */
export function nextShowIndex(slides: readonly ShowSlide[], from: number, loop = false): number | null {
    for (let i = from + 1; i < slides.length; i++) if (!slides[i].hidden) return i;
    if (!loop) return null;
    for (let i = 0; i <= from && i < slides.length; i++) if (!slides[i].hidden && i !== from) return i;
    // Only `from` is visible (or nothing is): a loop of one slide starts it again.
    return slides[from] && !slides[from].hidden ? from : null;
}

/** The slide before `from`, skipping hidden ones. null at the start (the show doesn't wrap backwards). */
export function prevShowIndex(slides: readonly ShowSlide[], from: number): number | null {
    for (let i = Math.min(from, slides.length) - 1; i >= 0; i--) if (!slides[i].hidden) return i;
    return null;
}
