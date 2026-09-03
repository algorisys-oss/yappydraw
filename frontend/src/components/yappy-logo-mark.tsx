/**
 * The YappyDraw logo mark — the icon that sits before the wordmark in the top bar.
 *
 * Inline SVG rather than an asset file, for three reasons: it inherits the theme through
 * `currentColor` and the same `--logo-accent` the wordmark uses, so it can never disagree
 * with the text beside it; it costs no extra request and cannot 404; and it stays crisp at
 * any zoom on any display.
 *
 * The shape: a rounded square for the canvas, an open stroke drawn across it — deliberately
 * a curve with a *slightly* uneven sweep, because a hand-drawn line is what this app makes —
 * and a filled dot at the tip for the pen. It has to read at 20px, so there are three marks
 * in it and no more: at that size a fourth becomes mud.
 *
 * `aria-hidden` because the wordmark next to it already carries the name; a screen reader
 * announcing "YappyDraw YappyDraw" is worse than one that says it once.
 */
import type { Component } from 'solid-js';

interface Props {
    /** Rendered size in px. Defaults to the 20px the top bar uses. */
    size?: number;
    class?: string;
}

const YappyLogoMark: Component<Props> = (props) => {
    const size = () => props.size ?? 20;
    return (
        <svg
            class={props.class}
            width={size()}
            height={size()}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            {/* The canvas. currentColor, so it tracks the "Yappy" half of the wordmark. */}
            <rect
                x="2.5"
                y="2.5"
                width="19"
                height="19"
                rx="5.5"
                stroke="currentColor"
                stroke-width="1.8"
                opacity="0.9"
            />
            {/* The drawn stroke — accent, matching the "Draw" half. */}
            <path
                d="M6.6 15.4c1.9-4.6 3.6-6.9 5.2-6.9 1.5 0 1.4 2.2 2.5 2.2 1 0 1.7-1.2 3.1-3.4"
                stroke="var(--logo-accent, #4338ca)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            {/* The pen tip, closing the stroke. */}
            <circle cx="17.4" cy="7.3" r="1.85" fill="var(--logo-accent, #4338ca)" />
        </svg>
    );
};

export default YappyLogoMark;
