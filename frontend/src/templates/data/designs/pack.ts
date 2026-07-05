/**
 * Design template pack — round 2 of built-in templates. Same page-relative
 * element convention as index.ts; helpers are shared from there.
 */
import type { DesignTemplate } from '../../../types/template-types';
import { t, r, circle, stops, makeDesign } from './helpers';

// ─── Instagram posts (1080×1080) ────────────────────────────

export const instaProduct = makeDesign(
    'design-insta-product', 'Product Spotlight', 'Clean product feature post with price tag',
    ['instagram', 'social', 'product', 'shop'], 13,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        backgroundColor: '#f8fafc',
        elements: [
            r(0, 0, 1080, 620, { bg: '#e2e8f0' }),
            t('Drop a product photo here', 240, 270, 600, 80, 34, { color: '#94a3b8', italic: true }),
            r(80, 680, 640, 12, { bg: '#0f172a', radius: 6 }),
            t('The Everyday Tote', 80, 730, 700, 100, 64, { color: '#0f172a', bold: true, align: 'left' }),
            t('Handmade · Vegan leather · 3 colors', 80, 850, 700, 60, 34, { color: '#64748b', align: 'left' }),
            circle(800, 700, 220, { bg: '#0f172a' }),
            t('₹2,499', 800, 780, 220, 80, 52, { color: '#ffffff', bold: true }),
        ],
    }],
);

export const instaTips = makeDesign(
    'design-insta-tips', 'Tips Carousel Cover', 'Numbered tips post that begs a swipe',
    ['instagram', 'social', 'tips', 'carousel', 'education'], 14,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#0e7490', '#155e75'), gradientDirection: 160,
        elements: [
            circle(880, -120, 380, { bg: '#22d3ee', opacity: 25 }),
            t('5 HABITS', 90, 240, 900, 190, 130, { color: '#ffffff', bold: true, align: 'left' }),
            t('of highly productive designers', 90, 450, 800, 160, 60, { color: '#a5f3fc', align: 'left' }),
            r(90, 700, 240, 90, { bg: '#22d3ee', radius: 45 }),
            t('Swipe →', 90, 700, 240, 90, 38, { color: '#0e7490', bold: true }),
            t('@yourhandle', 90, 950, 400, 50, 32, { color: '#67e8f9', align: 'left' }),
        ],
    }],
);

export const instaTestimonial = makeDesign(
    'design-insta-testimonial', 'Testimonial', 'Customer review post with star rating',
    ['instagram', 'social', 'testimonial', 'review'], 15,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        backgroundColor: '#1c1917',
        elements: [
            r(90, 200, 900, 680, { bg: '#292524', radius: 28 }),
            t('★★★★★', 190, 280, 700, 90, 64, { color: '#fbbf24' }),
            t('“The best purchase I made this year. The quality is unreal and support replied within minutes.”', 190, 400, 700, 280, 46, { color: '#fafaf9', italic: true }),
            circle(190, 720, 90, { bg: '#fbbf24' }),
            t('S', 190, 740, 90, 60, 48, { color: '#1c1917', bold: true }),
            t('Sanya K. — verified buyer', 310, 740, 560, 60, 34, { color: '#a8a29e', align: 'left' }),
        ],
    }],
);

export const instaHiring = makeDesign(
    'design-insta-hiring', "We're Hiring", 'Job opening announcement post',
    ['instagram', 'social', 'hiring', 'job'], 16,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        backgroundColor: '#fefce8',
        elements: [
            r(0, 0, 1080, 240, { bg: '#facc15' }),
            t("WE'RE HIRING", 90, 60, 900, 130, 84, { color: '#713f12', bold: true, letterSpacing: 6 }),
            t('Senior Frontend Engineer', 90, 360, 900, 110, 68, { color: '#1c1917', bold: true }),
            t('Remote-first · Full time · ₹30–45 LPA', 90, 500, 900, 70, 40, { color: '#57534e' }),
            r(140, 620, 800, 4, { bg: '#eab308' }),
            t('React or Solid · Design-system experience · You ship', 140, 660, 800, 120, 38, { color: '#57534e' }),
            r(340, 850, 400, 110, { bg: '#1c1917', radius: 55 }),
            t('Apply now', 340, 850, 400, 110, 42, { color: '#fefce8', bold: true }),
        ],
    }],
);

