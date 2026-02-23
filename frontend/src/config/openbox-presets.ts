/**
 * Predefined openBox presets for quick styling.
 * Each preset configures appearance, lid style, and animation settings.
 */

import type { DrawingElement } from '../types';

export interface OpenBoxPreset {
    id: string;
    name: string;
    category: 'presentation' | 'product' | 'fantasy' | 'playful';
    description: string;
    settings: Partial<DrawingElement>;
}

export const OPENBOX_PRESETS: OpenBoxPreset[] = [
    // ===== PRESENTATION =====
    {
        id: 'theatreReveal',
        name: 'Theatre Reveal',
        category: 'presentation',
        description: 'Dramatic presentation reveal with dark elegance',
        settings: {
            lidStyle: 'single',
            lidPosition: 'front',
            backgroundColor: '#1a1a2e',
            lidColor: '#16213e',
            strokeColor: '#d4af37',
            lidStrokeColor: '#d4af37',
            depth: 60,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'fadeIn',
            openAnimationDuration: 800,
            restoreAfterReveal: false
        }
    },
    {
        id: 'mysteryBox',
        name: 'Mystery Box',
        category: 'presentation',
        description: 'Surprise reveal with dramatic quad opening',
        settings: {
            lidStyle: 'quad',
            lidPosition: 'back',
            backgroundColor: '#2d1b4e',
            lidColor: '#4a2c7d',
            strokeColor: '#9b59b6',
            lidStrokeColor: '#8e44ad',
            depth: 50,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'pop',
            openAnimationDuration: 600,
            restoreAfterReveal: false
        }
    },
    {
        id: 'magicBox',
        name: 'Magic Box',
        category: 'presentation',
        description: 'Magician\'s prop with double lid reveal',
        settings: {
            lidStyle: 'double',
            lidPosition: 'front',
            backgroundColor: '#1a1a1a',
            lidColor: '#2d2d2d',
            strokeColor: '#c0392b',
            lidStrokeColor: '#e74c3c',
            depth: 55,
            viewAngle: 40,
            enableClickToOpen: true,
            revealAnimationType: 'scaleUp',
            openAnimationDuration: 700,
            restoreAfterReveal: true
        }
    },

    // ===== PRODUCT =====
    {
        id: 'shoppingBox',
        name: 'Shopping Box',
        category: 'product',
        description: 'E-commerce product reveal, clean cardboard style',
        settings: {
            lidStyle: 'single',
            lidPosition: 'back',
            backgroundColor: '#d4a574',
            lidColor: '#c9956c',
            strokeColor: '#8b6914',
            lidStrokeColor: '#8b6914',
            depth: 50,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'slideUp',
            openAnimationDuration: 500,
            restoreAfterReveal: false
        }
    },
    {
        id: 'unboxing',
        name: 'Unboxing',
        category: 'product',
        description: 'Tech product unboxing with flaps',
        settings: {
            lidStyle: 'flaps',
            lidPosition: 'front',
            backgroundColor: '#ffffff',
            lidColor: '#f5f5f5',
            strokeColor: '#cccccc',
            lidStrokeColor: '#999999',
            depth: 45,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'scaleUp',
            openAnimationDuration: 600,
            restoreAfterReveal: false
        }
    },
    {
        id: 'premiumPackage',
        name: 'Premium Package',
        category: 'product',
        description: 'Luxury product packaging with gold accents',
        settings: {
            lidStyle: 'single',
            lidPosition: 'back',
            backgroundColor: '#2c3e50',
            lidColor: '#34495e',
            strokeColor: '#f1c40f',
            lidStrokeColor: '#f39c12',
            depth: 55,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'fadeIn',
            openAnimationDuration: 700,
            restoreAfterReveal: false
        }
    },

    // ===== FANTASY =====
    {
        id: 'treasureChest',
        name: 'Treasure Chest',
        category: 'fantasy',
        description: 'Classic pirate treasure chest',
        settings: {
            lidStyle: 'single',
            lidPosition: 'back',
            backgroundColor: '#8b4513',
            lidColor: '#a0522d',
            strokeColor: '#daa520',
            lidStrokeColor: '#ffd700',
            depth: 60,
            viewAngle: 40,
            enableClickToOpen: true,
            revealAnimationType: 'scaleUp',
            openAnimationDuration: 800,
            restoreAfterReveal: false
        }
    },
    {
        id: 'enchantedBox',
        name: 'Enchanted Box',
        category: 'fantasy',
        description: 'Magical glowing box with mystical feel',
        settings: {
            lidStyle: 'split',
            lidPosition: 'front',
            backgroundColor: '#1a237e',
            lidColor: '#283593',
            strokeColor: '#00bcd4',
            lidStrokeColor: '#4dd0e1',
            depth: 50,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'pop',
            openAnimationDuration: 600,
            restoreAfterReveal: true
        }
    },
    {
        id: 'ancientArk',
        name: 'Ancient Ark',
        category: 'fantasy',
        description: 'Ancient artifact container with aged look',
        settings: {
            lidStyle: 'single',
            lidPosition: 'back',
            backgroundColor: '#5d4037',
            lidColor: '#6d4c41',
            strokeColor: '#bcaaa4',
            lidStrokeColor: '#8d6e63',
            depth: 65,
            viewAngle: 35,
            enableClickToOpen: true,
            revealAnimationType: 'fadeIn',
            openAnimationDuration: 1000,
            restoreAfterReveal: false
        }
    },

    // ===== PLAYFUL =====
    {
        id: 'giftBox',
        name: 'Gift Box',
        category: 'playful',
        description: 'Festive gift with split bow-style lid',
        settings: {
            lidStyle: 'split',
            lidPosition: 'back',
            backgroundColor: '#e74c3c',
            lidColor: '#c0392b',
            strokeColor: '#f1c40f',
            lidStrokeColor: '#f39c12',
            depth: 50,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'pop',
            openAnimationDuration: 500,
            restoreAfterReveal: true
        }
    },
    {
        id: 'toyBox',
        name: 'Toy Box',
        category: 'playful',
        description: 'Colorful kids toy box',
        settings: {
            lidStyle: 'single',
            lidPosition: 'back',
            backgroundColor: '#3498db',
            lidColor: '#2980b9',
            strokeColor: '#e74c3c',
            lidStrokeColor: '#c0392b',
            depth: 55,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'scaleUp',
            openAnimationDuration: 400,
            restoreAfterReveal: false
        }
    },
    {
        id: 'partyBox',
        name: 'Party Box',
        category: 'playful',
        description: 'Celebration box with quad flap opening',
        settings: {
            lidStyle: 'quad',
            lidPosition: 'front',
            backgroundColor: '#9b59b6',
            lidColor: '#8e44ad',
            strokeColor: '#f1c40f',
            lidStrokeColor: '#f39c12',
            depth: 45,
            viewAngle: 50,
            enableClickToOpen: true,
            revealAnimationType: 'pop',
            openAnimationDuration: 400,
            restoreAfterReveal: true
        }
    },
    {
        id: 'surpriseBox',
        name: 'Surprise Box',
        category: 'playful',
        description: 'Bright surprise reveal with bouncy animation',
        settings: {
            lidStyle: 'flaps',
            lidPosition: 'back',
            backgroundColor: '#2ecc71',
            lidColor: '#27ae60',
            strokeColor: '#e74c3c',
            lidStrokeColor: '#c0392b',
            depth: 50,
            viewAngle: 45,
            enableClickToOpen: true,
            revealAnimationType: 'pop',
            openAnimationDuration: 350,
            restoreAfterReveal: true
        }
    }
];

/**
 * Get openBox preset by ID
 */
export function getOpenBoxPreset(id: string): OpenBoxPreset | undefined {
    return OPENBOX_PRESETS.find(p => p.id === id);
}

/**
 * Get all presets in a category
 */
export function getOpenBoxPresetsByCategory(category: OpenBoxPreset['category']): OpenBoxPreset[] {
    return OPENBOX_PRESETS.filter(p => p.category === category);
}

/**
 * Get all category names
 */
export function getOpenBoxCategories(): OpenBoxPreset['category'][] {
    return ['presentation', 'product', 'fantasy', 'playful'];
}
