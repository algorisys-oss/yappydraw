import { type Component } from 'solid-js';

/**
 * YappyMascot — the brand mascot: a bicycle whose handlebar grips are paint
 * brushes, ringed by colourful paint sprinkles. Hand-authored vector, kept in
 * sync with the boot-splash art in `frontend/index.html` (swap both together).
 * Gradient IDs are namespaced (`ym-*`) so the component can coexist with the
 * splash markup that briefly lives in the DOM during startup.
 *
 * `spin` (default true) rotates the wheel spokes; `animated` (default true)
 * gives the whole mascot a gentle float. Both honour prefers-reduced-motion.
 */
export const YappyMascot: Component<{ size?: number; spin?: boolean; animated?: boolean; class?: string }> = (props) => {
    const size = () => props.size ?? 220;
    const spin = () => props.spin !== false;
    const animated = () => props.animated !== false;
    return (
        <svg
            class={props.class}
            width={size()}
            height={(size() * 210) / 300}
            viewBox="0 0 300 210"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="YappyDraw mascot — a paint-brush bicycle"
            style={{ overflow: 'visible', animation: animated() ? 'ymFloat 3.2s ease-in-out infinite' : 'none' }}
        >
            <style>{`
                @keyframes ymFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                @keyframes ymSpin { to { transform: rotate(360deg); } }
                .ym-spokes { transform-box: fill-box; transform-origin: center; }
                @media (prefers-reduced-motion: reduce) {
                    svg[aria-label="YappyDraw mascot — a paint-brush bicycle"],
                    .ym-spokes { animation: none !important; }
                }
            `}</style>
            <defs>
                <linearGradient id="ym-frame" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#4c8dff" />
                    <stop offset="1" stop-color="#22d3ee" />
                </linearGradient>
                <linearGradient id="ym-rim" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#a855f7" />
                    <stop offset="1" stop-color="#4c8dff" />
                </linearGradient>
                <linearGradient id="ym-swoosh" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#f472b6" />
                    <stop offset="0.35" stop-color="#a855f7" />
                    <stop offset="0.65" stop-color="#4c8dff" />
                    <stop offset="1" stop-color="#34d399" />
                </linearGradient>
                <linearGradient id="ym-wood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#f6c667" />
                    <stop offset="1" stop-color="#d99a3f" />
                </linearGradient>
            </defs>

            <path d="M18,188 C78,150 120,204 176,158 C220,122 246,150 292,104" fill="none"
                stroke="url(#ym-swoosh)" stroke-width="14" stroke-linecap="round" opacity="0.45" />

            <g>
                <circle cx="78" cy="150" r="34" fill="none" stroke="url(#ym-rim)" stroke-width="6" />
                <g class="ym-spokes" stroke="#94a3b8" stroke-width="2.5" style={{ animation: spin() ? 'ymSpin 2.6s linear infinite' : 'none' }}>
                    <line x1="50" y1="150" x2="106" y2="150" />
                    <line x1="78" y1="122" x2="78" y2="178" />
                    <line x1="58.2" y1="130.2" x2="97.8" y2="169.8" />
                    <line x1="97.8" y1="130.2" x2="58.2" y2="169.8" />
                </g>
                <circle cx="78" cy="150" r="6" fill="#334155" />
            </g>
            <g>
                <circle cx="222" cy="150" r="34" fill="none" stroke="url(#ym-rim)" stroke-width="6" />
                <g class="ym-spokes" stroke="#94a3b8" stroke-width="2.5" style={{ animation: spin() ? 'ymSpin 2.6s linear infinite' : 'none' }}>
                    <line x1="194" y1="150" x2="250" y2="150" />
                    <line x1="222" y1="122" x2="222" y2="178" />
                    <line x1="202.2" y1="130.2" x2="241.8" y2="169.8" />
                    <line x1="241.8" y1="130.2" x2="202.2" y2="169.8" />
                </g>
                <circle cx="222" cy="150" r="6" fill="#334155" />
            </g>

            <g fill="none" stroke="url(#ym-frame)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M78,150 L150,150" />
                <path d="M150,150 L120,92" />
                <path d="M120,92 L78,150" />
                <path d="M120,92 L196,96" />
                <path d="M150,150 L196,96" />
                <path d="M196,96 L222,150" />
            </g>

            <path d="M104,90 Q120,82 136,90 Q124,96 104,90 Z" fill="#334155" />
            <circle cx="150" cy="150" r="5" fill="#334155" />
            <rect x="146" y="163" width="18" height="5" rx="2.5" fill="#334155" transform="rotate(20 155 165)" />

            <g fill="none" stroke="url(#ym-frame)" stroke-width="7" stroke-linecap="round">
                <path d="M196,96 L198,76" />
                <path d="M174,76 L222,76" />
            </g>

            <g>
                <line x1="174" y1="76" x2="174" y2="60" stroke="url(#ym-wood)" stroke-width="6" stroke-linecap="round" />
                <rect x="168.5" y="52" width="11" height="8" rx="2" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
                <path d="M169,52 L179,52 L177,36 Q174,32 171,36 Z" fill="#f472b6" />
                <circle cx="174" cy="35" r="3.4" fill="#ec4899" />
            </g>
            <g>
                <line x1="222" y1="76" x2="222" y2="60" stroke="url(#ym-wood)" stroke-width="6" stroke-linecap="round" />
                <rect x="216.5" y="52" width="11" height="8" rx="2" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
                <path d="M217,52 L227,52 L225,36 Q222,32 219,36 Z" fill="#22d3ee" />
                <circle cx="222" cy="35" r="3.4" fill="#06b6d4" />
            </g>

            <g>
                <circle cx="150" cy="30" r="4" fill="#a855f7" />
                <circle cx="130" cy="46" r="2.6" fill="#f59e0b" />
                <circle cx="245" cy="52" r="3.2" fill="#34d399" />
                <circle cx="258" cy="72" r="2.4" fill="#f472b6" />
                <circle cx="196" cy="40" r="2.6" fill="#4c8dff" />
                <circle cx="160" cy="48" r="2.2" fill="#22d3ee" />
                <circle cx="42" cy="96" r="3.4" fill="#f472b6" />
                <circle cx="30" cy="120" r="2.4" fill="#a855f7" />
                <circle cx="60" cy="70" r="2.8" fill="#34d399" />
                <ellipse cx="252" cy="40" rx="4.4" ry="2" fill="#ef4444" transform="rotate(-25 252 40)" />
                <ellipse cx="112" cy="34" rx="4" ry="1.8" fill="#4c8dff" transform="rotate(20 112 34)" />
                <ellipse cx="48" cy="84" rx="4" ry="1.8" fill="#f59e0b" transform="rotate(-40 48 84)" />
            </g>
        </svg>
    );
};

export default YappyMascot;