export const instaPodcast = makeDesign(
    'design-insta-podcast', 'Podcast Episode', 'New episode announcement with guest slot',
    ['instagram', 'social', 'podcast', 'episode'], 17,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#581c87', '#9d174d'), gradientDirection: 135,
        elements: [
            circle(400, 130, 280, { bg: '#f0abfc', opacity: 30 }),
            t('THE MAKER SHOW', 90, 120, 900, 60, 36, { color: '#f0abfc', letterSpacing: 12 }),
            t('EP. 42', 90, 220, 900, 220, 170, { color: '#ffffff', bold: true }),
            t('Designing for a living\nwith Nadia Rao', 90, 480, 900, 220, 64, { color: '#fbcfe8' }),
            r(440, 800, 200, 200, { bg: '#ffffff', radius: 100 }),
            t('▶', 440, 840, 200, 130, 90, { color: '#9d174d' }),
            t('Listen on Spotify · Apple · YouTube', 90, 990, 900, 50, 30, { color: '#e9d5ff' }),
        ],
    }],
);

export const instaMinimalSale = makeDesign(
    'design-insta-minimal-sale', 'Minimal Sale', 'Typography-only sale post',
    ['instagram', 'social', 'sale', 'minimal'], 18,
    { width: 1080, height: 1080 },
    [{
        name: 'Page 1',
        backgroundColor: '#ffffff',
        elements: [
            r(60, 60, 960, 960, { bg: 'transparent', stroke: '#111827', strokeWidth: 2 }),
            t('END OF SEASON', 140, 260, 800, 60, 34, { color: '#6b7280', letterSpacing: 16 }),
            t('SALE', 140, 340, 800, 340, 260, { color: '#111827', bold: true }),
            r(490, 720, 100, 6, { bg: '#111827' }),
            t('UP TO 60% OFF · IN STORE & ONLINE', 140, 770, 800, 60, 32, { color: '#374151', letterSpacing: 4 }),
        ],
    }],
);

// ─── Instagram stories (1080×1920) ──────────────────────────

export const storyCountdown = makeDesign(
    'design-story-countdown', 'Launch Countdown', 'Story with big countdown number',
    ['instagram', 'story', 'countdown', 'launch'], 19,
    { width: 1080, height: 1920 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#111827', '#7c2d12'), gradientDirection: 200,
        elements: [
            circle(-180, -180, 640, { bg: '#f97316', opacity: 25 }),
            t('LAUNCHING IN', 90, 560, 900, 70, 44, { color: '#fdba74', letterSpacing: 14 }),
            t('3', 240, 660, 600, 620, 480, { color: '#ffffff', bold: true }),
            t('DAYS', 90, 1300, 900, 100, 72, { color: '#fdba74', letterSpacing: 24 }),
            t('Turn on notifications so you don’t miss it', 140, 1560, 800, 100, 38, { color: '#e7e5e4' }),
        ],
    }],
);

export const storyQuote = makeDesign(
    'design-story-quote', 'Story Quote', 'Serif quote story on paper texture tones',
    ['instagram', 'story', 'quote', 'minimal'], 20,
    { width: 1080, height: 1920 },
    [{
        name: 'Page 1',
        backgroundColor: '#f5f1ea',
        elements: [
            r(90, 400, 900, 1120, { bg: '#ffffff', radius: 8 }),
            r(90, 400, 12, 1120, { bg: '#a16207' }),
            t('“Simplicity is the ultimate sophistication.”', 190, 700, 700, 420, 76, { color: '#1c1917', font: 'serif', italic: true, align: 'left' }),
            t('— LEONARDO DA VINCI', 190, 1220, 700, 60, 34, { color: '#a16207', align: 'left', letterSpacing: 6 }),
        ],
    }],
);

// ─── Video / presentation ───────────────────────────────────

