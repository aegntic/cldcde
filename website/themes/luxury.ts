// Luxury Theme Configuration
// Gold Rush (Dark) & Silver Mist (Light) dual-mode theme

export const luxuryTheme = {
    name: 'luxury',

    // Dark Mode: Gold Rush
    dark: {
        // Backgrounds
        bg: {
            base: '#0A0A0A',      // Matte Black
            surface: '#121212',   // Rich Black
            elevated: '#1A1A1A',  // Charcoal
            overlay: 'rgba(0, 0, 0, 0.8)',
        },

        // Primary Colors
        primary: {
            main: '#D4AF37',      // Champagne Gold
            hover: '#E5C158',     // Bright Gold
            dim: 'rgba(212, 175, 55, 0.1)',
            glow: 'rgba(212, 175, 55, 0.4)',
        },

        // Secondary Colors
        secondary: {
            main: '#B76E79',      // Rose Gold
            hover: '#C98A94',
            dim: 'rgba(183, 110, 121, 0.1)',
        },

        // Tertiary / Accent
        accent: {
            main: '#FFFDD0',      // Cream
            subtle: '#F5F5DC',
        },

        // Text
        text: {
            primary: '#F5F5F5',   // Pearl White
            secondary: '#9A9A9A', // Warm Gray
            muted: '#6A6A6A',
            inverse: '#0A0A0A',
        },

        // Borders
        border: {
            default: '#2D2D23',   // Dark Gold tint
            subtle: '#1F1F1A',
            accent: 'rgba(212, 175, 55, 0.3)',
        },

        // Effects
        effects: {
            gradient: 'linear-gradient(135deg, #D4AF37 0%, #FFFDD0 50%, #D4AF37 100%)',
            glow: '0 0 20px rgba(212, 175, 55, 0.3)',
            emboss: '1px 1px 2px rgba(0,0,0,0.5), 0 0 10px rgba(212, 175, 55, 0.3)',
        },
    },

    // Light Mode: Silver Mist
    light: {
        // Backgrounds
        bg: {
            base: '#FAFAFA',      // Pearl White
            surface: '#FFFFFF',   // Pure White
            elevated: '#F5F5F5',  // Light Gray
            overlay: 'rgba(255, 255, 255, 0.9)',
        },

        // Primary Colors
        primary: {
            main: '#71706E',      // Platinum (darker for contrast)
            hover: '#5C5B59',     // Darker on hover
            dim: 'rgba(168, 169, 173, 0.15)',
            glow: 'rgba(192, 192, 192, 0.5)',
        },

        // Secondary Colors
        secondary: {
            main: '#5C5C5C',      // Gunmetal
            hover: '#4A4A4A',
            dim: 'rgba(92, 92, 92, 0.1)',
        },

        // Tertiary / Accent
        accent: {
            main: '#E8F4F8',      // Ice Blue
            subtle: '#D0E8F0',
        },

        // Text
        text: {
            primary: '#1A1A1A',   // Charcoal
            secondary: '#6B6B6B', // Cool Gray
            muted: '#9B9B9B',
            inverse: '#FFFFFF',
        },

        // Borders
        border: {
            default: '#D4D4D4',   // Silver Edge
            subtle: '#E8E8E8',
            accent: 'rgba(168, 169, 173, 0.4)',
        },

        // Effects
        effects: {
            gradient: 'linear-gradient(135deg, #C0C0C0 0%, #FFFFFF 50%, #A8A9AD 100%)',
            glow: '0 0 20px rgba(192, 192, 192, 0.4)',
            emboss: '0 1px 2px rgba(0,0,0,0.1), 0 0 8px rgba(192, 192, 192, 0.2)',
        },
    },
} as const;

export type ThemeMode = 'dark' | 'light';
export type LuxuryTheme = typeof luxuryTheme;
