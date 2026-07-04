/**
 * Built-in design templates (Canva-style fixed-size documents).
 * Element positions are page-relative; loadDesignTemplate offsets them.
 */
import type { DesignTemplate, DesignPageTemplate } from '../../../types/template-types';
import type { DrawingElement, GradientStop } from '../../../types';

let _counter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${++_counter}`;

const BASE_PROPS = {
    roughness: 0,
    angle: 0,
    renderStyle: 'architectural' as const,
    locked: false,
    link: null,
    layerId: 'default-layer',
    strokeStyle: 'solid' as const,
    roundness: null,
};

const seed = () => Math.floor(Math.random() * 2 ** 31);

function t(
    text: string, x: number, y: number, w: number, h: number, fontSize: number,
    opts: {
        color?: string; align?: 'left' | 'center' | 'right'; font?: string;
        bold?: boolean; italic?: boolean; letterSpacing?: number; opacity?: number;
    } = {}
): Partial<DrawingElement> {
    return {
        id: genId('text'), type: 'text', x, y, width: w, height: h, text,
        fontSize, fontFamily: (opts.font ?? 'poppins') as any,
        textAlign: opts.align ?? 'center', verticalAlign: 'middle',
        textColor: opts.color ?? '#1e293b',
        fontWeight: opts.bold ? 'bold' : undefined,
        fontStyle: opts.italic ? 'italic' : undefined,
        letterSpacing: opts.letterSpacing,
        strokeColor: 'transparent', backgroundColor: 'transparent',
        fillStyle: 'solid', strokeWidth: 0, opacity: opts.opacity ?? 100,
        seed: seed(), ...BASE_PROPS,
    };
}

function r(
    x: number, y: number, w: number, h: number,
    opts: { bg?: string; stroke?: string; strokeWidth?: number; radius?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    const stroke = opts.stroke ?? 'transparent';
    return {
        id: genId('rect'), type: 'rectangle', x, y, width: w, height: h,
        strokeColor: stroke, backgroundColor: opts.bg ?? '#3b82f6',
        fillStyle: 'solid', strokeWidth: opts.strokeWidth ?? (stroke !== 'transparent' ? 2 : 0),
        opacity: opts.opacity ?? 100, borderRadius: opts.radius,
        seed: seed(), ...BASE_PROPS,
    };
}

function grad(
    x: number, y: number, w: number, h: number,
    stops: GradientStop[], direction = 135,
    opts: { radius?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    return {
        id: genId('grad'), type: 'rectangle', x, y, width: w, height: h,
        strokeColor: 'transparent', backgroundColor: stops[0]?.color ?? '#3b82f6',
        fillStyle: 'linear' as any, gradientStops: stops, gradientDirection: direction,
        strokeWidth: 0, opacity: opts.opacity ?? 100, borderRadius: opts.radius,
        seed: seed(), ...BASE_PROPS,
    };
}

function circle(
    x: number, y: number, d: number,
    opts: { bg?: string; stroke?: string; strokeWidth?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    const stroke = opts.stroke ?? 'transparent';
    return {
        id: genId('circle'), type: 'circle', x, y, width: d, height: d,
        strokeColor: stroke, backgroundColor: opts.bg ?? '#f59e0b',
        fillStyle: 'solid', strokeWidth: opts.strokeWidth ?? (stroke !== 'transparent' ? 2 : 0),
        opacity: opts.opacity ?? 100,
        seed: seed(), ...BASE_PROPS,
    };
}

const stops = (from: string, to: string): GradientStop[] => [
    { offset: 0, color: from },
    { offset: 1, color: to },
];

const dummyData = { elements: [], layers: [] as any[] };

function makeDesign(
    id: string, name: string, description: string, tags: string[], order: number,
    pageSize: { width: number; height: number }, pages: DesignPageTemplate[]
): DesignTemplate {
    return {
        metadata: { id, name, category: 'designs', description, tags, order, pageSize },
        pageSize, pages, data: dummyData,
    };
}

// ─── Social ─────────────────────────────────────────────────

export const instaAnnouncement = makeDesign(
    'design-insta-announcement', 'Big Announcement', 'Bold Instagram post for launches and news',
    ['instagram', 'social', 'announcement', 'launch'], 1,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#4f46e5', '#9333ea'), gradientDirection: 135,
        elements: [
            circle(-160, -160, 480, { bg: '#ffffff', opacity: 12 }),
            circle(820, 760, 480, { bg: '#ffffff', opacity: 12 }),
            t('SOMETHING BIG', 90, 300, 900, 90, 40, { color: '#ffffff', letterSpacing: 14, opacity: 85 }),
            t('IS COMING', 90, 390, 900, 220, 150, { color: '#ffffff', bold: true }),
            r(440, 660, 200, 8, { bg: '#facc15', radius: 4 }),
            t('Stay tuned — 12.08', 90, 720, 900, 70, 40, { color: '#ffffff', opacity: 90 }),
        ],
    }],
);

export const instaQuote = makeDesign(
    'design-insta-quote', 'Quote Card', 'Minimal quote card for Instagram',
    ['instagram', 'social', 'quote', 'minimal'], 2,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        backgroundColor: '#faf7f2',
        elements: [
            r(80, 80, 920, 920, { bg: 'transparent', stroke: '#1c1917', strokeWidth: 3 }),
            t('“', 140, 170, 200, 200, 220, { color: '#d97706', font: 'serif', align: 'left', bold: true }),
            t('Creativity is intelligence having fun.', 150, 380, 780, 320, 64, { color: '#1c1917', font: 'serif', italic: true }),
            r(490, 740, 100, 4, { bg: '#d97706' }),
            t('ALBERT EINSTEIN', 150, 780, 780, 50, 30, { color: '#78716c', letterSpacing: 8 }),
        ],
    }],
);

export const instaStoryEvent = makeDesign(
    'design-insta-story-event', 'Event Story', 'Instagram story for event promotion',
    ['instagram', 'story', 'social', 'event'], 3,
    { width: 1080, height: 1920 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#0f172a', '#1e3a8a'), gradientDirection: 180,
        elements: [
            circle(760, 120, 420, { bg: '#f59e0b', opacity: 20 }),
            circle(-140, 1400, 520, { bg: '#3b82f6', opacity: 18 }),
            t('YOU ARE INVITED', 90, 480, 900, 70, 42, { color: '#facc15', letterSpacing: 12 }),
            t('Design Week 2026', 90, 580, 900, 340, 120, { color: '#ffffff', bold: true }),
            r(440, 960, 200, 6, { bg: '#f59e0b', radius: 3 }),
            t('August 14–16 · Convention Center', 90, 1020, 900, 80, 44, { color: '#cbd5e1' }),
            r(340, 1260, 400, 110, { bg: '#f59e0b', radius: 55 }),
            t('Swipe up to RSVP', 340, 1260, 400, 110, 40, { color: '#0f172a', bold: true }),
        ],
    }],
);

export const fbCover = makeDesign(
    'design-fb-cover', 'Brand Cover', 'Facebook cover banner with brand statement',
    ['facebook', 'cover', 'banner', 'social'], 4,
    { width: 1640, height: 924 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#065f46', '#10b981'), gradientDirection: 115,
        elements: [
            circle(1300, -100, 500, { bg: '#ffffff', opacity: 10 }),
            circle(-150, 620, 450, { bg: '#ffffff', opacity: 10 }),
            t('GROW BEYOND LIMITS', 120, 330, 1400, 160, 96, { color: '#ffffff', bold: true }),
            t('Sustainable solutions for modern teams', 120, 520, 1400, 70, 42, { color: '#d1fae5' }),
        ],
    }],
);

export const xSaleBanner = makeDesign(
    'design-x-sale', 'Flash Sale Banner', 'X / Twitter post announcing a sale',
    ['twitter', 'x', 'sale', 'social', 'promo'], 5,
    { width: 1600, height: 900 },
    [{
        name: 'Page 1',
        backgroundColor: '#fef3c7',
        elements: [
            circle(1180, -220, 700, { bg: '#f59e0b' }),
            circle(-260, 520, 640, { bg: '#fbbf24', opacity: 60 }),
            t('FLASH SALE', 100, 220, 900, 200, 130, { color: '#78350f', bold: true, align: 'left' }),
            t('Up to 50% off — this weekend only', 100, 440, 850, 80, 46, { color: '#92400e', align: 'left' }),
            r(100, 590, 360, 100, { bg: '#78350f', radius: 50 }),
            t('SHOP NOW', 100, 590, 360, 100, 40, { color: '#fef3c7', bold: true, letterSpacing: 4 }),
        ],
    }],
);

// ─── Video ──────────────────────────────────────────────────

export const youtubeThumb = makeDesign(
    'design-youtube-thumb', 'YouTube Thumbnail', 'High-contrast video thumbnail',
    ['youtube', 'thumbnail', 'video'], 6,
    { width: 1280, height: 720 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#111827', '#374151'), gradientDirection: 120,
        elements: [
            r(-60, 520, 1400, 260, { bg: '#dc2626', radius: 0, opacity: 92 }),
            t('10 DESIGN TIPS', 60, 120, 900, 260, 120, { color: '#ffffff', bold: true, align: 'left' }),
            t('that actually work', 70, 380, 800, 100, 62, { color: '#fbbf24', align: 'left', italic: true }),
            t('NEW', 1020, 60, 200, 90, 48, { color: '#111827', bold: true }),
            r(1020, 60, 200, 90, { bg: '#fbbf24', radius: 12 }),
            t('NEW', 1020, 60, 200, 90, 48, { color: '#111827', bold: true }),
            t('#12 — DESIGN SERIES', 70, 590, 700, 120, 44, { color: '#ffffff', align: 'left', letterSpacing: 4 }),
        ],
    }],
);

// ─── Print ──────────────────────────────────────────────────

export const businessCard = makeDesign(
    'design-business-card', 'Business Card', 'Two-sided modern business card',
    ['business card', 'print', 'card'], 7,
    { width: 1050, height: 600 },
    [
        {
            name: 'Front',
            backgroundColor: '#0f172a',
            elements: [
                r(0, 0, 24, 600, { bg: '#38bdf8' }),
                t('AVA SHARMA', 90, 220, 700, 90, 64, { color: '#ffffff', bold: true, align: 'left', letterSpacing: 4 }),
                t('Product Designer', 90, 320, 700, 55, 34, { color: '#38bdf8', align: 'left', letterSpacing: 2 }),
            ],
        },
        {
            name: 'Back',
            backgroundColor: '#f8fafc',
            elements: [
                r(0, 576, 1050, 24, { bg: '#38bdf8' }),
                t('ava@studio.design', 90, 180, 860, 55, 34, { color: '#0f172a', align: 'left' }),
                t('+91 98200 12345', 90, 250, 860, 55, 34, { color: '#0f172a', align: 'left' }),
                t('studio.design/ava', 90, 320, 860, 55, 34, { color: '#0369a1', align: 'left' }),
            ],
        },
    ],
);

export const eventPoster = makeDesign(
    'design-poster-event', 'Event Poster', 'A4 poster for concerts and meetups',
    ['poster', 'print', 'event', 'a4'], 8,
    { width: 2480, height: 3508 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#312e81', '#831843'), gradientDirection: 160,
        elements: [
            circle(1700, 300, 900, { bg: '#f472b6', opacity: 25 }),
            circle(-300, 2500, 1100, { bg: '#818cf8', opacity: 22 }),
            t('SUMMER', 240, 700, 2000, 420, 300, { color: '#ffffff', bold: true }),
            t('SOUNDS', 240, 1120, 2000, 420, 300, { color: '#f9a8d4', bold: true }),
            r(1090, 1660, 300, 14, { bg: '#facc15', radius: 7 }),
            t('LIVE MUSIC FESTIVAL', 240, 1780, 2000, 120, 90, { color: '#ffffff', letterSpacing: 20 }),
            t('JULY 25 · RIVERSIDE PARK · 6 PM', 240, 2700, 2000, 110, 76, { color: '#e0e7ff' }),
            t('tickets at summersounds.live', 240, 2860, 2000, 90, 60, { color: '#a5b4fc', italic: true }),
        ],
    }],
);

export const resume = makeDesign(
    'design-resume', 'Clean Resume', 'A4 resume with sidebar accent',
    ['resume', 'cv', 'print', 'a4'], 9,
    { width: 2480, height: 3508 },
    [{
        name: 'Page 1',
        backgroundColor: '#ffffff',
        elements: [
            r(0, 0, 820, 3508, { bg: '#f1f5f9' }),
            r(0, 0, 820, 620, { bg: '#0f172a' }),
            t('RAHUL MEHTA', 80, 200, 660, 120, 76, { color: '#ffffff', bold: true, align: 'left' }),
            t('Full-Stack Engineer', 80, 340, 660, 70, 44, { color: '#94a3b8', align: 'left' }),
            t('CONTACT', 80, 740, 660, 70, 48, { color: '#0f172a', bold: true, align: 'left', letterSpacing: 6 }),
            t('rahul@dev.io\n+91 99300 55555\nbengaluru, india', 80, 830, 660, 260, 40, { color: '#475569', align: 'left' }),
            t('SKILLS', 80, 1220, 660, 70, 48, { color: '#0f172a', bold: true, align: 'left', letterSpacing: 6 }),
            t('TypeScript · React · Node\nPostgres · AWS · Docker\nDesign systems', 80, 1310, 660, 300, 40, { color: '#475569', align: 'left' }),
            t('EXPERIENCE', 940, 260, 1400, 80, 56, { color: '#0f172a', bold: true, align: 'left', letterSpacing: 8 }),
            r(940, 360, 1360, 6, { bg: '#0ea5e9' }),
            t('Senior Engineer — Nimbus Labs', 940, 430, 1400, 70, 48, { color: '#0f172a', bold: true, align: 'left' }),
            t('2022 – present', 940, 510, 1400, 55, 38, { color: '#0ea5e9', align: 'left' }),
            t('Led the platform team through a re-architecture that cut page load times by 60% and doubled deployment frequency.', 940, 580, 1360, 200, 40, { color: '#475569', align: 'left' }),
            t('Engineer — BrightApps', 940, 880, 1400, 70, 48, { color: '#0f172a', bold: true, align: 'left' }),
            t('2019 – 2022', 940, 960, 1400, 55, 38, { color: '#0ea5e9', align: 'left' }),
            t('Built customer-facing dashboards used by 40k monthly users; owned the design-system component library.', 940, 1030, 1360, 200, 40, { color: '#475569', align: 'left' }),
            t('EDUCATION', 940, 1400, 1400, 80, 56, { color: '#0f172a', bold: true, align: 'left', letterSpacing: 8 }),
            r(940, 1500, 1360, 6, { bg: '#0ea5e9' }),
            t('B.Tech, Computer Science — IIT Bombay', 940, 1570, 1400, 70, 44, { color: '#475569', align: 'left' }),
        ],
    }],
);

export const flyerSale = makeDesign(
    'design-flyer-sale', 'Sale Flyer', 'A5 retail flyer with bold pricing',
    ['flyer', 'print', 'sale', 'a5'], 10,
    { width: 1748, height: 2480 },
    [{
        name: 'Page 1',
        backgroundColor: '#fff7ed',
        elements: [
            grad(0, 0, 1748, 900, stops('#ea580c', '#f97316'), 120),
            t('MEGA', 120, 160, 1500, 300, 220, { color: '#ffffff', bold: true }),
            t('CLEARANCE', 120, 460, 1500, 220, 140, { color: '#ffedd5', bold: true, letterSpacing: 10 }),
            circle(1180, 1050, 460, { bg: '#dc2626' }),
            t('-70%', 1180, 1160, 460, 240, 130, { color: '#ffffff', bold: true }),
            t('Everything must go', 140, 1150, 900, 110, 72, { color: '#7c2d12', bold: true, align: 'left' }),
            t('Furniture · Decor · Lighting\nKitchen · Outdoor', 140, 1330, 900, 260, 56, { color: '#9a3412', align: 'left' }),
            r(120, 2100, 1508, 200, { bg: '#7c2d12', radius: 24 }),
            t('MAIN ST 42 · SAT–SUN 9AM–8PM', 120, 2100, 1508, 200, 60, { color: '#ffedd5', letterSpacing: 4 }),
        ],
    }],
);

export const certificate = makeDesign(
    'design-certificate', 'Certificate', 'Landscape award certificate',
    ['certificate', 'print', 'award', 'a4'], 11,
    { width: 3508, height: 2480 },
    [{
        name: 'Page 1',
        backgroundColor: '#fffbeb',
        elements: [
            r(120, 120, 3268, 2240, { bg: 'transparent', stroke: '#b45309', strokeWidth: 8 }),
            r(170, 170, 3168, 2140, { bg: 'transparent', stroke: '#d97706', strokeWidth: 3 }),
            t('CERTIFICATE', 554, 420, 2400, 200, 150, { color: '#92400e', bold: true, letterSpacing: 30, font: 'serif' }),
            t('OF ACHIEVEMENT', 554, 640, 2400, 90, 60, { color: '#b45309', letterSpacing: 20 }),
            t('proudly presented to', 554, 900, 2400, 80, 52, { color: '#78716c', italic: true, font: 'serif' }),
            t('Priya Nair', 554, 1020, 2400, 260, 180, { color: '#1c1917', font: 'serif', italic: true }),
            r(1254, 1330, 1000, 4, { bg: '#b45309' }),
            t('for outstanding performance and dedication\nin the 2026 Innovation Challenge', 554, 1420, 2400, 220, 56, { color: '#57534e', font: 'serif' }),
            t('_______________\nDirector', 754, 1900, 700, 200, 48, { color: '#57534e', font: 'serif' }),
            t('_______________\nDate', 2054, 1900, 700, 200, 48, { color: '#57534e', font: 'serif' }),
            circle(1654, 1830, 200, { bg: 'transparent', stroke: '#d97706', strokeWidth: 6 }),
            t('★', 1654, 1855, 200, 150, 100, { color: '#d97706' }),
        ],
    }],
);

export const invitation = makeDesign(
    'design-invitation', 'Invitation', 'Elegant portrait invitation card',
    ['invitation', 'card', 'wedding', 'party'], 12,
    { width: 1080, height: 1350 },
    [{
        name: 'Page 1',
        backgroundColor: '#f5f1ea',
        elements: [
            r(60, 60, 960, 1230, { bg: 'transparent', stroke: '#a16207', strokeWidth: 2 }),
            circle(440, 140, 200, { bg: 'transparent', stroke: '#a16207', strokeWidth: 2 }),
            t('&', 440, 165, 200, 150, 110, { color: '#a16207', font: 'serif', italic: true }),
            t('TOGETHER WITH THEIR FAMILIES', 140, 420, 800, 60, 30, { color: '#78716c', letterSpacing: 8 }),
            t('Meera & Arjun', 140, 520, 800, 220, 110, { color: '#1c1917', font: 'serif', italic: true }),
            t('REQUEST THE PLEASURE OF YOUR COMPANY', 140, 780, 800, 60, 28, { color: '#78716c', letterSpacing: 6 }),
            r(490, 880, 100, 3, { bg: '#a16207' }),
            t('Saturday, the 14th of November\nat five o’clock in the evening\nThe Grand Terrace, Goa', 140, 930, 800, 260, 42, { color: '#44403c', font: 'serif' }),
        ],
    }],
);

export const allDesignTemplates: DesignTemplate[] = [
    instaAnnouncement, instaQuote, instaStoryEvent, fbCover, xSaleBanner,
    youtubeThumb, businessCard, eventPoster, resume, flyerSale, certificate, invitation,
];