export const youtubeTutorial = makeDesign(
    'design-youtube-tutorial', 'Tutorial Thumbnail', 'Split-layout coding tutorial thumbnail',
    ['youtube', 'thumbnail', 'video', 'tutorial'], 21,
    { width: 1280, height: 720 },
    [{
        name: 'Page 1',
        backgroundColor: '#0f172a',
        elements: [
            r(760, 0, 520, 720, { bg: '#1e293b' }),
            t('Screenshot / face here', 800, 320, 440, 80, 28, { color: '#64748b', italic: true }),
            t('BUILD A', 60, 140, 660, 110, 72, { color: '#38bdf8', bold: true, align: 'left' }),
            t('DESIGN TOOL', 60, 260, 680, 230, 100, { color: '#ffffff', bold: true, align: 'left' }),
            r(60, 520, 300, 80, { bg: '#38bdf8', radius: 12 }),
            t('FULL COURSE', 60, 520, 300, 80, 34, { color: '#0f172a', bold: true }),
            t('4 hours · beginner friendly', 400, 535, 340, 50, 28, { color: '#94a3b8', align: 'left' }),
        ],
    }],
);

export const presTitle = makeDesign(
    'design-pres-title', 'Deck Title Slide', 'Bold 16:9 opening slide',
    ['presentation', 'slide', 'title', 'deck'], 22,
    { width: 1920, height: 1080 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#134e4a', '#0f766e'), gradientDirection: 120,
        elements: [
            circle(1560, -160, 600, { bg: '#5eead4', opacity: 18 }),
            circle(-200, 780, 560, { bg: '#5eead4', opacity: 14 }),
            r(160, 300, 160, 10, { bg: '#5eead4', radius: 5 }),
            t('Quarterly Review', 160, 360, 1400, 220, 130, { color: '#ffffff', bold: true, align: 'left' }),
            t('Growth, learnings, and the road to Q4', 160, 620, 1300, 90, 52, { color: '#99f6e4', align: 'left' }),
            t('Oct 2026 · Product Team', 160, 880, 900, 60, 36, { color: '#5eead4', align: 'left' }),
        ],
    }],
);

export const presSection = makeDesign(
    'design-pres-section', 'Deck Section Break', 'Numbered section divider slide',
    ['presentation', 'slide', 'section', 'deck'], 23,
    { width: 1920, height: 1080 },
    [{
        name: 'Page 1',
        backgroundColor: '#fafaf9',
        elements: [
            r(0, 0, 640, 1080, { bg: '#1c1917' }),
            t('02', 80, 360, 480, 360, 280, { color: '#fbbf24', bold: true }),
            t('What we learned', 760, 420, 1020, 160, 96, { color: '#1c1917', bold: true, align: 'left' }),
            r(760, 620, 200, 8, { bg: '#fbbf24', radius: 4 }),
            t('Three experiments, one big surprise', 760, 680, 1000, 80, 44, { color: '#78716c', align: 'left' }),
        ],
    }],
);

// ─── Banners ────────────────────────────────────────────────

export const linkedinBanner = makeDesign(
    'design-linkedin-banner', 'Webinar Banner', 'Wide banner for webinar or livestream promo',
    ['linkedin', 'banner', 'webinar', 'social'], 24,
    { width: 1600, height: 900 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#1e3a8a', '#3730a3'), gradientDirection: 110,
        elements: [
            circle(1280, 560, 520, { bg: '#818cf8', opacity: 22 }),
            t('FREE LIVE WEBINAR', 100, 150, 700, 60, 34, { color: '#a5b4fc', letterSpacing: 10, align: 'left' }),
            t('Scaling design systems\nwithout the chaos', 100, 240, 1000, 300, 76, { color: '#ffffff', bold: true, align: 'left' }),
            t('Thu, Sep 3 · 7 PM IST · with Q&A', 100, 590, 900, 70, 40, { color: '#c7d2fe', align: 'left' }),
            r(100, 700, 340, 100, { bg: '#facc15', radius: 50 }),
            t('Save my seat', 100, 700, 340, 100, 38, { color: '#1e3a8a', bold: true }),
        ],
    }],
);

// ─── Print ──────────────────────────────────────────────────

export const posterMotivation = makeDesign(
    'design-poster-motivation', 'Type Poster', 'A4 typographic statement poster',
    ['poster', 'print', 'typography', 'a4'], 25,
    { width: 2480, height: 3508 },
    [{
        name: 'Page 1',
        backgroundColor: '#111827',
        elements: [
            t('MAKE', 240, 500, 2000, 500, 380, { color: '#ffffff', bold: true, align: 'left' }),
            t('GOOD', 240, 1000, 2000, 500, 380, { color: '#ffffff', bold: true, align: 'left' }),
            t('THINGS', 240, 1500, 2000, 500, 380, { color: '#f59e0b', bold: true, align: 'left' }),
            r(240, 2150, 400, 20, { bg: '#f59e0b' }),
            t('then make them better', 240, 2300, 2000, 140, 90, { color: '#9ca3af', italic: true, align: 'left', font: 'serif' }),
            t('STUDIO ANTHEM · PRINT NO. 04', 240, 3200, 2000, 80, 52, { color: '#4b5563', align: 'left', letterSpacing: 16 }),
        ],
    }],
);

