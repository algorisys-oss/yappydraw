/**
 * Greeting / card design family — the catalog had social/print designs but no
 * cards. These surface in both the Templates browser and the unified element
 * search feed (tags: card, greeting, + occasion). Same `makeDesign` style and
 * page-relative element positions as ./index and ./pack.
 */
import type { DesignTemplate } from '../../../types/template-types';
import { t, r, grad, circle, stops, makeDesign } from './helpers';

const CARD = { width: 1080, height: 1350 };

export const birthdayCard = makeDesign(
    'design-card-birthday', 'Birthday Card', 'Bright, festive happy-birthday card',
    ['birthday', 'card', 'greeting', 'celebrate', 'party', 'happy birthday'], 40,
    CARD,
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#ec4899', '#8b5cf6'), gradientDirection: 150,
        elements: [
            circle(120, 130, 90, { bg: '#facc15', opacity: 90 }),
            circle(840, 190, 120, { bg: '#38bdf8', opacity: 85 }),
            circle(760, 1050, 150, { bg: '#facc15', opacity: 80 }),
            circle(150, 1080, 110, { bg: '#34d399', opacity: 85 }),
            t('HAPPY', 90, 430, 900, 220, 170, { color: '#ffffff', bold: true }),
            t('BIRTHDAY', 90, 630, 900, 200, 150, { color: '#facc15', bold: true }),
            r(390, 860, 300, 8, { bg: '#ffffff', radius: 4, opacity: 80 }),
            t('Wishing you a wonderful day\nfilled with joy and cake 🎂', 140, 920, 800, 180, 46, { color: '#fce7f3' }),
        ],
    }],
);

export const thankYouCard = makeDesign(
    'design-card-thankyou', 'Thank You Card', 'Elegant minimal thank-you note',
    ['thank you', 'thanks', 'card', 'greeting', 'gratitude', 'appreciation'], 41,
    CARD,
    [{
        name: 'Page 1',
        backgroundColor: '#faf7f2',
        elements: [
            r(70, 70, 940, 1210, { bg: 'transparent', stroke: '#b45309', strokeWidth: 2 }),
            t('with', 140, 360, 800, 90, 56, { color: '#a8a29e', italic: true, font: 'serif' }),
            t('Thank You', 120, 450, 840, 260, 150, { color: '#78350f', italic: true, font: 'serif' }),
            r(440, 760, 200, 3, { bg: '#b45309' }),
            t('for your kindness and\nthoughtful generosity', 140, 830, 800, 180, 48, { color: '#57534e', font: 'serif' }),
            t('♥', 490, 1080, 100, 100, 80, { color: '#b45309' }),
        ],
    }],
);

export const congratsCard = makeDesign(
    'design-card-congrats', 'Congratulations Card', 'Bold congratulations / well-done card',
    ['congratulations', 'congrats', 'card', 'greeting', 'achievement', 'success', 'well done'], 42,
    CARD,
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#0f172a', '#1e3a8a'), gradientDirection: 160,
        elements: [
            circle(430, 210, 220, { bg: 'transparent', stroke: '#facc15', strokeWidth: 6 }),
            t('★', 470, 250, 140, 140, 120, { color: '#facc15' }),
            t('CONGRATS', 70, 560, 940, 180, 120, { color: '#ffffff', bold: true, letterSpacing: 6 }),
            r(390, 770, 300, 8, { bg: '#facc15', radius: 4 }),
            t('You did it! Here’s to your\nwell-deserved success.', 140, 840, 800, 180, 48, { color: '#cbd5e1' }),
        ],
    }],
);

export const partyInviteCard = makeDesign(
    'design-card-party-invite', 'Party Invitation', 'Fun party / event invitation card',
    ['invitation', 'invite', 'party', 'card', 'greeting', 'event', 'rsvp', 'celebrate'], 43,
    CARD,
    [{
        name: 'Page 1',
        fillStyle: 'linear', gradientStops: stops('#f97316', '#db2777'), gradientDirection: 135,
        elements: [
            circle(-80, -80, 320, { bg: '#ffffff', opacity: 12 }),
            circle(840, 1080, 380, { bg: '#ffffff', opacity: 12 }),
            t('YOU’RE INVITED', 90, 300, 900, 70, 40, { color: '#fde68a', letterSpacing: 12 }),
            t('LET’S', 90, 430, 900, 190, 150, { color: '#ffffff', bold: true }),
            t('PARTY', 90, 600, 900, 200, 170, { color: '#fde68a', bold: true }),
            r(340, 880, 400, 100, { bg: '#ffffff', radius: 50 }),
            t('SAT · 8 PM · 42 MAIN ST', 340, 880, 400, 100, 34, { color: '#db2777', bold: true }),
            t('RSVP 555-0142', 140, 1050, 800, 70, 40, { color: '#fff7ed' }),
        ],
    }],
);

export const anniversaryCard = makeDesign(
    'design-card-anniversary', 'Anniversary Card', 'Romantic happy-anniversary card',
    ['anniversary', 'card', 'greeting', 'love', 'celebrate', 'couple'], 44,
    CARD,
    [{
        name: 'Page 1',
        backgroundColor: '#1c1210',
        elements: [
            grad(0, 0, 1080, 1350, stops('#4c1d1d', '#1c1210'), 160),
            circle(490, 250, 200, { bg: 'transparent', stroke: '#f59e0b', strokeWidth: 3 }),
            t('♥', 505, 290, 170, 130, 110, { color: '#f59e0b' }),
            t('Happy', 120, 560, 840, 180, 120, { color: '#fde68a', italic: true, font: 'serif' }),
            t('Anniversary', 100, 700, 880, 200, 120, { color: '#ffffff', italic: true, font: 'serif' }),
            r(440, 940, 200, 3, { bg: '#f59e0b' }),
            t('to many more years together', 140, 1010, 800, 90, 46, { color: '#d6bfa6', font: 'serif', italic: true }),
        ],
    }],
);

export const newBabyCard = makeDesign(
    'design-card-baby', 'New Baby Card', 'Soft welcome / baby-shower card',
    ['baby', 'new baby', 'card', 'greeting', 'congratulations', 'shower', 'newborn'], 45,
    CARD,
    [{
        name: 'Page 1',
        backgroundColor: '#eff6ff',
        elements: [
            circle(120, 150, 130, { bg: '#bfdbfe', opacity: 70 }),
            circle(820, 220, 100, { bg: '#fbcfe8', opacity: 70 }),
            circle(760, 1080, 150, { bg: '#bbf7d0', opacity: 70 }),
            t('WELCOME', 90, 470, 900, 90, 56, { color: '#60a5fa', letterSpacing: 14 }),
            t('Little One', 100, 570, 880, 220, 140, { color: '#1e3a8a', italic: true, font: 'serif' }),
            r(440, 830, 200, 4, { bg: '#93c5fd' }),
            t('so much love and joy\nfor the newest arrival', 140, 900, 800, 170, 46, { color: '#475569', font: 'serif' }),
        ],
    }],
);

export const cardTemplates: DesignTemplate[] = [
    birthdayCard, thankYouCard, congratsCard, partyInviteCard, anniversaryCard, newBabyCard,
];