export const posterWorkshop = makeDesign(
    'design-poster-workshop', 'Workshop Poster', 'A4 poster for classes and workshops',
    ['poster', 'print', 'workshop', 'class', 'a4'], 26,
    { width: 2480, height: 3508 },
    [{
        name: 'Page 1',
        backgroundColor: '#fef9c3',
        elements: [
            r(160, 160, 2160, 3188, { bg: 'transparent', stroke: '#854d0e', strokeWidth: 6 }),
            t('HANDS-ON WORKSHOP', 340, 420, 1800, 100, 70, { color: '#854d0e', letterSpacing: 20 }),
            t('Watercolor\nBasics', 340, 620, 1800, 800, 260, { color: '#1c1917', bold: true, font: 'serif' }),
            circle(1830, 1560, 460, { bg: '#f59e0b' }),
            t('ONLY\n12 SEATS', 1830, 1660, 460, 260, 80, { color: '#451a03', bold: true }),
            t('Every Saturday in September\n10 AM – 1 PM · Atelier 9, Bandra', 340, 2280, 1800, 300, 84, { color: '#57534e' }),
            r(840, 2800, 800, 180, { bg: '#1c1917', radius: 90 }),
            t('atelier9.in/workshop', 840, 2800, 800, 180, 64, { color: '#fef9c3' }),
        ],
    }],
);

export const flyerMenu = makeDesign(
    'design-flyer-menu', 'Café Menu', 'A5 single-page café menu',
    ['flyer', 'menu', 'print', 'restaurant', 'a5'], 27,
    { width: 1748, height: 2480 },
    [{
        name: 'Page 1',
        backgroundColor: '#1c1917',
        elements: [
            t('THE DAILY GRIND', 174, 200, 1400, 110, 84, { color: '#fbbf24', bold: true, letterSpacing: 10 }),
            t('EST. 2019 · COFFEE & BAKES', 174, 330, 1400, 60, 36, { color: '#a8a29e', letterSpacing: 8 }),
            r(774, 440, 200, 4, { bg: '#fbbf24' }),
            t('ESPRESSO', 174, 560, 1000, 70, 52, { color: '#fafaf9', bold: true, align: 'left' }),
            t('₹140', 1374, 560, 200, 70, 52, { color: '#fbbf24', align: 'right' }),
            t('CAPPUCCINO', 174, 700, 1000, 70, 52, { color: '#fafaf9', bold: true, align: 'left' }),
            t('₹190', 1374, 700, 200, 70, 52, { color: '#fbbf24', align: 'right' }),
            t('POUR OVER', 174, 840, 1000, 70, 52, { color: '#fafaf9', bold: true, align: 'left' }),
            t('₹220', 1374, 840, 200, 70, 52, { color: '#fbbf24', align: 'right' }),
            r(174, 1000, 1400, 3, { bg: '#44403c' }),
            t('ALMOND CROISSANT', 174, 1100, 1000, 70, 52, { color: '#fafaf9', bold: true, align: 'left' }),
            t('₹180', 1374, 1100, 200, 70, 52, { color: '#fbbf24', align: 'right' }),
            t('BANANA BREAD', 174, 1240, 1000, 70, 52, { color: '#fafaf9', bold: true, align: 'left' }),
            t('₹160', 1374, 1240, 200, 70, 52, { color: '#fbbf24', align: 'right' }),
            t('SOURDOUGH TOAST', 174, 1380, 1000, 70, 52, { color: '#fafaf9', bold: true, align: 'left' }),
            t('₹210', 1374, 1380, 200, 70, 52, { color: '#fbbf24', align: 'right' }),
            t('wifi on the house · open 7 AM – 9 PM', 174, 2200, 1400, 70, 44, { color: '#a8a29e', italic: true }),
        ],
    }],
);

export const flyerOpenHouse = makeDesign(
    'design-flyer-openhouse', 'Open House Flyer', 'A5 real-estate open house flyer',
    ['flyer', 'print', 'real estate', 'open house', 'a5'], 28,
    { width: 1748, height: 2480 },
    [{
        name: 'Page 1',
        backgroundColor: '#f8fafc',
        elements: [
            r(0, 0, 1748, 1100, { bg: '#e2e8f0' }),
            t('Drop a property photo here', 474, 500, 800, 80, 40, { color: '#94a3b8', italic: true }),
            r(0, 1100, 1748, 16, { bg: '#0d9488' }),
            t('OPEN HOUSE', 174, 1220, 1400, 90, 64, { color: '#0d9488', bold: true, letterSpacing: 14 }),
            t('3BHK Garden Apartment', 174, 1360, 1400, 130, 88, { color: '#0f172a', bold: true }),
            t('1,850 sq ft · 2 baths · covered parking', 174, 1540, 1400, 70, 44, { color: '#475569' }),
            t('SUNDAY 11 AM – 4 PM', 174, 1780, 1400, 90, 60, { color: '#0f172a', bold: true }),
            t('14 Palm Grove Lane, Pune', 174, 1900, 1400, 70, 44, { color: '#475569' }),
            r(474, 2120, 800, 140, { bg: '#0d9488', radius: 70 }),
            t('Call 98220 44556', 474, 2120, 800, 140, 52, { color: '#ffffff', bold: true }),
        ],
    }],
);

export const cardThankYou = makeDesign(
    'design-card-thankyou', 'Thank You Card', 'Warm portrait thank-you card',
    ['card', 'thank you', 'print'], 29,
    { width: 1080, height: 1350 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#fda4af', '#fb7185'), gradientDirection: 150,
        elements: [
            r(80, 80, 920, 1190, { bg: '#fff1f2', radius: 24 }),
            t('thank', 140, 380, 800, 260, 190, { color: '#e11d48', font: 'caveat' }),
            t('you', 140, 610, 800, 260, 190, { color: '#e11d48', font: 'caveat' }),
            r(440, 920, 200, 4, { bg: '#fda4af' }),
            t('for celebrating with us', 140, 970, 800, 70, 40, { color: '#9f1239', italic: true }),
        ],
    }],
);

export const businessCardLight = makeDesign(
    'design-business-card-light', 'Business Card (Light)', 'Minimal light business card with accent corner',
    ['business card', 'print', 'card', 'minimal'], 30,
    { width: 1050, height: 600 },
    [
        {
            name: 'Front',
            backgroundColor: '#ffffff',
            elements: [
                circle(880, -120, 400, { bg: '#fbbf24' }),
                t('KABIR RAO', 80, 250, 700, 80, 56, { color: '#111827', bold: true, align: 'left', letterSpacing: 6 }),
                t('Brand Photographer', 80, 340, 700, 50, 30, { color: '#6b7280', align: 'left', letterSpacing: 2 }),
            ],
        },
        {
            name: 'Back',
            backgroundColor: '#111827',
            elements: [
                circle(-140, 380, 400, { bg: '#fbbf24' }),
                t('kabir@frames.studio', 250, 200, 700, 55, 32, { color: '#f9fafb', align: 'left' }),
                t('+91 98111 22334', 250, 270, 700, 55, 32, { color: '#f9fafb', align: 'left' }),
                t('@kabirframes', 250, 340, 700, 55, 32, { color: '#fbbf24', align: 'left' }),
            ],
        },
    ],
);

export const priceList = makeDesign(
    'design-price-list', 'Price List', 'Portrait services price list',
    ['price list', 'services', 'salon', 'print'], 31,
    { width: 1080, height: 1350 },
    [{
        name: 'Page 1',
        backgroundColor: '#fdf2f8',
        elements: [
            t('GLOW STUDIO', 90, 120, 900, 80, 54, { color: '#9d174d', bold: true, letterSpacing: 12 }),
            t('PRICE LIST', 90, 220, 900, 50, 30, { color: '#be185d', letterSpacing: 18 }),
            r(440, 300, 200, 4, { bg: '#ec4899' }),
            t('Classic Facial', 140, 400, 600, 60, 40, { color: '#500724', align: 'left' }),
            t('₹1,200', 740, 400, 200, 60, 40, { color: '#9d174d', bold: true, align: 'right' }),
            t('Hair Spa', 140, 510, 600, 60, 40, { color: '#500724', align: 'left' }),
            t('₹950', 740, 510, 200, 60, 40, { color: '#9d174d', bold: true, align: 'right' }),
            t('Manicure + Pedicure', 140, 620, 600, 60, 40, { color: '#500724', align: 'left' }),
            t('₹1,500', 740, 620, 200, 60, 40, { color: '#9d174d', bold: true, align: 'right' }),
            t('Bridal Package', 140, 730, 600, 60, 40, { color: '#500724', align: 'left' }),
            t('₹8,000', 740, 730, 200, 60, 40, { color: '#9d174d', bold: true, align: 'right' }),
            r(140, 850, 800, 3, { bg: '#f9a8d4' }),
            r(240, 1050, 600, 120, { bg: '#9d174d', radius: 60 }),
            t('Book: 98200 77889', 240, 1050, 600, 120, 42, { color: '#fdf2f8', bold: true }),
        ],
    }],
);

export const giftVoucher = makeDesign(
    'design-gift-voucher', 'Gift Voucher', 'Landscape gift certificate with dashed edge',
    ['gift', 'voucher', 'certificate', 'print'], 32,
    { width: 1600, height: 900 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#064e3b', '#065f46'), gradientDirection: 120,
        elements: [
            r(60, 60, 1480, 780, { bg: 'transparent', stroke: '#6ee7b7', strokeWidth: 3 }),
            t('GIFT VOUCHER', 100, 180, 900, 90, 60, { color: '#6ee7b7', letterSpacing: 14, align: 'left' }),
            t('₹2,000', 100, 320, 900, 260, 180, { color: '#ffffff', bold: true, align: 'left' }),
            t('Valid on all products until 31 Dec 2026', 100, 640, 900, 60, 34, { color: '#a7f3d0', align: 'left' }),
            r(1100, 180, 380, 540, { bg: '#ecfdf5', radius: 16 }),
            t('TO', 1150, 240, 280, 50, 30, { color: '#065f46', bold: true, align: 'left' }),
            r(1150, 320, 280, 3, { bg: '#a7f3d0' }),
            t('FROM', 1150, 400, 280, 50, 30, { color: '#065f46', bold: true, align: 'left' }),
            r(1150, 480, 280, 3, { bg: '#a7f3d0' }),
            t('CODE', 1150, 560, 280, 50, 30, { color: '#065f46', bold: true, align: 'left' }),
            r(1150, 640, 280, 3, { bg: '#a7f3d0' }),
        ],
    }],
);

export const birthdayInvite = makeDesign(
    'design-birthday-invite', 'Birthday Invite', 'Playful kids birthday invitation',
    ['invitation', 'birthday', 'party', 'card'], 33,
    { width: 1080, height: 1350 },
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#fbcfe8', '#c7d2fe'), gradientDirection: 160,
        elements: [
            circle(120, 120, 140, { bg: '#facc15' }),
            circle(840, 200, 100, { bg: '#4ade80' }),
            circle(200, 1080, 110, { bg: '#f472b6' }),
            circle(860, 1120, 130, { bg: '#60a5fa' }),
            t("AARAV IS TURNING", 90, 350, 900, 70, 42, { color: '#6d28d9', letterSpacing: 8 }),
            t('6!', 240, 430, 600, 380, 300, { color: '#7c3aed', bold: true }),
            t('Join us for cake, games & chaos', 90, 860, 900, 70, 40, { color: '#5b21b6' }),
            r(240, 990, 600, 110, { bg: '#7c3aed', radius: 55 }),
            t('SUN, AUG 9 · 4 PM', 240, 990, 600, 110, 42, { color: '#ffffff', bold: true }),
            t('12 Lotus Lane · RSVP 98123 45678', 90, 1160, 900, 60, 32, { color: '#6d28d9' }),
        ],
    }],
);

export const packTemplates: DesignTemplate[] = [
    instaProduct, instaTips, instaTestimonial, instaHiring, instaPodcast, instaMinimalSale,
    storyCountdown, storyQuote,
    youtubeTutorial, presTitle, presSection,
    linkedinBanner,
    posterMotivation, posterWorkshop, flyerMenu, flyerOpenHouse,
    cardThankYou, businessCardLight, priceList, giftVoucher, birthdayInvite,
];
